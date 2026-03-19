import { useState, useEffect, useCallback } from 'react';
import { loadAllProgress, savePhonemeProgress, getSessionCount, setSessionCount as setSessionCountDb } from '../utils/storage';
import { getDefaultProgress, migrateProgress } from '../data/leitner';

export function useProgress() {
  const [progress, setProgress] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const allProgress = await loadAllProgress();
      const count = await getSessionCount();

      // Migrate old box-based progress to new mastery levels
      const migrated = {};
      let needsSave = false;
      for (const [id, prog] of Object.entries(allProgress)) {
        const m = migrateProgress(prog);
        if (m !== prog) needsSave = true;
        migrated[id] = m;
      }
      if (needsSave) {
        for (const [id, prog] of Object.entries(migrated)) {
          await savePhonemeProgress(id, prog);
        }
      }

      setProgress(migrated);
      setSessionCount(count);
      setLoaded(true);
    }
    load();
  }, []);

  const updatePhonemeProgress = useCallback((id, updater) => {
    setProgress(prev => {
      const current = prev[id] || getDefaultProgress(id);
      const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      savePhonemeProgress(id, updated);
      return { ...prev, [id]: updated };
    });
  }, []);

  const incrementSessionCount = useCallback(() => {
    setSessionCount(c => {
      const newCount = c + 1;
      setSessionCountDb(newCount);
      return newCount;
    });
  }, []);

  const resetAll = useCallback(async () => {
    const { db } = await import('../utils/storage');
    await db.progress.clear();
    await db.settings.clear();
    setProgress({});
    setSessionCount(0);
  }, []);

  return { progress, sessionCount, loaded, updatePhonemeProgress, incrementSessionCount, resetAll };
}
