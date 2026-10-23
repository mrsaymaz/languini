import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BistroGame,orderPlan} from '../src/core.mjs';
import {listeningTask} from '../src/tasks.mjs';
import {CUSTOMER_PROFILES} from '../src/customer-profiles.mjs';
import {terminalWordLayout} from '../src/terminal-layout.mjs';
import {repairParts} from '../src/tasks.mjs';
import {seeded,solveActive,tick} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8'));
const tasks=bank[0].units[0].tasks;
const config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};

test('venue order formats add required checks and gate every final stage',()=>{
  const seen=new Set();for(const difficulty of ['relaxed','challenge'])for(let i=0;i<20;i++)for(const arena of ['courtyard','bistro','banquet']){
    const plan=orderPlan(arena,i,difficulty);assert.ok(plan.length>=({courtyard:2,bistro:4,banquet:6}[arena])&&plan.length<=6);assert.ok(plan.some(s=>s.setting==='recipe'));assert.ok(plan.every(s=>s.setting!=='delivery'));seen.add(plan.map(s=>s.setting).join(','));
  }
  assert.ok(seen.size>=5);
  const g=new BistroGame({...config,arena:'bistro'},tasks,{rng:seeded()});g.start();g.openOrder(0);while(g.active)solveActive(g);
  assert.equal(g.tables[0].status,'cooking');assert.equal(g.tables[0].step,g.tables[0].plan.findIndex(s=>s.phase==='serve'));tick(g,g.tables[0].cookTotal+.1);
  assert.equal(g.serve(0),false,'The serving question cannot be bypassed');assert.ok(g.openOrder(0));assert.equal(g.active.phase,'serve');
  solveActive(g);while(g.tables[0].step<g.tables[0].plan.length){assert.ok(g.openOrder(0));solveActive(g);}assert.equal(g.served,0,'Finishing checks leaves delivery as a player action');assert.equal(g.tables[0].step,g.tables[0].plan.length);assert.ok(g.chooseDish(0));assert.ok(g.deliver(0));assert.equal(g.serve(0),false);
});

test('stock is reserved once per order and deliveries cannot be farmed at full stock',()=>{
  const g=new BistroGame({...config,arena:'bistro'},tasks,{rng:seeded()});g.start();assert.equal(g.openDelivery(),false);
  g.openOrder(0);assert.equal(g.stock,2);while(g.active)solveActive(g);assert.equal(g.stock,2);
  tick(g,g.tables[0].cookTotal+.1);g.openOrder(0);assert.equal(g.stock,2);solveActive(g);while(g.tables[0].step<g.tables[0].plan.length){assert.ok(g.openOrder(0));solveActive(g);}assert.equal(g.stock,2);assert.ok(g.chooseDish(0));assert.ok(g.deliver(0));
  assert.ok(g.openOrder(1));assert.equal(g.stock,1);while(g.active)solveActive(g);
  assert.ok(g.openDelivery());assert.equal(g.answer(g.active.task.answer).accepted,false,'A label must be attached physically');
  const before=g.runes;solveActive(g);assert.equal(g.stock,3);assert.equal(g.deliveries,1);assert.ok(g.runes>=before+5);assert.equal(g.openDelivery(),false);
});

test('recipe ingredients enforce sentence order and ticket clipping commits once',()=>{
  const recipe=new BistroGame(config,tasks,{demoSetting:'recipe'});recipe.start();recipe.openOrder(0);
  assert.equal(recipe.answer(recipe.active.task.answer).accepted,false);assert.equal(recipe.addIngredient(2).correct,false);assert.deepEqual(recipe.active.ingredients,[]);
  assert.equal(recipe.addIngredient(0).completed,false);assert.equal(recipe.addIngredient(0).accepted,false);assert.equal(recipe.addIngredient(1).completed,false);assert.equal(recipe.completeTask(),false);
  for(let i=2,count=recipe.active.task.blocks.length;i<count;i++)assert.equal(recipe.addIngredient(i).completed,i===count-1);assert.equal(recipe.completed,1);assert.ok(recipe.completeTask());
  const ticket=new BistroGame(config,tasks,{demoSetting:'ticket'});ticket.start();ticket.openOrder(0);assert.equal(ticket.stampTicket(),false);
  assert.equal(ticket.answer(ticket.active.task.answer).correct,true);assert.equal(ticket.completeTask(),false);assert.ok(ticket.stampTicket());assert.equal(ticket.stampTicket(),false);assert.ok(ticket.completeTask());
});

test('listening variants preserve the source vocabulary and answer choices',()=>{
  let count=0;
  for(const source of bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='vocabulary')){
    const t=listeningTask(source);assert.equal(t.spoken,source.answer);assert.equal(t.answer,source.answer);assert.equal(t.sourceId,source.id);assert.equal(t.translation,source.translation);assert.deepEqual(t.options,source.options);assert.notEqual(t.options,source.options);count++;
  }
  assert.equal(count,1054);
});

test('customer identities rotate without repeats and every dish can be ordered',()=>{
  const g=new BistroGame(config,tasks,{rng:seeded()});g.start();const customers=[g.tables[0].guest],recipes=new Set([g.tables[0].recipe]);
  // Simulate clearing a table between arrivals, without changing the roster mechanism.
  for(let i=1;i<48;i++){g.tables.forEach(t=>t.status='empty');assert.ok(g.spawnGuest());const arrival=g.tables.find(t=>t.orderId===g.sequence);customers.push(arrival.guest);recipes.add(arrival.recipe);}
  assert.equal(new Set(customers.slice(0,24)).size,CUSTOMER_PROFILES.length);assert.equal(new Set(customers.slice(24)).size,CUSTOMER_PROFILES.length);assert.notEqual(customers[23],customers[24]);assert.equal(recipes.size,9);
});

test('all checkout sentences fit the display before and after correction',()=>{
  for(const task of bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='repair')){
    const {parts,errorIndex}=repairParts(task);
    for(const replacement of [task.broken,'_____',task.answer]){const text=[...parts];text[errorIndex]=replacement;const {words}=terminalWordLayout(text);assert.equal(words.length,parts.length);for(const word of words){assert.ok(word.x>=66);assert.ok(word.x+word.width<=958,task.id);assert.ok(word.y+word.height<470,task.id);}}
  }
});
