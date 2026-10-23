import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applySentenceBlocks} from '../scripts/sentence-blocks.mjs';
import {BistroGame,RECIPES} from '../src/core.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {prepBoardLayout} from '../src/prep-layout.mjs';
import {washingPageLayout,paperLabelLayout,recipeNoteLayout} from '../src/page-fit.mjs';
import {stationViewport} from '../src/object-layout.mjs';
import {seeded,solveActive,tick} from './helpers.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url))),review=read('../content/sentence-blocks.json'),bank=read('../public/data/language.json');
const tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='sentence');
const taskFor=(blocks,id='grammar-fixture')=>({id,kind:'sentence',blocks,answer:blocks.join(' '),prompt:'Öğretmenim bize her gün ödev verir.',translation:'Öğretmenim bize her gün ödev verir.'});
const five=taskFor(['My teacher','gives','us','homework','every day.']),six=taskFor(['My teacher','gives','us','homework','at school','every day.'],'grammar-six');
const config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
test('the three teacher examples use complete subjects, predicates, recipients and time phrases',()=>{
 assert.deepEqual(review.examples.map(e=>e.blocks),[['Our teacher','is','helpful.'],['The pupils','are','very naughty.'],five.blocks]);
 const expectations={'The coach is very helpful.':['The coach','is','very helpful.'],'Our teacher gives us a worksheet.':['Our teacher','gives','us','a worksheet.'],'My younger cousin practises the guitar every day.':['My younger cousin','practises','the guitar','every day.'],'The vet gives the dog some water.':['The vet','gives','the dog','some water.'],'The pupils must not enter the empty lab.':['The pupils','must not enter','the empty lab.'],'We are going to visit an island.':['We','are going to visit','an island.'],'These clean towels are ready to fold.':['These clean towels','are','ready to fold.'],'This diary contains my daily plans.':['This diary','contains','my daily plans.']};
 for(const [s,blocks]of Object.entries(expectations))assert.deepEqual(review.sentences[s].blocks,blocks,s);
});
test('all 1520 activities preserve exact sentence text and have explicit reviewed constituent boundaries',()=>{
 assert.equal(tasks.length,1520);assert.ok(tasks.some(t=>t.blocks.length===4));assert.ok(tasks.some(t=>t.blocks.length===5));
 for(const t of tasks){assert.equal(t.blocks.join(' '),t.answer,t.id);assert.deepEqual(t.blocks,review.sentences[t.answer].blocks);assert.equal(t.blockRoles.length,t.blocks.length);assert.ok(!t.blocks.some((b,i)=>/^(the|a|an|our|my|his|her|their)$/i.test(b)&&t.blockRoles[i]!=='Indirect object'),t.id);for(const b of t.blocks)assert.ok(!/^(every|each|next|last)$/i.test(b),t.id);}
 const unknown=[{grade:5,units:[{tasks:[taskFor(['We','invent','unreviewed text.'])]}]}];assert.throws(()=>applySentenceBlocks(unknown,review),/Review grammatical blocks/);
});
test('five and six blocks are required in every food phase; the third block cannot finish the sentence',()=>{
 for(const task of [five,six]){const g=new BistroGame(config,[task],{rng:seeded(),demoSetting:'recipe'});g.start();g.openOrder(0);const table=g.tables[0];
  for(let phase=0;phase<3;phase++){assert.equal(g.active.prepPhase,phase);for(let i=0;i<task.blocks.length;i++){const r=g.addIngredient(i);assert.equal(r.correct,true);if(i<task.blocks.length-1){assert.equal(g.active.completed,false);assert.equal(g.answer(task.answer).accepted,false);assert.equal(g.jobs.length,0);}}assert.equal(g.total,phase+1);const done=g.completeTask();assert.ok(phase<2?done.nextPrepPhase:done);}
  assert.equal(g.completed,3);assert.equal(g.active,null);assert.equal(table.step,1);assert.equal(g.jobs.length,1);assert.equal(g.completeTask(),false);
 }
});
test('washing keeps its three plate routine while each plate requires all five grammatical links',()=>{
 const g=new BistroGame(config,[five],{rng:seeded(),liveKitchen:true});g.start();const k=g.kitchen;k.clean=0;k.dirty=k.capacity;g.openWashing();
 for(let plate=0;plate<3;plate++){assert.equal(g.active.activityRound,plate);for(let i=0;i<3;i++)g.addIngredient(i);assert.equal(g.active.completed,false);assert.equal(k.busy,null);for(let i=3;i<5;i++)g.addIngredient(i);assert.equal(g.active.completed,true);g.completeTask();}
 assert.equal(g.runes,0);assert.equal(g.total,3);assert.equal(k.busy.count,k.capacity);tick(g,2);assert.equal(k.dirty,0);assert.equal(k.clean,k.capacity);
});
test('extra block portions finish each of the nine dishes with three canonical layers per phase',()=>{
 const world=createRestaurant();
 for(const task of [five,six])for(let recipe=0;recipe<RECIPES.length;recipe++)for(let phase=0;phase<3;phase++){
  const scene=new StationScene(world,{setting:'recipe',task,recipe,prepPhase:phase,order:task.blocks.map((_,i)=>i).reverse(),viewport:{width:390,height:844}}),base=scene.contents.children.find(c=>c.userData.prepBase);
  assert.equal(scene.trays.length,task.blocks.length);assert.equal(scene.foodAssignment.length,task.blocks.length);
  for(let i=0;i<task.blocks.length;i++){scene.addIngredient(i);scene.update(.5);scene.update(.2);if(i===2)assert.ok(!scene.autoFinished);}
  assert.equal(scene.autoFinished,true);assert.ok(base.parent===scene.contents);assert.equal(scene.plated.filter(p=>p.parent===scene.contents).length,3);assert.equal(new Set(scene.trays.map(t=>t.piece)).size,3);scene.dispose();
 }
});
test('five and six block fixtures fit readable separated phone targets in both orientations',()=>{
 const fonts=read('./fixtures/mobile-font-metrics.json');
 for(const font of fonts){const measure=(t,n)=>[...t].reduce((sum,c)=>sum+(font.advances[c]??.7)*n,0);const label=paperLabelLayout('homework',100,54,measure);assert.ok(label.fits);assert.deepEqual(label.lines,['homework']);}
 for(const font of fonts){const measure=(t,n)=>[...t].reduce((sum,c)=>sum+(font.advances[c]??.7)*n,0);for(const [w,h]of [[320,480],[360,640],[390,844],[568,320],[667,375],[844,390]])for(const task of [five,six]){
  const r=stationViewport(w,h,'recipe'),p=prepBoardLayout(r.width,r.height,task,{measure});assert.equal(p.sources.length,task.blocks.length);
  for(const [i,s]of p.sources.entries()){assert.ok(s.label.width>=44&&s.label.height>=44,`${w} ${h} ${i}`);assert.ok(paperLabelLayout(task.blocks[i],s.label.width,s.label.height,measure).fits,`${w} ${h} ${task.blocks[i]}`);}
  const v=stationViewport(w,h,'wash'),wash=washingPageLayout({width:v.width-2,height:v.height-2,blocks:task.blocks,order:task.blocks.map((_,i)=>i).reverse(),measure});assert.ok(wash.fits,`${w} ${h} wash`);assert.equal(wash.rects.length,task.blocks.length);
  for(let i=0;i<wash.rects.length;i++)for(let j=i+1;j<wash.rects.length;j++){const a=wash.rects[i],b=wash.rects[j],dx=Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width),dy=Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height);assert.ok(Math.hypot(dx,dy)>=13.99);}
 }}
});

// Adding grammatical pieces must use the rack, not redesign the station.
test('four to six blocks retain the board and desktop plate while phone layouts prioritise the dish',()=>{
 for(const [w,h]of [[320,480],[360,640],[390,844],[568,320],[667,375],[844,390],[1366,768]])for(const task of [taskFor(five.blocks.slice(0,4)),five,six]){
  const r=stationViewport(w,h,'recipe'),original=prepBoardLayout(r.width,r.height,taskFor(task.blocks.slice(0,3))),extra=prepBoardLayout(r.width,r.height,task);
  if(extra.mode==='phone'){assert.ok(extra.vessel.width>=72);assert.ok(extra.vessel.x-extra.vessel.width/2>=0&&extra.vessel.x+extra.vessel.width/2<=r.width);assert.ok(extra.note.y>=extra.vessel.y+extra.vessel.height/2);}
  else{assert.deepEqual(extra.vessel,original.vessel,`${w}×${h}: preserve plate`);assert.deepEqual(extra.note,original.note,`${w}×${h}: preserve recipe note`);}
  assert.equal(extra.width,original.width);assert.equal(extra.height,original.height);assert.equal(extra.mode,original.mode);
  for(let i=0;i<extra.sources.length;i++){
   const a=extra.sources[i].paper;assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=r.width+.01&&a.y+a.height<=r.height+.01);
   for(const b of extra.sources.slice(i+1).map(s=>s.paper)){const dx=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),dy=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);assert.ok(dx<=0||dy<=0,'Ingredient papers stay separate');}
  }
 }
});
