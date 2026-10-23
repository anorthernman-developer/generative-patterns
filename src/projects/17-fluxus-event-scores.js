/*META {"no":"17","title":"FLUXUS EVENT SCORES","cat":"Manifestos","line":"George Maciunas's Fluxus Manifesto (1963) asks for living art and anti-art that anyone can perform; event scores are short typed instructions (after La Monte Young's Composition 1960 #7 and George Brecht's Drip Music), and the machine deals a deck of cards and performs each one literally.","gemini":"Writes new event-score cards in the Fluxus manner: a terse instruction plus its performance in a small action vocabulary (tone, silence, repeat, count, cluster, random, sample, drip), which the performer machine carries out."} */
const N = (s) => { const m = String(s).match(/^([A-Ga-g])([#♯b♭]?)(-?\d)$/); if (!m) return +s || 60; return 12 * (+m[3] + 1) + { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase()] + (/[#♯]/.test(m[2]) ? 1 : /[b♭]/.test(m[2]) ? -1 : 0); };
const DECK0 = [
  { title: 'after Composition 1960 #7 (La Monte Young)', text: 'B and F♯.\nTo be held for a long time.', actions: [{ a: 'tone', notes: ['B3', 'F#4'], dur: 48 }] },
  { title: 'after Drip Music (George Brecht)', text: 'A source of dripping water and an empty vessel are arranged so that the water falls into the vessel.', actions: [{ a: 'drip', dur: 48, rate: 3 }] },
  { title: 'Counting Piece', text: 'Count aloud to eight.\nOn each number, strike something nearer.', actions: [{ a: 'count', n: 8 }] },
  { title: 'Breath Event', text: 'Do nothing for the length of one breath.', actions: [{ a: 'silence', dur: 12 }] },
  { title: 'Forearm Piece', text: 'Place both forearms on the keyboard.\nRemove them when the room is quiet.', actions: [{ a: 'cluster', low: 'C2', width: 19, dur: 20 }, { a: 'silence', dur: 6 }] },
  { title: 'Repetition Event', text: 'Play one note.\nPlay it again until it becomes another note.', actions: [{ a: 'repeat', note: 'E4', n: 12, every: 2, drift: 0.25 }] },
  { title: 'Hat Piece', text: 'Draw five numbers from a hat.\nPlay them.', actions: [{ a: 'random', n: 5, lo: 'C3', hi: 'C6', every: 3 }] },
  { title: 'Found Sound', text: 'Play the found sound.\nThen play it slower.', actions: [{ a: 'sample', rate: 1, dur: 8 }, { a: 'sample', rate: 0.5, dur: 16 }] },
  { title: 'Exit', text: '• EXIT', actions: [{ a: 'exit' }, { a: 'silence', dur: 10 }] },
];
let deck = [], card = null, events = [], cardStart = 0, cardLen = 0, perf = 0, typed = 0, queue = [], fresh = 0;
function setupSlice() { GP.VOICES.slice = GP.VOICES.slice || ((f, t, d, v, o) => { const c = GP.ctx, g = c.createGain(), s = c.createBufferSource(), e = t + d + 0.03; s.buffer = o.buf; s.playbackRate.value = o.rate || 1; s.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.setValueAtTime(v, t + d * 0.85); g.gain.linearRampToValueAtTime(0.0001, e); s.start(t, 0); s.stop(e + 0.02); return [g, e]; }); }
function compile(c) {
  const E = []; let o = 0; const R = Math.random, cl = (x, a, b) => Math.max(a, Math.min(b, x));
  for (const x of c.actions || []) {
    const dur = cl(Math.round(+x.dur || 8), 1, 96);
    if (x.a === 'tone') { const ns = (x.notes || ['C4']).slice(0, 6).map(N); E.push({ o, fn: (t, sd) => ns.forEach((m, i) => GP.note({ m, t, d: dur * sd, v: 0.4, voice: dur > 8 ? 'organ' : 'pluck', pan: i % 2 ? 0.4 : -0.4, lane: i })) }); o += dur; }
    else if (x.a === 'silence') o += dur;
    else if (x.a === 'count') { const n = cl(+x.n || 8, 1, 24); for (let i = 0; i < n; i++) E.push({ o: o + i * 3, fn: (t) => { GP.note({ voice: 'wood', f: 500 + i * 120, t, v: 0.3 + (i / n) * 0.5, lane: 9 }); } }); o += n * 3; }
    else if (x.a === 'cluster') { const lo = N(x.low || 'C3'), w = cl(+x.width || 12, 2, 36); E.push({ o, fn: (t, sd) => { for (let k = 0; k <= w; k++) GP.note({ m: lo + k, t: t + R() * 0.03, d: dur * sd, v: 0.12, voice: 'pluck', pan: (k / w) * 1.4 - 0.7, lane: 1 }); } }); o += dur; }
    else if (x.a === 'repeat') { const n = cl(+x.n || 8, 1, 48), ev = cl(+x.every || 2, 1, 16), m0 = N(x.note || 'C4'), dr = +x.drift || 0; for (let i = 0; i < n; i++) E.push({ o: o + i * ev, fn: (t, sd) => GP.note({ m: m0 + Math.round(i * dr), t, d: ev * sd * 0.8, v: 0.45, voice: 'marimba', lane: 2 }) }); o += n * ev; }
    else if (x.a === 'random') { const n = cl(+x.n || 4, 1, 32), ev = cl(+x.every || 2, 1, 16), lo = N(x.lo || 'C3'), hi = Math.max(lo + 1, N(x.hi || 'C6')); for (let i = 0; i < n; i++) { const m = lo + Math.floor(R() * (hi - lo)); E.push({ o: o + i * ev, fn: (t, sd) => GP.note({ m, t, d: ev * sd, v: 0.45, voice: 'glass', pan: R() * 1.4 - 0.7, lane: 3 }) }); } o += n * ev; }
    else if (x.a === 'sample') { const rate = cl(+x.rate || 1, 0.1, 4); E.push({ o, fn: (t, sd) => { const s = GP.S.samples.filter((q) => q.buf); if (s.length) GP.note({ voice: 'slice', keepVoice: true, noSample: true, buf: s[Math.abs(+x.idx || 0) % s.length].buf, rate, m: 60, t, d: Math.min(dur * sd, s[0].buf.duration / rate), v: 0.8, lane: 4 }); else GP.note({ voice: 'noise', f: 600 * rate, t, d: dur * sd, v: 0.4, q: 1, lane: 4 }); } }); o += dur; }
    else if (x.a === 'drip') { const rate = cl(+x.rate || 2, 0.3, 10); E.push({ o, fn: (t, sd) => { const T = dur * sd; let tt = 0, k = 0; while (tt < T) { const fill = tt / T, f = 900 + fill * 1400 + R() * 120; GP.note({ voice: 'chirp', f, to: f * 1.9, m: Math.round(69 + 12 * Math.log2(f / 440)), curve: 'sweep', t: t + tt, d: 0.035, v: 0.7, pan: (R() - 0.5) * 0.3, lane: 5 }); k++; tt += (1 / rate) * (0.4 + R() * 1.2); } } }); o += dur; }
    else if (x.a === 'exit') { E.push({ o, fn: (t) => { GP.note({ voice: 'kick', t, v: 1, lane: 9 }); GP.note({ voice: 'noise', f: 300, t, d: 0.25, v: 0.6, q: 0.8, lane: 9 }); } }); o += 2; }
  }
  return { E, len: Math.max(4, o) };
}
function shuffle() { deck = DECK0.slice(); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } }
function deal(step) { if (!queue.length && !deck.length) shuffle(); card = queue.length ? queue.shift() : deck.pop(); const c = compile(card); events = c.E; cardLen = c.len + 8; cardStart = step; perf++; typed = 0; }
GP.init({
  id: 'fluxus-event-scores', no: '17', title: 'FLUXUS EVENT SCORES', cat: 'MANIFESTO', bpm: 120, spb: 4, accent: '#e23b2e', accent2: '#2a5db0',
  rule: `<p>George Maciunas's <em>Fluxus Manifesto</em> (1963) is a collage-pamphlet urging artists to <q>purge the world</q> of professional, commercialised culture and to promote <b>living art, anti-art</b> and non-art reality that everyone can grasp.</p>
<p>Fluxus works are often <em>event scores</em>: short typed instructions on cards that anyone can perform, such as La Monte Young's <i>Composition 1960 #7</i> (a perfect fifth, held for a long time) or George Brecht's <i>Drip Music</i> (water dripping into a vessel). The cards marked "after" are homages, and the rest are new.</p>
<p>The machine shuffles a deck, types each card and then performs it literally, so a drip rises in pitch as the vessel fills and a count strikes things that get nearer. Gemini can add cards to the deck.</p>`,
  setup() { setupSlice(); shuffle(); GP.buttons(['NEXT CARD', () => (cardLen = 0)], ['RESHUFFLE', () => { shuffle(); cardLen = 0; }]); },
  onStart() { cardLen = 0; },
  onStep(step, t, sd) {
    if (!card || step - cardStart >= cardLen) { deal(step); const c = card; GP.at(t, () => { shown = c; typedAt = performance.now(); }); for (let i = 0; i < Math.min(40, c.text.length); i += 3) GP.note({ voice: 'hat', t: t + i * 0.03, v: 0.06, d: 0.02, lane: 9, noMidi: true }); }
    const o = step - cardStart - 4; for (const e of events) if (e.o === o) e.fn(t, sd);
  },
  draw(g, W, H) {
    g.fillStyle = '#2b2b2b'; g.fillRect(0, 0, W, H); const cw = Math.min(W * 0.78, 640), ch = cw * 0.6, x = (W - cw) / 2, y = (H - ch) / 2 - 60;
    g.save(); g.translate(x + cw / 2, y + ch / 2); g.rotate(-0.012); g.translate(-cw / 2, -ch / 2); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(8, 10, cw, ch); g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = '#e23b2e'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 46); g.lineTo(cw, 46); g.stroke(); g.strokeStyle = 'rgba(42,93,176,.35)'; g.lineWidth = 1; for (let ly = 76; ly < ch - 10; ly += 28) { g.beginPath(); g.moveTo(0, ly); g.lineTo(cw, ly); g.stroke(); }
    if (shown) { const el = (performance.now() - typedAt) / 45; g.fillStyle = '#1d1d1d'; g.font = '20px "Share Tech Mono"'; g.fillText(shown.title.toUpperCase().slice(0, Math.floor(el)), 18, 34); g.font = '24px "Share Tech Mono"'; let k = 0, ly = 70; for (const para of shown.text.split('\n')) { let line = ''; for (const w of para.split(' ')) { if (g.measureText(line + w).width > cw - 40) { g.fillText(line.slice(0, Math.max(0, el - k - 20)), 20, ly); k += line.length; line = ''; ly += 28; } line += w + ' '; } g.fillText(line.slice(0, Math.max(0, el - k - 20)), 20, ly); k += line.length; ly += 28; }
      g.fillStyle = '#8a8a8a'; g.font = '15px VT323'; g.fillText((shown.actions || []).map((a) => a.a).join(' → '), 20, ch - 14); }
    g.restore();
    if (!an && GP.ctx) { an = GP.ctx.createAnalyser(); an.fftSize = 2048; GP.out.connect(an); buf = new Float32Array(an.fftSize); } if (an) { an.getFloatTimeDomainData(buf); g.strokeStyle = '#e23b2e'; g.lineWidth = 1.5; g.beginPath(); const yy = H - 50; for (let i = 0; i < buf.length; i += 4) { const xx = (i / buf.length) * W, v = yy + buf[i] * 120; i ? g.lineTo(xx, v) : g.moveTo(xx, v); } g.stroke(); }
    const prog = card ? Math.min(1, (GP.S.step - cardStart) / Math.max(1, cardLen)) : 0; g.fillStyle = '#e23b2e'; g.fillRect(x, y + ch + 24, cw * prog, 4); g.fillStyle = '#d8d4c8'; g.font = '18px VT323'; g.fillText(`PERFORMANCE ${perf}  ·  ${deck.length} CARDS LEFT IN DECK${queue.length ? '  ·  ' + queue.length + ' NEW CARDS WAITING' : ''}`, x, y + ch + 50);
  },
  ai: {
    title: 'FLUXUS COLLABORATOR', button: 'WRITE CARDS', placeholder: 'event scores for a bus shelter in Bradford',
    help: 'Gemini writes 1 to 4 new event-score cards: a terse instruction plus a performable version (tone, silence, repeat, count, cluster, random, sample, drip). They go to the top of the deck.',
    system: `You write Fluxus event scores (George Brecht, Yoko Ono, Alison Knowles, La Monte Young; Maciunas: "living art, anti-art"). Each card: title, text (terse, poetic-literal, 1-4 short lines, typed-card style), and actions = how a machine performs it, using only: {a:"tone", notes:["B3","F#4"], dur steps}, {a:"silence", dur}, {a:"repeat", note, n, every, drift (semitones per repeat, may be fractional)}, {a:"count", n}, {a:"cluster", low:"C2", width semitones, dur}, {a:"random", n, lo, hi, every}, {a:"sample", rate 0.1-4, dur}, {a:"drip", dur, rate drips/sec}, {a:"exit"}. 16 steps = 2 seconds. Keep each card under 80 steps. Return 1-4 cards. Reply JSON only.`,
    schema: { type: 'object', properties: { cards: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'object', properties: { title: { type: 'string' }, text: { type: 'string' }, actions: { type: 'array', items: { type: 'object', properties: { a: { type: 'string', enum: ['tone', 'silence', 'repeat', 'count', 'cluster', 'random', 'sample', 'drip', 'exit'] }, notes: { type: 'array', items: { type: 'string' } }, note: { type: 'string' }, dur: { type: 'number' }, n: { type: 'number' }, every: { type: 'number' }, drift: { type: 'number' }, low: { type: 'string' }, width: { type: 'number' }, lo: { type: 'string' }, hi: { type: 'string' }, rate: { type: 'number' } }, required: ['a'] } } }, required: ['title', 'text', 'actions'] } } }, required: ['cards'] },
    apply(r) { const OK = ['tone', 'silence', 'repeat', 'count', 'cluster', 'random', 'sample', 'drip', 'exit']; const C = (r.cards || []).slice(0, 4).map((c) => ({ title: String(c.title || 'Untitled').slice(0, 60), text: String(c.text || '').slice(0, 300), actions: (c.actions || []).filter((a) => OK.includes(a.a)).slice(0, 10) })).filter((c) => c.actions.length && c.text); if (!C.length) throw new Error('no performable cards'); queue = C.concat(queue); cardLen = 0; return C.map((c) => `${c.title}: ${c.text.replace(/\n/g, ' / ')}  [${c.actions.map((a) => a.a).join(', ')}]`).join('\n'); },
    fallback() { shuffle(); cardLen = 0; },
  },
});
var shown = null, typedAt = 0, an, buf;
