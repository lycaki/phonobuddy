import Dexie from 'dexie';

export const db = new Dexie('phonobuddy');

db.version(2).stores({
  progress: 'id',          // phoneme progress records, keyed by phoneme ID
  recordings: 'phonemeId', // audio blobs, keyed by phoneme ID
  settings: 'key',         // key-value pairs: sessionCount, familyCode, etc.
  sessions: '++id, date',  // session history log, auto-incrementing ID
});

// --- Progress ---
export async function loadAllProgress() {
  const rows = await db.progress.toArray();
  const obj = {};
  for (const row of rows) {
    obj[row.id] = row;
  }
  return obj;
}

export async function savePhonemeProgress(id, data) {
  await db.progress.put({ ...data, id });
}

export async function saveBulkProgress(progressObj) {
  const rows = Object.entries(progressObj).map(([id, data]) => ({ ...data, id }));
  await db.progress.bulkPut(rows);
}

// --- Settings ---
export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key);
  return row ? row.value : defaultValue;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function getSessionCount() {
  return await getSetting('sessionCount', 0);
}

export async function setSessionCount(n) {
  await setSetting('sessionCount', n);
}

export async function getFamilyCode() {
  return await getSetting('familyCode', null);
}

export async function setFamilyCode(code) {
  await setSetting('familyCode', code);
}

// --- Recordings ---
export async function saveRecordingBlob(phonemeId, blob) {
  await db.recordings.put({ phonemeId, blob, timestamp: Date.now() });
}

export async function getRecordingBlob(phonemeId) {
  const row = await db.recordings.get(phonemeId);
  return row ? row.blob : null;
}

export async function getAllRecordingIds() {
  return await db.recordings.toCollection().primaryKeys();
}

// --- Sessions ---
export async function saveSession(sessionData) {
  await db.sessions.add({
    date: new Date().toISOString(),
    ...sessionData,
  });
}

export async function getSessionHistory(limit = 50) {
  return await db.sessions.orderBy('id').reverse().limit(limit).toArray();
}

export async function clearSessionHistory() {
  await db.sessions.clear();
}
