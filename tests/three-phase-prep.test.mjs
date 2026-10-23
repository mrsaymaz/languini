import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame,RECIPES} from '../src/core.mjs';
import {PREP_PHASE_COUNT} from '../src/menu.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {createFinishedDish} from '../src/food.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {seeded,tick} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)));
function game(unit,grade=5,difficulty='relaxed'){const g=new BistroGame({grade,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty},unit.tasks,{rng:seeded(),demoSetting:'recipe'});g.start();g.openOrder(0);return g;}
function solve(g){for(let i=0;i<g.active.task.blocks.length;i++)assert.ok(g.addIngredient(i).correct);}
function signature(root){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),out=[];root.traverse(o=>{if(o.isMesh)out.push([o.geometry.uuid,o.material.uuid,new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld).elements.map(n=>+n.toFixed(5)||0)]);});return out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));}

test('all 44 units in both difficulties require three distinct reviewed sentences before one preparation handoff',()=>{
 assert.equal(PREP_PHASE_COUNT,3);
 for(const grade of bank)for(const unit of grade.units)for(const difficulty of ['relaxed','challenge']){
  const g=game(unit,grade.grade,difficulty),t=g.tables[0],stock=g.stock,answers=[];
  for(let phase=0;phase<3;phase++){
   const a=g.active;assert.equal(a.prepPhase,phase);assert.ok(unit.tasks.includes(a.task));assert.ok(a.task.blocks.length>=3&&a.task.blocks.length<=5);assert.ok(!answers.includes(a.task.answer));answers.push(a.task.answer);assert.equal((a.prepHistory||[]).length,phase);assert.equal(t.step,0);assert.equal(g.jobs.length,0);assert.equal(t.status,'waiting');assert.equal(g.stock,stock);assert.equal(g.serve(0),false);assert.equal(g.completeTask(),false);solve(g);
   g.paused=true;assert.equal(g.completeTask(),false);g.paused=false;
   if(phase<2){assert.equal(t.reward,0);assert.deepEqual(g.completeTask(),{nextPrepPhase:true});assert.ok(g.active.prepPrevious===a.task);}
   else {assert.ok(t.reward>0);assert.ok(g.completeTask());}
  }
  assert.equal(g.active,null);assert.equal(t.step,1);assert.equal(t.status,'cooking');assert.equal(g.completed,3);assert.equal(g.total,3);assert.equal(g.firstCorrect,3);assert.equal(g.history.filter(h=>h.setting==='recipe').length,1);const reward=t.reward;assert.equal(g.completeTask(),false);assert.equal(t.reward,reward);
 }
});

test('adaptive repetition cannot repeat either earlier sentence in the third phase',()=>{
 const g=game(bank[0].units[0]),first=g.active.task;solve(g);g.completeTask();const second=g.active.task;g.deck.forSetting=()=>first;solve(g);g.completeTask();assert.equal(g.active.prepPhase,2);assert.notEqual(g.active.task.answer,first.answer);assert.notEqual(g.active.task.answer,second.answer);
});

test('third-phase errors, duplicates and pause retain all prior progress and protect service time',()=>{
 const g=game(bank[0].units[0]);for(let p=0;p<2;p++){solve(g);g.completeTask();}const a=g.active,history=[...a.prepHistory];assert.equal(g.addIngredient(2).correct,false);assert.deepEqual(a.ingredients,[]);assert.deepEqual(a.prepHistory,history);assert.equal(g.addIngredient(0).correct,true);assert.equal(g.addIngredient(0).accepted,false);g.paused=true;assert.equal(g.addIngredient(1).accepted,false);assert.equal(g.completeTask(),false);g.paused=false;const frozen=JSON.stringify(g.tables);tick(g,300);assert.equal(JSON.stringify(g.tables),frozen);assert.ok(g.active===a);assert.equal(g.addIngredient(1).correct,true);assert.equal(g.addIngredient(2).completed,true);assert.ok(g.completeTask());assert.equal(g.completed,3);assert.equal(g.review.length,1);assert.ok(g.review[0]===a.task);
});

test('Cafe washing requires three sentence plates without food preparation phases',()=>{
 const unit=bank[0].units[0],g=new BistroGame({grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'},unit.tasks,{liveKitchen:true,rng:seeded()});g.start();g.kitchen.dirty=2;g.kitchen.clean-=2;assert.ok(g.openWashing());assert.equal(g.active.prepPhase,undefined);assert.equal(g.active.activityRounds,3);
 for(let i=0;i<3;i++){assert.equal(g.active.activityRound,i);solve(g);const result=g.completeTask();assert.deepEqual(result,i<2?{nextActivityRound:true}:{washing:true});if(i<2)assert.equal(g.kitchen.busy,null);}
 assert.equal(g.active,null);assert.equal(g.completed,3);assert.equal(g.kitchen.busy.count,2);
});

test('all nine meals retain three then six ingredients through every placement and match the final served meal',()=>{
 const world=createRestaurant(),task=bank[0].units[0].tasks.find(t=>t.kind==='sentence');
 for(let recipe=0;recipe<9;recipe++)for(const [width,height]of [[320,480],[393,740],[844,390]]){
  let before=[];
  for(let prepPhase=0;prepPhase<3;prepPhase++){
   const s=new StationScene(world,{setting:'recipe',task,recipe,prepPhase,order:[2,0,1],foodAssignment:[2,0,1],viewport:{width,height}}),base=s.contents.children.find(g=>g.userData.prepBase);assert.equal(base.children.length,prepPhase*3);assert.deepEqual(signature(s.contents),before);assert.deepEqual(s.foodAssignment,[2,0,1].map(x=>x+prepPhase*3));const kept=signature(base);
   for(let i=0;i<3;i++){s.addIngredient(i);s.update(.5);s.update(.2);assert.ok(base.parent===s.contents);assert.deepEqual(signature(base),kept);assert.equal(s.plated[i].position.y,RECIPES[recipe].heights[s.foodAssignment[i]]);}
   before=signature(s.contents);assert.equal(s.autoFinished,true);
   if(prepPhase===2){const meal=createFinishedDish(world.palette,recipe);meal.children[0].removeFromParent();for(const layer of meal.children)layer.position.y-=s.dish.container==='plate'?.065:0;assert.deepEqual(before,signature(meal));}
   s.dispose();
  }
 }
});

test('all three phases show distinct guidance with nine components and preserved native targets',()=>{
 const task=bank[0].units[0].tasks.find(t=>t.kind==='sentence');for(const recipe of RECIPES){assert.equal(recipe.layers.length,9);assert.equal(new Set(recipe.layers).size,9);assert.equal(new Set(recipe.stages).size,3);for(const prepPhase of [0,1,2]){const html=taskMarkup(task,{recipe,prepPhase});assert.ok(html.includes(`Plating ${prepPhase+1} / 3`));assert.ok(html.includes('Service paused'));assert.ok(html.includes('id="word-bank"'));}}
});
