import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { SCHOOL_WORD_LISTS, SCHOOL_WORDS, selectSchoolBatch } from '../src/data/schoolWords.js';

async function setup(page) {
  await page.route(/firebaseio|firebasedatabase/, route => route.abort());
  await page.addInitScript(() => {
    window.spoken = [];
    window.audioStarts = 0;
    Object.defineProperty(window, 'speechSynthesis', {configurable:true, value:Object.assign(new EventTarget(), {
      getVoices:() => [{name:'Serena Enhanced', voiceURI:'serena', lang:'en-GB', localService:true}],
      cancel:() => {},
      speak:utterance => {window.spoken.push(utterance.text); setTimeout(() => utterance.onend?.(), 20);},
    })});
    window.SpeechSynthesisUtterance = class {constructor(text) {this.text = text;}};
    window.Audio = class {
      play() {window.audioStarts++; this.timer = setTimeout(() => this.onended?.(), 20); return Promise.resolve();}
      pause() {clearTimeout(this.timer);}
    };
  });
  await page.goto('./');
  await page.getByRole('button', {name:/Year 1 Dino/}).waitFor();
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.settings.put({key:'year1Story:y1-story-frog-pond',value:{page:2,reads:3}});
    await db.settings.put({key:'readingHistory',value:{sams_cat:{timesRead:2}}});
    await db.progress.put({id:'s',introduced:true,correct:7});
  });
}

async function words(page) {
  await page.getByRole('button', {name:/Words/}).first().click();
  await expect(page.getByRole('heading', {name:'Read and spell', exact:true})).toBeVisible();
  await expect(page.getByRole('button', {name:'Practise 5 words',exact:true})).toBeEnabled();
}

test('school photo lists retain exact counts, important spellings and unique batches', () => {
  expect(SCHOOL_WORD_LISTS.map(list => list.words.length)).toEqual([73,64,106]);
  expect(SCHOOL_WORDS).toHaveLength(227);
  expect(SCHOOL_WORD_LISTS[0].words).toEqual(expect.arrayContaining(['I','buses','asked','Mr','Mrs','sugar','friend','because']));
  expect(SCHOOL_WORD_LISTS[1].words).toEqual(expect.arrayContaining(['steak','hour','Christmas','everybody','even']));
  expect(SCHOOL_WORD_LISTS[2].words).toEqual(expect.arrayContaining(['actual','February','forwards','occasionally','although','woman','women']));
  expect(selectSchoolBatch(['one'], 12)).toEqual(['one']);
  expect(selectSchoolBatch(['one','two','three'], 2)).toEqual(['three','one','two']);
  expect(selectSchoolBatch([], 0)).toEqual([]);
});

test('reading and spelling ticks persist independently and shared words keep ticks between lists', async ({page}) => {
  await setup(page); await words(page);
  await page.getByLabel('Can read children', {exact:true}).check();
  await expect(page.getByLabel('Can spell children', {exact:true})).toBeEnabled();
  await expect(page.getByLabel('Can spell children', {exact:true})).not.toBeChecked();
  await page.getByLabel('Can spell children', {exact:true}).check();
  await expect(page.getByLabel('Can read children', {exact:true})).toBeEnabled();
  await page.getByLabel('School word list', {exact:true}).selectOption('y2');
  await expect(page.getByLabel('Can read children', {exact:true})).toBeChecked();
  await expect(page.getByLabel('Can spell children', {exact:true})).toBeChecked();
  await page.getByLabel('Can read children', {exact:true}).uncheck();
  await expect(page.getByLabel('Can read children', {exact:true})).toBeEnabled();
  await page.reload(); await words(page);
  await expect(page.getByLabel('School word list', {exact:true})).toHaveValue('r1');
  await expect(page.getByLabel('Can read children', {exact:true})).not.toBeChecked();
  await expect(page.getByLabel('Can spell children', {exact:true})).toBeChecked();
  const existing = await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    return {progress:(await db.progress.get('s')).correct, bookmark:(await db.settings.get('year1Story:y1-story-frog-pond')).value, old:(await db.settings.get('readingHistory')).value};
  });
  expect(existing).toEqual({progress:7,bookmark:{page:2,reads:3},old:{sams_cat:{timesRead:2}}});
});

test('two skipped batches and repeated one-word batches cannot stall or tick skipped words', async ({page}) => {
  await setup(page); await words(page);
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  for (let batch=0; batch<2; batch++) {
    for (let index=1; index<=5; index++) {
      await expect(page.getByText(`${index} / 5`, {exact:true})).toBeVisible();
      await page.getByRole('button', {name:'Skip word',exact:true}).click();
    }
    await expect(page.getByRole('heading', {name:'Batch complete',exact:true})).toBeVisible();
    if (!batch) await page.getByRole('button', {name:'Next batch',exact:true}).click();
  }
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.where('key').startsWith('schoolWord:').count())).toBe(0);
  await page.getByRole('button', {name:'Checklist',exact:true}).click();
  await page.getByLabel('Find a word', {exact:true}).fill('buses');
  await page.getByRole('button', {name:'Practise 1 word',exact:true}).click();
  for (let index=0; index<2; index++) {
    await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('buses');
    await page.getByRole('button', {name:'Skip word',exact:true}).click();
    await page.getByRole('button', {name:'Next batch',exact:true}).click();
  }
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('buses');
});

test('spelling covers the answer, keeps read ticks separate and supports manual advance', async ({page}) => {
  await setup(page); await words(page);
  await page.getByRole('button', {name:'Spell',exact:true}).click();
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  await page.getByLabel('Next word automatically', {exact:true}).uncheck();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('I');
  await page.getByRole('button', {name:'Cover word',exact:true}).click();
  await expect(page.getByLabel('Word covered', {exact:true})).toBeVisible();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveCount(0);
  await page.getByLabel('Your spelling', {exact:true}).fill('I');
  await page.getByRole('button', {name:'Check word',exact:true}).click();
  await page.getByRole('button', {name:'Spelled it',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  await expect(page.getByText('1 / 5', {exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Next word',exact:true}).click();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('the');
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.get('schoolWord:i')))
    .toMatchObject({value:{spell:true}});
});

test('a failed school tick rolls back and does not advance the batch', async ({page}) => {
  await setup(page); await words(page);
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    window.originalPut = db.settings.put.bind(db.settings);
    db.settings.put = entry => entry.key.startsWith('schoolWord:') ? Promise.reject(new Error('QuotaExceededError')) : window.originalPut(entry);
  });
  await page.getByRole('button', {name:'Read it',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('I');
  await page.evaluate(async () => { (await import('/phonobuddy/src/utils/storage.js')).db.settings.put = window.originalPut; });
  await page.getByRole('button', {name:'Read it',exact:true}).evaluate(button => {button.click(); button.click();});
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('the');
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.where('key').startsWith('schoolWord:').count())).toBe(1);
});

test('school batch position and manual-next preference survive a reload', async ({page}) => {
  await setup(page); await words(page);
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('I');
  await page.getByLabel('Next word automatically', {exact:true}).uncheck();
  await expect(page.getByLabel('Next word automatically', {exact:true})).toBeEnabled();
  await page.reload(); await words(page);
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('is');
  await expect(page.getByLabel('Next word automatically', {exact:true})).not.toBeChecked();
  await page.getByRole('button', {name:'Next batch',exact:true}).click();
  await expect(page.getByLabel('Practice word', {exact:true})).toHaveText('as');
  await expect(page.getByLabel('Next word automatically', {exact:true})).not.toBeChecked();
});

test('failed reading-log saves retain the draft and retry once', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:'Reading record',exact:true}).click();
  await page.getByRole('button', {name:'Add a read',exact:true}).click();
  await page.getByLabel('Book or text title', {exact:true}).fill('A poem from school');
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    window.originalPut = db.settings.put.bind(db.settings);
    db.settings.put = entry => entry.key.startsWith('homeReading:') ? Promise.reject(new Error('QuotaExceededError')) : window.originalPut(entry);
  });
  await page.getByRole('button', {name:'Save reading entry',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByLabel('Book or text title', {exact:true})).toHaveValue('A poem from school');
  await expect(page.locator('.home-reading-entry')).toHaveCount(0);
  await page.evaluate(async () => { (await import('/phonobuddy/src/utils/storage.js')).db.settings.put = window.originalPut; });
  await page.getByRole('button', {name:'Save reading entry',exact:true}).click();
  await expect(page.locator('.home-reading-entry')).toHaveCount(1);
});

test('progress backups include school ticks, batch choices and home reading entries', async ({page}) => {
  await setup(page);
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.settings.bulkPut([
      {key:'schoolWord:children',value:{read:true,spell:false}},
      {key:'schoolAutoNext',value:false},
      {key:'schoolBatchOffsets',value:{'r1:read:all:':5}},
      {key:'homeReading:test',value:{id:'test',date:'2026-09-10',title:'Our book',minutes:10,how:'Together',notes:'Enjoyed it',updated:'2026-09-10'}},
    ]);
  });
  await page.getByRole('button', {name:/Settings/}).first().click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name:/Backup Progress/}).click();
  const download = await pending;
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
  expect(backup.settings).toEqual(expect.arrayContaining([
    {key:'schoolWord:children',value:{read:true,spell:false}},
    {key:'schoolAutoNext',value:false},
    {key:'schoolBatchOffsets',value:{'r1:read:all:':5}},
    expect.objectContaining({key:'homeReading:test'}),
  ]));
  expect(backup.settings.some(row => row.key === 'familyCode')).toBe(false);
  expect(backup.progress).toEqual(expect.arrayContaining([expect.objectContaining({id:'s',correct:7})]));
});

test('new words reuse case-variant recordings without changing bytes', async ({page}, testInfo) => {
  test.skip(testInfo.project.name === 'webkit', 'Windows WebKit recording Blob storage is unavailable.');
  await setup(page);
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.recordings.put({phonemeId:'word:i',blob:new Blob(['dad-original-I']),timestamp:7});
  });
  await words(page);
  await page.getByRole('button', {name:'Practise 5 words',exact:true}).click();
  await page.getByRole('button', {name:'Hear word',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.audioStarts)).toBe(1);
  expect(await page.evaluate(() => window.spoken)).toEqual([]);
  await page.getByRole('button', {name:'Next word',exact:true}).click();
  await page.getByRole('button', {name:'Hear word',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken)).toEqual(['the']);
  expect(await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    const clip = await db.recordings.get('word:i');
    return [await clip.blob.text(),clip.timestamp,await db.recordings.count()];
  })).toEqual(['dad-original-I',7,1]);
});

test('reading record adds and edits a read without duplicate entries', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:'Reading record',exact:true}).click();
  await page.getByRole('button', {name:'Add a read',exact:true}).click();
  await page.getByLabel('Book or text title', {exact:true}).fill('Our school book');
  await page.getByLabel('Minutes read', {exact:true}).fill('10');
  await page.getByLabel('How did they read?', {exact:true}).selectOption('With some help');
  await page.getByLabel('Comments or words to revisit', {exact:true}).fill('Read the word buses. Retold the ending.');
  await page.getByRole('button', {name:'Save reading entry',exact:true}).evaluate(button => {button.click(); button.click();});
  await expect(page.locator('.home-reading-entry')).toHaveCount(1);
  await expect(page.locator('.school-week')).toContainText('1 / 5');
  await page.getByRole('button', {name:'Edit reading entry: Our school book',exact:true}).click();
  await page.getByLabel('Minutes read', {exact:true}).fill('5');
  await page.getByRole('button', {name:'Save reading entry',exact:true}).click();
  await expect(page.locator('.school-week')).toContainText('0 / 5');
  await page.reload();
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:'Reading record',exact:true}).click();
  await expect(page.locator('.home-reading-entry')).toHaveCount(1);
  await expect(page.locator('.home-reading-entry')).toContainText('5 minutes');
  await expect(page.locator('.home-reading-entry')).toContainText('Retold the ending');
});

test('weekly reading totals use local dates and count days, not repeated log entries', async ({page}) => {
  await setup(page);
  expect(await page.evaluate(async () => {
    const {readingWeek} = await import('/phonobuddy/src/utils/schoolReading.js');
    return readingWeek([{date:'2026-09-07',minutes:5},{date:'2026-09-07',minutes:5},{date:'2026-09-08',minutes:12}, {date:'2026-09-06',minutes:30}], new Date(2026,8,11));
  })).toEqual({sessions:3,days:2});
});

test('story conversation prompts and explicit reading log keep old story history intact', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:/A Den for a Frog/}).click();
  await page.getByText('Before reading', {exact:true}).click();
  await expect(page.getByText('Read the title together. What might this be about?', {exact:true})).toBeVisible();
  await page.getByText('During reading', {exact:true}).click();
  await expect(page.getByText('What has happened so far?', {exact:true})).toBeVisible();
  for (let index=1; index<6; index++) await page.getByRole('button', {name:'Next page',exact:true}).click();
  await page.getByRole('button', {name:'Finish story',exact:true}).click();
  await page.getByText('After reading', {exact:true}).click();
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.where('key').startsWith('homeReading:').count())).toBe(0);
  await page.getByRole('button', {name:'Add to reading record',exact:true}).click();
  await expect(page.getByLabel('Book or text title', {exact:true})).toHaveValue('A Den for a Frog');
  await page.getByRole('button', {name:'Save reading entry',exact:true}).click();
  await expect(page.getByText('Added to your reading record.', {exact:true})).toBeVisible();
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/storage.js')).db.settings.where('key').startsWith('homeReading:').count())).toBe(1);
});

test('school lists and long words fit phone, tablet and desktop and print with ticks', async ({page}, testInfo) => {
  await setup(page); await words(page);
  for (const [id,count] of [['r1',73],['y2',64],['y34',106]]) {
    await page.getByLabel('School word list', {exact:true}).selectOption(id);
    await expect(page.locator('.school-checklist tbody tr')).toHaveCount(count);
  }
  await page.getByLabel('Find a word', {exact:true}).fill('occasionally');
  for (const width of [375,820,1366]) {
    await page.setViewportSize({width,height:1000});
    await page.screenshot({path:testInfo.outputPath(`school-checklist-${width}.png`)});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', {name:'occasionally',exact:true}).click();
    const big = page.locator('.school-big-word');
    expect(await big.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`school-practice-${width}.png`)});
    await page.getByRole('button', {name:'Back to checklist',exact:true}).click();
  }
  await page.emulateMedia({media:'print'});
  await expect(page.getByRole('button', {name:'occasionally',exact:true})).toBeVisible();
  await page.emulateMedia({media:'screen'});
  await page.getByRole('tab', {name:'Sound blending',exact:true}).click();
  await expect(page.getByRole('heading', {name:'Word Practice',exact:true})).toBeVisible();
});

test('recording studio includes the new school vocabulary without invented sound breakdowns', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Parent view',exact:true}).click();
  await page.getByRole('button', {name:/Record$/,exact:false}).first().click();
  await page.getByRole('button', {name:/Words \(/}).click();
  await page.getByRole('button', {name:'School lists',exact:true}).click();
  await page.getByLabel('Find recording word', {exact:true}).fill('occasionally');
  await page.getByRole('button', {name:'occasionally',exact:true}).click();
  await expect(page.getByText('School word', {exact:true})).toBeVisible();
  await expect(page.getByText(/Sounds:.*undefined/)).toHaveCount(0);
});
