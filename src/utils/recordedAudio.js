export function playRecordedAudio(url, { waitForEnd = false, signal } = {}) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise(resolve => {
    const audio = new Audio(url);
    let settled = false;
    const finish = (played) => {
      if (settled) return;
      settled = true;
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
        if (!waitForEnd) finish(true);
      }).catch(abort);
    } catch {
      abort();
    }
  });
}
