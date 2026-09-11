import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { getWordArt, PICTURE_WORDS } from '../src/data/wordArt.js';

async function setup(page) {
  await page.route(/firebaseio|firebasedatabase/, route => route.abort());
  await page.addInitScript(() => {
    window.roarStarts = 0;
    window.disconnections = 0;
    window.audioStarts = 0;
    window.spoken = [];
    window.effectMode = 'normal';
    const parameter = () => ({value:0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}});
    class Node {
      constructor() { this.gain = parameter(); this.frequency = parameter(); }
      connect() { return this; }
      disconnect() { window.disconnections++; }
      start() { window.roarStarts++; }
      stop() { setTimeout(() => this.onended?.(), 480); }
    }
    window.AudioContext = class {
      constructor() { this.state = window.effectMode === 'normal' ? 'running' : 'suspended'; this.currentTime = 0; this.destination = {}; }
      resume() {
        if (window.effectMode === 'blocked') return Promise.reject(new Error('NotAllowedError'));
        return new Promise(resolve => { window.resumeEffect = () => {this.state = 'running'; resolve();}; });
      }
      createOscillator() { return new Node(); }
      createGain() { return new Node(); }
      createBiquadFilter() { return new Node(); }
    };
    window.Audio = class {
      play() { window.audioStarts++; window.lastAudio = this; this.timer = setTimeout(() => this.onended?.(), 250); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); }
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable:true, value:Object.assign(new EventTarget(), {
      getVoices:() => [{name:'Serena Enhanced',voiceURI:'serena',lang:'en-GB',localService:true}],
      cancel() {},
      speak(utterance) { window.spoken.push(utterance.text); utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 50); },
    }) });
    window.SpeechSynthesisUtterance = class { constructor(text) {this.text = text;} };
  });
  await page.goto('./');
  await page.getByRole('button', {name:/Year 1 Dino/}).waitFor();
}

async function pictures(page) {
  await page.getByRole('button', {name:/Words/}).first().click();
  await page.getByRole('tab', {name:'Picture words',exact:true}).click();
}

test('all original art has a prompt, a small deployed file and exact word meanings', () => {
  const manifest = JSON.parse(readFileSync('public/art/prompts.json', 'utf8'));
  expect(PICTURE_WORDS).toHaveLength(14);
  expect(manifest.assets).toHaveLength(17);
  let bytes = 0;
  for (const asset of manifest.assets) {
    const size = statSync(`public/art/${asset.file}`).size;
    expect(size).toBeGreaterThan(1000);
    expect(asset.prompt).toContain('illustration-story');
    bytes += size;
  }
  expect(bytes).toBeLessThan(700000);
  expect(getWordArt('Frog!')?.key).toBe('frog');
  for (const word of ['saw', 'the', 'zay', 'blue', 'frogs', 'constructor']) expect(getWordArt(word)).toBeNull();
});

test('picture taps play one word, keep existing data and use the parent recording first', async ({page, browserName}) => {
  await setup(page);
  await page.evaluate(async browserName => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.progress.put({id:'s',introduced:true,box:4,correct:8});
    await db.settings.put({key:'readingHistory',value:{oldStory:{timesRead:3}}});
    if (browserName === 'chromium') await db.recordings.put({phonemeId:'word:frog',blob:new Blob(['keep-dad-frog']),timestamp:17});
  }, browserName);
  await pictures(page);
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await expect(page.locator('.picture-word-grid img')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await expect(page.locator('.picture-stage img')).toHaveAttribute('src', /frog-v1.webp$/);
  expect(await page.evaluate(() => ({audio:window.audioStarts,spoken:window.spoken}))).toEqual(
    browserName === 'chromium' ? {audio:1,spoken:[]} : {audio:0,spoken:['frog']});
  await page.getByRole('button', {name:'Choose clock',exact:true}).click();
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear clock',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.at(-1))).toBe('clock');
  await page.getByRole('button', {name:'Next picture word'}).click();
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await expect(page.getByRole('button', {name:'Hear fish',exact:true})).toBeVisible();
  const saved = await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    const clip = await db.recordings.get('word:frog');
    return {attempts:await db.attempts.count(),correct:(await db.progress.get('s')).correct,
      reads:(await db.settings.get('readingHistory')).value.oldStory.timesRead,clip:clip ? await clip.blob.text() : null};
  });
  expect(saved).toEqual({attempts:0,correct:8,reads:3,clip:browserName === 'chromium' ? 'keep-dad-frog' : null});
});

test('story art appears on a word tap and clears on help, page and abstract-word changes', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.locator('.story-entry').first().click();
  await expect(page.locator('.story-picture-slot .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await expect(page.locator('.story-picture-slot img')).toHaveAttribute('src', /frog-v1.webp$/);
  await page.getByRole('button', {name:'Hear a',exact:true}).first().click();
  await expect(page.locator('.story-picture-slot .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await page.getByLabel("Dad's help", {exact:true}).uncheck();
  await expect(page.locator('.story-picture-slot')).toHaveCount(0);
  await page.getByLabel("Dad's help", {exact:true}).check();
  await expect(page.locator('.story-picture-slot .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await page.getByRole('button', {name:'Next page',exact:true}).click();
  await expect(page.locator('.story-picture-slot .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear fish',exact:true}).click();
  await expect(page.locator('.story-picture-slot img')).toHaveAttribute('src', /fish-v1.webp$/);
});

test('covered spelling never leaks its picture, even after Hear word', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Words/}).first().click();
  await page.getByRole('button', {name:'Spell',exact:true}).click();
  await page.getByLabel('Find a word', {exact:true}).fill('ball');
  await page.getByRole('button', {name:'Practise 1 word',exact:true}).click();
  await page.getByRole('button', {name:'Hear word',exact:true}).click();
  await expect(page.locator('.school-exercise .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Cover word',exact:true}).click();
  await page.getByRole('button', {name:'Hear word',exact:true}).click();
  await expect(page.locator('.school-exercise .word-picture')).toHaveCount(0);
  await expect(page.locator('.school-exercise img[src*="ball"]')).toHaveCount(0);
  await page.getByRole('button', {name:'Check word',exact:true}).click();
  await expect(page.locator('.school-exercise .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear word',exact:true}).click();
  await expect(page.locator('.school-exercise .word-picture')).toBeVisible();
  await page.getByRole('button', {name:'Skip word',exact:true}).click();
  await page.getByRole('button', {name:'Repeat batch',exact:true}).click();
  await expect(page.locator('.school-exercise .word-picture')).toHaveCount(0);
});

test('mute persists, page navigation roars and voice playback stops or suppresses effects', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Dinosaur page sounds'}).click();
  await pictures(page);
  expect(await page.evaluate(() => window.roarStarts)).toBe(0);
  await page.reload();
  await expect(page.getByRole('button', {name:'Dinosaur page sounds'})).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', {name:'Dinosaur page sounds'}).click();
  await expect.poll(() => page.evaluate(() => window.roarStarts)).toBe(2);
  await page.evaluate(async () => {
    const {playRecordedAudio} = await import('/phonobuddy/src/utils/recordedAudio.js');
    await playRecordedAudio('test-clip');
  });
  expect(await page.evaluate(() => window.disconnections)).toBeGreaterThan(0);
  expect(await page.evaluate(async () => (await import('/phonobuddy/src/utils/dinoSounds.js')).playDinoRoar())).toBe(false);
  await page.waitForTimeout(700);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await expect.poll(() => page.evaluate(() => window.roarStarts)).toBe(4);
  await page.getByRole('button', {name:/Home/}).first().click();
  await page.getByRole('button', {name:/Record/}).first().click();
  await expect(page.getByRole('button', {name:'Dinosaur page sounds'})).toHaveCount(0);
});

test('blocked or delayed sound effects cannot block navigation or play later over a voice', async ({page}) => {
  await setup(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(() => {window.effectMode = 'blocked';});
  await page.getByRole('button', {name:/Stories/}).first().click();
  await expect(page.getByRole('heading', {name:'Story shelf'})).toBeVisible();
  await page.evaluate(async () => {
    window.effectMode = 'pending';
    const sound = await import('/phonobuddy/src/utils/dinoSounds.js');
    window.effectResult = sound.playDinoRoar();
    const release = sound.holdDinoSounds();
    window.resumeEffect();
    release();
  });
  expect(await page.evaluate(() => window.effectResult)).toBe(false);
  expect(await page.evaluate(() => window.roarStarts)).toBe(0);
  expect(errors).toEqual([]);
});

test('missing images retain usable word audio and next buttons', async ({page}) => {
  await page.route('**/art/frog-v1.webp', route => route.abort());
  await setup(page);
  await pictures(page);
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken)).toEqual(['frog']);
  await expect(page.locator('.picture-stage .word-picture img')).toHaveCount(0);
  await page.getByRole('button', {name:'Next picture word'}).click();
  await page.getByRole('button', {name:'Hear clock',exact:true}).click();
  await expect(page.locator('.picture-stage img')).toHaveAttribute('src', /clock-v1.webp$/);
});

test('art is complete, stays in its grid and respects reduced motion at all target sizes', async ({page}, testInfo) => {
  await setup(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const [width,height] of [[375,812],[820,1180],[1366,900]]) {
    await page.setViewportSize({width,height});
    await page.getByRole('button', {name:/Stories/}).first().click();
    expect(await page.locator('.story-entry').evaluateAll(entries => entries.every(entry => {
      const [picture,text] = entry.children;
      return picture.getBoundingClientRect().right <= text.getBoundingClientRect().left;
    }))).toBe(true);
    await pictures(page);
    for (const word of PICTURE_WORDS) {
      await page.getByRole('button', {name:`Choose ${word}`,exact:true}).click();
      await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
      await page.getByRole('button', {name:`Hear ${word}`,exact:true}).click();
      await expect(page.locator('.picture-stage .word-picture img')).toHaveAttribute('src', new RegExp(`${word}-v1.webp$`));
    }
    await page.getByRole('button', {name:'Choose frog',exact:true}).click();
    await page.getByRole('button', {name:'Hear frog',exact:true}).click();
    await page.locator('.picture-word-grid button').last().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.art-image img')].every(image => image.complete && image.naturalWidth));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => scrollTo(0,0));
    expect(await page.locator('.word-picture-button .art-image').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
    await page.screenshot({path:testInfo.outputPath(`pictures-${width}.png`),fullPage:true});
  }
});

test('a delayed or failed word cannot reveal its picture or leak it onto the next word', async ({page}) => {
  await setup(page);
  await pictures(page);
  await page.evaluate(() => {
    window.speechSynthesis.speak = utterance => {window.pendingUtterance = utterance;};
  });
  await page.getByRole('button', {name:'Hear frog',exact:true}).click();
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Next picture word'}).click();
  await page.evaluate(() => window.pendingUtterance.onstart?.());
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await page.getByRole('button', {name:'Hear clock',exact:true}).click();
  await page.evaluate(() => window.pendingUtterance.onerror?.());
  await expect(page.locator('.picture-stage .word-picture')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Read together: clock');
});
