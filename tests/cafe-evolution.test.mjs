import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {DESIGN_LAYOUTS,COUNTER_PLANS,DECOR_SLOTS,cleanDesign,chooseDecoration,visibleDecor,atmosphereFor} from '../src/cafe-design.mjs';
import {validateDesign} from '../src/design-validation.mjs';import {takeawayTask,practicalMode,TAKEAWAY_MODES} from '../src/takeaway-tasks.mjs';
import {BistroGame,loadProfile,saveProfile,ARENAS} from '../src/core.mjs';import {createRestaurant} from '../src/restaurant.mjs';import {StationScene} from '../src/station-scene.mjs';import {settingForTask} from '../src/tasks.mjs';import {seeded,solveActive,tick} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units[0],cfg={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
function run(config=cfg,u=unit,{accept=true,liveKitchen=true,progress=4,layout='classic',counter='balanced',eventType='mixed'}={}){
 const g=new BistroGame(config,u.tasks,{rng:seeded(),connectedService:true,liveKitchen,design:{layout,counter,atmosphere:'rain'},cafeProgress:{pickups:progress},eventType});g.start();let n=0;
 while(g.state==='playing'&&n++<30000){const k=g.kitchen;if(k)assert.equal(k.clean+k.dirty+k.plated.size,k.capacity);
  if(g.active){assert.ok(g.active.task.functional||g.active.task.variant?.startsWith('takeaway-')||u.tasks.some(t=>t.id===(g.active.task.sourceId||g.active.task.id))||g.active.task.kind==='sorting'||g.active.task.kind==='matching'||g.active.task.kind==='listening','Reviewed lesson activity or approved functional template');solveActive(g);continue;}
  if(g.director.offer){assert.ok(g.resolveEpisode(accept));continue;}
  if(g.pendingSide&&!k?.sideRestock){g.resolveSide(g.stock>0);continue;}
  if(k){if(k.moving||k.pending||k.busy||g.run){g.tick(.15);continue;}let action;
   if(k.carry)action=k.carry.kind==='supplies'?'pantry':'order:'+k.carry.tableId;
   else if(g.loaded.length)action='order:'+g.loaded[0].tableId;
   else if(g.director.needsSupplies)action='receiving';
   else{const eligible=g.tables.filter(t=>['ready','preparing','prepared','waiting'].includes(t.status)).sort((a,b)=>a.patience/a.maxPatience-b.patience/b.maxPatience),t=eligible[0];if(t)action=t.status==='ready'&&t.step===t.plan.length&&!k.clean?'sink':'order:'+t.id;}
   if(action)assert.ok(k.command(action),'Action '+action+' rejected: '+k.notice);
  }else{if(g.director.needsSupplies){assert.ok(g.openDelivery());continue;}if(!g.run){const ready=g.readyLoads()[0];if(ready){g.chooseDish(ready.tableId,ready.part);g.deliver(ready.tableId);}else for(const t of g.tables)if(['waiting','ready'].includes(t.status)){if(g.openOrder(t.id))break;else if(g.needsDelivery)g.openDelivery();}}}
  g.tick(.15);
 }
 assert.equal(g.state,'finished',JSON.stringify({config,stage:g.director.stage,served:g.served,goal:g.goal,n,tables:g.tables.map(t=>({s:t.status,step:t.step,plan:t.plan.map(p=>p.setting)}))}));assert.equal(g.result.won,true);return g;
}

test('every venue, table arrangement and counter configuration retains reachable actual service stops',()=>{
 for(const arena of ARENAS)for(const l of DESIGN_LAYOUTS)for(const c of COUNTER_PLANS){const r=validateDesign(arena.id,{layout:l.id,counter:c.id});assert.equal(r.valid,true,`${arena.id}/${l.id}/${c.id}`);assert.equal(r.plan.tables.length,arena.tables);for(const route of r.routes)for(const n of route.path)assert.ok(Number.isFinite(n.x+n.z));}
});
test('designs, earned decorations and practical pickup progress migrate and remain isolated across campaigns',()=>{
 const mem=new Map(),store={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)},p=loadProfile(store),key='5:gryffindor:courtyard';p.designs[key]=cleanDesign({layout:'express',counter:'takeaway',atmosphere:'rain'});p.cafeProgress[key]={pickups:4,credited:['1:4']};assert.ok(saveProfile(store,p));const restored=loadProfile(store);assert.deepEqual(restored.designs[key],p.designs[key]);assert.equal(restored.cafeProgress[key].pickups,4);assert.equal(restored.designs['5:ravenclaw:courtyard'],undefined);assert.equal(chooseDecoration({},'welcome','plant',0),null);const d=chooseDecoration({},'welcome','plant',1);assert.equal(visibleDecor(d,0).welcome,undefined);assert.equal(visibleDecor(d,1).welcome,'plant');assert.deepEqual(cleanDesign({layout:'bad',counter:'bad',atmosphere:'bad',decor:{fake:'bad'}}),cleanDesign());
});
test('atmospheres rotate by campaign shift and fixed choices remain stable',()=>{assert.deepEqual([1,2,3,4].map(n=>atmosphereFor({},n)),['breakfast','rain','evening','breakfast']);assert.equal(atmosphereFor({atmosphere:'rain'},99),'rain');});
test('counter choices change real stock and dish capacity without mutating venue definitions',()=>{
 const a=new BistroGame(cfg,unit.tasks,{liveKitchen:true,design:{counter:'takeaway'}}),b=new BistroGame(cfg,unit.tasks,{liveKitchen:true,design:{counter:'service'}});assert.equal(a.maxStock,4);assert.equal(b.maxStock,3);assert.equal(b.kitchen.capacity,4);assert.equal(ARENAS[0].goal,6);assert.equal(a.goal,6);
});
test('all functional modes have unambiguous four-pair pages and eight distinct Challenge pairs for every grade',()=>{
 assert.equal(practicalMode(0),null);assert.deepEqual([1,2,3,4,5].map(practicalMode),['names','quantities','times','instructions','names']);
 for(const grade of [5,6,7,8])for(const mode of TAKEAWAY_MODES)for(let seed=0;seed<30;seed++){const rng=seeded(seed),a=takeawayTask(mode.id,'challenge',rng,1,{grade}),b=takeawayTask(mode.id,'challenge',rng,2,{grade,exclude:a.pairs.map(p=>p.id)});assert.equal(settingForTask(a),'pickup');assert.equal(a.pairs.length,4);assert.equal(new Set([...a.pairs,...b.pairs].map(p=>p.id)).size,8);for(const t of [a,b]){assert.equal(new Set(t.pairs.map(p=>p.word)).size,4);assert.equal(new Set(t.pairs.map(p=>p.translation)).size,4);assert.ok(t.functional);}}
});
test('director decisions freeze all simulation clocks, reject repeated resolution and respect pause',()=>{
 const g=new BistroGame(cfg,unit.tasks,{connectedService:true,liveKitchen:true});g.start();g.director.stage='supplier';g.director.pending='supplies';g.serviceEvent=null;g.tick(.1);assert.ok(g.director.offer);const before=JSON.stringify({tables:g.tables,kitchen:g.kitchen.position,elapsed:g.elapsed,director:g.director.elapsed});tick(g,90);assert.equal(JSON.stringify({tables:g.tables,kitchen:g.kitchen.position,elapsed:g.elapsed,director:g.director.elapsed}),before);g.paused=true;assert.equal(g.resolveEpisode(true),false);g.paused=false;assert.ok(g.resolveEpisode(false));assert.equal(g.resolveEpisode(true),false);assert.equal(g.goal,6);
});
test('English tasks protect the director clock and delivery has to reach Pantry before a larger-order offer',()=>{
 const g=new BistroGame(cfg,unit.tasks,{connectedService:true,liveKitchen:true,rng:seeded()});g.start();g.openOrder(0);const before=g.director.elapsed;tick(g,100);assert.equal(g.director.elapsed,before);g.active=null;g.director.stage='restock';assert.ok(g.openDelivery());solveActive(g);assert.equal(g.director.stage,'restock');assert.equal(g.stock,2);assert.equal(g.kitchen.carry.kind,'supplies');g.kitchen.arrive({kind:'deposit'});assert.equal(g.director.stage,'opportunity');assert.equal(g.stock,g.maxStock);
});
test('connected episodes complete both accept and decline branches in all venues and paces with conservation',()=>{
 for(const a of ARENAS)for(const difficulty of ['relaxed','challenge'])for(const accept of [true,false]){const g=run({...cfg,arena:a.id,difficulty},unit,{accept,layout:'express',counter:'takeaway'});assert.equal(g.result.goal,a.goal+(accept?2:0));assert.equal(g.result.episode.completed,accept);assert.equal(g.result.episode.declined,!accept);assert.ok(g.history.some(h=>h.setting==='pickup'));assert.ok(g.cafeProgress.pickups>4);}
});
test('connected service also completes without the free-walking kitchen',()=>{for(const accept of [true,false]){const g=run(cfg,unit,{accept,liveKitchen:false});assert.equal(g.result.episode.completed,accept);}});
test('connected episodes use each selected unit across all grades, events and design arrangements',()=>{
 let count=0;for(const grade of bank)for(const u of grade.units){const g=run({...cfg,grade:grade.grade,unit:u.id,arena:ARENAS[count%3].id,difficulty:count%2?'challenge':'relaxed'},u,{accept:true,progress:count%5,layout:DESIGN_LAYOUTS[count%3].id,counter:COUNTER_PLANS[count%3].id,eventType:['mixed','side','takeaway','together'][count%4]});assert.ok(g.result.episode.completed);count++;}assert.equal(count,44);
});
test('recovery choices build finite scenery and preserve the dish footprint through every milestone',()=>{
 for(let level=0;level<=5;level++){const design={layout:'cosy',counter:'service',decor:Object.fromEntries(DECOR_SLOTS.filter(s=>s.level<=level).map(s=>[s.id,s.choices[level%2].id]))},w=createRestaurant({arena:'banquet',design,reputationLevel:level,atmosphere:'rain'});w.root.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));});assert.equal(w.design.layout,'cosy');assert.equal(w.atmosphereRain.mesh.visible,true);const s=new StationScene(w,{setting:'recipe',recipe:0,task:unit.tasks.find(t=>t.kind==='sentence'),viewport:{width:390,height:844}});assert.equal(s.vessel.scale.x,s.vessel.scale.z);s.dispose();}
});

test('packing requests retain four stable bag targets and readable type across supported phone sizes',async()=>{
 const {menuPageLayout}=await import('../src/page-fit.mjs'),{stationViewport}=await import('../src/object-layout.mjs');for(const [width,height]of [[320,480],[320,568],[360,640],[390,844],[568,320],[667,375],[1366,768]])for(let seed=0;seed<40;seed++){const task=takeawayTask('instructions','challenge',seeded(seed),1,{grade:5}),rect=stationViewport(width,height,'pickup'),p=menuPageLayout({width:rect.width-2,height:rect.height-2,pairs:task.pairs,mode:task.mode});assert.ok(p.fits,`${width}x${height} ${seed}`);assert.ok(p.font>=14.5);assert.ok(p.rowHeight>=44);assert.equal(p.rows*p.columns,4);}
});

test('service ambience reuses two layered live sources, stops on mute and releases prior nodes when days change',async()=>{
 const {ServiceAmbience}=await import('../src/service-ambience.mjs');let created=0;const node=()=>({connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;},gain:{value:0},frequency:{value:0}}),ctx={sampleRate:32,currentTime:0,state:'running',destination:{},createBuffer:(_c,n)=>({getChannelData:()=>new Float32Array(n)}),createBufferSource:()=>{created++;return node()},createBiquadFilter:node,createGain:node};const a=new ServiceAmbience({ctx});a.set('rain',true);assert.equal(created,2);const first=[...a.nodes];a.set('rain',true);assert.equal(created,2);a.set('evening',true);assert.equal(created,4);assert.ok(first.every(n=>n.disconnected));assert.ok(first.filter(n=>n.started).every(n=>n.stopped));a.set('evening',false);assert.equal(a.running,false);assert.equal(a.nodes.length,0);a.frame();assert.equal(created,4);
});
