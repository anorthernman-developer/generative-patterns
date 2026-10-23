/*META {"no":"15","title":"DADA CUT-UP","cat":"Manifestos","line":"Tristan Tzara's recipe for a Dadaist poem (1920): cut a newspaper article into words, put them in a bag, shake gently, then draw them out one by one; each word becomes a sound (syllables give rhythm, letters give pitch, vowels give timbre) or a slice of your own sample, and the order is pure chance.","gemini":"Only writes the newspaper: an article in British tabloid or broadsheet style about whatever you name. The bag, not Gemini, decides the order of the poem."} */
const PAPERS = [
  ['CABARET VOLTAIRE OPENS IN ZURICH', 'A new artistic cabaret opened last night in the Spiegelgasse where young poets and painters from many nations performed songs, noises and simultaneous verses before an astonished public. The organisers promise further evenings of music, masks, dances and readings. Neighbours complained of drums.'],
  ['TRAMS HALTED AS FOG DESCENDS ON CITY', 'Thick fog brought the morning trams to a standstill across the city today. Passengers walked to work through grey streets while lamplighters returned at noon. A spokesman for the corporation said services would resume when visibility improves. Shipping on the river has been suspended.'],
  ['LOCAL BRASS BAND WINS COUNTY CONTEST', 'The colliery band took first prize at the county contest on Saturday with a rousing march and a test piece described by the adjudicator as bold. Supporters filled two charabancs for the journey home. The conductor thanked the miners, their wives and the publican of the Red Lion.'],
];
let bag = [], drawn = [], scraps = [], headline = '', article = '', nextAt = 0, scale = 'pentatonic', speak = false, gapSteps = 1, cur = null, shake = 0;
const syl = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length - (/e$/.test(w.toLowerCase()) && w.length > 3 ? 1 : 0));
function fill(h, a) { headline = h; article = a; bag = a.split(/\s+/).filter(Boolean).map((w) => w.replace(/^["'(]+|["')]+$/g, '')).filter(Boolean); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } drawn = []; shake = 1; nextAt = 0; }
function setupSlice() { GP.VOICES.slice = (f, t, d, v, o) => { const c = GP.ctx, g = c.createGain(), s = c.createBufferSource(), e = t + d + 0.03; s.buffer = o.buf; s.playbackRate.value = o.rate || 1; s.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.setValueAtTime(v, t + d * 0.8); g.gain.linearRampToValueAtTime(0.0001, e); s.start(t, Math.min(o.offset || 0, Math.max(0, o.buf.duration - 0.05))); s.stop(e + 0.02); return [g, e]; }; }
function sayWord(w, t, sd) {
  const clean = w.replace(/[^\p{L}\p{N}]/gu, ''), n = syl(clean || 'x'), sc = GP.SCALES[scale], low = clean.toLowerCase(), caps = /^[A-Z]/.test(w), pan = Math.random() * 1.6 - 0.8;
  const smp = GP.S.src !== 'synth' ? GP.S.samples.filter((x) => x.buf) : [];
  for (let k = 0; k < n; k++) { const ch = low[Math.min(low.length - 1, Math.floor((k * low.length) / n))] || 'a', deg = (ch.charCodeAt(0) - 97 + 26) % 26, tt = t + k * sd, d = sd * (k === n - 1 ? 1.6 : 0.9), vow = (low.match(/[aeiou]/g) || ['a'])[k % Math.max(1, (low.match(/[aeiou]/g) || ['a']).length)];
    if (smp.length) { const b = smp[GP.hash(low) % smp.length].buf; GP.note({ voice: 'slice', keepVoice: true, noSample: true, buf: b, offset: (GP.hash(low + k) % 1000) / 1000 * b.duration, m: GP.deg(deg % 10, sc, 60), t: tt, d, v: caps ? 0.9 : 0.65, pan, lane: 0 }); }
    else GP.note({ m: GP.deg(deg % 12, sc, vow === 'a' || vow === 'o' ? 48 : vow === 'u' ? 55 : 62), t: tt, d, v: (caps && k === 0 ? 0.7 : 0.45), voice: { a: 'marimba', o: 'marimba', e: 'glass', i: 'glass', u: 'reed' }[vow] || 'pluck', pan, lane: 'aeiou'.indexOf(vow) + 1 }); }
  if (/[.!?]$/.test(w)) GP.note({ voice: 'kick', t, v: 0.6, lane: 9 }); else if (/,$/.test(w)) GP.note({ voice: 'wood', t, v: 0.4, f: 900, lane: 9 }); if (caps) GP.note({ voice: 'clap', t, v: 0.3, lane: 9 });
  return n;
}
GP.init({
  id: 'dada-cut-up', no: '15', title: 'DADA CUT-UP', cat: 'MANIFESTO', bpm: 132, spb: 4, accent: '#ff3b6b', accent2: '#f7e463',
  rule: `<p>Tristan Tzara, <em>To make a Dadaist poem</em> (1920), paraphrased:</p>
<blockquote>Take a newspaper and some scissors. Choose an article as long as the poem you want. Cut it out, then cut out each word and put them all in a bag. Shake gently. Take the cuttings out one after another and copy them in the order they leave the bag. <q>The poem will resemble you.</q></blockquote>
<p>Here the bag is the composer. Each word sounds as it comes out. <b>Syllables</b> give the rhythm, <b>letters</b> pick pitches from the scale, and <b>vowels</b> choose the voice (a/o marimba, e/i glass, u reed). A capital letter adds a clap, a comma a woodblock and a full stop a kick. Load a sample and every word cuts its own slice from it instead.</p>`,
  setup() {
    setupSlice();
    GP.select('NEWSPAPER', PAPERS.map((p) => p[0]), PAPERS[0][0], (v) => { const p = PAPERS.find((x) => x[0] === v); fill(p[0], p[1]); });
    const ta = GP.textarea('OR PASTE AN ARTICLE', '', () => {}); ta.rows = 3;
    GP.buttons(['CUT UP & BAG IT', () => { if (ta.value.trim().split(/\s+/).length > 3) fill('YOUR ARTICLE', ta.value); }], ['SHAKE AGAIN', () => fill(headline, article)], ['SPEAK WORDS', (e) => { speak = !speak; e.target.classList.toggle('on', speak); if (speak) GP.toast('Speech is not captured in the WAV recording.'); }]);
    GP.slider('GAP', 0, 4, 1, gapSteps, (v) => (gapSteps = v));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    fill(...PAPERS[0]);
  },
  onStep(step, t, sd) {
    if (step < nextAt) return; if (!bag.length) { nextAt = step + 16; GP.at(t, () => fill(headline, article)); return; }
    const w = bag.pop(); drawn.push(w); const n = sayWord(w, t, sd); nextAt = step + n + gapSteps;
    if (step % 4 === 0) GP.note({ voice: 'hat', t, v: 0.1, lane: 9 });
    GP.at(t, () => { cur = w; const W = GP.W, H = GP.H; scraps.push({ w, x: 30 + Math.random() * (W - 220), y: 70 + Math.random() * (H - 200), r: (Math.random() - 0.5) * 0.5, f: ['VT323', 'Chakra Petch', 'Silkscreen', 'Share Tech Mono', 'serif'][Math.floor(Math.random() * 5)], s: 22 + Math.random() * 30 + (/^[A-Z]/.test(w) ? 12 : 0), a: 1, inv: Math.random() < 0.18 }); if (scraps.length > 60) scraps.shift(); if (speak && window.speechSynthesis) { try { const u = new SpeechSynthesisUtterance(w); u.rate = 1.3; u.pitch = 0.5 + Math.random(); speechSynthesis.speak(u); } catch (e) {} } });
  },
  draw(g, W, H) {
    g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, W, H);
    for (const s of scraps) { g.save(); g.font = `${s.s}px "${s.f}"`; const tw = g.measureText(s.w).width; g.translate(Math.max(12, Math.min(s.x, W - tw - 24)), s.y); g.rotate(s.r); g.globalAlpha = Math.max(0.35, s.a); g.fillStyle = s.inv ? '#111' : '#f5f0e2'; g.beginPath(); g.moveTo(-6, -s.s * 0.85); g.lineTo(tw + 8, -s.s * 0.8 - 3); g.lineTo(tw + 5, s.s * 0.3); g.lineTo(-8, s.s * 0.28 + 2); g.closePath(); g.fill(); g.fillStyle = s.inv ? '#f7e463' : s.w === cur ? '#ff3b6b' : '#151515'; g.fillText(s.w, 0, 0); g.restore(); s.a *= 0.996; }
    g.fillStyle = '#151515'; g.fillRect(0, 0, W, 42); g.fillStyle = '#f7e463'; g.font = '22px "Silkscreen"'; g.fillText(headline.slice(0, 48), 12, 30);
    const bx = W - 150, by = H - 120; g.save(); g.translate(bx + 60, by + 50); g.rotate(Math.sin(performance.now() / 60) * shake * 0.3); g.fillStyle = '#8a6a3c'; g.beginPath(); g.moveTo(-50, -40); g.lineTo(50, -40); g.lineTo(60, 50); g.lineTo(-60, 50); g.closePath(); g.fill(); g.fillStyle = '#f5f0e2'; g.font = '18px VT323'; g.textAlign = 'center'; g.fillText('BAG', 0, -5); g.fillText(bag.length + ' words', 0, 18); g.restore(); shake *= 0.97;
    g.fillStyle = 'rgba(21,21,21,.85)'; g.fillRect(0, H - 54, W - 170, 54); g.fillStyle = '#f5f0e2'; g.font = '17px VT323'; const line = drawn.slice(-22).join(' '); g.fillText(line.slice(-110), 10, H - 32); g.fillStyle = '#ff3b6b'; g.fillText(`POEM: ${drawn.length} words drawn · "The poem will resemble you."`, 10, H - 10);
  },
  ai: {
    title: 'NEWSPAPER', button: 'PRINT THE PAPER', placeholder: 'Huddersfield Town win the cup / a heatwave in Margate',
    help: 'Gemini only writes the newspaper article. The words go into the bag, get shaken, and come out in chance order, so the poem is not Gemini\'s.',
    system: `You are a newspaper sub-editor. Write a short news article (90-180 words) with a headline about the user's subject, in the plain style of a British local newspaper, with concrete nouns, names, numbers and quotations. Do NOT write poetry: a Dadaist will cut your article into words and draw them from a bag at random. Reply JSON only.`,
    schema: { type: 'object', properties: { headline: { type: 'string' }, article: { type: 'string' } }, required: ['headline', 'article'] }, temperature: 0.9,
    apply(r) { const a = String(r.article || '').replace(/\s+/g, ' ').trim(); if (a.split(' ').length < 8) throw new Error('article too short'); fill(String(r.headline || 'UNTITLED').toUpperCase().slice(0, 80), a.slice(0, 2000)); return `${headline}\n${bag.length} words cut out, bagged and shaken. The bag decides the order.`; },
    fallback(prompt) { const p = String(prompt || '').trim(); if (p.split(/\s+/).length >= 5) fill('YOUR WORDS', p); else { const k = PAPERS[GP.hash(p) % PAPERS.length]; fill(k[0], k[1] + (p ? ' ' + p + '.' : '')); } },
  },
});
