# Builds each src/projects/*.js into a single self-contained projects/*.html (fonts, kit CSS, kit JS and project JS inlined).
import glob, os, json, re
fonts = open('src/_fonts.css').read(); css = open('src/kit.css').read(); kit = open('src/kit.js').read()
metas = []
for f in sorted(glob.glob('src/projects/*.js')):
    src = open(f).read()
    meta = json.loads(re.search(r'/\*META(.*?)\*/', src, re.S).group(1))
    slug = os.path.basename(f)[:-3]; meta['slug'] = slug; metas.append(meta)
    extra = re.search(r'/\*CSS(.*?)\*/', src, re.S)
    html = f"""<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{meta['no']} {meta['title']} · generative patterns</title>
<meta name="description" content="{meta['line']}">
<style>{fonts}
{css}
{extra.group(1) if extra else ''}</style></head>
<body><noscript>This generative music piece needs JavaScript and Web Audio (Chrome or Edge).</noscript>
<script>
{kit}
</script>
<script>
{src}
</script>
</body></html>
"""
    open(f'projects/{slug}.html', 'w').write(html)
    print('built', slug, len(html))
json.dump(metas, open('projects.json', 'w'), indent=1, ensure_ascii=False)
