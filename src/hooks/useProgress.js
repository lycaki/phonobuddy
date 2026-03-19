import { useState, useEffect, useCallback, useRef } from 'react';
import { loadAllProgress, savePhonemeProgress, getSessionCount, setSessionCount as setSessionCountDb } from '../utils/storage';
import { getDefaultProgress, migrateProgress } from '../data/leitner';
import { isFirebaseConfigured } from '../utils/firebase';

export function useProgress(familyCode) {
  const [progress, setProgress] = useState({});
  const [sessionCount, setSessionCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, done, error
  const progressRef = useRef(progress);
  const sessionCountRef = useRef(sessionCount);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);

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

  // ─── CLOUD SYNC ───

  // Push progress to cloud (call after session ends)
  const syncToCloud = useCallback(async () => {
    if (!familyCode || !isFirebaseConfigured()) return;
    setSyncStatus('syncing');
    try {
      const { uploadProgress } = await import('../utils/cloudSync');
      await uploadProgress(familyCode, progressRef.current, sessionCountRef.current);
      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e) {
      console.error('[PhonoBuddy] Progress sync failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [familyCode]);

  // Pull progress from cloud (call on demand or on join)
  const syncFromCloud = useCallback(async () => {
    if (!familyCode || !isFirebaseConfigured()) return false;
    setSyncStatus('syncing');
    try {
      const { downloadProgress } = await import('../utils/cloudSync');
      const remote = await downloadProgress(familyCode);
      if (!remote) { setSyncStatus('idle'); return false; }

      // Merge: take the higher mastery level for each phoneme
      const merged = { ...progressRef.current };
      for (const [id, remoteProg] of Object.entries(remote.progress)) {
        const local = merged[id];
        if (!local || !local.introduced) {
          // Remote has it, local doesn't — take remote
          merged[id] = remoteProg;
          await savePhonemeProgress(id, remoteProg);
        } else if (remoteProg.introduced) {
          // Both have it — take higher mastery, more correct answers
          if ((remoteProg.mastery || 0) > (local.mastery || 0) ||
              (remoteProg.correct || 0) > (local.correct || 0)) {
            merged[id] = { ...local, ...remoteProg };
            await savePhonemeProgress(id, merged[id]);
          }
        }
      }

      const mergedCount = Math.max(sessionCountRef.current, remote.sessionCount || 0);
      setProgress(merged);
      setSessionCount(mergedCount);
      await setSessionCountDb(mergedCount);

      setSyncStatus('done');
      setTimeout(() => setSyncStatus('idle'), 2000);
      return true;
    } catch (e) {
      console.error('[PhonoBuddy] Progress pull failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return false;
    }
  }, [familyCode]);

  // Auto-sync progress to cloud whenever session count changes (= after each session)
  useEffect(() => {
    if (loaded && sessionCount > 0 && familyCode) {
      syncToCloud();
    }
  }, [sessionCount, loaded, familyCode, syncToCloud]);

  const resetAll = useCallback(async () => {
    const { db } = await import('../utils/storage');
    await db.progress.clear();
    await db.settings.clear();
    setProgress({});
    setSessionCount(0);
  }, []);

  return {
    progress, sessionCount, loaded,
    updatePhonemeProgress, incrementSessionCount, resetAll,
    syncToCloud, syncFromCloud, syncStatus,
  };
}
