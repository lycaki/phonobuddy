// ─── 5-LEVEL MASTERY SYSTEM ───
// Each sound/word has a mastery level that controls how often it appears
//
// Level 1: Does not know          → every session, multiple times
// Level 2: Recognises sometimes   → every session, once
// Level 3: Knows but confuses     → every 2nd session
// Level 4: Nearly always right    → every 4th session
// Level 5: Signed off / mastered  → every 8th session (occasional check)

export const MASTERY_LEVELS = [
  { level: 1, label: "Does not know",         color: "#e88d8d", emoji: "🔴", sessionInterval: 1, timesPerSession: 2, description: "Show every session, multiple times" },
  { level: 2, label: "Recognises sometimes",  color: "#f4a261", emoji: "🟠", sessionInterval: 1, timesPerSession: 1, description: "Show every session, once" },
  { level: 3, label: "Knows but confuses",    color: "#ffd966", emoji: "🟡", sessionInterval: 2, timesPerSession: 1, description: "Show every 2nd session" },
  { level: 4, label: "Nearly always right",   color: "#7bc67e", emoji: "🟢", sessionInterval: 4, timesPerSession: 1, description: "Show every 4th session" },
  { level: 5, label: "Signed off",            color: "#4ecdc4", emoji: "⭐", sessionInterval: 8, timesPerSession: 1, description: "Occasional check-in" },
];

export function getMasteryLevel(level) {
  return MASTERY_LEVELS.find(m => m.level === level) || MASTERY_LEVELS[0];
}

// Determine if a sound should appear in this session based on its level
export function shouldAppearInSession(masteryLevel, sessionCount, lastSeenSession) {
  const config = getMasteryLevel(masteryLevel);
  if (lastSeenSession === null || lastSeenSession === undefined) return true; // never seen
  const sessionsSince = sessionCount - lastSeenSession;
  return sessionsSince >= config.sessionInterval;
}

// Calculate new mastery level based on assessment result
// correct = true/false, currentLevel = 1-5
export function calculateNewLevel(currentLevel, correct, consecutiveCorrect, consecutiveIncorrect) {
  if (!correct) {
    // Wrong answer: drop based on how many times wrong in a row
    if (consecutiveIncorrect >= 3) return 1; // 3 wrong in a row → level 1
    if (consecutiveIncorrect >= 2) return Math.max(1, currentLevel - 2);
    return Math.max(1, currentLevel - 1);
  }

  // Correct answer: promote based on consecutive correct streak
  if (currentLevel === 1 && consecutiveCorrect >= 2) return 2;   // 2 right → recognises
  if (currentLevel === 2 && consecutiveCorrect >= 3) return 3;   // 3 right → knows
  if (currentLevel === 3 && consecutiveCorrect >= 4) return 4;   // 4 right → nearly always
  if (currentLevel === 4 && consecutiveCorrect >= 5) return 5;   // 5 right → signed off

  return currentLevel; // stay at current level
}

export function getDefaultProgress(phonemeId) {
  return {
    id: phonemeId,
    mastery: 0,        // 0 = not introduced, 1-5 = mastery levels
    correct: 0,
    incorrect: 0,
    lastSeen: null,
    lastSeenSession: null,  // session number when last reviewed
    streak: 0,          // consecutive correct
    wrongStreak: 0,     // consecutive incorrect
    introduced: false,
    assessments: [],    // history of assessment results [{date, correct, context}]

    // Legacy compat
    box: 0,
  };
}

// Convert old box-based progress to new mastery levels
export function migrateProgress(prog) {
  if (prog.mastery && prog.mastery > 0) return prog; // already migrated

  if (!prog.introduced) return { ...prog, mastery: 0 };

  // Map old boxes to new levels
  const box = prog.box || 0;
  let mastery = 1;
  if (box >= 4 && prog.correct > 5) mastery = 5;
  else if (box >= 3) mastery = 4;
  else if (box >= 2) mastery = 3;
  else if (box >= 1 && prog.correct > prog.incorrect) mastery = 2;
  else mastery = 1;

  return { ...prog, mastery };
}
