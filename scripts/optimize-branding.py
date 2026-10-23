"""Rebuild selected Chef's Seal derivatives; requires Pillow."""
from pathlib import Path
import json
from PIL import Image
root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets/branding'
assets.mkdir(parents=True, exist_ok=True)
report = []
for kind in ['logo', 'emblem']:
    source = root / 'artwork/branding' / f'chefs-seal-{kind}.png'
    image = Image.open(source).convert('RGBA')
    image = image.crop(image.getchannel('A').getbbox())
    if kind == 'emblem':
        edge = max(image.size) + 24
        tile = Image.new('RGBA', (edge, edge))
        tile.alpha_composite(image, ((edge-image.width)//2, (edge-image.height)//2))
        image = tile
    for width in ([240, 480, 768] if kind == 'logo' else [64, 128]):
        size = (width, round(width*image.height/image.width))
        output = assets / f'chefs-seal-{kind}-{width}.webp'
        image.resize(size, Image.Resampling.LANCZOS).save(output, 'WEBP', quality=86, method=6)
        report.append({'asset': output.relative_to(root/'public').as_posix(), 'dimensions': list(size),
                       'bytes': output.stat().st_size, 'source': source.relative_to(root).as_posix(),
                       'sourceBytes': source.stat().st_size, 'alphaPreserved': True})
    if kind == 'emblem':
        for width, name in [(32, 'favicon-32.png'), (180, 'apple-touch-icon.png'),
                            (192, 'app-icon-192.png'), (512, 'app-icon-512.png')]:
            output = root / 'public' / name
            image.resize((width, width), Image.Resampling.LANCZOS).save(output, optimize=True)
            report.append({'asset': name, 'dimensions': [width, width], 'bytes': output.stat().st_size, 'alphaPreserved': True})
        output = root / 'public/favicon.ico'
        image.resize((64, 64), Image.Resampling.LANCZOS).save(output, format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])
        report.append({'asset': 'favicon.ico', 'bytes': output.stat().st_size, 'alphaPreserved': True})
(root / 'artwork/branding/optimization-report.json').write_text(json.dumps(report, indent=2) + '\n')
