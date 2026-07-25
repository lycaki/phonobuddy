import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PHONEMES, WORDS, TRICKY_WORDS } from '../src/data/phonemes.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicPrintablesDir = join(root, 'public', 'printables');
const productDir = join(root, 'monetization', 'products');
const docsDir = join(root, 'monetization');

const sampleSlug = 'phonobuddy-sample-pack';
const productSlug = 'phonobuddy-reception-phonics-starter-pack';

mkdirSync(publicPrintablesDir, { recursive: true });
mkdirSync(productDir, { recursive: true });
mkdirSync(docsDir, { recursive: true });

function byPhase(phase) {
  return PHONEMES.filter((p) => p.phase === phase);
}

function uniqueWordsForPhase(phase, max = 48) {
  const seen = new Set();
  return WORDS
    .filter((w) => w.phase === phase)
    .filter((w) => {
      if (seen.has(w.word)) return false;
      seen.add(w.word);
      return true;
    })
    .slice(0, max);
}

function groupIntoRows(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function graphemeLabel(phoneme) {
  if (phoneme.id === 'oo_long') return 'oo as in moon';
  if (phoneme.id === 'oo_short') return 'oo as in book';
  return phoneme.grapheme;
}

function css() {
  return `
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #172033;
      background: #f7f3ea;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.35;
    }
    .page {
      min-height: 268mm;
      page-break-after: always;
      padding: 8mm;
      background: #fffdf7;
      border: 1px solid #e3d8c4;
    }
    .page:last-child { page-break-after: auto; }
    h1, h2, h3 { margin: 0; color: #172033; }
    h1 { font-size: 34px; letter-spacing: 0; }
    h2 { font-size: 24px; margin-bottom: 12px; }
    h3 { font-size: 16px; margin-bottom: 8px; }
    p { margin: 0 0 10px; }
    .muted { color: #667085; }
    .small { font-size: 11px; }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 24px;
      background: linear-gradient(135deg, #fff7df 0%, #eaf7f5 100%);
      border: 2px solid #172033;
    }
    .cover-badge {
      display: inline-block;
      width: fit-content;
      padding: 8px 12px;
      border: 2px solid #172033;
      border-radius: 999px;
      background: #ffd966;
      font-weight: 700;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-top: 26px;
    }
    .cover-tile {
      min-height: 44px;
      display: grid;
      place-items: center;
      border: 2px solid #172033;
      border-radius: 8px;
      background: #ffffff;
      font-size: 24px;
      font-weight: 700;
    }
    .routine {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 12px;
    }
    .box {
      border: 1px solid #d9ccba;
      border-radius: 8px;
      padding: 12px;
      background: #ffffff;
    }
    .sound-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 9px;
    }
    .sound-card {
      min-height: 74px;
      border: 2px solid #172033;
      border-radius: 8px;
      background: #ffffff;
      padding: 8px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      break-inside: avoid;
    }
    .sound-main {
      font-size: 30px;
      font-weight: 800;
      line-height: 1;
    }
    .sound-meta {
      font-size: 10px;
      color: #667085;
    }
    .word-ladder {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .word-ladder td, .word-ladder th {
      border: 1px solid #d9ccba;
      padding: 8px;
      text-align: center;
      font-size: 18px;
    }
    .word-ladder th {
      background: #eaf7f5;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .trace-row {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #e5ddcf;
      padding: 10px 0;
    }
    .trace-word {
      font-size: 30px;
      font-weight: 800;
    }
    .trace-lines {
      height: 38px;
      background:
        linear-gradient(to bottom, transparent 0 31px, #aeb7c4 31px 32px, transparent 32px),
        repeating-linear-gradient(to right, transparent 0 22px, rgba(23,32,51,0.12) 22px 23px);
    }
    .tracker {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .tracker th, .tracker td {
      border: 1px solid #cfc4b4;
      height: 30px;
      text-align: center;
      font-size: 12px;
    }
    .tracker th { background: #fff1c7; }
    .cutline { border-top: 1px dashed #8a94a6; margin: 10px 0; }
    .footer {
      margin-top: 14px;
      color: #667085;
      font-size: 10px;
    }
    @media screen {
      body { padding: 24px; }
      .page {
        max-width: 794px;
        margin: 0 auto 24px;
        box-shadow: 0 20px 60px rgba(23,32,51,0.14);
      }
    }
  `;
}

function coverPage({ sample }) {
  const tiles = byPhase(2).slice(0, 18).map((p) => `<div class="cover-tile">${escapeHtml(p.grapheme)}</div>`).join('');
  return `
    <section class="page cover">
      <div>
        <div class="cover-badge">${sample ? 'Free sample' : 'Printable classroom and home pack'}</div>
        <h1 style="margin-top: 28px;">PhonoBuddy Reception Phonics Starter Pack</h1>
        <p style="font-size: 18px; max-width: 560px; margin-top: 14px;">
          Short, practical worksheets for daily sound recognition, blending, tricky words, and parent-led practice.
        </p>
        <div class="cover-grid">${tiles}</div>
      </div>
      <div>
        <p><strong>Includes:</strong> sound cards, blending ladders, word tracing, tricky word practice, and a 14-day routine.</p>
        <p class="muted small">Original PhonoBuddy resource. Designed for adult-supported Reception phonics practice.</p>
      </div>
    </section>
  `;
}

function routinePage() {
  return `
    <section class="page">
      <h2>How to use this pack</h2>
      <p>Use one short page at a time. Five calm minutes is better than a long session that becomes hard work.</p>
      <div class="routine">
        <div class="box"><h3>1. Say the sound</h3><p>Point to one card. Say the pure sound, then ask the child to repeat it.</p></div>
        <div class="box"><h3>2. Find it</h3><p>Ask the child to find the same grapheme in a word ladder or sentence.</p></div>
        <div class="box"><h3>3. Blend it</h3><p>Touch each sound from left to right, then sweep across and read the word.</p></div>
        <div class="box"><h3>4. Keep it light</h3><p>Stop while it is still going well. Put a tick in the tracker and come back tomorrow.</p></div>
      </div>
      <h2 style="margin-top: 24px;">14-day practice tracker</h2>
      <table class="tracker">
        <tr><th>Day</th><th>Sound</th><th>Words</th><th>Tricky word</th><th>Adult note</th></tr>
        ${Array.from({ length: 14 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`).join('')}
      </table>
      <p class="footer">Tip: If a word is hard, return to the sound cards. Confidence comes from small repetitions.</p>
    </section>
  `;
}

function soundCardPages(phonemes, title) {
  return groupIntoRows(phonemes, 24).map((group, index) => `
    <section class="page">
      <h2>${escapeHtml(title)}${phonemes.length > 24 ? ` ${index + 1}` : ''}</h2>
      <div class="sound-grid">
        ${group.map((p) => `
          <div class="sound-card">
            <div class="sound-main">${escapeHtml(graphemeLabel(p))}</div>
            <div class="sound-meta">${escapeHtml((p.hint || '').replace(/[\u0080-\uffff]/g, '').trim()) || 'Say the sound clearly'}</div>
          </div>
        `).join('')}
      </div>
      <p class="footer">Cut these cards out or leave the page whole for quick pointing practice.</p>
    </section>
  `).join('');
}

function blendingPage(words, title) {
  const rows = groupIntoRows(words, 4);
  return `
    <section class="page">
      <h2>${escapeHtml(title)}</h2>
      <p>Touch each sound, then blend smoothly across the word.</p>
      <table class="word-ladder">
        <tr><th>Word 1</th><th>Word 2</th><th>Word 3</th><th>Word 4</th></tr>
        ${rows.map((row) => `
          <tr>
            ${Array.from({ length: 4 }, (_, i) => {
              const word = row[i];
              if (!word) return '<td></td>';
              const parts = word.phonemes.map((id) => PHONEMES.find((p) => p.id === id)?.grapheme || id).join(' - ');
              return `<td><strong>${escapeHtml(word.word)}</strong><br><span class="small muted">${escapeHtml(parts)}</span></td>`;
            }).join('')}
          </tr>
        `).join('')}
      </table>
    </section>
  `;
}

function tracingPage(words, title) {
  return `
    <section class="page">
      <h2>${escapeHtml(title)}</h2>
      <p>Read the word, say it in a sentence, then write it on the line.</p>
      ${words.map((word) => `
        <div class="trace-row">
          <div class="trace-word">${escapeHtml(word.word || word)}</div>
          <div class="trace-lines"></div>
        </div>
      `).join('')}
    </section>
  `;
}

function trickyWordsPage(words) {
  return `
    <section class="page">
      <h2>Tricky word practice</h2>
      <p>Read the word. Cover it. Write it. Check it. Circle the part that does not behave as expected.</p>
      ${words.slice(0, 16).map((word) => `
        <div class="trace-row">
          <div>
            <div class="trace-word">${escapeHtml(word.word)}</div>
            <div class="small muted">Tricky part: ${escapeHtml(word.trickyPart || 'spot it')}</div>
          </div>
          <div class="trace-lines"></div>
        </div>
      `).join('')}
    </section>
  `;
}

function makeHtml({ sample = false }) {
  const phase2 = byPhase(2);
  const phase3 = byPhase(3);
  const phase2Words = uniqueWordsForPhase(2, sample ? 20 : 44);
  const phase3Words = uniqueWordsForPhase(3, sample ? 16 : 48);
  const phase4Words = uniqueWordsForPhase(4, sample ? 0 : 44);
  const trickyWords = TRICKY_WORDS.filter((word) => word.phase <= (sample ? 3 : 4));
  const pages = [
    coverPage({ sample }),
    routinePage(),
    soundCardPages(sample ? phase2.slice(0, 12) : phase2, sample ? 'Sample Phase 2 sound cards' : 'Phase 2 sound cards'),
    sample ? '' : soundCardPages(phase3, 'Phase 3 sound cards'),
    blendingPage(phase2Words, sample ? 'Sample blending ladders' : 'Phase 2 blending ladders'),
    sample ? '' : blendingPage(phase3Words, 'Phase 3 blending ladders'),
    sample ? '' : blendingPage(phase4Words, 'Phase 4 word ladders'),
    tracingPage(phase2Words.slice(0, sample ? 8 : 14), sample ? 'Sample word writing' : 'Phase 2 word writing'),
    sample ? '' : tracingPage(phase3Words.slice(0, 14), 'Phase 3 word writing'),
    trickyWordsPage(trickyWords),
  ].filter(Boolean);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PhonoBuddy Reception Phonics Starter Pack</title>
  <style>${css()}</style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>
`;
}

function listingCopy() {
  return `# PhonoBuddy monetization pack

## Recommended first account

Use Payhip first if you want the lowest-friction storefront with digital delivery, card/PayPal checkout, and no monthly fee on the Free Forever plan. Gumroad is also simple, but its direct-link fee is higher.

## Product title

PhonoBuddy Reception Phonics Starter Pack - Printable Sound Cards, Blending Ladders and Tricky Word Practice

## Suggested price

USD $5 or GBP equivalent. If you want faster first sales, use "5+" pay-what-you-want on Payhip.

## Short description

A practical printable phonics pack for Reception / early reading practice. Includes sound cards, blending ladders, word writing pages, tricky word practice, and a simple 14-day home routine.

## Long description

This printable pack is built for short adult-supported phonics practice at home or in a small intervention group. It gives children repeated exposure to grapheme recognition, oral blending, word reading, and tricky word recall without needing a complicated setup.

Included:

- Phase 2 sound cards
- Phase 3 sound cards
- Phase 2 blending ladders
- Phase 3 blending ladders
- Phase 4 word ladders
- Word writing pages
- Tricky word practice
- 14-day practice tracker
- Parent routine page

Best for:

- Reception / Kindergarten phonics support
- Early readers who need extra blending practice
- Parents who want a simple daily routine
- Tutors and teachers needing quick intervention sheets

Notes:

- Digital download only.
- Original PhonoBuddy resource.
- This resource is not affiliated with any commercial phonics programme.

## Marketplace tags

phonics, reception phonics, kindergarten phonics, phase 2 phonics, phase 3 phonics, blending, tricky words, early reading, printable worksheets, sound cards

## Files to upload

- monetization/products/${productSlug}.pdf
- Optional preview: public/printables/${sampleSlug}.pdf

## Website link to paste after publishing

Update src/data/monetization.js with the Payhip, Gumroad, Ko-fi, Etsy, or TPT product URL.
`;
}

function chromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function printPdf(htmlPath, pdfPath) {
  const browser = chromePath();
  if (!browser) {
    console.warn(`No Chrome/Edge binary found; skipped PDF: ${pdfPath}`);
    return false;
  }
  const result = spawnSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${pdfPath}`,
    `file:///${htmlPath.replaceAll('\\', '/')}`,
  ], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.warn(`PDF generation failed for ${pdfPath}`);
    return false;
  }
  return true;
}

const sampleHtmlPath = join(publicPrintablesDir, `${sampleSlug}.html`);
const samplePdfPath = join(publicPrintablesDir, `${sampleSlug}.pdf`);
const productHtmlPath = join(productDir, `${productSlug}.html`);
const productPdfPath = join(productDir, `${productSlug}.pdf`);

writeFileSync(sampleHtmlPath, makeHtml({ sample: true }));
writeFileSync(productHtmlPath, makeHtml({ sample: false }));
writeFileSync(join(docsDir, 'listing-copy.md'), listingCopy());

printPdf(sampleHtmlPath, samplePdfPath);
printPdf(productHtmlPath, productPdfPath);

console.log('Generated monetization pack:');
console.log(`- ${sampleHtmlPath}`);
console.log(`- ${samplePdfPath}`);
console.log(`- ${productHtmlPath}`);
console.log(`- ${productPdfPath}`);
console.log(`- ${join(docsDir, 'listing-copy.md')}`);
