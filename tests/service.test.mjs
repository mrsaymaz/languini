import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BistroGame,TaskDeck,normalizeConfig,loadProfile,saveProfile,walletKey,practiceKey,buyItem,equipItem,TEAMS,ARENAS} from '../src/core.mjs';
import {ORDER_TYPES,CATALOG} from '../src/service-design.mjs';
import {LearningMemory} from '../src/learning.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {feedbackForTask,readbackFor} from '../src/tasks.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {seeded,tick,solveActive,finishShift} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),unit=bank[0].units[0],config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
function prepare(game,id=0){assert.ok(game.openOrder(id));while(game.active)solveActive(game);const t=game.tables[id];tick(game,t.cookLeft+.1);while(t.step<t.plan.length){const previous=t.step;assert.ok(game.openOrder(id));while(game.active)solveActive(game);assert.ok(t.step>previous);}return t;}

test('an order retains its customer, table, dish and ticket through every station',()=>{
  const game=new BistroGame({...config,arena:'banquet',difficulty:'challenge'},unit.tasks,{rng:seeded()});game.start();const t=game.tables[0],identity=[t.orderId,t.name,t.guest,t.recipe,t.orderType];
  prepare(game);assert.equal(t.step,t.plan.length);assert.equal(t.plan.length,6);assert.deepEqual([t.orderId,t.name,t.guest,t.recipe,t.orderType],identity);assert.deepEqual(t.settingsDone,t.plan.map(s=>s.setting));assert.deepEqual(t.settingsDone,['conversation','tablet','ticket','recipe','repair','conversation']);assert.ok(game.chooseDish(0));assert.ok(game.deliver(0));tick(game,1.3);assert.equal(game.served,1);
});

test('ready dishes require their matching table and cannot be delivered twice',()=>{
  const game=new BistroGame(config,unit.tasks,{rng:seeded()});game.start();prepare(game);assert.equal(game.deliver(0),false);assert.ok(game.chooseDish(0));assert.equal(game.deliver(1),false);const before=game.runes;assert.ok(game.deliver(0));assert.equal(game.runes,before);tick(game,1.3);assert.ok(game.runes>before);assert.equal(game.selectedDish,null);assert.equal(game.deliver(0),false);
});

test('departing guests invalidate their selected dish without awarding runes',()=>{
  const game=new BistroGame(config,unit.tasks,{rng:seeded()});game.start();prepare(game);game.chooseDish(0);game.tables[0].patience=.05;game.tick(.1);assert.equal(game.selectedDish,null);assert.equal(game.tables[0].delivered,false);assert.equal(game.deliver(0),false);assert.equal(game.runes,0);
});

test('a featured service event resolves and the finale waits for committed handoffs',()=>{
  for(const arena of ARENAS){const game=finishShift({...config,arena:arena.id},unit.tasks);assert.equal(game.result.won,true);assert.equal(game.eventDone,true);assert.equal(game.serviceEvent,null);assert.equal(game.tables.find(t=>t.final).delivered,true);}
});

test('equipment has two selectable slots, practical effects and isolated purchases',()=>{
  const profile=loadProfile({getItem:()=>null}),key=walletKey(config);profile.wallets[key]=1000;
  for(const id of ['pantry','warmer','prep'])assert.ok(buyItem(profile,config,id));assert.equal(buyItem(profile,config,'pantry'),false);assert.equal(equipItem(profile,config,'prep'),false);assert.ok(equipItem(profile,config,'warmer'));assert.ok(equipItem(profile,config,'prep'));assert.equal(profile.furnishings[key].equipped.length,2);assert.equal(buyItem(profile,{...config,team:'ravenclaw'},'banner'),false);
  const game=new BistroGame(config,unit.tasks,{rng:seeded(),furnishings:profile.furnishings[key]});game.start();assert.equal(game.maxStock,5);game.openOrder(0);while(game.active)solveActive(game);const basic=new BistroGame(config,unit.tasks,{rng:seeded()});basic.start();basic.openOrder(0);while(basic.active)solveActive(basic);assert.ok(Math.abs(game.tables[0].cookTotal-basic.tables[0].cookTotal*.8)<1e-9);
  game.stock=1;assert.ok(game.openDelivery());solveActive(game);assert.equal(game.stock,5);
});

test('warming shelves slow ready patience while English practice freezes all service needs',()=>{
  const game=new BistroGame(config,unit.tasks,{rng:seeded(),furnishings:{owned:['warmer'],equipped:['warmer']}});game.start();prepare(game);const t=game.tables[0],p=t.patience;game.tick(.2);assert.ok(Math.abs(t.patience-(p-.12))<1e-8);game.openOrder(1);assert.ok(game.active);const snapshot=JSON.stringify(game.tables),clock=game.elapsed;tick(game,200);assert.equal(JSON.stringify(game.tables),snapshot);assert.equal(game.elapsed,clock);
});

test('regular guests remember visits and favourites and give a postcard on their third visit',()=>{
  const first=new BistroGame(config,unit.tasks,{rng:seeded()});first.start();prepare(first);first.serve(0);tick(first,1.3);const id=first.tables[0].guest,favourite=first.guests[id].favourite;
  const second=new BistroGame(config,unit.tasks,{rng:seeded(77),guests:first.guests});second.start();assert.equal(second.tables[0].guest,id);assert.equal(second.tables[0].recipe,favourite);assert.equal(second.tables[0].visits,1);prepare(second);second.serve(0);tick(second,1.3);
  const third=new BistroGame(config,unit.tasks,{rng:seeded(88),guests:second.guests});third.start();prepare(third);third.serve(0);tick(third,1.3);assert.equal(third.guests[id].visits,3);assert.equal(third.drainEvents().find(e=>e.type==='served').postcard,true);assert.equal(first.guests[id].visits,1,'Later services must not mutate a prior snapshot');
});

test('saved v0.6 profiles retain wallets and records while new state survives reload',()=>{
  const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},profile=loadProfile(storage),key=walletKey(config),pkey=practiceKey(config);profile.wallets[key]=300;buyItem(profile,config,'banner');profile.guests[key]={'0':{visits:3,favourite:2}};profile.learning[pkey]={clock:4,items:{'word:library':{independent:1,supported:1,streak:1,last:4,due:9}}};assert.ok(saveProfile(storage,profile));const loaded=loadProfile(storage);assert.deepEqual(loaded.furnishings,profile.furnishings);assert.deepEqual(loaded.guests,profile.guests);assert.deepEqual(loaded.learning,profile.learning);assert.equal(loaded.wallets[key],230);
  const old={version:1,wallets:{[key]:123},records:{saved:{stars:2}},practice:{[pkey]:{seen:['g5u1q1'],last:'g5u1q1'}}};const migrated=loadProfile({getItem:()=>JSON.stringify(old)});assert.equal(migrated.wallets[key],123);assert.equal(migrated.records.saved.stars,2);assert.deepEqual(migrated.furnishings,{});
});

test('supported vocabulary returns later across matching, listening and definitions',()=>{
  const vocabulary=unit.tasks.find(t=>t.kind==='vocabulary'),memory=new LearningMemory(unit.tasks);memory.record(vocabulary,{supported:true});const key=memory.keys(vocabulary)[0];assert.equal(memory.state.items[key].due,4);assert.equal(memory.priority(vocabulary),0);
  const listening={...vocabulary,kind:'listening',id:vocabulary.id+'-listening',sourceId:vocabulary.id};assert.deepEqual(memory.keys(listening),[key]);const definition={...vocabulary,kind:'description',id:'definition-test'};assert.deepEqual(memory.keys(definition),[key]);
  for(let i=0;i<3;i++)memory.record({id:'filler-'+i,kind:'question',answer:'A complete reply.'});assert.ok(memory.priority(definition)>3);memory.record(definition);assert.equal(memory.state.items[key].independent,1);assert.equal(memory.state.items[key].supported,1);
  for(let i=0;i<3;i++)memory.record(listening);assert.ok(memory.state.items[key].due>memory.state.clock+20);assert.equal(memory.summary().secure,1);
});

test('adaptive selection keeps complete question cycles and matching words inside the unit',()=>{
  const memory=new LearningMemory(unit.tasks),deck=new TaskDeck(unit.tasks,seeded(),{learning:memory}),count=deck.groups.get('conversation').length,seen=new Set();
  for(let i=0;i<count;i++){const t=deck.forSetting('conversation');assert.ok(!seen.has(t.id));seen.add(t.id);memory.record(t,{supported:i%2===0});}assert.equal(seen.size,count);
  const task=deck.forSetting('tablet','challenge',{menuMode:'translation'});for(const pair of task.pairs)assert.ok(unit.tasks.some(t=>t.id===pair.id));
});

test('matching records supported pairs individually and never makes free hints a purchase',()=>{
  const game=new BistroGame(config,unit.tasks,{demoSetting:'tablet',demoMenuMode:'translation'});game.start();game.openOrder(0);const task=game.active.task;game.matchPair(0,1);for(let i=0;i<3;i++)game.matchPair(i,i);const keys=game.learning.keys(task);assert.equal(game.learning.state.items[keys[0]].supported,1);assert.equal(game.learning.state.items[keys[1]].supported,1);assert.equal(game.learning.state.items[keys[2]].independent,1);assert.ok(!CATALOG.some(i=>/hint|replay|language/i.test(i.id)));
});

test('feedback explains subject agreement and preserves the reviewed correct sentence',()=>{
  const task=unit.tasks.find(t=>t.kind==='repair'&&t.answer==='likes'),original=JSON.stringify(task),text=feedbackForTask(task);assert.match(text,/one person/);assert.match(text,/-s/);assert.equal(readbackFor(task),'Our teacher likes the science club.');assert.equal(JSON.stringify(task),original);
});

test('every station renders a consistent order token without changing answer text',()=>{
  const game=new BistroGame(config,unit.tasks);game.start();const t=game.tables[0];for(const setting of ['conversation','tablet','recipe','ticket','repair']){const task=game.deck.forSetting(setting),html=taskMarkup(task,{tableId:0,recipe:{name:'Garden sandwich',container:'plate'},identity:t,options:task.options||[],difficulty:'challenge'});assert.ok(html.includes(t.name));assert.ok(html.includes('T1'));assert.ok(html.includes('Garden sandwich'));assert.ok(html.includes('#01'));if(task.translation&&!['sentence','matching','listening','vocabulary'].includes(task.kind))assert.match(html,/id="language-support"[^>]*hidden/);}
});

test('refurbished restaurants and team equipment build finite geometry for all teams and arenas',()=>{
  for(const team of TEAMS)for(const arena of ARENAS){const world=createRestaurant({team:team.id,arena:arena.id,furnishings:{owned:CATALOG.map(i=>i.id),equipped:['pantry','prep']},postcards:8});let meshes=0;world.root.traverse(o=>{if(o.isMesh){meshes++;for(const x of o.geometry.attributes.position.array)assert.ok(Number.isFinite(x));}});assert.ok(sceneBudget(world).room.meshes<330,`${meshes} total draw objects; room keeps its previous budget`);assert.ok(sceneBudget(world).exterior.meshes<=50);assert.equal(world.furnishing.owned.length,CATALOG.length);assert.equal(world.tables.filter(t=>!t.pickup).length,arena.tables);assert.equal(world.tables.filter(t=>t.pickup).length,1);}
});

test('legacy pass-and-play settings do not swap roles and team rewards remain neutral',()=>{
  assert.equal(normalizeConfig({...config,cooperative:true},bank).cooperative,false);
  const game=new BistroGame({...config,cooperative:true},unit.tasks,{rng:seeded()});game.start();prepare(game);assert.equal(game.role,0);game.chooseDish(0);assert.equal(game.deliver(1),false);assert.equal(game.role,0);game.deliver(0);tick(game,1.3);assert.equal(game.role,0);
  const results=TEAMS.map(t=>finishShift({...config,team:t.id},unit.tasks).runes);assert.equal(new Set(results).size,1);
});

test('management signals remain separate touch targets on portrait and landscape screens',async()=>{
  const {layoutSignals}=await import('../src/service-layout.mjs');
  for(const [width,height]of [[320,480],[360,640],[393,740],[844,390],[1280,720]]){
    const signals=Array.from({length:5},(_,id)=>({id,x:width*.5,y:height*.45,width:144,height:68})),layout=layoutSignals(signals,width,height);
    for(const a of layout){assert.ok(a.x-a.width/2>=11);assert.ok(a.x+a.width/2<=width-11);assert.ok(a.y<=height-119);for(const b of layout.filter(b=>b.id!==a.id))assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2||a.y-a.height>=b.y||b.y-b.height>=a.y,`${width}×${height}: signals ${a.id} and ${b.id} overlap`);}
  }
});
