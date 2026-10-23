import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mergeGradeBanks,UNMATCHED_THEMES,normalize} from '../scripts/grade-bank-import.mjs';
import {questionKey} from '../src/tasks.mjs';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const baseline=await read('../content/wordrift-base.json'),bank=await read('../content/baseline-v0.36.0/language.json'),refinements=await read('../content/reviewed-replies.json'),sources=await Promise.all([5,6,7,8].map(g=>read(`../content/grade${g}.json`))),report=await read('../public/data/grade-bank-import.json');
test('all existing theme IDs, names and ordering remain exactly unchanged',()=>{
  const outline=b=>b.map(g=>({grade:g.grade,units:g.units.map(u=>({id:u.id,title:u.title}))}));assert.deepEqual(outline(bank),outline(baseline));assert.equal(bank.reduce((n,g)=>n+g.units.length,0),44);assert.equal(report.mappings.length,39);assert.equal(report.skipped.length,5);
  assert.throws(()=>mergeGradeBanks(baseline,[{grade:5,units:[{id:'g5u99',title:'New theme'}]}]),/Cannot add a unit/);
});
test('mapped questions and words stay in their exact grade and matching theme',()=>{
  let natural=0;for(const grade of bank)for(const unit of grade.units){const prompts=new Set();for(const t of unit.tasks.filter(t=>t.kind==='question')){assert.ok(!prompts.has(questionKey(t)),t.id);prompts.add(questionKey(t));}assert.ok(prompts.size>=12,unit.id);
    for(const task of unit.tasks){if(!task.bankSource)continue;const origin=task.bankSource;assert.equal(origin.grade,grade.grade);assert.equal(origin.unit,unit.id);assert.ok(!UNMATCHED_THEMES.has(origin.unit));const raw=sources.find(g=>g.grade===origin.grade).units.find(u=>u.id===origin.unit);assert.ok(raw);if(task.kind==='question'){natural++;const q=raw.questions.find(q=>q.id===origin.record);assert.ok(q);assert.equal(normalize(task.prompt),normalize(q.q));assert.equal(task.answer,refinements[q.id]||q.a);}}
  }assert.equal(natural,351);
});
test('derived guest prompts preserve a same-unit vocabulary or definition answer',()=>{
  let count=0;for(const grade of bank)for(const unit of grade.units)for(const task of unit.tasks.filter(t=>t.derivedPractice)){const source=unit.tasks.find(t=>t.id===task.sourceId);assert.ok(source);assert.ok(['description','vocabulary'].includes(source.kind));assert.ok(task.answer.includes(source.answer));assert.equal(task.readback,task.answer);count++;}assert.equal(count,150);
});
test('the import is reproducible and never mutates its source banks',()=>{
  const input=JSON.stringify(baseline),raw=JSON.stringify(sources),first=mergeGradeBanks(baseline,sources,refinements),second=mergeGradeBanks(baseline,sources,refinements);assert.deepEqual(first,second);assert.deepEqual(first.bank,bank);assert.equal(JSON.stringify(baseline),input);assert.equal(JSON.stringify(sources),raw);
});
