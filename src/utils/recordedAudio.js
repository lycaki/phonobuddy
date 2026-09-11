import { holdDinoSounds } from './dinoSounds';

export function playRecordedAudio(url, { waitForEnd = false, signal, onStart } = {}) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise(resolve => {
    const audio = new Audio(url);
    const release = holdDinoSounds();
    let settled = false;
    const finish = (played) => {
      if (settled) return;
      settled = true;
      release();
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      audio.onended = null;
      audio.onerror = null;
      if (!played) audio.pause();
      resolve(played);
    };
    const abort = () => finish(false);
    const timer = setTimeout(abort, 12000);
    signal?.addEventListener('abort', abort, { once: true });
    audio.onended = () => finish(true);
    audio.onerror = abort;
    try {
      Promise.resolve(audio.play()).then(() => {
        if (settled || signal?.aborted) return;
        onStart?.();
        // Resolve early for legacy callers, but retain cancellation and the
        // voice priority guard until the actual end/error/timeout.
        if (!waitForEnd) resolve(true);
      }).catch(abort);
    } catch {
      abort();
    }
  });
}
