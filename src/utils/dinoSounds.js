const STORAGE_KEY = 'phonobuddy:dino-sounds:v1';
let enabled;
let context;
let active;
let generation = 0;
let lastRoar = -Infinity;
const voices = new Set();

export function dinoSoundsEnabled() {
  if (enabled === undefined) {
    try { enabled = localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { enabled = true; }
  }
  return enabled;
}

export function stopDinoRoar() {
  generation++;
  active?.();
  active = null;
}

export function setDinoSoundsEnabled(value) {
  enabled = Boolean(value);
  try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* Keep the in-memory choice. */ }
  if (!enabled) stopDinoRoar();
}

// The spoken-word players hold this until playback actually ends, even when
// their caller does not wait for the audio. Roars never queue behind a voice.
export function holdDinoSounds() {
  stopDinoRoar();
  const token = {};
  voices.add(token);
  return () => voices.delete(token);
}

export async function playDinoRoar() {
  if (!dinoSoundsEnabled() || voices.size || globalThis.speechSynthesis?.speaking || document.hidden) return false;
  const now = performance.now();
  if (now - lastRoar < 650) return false;
  stopDinoRoar();
  const token = generation;
  try {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return false;
    context ||= new AudioContext();
    if (context.state !== 'running') await context.resume();
    if (token !== generation || !dinoSoundsEnabled() || voices.size || document.hidden
      || context.state !== 'running' || performance.now() - now > 500 || globalThis.speechSynthesis?.speaking) return false;
    lastRoar = now;
    const start = context.currentTime;
    const duration = 0.48;
    const voice = context.createOscillator();
    const rumble = context.createOscillator();
    const wobble = context.createGain();
    const filter = context.createBiquadFilter();
    const volume = context.createGain();
    // A short rising-and-falling cartoon growl, softly capped and faded.
    voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(135, start);
    voice.frequency.exponentialRampToValueAtTime(210, start + 0.12);
    voice.frequency.exponentialRampToValueAtTime(85, start + duration);
    rumble.frequency.value = 32;
    wobble.gain.value = 22;
    rumble.connect(wobble).connect(voice.frequency);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, start);
    filter.frequency.exponentialRampToValueAtTime(320, start + duration);
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(0.065, start + 0.035);
    volume.gain.setValueAtTime(0.05, start + 0.2);
    volume.gain.linearRampToValueAtTime(0, start + duration);
    voice.connect(filter).connect(volume).connect(context.destination);
    const cleanup = () => { voice.disconnect(); rumble.disconnect(); wobble.disconnect(); filter.disconnect(); volume.disconnect(); };
    const stop = () => { volume.gain.cancelScheduledValues(context.currentTime); volume.gain.value = 0; cleanup(); };
    active = stop;
    voice.onended = () => { cleanup(); if (active === stop) active = null; };
    voice.start(start);
    rumble.start(start);
    voice.stop(start + duration);
    rumble.stop(start + duration);
    return true;
  } catch {
    stopDinoRoar();
    return false;
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopDinoRoar(); });
}
