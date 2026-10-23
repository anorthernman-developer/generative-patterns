/*META {"no":"10","title":"WÜRFELSPIEL","cat":"History","line":"The Musikalisches Würfelspiel (published 1792 and attributed to Mozart): for each of 16 bars, two dice choose one of 11 pre-composed bars sharing the same harmony, so every throw makes a correct minuet, with 11^16 (about 46 quadrillion) possible minuets.","gemini":"Writes a fresh 16 × 6 table of interchangeable bars over a harmonic plan in any style you name; the dice still decide which bar is played."} */
const PLAN0 = ['I', 'V', 'I', 'V', 'I', 'IV', 'V', 'V', 'V', 'I', 'V', 'I', 'IV', 'I', 'V', 'I'];
const CH = { I: [0, 2, 4], ii: [1, 3, 5], iii: [2, 4, 6], IV: [3, 5, 0], V: [4, 6, 1], vi: [5, 0, 2], vii: [6, 1, 3] };
let cur = 0, table = [], plan = PLAN0, bar = 0, dice = [1, 1], roll = 0, chosen = Array(16).fill(-1), styleName = 'Minuet in C (algorithmic table)', fold = false, rootM = 72, rolling = 0;
function figure(R, ch, cad) {
  const c = (k) => ch[k % 3] + 7 * Math.floor(k / 3), f = Math.floor(R() * 8), o = R() < 0.3 ? 3 : 0, N = null;
  if (cad === 'end') return [c(o), N, N, c(o) - 7 + 7, N, N].map((x, i) => (i === 0 ? ch[0] : i === 3 ? N : x));
  if (cad === 'half') return [c(1 + o), N, c(o), N, ch[0] + (ch[0] > 3 ? 0 : 7) - 7 + 0, N].map((x, i) => (i === 4 ? 4 : x));
  return [[c(o), N, c(o + 1), N, c(o + 2), N], [c(o + 2), c(o + 2) - 1, c(o + 1), c(o + 1) - 1, c(o), N], [c(o), c(o) + 1, c(o) + 2, c(o) + 3, c(o + 2), N], [c(o + 1), N, N, c(o + 1) + 1, c(o + 1), c(o)], [c(o), c(o) - 1, c(o), N, c(o + 2), c(o + 1)], [c(o + 2), N, c(o + 1), c(o), c(o + 1), N], [c(o), c(o + 1), c(o + 2), c(o + 1), c(o), N], [c(o + 3), N, c(o + 2) + 1, c(o + 2), c(o + 1), N]][f];
}
function algoTable(seed) { const R = GP.rng(seed); plan = PLAN0; table = plan.map((ch, b) => Array.from({ length: 11 }, () => figure(R, CH[ch], b === 15 ? 'end' : b === 7 ? 'half' : null))); fold = false; chosen.fill(-1); }
const pick = (s) => (fold ? [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0][s - 2] : s - 2);
GP.init({
  id: 'wurfelspiel', no: '10', title: 'WÜRFELSPIEL', cat: 'HISTORY', bpm: 132, spb: 2, accent: '#e7c06a', accent2: '#b03a2e',
  rule: `<p>In 1792 the Berlin publisher J.J. Hummel printed a <em>Musikalisches Würfelspiel</em>, a dice game for composing waltzes "without knowing anything about music", attributed to Mozart. Kirnberger and C.P.E. Bach had published similar games earlier.</p>
<blockquote>For each of the 16 bars, throw two dice. The sum (2–12) selects one of 11 bars from that column of the table.</blockquote>
<p>It works because every bar in a column fits the <b>same harmony</b>, so any choice is correct. Only the melodic figure changes, and bar 8 (half cadence) and bar 16 (full cadence) are almost fixed. Two dice give a bell curve, so 7 comes up most often. There are 11<sup>16</sup>, roughly 4.6 × 10<sup>16</sup>, possible minuets. This version has its own algorithmic table, a new one for each seed.</p>`,
  setup() {
    GP.buttons(['NEW TABLE', () => { algoTable(Math.random() * 1e9); styleName = 'Minuet in C (algorithmic table)'; }], ['REROLL ALL', () => chosen.fill(-1)]);
    GP.slider('KEY', 60, 79, 1, rootM, (v) => (rootM = v), (v) => ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][v % 12]);
    algoTable(1792);
  },
  onStart() { bar = 0; },
  onStep(step, t, sd) {
    const s = step % 6; if (s === 0) { bar = Math.floor(step / 6) % 16; const R = Math.random; const d = [1 + Math.floor(R() * 6), 1 + Math.floor(R() * 6)]; const sum = d[0] + d[1], b = bar; chosen[b] = pick(sum); GP.at(t, () => { dice = d; rolling = 1; cur = b; }); if (b === 0) GP.note({ voice: 'wood', t, v: 0.3, lane: 9 }); }
    const b = Math.floor(step / 6) % 16, mel = table[b][chosen[b] < 0 ? 0 : chosen[b]], deg = mel[s], ch = CH[plan[b]] || CH.I, sc = GP.SCALES.major;
    if (deg != null) { let len = 1; while (s + len < 6 && mel[s + len] == null) len++; GP.note({ m: GP.deg(deg, sc, rootM), t, d: len * sd * 0.92, v: s === 0 ? 0.55 : 0.42, voice: 'pluck', pan: 0.25, lane: 0 }); }
    if (s === 0) GP.note({ m: GP.deg(ch[0], sc, rootM - 24), t, d: sd * 1.8, v: 0.5, voice: 'pluck', pan: -0.3, lane: 1 });
    if (s === 2 || s === 4) { GP.note({ m: GP.deg(ch[1], sc, rootM - 12), t, d: sd * 0.9, v: 0.25, voice: 'pluck', pan: -0.2, lane: 1 }); GP.note({ m: GP.deg(ch[2], sc, rootM - 12), t, d: sd * 0.9, v: 0.22, voice: 'pluck', pan: -0.2, lane: 1 }); }
  },
  draw(g, W, H) {
    g.fillStyle = '#efe3c4'; g.fillRect(0, 0, W, H);
    const rowsN = fold ? 6 : 11, x0 = 60, y0 = 120, cw = (W - x0 - 20) / 16, rh = Math.min(26, (H - y0 - 130) / rowsN);
    g.font = '16px VT323'; g.textAlign = 'center';
    for (let s = 2; s <= 12; s++) { const r = pick(s); if (!fold || s <= 7) { g.fillStyle = '#5a4630'; g.fillText(fold ? `${s}/${14 - s}` : String(s), x0 - 26, y0 + r * rh + 17); } }
    for (let b = 0; b < 16; b++) { g.fillStyle = b === cur ? '#b03a2e' : '#5a4630'; g.fillText(String.fromCharCode(65 + b), x0 + b * cw + cw / 2, y0 - 8); g.fillStyle = '#8c7350'; g.fillText(plan[b], x0 + b * cw + cw / 2, y0 + rowsN * rh + 18); for (let r = 0; r < rowsN; r++) { const on = chosen[b] === r; g.fillStyle = on ? (b === cur ? '#b03a2e' : '#2a1d0c') : (b + r) % 2 ? '#e3d4ad' : '#d9c79c'; g.fillRect(x0 + b * cw + 1, y0 + r * rh + 1, cw - 2, rh - 2); g.fillStyle = on ? '#efe3c4' : '#8c7350'; g.fillText(String(1 + r * 16 + b), x0 + b * cw + cw / 2, y0 + r * rh + 18); } }
    g.strokeStyle = 'rgba(176,58,46,.6)'; g.lineWidth = 2; g.beginPath(); let st = false; for (let b = 0; b < 16; b++) if (chosen[b] >= 0) { const x = x0 + b * cw + cw / 2, y = y0 + chosen[b] * rh + rh / 2; st ? g.lineTo(x, y) : g.moveTo(x, y); st = true; } g.stroke();
    const rot = rolling * 3; rolling *= 0.9; dice.forEach((d, i) => { const x = 60 + i * 70, y = 50; g.save(); g.translate(x, y); g.rotate(rot * (i ? -1 : 1)); g.fillStyle = '#fffaf0'; g.strokeStyle = '#2a1d0c'; g.lineWidth = 2; g.fillRect(-24, -24, 48, 48); g.strokeRect(-24, -24, 48, 48); g.fillStyle = '#2a1d0c'; const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[d]; for (const [px, py] of P) { g.beginPath(); g.arc(px * 12, py * 12, 4.5, 0, 7); g.fill(); } g.restore(); });
    g.textAlign = 'left'; g.fillStyle = '#2a1d0c'; g.font = '24px VT323'; g.fillText(`= ${dice[0] + dice[1]}   BAR ${String.fromCharCode(65 + cur)} (${cur + 1}/16)`, 180, 46); g.font = '18px VT323'; g.fillText(styleName.toUpperCase(), 180, 70);
    const mel = table[cur]?.[Math.max(0, chosen[cur])] || [], my = H - 60; g.strokeStyle = '#8c7350'; g.lineWidth = 1; for (let l = 0; l < 5; l++) { g.beginPath(); g.moveTo(40, my - l * 10); g.lineTo(W - 40, my - l * 10); g.stroke(); }
    mel.forEach((d, i) => { if (d == null) return; const x = 80 + i * ((W - 160) / 6), y = my - d * 5 + 10; g.fillStyle = '#2a1d0c'; g.beginPath(); g.ellipse(x, y, 7, 5, -0.3, 0, 7); g.fill(); g.fillRect(x + 6, y - 32, 1.5, 32); });
  },
  ai: {
    title: 'KAPELLMEISTER', button: 'WRITE TABLE', placeholder: 'a Scottish strathspey in G / a gloomy baroque sarabande',
    help: 'Name a style. Gemini writes a 16-bar harmonic plan and 6 interchangeable melodic bars per column. Two dice are folded onto the 6 rows (2 or 12 → row 1, 7 → row 6), so the middle rows are the most common.',
    system: `You are writing a Musikalisches Würfelspiel (dice-game) table, like the 1792 Mozart-attributed minuet game. Return: style (short name), key (tonic as MIDI number 60-79), plan = 16 Roman numerals from I ii iii IV V vi vii (bar 8 should be V for a half cadence, bar 16 I), and bars = 16 columns, each with exactly 6 interchangeable melodic options; each option = exactly 6 eighth-note steps (3/4 time) as major-scale degrees relative to the tonic (0 = tonic, 7 = octave up, negative allowed) or null for a held note. Every option in a column MUST outline that column's chord on strong beats, so any choice fits. Reply JSON only.`,
    schema: { type: 'object', properties: { style: { type: 'string' }, key: { type: 'integer' }, plan: { type: 'array', items: { type: 'string' } }, bars: { type: 'array', items: { type: 'array', items: { type: 'array', items: { type: ['integer', 'null'] } } } } }, required: ['plan', 'bars'] },
    apply(r) {
      const P = (r.plan || []).slice(0, 16).map((c) => (CH[c] ? c : CH[String(c).replace(/[^ivIV]/g, '')] ? String(c).replace(/[^ivIV]/g, '') : 'I')); if (P.length !== 16) throw new Error('plan needs 16 bars');
      const T = (r.bars || []).slice(0, 16).map((col) => (Array.isArray(col) ? col : []).slice(0, 6).map((o) => { const a = (Array.isArray(o) ? o : []).slice(0, 6).map((d) => (d == null || !Number.isFinite(+d) ? null : Math.max(-7, Math.min(14, Math.round(+d))))); while (a.length < 6) a.push(null); if (a[0] == null) a[0] = 0; return a; }));
      if (T.length !== 16 || T.some((c) => c.length < 1)) throw new Error('need 16 columns'); T.forEach((c) => { while (c.length < 6) c.push(c[c.length - 1]); });
      plan = P; table = T; fold = true; chosen.fill(-1); styleName = String(r.style || 'Gemini table').slice(0, 50); if (Number.isFinite(r.key)) rootM = Math.max(60, Math.min(79, r.key | 0));
      return `${styleName}: 16 bars × 6 options = 6^16 ≈ 2.8 × 10^12 pieces\nplan: ${plan.join(' ')}`;
    },
    fallback(prompt) { algoTable(GP.hash(prompt || 'x')); styleName = 'Algorithmic table #' + (GP.hash(prompt || 'x') % 1000); },
  },
});

