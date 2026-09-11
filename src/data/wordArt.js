// Exact meanings only: do not guess illustrations for homographs or abstract words.
export const PICTURE_WORDS = ['frog', 'clock', 'fish', 'bird', 'house', 'mouse', 'ball', 'kite', 'boat', 'cloud', 'pie', 'lamb', 'cat', 'dog'];

export function getWordArt(word = '') {
  const key = word.toLowerCase().trim().replace(/^[^a-z]+|[^a-z]+$/g, '');
  return PICTURE_WORDS.includes(key) ? { key, file: `${key}-v1.webp` } : null;
}

export const artUrl = file => `${import.meta.env.BASE_URL}art/${file}`;
