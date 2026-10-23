import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BistroGame,choicesFor,TaskDeck,RECIPES} from '../src/core.mjs';
import {settingForTask,repairParts,readbackFor,hintForTask,TASK_SETTINGS} from '../src/tasks.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8'));
const tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)),repair=tasks.find(t=>t.kind==='repair');
const config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
test('every repair preserves a reviewed correct sentence and one exact error location',()=>{
  let count=0;for(const t of tasks.filter(t=>t.kind==='repair')){count++;const {parts,errorIndex}=repairParts(t);assert.equal(parts[errorIndex],t.broken);assert.notEqual(t.broken,t.answer);assert.ok(t.options.includes(t.broken));assert.ok(t.options.includes(t.answer));const correct=t.prompt.replace('___',t.answer);assert.equal(readbackFor(t),correct);const source=tasks.find(x=>x.id===t.sourceId);assert.ok(source&&source.kind==='completion');assert.equal(source.prompt,t.prompt);assert.equal(source.answer,t.answer);assert.ok(!correct.includes('___'));assert.ok(hintForTask(t).includes(t.broken));}assert.equal(count,259);
});
test('repair requires locating the error before a correction can be submitted',()=>{
  const g=new BistroGame(config,[repair],{demoSetting:'repair'});g.start();g.openOrder(0);assert.equal(g.answer(repair.answer).accepted,false);assert.equal(g.total,0);const index=repairParts(repair).errorIndex;
  assert.equal(g.locateRepair(index===0?1:0).correct,false);assert.equal(g.total,1);assert.equal(g.active.repairFound,undefined);assert.equal(g.locateRepair(index).correct,true);assert.equal(g.active.repairFound,true);assert.equal(g.answer(repair.answer).accepted,false);assert.ok(g.eraseRepair());assert.equal(g.answer(repair.answer).correct,true);assert.equal(g.total,1);assert.equal(g.firstCorrect,0);assert.equal(g.review.length,1);assert.equal(g.completeTask(),false);assert.ok(g.printReceipt());assert.ok(g.completeTask());
});
test('finding, erasing and fixing a ticket first time earns unaided accuracy',()=>{const g=new BistroGame(config,[repair],{demoSetting:'repair'});g.start();g.openOrder(0);g.locateRepair(repairParts(repair).errorIndex);g.eraseRepair();assert.equal(g.answer(repair.answer).first,true);assert.equal(g.firstCorrect,1);assert.equal(g.total,1);assert.equal(g.review.length,0);});
test('all guest replies are full reviewed sentences and correct options preserve readback',()=>{let count=0;for(const t of tasks.filter(t=>t.kind==='question')){count++;assert.equal(t.answer,t.readback,t.id);assert.ok(t.options.includes(t.readback));assert.ok(t.options.every(x=>/[.?!]$/.test(x)),t.id);assert.ok(t.answer.split(' ').length>=3,t.id);}assert.equal(count,921);});
test('every task renders the matching interaction and every repair hides fixes until discovery',()=>{
  const markers={conversation:'guest-chat',delivery:'delivery-labels',recipe:'recipe-rail',ticket:'ticket-paper',repair:'repair-sentence'};
  for(const t of tasks){const setting=settingForTask(t),html=taskMarkup(t,{tableId:0,recipe:RECIPES[0],options:t.kind==='sentence'?[]:choicesFor(t,'relaxed')});assert.ok(html.includes(markers[setting]),t.id);assert.ok(html.includes(TASK_SETTINGS[setting].name));if(t.kind==='repair'){assert.ok(html.includes('id="repair-options" hidden'));assert.ok(html.includes('data-part='));}if(t.kind==='question')assert.ok(html.includes('reply-bubble'));if(t.kind==='completion')assert.ok(html.includes('id="ticket-gap"'));}
});
test('phone preview embeds the actual local game and exposes six stations and full service',async()=>{
  const html=await readFile(new URL('../public/phone-preview.html',import.meta.url),'utf8'),script=await readFile(new URL('../public/phone-preview.js',import.meta.url),'utf8');assert.ok(html.includes('width="393" height="740"'));assert.ok(html.includes('src="./index.html?preview=phone'));for(const setting of [...Object.keys(TASK_SETTINGS),'service'])assert.ok(html.includes(`data-setting="${setting}"`));assert.ok(script.includes('e.origin===location.origin'));assert.ok(script.includes('e.source===frame.contentWindow'));assert.ok(!html.includes('https://'),'No screenshot or remote mockup substituted for the game');
});
