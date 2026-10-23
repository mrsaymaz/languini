import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mergeGradeBanks} from './grade-bank-import.mjs';
const sourceRoot=new URL('../content/',import.meta.url),output=new URL('../public/data/',import.meta.url);
const sources=[],hashes=[];
for(const grade of [5,6,7,8]){const text=await readFile(new URL(`grade${grade}.json`,sourceRoot),'utf8');sources.push(JSON.parse(text));hashes.push({file:`grade${grade}.json`,sha256:createHash('sha256').update(text).digest('hex')});}
const original=JSON.parse(await readFile(new URL('language.json',output),'utf8')),refinements=JSON.parse(await readFile(new URL('reviewed-replies.json',sourceRoot),'utf8')),{bank,report}=mergeGradeBanks(original,sources,refinements),previous=JSON.parse(await readFile(new URL('provenance.json',output),'utf8'));
const tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)),counts={grades:bank.length,units:bank.reduce((n,g)=>n+g.units.length,0),tasks:tasks.length,conversations:tasks.filter(t=>t.kind==='question').length,repairs:tasks.filter(t=>t.kind==='repair').length,derivedListening:tasks.filter(t=>t.kind==='vocabulary').length};
await writeFile(new URL('language.json',output),JSON.stringify(bank));await writeFile(new URL('grade-bank-import.json',output),JSON.stringify({...report,sources:hashes},null,2));await writeFile(new URL('provenance.json',output),JSON.stringify({...previous,...counts,sources:['Wordrift-v0.23.1.zip',...hashes],policy:'Wordrift material plus the four supplied grade banks. All existing unit IDs, names and order are preserved. Five unmatched source sections are excluded. Duplicate questions are merged. Replies are expanded where needed, and vocabulary questions stay within their grade and theme.'},null,2));
console.log({...counts,importedQuestions:report.importedQuestions,derivedQuestions:report.derivedQuestions,mappedSections:report.mappings.length,skippedSections:report.skipped.length});
