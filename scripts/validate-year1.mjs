import {
  YEAR1_BLOCKS,
  YEAR1_GPCS,
  YEAR1_PROFILE,
  YEAR1_PSEUDO_WORDS,
  YEAR1_WORDS,
  validateYear1Content,
} from '../src/data/year1Profile.js';
import { YEAR1_STORIES, storyWords, getStorySupportWords } from '../src/data/year1Stories.js';

const errors = validateYear1Content();
const ids = new Set();
for (const story of YEAR1_STORIES) {
  if (ids.has(story.id)) errors.push(`Duplicate story: ${story.id}`);
  ids.add(story.id);
  if (story.sentences.length < 6 || !story.question || !story.answer) errors.push(`Incomplete story: ${story.id}`);
  const words = storyWords(story);
  const allowedFocus = YEAR1_WORDS.filter(word => word.block <= story.block).map(word => word.word);
  for (const word of story.focus) {
    if (!words.includes(word) || !allowedFocus.includes(word)) errors.push(`Invalid focus ${word} in ${story.id}`);
  }
  for (const pseudo of YEAR1_PSEUDO_WORDS) {
    if (words.includes(pseudo.word)) errors.push(`Pseudo-word in reading material: ${story.id}`);
  }
  const support = getStorySupportWords(story);
  for (const future of YEAR1_WORDS.filter(word => word.block > story.block)) {
    if (words.includes(future.word) && !support.includes(future.word)) errors.push(`Unmarked future word ${future.word} in ${story.id}`);
  }
}
for (const block of YEAR1_BLOCKS) {
  const stories = YEAR1_STORIES.filter(story => story.block === block.id);
  if (stories.length < 6) errors.push(`Expected at least six stories for block ${block.id}`);
  for (const word of YEAR1_WORDS.filter(word => word.block === block.id)) {
    if (stories.filter(story => storyWords(story).includes(word.word)).length < 2) errors.push(`Need two stories for word: ${word.word}`);
  }
}

if (YEAR1_PROFILE.status !== 'provisional') {
  errors.push('The school profile must remain provisional until direct confirmation.');
}

if (YEAR1_BLOCKS.length !== 12) {
  errors.push(`Expected 12 teaching/review blocks, found ${YEAR1_BLOCKS.length}.`);
}

if (!YEAR1_PSEUDO_WORDS.every(item => item.creature && item.pseudo)) {
  errors.push('Every pseudo-word must use the creature convention.');
}

if (errors.length) {
  console.error('Year 1 content validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Year 1 content valid: ${YEAR1_GPCS.length} reviewed mappings, ` +
  `${YEAR1_WORDS.length} real words, ${YEAR1_PSEUDO_WORDS.length} parent-review-gated pseudo-words.`,
);
console.log(`${YEAR1_STORIES.length} original stories validated across ${YEAR1_BLOCKS.length} sections.`);
