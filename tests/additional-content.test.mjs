import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {expandedContent} from '../scripts/import-additional-banks.mjs';
import {mergeAdditionalBanks,normalize,PARENT_UNITS,questionType} from '../scripts/additional-bank-import.mjs';
import {verifyPreservation} from '../scripts/verify-preservation.mjs';
import {TaskDeck,BistroGame} from '../src/core.mjs';
import {sortingTask,sortingPack,ADDITIONAL_SORTING_PACKS} from '../src/delivery-sorting.mjs';
import {matchingVocabulary} from '../src/tablet-matching.mjs';
import {seeded,solveActive} from './helpers.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const base=await read('../content/baseline-v0.36.0/language.json'),bank=await read('../public/data/language.json'),report=await read('../public/data/additional-bank-import.json'),sources=await Promise.all([5,6,7,8].map(g=>read(`../content/additional-banks/grade${g}-2.json`))),translations=await read('../content/additional-banks/picture-translations.json');
const all=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)),added=all.filter(t=>t.additionalSource),findUnit=id=>bank.flatMap(g=>g.units).find(u=>u.id===id);
test('the expansion reproduces exactly, preserves every original object, and never mutates inputs',async()=>{
 const before=JSON.stringify([base,sources,translations]);const first=mergeAdditionalBanks(base,sources,translations),second=mergeAdditionalBanks(base,sources,translations);assert.deepEqual(first,second);assert.equal(JSON.stringify([base,sources,translations]),before);assert.deepEqual((await expandedContent()).bank,bank);
 const result=await verifyPreservation();assert.equal(result.preservedTasks,3033);assert.equal(result.tasks,4805);assert.equal(result.conversations,921);
});
test('all 44 source sections and every practice record resolve to an existing same-grade activity',()=>{
 assert.equal(report.mappings.length,44);assert.equal(report.records.length,2288);assert.equal(report.counts.added,1772);assert.equal(report.counts.duplicates,516);
 for(const g of sources)for(const raw of g.units){const target=findUnit(PARENT_UNITS[raw.id]||raw.id);assert.ok(target);assert.ok(target.id.startsWith('g'+g.grade+'u'));
  for(const key of ['translations','pictures','descriptions','questions','sentences','completions'])for(const record of raw[key]){const link=report.records.find(r=>r.grade===g.grade&&r.unit===raw.id&&r.record===record.id);assert.ok(link,record.id);assert.ok(target.tasks.find(t=>t.id===link.task),record.id);}
 }
 for(const [source,parent]of Object.entries(PARENT_UNITS)){const mapping=report.mappings.find(m=>m.sourceUnit===source);assert.equal(mapping.targetUnit,parent);}
 assert.ok(findUnit('g5u10').tasks.every(t=>!t.additionalSource));assert.ok(findUnit('g6u9').tasks.every(t=>!t.additionalSource));assert.ok(findUnit('g8u11').tasks.every(t=>!t.additionalSource));assert.ok(findUnit('g8u12').tasks.every(t=>!t.additionalSource));
});
test('new assembly preserves full source sentences and translations with grammatical boundaries',()=>{
 for(const t of added.filter(t=>t.kind==='sentence')){assert.ok(t.blocks.length>=3&&t.blocks.length<=5,t.id);assert.equal(t.blocks.join(' '),t.answer);assert.ok(t.blocks.every(b=>b.trim()));const raw=sources.find(g=>g.grade===t.additionalSource.grade).units.find(u=>u.id===t.additionalSource.unit);const record=[...raw.sentences,...raw.completions].find(r=>r.id===t.additionalSource.record);
  if(record.blocks){assert.equal(t.answer,record.blocks.join(' '));assert.equal(t.translation,record.tr);}else{assert.equal(normalize(t.answer),normalize(record.start+' '+record.end));assert.equal(t.adaptedFrom,'completion');}
 }
 assert.ok(!added.some(t=>t.kind==='completion'||t.kind==='repair'),'No ambiguous supplied endings enter single-answer grammar tasks');
});
test('new questions have distinct same-section distractors with incompatible answer functions',()=>{
 for(const t of added.filter(t=>t.kind==='question')){const u=sources.find(g=>g.grade===t.additionalSource.grade).units.find(u=>u.id===t.additionalSource.unit);assert.ok(u.questions.some(q=>q.q===t.prompt));assert.equal(t.readback,t.answer);assert.ok(t.answer.split(' ').length>=3);assert.ok(t.options.length>=3);assert.equal(new Set(t.options).size,t.options.length);assert.ok(!t.replyOptionTypes.includes(questionType(t.prompt)),t.id);}
 for(const u of bank.flatMap(g=>g.units)){const q=u.tasks.filter(t=>t.kind==='question').map(t=>normalize(t.prompt));assert.equal(q.length,new Set(q).size,u.id);}
});
test('all picture words join vocabulary; ambiguous duplicate meanings are safely filtered from matching',()=>{
 assert.ok(!all.find(t=>t.id==='g8u4-extra-g8u4-g8u4p2').options.includes('phone'),'Telephone must not have the synonym phone as a wrong answer');assert.equal(report.counts.pictures,396);assert.equal(report.counts.pictureVocabulary,174);
 for(const g of sources)for(const u of g.units){const unit=findUnit(PARENT_UNITS[u.id]||u.id),pool=matchingVocabulary(unit.tasks);for(const p of u.pictures){const task=unit.tasks.find(t=>t.kind==='vocabulary'&&normalize(t.answer)===normalize(p.word));assert.ok(task,p.id);assert.ok(pool.some(pair=>normalize(pair.word)===normalize(p.word)||normalize(pair.translation)===normalize(task.translation||task.prompt)),p.id);}assert.ok(unit.pictureReferences.length>=u.pictures.length);}
});
test('new sorting packs use exclusive positive classifications and rotate without changing parent unit',()=>{
 assert.equal(ADDITIONAL_SORTING_PACKS.length,44);assert.equal(report.categoryExclusions.length,4);
 for(const p of ADDITIONAL_SORTING_PACKS){const labels=new Set();for(const c of p.cards){assert.ok(!labels.has(normalize(c.word)));labels.add(normalize(c.word));}for(const category of [0,1])assert.ok(p.cards.filter(c=>c.category===category).length>=5);}
 for(const unit of bank.flatMap(g=>g.units)){const variants=ADDITIONAL_SORTING_PACKS.filter(p=>p.unit===unit.id);for(let i=0;i<variants.length;i++){const serial=4+i*3;assert.equal(sortingPack(unit.id,serial),variants[i]);const t=sortingTask(unit.id,'challenge',seeded(),serial,null,2);assert.equal(t.cards.length,10);assert.deepEqual(t.categories,variants[i].categories);}}
});
test('every added activity is available to its station deck and can complete through actual game actions',()=>{
 const settings={question:'conversation',vocabulary:'delivery',description:'delivery',sentence:'recipe'};
 for(const t of added){const g=new BistroGame({grade:t.additionalSource.grade,unit:t.additionalSource.parent,team:'gryffindor',arena:'courtyard',difficulty:'challenge'},[t],{rng:seeded(),demoSetting:settings[t.kind]});g.start();if(settings[t.kind]==='delivery'){g.stock=1;g.deliverySerial=1;g.openDelivery();}else g.openOrder(0);assert.equal(g.active.task.id,t.id);solveActive(g);assert.ok(g.total>=1,t.id);}
 for(const u of bank.flatMap(g=>g.units)){const deck=new TaskDeck(u.tasks,seeded());for(const t of u.tasks.filter(t=>t.additionalSource))assert.ok(deck.groups.get(settings[t.kind]).some(x=>x.id===t.id),t.id);}
});
