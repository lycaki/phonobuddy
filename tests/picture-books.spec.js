import { test, expect } from '@playwright/test';
import { buildFamilyPack, serveFamilyPack } from './fixtures/familyPack.js';

let pack;
test.beforeAll(async () => { pack = await buildFamilyPack(); });

async function setup(page, files = pack) {
  await page.route(/firebaseio|firebasedatabase/, route => route.abort());
  await serveFamilyPack(page, files);
  await page.addInitScript(() => {
    window.audioStarts = 0;
    window.played = [];
    window.spoken = [];
    window.blobTypes = {};
    const createUrl = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = createUrl(blob); window.blobTypes[url] = blob.type; return url; };
    window.AudioContext = undefined;
    window.Audio = class {
      constructor(src) { if (src) this.src = src; }
      play() {
        window.audioStarts++;
        window.played.push(window.blobTypes[this.src] || String(this.src).slice(0, 15));
        this.timer = setTimeout(() => this.onended?.(), 120);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); }
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: Object.assign(new EventTarget(), {
      getVoices: () => [{ name: 'Serena Enhanced', voiceURI: 'serena', lang: 'en-GB', localService: true }],
      cancel() {},
      speak(utterance) { window.spoken.push(utterance.text); utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 40); },
    }) });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });
  await page.goto('./');
  await page.getByRole('button', { name: /Year 1 Dino/ }).waitFor();
}

async function openShelf(page) {
  await page.getByRole('button', { name: /Stories/ }).first().click();
  await page.getByRole('button', { name: /Family picture books/ }).click();
}

async function unlock(page, password = 'purple rocket teapot') {
  await page.getByLabel('Family password').fill(password);
  await page.getByRole('button', { name: 'Open the books' }).click();
}

const mp3Plays = page => page.evaluate(() => window.played.filter(type => type === 'audio/mpeg').length);

test('family books stay locked until the family password opens them, then the device remembers', async ({ page }) => {
  await setup(page);
  await openShelf(page);
  await expect(page.getByRole('heading', { name: 'These books star our family' })).toBeVisible();
  await expect(page.getByRole('button', { name: /The Test Egg/ })).toHaveCount(0);
  await unlock(page, 'wrong words');
  await expect(page.getByRole('alert')).toContainText('did not open');
  await unlock(page, '  Purple ROCKET  teapot ');
  await expect(page.getByRole('button', { name: /The Test Egg/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /The Test Bath/ })).toContainText('Level 2');
  await expect.poll(() => page.locator('.family-cover img').first().evaluate(image => image.naturalWidth)).toBeGreaterThan(0);

  await page.reload();
  await page.getByRole('button', { name: /Year 1 Dino/ }).waitFor();
  await openShelf(page);
  await expect(page.getByRole('button', { name: /The Test Egg/ })).toBeVisible();
  const settingKeys = await page.evaluate(async () => {
    const { db } = await import('/phonobuddy/src/utils/storage.js');
    return (await db.settings.toArray()).map(row => row.key);
  });
  expect(settingKeys).toContain('familyBooksKey');

  await page.getByText('Parent notes').click();
  await page.getByRole('button', { name: /Lock on this device/ }).click();
  await expect(page.getByLabel('Family password')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Year 1 Dino/ }).waitFor();
  await openShelf(page);
  await expect(page.getByLabel('Family password')).toBeVisible();
});

test('a picture book fills the screen with tappable words along the bottom', async ({ page }) => {
  await setup(page);
  await openShelf(page);
  await unlock(page);
  await page.getByRole('button', { name: /The Test Egg/ }).click();
  const reader = page.getByRole('dialog', { name: 'The Test Egg' });
  await expect(reader).toBeVisible();
  const viewport = page.viewportSize();
  const frame = await reader.boundingBox();
  expect([Math.round(frame.width), Math.round(frame.height)]).toEqual([viewport.width, viewport.height]);

  await reader.getByRole('button', { name: 'The Test Egg', exact: true }).click();
  await expect.poll(() => mp3Plays(page)).toBe(1);
  await reader.getByRole('button', { name: /Start/ }).click();
  await expect(reader.getByRole('heading', { name: 'Words in this book' })).toBeVisible();
  await reader.getByRole('button', { name: 'crack', exact: true }).click();
  await expect.poll(() => mp3Plays(page)).toBe(2);
  await reader.getByRole('button', { name: 'Next page' }).click();
  await expect(reader.getByRole('heading', { name: 'In this story...' })).toBeVisible();
  await expect(reader.getByRole('button', { name: 'Dash' })).toBeVisible();
  await reader.getByRole('button', { name: 'Next page' }).click();

  await expect(reader.getByText('Page 1 of 4')).toBeVisible();
  const image = reader.locator('.pb-image');
  await expect(image).toHaveAttribute('alt', 'Logan finds an egg.');
  await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBeGreaterThan(0);
  const band = await reader.locator('.pb-band').boundingBox();
  expect(Math.round(band.y + band.height)).toBe(viewport.height);
  const stage = await reader.locator('.pb-stage').boundingBox();
  expect(stage.height).toBeGreaterThan(viewport.height * 0.55);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await reader.getByRole('button', { name: 'Hear egg' }).click();
  await expect.poll(() => mp3Plays(page)).toBe(3);
  await reader.getByRole('button', { name: 'Hear spots' }).click();
  await expect.poll(() => page.evaluate(() => window.spoken)).toContain('spots');
  await reader.getByRole('button', { name: 'Read this page to me' }).click();
  await expect.poll(() => mp3Plays(page)).toBe(4);

  await page.keyboard.press('ArrowRight');
  await expect(reader.getByText('Page 2 of 4')).toBeVisible();
  await expect(reader.locator('.pb-bubble')).toContainText('I am Dash!');
  await reader.getByRole('button', { name: 'Hear what Dash says' }).click();
  await expect.poll(() => mp3Plays(page)).toBe(5);

  await reader.getByRole('button', { name: 'Next page' }).click();
  await expect(reader.getByText('Picture coming soon')).toBeVisible();
  await reader.getByRole('button', { name: 'Read this page to me' }).click();
  await expect.poll(() => page.evaluate(() => window.spoken)).toContain('Out pops a little dinosaur!');

  await reader.getByRole('button', { name: 'Next page' }).click();
  await reader.getByRole('button', { name: 'Finish the book' }).click();
  await expect(reader.getByRole('heading', { name: /The End/ })).toBeVisible();
  await expect(reader.locator('.pb-retell li')).toHaveCount(4);
  await reader.getByRole('button', { name: 'Go to page 2' }).click();
  await expect(reader.getByText('Page 2 of 4')).toBeVisible();
  await reader.getByRole('button', { name: 'Close book' }).click();
  await expect(page.getByRole('button', { name: /The Test Egg/ })).toContainText('Continue at page 2');
  await expect(page.getByRole('button', { name: /The Test Egg/ })).toContainText('Read 1 time');
});

test('read to me reads each page aloud and the place is kept', async ({ page }) => {
  await setup(page);
  await openShelf(page);
  await unlock(page);
  await page.getByRole('button', { name: /The Test Egg/ }).click();
  const reader = page.getByRole('dialog', { name: 'The Test Egg' });
  await reader.getByRole('button', { name: /Read to me/ }).click();
  await expect(reader.getByRole('button', { name: /Read to me/ })).toHaveAttribute('aria-pressed', 'true');
  await reader.getByRole('button', { name: /Start/ }).click();
  await reader.getByRole('button', { name: 'Next page' }).click();
  await reader.getByRole('button', { name: 'Next page' }).click();
  await expect.poll(() => mp3Plays(page)).toBe(1);
  await reader.getByRole('button', { name: 'Next page' }).click();
  // Page 2 reads the narration and then the speech bubble.
  await expect.poll(() => mp3Plays(page)).toBe(3);
  await page.keyboard.press('Escape');
  await expect(reader).toHaveCount(0);
  await page.getByRole('button', { name: /The Test Egg/ }).click();
  await expect(page.getByRole('dialog', { name: 'The Test Egg' }).getByText('Page 2 of 4')).toBeVisible();
});

test('Dad\'s recorded word plays before the book\'s voice clip', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'webkit', 'Windows WebKit cannot persist recording Blobs; Chromium covers this path.');
  await setup(page);
  await page.evaluate(async () => {
    const { db } = await import('/phonobuddy/src/utils/storage.js');
    await db.recordings.put({ phonemeId: 'word:egg', blob: new Blob(['dad-says-egg'], { type: 'audio/webm' }), timestamp: 5 });
  });
  await openShelf(page);
  await unlock(page);
  await page.getByRole('button', { name: /The Test Egg/ }).click();
  const reader = page.getByRole('dialog', { name: 'The Test Egg' });
  await reader.getByRole('button', { name: /Start/ }).click();
  await reader.getByRole('button', { name: 'egg', exact: true }).click();
  // Only real clips count; the silent unlock sound from Start is ignored.
  await expect.poll(() => page.evaluate(() => window.played.filter(type => type.startsWith('audio/')))).toEqual(['audio/webm']);
  expect(await page.evaluate(async () => {
    const { db } = await import('/phonobuddy/src/utils/storage.js');
    return (await db.recordings.get('word:egg')).blob.text();
  })).toBe('dad-says-egg');
});

test('without a book pack the shelf explains that no family books exist yet', async ({ page }) => {
  await setup(page, new Map());
  await openShelf(page);
  await expect(page.getByRole('heading', { name: 'No family books yet' })).toBeVisible();
  await expect(page.getByLabel('Family password')).toHaveCount(0);
});

for (const [name, size] of [['iPad landscape', { width: 1180, height: 820 }], ['iPad portrait', { width: 820, height: 1180 }], ['phone', { width: 390, height: 844 }]]) {
  test(`reader layout keeps the words readable on ${name}`, async ({ page }) => {
    await page.setViewportSize(size);
    await setup(page);
    await openShelf(page);
    await unlock(page);
    await page.getByRole('button', { name: /The Test Egg/ }).click();
    const reader = page.getByRole('dialog', { name: 'The Test Egg' });
    await reader.getByRole('button', { name: /Start/ }).click();
    await reader.getByRole('button', { name: 'Next page' }).click();
    await reader.getByRole('button', { name: 'Next page' }).click();
    await reader.getByRole('button', { name: 'Next page' }).click();
    await expect(reader.locator('.pb-bubble')).toBeVisible();
    const sizes = await reader.evaluate(element => {
      const box = selector => element.querySelector(selector).getBoundingClientRect();
      const line = element.querySelector('.pb-line');
      return { band: box('.pb-band'), bubble: box('.pb-bubble'), stage: box('.pb-stage'), font: parseFloat(getComputedStyle(line).fontSize), overflow: line.scrollWidth > line.clientWidth + 1 };
    });
    expect(sizes.font).toBeGreaterThanOrEqual(26);
    expect(sizes.overflow).toBe(false);
    expect(Math.round(sizes.band.bottom)).toBe(size.height);
    expect(sizes.bubble.right).toBeLessThanOrEqual(size.width);
    expect(sizes.bubble.bottom).toBeLessThan(sizes.stage.bottom);
    expect(sizes.stage.height).toBeGreaterThan(size.height * 0.5);
  });
}
