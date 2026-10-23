# DEVLOG

## 2026-10-23: twenty pattern machines

**Brief:** generative music from mathematical, natural, historical and artistic patterns, with systems based on art manifestos. Gemini should be used in a meaningful way, and every project must still work without a key.

### Architecture
- I wrote one shared kit (`src/kit.js`) and kept each project as a small file. `build.py` inlines the fonts, CSS, kit and project into one HTML file per project, so you get self-contained files with no duplicated hand-edits.
- The scheduler is a lookahead clock (setInterval at 25ms with 120ms ahead). Each project implements `onStep(step, time, secondsPerStep)` and `draw(ctx, W, H)`. `GP.at(t, fn)` syncs visuals to audio time.
- The Gemini client uses JSON mode with a schema. If the schema is rejected (a 400 that mentions the schema), it retries without one. It walks through the model list, skips thought parts and parses JSON leniently. Each project validates and clamps every field in `apply()`, so a bad reply can't break the engine.
- WAV recording uses a ScriptProcessor tap on the master bus and encodes 16-bit PCM in the browser.

### Problems and fixes
- **Slime mould:** the agents first collapsed into one band and no network formed. I retuned the sensor angle, rotation and decay, and made the edge detection adaptive: a trail counts as a link when its minimum along the line is above max(0.3, 3× the mean).
- **Würfelspiel:** BiquadFilter frequencies above Nyquist caused console warnings, which fail the test. The kit now clamps every filter frequency.
- **Kandinsky:** black lines were hushing everything. Now only black circles, squares and triangles hush.
- **Sol LeWitt:** "connect all" strokes in drawing order sounded monotonous, so they are now shuffled, like draughtsmen working.
- **Art of Noises:** the AI scores were shorter than the 128-step loop, so there were long silences and the check on AI-made notes failed. The loop length now follows the score.
- **Exquisite Corpse:** the kit's `askAI` now awaits async `apply()`, so this project can make three more blind Gemini calls, one per fold.
- **Dérive:** the walker flickered back and forth on quarter borders, firing a chord on every crossing. I added hysteresis: it must be 0.03 inside the new quarter before the ambience switches. Sites have a minimum spacing.
- **Screenshots:** `text=PLAY`-style selectors matched the rule paragraphs, so I switched to `button:text-is()`.

### Not tested
- **Real Gemini calls:** every test uses mocked replies, so prompt quality and schema acceptance on live models are untested.
- **A real Splice folder on Windows:** loading was tested with a generated WAV, and folder picking (`webkitdirectory`) was not tested on a real library.
- **Real MIDI devices:** tested only in headless Chrome, which has no MIDI outputs.
- **Speech synthesis in Dada Cut-Up:** it depends on the browser's voices and is not captured by the WAV recording.
