/*META {"no":"09","title":"ISORHYTHM","cat":"History","line":"The 14th-century Ars Nova motet: a pitch cycle (color) and a rhythm cycle (talea) of different lengths repeat against each other until they realign after their lowest common multiple, and Guido of Arezzo's c.1026 vowel method turns any text into the chant.","gemini":"Composes a three-voice isorhythmic motet for a theme (text, colors as modal degrees and taleas as durations), which the engine cycles exactly; with no key, the text you type becomes the chant through Guido's vowel table."} */
const UT = 'Ut queant laxis resonare fibris mira gestorum famuli tuorum solve polluti labii reatum sancte Iohannes';
const GAMUT = [43, 45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69]; // Γ A B C D E F G a b c d e f g aa
const NAMES = ['Γ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'aa'];
const DOR = [0, 2, 3, 5, 7, 9, 10];
let V = [], text = UT, cycles = 0, diminish = false, hocket = false, rhythmScale = 1, mark = [];
function vowels(s) { return (s.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').match(/[aeiouy]+/g) || ['a']).map((v) => (v[0] === 'y' ? 'i' : v[0])); }
function guido(s) { let prev = 4; return vowels(s).map((v, i) => { const cands = GAMUT.map((_, k) => k).filter((k) => 'aeiou'[k % 5] === v); const best = cands.reduce((a, k) => (Math.abs(k - prev) + (i % 3 === 0 ? 0 : 0) < Math.abs(a - prev) ? k : a), cands[0]); prev = best; return GAMUT[best]; }); }
const lcm = (a, b) => { const g = (x, y) => (y ? g(y, x % y) : x); return (a * b) / g(a, b); };
function mk(name, color, talea, voice, oct, col) { return { name, color, talea, voice, oct, col, ci: 0, ti: 0, next: 0, lit: 0, lastM: 0 }; }
function fromText(t) { text = t || UT; const c = guido(text); V = [mk('TENOR', c.slice(0, Math.min(c.length, 19)), [4, 2, 2, -2, 6, 2, -4], 'organ', 0, '#d9a441'), mk('MOTETUS', c.slice(0, 13).map((m) => m + 7), [2, 1, 1, 2, -1, 3, 1, -1], 'reed', 0, '#c0392b'), mk('TRIPLUM', c.slice().reverse().slice(0, 11).map((m) => m + 12), [1, 1, -1, 1, 2, 1, 1, -2], 'glass', 0, '#2e86c1')]; reset(); }
function reset() { for (const v of V) { v.ci = 0; v.ti = 0; v.next = 0; } cycles = 0; }
function period(v) { const notes = v.talea.filter((d) => d > 0).length || 1; return lcm(v.color.length, notes); }
GP.init({
  id: 'isorhythm', no: '09', title: 'ISORHYTHM', cat: 'HISTORY', bpm: 100, spb: 2, accent: '#d9a441', accent2: '#c0392b',
  rule: `<p>In the Ars Nova motet (Philippe de Vitry, Guillaume de Machaut, c.1320–1370), the tenor repeats two independent cycles: a pitch sequence called the <b>color</b> and a rhythm pattern called the <b>talea</b>. When their lengths differ, the same pitches return with new rhythms, and everything only lines up again after the <em>lowest common multiple</em> of the two lengths. The upper voices have cycles of their own. In <em>diminution</em> the talea is played at half its values, and in <em>hocket</em> two voices "hiccup", sharing a line note by note.</p>
<p>The chant comes from <b>Guido of Arezzo's vowel method</b> (Micrologus, c.1026). The vowels a, e, i, o and u are laid in a repeating cycle along the gamut Γ–aa, and each syllable's vowel picks a pitch from its slots, choosing whichever is nearest the previous note. Type any text to hear its chant. The default is <i>Ut queant laxis</i>, the hymn that gave us ut-re-mi.</p>`,
  setup() {
    const ta = GP.textarea('TEXT (GUIDO\'S VOWELS)', UT, () => {}); ta.rows = 3;
    GP.buttons(['SET TEXT AS CHANT', () => { fromText(ta.value); GP.toast(V[0].color.length + ' note color'); }], ['DIMINUTION', (e) => { diminish = !diminish; e.target.classList.toggle('on', diminish); }], ['HOCKET', (e) => { hocket = !hocket; e.target.classList.toggle('on', hocket); }]);
    GP.slider('TALEA STRETCH', 1, 3, 1, 1, (v) => (rhythmScale = v), (v) => '×' + v);
    fromText(UT);
  },
  onStart() { reset(); },
  onStep(step, t, sd) {
    V.forEach((v, vi) => {
      if (step < v.next) return; const scale = vi === 0 ? (diminish ? 0.5 : 1) * rhythmScale : rhythmScale; const raw = v.talea[v.ti % v.talea.length]; const d = Math.max(1, Math.round(Math.abs(raw) * scale)); v.next = step + d;
      if (raw > 0) { const m = v.color[v.ci % v.color.length] + v.oct * 12; let voice = v.voice; let play = true; if (hocket && vi > 0) play = (v.ci + vi) % 2 === 0; if (play) GP.note({ m, t, d: d * sd * 0.95, v: vi === 0 ? 0.5 : 0.38, voice, pan: [-0.1, -0.55, 0.55][vi], lane: vi }); const ci = v.ci % v.color.length, ti = v.ti % v.talea.length; GP.at(t, () => { v.lit = 1; v.lastM = m; v.showC = ci; v.showT = ti; }); v.ci++; } else { const ti = v.ti % v.talea.length; GP.at(t, () => (v.showT = ti)); }
      v.ti++; if (vi === 0 && v.ti % v.talea.length === 0 && v.ci % v.color.length === 0) GP.at(t, () => cycles++);
    });
    if (step % 8 === 0) GP.note({ voice: 'wood', t, v: 0.12, lane: 9 });
  },
  draw(g, W, H) {
    g.fillStyle = '#f1e6cc'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(120,80,30,.08)'; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % W, (i * 53) % H, 80, 1);
    const n = V.length; V.forEach((v, vi) => {
      const cx = (W / (n + 0.2)) * (vi + 0.6), cy = H * 0.42, R = Math.min(W / (n * 2.3), H * 0.33);
      const C = v.color.length; g.lineWidth = 16; for (let k = 0; k < C; k++) { const a0 = (k / C) * 6.283 - 1.5708, a1 = ((k + 1) / C) * 6.283 - 1.5708; g.strokeStyle = k === v.showC ? '#1a1206' : k % 2 ? v.col : v.col + 'aa'; g.beginPath(); g.arc(cx, cy, R, a0 + 0.02, a1 - 0.02); g.stroke(); }
      const tot = v.talea.reduce((a, d) => a + Math.abs(d), 0); let acc = 0; g.lineWidth = 10; v.talea.forEach((d, k) => { const a0 = (acc / tot) * 6.283 - 1.5708; acc += Math.abs(d); const a1 = (acc / tot) * 6.283 - 1.5708; g.strokeStyle = k === v.showT ? '#1a1206' : d > 0 ? '#5a4630' : '#cdbb98'; g.beginPath(); g.arc(cx, cy, R * 0.72, a0 + 0.03, a1 - 0.03); g.stroke(); });
      g.fillStyle = v.col; g.beginPath(); g.arc(cx, cy, 10 + v.lit * 24, 0, 7); g.fill(); v.lit *= 0.92;
      g.fillStyle = '#2a1d0c'; g.textAlign = 'center'; g.font = '22px VT323'; g.fillText(v.name, cx, cy + R + 34); g.font = '17px VT323'; g.fillText(`color ${C} · talea ${v.talea.length} (${v.talea.filter((d) => d > 0).length} notes)`, cx, cy + R + 54); g.fillText(`realign every ${period(v)} notes`, cx, cy + R + 72);
      const gi = GAMUT.indexOf(v.lastM); g.font = '28px VT323'; g.fillText(v.lastM ? (gi >= 0 ? NAMES[gi] : ['C','C♯','D','E♭','E','F','F♯','G','G♯','A','B♭','B'][v.lastM % 12] + (Math.floor(v.lastM / 12) - 1)) : '·', cx, cy + 9);
    });
    g.textAlign = 'left'; g.fillStyle = '#2a1d0c'; g.font = '18px VT323'; const words = text.split(/\s+/); let x = 14; const y = H - 18; for (const w of words.slice(0, 18)) { g.fillText(w, x, y); x += g.measureText(w + ' ').width; if (x > W - 80) break; }
    g.fillText(`TENOR CYCLES COMPLETE: ${cycles}${diminish ? '  · DIMINUTION' : ''}${hocket ? '  · HOCKET' : ''}`, 14, 26);
  },
  ai: {
    title: 'ARS NOVA COMPOSER', button: 'COMPOSE MOTET', placeholder: 'a motet about the River Humber in winter',
    help: 'Give a theme. Gemini writes a short Latin or English text plus three voices, each with a color (modal degrees) and a talea (durations, negative = rest). The engine cycles them exactly.',
    system: `You compose 14th-century isorhythmic motets (Vitry, Machaut). Return: text (short Latin or English motet text on the theme), and exactly three voices: TENOR (slow, low, long color 8-24 notes and talea 4-10 values, values 2-8), MOTETUS (middle, values 1-4) and TRIPLUM (fast, high, values 1-2). color = list of integers = Dorian mode degrees relative to D3 (0 = D3, 7 = D4, negative allowed down to -5, up to 16). talea = list of integer durations in beats, negative = rest. Choose color and talea lengths that are co-prime or nearly, so the cycles shift against each other. Reply JSON only.`,
    schema: { type: 'object', properties: { text: { type: 'string' }, voices: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', properties: { name: { type: 'string' }, color: { type: 'array', items: { type: 'integer' } }, talea: { type: 'array', items: { type: 'integer' } } }, required: ['color', 'talea'] } }, why: { type: 'string' } }, required: ['voices'] },
    apply(r) {
      const base = [['TENOR', 'organ', '#d9a441'], ['MOTETUS', 'reed', '#c0392b'], ['TRIPLUM', 'glass', '#2e86c1']], out = [];
      (r.voices || []).slice(0, 3).forEach((v, i) => { const color = (v.color || []).filter(Number.isFinite).slice(0, 48).map((d) => { d = Math.max(-7, Math.min(21, Math.round(d))); return 50 + Math.floor(d / 7) * 12 + DOR[((d % 7) + 7) % 7]; }); const talea = (v.talea || []).filter((d) => Number.isFinite(d) && d !== 0).slice(0, 24).map((d) => Math.max(-8, Math.min(8, Math.round(d)))); if (color.length && talea.some((d) => d > 0)) out.push(mk(base[out.length][0], color, talea, base[out.length][1], 0, base[out.length][2])); });
      if (!out.length) throw new Error('no valid voices'); V = out; if (r.text) text = String(r.text).slice(0, 400); reset();
      return V.map((v) => `${v.name}: color ${v.color.length}, talea ${v.talea.length} → realign every ${period(v)} notes`).join('\n') + (r.why ? '\n' + r.why : '');
    },
    fallback(prompt) { fromText(prompt || UT); },
  },
});
