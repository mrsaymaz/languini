import {readFile,writeFile} from 'node:fs/promises';
import {mergeAdditionalBanks,sha256} from './additional-bank-import.mjs';
import {applySentenceBlocks} from './sentence-blocks.mjs';
import {applyReviewedDistractors} from './reviewed-distractors.mjs';
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
export async function expandedContent(){
 const base=await read('content/baseline-v0.36.0/language.json'),sources=await Promise.all([5,6,7,8].map(g=>read(`content/additional-banks/grade${g}-2.json`))),translations=await read('content/additional-banks/picture-translations.json');
 const result=mergeAdditionalBanks(base,sources,translations),previous=await read('content/baseline-v0.36.0/provenance.json');
 const review=await read('content/sentence-blocks.json');result.report.sentenceBlocks=applySentenceBlocks(result.bank,review);
 const replies=await read('content/reviewed-distractors.json');result.report.reviewedReplies=applyReviewedDistractors(result.bank,replies);
 result.report.sources=await Promise.all([5,6,7,8].map(async g=>({file:`grade${g}-2.json`,sha256:sha256(await readFile(new URL(`content/additional-banks/grade${g}-2.json`,root)))})));
 result.provenance={...previous,version:'0.37.0',tasks:result.report.totalTasks,conversations:result.report.totalQuestions,derivedListening:result.bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='vocabulary').length,sources:[...previous.sources,...result.report.sources],policy:'Additive expansion of the frozen v0.36.0 bank. All original tasks remain byte-for-byte equivalent as JSON objects, and all 44 catalog IDs, names and positions stay stable. Source sections map by meaning, not just source ID. Duplicate practice is linked to existing tasks. Completion halves become sentence assembly; exclusive yes-lists supply extra sorting packs. Picture drawings are references only; existing local artwork is used when available.'};
 result.provenance.version='0.38.0';result.provenance.sentenceBlocks={...result.report.sentenceBlocks,reviewFile:'content/sentence-blocks.json',sha256:sha256(await readFile(new URL('content/sentence-blocks.json',root)))};
 result.provenance.reviewedReplies={...result.report.reviewedReplies,reviewFile:'content/reviewed-distractors.json',sha256:sha256(await readFile(new URL('content/reviewed-distractors.json',root)))};
 result.provenance.policy=result.provenance.policy.replace('All original tasks remain byte-for-byte equivalent as JSON objects','Original task wording, answers, translations and IDs remain unchanged; sentence block boundaries follow the reviewed grammatical-role map, and listed conversation questions use reviewed wrong replies');
 return result;
}
if(process.argv[1]?.endsWith('import-additional-banks.mjs')){
 const result=await expandedContent();
 for(const [name,data]of [['language',result.bank],['additional-sorting',result.sorting],['additional-bank-import',result.report],['provenance',result.provenance]])await writeFile(new URL(`public/data/${name}.json`,root),JSON.stringify(data)+'\n');
 console.log(JSON.stringify({counts:result.report.counts,totalTasks:result.report.totalTasks,totalQuestions:result.report.totalQuestions}));
}
