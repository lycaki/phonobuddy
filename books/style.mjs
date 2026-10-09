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
// `looks` is only used when no reference photos are supplied.
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

export function castSheetPrompt(role, member, hasPhotos) {
  const who = hasPhotos
    ? `the person in the attached photos. Keep them clearly recognisable (face shape, hair colour and style, eye colour, skin tone, glasses or freckles if they have them) while stylising them as a friendly animated character${member.age ? ` aged ${member.age}` : ''}`
    : member.looks;
  return [
    `Character reference sheet for a picture book. Create ${who}.`,
    member.outfit ? `Outfit: ${member.outfit}.` : '',
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

export function pagePrompt({ scene, castLines, words = [], calm, cover = false, continuity = false }) {
  const text = words.length
    ? `The ONLY written words in the picture are: ${words.map(word => `"${word}"`).join(', ')}. Render each exactly once, spelled exactly as given, as big clear rounded letters that are part of the scene (a label tag with an arrow, a sign, or bold comic sound-effect lettering). No other letters, words, numbers, captions, speech bubbles, logos or watermarks anywhere.`
    : 'Do not include any written words, letters, numbers, speech bubbles, captions, logos or watermarks anywhere.';
  return [
    ART_STYLE,
    cover
      ? 'Book cover illustration, landscape 4:3, filling the whole frame. Keep the top third of the picture calm and simple (sky or soft background) because the book title will be placed there.'
      : 'Landscape 4:3 illustration that fills the whole frame edge to edge: no border, frame, panels or white margins. Keep the main action in the centre.',
    calm ? `Keep the ${calm.replace('-', ' ')} corner of the picture calm and simple, because a speech bubble will be placed there later.` : '',
    `Scene: ${scene}`,
    castLines.length ? `Characters (match the attached reference sheets exactly: faces, hair, clothes, colours and proportions): ${castLines.join(' ')}` : '',
    continuity ? 'The last attached image is the previous page of this book: keep the same setting, lighting, props and clothes where the scene continues.' : '',
    text,
  ].filter(Boolean).join('\n');
}
