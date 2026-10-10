// Shared art direction and default cast for the family picture books.
//
// Real names, looks and reference photos live in books/private/ (gitignored).
// Nothing in this file identifies the family beyond the placeholders below.

export const SERIES_TITLE = 'Dash Adventures';

export const LEVELS = {
  1: { label: 'Level 1', detail: 'Phase 3, like Tiger\'s Fish', colour: '#d64545' },
  2: { label: 'Level 2', detail: 'Phase 4: longer words', colour: '#d9a400' },
  3: { label: 'Level 3', detail: 'New sounds: ay ou ie ea', colour: '#3d8fd1' },
  4: { label: 'Level 4', detail: 'New sounds: oy ir ue aw', colour: '#3a9a48' },
  5: { label: 'Level 5', detail: 'New sounds: wh ph ew oe au ey', colour: '#e07b1f' },
  6: { label: 'Level 6', detail: 'Split sounds: a-e i-e o-e u-e e-e', colour: '#169e96' },
};

export const ART_STYLE = [
  'Polished 3D animated-film picture-book illustration for a children\'s early reading book (ages 5-6),',
  'in the look of a modern family animated feature: soft rounded forms, warm bright colours,',
  'gentle cinematic lighting, expressive friendly faces, tactile materials, clean uncluttered',
  'backgrounds with one clear focal point. Wholesome, funny and never frightening.',
].join(' ');

// The default cast. books/private/cast.json overrides any field.
// `looks` describes the person; with reference photos it tells the image model
// which features matter (hair worn loose, no glasses and so on).
export const DEFAULT_CAST = {
  hero: {
    name: 'Logan', pronoun: 'he', kind: 'person', age: 5,
    looks: 'a cheerful five-year-old boy',
    outfit: 'a red t-shirt with a small green dinosaur on the front, blue jeans and trainers',
  },
  sister: {
    name: 'Sister', pronoun: 'she', kind: 'person', age: 7,
    looks: 'a cheerful girl, his big sister',
    outfit: 'a yellow t-shirt dress with white spots, leggings and trainers',
  },
  dad: {
    name: 'Dad', pronoun: 'he', kind: 'person',
    looks: 'a friendly dad',
    outfit: 'a green jumper and jeans',
  },
  mum: {
    name: 'Mum', pronoun: 'she', kind: 'person',
    looks: 'a friendly mum',
    outfit: 'a blue-and-white striped top and jeans',
  },
  dash: {
    name: 'Dash', pronoun: 'he', kind: 'creature',
    looks: 'Dash, a tiny friendly dinosaur about the size of a kitten (he fits in two cupped hands): ' +
      'turquoise-green skin, rounded coral-orange back plates, big sparkly eyes, a wide happy grin ' +
      'with no sharp teeth, short arms, chunky little feet and a yellow neckerchief',
    // Page prompts only: without it he grows from page to page.
    scale: 'He is tiny, the size of a kitten, never taller than the knee of a small child, and the same size on every page',
    // The PhonoBuddy dinosaur mascot, so Dash matches the rest of the app.
    reference: 'public/art/dino-reader-v1.webp',
  },
  dashMum: {
    name: 'Dash\'s mum', pronoun: 'she', kind: 'creature',
    looks: 'Dash\'s mum: a gentle giant dinosaur as big as a bus who looks exactly like a grown-up Dash ' +
      '(turquoise-green skin, coral-orange back plates, kind eyes, no neckerchief)',
  },
};

export const PEOPLE = ['hero', 'sister', 'dad', 'mum'];

const LIKENESS = 'This is a real person and their family must recognise them at a glance, so do not swap in a generic cute face: ' +
  'keep their own face shape and the real proportions of their forehead, eyes, eyebrows, nose, mouth and jaw, their exact skin tone, ' +
  'and their hair colour, texture, length and style. The first photo is the best guide; where the photos differ, follow the description.';

// Without this the image model turns children into big-headed toddlers.
const proportions = member => (member.age && member.age < 13
  ? `They are ${member.age} years old and must look ${member.age}: the natural head and body proportions of a child that age in an animated feature film, never a baby, toddler, chibi or bobblehead, and the head is not oversized.`
  : 'Natural adult proportions.');

// People are drawn face first: a close portrait straight from the photos, then
// the full-body sheet from that portrait, so the likeness is not lost at small size.
export function personPortraitPrompt(member) {
  return [
    `Close-up head-and-shoulders portrait of the person in the attached photos${member.looks ? `: ${member.looks}` : ''}.`,
    'Their head and shoulders fill the frame, cropped at the chest: do not show the waist, legs or feet.',
    `Stylise them as a friendly animated character${member.age ? ` aged ${member.age}` : ''}, smiling warmly and looking at the viewer.`,
    LIKENESS,
    proportions(member),
    member.outfit ? `Outfit: ${member.outfit}.` : '',
    'Square format, soft pastel background.',
    ART_STYLE,
    'No text, letters, numbers, logos or watermarks.',
  ].filter(Boolean).join(' ');
}

export function castSheetPrompt(role, member, hasPhotos) {
  const who = hasPhotos
    ? `the character in the first attached image, which is the approved portrait of them${member.looks ? ` (${member.looks})` : ''}. Copy that face, hair, skin tone and outfit exactly in every view; the other attached images are photos of the real person, for their build and the back and sides of their hair`
    : member.looks;
  return [
    `Character reference sheet for a picture book. Create ${who}.`,
    member.outfit ? `Outfit: ${member.outfit}.` : '',
    hasPhotos ? proportions(member) : '',
    'Show the same character three times side by side: front view, three-quarter view and side view, full body, standing in a relaxed happy pose.',
    'Plain white background, even soft lighting, no props.',
    ART_STYLE,
    'No text, labels, letters, numbers, logos or watermarks.',
  ].filter(Boolean).join(' ');
}

export function portraitPrompt(member) {
  return [
    `Head-and-shoulders portrait of ${member.name === 'Dash' ? 'Dash the dinosaur' : 'this character'}, smiling warmly and looking at the viewer,`,
    'exactly matching the attached character reference sheet. Square format, soft pastel background.',
    ART_STYLE,
    'No text, letters, numbers, logos or watermarks.',
  ].join(' ');
}

export function pagePrompt({ scene, castLines, words = [], earlierWords = [], calm, cover = false, continuity = false }) {
  // The previous page is attached for continuity, and its lettering leaks through unless it is named and banned.
  const stale = earlierWords.filter(word => !words.includes(word));
  const blank = stale.length
    ? ` Earlier pages showed ${stale.map(word => `"${word}"`).join(', ')}: that lettering must not appear here, so any sign, label or box that carried it is now plain and blank.`
    : '';
  const text = words.length
    ? `The ONLY written words in the picture are: ${words.map(word => `"${word}"`).join(', ')}. Render each exactly once, spelled exactly as given, as big clear rounded letters that are part of the scene (a label tag with an arrow, a sign, or bold comic sound-effect lettering). No other letters, words, numbers, captions, speech bubbles, logos or watermarks anywhere.${blank}`
    : `Do not include any written words, letters, numbers, speech bubbles, captions, logos or watermarks anywhere: every sign, label, box and book in the picture is plain and blank.${blank}`;
  return [
    ART_STYLE,
    cover
      ? 'Book cover illustration, landscape 4:3, filling the whole frame as one continuous picture: no separate band, strip, border or split. Leave calm, simple space in the top third (plain wall, sky or soft background that belongs to the scene) because the book title will be placed there.'
      : 'Landscape 4:3 illustration that fills the whole frame edge to edge: no border, frame, panels or white margins. Keep the main action in the centre.',
    calm ? `Keep the ${calm.replace('-', ' ')} corner of the picture plain and uncluttered: background only, no faces or important objects there. Do not draw a speech bubble, thought bubble or text box anywhere.` : '',
    `Scene: ${scene}`,
    castLines.length ? `Characters (match the attached reference sheets exactly: faces, hair, clothes, colours and proportions): ${castLines.join(' ')}` : '',
    continuity ? 'The last attached image is the previous page of this book: keep the same setting, lighting, props and clothes where the scene continues. Where it disagrees with the reference sheets or the scene, the reference sheets and the scene win.' : '',
    text,
  ].filter(Boolean).join('\n');
}
