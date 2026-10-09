// Shared by the picture-book reader and scripts/books so a tapped word always
// finds the clip that was generated for it.
export const wordKey = token => String(token).toLowerCase().replace(/[’‘]/g, '\'').replace(/[^a-z']/g, '').replace(/^'+|'+$/g, '');

export const fillNames = (text, names) => String(text)
  .replaceAll('{hero}', names.hero)
  .replaceAll('{sister}', names.sister);

export function bookWordKeys(texts) {
  const keys = new Set();
  for (const text of texts) for (const token of String(text).split(/[\s—-]+/)) {
    const key = wordKey(token);
    if (key && /[a-z]/.test(key)) keys.add(key);
  }
  return [...keys].sort();
}
