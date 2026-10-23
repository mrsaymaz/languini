"""Build a source + ready-runtime ZIP. Run npm test and npm run build first."""
import argparse
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('output', help='Absolute or relative ZIP output path')
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
ready = source / 'dist'
version = json.loads((source / 'package.json').read_text())['version']
assert (ready / 'RUNTIME-MANIFEST.json').is_file(), 'Build the runtime first'
output = Path(args.output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
docs = ['REPUTATION-STORY.md', 'TAKEAWAY-NUMBERS.md', 'RESTAURANT-LAYOUT.md', 'SENTENCE-BLOCKS.md', 'LANGUAGE-EXPANSION.md', 'SETUP-LESSONS.md', 'BRANDING.md', 'OWNER-GUIDE.md', 'README.md', 'RELEASE-NOTES.md', 'MOBILE-PLAYTEST.md', 'BUILD-INFO.json',
        'VALIDATION-REPORT.md', 'UPGRADE-COVERAGE.md', 'GRAPHICS-NOTES.md', 'LIVE-KITCHEN.md', 'GUIDANCE-NOTES.md', 'CHECKOUT-NOTES.md', 'ACTIVITY-NOTES.md', 'WASHING-DESIGN.md', 'PLATE-VOICES.md', 'REFERENCE-SLICE.md', 'RESTAURANT-CRAFT.md', 'START-HERE.txt', 'LANGUINI.md', 'MOTION-DESIGN.md', 'THREE-PHASE-PREP.md', 'BASELINE-PROVENANCE.json', 'RECEIPTS-PROGRESSION-FRESHNESS.md', 'CUSTOMER-REVIEWS-RECOVERY.md', 'REVIEW-CARD-POLISH.md', 'TAP-TICKET-FLOW.md', 'VENUE-LEARNING-PROGRESSION.md']
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(ready.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(ready).as_posix())
    for name in docs:
        archive.write(source / name, name)
    for path in sorted(source.rglob('*')):
        relative = path.relative_to(source)
        if any(part in {'node_modules', 'dist', '__pycache__', '.cache', '.git', '.DS_Store'} for part in relative.parts):
            continue
        if path.is_file():
            archive.write(path, 'source/' + relative.as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None, 'ZIP CRC failed'
    assert len(archive.namelist()) == len(set(archive.namelist())), 'Duplicate entries'
    assert 'index.html' in archive.namelist()
print(json.dumps({'version': version, 'path': str(output), 'entries': len(archive.namelist()),
                  'bytes': output.stat().st_size, 'crc': 'passed'}))
