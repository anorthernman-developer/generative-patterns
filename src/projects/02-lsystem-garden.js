/*META {"no":"02","title":"L-SYSTEM GARDEN","cat":"Maths","line":"Lindenmayer grammars rewrite a string again and again (F → FF, X → F+[[X]-X]-F[-FX]+X); a turtle draws it as a plant, fractal or Penrose tiling and the same string is read as a score: F plays, + and − step the scale, [ ] branch into new voices.","gemini":"Writes new L-system grammars (axiom, rules, angle, depth) from a text prompt; the app validates the alphabet, caps growth and draws and plays the result."} */
const PRESETS = {
  'Fractal plant': { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25, iter: 5, draw: 'F', start: -65 },
  'Penrose P3 tiling': { axiom: '[7]++[7]++[7]++[7]++[7]', rules: { 6: '81++91----71[-81----61]++', 7: '+81--91[---61--71]+', 8: '-61++71[+++81++91]-', 9: '--81++++61[+91++++71]--71', 1: '' }, angle: 36, iter: 4, draw: '1', start: 0 },
  'Dragon curve': { axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, angle: 90, iter: 10, draw: 'F', start: 0 },
  'Sierpiński arrowhead': { axiom: 'A', rules: { A: 'B-A-B', B: 'A+B+A' }, angle: 60, iter: 6, draw: 'AB', start: 0 },
  'Hilbert curve': { axiom: 'A', rules: { A: '+BF-AFA-FB+', B: '-AF+BFB+AF-' }, angle: 90, iter: 5, draw: 'F', start: 0 },
  'Koch snowflake': { axiom: 'F--F--F', rules: { F: 'F+F--F+F' }, angle: 60, iter: 4, draw: 'F', start: 0 },
  'Bush': { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5, iter: 4, draw: 'F', start: -90 },
};
const LIM = 24000;
let sys, str = '', segs = [], pos = 0, wait = 0, deg0 = 0, scale = 'dorian', root = 50, cursor = { d: 0, depth: 0 }, stack = [], lastSeg = -1, bounds;
function expand(s) {
  let out = s.axiom; const it = GP.clamp(Math.round(s.iter), 1, 12); s.iterUsed = 0;
  for (let i = 0; i < it; i++) { let n = ''; for (const c of out) { n += c in s.rules ? s.rules[c] : c; if (n.length > LIM) break; } if (n.length > LIM) break; out = n; s.iterUsed = i + 1; }
  return out;
}
function load(s) {
  sys = s; str = expand(s); segs = []; let x = 0, y = 0, a = -(s.start || 0) * Math.PI / 180, st = []; const ang = s.angle * Math.PI / 180, depthOf = [];
  let depth = 0; for (let i = 0; i < str.length; i++) { const c = str[i];
    if (s.draw.includes(c)) { const nx = x + Math.cos(a), ny = y + Math.sin(a); segs.push({ x0: x, y0: y, x1: nx, y1: ny, i, depth }); x = nx; y = ny; }
    else if (c === '+') a += ang; else if (c === '-') a -= ang; else if (c === '|') a += Math.PI; else if (c === '[') { st.push([x, y, a]); depth++; } else if (c === ']') { const p = st.pop(); if (p) [x, y, a] = p; depth = Math.max(0, depth - 1); } }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const g of segs) { x0 = Math.min(x0, g.x0, g.x1); x1 = Math.max(x1, g.x0, g.x1); y0 = Math.min(y0, g.y0, g.y1); y1 = Math.max(y1, g.y0, g.y1); }
  bounds = { x0, y0, x1, y1 }; pos = 0; wait = 0; cursor = { d: 0, depth: 0 }; stack = []; lastSeg = -1;
  GP.hud(`${s.name || 'L-system'} · ${str.length} symbols · ${segs.length} strokes · depth ${s.iterUsed}`);
}
function advance(t, sd) {
  if (!str.length || !segs.length) return; let guard = 0;
  while (guard++ < 400) {
    if (pos >= str.length) { pos = 0; cursor = { d: 0, depth: 0 }; stack = []; lastSeg = -1; GP.at(t, () => (wrapFlash = 1)); }
    const c = str[pos];
    if (sys.draw.includes(c)) {
      let run = 1; while (pos + run < str.length && str[pos + run] === c) run++;
      const segIdx = segs.findIndex((s, k) => k > lastSeg && s.i >= pos); const d = cursor.d, depth = cursor.depth;
      const m = GP.deg(d + deg0, scale, root + 12 * Math.min(2, Math.floor(depth / 2))); const steps = run >= 8 ? 3 : run >= 3 ? 2 : 1;
      GP.note({ m, t, d: sd * steps * 0.95, v: 0.45 + 0.4 / (1 + depth), voice: depth === 0 ? 'pluck' : depth % 2 ? 'marimba' : 'bell', pan: Math.sin(depth * 1.7) * 0.6, lane: Math.min(depth, 3) });
      if (depth === 0 && cursor.beat++ % 4 === 0) GP.note({ m: GP.deg(d, scale, root - 12), t, d: sd * 4, v: 0.5, voice: 'bass', lane: 4 });
      const upto = segIdx < 0 ? segs.length - 1 : segs.findIndex((s, k) => k >= segIdx && s.i >= pos + run - 1);
      GP.at(t, () => (shown = Math.max(shown, upto < 0 ? segs.length - 1 : upto)));
      lastSeg = upto < 0 ? lastSeg : upto; pos += run; wait = steps - 1; return;
    }
    if (c === '+') cursor.d++; else if (c === '-') cursor.d--; else if (c === '[') { stack.push({ ...cursor }); cursor.depth++; } else if (c === ']') { const p = stack.pop(); if (p) cursor = { ...p, beat: cursor.beat }; }
    cursor.d = ((cursor.d % 14) + 14) % 14; pos++;
  }
}
let shown = -1, wrapFlash = 0;
GP.init({
  id: 'lsystem-garden', no: '02', title: 'L-SYSTEM GARDEN', cat: 'MATHS', bpm: 96, accent: '#7dff6a', accent2: '#ffd36a',
  rule: `<p>An <em>L-system</em> (Aristid Lindenmayer, 1968) starts from an axiom and rewrites every symbol by its rule, again and again. A few characters grow into a fern, a dragon curve or a <em>Penrose tiling</em> that never repeats.</p>
<blockquote>X → F+[[X]−X]−F[−FX]+X &nbsp; F → FF</blockquote>
<p>The turtle draws <em>F</em> as a line, turns on <em>+ −</em>, and saves/returns on <em>[ ]</em>. The music reads the same string: each stroke is a note, + and − step up or down the scale, a [ branch climbs to a new voice and octave, and ] snaps back to the trunk's pitch. Long runs of FFFF become one longer note, so the trunk is slow and the twigs are fast.</p>`,
  setup() {
    GP.select('GRAMMAR', Object.keys(PRESETS), 'Fractal plant', (v) => { load({ name: v, ...PRESETS[v] }); shown = -1; });
    GP.slider('DEPTH', 1, 8, 1, 5, (v) => { load({ ...sys, iter: v }); shown = -1; });
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.slider('ROOT', 36, 62, 1, root, (v) => (root = v));
    load({ name: 'Fractal plant', ...PRESETS['Fractal plant'] });
  },
  onStep(step, t, sd) { if (wait > 0) { wait--; return; } advance(t, sd); },
  onStart() { shown = -1; },
  draw(g, W, H) {
    g.clearRect(0, 0, W, H); if (!segs.length) return;
    const b = bounds, sc = Math.min((W - 60) / (b.x1 - b.x0 || 1), (H - 80) / (b.y1 - b.y0 || 1)), ox = (W - (b.x1 - b.x0) * sc) / 2 - b.x0 * sc, oy = (H - 40 - (b.y1 - b.y0) * sc) / 2 - b.y0 * sc;
    const X = (x) => ox + x * sc, Y = (y) => H - (oy + y * sc) - 10;
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(125,255,106,.10)'; g.lineWidth = 1; g.beginPath(); for (const s of segs) { g.moveTo(X(s.x0), Y(s.y0)); g.lineTo(X(s.x1), Y(s.y1)); } g.stroke();
    const cols = ['#7dff6a', '#ffd36a', '#ff7aa8', '#7ad7ff', '#c9a6ff'];
    for (let d = 0; d < 5; d++) { g.strokeStyle = cols[d]; g.lineWidth = Math.max(0.8, 2.6 - d * 0.5); g.beginPath(); for (let k = 0; k <= Math.min(shown, segs.length - 1); k++) { const s = segs[k]; if (Math.min(s.depth, 4) !== d) continue; g.moveTo(X(s.x0), Y(s.y0)); g.lineTo(X(s.x1), Y(s.y1)); } g.stroke(); }
    if (shown >= 0 && segs[shown]) { const s = segs[shown]; g.fillStyle = '#fff'; g.shadowColor = '#7dff6a'; g.shadowBlur = 16; g.beginPath(); g.arc(X(s.x1), Y(s.y1), 4, 0, 7); g.fill(); g.shadowBlur = 0; }
    g.font = '17px VT323'; g.fillStyle = '#ffd36a'; g.fillText(`AXIOM ${sys.axiom}   ` + Object.entries(sys.rules).map(([k, v]) => `${k}→${v || 'ε'}`).join('   ') + `   ∠${sys.angle}°`, 12, 22);
    const win = str.slice(Math.max(0, pos - 40), pos + 40); g.fillStyle = '#8c8170'; g.fillText(win, 12, 42); g.fillStyle = '#fff'; g.fillText(str[pos] || '', 12 + g.measureText(str.slice(Math.max(0, pos - 40), pos)).width, 42);
  },
  ai: {
    title: 'GROW A GRAMMAR', button: 'GROW', placeholder: 'a seaweed that sways and branches in threes',
    help: 'Describe a plant, a fractal, a coastline or a feeling. Gemini writes an L-system for it. The app checks every symbol, limits growth and plays the string.',
    system: `You write Lindenmayer systems (L-systems) that will be drawn by a turtle AND read as music. Alphabet: drawing symbols (listed in "draw", uppercase letters or digits that move forward and draw), any other uppercase letters/digits as non-drawing variables, + turn left by angle, - turn right, | turn 180, [ push state, ] pop state. In the music, every drawing symbol is a note, + and - step up/down a scale, [ starts a higher branch voice, ] returns. start_angle is the initial heading in degrees (-90 points up, 0 points right). Keep rules short (each replacement under 40 chars), choose iterations so the final string stays under 20000 symbols, balance brackets, and make strings with branching and runs for rhythmic interest. Reply with JSON only.`,
    schema: { type: 'object', properties: { name: { type: 'string' }, axiom: { type: 'string' }, rules: { type: 'array', items: { type: 'object', properties: { symbol: { type: 'string' }, replacement: { type: 'string' } }, required: ['symbol', 'replacement'] } }, angle: { type: 'number' }, iterations: { type: 'integer' }, draw: { type: 'string' }, start_angle: { type: 'number' }, scale: { type: 'string', enum: Object.keys(GP.SCALES) }, why: { type: 'string' } }, required: ['axiom', 'rules', 'angle', 'iterations', 'draw'] },
    apply(r) {
      const okc = /^[A-Z0-9+\-\[\]|]*$/; const ax = String(r.axiom || '').replace(/\s/g, ''); if (!ax || !okc.test(ax)) throw new Error('bad axiom');
      const rules = {}; for (const q of r.rules || []) { const k = String(q.symbol || '').trim(), v = String(q.replacement || '').replace(/\s/g, ''); if (k.length === 1 && /[A-Z0-9]/.test(k) && okc.test(v) && v.length <= 80) rules[k] = v; }
      if (!Object.keys(rules).length) throw new Error('no valid rules');
      const draw = String(r.draw || 'F').replace(/[^A-Z0-9]/g, '') || 'F';
      const s = { name: r.name || 'Gemini grammar', axiom: ax, rules, angle: GP.clamp(+r.angle || 25, 1, 180), iter: GP.clamp(Math.round(r.iterations || 4), 1, 10), draw, start: GP.num(r.start_angle, -360, 360, -90) };
      load(s); shown = -1; if (!segs.length) { load({ name: 'Fractal plant', ...PRESETS['Fractal plant'] }); throw new Error('grammar drew nothing'); }
      if (GP.SCALES[r.scale]) scale = r.scale;
      return `${s.name}\naxiom ${ax}\n${Object.entries(rules).map(([k, v]) => `${k} → ${v}`).join('\n')}\nangle ${s.angle}°, depth ${s.iterUsed}/${s.iter}, ${str.length} symbols${r.why ? '\n' + r.why : ''}`;
    },
    fallback() { const k = Object.keys(PRESETS)[Math.floor(Math.random() * 7)]; load({ name: k, ...PRESETS[k] }); shown = -1; },
  },
});
