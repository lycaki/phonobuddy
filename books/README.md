# Family picture books (Dash Adventures)

Twelve original picture books starring Logan, his sister, Dad, Mum and Dash, the
PhonoBuddy dinosaur, written in six phonics levels. Level 1 matches Logan's
school book *Tiger's Fish* (Phase 3: one or two short sentences a page) and each
level adds the next set of ELS sounds. The overview with every page is in
[OVERVIEW.md](./OVERVIEW.md).

The books show the family, so they are **private**: pictures, names and audio
are published only encrypted, and the app asks for the family password once
on each device. Never commit anything from `books/private/`.

| File | What it is |
|------|------------|
| `books/stories.mjs` | The 12 stories: page text, speech bubbles, art direction, in-picture words, word lists, questions |
| `books/style.mjs` | Art style, default cast and the prompt builders |
| `books/cast.example.json` | Template for `books/private/cast.json` (real names, ages, outfits) |
| `scripts/books/generate.mjs` | Draws characters and pages (OpenRouter), records audio (Fish Audio) and locks the pack |
| `scripts/validate-books.mjs` | Content gate, including a phonics-level check (`npm run validate:books`) |
| `src/utils/bookCrypto.js` | The encryption format shared by the generator and the app |
| `public/books/family/` | The encrypted output the app reads (safe to commit) |
| `books/private/` | Gitignored: `cast.json`, `photos/`, and the `work/` cache |

## Generating the books

1. **Keys.** Set these as cloud environment secrets/variables, or put them in the
   gitignored `.env` file in the project root:
   `OPENROUTER_API_KEY`, `FISH_AUDIO_API_KEY`, `FAMILY_BOOKS_PASSWORD`.
   The password is the one typed on the iPad; it is not case-sensitive.
2. **Cast.** Copy `books/cast.example.json` to `books/private/cast.json` and fill
   in the sister's name and age, everyone's usual outfit and a short description.
   Put one to four clear, front-facing photos of each person in
   `books/private/photos/hero/`, `sister/`, `dad/` and `mum/` (in a cloud session,
   Russell's Google Drive folder "PhonoBuddy cast" holds them). Photos are
   resized and stripped of EXIF data before they are sent to the image model.
3. **Check the plan:** `npm run books:generate -- --book big-green-egg --dry-run`
4. **Characters:** `npm run books:generate -- --step cast`, then look at
   `books/private/work/cast/*.webp`. Redo one with `--force` after changing its
   photos or description.
5. **Pilot one book:** `npm run books:generate -- --book big-green-egg --step art`.
   Check `books/private/work/big-green-egg/contact.jpg` and each page:
   - words in the picture spelled exactly, and no other text;
   - the same faces, clothes and Dash on every page;
   - nothing scary; the speech-bubble corner left clear;
   - the picture matches the words (it must not contradict what Logan decodes).
   Redraw single pages with `--pages 3,7` (or `--pages cover`).
6. **Voice:** `npm run books:voices -- --search "british female"`, listen on
   fish.audio, then set `FISH_AUDIO_VOICE_ID`. Run `--step audio`.
7. **Lock:** `npm run books:generate -- --step seal`. Only books with every
   picture are included (`--allow-incomplete` includes the rest with placeholders).
8. Do the other books (`--step cast,art,audio,seal` or plain `npm run books:generate`).
9. `npm run validate:books && npm run lint && npm test && npm run build`, commit
   `public/books/family/`, push and merge the pull request to deploy.

A fresh checkout restores earlier pictures and audio from the encrypted pack, so
a new session only draws what is missing or changed. Changing a page's scene
redraws only that page. `--new-password` re-locks everything with a new password
(every device must then enter it again).

**Cost:** each picture is about $0.14 with Nano Banana Pro (the default,
`google/gemini-3-pro-image`), so about $2.30 a book (cover plus 15 pages) and
roughly $28 for all twelve plus the characters. `--model google/gemini-nano-banana-2.1`
is about $0.04 a picture; `--model openai/gpt-image-2.5-flare` is the GPT Image 2.5
option. Fish Audio clips are tiny; the default model is `s2.1-pro-free`.

## Reading on the iPad

Stories > Family picture books > type the family password once. Each page fills
the screen with the words along the bottom. Tap a word to hear it (Dad's own
recording first, then the Fish Audio clip, then the iPad voice); tap the speaker
or the line to hear the whole sentence; "Read to me" reads every page aloud.
