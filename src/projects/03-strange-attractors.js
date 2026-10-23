/*META {"no":"03","title":"STRANGE ATTRACTORS","cat":"Maths","line":"A point flies around a chaotic attractor (Lorenz, Rössler, Aizawa, Thomas); every time it pierces the section plane it plays a note (a Poincaré section), and when the Lorenz butterfly flips wings the bass changes, so the rhythm is deterministic but never repeats.","gemini":"Chooses an attractor, its parameters (including periodic windows hidden in the chaos), the section plane and the musical mapping to match a mood you describe, and explains the choice."} */
const SYS = {
  lorenz: { p: { sigma: 10, rho: 28, beta: 8 / 3 }, dt: 0.006, f: ([x, y, z], p) => [p.sigma * (y - x), x * (p.rho - z) - y, x * y - p.beta * z], init: [1, 1, 20], sec: { axis: 2, value: 27 }, flip: 0, pitchAxis: 0, view: [0, 2] },
  rossler: { p: { a: 0.2, b: 0.2, c: 5.7 }, dt: 0.025, f: ([x, y, z], p) => [-y - z, x + p.a * y, p.b + z * (x - p.c)], init: [1, 1, 0], sec: { axis: 1, value: 0 }, flip: null, pitchAxis: 0, view: [0, 1] },
  aizawa: { p: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 }, dt: 0.012, f: ([x, y, z], p) => [(z - p.b) * x - p.d * y, p.d * x + (z - p.b) * y, p.c + p.a * z - z ** 3 / 3 - (x * x + y * y) * (1 + p.e * z) + p.f * z * x ** 3], init: [0.1, 0, 0], sec: { axis: 0, value: 0 }, flip: 2, pitchAxis: 2, view: [0, 2] },
  thomas: { p: { b: 0.208186 }, dt: 0.06, f: ([x, y, z], p) => [Math.sin(y) - p.b * x, Math.sin(z) - p.b * y, Math.sin(x) - p.b * z], init: [1.1, 1.1, -0.01], sec: { axis: 2, value: 0 }, flip: 0, pitchAxis: 1, view: [0, 1] },
};
let S = 'lorenz', P = { ...SYS.lorenz.p }, sec = { ...SYS.lorenz.sec }, pitchAxis = 0, X = [...SYS.lorenz.init], trail = [], cross = [], ret = [], lastCross = null, speed = 1, scale = 'minor', root = 50, rng = { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] }, lastSide = 0, rot = 0, flips = 0, voice = 'bell';
function setSystem(name, params, opts = {}) {
  S = SYS[name] ? name : 'lorenz'; const D = SYS[S]; P = { ...D.p }; for (const k in params || {}) if (k in P && Number.isFinite(+params[k])) P[k] = +params[k];
  sec = { axis: GP.clamp(opts.axis ?? D.sec.axis, 0, 2), value: Number.isFinite(+opts.value) ? +opts.value : D.sec.value }; pitchAxis = GP.clamp(opts.pitchAxis ?? D.pitchAxis, 0, 2);
  X = [...D.init]; trail = []; cross = []; ret = []; lastCross = null; rng = { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < 1500; i++) stepRK(D.dt); if (sysSel) sysSel.value = S;
}
function stepRK(h) {
  const D = SYS[S], f = (v) => D.f(v, P); const k1 = f(X), k2 = f(X.map((v, i) => v + (h / 2) * k1[i])), k3 = f(X.map((v, i) => v + (h / 2) * k2[i])), k4 = f(X.map((v, i) => v + h * k3[i]));
  const prev = X.slice(); X = X.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  if (!X.every(Number.isFinite) || X.some((v) => Math.abs(v) > 1e4)) { X = [...D.init]; GP.toast('Orbit escaped: restarting'); }
  for (let i = 0; i < 3; i++) { rng.lo[i] = Math.min(rng.lo[i], X[i]); rng.hi[i] = Math.max(rng.hi[i], X[i]); }
  return prev;
}
let sysSel;
GP.init({
  id: 'strange-attractors', no: '03', title: 'STRANGE ATTRACTORS', cat: 'MATHS', bpm: 90, accent: '#ff6a3d', accent2: '#6ad1ff',
  rule: `<p>Three simple equations, no randomness, yet the path never repeats. Edward Lorenz found this in 1963 while modelling weather. A tiny change at the start changes everything later, which became known as the <em>butterfly effect</em>.</p>
<blockquote>dx = σ(y − x) · dy = x(ρ − z) − y · dz = xy − βz</blockquote>
<p>The music is a <em>Poincaré section</em>: a glass plane cuts through the attractor and every time the orbit punches through it a note sounds. Its position along the plane picks the pitch and its speed sets the loudness. When the butterfly flips from one wing to the other the bass moves. The small square at the bottom right is the <em>return map</em>, plotting each crossing against the next. That's where the hidden order shows.</p>
<p class=small>Try ρ around 99.6 to 100.8 or 160 and the chaos locks into periodic windows. You'll hear the loop appear.</p>`,
  setup() {
    sysSel = GP.select('ATTRACTOR', Object.keys(SYS), 'lorenz', (v) => { setSystem(v); rhoS.set(P.rho ?? 28); });
    const rhoS = GP.slider('ρ (LORENZ)', 10, 200, 0.1, 28, (v) => { if (S === 'lorenz') P.rho = v; });
    GP.slider('SPEED', 0.25, 3, 0.05, 1, (v) => (speed = v));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.select('VOICE', ['bell', 'glass', 'marimba', 'pluck', 'organ'], voice, (v) => (voice = v));
    GP.buttons(['NUDGE START (BUTTERFLY)', () => { X[0] += 1e-6; GP.toast('Moved the start by 0.000001'); }]);
    setSystem('lorenz');
  },
  onStep(step, t, sd) {
    const D = SYS[S], n = Math.round(14 * speed); let played = 0;
    for (let i = 0; i < n; i++) {
      const prev = stepRK(D.dt), a = sec.axis, v0 = prev[a] - sec.value, v1 = X[a] - sec.value;
      if (v0 < 0 && v1 >= 0 && played < 2) {
        const pa = pitchAxis === a ? (a + 1) % 3 : pitchAxis, lo = rng.lo[pa], hi = rng.hi[pa], u = (X[pa] - lo) / (hi - lo || 1), sp = Math.hypot(...D.f(X, P));
        const d = Math.round(u * 13); const tt = t + (i / n) * sd;
        GP.note({ m: GP.deg(d, scale, root), t: tt, d: sd * 2, v: GP.clamp(0.3 + sp / (S === 'lorenz' ? 250 : 20), 0.3, 1), voice, pan: u * 1.6 - 0.8, lane: 0 });
        GP.at(tt, () => { cross.push({ p: X.slice(), life: 1 }); if (cross.length > 80) cross.shift(); });
        if (lastCross != null) { ret.push([lastCross, u]); if (ret.length > 400) ret.shift(); } lastCross = u; played++;
      }
      if (D.flip != null) { const side = Math.sign(X[D.flip]); if (side && side !== lastSide) { if (lastSide) { flips++; GP.note({ m: GP.deg(side > 0 ? 0 : 4, scale, root - 24), t: t + (i / n) * sd, d: sd * 6, v: 0.7, voice: 'bass', lane: 1 }); if (flips % 2) GP.note({ m: 36, t: t + (i / n) * sd, v: 0.6, voice: 'kick', lane: 2 }); } lastSide = side; } }
      if (i % 2 === 0) trail.push(X.slice()); if (trail.length > 2600) trail.shift();
    }
    if (step % 2 === 1) GP.note({ m: 80, t, v: 0.12 + 0.2 * Math.min(1, Math.abs(X[sec.axis] - sec.value) / ((rng.hi[sec.axis] - rng.lo[sec.axis]) / 2 || 1)), voice: 'hat', lane: 3 });
  },
  draw(g, W, H, now) {
    g.fillStyle = 'rgba(7,6,5,.5)'; g.fillRect(0, 0, W, H); rot += 0.003;
    const c = [0, 1, 2].map((i) => (rng.lo[i] + rng.hi[i]) / 2), sz = Math.max(...[0, 1, 2].map((i) => rng.hi[i] - rng.lo[i])) || 1, k = Math.min(W, H) * 0.8 / sz;
    const proj = (p) => { const x = p[0] - c[0], y = p[1] - c[1], z = p[2] - c[2]; const vx = SYS[S].view; const A = [x, y, z]; const u = A[vx[0]], w = A[3 - vx[0] - vx[1]], v = A[vx[1]]; const rx = u * Math.cos(rot) - w * Math.sin(rot); return [W / 2 + rx * k, H / 2 - v * k * 0.9]; };
    g.lineWidth = 1.2; for (let i = 1; i < trail.length; i++) { const a = proj(trail[i - 1]), b = proj(trail[i]); g.strokeStyle = `hsla(${(i / trail.length) * 60 + 10},100%,${30 + (i / trail.length) * 40}%,${0.15 + (i / trail.length) * 0.85})`; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    for (const q of cross) { const [x, y] = proj(q.p); g.fillStyle = `rgba(106,209,255,${q.life})`; g.beginPath(); g.arc(x, y, 2 + 5 * q.life, 0, 7); g.fill(); q.life = Math.max(0.15, q.life * 0.97); }
    const hp = proj(X); g.fillStyle = '#fff'; g.shadowColor = '#ff6a3d'; g.shadowBlur = 18; g.beginPath(); g.arc(hp[0], hp[1], 4, 0, 7); g.fill(); g.shadowBlur = 0;
    const s = 130, x0 = W - s - 16, y0 = H - s - 16; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x0, y0, s, s); g.strokeStyle = '#3d372c'; g.strokeRect(x0, y0, s, s); g.fillStyle = '#6ad1ff'; for (const [a, b] of ret) g.fillRect(x0 + a * s, y0 + s - b * s, 2, 2);
    g.font = '16px VT323'; g.fillStyle = '#8c8170'; g.fillText('RETURN MAP xₙ → xₙ₊₁', x0, y0 - 5);
    g.font = '18px VT323'; g.fillStyle = '#ff6a3d'; g.fillText(`${S.toUpperCase()}  ${Object.entries(P).map(([k, v]) => `${k}=${(+v).toFixed(3).replace(/\.?0+$/, '')}`).join('  ')}   SECTION ${'xyz'[sec.axis]}=${sec.value}   FLIPS ${flips}`, 12, 22);
  },
  ai: {
    title: 'TUNE THE CHAOS', button: 'TUNE', placeholder: 'restless but nearly looping, like a heartbeat that keeps losing count',
    help: 'Describe a mood. Gemini picks an attractor and parameter values (chaotic, or one of the periodic windows inside the chaos), places the section plane and explains why.',
    system: `You are a dynamical-systems expert scoring music. Systems and default parameters: lorenz {sigma 10, rho 28, beta 2.667} (rho<24.74 settles to a point; periodic windows near rho 99.65, 100.75, 160-166; rho>313 periodic), rossler {a 0.2, b 0.2, c 5.7} (c 2.3 = period 1, 3.3 = period 2, 5.3 = period 4ish, 5.7+ chaos, 18 = chaos), aizawa {a .95 b .7 c .6 d 3.5 e .25 f .1}, thomas {b 0.208186} (b<0.2 more chaotic, b ~ 0.32 periodic). A note plays each time the orbit crosses the plane coordinate[axis] = value upward (axis 0=x,1=y,2=z); the coordinate pitch_axis picks the pitch. Pick values that give the requested feel and keep the orbit bounded. Reply with JSON only.`,
    schema: { type: 'object', properties: { system: { type: 'string', enum: Object.keys(SYS) }, params: { type: 'object', properties: { sigma: { type: 'number' }, rho: { type: 'number' }, beta: { type: 'number' }, a: { type: 'number' }, b: { type: 'number' }, c: { type: 'number' }, d: { type: 'number' }, e: { type: 'number' }, f: { type: 'number' } } }, section_axis: { type: 'integer' }, section_value: { type: 'number' }, pitch_axis: { type: 'integer' }, scale: { type: 'string', enum: Object.keys(GP.SCALES) }, speed: { type: 'number' }, voice: { type: 'string', enum: ['bell', 'glass', 'marimba', 'pluck', 'organ'] }, why: { type: 'string' } }, required: ['system', 'params'] },
    apply(r) {
      setSystem(r.system, r.params, { axis: r.section_axis, value: r.section_value, pitchAxis: r.pitch_axis });
      if (GP.SCALES[r.scale]) scale = r.scale; if (r.speed) speed = GP.clamp(+r.speed, 0.25, 3); if (['bell', 'glass', 'marimba', 'pluck', 'organ'].includes(r.voice)) voice = r.voice;
      return `${S}: ${Object.entries(P).map(([k, v]) => `${k}=${(+v).toFixed(3)}`).join(', ')}\nsection ${'xyz'[sec.axis]} = ${sec.value}${r.why ? '\n' + r.why : ''}`;
    },
    fallback() { const k = Object.keys(SYS)[Math.floor(Math.random() * 4)]; setSystem(k); },
  },
});
