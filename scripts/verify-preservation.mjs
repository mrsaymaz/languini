import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {expandedContent} from './import-additional-banks.mjs';
export async function verifyPreservation(root=new URL('../',import.meta.url)){
  const baseline=JSON.parse(await readFile(new URL('CURRICULUM-BASELINE.json',root)));
  const snapshots={'public/data/language.json':'content/baseline-v0.36.0/language.json','public/data/provenance.json':'content/baseline-v0.36.0/provenance.json'};
  for(const [path,hash]of Object.entries(baseline.files)){const bytes=await readFile(new URL(snapshots[path]||path,root));if(createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Protected curriculum changed: '+path);}
  const bank=JSON.parse(await readFile(new URL('public/data/language.json',root))),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
  const original=JSON.parse(await readFile(new URL(snapshots['public/data/language.json'],root))),outline=b=>b.map(g=>({grade:g.grade,units:g.units.map(u=>({id:u.id,title:u.title}))}));
  if(!isDeepStrictEqual(outline(bank),outline(original)))throw Error('Protected catalog changed.');
  const reviewedReplies=JSON.parse(await readFile(new URL('content/reviewed-distractors.json',root))).wrongReplies;
  let preserved=0;for(const g of original)for(const u of g.units){const current=bank.find(x=>x.grade===g.grade).units.find(x=>x.id===u.id);for(const t of u.tasks){const now=current.tasks.find(x=>x.id===t.id),comparable=now?{...now}:null;if(t.kind==='sentence'&&comparable){comparable.blocks=t.blocks;delete comparable.blockRoles;}if(t.kind==='question'&&comparable&&reviewedReplies[t.id]){if(!isDeepStrictEqual(comparable.options,[t.answer,...reviewedReplies[t.id]]))throw Error('Reviewed replies not applied: '+t.id);comparable.options=t.options;}if(!isDeepStrictEqual(comparable,t))throw Error('Protected task wording/content changed: '+t.id);preserved++;}}
  if(preserved!==3033)throw Error('Original task count changed.');
  const expanded=await expandedContent();
  for(const [name,expected]of [['language',expanded.bank],['additional-sorting',expanded.sorting],['additional-bank-import',expanded.report],['provenance',expanded.provenance]])if(!isDeepStrictEqual(JSON.parse(await readFile(new URL(`public/data/${name}.json`,root))),expected))throw Error('Expansion is not reproducible: '+name);
  return {protectedFiles:Object.keys(baseline.files).length,units:44,preservedTasks:preserved,tasks:tasks.length,conversations:tasks.filter(t=>t.kind==='question').length};
}
if(process.argv[1]?.endsWith('verify-preservation.mjs'))console.log(await verifyPreservation());
