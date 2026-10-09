// Builds a small synthetic locked book pack (no family data) and serves it to
// the page, so the family-book reader can be tested without the real books.
import { Buffer } from 'node:buffer';
import sharp from 'sharp';
import { deriveKey, encryptBytes, newKdf, sealIndex, sha256Hex } from '../../src/utils/bookCrypto.js';

export const FAMILY_PASSWORD = 'Purple Rocket Teapot';

const picture = (background, width = 640, height = 480) =>
  sharp({ create: { width, height, channels: 3, background } }).webp().toBuffer();

export async function buildFamilyPack() {
  const kdf = newKdf(1000);
  const key = await deriveKey(FAMILY_PASSWORD, kdf);
  const files = new Map();
  const store = async (bytes, type) => {
    const plain = new Uint8Array(bytes);
    const h = (await sha256Hex(plain)).slice(0, 32);
    files.set(`a/${h}.bin`, Buffer.from(await encryptBytes(key, plain)));
    return { h, t: type };
  };
  const clip = name => store(new TextEncoder().encode(`clip:${name}`.padEnd(400, '.')), 'audio/mpeg');
  const book = {
    id: 'test-egg', title: 'The Test Egg', level: 1, series: 'Dash Adventures',
    cover: await store(await picture('#3fa34d'), 'image/webp'),
    titleAudio: await clip('title'),
    cast: [
      { role: 'hero', name: 'Logan', portrait: await store(await picture('#ffaa88', 200, 200), 'image/webp') },
      { role: 'dash', name: 'Dash', portrait: null },
    ],
    mystery: null,
    practise: ['egg', 'crack'], common: ['the'], challenge: ['dinosaur'],
    before: 'What do you think is in the egg?',
    after: ['What hatched?', 'Who found the egg?', 'What might happen next?'],
    retell: [1, 2, 3, 4],
    pages: [
      { text: 'Logan spots a big egg.', bubble: null, image: await store(await picture('#2266aa'), 'image/webp'), alt: 'Logan finds an egg.', audio: { text: await clip('p1'), bubble: null } },
      { text: 'Crack! The egg splits.', bubble: { who: 'dash', name: 'Dash', text: 'I am Dash!', side: 'left' }, image: await store(await picture('#aa6622'), 'image/webp'), alt: 'The egg cracks.', audio: { text: await clip('p2'), bubble: await clip('p2-bubble') } },
      { text: 'Out pops a little dinosaur!', bubble: null, image: null, alt: 'A little dinosaur.', audio: { text: null, bubble: null } },
      { text: 'Dash naps in a hat.', bubble: null, image: await store(await picture('#884499'), 'image/webp'), alt: 'Dash asleep in a hat.', audio: { text: await clip('p4'), bubble: null } },
    ],
    words: { egg: await clip('egg'), crack: await clip('crack'), logan: await clip('logan') },
  };
  const second = { ...book, id: 'test-bath', title: 'The Test Bath', level: 2 };
  const header = async value => store(new TextEncoder().encode(JSON.stringify(value)), 'application/json');
  const catalog = {
    series: 'Dash Adventures',
    books: [
      { id: book.id, title: book.title, level: 1, levelLabel: 'Level 1', levelDetail: 'Phase 3', colour: '#d64545', pages: 4, cover: book.cover, header: await header(book) },
      { id: second.id, title: second.title, level: 2, levelLabel: 'Level 2', levelDetail: 'Phase 4', colour: '#d9a400', pages: 4, cover: book.cover, header: await header(second) },
    ],
    cast: {},
  };
  files.set('index.json', Buffer.from(JSON.stringify(await sealIndex(key, kdf, catalog))));
  return files;
}

export async function serveFamilyPack(page, files) {
  await page.route('**/books/family/**', route => {
    const name = new URL(route.request().url()).pathname.split('/books/family/')[1];
    const body = files?.get(name);
    if (!body) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' });
    return route.fulfill({ status: 200, body, contentType: name.endsWith('.json') ? 'application/json' : 'application/octet-stream' });
  });
}
