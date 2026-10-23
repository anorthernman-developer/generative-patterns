/*META {"no":"06","title":"DAWN CHORUS","cat":"Nature","line":"Birdsong is a grammar: syllables (sweeps, trills, whistles) build phrases, phrases repeat and vary into songs, and species join the chorus in a set order as the light rises; a live sonogram draws what you hear, and Messiaen mode snaps it to a scale.","gemini":"Writes the song grammar (syllable frequencies, sweeps, durations, phrase structure, repetition and gaps) for any bird you name, real or invented, which the synth then sings."} */
const BIRDS0 = [
  { name: 'Robin', colour: '#ff6a3d', enter: 0, gap: [2, 4], order: 'random', syl: [[3500, 6800, 90, 'up'], [6000, 4200, 120, 'down'], [5200, 5300, 160, 'flat'], [7200, 3000, 70, 'down'], [4400, 4600, 40, 'trill']], phrases: [[0, 1, 2], [3, 3, 4], [2, 0, 3, 1], [4, 4, 4, 2]] },
  { name: 'Blackbird', colour: '#ffd36a', enter: 1, gap: [3, 5], order: 'cycle', syl: [[1700, 2300, 220, 'arch'], [2300, 1600, 260, 'down'], [1900, 1900, 300, 'flat'], [2600, 2100, 180, 'down'], [6500, 7800, 40, 'trill']], phrases: [[0, 1, 2, 4, 4], [3, 0, 1, 4], [2, 3, 1, 4, 4, 4]] },
  { name: 'Wren', colour: '#c9a6ff', enter: 2, gap: [4, 7], order: 'cycle', syl: [[6500, 7500, 60, 'trill'], [5000, 7000, 35, 'up'], [7600, 5200, 35, 'down']], phrases: [[1, 2, 1, 2, 1, 2, 0, 0, 0, 1, 2, 1, 2, 0, 0]] },
  { name: 'Great tit', colour: '#7ad7ff', enter: 3, gap: [2, 3], order: 'cycle', syl: [[6400, 5400, 110, 'down'], [4200, 4100, 90, 'flat']], phrases: [[0, 1, 0, 1, 0, 1, 0, 1]] },
  { name: 'Chiffchaff', colour: '#9be37a', enter: 4, gap: [2.5, 4], order: 'random', syl: [[5600, 4800, 80, 'down'], [4600, 4200, 90, 'down']], phrases: [[0, 1, 0, 0, 1, 0, 1, 1, 0], [1, 0, 1, 0, 0, 1, 0]] },
  { name: 'Cuckoo', colour: '#e9dcc0', enter: 5, gap: [1.2, 2], order: 'cycle', syl: [[660, 650, 220, 'flat'], [550, 540, 380, 'flat']], phrases: [[0, 1]] },
];
let birds = [], dawn = 0, auto = true, messiaen = false, scale = 'lydian', an, freq, sono, singing = {};
function setBirds(list) { birds = list.slice(0, 8).map((b, i) => ({ ...b, enter: b.enter ?? i, next: 0, pan: Math.sin(i * 2.1) * 0.8, k: 0 })); singing = {}; }
function sing(b, t0) {
  const ph = b.order === 'random' ? b.phrases[Math.floor(Math.random() * b.phrases.length)] : b.phrases[b.k++ % b.phrases.length]; let t = t0;
  for (const si of ph) { const s = b.syl[si]; if (!s) continue; const [f0, f1, ms, curve] = s, d = ms / 1000;
    if (messiaen) { const m = Math.round(69 + 12 * Math.log2(f0 / 440)) - 24, sc = GP.SCALES[scale], pc = ((m % 12) + 12) % 12, best = sc.reduce((a, x) => (Math.abs(x - pc) < Math.abs(a - pc) ? x : a), sc[0]); GP.note({ m: m - pc + best, t, d: Math.max(0.12, d * 1.4), v: 0.5, voice: f0 < 1200 ? 'marimba' : f0 < 3000 ? 'glass' : 'bell', pan: b.pan, lane: birds.indexOf(b) }); }
    else GP.note({ f: f0, to: f1, m: Math.round(69 + 12 * Math.log2(f0 / 440)), curve: curve === 'trill' ? 'trill' : 'sweep', rate: 35, t, d, v: f0 < 1200 ? 0.8 : 0.45, voice: 'chirp', pan: b.pan, lane: birds.indexOf(b) });
    t += d + (curve === 'trill' ? 0.03 : 0.05);
  }
  GP.at(t0, () => (singing[b.name] = 1)); return t;
}
GP.init({
  id: 'dawn-chorus', no: '06', title: 'DAWN CHORUS', cat: 'NATURE', bpm: 60, accent: '#ff9f6a', accent2: '#9be37a',
  rule: `<p>Birdsong has a grammar. Each species has a small set of <em>syllables</em> (whistles, sweeps up or down, buzzing trills) that it chains into <em>phrases</em>. It repeats or varies those phrases and leaves gaps to listen. Great tits say "tea-cher" over and over, wrens fire trills at full speed, robins rarely sing the same song twice, and the cuckoo drops a minor third.</p>
<blockquote>At dawn the species come in roughly in order: robin and blackbird first, then wren, tits and warblers as the light grows.</blockquote>
<p>The panel is a live <em>sonogram</em> of the actual output, with time running left and pitch going up, which is how ornithologists read song. <em>Messiaen mode</em> does what Olivier Messiaen did in his Catalogue d'oiseaux: it snaps each syllable to a scale, drops it two octaves and gives it to an instrument.</p>`,
  setup() {
    GP.slider('DAWN', 0, 1, 0.01, 0, (v) => { dawn = v; auto = false; }, (v) => Math.round(v * 100) + '%');
    GP.buttons(['AUTO SUNRISE', () => { auto = true; dawn = 0; }], ['MESSIAEN MODE', (e) => { messiaen = !messiaen; e.target.classList.toggle('on', messiaen); }]);
    GP.select('MESSIAEN SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    setBirds(BIRDS0);
  },
  onStart() { dawn = auto ? 0.02 : dawn; birds.forEach((b, i) => (b.next = GP.now + 0.2 + i * 0.4)); },
  onStep(step, t) {
    if (auto) dawn = Math.min(1, dawn + 1 / (60 * 4 * 1.5));
    const n = birds.length; for (const b of birds) { const active = b.enter / Math.max(1, n) <= dawn * 1.15 || b.enter === 0; if (!active || t < b.next) continue; const end = sing(b, Math.max(t, b.next)); const [g0, g1] = b.gap || [2, 4]; b.next = end + (g0 + Math.random() * (g1 - g0)) * (1.6 - dawn * 0.8); }
  },
  draw(g, W, H) {
    if (!an && GP.ctx) { an = GP.ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; GP.out.connect(an); freq = new Uint8Array(an.frequencyBinCount); }
    if (!sono || GP.resized) { sono = document.createElement('canvas'); sono.width = Math.max(10, Math.floor(W)); sono.height = Math.max(10, Math.floor(H - 60)); }
    const sx = sono.getContext('2d'), sh = sono.height, sw = sono.width;
    sx.drawImage(sono, -2, 0);
    const sky = `rgb(${10 + dawn * 40},${8 + dawn * 22},${14 + dawn * 30})`; sx.fillStyle = sky; sx.fillRect(sw - 2, 0, 2, sh);
    if (an && GP.playing) { an.getByteFrequencyData(freq); const ny = GP.ctx.sampleRate / 2, maxF = 9000; for (let y = 0; y < sh; y++) { const f = (1 - y / sh) * maxF, bin = Math.floor((f / ny) * freq.length), v = freq[bin] / 255; if (v > 0.25) { sx.fillStyle = `rgba(${255},${Math.round(160 + 95 * v)},${Math.round(80 * v)},${(v - 0.25) * 1.4})`; sx.fillRect(sw - 2, y, 2, 1); } } }
    g.fillStyle = '#070605'; g.fillRect(0, 0, W, H); g.drawImage(sono, 0, 40);
    g.font = '14px VT323'; g.fillStyle = '#5c5446'; for (let k = 1; k <= 8; k++) { const y = 40 + (1 - (k * 1000) / 9000) * sh; g.fillText(k + ' kHz', 6, y); g.fillRect(40, y, 6, 1); }
    g.font = '18px VT323'; let x = 12; for (const b of birds) { const on = singing[b.name]; g.fillStyle = on ? b.colour : '#5c5446'; g.fillText((on ? '♪ ' : '· ') + b.name.toUpperCase(), x, 24); x += g.measureText('♪ ' + b.name.toUpperCase()).width + 18; singing[b.name] = on ? on * 0.97 : 0; if (singing[b.name] < 0.2) singing[b.name] = 0; }
    g.fillStyle = '#ff9f6a'; g.fillRect(0, H - 6, W * dawn, 6); g.fillStyle = '#8c8170'; g.fillText(`SUNRISE ${Math.round(dawn * 100)}%${messiaen ? '  ·  MESSIAEN MODE (' + scale + ')' : ''}`, 12, H - 12);
  },
  ai: {
    title: 'ORNITHOLOGIST', button: 'TRANSCRIBE BIRDS', placeholder: 'nightingale, song thrush and a made-up neon bird from a cyberpunk swamp',
    help: 'Name birds (real or invented). Gemini writes each one\'s syllables, phrases, repeats and gaps as a song grammar. The synth sings it and the sonogram shows it.',
    system: `You are an ornithologist who transcribes birdsong into a synthesis grammar. For each bird give: name, colour (hex), enter (dawn chorus order 0 = earliest), gap [min,max] seconds between songs, order "cycle" or "random" for phrase choice, syl = list of syllables [startHz, endHz, durationMs, curve] where curve is one of up, down, flat, arch, trill (trill = rapid oscillation between the two frequencies), Hz 300-9000, duration 20-600 ms, and phrases = lists of syllable indices (repetition is typical: thrushes repeat each phrase 2-4 times, wrens use long fast trills, warblers alternate). Be faithful to real species' rhythm and pitch range when real. 1 to 6 birds. Reply with JSON only.`,
    schema: { type: 'object', properties: { birds: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'object', properties: { name: { type: 'string' }, colour: { type: 'string' }, enter: { type: 'integer' }, gap: { type: 'array', items: { type: 'number' } }, order: { type: 'string', enum: ['cycle', 'random'] }, syl: { type: 'array', items: { type: 'array', items: { type: ['number', 'string'] } } }, phrases: { type: 'array', items: { type: 'array', items: { type: 'integer' } } }, note: { type: 'string' } }, required: ['name', 'syl', 'phrases'] } }, why: { type: 'string' } }, required: ['birds'] },
    apply(r) {
      const out = [];
      for (const b of r.birds || []) {
        const syl = (b.syl || []).filter(Array.isArray).slice(0, 16).map((s) => [GP.num(s[0], 200, 9500, 3000), GP.num(s[1], 200, 9500, 3000), GP.num(s[2], 15, 800, 100), ['up', 'down', 'flat', 'arch', 'trill'].includes(s[3]) ? s[3] : 'flat']);
        const phrases = (b.phrases || []).filter(Array.isArray).map((p) => p.map(Math.round).filter((i) => i >= 0 && i < syl.length).slice(0, 40)).filter((p) => p.length);
        if (syl.length && phrases.length) out.push({ name: String(b.name || 'Bird').slice(0, 24), colour: /^#[0-9a-f]{6}$/i.test(b.colour) ? b.colour : '#e9dcc0', enter: GP.num(b.enter, 0, 9, out.length), gap: [GP.num(b.gap?.[0], 0.3, 15, 2), GP.num(b.gap?.[1], 0.5, 20, 4)], order: b.order === 'random' ? 'random' : 'cycle', syl, phrases });
      }
      if (!out.length) throw new Error('no singable birds'); setBirds(out); auto = true; dawn = 0.05; birds.forEach((b, i) => (b.next = GP.now + 0.2 + i * 0.3));
      return out.map((b) => `${b.name}: ${b.syl.length} syllables, ${b.phrases.length} phrases, gap ${b.gap.join('-')}s`).join('\n') + (r.why ? '\n' + r.why : '');
    },
    fallback() { setBirds(BIRDS0); },
  },
});
