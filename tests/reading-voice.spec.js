import { test, expect } from '@playwright/test';

const speechModule = '/phonobuddy/src/utils/speech.js';

async function setup(page, { delayed = false } = {}) {
  await page.route(/firebaseio|firebasedatabase/, route => route.abort());
  await page.addInitScript(({ delayed }) => {
    window.availableVoices = [
      {name:'Daniel', voiceURI:'daniel', lang:'en-GB', default:true, localService:true},
      {name:'Samantha Enhanced', voiceURI:'samantha', lang:'en-US', localService:true},
      {name:'Serena', voiceURI:'serena', lang:'en-GB', localService:true},
      {name:'Serena Enhanced', voiceURI:'serena-enhanced', lang:'en-GB', localService:true},
      {name:'Audrey', voiceURI:'audrey', lang:'fr-FR', localService:true},
    ];
    window.testVoices = delayed ? [] : window.availableVoices;
    window.spoken = [];
    window.cancelCount = 0;
    window.speechMode = 'normal';
    window.audioMode = 'normal';
    window.audioStarts = 0;
    const synth = Object.assign(new EventTarget(), {
      getVoices: () => window.testVoices,
      cancel: () => { window.cancelCount++; },
      speak: utterance => {
        window.spoken.push({text:utterance.text, voice:utterance.voice.voiceURI, rate:utterance.rate});
        if (window.speechMode === 'hang') return;
        setTimeout(() => window.speechMode === 'error' ? utterance.onerror?.() : utterance.onend?.(), 50);
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {configurable:true, value:synth});
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    window.Audio = class {
      play() {
        window.audioStarts++;
        if (window.audioMode === 'blocked') return Promise.reject(new Error('NotAllowedError'));
        this.timer = setTimeout(() => this.onended?.(), 50);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); }
    };
  }, { delayed });
  await page.goto('./');
  await page.getByRole('button', {name:/Year 1 Dino/}).waitFor();
}

test('automatic voice prefers higher-quality British female; explicit and unavailable choices are safe', async ({page}) => {
  await setup(page);
  expect(await page.evaluate(async module => {
    const {chooseReadingVoice} = await import(module);
    const voices = window.availableVoices;
    return {
      auto:chooseReadingVoice(voices).voiceURI,
      explicit:chooseReadingVoice(voices, 'samantha').voiceURI,
      missing:chooseReadingVoice(voices, 'missing').voiceURI,
      unknown:chooseReadingVoice([voices[0], voices[4]]),
      nonEnglish:chooseReadingVoice([voices[4]], 'audrey'),
    };
  }, speechModule)).toEqual({auto:'serena-enhanced', explicit:'samantha', missing:'serena-enhanced', unknown:null, nonEnglish:null});
});

test('delayed voices work and cancelled pending speech never starts', async ({page}) => {
  await setup(page, {delayed:true});
  await page.evaluate(async module => {
    const {speak} = await import(module);
    window.pendingSpeech = speak('First story');
  }, speechModule);
  await page.evaluate(() => {
    window.testVoices = window.availableVoices;
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  });
  expect(await page.evaluate(() => window.pendingSpeech)).toBe(true);
  expect(await page.evaluate(() => window.spoken)).toHaveLength(1);
  await page.evaluate(async module => {
    const {speak, stopSpeaking} = await import(module);
    window.testVoices = [];
    window.pendingSpeech = speak('Do not read this');
    stopSpeaking();
    window.testVoices = window.availableVoices;
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  }, speechModule);
  expect(await page.evaluate(() => window.pendingSpeech)).toBe(false);
  expect(await page.evaluate(() => window.spoken)).toHaveLength(1);
});

test('voice preview, selection, speed and opt-out persist across reloads', async ({page}, testInfo) => {
  await setup(page);
  await page.getByRole('button', {name:/Settings/}).first().click();
  await expect(page.getByText('Current voice: Serena Enhanced', {exact:true})).toBeVisible();
  await page.getByLabel('Fallback voice', {exact:true}).selectOption('samantha');
  await expect(page.getByLabel(/Reading speed:/)).toBeEnabled();
  await page.getByLabel(/Reading speed:/).fill('0.8');
  await expect(page.getByRole('button', {name:'Preview voice', exact:true})).toBeEnabled();
  await page.getByRole('button', {name:'Preview voice', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.at(-1))).toMatchObject({voice:'samantha', rate:0.8});
  await page.reload();
  await page.getByRole('button', {name:/Settings/}).first().click();
  await expect(page.getByLabel('Fallback voice', {exact:true})).toHaveValue('samantha');
  await expect(page.getByLabel(/Reading speed:/)).toHaveValue('0.8');
  for (const width of [375, 820, 1366]) {
    await page.setViewportSize({width, height:1000});
    await page.getByRole('heading', {name:'Reading voice', exact:true}).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`voice-settings-${width}.png`)});
  }
  await page.getByLabel('Use a fallback reading voice', {exact:true}).uncheck();
  await expect(page.getByLabel('Use a fallback reading voice', {exact:true})).toBeEnabled();
  await expect(page.getByRole('button', {name:'Preview voice', exact:true})).toBeDisabled();
  await page.reload();
  expect(await page.evaluate(async module => (await import(module)).speak('Should stay quiet'), speechModule)).toBe(false);
  expect(await page.evaluate(() => window.spoken)).toEqual([]);
});

test('preview stop and failed preference saves leave the last saved choice intact', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Settings/}).first().click();
  await page.evaluate(() => { window.speechMode = 'hang'; });
  await page.getByRole('button', {name:'Preview voice', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.length)).toBe(1);
  await page.getByRole('button', {name:'Stop preview', exact:true}).click();
  await expect(page.getByRole('button', {name:'Preview voice', exact:true})).toBeVisible();
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    const put = db.settings.put.bind(db.settings);
    db.settings.put = value => value.key === 'readingVoicePreferences'
      ? Promise.reject(new Error('QuotaExceededError')) : put(value);
  });
  await page.getByLabel('Fallback voice', {exact:true}).selectOption('samantha');
  await expect(page.getByRole('status')).toContainText('could not be saved');
  await expect(page.getByLabel('Fallback voice', {exact:true})).toHaveValue('auto');
  expect(await page.evaluate(async module => (await import(module)).getReadingVoicePreferences(), speechModule))
    .toEqual({enabled:true, voiceURI:'auto', rate:0.9});
});

test('unavailable voices and speech errors fail visibly without blocking story navigation', async ({page}) => {
  await setup(page);
  await page.evaluate(() => { window.testVoices = [window.availableVoices[0]]; });
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:/A Frog in the Pond/}).click();
  await page.getByRole('button', {name:'Hear frog', exact:true}).click();
  await expect(page.getByRole('status')).toHaveText("Dad's turn: frog");
  await page.evaluate(() => { window.testVoices = window.availableVoices; window.speechMode = 'error'; });
  await page.getByRole('button', {name:'Hear frog', exact:true}).click();
  await expect(page.getByRole('status')).toHaveText("Dad's turn: frog");
  await page.evaluate(() => { window.speechMode = 'hang'; });
  await page.getByRole('button', {name:'Hear frog', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.length)).toBe(2);
  const before = await page.evaluate(() => window.cancelCount);
  await page.getByRole('button', {name:'Next page', exact:true}).click();
  await expect(page.getByLabel('Story page 2', {exact:true})).toBeVisible();
  expect(await page.evaluate(() => window.cancelCount)).toBeGreaterThan(before);
  await expect(page.getByRole('status')).toBeEmpty();
});

test('stopping, superseding, and stalled playback settle instead of leaving pending speech', async ({page}) => {
  await setup(page);
  await page.evaluate(async module => {
    window.speechMode = 'hang';
    const {speak} = await import(module);
    window.controller = new AbortController();
    window.pendingSpeech = speak('Stop this word', undefined, {signal:window.controller.signal});
  }, speechModule);
  await expect.poll(() => page.evaluate(() => window.spoken.length)).toBe(1);
  await page.evaluate(() => window.controller.abort());
  expect(await page.evaluate(() => window.pendingSpeech)).toBe(false);
  await page.evaluate(async module => { window.pendingSpeech = (await import(module)).speak('First'); }, speechModule);
  await expect.poll(() => page.evaluate(() => window.spoken.length)).toBe(2);
  expect(await page.evaluate(async module => {
    window.speechMode = 'normal';
    return (await import(module)).speak('Next');
  }, speechModule)).toBe(true);
  expect(await page.evaluate(() => window.pendingSpeech)).toBe(false);
  await page.clock.install();
  await page.evaluate(async module => {
    window.speechMode = 'hang';
    window.pendingSpeech = (await import(module)).speak('Timeout');
  }, speechModule);
  await expect.poll(() => page.evaluate(() => window.spoken.length)).toBe(4);
  await page.clock.fastForward(11000);
  expect(await page.evaluate(() => window.pendingSpeech)).toBe(false);
});

test('earlier story narration respects the chosen voice and stops on next page', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:'Earlier story collection', exact:true}).click();
  await page.getByRole('button', {name:/Sam and the Cat/}).click();
  await page.evaluate(() => { window.speechMode = 'hang'; });
  await page.getByRole('button', {name:'Read sentence', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.at(-1))).toMatchObject({text:'Sam has a cat.', voice:'serena-enhanced', rate:0.9});
  const before = await page.evaluate(() => window.cancelCount);
  await page.getByRole('button', {name:'Next', exact:false}).click();
  expect(await page.evaluate(() => window.cancelCount)).toBeGreaterThan(before);
});

test('recorded words remain first and byte-for-byte intact; phonemes and opted-out pseudo-words never use TTS', async ({page}, testInfo) => {
  test.skip(testInfo.project.name === 'webkit', 'Windows WebKit cannot persist recording Blobs; Chromium covers this path.');
  await setup(page);
  await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    await db.recordings.put({phonemeId:'word:frog', blob:new Blob(['original-dad-voice']), timestamp:123});
  });
  await page.getByRole('button', {name:/Stories/}).first().click();
  await page.getByRole('button', {name:/A Frog in the Pond/}).click();
  await page.getByRole('button', {name:'Hear frog', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.audioStarts)).toBe(1);
  expect(await page.evaluate(() => window.spoken)).toEqual([]);
  await page.evaluate(() => { window.audioMode = 'blocked'; });
  await page.getByRole('button', {name:'Hear frog', exact:true}).click();
  await expect(page.getByRole('status')).toHaveText("Dad's turn: frog");
  expect(await page.evaluate(() => window.spoken)).toEqual([]);
  await page.getByRole('button', {name:'Next page', exact:true}).click();
  await page.getByRole('button', {name:'Hear fish', exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.spoken.at(-1))).toMatchObject({text:'fish', voice:'serena-enhanced'});
  expect(await page.evaluate(async () => {
    const {db} = await import('/phonobuddy/src/utils/storage.js');
    const row = await db.recordings.get('word:frog');
    return {audio:await row.blob.text(), timestamp:row.timestamp, count:await db.recordings.count()};
  })).toEqual({audio:'original-dad-voice', timestamp:123, count:1});
  await page.evaluate(async () => {
    const {mountRecordingHarness} = await import('/phonobuddy/tests/fixtures/recordingHarness.jsx');
    window.harness = mountRecordingHarness();
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.recordingApi))).toBe(true);
  expect(await page.evaluate(async () => [
    await window.recordingApi.playSound('s'),
    await window.recordingApi.playSound('word:zog', {allowTts:false}),
  ])).toEqual([false, false]);
  expect(await page.evaluate(() => window.spoken)).toHaveLength(1);
  await page.evaluate(() => window.harness.unmount());
});
