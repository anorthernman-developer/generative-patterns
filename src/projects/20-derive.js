/*META {"no":"20","title":"DÉRIVE","cat":"Manifestos","line":"Guy Debord, 'Theory of the Dérive' (1956): drop your usual reasons for moving and let the attractions of the terrain draw you; a walker drifts across a Voronoi city whose quarters each have their own ambience (mode, pulse, voice, density), and psychogeographic currents (the red arrows of 'The Naked City') and attractions steer it. You can only nudge it. Détournement plays a borrowed tune backwards and upside down and reverses your samples.","gemini":"Makes a psychogeographic map of any place you name: its quarters with their ambiences, attractions and repulsions, and the currents between them."} */
const VO = ['pluck', 'marimba', 'glass', 'reed', 'organ', 'bell', 'pad', 'square'], MODES = ['dorian', 'phrygian', 'lydian', 'minpent', 'wholetone', 'mixolydian', 'hirajoshi', 'minor', 'pentatonic'];
const PAL = ['#e9e1cf', '#dfe6e0', '#efe0d6', '#e4e1ea', '#ece8d2', '#d9e2ea', '#efe6e0', '#e0e8d7'];
const FJ = [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4]; // Frère Jacques, scale degrees (public domain)
let Q = [], cur = [], place = 'Paris, 1957 (after The Naked City)', W0 = { x: 0.5, y: 0.5, vx: 0, vy: 0 }, trail = [], qi = -1, prevQ = -1, det = false, log = [], map = null, mapDirty = true, R = Math.random, nudge = null, detPos = 0;
function gen(seed, names) {
  const r = GP.rng(seed), n = 7 + Math.floor(r() * 4), D = ['Les Halles at night', 'Canal Saint-Martin', 'Rue Mouffetard market', 'Jardin des Plantes', 'Gare de Lyon', 'Place de la Contrescarpe', 'Butte-aux-Cailles', 'Île de la Cité', 'Belleville steps', 'Quai de la Gare'];
  const N = names && names.length ? names : D;
  const P = []; while (P.length < n) { let x, y, k = 0; do { x = 0.1 + r() * 0.8; y = 0.1 + r() * 0.8; k++; } while (k < 200 && P.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.24)); P.push([x, y]); }
  Q = [...Array(n)].map((_, i) => ({ name: N[i % N.length], mood: '', x: P[i][0], y: P[i][1], mode: MODES[Math.floor(r() * MODES.length)], root: 38 + Math.floor(r() * 18), density: 0.25 + r() * 0.6, pulse: [1, 2, 2, 3, 4, 6][Math.floor(r() * 6)], voice: VO[Math.floor(r() * VO.length)], register: Math.floor(r() * 3), attraction: r() * 2 - 0.8 }));
  cur = []; for (let i = 0; i < n + 2; i++) { const a = Math.floor(r() * n), b = Math.floor(r() * n); if (a !== b) cur.push({ from: a, to: b, strength: 0.3 + r() * 0.7 }); }
  mapDirty = true; trail = []; qi = -1;
}
function nearest(x, y) { let b = 0, bd = 9, s = 9; Q.forEach((q, i) => { const d = Math.hypot(q.x - x, (q.y - y) * 0.75); if (d < bd) { s = bd; bd = d; b = i; } else if (d < s) s = d; }); return [b, s - bd]; }
function renderMap() {
  const MW = 240, MH = 170, c = document.createElement('canvas'); c.width = MW; c.height = MH; const g = c.getContext('2d'), img = g.createImageData(MW, MH);
  const cols = Q.map((_, i) => { const h = PAL[i % PAL.length]; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; });
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const [i, gap] = nearest(x / MW, y / MH), o = (y * MW + x) * 4, q = Q[i], ang = i * 1.7, s = (x * Math.cos(ang) + y * Math.sin(ang)), s2 = (x * Math.cos(ang + 1.57) + y * Math.sin(ang + 1.57)), street = ((s % (5 + (i % 3))) + 99) % (5 + (i % 3)) < 0.8 || ((s2 % 7) + 99) % 7 < 0.7; let [r, gg, b] = cols[i]; if (gap < 0.018) { r = gg = b = 252; } else if (street) { r -= 70; gg -= 70; b -= 70; } img.data[o] = r; img.data[o + 1] = gg; img.data[o + 2] = b; img.data[o + 3] = 255; }
  g.putImageData(img, 0, 0); map = c; mapDirty = false;
}
function arrow(g, x1, y1, x2, y2, w) { const a = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2 + Math.sin(a) * 30, my = (y1 + y2) / 2 - Math.cos(a) * 30; g.strokeStyle = '#d1261d'; g.fillStyle = '#d1261d'; g.lineWidth = 2 + w * 5; const dl = Math.hypot(x2 - x1, y2 - y1), sh = Math.min(0.3, 26 / (dl || 1)); x1 += (x2 - x1) * sh; y1 += (y2 - y1) * sh; x2 -= (x2 - x1) * sh; y2 -= (y2 - y1) * sh; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx, my, x2, y2); g.stroke(); const b = Math.atan2(y2 - my, x2 - mx), L = 12 + w * 8; g.beginPath(); g.moveTo(x2 + Math.cos(b) * 4, y2 + Math.sin(b) * 4); g.lineTo(x2 - Math.cos(b - 0.5) * L, y2 - Math.sin(b - 0.5) * L); g.lineTo(x2 - Math.cos(b + 0.5) * L, y2 - Math.sin(b + 0.5) * L); g.fill(); }
function setDet(on) {
  det = on; for (const s of GP.S.samples) { if (!s.buf) continue; if (on && !s.orig) { const b = s.buf, rv = GP.ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate); for (let c = 0; c < b.numberOfChannels; c++) { const a = b.getChannelData(c), d = rv.getChannelData(c); for (let i = 0; i < a.length; i++) d[i] = a[a.length - 1 - i]; } s.orig = b; s.buf = rv; } else if (!on && s.orig) { s.buf = s.orig; delete s.orig; } }
  const bt = [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('DÉTOURNEMENT')); if (bt) bt.textContent = 'DÉTOURNEMENT: ' + (on ? 'ON' : 'OFF');
}
function move() {
  if (!Q.length) return; const [i] = nearest(W0.x, W0.y); let ax = (R() - 0.5) * 0.0012, ay = (R() - 0.5) * 0.0012;
  Q.forEach((q, k) => { const dx = q.x - W0.x, dy = q.y - W0.y, d = Math.max(0.05, Math.hypot(dx, dy)); if (k !== i) { ax += (q.attraction * dx) / (d * d * d) * 0.000012; ay += (q.attraction * dy) / (d * d * d) * 0.000012; } });
  cur.filter((c) => c.from === i).forEach((c) => { const t = Q[c.to], dx = t.x - W0.x, dy = t.y - W0.y, d = Math.hypot(dx, dy) || 1; ax += (dx / d) * c.strength * 0.00012; ay += (dy / d) * c.strength * 0.00012; });
  if (nudge) { ax += (nudge.x - W0.x) * 0.0006; ay += (nudge.y - W0.y) * 0.0006; if (--nudge.n <= 0) nudge = null; }
  W0.vx = (W0.vx + ax) * 0.985; W0.vy = (W0.vy + ay) * 0.985; const sp = Math.hypot(W0.vx, W0.vy), mx = 0.0035; if (sp > mx) { W0.vx *= mx / sp; W0.vy *= mx / sp; }
  W0.x += W0.vx; W0.y += W0.vy; if (W0.x < 0.03 || W0.x > 0.97) { W0.vx *= -1; W0.x = Math.max(0.03, Math.min(0.97, W0.x)); } if (W0.y < 0.04 || W0.y > 0.96) { W0.vy *= -1; W0.y = Math.max(0.04, Math.min(0.96, W0.y)); }
  trail.push([W0.x, W0.y]); if (trail.length > 1600) trail.shift();
}
GP.init({
  id: 'derive', no: '20', title: 'DÉRIVE', cat: 'MANIFESTO', bpm: 104, spb: 4, accent: '#d1261d', accent2: '#222',
  rule: `<p>Guy Debord, <em>Théorie de la dérive</em> (1956), paraphrased: on a dérive you drop your usual reasons for moving (work, leisure, errands) and <b>let the attractions of the terrain and the encounters you find there draw you along</b>. The city has psychogeographic contours, with constant currents, fixed points and vortices that make some areas hard to enter or leave. The ambience changes abruptly from one street to the next.</p>
<p>The city here is a Voronoi map drawn in the style of <em>The Naked City</em> (Debord and Jorn, 1957): cut-up map fragments joined by red arrows. Each quarter has its own <b>ambience</b>, made of a mode, a root, a pulse, a density, a voice and an attraction (which can be a repulsion). The walker drifts on the currents and you <b>can't steer it</b>. A click only gives a gentle nudge, which wears off.</p>
<p><b>Détournement</b> (from Debord and Wolman's <em>User's Guide</em>, 1956) takes something familiar and turns it against itself. Here a borrowed nursery tune is played backwards and upside down in the current quarter's mode, and any samples you load are reversed.</p>
<p><em>Ne travaillez jamais</em> (never work): Debord's chalk graffito, 1953.</p>`,
  onSamples() { if (det) setDet(true); },
  setup() {
    GP.buttons(['NEW CITY', () => { gen(Math.floor(Math.random() * 1e6)); place = 'Unnamed city #' + Math.floor(Math.random() * 1000); }], ['DÉTOURNEMENT: OFF', () => setDet(!det)]);
    gen(1957);
    GP.cv.addEventListener('pointerdown', (e) => { const r = GP.cv.getBoundingClientRect(); nudge = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, n: 90 }; });
  },
  onStep(step, t, sd) {
    if (!Q.length) return; const [ni, gap] = nearest(W0.x, W0.y), i = qi >= 0 && qi < Q.length && ni !== qi && gap < 0.03 ? qi : ni, q = Q[i];
    if (i !== qi) { prevQ = qi; qi = i; const from = prevQ >= 0 ? Q[prevQ].name : '—'; GP.at(t, () => { log.unshift(`${from} → ${q.name}`); log.length = Math.min(8, log.length); }); [0, 2, 4].forEach((d, k) => GP.note({ m: GP.deg(d, q.mode, q.root + 12), t: t + k * 0.03, d: sd * 8, v: 0.35, voice: 'glass', lane: 7, pan: (q.x - 0.5) })); GP.note({ m: q.root - 12, t, d: sd * 6, v: 0.5, voice: 'bass', lane: 6 }); }
    if (step % 16 === 0) GP.note({ m: q.root, t, d: sd * 15, v: 0.25, voice: 'pad', lane: 5, pan: (W0.x - 0.5) });
    if (step % q.pulse === 0 && R() < q.density) { const dd = Math.floor((1 - W0.y) * 10) + Math.floor(R() * 5) - 2; GP.note({ m: GP.deg(dd, q.mode, q.root + 12 * (q.register + 1)), t, d: sd * q.pulse * (0.8 + R()), v: 0.45 + R() * 0.3, voice: q.voice, lane: i % 5, pan: (W0.x - 0.5) * 1.4 }); }
    if (det && step % 2 === 0) { const k = detPos++ % FJ.length, d = -FJ[FJ.length - 1 - k]; GP.note({ m: GP.deg(d + 7, q.mode, q.root + 12), t, d: sd * 1.8, v: 0.4, voice: 'reed', lane: 8, pan: -0.3 }); }
  },
  draw(g, W, H) {
    if (GP.playing) move();
    if (mapDirty) renderMap(); g.fillStyle = '#fcfbf7'; g.fillRect(0, 0, W, H); g.imageSmoothingEnabled = true; g.drawImage(map, 0, 0, W, H);
    for (const c of cur) { const a = Q[c.from], b = Q[c.to]; if (a && b) arrow(g, a.x * W, a.y * H, b.x * W, b.y * H, c.strength); }
    g.font = '15px VT323'; Q.forEach((q, i) => { g.fillStyle = i === qi ? '#d1261d' : '#222'; const s = q.name.toUpperCase(), tw = g.measureText(s).width, lx = Math.max(4, Math.min(W - tw - 6, q.x * W - tw / 2)); g.fillStyle = 'rgba(252,251,247,.85)'; g.fillRect(lx - 3, q.y * H + 8, tw + 6, 30); g.fillStyle = i === qi ? '#d1261d' : '#222'; g.fillText(s, lx, q.y * H + 21); g.fillStyle = '#666'; g.fillText(`${q.mode} · ${q.voice}${q.attraction < 0 ? ' · repels' : ''}`.slice(0, 40), lx, q.y * H + 34); });
    g.strokeStyle = 'rgba(20,20,20,.7)'; g.setLineDash([3, 4]); g.lineWidth = 1.5; g.beginPath(); trail.forEach(([x, y], k) => (k ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H))); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#111'; g.beginPath(); g.arc(W0.x * W, W0.y * H, 7, 0, 7); g.fill(); g.strokeStyle = '#d1261d'; g.lineWidth = 2; g.stroke();
    if (nudge) { g.strokeStyle = 'rgba(209,38,29,.5)'; g.beginPath(); g.arc(nudge.x * W, nudge.y * H, 10 + nudge.n / 6, 0, 7); g.stroke(); }
    g.fillStyle = 'rgba(252,251,247,.88)'; g.fillRect(8, 8, 330, 24 + log.length * 16); g.fillStyle = '#111'; g.font = '18px VT323'; g.fillText(place.toUpperCase().slice(0, 36), 14, 26); g.font = '15px VT323'; g.fillStyle = '#444'; log.forEach((l, k) => g.fillText(l.slice(0, 44), 14, 44 + k * 16));
    if (det) { g.fillStyle = '#d1261d'; g.font = '20px VT323'; g.fillText('DÉTOURNEMENT', W - 140, H - 14); }
  },
  ai: {
    title: 'PSYCHOGEOGRAPHIC MAP', button: 'MAP THE AMBIENCES', placeholder: 'Manchester Northern Quarter, Sunday 6am',
    help: 'Name a place and a time. Gemini splits it into quarters with distinct ambiences, attractions and repulsions, and currents between them. The walker then drifts through it, and you can only nudge it.',
    system: `You are a Situationist psychogeographer (Debord, 1956). For the user's place/time, return 6-11 quarters (unities of ambience) with: name, mood (few words), x,y (0..1 map position, spread out), mode (one of ${MODES.join('|')}), root (MIDI 36-60), density 0..1, pulse (steps per note 1-8), voice (one of ${VO.join('|')}), register 0-2, attraction (-1 repels .. 1 attracts). Also currents: directed psychogeographic slopes {from index, to index, strength 0..1} (4-12). Make ambiences contrast sharply between neighbours. Reply JSON only.`,
    schema: { type: 'object', properties: { place: { type: 'string' }, quarters: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, mood: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' }, mode: { type: 'string', enum: MODES }, root: { type: 'integer' }, density: { type: 'number' }, pulse: { type: 'integer' }, voice: { type: 'string', enum: VO }, register: { type: 'integer' }, attraction: { type: 'number' } }, required: ['name', 'x', 'y', 'mode'] } }, currents: { type: 'array', items: { type: 'object', properties: { from: { type: 'integer' }, to: { type: 'integer' }, strength: { type: 'number' } }, required: ['from', 'to'] } } }, required: ['quarters'] },
    apply(r) { const q = (r.quarters || []).slice(0, 12).map((z) => ({ name: String(z.name || 'quarter').slice(0, 30), mood: String(z.mood || '').slice(0, 30), x: GP.num(z.x, 0.05, 0.95, Math.random()), y: GP.num(z.y, 0.05, 0.95, Math.random()), mode: MODES.includes(z.mode) ? z.mode : 'dorian', root: GP.num(z.root, 30, 64, 48), density: GP.num(z.density, 0.05, 1, 0.5), pulse: Math.round(GP.num(z.pulse, 1, 8, 2)), voice: VO.includes(z.voice) ? z.voice : 'pluck', register: Math.round(GP.num(z.register, 0, 2, 1)), attraction: GP.num(z.attraction, -1, 1, 0) })); if (q.length < 3) throw new Error('too few quarters'); Q = q; cur = (r.currents || []).map((c) => ({ from: Math.round(GP.num(c.from, 0, 99, 0)), to: Math.round(GP.num(c.to, 0, 99, 0)), strength: GP.num(c.strength, 0, 1, 0.5) })).filter((c) => c.from < Q.length && c.to < Q.length && c.from !== c.to).slice(0, 14); place = String(r.place || 'Unnamed').slice(0, 50); mapDirty = true; trail = []; qi = -1; W0.x = Q[0].x; W0.y = Q[0].y; return `${place}: ${Q.length} quarters and ${cur.length} currents.\n` + Q.map((z) => `· ${z.name}${z.mood ? ' (' + z.mood + ')' : ''}: ${z.mode}, ${z.voice}, ${z.attraction < 0 ? 'repels' : 'attracts'}`).join('\n'); },
    fallback(prompt) { const words = String(prompt || '').split(/[\s,]+/).filter((w) => w.length > 3); gen(GP.hash(prompt || 'derive'), words.length >= 3 ? words.map((w, i) => w + ' ' + ['quarter', 'arcade', 'canal', 'yard', 'steps', 'market'][i % 6]) : null); place = (prompt || 'Unnamed city').slice(0, 40); },
  },
});
