"""Rebuild the game's WebP derivatives from the included PNGs; requires Pillow."""
from pathlib import Path
import json
from PIL import Image
root = Path(__file__).resolve().parents[1]
assets = root / 'public/assets/saymaz'
assets.mkdir(parents=True, exist_ok=True)
report = []
for pose in ['full', 'bust', 'point', 'think', 'smile', 'cheer']:
    name = f'saymaz-{pose}.png'
    source = root / 'artwork/originals' / name
    image = Image.open(source).convert('RGBA')
    widths = [160, 480, 768] if pose == 'full' else [160] if pose in ['point', 'think'] else [160, 320]
    for width in widths:
        height = round(image.height * width / image.width)
        output = assets / f'{pose}-{width}.webp'
        image.resize((width, height), Image.Resampling.LANCZOS).save(output, 'WEBP', quality=84, method=6)
        report.append({'source': name, 'sourceDimensions': list(image.size), 'sourceBytes': source.stat().st_size,
                       'asset': output.relative_to(root / 'public').as_posix(), 'dimensions': [width, height],
                       'bytes': output.stat().st_size, 'reductionPercent': round((1-output.stat().st_size/source.stat().st_size)*100, 2),
                       'alphaPreserved': True})
(root / 'artwork/optimization-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'{len(report)} production variants: {sum(item["bytes"] for item in report):,} bytes')
