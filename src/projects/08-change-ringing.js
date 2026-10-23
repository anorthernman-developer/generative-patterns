/*META {"no":"08","title":"CHANGE RINGING","cat":"History","line":"English change ringing (17th century onward): bells never repeat a row, each bell moves at most one place per change, and place notation such as -16-16-16,12 (Plain Bob Minor) unrolls a permutation group until the bells come back to rounds.","gemini":"Writes place notation for a named method, or invents a new one; the app parses it, rings the plain course and checks whether it is true (no row repeated) and comes round."} */
const SYM = '1234567890ETABCD';
const PRESETS = [
  ['Plain Bob Minor', 6, '-16-16-16,12'], ['Cambridge Surprise Minor', 6, '-36-14-12-36-14-56,12'], ['Grandsire Doubles', 5, '3,1.5.1.5.1'], ['Plain Bob Doubles', 5, '5.1.5.1.5,125'],
  ['Plain Hunt on Six', 6, '-16'], ['Plain Bob Major', 8, '-18-18-18-18,12'], ['Cambridge Surprise Major', 8, '-38-14-1258-36-14-58-16-78,12'], ['Stedman Triples', 7, '3.1.7.3.1.3,1'],
];
let method = { name: '', stage: 6, pn: '' }, rows = [], info = {}, ri = 0, pos = 0, gapLeft = 0, cover = true, root = 60, working = 2, curBell = -1, flash = [];
function tok(s) { const out = []; let cur = ''; for (const ch of s.toUpperCase().replace(/\s/g, '')) { if (ch === 'X' || ch === '-') { if (cur) out.push(cur); cur = ''; out.push('x'); } else if (ch === '.') { if (cur) out.push(cur); cur = ''; } else if (SYM.includes(ch)) cur += ch; else throw new Error('bad character "' + ch + '"'); } if (cur) out.push(cur); return out; }
const pal = (a) => a.concat(a.slice(0, -1).reverse());
function parsePN(pn) { const parts = pn.split(','); if (parts.length > 2) throw new Error('at most one comma'); if (parts.length === 2) return pal(tok(parts[0])).concat(pal(tok(parts[1]))); return tok(parts[0]); }
function apply(row, t, n) { const r = row.slice(), P = t === 'x' ? new Set() : new Set([...t].map((c) => SYM.indexOf(c) + 1)); for (const p of P) if (p > n) throw new Error(`place ${SYM[p - 1]} is beyond stage ${n}`); let i = 1; while (i <= n) { if (P.has(i)) i++; else if (i + 1 <= n && !P.has(i + 1)) { [r[i - 1], r[i]] = [r[i], r[i - 1]]; i += 2; } else i++; } return r; }
function build(m) {
  const n = m.stage, changes = parsePN(m.pn); if (!changes.length) throw new Error('empty notation'); const rounds = [...Array(n).keys()];
  const R = [rounds]; let row = rounds, leads = 0, came = false; const seen = new Set([rounds.join()]); let truth = true;
  outer: while (R.length < 5100) { for (const c of changes) { row = apply(row, c, n); R.push(row); const k = row.join(); if (k === rounds.join()) { came = true; break outer; } if (seen.has(k)) truth = false; seen.add(k); } leads++; }
  return { R, info: { n, lead: changes.length, len: R.length - 1, leads: leads + (came ? 1 : 0), came, truth } };
}
function load(m) { const b = build(m); method = m; rows = b.R; info = b.info; ri = 0; pos = 0; gapLeft = 0; flash = Array(16).fill(0); working = Math.min(2, m.stage - 1); if (pnBox) pnBox.value = m.pn; return b.info; }
let pnBox, cur = [0, 0];
GP.init({
  id: 'change-ringing', no: '08', title: 'CHANGE RINGING', cat: 'HISTORY', bpm: 150, spb: 4, accent: '#8fb8ff', accent2: '#ff5a5a',
  rule: `<p>English bell ringers have rung <em>changes</em> since the 1600s (Fabian Stedman's <i>Tintinnalogia</i>, 1668). Each row is a permutation of the bells. The rules are:</p>
<blockquote>Each bell may move at most one place between rows. No row may be rung twice (the extent must be <b>true</b>). Ringing starts and ends in <b>rounds</b>.</blockquote>
<p><em>Place notation</em> lists the places that stay put, and every other pair swaps. <code>x</code> means all pairs swap. A comma means each half is a palindrome, so <code>-16-16-16,12</code> unrolls to x16x16x16x16x16x then 12. The leads repeat until the course comes back to rounds, so the method is in effect a permutation group.</p>
<p>The <b style="color:#ff5a5a">red line</b> is the treble and the <b style="color:#8fb8ff">blue line</b> is a working bell, as on a ringer's diagram. The pause before each handstroke row is the "handstroke gap".</p>`,
  setup() {
    GP.select('METHOD', PRESETS.map((p) => p[0]), PRESETS[0][0], (v) => { const p = PRESETS.find((x) => x[0] === v); load({ name: p[0], stage: p[1], pn: p[2] }); });
    pnBox = GP.textarea('PLACE NOTATION', '', () => {}); pnBox.rows = 2;
    GP.buttons(['RING THIS NOTATION', () => { try { const st = Math.max(3, Math.min(16, Math.max(...[...pnBox.value.toUpperCase()].map((c) => SYM.indexOf(c) + 1)), method.stage)); load({ name: 'Custom', stage: st, pn: pnBox.value }); GP.toast('ringing ' + info.len + ' changes'); } catch (e) { GP.toast('notation error: ' + e.message); } }], ['COVER TENOR', (e) => { cover = !cover; e.target.classList.toggle('on', cover); }]);
    GP.slider('PITCH', 48, 72, 1, root, (v) => (root = v));
    load({ name: PRESETS[0][0], stage: PRESETS[0][1], pn: PRESETS[0][2] });
  },
  onStep(step, t, sd) {
    if (gapLeft > 0) { gapLeft--; return; }
    const n = info.n, withCover = cover && n % 2 === 1, width = n + (withCover ? 1 : 0);
    if (ri >= rows.length) { ri = 0; }
    const row = rows[ri], b = pos < n ? row[pos] : n;
    const mm = root + 24 - [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24, 26][Math.min(15, b)];
    GP.note({ m: mm, t, d: 1.8, v: b === 0 ? 0.7 : 0.55 + (b === n - 1 ? 0.1 : 0), voice: 'tower', pan: ((b / Math.max(1, width - 1)) * 1.4 - 0.7), lane: b });
    const rr = ri, pp = pos; GP.at(t, () => { curBell = b; flash[b] = 1; cur = [rr, pp]; });
    pos++; if (pos >= width) { pos = 0; ri++; if (ri % 2 === 0) gapLeft = 1; if (ri >= rows.length) { ri = 0; gapLeft = 3; } }
  },
  draw(g, W, H) {
    g.fillStyle = '#080a10'; g.fillRect(0, 0, W, H);
    const n = info.n || 6, cw = Math.min(44, (W * 0.55) / n), rh = 22, x0 = 40, vis = Math.floor((H - 80) / rh), [cr, cp] = cur, start = Math.max(0, cr - Math.floor(vis * 0.6));
    g.font = '20px VT323'; g.textAlign = 'center';
    for (let k = 0; k < vis && start + k < rows.length; k++) { const r = rows[start + k], y = 60 + k * rh; if ((start + k) % info.lead === 0 && start + k) { g.fillStyle = '#26324d'; g.fillRect(x0 - 14, y - 16, n * cw + 10, 1); } for (let p = 0; p < n; p++) { const b = r[p]; g.fillStyle = start + k === cr && p === cp ? '#ffffff' : start + k < cr ? '#5c6680' : '#2c3448'; if (b !== 0 && b !== working) g.fillText(SYM[b], x0 + p * cw, y); } }
    for (const [bell, col, lw] of [[0, '#ff5a5a', 2], [working, '#8fb8ff', 3]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (let k = 0; k < vis && start + k < rows.length; k++) { const p = rows[start + k].indexOf(bell), x = x0 + p * cw, y = 54 + k * rh; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.textAlign = 'left'; g.fillStyle = '#8fb8ff'; g.font = '24px VT323'; g.fillText(method.name.toUpperCase() + `  (stage ${n})`, 16, 30);
    const cx = W * 0.8, cy = H * 0.42, R = Math.min(W * 0.16, H * 0.3);
    for (let b = 0; b < n + (cover && n % 2 ? 1 : 0); b++) { const a = -Math.PI / 2 + (b / (n + (cover && n % 2 ? 1 : 0))) * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, f = flash[b] || 0, sw = (cr % 2 ? -1 : 1) * f * 0.6; g.save(); g.translate(x, y); g.rotate(sw); g.fillStyle = f > 0.2 ? '#ffe9a8' : '#a07a3a'; g.beginPath(); g.moveTo(-12, 12); g.quadraticCurveTo(-11, -14, 0, -16); g.quadraticCurveTo(11, -14, 12, 12); g.closePath(); g.fill(); g.restore(); g.fillStyle = '#cfd8ee'; g.font = '18px VT323'; g.fillText(b < n ? SYM[b] : 'T', x - 4, y + 32); flash[b] = f * 0.9; }
    g.fillStyle = '#cfd8ee'; g.font = '19px VT323'; const L = [`LEAD ${info.lead} CHANGES`, `PLAIN COURSE ${info.len} CHANGES (${info.leads} leads)`, `CHANGE ${cr} / ${info.len}`, `${cr % 2 ? 'BACKSTROKE' : 'HANDSTROKE'}`, info.came ? (info.truth ? 'TRUE · COMES ROUND' : 'FALSE · ROWS REPEAT') : 'NEVER COMES ROUND (cut at 5100)'];
    L.forEach((s, i) => { g.fillStyle = i === 4 ? (info.came && info.truth ? '#7dff9a' : '#ff5a5a') : '#cfd8ee'; g.fillText(s, cx - R, cy + R + 60 + i * 22); });
  },
  ai: {
    title: 'TOWER CAPTAIN', button: 'GET METHOD', placeholder: 'Kent Treble Bob Minor  /  invent a new surprise minor method named after Sheffield',
    help: 'Ask for a known method or a new one. Gemini replies with place notation and stage. The app parses it, rings the plain course and reports whether it is true.',
    system: `You are an expert in English change ringing. Return the place notation of the requested method (or invent a plausible new one if asked) in standard form: 'x' or '-' for cross changes, places as bell symbols 1234567890ET separated by '.', and a single comma meaning "each half is palindromic" (e.g. Plain Bob Minor is -16-16-16,12; Grandsire Doubles is 3,1.5.1.5.1). Give stage = number of working bells (5 Doubles, 6 Minor, 7 Triples, 8 Major, ...). Reply JSON only.`,
    schema: { type: 'object', properties: { name: { type: 'string' }, stage: { type: 'integer', minimum: 3, maximum: 12 }, notation: { type: 'string' }, about: { type: 'string' } }, required: ['name', 'stage', 'notation'] },
    apply(r) { const st = GP.num(r.stage, 3, 12, 6) | 0, nm = String(r.name || 'Method').slice(0, 40); const inf = load({ name: nm, stage: st, pn: String(r.notation) }); return `${nm} · ${r.notation}\nlead ${inf.lead}, plain course ${inf.len} changes, ${inf.came ? (inf.truth ? 'true, comes round' : 'FALSE (repeats rows)') : 'never came round'}` + (r.about ? '\n' + r.about : ''); },
    fallback(prompt) { const p = PRESETS[GP.hash(prompt || 'x') % PRESETS.length]; load({ name: p[0], stage: p[1], pn: p[2] }); },
  },
});
