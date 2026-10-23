import {auditLanguageBank} from '../src/language-integrity.mjs';
import {build} from 'esbuild';
import {mkdir,rm,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {embedLocalArtwork} from './embed-local-artwork.mjs';
const {verifyPreservation}=await import('./verify-preservation.mjs');
await verifyPreservation();
await embedLocalArtwork();
const {version}=JSON.parse(await readFile('package.json','utf8'));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/app.mjs'],outfile:'dist/game.js',bundle:true,minify:true,format:'iife',target:['es2020'],legalComments:'eof'});
const bank=JSON.parse(await readFile('dist/data/language.json','utf8'));
const integrity=auditLanguageBank(bank);if(integrity.issues.length)throw Error('Language integrity failed: '+JSON.stringify(integrity.issues));
const units=bank.reduce((n,g)=>n+g.units.length,0);if(bank.length!==4||units!==44)throw Error('Language bank is incomplete.');
await writeFile('dist/version.json',JSON.stringify({version,name:'Languini'}));
console.log(`Languini v${version} built · ${units} units · eight stations · connected orders · phone preview`);

async function hashes(root,paths){
  const files={};async function walk(path){const entries=await readdir(root+'/'+path,{withFileTypes:true});for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){const rel=(path?path+'/':'')+entry.name;if(entry.isDirectory())await walk(rel);else files[rel]=createHash('sha256').update(await readFile(root+'/'+rel)).digest('hex');}}
  for(const path of paths){if(path.endsWith('.json'))files[path]=createHash('sha256').update(await readFile(root+'/'+path)).digest('hex');else await walk(path);}return files;
}
const sourceFiles=await hashes('.',['src','scripts','tests','content','artwork','public','package.json','package-lock.json','CURRICULUM-BASELINE.json']);
await writeFile('dist/SOURCE-FINGERPRINT.json',JSON.stringify({version,entryPoint:'src/app.mjs',files:sourceFiles},null,2)+'\n');
const runtimeFiles=await hashes('dist',['']);
await writeFile('dist/RUNTIME-MANIFEST.json',JSON.stringify({version,files:runtimeFiles},null,2)+'\n');
await verifyPreservation();
