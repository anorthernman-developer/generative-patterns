/*META {"no":"16","title":"EXQUISITE CORPSE","cat":"Manifestos","line":"The Surrealist cadavre exquis (Breton, 1924 manifesto: psychic automatism, free of the control of reason): four players each draw a fold of a body (head, torso, legs, feet) by automatic scribble, seeing only the tail crossing the fold; unfolded, the scribble is the melody and the body is the orchestra.","gemini":"Plays each folded partner in a separate call: each call sees only the theme and the tail of the previous fold (its last two heights and last word), then returns its words and its scribble."} */
const PARTS = [['HEAD', 'bell', 24, '#e94f37'], ['TORSO', 'marimba', 12, '#f6c85f'], ['LEGS', 'pluck', 0, '#6fb1a0'], ['FEET', 'bass', -12, '#3f6c9d']];
const WORDS = [['The exquisite', 'The melting', 'A velvet', 'The sleeping', 'An electric', 'The drowned'], ['corpse', 'lobster', 'telephone', 'giraffe', 'clock', 'staircase'], ['will drink', 'swallows', 'dreams of', 'unbuttons', 'sings to', 'forgets'], ['the new wine', 'a burning piano', 'the moon\'s umbrella', 'a forest of spoons', 'the inside of an egg', 'tomorrow\'s fog']];
let corpse = [], pass = 0, reveal = -1, scale = 'phrygian', theme = '', drawing = null, userFold = -1, steps = 32, loops = 2;
function scribble(start, n = 32) { const P = [start]; let y = start, v = (Math.random() - 0.5) * 0.3; for (let i = 1; i < n; i++) { v = v * 0.55 + (Math.random() - 0.5) * 0.45; if (Math.random() < 0.18) v = (Math.random() - 0.5) * 1.1; y = Math.max(0.03, Math.min(0.97, y + v)); P.push(y); } return P; }
function autoFold(k, tail) { const R = Math.random; return { words: k === 0 ? WORDS[0][Math.floor(R() * 6)] + ' ' + WORDS[1][Math.floor(R() * 6)] : WORDS[k === 1 ? 2 : k === 2 ? 3 : 3][Math.floor(R() * 6)], line: scribble(tail ? tail[tail.length - 1] : 0.5), by: 'automatism' }; }
function newCorpse() { corpse = []; let tail = null; for (let k = 0; k < 4; k++) { const f = autoFold(k, tail); corpse.push(f); tail = f.line.slice(-2); } corpse[1].words = WORDS[1][Math.floor(Math.random() * 6)] === corpse[0].words.split(' ').pop() ? corpse[1].words : corpse[1].words; corpse[1].words = WORDS[2][Math.floor(Math.random() * 6)]; corpse[2].words = WORDS[3][Math.floor(Math.random() * 6)]; corpse[3].words = ['at dawn', 'without asking', 'in the station', 'backwards', 'forever', 'with great politeness'][Math.floor(Math.random() * 6)]; pass = 0; reveal = -1; }
const at = (line, f) => { const x = f * (line.length - 1), i = Math.floor(x), fr = x - i; return line[i] * (1 - fr) + (line[Math.min(line.length - 1, i + 1)] ?? line[i]) * fr; };
let lastDeg = [null, null, null, null];
GP.init({
  id: 'exquisite-corpse', no: '16', title: 'EXQUISITE CORPSE', cat: 'MANIFESTO', bpm: 104, spb: 4, accent: '#e94f37', accent2: '#f6c85f',
  rule: `<p>André Breton, <em>Manifesto of Surrealism</em> (1924), defines Surrealism as <q>psychic automatism in its pure state</q>: thought dictated without any control by reason and outside any aesthetic or moral concern.</p>
<p>The Surrealists' parlour game, the <em>cadavre exquis</em>, named after its first sentence "the exquisite corpse will drink the new wine", works like this:</p>
<blockquote>Fold the paper. Each player draws a part of a body, sees only the lines crossing the fold from the previous part, then folds their own part away and passes the paper on.</blockquote>
<p>There are four folds: HEAD, TORSO, LEGS and FEET. Each fold is an automatic scribble with <b>no undo</b>, which you can draw yourself by dragging across the fold. When the paper is unfolded, the scribble line is the melody (height is pitch), and the body is the orchestra: the head is a bell, the torso a marimba, the legs a pluck and the feet the bass. The sentence is assembled the same way.</p>`,
  setup() {
    GP.buttons(['NEW CORPSE', () => newCorpse()], ['I DRAW THE NEXT FOLD', () => { userFold = (Math.max(0, reveal) + 1) % 4; GP.toast('Drag across the ' + PARTS[userFold][0] + ' fold: one stroke, no undo'); }]);
    GP.slider('LOOPS BEFORE NEW CORPSE', 1, 8, 1, loops, (v) => (loops = v));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    const pt = (e) => { const r = GP.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    GP.cv.addEventListener('pointerdown', (e) => { if (userFold < 0) return; drawing = []; GP.cv.setPointerCapture(e.pointerId); });
    GP.cv.addEventListener('pointermove', (e) => { if (!drawing) return; const [x, y] = pt(e), band = (y * 4) - userFold; drawing.push([x, Math.max(0.02, Math.min(0.98, band))]); });
    GP.cv.addEventListener('pointerup', () => { if (!drawing) return; if (drawing.length > 4) { const s = drawing.slice().sort((a, b) => (userFold % 2 ? b[0] - a[0] : a[0] - b[0])); const line = []; for (let i = 0; i < 24; i++) line.push(s[Math.floor((i / 23) * (s.length - 1))][1]); corpse[userFold] = { words: corpse[userFold].words, line, by: 'you' }; GP.toast('Fold ' + PARTS[userFold][0] + ' is yours now. No undo.'); } drawing = null; userFold = -1; });
    newCorpse();
  },
  onStep(step, t, sd) {
    const s = step % (steps * 4), k = Math.floor(s / steps), f = (s % steps) / (steps - 1); if (s === 0 && step > 0) { pass++; if (pass >= loops) GP.at(t, () => newCorpse()); }
    GP.at(t, () => { reveal = Math.max(reveal, k); playK = k; playF = f; });
    const fold = corpse[k]; if (!fold) return; const ff = k % 2 ? 1 - f : f, y = at(fold.line, ff), deg = Math.round((1 - y) * 9), [, voice, oct] = PARTS[k];
    const slope = Math.abs(at(fold.line, Math.min(1, ff + 0.04)) - y);
    if (deg !== lastDeg[k] || s % 8 === 0) { let len = 1; for (let j = 1; j < 6; j++) { const y2 = at(fold.line, k % 2 ? 1 - (f + j / (steps - 1)) : f + j / (steps - 1)); if (Math.round((1 - y2) * 9) === deg) len++; else break; } GP.note({ m: GP.deg(deg, GP.SCALES[scale], 48 + oct), t, d: len * sd * 0.95, v: 0.35 + Math.min(0.4, slope * 4), voice, pan: (ff - 0.5) * 1.2, lane: k }); }
    lastDeg[k] = deg; if (s % steps === 0) GP.note({ voice: 'metal', t, d: 0.4, v: 0.25, lane: 9 });
    if (s % 4 === 0) GP.note({ voice: k === 3 ? 'kick' : 'wood', f: 700 + k * 150, t, v: 0.3, lane: 9 }); if (s % 8 === 6 && k >= 1) GP.note({ voice: 'snare', t, v: 0.2, lane: 9 });
  },
  draw(g, W, H) {
    g.fillStyle = '#efe7d6'; g.fillRect(0, 0, W, H); const bh = H / 4;
    for (let k = 0; k < 4; k++) {
      const y0 = k * bh, fold = corpse[k], shown = k <= reveal || pass > 0; g.fillStyle = k % 2 ? '#e8dfcb' : '#efe7d6'; g.fillRect(0, y0, W, bh);
      if (fold && shown) { g.strokeStyle = PARTS[k][3]; g.lineWidth = 3; g.lineJoin = 'round'; g.beginPath(); fold.line.forEach((y, i) => { const x = 40 + ((k % 2 ? fold.line.length - 1 - i : i) / (fold.line.length - 1)) * (W - 80); i ? g.lineTo(x, y0 + y * bh) : g.moveTo(x, y0 + y * bh); }); g.stroke(); g.lineWidth = 1.5; fold.line.forEach((y, i) => { const d = Math.abs((fold.line[i + 1] ?? y) - y); if (d > 0.2) { const x = 40 + ((k % 2 ? fold.line.length - 1 - i : i) / (fold.line.length - 1)) * (W - 80); g.beginPath(); g.ellipse(x, y0 + y * bh, 6 + d * 30, 4 + d * 18, i, 0, 6.283); g.stroke(); } }); g.strokeStyle = '#1b1b1b'; g.lineWidth = 1; g.beginPath(); fold.line.forEach((y, i) => { const x = 40 + ((k % 2 ? fold.line.length - 1 - i : i) / (fold.line.length - 1)) * (W - 80) + Math.sin(i * 3.1) * 4; i ? g.lineTo(x, y0 + y * bh + Math.cos(i * 2.3) * 5) : g.moveTo(x, y0 + y * bh); }); g.stroke(); }
      else { g.fillStyle = '#c9bea6'; g.fillRect(0, y0, W, bh); g.fillStyle = '#8c7f66'; g.font = '20px VT323'; g.fillText('— folded —', W / 2 - 50, y0 + bh / 2); if (fold && k === reveal + 1) { const tail = corpse[k - 1]?.line.slice(-2) || []; g.strokeStyle = '#1b1b1b'; g.lineWidth = 2; tail.forEach((y, i) => { const x = k % 2 ? W - 40 - i * 12 : 40 + i * 12; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + 14); g.stroke(); }); } }
      g.strokeStyle = 'rgba(0,0,0,.25)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = PARTS[k][3]; g.font = '18px VT323'; g.fillText(PARTS[k][0] + (fold ? ' · ' + fold.by : ''), 10, y0 + 18); if (fold && shown) { g.fillStyle = '#1b1b1b'; g.font = 'italic 20px serif'; g.fillText(fold.words, 10, y0 + bh - 10); }
      if (userFold === k) { g.strokeStyle = '#e94f37'; g.lineWidth = 3; g.strokeRect(2, y0 + 2, W - 4, bh - 4); }
    }
    if (drawing) { g.strokeStyle = '#1b1b1b'; g.lineWidth = 2; g.beginPath(); drawing.forEach(([x, y], i) => (i ? g.lineTo(x * W, (userFold + y) * bh) : g.moveTo(x * W, (userFold + y) * bh))); g.stroke(); }
    if (playK >= 0) { const x = 40 + (playK % 2 ? 1 - playF : playF) * (W - 80); g.fillStyle = 'rgba(233,79,55,.25)'; g.fillRect(x - 3, playK * bh, 6, bh); }
  },
  ai: {
    title: 'FOUR FOLDED PARTNERS', button: 'PLAY THE GAME', placeholder: 'a corpse about the North Sea / a lighthouse keeper\'s dream',
    help: 'Gemini plays four partners in four separate calls. Each one sees only the theme, which body part it has, and the tail of the previous fold (two heights and one word), never the whole drawing.',
    system: `You are one player in the Surrealist game cadavre exquis (exquisite corpse). Breton: "psychic automatism in its pure state", without control by reason. You draw ONE fold of a body (head, torso, legs or feet) and write its fragment of the sentence (fold 1: adjective + noun subject, e.g. "The exquisite corpse"; fold 2: a verb phrase; fold 3: an object; fold 4: a closing adverbial). You only see the tail crossing the fold: your line MUST start near the given start height. Return words (2-6 words) and line = 16-32 heights 0..1 (0 = top of your fold) - a jagged, surprising automatic scribble, not a smooth curve. Reply JSON only.`,
    schema: { type: 'object', properties: { words: { type: 'string' }, line: { type: 'array', minItems: 8, maxItems: 40, items: { type: 'number' } } }, required: ['words', 'line'] },
    user: (prompt) => `Theme: ${prompt}\nYou are fold 1 of 4: the HEAD. Nothing is above you. Start your line at height 0.5.`,
    async apply(r, prompt) {
      const clean = (x, start) => { const L = (x.line || []).filter(Number.isFinite).slice(0, 40).map((y) => Math.max(0.02, Math.min(0.98, y))); if (L.length < 6) throw new Error('scribble too short'); if (start != null) L[0] = start; return { words: String(x.words || '…').slice(0, 50), line: L, by: 'Gemini partner' }; };
      const C = [clean(r, 0.5)], notes = []; const st = GP.$('#gp-aistat');
      for (let k = 1; k < 4; k++) { const prev = C[k - 1], tail = prev.line.slice(-2).map((y) => +y.toFixed(2)), lastWord = prev.words.split(/\s+/).pop(); st.textContent = `Fold ${k + 1}/4: partner ${k + 1} sees only "${lastWord}" and the heights ${tail.join(', ')}…`;
        try { const res = await GP.gemini({ system: this.system, user: `Theme: ${prompt}\nYou are fold ${k + 1} of 4: the ${PARTS[k][0]}. Across the fold you can see only: the last word "${lastWord}" and two line ends at heights ${tail.join(' and ')}. Start your line at height ${tail[1]}.`, schema: this.schema, temperature: 1.2 }); C.push(clean(res, tail[1])); }
        catch (e) { const f = autoFold(k, prev.line.slice(-2)); f.by = 'automatism (Gemini failed)'; C.push(f); notes.push(`fold ${k + 1}: ${e.message}`); } }
      corpse = C; pass = 0; reveal = -1; theme = prompt;
      return `"${C.map((c) => c.words).join(' ')}"\n` + C.map((c, i) => `${PARTS[i][0]}: ${c.line.length}-point scribble (${c.by})`).join('\n') + (notes.length ? '\n' + notes.join('\n') : '');
    },
    fallback() { newCorpse(); },
  },
});
var playK = -1, playF = 0;
