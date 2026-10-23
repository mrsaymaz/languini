"""Import only curated, in-bank Fluent 3D artwork from a pinned Microsoft revision."""
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import urllib.parse
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REVISION = '1ffb34c752ecf5d402f04cfb4b392c77f57c54bc'
BASE = f'https://raw.githubusercontent.com/microsoft/fluentui-emoji/{REVISION}/'

def fetch(path):
    with urllib.request.urlopen(BASE + urllib.parse.quote(path, safe='/'), timeout=45) as response:
        return response.read()

def main():
    mapping = json.loads((ROOT / 'content/fluent-word-map.json').read_text())
    bank = json.loads((ROOT / 'public/data/language.json').read_text())
    vocabulary = {t['answer'].casefold() for g in bank for u in g['units'] for t in u['tasks'] if t['kind'] == 'vocabulary'}
    with urllib.request.urlopen(f'https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/{REVISION}?recursive=1', timeout=45) as response:
        tree = json.load(response)['tree']
    assets = {x['path'].split('/')[1]: x for x in tree if '/3D/' in x['path'] and x['path'].endswith('.png') and x['path'].count('/') == 3}
    selected = {name: [w for w in words if w.casefold() in vocabulary] for name, words in mapping.items()}
    selected = {name: words for name, words in selected.items() if words}
    missing = sorted(set(selected) - set(assets))
    if missing:
        raise ValueError('Unknown Fluent names: ' + ', '.join(missing))
    destination = ROOT / 'public/assets/fluent'
    destination.mkdir(parents=True, exist_ok=True)

    def download(name):
        source = assets[name]['path']
        filename = Path(source).stem.removesuffix('_3d') + '.webp'
        target = destination / filename
        if target.exists():
            optimized = target.read_bytes()
        else:
            raw = fetch(source)
            buffer = io.BytesIO()
            with Image.open(io.BytesIO(raw)) as picture:
                picture.convert('RGBA').resize((128, 128), Image.Resampling.LANCZOS).save(buffer, 'WEBP', quality=88, method=6)
            optimized = buffer.getvalue()
            target.write_bytes(optimized)
        return {'name': name, 'words': selected[name], 'file': filename, 'source': source,
                'sourceGitBlob': assets[name]['sha'], 'sha256': hashlib.sha256(optimized).hexdigest(), 'bytes': len(optimized)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        entries = sorted(pool.map(download, selected), key=lambda x: x['name'])
    retained = {entry['file'] for entry in entries}
    for old in destination.glob('*.webp'):
        if old.name not in retained:
            old.unlink()
    (destination / 'LICENSE.txt').write_bytes(fetch('LICENSE'))
    audit = {'source': 'https://github.com/microsoft/fluentui-emoji', 'revision': REVISION, 'style': '3D', 'license': 'MIT', 'assets': entries}
    (ROOT / 'content/fluent-emoji-assets.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    words = {word.casefold(): {'name': e['name'], 'src': './assets/fluent/' + e['file']} for e in entries for word in e['words']}
    (ROOT / 'src/fluent-emoji.mjs').write_text('// Curated Fluent 3D artwork; see content/fluent-emoji-assets.json and assets/fluent/LICENSE.txt.\nexport const FLUENT_WORDS=' + json.dumps(words, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f"Imported {len(entries)} Fluent 3D images for {len(words)} vocabulary words · {sum(e['bytes'] for e in entries):,} bytes")

if __name__ == '__main__':
    main()
