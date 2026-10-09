// Content gate for the family picture books (books/stories.mjs).
//
// Checks structure, that every listed practise/common/challenge word is really
// in the book, and a conservative phonics-level heuristic: a word whose
// spelling needs sounds from a later level must be listed as a challenge word.
// It is a guard against slips, not a full decodability analyser.
import { BOOKS } from '../books/stories.mjs';
import { DEFAULT_CAST, LEVELS } from '../books/style.mjs';

const errors = [];
const fail = (book, message) => errors.push(`${book}: ${message}`);

// Common exception ("tricky") words taught by the end of the ELS Year 1 autumn
// term. Allowed at every level, like the "common words" box in school books.
const TRICKY = new Set(`a i the to no go into he she we me be was you they all are my her said have like so do some come
 were there little one when out what says here today put push pull full as has his is of oh their people mr mrs looked
 called asked could would should our house mouse water want any many again who where two school your by sure love does
 tall small ball wall call fall`.split(/\s+/).filter(Boolean));
const INTERJECTIONS = new Set(['mmm', 'hmm', 'shhh', 'zzz', 'aaah', 'uh', 'hee']);
// Regular plurals that the split-digraph pattern below would misread.
const PLURALS = new Set(['buses']);

// Spellings that look regular but use an alternative pronunciation taught later.
const LATER = new Set(`monkey mother brother oven front month nothing money honey wonder other another cover glove
 head bread ready feather heavy breakfast weather instead dead spread meant breath field piece chief brief thief
 soup group touch young country cousin shoulder find kind mind wild child behind old cold hold told most both open
 opens over only gold post ghost sold fold roll music unicorn human super giant magic gem gentle huge page germ giraffe
 ginger gym cage stage large orange change word work world earth learn early snow snowman snowball grow blow show slow
 low window yellow own bowl glow throw shadow pillow`.split(/\s+/).filter(Boolean));

// Grapheme -> level at which it is first taught in this series.
const TEAMS = [
  [/ay|ou|ie|ea/, 3],
  [/oy|ir|ue|aw(?![aeiouy])/, 4],
  [/^wh|ph|ew|oe|au|ey$/, 5],
];

function requiredLevel(word) {
  if (PLURALS.has(word)) return 1;
  if (LATER.has(word)) return 7;
  if (/^kn|^wr|^gn|mb$|tch|dge|[^aeiou]le$/.test(word)) return 7;
  if (/[^aeo]y$/.test(word) && word.length > 2) return 7;
  if (/c[eiy]/.test(word)) return 7;
  let level = 1;
  // Phase 3 graphemes that contain later-looking letters.
  const stripped = word.replace(/ear|air|ure|eer/g, '-');
  for (const [pattern, taught] of TEAMS) if (pattern.test(stripped)) level = Math.max(level, taught);
  // Split digraphs: vowel, one consonant, final e (plus s/d endings).
  if (/[aeiou][bcdfgklmnprstvz]e(s|d)?$/.test(word) && !/(ee|oe|ue|ie)(s|d)?$/.test(word)) level = Math.max(level, 6);
  return level;
}

const normalise = token => token.toLowerCase().replace(/[’']s$/, '').replace(/[^a-z]/g, '');
const tokens = text => text.split(/[\s—-]+/).map(normalise).filter(Boolean);
const fill = (text, cast) => text.replaceAll('{hero}', cast.hero.name).replaceAll('{sister}', cast.sister.name);
const inflections = word => [word, `${word}s`, `${word}es`, `${word}ed`, `${word}ing`, word.replace(/e$/, 'ing'), word.replace(/y$/, 'ies')];

const ids = new Set();
const castRoles = new Set(Object.keys(DEFAULT_CAST));
for (const book of BOOKS) {
  const name = book.id || '(missing id)';
  if (!/^[a-z0-9-]+$/.test(book.id || '')) fail(name, 'id must be lower-case words joined by hyphens');
  if (ids.has(book.id)) fail(name, 'duplicate id');
  ids.add(book.id);
  if (!LEVELS[book.level]) fail(name, `unknown level ${book.level}`);
  if (!book.title || !book.blurb || !book.before || book.after?.length < 3) fail(name, 'needs a title, a blurb, a before-reading question and three after-reading questions');
  if (book.pages.length < 12 || book.pages.length > 16) fail(name, `has ${book.pages.length} pages; keep to 12-16`);
  if (!book.cover?.scene) fail(name, 'needs a cover scene');
  for (const role of [...book.cast, ...(book.cover?.cast || [])]) if (!castRoles.has(role)) fail(name, `unknown cast role ${role}`);
  for (const number of book.retell) if (!Number.isInteger(number) || number < 1 || number > book.pages.length) fail(name, `retell page ${number} does not exist`);

  const maxWords = book.level <= 1 ? 10 : book.level === 2 ? 14 : 18;
  const allText = [book.title];
  book.pages.forEach((entry, index) => {
    const label = `page ${index + 1}`;
    for (const field of ['text', 'scene']) if (!entry[field]?.trim()) fail(name, `${label} needs ${field}`);
    if (tokens(entry.text).length > maxWords) fail(name, `${label} narration is longer than ${maxWords} words for level ${book.level}`);
    if (/\{(?!hero\}|sister\})[^}]*\}/.test(`${entry.text} ${entry.scene} ${entry.bubble?.text || ''}`)) fail(name, `${label} has an unknown placeholder`);
    for (const role of entry.cast) if (!castRoles.has(role)) fail(name, `${label} has unknown cast role ${role}`);
    if (entry.bubble) {
      if (!castRoles.has(entry.bubble.who) && entry.bubble.who !== 'snowman') fail(name, `${label} bubble speaker ${entry.bubble.who} is unknown`);
      if (tokens(entry.bubble.text).length > 8) fail(name, `${label} speech bubble is longer than eight words`);
      allText.push(entry.bubble.text);
    }
    if (entry.calm && !['top-left', 'top-right'].includes(entry.calm)) fail(name, `${label} calm corner must be top-left or top-right`);
    for (const word of entry.words) if (!/^[A-Za-z][A-Za-z' :!]*$/.test(word) || word.length > 24) fail(name, `${label} picture word "${word}" must be short letters only`);
    allText.push(entry.text);
  });

  const cast = DEFAULT_CAST;
  const words = new Set(allText.flatMap(text => tokens(fill(text, cast))));
  for (const list of ['practise', 'common', 'challenge']) {
    for (const word of book[list]) {
      if (!inflections(word.toLowerCase()).some(form => words.has(form))) fail(name, `${list} word "${word}" is not in the book`);
    }
  }

  const allowed = new Set([...TRICKY, ...INTERJECTIONS, ...book.common.map(normalise), ...book.challenge.flatMap(word => inflections(normalise(word))),
    ...Object.values(cast).flatMap(member => tokens(member.name))]);
  for (const word of words) {
    if (allowed.has(word)) continue;
    const needed = requiredLevel(word);
    if (needed > book.level) fail(name, `"${word}" needs level ${needed === 7 ? 'beyond 6' : needed}; rewrite it or list it as a challenge word`);
  }
}

if (BOOKS.length < 12) errors.push(`Expected at least 12 books, found ${BOOKS.length}.`);
for (const level of Object.keys(LEVELS)) {
  if (BOOKS.filter(book => String(book.level) === level).length < 2) errors.push(`Expected two books at level ${level}.`);
}

if (errors.length) {
  console.error('Picture book validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
const pages = BOOKS.reduce((total, book) => total + book.pages.length, 0);
console.log(`Picture books valid: ${BOOKS.length} books, ${pages} pages across ${Object.keys(LEVELS).length} levels.`);
