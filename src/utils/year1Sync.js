import { db, getAttempts } from './storage';
import { uploadAttemptEvent } from './cloudSync';
import { YEAR1_PROFILE } from '../data/year1Profile';

const inFlight = new Map();

// The saved attempt is the durable outbox. Acknowledgements are separate local
// settings, so retrying never changes the event or another device's history.
export function syncYear1Attempts(code) {
  if (inFlight.has(code)) return inFlight.get(code);
  const run = (async () => {
    while (true) {
      const attempts = await getAttempts(YEAR1_PROFILE.id);
      const keys = attempts.map(event => `year1Synced:${code}:${event.eventId}`);
      const acknowledgements = await db.settings.bulkGet(keys);
      const pending = attempts.filter((_, index) => !acknowledgements[index]);
      if (!pending.length) return;
      for (const event of pending) {
        await uploadAttemptEvent(code, event);
        await db.settings.put({ key: `year1Synced:${code}:${event.eventId}`, value: true });
      }
    }
  })().finally(() => inFlight.delete(code));
  inFlight.set(code, run);
  return run;
}
