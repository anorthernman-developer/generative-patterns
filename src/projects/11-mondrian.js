/*META {"no":"11","title":"MONDRIAN","cat":"Art","line":"Neo-Plasticism (Mondrian, 1920): only horizontals, verticals, the three primaries and non-colours; a playhead reads the composition left to right, so coloured planes become notes (height gives pitch, width gives duration) and black lines become percussion, with a Broadway Boogie Woogie street-grid mode.","gemini":"Designs a new Mondrian composition (a list of rectangles on a 32 × 12 grid with primary colours) from any subject or mood, which is then played as a score."} */
const GX = 32, GY = 12, COL = { red: '#d4251c', blue: '#1f3fa0', yellow: '#f2c21b', white: '#f4f1e8', grey: '#bfbcb4', black: '#111' };
let rects = [], vlines = [], mode = 'composition', streets = null, title = 'Composition (algorithmic)', swing = 0.2, root = 50, scale = 'major', walk = 0;
function subdivide(seed) {
  const R = GP.rng(seed), out = []; const split = (x, y, w, h, d) => { const can = (w >= 4 || h >= 3) && d < 5 && (d < 2 || R() < 0.72); if (!can) { out.push({ x, y, w, h, c: 'white' }); return; } const vert = w / GX > h / GY ? R() < 0.8 : R() < 0.2; if (vert && w >= 4) { const k = 2 + Math.floor(R() * (w - 3)); split(x, y, k, h, d + 1); split(x + k, y, w - k, h, d + 1); } else if (h >= 3) { const k = 1 + Math.floor(R() * (h - 2)); split(x, y, w, k, d + 1); split(x, y + k, w, h - k, d + 1); } else out.push({ x, y, w, h, c: 'white' }); };
  split(0, 0, GX, GY, 0); const cols = ['red', 'blue', 'yellow']; out.forEach((r, i) => { const a = r.w * r.h, p = R(); if (p < 0.42 && a < 90) r.c = cols[Math.floor(R() * 3)]; else if (p < 0.5 && a < 14) r.c = 'black'; }); if (!out.some((r) => r.c === 'red')) out[0].c = 'red';
  setRects(out); title = 'Composition #' + (seed % 1000);
}
function setRects(list) { rects = list; vlines = []; for (const r of rects) { for (const x of [r.x, r.x + r.w]) if (x > 0 && x < GX) vlines.push({ x, y: r.y, h: r.h }); } }
function boogie(seed) {
  const R = GP.rng(seed), H = [], V = []; for (let y = 1; y < GY; y += 1 + Math.floor(R() * 3)) H.push(y); for (let x = 1; x < GX; x += 2 + Math.floor(R() * 4)) V.push(x);
  const sq = []; for (const y of H) for (let x = 0; x < GX; x++) if (R() < 0.42) sq.push({ x, y, c: ['red', 'blue', 'grey', 'red', 'blue'][Math.floor(R() * 5)] }); for (const x of V) for (let y = 0; y < GY; y++) if (R() < 0.25 && !H.includes(y)) sq.push({ x, y, c: ['red', 'blue', 'grey'][Math.floor(R() * 3)], v: 1 });
  const blocks = []; for (let i = 0; i < 4; i++) blocks.push({ x: Math.floor(R() * (GX - 4)), y: Math.floor(R() * (GY - 3)), w: 2 + Math.floor(R() * 3), h: 1 + Math.floor(R() * 2), c: ['red', 'blue', 'yellow'][i % 3] });
  streets = { H, V, sq, blocks }; title = 'Broadway Boogie Woogie (after 1942–43)';
}
const BOOGIE = [0, 4, 7, 9, 10, 9, 7, 4];
GP.init({
  id: 'mondrian', no: '11', title: 'MONDRIAN', cat: 'ART', bpm: 112, spb: 4, accent: '#d4251c', accent2: '#f2c21b',
  rule: `<p>Piet Mondrian's <em>Neo-Plasticism</em> (Le Néo-Plasticisme, 1920) cut painting down to its elements. In his words, paraphrased:</p>
<blockquote>Only straight lines, horizontal and vertical. Only the primary colours red, yellow and blue, plus the non-colours white, black and grey. No representation, no symmetry, only equilibrium through opposition.</blockquote>
<p>Here the canvas is a score. A playhead sweeps from left to right. When it reaches a <b>coloured plane</b>, that plane sounds: <b style="color:#d4251c">red</b> is the bell, <b style="color:#1f3fa0">blue</b> the bass and <b style="color:#f2c21b">yellow</b> the pluck. Height sets pitch and width sets duration. White is silence. <b>Black lines</b> are drums: a full-height line is a kick and shorter lines are woodblocks.</p>
<p>Mondrian loved jazz and wrote about it (<i>De jazz en de Neo-Plastiek</i>, 1927). <em>Boogie</em> mode reads a <i>Broadway Boogie Woogie</i> grid instead: yellow streets are pitches, the coloured squares on them are notes, crossing avenues walk the bass, and the eighth notes swing.</p>`,
  setup() {
    GP.buttons(['NEW COMPOSITION', () => { mode = 'composition'; subdivide(Math.floor(Math.random() * 1e6)); }], ['BOOGIE WOOGIE', () => { mode = 'boogie'; boogie(Math.floor(Math.random() * 1e6)); }]);
    GP.slider('SWING', 0, 0.45, 0.01, swing, (v) => (swing = v), (v) => Math.round(v * 100) + '%');
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.cv.addEventListener('pointerdown', (e) => { if (mode !== 'composition') return; const r = GP.cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * GX, y = ((e.clientY - r.top) / r.height) * GY; const hit = rects.find((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h); if (hit) { const cyc = ['white', 'red', 'blue', 'yellow', 'black']; hit.c = cyc[(cyc.indexOf(hit.c) + 1) % cyc.length]; } });
    subdivide(1920);
  },
  onStep(step, t, sd) {
    const c = step % GX, sw = step % 2 ? swing * sd : 0, tt = t + sw, sc = GP.SCALES[mode === 'boogie' ? 'blues' : scale]; GP.at(tt, () => (ph = c));
    if (mode === 'composition') {
      for (const r of rects) { if (r.x !== c || r.c === 'white' || r.c === 'black') continue; const deg = Math.round((GY - (r.y + r.h / 2)) * 1.2), d = r.w * sd * 0.95, v = Math.min(0.7, 0.3 + (r.w * r.h) / 120);
        if (r.c === 'red') GP.note({ m: GP.deg(deg, sc, root + 12), t: tt, d, v, voice: 'bell', pan: 0.3, lane: 0 }); else if (r.c === 'blue') GP.note({ m: GP.deg(Math.round(deg / 2), sc, root - 12), t: tt, d, v: v + 0.1, voice: 'bass', pan: -0.2, lane: 1 }); else GP.note({ m: GP.deg(deg, sc, root + 12), t: tt, d: Math.min(d, 0.6), v, voice: 'pluck', pan: -0.4, lane: 2 }); GP.at(tt, () => (r.lit = 1)); }
      for (const r of rects) if (r.c === 'black' && c >= r.x && c < r.x + r.w && (c - r.x) % 2 === 0) GP.note({ voice: 'metal', t: tt, d: 0.1, v: 0.25, lane: 9 });
      const vs = vlines.filter((l) => l.x === c); if (vs.length) { const len = vs.reduce((a, l) => a + l.h, 0); GP.note({ voice: len >= GY ? 'kick' : 'wood', f: 300 + len * 60, t: tt, v: 0.5 + Math.min(0.4, len / 20), lane: 9 }); }
      if (step % 2 === 0) GP.note({ voice: 'hat', t: tt, v: 0.08 + 0.02 * rects.filter((r) => c >= r.x && c < r.x + r.w).length, lane: 9 });
    } else if (streets) {
      for (const q of streets.sq) if (q.x === c && !q.v) { const deg = (GY - q.y) * 1; GP.note({ m: GP.deg(deg, sc, root + 12), t: tt, d: sd * 0.8, v: q.c === 'grey' ? 0.25 : 0.42, voice: q.c === 'red' ? 'pluck' : q.c === 'blue' ? 'marimba' : 'wood', f: 900, pan: q.c === 'red' ? 0.4 : -0.4, lane: q.c === 'red' ? 0 : 2 }); GP.at(tt, () => (q.lit = 1)); }
      if (streets.V.includes(c) || step % 2 === 0) { const m = root - 12 + BOOGIE[walk++ % 8]; GP.note({ m, t: tt, d: sd * 1.6, v: 0.55, voice: 'bass', lane: 1 }); }
      if (streets.V.includes(c)) GP.note({ voice: 'snare', t: tt, v: 0.25, lane: 9 }); if (step % 4 === 0) GP.note({ voice: 'kick', t: tt, v: 0.5, lane: 9 }); GP.note({ voice: 'hat', t: tt, v: step % 2 ? 0.12 : 0.2, lane: 9 });
      for (const b of streets.blocks) if (b.x === c) GP.note({ m: GP.deg(GY - b.y, sc, root + 7), t: tt, d: b.w * sd, v: 0.3, voice: 'organ', lane: 3 });
    }
  },
  draw(g, W, H) {
    const cw = W / GX, ch = H / GY, lw = Math.max(5, cw * 0.28);
    if (mode === 'composition') { g.fillStyle = COL.black; g.fillRect(0, 0, W, H); for (const r of rects) { g.fillStyle = COL[r.c] || COL.white; g.fillRect(r.x * cw + lw / 2, r.y * ch + lw / 2, r.w * cw - lw, r.h * ch - lw); if (r.lit > 0.02) { g.fillStyle = `rgba(255,255,255,${r.lit * 0.5})`; g.fillRect(r.x * cw + lw / 2, r.y * ch + lw / 2, r.w * cw - lw, r.h * ch - lw); r.lit *= 0.9; } } }
    else if (streets) { g.fillStyle = '#efece3'; g.fillRect(0, 0, W, H); g.fillStyle = COL.yellow; for (const y of streets.H) g.fillRect(0, y * ch - ch * 0.18, W, ch * 0.36); for (const x of streets.V) g.fillRect(x * cw - cw * 0.18, 0, cw * 0.36, H); for (const b of streets.blocks) { g.fillStyle = COL[b.c]; g.fillRect(b.x * cw, b.y * ch, b.w * cw, b.h * ch); g.fillStyle = COL.grey; g.fillRect(b.x * cw + b.w * cw * 0.3, b.y * ch + b.h * ch * 0.3, b.w * cw * 0.4, b.h * ch * 0.4); } for (const q of streets.sq) { const s = cw * 0.34 * (1 + (q.lit || 0) * 0.6); g.fillStyle = COL[q.c]; g.fillRect(q.x * cw + cw / 2 - s / 2, q.y * ch - s / 2 + (q.v ? ch / 2 : 0), s, s); if (q.lit) q.lit *= 0.9; } }
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(ph * cw, 0, cw, H); g.fillStyle = '#111'; g.fillRect(ph * cw, 0, 2, H);
    g.fillStyle = 'rgba(17,17,17,.82)'; g.fillRect(0, H - 24, W, 24); g.fillStyle = '#f4f1e8'; g.font = '18px VT323'; g.fillText(title.toUpperCase() + (mode === 'composition' ? '  ·  click a plane to recolour it' : '  ·  swing ' + Math.round(swing * 100) + '%'), 10, H - 7);
  },
  ai: {
    title: 'NEO-PLASTICIST', button: 'COMPOSE CANVAS', placeholder: 'a Mondrian of rainy Manchester at 2am',
    help: 'Describe a subject or mood. Gemini reduces it to Neo-Plastic rectangles on a 32 × 12 grid, each white, red, blue, yellow or black, and the playhead performs them.',
    system: `You are Piet Mondrian applying Neo-Plasticism (1920): only horizontal and vertical divisions, primary colours red, yellow, blue and non-colours white, black, grey; asymmetrical equilibrium. Abstract the user's subject into a composition that tiles a 32 (wide) x 12 (tall) grid exactly with 6-20 non-overlapping rectangles [x, y, w, h, colour], integer units, x+w<=32, y+h<=12. Usually 2-5 coloured rectangles, the rest white, maybe one small black. Remember it will be played left to right as music: wide coloured planes are long notes, high planes are high notes. Reply JSON only.`,
    schema: { type: 'object', properties: { title: { type: 'string' }, rects: { type: 'array', items: { type: 'object', properties: { x: { type: 'integer' }, y: { type: 'integer' }, w: { type: 'integer' }, h: { type: 'integer' }, colour: { type: 'string', enum: ['white', 'red', 'blue', 'yellow', 'black', 'grey'] } }, required: ['x', 'y', 'w', 'h', 'colour'] } }, why: { type: 'string' } }, required: ['rects'] },
    apply(r) { const L = (r.rects || []).map((q) => ({ x: GP.num(q.x, 0, GX - 1, 0) | 0, y: GP.num(q.y, 0, GY - 1, 0) | 0, w: GP.num(q.w, 1, GX, 1) | 0, h: GP.num(q.h, 1, GY, 1) | 0, c: COL[q.colour] ? q.colour : 'white' })).map((q) => ({ ...q, w: Math.min(q.w, GX - q.x), h: Math.min(q.h, GY - q.y) })).slice(0, 40); if (L.length < 2) throw new Error('too few rectangles'); mode = 'composition'; setRects(L); title = String(r.title || 'Composition').slice(0, 60); return `${title}: ${L.length} planes (${L.filter((q) => q.c !== 'white').length} coloured)` + (r.why ? '\n' + r.why : ''); },
    fallback(prompt) { mode = 'composition'; subdivide(GP.hash(prompt || 'x')); },
  },
});
var ph = 0;
