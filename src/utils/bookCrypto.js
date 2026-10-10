// Encryption for the private family picture books.
//
// Private packs store pictures, names and audio as AES-GCM ciphertext.
// A family password (PBKDF2, SHA-256)
// unlocks them on a device. The same module runs in the browser and in Node 20+
// (scripts/books), so the generator and the reader share one format:
//
//   books/family/index.json   public: KDF settings, password check, encrypted catalog
//   books/family/a/<hash>.bin one encrypted file per asset (book text, image, audio),
//                             named by the SHA-256 of its plain bytes so unchanged
//                             assets keep the same file between regenerations.

export const PACK_FORMAT = 'phonobuddy-family-books';
export const PUBLIC_PACK_FORMAT = 'phonobuddy-public-books';
export const PACK_VERSION = 1;
const CHECK_TEXT = 'phonobuddy family books';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

export class WrongPasswordError extends Error {
  constructor() { super('That family password did not unlock the books.'); this.name = 'WrongPasswordError'; }
}

// Forgiving on a tablet keyboard: case, extra spaces and auto-capitals do not matter.
export const normalisePassword = password => String(password).normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

export function toBase64(bytes) {
  let text = '';
  for (let index = 0; index < bytes.length; index += 0x8000) text += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(text);
}

export function fromBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function newKdf(iterations = 600000) {
  return { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(globalThis.crypto.getRandomValues(new Uint8Array(16))) };
}

export async function deriveKey(password, kdf) {
  if (kdf?.name !== 'PBKDF2' || !kdf.salt || !(kdf.iterations >= 1000)) throw new Error('Unsupported family book key settings.');
  const material = await subtle().importKey('raw', encoder.encode(normalisePassword(password)), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', hash: kdf.hash || 'SHA-256', iterations: kdf.iterations, salt: fromBase64(kdf.salt) },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptBytes(key, bytes) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const output = new Uint8Array(iv.length + sealed.length);
  output.set(iv);
  output.set(sealed, iv.length);
  return output;
}

export async function decryptBytes(key, bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (view.length < 29) throw new Error('Encrypted book file is incomplete.');
  return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: view.subarray(0, 12) }, key, view.subarray(12)));
}

export const encryptJson = (key, value) => encryptBytes(key, encoder.encode(JSON.stringify(value)));
export const decryptJson = async (key, bytes) => JSON.parse(decoder.decode(await decryptBytes(key, bytes)));

export async function sha256Hex(bytes) {
  const digest = new Uint8Array(await subtle().digest('SHA-256', bytes));
  return Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Asset references inside the encrypted book text: { h: file hash, t: media type }.
export const assetName = ref => `a/${ref.h}.bin`;

export const isPublicIndex = index => index?.format === PUBLIC_PACK_FORMAT;
export const publicIndex = (catalog, updated = new Date().toISOString().slice(0, 10)) => ({
  format: PUBLIC_PACK_FORMAT, version: PACK_VERSION, updated, catalog,
});

export async function sealIndex(key, kdf, catalog, updated = new Date().toISOString().slice(0, 10)) {
  return {
    format: PACK_FORMAT,
    version: PACK_VERSION,
    updated,
    kdf,
    check: toBase64(await encryptBytes(key, encoder.encode(CHECK_TEXT))),
    catalog: toBase64(await encryptJson(key, catalog)),
  };
}

export function assertIndex(index) {
  if (isPublicIndex(index) && index.version === PACK_VERSION && Array.isArray(index.catalog?.books)) return index;
  if (index?.format !== PACK_FORMAT || index.version !== PACK_VERSION || !index.kdf || !index.check || !index.catalog) {
    throw new Error('The family book list is not in a format this version of PhonoBuddy understands.');
  }
  return index;
}

export async function openIndex(index, key) {
  assertIndex(index);
  let check;
  try {
    check = decoder.decode(await decryptBytes(key, fromBase64(index.check)));
  } catch {
    throw new WrongPasswordError();
  }
  if (check !== CHECK_TEXT) throw new WrongPasswordError();
  return decryptJson(key, fromBase64(index.catalog));
}
