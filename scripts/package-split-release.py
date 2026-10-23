"""Package standard ZIP 2.0 runtime + editable source; no ZIP64 or dependencies."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('output_directory');args=parser.parse_args()
source=Path(__file__).resolve().parents[1];dist=source/'dist';version=json.loads((source/'package.json').read_text())['version'];out=Path(args.output_directory).resolve();out.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(source/'scripts/verify-release.mjs'),str(dist),str(source)],check=True)
def put(z,name,data):
 info=zipfile.ZipInfo(name,(2026,10,18,19,30,0));info.create_system=0;info.external_attr=0x20;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data,compresslevel=9)
checks=[]
for kind in ['Ready-to-Play','Complete-Source']:
 path=out/f'Languini-v{version}-{kind}.zip';prefix=f'Languini-v{version}'+('-Source' if kind=='Complete-Source' else '')+'/'
 with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,allowZip64=False) as z:
  if kind=='Ready-to-Play':
   for p in sorted(dist.rglob('*')):
    if p.is_file():put(z,prefix+p.relative_to(dist).as_posix(),p.read_bytes())
   for name in ['BUILD-INFO.json','RELEASE-NOTES.md','ANSWER-VALIDATION.md','OPENING-STORY.md','MODEL-DETAIL.md','CAFE-EVOLUTION.md','REPUTATION-STORY.md','TAKEAWAY-NUMBERS.md','ULTI-POINTS.md','CAMERA-CONTROLS.md','FOOD-PREPARATION.md','INTERACTION-CRAFT.md','PHONE-FIXES.md','PHONE-ACTIONS.md','TASK-COLOURS.md','OPENING-LAYOUT.md','NEIGHBOURHOOD.md']:
    put(z,prefix+name,(source/name).read_bytes())
   put(z,prefix+'OPEN-ME.txt',f'LANGUINI v{version} - READY TO PLAY\n\nExtract the entire ZIP, then open index.html in this folder. Keep adjacent files and folders together. Do not open it inside a ZIP preview.\n\nFor phones, upload this folder\'s contents to your static host.\n\nThis is the complete runnable game, including distinct table arrangements, visible weather, softer adjustable ambience, cleaner panels, the design studio, visible recovery, connected service episodes, expanded takeaway practice, detailed models and refined opening. Music/effects use the existing Sound setting. On an existing campaign use Help > Replay to watch the refined introduction.\n\nEditable source is supplied separately in Languini-v{version}-Complete-Source.zip.\n'.encode())
  else:
   for p in sorted(source.rglob('*')):
    rel=p.relative_to(source)
    if p.is_file() and not any(x in {'node_modules','dist','__pycache__','.cache','.git','.DS_Store'} for x in rel.parts):put(z,prefix+'source/'+rel.as_posix(),p.read_bytes())
   put(z,prefix+'BUILD-SOURCE.txt',f'LANGUINI v{version} - COMPLETE EDITABLE SOURCE\n\nSource, original artwork, curriculum, documentation and tests are in source/. Dependencies are excluded.\n\nInstall Node.js, change into source/, then run:\n npm ci\n npm run build\n node scripts/verify-release.mjs dist .\n\nOpen source/dist/index.html after building. To play immediately, use the separate Ready-to-Play ZIP.\n'.encode())
 assert path.stat().st_size<20_000_000, "ZIP exceeds the 20 MB delivery limit"
 with zipfile.ZipFile(path) as z:
  assert z.testzip() is None
  assert len(z.namelist())==len(set(z.namelist()))
  assert all(i.compress_type==8 and i.extract_version<=20 and not i.flag_bits&1 for i in z.infolist())
  assert all(not n.startswith('/') and '..' not in Path(n).parts for n in z.namelist())
 subprocess.run(['unzip','-t',str(path)],stdout=subprocess.DEVNULL,check=True)
 checks.append({'path':str(path),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'crc':'passed','systemUnzip':'passed'})
print(json.dumps({'version':version,'files':checks}))
