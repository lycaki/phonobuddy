import { getSetting, setSetting } from './storage';

export const DEFAULT_READING_VOICE = { enabled: true, voiceURI: 'auto', rate: 0.9 };
let preferences;
let loading;
let requestId = 0;
let activeStop = null;

function normalise(value = {}) {
  return {
    enabled: value.enabled !== false,
    voiceURI: typeof value.voiceURI === 'string' ? value.voiceURI : 'auto',
    rate: Number.isFinite(value.rate) ? Math.min(1.15, Math.max(0.7, value.rate)) : 0.9,
  };
}

export async function getReadingVoicePreferences() {
  if (preferences) return preferences;
  loading ||= getSetting('readingVoicePreferences', DEFAULT_READING_VOICE)
    .then(value => { preferences = normalise(value || {}); return preferences; })
    .catch(() => ({ ...DEFAULT_READING_VOICE, enabled: false }));
  return loading;
}

export async function saveReadingVoicePreferences(value) {
  const next = normalise(value);
  await setSetting('readingVoicePreferences', next);
  preferences = next;
  return next;
}

export function getReadingVoices() {
  return globalThis.speechSynthesis?.getVoices().filter(voice => /^en(?:-|_)/i.test(voice.lang)) || [];
}

// Web Speech has no gender/quality fields. Recognised provider voice names are
// a preference, not a guarantee; the parent can preview and choose any English voice.
export function chooseReadingVoice(voices, voiceURI = 'auto') {
  const english = voices.filter(voice => /^en(?:-|_)/i.test(voice.lang));
  const selected = english.find(voice => voice.voiceURI === voiceURI);
  if (selected) return selected;
  const female = /\b(female|serena|kate|martha|stephanie|sonia|libby|hazel|susan|samantha|ava|allison|salli|joanna|zira|jenny|aria|emma)\b/i;
  const score = voice => (/^en[-_]GB/i.test(voice.lang) ? 1000 : 0)
    + (/premium|enhanced|natural|neural/i.test(voice.name) ? 100 : 0)
    + (voice.localService ? 10 : 0);
  return english.filter(voice => female.test(voice.name)).sort((a, b) => score(b) - score(a))[0] || null;
}

export function stopSpeaking() {
  requestId++;
  activeStop?.();
  globalThis.speechSynthesis?.cancel();
}

function waitForVoices(synth, signal) {
  if (getReadingVoices().length || signal?.aborted) return Promise.resolve();
  return new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      synth.removeEventListener('voiceschanged', finish);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, 1500);
    synth.addEventListener('voiceschanged', finish);
    signal?.addEventListener('abort', finish, { once: true });
  });
}

export async function speak(text, rate, { signal } = {}) {
  const synth = globalThis.speechSynthesis;
  if (!synth || !text?.trim() || signal?.aborted) return false;
  stopSpeaking();
  const currentRequest = requestId;
  const prefs = await getReadingVoicePreferences();
  if (!prefs.enabled || signal?.aborted || currentRequest !== requestId) return false;
  await waitForVoices(synth, signal);
  if (signal?.aborted || currentRequest !== requestId) return false;
  const voice = chooseReadingVoice(getReadingVoices(), prefs.voiceURI);
  // Do not silently substitute an arbitrary/robotic default or a different language.
  if (!voice) return false;
  return new Promise(resolve => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = rate ?? prefs.rate;
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      utterance.onend = null;
      utterance.onerror = null;
      if (activeStop === cancel) activeStop = null;
      resolve(success);
    };
    const cancel = () => { synth.cancel(); finish(false); };
    const timer = setTimeout(cancel, Math.min(60000, Math.max(10000, text.length * 200)));
    activeStop = cancel;
    signal?.addEventListener('abort', cancel, { once: true });
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    try { synth.speak(utterance); } catch { finish(false); }
  });
}
