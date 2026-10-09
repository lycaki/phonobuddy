// Writes books/OVERVIEW.md, the readable overview of every story, from books/stories.mjs.
import { writeFile } from 'node:fs/promises';
import { BOOKS } from '../../books/stories.mjs';
import { LEVELS, SERIES_TITLE } from '../../books/style.mjs';

const names = { hero: 'Logan', sister: '[sister]' };
const fill = text => text.replaceAll('{hero}', names.hero).replaceAll('{sister}', names.sister);
const lines = [
  `# ${SERIES_TITLE}: story overview`,
  '',
  'Generated from `books/stories.mjs` by `npm run books:overview`. Twelve original picture books starring',
  'Logan, his sister, Dad, Mum and Dash the tiny dinosaur. Level 1 matches *Tiger\'s Fish*; each level adds',
  'the next set of ELS sounds. **Practise** words use the level\'s sounds, **tricky** words are common',
  'exception words, and **challenge** words are the ones a grown-up may need to help with.',
  '',
];
for (const [level, info] of Object.entries(LEVELS)) {
  lines.push(`## ${info.label}: ${info.detail}`, '');
  for (const book of BOOKS.filter(entry => String(entry.level) === level)) {
    lines.push(`### ${book.title}`, '', `*${fill(book.blurb)}*`, '',
      `- **Practise:** ${book.practise.join(', ')}`,
      `- **Tricky:** ${book.common.join(', ')}`,
      `- **Challenge:** ${book.challenge.map(fill).join(', ')}`,
      `- **Before reading:** ${fill(book.before)}`,
      `- **After reading:** ${book.after.map(fill).join(' / ')}`,
      '', `<details><summary>All ${book.pages.length} pages</summary>`, '');
    book.pages.forEach((page, index) => {
      const bubble = page.bubble ? ` *(${page.bubble.who === 'hero' ? names.hero : page.bubble.who === 'sister' ? names.sister : page.bubble.who === 'dashMum' ? 'Dash\'s mum' : page.bubble.who[0].toUpperCase() + page.bubble.who.slice(1)}: "${fill(page.bubble.text)}")*` : '';
      const words = page.words.length ? ` [in the picture: ${page.words.map(fill).join(', ')}]` : '';
      lines.push(`${index + 1}. ${fill(page.text)}${bubble}${words}`);
    });
    lines.push('', '</details>', '');
  }
}
await writeFile(new URL('../../books/OVERVIEW.md', import.meta.url), `${lines.join('\n')}\n`);
console.log(`Wrote books/OVERVIEW.md (${BOOKS.length} books).`);
