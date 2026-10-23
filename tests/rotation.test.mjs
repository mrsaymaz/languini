import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BistroGame,TaskDeck,loadProfile,saveProfile,practiceKey} from '../src/core.mjs';
import {seeded,tick,solveActive} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),unit=bank[0].units[0],config={grade:5,unit:unit.id,team:'gryffindor',arena:'bistro',difficulty:'relaxed'};
test('interleaved stations cannot cause a repeated conversation at a cycle boundary',()=>{
  const deck=new TaskDeck(unit.tasks,seeded()),size=deck.groups.get('conversation').length;let last=null;
  for(let cycle=0;cycle<4;cycle++){const ids=new Set();for(let i=0;i<size;i++){deck.forSetting('delivery');const q=deck.forSetting('conversation');assert.ok(!ids.has(q.id));assert.notEqual(q.id,last);ids.add(q.id);last=q.id;deck.forSetting('recipe');}assert.equal(ids.size,size);}
});
test('question cycles continue after a save and a new service',()=>{
  const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},profile=loadProfile(storage),key=practiceKey(config),first=new TaskDeck(unit.tasks,seeded());const shown=new Set();for(let i=0;i<5;i++)shown.add(first.forSetting('conversation').id);profile.practice[key]=first.conversationState;assert.ok(saveProfile(storage,profile));
  const restored=loadProfile(storage),next=new TaskDeck(unit.tasks,seeded(777),{conversationHistory:restored.practice[key]}),count=next.groups.get('conversation').length;for(let i=shown.size;i<count;i++){const q=next.forSetting('conversation');assert.ok(!shown.has(q.id),'Fresh service must finish the unseen pool');shown.add(q.id);}assert.equal(shown.size,count);const last=next.conversationState.last;assert.notEqual(next.forSetting('conversation').id,last);
  assert.notEqual(practiceKey(config),practiceKey({...config,grade:6,unit:'g6u1'}));
});
test('waiting tables reserve no conversation until the student opens it',()=>{
  const game=new BistroGame(config,unit.tasks,{rng:seeded()});game.start();tick(game,10);assert.ok(game.tables.filter(t=>t.status==='waiting').length>=2);assert.equal(game.deck.conversationState.seen.length,0);assert.ok(game.tables.every(t=>!t.plan.find(s=>s.setting==='conversation')?.task));game.openOrder(0);assert.equal(game.active.task.kind,'question');assert.equal(game.deck.conversationState.seen.length,1);
});
test('duplicate question spellings are one conversation and stale history is ignored',()=>{
  const q=unit.tasks.find(t=>t.kind==='question'),deck=new TaskDeck([q,{...q,id:'same-question-copy',prompt:q.prompt.toUpperCase()}],seeded(),{conversationHistory:{seen:['removed'],last:'removed'}});assert.equal(deck.groups.get('conversation').length,1);assert.deepEqual(deck.conversationState.seen,[]);assert.equal(deck.forSetting('conversation').id,q.id);
});
