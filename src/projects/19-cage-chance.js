/*META {"no":"19","title":"MUSIC OF CHANGES","cat":"Manifestos","line":"John Cage, 'Experimental Music' (1957): give up the wish to control sound and let sounds be themselves; three coins are thrown six times to cast I Ching hexagrams that pick cells from 8×8 charts of sounds (half of them silences), durations, dynamics and layers, and moving lines make a cell mobile so it is replaced once it has been used.","gemini":"Supplies only the gamut, the raw sounds in the sound chart (tones, aggregates, prepared-piano preparations, noises), and never their order. The coins decide everything else."} */
const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], noteName = (m) => NN[m % 12] + (Math.floor(m / 12) - 1);
let gamut = [], chart = [], durC = [], dynC = [], layers = [], cast = null, log = [], marks = [], title = 'Gamut for prepared piano (algorithmic)', sectionLayers = 2, litCell = -1, mobileFlash = {}, R = Math.random;
const KINDS = { tone: '#111', aggregate: '#2e5a87', prepared: '#a8432b', noise: '#7b7b7b', sample: '#5c8a3a' };
const DYN = [['ppp', 0.12], ['pp', 0.2], ['p', 0.3], ['mp', 0.42], ['mf', 0.55], ['f', 0.7], ['ff', 0.85], ['fff', 1]];
function prepVoice() {
  GP.VOICES.prepared = (f, t, d, v) => { const c = GP.ctx, g = c.createGain(), e = t + Math.min(3, 0.6 + 400 / f); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.4, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, e);
    const h = (Math.sin(f * 12.9898) * 43758.5453) % 1, rs = [1, 2.0 + Math.abs(h) * 0.7, 3.3 + Math.abs(h) * 1.4, 5.1 + Math.abs(h) * 2, 7.6]; rs.forEach((r, i) => { const o = c.createOscillator(), gg = c.createGain(); o.frequency.value = Math.min(16000, f * r); gg.gain.setValueAtTime(0.7 / (i + 1), t); gg.gain.exponentialRampToValueAtTime(0.0001, t + (e - t) / (1 + i * 0.8)); o.connect(gg); gg.connect(g); o.start(t); o.stop(e + 0.05); });
    const th = c.createOscillator(), tg = c.createGain(); th.type = 'triangle'; th.frequency.setValueAtTime(f * 0.5 + 60, t); th.frequency.exponentialRampToValueAtTime(40, t + 0.05); tg.gain.setValueAtTime(0.5, t); tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); th.connect(tg); tg.connect(g); th.start(t); th.stop(t + 0.1); return [g, e]; };
}
function defaultGamut(seed) {
  const r = GP.rng(seed), G = [], K = ['tone', 'tone', 'aggregate', 'prepared', 'prepared', 'prepared', 'noise'];
  for (let i = 0; i < 32; i++) { const k = K[Math.floor(r() * K.length)], base = 28 + Math.floor(r() * 64), n = k === 'aggregate' ? [base, base + 1 + Math.floor(r() * 11), base + 6 + Math.floor(r() * 14)].concat(r() < 0.5 ? [base + 13 + Math.floor(r() * 12)] : []) : [base]; G.push({ kind: k, notes: n.map((x) => Math.min(100, x)), label: k + ' ' + n.map(noteName).join(' ') }); }
  return G;
}
function buildCharts(G, seed) {
  gamut = G; const r = GP.rng(seed); let pool = G.slice(); chart = [];
  for (let i = 0; i < 64; i++) chart.push(null);
  const idx = [...Array(64).keys()]; for (let i = 63; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  idx.slice(0, 32).forEach((c, k) => (chart[c] = { ...pool[k % pool.length], mobile: c % 2 === 1 }));
  durC = [...Array(64)].map(() => [1, 1, 2, 2, 3, 4, 5, 6, 8, 0.5, 0.5, 12, 16][Math.floor(r() * 13)]);
  dynC = [...Array(64)].map(() => Math.floor(r() * 8)); log = []; marks = [];
}
function throwCoins() { const coins = [0, 1, 2].map(() => (R() < 0.5 ? 3 : 2)), s = coins[0] + coins[1] + coins[2]; return { coins, s, yang: s === 7 || s === 9, moving: s === 6 || s === 9 }; }
function hexagram() { const L = [...Array(6)].map(throwCoins); let n = 0; L.forEach((l, i) => l.yang && (n |= 1 << i)); return { lines: L, n: n + 1, moving: L.some((l) => l.moving) }; }
function event(layer, t, step, sd) {
  const hs = hexagram(), hd = hexagram(), hv = hexagram(); cast = hs; const ci = hs.n - 1, cell = chart[ci], dur = durC[hd.n - 1], dy = DYN[dynC[hv.n - 1]];
  const len = Math.max(1, Math.round(dur)); layer.next = step + len; litCell = ci;
  let desc;
  if (!cell) desc = 'silence';
  else {
    desc = cell.label || cell.kind; const d = Math.max(0.12, dur * sd), v = dy[1];
    cell.notes.forEach((m, k) => {
      const voice = cell.kind === 'prepared' ? 'prepared' : cell.kind === 'noise' ? 'noise' : cell.kind === 'sample' ? 'pluck' : 'marimba';
      GP.note({ m, t: t + (dur < 1 ? 0 : k * 0.012), d: cell.kind === 'noise' ? Math.min(d, 0.6) : d, v: v / Math.sqrt(cell.notes.length), voice, keepVoice: voice === 'prepared', pan: (layer.i - 1.5) * 0.4, lane: layer.i, q: 14 });
      GP.at(t, () => marks.push({ m, s: step, len: dur, v, kind: cell.kind }));
    });
    if (hs.moving && cell.mobile) { const rep = gamut[Math.floor(R() * gamut.length)]; chart[ci] = { ...rep, mobile: true }; mobileFlash[ci] = 1; desc += ' → mobile, replaced'; }
  }
  const line = `L${layer.i + 1} · ${String(hs.n).padStart(2)} → ${desc} · dur ${dur} · ${dy[0]}`;
  GP.at(t, () => { log.unshift(line); log.length = Math.min(log.length, 12); });
}
GP.init({
  id: 'cage-chance', no: '19', title: 'MUSIC OF CHANGES', cat: 'MANIFESTO', bpm: 100, spb: 4, accent: '#a8432b', accent2: '#2e5a87',
  rule: `<p>John Cage, <em>Experimental Music</em> (1957), paraphrased: the composer gives up the wish to control sound, clears his mind of music, and finds ways <b>to let sounds be themselves</b>. And from the 1949 <em>Lecture on Nothing</em>: <q>I have nothing to say and I am saying it.</q></p>
<p>For <em>Music of Changes</em> (1951) Cage asked the I Ching questions instead of making choices, and this page does the same:</p>
<ul><li>Three coins are thrown six times (heads 3, tails 2). A total of 6 or 8 is yin, 7 or 9 is yang, and 6 or 9 is a <b>moving</b> line. Reading upwards gives a hexagram from 1 to 64 (in binary or Fu Xi order, not King Wen order).</li>
<li>Each event casts three hexagrams, which choose a cell from the <b>sound</b> chart, the <b>duration</b> chart and the <b>dynamics</b> chart. Half of the 64 sound cells are silences.</li>
<li>Even-numbered cells are <b>mobile</b>. If a cast has moving lines, the mobile cell it used is replaced with a new sound from the gamut once it has sounded, so the chart changes as it is used.</li>
<li>A separate cast at each 64-step section decides how many layers (1–4) play at once.</li></ul>
<p>The notation scroll at the bottom uses Cage's space = time layout.</p>`,
  setup() {
    prepVoice();
    GP.buttons(['NEW CHARTS', () => buildCharts(gamut.length ? gamut : defaultGamut(Date.now()), Date.now())], ['NEW GAMUT', () => buildCharts(defaultGamut(Date.now() % 1e6), Date.now())]);
    buildCharts(defaultGamut(1951), 1951); layers = [0, 1, 2, 3].map((i) => ({ i, next: 0 }));
  },
  onStep(step, t, sd) {
    if (step % 64 === 0) { const h = hexagram(); sectionLayers = 1 + Math.floor((h.n - 1) / 16); GP.at(t, () => log.unshift(`SECTION · hexagram ${h.n} → ${sectionLayers} layer${sectionLayers > 1 ? 's' : ''}`)); }
    for (let i = 0; i < sectionLayers; i++) { const L = layers[i]; if (L.next < step - 32) L.next = step; if (step >= L.next) event(L, t, step, sd); }
  },
  draw(g, W, H) {
    g.fillStyle = '#f1ece0'; g.fillRect(0, 0, W, H); g.font = '16px VT323';
    // hexagram
    const hx = 20, hy = 40, lw = 110; g.fillStyle = '#111'; g.fillText('CAST', hx, 28);
    if (cast) { cast.lines.forEach((l, i) => { const y = hy + (5 - i) * 22; g.fillStyle = l.moving ? '#a8432b' : '#111'; if (l.yang) g.fillRect(hx, y, lw, 12); else { g.fillRect(hx, y, lw * 0.42, 12); g.fillRect(hx + lw * 0.58, y, lw * 0.42, 12); } g.fillStyle = '#555'; g.fillText(l.coins.map((c) => (c === 3 ? 'H' : 'T')).join('') + ' ' + l.s + (l.moving ? (l.yang ? ' ○' : ' ×') : ''), hx + lw + 8, y + 11); }); g.fillStyle = '#111'; g.font = '28px VT323'; g.fillText('HEXAGRAM ' + cast.n, hx, hy + 6 * 22 + 20); g.font = '16px VT323'; }
    // chart
    const cs = Math.min((W - 240) / 8, (H - 180) / 8, 44), cx = W - cs * 8 - 20, cy = 30; g.fillStyle = '#111'; g.fillText('SOUND CHART  (' + title.slice(0, 40) + ')', cx, 22);
    for (let i = 0; i < 64; i++) { const x = cx + (i % 8) * cs, y = cy + Math.floor(i / 8) * cs, c = chart[i]; g.strokeStyle = '#bbb'; g.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1); if (c) { g.fillStyle = KINDS[c.kind] || '#111'; const k = c.notes.length; for (let j = 0; j < k; j++) g.fillRect(x + 6 + j * ((cs - 12) / k), y + cs - 8 - (c.notes[j] - 24) * (cs - 14) / 80, Math.max(3, (cs - 14) / k), 4); if (c.mobile) { g.fillStyle = '#a8432b'; g.fillRect(x + cs - 6, y + 2, 3, 3); } }
      if (mobileFlash[i]) { g.fillStyle = `rgba(168,67,43,${mobileFlash[i] * 0.4})`; g.fillRect(x, y, cs, cs); mobileFlash[i] *= 0.95; if (mobileFlash[i] < 0.02) delete mobileFlash[i]; }
      if (i === litCell) { g.strokeStyle = '#a8432b'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, cs - 3, cs - 3); g.lineWidth = 1; }
      g.fillStyle = '#999'; g.font = '11px VT323'; g.fillText(i + 1, x + 2, y + 10); g.font = '16px VT323'; }
    // log
    g.fillStyle = '#333'; log.slice(0, 9).forEach((l, i) => g.fillText(l.slice(0, Math.floor((cx - 30) / 7.5)), 20, 230 + i * 18));
    // space=time notation
    const ny = H - 120, now = GP.S.step || 0, span = 128; g.strokeStyle = '#111'; g.beginPath(); g.moveTo(0, ny); g.lineTo(W, ny); g.stroke();
    marks = marks.filter((m) => m.s > now - span); for (const m of marks) { const x = W - ((now - m.s) / span) * W, y = ny + 110 - ((m.m - 24) / 80) * 100; g.fillStyle = KINDS[m.kind] || '#111'; g.fillRect(x, y, Math.max(2, (m.len / span) * W), 1 + m.v * 5); }
    g.fillStyle = '#777'; g.fillText('SPACE = TIME', 8, ny + 16);
  },
  ai: {
    title: 'GAMUT ONLY', button: 'ASK FOR A GAMUT', placeholder: 'a kitchen at 3am, prepared with screws and rubber',
    help: 'Gemini supplies only the gamut, 16 to 32 raw sounds, and never their order, timing or loudness. The coins decide all of that. Each sound can be a tone, an aggregate (a fixed chord), a preparation (a bolt or rubber on a piano string) or a noise.',
    system: `You are helping John Cage make a gamut for a chance composition (like Music of Changes, 1951). Return 16-32 sounds. Each: {kind: tone|aggregate|prepared|noise|sample, notes: array of MIDI numbers 24-100 (1 for tone/prepared/noise, 2-5 for aggregate), label: short description, e.g. 'bolt between strings, E2'}. Make them varied in register and character; avoid tonal chords; do NOT specify order, rhythm or dynamics (the I Ching decides those). Reply JSON only.`,
    schema: { type: 'object', properties: { title: { type: 'string' }, sounds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: Object.keys(KINDS) }, notes: { type: 'array', items: { type: 'integer' } }, label: { type: 'string' } }, required: ['kind', 'notes'] } } }, required: ['sounds'] },
    apply(r) { const G = (r.sounds || []).filter((s) => KINDS[s.kind] && Array.isArray(s.notes) && s.notes.length).slice(0, 32).map((s) => ({ kind: s.kind, notes: s.notes.slice(0, 5).map((m) => GP.num(m, 24, 100, 60)), label: String(s.label || s.kind).slice(0, 40) })); if (G.length < 4) throw new Error('gamut too small'); buildCharts(G, Date.now()); title = String(r.title || 'Gamut').slice(0, 50); return `${title}: ${G.length} sounds in the chart, with 32 silences. The coins decide the rest.\n` + G.map((s, i) => `${i + 1}. ${s.label}`).join('\n'); },
    fallback(prompt) { buildCharts(defaultGamut(GP.hash(prompt || 'cage')), GP.hash(prompt || 'cage') + 1); title = 'Gamut from "' + String(prompt || '').slice(0, 24) + '"'; },
  },
});
