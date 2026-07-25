import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAttempts, getSetting, saveAttempt, saveAttempts, setSetting } from '../utils/storage';
import { YEAR1_PROFILE } from '../data/year1Profile';
import { isFirebaseConfigured } from '../utils/firebase';

function makeEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `y1-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useYear1Progress(familyCode) {
  const [attempts, setAttempts] = useState([]);
  const [selectedBlock, setSelectedBlockState] = useState(0);
  const [pseudoApproved, setPseudoApprovedState] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const attemptsRef = useRef(attempts);

  useEffect(() => { attemptsRef.current = attempts; }, [attempts]);

  useEffect(() => {
    Promise.all([
      getAttempts(YEAR1_PROFILE.id),
      getSetting('year1SelectedBlock', 0),
      getSetting('year1PseudoApproved', false),
    ]).then(([savedAttempts, block, approved]) => {
      setAttempts(savedAttempts);
      setSelectedBlockState(Number(block) || 0);
      setPseudoApprovedState(Boolean(approved));
      setLoaded(true);
    });
  }, []);

  const setSelectedBlock = useCallback((block) => {
    const next = Number(block);
    setSelectedBlockState(next);
    setSetting('year1SelectedBlock', next);
  }, []);

  const setPseudoApproved = useCallback((approved) => {
    const next = Boolean(approved);
    setPseudoApprovedState(next);
    setSetting('year1PseudoApproved', next);
  }, []);

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

    if (familyCode && isFirebaseConfigured()) {
      try {
        const { uploadAttemptEvent } = await import('../utils/cloudSync');
        await uploadAttemptEvent(familyCode, event);
      } catch (error) {
        console.warn('[PhonoBuddy] Year 1 attempt will remain local until the next pull/push.', error);
      }
    }
    return event;
  }, [familyCode]);

  const pullFromCloud = useCallback(async (codeOverride) => {
    const code = codeOverride || familyCode;
    if (!code || !isFirebaseConfigured()) return 0;
    const { downloadAttemptEvents } = await import('../utils/cloudSync');
    const remote = await downloadAttemptEvents(code);
    await saveAttempts(remote);
    const merged = await getAttempts(YEAR1_PROFILE.id);
    setAttempts(merged);
    return remote.length;
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
    setPseudoApproved,
    recordAttempt,
    pullFromCloud,
    stats,
    loaded,
  };
}
