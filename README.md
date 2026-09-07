# PhonoBuddy

A public, tablet-first phonics app built for Logan. The original Reception
practice and Russell's recordings remain intact; the main child experience is
now **Year 1 Dino Road Builders**, aligned to a provisional Copnor / Essential
Letters and Sounds profile for 2026-27.

## Year 1 starting version

The September update below is the current behaviour. Earlier Reception notes
remain for reference; they are not the Year 1 progression rules.

- 69 reviewed grapheme-to-phoneme mappings across the public ELS Year 1 order.
- 72 independently authored real-word items and six parent-review-gated pseudo-words.
- One block represents one reviewed mapping; mappings can emit a sound sequence.
- Words are decoded before a vehicle or creature reveal.
- Creatures are reserved for pseudo-words, matching the screening convention.
- Pseudo-words remain disabled until a parent reviews and approves the visible bank.
- Split digraphs use true one-letter transformations such as `hop -> hope`.
- Dad remains the correctness judge. No ASR or lexical guessing is used.
- Year 1 never substitutes browser TTS for a missing phoneme or word recording.
- A returning device downloads missing cloud clips when its local sound bank is
  incomplete. Existing local recordings are never replaced by a download.
- Readiness checks the actual sounds needed for the next road, not a global
  clip count. Missing contextual `schwa`/voiced `th` are modelled by Dad, not TTS.
- Every attempt is append-only and records presentation time, first touch,
  verdict and retries. Latency is contextual, not mastery by itself.
- Parent controls can select any teaching block, skip a word, or start another
  batch at any time. Optional automatic progression is off by default.
- 36 original Year 1 stories cover all 12 sections; the 10 earlier stories remain.

The profile is `els-copnor-provisional-2026`. It records its programme, version,
source links, review date and provisional status in
`src/data/year1Profile.js`. Confirm the school's current programme and teaching
point in September before changing that status.

Run the content gate with:

```bash
npm run validate:year1
```

---

## 🌐 Live & Source

| What | Where |
|------|-------|
| **Live app** | https://lycaki.github.io/phonobuddy/ |
| **GitHub repo** | https://github.com/lycaki/phonobuddy |
| **Project folder (local)** | `C:\Users\russ\website_phonics\` |
| **Firebase project** | `phonobuddy-6bf48` ([console](https://console.firebase.google.com/project/phonobuddy-6bf48)) |
| **Family code (cloud sync)** | Stored on the family's devices; not published here |

---

## 🚀 Running it

### Local development
```bash
cd C:\Users\russ\website_phonics
npm install        # first time only
npm run dev        # → http://localhost:5173
```

### Build for production
```bash
npm run build      # output goes to dist/
npm run preview    # serves the built version locally
```

### Deploying to GitHub Pages (automatic)
Just push to `main` — GitHub Actions (`.github/workflows/deploy.yml`) auto-builds and deploys to https://lycaki.github.io/phonobuddy/

```bash
git add -A
git commit -m "what changed"
git push
```

Deploy takes ~1-2 minutes. Watch progress at https://github.com/lycaki/phonobuddy/actions

---

## 📁 Project structure

```
website_phonics/
├── README.md                    ← this file
├── package.json                 ← dependencies & scripts
├── vite.config.js               ← Vite build config (base path = /phonobuddy/)
├── eslint.config.js
├── index.html                   ← HTML entry point
├── .github/
│   └── workflows/
│       └── deploy.yml           ← GitHub Pages auto-deploy
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── check-recordings.html    ← diagnostic page (lists DB recordings)
└── src/
    ├── main.jsx                 ← React entry
    ├── App.jsx                  ← top-level app, screen routing
    ├── components/
    │   ├── BottomNav.jsx        ← bottom tab bar
    │   ├── Dashboard.jsx        ← progress dashboard with mastery breakdown
    │   ├── Reading.jsx          ← 📚 Story Time tab
    │   ├── WordPractice.jsx     ← 📝 Words tab (browse all words by phase)
    │   ├── SoundLibrary.jsx     ← 📖 Sounds tab
    │   ├── RecordingStudio.jsx  ← 🎙 Record sounds & words
    │   ├── QuickSetup.jsx       ← ⚡ Parent: batch-mark mastery, week override
    │   ├── Settings.jsx         ← family code, backup/restore, cloud sync
    │   ├── FamilyCode.jsx       ← cloud sync UI (create/join code)
    │   ├── SessionSummary.jsx   ← post-session results screen
    │   ├── SessionHistory.jsx   ← list of past sessions
    │   ├── BedTrick.jsx         ← b/d confusion mnemonic popup
    │   ├── PhonoBuddyOwl.jsx    ← animated owl mascot
    │   └── activities/
    │       ├── IntroduceSound.jsx   ← teach a new sound (4-step)
    │       ├── IdentifySound.jsx    ← multiple-choice sound quiz
    │       └── Blending.jsx         ← sound out & blend a word
    ├── data/
    │   ├── phonemes.js          ← all 48 phonemes + 170 words + curriculum timeline
    │   ├── leitner.js           ← 5-level mastery system + spaced repetition
    │   └── stories.js           ← 10 reading stories across 3 difficulties
    ├── hooks/
    │   ├── useProgress.js       ← progress state + cloud sync
    │   ├── useSession.js        ← session engine (activity scheduling)
    │   └── useRecordings.js     ← recording storage + playback
    ├── utils/
    │   ├── storage.js           ← IndexedDB wrapper (Dexie)
    │   ├── firebase.js          ← Firebase config & initialisation
    │   ├── cloudSync.js         ← upload/download recordings + progress
    │   └── speech.js            ← Web Speech API TTS fallback
    ├── styles/
    │   └── (CSS files)
    └── assets/
```

---

## 🎯 Features

### Reception foundation (preserved)
- **50 GPC entries** across the original Little Wandle-aligned Phases 2, 3, and 4
- **170+ words** spanning CVC → CCVC → CCVCC → CCCVC patterns
- **32 tricky words** (the, was, said, etc.) across all phases
- **Curriculum timeline**: maps every week of Reception year (Sep–Jul) to specific content
- **Auto-detects current week**: knows that mid-April = Week 28 = finishing Phase 3

### Sessions
- **Smart session builder**: schedules ~10-12 activities per session based on Logan's mastery
- **Three activity types**:
  - **Introduce** — teach a new sound (4-step explainer)
  - **Identify** — "which letter makes this sound?" multiple choice
  - **Blend** — sound out and read a word
- **Adaptive pacing**: catches up faster when behind (3-4 new sounds per session vs 2)
- **Manual Skip button** in case any activity gets stuck

### 5-level mastery system
| Level | Status | Frequency |
|-------|--------|-----------|
| 🔴 1 | Does not know | Every session, twice |
| 🟠 2 | Recognises sometimes | Every session |
| 🟡 3 | Knows but confuses | Every 2nd session |
| 🟢 4 | Nearly always right | Every 4th session |
| ⭐ 5 | Signed off | Every 8th session |

Promotion rules: 2 right → L2, 3 right → L3, 4 right → L4, 5 right → L5.
Demotion: 1 wrong drops a level; 3 wrong in a row drops to Level 1.

### 📚 Story Time (Reading tab)
- **10 stories** across 3 difficulty levels
- 🟢 Easy: Phase 2 CVC (Sam and the Cat, Bob's Bug, etc.)
- 🟡 Medium: Phase 3 digraphs (Fish & Ship, Night Light, etc.)
- 🔴 Hard: Phase 4 clusters (Spring Trip, Twin Frogs, etc.)
- One sentence per screen, big readable text
- **Tap any word** to hear it (uses recordings if available)
- Tracks how many times each story has been read

### 🎙 Recording Studio
- Record your voice for any sound or word
- Replaces robot TTS during sessions
- All recordings stored locally in IndexedDB AND backed up to Firebase

### ⚡ Quick Setup (parent override)
- **Cycle individual sounds** through mastery levels by tapping
- **Batch buttons**: "All Phase 2 signed off", "All Phase 3 needs work", etc.
- **Curriculum week slider**: pick any week 1-38, mark everything up to it as known
- **🚀 Catch up to today**: one-click "set to current week" — fixes progress resets

### 📋 Assessment Mode
- Separate "Test Logan" mode that tests up to 20 sounds + 5 words
- Prioritises sounds not recently tested
- Shows mastery report with each sound + result
- Available from home screen and post-session prompt

### ☁️ Cloud Sync (Firebase)
Enter the family's existing six-character code in Settings on a new device.

Auto-syncs:
- ✅ Sound recordings (manual upload, persistent)
- ✅ Word recordings (manual upload, persistent)
- ✅ Mastery levels (auto after every session)
- ✅ Session count, streaks, scores (auto)

Storage:
- **IndexedDB (local)** — instant access, full data
- **Firebase Realtime Database (free tier)** — base64-encoded audio + progress JSON

### 💾 Backup & Restore
- Export all recordings as JSON file (Settings → 📦 Backup)
- Restore from backup on any device
- Reset buttons for testing (clear progress / recordings / everything)

---

## 🔧 Tech stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + Vite |
| State | React hooks + Context API |
| Local storage | IndexedDB (via Dexie) |
| Cloud storage | Firebase Realtime Database (Spark/free plan) |
| Audio playback | Web Audio API (Blob → Audio URL) |
| TTS fallback | Web Speech API |
| Recording | MediaRecorder API |
| Hosting | GitHub Pages + GitHub Actions |
| Domain | https://lycaki.github.io/phonobuddy/ |

---

## 🔑 Firebase config

The Firebase API key is **public by design** for web apps — security comes from the Realtime Database rules. Configured in `src/utils/firebase.js`.

**Current database rules:** the family-code paths are publicly readable and
writable. A family code is an identifier, not authentication. The app now uses
timestamp-safe recording merges and append-only Year 1 events to reduce
accidental overwrites, but this is not a security boundary. Do not describe the
current Firebase data as private until authenticated family access is added.
```json
{
  "rules": {
    "recordings": {
      "$familyCode": {
        ".read": true,
        ".write": true
      }
    },
    "progress": {
      "$familyCode": {
        ".read": true,
        ".write": true
      }
    },
    "sessions": {
      "$familyCode": {
        ".read": true,
        ".write": true
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

To edit rules: https://console.firebase.google.com/project/phonobuddy-6bf48/database/rules

---

## 🧪 Diagnostic tools

### Check recordings in IndexedDB
Open https://lycaki.github.io/phonobuddy/check-recordings.html (or `/check-recordings.html` locally)

Shows:
- Total recordings count
- All sound recordings with byte size
- All word recordings with byte size
- A "Test play" button

### View session history
In the app: **📊 Progress** → scroll to session history at the bottom

---

## 🐛 Known issues / quirks

- **First run on a device**: recordings are TTS robot voice until you join a family code or restore a backup
- **Auto-play on iOS Safari**: Sometimes blocks first auto-play until user taps something. The 🔊 button is always there as a fallback
- **Reading history is local-only** — doesn't sync across devices yet (could be added)
- **Linter occasionally CRLF-warns** on Windows — harmless

---

## 📝 Common workflows

### Logan's progress reset (everything wiped)
1. Open app → Settings → enter the existing family code → Join → recordings + progress sync down
2. If only progress is gone: ⚡ Quick Setup → 🚀 Catch up to today
3. Done — back where he should be

### Want to push a fix
```bash
cd C:\Users\russ\website_phonics
# edit code
npm run build           # verify it builds
git add -A
git commit -m "what changed"
git push                # auto-deploys to live site in ~2 min
```

### Want to add another story
Edit `src/data/stories.js` → add new entry to the `STORIES` array → push.

### Want to add another phoneme/word
Edit `src/data/phonemes.js`:
- Add to `PHONEMES` array (with `id`, `grapheme`, `phase`, `set`, `week`, etc.)
- Add words to `WORDS` array referencing the phoneme IDs
- Push.

### Backup before risky changes
Settings → 📦 Backup Recordings → saves a JSON file with all 160+ recordings.

---

## 📊 Curriculum reference

UK Reception year (Sep 2025 – Jul 2026):

| Weeks | Phase | Content |
|-------|-------|---------|
| 1–6 (Sep–Oct) | Phase 2 | 23 single-letter sounds (s, a, t, p…) |
| 7–24 (Nov–Mar) | Phase 3 | 25 new sounds (digraphs: ch, sh, ai, ee, igh…) |
| 25–38 (Apr–Jul) | Phase 4 | Consonant clusters (CVCC, CCVC, CCVCC, CCCVC) |

Today's date logic: `getExpectedPosition()` in `src/data/phonemes.js` calculates the current week from `new Date()` against the Sep 1 2025 start.

---

## 🤖 Built with Claude

This app was built collaboratively with Claude Sonnet 4.5/4.6 over multiple sessions. Most commits include `Co-Authored-By: Claude` attribution.

---

*"Make Russell's life easier and help Logan succeed."*

---

## Monetization starter

PhonoBuddy now has a simple digital-product path:

- Run `npm run generate:monetization` to generate a full printable phonics pack, a free sample, and listing copy.
- Upload `monetization/products/phonobuddy-reception-phonics-starter-pack.pdf` to Payhip, Gumroad, Ko-fi, Etsy, or TPT.
- Paste the live product URL into `src/data/monetization.js`.
- The app's Parent Resources screen will link to the free sample and the paid product.

See `monetization/README.md` for the account setup workflow.

---

## Earlier update — 25 April 2026

Changes made to improve the app for a 5/6-year-old phonics reader while preserving saved recordings, progress, family-code sync, and existing storage:

- Added a simpler child-facing home screen with a default short session, while keeping longer sessions, assessment, Quick Setup, and catch-up detail in Parent view.
- Added short-session pacing so practice can finish sooner with fewer review items, fewer new sounds, and fewer blend words.
- Changed curriculum date logic to use teaching weeks with school-break weeks removed, so late-April catch-up pressure is not inflated by holidays.
- Made wrong answers gentler in normal practice by offering one listen-and-try-again moment before the result is recorded.
- Improved blending practice with tappable sound buttons, a slide-to-blend control, and child-facing grapheme display for sounds like long/short `oo`.
- Added air-writing/formation prompts when introducing a new sound.
- Improved Story Time with story readiness labels, "Read with help" / "Read myself" modes, and optional word help highlighting.
- Improved Word Practice with clearer tricky-word "remember this part" highlighting, common sound-pair practice, and child-facing sound labels.
- Added post-session parent feedback buttons: Too easy, Just right, Too hard, Tired. Feedback is saved in settings without changing the recordings table.
- Removed the duplicate `dig` word entry from the word practice data.
- Added timestamp-aware recording sync protection: bulk upload/download now skips older copies instead of overwriting newer cloud/device recordings for the same sound.
- Clarified reset wording so "delete recordings" and "wipe everything" are clearly local-device actions and do not delete cloud/iPad recordings.
- Recording backups now preserve original timestamps, so restoring an older backup will not make it look newer than recordings already saved in the cloud.

## Latest update - 7 September 2026

### Session and sync fixes

- Fixed `Pull progress` receiving a React click event as its family-code override.
  Settings now calls explicit wrappers and both progress hooks reject non-string
  overrides. This caused a misleading "Sync failed - check connection" message.
- Manual push/pull includes Reception progress AND Year 1 attempt history. Each
  has a bounded wait and a specific failure message; neither changes recordings.
- Joining/downloading recordings no longer fails just because progress sync
  fails afterwards. Existing families have a Download missing recordings button.
- Year 1 answers are saved locally before proceeding; cloud acknowledgement is
  no longer awaited by the game. Saved events act as a durable outbox, retried on
  startup, reconnection and periodically. Event IDs make retries idempotent.
- Prevented repeated taps and overlapping verdicts from skipping sound blocks or
  saving duplicate answers. Multi-sound blocks play sequentially. Blocked/failed
  audio gives a parent message; audio has a timeout and can be interrupted.
- Stop, skip and new batches cancel pending advancement/audio. Reception practice
  also rejects stale callbacks, cancels old advance timers and shows its summary
  even if every activity was skipped. Its first sound choices no longer reset
  every timer tick. Sound-road tap targets no longer move while waiting for a tap.
- Fixed the bottom navigation clipping Home/Settings off narrow phone screens.

### Manual and automatic progression

- Skip word is available during every Year 1 word, including before audio plays.
  Word Practice also has Skip word. Skips do not create a correct/incorrect attempt.
- The map, mission and completion screens have a numbered section picker,
  Previous section, Next section and Next batch. No completed score is required
  for manual selection. Missing recordings return the user to the recording check.
- Batch cursors are saved per section in `year1BatchOffsets`, independently of
  scores. Skipping or repeating a session does not continually pick the same first
  batch. Small banks necessarily repeat some words. Summer reviews the cumulative
  bank rather than falling back to only frog/clock/splash/twist.
- Optional Auto next section is saved as `year1AutoProgress`. At the end of a road,
  it advances at most one section if every real word in that section has two most
  recent correct attempts without retries. This is a family practice heuristic,
  not a school assessment. Manual selection remains available in either mode.

### Year 1 reading material

- Added `src/data/year1Stories.js`: three original stories for each of the 12
  sections, with all 72 section words appearing in their matching section.
- Short, one-sentence pages, optional recorded-word help, section-word highlighting,
  a conservative list of extra/support words, and one discussion question per story.
  Additional words are for shared reading, not claimed to be independently decodable.
- No guessed readiness percentage or automatic age/calendar unlock. The selected
  section is shared with practice; Phase 2-4 review is the starting point for a new
  device. Confirm the current school programme and teaching point with the teacher.
- The ELS public consolidation guidance supports beginning Year 1 with review:
  https://cdn.oxfordowl.co.uk/2022/06/22/09/21/32/91c4527f-89c9-4179-842e-6a80a58b9fcd/ELS_Y1_ConsolidatingLearning.pdf
  The Copnor 2026-27 profile remains provisional, not school-confirmed.
- Reading places and reread counts use new `year1Story:<story-id>` settings on
  this browser. They survive reloads but do not yet sync across devices. Existing
  `readingHistory` and all earlier story IDs are unchanged. Printable full-story
  layouts and a next-story route are included. Missing clips ask Dad to model the
  word; Year 1 does not use synthesized speech.

### Recording and data preservation

- The `phonobuddy` database name, versions 2/3, stores, sound IDs, `word:` IDs,
  family-code setting and cloud paths are unchanged. No data migration or reset.
- Downloads and JSON restores use an atomic missing-only merge. Bulk cloud uploads
  use an atomic Firebase transaction and never replace an existing cloud entry,
  even when a different device has a newer timestamp. This supersedes April's
  timestamp-only bulk merge policy.
- Intentionally recording a sound again still replaces that local sound and can
  update its cloud copy, subject to the timestamp check. Ordinary practice,
  publishing, downloads, restoring and bulk uploading never do that.
- Progress backups now include Year 1 attempts and reading settings. Local cloud
  acknowledgement keys are excluded, along with the family-code setting.
- Live investigation was read-only. Automated tests use synthetic recordings and
  mocked cloud services on an isolated local origin, never the real family code.
- Public Firebase rules remain a known security limitation, as described above.
  App-side preservation protects normal sync, not malicious writes to public paths.

### Verification and testing

```bash
npm ci
npx playwright install chromium webkit
npm run validate:year1
npm run lint
npm test
npm run build
```

The 16 automated tests cover two consecutive roads, rapid taps, offline/outbox
retry, failed local saves, audio failure, manual/automatic progression, the actual
Settings sync buttons, recording conflict preservation, reading resume and layouts
at phone/tablet/desktop widths. Chromium covers recording Blob persistence; Windows
WebKit's Blob storage fails in the test runtime, so its separate tests cover the
reader/bookmarks and section controls. Real iPhone/iPad audio still needs a device
check. Cloud writes are mocked; live writes are not used for testing.

Compatible dependency security fixes were applied to the lockfile (`npm audit`
reported zero vulnerabilities). Deployment now gates on content validation, lint,
Chromium regression tests and the production build before publishing to Pages.

On the live device: reload the same site without clearing website data. Test
Settings > Pull progress, then build a road and choose Next batch or Next section.
Stories opens the selected section's three books. Keep the original family code;
do not create a new one to troubleshoot a failed sync.
