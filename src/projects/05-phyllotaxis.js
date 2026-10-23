/*META {"no":"05","title":"PHYLLOTAXIS","cat":"Nature","line":"Seeds are placed like a sunflower's, each turned by the golden angle (137.508°) from the last; the seed's spiral family (its number mod 8, 13 or 21, the Fibonacci parastichies) sets its pitch, so the spirals you see are the melodies you hear.","gemini":"Turns a plant you name (pine cone, aloe, romanesco, an invented alien flower) into divergence angle, parastichy numbers, growth rate, palette and scale, and explains the botany."} */
const PHI_ANG = 137.50776;
let ang = PHI_ANG, maxSeeds = 377, fams = [8, 13, 21], seeds = [], n = 0, scale = 'pentatonic', root = 52, palette = ['#ffcf3a', '#ff7a1a', '#7a3d12'], plant = 'Sunflower', bloom = 0;
const PLANTS = { 'Sunflower': { angle: 137.508, seeds: 610, fams: [21, 34, 55], scale: 'pentatonic', palette: ['#ffcf3a', '#ff7a1a', '#5a2d0c'] }, 'Pine cone': { angle: 137.508, seeds: 144, fams: [5, 8, 13], scale: 'dorian', palette: ['#c98a4b', '#7a4a22', '#3a2410'] }, 'Daisy': { angle: 137.508, seeds: 233, fams: [13, 21, 34], scale: 'major', palette: ['#ffffff', '#ffe066', '#ffb000'] }, 'Lucas plant (99.5°)': { angle: 99.502, seeds: 233, fams: [4, 7, 11], scale: 'hirajoshi', palette: ['#9be37a', '#3fa34d', '#1d5c2c'] }, 'Broken angle (137.3°)': { angle: 137.3, seeds: 377, fams: [8, 13, 21], scale: 'wholetone', palette: ['#7ad7ff', '#3a7bd5', '#1b2a6b'] }, 'Rational 3/8 (135°)': { angle: 135, seeds: 300, fams: [8, 8, 8], scale: 'minpent', palette: ['#ff5f8a', '#a03060', '#401020'] } };
function setPlant(p) { ang = GP.clamp(+p.angle || PHI_ANG, 1, 359); maxSeeds = GP.clamp(Math.round(p.seeds || 377), 34, 1200); fams = (p.fams || [8, 13, 21]).slice(0, 3).map((x) => GP.clamp(Math.round(x), 2, 89)); while (fams.length < 3) fams.push(fams[fams.length - 1] || 8); if (GP.SCALES[p.scale]) scale = p.scale; palette = (p.palette || palette).slice(0, 3).map((c) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#ffb000')); while (palette.length < 3) palette.push('#ffb000'); seeds = []; n = 0; plant = p.name || plant; }
GP.init({
  id: 'phyllotaxis', no: '05', title: 'PHYLLOTAXIS', cat: 'NATURE', bpm: 108, accent: '#ffcf3a', accent2: '#9be37a',
  rule: `<p>A sunflower puts each new seed at a fixed turn from the last, the <em>golden angle</em> (about 137.5°, or 360° ÷ φ²). Because φ is the "most irrational" number, the seeds never line up into spokes and pack perfectly. Your eye picks out spirals in counts of <em>Fibonacci numbers</em>, like 21, 34 and 55, called parastichies.</p>
<blockquote>seed k: angle = k × 137.508°, radius = c√k (Vogel's model, 1979)</blockquote>
<p>Each seed is a note. Its spiral family (k mod 13) picks the melody pitch, k mod 21 picks the counter-line, and k mod 8 drives the drums. Because the families are Fibonacci numbers they drift in and out of phase like the spirals do. Change the angle to 137.3° and spokes appear. You'll hear the music lock into a stiff loop.</p>`,
  setup() {
    GP.select('PLANT', Object.keys(PLANTS), 'Sunflower', (k) => setPlant({ name: k, ...PLANTS[k] }));
    this.angS = GP.slider('DIVERGENCE °', 90, 180, 0.001, PHI_ANG, (v) => { ang = v; seeds = []; n = 0; }, (v) => v.toFixed(3));
    GP.select('SCALE', Object.keys(GP.SCALES), scale, (v) => (scale = v));
    GP.buttons(['GOLDEN', () => { ang = PHI_ANG; seeds = []; n = 0; }], ['RE-SEED', () => { seeds = []; n = 0; }]);
    setPlant({ name: 'Sunflower', ...PLANTS.Sunflower });
  },
  onStep(step, t, sd) {
    if (n >= maxSeeds) { if (step % 16 === 0) { bloom = 1; GP.note({ m: GP.deg(0, scale, root - 12), t, d: sd * 16, v: 0.5, voice: 'pad', lane: 3 }); seeds = []; n = 0; } return; }
    const k = n++, a = (k * ang * Math.PI) / 180, r = Math.sqrt(k), f0 = k % fams[0], f1 = k % fams[1], f2 = k % fams[2];
    GP.at(t, () => seeds.push({ k, a, r, f: f0, life: 1 }));
    GP.note({ m: GP.deg(f1 % 10, scale, root + 12), t, d: sd * 1.5, v: 0.35 + 0.4 * (1 - k / maxSeeds), voice: 'marimba', pan: Math.cos(a) * 0.7, lane: 0 });
    if (f2 % 3 === 0) GP.note({ m: GP.deg(Math.floor(f2 / 3) % 8, scale, root), t, d: sd * 3, v: 0.35, voice: 'glass', pan: -Math.cos(a) * 0.5, lane: 1 });
    if (f0 === 0) GP.note({ m: 36, t, v: 0.8, voice: 'kick', lane: 2 }); else if (f0 === Math.floor(fams[0] / 2)) GP.note({ m: 60, t, v: 0.45, voice: 'clap', lane: 2 }); else if (k % 2) GP.note({ m: 80, t, v: 0.15, voice: 'hat', lane: 2 });
    if (k % fams[2] === 0) GP.note({ m: GP.deg(Math.floor(k / fams[2]) % 5, scale, root - 12), t, d: sd * 8, v: 0.5, voice: 'bass', lane: 3 });
  },
  draw(g, W, H) {
    g.clearRect(0, 0, W, H); const cx = W / 2, cy = H / 2 + 8, sc = (Math.min(W, H) * 0.46) / Math.sqrt(maxSeeds);
    if (bloom > 0.01) { g.fillStyle = `rgba(255,207,58,${bloom * 0.25})`; g.fillRect(0, 0, W, H); bloom *= 0.93; }
    for (const s of seeds) { const x = cx + Math.cos(s.a) * s.r * sc, y = cy + Math.sin(s.a) * s.r * sc, rad = sc * 0.55 * (0.7 + 0.3 * s.life); g.fillStyle = palette[s.f % 3]; g.globalAlpha = 0.55 + 0.45 * s.life; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); if (s.life > 0.05) { g.globalAlpha = s.life; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); s.life *= 0.94; } }
    g.globalAlpha = 1; const last = seeds[seeds.length - 1];
    if (last) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); for (const s of seeds) if (s.k % fams[1] === last.k % fams[1]) { const x = cx + Math.cos(s.a) * s.r * sc, y = cy + Math.sin(s.a) * s.r * sc; g.lineTo(x, y); } g.stroke(); }
    g.font = '18px VT323'; g.fillStyle = '#ffcf3a'; g.fillText(`${plant.toUpperCase()}   ∠ ${ang.toFixed(3)}°   SEED ${n}/${maxSeeds}   PARASTICHIES ${fams.join(' · ')}`, 12, 22);
    g.fillStyle = '#8c8170'; g.fillText(last ? `k=${last.k}  k mod ${fams[1]} = ${last.k % fams[1]} (melody)  k mod ${fams[0]} = ${last.k % fams[0]} (drums)` : '', 12, 42);
  },
  ai: {
    title: 'BOTANIST', button: 'GROW PLANT', placeholder: 'a romanesco cauliflower at midnight',
    help: 'Name a real or imaginary plant. Gemini gives its divergence angle, Fibonacci or Lucas parastichy numbers, seed count, palette and scale, and explains the botany.',
    system: `You are a botanist and composer. For the plant described, give its phyllotaxis: divergence angle in degrees (golden angle 137.508 for most spiral plants, Lucas angle 99.502 for rare species, a slightly rational angle like 137.3 or 135 to get spokes for 'broken' or 'mechanical' moods), three parastichy family sizes (consecutive Fibonacci numbers like 5,8,13 or 21,34,55, or Lucas 4,7,11), seed count 50-1000, a 3-colour hex palette from the plant, and a musical scale. Reply with JSON only.`,
    schema: { type: 'object', properties: { name: { type: 'string' }, angle: { type: 'number' }, parastichies: { type: 'array', items: { type: 'integer' }, minItems: 3, maxItems: 3 }, seeds: { type: 'integer' }, palette: { type: 'array', items: { type: 'string' } }, scale: { type: 'string', enum: Object.keys(GP.SCALES) }, bpm: { type: 'integer' }, why: { type: 'string' } }, required: ['angle', 'parastichies', 'seeds'] },
    apply(r) { setPlant({ name: r.name || 'Gemini plant', angle: r.angle, seeds: r.seeds, fams: r.parastichies, scale: r.scale, palette: r.palette }); if (r.bpm) GP.bpm = GP.clamp(r.bpm, 40, 200); return `${plant}: ∠${ang}°, ${maxSeeds} seeds, spirals ${fams.join('/')}, ${scale}${r.why ? '\n' + r.why : ''}`; },
    fallback() { const k = Object.keys(PLANTS)[Math.floor(Math.random() * 6)]; setPlant({ name: k, ...PLANTS[k] }); },
  },
});
