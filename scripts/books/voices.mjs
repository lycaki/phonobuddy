// Lists Fish Audio voices so a narrator can be chosen for the picture books.
//   npm run books:voices -- --search "british female"
import { loadEnv } from './lib.mjs';

const env = loadEnv();
const index = process.argv.indexOf('--search');
const search = index > -1 ? process.argv[index + 1] : 'british';
if (!env.FISH_AUDIO_API_KEY) {
  console.error('FISH_AUDIO_API_KEY is not set. Add it to the environment or the project .env file.');
  process.exit(1);
}
const url = new URL('https://api.fish.audio/model');
url.search = new URLSearchParams({ title: search, language: 'en', sort_by: 'score', page_size: '20', page_number: '1' });
const response = await fetch(url, { headers: { Authorization: `Bearer ${env.FISH_AUDIO_API_KEY}` } });
if (!response.ok) {
  console.error(`Fish Audio said HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  process.exit(1);
}
const { items = [], total = 0 } = await response.json();
console.log(`${total} voices match "${search}". Set FISH_AUDIO_VOICE_ID (or narrator.voice in books/private/cast.json) to the id you like.\n`);
for (const voice of items) {
  console.log(`${voice._id}  ${voice.title}  [${(voice.tags || []).slice(0, 5).join(', ')}]  likes ${voice.like_count ?? '?'}`);
  console.log(`  listen: https://fish.audio/m/${voice._id}`);
}
