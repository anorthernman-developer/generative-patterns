// quick thumbnail: open, play N s, screenshot (no AI)
const { chromium } = require('playwright-core');
(async () => { const [, , slug, secs, out] = process.argv; const b = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1320, height: 760 } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('file:///workspace/generative-patterns/projects/' + slug + '.html'); if (process.argv[5]) await p.click('button:text-is("' + process.argv[5] + '")'); await p.click('#gp-play'); await p.waitForTimeout(+secs * 1000);
const st = await p.evaluate(() => ({ notes: GP.S.notes })); await p.locator('#gp-stage').screenshot({ path: out }); console.log(JSON.stringify({ ...st, errs })); await b.close(); })();
