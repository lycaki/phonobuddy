// Generates the private family picture books: character sheets, page pictures
// (OpenRouter image models), read-aloud audio (Fish Audio) and a reader pack.
// Packs are encrypted by default; --step seal --public publishes without a password.
//
//   npm run books:generate -- --help
import path from 'node:path';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { BOOKS } from '../../books/stories.mjs';
import { DEFAULT_CAST, LEVELS, PEOPLE, SERIES_TITLE, castSheetPrompt, pagePrompt, personPortraitPrompt, portraitPrompt } from '../../books/style.mjs';
import { decryptBytes, deriveKey, encryptBytes, isPublicIndex, newKdf, openIndex, publicIndex, sealIndex, sha256Hex, WrongPasswordError } from '../../src/utils/bookCrypto.js';
import { bookWordKeys, fillNames } from '../../src/utils/bookWords.js';
import * as lib from './lib.mjs';

const HELP = `Generate the family picture books.

Settings (environment variables or the project .env file):
  OPENROUTER_API_KEY      pictures (OpenRouter)
  FISH_AUDIO_API_KEY      read-aloud voice (Fish Audio)
  FAMILY_BOOKS_PASSWORD   password that locks the books (typed once on the iPad)
  FISH_AUDIO_VOICE_ID     optional Fish voice id for the narrator (npm run books:voices)
  FISH_AUDIO_MODEL        optional, default s2.1-pro-free
  BOOKS_IMAGE_MODEL       optional, default google/gemini-3-pro-image

Private files (gitignored): books/private/cast.json (names, ages, outfits; copy
books/cast.example.json) and books/private/photos/<hero|sister|dad|mum>/*.jpg.

Options:
  --step cast|art|audio|seal|all   default all (comma separated list allowed)
  --book <id>                      only this book (repeatable)
  --pages 1,2,cover                regenerate only these pages (with --book)
  --role hero,dash                 only these characters in the cast step
  --model <id>                     image model for this run
  --force                          regenerate even when nothing changed
  --keep                           mark existing pictures as up to date after a
                                   prompt change, without redrawing them
  --dry-run                        print prompts and the plan; no API calls
  --new-password                   re-lock every book with FAMILY_BOOKS_PASSWORD
  --public                         publish the pack without a password (seal only)
  --allow-placeholder-names        seal even if cast.json still says "Sister"`;

const IMAGE_COST = { 'google/gemini-3-pro-image': 0.14, 'google/gemini-nano-banana-2.1': 0.04, 'google/gemini-3.1-flash-image': 0.07 };
const stats = { images: 0, clips: 0, cost: 0 };
const pageName = index => `p${String(index + 1).padStart(2, '0')}`;
const hashText = async value => (await sha256Hex(new TextEncoder().encode(JSON.stringify(value)))).slice(0, 24);
const wordFile = key => path.join(lib.WORK, 'words', `${key.replace(/'/g, '_')}.mp3`);

async function loadCast() {
  const custom = await lib.readJson(path.join(lib.PRIVATE, 'cast.json'), {});
  const cast = {};
  for (const [role, member] of Object.entries(DEFAULT_CAST)) cast[role] = { ...member, ...(custom[role] || {}) };
  cast.narrator = custom.narrator || {};
  return cast;
}

function rolesFor(books) {
  const roles = new Set();
  for (const book of books) {
    for (const role of [...book.cast, ...(book.cover.cast || [])]) roles.add(role);
    for (const entry of book.pages) for (const role of entry.cast) roles.add(role);
  }
  return [...roles].filter(role => DEFAULT_CAST[role]);
}

async function sheetRef(role) {
  const file = path.join(lib.WORK, 'cast', `${role}-sheet.webp`);
  return lib.exists(file) ? { file, url: `data:image/webp;base64,${(await readFile(file)).toString('base64')}` } : null;
}

async function makeCast(args, env, cast, roles, model) {
  const meta = await lib.readJson(path.join(lib.WORK, 'cast', 'meta.json'), {});
  // Dash's mum is drawn from Dash's sheet, so Dash comes first.
  const order = [...roles]
    .filter(role => !args.roles.length || args.roles.includes(role))
    .sort((a, b) => (a === 'dash' ? -1 : b === 'dash' ? 1 : a === 'dashMum' ? 1 : b === 'dashMum' ? -1 : 0));
  for (const role of order) {
    const member = cast[role];
    const photos = PEOPLE.includes(role) ? await lib.listImages(path.join(lib.PRIVATE, 'photos', role)) : [];
    const references = [];
    for (const photo of photos.slice(0, 4)) references.push(await lib.dataUrl(photo));
    if (member.reference) references.push(await lib.dataUrl(path.join(lib.ROOT, member.reference)));
    if (role === 'dashMum') {
      const dash = await sheetRef('dash');
      if (dash) references.push(dash.url);
    }
    let prompt = castSheetPrompt(role, member, photos.length > 0);
    if (member.reference) prompt += ` Match the design of the attached mascot exactly: ${member.looks}.`;
    if (role === 'dashMum') prompt += ' Base her design on the attached sheet of her son Dash, but grown-up and huge.';
    const sheetFile = path.join(lib.WORK, 'cast', `${role}-sheet.webp`);
    const portraitFile = path.join(lib.WORK, 'cast', `${role}-portrait.webp`);
    const promptHash = await hashText([prompt, model, await Promise.all(references.map(url => sha256Hex(new TextEncoder().encode(url))))]);
    if (PEOPLE.includes(role) && !photos.length) console.log(`  ${role}: no photos in books/private/photos/${role}, drawing from the description in cast.json.`);
    if (photos.length) {
      await makePerson({ args, env, model, role, member, photoRefs: references, sheetPrompt: prompt, sheetFile, portraitFile, meta });
      continue;
    }
    if (args.dryRun) { console.log(`\n[cast ${role}] ${references.length} reference image(s)\n${prompt}`); continue; }
    if (args.keep && lib.exists(sheetFile)) {
      meta[role] = { ...meta[role], promptHash };
      console.log(`  ${role}: keeping the current character sheet`);
    } else if (!args.force && lib.exists(sheetFile) && meta[role]?.promptHash === promptHash) {
      console.log(`  ${role}: character sheet up to date`);
    } else {
      console.log(`  ${role}: drawing character sheet...`);
      const { bytes, cost } = await lib.generateImage({ apiKey: env.OPENROUTER_API_KEY, model, prompt, references, aspectRatio: '16:9' });
      await lib.ensureDir(path.dirname(sheetFile));
      await writeFile(sheetFile, await lib.toWebp(bytes, { width: 1600, quality: 82 }));
      meta[role] = { promptHash, model, at: new Date().toISOString() };
      track(cost, model);
      await rm(portraitFile, { force: true });
    }
    if (!lib.exists(portraitFile)) {
      console.log(`  ${role}: drawing portrait...`);
      const sheet = await sheetRef(role);
      const { bytes, cost } = await lib.generateImage({ apiKey: env.OPENROUTER_API_KEY, model, prompt: portraitPrompt(member), references: [sheet.url], aspectRatio: '1:1' });
      await writeFile(portraitFile, await lib.toWebp(bytes, { width: 640, quality: 80 }));
      track(cost, model);
    }
    await lib.writeJson(path.join(lib.WORK, 'cast', 'meta.json'), meta);
  }
}

// A person with photos: the portrait is drawn from the photos, then the sheet
// from the portrait, so the face is decided while it fills the frame.
async function makePerson({ args, env, model, role, member, photoRefs, sheetPrompt, sheetFile, portraitFile, meta }) {
  const hashRefs = urls => Promise.all(urls.map(url => sha256Hex(new TextEncoder().encode(url))));
  const facePrompt = personPortraitPrompt(member);
  const portraitHash = await hashText([facePrompt, model, await hashRefs(photoRefs)]);
  if (args.dryRun) {
    console.log(`\n[cast ${role} portrait] ${photoRefs.length} photo(s)\n${facePrompt}`);
    console.log(`\n[cast ${role} sheet] portrait + ${photoRefs.length} photo(s)\n${sheetPrompt}`);
    return;
  }
  const save = () => lib.writeJson(path.join(lib.WORK, 'cast', 'meta.json'), meta);
  const keep = args.keep && lib.exists(portraitFile) && lib.exists(sheetFile);
  if (keep) {
    console.log(`  ${role}: keeping the current portrait and character sheet`);
  } else if (!args.force && lib.exists(portraitFile) && meta[role]?.portraitHash === portraitHash) {
    console.log(`  ${role}: portrait up to date`);
  } else {
    console.log(`  ${role}: drawing portrait from the photos...`);
    const { bytes, cost } = await lib.generateImage({ apiKey: env.OPENROUTER_API_KEY, model, prompt: facePrompt, references: photoRefs, aspectRatio: '1:1' });
    await lib.ensureDir(path.dirname(portraitFile));
    await writeFile(portraitFile, await lib.toWebp(bytes, { width: 640, quality: 80 }));
    meta[role] = { ...meta[role], portraitHash };
    await save();
    track(cost, model);
  }
  const portrait = `data:image/webp;base64,${(await readFile(portraitFile)).toString('base64')}`;
  const promptHash = await hashText([sheetPrompt, model, await hashRefs([portrait, ...photoRefs])]);
  if (keep) {
    meta[role] = { ...meta[role], portraitHash, promptHash };
  } else if (lib.exists(sheetFile) && meta[role]?.promptHash === promptHash) {
    console.log(`  ${role}: character sheet up to date`);
  } else {
    console.log(`  ${role}: drawing character sheet from the portrait...`);
    const { bytes, cost } = await lib.generateImage({ apiKey: env.OPENROUTER_API_KEY, model, prompt: sheetPrompt, references: [portrait, ...photoRefs], aspectRatio: '16:9' });
    await writeFile(sheetFile, await lib.toWebp(bytes, { width: 1600, quality: 82 }));
    meta[role] = { ...meta[role], portraitHash, promptHash, model, at: new Date().toISOString() };
    track(cost, model);
  }
  await save();
}

function track(cost, model) {
  stats.images++;
  stats.cost += cost ?? IMAGE_COST[model] ?? 0.1;
}

function castLines(roles, cast, names, offset = 0) {
  return roles.map((role, index) => {
    const member = cast[role];
    const label = member.kind === 'person' ? fillNames(member.name, names) : member.name;
    const detail = member.kind === 'person'
      ? `${member.age ? `aged ${member.age}, ` : ''}wearing ${member.outfit} unless the scene says otherwise`
      : member.looks;
    return `${label} (reference image ${index + 1 + offset}): ${detail}.${member.scale ? ` ${member.scale}.` : ''}`;
  });
}

async function makeArt(book, args, env, cast, names, model) {
  const dir = await lib.ensureDir(path.join(lib.WORK, book.id));
  const metaFile = path.join(dir, 'meta.json');
  const meta = await lib.readJson(metaFile, { images: {}, audio: {} });
  const wanted = args.pages.length ? new Set(args.pages) : null;
  const jobs = [
    { name: 'cover', scene: book.cover.scene, roles: book.cover.cast || [], words: [], cover: true },
    ...book.pages.map((entry, index) => ({ name: pageName(index), number: String(index + 1), scene: entry.scene, roles: entry.cast, words: entry.words, calm: entry.calm })),
  ];
  let previous = null;
  const earlierWords = [];
  for (const job of jobs) {
    const file = path.join(dir, `${job.name}.webp`);
    const references = [];
    const roles = job.roles.filter(role => DEFAULT_CAST[role]);
    for (const role of roles) {
      const sheet = await sheetRef(role);
      if (sheet) references.push(sheet.url);
      else if (args.dryRun) references.push(`pending ${role} sheet`);
      else throw new Error(`Missing character sheet for ${role}. Run --step cast first.`);
    }
    const continuity = Boolean(previous && !job.cover);
    const prompt = pagePrompt({ scene: fillNames(job.scene, names), castLines: castLines(roles, cast, names), words: job.words.map(word => fillNames(word, names)), earlierWords: [...earlierWords], calm: job.calm, cover: job.cover, continuity });
    for (const word of job.words) if (!earlierWords.includes(fillNames(word, names))) earlierWords.push(fillNames(word, names));
    const promptHash = await hashText([prompt, model, await Promise.all(references.map(url => sha256Hex(new TextEncoder().encode(url))))]);
    const selected = wanted ? wanted.has(job.name) || wanted.has(job.number) : true;
    const fresh = lib.exists(file) && meta.images[job.name]?.promptHash === promptHash;
    if (args.dryRun) {
      if (selected) console.log(`\n[${book.id} ${job.name}] refs: ${roles.join(', ') || 'none'}${continuity ? ' + previous page' : ''}\n${prompt}`);
    } else if (selected && args.keep && lib.exists(file)) {
      if (!fresh) { meta.images[job.name] = { ...meta.images[job.name], promptHash }; await lib.writeJson(metaFile, meta); }
    } else if (selected && (args.force || wanted || !fresh)) {
      console.log(`  ${book.id} ${job.name}: drawing...`);
      if (continuity) references.push(`data:image/webp;base64,${(await readFile(previous)).toString('base64')}`);
      const { bytes, cost } = await lib.generateImage({ apiKey: env.OPENROUTER_API_KEY, model, prompt, references });
      await writeFile(file, await lib.toWebp(bytes));
      meta.images[job.name] = { promptHash, model, at: new Date().toISOString() };
      await lib.writeJson(metaFile, meta);
      track(cost, model);
    }
    if (lib.exists(file)) previous = file;
  }
  const pictures = jobs.map(job => path.join(dir, `${job.name}.webp`)).filter(lib.exists);
  if (!args.dryRun && pictures.length) {
    await lib.contactSheet(pictures, path.join(dir, 'contact.jpg'));
    console.log(`  ${book.id}: ${pictures.length}/${jobs.length} pictures. Check ${path.relative(lib.ROOT, path.join(dir, 'contact.jpg'))}`);
  }
}

function clipsFor(book, names) {
  const clips = [{ name: 'title', text: book.title }];
  book.pages.forEach((entry, index) => {
    clips.push({ name: `${pageName(index)}-text`, text: fillNames(entry.text, names) });
    if (entry.bubble) clips.push({ name: `${pageName(index)}-bubble`, text: fillNames(entry.bubble.text, names), who: entry.bubble.who });
  });
  return clips;
}

function wordsFor(book, names) {
  return bookWordKeys([book.title, ...book.pages.flatMap(entry => [entry.text, entry.bubble?.text || '']), ...book.practise, ...book.common, ...book.challenge]
    .map(text => fillNames(text, names)));
}

async function makeAudio(book, args, env, cast, names) {
  const dir = await lib.ensureDir(path.join(lib.WORK, book.id, 'audio'));
  const metaFile = path.join(lib.WORK, book.id, 'meta.json');
  const meta = await lib.readJson(metaFile, { images: {}, audio: {} });
  const wordMetaFile = path.join(lib.WORK, 'words', 'meta.json');
  const wordMeta = await lib.readJson(wordMetaFile, {});
  const model = env.FISH_AUDIO_MODEL || 's2.1-pro-free';
  const narrator = env.FISH_AUDIO_VOICE_ID || cast.narrator.voice || null;
  const jobs = [
    ...clipsFor(book, names).map(clip => ({ ...clip, file: path.join(dir, `${clip.name}.mp3`), store: meta.audio, key: clip.name, voice: cast[clip.who]?.voice || narrator })),
    ...wordsFor(book, names).map(key => ({ name: key, text: `${key}.`, file: wordFile(key), store: wordMeta, key, voice: narrator, speed: 0.85 })),
  ];
  if (args.dryRun) { console.log(`\n[${book.id} audio] ${jobs.length} clips with voice ${narrator || 'Fish default'}: ${jobs.map(job => job.name).join(', ')}`); return; }
  for (const job of jobs) {
    const hash = await hashText([job.text, job.voice, model, job.speed || 0.9]);
    if (!args.force && lib.exists(job.file) && job.store[job.key]?.hash === hash) continue;
    await lib.ensureDir(path.dirname(job.file));
    await writeFile(job.file, await lib.speech({ apiKey: env.FISH_AUDIO_API_KEY, model, voice: job.voice, text: job.text, speed: job.speed || 0.9 }));
    job.store[job.key] = { hash, at: new Date().toISOString() };
    stats.clips++;
    if (stats.clips % 20 === 0) { await lib.writeJson(metaFile, meta); await lib.writeJson(wordMetaFile, wordMeta); console.log(`  ${stats.clips} voice clips so far...`); }
  }
  await lib.writeJson(metaFile, meta);
  await lib.writeJson(wordMetaFile, wordMeta);
  console.log(`  ${book.id}: audio ready`);
}

async function unlockPack(env, args) {
  const indexFile = path.join(lib.PACK, 'index.json');
  const index = await lib.readJson(indexFile);
  if (!index || args.newPassword || isPublicIndex(index)) {
    const kdf = newKdf();
    return { kdf, key: await deriveKey(env.FAMILY_BOOKS_PASSWORD, kdf), catalog: null, fresh: true };
  }
  const key = await deriveKey(env.FAMILY_BOOKS_PASSWORD, index.kdf);
  try {
    return { kdf: index.kdf, key, catalog: await openIndex(index, key), fresh: false };
  } catch (error) {
    if (error instanceof WrongPasswordError) throw new Error('FAMILY_BOOKS_PASSWORD does not match the existing books. Use the old password, or add --new-password to re-lock everything (the iPad will then ask for the new one).');
    throw error;
  }
}

// Fresh checkouts (a new cloud session) have no work folder: recover what was
// generated before from the published pack instead of paying to redraw it.
async function restore(env, args) {
  let pack;
  const index = await lib.readJson(path.join(lib.PACK, 'index.json'));
  try {
    pack = isPublicIndex(index) ? { key: null, catalog: index.catalog } : await unlockPack(env, { ...args, newPassword: false });
  } catch (error) { console.warn(`Could not open the existing books: ${error.message}`); return; }
  if (!pack.catalog) return;
  const read = async ref => {
    const bytes = await readFile(path.join(lib.PACK, 'a', `${ref.h}.bin`));
    return pack.key ? decryptBytes(pack.key, bytes) : bytes;
  };
  const put = async (file, ref) => {
    if (!ref || lib.exists(file)) return false;
    await lib.ensureDir(path.dirname(file));
    await writeFile(file, await read(ref));
    return true;
  };
  let restored = 0;
  const castMeta = await lib.readJson(path.join(lib.WORK, 'cast', 'meta.json'), {});
  for (const [role, entry] of Object.entries(pack.catalog.cast || {})) {
    if (await put(path.join(lib.WORK, 'cast', `${role}-sheet.webp`), entry.sheet)) { restored++; castMeta[role] ||= entry.meta; }
    if (await put(path.join(lib.WORK, 'cast', `${role}-portrait.webp`), entry.portrait)) restored++;
  }
  if (restored) await lib.writeJson(path.join(lib.WORK, 'cast', 'meta.json'), castMeta);
  const wordMeta = await lib.readJson(path.join(lib.WORK, 'words', 'meta.json'), {});
  for (const summary of pack.catalog.books) {
    const header = JSON.parse(new TextDecoder().decode(await read(summary.header)));
    for (const member of header.cast || []) {
      if (await put(path.join(lib.WORK, 'cast', `${member.role}-portrait.webp`), member.portrait)) restored++;
    }
    const dir = path.join(lib.WORK, header.id);
    const meta = await lib.readJson(path.join(dir, 'meta.json'), { images: {}, audio: {} });
    if (await put(path.join(dir, 'cover.webp'), header.cover)) { restored++; meta.images.cover ||= header.meta?.images?.cover; }
    for (const [index, entry] of header.pages.entries()) {
      const name = pageName(index);
      if (await put(path.join(dir, `${name}.webp`), entry.image)) { restored++; meta.images[name] ||= header.meta?.images?.[name]; }
      for (const kind of ['text', 'bubble']) {
        if (await put(path.join(dir, 'audio', `${name}-${kind}.mp3`), entry.audio?.[kind])) { restored++; meta.audio[`${name}-${kind}`] ||= header.meta?.audio?.[`${name}-${kind}`]; }
      }
    }
    if (await put(path.join(dir, 'audio', 'title.mp3'), header.titleAudio)) { restored++; meta.audio.title ||= header.meta?.audio?.title; }
    for (const [key, ref] of Object.entries(header.words || {})) {
      if (await put(wordFile(key), ref)) { restored++; wordMeta[key] ||= header.meta?.words?.[key]; }
    }
    await lib.writeJson(path.join(dir, 'meta.json'), meta);
  }
  await lib.writeJson(path.join(lib.WORK, 'words', 'meta.json'), wordMeta);
  if (restored) console.log(`Restored ${restored} earlier pictures and clips from the published books.`);
}

async function seal(args, env, cast, names) {
  const existing = await lib.readJson(path.join(lib.PACK, 'index.json'));
  const pack = args.public ? { key: null, fresh: !isPublicIndex(existing) } : await unlockPack(env, args);
  const used = new Set();
  const assetDir = await lib.ensureDir(path.join(lib.PACK, 'a'));
  const store = async (bytes, type) => {
    if (!bytes) return null;
    const h = (await sha256Hex(bytes)).slice(0, 32);
    const file = path.join(assetDir, `${h}.bin`);
    if (pack.fresh || !lib.exists(file)) await writeFile(file, args.public ? bytes : await encryptBytes(pack.key, bytes));
    used.add(`${h}.bin`);
    return { h, t: type };
  };
  const readIf = async file => (lib.exists(file) ? readFile(file) : null);
  const castMeta = await lib.readJson(path.join(lib.WORK, 'cast', 'meta.json'), {});
  const castCatalog = {};
  for (const role of Object.keys(DEFAULT_CAST)) {
    const sheet = args.public ? null : await store(await readIf(path.join(lib.WORK, 'cast', `${role}-sheet.webp`)), 'image/webp');
    const portrait = await store(await readIf(path.join(lib.WORK, 'cast', `${role}-portrait.webp`)), 'image/webp');
    castCatalog[role] = { name: fillNames(cast[role].name, names), sheet, portrait, meta: castMeta[role] || null };
  }
  const wordMeta = await lib.readJson(path.join(lib.WORK, 'words', 'meta.json'), {});
  const books = [];
  const skipped = [];
  for (const book of BOOKS) {
    const dir = path.join(lib.WORK, book.id);
    const meta = await lib.readJson(path.join(dir, 'meta.json'), { images: {}, audio: {} });
    const images = await Promise.all(book.pages.map((_, index) => readIf(path.join(dir, `${pageName(index)}.webp`))));
    const coverBytes = await readIf(path.join(dir, 'cover.webp'));
    if (!coverBytes || images.some(bytes => !bytes)) {
      skipped.push(book.id);
      if (!args.allowIncomplete) continue;
    }
    const words = {};
    const wordMetaForBook = {};
    for (const key of wordsFor(book, names)) {
      const ref = await store(await readIf(wordFile(key)), 'audio/mpeg');
      if (ref) { words[key] = ref; wordMetaForBook[key] = wordMeta[key] || null; }
    }
    const header = {
      id: book.id,
      title: book.title,
      level: book.level,
      series: SERIES_TITLE,
      cover: await store(coverBytes, 'image/webp'),
      titleAudio: await store(await readIf(path.join(dir, 'audio', 'title.mp3')), 'audio/mpeg'),
      cast: book.cast.map(role => ({ role, name: castCatalog[role].name, portrait: castCatalog[role].portrait })),
      mystery: book.mystery || null,
      practise: book.practise,
      common: book.common,
      challenge: book.challenge.map(word => fillNames(word, names)),
      before: fillNames(book.before, names),
      after: book.after.map(question => fillNames(question, names)),
      retell: book.retell,
      pages: await Promise.all(book.pages.map(async (entry, index) => ({
        text: fillNames(entry.text, names),
        bubble: entry.bubble ? { who: entry.bubble.who, name: castCatalog[entry.bubble.who]?.name || 'Snowman', text: fillNames(entry.bubble.text, names), side: entry.calm === 'top-right' ? 'right' : 'left' } : null,
        image: await store(images[index], 'image/webp'),
        alt: fillNames(entry.scene, names).split(/(?<=\.)\s/)[0].slice(0, 160),
        audio: {
          text: await store(await readIf(path.join(dir, 'audio', `${pageName(index)}-text.mp3`)), 'audio/mpeg'),
          bubble: entry.bubble ? await store(await readIf(path.join(dir, 'audio', `${pageName(index)}-bubble.mp3`)), 'audio/mpeg') : null,
        },
      }))),
      words,
      ...(!args.public && { meta: { images: meta.images, audio: meta.audio, words: wordMetaForBook } }),
    };
    const thumbnail = coverBytes ? await store(await lib.toWebp(coverBytes, { width: 640, quality: 72 }), 'image/webp') : null;
    const level = LEVELS[book.level];
    books.push({
      id: book.id, title: book.title, level: book.level, levelLabel: level.label, levelDetail: level.detail, colour: level.colour,
      pages: book.pages.length, cover: thumbnail,
      header: await store(new TextEncoder().encode(JSON.stringify(header)), 'application/json'),
    });
  }
  const catalog = { series: SERIES_TITLE, books, ...(!args.public && { cast: castCatalog }) };
  const index = args.public ? publicIndex(catalog) : await sealIndex(pack.key, pack.kdf, catalog);
  await writeFile(path.join(lib.PACK, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
  let removed = 0;
  for (const name of await readdir(assetDir)) if (!used.has(name)) { await rm(path.join(assetDir, name)); removed++; }
  console.log(`${args.public ? 'Packed without a password' : 'Locked'} ${books.length} book(s) into ${path.relative(lib.ROOT, lib.PACK) || lib.PACK} (${used.size} files${removed ? `, removed ${removed} old` : ''}).`);
  if (skipped.length) console.log(`${args.allowIncomplete ? 'Included without all pictures' : 'Not included yet (pictures missing)'}: ${skipped.join(', ')}`);
}

async function main() {
  const args = lib.parseArgs(process.argv.slice(2).filter(flag => flag !== '--allow-incomplete'));
  args.allowIncomplete = process.argv.includes('--allow-incomplete');
  if (args.help) { console.log(HELP); return; }
  const env = lib.loadEnv();
  const cast = await loadCast();
  const names = { hero: cast.hero.name, sister: cast.sister.name };
  const books = args.books.length ? BOOKS.filter(book => args.books.includes(book.id)) : BOOKS;
  const missing = args.books.filter(id => !BOOKS.some(book => book.id === id));
  if (missing.length) throw new Error(`Unknown book: ${missing.join(', ')}. Ids: ${BOOKS.map(book => book.id).join(', ')}`);
  const unknownRoles = args.roles.filter(role => !DEFAULT_CAST[role]);
  if (unknownRoles.length) throw new Error(`Unknown role: ${unknownRoles.join(', ')}. Roles: ${Object.keys(DEFAULT_CAST).join(', ')}`);
  const steps = args.step === 'all' ? ['cast', 'art', 'audio', 'seal'] : args.step.split(',');
  if (args.public && (steps.length !== 1 || steps[0] !== 'seal' || args.newPassword)) {
    throw new Error('Use --public only with --step seal and without --new-password. This only packages existing files.');
  }
  const model = args.model || env.BOOKS_IMAGE_MODEL || 'google/gemini-3-pro-image';
  const need = name => { if (!env[name] && !args.dryRun) throw new Error(`${name} is not set. Add it to the environment or the project .env file.`); };
  if (steps.includes('cast') || steps.includes('art')) need('OPENROUTER_API_KEY');
  if (steps.includes('audio')) need('FISH_AUDIO_API_KEY');
  if (steps.includes('seal')) {
    if (!args.public) need('FAMILY_BOOKS_PASSWORD');
    if (cast.sister.name === DEFAULT_CAST.sister.name && !args.allowPlaceholderNames && !args.dryRun) {
      throw new Error('Put the real names in books/private/cast.json (copy books/cast.example.json) before packing the books.');
    }
  }
  const existingIndex = await lib.readJson(path.join(lib.PACK, 'index.json'));
  if ((env.FAMILY_BOOKS_PASSWORD || isPublicIndex(existingIndex)) && !args.dryRun && existingIndex && !args.newPassword) await restore(env, args);
  if (steps.includes('cast')) { console.log('Characters'); await makeCast(args, env, cast, rolesFor(books), model); }
  if (steps.includes('art')) { console.log(`Pictures (${model})`); for (const book of books) await makeArt(book, args, env, cast, names, model); }
  if (steps.includes('audio')) { console.log('Voice'); for (const book of books) await makeAudio(book, args, env, cast, names); }
  if (steps.includes('seal') && !args.dryRun) { console.log(args.public ? 'Packing for public reading' : 'Locking'); await seal(args, env, cast, names); }
  if (!args.dryRun) console.log(`Done: ${stats.images} new pictures (about $${stats.cost.toFixed(2)}), ${stats.clips} new voice clips.`);
}

main().catch(error => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
