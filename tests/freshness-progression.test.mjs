import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {BistroGame,loadProfile,saveProfile,saveResult} from '../src/core.mjs';import {arenaUnlocked,cafeCompleted,permittedArena} from '../src/arena-progression.mjs';import {ensureFreshness,freshnessState,freshnessBudget} from '../src/task-freshness.mjs';import {seeded,tick,solveActive} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units[0],config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
function make(setting='conversation',difficulty='relaxed'){const g=new BistroGame({...config,difficulty},unit.tasks,{rng:seeded(),demoSetting:setting});g.start();g.openOrder(0);return g;}

test('Cafe and Diner wins unlock restaurants sequentially and persist',()=>{
 const p=loadProfile({getItem:()=>null});assert.ok(arenaUnlocked(p,'courtyard'));assert.equal(arenaUnlocked(p,'bistro'),false);assert.equal(arenaUnlocked(p,'banquet'),false);assert.equal(permittedArena(p,'banquet'),'courtyard');assert.equal(arenaUnlocked(p,'unknown'),false);
 saveResult(p,config,{won:false,stars:3,served:5,accuracy:100});assert.equal(cafeCompleted(p),false);saveResult(p,{...config,arena:'banquet'},{won:true,stars:3,served:10,accuracy:100});assert.equal(cafeCompleted(p),false);
 p.records['5:g6u1:gryffindor:relaxed:courtyard']={wins:2};assert.equal(cafeCompleted(p),false);saveResult(p,config,{won:true,stars:1,served:6,accuracy:65});assert.ok(arenaUnlocked(p,'bistro'));assert.equal(arenaUnlocked(p,'banquet'),false);saveResult(p,{...config,arena:'bistro'},{won:true,stars:1,served:8,accuracy:65});assert.ok(arenaUnlocked(p,'banquet'));
 let saved;saveProfile({setItem:(k,v)=>saved=v},p);const restored=loadProfile({getItem:()=>saved});assert.ok(cafeCompleted(restored));assert.equal(permittedArena(restored,'banquet'),'banquet');assert.equal(restored.version,1);
});

test('freshness counts down only the task, changes great/good/late, and never skips an expired English answer',()=>{
 const g=make('recipe'),a=g.active,c=ensureFreshness(a),tables=JSON.stringify(g.tables);assert.equal(freshnessState(c).grade,'great');tick(g,c.duration*.52);assert.equal(freshnessState(c).grade,'good');tick(g,c.duration*.28);assert.equal(freshnessState(c).grade,'late');tick(g,100);assert.equal(c.remaining,0);assert.ok(g.active===a);assert.equal(a.completed,false);assert.equal(JSON.stringify(g.tables),tables);assert.equal(g.elapsed,0);assert.equal(g.jobs.length,0);assert.equal(g.addIngredient(0).correct,true);assert.equal(g.addIngredient(1).correct,true);for(let i=2;i<a.task.blocks.length;i++)assert.equal(g.addIngredient(i).completed,i===a.task.blocks.length-1);assert.equal(a.freshnessResult.grade,'late');assert.ok(g.completeTask());assert.equal(g.active.prepPhase,1);assert.equal(ensureFreshness(g.active).remaining,ensureFreshness(g.active).duration);
});

test('pause, camera/audio readiness and completed readback freeze task clocks, including all three plating phases',()=>{
 const g=make('recipe');for(let phase=0;phase<3;phase++){const a=g.active,c=ensureFreshness(a);assert.equal(a.prepPhase,phase);g.taskTimingActive=a;g.taskTimingReady=false;tick(g,10);assert.equal(c.remaining,c.duration);g.taskTimingReady=true;g.paused=true;tick(g,10);assert.equal(c.remaining,c.duration);g.paused=false;g.tick(.2);assert.ok(c.remaining<c.duration);solveActive(g,{advance:false});const left=c.remaining;tick(g,100);assert.equal(c.remaining,left);assert.ok(g.completeTask());}assert.equal(g.active,null);assert.equal(g.tables[0].step,1);assert.equal(g.completed,3);
});

test('freshness adds a bounded tip only at handoff and cannot pay twice or affect language accuracy',()=>{
 for(const difficulty of ['relaxed','challenge'])for(const [ratio,tip]of [[.9,2],[.4,1],[0,0]]){const g=make('conversation',difficulty),a=g.active,c=ensureFreshness(a,difficulty);g.tick(.1);c.remaining=c.duration*ratio;solveActive(g);assert.equal(g.runes,0);assert.equal(g.firstCorrect,1);assert.equal(g.total,1);const expected=a.reward+tip*(difficulty==='challenge'?2:1);tick(g,5);assert.ok(g.serve(0));tick(g,1.2);assert.equal(g.runes,expected);assert.equal(g.freshnessTotals.tips,tip*(difficulty==='challenge'?2:1));const before=g.runes;tick(g,1);assert.equal(g.runes,before);}
});

test('all task types receive finite length-aware budgets and Challenge is faster',()=>{
 for(const grade of bank)for(const u of grade.units)for(const t of u.tasks){const relaxed=freshnessBudget(t),challenge=freshnessBudget(t,'challenge');assert.ok(Number.isFinite(relaxed)&&relaxed>=24&&relaxed<=60);assert.ok(challenge<relaxed&&challenge>=18);}
});
