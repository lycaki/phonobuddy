# 🦉 PhonoBuddy

A phonics learning app built for Logan (Reception year, age 5) — follows the UK **Little Wandle** curriculum, adapts to where he is, and uses Russell's voice for sound playback.

---

## 🌐 Live & Source

| What | Where |
|------|-------|
| **Live app** | https://lycaki.github.io/phonobuddy/ |
| **GitHub repo** | https://github.com/lycaki/phonobuddy |
| **Project folder (local)** | `C:\Users\russ\website_phonics\` |
| **Firebase project** | `phonobuddy-6bf48` ([console](https://console.firebase.google.com/project/phonobuddy-6bf48)) |
| **Family code (cloud sync)** | `HXN697` |

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

### Core curriculum
- **48 phonemes** across UK Little Wandle Phases 2, 3, and 4
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
**Family code: `HXN697`** — use it on any device

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
| Framework | React 18 + Vite |
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

**Database rules** (locked down to family-code paths only):
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
1. Open app → Settings → enter `HXN697` → Join → recordings + progress sync down
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
