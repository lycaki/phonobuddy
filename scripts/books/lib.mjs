// Helpers for scripts/books/generate.mjs: settings, files, image and voice APIs.
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
// The overrides let tests and trial runs use scratch folders.
const dir = (name, fallback) => (process.env[name] ? path.resolve(process.env[name]) : fallback);
export const PRIVATE = dir('BOOKS_PRIVATE_DIR', path.join(ROOT, 'books', 'private'));
export const WORK = dir('BOOKS_WORK_DIR', path.join(PRIVATE, 'work'));
export const PACK = dir('BOOKS_PACK_DIR', path.join(ROOT, 'public', 'books', 'family'));

// Keys come from the environment (cloud secrets) or a gitignored .env file in
// the project root (Russell's PC). The environment wins.
export function loadEnv() {
  const env = { ...process.env };
  const file = path.join(ROOT, '.env');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (!match || env[match[1]]) continue;
      env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  // Accept the other names people commonly use for the same keys.
  env.OPENROUTER_API_KEY ||= env.OPENROUTER_KEY || env.OPEN_ROUTER_API_KEY;
  env.FISH_AUDIO_API_KEY ||= env.FISH_API_KEY || env.FISH_AUDIO_KEY || env.FISHAUDIO_API_KEY;
  return env;
}

export function parseArgs(argv) {
  const args = { books: [], pages: [], step: 'all', force: false, dryRun: false, newPassword: false, allowPlaceholderNames: false };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = () => argv[++index];
    if (flag === '--book') args.books.push(value());
    else if (flag === '--pages') args.pages.push(...value().split(',').map(item => item.trim()));
    else if (flag === '--step') args.step = value();
    else if (flag === '--model') args.model = value();
    else if (flag === '--force') args.force = true;
    else if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--new-password') args.newPassword = true;
    else if (flag === '--allow-placeholder-names') args.allowPlaceholderNames = true;
    else if (flag === '--help' || flag === '-h') args.help = true;
    else throw new Error(`Unknown option ${flag}. Run with --help.`);
  }
  return args;
}

export const exists = existsSync;
export async function ensureDir(dir) { await mkdir(dir, { recursive: true }); return dir; }
export async function readJson(file, fallback = null) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; }
}
export async function writeJson(file, value) {
  await ensureDir(path.dirname(file));
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function listImages(dir) {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter(name => /\.(jpe?g|png|webp|heic)$/i.test(name)).sort().map(name => path.join(dir, name));
}

const MEDIA = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
export async function dataUrl(file, maxSide = 1536) {
  const { default: sharp } = await import('sharp');
  // Photos are shrunk and re-encoded so EXIF data (location, device) is not sent.
  const bytes = await sharp(file).rotate().resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString('base64')}`;
}
export const mediaType = file => MEDIA[path.extname(file).toLowerCase()] || 'application/octet-stream';

export async function toWebp(bytes, { width = 1600, quality = 76 } = {}) {
  const { default: sharp } = await import('sharp');
  return sharp(bytes).resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
}

export async function contactSheet(files, output, columns = 4) {
  const { default: sharp } = await import('sharp');
  const cell = 400;
  const height = 300;
  const rows = Math.ceil(files.length / columns);
  const tiles = await Promise.all(files.map(async (file, index) => ({
    input: await sharp(file).resize(cell, height, { fit: 'cover' }).toBuffer(),
    left: (index % columns) * cell,
    top: Math.floor(index / columns) * height,
  })));
  await sharp({ create: { width: columns * cell, height: rows * height, channels: 3, background: '#ffffff' } })
    .composite(tiles).jpeg({ quality: 80 }).toFile(output);
}

async function withRetry(label, run, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const retryable = error.retryable !== false && attempt < attempts;
      if (!retryable) throw error;
      const wait = 4000 * attempt;
      console.warn(`  ${label}: ${error.message}. Retrying in ${wait / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
}

function httpError(response, body) {
  const error = new Error(`HTTP ${response.status}: ${String(body).slice(0, 400)}`);
  error.retryable = response.status === 429 || response.status >= 500;
  return error;
}

export async function generateImage({ apiKey, model, prompt, references = [], aspectRatio = '4:3' }) {
  const body = { model, prompt, n: 1, aspect_ratio: aspectRatio };
  if (model.startsWith('openai/')) body.quality = 'high';
  else body.resolution = '2K';
  if (references.length) body.input_references = references.map(url => ({ type: 'image_url', image_url: { url } }));
  return withRetry(`image ${model}`, async () => {
    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lycaki.github.io/phonobuddy/',
        'X-Title': 'PhonoBuddy picture books',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300000),
    });
    const text = await response.text();
    if (!response.ok) throw httpError(response, text);
    const json = JSON.parse(text);
    const image = json.data?.[0];
    if (!image?.b64_json) {
      const error = new Error(`No image returned (${text.slice(0, 300)})`);
      error.retryable = false;
      throw error;
    }
    return { bytes: Buffer.from(image.b64_json, 'base64'), cost: json.usage?.cost ?? null };
  });
}

export async function speech({ apiKey, model, voice, text, speed = 0.9 }) {
  return withRetry('voice', async () => {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', model },
      body: JSON.stringify({ text, reference_id: voice || null, format: 'mp3', mp3_bitrate: 64, normalize: true, latency: 'normal', prosody: { speed } }),
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw httpError(response, await response.text());
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 200) throw new Error('Voice clip was empty.');
    return bytes;
  });
}
