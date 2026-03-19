import { getFirebaseDb } from './firebase';

// Characters excluding confusable ones: no O/0/I/1
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateFamilyCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Convert blob to base64 string for storage in Realtime Database
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data:audio/webm;base64, prefix — just store raw base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert base64 string back to blob
function base64ToBlob(base64, mimeType = 'audio/webm') {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

// Sanitise recording ID for Firebase path (no dots, brackets, $, #, /)
function sanitiseKey(id) {
  return id.replace(/[.#$/\[\]]/g, '_').replace(/:/g, '_');
}

// Reverse sanitisation: word_sat → word:sat
function unsanitiseKey(key) {
  return key.replace(/^(word)_/, '$1:');
}

// Upload a single recording
export async function uploadRecording(familyCode, recordingId, audioBlob) {
  const db = await getFirebaseDb();
  if (!db) return;

  const { ref, set } = await import('firebase/database');
  const safeKey = sanitiseKey(recordingId);
  const base64 = await blobToBase64(audioBlob);

  await set(ref(db, `recordings/${familyCode}/${safeKey}`), {
    audio: base64,
    type: audioBlob.type || 'audio/webm',
    size: audioBlob.size,
    updated: Date.now(),
  });
}

// Upload ALL local recordings in one go
export async function uploadAllRecordings(familyCode, getAllRecordingIds, getRecordingBlob, onProgress) {
  const db = await getFirebaseDb();
  if (!db) throw new Error('Firebase not configured');

  const ids = await getAllRecordingIds();
  let uploaded = 0;

  for (const id of ids) {
    const blob = await getRecordingBlob(id);
    if (blob && blob.size > 0) {
      await uploadRecording(familyCode, id, blob);
      uploaded++;
      if (onProgress) onProgress(uploaded, ids.length);
    }
  }

  return uploaded;
}

// Download a single recording
export async function downloadRecording(familyCode, recordingId) {
  const db = await getFirebaseDb();
  if (!db) return null;

  const { ref, get } = await import('firebase/database');
  const safeKey = sanitiseKey(recordingId);

  try {
    const snapshot = await get(ref(db, `recordings/${familyCode}/${safeKey}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return base64ToBlob(data.audio, data.type || 'audio/webm');
  } catch (e) {
    console.warn(`[PhonoBuddy] Download failed for ${recordingId}:`, e);
    return null;
  }
}

// List all remote recording IDs for a family code
export async function listRemoteRecordings(familyCode) {
  const db = await getFirebaseDb();
  if (!db) return [];

  const { ref, get } = await import('firebase/database');
  const snapshot = await get(ref(db, `recordings/${familyCode}`));
  if (!snapshot.exists()) return [];

  return Object.keys(snapshot.val()).map(unsanitiseKey);
}

// Download ALL recordings for a family code
export async function downloadAllRecordings(familyCode, onProgress) {
  const db = await getFirebaseDb();
  if (!db) throw new Error('Firebase not configured');

  const { ref, get } = await import('firebase/database');
  const snapshot = await get(ref(db, `recordings/${familyCode}`));
  if (!snapshot.exists()) return {};

  const data = snapshot.val();
  const keys = Object.keys(data);
  const recordings = {};
  let downloaded = 0;

  for (const key of keys) {
    const entry = data[key];
    if (entry && entry.audio) {
      const id = unsanitiseKey(key);
      recordings[id] = base64ToBlob(entry.audio, entry.type || 'audio/webm');
      downloaded++;
      if (onProgress) onProgress(downloaded, keys.length);
    }
  }

  return recordings;
}

// Validate a family code exists and has recordings
export async function validateFamilyCode(code) {
  const ids = await listRemoteRecordings(code);
  return ids.length > 0;
}

// ─── PROGRESS SYNC ───

// Upload all progress data to cloud
export async function uploadProgress(familyCode, progress, sessionCount) {
  const db = await getFirebaseDb();
  if (!db || !familyCode) return;

  const { ref, set } = await import('firebase/database');

  // Strip blobs/non-serialisable data, keep only progress state
  const cleanProgress = {};
  for (const [id, p] of Object.entries(progress)) {
    cleanProgress[sanitiseKey(id)] = {
      id: p.id,
      mastery: p.mastery || 0,
      correct: p.correct || 0,
      incorrect: p.incorrect || 0,
      streak: p.streak || 0,
      wrongStreak: p.wrongStreak || 0,
      introduced: p.introduced || false,
      lastSeen: p.lastSeen || null,
      lastSeenSession: p.lastSeenSession || null,
      assessments: (p.assessments || []).slice(-10), // keep last 10
    };
  }

  await set(ref(db, `progress/${familyCode}`), {
    phonemes: cleanProgress,
    sessionCount: sessionCount || 0,
    lastSynced: Date.now(),
    device: navigator.userAgent.slice(0, 50),
  });
}

// Download progress from cloud
export async function downloadProgress(familyCode) {
  const db = await getFirebaseDb();
  if (!db || !familyCode) return null;

  const { ref, get } = await import('firebase/database');
  const snapshot = await get(ref(db, `progress/${familyCode}`));
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  const progress = {};

  if (data.phonemes) {
    for (const [key, p] of Object.entries(data.phonemes)) {
      const id = unsanitiseKey(key);
      progress[id] = { ...p, id, box: p.mastery || 0 }; // legacy compat
    }
  }

  return {
    progress,
    sessionCount: data.sessionCount || 0,
    lastSynced: data.lastSynced,
  };
}

// Upload a single session result
export async function uploadSession(familyCode, sessionData) {
  const db = await getFirebaseDb();
  if (!db || !familyCode) return;

  const { ref, push } = await import('firebase/database');
  await push(ref(db, `sessions/${familyCode}`), {
    ...sessionData,
    device: navigator.userAgent.slice(0, 50),
  });
}
