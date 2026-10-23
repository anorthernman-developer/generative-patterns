/*META {"no":"07","title":"SLIME MOULD","cat":"Nature","line":"Physarum polycephalum agents sense, turn, move and deposit a trail; with food sources placed like cities they grow an efficient transport network, and each city plays when traffic reaches it, with the busiest hubs playing most often.","gemini":"Lays out the food network for any place you name (towns, stations, islands) as latitude, longitude and importance, so the mould rebuilds its rail map as music."} */
const UK = [['London', 51.51, -0.13, 1], ['Birmingham', 52.48, -1.9, 0.8], ['Manchester', 53.48, -2.24, 0.8], ['Leeds', 53.8, -1.55, 0.6], ['Liverpool', 53.41, -2.98, 0.6], ['Newcastle', 54.97, -1.61, 0.6], ['Glasgow', 55.86, -4.25, 0.7], ['Edinburgh', 55.95, -3.19, 0.7], ['Bristol', 51.45, -2.59, 0.6], ['Cardiff', 51.48, -3.18, 0.5], ['Sheffield', 53.38, -1.47, 0.5], ['Nottingham', 52.95, -1.15, 0.5], ['Norwich', 52.63, 1.3, 0.4], ['Plymouth', 50.37, -4.14, 0.4], ['Southampton', 50.9, -1.4, 0.4], ['Aberdeen', 57.15, -2.1, 0.4], ['Inverness', 57.48, -4.22, 0.3], ['Carlisle', 54.89, -2.93, 0.3], ['York', 53.96, -1.08, 0.4], ['Hull', 53.74, -0.33, 0.4], ['Cambridge', 52.2, 0.12, 0.4], ['Exeter', 50.72, -3.53, 0.4]];
const GW = 220, GH = 170; let trail = new Float32Array(GW * GH), tmp = new Float32Array(GW * GH), ag = [], nodes = [], edges = [], img, oc, P = { sa: 0.4, sd: 9, ra: 0.6, dep: 1, decay: 0.88, n: 3000 }, tmax = 6, scale = 'pentatonic', placeName = 'United Kingdom';
function seedAgents() { ag = []; for (let i = 0; i < P.n; i++) { const nd = nodes[i % Math.max(1, nodes.length)]; const a = Math.random() * 6.283, r = Math.random() * 6; ag.push(nd ? [nd.x + Math.cos(a) * r, nd.y + Math.sin(a) * r, Math.random() * 6.283] : [Math.random() * GW, Math.random() * GH, Math.random() * 6.283]); } }
function setNodes(list, name) {
  placeName = name || placeName; const la = list.map((n) => n[1]), lo = list.map((n) => n[2]); const mlat = (Math.min(...la) + Math.max(...la)) / 2, k = Math.cos((mlat * Math.PI) / 180);
  const x0 = Math.min(...lo) * k, x1 = Math.max(...lo) * k, y0 = Math.min(...la), y1 = Math.max(...la), s = Math.min((GW - 30) / Math.max(1e-6, x1 - x0), (GH - 30) / Math.max(1e-6, y1 - y0)), ox = (GW - (x1 - x0) * s) / 2, oy = (GH - (y1 - y0) * s) / 2;
  nodes = list.map(([n, lat, lon, imp], i) => ({ name: n, x: ox + (lon * k - x0) * s, y: oy + (y1 - lat) * s, imp, act: 0, deg: 0, flash: 0, i }));
  trail.fill(0); edges = []; seedAgents();
}
function sense(x, y, a) { const ix = Math.round(x + Math.cos(a) * P.sd), iy = Math.round(y + Math.sin(a) * P.sd); return ix < 0 || iy < 0 || ix >= GW || iy >= GH ? -1 : trail[iy * GW + ix]; }
function sim() {
  for (const p of ag) { const f = sense(p[0], p[1], p[2]), l = sense(p[0], p[1], p[2] - P.sa), r = sense(p[0], p[1], p[2] + P.sa);
    if (f >= l && f >= r) {} else if (l > r) p[2] -= P.ra; else if (r > l) p[2] += P.ra; else p[2] += (Math.random() - 0.5) * 2 * P.ra;
    let nx = p[0] + Math.cos(p[2]), ny = p[1] + Math.sin(p[2]); if (nx < 1 || ny < 1 || nx >= GW - 1 || ny >= GH - 1) { p[2] = Math.random() * 6.283; continue; } p[0] = nx; p[1] = ny; trail[(ny | 0) * GW + (nx | 0)] += P.dep; }
  for (const n of nodes) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const ix = (n.x | 0) + dx, iy = (n.y | 0) + dy; if (ix >= 0 && iy >= 0 && ix < GW && iy < GH) trail[iy * GW + ix] += 12 * n.imp; }
  for (let y = 1; y < GH - 1; y++) for (let x = 1; x < GW - 1; x++) { const i = y * GW + x; tmp[i] = ((trail[i] + trail[i - 1] + trail[i + 1] + trail[i - GW] + trail[i + GW] + trail[i - GW - 1] + trail[i - GW + 1] + trail[i + GW - 1] + trail[i + GW + 1]) / 9) * P.decay; }
  const t = trail; trail = tmp; tmp = t;
}
function measure() {
  edges = []; for (const n of nodes) n.deg = 0; let mx = 0, mean = 0; for (let i = 0; i < trail.length; i += 7) { mx = Math.max(mx, trail[i]); mean += trail[i]; } mean /= trail.length / 7; tmax = tmax * 0.9 + Math.max(2, mx * 0.5) * 0.1;
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d > Math.hypot(GW, GH) * 0.28) continue; let mn = 1e9; for (let k = 1; k < 12; k++) { const x = a.x + ((b.x - a.x) * k) / 12, y = a.y + ((b.y - a.y) * k) / 12; mn = Math.min(mn, trail[(y | 0) * GW + (x | 0)]); } if (mn > Math.max(0.3, mean * 3)) { edges.push([a, b, mn]); a.deg++; b.deg++; } }
  for (const n of nodes) { let s = 0; for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) { const ix = (n.x | 0) + dx, iy = (n.y | 0) + dy; if (ix >= 0 && iy >= 0 && ix < GW && iy < GH) s += trail[iy * GW + ix]; } n.act = s / 49; }
}
GP.init({
  id: 'slime-mould', no: '07', title: 'SLIME MOULD', cat: 'NATURE', bpm: 96, spb: 4, accent: '#e8e05a', accent2: '#ff9f3a',
  rule: `<p><em>Physarum polycephalum</em> is a single-celled slime mould with no brain, yet it finds efficient networks. In 2010 Tero et al. put oat flakes where Tokyo's cities are, and the mould grew a network that closely matched the region's rail system.</p>
<p>This is Jeff Jones's agent model: every particle <b>senses</b> the trail ahead, to the left and to the right, <b>turns</b> toward the strongest, <b>moves</b> one cell, and <b>deposits</b> trail. The trail then diffuses and decays, and food sources keep emitting.</p>
<p>A city plays a note when enough traffic reaches it (pitch follows north to south, pan follows west to east). Cities with more links play more often, and the busiest hub plays the bass. Click to add food, or right-click a city to remove it.</p>`,
  setup() {
    GP.slider('SENSOR ANGLE', 0.1, 1.2, 0.01, P.sa, (v) => (P.sa = v));
    GP.slider('SENSOR DIST', 3, 20, 1, P.sd, (v) => (P.sd = v));
    GP.slider('TURN', 0.1, 1, 0.01, P.ra, (v) => (P.ra = v));
    GP.slider('DECAY', 0.75, 0.97, 0.005, P.decay, (v) => (P.decay = v));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.buttons(['UK CITIES', () => setNodes(UK, 'United Kingdom')], ['RESET MOULD', () => { trail.fill(0); seedAgents(); }]);
    setNodes(UK, 'United Kingdom');
    GP.cv.addEventListener('contextmenu', (e) => e.preventDefault());
    GP.cv.addEventListener('pointerdown', (e) => { const r = GP.cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * GW, y = ((e.clientY - r.top) / r.height) * GH; if (e.button === 2) { let bi = -1, bd = 8; nodes.forEach((n, i) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) nodes.splice(bi, 1); } else nodes.push({ name: 'food ' + (nodes.length + 1), x, y, imp: 0.6, act: 0, deg: 0, flash: 0 }); });
  },
  onStep(step, t) {
    measure(); if (!nodes.length) return;
    const hub = nodes.reduce((a, b) => (b.deg > a.deg ? b : a), nodes[0]);
    for (const n of nodes) { if (n.act < tmax * 0.2) continue; const per = n.deg >= 4 ? 1 : n.deg === 3 ? 2 : n.deg === 2 ? 3 : n.deg === 1 ? 4 : 8; if ((step + n.i * 3) % (per * 2) !== 0) continue; const d = Math.round((1 - n.y / GH) * 14); GP.note({ m: GP.deg(d, GP.SCALES[scale], 57), t, d: 0.25 + n.imp * 0.4, v: 0.25 + Math.min(0.5, n.act / tmax / 2), voice: n.imp > 0.6 ? 'marimba' : 'pluck', pan: (n.x / GW) * 1.6 - 0.8, lane: n.i % 8 }); GP.at(t, () => (n.flash = 1)); }
    if (step % 16 === 0 && hub.deg) GP.note({ m: GP.deg(Math.round((1 - hub.y / GH) * 4), GP.SCALES[scale], 33), t, d: 1.2, v: 0.6, voice: 'bass', lane: 8 });
    if (step % 4 === 0 && edges.length > 3) GP.note({ voice: 'wood', t, v: Math.min(0.6, edges.length / 40), lane: 9 });
    if (step % 8 === 4 && edges.length > 12) GP.note({ voice: 'hat', t, v: 0.25, lane: 9 });
  },
  draw(g, W, H) {
    for (let i = 0; i < 2; i++) sim();
    if (!img) { oc = document.createElement('canvas'); oc.width = GW; oc.height = GH; img = oc.getContext('2d').createImageData(GW, GH); }
    const d = img.data; for (let i = 0; i < trail.length; i++) { const v = Math.min(1, trail[i] / tmax); d[i * 4] = 20 + 235 * v; d[i * 4 + 1] = 14 + 210 * v * v; d[i * 4 + 2] = 8 + 60 * v * v * v; d[i * 4 + 3] = 255; }
    oc.getContext('2d').putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(oc, 0, 0, W, H);
    const sx = W / GW, sy = H / GH; g.lineWidth = 1.5;
    for (const [a, b, v] of edges) { g.strokeStyle = `rgba(255,160,58,${Math.min(0.8, v / 8)})`; g.beginPath(); g.moveTo(a.x * sx, a.y * sy); g.lineTo(b.x * sx, b.y * sy); g.stroke(); }
    g.font = '15px VT323';
    for (const n of nodes) { const r = 3 + n.imp * 5 + n.flash * 4; g.fillStyle = n.flash > 0.1 ? '#fffbe0' : '#ff9f3a'; g.beginPath(); g.arc(n.x * sx, n.y * sy, r, 0, 7); g.fill(); g.fillStyle = '#f4eecb'; g.fillText(n.name, n.x * sx + 8, n.y * sy - 6); n.flash *= 0.9; }
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, H - 26, W, 26); g.fillStyle = '#e8e05a'; g.font = '17px VT323'; g.fillText(`${placeName.toUpperCase()}  ·  ${nodes.length} FOOD SOURCES  ·  ${edges.length} LINKS  ·  ${ag.length} AGENTS`, 10, H - 8);
  },
  ai: {
    title: 'NETWORK PLANNER', button: 'LAY FOOD', placeholder: 'Tokyo region rail cities / the Hebrides / Roman Britain towns',
    help: 'Name a place or historical network. Gemini puts oat flakes where its towns are (latitude, longitude, importance), and the mould grows its own transport network between them.',
    system: `You place food sources for a Physarum slime-mould simulation that recreates transport networks (homage to Tero et al. 2010 Tokyo rail experiment). Given a place, region or historical network, return 8 to 30 nodes with real approximate latitude and longitude (decimal degrees) and importance 0.2-1 (population or historical significance). Use real geography. Reply JSON only.`,
    schema: { type: 'object', properties: { place: { type: 'string' }, nodes: { type: 'array', minItems: 3, maxItems: 30, items: { type: 'object', properties: { name: { type: 'string' }, lat: { type: 'number' }, lon: { type: 'number' }, importance: { type: 'number' } }, required: ['name', 'lat', 'lon'] } }, note: { type: 'string' } }, required: ['nodes'] },
    apply(r, prompt) { const L = (r.nodes || []).filter((n) => isFinite(n.lat) && isFinite(n.lon) && Math.abs(n.lat) <= 90 && Math.abs(n.lon) <= 180).slice(0, 30).map((n) => [String(n.name || '?').slice(0, 20), +n.lat, +n.lon, GP.num(n.importance, 0.2, 1, 0.5)]); if (L.length < 3) throw new Error('need 3+ valid nodes'); setNodes(L, r.place || prompt); return `${L.length} food sources for ${placeName}` + (r.note ? '\n' + r.note : ''); },
    fallback(prompt) { const R = GP.rng(GP.hash(prompt || 'x')), L = []; for (let i = 0; i < 16; i++) L.push(['site ' + (i + 1), 50 + R() * 6, -5 + R() * 6, 0.3 + R() * 0.7]); setNodes(L, (prompt || 'random') + ' (random)'); },
  },
});
