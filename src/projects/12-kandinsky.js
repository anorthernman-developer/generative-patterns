/*META {"no":"12","title":"KANDINSKY","cat":"Art","line":"Kandinsky's synaesthetic correspondences (Concerning the Spiritual in Art, 1911; Point and Line to Plane, 1926): yellow is a trumpet, blue a cello or organ, red a tuba, triangles are sharp, circles calm, points short and lines are movement, all conducted by a radar sweep.","gemini":"Interprets any artwork, poem or memory as a Kandinsky composition of coloured points, lines, circles, triangles and squares; the sweep then performs it through the colour-to-timbre rules."} */
const KC = { yellow: '#f2c81e', orange: '#f08a24', red: '#d8322a', violet: '#7b3fa0', blue: '#2453b8', lightblue: '#79b4e8', green: '#3f9c5a', black: '#141414', white: '#fbf8ef' };
const TIMBRE = { yellow: ['square', 79, 'trumpet, shrill, earthly'], orange: ['tower', 67, 'church bell, alto'], red: ['reed', 55, 'tuba, fanfare'], violet: ['reed', 48, 'bassoon, cor anglais'], blue: ['bass', 40, 'cello, organ, deep'], lightblue: ['sine', 84, 'flute'], green: ['organ', 62, 'calm violin, middle'], black: [null, 0, 'final silence'], white: [null, 0, 'silence full of possibility'] };
let els = [], ang = 0, rev = 48, title = 'Composition (algorithmic, after VIII)', hushUntil = 0, scale = 'lydian';
function compose(seed) {
  const R = GP.rng(seed), L = [], C = Object.keys(KC).filter((c) => c !== 'white'); const pick = (a) => a[Math.floor(R() * a.length)];
  L.push({ shape: 'circle', colour: 'black', x: 0.2 + R() * 0.15, y: 0.25 + R() * 0.15, size: 0.13 }); L.push({ shape: 'circle', colour: 'violet', x: L[0].x, y: L[0].y, size: 0.09 });
  for (let i = 0; i < 6; i++) L.push({ shape: 'circle', colour: pick(['blue', 'lightblue', 'red', 'yellow', 'orange']), x: R(), y: R(), size: 0.02 + R() * 0.06 });
  for (let i = 0; i < 5; i++) L.push({ shape: 'triangle', colour: pick(['yellow', 'yellow', 'orange', 'red']), x: R(), y: R(), size: 0.04 + R() * 0.08, rot: R() * 6 });
  for (let i = 0; i < 3; i++) L.push({ shape: 'square', colour: pick(['red', 'red', 'blue', 'green']), x: R(), y: R(), size: 0.03 + R() * 0.05, rot: R() * 0.6 });
  for (let i = 0; i < 16; i++) L.push({ shape: 'point', colour: pick(C), x: R(), y: R(), size: 0.008 + R() * 0.01 });
  for (let i = 0; i < 6; i++) { const x = R(), y = R(); L.push({ shape: pick(['line', 'line', 'zigzag', 'curve']), colour: pick(['black', 'black', 'red', 'blue', 'yellow']), x, y, x2: x + (R() - 0.5) * 0.6, y2: y + (R() - 0.5) * 0.6, size: 0.004 }); }
  L.push({ shape: 'square', colour: 'white', x: 0.75, y: 0.7, size: 0.07 }); setEls(L);
}
function setEls(L) { els = L.map((e) => { if (!/line|zigzag|curve/.test(e.shape)) { e = { ...e, x: Math.min(0.94 - e.size, Math.max(0.06 + e.size, e.x)), y: Math.min(0.94 - e.size, Math.max(0.06 + e.size, e.y)) }; } const cx = e.shape.match(/line|zigzag|curve/) ? (e.x + (e.x2 ?? e.x)) / 2 : e.x, cy = e.shape.match(/line|zigzag|curve/) ? (e.y + (e.y2 ?? e.y)) / 2 : e.y; return { ...e, a: (Math.atan2(cy - 0.5, cx - 0.5) + Math.PI * 2.5) % (Math.PI * 2), r: Math.hypot(cx - 0.5, cy - 0.5), lit: 0 }; }); }
function sound(e, t, sd) {
  if (e.colour === 'black' && /circle|square|triangle/.test(e.shape)) { hushUntil = t + Math.min(2.5, Math.max(0.3, e.size * 12) * sd * 4); GP.at(t, () => (e.lit = 1)); return; } if (e.colour === 'white' && e.shape !== 'line') { GP.at(t, () => (e.lit = 1)); return; } if (t < hushUntil) return;
  const [voice, base] = (e.colour === 'black' || e.colour === 'white' ? TIMBRE.green : TIMBRE[e.colour]) || TIMBRE.green, sc = GP.SCALES[scale], deg = Math.round((0.5 - e.y) * 10), m = GP.deg(deg, sc, base), sz = e.size, pan = (e.x - 0.5) * 1.6;
  if (e.shape === 'point') GP.note({ voice: 'wood', f: GP.mtof(m + 12), t, v: 0.4, pan, lane: 9 });
  else if (e.shape === 'triangle') { GP.note({ m, t, d: 0.12 + sz * 2, v: 0.4 + sz * 3, voice: voice === 'bass' ? 'pluck' : voice, pan, lane: 0 }); GP.note({ m: m + 6, t: t + 0.06, d: 0.1, v: 0.3, voice: 'pluck', pan, lane: 0 }); }
  else if (e.shape === 'square') GP.note({ m, t, d: sd * (2 + sz * 60), v: 0.3 + sz * 3, voice: voice === 'square' ? 'organ' : voice, pan, lane: 1 });
  else if (e.shape === 'circle') GP.note({ m: m - (sz > 0.08 ? 12 : 0), t, d: sd * (3 + sz * 80), v: 0.25 + sz * 3, voice: sz > 0.08 ? 'pad' : voice === 'square' ? 'glass' : voice, pan, lane: 2 });
  else if (e.shape === 'line') GP.note({ f: GP.mtof(m), to: GP.mtof(GP.deg(Math.round((0.5 - e.y2) * 10), sc, base)), m, t, d: sd * 6, v: 0.3, voice: e.colour === 'black' ? 'sine' : 'reed', curve: 'sweep', pan, lane: 3 });
  else if (e.shape === 'curve') GP.note({ f: GP.mtof(m), to: GP.mtof(m + 7), m, t, d: sd * 5, v: 0.3, voice: 'sine', curve: 'arch', pan, lane: 3 });
  else if (e.shape === 'zigzag') for (let k = 0; k < 5; k++) GP.note({ m: GP.deg(deg + (k % 2 ? 4 : 0) - k, sc, base), t: t + k * sd * 0.5, d: sd * 0.45, v: 0.35, voice: 'square', pan, lane: 3 });
  GP.at(t, () => (e.lit = 1));
}
GP.init({
  id: 'kandinsky', no: '12', title: 'KANDINSKY', cat: 'ART', bpm: 100, spb: 4, accent: '#f2c81e', accent2: '#2453b8',
  rule: `<p>Wassily Kandinsky heard colour. In <em>Concerning the Spiritual in Art</em> (1911) he set out a list of correspondences, paraphrased here:</p>
<blockquote>Yellow is a shrill trumpet, earthly and aggressive. Light blue is a flute, darker blue a cello, and the deepest blue an organ. Warm red is a fanfare or tuba, and violet a bassoon or cor anglais. Orange is a church bell or an alto voice, and green is the calm middle of the violin. White is a silence full of possibility; black is a final silence.</blockquote>
<p>In <em>Point and Line to Plane</em> (1926) the <b>point</b> is a single short sound and a <b>line</b> is a point set in motion: straight lines hold a tone and angular lines jump. At the Bauhaus he paired yellow with the triangle, red with the square and blue with the circle.</p>
<p>A radar arm conducts. Every element it passes sounds with the timbre of its colour and the articulation of its shape. Height sets pitch, size sets weight, and position sets pan. A black element silences everything for a while.</p>`,
  setup() {
    GP.buttons(['NEW COMPOSITION', () => { compose(Math.floor(Math.random() * 1e6)); title = 'Composition (algorithmic)'; }]);
    GP.slider('SWEEP (STEPS / TURN)', 16, 128, 8, rev, (v) => (rev = v));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    compose(1923);
  },
  onStep(step, t, sd) {
    const a0 = ((step % rev) / rev) * Math.PI * 2, a1 = (((step % rev) + 1) / rev) * Math.PI * 2; GP.at(t, () => (ang = a0));
    for (const e of els) if (e.a >= a0 && e.a < a1) sound(e, t + ((e.a - a0) / (a1 - a0)) * sd, sd);
  },
  draw(g, W, H) {
    g.fillStyle = '#efe6d2'; g.fillRect(0, 0, W, H); const S = Math.min(W, H), ox = (W - S) / 2, X = (x) => ox + x * S, Y = (y) => y * S;
    g.fillStyle = 'rgba(180,150,90,.12)'; g.beginPath(); g.moveTo(X(0.5), Y(0.5)); g.arc(X(0.5), Y(0.5), S * 0.75, ang - Math.PI / 2 - 0.5, ang - Math.PI / 2); g.fill();
    for (const e of els) {
      const c = KC[e.colour] || '#333', s = e.size * S * (1 + e.lit * 0.25); g.save(); g.fillStyle = c; g.strokeStyle = c; g.globalAlpha = 0.85 + e.lit * 0.15;
      if (e.shape === 'circle') { g.beginPath(); g.arc(X(e.x), Y(e.y), s, 0, 7); g.fill(); if (e.lit > 0.1) { g.globalAlpha = e.lit * 0.5; g.lineWidth = 3; g.beginPath(); g.arc(X(e.x), Y(e.y), s + 8 + (1 - e.lit) * 30, 0, 7); g.stroke(); } }
      else if (e.shape === 'triangle') { g.translate(X(e.x), Y(e.y)); g.rotate(e.rot || 0); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.87, s * 0.5); g.lineTo(-s * 0.87, s * 0.5); g.closePath(); g.fill(); }
      else if (e.shape === 'square') { g.translate(X(e.x), Y(e.y)); g.rotate(e.rot || 0); g.fillRect(-s, -s, s * 2, s * 2); if (e.colour === 'white' && e.shape !== 'line') { g.strokeStyle = '#141414'; g.lineWidth = 1; g.strokeRect(-s, -s, s * 2, s * 2); } }
      else if (e.shape === 'point') { g.beginPath(); g.arc(X(e.x), Y(e.y), Math.max(3, s), 0, 7); g.fill(); }
      else { g.lineWidth = 2 + e.lit * 3; g.beginPath(); g.moveTo(X(e.x), Y(e.y)); if (e.shape === 'line') g.lineTo(X(e.x2), Y(e.y2)); else if (e.shape === 'curve') g.quadraticCurveTo(X((e.x + e.x2) / 2 + 0.12), Y((e.y + e.y2) / 2 - 0.12), X(e.x2), Y(e.y2)); else for (let k = 1; k <= 6; k++) g.lineTo(X(e.x + ((e.x2 - e.x) * k) / 6 + (k % 2 ? 0.025 : -0.025)), Y(e.y + ((e.y2 - e.y) * k) / 6)); g.stroke(); }
      g.restore(); e.lit *= 0.93;
    }
    g.strokeStyle = '#141414'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(0.5), Y(0.5)); g.lineTo(X(0.5) + Math.cos(ang - Math.PI / 2) * S, Y(0.5) + Math.sin(ang - Math.PI / 2) * S); g.stroke();
    g.fillStyle = '#141414'; g.font = '18px VT323'; g.fillText(title.toUpperCase(), 10, H - 10); if (GP.ctx && GP.ctx.currentTime < hushUntil) g.fillText('BLACK: SILENCE', 10, 20);
    g.fillStyle = 'rgba(239,230,210,.85)'; g.fillRect(W - 218, 22, 214, 172); let ly = 40; for (const [k, [, , desc]] of Object.entries(TIMBRE)) { g.fillStyle = KC[k]; g.fillRect(W - 210, ly - 10, 12, 12); g.strokeStyle = '#141414'; g.lineWidth = 0.5; g.strokeRect(W - 210, ly - 10, 12, 12); g.fillStyle = '#3a2f22'; g.fillText(desc, W - 192, ly); ly += 18; }
  },
  ai: {
    title: 'SYNAESTHETE', button: 'PAINT IT', placeholder: 'Wordsworth\'s Daffodils  /  the Shipping Forecast  /  my first rave in 1991',
    help: 'Give Gemini an artwork, poem, piece of music or memory. It paints a Kandinsky composition following his colour and form theory, and the sweep plays it.',
    system: `You are Wassily Kandinsky. Interpret the user's subject as an abstract composition using your theory: Concerning the Spiritual in Art (yellow = trumpet, earthly, aggressive; blue = depth, cello/organ, light blue = flute; red = warm fanfare/tuba; violet = bassoon; orange = bell; green = calm; white = silence of possibility; black = final silence) and Point and Line to Plane (point = brief sound; line = movement; angular zigzag = tension; curve = lyrical; triangle ~ yellow, square ~ red, circle ~ blue). Return 12-40 elements, each {shape: circle|triangle|square|point|line|zigzag|curve, colour: yellow|orange|red|violet|blue|lightblue|green|black|white, x, y in 0..1 (y=0 top), size 0.005..0.15, rot radians, and for line shapes x2, y2}. The composition is performed by a radar sweep from the centre, so placement around the centre is the rhythm; higher = higher pitch. Reply JSON only.`,
    schema: { type: 'object', properties: { title: { type: 'string' }, elements: { type: 'array', items: { type: 'object', properties: { shape: { type: 'string', enum: ['circle', 'triangle', 'square', 'point', 'line', 'zigzag', 'curve'] }, colour: { type: 'string', enum: Object.keys(KC) }, x: { type: 'number' }, y: { type: 'number' }, size: { type: 'number' }, rot: { type: 'number' }, x2: { type: 'number' }, y2: { type: 'number' } }, required: ['shape', 'colour', 'x', 'y'] } }, why: { type: 'string' } }, required: ['elements'] },
    apply(r) { const SH = ['circle', 'triangle', 'square', 'point', 'line', 'zigzag', 'curve']; const L = (r.elements || []).filter((e) => SH.includes(e.shape) && KC[e.colour]).slice(0, 60).map((e) => ({ shape: e.shape, colour: e.colour, x: GP.num(e.x, 0, 1, 0.5), y: GP.num(e.y, 0, 1, 0.5), size: GP.num(e.size, 0.004, 0.18, 0.04), rot: GP.num(e.rot, -7, 7, 0), x2: GP.num(e.x2, 0, 1, GP.num(e.x, 0, 1, 0.5) + 0.2), y2: GP.num(e.y2, 0, 1, GP.num(e.y, 0, 1, 0.5)) })); if (L.length < 3) throw new Error('too few elements'); setEls(L); title = String(r.title || 'Composition').slice(0, 60); const cnt = {}; L.forEach((e) => (cnt[e.colour] = (cnt[e.colour] || 0) + 1)); return `${title}: ${L.length} elements\n` + Object.entries(cnt).map(([k, v]) => `${k}×${v} (${TIMBRE[k][2]})`).join(', ') + (r.why ? '\n' + r.why : ''); },
    fallback(prompt) { compose(GP.hash(prompt || 'x')); title = 'Composition for "' + (prompt || '').slice(0, 30) + '" (algorithmic)'; },
  },
});
