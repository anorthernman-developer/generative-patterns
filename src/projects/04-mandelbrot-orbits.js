/*META {"no":"04","title":"MANDELBROT ORBITS","cat":"Maths","line":"Pick a point c on the Mandelbrot set and iterate z → z² + c: inside a period-3 bulb the orbit settles into a 3-note loop, near the edge it wanders for ages, and outside it escapes in a burst, so the geography of the set becomes a map of melodies and rhythms.","gemini":"Acts as a guide to the set's geography: from a description it chooses up to three c points (bulbs, Misiurewicz points, seahorse valley, the Feigenbaum point) and predicts the period you'll hear."} */
const PRE = { 'Rabbit (period 3)': [-0.123, 0.745], 'Period-2 bulb': [-1, 0.05], 'Seahorse valley': [-0.745, 0.113], '2/5 bulb (period 5)': [-0.504, 0.563], 'Feigenbaum point': [-1.4012, 0], 'Misiurewicz c = i': [0, 1], 'Just outside the cusp': [0.26, 0.0015], 'Elephant valley': [0.282, 0.01], 'Main cardioid': [-0.2, 0.1] };
const COL = ['#ffb000', '#38e8c6', '#ff5f8a'];
let V = [], view = { x0: -2.25, x1: 0.75, y0: -1.25, y1: 1.25 }, img = null, place = 0, scale = 'lydian', root = 50;
function voice(c, i, name) { return { c, z: [0, 0], hist: [], n: 0, esc: 0, name: name || '', div: [1, 2, 4][i] || 2, period: '?' }; }
function setPoints(list) { V = list.slice(0, 3).map((p, i) => voice([GP.clamp(+p.re, -2.2, 1), GP.clamp(+p.im, -1.5, 1.5)], i, p.name)); if (!V.length) V = [voice(PRE['Rabbit (period 3)'], 0, 'Rabbit')]; V.forEach((v, i) => (v.div = GP.clamp(Math.round(list[i]?.div || v.div), 1, 8))); }
function render(W, H) {
  const w = Math.max(80, Math.floor(W / 2)), h = Math.max(60, Math.floor(H / 2)); const asp = W / H, cy = 0, hh = 1.3, hw = hh * asp, cx = -0.75; view = { x0: cx - hw, x1: cx + hw, y0: cy - hh, y1: cy + hh };
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'), d = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const cr = view.x0 + (i / w) * (view.x1 - view.x0), ci = view.y1 - (j / h) * (view.y1 - view.y0); let zr = 0, zi = 0, k = 0; for (; k < 80 && zr * zr + zi * zi < 4; k++) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; } const o = (j * w + i) * 4; if (k === 80) { d.data[o] = 18; d.data[o + 1] = 12; d.data[o + 2] = 6; } else { const s = Math.sqrt(k / 80); d.data[o] = 255 * s; d.data[o + 1] = 150 * s * s; d.data[o + 2] = 40 * s; } d.data[o + 3] = 255; }
  x.putImageData(d, 0, 0); img = c;
}
const toScreen = (re, im, W, H) => [((re - view.x0) / (view.x1 - view.x0)) * W, ((view.y1 - im) / (view.y1 - view.y0)) * H];
function detectPeriod(h) { if (h.length < 40) return '…'; const L = h.slice(-40); for (let p = 1; p <= 16; p++) { let ok = true; for (let k = 0; k < 12; k++) { const a = L[L.length - 1 - k], b = L[L.length - 1 - k - p]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-3) { ok = false; break; } } if (ok) return p; } return 'chaotic'; }
GP.init({
  id: 'mandelbrot-orbits', no: '04', title: 'MANDELBROT ORBITS', cat: 'MATHS', bpm: 104, accent: '#ffb000', accent2: '#38e8c6',
  rule: `<p>Pick a point <em>c</em>. Start at z = 0 and repeat <em>z → z² + c</em>. Each new z is a note: its <em>angle</em> picks the scale degree and its <em>distance</em> from zero sets the octave and loudness.</p>
<blockquote>Every bulb on the set has a period. Click inside the big left disc and you hear a 2-note loop. The "rabbit" bulb gives you 3, smaller bulbs give 4, 5, 6 and more.</blockquote>
<p>Inside the set the orbit settles into a loop. Right on the edge it wanders, almost repeating. Outside it <em>escapes</em> with a burst of noise and restarts, so how long it takes to escape becomes the rhythm. <em>Click</em> to drop orbit 1, 2 or 3 in turn. Up to three orbits play at different speeds for polyrhythms.</p>`,
  setup() {
    GP.select('PRESET', Object.keys(PRE), 'Rabbit (period 3)', (k) => { V[0] = voice(PRE[k], 0, k); });
    GP.buttons(['CLEAR ORBITS', () => setPoints([{ re: -0.123, im: 0.745, name: 'Rabbit' }])], ['THREE RANDOM BULBS', () => setPoints(Object.entries(PRE).sort(() => Math.random() - 0.5).slice(0, 3).map(([k, [re, im]]) => ({ re, im, name: k })))]);
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    setPoints([{ re: -0.123, im: 0.745, name: 'Rabbit (period 3)', div: 1 }, { re: -1, im: 0.05, name: 'Period-2 bulb', div: 4 }, { re: -0.745, im: 0.113, name: 'Seahorse valley', div: 2 }]);
    GP.cv.addEventListener('pointerdown', (e) => { const r = GP.cv.getBoundingClientRect(), re = view.x0 + ((e.clientX - r.left) / r.width) * (view.x1 - view.x0), im = view.y1 - ((e.clientY - r.top) / r.height) * (view.y1 - view.y0); const i = Math.min(place, 2); V[i] = voice([re, im], i, 'clicked'); place = (place + 1) % 3; GP.ensure(); if (!GP.playing) GP.play(true); });
  },
  onStep(step, t, sd) {
    V.forEach((v, i) => {
      if (step % v.div) return; const [zr, zi] = v.z, [cr, ci] = v.c; v.z = [zr * zr - zi * zi + cr, 2 * zr * zi + ci]; v.n++;
      const r = Math.hypot(...v.z);
      if (r > 2 || v.n > 600) { GP.note({ m: 90, f: 400 + v.n * 60, to: 9000, t, d: 0.18, v: 0.5, voice: 'noise', q: 3, lane: 4 + i }); if (v.n < 12) GP.note({ m: 36, t, v: 0.7, voice: 'kick', lane: 7 }); const keep = v.hist; v.z = [0, 0]; v.n = 0; v.esc++; GP.at(t, () => (keep.length = 0)); return; }
      const ang = (Math.atan2(v.z[1], v.z[0]) + Math.PI) / (2 * Math.PI), deg = Math.floor(ang * 10), oct = r < 0.5 ? 0 : r < 1.2 ? 1 : 2;
      GP.note({ m: GP.deg(deg, scale, root + 12 * oct - (i === 1 ? 12 : 0)), t, d: sd * v.div * 0.9, v: 0.35 + Math.min(0.5, r / 3), voice: ['bell', 'pluck', 'marimba'][i], pan: [-0.5, 0, 0.5][i], lane: i });
      const z = v.z.slice(); GP.at(t, () => { v.hist.push(z); if (v.hist.length > 120) v.hist.shift(); v.period = detectPeriod(v.hist); });
    });
  },
  draw(g, W, H) {
    if (!img || GP.resized) render(W, H); g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, W, H);
    V.forEach((v, i) => {
      const [cx, cy] = toScreen(v.c[0], v.c[1], W, H); g.strokeStyle = COL[i]; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx + 8, cy); g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 8); g.stroke();
      g.globalAlpha = 0.8; g.lineWidth = 1; g.beginPath(); v.hist.slice(-40).forEach((z, k) => { const [x, y] = toScreen(z[0], z[1], W, H); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.globalAlpha = 1;
      const last = v.hist[v.hist.length - 1]; if (last) { const [x, y] = toScreen(last[0], last[1], W, H); g.fillStyle = '#fff'; g.shadowColor = COL[i]; g.shadowBlur = 14; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.shadowBlur = 0; }
      g.font = '18px VT323'; g.fillStyle = COL[i]; g.fillText(`ORBIT ${i + 1}  c = ${v.c[0].toFixed(4)} ${v.c[1] < 0 ? '−' : '+'} ${Math.abs(v.c[1]).toFixed(4)}i   ${v.name}   PERIOD ${v.period}   ESCAPES ${v.esc}   ÷${v.div}`, 12, 22 + i * 20);
    });
    g.font = '15px VT323'; g.fillStyle = '#8c8170'; g.fillText(`click to place orbit ${place + 1}`, 12, H - 12);
  },
  ai: {
    title: 'TOUR GUIDE', button: 'FIND POINTS', placeholder: 'a hypnotic 5-note loop against something that never settles',
    help: 'Describe the melodies you want. Gemini knows the set\'s geography (bulbs and their periods, Misiurewicz points, valleys) and picks up to three c values, predicting what each will do.',
    system: `You are a guide to the Mandelbrot set z -> z^2 + c used as a melody generator: each iterate's angle gives a scale degree; points inside hyperbolic components settle into a cycle whose length is the component's period (main cardioid = 1, disc centred -1 = 2, bulbs at -0.122+0.745i = 3, -0.156+1.032i (period-4 on top) etc., 2/5 bulb near -0.504+0.563i = 5), points on the boundary/near Misiurewicz points (c=i, c=-2, c=-0.1011+0.9563i) wander, points outside escape quickly (short rhythmic bursts) or slowly (near the cusp 0.25, seahorse valley -0.75+0.1i). Choose 1 to 3 points. div = play every div sixteenth-steps (1..8). Reply with JSON only.`,
    schema: { type: 'object', properties: { points: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', properties: { name: { type: 'string' }, re: { type: 'number' }, im: { type: 'number' }, div: { type: 'integer' }, expected: { type: 'string' } }, required: ['re', 'im'] } }, scale: { type: 'string', enum: Object.keys(GP.SCALES) }, why: { type: 'string' } }, required: ['points'] },
    apply(r) { const pts = (r.points || []).filter((p) => Number.isFinite(+p.re) && Number.isFinite(+p.im) && Math.hypot(p.re, p.im) < 2.5); if (!pts.length) throw new Error('no usable points'); setPoints(pts); if (GP.SCALES[r.scale]) scale = r.scale; return pts.map((p, i) => `${i + 1}. ${p.name || ''} c=${(+p.re).toFixed(4)}${p.im < 0 ? '' : '+'}${(+p.im).toFixed(4)}i ÷${V[i].div}${p.expected ? ` (${p.expected})` : ''}`).join('\n') + (r.why ? '\n' + r.why : ''); },
    fallback() { setPoints(Object.entries(PRE).sort(() => Math.random() - 0.5).slice(0, 3).map(([k, [re, im]]) => ({ re, im, name: k }))); },
  },
});
