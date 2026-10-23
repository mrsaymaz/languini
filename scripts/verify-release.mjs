import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const ready=resolve(process.argv[2]||'..'),source=resolve(process.argv[3]||'.');
const runtime=JSON.parse(await readFile(join(ready,'RUNTIME-MANIFEST.json'))),fingerprint=JSON.parse(await readFile(join(ready,'SOURCE-FINGERPRINT.json')));
for(const [base,files]of [[ready,runtime.files],[source,fingerprint.files]])for(const [path,hash]of Object.entries(files)){
  const target=resolve(base,path);if(!target.startsWith(base+'/'))throw Error('Unsafe manifest path');const actual=createHash('sha256').update(await readFile(target)).digest('hex');if(actual!==hash)throw Error('Release file mismatch: '+path);
}
const version=JSON.parse(await readFile(join(source,'package.json'))).version;
if(runtime.version!==version||fingerprint.version!==version||JSON.parse(await readFile(join(ready,'version.json'))).version!==version)throw Error('Release version mismatch.');
for(const entry of ['index.html','phone-preview.html']){const html=await readFile(join(ready,entry),'utf8');for(const match of html.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g))await readFile(join(ready,match[1]));}
console.log(JSON.stringify({version,runtimeFiles:Object.keys(runtime.files).length,sourceFiles:Object.keys(fingerprint.files).length,relativeEntrypointAssets:'passed',sourceFingerprint:'passed',runtimeHashes:'passed'}));
