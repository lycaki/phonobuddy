// Brings in page pictures that were drawn outside the generator (by hand or by
// another tool) so the rest of the pipeline can use them.
//
//   npm run books:import -- --book big-green-egg --from path/to/folder
//
// The folder holds cover.png, p01.png, p02.png ... (png, jpg or webp). Each is
// centre-cropped to 4:3 and saved as books/private/work/<book>/<name>.webp.
// Afterwards run `npm run books:generate -- --book <id> --step art --keep` to
// mark the pictures as current and rebuild the contact sheet (no API calls).
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { BOOKS } from '../../books/stories.mjs';
import * as lib from './lib.mjs';

const option = name => { const index = process.argv.indexOf(name); return index > -1 ? process.argv[index + 1] : null; };
const book = BOOKS.find(entry => entry.id === option('--book'));
const from = option('--from');
if (!book || !from) {
  console.error(`Usage: npm run books:import -- --book <id> --from <folder>\nBooks: ${BOOKS.map(entry => entry.id).join(', ')}`);
  process.exit(1);
}

const wanted = ['cover', ...book.pages.map((_, index) => `p${String(index + 1).padStart(2, '0')}`)];
const { default: sharp } = await import('sharp');
const dir = await lib.ensureDir(path.join(lib.WORK, book.id));
const imported = [];
for (const file of (await readdir(path.resolve(from))).sort()) {
  const match = file.match(/^(.+)\.(png|jpe?g|webp)$/i);
  if (!match) continue;
  const name = match[1].toLowerCase();
  if (!wanted.includes(name)) { console.warn(`  skipped ${file}: ${book.id} has no picture called "${name}"`); continue; }
  await sharp(path.join(path.resolve(from), file)).rotate().resize({ width: 1600, height: 1200, fit: 'cover' }).webp({ quality: 76, effort: 5 }).toFile(path.join(dir, `${name}.webp`));
  imported.push(name);
  console.log(`  ${book.id} ${name}: imported from ${file}`);
}
const missing = wanted.filter(name => !lib.exists(path.join(dir, `${name}.webp`)));
console.log(`Imported ${imported.length} picture(s) into ${path.relative(lib.ROOT, dir)}.${missing.length ? ` Still missing: ${missing.join(', ')}.` : ' The book has every picture.'}`);
console.log(`Next: npm run books:generate -- --book ${book.id} --step art --keep`);
