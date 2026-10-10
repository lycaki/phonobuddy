import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { BOOKS } from '../books/stories.mjs';

const run = promisify(execFile);

test('public packaging includes complete books, omits private generation files and restores existing art', async () => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'phonobuddy-public-pack-'));
  // Verify the unique test directory before permitting recursive cleanup.
  const relative = path.relative(path.resolve(tmpdir()), path.resolve(scratch));
  if (!relative.startsWith('phonobuddy-public-pack-') || relative.includes(path.sep)) throw new Error('Unexpected test cleanup path');
  const privateDir = path.join(scratch, 'private');
  const work = path.join(privateDir, 'work');
  const pack = path.join(scratch, 'published');
  const book = BOOKS[0];
  const dir = path.join(work, book.id);
  try {
    await mkdir(dir, { recursive: true });
    const picture = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#44aa77' } }).webp().toBuffer();
    await writeFile(path.join(dir, 'cover.webp'), picture);
    for (let i = 1; i <= book.pages.length; i++) await writeFile(path.join(dir, `p${String(i).padStart(2, '0')}.webp`), picture);
    await writeFile(path.join(dir, 'meta.json'), JSON.stringify({ images: { cover: { privateNote: 'PRIVATE_GENERATION_MARKER' } }, audio: {} }));
    const castDir = path.join(work, 'cast');
    await mkdir(castDir, { recursive: true });
    await writeFile(path.join(castDir, 'hero-portrait.webp'), picture);
    await writeFile(path.join(castDir, 'hero-sheet.webp'), 'PRIVATE_SHEET_MARKER');
    await writeFile(path.join(privateDir, 'family-photo.jpg'), 'PRIVATE_PHOTO_MARKER');
    const incompleteDir = path.join(work, BOOKS[1].id);
    await mkdir(incompleteDir, { recursive: true });
    await writeFile(path.join(incompleteDir, 'cover.webp'), picture);
    const options = {
      env: { ...process.env, BOOKS_PRIVATE_DIR: privateDir, BOOKS_WORK_DIR: work, BOOKS_PACK_DIR: pack, OPENROUTER_API_KEY: 'invalid-check', FISH_AUDIO_API_KEY: 'invalid-check' },
    };
    const command = ['scripts/books/generate.mjs', '--step', 'seal', '--public', '--allow-placeholder-names'];
    const first = await run(process.execPath, command, options);
    expect(first.stdout).toContain('0 new pictures (about $0.00), 0 new voice clips');
    const index = JSON.parse(await readFile(path.join(pack, 'index.json'), 'utf8'));
    expect(index.format).toBe('phonobuddy-public-books');
    expect(index).not.toHaveProperty('kdf');
    expect(index.catalog).not.toHaveProperty('cast');
    expect(index.catalog.books.map(entry => entry.id)).toEqual([book.id]);
    const headerRef = index.catalog.books[0].header;
    const header = JSON.parse(await readFile(path.join(pack, 'a', `${headerRef.h}.bin`), 'utf8'));
    expect(header).not.toHaveProperty('meta');
    expect(header.pages).toHaveLength(book.pages.length);
    expect(header.pages.every(page => page.image?.h)).toBe(true);
    for (const file of await readdir(path.join(pack, 'a'))) {
      const bytes = await readFile(path.join(pack, 'a', file));
      expect(bytes.includes('PRIVATE_')).toBe(false);
      expect(bytes.includes('invalid-check')).toBe(false);
    }
    const restoredPage = path.join(dir, 'p01.webp');
    await rm(restoredPage);
    await rm(path.join(castDir, 'hero-portrait.webp'));
    const second = await run(process.execPath, command, options);
    expect(second.stdout).toContain('Restored 2 earlier pictures');
    expect(await readFile(restoredPage)).toEqual(picture);
    expect(await readFile(path.join(castDir, 'hero-portrait.webp'))).toEqual(picture);
    expect(second.stdout).toContain('0 new pictures (about $0.00), 0 new voice clips');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});
