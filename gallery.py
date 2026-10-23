# Builds index.html (the gallery) from projects.json, and makes small JPEG thumbnails from thumbs/*.png.
import json, html, os
from PIL import Image
P = json.load(open('projects.json'))
for m in P:
    src = f"thumbs/{m['slug']}.png"
    if os.path.exists(src):
        im = Image.open(src).convert('RGB'); im.thumbnail((480, 340)); im.save(f"thumbs/{m['slug']}.jpg", quality=82)
fonts = open('src/_fonts.css').read()
CATS = [('Maths', 'Repeating integer sequences, rewriting systems, chaos and fractals'), ('Nature', 'Patterns that grow, sing and forage'), ('History', 'Rule-based music from bell towers, cathedrals and parlour games'), ('Art', 'Paintings and instructions read as scores'), ('Manifestos', 'Famous art manifestos, with their rules turned into music-making constraints')]
cards = ''
for cat, blurb in CATS:
    items = [m for m in P if m['cat'] == cat]
    cards += f'<section><h2><span>{cat.upper()}</span> <small>{len(items)} · {html.escape(blurb)}</small></h2><div class="grid">'
    for m in items:
        cards += f'''<a class="card" href="projects/{m['slug']}.html"><div class="th"><img loading="lazy" src="thumbs/{m['slug']}.jpg" alt="{html.escape(m['title'])} screenshot"><b>{m['no']}</b></div><h3>{html.escape(m['title'])}</h3><p>{html.escape(m['line'])}</p><p class="g"><i>GEMINI</i> {html.escape(m['gemini'])}</p></a>'''
    cards += '</div></section>'
out = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,">
<title>GENERATIVE PATTERNS · 20 rule-based music machines</title>
<meta name="description" content="Twenty self-contained generative music projects built from maths, nature, history, art and art manifestos, with Gemini as an optional pattern generator.">
<style>{fonts}
:root{{--bg:#0b0a08;--ink:#e9dcc0;--dim:#8c8170;--acc:#ffb000;--acc2:#38e8c6;--hot:#ff4f3a;--line:#2c2820}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 'Share Tech Mono',ui-monospace,Consolas,monospace}}
body:after{{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.2) 0 1px,transparent 1px 3px);z-index:9}}
header{{padding:38px 24px 18px;border-bottom:2px solid var(--line);background:radial-gradient(ellipse at top,#1d1912,#0b0a08)}}
h1{{font:400 64px/0.9 'VT323',monospace;margin:0;color:var(--acc);letter-spacing:.04em;text-shadow:0 0 14px rgba(255,176,0,.55)}}
h1 em{{color:var(--acc2);font-style:normal;text-shadow:0 0 14px rgba(56,232,198,.5)}}
.lede{{max-width:900px;color:#cfc3a9}}.lede b{{color:var(--acc)}}
nav{{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}}nav a{{font:11px 'Silkscreen',monospace;color:var(--acc2);border:1px solid var(--acc2);padding:4px 8px;text-decoration:none}}nav a:hover{{background:var(--acc2);color:#000}}
section{{padding:10px 24px 20px}}h2{{font:400 34px 'VT323',monospace;color:var(--acc);border-bottom:1px dashed var(--line);margin:22px 0 14px}}h2 small{{font:13px 'Share Tech Mono';color:var(--dim);margin-left:10px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}}
.card{{display:block;text-decoration:none;color:inherit;background:#15130f;border:1px solid #3d372c;box-shadow:0 3px 0 #000;transition:transform .12s}}
.card:hover{{transform:translateY(-3px);border-color:var(--acc)}}.card:hover h3{{color:var(--acc)}}
.th{{position:relative;aspect-ratio:480/340;background:#000;overflow:hidden;border-bottom:1px solid #3d372c}}.th img{{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(1.05)}}
.th b{{position:absolute;left:8px;top:8px;font:12px 'Silkscreen';background:var(--acc);color:#000;padding:3px 6px}}
h3{{font:400 28px/1 'VT323',monospace;margin:10px 12px 4px;letter-spacing:.04em}}.card p{{margin:6px 12px 10px;font-size:13px;color:#cfc3a9}}
.card p.g{{color:var(--acc2);font-size:12px}}.card p.g i{{font:9px 'Silkscreen';font-style:normal;border:1px solid var(--acc2);padding:1px 4px;margin-right:4px}}
footer{{padding:20px 24px 40px;color:var(--dim);border-top:2px solid var(--line);font-size:13px}}footer a{{color:var(--acc2)}}
</style></head><body>
<header><h1>GENERATIVE <em>PATTERNS</em></h1>
<p class="lede">Twenty music machines, each driven by one rule: <b>maths</b> (primes, Collatz, Recamán, Thue–Morse, L-systems, attractors, the Mandelbrot set), <b>nature</b> (phyllotaxis, birdsong, slime mould), <b>history</b> (change ringing, isorhythm, Mozart's dice game), <b>art</b> (Mondrian, Kandinsky, Sol LeWitt) and seven art <b>manifestos</b> (Futurist noise, Dada, Surrealism, Fluxus, Suprematism, Cage and the Situationists), each turned into a set of constraints.<br>
Each one is a single HTML file: open it in Chrome or Edge and press PLAY. <b>Gemini</b> is optional. When you add a key, it returns structured JSON (a grammar, a chart, a map or a score) that the deterministic engine then plays. Without a key, every project uses its own algorithm. You can use the built-in synth voices or load your own samples, and each project has MIDI out and WAV recording.</p>
<nav>{''.join(f'<a href="#{c.lower()}">{c.upper()}</a>' for c, _ in CATS)}<a href="https://github.com/anorthernman-developer/generative-patterns">SOURCE ON GITHUB</a></nav></header>
{cards.replace('<section><h2><span>', '<section><h2 id="REPL"><span>')}
<footer>Built with Web Audio, Web MIDI and the Gemini API (optional). Your key stays in your browser's localStorage and is only sent to generativelanguage.googleapis.com. · <a href="https://github.com/anorthernman-developer/generative-patterns">github.com/anorthernman-developer/generative-patterns</a></footer>
</body></html>'''
# give each section its anchor id
for c, _ in CATS: out = out.replace('<h2 id="REPL"><span>' + c.upper(), f'<h2 id="{c.lower()}"><span>' + c.upper(), 1)
open('index.html', 'w').write(out); print('index.html', len(out))
