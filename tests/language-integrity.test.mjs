import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {auditLanguageBank,answerChoicesValid} from '../src/language-integrity.mjs';
import {choicesFor,TaskDeck} from '../src/core.mjs';
import {sortingTask,SORTING_PACKS,ADDITIONAL_SORTING_PACKS} from '../src/delivery-sorting.mjs';
import {takeawayTask} from '../src/takeaway-tasks.mjs';
import {seeded} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url))),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
test('all 4805 reviewed tasks have complete, unique answer keys and reconstructible sentence blocks',()=>{
 const r=auditLanguageBank(bank);assert.deepEqual(r.issues,[]);assert.deepEqual(r.counts,{grades:4,units:44,tasks:4805,choiceTasks:3285,sentences:1520,labelTasks:1841});
});
test('the reported kings and queens clue always offers exactly one chess club answer',()=>{
 const t=tasks.find(t=>t.id==='g5u1d3');assert.match(t.prompt,/kings and queens/);assert.equal(t.answer,'chess club');
 for(const difficulty of ['relaxed','challenge'])for(let seed=1;seed<=120;seed++){const c=choicesFor(t,difficulty,seeded(seed));assert.equal(c.filter(v=>v==='chess club').length,1);assert.ok(answerChoicesValid(t,c));}
 assert.equal(answerChoicesValid(t,['chess club']),false);assert.equal(answerChoicesValid(t,['music club','art club']),false);assert.equal(answerChoicesValid(t,['chess club','chess club']),false);assert.equal(answerChoicesValid(t,['chess club',' CHESS CLUB ']),false);assert.equal(answerChoicesValid(t,['chess club','unrelated stale label']),false);
});
test('both paces and random choice order preserve one correct key for every choice task',()=>{
 for(const t of tasks.filter(t=>t.kind!=='sentence'))for(const difficulty of ['relaxed','challenge'])for(let seed=1;seed<=16;seed++)assert.ok(answerChoicesValid(t,choicesFor(t,difficulty,seeded(seed))),t.id);
});
test('future malformed language imports are rejected instead of creating an impossible task',()=>{
 const t=tasks[0],wrap=t=>[{grade:5,units:[{id:'g5u1',tasks:[t]}]}];
 for(const broken of [{...t,options:['wrong','also wrong']},{...t,answer:''},{...t,options:[t.answer,t.answer]},{...t,prompt:''},{...t,kind:'unknown'},{id:'bad',kind:'sentence',prompt:'Build.',answer:'The pupils are helpful.',blocks:['The pupils','is','helpful.']}])assert.ok(auditLanguageBank(wrap(broken)).issues.length);
});
test('generated matching, listening and functional pickup tasks retain distinct selectable matches',()=>{
 for(const g of bank)for(const u of g.units){const deck=new TaskDeck(u.tasks,seeded(7));for(const difficulty of ['relaxed','challenge'])for(const mode of ['translation','translation-reverse','audio-translation','picture','listening']){
  const t=deck.forSetting('tablet',difficulty,{menuMode:mode,forcePairListening:mode==='listening'});
  if(t.pairs){assert.equal(new Set(t.pairs.map(p=>p.word)).size,t.pairs.length);assert.equal(new Set(t.pairs.map(p=>p.translation)).size,t.pairs.length);}else assert.ok(answerChoicesValid(t,t.options));
 }}
 for(const kind of ['numbers','names','quantities','times','instructions'])for(const difficulty of ['relaxed','challenge']){const t=takeawayTask(kind,difficulty,seeded(9),1,{grade:5});assert.equal(new Set(t.pairs.map(p=>p.word)).size,4);assert.equal(new Set(t.pairs.map(p=>p.translation)).size,4);}
});
test('sorting cards have one explicit category in their own pack and both trays have answers',()=>{
 for(const p of [...SORTING_PACKS,...ADDITIONAL_SORTING_PACKS]){const seen=new Map();for(const c of p.cards){assert.ok([0,1].includes(c.category));const k=c.word.toLowerCase().trim();assert.ok(!seen.has(k)||seen.get(k)===c.category,p.unit+': '+c.word);seen.set(k,c.category);}for(const i of [0,1])assert.ok(p.cards.some(c=>c.category===i));}
 for(const g of bank)for(const u of g.units)for(const difficulty of ['relaxed','challenge'])assert.ok(sortingTask(u.id,difficulty,seeded(8),1).cards.every(c=>[0,1].includes(c.category)));
});
