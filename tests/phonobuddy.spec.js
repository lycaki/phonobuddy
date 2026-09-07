import { test, expect } from '@playwright/test';
import { chooseSessionItems, getBlockReadiness } from '../src/utils/year1Session.js';
import { YEAR1_WORDS } from '../src/data/year1Profile.js';

const mockCloud = `
  export function generateFamilyCode() { return 'TEST99'; }
  export async function uploadAttemptEvent(code, event) {
    window.uploads ||= [];
    window.uploads.push(event.eventId);
    if (window.cloudMode === 'fail') throw new Error('Offline');
    if (window.cloudMode === 'pending') await new Promise(() => {});
  }
  export async function downloadAttemptEvents(code) {
    if (typeof code !== 'string') throw new Error('Not a family code');
    if (window.pullFail) throw new Error('Progress unavailable');
    window.year1PullCode=code;
    return [];
  }
  export async function downloadAllRecordingEntries() {
    return { f: {blob:new Blob(['remote-newer']),updated:9999}, missing: {blob:new Blob(['remote']),updated:2} };
  }
  export async function uploadAllRecordings() { return 0; }
  export async function uploadRecording() { return {uploaded:true}; }
  export async function uploadProgress() {}
  export async function downloadProgress(code) {
    if (typeof code !== 'string') throw new Error('Not a family code');
    window.receptionPullCode=code;
    return null;
  }
`;

async function setup(page, { family = false, block = 0, mode = 'pending' } = {}) {
  await page.route(/firebaseio|firebasedatabase/, route => route.abort());
  await page.route('**/src/utils/cloudSync.js*', route => route.fulfill({ contentType: 'text/javascript', body: mockCloud }));
  await page.addInitScript(mode => {
    window.cloudMode = mode;
    window.audioMode = 'normal';
    window.audioStarts = 0;
    window.activeAudio = 0;
    window.maxAudio = 0;
    window.Audio = class {
      play() {
        window.audioStarts++;
        if (window.audioMode === 'blocked') return Promise.reject(new Error('NotAllowedError'));
        if (window.audioMode === 'hang') return new Promise(() => {});
        window.activeAudio++;
        window.maxAudio = Math.max(window.maxAudio, window.activeAudio);
        this.timer = setTimeout(() => { window.activeAudio--; this.onended?.(); }, 80);
        return Promise.resolve();
      }
      pause() { if (this.timer) { clearTimeout(this.timer); this.timer = null; window.activeAudio = Math.max(0, window.activeAudio - 1); } }
    };
  }, mode);
  await page.goto('./');
  await page.getByRole('button', { name: /Year 1 Dino/ }).waitFor();
  await page.evaluate(async ({ family, block }) => {
    const { db } = await import('/phonobuddy/src/utils/storage.js');
    const { YEAR1_WORDS, YEAR1_GPCS } = await import('/phonobuddy/src/data/year1Profile.js');
    const ids = new Set([...YEAR1_GPCS.flatMap(gpc => gpc.soundIds), ...YEAR1_WORDS.flatMap(word => word.parts.flatMap(part => part.soundIds))]);
    await db.recordings.bulkPut([...ids].map(phonemeId => ({phonemeId, blob:new Blob(['local-original']), timestamp:1})));
    await db.settings.put({key:'year1SelectedBlock', value:block});
    await db.settings.put({key:'readingHistory', value:{oldStory:{timesRead:3}}});
    await db.progress.put({id:'s', introduced:true, mastery:3, box:3, correct:7});
    if (family) await db.settings.put({key:'familyCode',value:'TEST99'});
  }, { family, block });
  await page.reload();
  await page.getByRole('button', { name: /Year 1 Dino/ }).waitFor();
}

async function start(page) {
  await page.getByRole('button', { name: /Year 1 Dino/ }).click();
  await page.getByRole('button', { name: /Build today/ }).click();
  await expect(page.locator('.mission-count')).toHaveText('1/6');
}

async function finishWord(page, doubleTap = false) {
  if (await page.locator('.magic-e-block').isVisible()) await page.locator('.magic-e-block').click();
  const pieces = page.locator('.sound-road-piece');
  for (let index = 0; index < await pieces.count(); index++) {
    await expect(pieces.nth(index)).toBeEnabled();
    if (doubleTap) await pieces.nth(index).evaluate(button => { button.click(); button.click(); });
    else await pieces.nth(index).click();
  }
  const yes = page.getByRole('button', { name: 'Yes', exact: false });
  await expect(yes).toBeEnabled();
  await yes.evaluate(button => { button.click(); button.click(); });
}

test('two full roads continue with pending cloud writes and rapid taps', async ({ page }) => {
  await setup(page, { family:true });
  await start(page);
  for (let session = 0; session < 2; session++) {
    for (let word = 1; word <= 6; word++) {
      await expect(page.locator('.mission-count')).toHaveText(`${word}/6`);
      await finishWord(page, true);
    }
    await expect(page.getByRole('heading', {name:'Road complete!'})).toBeVisible();
    if (!session) await page.getByRole('button', {name:'Build another road'}).click();
  }
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.attempts.count())).toBe(12);
  expect(await page.evaluate(() => window.maxAudio)).toBe(1);
  await page.getByRole('button', {name:'Read a story'}).click();
  await expect(page.getByRole('heading', {name:'Story shelf'})).toBeVisible();
});

test('offline events retry after reconnect and reload without duplicate attempts', async ({ page }) => {
  await setup(page, {family:true, mode:'fail'});
  await start(page);
  await finishWord(page);
  await expect(page.locator('.mission-count')).toHaveText('2/6');
  await page.evaluate(() => {window.cloudMode='ok'; window.dispatchEvent(new Event('online'));});
  await expect.poll(() => page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.where('key').startsWith('year1Synced:').count())).toBe(1);
  await page.reload();
  await page.getByRole('button', {name:/Year 1 Dino/}).waitFor();
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.attempts.count())).toBe(1);
  expect(await page.evaluate(() => window.uploads || [])).toEqual([]);
});

test('blocked audio, retry, skip, and stop cannot advance a later word', async ({ page }) => {
  await setup(page);
  await start(page);
  await page.evaluate(() => {window.audioMode='blocked';});
  const pieces = page.locator('.sound-road-piece');
  for (let i=0; i<await pieces.count(); i++) await pieces.nth(i).click();
  await expect(page.getByRole('status')).toContainText('Dad can say');
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(pieces.first()).toBeEnabled();
  await page.evaluate(() => {window.audioMode='hang';});
  await pieces.first().click();
  await page.getByRole('button', {name:/Skip word/}).click();
  await expect(page.locator('.mission-count')).toHaveText('2/6');
  await expect(pieces.first()).toBeEnabled();
  await page.evaluate(() => {window.audioMode='normal';});
  await finishWord(page);
  await page.getByRole('button',{name:/Stop/}).click();
  await page.getByRole('button',{name:/Build today/}).click();
  await page.waitForTimeout(1600);
  await expect(page.locator('.mission-count')).toHaveText('1/6');
});

test('a local save error is recoverable and does not claim success', async ({ page }) => {
  await setup(page);
  await start(page);
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    window.originalPut = db.attempts.put.bind(db.attempts);
    db.attempts.put = () => Promise.reject(new Error('QuotaExceededError'));
  });
  await finishWord(page);
  await expect(page.getByRole('status')).toContainText('could not be saved');
  await expect(page.locator('.mission-count')).toHaveText('1/6');
  await page.evaluate(async () => { (await import('/phonobuddy/src/utils/storage.js')).db.attempts.put = window.originalPut; });
  await page.getByRole('button',{name:/Yes/}).click();
  await expect(page.locator('.mission-count')).toHaveText('2/6');
});

test('sound readiness is per road; unrelated clips do not unlock it', async ({ page }) => {
  await setup(page);
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.recordings.delete('oo_long');
  });
  await page.reload();
  await start(page);
  await page.getByRole('button',{name:/Stop/}).click();
  await page.getByText('Parent controls & profile').click();
  await page.getByLabel('Practice point').selectOption('2');
  await expect(page.getByRole('button',{name:/Build today/})).toBeDisabled();
});

test('stories resume, complete, reread and retain old history and recordings', async ({ page }) => {
  await setup(page);
  await page.getByRole('button',{name:/Stories/}).first().click();
  await page.getByRole('button',{name:/A Frog in the Pond/}).click();
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.getByLabel('Story page 2',{exact:true})).toContainText('fish');
  await page.reload();
  await page.getByRole('button',{name:/Stories/}).first().click();
  await page.getByRole('button',{name:/Continue at page 2/}).click();
  await expect(page.getByLabel('Story page 2',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Hear fish',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText("Dad's turn: fish");
  await page.getByLabel("Dad's help",{exact:true}).uncheck();
  await expect(page.getByRole('button',{name:/Hear /})).toHaveCount(0);
  for (let i=2; i<6; i++) await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.locator('.story-question').getByText('Why did the frog get wet?')).toBeVisible();
  await page.getByRole('button',{name:'Finish story'}).click();
  await expect(page.getByRole('heading',{name:'Story finished'})).toBeVisible();
  await page.getByRole('button',{name:'Read again'}).click();
  await expect(page.getByLabel('Story page 1',{exact:true})).toBeVisible();
  const data = await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    return {old:await db.settings.get('readingHistory'), story:await db.settings.get('year1Story:y1-story-frog-pond'), clip:await (await db.recordings.get('f')).blob.text(), progress:await db.progress.get('s')};
  });
  expect(data.story.value.reads).toBe(1);
  expect(data.old.value.oldStory.timesRead).toBe(3);
  expect(data.clip).toBe('local-original');
  expect(data.progress.correct).toBe(7);
});

test('all 36 stories and long words fit mobile and tablet', async ({ page }, testInfo) => {
  await setup(page);
  await page.getByRole('button',{name:/Stories/}).first().click();
  for (let block=0; block<12; block++) {
    await page.getByLabel('Reading section').selectOption(String(block));
    await expect(page.locator('.story-entry')).toHaveCount(3);
  }
  for (const width of [375, 820, 1366]) {
    await page.setViewportSize({width,height:1024});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button',{name:/The School Play/}).click();
    await expect(page.getByLabel('Story page 1',{exact:true})).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`reader-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'Back to stories'}).click();
  }
});

test('recording downloads and backup merge never overwrite existing clips', async ({ page }) => {
  await setup(page,{family:true});
  await expect.poll(() => page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.recordings.get('missing').then(Boolean))).toBe(true);
  const result = await page.evaluate(async () => {
    const {db,addMissingRecording} = await import('/phonobuddy/src/utils/storage.js');
    const added = await addMissingRecording('f',new Blob(['backup-newer']),20000);
    return {added, blob:await (await db.recordings.get('f')).blob.text(),timestamp:(await db.recordings.get('f')).timestamp};
  });
  expect(result).toEqual({added:false,blob:'local-original',timestamp:1});
});

test('summer reviews later words and practice rotates after unique word count plateaus', () => {
  expect(chooseSessionItems(11,20,false).some(item=>item.block>0)).toBe(true);
  expect(chooseSessionItems(1,20,false)).not.toEqual(chooseSessionItems(1,26,false));
  expect(chooseSessionItems(2,0,false).some(item=>item.pseudo)).toBe(false);
  expect(chooseSessionItems(2,0,true).at(-1).pseudo).toBe(true);
});

test('manual level and batch controls work before finishing and survive reload', async ({page}) => {
  await setup(page);
  await start(page);
  const first = await page.locator('.mission-word').innerText();
  await page.getByRole('button',{name:'Next batch',exact:true}).click();
  await expect(page.locator('.mission-word')).not.toHaveText(first);
  await expect(page.locator('.mission-count')).toHaveText('1/6');
  await page.getByRole('button',{name:'Next section',exact:true}).click();
  await expect(page.getByLabel('Practice point')).toHaveValue('1');
  await page.getByRole('button',{name:/Build today/}).click();
  await page.getByLabel('Practice point').selectOption('5');
  await page.reload();
  await page.getByRole('button',{name:/Year 1 Dino/}).click();
  await expect(page.getByLabel('Practice point')).toHaveValue('5');
});

test('bulk cloud uploads preserve conflicting recordings, even with a newer local clock', async ({page}) => {
  await page.route(/firebaseio|firebasedatabase/,route=>route.abort());
  await page.route('**/src/utils/firebase.js*',route=>route.fulfill({contentType:'text/javascript',body:'export async function getFirebaseDb(){return {};}; export function isFirebaseConfigured(){return true;}'}));
  await page.route('**/node_modules/.vite/deps/firebase_database.js*',route=>route.fulfill({contentType:'text/javascript',body:`
    export function ref(db,path){return path;}
    export async function runTransaction(path,update){
      update(null);
      const next=update(window.remote[path] || null);
      if(next === undefined) return {committed:false};
      window.remote[path]=next;
      return {committed:true};
    }
  `}));
  await page.goto('./');
  const result = await page.evaluate(async()=>{
    const {uploadAllRecordings}=await import('/phonobuddy/src/utils/cloudSync.js');
    window.remote={'recordings/TEST99/f':{audio:'iPad-original',updated:5}};
    const count=await uploadAllRecordings('TEST99',async()=>['f','new'],async()=>new Blob(['local']),null,async()=>({blob:new Blob(['local-newer']),timestamp:99999}));
    return {count,original:window.remote['recordings/TEST99/f']};
  });
  expect(result).toEqual({count:1,original:{audio:'iPad-original',updated:5}});
});

test('auto progression requires two clean reads per section word, never skips or retries', async ({page}) => {
  const events = YEAR1_WORDS.filter(word=>word.block===0).flatMap(word=>[1,2].map(timestamp=>({itemId:word.id,itemType:'real',correct:true,retries:0,timestamp})));
  expect(getBlockReadiness(0,events).ready).toBe(true);
  expect(getBlockReadiness(0,events.slice(1)).ready).toBe(false);
  expect(getBlockReadiness(0,[...events,{itemId:'frog',itemType:'real',correct:true,retries:1,timestamp:3}]).ready).toBe(false);
  await setup(page);
  await page.evaluate(async events => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    const {YEAR1_PROFILE} = await import('/phonobuddy/src/data/year1Profile.js');
    await db.attempts.bulkPut(events.map((event,index)=>({...event,eventId:`seed-${index}`,profileId:YEAR1_PROFILE.id})));
  }, events);
  await page.reload();
  await page.getByRole('button',{name:/Year 1 Dino/}).click();
  await page.getByLabel('Auto next section',{exact:true}).check();
  await page.getByRole('button',{name:/Build today/}).click();
  for (let i=0;i<6;i++) await page.getByRole('button',{name:/Skip word/}).click();
  await expect(page.getByRole('heading',{name:'Road complete!'})).toBeVisible();
  await expect(page.getByLabel('Practice point')).toHaveValue('1');
  await page.waitForTimeout(300);
  await expect(page.getByLabel('Practice point')).toHaveValue('1');
});

test('Settings pulls both kinds of progress with a string family code', async ({page}) => {
  await setup(page,{family:true,mode:'ok'});
  await page.getByRole('button',{name:/Settings/}).first().click();
  await page.getByRole('button',{name:/Pull progress/}).click();
  await expect(page.getByRole('status')).toContainText('Reception and Year 1 progress synced');
  expect(await page.evaluate(()=>[window.receptionPullCode,window.year1PullCode])).toEqual(['TEST99','TEST99']);
  await page.evaluate(()=>{window.pullFail=true;});
  await page.getByRole('button',{name:/Pull progress/}).click();
  await expect(page.getByRole('status')).toContainText('Year 1 progress could not sync yet');
  await page.getByRole('button',{name:'Download missing recordings'}).click();
  await expect(page.getByText(/Downloaded \d+ recordings/)).toBeVisible();
});

test('Reception practice can skip the whole batch and still reach its summary', async ({page}) => {
  await setup(page);
  await page.getByRole('button',{name:'Parent view',exact:true}).click();
  await page.getByRole('button',{name:'Reception sound practice',exact:true}).click();
  for (let i=0; i<30 && await page.getByRole('button',{name:'Skip →',exact:true}).isVisible(); i++) {
    await page.getByRole('button',{name:'Skip →',exact:true}).click();
  }
  await expect(page.getByRole('button',{name:'Skip →',exact:true})).toHaveCount(0);
  await expect(page.getByText(/Session complete|Great effort|Well done/i).first()).toBeVisible();
});
