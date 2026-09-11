# PhonoBuddy Picture Art

Created 11 September 2026 with the built-in image_gen tool. The exact prompt set
and generated source filenames are in [prompts.json](./prompts.json). There are
17 individually generated illustrations, not a sliced sprite sheet:

- Three dinosaur assets: valley landscape, reading mascot, dinosaur in a rover.
- Fourteen word assets: frog, clock, fish, bird, house, mouse, ball, kite, boat,
  cloud, pie, lamb, cat and dog.

The final project assets are the `*-v1.webp` files in this directory. Original
generated PNGs remain in the local Codex generated-images folder. Mechanical
WebP optimisation uses quality 82, at most 512px for words, 640px for mascots and
1200px for the landscape, without changing the illustration content. Mascot
alpha is preserved. All 17 deployed images together are 557,662 bytes.

## Adding Pictures

Use the consistent prompt style in `prompts.json`, generate and inspect each new
asset, optimise it and append its provenance. Add the exact word in
`src/data/wordArt.js`. Do not guess pictures for abstract words, homographs,
pseudo-words or different inflections. Pictures illustrate a word's meaning,
not a complete story scene or every detail in that story.

## Word-First Rule

Do not mount an answer image or answer-bearing alt text before the child has
attempted the word. Word browsing lists and story shelf entries use text or the
neutral dinosaur, not word pictures. In independent practice the Hear control
is the adult/child's reveal action after attempting the word; it is not an
automatic assessment. Reveals wait for actual audio playback to start.

Year 1 roads additionally require the saved parent verdict before word playback.
Changing words/pages or turning story help off removes the old reveal. Covered
spelling never shows a word picture; spelling art is available only on playback
in the Check stage. Images must never influence progression or saved mastery.
