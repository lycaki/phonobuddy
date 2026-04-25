// ─── READING STORIES ───
// Difficulty levels:
//   easy:   Phase 2 sounds (CVC), simple tricky words
//   medium: Phase 3 digraphs + tricky words at expected level
//   hard:   Phase 4 clusters, multi-syllable, pushing above level

export const STORIES = [
  // ─── EASY (Phase 2, CVC, ~Logan's comfort zone) ───
  {
    id: "sams_cat",
    title: "Sam and the Cat",
    difficulty: "easy",
    emoji: "🐱",
    description: "All CVC words — easy reading",
    sentences: [
      "Sam has a cat.",
      "The cat is on the mat.",
      "Sam pats the cat.",
      "The cat sits on Sam.",
      "Sam is sad. The cat ran!",
    ],
  },
  {
    id: "bobs_bug",
    title: "Bob's Bug",
    difficulty: "easy",
    emoji: "🐛",
    description: "Like the book Logan loves",
    sentences: [
      "Bob has a bug.",
      "The bug is in a jug.",
      "The bug ran up.",
      "Bob got the bug.",
      "Bob hugs the bug.",
    ],
  },
  {
    id: "pig_in_mud",
    title: "The Pig in the Mud",
    difficulty: "easy",
    emoji: "🐷",
    description: "Three letter words and 'the'",
    sentences: [
      "A pig sat in mud.",
      "The mud is wet.",
      "The pig is hot.",
      "A duck got in.",
      "The pig and duck have fun!",
    ],
  },
  {
    id: "red_hen",
    title: "Pat and the Hen",
    difficulty: "easy",
    emoji: "🐔",
    description: "Simple sentences, all known sounds",
    sentences: [
      "Pat has a red hen.",
      "The hen sat in a pen.",
      "Pat fed the hen a bun.",
      "The hen got an egg.",
      "Pat had the egg!",
    ],
  },

  // ─── MEDIUM (Phase 3 digraphs, tricky words) ───
  {
    id: "fish_ship",
    title: "The Fish and the Ship",
    difficulty: "medium",
    emoji: "🐟",
    description: "sh, ee, ai, oo digraphs",
    sentences: [
      "The ship is on the sea.",
      "A fish swims near the ship.",
      "I can see the fish jump.",
      "The fish has a long tail.",
      "The ship sails far away.",
    ],
  },
  {
    id: "night_light",
    title: "Night Light",
    difficulty: "medium",
    emoji: "🌙",
    description: "igh, ar, ee — bedtime words",
    sentences: [
      "It is dark at night.",
      "I see a light in the sky.",
      "It is the moon and the stars.",
      "A bright light shines down.",
      "I sleep tight in my bed.",
    ],
  },
  {
    id: "goat_and_frog",
    title: "The Goat and the Frog",
    difficulty: "medium",
    emoji: "🐐",
    description: "oa, igh, oo plus tricky 'they'",
    sentences: [
      "The goat had a coat.",
      "He ran down the road.",
      "He saw a frog on the path.",
      "The frog jumped up high.",
      "They had a hop and a play.",
    ],
  },

  // ─── HARD (Phase 4 clusters — push above his level) ───
  {
    id: "spring_trip",
    title: "The Spring Trip",
    difficulty: "hard",
    emoji: "🚂",
    description: "Consonant clusters — stretch reading",
    sentences: [
      "In spring we went on a trip.",
      "We took a fast train to the coast.",
      "The frost on the grass had gone.",
      "We stopped at a small shop.",
      "We had toast and a cold drink.",
      "The day was the best!",
    ],
  },
  {
    id: "twin_frogs",
    title: "The Twin Frogs",
    difficulty: "hard",
    emoji: "🐸",
    description: "Tougher words: jump, splash, pond",
    sentences: [
      "Two twin frogs jumped on a log.",
      "They had a contest to see who could leap the most.",
      "Frank jumped the longest, but he slipped and fell.",
      "His brother helped him stand back up.",
      "They had a splash in the pond.",
      "It was so much fun!",
    ],
  },
  {
    id: "lost_dog",
    title: "The Lost Dog",
    difficulty: "hard",
    emoji: "🐕",
    description: "Lots of clusters and tricky words",
    sentences: [
      "A small dog was lost in the park.",
      "He sat down and gave a sad bark.",
      "A kind girl heard him and stopped.",
      "She held his paw and read his tag.",
      "She took him back to his happy home.",
      "His family gave the girl a hug!",
    ],
  },
];

export const DIFFICULTIES = [
  { id: "easy",   label: "Easy",   color: "#7bc67e", emoji: "🟢", description: "All CVC words — Logan's comfort zone" },
  { id: "medium", label: "Medium", color: "#ffd966", emoji: "🟡", description: "Digraphs and tricky words — at his level" },
  { id: "hard",   label: "Hard",   color: "#e88d8d", emoji: "🔴", description: "Above his level — push him to grow!" },
];

export function getStoriesByDifficulty(difficulty) {
  return STORIES.filter(s => s.difficulty === difficulty);
}

// Total word count for a story (across all sentences)
export function getStoryWordCount(story) {
  return story.sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0);
}
