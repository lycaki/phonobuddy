import { db, getSetting, setSetting } from './storage';
import { assetName, assertIndex, decryptBytes, decryptJson, deriveKey, openIndex } from './bookCrypto';

// The unlocked key is kept on this device only (never in backups or cloud sync).
export const FAMILY_KEY_SETTING = 'familyBooksKey';
export const bookmarkKey = id => `pictureBook:${id}`;
const url = path => `${import.meta.env.BASE_URL}books/family/${path}`;

export async function fetchFamilyIndex() {
  const response = await fetch(url('index.json'), { cache: 'no-cache' });
  // The dev server answers unknown files with the app page, not a 404.
  if (response.status === 404 || !(response.headers.get('content-type') || '').includes('json')) return null;
  if (!response.ok) throw new Error(`The family books could not be loaded (HTTP ${response.status}).`);
  return assertIndex(await response.json());
}

export async function unlockFamilyBooks(index, password, remember) {
  const key = await deriveKey(password, index.kdf);
  const catalog = await openIndex(index, key);
  let remembered = false;
  if (remember) {
    try {
      await setSetting(FAMILY_KEY_SETTING, { salt: index.kdf.salt, key });
      remembered = true;
    } catch { /* Some browsers cannot store keys; the password is asked again next time. */ }
  }
  return { key, catalog, remembered };
}

export async function openRememberedFamilyBooks(index) {
  let saved;
  try { saved = await getSetting(FAMILY_KEY_SETTING); } catch { return null; }
  if (!saved?.key || saved.salt !== index.kdf.salt) return null;
  try {
    return { key: saved.key, catalog: await openIndex(index, saved.key), remembered: true };
  } catch {
    await forgetFamilyBooks();
    return null;
  }
}

export async function forgetFamilyBooks() {
  try { await db.settings.delete(FAMILY_KEY_SETTING); } catch { /* Nothing stored. */ }
}

async function fetchAsset(ref) {
  const response = await fetch(url(assetName(ref)));
  if (!response.ok) throw new Error(`A book file is missing (HTTP ${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

export function createAssetLoader(key) {
  const urls = new Map();
  return {
    url(ref) {
      if (!ref?.h) return Promise.resolve(null);
      if (!urls.has(ref.h)) {
        const pending = fetchAsset(ref)
          .then(bytes => decryptBytes(key, bytes))
          .then(bytes => URL.createObjectURL(new Blob([bytes], { type: ref.t })));
        pending.catch(() => urls.delete(ref.h));
        urls.set(ref.h, pending);
      }
      return urls.get(ref.h);
    },
    async json(ref) {
      return decryptJson(key, await fetchAsset(ref));
    },
    dispose() {
      for (const pending of urls.values()) pending.then(objectUrl => URL.revokeObjectURL(objectUrl), () => {});
      urls.clear();
    },
  };
}

export async function loadBookmarks(ids) {
  const rows = await db.settings.bulkGet(ids.map(bookmarkKey));
  return Object.fromEntries(rows.filter(Boolean).map(row => [row.key.slice('pictureBook:'.length), row.value]));
}

export async function saveBookmark(id, update) {
  return db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get(bookmarkKey(id)))?.value || {};
    const value = { ...current, ...update(current) };
    await db.settings.put({ key: bookmarkKey(id), value });
    return value;
  });
}
