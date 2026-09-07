import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, getAttempts, getSetting, saveAttempt, saveAttempts, setSetting } from '../utils/storage';
import { YEAR1_BLOCKS, YEAR1_PROFILE } from '../data/year1Profile';
import { isFirebaseConfigured } from '../utils/firebase';
import { chooseSessionItems } from '../utils/year1Session';

function makeEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `y1-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useYear1Progress(familyCode) {
  const [attempts, setAttempts] = useState([]);
  const [selectedBlock, setSelectedBlockState] = useState(0);
  const [pseudoApproved, setPseudoApprovedState] = useState(false);
  const [autoProgress, setAutoProgressState] = useState(false);
  const [batchOffsets, setBatchOffsets] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const syncInBackground = useCallback(() => {
    if (!familyCode || !isFirebaseConfigured()) return;
    import('../utils/year1Sync').then(({ syncYear1Attempts }) => syncYear1Attempts(familyCode))
      .catch(error => console.warn('[PhonoBuddy] Attempts saved locally; sync will retry.', error));
  }, [familyCode]);

  useEffect(() => {
    if (!loaded) return;
    syncInBackground();
    window.addEventListener('online', syncInBackground);
    const timer = window.setInterval(syncInBackground, 60000);
    return () => {
      window.removeEventListener('online', syncInBackground);
      window.clearInterval(timer);
    };
  }, [loaded, syncInBackground]);

  useEffect(() => {
    Promise.all([
      getAttempts(YEAR1_PROFILE.id),
      getSetting('year1SelectedBlock', 0),
      getSetting('year1PseudoApproved', false),
      getSetting('year1AutoProgress', false),
      getSetting('year1BatchOffsets', {}),
    ]).then(([savedAttempts, block, approved, auto, offsets]) => {
      setAttempts(savedAttempts);
      setSelectedBlockState(YEAR1_BLOCKS.some(entry => entry.id === Number(block)) ? Number(block) : 0);
      setPseudoApprovedState(Boolean(approved));
      setAutoProgressState(Boolean(auto));
      setBatchOffsets(offsets || {});
    }).catch(() => setError('Saved practice could not be opened. Close other PhonoBuddy tabs and reload. Do not clear website data.'))
      .finally(() => setLoaded(true));
  }, []);

  const setSelectedBlock = useCallback((block) => {
    const next = Number(block);
    if (!YEAR1_BLOCKS.some(entry => entry.id === next)) return;
    setSelectedBlockState(next);
    setSetting('year1SelectedBlock', next).catch(() => setError('The practice point could not be saved on this device.'));
  }, []);

  const setPseudoApproved = useCallback((approved) => {
    const next = Boolean(approved);
    setPseudoApprovedState(next);
    setSetting('year1PseudoApproved', next).catch(() => setError('The parent choice could not be saved on this device.'));
  }, []);

  const setAutoProgress = useCallback((enabled) => {
    setAutoProgressState(Boolean(enabled));
    setSetting('year1AutoProgress', Boolean(enabled)).catch(() => setError('Auto progression could not be saved on this device.'));
  }, []);

  const takeNextBatch = useCallback(async () => {
    const { items, offsets } = await db.transaction('rw', db.settings, async () => {
      const previous = (await db.settings.get('year1BatchOffsets'))?.value || {};
      const offset = Number(previous[selectedBlock]) || 0;
      const items = chooseSessionItems(selectedBlock, offset, pseudoApproved);
      const offsets = { ...previous, [selectedBlock]: offset + items.length };
      await db.settings.put({ key: 'year1BatchOffsets', value: offsets });
      return { items, offsets };
    });
    setBatchOffsets(offsets);
    return items;
  }, [selectedBlock, pseudoApproved]);

  const recordAttempt = useCallback(async ({
    itemId,
    itemType,
    mode,
    correct,
    retries,
    presentationReadyAt,
    firstInteractionAt,
  }) => {
    const timestamp = Date.now();
    const event = {
      eventId: makeEventId(),
      profileId: YEAR1_PROFILE.id,
      profileVersion: YEAR1_PROFILE.programmeVersion,
      itemId,
      itemType,
      mode,
      correct: Boolean(correct),
      retries: retries || 0,
      presentationReadyAt,
      firstInteractionAt: firstInteractionAt || null,
      latencyMs: firstInteractionAt && presentationReadyAt
        ? Math.max(0, firstInteractionAt - presentationReadyAt)
        : null,
      timestamp,
      device: navigator.userAgent.slice(0, 80),
    };

    await saveAttempt(event);
    setAttempts(previous => [...previous, event]);

    syncInBackground();
    return event;
  }, [syncInBackground]);

  const pullFromCloud = useCallback(async (codeOverride) => {
    const code = typeof codeOverride === 'string' ? codeOverride : familyCode;
    if (!code || !isFirebaseConfigured()) return 0;
    const { downloadAttemptEvents } = await import('../utils/cloudSync');
    const remote = await downloadAttemptEvents(code);
    await saveAttempts(remote);
    const merged = await getAttempts(YEAR1_PROFILE.id);
    setAttempts(merged);
    return remote.length;
  }, [familyCode]);

  const syncToCloud = useCallback(async () => {
    if (!familyCode || !isFirebaseConfigured()) throw new Error('Connect a family code first.');
    const { syncYear1Attempts } = await import('../utils/year1Sync');
    await syncYear1Attempts(familyCode);
  }, [familyCode]);

  const stats = useMemo(() => {
    const correct = attempts.filter(attempt => attempt.correct).length;
    const completedItems = new Set(attempts.filter(attempt => attempt.correct).map(attempt => attempt.itemId)).size;
    return {
      total: attempts.length,
      correct,
      completedItems,
      accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
    };
  }, [attempts]);

  return {
    attempts,
    selectedBlock,
    setSelectedBlock,
    pseudoApproved,
    autoProgress,
    setAutoProgress,
    batchOffsets,
    takeNextBatch,
    setPseudoApproved,
    recordAttempt,
    pullFromCloud,
    syncToCloud,
    stats,
    loaded,
    error,
  };
}
