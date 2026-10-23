/*META {"no":"18","title":"SUPREMATISM","cat":"Manifestos","line":"Kazimir Malevich's Suprematism (1915): the supremacy of pure feeling, with non-objective forms in white space; the Black Square is the zero of form and a drone, and every floating plane is a pure sine tone on the harmonic series (horizontal position gives the harmonic, size gives loudness, colour gives envelope, angle gives pulse).","gemini":"Translates any representational subject into non-objective Suprematist forms and lists exactly what it removed (the objects, people, horizon) so that only feeling remains."} */
const COLS = { black: '#111111', red: '#c62a1f', blue: '#1d3c8f', yellow: '#e8b81a', green: '#2f7d4f', grey: '#8f8f8f', white: '#fbfaf6' };
let forms = [], removed = [], title = 'Suprematist Composition (algorithmic)', f0 = 55, zeroing = false, zeroAt = 0, drift = 1;
function compose(seed) {
  const R = GP.rng(seed), F = [{ shape: 'square', colour: 'black', x: 0.3, y: 0.42, w: 0.2, h: 0.2, angle: 0.02 }]; const C = ['red', 'red', 'blue', 'yellow', 'black', 'green', 'grey'];
  for (let i = 0; i < 9; i++) { const sh = ['bar', 'bar', 'rect', 'circle', 'cross', 'square', 'triangle'][Math.floor(R() * 7)], s = 0.03 + R() * 0.12; F.push({ shape: sh, colour: C[Math.floor(R() * C.length)], x: 0.08 + R() * 0.84, y: 0.1 + R() * 0.8, w: sh === 'bar' ? s * 2.2 : s, h: sh === 'bar' ? s * 0.18 : sh === 'rect' ? s * 0.6 : s, angle: (R() - 0.5) * 1.6 }); }
  setForms(F); removed = []; title = 'Suprematist Composition #' + (seed % 1000);
}
function setForms(F) { forms = F.map((f, i) => ({ ...f, vx: (Math.random() - 0.5) * 0.004, vy: (Math.random() - 0.5) * 0.003, va: (Math.random() - 0.5) * 0.002, lit: 0, id: i, alpha: 1 })); }
const harm = (f) => (f.colour === 'black' && f.shape === 'square' && f.id === 0 ? 1 : 2 + Math.floor(Math.max(0, Math.min(0.999, f.x)) * 15));
const period = (f) => 4 + (Math.round(Math.abs(f.angle) * 12) % 13);
GP.init({
  id: 'suprematism', no: '18', title: 'SUPREMATISM', cat: 'MANIFESTO', bpm: 90, spb: 4, accent: '#c62a1f', accent2: '#111111',
  rule: `<p>Kazimir Malevich, <em>From Cubism and Futurism to Suprematism</em> (1915), paraphrased:</p>
<blockquote>Art must give up the object, so no more faces, landscapes or still lifes. Only the supremacy of pure feeling remains, carried by non-objective forms: squares, circles, crosses and bars floating in white infinity. The <b>Black Square</b> is the zero of form.</blockquote>
<p>Here each form is a <b>pure sine tone</b> on one harmonic series, the opposite of Russolo's noise. The Black Square is the fundamental (a drone), and every other plane sounds the harmonic set by its horizontal position (further right is higher). Size sets loudness and the tilt angle sets how often it pulses. Colour shapes the envelope: red pulses, blue swells, yellow pings, black holds and green trembles. The forms drift, so the chord keeps changing.</p>
<p><b>ZERO OF FORM</b> removes the forms one by one until only the Black Square is left.</p>`,
  setup() {
    GP.buttons(['NEW COMPOSITION', () => { zeroing = false; compose(Math.floor(Math.random() * 1e6)); }], ['ZERO OF FORM', () => { zeroing = true; }]);
    GP.slider('FUNDAMENTAL', 36, 110, 1, f0, (v) => (f0 = v), (v) => v + ' Hz');
    GP.slider('DRIFT', 0, 3, 0.1, drift, (v) => (drift = v));
    compose(1915);
  },
  onStep(step, t, sd) {
    if (zeroing && step % 32 === 0 && forms.length > 1) { const f = forms.filter((q) => q.id !== 0).sort((a, b) => a.w * a.h - b.w * b.h)[0]; GP.at(t, () => (f.dying = 1)); forms = forms.filter((q) => q !== f); fading.push(f); }
    for (const f of forms) {
      const n = harm(f), fr = f0 * n, area = f.w * f.h, P = f.id === 0 ? 16 : period(f), v = Math.min(0.5, 0.08 + Math.sqrt(area) * 1.2) / Math.sqrt(n * 0.5); if ((step + f.id * 3) % P !== 0) continue;
      const env = { black: [P * sd * 1.05, 'sine'], red: [sd * 1.5, 'sine'], blue: [P * sd * 0.9, 'pad'], yellow: [0.3, 'glass'], green: [P * sd * 0.6, 'sine'], grey: [sd * 2, 'sine'], white: [sd, 'sine'] }[f.colour] || [sd, 'sine'];
      GP.note({ f: fr, m: Math.round(69 + 12 * Math.log2(fr / 440)), t, d: env[0], v, voice: env[1], pan: (f.x - 0.5) * 1.2, lane: f.id % 8, att: f.colour === 'blue' ? env[0] * 0.4 : undefined });
      if (f.colour === 'green') for (let k = 1; k < 4; k++) GP.note({ f: fr, m: 0, t: t + k * sd * 0.5, d: sd * 0.4, v: v * 0.6, voice: 'sine', pan: (f.x - 0.5) * 1.2, lane: f.id % 8, noMidi: true });
      GP.at(t, () => (f.lit = 1));
    }
  },
  draw(g, W, H) {
    g.fillStyle = '#f3efe4'; g.fillRect(0, 0, W, H); const S = Math.min(W, H);
    g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 1; for (let n = 2; n <= 16; n++) { const x = ((n - 2) / 15) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    const all = forms.concat(fading); for (const f of all) {
      if (GP.playing && drift) { f.x += f.vx * drift * 0.2; f.y += f.vy * drift * 0.2; f.angle += f.va * drift * 0.2; if (f.x < 0.05 || f.x > 0.95) f.vx *= -1; if (f.y < 0.08 || f.y > 0.92) f.vy *= -1; }
      if (f.dying) { f.alpha *= 0.97; } g.save(); g.globalAlpha = f.alpha; g.translate(f.x * W, f.y * H); g.rotate(f.angle); g.fillStyle = COLS[f.colour] || '#111'; const w = f.w * S, h = f.h * S, k = 1 + f.lit * 0.04;
      g.scale(k, k);
      if (f.shape === 'circle') { g.beginPath(); g.arc(0, 0, w / 2, 0, 7); g.fill(); } else if (f.shape === 'cross') { g.fillRect(-w / 2, -w / 10, w, w / 5); g.fillRect(-w / 10, -w / 2, w / 5, w); } else if (f.shape === 'triangle') { g.beginPath(); g.moveTo(0, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); g.fill(); } else g.fillRect(-w / 2, -h / 2, w, h);
      g.restore(); f.lit *= 0.9;
    }
    fading = fading.filter((f) => f.alpha > 0.02);
    g.fillStyle = '#111'; g.font = '18px VT323'; g.fillText(title.toUpperCase(), 12, 22); g.fillStyle = '#555'; g.fillText(forms.map((f) => harm(f)).sort((a, b) => a - b).join(' · ') + `  (harmonics of ${f0} Hz)`, 12, H - 12);
    if (removed.length) { g.fillStyle = '#c62a1f'; g.font = '16px VT323'; g.fillText('REMOVED: ' + removed.join(', ').slice(0, 120), 12, 42); }
    if (zeroing && forms.length === 1) { g.fillStyle = '#111'; g.font = '22px VT323'; g.fillText('THE ZERO OF FORM', W - 200, 22); }
  },
  ai: {
    title: 'NON-OBJECTIVE TRANSLATOR', button: 'REMOVE THE OBJECT', placeholder: 'a fishing harbour at Whitby at sunset',
    help: 'Describe a scene or object. Gemini strips everything representational out of it, lists what it removed, and leaves the pure feeling as Suprematist forms. Each form becomes a pure tone.',
    system: `You are Kazimir Malevich (1915). Translate the user's representational subject into a non-objective Suprematist composition: list removed = the objects, people, horizon, narrative etc. you eliminated (5-12 items), and forms = 4-14 floating forms that keep only the feeling: {shape: square|rect|bar|circle|cross|triangle, colour: black|red|blue|yellow|green|grey|white, x, y (0..1 centre), w, h (0.01..0.3), angle radians}. Composition is dynamic and diagonal. Horizontal position will become the harmonic (left low, right high), size the loudness, angle the pulse rate. Optionally include one black square as the zero. Reply JSON only.`,
    schema: { type: 'object', properties: { title: { type: 'string' }, removed: { type: 'array', items: { type: 'string' } }, forms: { type: 'array', items: { type: 'object', properties: { shape: { type: 'string', enum: ['square', 'rect', 'bar', 'circle', 'cross', 'triangle'] }, colour: { type: 'string', enum: Object.keys(COLS) }, x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' }, angle: { type: 'number' } }, required: ['shape', 'colour', 'x', 'y', 'w'] } }, feeling: { type: 'string' } }, required: ['forms', 'removed'] },
    apply(r) { const SH = ['square', 'rect', 'bar', 'circle', 'cross', 'triangle']; const F = (r.forms || []).filter((f) => SH.includes(f.shape)).slice(0, 16).map((f) => ({ shape: f.shape, colour: COLS[f.colour] ? f.colour : 'black', x: GP.num(f.x, 0.03, 0.97, 0.5), y: GP.num(f.y, 0.05, 0.95, 0.5), w: GP.num(f.w, 0.01, 0.35, 0.08), h: GP.num(f.h, 0.005, 0.35, GP.num(f.w, 0.01, 0.35, 0.08)), angle: GP.num(f.angle, -3.2, 3.2, 0) })); if (F.length < 2) throw new Error('too few forms'); F.unshift({ shape: 'square', colour: 'black', x: 0.12, y: 0.82, w: 0.08, h: 0.08, angle: 0 }); setForms(F); zeroing = false; removed = (r.removed || []).map(String).slice(0, 14); title = String(r.title || 'Suprematist Composition').slice(0, 60); return `${title}\nRemoved: ${removed.join(', ')}\nForms → harmonics ${forms.map(harm).join(', ')}` + (r.feeling ? '\nFeeling: ' + r.feeling : ''); },
    fallback(prompt) { compose(GP.hash(prompt || 'x')); removed = String(prompt || '').split(/\s+/).filter((w) => w.length > 3).slice(0, 8); },
  },
});
var fading = [];
