import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {BistroGame,orderPlan} from '../src/core.mjs';
import {venueLearning} from '../src/venue-learning.mjs';
import {seeded,tick,solveActive} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units[0];
const config=(u=unit,arena='courtyard',difficulty='relaxed')=>({grade:+u.id[1],unit:u.id,arena,difficulty,team:'gryffindor'});

test('every unit supports 3/6/9 washing plates, using reviewed sentences and one physical batch commit',()=>{
 let cases=0;
 for(const grade of bank)for(const u of grade.units)for(const difficulty of ['relaxed','challenge'])for(const arena of ['courtyard','bistro','banquet']){
  const g=new BistroGame(config(u,arena,difficulty),u.tasks,{rng:seeded(),liveKitchen:true});g.start();const k=g.kitchen;k.dirty=k.capacity;k.clean=0;assert.ok(g.openWashing());
  const count=venueLearning(arena).washPlates,answers=[],available=new Set(u.tasks.filter(t=>t.kind==='sentence').map(t=>t.answer)),before=JSON.stringify({tables:g.tables,stock:g.stock,jobs:g.jobs});
  for(let plate=0;plate<count;plate++){
   const a=g.active;assert.equal(a.activityRound,plate);assert.equal(a.activityRounds,count);assert.equal(a.prepPhase,undefined);assert.ok(a.task.blocks.length>=3&&a.task.blocks.length<=5);assert.ok(u.tasks.some(t=>t.id===a.task.sourceId));
   if(plate)assert.notEqual(a.task.answer,answers.at(-1));if(plate<available.size)assert.ok(!answers.includes(a.task.answer));answers.push(a.task.answer);
   tick(g,1);assert.equal(JSON.stringify({tables:g.tables,stock:g.stock,jobs:g.jobs}),before);g.paused=true;assert.equal(g.addIngredient(0).accepted,false);g.paused=false;
   solveActive(g,{advance:false});assert.equal(k.busy,null);assert.equal(k.clean,0);assert.equal(a.reward,0);const result=g.completeTask();assert.ok(plate<count-1?result.nextActivityRound:result.washing);
  }
  assert.equal(g.completed,count);assert.equal(g.runes,0);assert.equal(g.active,null);assert.equal(k.busy.count,k.capacity);assert.equal(g.history.filter(h=>h.purpose==='washing').length,1);tick(g,2);assert.equal(k.clean,k.capacity);assert.equal(k.dirty,0);assert.equal(k.washed,k.capacity);assert.equal(g.completeTask(),false);cases++;
 }
 assert.equal(cases,264);
});

test('venue routes and assessed steps rise while keeping three preparation phases',()=>{
 let previous=0;
 for(const arena of ['courtyard','bistro','banquet']){
  let work=0;
  for(let i=0;i<20;i++){
   const plan=orderPlan(arena,i);assert.ok(plan.length<=6);assert.ok(plan.some(s=>s.setting==='recipe'));
   if(arena!=='courtyard')for(const setting of ['tablet','ticket','recipe','repair'])assert.ok(plan.some(s=>s.setting===setting));
   if(arena==='banquet')for(const phase of ['order','serve'])assert.ok(plan.some(s=>s.setting==='conversation'&&s.phase===phase));
   const p=venueLearning(arena);work+=plan.reduce((n,s)=>n+(s.setting==='recipe'?3:s.setting==='tablet'?p.menuRounds:s.setting==='ticket'?p.ticketRounds:s.setting==='repair'?p.checkoutRounds:1),0);
  }
  assert.ok(work>previous);previous=work;
 }
});

test('Bistro menu, ticket and checkout require two separate assessments without advancing or rewarding the first',()=>{
 for(const setting of ['tablet','ticket','repair']){
  const g=new BistroGame(config(unit,'banquet'),unit.tasks,{rng:seeded(),demoSetting:setting,demoMenuMode:'translation'});g.start();g.openOrder(0);const t=g.tables[0],stock=g.stock,first=g.active;
  assert.equal(first.activityRounds,2);if(setting==='tablet')assert.equal(first.task.pairs.length,4);solveActive(g,{advance:false});assert.equal(first.reward,0);assert.equal(t.reward,0);assert.ok(g.completeTask().nextActivityRound);assert.equal(t.step,0);assert.equal(g.stock,stock);assert.notEqual(g.active.task.id,first.task.id);
  solveActive(g);assert.equal(t.step,1);assert.equal(g.completed,2);assert.equal(g.stock,stock);assert.ok(t.reward>0);assert.equal(g.history.filter(h=>h.purpose==='order').length,1);
 }
});

test('delivery needs 1/2/3 labels and pays/restocks only after the final correct parcel',()=>{
 for(const [arena,count]of [['courtyard',1],['bistro',2],['banquet',3]]){
  const g=new BistroGame(config(unit,arena),unit.tasks,{rng:seeded(),demoSetting:'delivery'});g.start();g.stock=1;g.deliverySerial=1;assert.ok(g.openDelivery());assert.equal(g.active.activityRounds,count);
  for(let i=0;i<count;i++){const a=g.active;solveActive(g,{advance:false});assert.equal(g.stock,1);assert.equal(g.runes,0);if(i<count-1)assert.equal(a.reward,0);g.completeTask();}
  assert.equal(g.stock,g.maxStock);assert.equal(g.deliveries,1);assert.equal(g.runes,5);assert.equal(g.history.filter(h=>h.purpose==='delivery').length,1);assert.equal(g.openDelivery(),false);
 }
});
