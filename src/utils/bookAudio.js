import { holdDinoSounds } from './dinoSounds';

// One shared audio element for picture-book clips. iPad Safari only lets a page
// start sound after a tap; once this element has played inside a tap, later
// clips (for example "Read to me" on the next page) can reuse it.
let element = null;
let primed = false;
let stopActive = null;

function silentWav() {
  const bytes = new Uint8Array(46);
  const view = new DataView(bytes.buffer);
  const text = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 38, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, 2, true);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

function audio() {
  element ||= new Audio();
  return element;
}

export function primeBookAudio() {
  try {
    if (primed || stopActive) return;
    primed = true;
    const player = audio();
    player.src = silentWav();
    Promise.resolve(player.play()).catch(() => {});
  } catch { /* Sound stays tap-to-play. */ }
}

export function stopBookAudio() {
  stopActive?.();
}

// Resolves true when the clip played to the end, false if it failed, timed out
// or was cancelled. onProgress(0..1) drives the follow-along word highlight.
export function playClip(url, { signal, onProgress } = {}) {
  stopBookAudio();
  if (!url || signal?.aborted) return Promise.resolve(false);
  return new Promise(resolve => {
    const player = audio();
    const release = holdDinoSounds();
    let settled = false;
    let frame = 0;
    const finish = played => {
      if (settled) return;
      settled = true;
      release();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      signal?.removeEventListener('abort', cancel);
      player.onended = null;
      player.onerror = null;
      if (!played) { try { player.pause(); } catch { /* Already stopped. */ } }
      if (stopActive === cancel) stopActive = null;
      resolve(played);
    };
    const cancel = () => finish(false);
    const timer = setTimeout(cancel, 30000);
    const tick = () => {
      if (player.duration > 0) onProgress?.(Math.min(1, player.currentTime / player.duration));
      frame = requestAnimationFrame(tick);
    };
    stopActive = cancel;
    signal?.addEventListener('abort', cancel, { once: true });
    player.onended = () => { onProgress?.(1); finish(true); };
    player.onerror = cancel;
    try {
      player.src = url;
      Promise.resolve(player.play()).then(() => { if (!settled) tick(); }).catch(cancel);
    } catch {
      cancel();
    }
  });
}

// Splits a line into word tokens and the share of the clip each one takes, so
// the highlight can follow a recorded line without word timestamps.
export function wordTimeline(words) {
  const weights = words.map(word => word.replace(/[^A-Za-z']/g, '').length + (/[.!?,…]$/.test(word) ? 4 : 1.5));
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let running = 0;
  return weights.map(weight => (running += weight) / total);
}
