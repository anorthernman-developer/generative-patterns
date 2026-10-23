// Headless test for every project: no console errors, audio starts, no-key fallback makes notes, WAV recording works,
// a sample loads and plays, and a mocked Gemini reply is parsed and applied. Also writes a gallery thumbnail.
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MOCKS = require('./mocks.js');
const only = process.argv[2];
const HOOK = () => {
  window.__ctx = [];
  const AC = window.AudioContext;
  window.AudioContext = window.webkitAudioContext = class extends AC { constructor(...a) { super(...a); __ctx.push(this); this.__an = this.createAnalyser(); this.__an.fftSize = 2048; } };
  const oc = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...r) { if (d instanceof AudioDestinationNode && this.context.__an && this !== this.context.__an) oc.call(this, this.context.__an); return oc.call(this, d, ...r); };
  window.__rms = () => { const c = __ctx[0]; if (!c) return -1; const d = new Float32Array(2048); c.__an.getFloatTimeDomainData(d); return Math.sqrt(d.reduce((s, x) => s + x * x, 0) / d.length); };
};
(async () => {
  const exe = [process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', '/usr/bin/google-chrome'].find((p) => fs.existsSync(p));
  const browser = await chromium.launch({ executablePath: exe, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const files = fs.readdirSync(ROOT + '/projects').filter((f) => f.endsWith('.html') && (!only || f.startsWith(only))).sort();
  let fails = 0; const out = [];
  for (const file of files) {
    const id = file.slice(0, 2), mock = MOCKS[id];
    const ctxB = await browser.newContext({ viewport: { width: 1280, height: 760 }, acceptDownloads: true });
    const page = await ctxB.newPage(); const errs = [], warns = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (m.type() === 'warning') warns.push(m.text()); });
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    let aiCalls = 0, aiBody = null;
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => { aiCalls++; aiBody = JSON.parse(route.request().postData() || '{}'); const text = (aiCalls % 2 ? '```json\n' : '') + JSON.stringify(mock || {}) + (aiCalls % 2 ? '\n```' : ''); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }) }); });
    await page.addInitScript(HOOK);
    await page.goto('file://' + ROOT + '/projects/' + file);
    await page.waitForTimeout(400);
    const r = { file };
    await page.click('#gp-play');
    let pk = 0; for (let i = 0; i < 30; i++) { await page.waitForTimeout(100); pk = Math.max(pk, await page.evaluate(() => __rms())); }
    r.state = await page.evaluate(() => __ctx[0] && __ctx[0].state); r.fallbackRms = +pk.toFixed(4); r.notes = await page.evaluate(() => GP.S.notes);
    // WAV
    const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('#gp-rec'); await page.waitForTimeout(1500); await page.click('#gp-rec');
    const d = await dl; if (d) { const p = path.join(__dirname, 'out-' + id + '.wav'); await d.saveAs(p); const b = fs.readFileSync(p); r.wav = b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WAVE' ? b.length : 'bad'; fs.unlinkSync(p); } else r.wav = 'none';
    // Gemini mock
    if (mock) {
      await page.evaluate(() => localStorage.setItem('sr12.geminiKey', 'TEST-KEY'));
      await page.fill('#gp-prompt', 'test prompt');
      const n0 = await page.evaluate(() => GP.S.notes);
      await page.click('#gp-ask'); await page.waitForTimeout(1200);
      r.aiStatus = await page.textContent('#gp-aistat'); r.aiApplied = await page.evaluate(() => GP.S.aiApplied); r.aiCalls = aiCalls; r.aiSchema = !!aiBody?.generationConfig?.responseJsonSchema;
      await page.waitForTimeout(2500); r.notesAfterAI = (await page.evaluate(() => GP.S.notes)) - n0;
      r.aiOut = (await page.textContent('#gp-aiout')).slice(0, 160);
    }
    // sample
    await page.setInputFiles('#gp-files', path.join(__dirname, 'test.wav')); await page.waitForTimeout(800);
    const n1 = await page.evaluate(() => GP.S.notes); await page.waitForTimeout(2500);
    r.samples = await page.evaluate(() => GP.S.samples.length); r.src = await page.evaluate(() => GP.S.src); r.notesWithSample = (await page.evaluate(() => GP.S.notes)) - n1;
    let pk2 = 0; for (let i = 0; i < 10; i++) { await page.waitForTimeout(100); pk2 = Math.max(pk2, await page.evaluate(() => __rms())); } r.sampleRms = +pk2.toFixed(4);
    // thumbnail with synth voice
    await page.selectOption('#gp-src', 'synth'); await page.waitForTimeout(1500);
    await page.locator('#gp-stage').screenshot({ path: ROOT + '/thumbs/' + file.replace('.html', '.png') });
    r.errors = errs; r.warns = warns.filter((w) => !/skip|ScriptProcessorNode is deprecated/.test(w));
    const ok = r.state === 'running' && r.notes > 0 && r.fallbackRms > 0.002 && typeof r.wav === 'number' && r.wav > 10000 && (!mock || (r.aiApplied === 1 && r.notesAfterAI > 0)) && r.samples === 1 && r.notesWithSample > 0 && !errs.length && !r.warns.length;
    if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(r)); out.push({ ...r, ok });
    await ctxB.close();
  }
  fs.writeFileSync(__dirname + '/results' + (only ? '-' + only : '') + '.json', JSON.stringify(out, null, 1));
  await browser.close(); process.exit(fails ? 1 : 0);
})();
