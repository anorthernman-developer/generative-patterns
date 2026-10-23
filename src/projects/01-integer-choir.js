/*META {"no":"01","title":"INTEGER CHOIR","cat":"Maths","line":"Four voices each sing an integer sequence (Recamán, Collatz, Thue–Morse, digits of pi, primes, Fibonacci mod n) written as one-line recurrence formulas; the value picks the scale degree, negative values rest.","gemini":"Invents brand-new integer recurrences in a small safe formula language from your description, which the app parses, checks and sings."} */
/* ---- tiny safe formula language: numbers, n, a1 a2 a3 (previous terms), + - * / % ** comparisons && || ! ?: and a few functions ---- */
const FN = {
  abs: Math.abs, floor: Math.floor, min: Math.min, max: Math.max, sqrt: (x) => Math.floor(Math.sqrt(Math.abs(x))),
  gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
  isprime: (x) => { if (x < 2) return 0; for (let i = 2; i * i <= x; i++) if (x % i === 0) return 0; return 1; },
  np: (x) => { x = Math.max(1, Math.floor(x)) + 1; while (!FN.isprime(x)) x++; return x; },
  ds: (x) => String(Math.abs(Math.floor(x))).split('').reduce((s, d) => s + +d, 0),
  bits: (x) => { x = Math.abs(Math.floor(x)); let c = 0; while (x) { c += x & 1; x = Math.floor(x / 2); } return c; },
  pi: (k) => +PI[Math.abs(Math.floor(k)) % PI.length], tri: (k) => (k * (k + 1)) / 2,
};
const PI = (() => { let q = 1n, r = 0n, t = 1n, k = 1n, m = 3n, x = 3n, o = ''; while (o.length < 400) { if (4n * q + r - t < m * t) { o += m; const nr = 10n * (r - m * t); m = (10n * (3n * q + r)) / t - 10n * m; q *= 10n; r = nr; } else { const nr = (2n * q + r) * x, nm = (q * (7n * k + 2n) + r * x) / (t * x); q *= k; t *= x; x += 2n; k += 1n; m = nm; r = nr; } } return o; })();
function compile(src) {
  const toks = String(src).match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|\*\*|==|!=|<=|>=|&&|\|\||[-+*/%()<>!?:,]/g) || [];
  if (toks.join('').length !== String(src).replace(/\s+/g, '').length) throw new Error('Unknown symbol in formula');
  let i = 0; const peek = () => toks[i], eat = (t) => { if (t && toks[i] !== t) throw new Error(`Expected ${t}`); return toks[i++]; };
  const BP = { '?': 1, '||': 2, '&&': 3, '==': 4, '!=': 4, '<': 5, '>': 5, '<=': 5, '>=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7, '**': 8 };
  function prefix() {
    const t = eat(); if (t == null) throw new Error('Formula ended early');
    if (/^\d/.test(t)) { const v = +t; return () => v; }
    if (t === '(') { const e = expr(0); eat(')'); return e; }
    if (t === '-') { const e = expr(9); return (s) => -e(s); } if (t === '!') { const e = expr(9); return (s) => (e(s) ? 0 : 1); }
    if (/^[A-Za-z_]/.test(t)) {
      if (peek() === '(') { eat('('); const args = []; if (peek() !== ')') { do { args.push(expr(0)); } while (peek() === ',' && eat(',')); } eat(')');
        if (t === 'seen') return (s) => (s.seen.has(args[0](s)) ? 1 : 0); if (t === 'a') return (s) => s.term(args[0](s));
        const f = FN[t]; if (!f) throw new Error('Unknown function ' + t); return (s) => f(...args.map((a) => a(s))); }
      if (['n', 'a1', 'a2', 'a3'].includes(t)) return (s) => s[t]; throw new Error('Unknown name ' + t);
    }
    throw new Error('Unexpected ' + t);
  }
  function expr(rbp) {
    let left = prefix();
    while (i < toks.length && BP[peek()] > rbp) {
      const op = eat();
      if (op === '?') { const a = expr(0); eat(':'); const b = expr(0); const c = left; left = (s) => (c(s) ? a(s) : b(s)); continue; }
      const right = expr(op === '**' ? BP[op] - 1 : BP[op]), l = left;
      const F = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => (b ? Math.floor(a / b) : 0), '%': (a, b) => (b ? ((a % b) + Math.abs(b)) % Math.abs(b) : 0), '**': (a, b) => Math.pow(a, Math.min(b, 12)), '==': (a, b) => +(a === b), '!=': (a, b) => +(a !== b), '<': (a, b) => +(a < b), '>': (a, b) => +(a > b), '<=': (a, b) => +(a <= b), '>=': (a, b) => +(a >= b), '&&': (a, b) => +(a && b), '||': (a, b) => +(a || b) }[op];
      left = (s) => F(l(s), right(s));
    }
    return left;
  }
  const e = expr(0); if (i < toks.length) throw new Error('Unexpected ' + toks[i]); return e;
}
class Seq {
  constructor(v) { Object.assign(this, v); this.f = compile(v.formula); this.reset(); }
  reset() { this.vals = (this.init || []).slice(0, 3).map(Number); this.seen = new Set(this.vals); this.n = this.vals.length; }
  next() {
    const L = this.vals, s = { n: this.n, a1: L[L.length - 1] ?? 0, a2: L[L.length - 2] ?? 0, a3: L[L.length - 3] ?? 0, seen: this.seen, term: (k) => L[Math.floor(k)] ?? 0 };
    let v = this.f(s); if (!Number.isFinite(v)) v = 0; if (Math.abs(v) > 1e9) v = v % 1e9; v = Math.round(v);
    L.push(v); this.seen.add(v); this.n++; if (L.length > 4000) { L.splice(0, 2000); this.reset(); } return v;
  }
}
const LIB = {
  'Recamán': { formula: 'a1 - n > 0 && !seen(a1 - n) ? a1 - n : a1 + n', init: [0], span: 14, div: 2, voice: 'marimba', oct: 0 },
  'Collatz from 27': { formula: 'a1 == 1 ? 27 + n % 12 : (a1 % 2 == 0 ? a1 / 2 : 3 * a1 + 1)', init: [27], span: 10, div: 1, voice: 'pluck', oct: 1 },
  'Thue–Morse': { formula: 'bits(n) % 2 == 1 ? n % 5 : -1', init: [], span: 5, div: 1, voice: 'wood', oct: 2 },
  'Digits of pi': { formula: 'pi(n)', init: [], span: 10, div: 4, voice: 'bell', oct: 1 },
  'Primes': { formula: 'np(a1)', init: [2], span: 9, div: 2, voice: 'glass', oct: 2 },
  'Fibonacci mod 21': { formula: '(a1 + a2) % 21', init: [0, 1], span: 12, div: 4, voice: 'bass', oct: -1 },
  'Look at the gaps': { formula: 'np(a1)', init: [2], span: 7, div: 2, voice: 'pluck', oct: 0, diff: true },
  'Digit sums of squares': { formula: 'ds(n * n)', init: [], span: 9, div: 2, voice: 'marimba', oct: 1 },
};
const COLS = ['#ffb000', '#38e8c6', '#ff5f8a', '#9d8cff'];
let voices = [], hist = [[], [], [], []], scale = 'minpent', root = 45;
function setVoices(list) { voices = list.slice(0, 4).map((v, i) => { try { return new Seq({ name: v.name, formula: v.formula, init: v.init || [], span: GP.clamp(Math.round(v.span || 12), 2, 24), div: GP.clamp(Math.round(v.div || 1), 1, 8), voice: v.voice || 'pluck', oct: GP.clamp(Math.round(v.oct || 0), -2, 3), diff: !!v.diff, mute: false }); } catch (e) { GP.toast(`Voice ${i + 1}: ${e.message}`); return new Seq({ name: 'Recamán', ...LIB['Recamán'] }); } }); hist = voices.map(() => []); renderPickers(); }
function preset(names) { setVoices(names.map((n) => ({ name: n, ...LIB[n] }))); }
let pickers = [];
function renderPickers() { pickers.forEach((p, i) => { if (voices[i]) p.value = LIB[voices[i].name] ? voices[i].name : '__custom'; }); }
GP.init({
  id: 'integer-choir', no: '01', title: 'INTEGER CHOIR', cat: 'MATHS', bpm: 112, accent: '#ffb000',
  rule: `<p>Every voice is one line of maths: a <em>recurrence</em> that makes the next number from the step count <em>n</em> and the previous terms <em>a1, a2, a3</em>.</p>
<blockquote>Recamán: go back n if that number is new and positive, otherwise go forward n.</blockquote>
<p>Each number is folded into a scale (value mod span = scale degree). Negative numbers are rests, so a formula can carve rhythm too (Thue–Morse does). Sequences that never repeat exactly but keep returning to familiar shapes are the sweet spot: random-feeling, but rule-bound.</p>
<p class=small>The arcs are Recamán-style: each jump between consecutive values is drawn as a half-circle, above for one voice, below for the next.</p>`,
  setup() {
    const names = Object.keys(LIB);
    for (let i = 0; i < 4; i++) pickers.push(GP.select('VOICE ' + (i + 1), [...names, ['__custom', '(Gemini formula)']], names[i], (v) => { if (v !== '__custom') { voices[i] = new Seq({ name: v, ...LIB[v] }); hist[i] = []; } }));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.slider('ROOT', 36, 60, 1, root, (v) => (root = v));
    GP.buttons(['RESTART SEQUENCES', () => { voices.forEach((v) => v.reset()); hist = voices.map(() => []); }], ['SHUFFLE', () => { const n = Object.keys(LIB).sort(() => Math.random() - 0.5).slice(0, 4); preset(n); }]);
    preset(['Recamán', 'Collatz from 27', 'Thue–Morse', 'Digits of pi']);
  },
  onStep(step, t, sd) {
    voices.forEach((v, i) => {
      if (step % v.div) return; let x = v.next(); if (v.diff) { const L = v.vals; x = L.length > 1 ? L[L.length - 1] - L[L.length - 2] : x; }
      v.count = (v.count || 0) + 1; hist[i].push(x); if (hist[i].length > 64) hist[i].shift();
      if (x < 0 || v.mute) return; const d = ((x % v.span) + v.span) % v.span;
      const drum = v.voice === 'wood'; GP.note({ m: drum ? 70 + d * 2 : GP.deg(d, scale, root + 12 * v.oct), f: drum ? 300 + d * 180 : undefined, t, d: sd * v.div * 0.9, v: 0.55 + (i === 0 ? 0.1 : 0), voice: v.voice, pan: [-0.5, 0.5, -0.2, 0.2][i], lane: i });
    });
  },
  draw(g, W, H) {
    g.clearRect(0, 0, W, H);
    const mid = H * 0.55; g.strokeStyle = '#2c2820'; g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke();
    voices.forEach((v, i) => {
      const hs = hist[i]; if (!hs.length) return; const pos = hs.filter((x) => x >= 0), lo = Math.min(...pos, 0), hi = Math.max(lo + 12, ...pos); const sx = (x) => 30 + ((x - lo) / (hi - lo)) * (W - 60); const base = (v.count || 0) - hs.length;
      g.lineWidth = 1.6;
      for (let k = 1; k < hs.length; k++) { const a = hs[k - 1], b = hs[k]; if (a < 0 || b < 0) continue; const x0 = sx(a), x1 = sx(b), cx = (x0 + x1) / 2, r = Math.abs(x1 - x0) / 2; const up = (base + k) % 2 === 0; g.strokeStyle = COLS[i] + Math.round(40 + (k / hs.length) * 215).toString(16).padStart(2, '0'); g.beginPath(); g.arc(cx, mid, Math.max(r, 1), up ? Math.PI : 0, up ? 0 : Math.PI); g.stroke(); }
      g.fillStyle = 'rgba(8,7,6,.75)'; g.fillRect(6, 6 + i * 20, W - 12, 20); g.fillStyle = COLS[i]; g.font = '18px VT323'; g.fillText(`${v.name.toUpperCase()}  ${v.formula}`, 12, 22 + i * 20); g.fillStyle = '#8c8170'; g.fillText(hs.slice(-12).map((x) => (x < 0 ? '·' : x)).join(' '), 12 + Math.min(W * 0.55, 520), 22 + i * 20);
    });
  },
  ai: {
    title: 'INVENT SEQUENCES', button: 'INVENT FORMULAS', placeholder: 'four sequences that feel like rain on a tin roof, one slow bass, one that almost repeats',
    help: 'Describe a mood or a maths idea. Gemini writes new recurrences in the formula language, the app parses and checks them, then the choir sings them.',
    system: `You are a mathematician-composer. Design 4 integer sequences as recurrences in this tiny language.
Names: n (index, starting at the number of initial terms), a1, a2, a3 (previous terms), a(k) (k-th term). Operators: + - * / (integer division) % ** == != < > <= >= && || ! and c ? x : y. Functions: abs floor min max sqrt gcd(a,b) isprime(x) np(x) (next prime after x) ds(x) (digit sum) bits(x) (count of 1 bits) pi(k) (k-th digit of pi) tri(k) seen(x) (1 if x appeared earlier in this sequence).
Each voice's value modulo "span" picks a scale degree; negative values are rests. "div" = play every div sixteenth-steps (1 fast .. 8 slow). Prefer sequences that are random-looking but rule-bound (quasi-periodic, chaotic, self-similar). Keep values bounded (use % where needed). Reply with JSON only.`,
    schema: { type: 'object', properties: { title: { type: 'string' }, scale: { type: 'string', enum: Object.keys(GP.SCALES) }, voices: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'object', properties: { name: { type: 'string' }, formula: { type: 'string' }, init: { type: 'array', items: { type: 'integer' } }, span: { type: 'integer' }, div: { type: 'integer' }, voice: { type: 'string', enum: ['marimba', 'pluck', 'bell', 'glass', 'bass', 'organ', 'wood', 'sine'] }, oct: { type: 'integer' }, why: { type: 'string' } }, required: ['name', 'formula', 'span', 'div', 'voice'] } } }, required: ['voices'] },
    apply(r) {
      const ok = [], bad = [];
      for (const v of (r.voices || []).slice(0, 4)) { try { const s = new Seq({ ...v, init: v.init || [] }); for (let k = 0; k < 64; k++) s.next(); ok.push(v); } catch (e) { bad.push(`${v.name}: ${e.message}`); } }
      if (!ok.length) throw new Error('none of the formulas parsed');
      const spare = ['Thue–Morse', 'Digits of pi', 'Primes', 'Fibonacci mod 21'].filter((n) => !ok.some((v) => v.name === n)); while (ok.length < 4) { const n = spare.shift(); ok.push({ name: n, ...LIB[n] }); }
      if (GP.SCALES[r.scale]) scale = r.scale; setVoices(ok);
      return `${r.title || 'New choir'}\n` + ok.map((v) => `• ${v.name}: ${v.formula}${v.why ? `\n  ${v.why}` : ''}`).join('\n') + (bad.length ? `\nRejected: ${bad.join('; ')}` : '');
    },
    fallback() { const n = Object.keys(LIB).sort(() => Math.random() - 0.5).slice(0, 4); preset(n); },
  },
});
