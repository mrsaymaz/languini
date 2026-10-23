import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {restaurantLayout} from '../src/restaurant-layout.mjs';import {validateDesign} from '../src/design-validation.mjs';import {KitchenNavigation} from '../src/kitchen-flow.mjs';import {DECOR_SLOTS} from '../src/cafe-design.mjs';import {createAtmosphereRain} from '../src/cafe-craft.mjs';import {createRestaurant,setTableCustomer} from '../src/restaurant.mjs';import {StationScene} from '../src/station-scene.mjs';import {ServiceAmbience} from '../src/service-ambience.mjs';import {loadProfile,saveProfile} from '../src/core.mjs';

test('three authored plans differ in silhouette and keep venue capacity, kitchen anchors and save IDs',()=>{
 for(const arena of ['courtyard','bistro','banquet']){const plans=['classic','cosy','express'].map(layout=>restaurantLayout(arena,{layout}));assert.ok(plans[0].tableAngles.every(a=>Math.abs(a)>1));assert.ok(plans[1].tableAngles.every(a=>a===0));assert.ok(plans[2].tables.filter(([x])=>x<0).length>=2);
  for(const p of plans){assert.deepEqual(p.points,plans[0].points);assert.equal(p.tables.length,plans[0].tables.length);}
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(plans[i].tables.some(([x,z],k)=>Math.hypot(x-plans[j].tables[k][0],z-plans[j].tables[k][1])>1.2),'More than a slight nudge');
 }
});
test('all 864 venue/layout/counter/decor combinations connect entrance, seats, stations and collection',()=>{
 let count=0;for(const arena of ['courtyard','bistro','banquet'])for(const layout of ['classic','cosy','express'])for(const counter of ['balanced','takeaway','service'])for(let mask=0;mask<32;mask++){
  const decor=Object.fromEntries(DECOR_SLOTS.map((s,i)=>[s.id,s.choices[mask>>i&1].id])),d={layout,counter,decor},r=validateDesign(arena,d),nav=new KitchenNavigation(arena,{design:d});assert.ok(r.valid,`${arena}/${layout}/${counter}/${mask}`);assert.ok(r.routes.some(r=>r.id==='entrance'));assert.equal(r.routes.filter(r=>r.id.startsWith('guest-')).length,r.plan.tables.length*2);
  for(const route of r.routes){assert.ok(route.path.length);for(let i=0;i<route.path.length;i++){const n=route.path[i];assert.ok(!nav.obstacles.some(b=>n.x>b.left&&n.x<b.right&&n.z>b.top&&n.z<b.bottom));if(i)assert.ok(Math.hypot(n.x-route.path[i-1].x,n.z-route.path[i-1].z)<=.251);}}
  count++;
 }assert.equal(count,864);
});
test('bounded weather is finite, exterior-only, static in reduced motion and fully disposable',()=>{
 for(const mood of ['breakfast','rain','evening']){const root=new THREE.Group(),plan=restaurantLayout('banquet'),w=createAtmosphereRain(root,{},plan,mood);assert.equal(w.count,mood==='rain'?240:0);assert.equal(w.mesh.visible,mood==='rain');w.update(10,true);const a=[...w.geometry.attributes.position.array];w.update(30,true);assert.deepEqual([...w.geometry.attributes.position.array],a);w.update(1,false);assert.ok(w.geometry.attributes.position.array.every(Number.isFinite));
  if(mood==='rain'){assert.notDeepEqual([...w.geometry.attributes.position.array],a);for(let i=0;i<w.count;i++){const x=w.geometry.attributes.position.array[i*6],z=w.geometry.attributes.position.array[i*6+2];assert.ok(z<=plan.kitchenZ-.6||z>4.7||Math.abs(x)>5.1+plan.venue.extraWidth/2-.4);}}
  let disposed=false;w.geometry.addEventListener('dispose',()=>disposed=true);w.dispose();assert.ok(disposed);assert.equal(w.group.parent,null);
 }
});
test('ambience ducks immediately for English, respects zero volume and clears scheduled detail nodes',()=>{
 const param=()=>({value:0,setTargetAtTime(v){this.value=v},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){this.disconnected=true},start(){},stop(){this.stopped=true}}),ctx={sampleRate:32,currentTime:0,state:'running',destination:{},createGain:node,createBiquadFilter:node,createBufferSource:node,createOscillator:node,createBuffer:(_c,n)=>({getChannelData:()=>new Float32Array(n)})},owner={ctx,settings:{ambience:.55},speaking:false},a=new ServiceAmbience(owner);a.set('rain',true);const normal=a.master.gain.value;owner.speaking=true;a.frame();assert.ok(a.master.gain.value<normal*.13);owner.speaking=false;ctx.currentTime=10;a.frame();assert.equal(a.transients.size,4);const old=[...a.nodes,...a.transients];a.set('evening',false);assert.ok(old.every(n=>n.disconnected));assert.equal(a.transients.size,0);owner.settings.ambience=0;a.set('rain',true);assert.equal(a.running,false);
});
test('ambience volume migrates, persists and clamps without resetting campaign progress',()=>{
 const mem=new Map(),s={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)};const p=loadProfile(s);assert.equal(p.settings.ambience,.55);p.settings.ambience=.2;p.designs['5:gryffindor:courtyard']={layout:'express'};saveProfile(s,p);assert.equal(loadProfile(s).settings.ambience,.2);assert.equal(loadProfile(s).designs['5:gryffindor:courtyard'].layout,'express');p.settings.ambience=100;saveProfile(s,p);assert.equal(loadProfile(s).settings.ambience,1);
});

test('every station hides weather, restores it on close and preserves rotated customer anchors',()=>{
 const world=createRestaurant({design:{layout:'classic'},atmosphere:'rain'}),task={kind:'sentence',blocks:['Our teacher','is','helpful.'],answer:'Our teacher is helpful.',options:['helpful','kind'],pairs:[{word:'one',translation:'1'},{word:'two',translation:'2'},{word:'three',translation:'3'},{word:'four',translation:'4'}]};
 const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank[0].units[0].tasks;
 for(const setting of ['conversation','tablet','recipe','delivery','repair','pickup','ticket']){const chosen=setting==='pickup'?{...task,kind:'matching'}:tasks.find(t=>t.kind===({conversation:'question',tablet:'vocabulary',recipe:'sentence',delivery:'vocabulary',repair:'repair',ticket:'completion'}[setting]));const s=new StationScene(world,{setting,task:chosen,options:chosen.options||[],recipe:0,viewport:{width:390,height:844}});assert.equal(world.atmosphereRain.group.visible,false);s.dispose();assert.equal(world.atmosphereRain.group.visible,true);}
 const t=world.tables[0],pos=t.guest.root.position.clone(),rot=t.guest.root.rotation.y;setTableCustomer(world,0,8);assert.ok(t.guest.root.position.distanceTo(pos)<1e-8);assert.equal(t.guest.root.rotation.y,rot);
});
