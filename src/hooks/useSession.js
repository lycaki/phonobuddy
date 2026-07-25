import { useState, useRef, useEffect, useCallback } from 'react';
import { PHONEMES, WORDS, getExpectedPosition } from '../data/phonemes';
import { shouldAppearInSession, calculateNewLevel, MASTERY_LEVELS } from '../data/leitner';
import { saveSession } from '../utils/storage';

// ─── GAP ANALYSIS ───
export function getCurriculumGap(progress) {
  const expected = getExpectedPosition();
  const expectedPhonemes = PHONEMES.filter(p => p.week <= expected.week);
  const introduced = PHONEMES.filter(p => progress[p.id]?.introduced);
  const introducedIds = new Set(introduced.map(p => p.id));
  const missingPhonemes = expectedPhonemes.filter(p => !introducedIds.has(p.id));

  // Use new mastery levels for struggling detection
  const struggling = introduced.filter(p => {
    const prog = progress[p.id];
    return prog && (prog.mastery || 0) <= 2;
  });

  const decodableWords = WORDS.filter(w => w.phonemes.every(p => introducedIds.has(p)));
  const expectedWordPhonemeIds = new Set(expectedPhonemes.map(p => p.id));
  const expectedWords = WORDS.filter(w => w.phonemes.every(p => expectedWordPhonemeIds.has(p)));

  const soundsBehind = missingPhonemes.length;
  let catchUpRate = 2;
  let catchUpMode = "on-track";
  if (soundsBehind > 20) { catchUpRate = 4; catchUpMode = "significant-gap"; }
  else if (soundsBehind > 10) { catchUpRate = 3; catchUpMode = "behind"; }
  else if (soundsBehind > 4) { catchUpRate = 3; catchUpMode = "slightly-behind"; }
  else if (soundsBehind > 0) { catchUpRate = 2; catchUpMode = "almost-there"; }

  // Mastery breakdown
  const masteryBreakdown = [0, 0, 0, 0, 0, 0]; // index 0 = not introduced, 1-5 = levels
  introduced.forEach(p => {
    const level = progress[p.id]?.mastery || 1;
    masteryBreakdown[level]++;
  });

  return {
    expected, expectedPhonemes, introduced, missingPhonemes, struggling,
    decodableWords, expectedWords, soundsBehind,
    weeksBehind: soundsBehind > 0 ? Math.ceil(soundsBehind / 3) : 0,
    catchUpRate, catchUpMode,
    currentPhase: introduced.length > 0 ? Math.max(...introduced.map(p => p.phase)) : 2,
    expectedPhase: expected.phase,
    weeksIn: expected.weeksIn,
    masteryBreakdown,
  };
}

export function useSession(progress, updatePhonemeProgress, incrementSessionCount, sessionCount) {
  const [sessionActivities, setSessionActivities] = useState([]);
  const [activityIndex, setActivityIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState([]);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [showBedTrick, setShowBedTrick] = useState(false);
  const [_bdErrorCount, setBdErrorCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionMode, setSessionMode] = useState("learn"); // "learn" or "assess"
  const timerRef = useRef(null);
  const resultsRef = useRef([]);
  const timerValRef = useRef(0);
  const activitiesRef = useRef([]);
  const activityIndexRef = useRef(0);
  const isAdvancingRef = useRef(false); // guard against double-fire
  const sessionModeRef = useRef("learn");
  const sessionCountRef = useRef(sessionCount);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive]);

  // Keep refs in sync — these are READ ONLY by timeouts/callbacks
  useEffect(() => { resultsRef.current = sessionResults; }, [sessionResults]);
  useEffect(() => { timerValRef.current = sessionTimer; }, [sessionTimer]);
  useEffect(() => { sessionModeRef.current = sessionMode; }, [sessionMode]);
  useEffect(() => { sessionCountRef.current = sessionCount; }, [sessionCount]);
  // NOTE: activitiesRef and activityIndexRef are updated SYNCHRONOUSLY below

  // ─── START LEARNING SESSION ───
  const startSession = useCallback((options = {}) => {
    const isShort = options.length === "short";
    const activities = [];
    const gap = getCurriculumGap(progress);
    const introducedIds = new Set(Object.entries(progress).filter(([, p]) => p.introduced).map(([id]) => id));

    // ── 1. WARM-UP: 2 mastered sounds (level 4-5) ──
    const mastered = PHONEMES.filter(p => (progress[p.id]?.mastery || 0) >= 4 && progress[p.id]?.introduced);
    mastered.sort(() => Math.random() - 0.5).slice(0, isShort ? 1 : 2).forEach(p => {
      activities.push({ type: "identify", phoneme: p });
    });

    // ── 2. LEVEL 1-2 SOUNDS: Must appear every session ──
    const level1and2 = PHONEMES.filter(p => {
      const prog = progress[p.id];
      return prog?.introduced && (prog.mastery || 0) <= 2;
    }).sort((a, b) => (progress[a.id]?.mastery || 0) - (progress[b.id]?.mastery || 0));

    level1and2.slice(0, isShort ? 1 : 4).forEach(p => {
      activities.push({ type: "identify", phoneme: p });
      // Level 1 gets shown twice
      if ((progress[p.id]?.mastery || 0) === 1) {
        activities.push({ type: "identify", phoneme: p });
      }
    });

    // ── 3. LEVEL 3 SOUNDS: Every 2nd session ──
    const level3 = PHONEMES.filter(p => {
      const prog = progress[p.id];
      return prog?.introduced && prog.mastery === 3 &&
        shouldAppearInSession(3, sessionCount || 0, prog.lastSeenSession);
    });
    level3.sort(() => Math.random() - 0.5).slice(0, isShort ? 1 : 2).forEach(p => {
      activities.push({ type: "identify", phoneme: p });
    });

    // ── 4. LEVEL 4 SOUNDS: Every 4th session ──
    const level4 = PHONEMES.filter(p => {
      const prog = progress[p.id];
      return prog?.introduced && prog.mastery === 4 &&
        shouldAppearInSession(4, sessionCount || 0, prog.lastSeenSession);
    });
    level4.sort(() => Math.random() - 0.5).slice(0, isShort ? 0 : 1).forEach(p => {
      activities.push({ type: "identify", phoneme: p });
    });

    // ── 5. CATCH-UP: New sounds ──
    const toIntroduce = gap.missingPhonemes
      .sort((a, b) => a.phase - b.phase || a.week - b.week || a.set - b.set)
      .slice(0, isShort ? Math.min(1, gap.catchUpRate) : gap.catchUpRate);

    toIntroduce.forEach(p => {
      activities.push({ type: "introduce", phoneme: p });
      activities.push({ type: "identify", phoneme: p });
    });

    // ── 6. BLENDING ──
    const allKnownIds = new Set([...introducedIds, ...toIntroduce.map(p => p.id)]);
    const doableWords = WORDS.filter(w => w.phonemes.every(p => allKnownIds.has(p)));
    const recentIds = new Set(toIntroduce.map(p => p.id));
    const wordsWithNewSounds = doableWords.filter(w => w.phonemes.some(p => recentIds.has(p)));
    const otherWords = doableWords.filter(w => !w.phonemes.some(p => recentIds.has(p)));

    const blendWords = [
      ...wordsWithNewSounds.sort(() => Math.random() - 0.5).slice(0, 2),
      ...otherWords.sort(() => Math.random() - 0.5).slice(0, 2),
    ].slice(0, isShort ? 2 : 3);
    blendWords.forEach(w => activities.push({ type: "blend", word: w }));

    // ── FIRST SESSION BOOTSTRAP ──
    if (activities.length === 0) {
      PHONEMES.filter(p => p.set === 1).forEach(p => {
        activities.push({ type: "introduce", phoneme: p });
      });
      activities.push({ type: "identify", phoneme: PHONEMES[0] });
      const w = WORDS.find(w => w.word === "sat");
      if (w) activities.push({ type: "blend", word: w });
    }

    // Update refs SYNCHRONOUSLY before setting state
    activitiesRef.current = activities;
    activityIndexRef.current = 0;
    isAdvancingRef.current = false;
    setSessionActivities(activities);
    setActivityIndex(0);
    setSessionResults([]);
    setSessionTimer(0);
    setBdErrorCount(0);
    setSessionMode("learn");
    setIsActive(true);
  }, [progress, sessionCount]);

  // ─── START ASSESSMENT SESSION ───
  const startAssessment = useCallback(() => {
    const activities = [];
    const introduced = PHONEMES.filter(p => progress[p.id]?.introduced);

    if (introduced.length === 0) return; // nothing to assess

    // Test all introduced sounds, prioritise those not recently assessed
    const sorted = introduced.sort((a, b) => {
      const pa = progress[a.id], pb = progress[b.id];
      const aLast = pa?.lastSeenSession || 0;
      const bLast = pb?.lastSeenSession || 0;
      return aLast - bLast; // oldest first
    });

    // Cap at 20 sounds per assessment (keep it ~5 min)
    sorted.slice(0, 20).forEach(p => {
      activities.push({ type: "identify", phoneme: p, isAssessment: true });
    });

    // Add some word blending tests too
    const knownIds = new Set(introduced.map(p => p.id));
    const doableWords = WORDS.filter(w => w.phonemes.every(p => knownIds.has(p)));
    doableWords.sort(() => Math.random() - 0.5).slice(0, 5).forEach(w => {
      activities.push({ type: "blend", word: w, isAssessment: true });
    });

    activitiesRef.current = activities;
    activityIndexRef.current = 0;
    isAdvancingRef.current = false;
    setSessionActivities(activities);
    setActivityIndex(0);
    setSessionResults([]);
    setSessionTimer(0);
    setBdErrorCount(0);
    setSessionMode("assess");
    setIsActive(true);
  }, [progress]);

  // Manual end session (exit button)
  const endSession = useCallback(() => {
    isAdvancingRef.current = false;
    setIsActive(false);
    incrementSessionCount();
    saveSession({
      duration: timerValRef.current,
      mode: sessionModeRef.current === "assess" ? "assessment" : "learning",
      activitiesCompleted: resultsRef.current.length,
      correct: resultsRef.current.filter(r => r.correct).length,
      incorrect: resultsRef.current.filter(r => !r.correct).length,
      newSoundsIntroduced: activitiesRef.current.filter(a => a.type === "introduce").map(a => a.phoneme?.grapheme).filter(Boolean),
      soundsReviewed: [],
      wordsTried: [],
      results: [],
    });
  }, [incrementSessionCount]);

  // ─── ADVANCE: the one function that moves to next activity ───
  // Uses refs directly, guarded against double-fire
  const doAdvance = useCallback(() => {
    const idx = activityIndexRef.current;
    const acts = activitiesRef.current;
    const nextIdx = idx + 1;

    if (nextIdx < acts.length) {
      // Update ref SYNCHRONOUSLY so next call sees the new value immediately
      activityIndexRef.current = nextIdx;
      isAdvancingRef.current = false;
      setActivityIndex(nextIdx);
    } else {
      isAdvancingRef.current = false;
      // End session
      setIsActive(false);
      incrementSessionCount();

      const results = resultsRef.current;
      const duration = timerValRef.current;
      const correct = results.filter(r => r.correct).length;
      const incorrect = results.filter(r => !r.correct).length;
      const newSounds = acts.filter(a => a.type === "introduce").map(a => a.phoneme.grapheme);
      const reviewedSounds = [...new Set(
        results.filter(r => r.activity?.type === "identify").map(r => r.activity.phoneme?.grapheme).filter(Boolean)
      )];
      const wordsTried = [...new Set(
        results.filter(r => r.activity?.type === "blend").map(r => r.activity.word?.word).filter(Boolean)
      )];

      saveSession({
        duration,
        mode: sessionModeRef.current === "assess" ? "assessment" : "learning",
        activitiesCompleted: results.length,
        correct, incorrect,
        newSoundsIntroduced: newSounds,
        soundsReviewed: reviewedSounds,
        wordsTried,
        results: results.map(r => ({
          type: r.activity?.type,
          target: r.activity?.type === "blend" ? r.activity.word?.word : r.activity.phoneme?.grapheme,
          correct: r.correct,
        })),
      });
    }
  }, [incrementSessionCount]);

  const advanceActivity = useCallback((delay = 500) => {
    if (isAdvancingRef.current) return; // already advancing — ignore duplicate
    isAdvancingRef.current = true;
    if (delay <= 0) {
      doAdvance();
    } else {
      setTimeout(doAdvance, delay);
    }
  }, [doAdvance]);

  const handleActivityResult = useCallback((correct, confusedId) => {
    if (isAdvancingRef.current) return; // guard against double-call

    const activity = activitiesRef.current[activityIndexRef.current];
    if (!activity) return;
    setSessionResults(prev => [...prev, { activity, correct }]);

    if (activity.type === "identify" && activity.phoneme) {
      const pid = activity.phoneme.id;
      const sc = sessionCountRef.current;
      const sm = sessionModeRef.current;
      updatePhonemeProgress(pid, current => {
        const newStreak = correct ? (current.streak || 0) + 1 : 0;
        const newWrongStreak = correct ? 0 : (current.wrongStreak || 0) + 1;
        const currentMastery = current.mastery || 1;
        const newMastery = calculateNewLevel(currentMastery, correct, newStreak, newWrongStreak);

        return {
          ...current,
          mastery: newMastery,
          box: newMastery,
          correct: (current.correct || 0) + (correct ? 1 : 0),
          incorrect: (current.incorrect || 0) + (correct ? 0 : 1),
          lastSeen: new Date().toISOString(),
          lastSeenSession: sc,
          streak: newStreak,
          wrongStreak: newWrongStreak,
          introduced: true,
          assessments: [
            ...(current.assessments || []).slice(-19),
            { date: new Date().toISOString(), correct, mode: sm },
          ],
        };
      });
    }

    // b/d confusion check
    if (!correct && confusedId && (confusedId === 'b' || confusedId === 'd')) {
      setBdErrorCount(c => {
        if (c + 1 >= 2) { setShowBedTrick(true); return 0; }
        return c + 1;
      });
    }

    advanceActivity(1200);
  }, [updatePhonemeProgress, advanceActivity]);

  const handleIntroComplete = useCallback((phoneme) => {
    if (isAdvancingRef.current) return; // guard

    const sc = sessionCountRef.current;
    updatePhonemeProgress(phoneme.id, current => ({
      ...current,
      introduced: true,
      mastery: 1,
      box: 1,
      lastSeen: new Date().toISOString(),
      lastSeenSession: sc,
    }));
    advanceActivity(500);
  }, [updatePhonemeProgress, advanceActivity]);

  // Manual skip — parent can force advance if stuck
  const skipActivity = useCallback(() => {
    isAdvancingRef.current = false; // reset guard so skip always works
    advanceActivity(0);
  }, [advanceActivity]);

  const timerColor = sessionTimer > 900 ? "#e88d8d" : sessionTimer > 600 ? "#f4a261" : "#7bc67e";

  return {
    sessionActivities, activityIndex, sessionResults, sessionTimer, timerColor,
    showBedTrick, setShowBedTrick, isActive, sessionMode,
    startSession, startAssessment, endSession,
    handleActivityResult, handleIntroComplete, skipActivity,
  };
}
