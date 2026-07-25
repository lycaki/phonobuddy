import {
  YEAR1_BLOCKS,
  YEAR1_GPCS,
  YEAR1_PROFILE,
  YEAR1_PSEUDO_WORDS,
  YEAR1_WORDS,
  validateYear1Content,
} from '../src/data/year1Profile.js';

const errors = validateYear1Content();

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
