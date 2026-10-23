/* GP kit: shared engine for the generative-patterns projects (inlined into every page at build time). */
const GP = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k.startsWith('on')) e[k] = v; else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v); } for (const c of kids) e.append(c); return e; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const num = (v, a, b, d) => (v != null && v !== '' && Number.isFinite(+v) ? clamp(+v, a, b) : d);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rng = (seed = 1) => { let a = seed >>> 0 || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (s) => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], pentatonic: [0, 2, 4, 7, 9], minpent: [0, 3, 5, 7, 10], hirajoshi: [0, 2, 3, 7, 8], wholetone: [0, 2, 4, 6, 8, 10], chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], blues: [0, 3, 5, 6, 7, 10], pelog: [0, 1, 3, 7, 8] };
  const deg = (d, scale = 'minpent', root = 48) => { const s = SCALES[scale] || SCALES.minpent, n = s.length, o = Math.floor(d / n); return root + 12 * o + s[((d % n) + n) % n]; };
  const S = { bpm: 100, spb: 4, playing: false, step: 0, notes: 0, src: 'synth', samples: [], midi: null, midiOut: null, rec: null, lastWav: null, aiApplied: 0, queue: [] };
  let ctx, out, bus, rev, revIn, dly, dlyIn, comp, vol, noiseBuf, cfg = {}, timer, nextT = 0;

  /* ---------- audio graph ---------- */
  function ensure() {
    if (ctx) return ctx;
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    vol = ctx.createGain(); vol.gain.value = 0.8; out = ctx.createGain();
    bus = ctx.createGain(); bus.connect(comp);
    rev = ctx.createConvolver(); rev.buffer = impulse(3.2, 2.6); revIn = ctx.createGain(); revIn.gain.value = 0.28; bus.connect(revIn); revIn.connect(rev); rev.connect(comp);
    dly = ctx.createDelay(2); dly.delayTime.value = 60 / S.bpm * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.32; const lp = ctx.createBiquadFilter(); lp.frequency.value = 2600;
    dlyIn = ctx.createGain(); dlyIn.gain.value = 0.14; bus.connect(dlyIn); dlyIn.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(comp);
    comp.connect(vol); vol.connect(out); out.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    GP.ctx = ctx; GP.bus = bus; GP.out = out;
    return ctx;
  }
  function impulse(sec, decay) { const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; }
  function env(g, t, a, d, peak, sustainEnd) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, Math.max(t + a + 0.01, sustainEnd || t + a + d)); }
  function osc(type, f, t, end, dest) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(end + 0.05); return o; }
  function noise(t, end, dest) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(end + 0.05); return s; }

  const VOICES = {
    bell(f, t, d, v, o) { const g = ctx.createGain(), m = ctx.createGain(), e = t + Math.max(d, 1.6) * 1.4; env(g, t, 0.003, 0, v * 0.5, e); const c = osc('sine', f, t, e, g); const mo = osc('sine', f * 3.5, t, e, m); m.gain.setValueAtTime(f * 2.2, t); m.gain.exponentialRampToValueAtTime(1, e); m.connect(c.frequency); return [g, e]; },
    tower(f, t, d, v) { const g = ctx.createGain(), e = t + 4.5; env(g, t, 0.002, 0, v * 0.35, e); [[0.5, 0.5], [1, 0.8], [1.19, 0.5], [1.5, 0.35], [2, 0.45], [2.51, 0.2], [3.01, 0.12]].forEach(([r, a], i) => { const gg = ctx.createGain(); gg.gain.setValueAtTime(a, t); gg.gain.exponentialRampToValueAtTime(0.001, t + 4.4 / (1 + i * 0.5)); gg.connect(g); osc('sine', f * r, t, e, gg); }); return [g, e]; },
    pluck(f, t, d, v) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(), e = t + Math.max(d, 0.25) + 0.25; lp.frequency.setValueAtTime(Math.min(18000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.min(18000, f * 1.2), t + 0.35); lp.Q.value = 2; lp.connect(g); env(g, t, 0.002, 0, v * 0.45, e); osc('sawtooth', f, t, e, lp); osc('square', f * 1.003, t, e, lp); return [g, e]; },
    marimba(f, t, d, v) { const g = ctx.createGain(), e = t + 0.9; env(g, t, 0.002, 0, v * 0.6, e); osc('sine', f, t, e, g); const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.3, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12); g2.connect(g); osc('sine', f * 4, t, t + 0.15, g2); return [g, e]; },
    glass(f, t, d, v) { const g = ctx.createGain(), e = t + Math.max(d, 1) + 1.5; env(g, t, 0.01, 0, v * 0.3, e); [1, 2.76, 5.4].forEach((r, i) => { const gg = ctx.createGain(); gg.gain.value = [1, 0.4, 0.15][i]; gg.connect(g); osc('sine', f * r, t, e, gg); }); return [g, e]; },
    pad(f, t, d, v) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(), e = t + d + 1.2; lp.frequency.value = Math.min(4000, f * 4); lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.18, t + Math.min(0.8, d * 0.5 + 0.05)); g.gain.setValueAtTime(v * 0.18, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); [-7, 0, 7].forEach((c) => { const o = osc('sawtooth', f, t, e, lp); o.detune.value = c; }); return [g, e]; },
    organ(f, t, d, v) { const g = ctx.createGain(), e = t + d + 0.15; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.2, t + 0.02); g.gain.setValueAtTime(v * 0.2, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); [[1, 1], [2, 0.5], [3, 0.3], [4, 0.2], [6, 0.08]].forEach(([r, a]) => { const gg = ctx.createGain(); gg.gain.value = a; gg.connect(g); osc('sine', f * r, t, e, gg); }); return [g, e]; },
    reed(f, t, d, v) { const g = ctx.createGain(), bp = ctx.createBiquadFilter(), e = t + d + 0.1; bp.type = 'bandpass'; bp.frequency.value = Math.min(18000, f * 3); bp.Q.value = 1.2; bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.5, t + 0.05); g.gain.setValueAtTime(v * 0.45, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); const o = osc('sawtooth', f, t, e, bp); const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(e); return [g, e]; },
    sine(f, t, d, v) { const g = ctx.createGain(), e = t + d + 0.3; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.35, t + 0.02); g.gain.setValueAtTime(v * 0.35, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); osc('sine', f, t, e, g); return [g, e]; },
    square(f, t, d, v) { const g = ctx.createGain(), e = t + d + 0.05; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.14, t + 0.005); g.gain.setValueAtTime(v * 0.12, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); osc('square', f, t, e, g); return [g, e]; },
    bass(f, t, d, v) { const g = ctx.createGain(), lp = ctx.createBiquadFilter(), e = t + d + 0.1; lp.frequency.setValueAtTime(Math.min(18000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.min(18000, f * 1.5), t + 0.2); lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.45, t + 0.005); g.gain.setValueAtTime(v * 0.4, t + d); g.gain.exponentialRampToValueAtTime(0.0001, e); osc('square', f, t, e, lp); osc('sine', f / 2, t, e, g); return [g, e]; },
    chirp(f, t, d, v, o) { const g = ctx.createGain(), e = t + d + 0.02; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.3, t + Math.min(0.01, d / 3)); g.gain.setValueAtTime(v * 0.3, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, e); const os = osc('sine', f, t, e, g); const f2 = o.to ? clamp(o.to, 50, 16000) : f; if (o.curve === 'trill') { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.rate || 30; lg.gain.value = Math.abs(f2 - f) / 2 + f * 0.05; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(e); } else os.frequency.exponentialRampToValueAtTime(f2, t + d); return [g, e]; },
    noise(f, t, d, v, o) { const g = ctx.createGain(), bp = ctx.createBiquadFilter(), e = t + d + 0.05; bp.type = o.filter || 'bandpass'; bp.Q.value = o.q ?? 6; bp.frequency.setValueAtTime(clamp(f, 30, 16000), t); if (o.to) bp.frequency.exponentialRampToValueAtTime(clamp(o.to, 30, 16000), t + d); bp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * (o.gain ?? 0.9), t + (o.att ?? 0.01)); g.gain.setValueAtTime(v * (o.gain ?? 0.9) * 0.8, t + d * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, e); noise(t, e, bp); return [g, e]; },
    kick(f, t, d, v) { const g = ctx.createGain(), e = t + 0.45; env(g, t, 0.001, 0, v * 0.9, e); const o = osc('sine', 150, t, e, g); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); return [g, e]; },
    snare(f, t, d, v) { const g = ctx.createGain(), hp = ctx.createBiquadFilter(), e = t + 0.22; hp.type = 'highpass'; hp.frequency.value = 1200; hp.connect(g); env(g, t, 0.001, 0, v * 0.5, e); noise(t, e, hp); const g2 = ctx.createGain(); env(g2, t, 0.001, 0, v * 0.3, t + 0.1); g2.connect(g.context === ctx ? g : g); osc('triangle', 190, t, t + 0.1, g2); return [g, e]; },
    hat(f, t, d, v) { const g = ctx.createGain(), hp = ctx.createBiquadFilter(), e = t + (d > 0.2 ? 0.3 : 0.06); hp.type = 'highpass'; hp.frequency.value = 7000; hp.connect(g); env(g, t, 0.001, 0, v * 0.35, e); noise(t, e, hp); return [g, e]; },
    clap(f, t, d, v) { const g = ctx.createGain(), bp = ctx.createBiquadFilter(), e = t + 0.25; bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.8; bp.connect(g); g.gain.setValueAtTime(0.0001, t); [0, 0.012, 0.024].forEach((x) => { g.gain.setValueAtTime(v * 0.6, t + x); g.gain.exponentialRampToValueAtTime(0.05, t + x + 0.01); }); g.gain.setValueAtTime(v * 0.5, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, e); noise(t, e, bp); return [g, e]; },
    wood(f, t, d, v) { const g = ctx.createGain(), bp = ctx.createBiquadFilter(), e = t + 0.12; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 12; bp.connect(g); env(g, t, 0.001, 0, v * 1.4, e); osc('square', f, t, e, bp); return [g, e]; },
    metal(f, t, d, v) { const g = ctx.createGain(), hp = ctx.createBiquadFilter(), e = t + Math.max(0.4, d) + 0.6; hp.type = 'highpass'; hp.frequency.value = 600; hp.connect(g); env(g, t, 0.001, 0, v * 0.12, e); [1, 1.34, 1.73, 2.41, 2.93, 3.6].forEach((r) => osc('square', f * r, t, e, hp)); return [g, e]; },
  };
  const DRUMS = new Set(['kick', 'snare', 'hat', 'clap', 'wood', 'metal']);

  function playSample(buf, m, t, d, v, pitched) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; if (pitched) s.playbackRate.value = clamp(Math.pow(2, (m - 60) / 12), 0.25, 4);
    const len = Math.min(buf.duration / s.playbackRate.value, Math.max(d, 0.12) + 0.4), e = t + len;
    g.gain.setValueAtTime(v * 0.8, t); g.gain.setValueAtTime(v * 0.8, Math.max(t, e - 0.06)); g.gain.linearRampToValueAtTime(0.0001, e); s.connect(g); s.start(t); s.stop(e + 0.02); return [g, e];
  }
  /* note({m, t, d, v, voice, pan, lane, to, curve, ...}) */
  function note(n) {
    if (!ctx) return; const t = Math.max(n.t ?? ctx.currentTime, ctx.currentTime), d = Math.max(0.02, n.d ?? 0.25), v = clamp(n.v ?? 0.8, 0, 1.5), m = n.m ?? 60;
    let voice = n.voice || cfg.voice || 'pluck'; if (S.voiceOverride && S.voiceOverride !== 'auto' && !n.keepVoice && !DRUMS.has(voice) && voice !== 'noise' && voice !== 'chirp') voice = S.voiceOverride;
    let r;
    if (S.src !== 'synth' && S.samples.length && !n.noSample) { const ok = S.samples.filter((x) => x.buf); if (ok.length) { const i = S.src === 'byNote' ? Math.abs(Math.round(m)) % ok.length : (n.lane || 0) % ok.length; r = playSample(ok[i].buf, m, t, d, v, S.src === 'pitched' && !DRUMS.has(voice)); } }
    if (!r) { const fn = VOICES[voice] || VOICES.pluck; r = fn(n.f || mtof(m), t, d, v, n); }
    const [g] = r; const p = ctx.createStereoPanner(); p.pan.value = clamp(n.pan || 0, -1, 1); g.connect(p); p.connect(n.dest || bus);
    S.notes++;
    if (S.midiOut && !n.noMidi) { const ch = (n.lane || 0) % 16, mm = clamp(Math.round(m), 0, 127), ts = performance.now() + (t - ctx.currentTime) * 1000; try { S.midiOut.send([0x90 | ch, mm, clamp(Math.round(v * 100), 1, 127)], ts); S.midiOut.send([0x80 | ch, mm, 0], ts + d * 1000); } catch (e) {} }
    return r;
  }
  /* ---------- clock ---------- */
  function at(t, fn) { S.queue.push([t, fn]); }
  function pump() {
    if (!ctx) return; const now = ctx.currentTime;
    if (S.playing) { const sd = 60 / S.bpm / S.spb; if (nextT < now - 0.2) nextT = now + 0.03; while (nextT < now + 0.12) { try { cfg.onStep && cfg.onStep(S.step, nextT, sd); } catch (e) { console.warn(e); } S.step++; nextT += sd; } }
    if (S.queue.length) { const due = S.queue.filter((q) => q[0] <= now + 0.01); S.queue = S.queue.filter((q) => q[0] > now + 0.01); due.forEach((q) => { try { q[1](); } catch (e) { console.warn(e); } }); }
  }
  async function play(on = !S.playing) {
    ensure(); if (ctx.state !== 'running') await ctx.resume();
    if (on === S.playing) return; S.playing = on; $('#gp-play').classList.toggle('on', on); $('#gp-play').textContent = on ? '■ STOP' : '▶ PLAY';
    if (on) { nextT = ctx.currentTime + 0.05; cfg.onStart && cfg.onStart(); } else { cfg.onStop && cfg.onStop(); }
  }
  /* ---------- recording ---------- */
  function rec() {
    ensure(); const b = $('#gp-rec');
    if (!S.rec) {
      const sp = ctx.createScriptProcessor(4096, 2, 2), z = ctx.createGain(); z.gain.value = 0; const L = [], R = [];
      sp.onaudioprocess = (e) => { L.push(new Float32Array(e.inputBuffer.getChannelData(0))); R.push(new Float32Array(e.inputBuffer.getChannelData(1))); };
      out.connect(sp); sp.connect(z); z.connect(ctx.destination); S.rec = { sp, z, L, R, t0: Date.now() }; b.classList.add('on'); b.textContent = '■ STOP REC'; if (!S.playing) play(true); toast('Recording…');
    } else {
      const { sp, z, L, R } = S.rec; out.disconnect(sp); sp.disconnect(); z.disconnect(); S.rec = null; b.classList.remove('on'); b.textContent = '● REC';
      const blob = wav(L, R, ctx.sampleRate); S.lastWav = blob; const a = h('a', { href: URL.createObjectURL(blob), download: `${cfg.id}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav` }); document.body.append(a); a.click(); a.remove(); toast(`Saved WAV (${(blob.size / 1048576).toFixed(1)} MB)`);
    }
  }
  function wav(L, R, sr) {
    const n = L.reduce((s, x) => s + x.length, 0), buf = new ArrayBuffer(44 + n * 4), dv = new DataView(buf); const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 4, true);
    let o = 44; for (let c = 0; c < L.length; c++) { const l = L[c], r = R[c]; for (let i = 0; i < l.length; i++) { dv.setInt16(o, clamp(l[i], -1, 1) * 32767, true); dv.setInt16(o + 2, clamp(r[i], -1, 1) * 32767, true); o += 4; } }
    return new Blob([buf], { type: 'audio/wav' });
  }
  /* ---------- samples ---------- */
  const AUDIO_RE = /\.(wav|aiff?|mp3|ogg|flac|m4a)$/i;
  async function loadFiles(list) {
    ensure(); let files = [...list].filter((f) => AUDIO_RE.test(f.name)); if (!files.length) return toast('No audio files found');
    const cap = cfg.maxSamples || 16; if (files.length > cap) { for (let i = files.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [files[i], files[j]] = [files[j], files[i]]; } files = files.slice(0, cap); }
    S.samples = []; S.pool = [...list].filter((f) => AUDIO_RE.test(f.name));
    let ok = 0; for (const f of files) { try { const buf = await ctx.decodeAudioData(await f.arrayBuffer()); S.samples.push({ name: f.name, buf }); ok++; } catch (e) { console.warn('skip', f.name); } }
    if (ok) { if (S.src === 'synth') setSrc(cfg.sampleMode || 'pitched'); toast(`Loaded ${ok} sample${ok > 1 ? 's' : ''}${list.length > cap ? ` (random ${cap} of ${S.pool.length})` : ''}`); cfg.onSamples && cfg.onSamples(S.samples); }
    renderSamples();
  }
  function setSrc(v) { S.src = v; const s = $('#gp-src'); if (s) s.value = v; }
  function renderSamples() { const el = $('#gp-smp'); if (!el) return; el.textContent = S.samples.length ? S.samples.map((s, i) => `${i + 1}. ${s.name}`).join('\n') : 'No samples loaded: built-in synth voices are playing.'; }
  /* ---------- MIDI ---------- */
  async function midi() {
    const b = $('#gp-midi');
    if (S.midiOut) { S.midiOut = null; b.classList.remove('on'); return toast('MIDI out off'); }
    if (!navigator.requestMIDIAccess) return toast('Web MIDI not available in this browser');
    try { S.midi = await navigator.requestMIDIAccess(); const outs = [...S.midi.outputs.values()]; if (!outs.length) return toast('No MIDI outputs found (try loopMIDI)'); S.midiOut = outs[0]; b.classList.add('on'); toast('MIDI → ' + outs[0].name + ' (lane = channel)'); } catch (e) { toast('MIDI blocked: ' + e.message); }
  }
  /* ---------- Gemini ---------- */
  const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.6-flash'];
  function parseJSON(text) {
    let s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(s); } catch (e) {}
    const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) {} }
    const c = s.indexOf('['), d = s.lastIndexOf(']'); if (c >= 0 && d > c) { try { return JSON.parse(s.slice(c, d + 1)); } catch (e) {} }
    throw new Error('Gemini reply was not valid JSON');
  }
  async function gemini({ system, user, schema, temperature = 1 }) {
    const key = (localStorage.getItem('sr12.geminiKey') || '').trim(); if (!key) throw new Error('No Google AI Studio key saved');
    const chosen = localStorage.getItem('gp.geminiModel') || MODELS[0]; let useSchema = !!schema, lastErr;
    const order = [chosen, ...MODELS.filter((m) => m !== chosen)];
    for (let i = 0; i < order.length; i++) {
      const m = order[i]; const gc = { temperature, responseMimeType: 'application/json' }; if (useSchema) gc.responseJsonSchema = schema;
      let r; try { r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: gc }) }); } catch (e) { lastErr = new Error('Network error: ' + e.message); continue; }
      if (!r.ok) { const t = await r.text(); if (/API key|API_KEY/i.test(t) && (r.status === 400 || r.status === 403)) throw new Error('Key rejected by Google'); if (r.status === 400 && useSchema && /schema/i.test(t)) { useSchema = false; i--; continue; } lastErr = new Error(`${m}: HTTP ${r.status}`); continue; }
      const j = await r.json(); const parts = j?.candidates?.[0]?.content?.parts || []; const text = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join('');
      if (!text) { lastErr = new Error(`${m}: empty reply (${j?.candidates?.[0]?.finishReason || j?.promptFeedback?.blockReason || 'no text'})`); continue; }
      S.lastModel = m; return parseJSON(text);
    }
    throw lastErr || new Error('No Gemini model answered');
  }
  async function askAI(extra) {
    const A = cfg.ai; if (!A) return; const st = $('#gp-aistat'), outEl = $('#gp-aiout'); const prompt = ($('#gp-prompt').value || '').trim() || A.placeholder || '';
    localStorage.setItem('gp.' + cfg.id + '.prompt', prompt);
    const k = $('#gp-key').value.trim(); if (k) localStorage.setItem('sr12.geminiKey', k); localStorage.setItem('gp.geminiModel', $('#gp-model').value);
    if (!localStorage.getItem('sr12.geminiKey')) { st.textContent = 'No key: using the built-in pattern instead.'; A.fallback && A.fallback(prompt); return; }
    st.textContent = 'Asking Gemini…'; $('#gp-ask').disabled = true;
    try { const res = await gemini({ system: A.system, user: (A.user ? A.user(prompt, extra) : prompt), schema: A.schema, temperature: A.temperature ?? 1 }); const msg = await A.apply(res, prompt); S.aiApplied++; st.textContent = `Applied (${S.lastModel}).`; outEl.textContent = msg || ''; if (!S.playing) play(true); }
    catch (e) { st.textContent = 'Gemini failed: ' + e.message + '. Built-in pattern kept.'; console.warn(e); A.fallback && A.fallback(prompt); }
    finally { $('#gp-ask').disabled = false; }
  }
  /* ---------- UI helpers ---------- */
  let toastT; function toast(msg) { const t = $('#gp-toast'); if (!t) return; t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => (t.style.display = 'none'), 2200); }
  function ctl() { return $('#gp-ctl'); }
  function slider(label, min, max, step, val, fn, fmt = (x) => x) { const v = h('span', { class: 'v' }, String(fmt(val))); const i = h('input', { type: 'range', min, max, step, value: val }); i.oninput = () => { v.textContent = fmt(+i.value); fn(+i.value); }; ctl().append(h('div', { class: 'row' }, h('label', { class: 'k' }, label), i, v)); return { el: i, set(x) { i.value = x; v.textContent = fmt(+x); } }; }
  function select(label, opts, val, fn) { const s = h('select'); for (const o of opts) { const [vv, tt] = Array.isArray(o) ? o : [o, o]; s.append(new Option(tt, vv)); } s.value = val; s.onchange = () => fn(s.value); ctl().append(h('div', { class: 'row' }, h('label', { class: 'k' }, label), s)); return s; }
  function buttons(...bs) { const r = h('div', { class: 'row' }); const els = bs.map(([t, fn]) => { const b = h('button', {}, t); b.onclick = fn; r.append(b); return b; }); ctl().append(r); return els; }
  function textarea(label, val, fn) { const t = h('textarea'); t.value = val; t.oninput = () => fn(t.value); ctl().append(h('label', { class: 'k' }, label), t); return t; }
  function hud(s) { const e = $('#gp-hud'); if (e && e.textContent !== s) e.textContent = s; }

  function init(c) {
    cfg = c; S.bpm = c.bpm || 100; S.spb = c.spb || 4; document.title = `${c.no} ${c.title} · generative patterns`;
    if (c.accent) document.documentElement.style.setProperty('--acc', c.accent); if (c.accent2) document.documentElement.style.setProperty('--acc2', c.accent2);
    const voiceOpts = [['auto', 'voice: auto'], ...Object.keys(VOICES).filter((v) => !DRUMS.has(v) && v !== 'noise' && v !== 'chirp').map((v) => [v, 'voice: ' + v])];
    document.body.innerHTML = '';
    document.body.append(h('div', { id: 'gp' },
      h('header', { id: 'gp-top' },
        h('a', { class: 'back', href: '../index.html' }, '◂ GALLERY'), h('span', { class: 'no' }, c.no), h('h1', {}, c.title), h('span', { class: 'cat' }, c.cat), h('span', { class: 'sp' }),
        h('button', { id: 'gp-play', title: 'Space' }, '▶ PLAY'),
        h('label', { class: 'k' }, 'BPM', h('input', { id: 'gp-bpm', type: 'number', min: 20, max: 240, value: S.bpm })),
        h('select', { id: 'gp-voice', title: 'Override the melodic voice' }),
        h('select', { id: 'gp-src', title: 'Sound source' }),
        h('label', { class: 'btn', title: 'Load one or more audio files' }, 'FILES', h('input', { id: 'gp-files', type: 'file', accept: 'audio/*,.wav,.aif,.aiff,.mp3,.flac,.ogg', multiple: '', hidden: '' })),
        h('label', { class: 'btn', title: 'Load a folder, e.g. F:\\01 Splice Sounds (a random handful is used)' }, 'FOLDER', h('input', { id: 'gp-folder', type: 'file', webkitdirectory: '', hidden: '' })),
        h('button', { id: 'gp-midi', title: 'Send notes to the first MIDI output' }, 'MIDI'),
        h('button', { id: 'gp-rec', class: 'rec', title: 'R: record the output to WAV' }, '● REC'),
        h('label', { class: 'k' }, 'SPACE', h('input', { id: 'gp-space', type: 'range', min: 0, max: 1, step: 0.01, value: 0.4 })),
        h('label', { class: 'k' }, 'VOL', h('input', { id: 'gp-vol', type: 'range', min: 0, max: 1, step: 0.01, value: 0.8 }))),
      h('main', {},
        h('div', { id: 'gp-stage' }, h('canvas', { id: 'gp-cv' }), h('div', { id: 'gp-hud' }), h('div', { id: 'gp-drop' }, 'DROP SAMPLES')),
        h('aside', { id: 'gp-side' },
          h('section', { class: 'rule' }, h('h2', {}, c.ruleTitle || "WHAT'S THE PATTERN"), h('div', { html: c.rule })),
          h('section', { id: 'gp-ctl' }, h('h2', {}, 'CONTROLS')),
          c.ai ? h('section', { id: 'gp-ai' }, h('h2', {}, 'GEMINI · ' + (c.ai.title || 'ASK')), h('p', { class: 'small', html: c.ai.help }),
            h('textarea', { id: 'gp-prompt', placeholder: c.ai.placeholder || '' }),
            h('div', { class: 'row' }, h('button', { id: 'gp-ask' }, c.ai.button || 'ASK GEMINI'), h('span', { id: 'gp-aistat', class: 'small' }, 'No key? The built-in pattern still plays.')),
            h('pre', { id: 'gp-aiout' }),
            h('details', {}, h('summary', { class: 'small' }, 'Key & model'), h('p', { class: 'small' }, 'Free key from aistudio.google.com/apikey. Stored only in this browser (shared with SR-12 and the other tools) and sent only to generativelanguage.googleapis.com.'), h('input', { id: 'gp-key', type: 'password', placeholder: 'Google AI Studio key', autocomplete: 'off' }), h('div', { class: 'row' }, h('select', { id: 'gp-model' }), h('button', { id: 'gp-forget' }, 'FORGET KEY')))) : '',
          h('section', {}, h('h2', {}, 'SAMPLES'), h('pre', { id: 'gp-smp', class: 'small', style: 'white-space:pre-wrap' }), h('p', { class: 'small' }, 'Load files or a whole folder (like F:\\01 Splice Sounds). "pitched" plays each lane\'s sample at the note\'s pitch, "by note" picks a sample per note, "by lane" plays them unpitched. MIDI sends each lane on its own channel.')))),
      h('div', { id: 'gp-toast' })));
    const vs = $('#gp-voice'); voiceOpts.forEach(([v, t]) => vs.append(new Option(t, v))); vs.onchange = () => (S.voiceOverride = vs.value);
    const ss = $('#gp-src'); [['synth', 'source: synth'], ['pitched', 'samples: pitched'], ['byNote', 'samples: by note'], ['byLane', 'samples: by lane']].forEach(([v, t]) => ss.append(new Option(t, v))); ss.onchange = () => { S.src = ss.value; if (S.src !== 'synth' && !S.samples.length) toast('Load files or a folder first'); };
    $('#gp-play').onclick = () => play(); $('#gp-rec').onclick = rec; $('#gp-midi').onclick = midi;
    $('#gp-bpm').onchange = (e) => { S.bpm = clamp(+e.target.value || 100, 20, 240); if (dly) dly.delayTime.value = Math.min(1.9, 60 / S.bpm * 0.75); cfg.onBpm && cfg.onBpm(S.bpm); };
    $('#gp-space').oninput = (e) => { ensure(); revIn.gain.value = +e.target.value * 0.7; dlyIn.gain.value = +e.target.value * 0.35; };
    $('#gp-vol').oninput = (e) => { ensure(); vol.gain.value = +e.target.value; };
    $('#gp-files').onchange = (e) => loadFiles(e.target.files); $('#gp-folder').onchange = (e) => loadFiles(e.target.files);
    const st = $('#gp-stage'), dr = $('#gp-drop');
    st.addEventListener('dragover', (e) => { e.preventDefault(); dr.style.display = 'flex'; }); st.addEventListener('dragleave', () => (dr.style.display = 'none'));
    st.addEventListener('drop', (e) => { e.preventDefault(); dr.style.display = 'none'; loadFiles(e.dataTransfer.files); });
    if (c.ai) {
      const ms = $('#gp-model'); MODELS.forEach((m) => ms.append(new Option(m, m))); ms.value = localStorage.getItem('gp.geminiModel') || MODELS[0];
      $('#gp-key').value = localStorage.getItem('sr12.geminiKey') || ''; $('#gp-prompt').value = localStorage.getItem('gp.' + c.id + '.prompt') || '';
      $('#gp-ask').onclick = () => askAI(); $('#gp-forget').onclick = () => { localStorage.removeItem('sr12.geminiKey'); $('#gp-key').value = ''; toast('Key removed'); };
    }
    document.addEventListener('keydown', (e) => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.code === 'Space') { e.preventDefault(); play(); } else if (e.key === 'r' || e.key === 'R') rec(); else cfg.onKey && cfg.onKey(e); });
    renderSamples();
    setInterval(pump, 25);
    const cv = $('#gp-cv'), g = cv.getContext('2d'); GP.cv = cv; GP.g = g;
    const frame = (ts) => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); GP.resized = true; } GP.W = r.width; GP.H = r.height; g.setTransform(dpr, 0, 0, dpr, 0, 0); try { cfg.draw && cfg.draw(g, r.width, r.height, ts / 1000); } catch (e) { console.warn(e); } GP.resized = false; requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    c.setup && c.setup();
  }
  const GPo = { init, note, play, at, rec, ensure, toast, slider, select, buttons, textarea, hud, gemini, parseJSON, askAI, rng, hash, clamp, num, mtof, deg, SCALES, VOICES, S, h, $, loadFiles, get now() { return ctx ? ctx.currentTime : 0; }, get bpm() { return S.bpm; }, set bpm(v) { S.bpm = v; const b = $('#gp-bpm'); if (b) b.value = v; }, get playing() { return S.playing; } };
  return GPo;
})();
