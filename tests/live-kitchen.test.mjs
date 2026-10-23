import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame,ARENAS} from '../src/core.mjs';
import {KitchenNavigation,KITCHEN_POINTS,KITCHEN_TABLES} from '../src/kitchen-flow.mjs';
import {KitchenHUD} from '../src/kitchen-hud.mjs';
import {RestaurantView} from '../src/restaurant.mjs';
import {documentDouble,Element} from './dom-double.mjs';
import {seeded,solveActive,tick} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units.find(u=>u.id==='g5u6');
function create({arena='courtyard',difficulty='relaxed',eventType='mixed',u=unit,furnishings}={}){const g=new BistroGame({grade:+u.id[1],unit:u.id,team:'gryffindor',arena,difficulty},u.tasks,{liveKitchen:true,rng:seeded(),eventType,furnishings});g.start();return g;}
function arrive(g){let n=0;while((g.kitchen.moving||g.kitchen.pending||g.kitchen.busy||g.run)&&!g.active&&g.state==='playing'&&n++<3000)g.tick(.1);assert.ok(n<3000,'Travel must terminate');}
function finish(g){let n=0;while(g.state==='playing'&&n++<20000){const k=g.kitchen;
  assert.equal(k.clean+k.dirty+k.plated.size,k.capacity,'Serving dishes cannot be duplicated or lost');
  if(g.active){solveActive(g);continue;}if(g.pendingSide&&!k.sideRestock){g.resolveSide(g.stock>0);continue;}
  if(k.moving||k.pending||k.busy||g.run){g.tick(.15);continue;}
  let action;if(k.carry)action=k.carry.kind==='supplies'?'pantry':'order:'+k.carry.tableId;
  else if(g.loaded.length)action='order:'+g.loaded[0].tableId;
  else{const ready=g.tables.filter(t=>t.status==='ready').sort((a,b)=>a.patience/a.maxPatience-b.patience/b.maxPatience)[0];if(ready)action=ready.step===ready.plan.length&&!k.clean?'sink':'order:'+ready.id;
    else{const next=g.tables.filter(t=>['preparing','prepared','waiting'].includes(t.status)).sort((a,b)=>a.patience/a.maxPatience-b.patience/b.maxPatience)[0];if(next)action='order:'+next.id;}}
  if(action)assert.ok(k.command(action),'Action blocked: '+action);g.tick(.15);
 }assert.ok(n<20000);assert.equal(g.state,'finished');assert.equal(g.result.won,true,JSON.stringify(g.config));return g;
}
function ready(g,tableId=0,parts=1){g.active=null;g.kitchen.route=[];g.kitchen.pending=null;g.jobs=[];const t=g.tables[tableId];Object.assign(t,{status:'ready',step:0,plan:[],cooked:true,readyAge:0,partySize:parts,partyRecipes:Array.from({length:parts},(_,i)=>i),partyGuests:Array.from({length:parts},(_,i)=>i),readyParts:Array.from({length:parts},(_,i)=>i),deliveredParts:[],transitParts:[]});return t;}

test('live kitchens complete 264 grade/unit/difficulty/arena services with plate conservation',()=>{
 let count=0;for(const grade of bank)for(const u of grade.units)for(const arena of ARENAS)for(const difficulty of ['relaxed','challenge']){const g=finish(create({u,arena:arena.id,difficulty,eventType:['mixed','side','takeaway','together'][count%4]}));assert.equal(g.served,arena.goal);assert.ok(g.kitchen.handoffs===g.served);assert.ok(g.kitchen.steps>g.served);count++;}assert.equal(count,264);
});

test('all four events work in 72 live equipment/arena/difficulty combinations',()=>{
 let count=0;for(const eventType of ['mixed','side','takeaway','together'])for(const arena of ARENAS)for(const difficulty of ['relaxed','challenge'])for(const ids of [[],['bench','trolley'],['pantry','warmer']]){finish(create({arena:arena.id,difficulty,eventType,furnishings:{owned:ids,equipped:ids}}));count++;}assert.equal(count,72);
});

test('navigation reaches every station and guest while avoiding tables and furniture',()=>{
 for(const arena of Object.keys(KITCHEN_TABLES))for(const bench of [false,true]){const nav=new KitchenNavigation(arena,{bench});for(const [x,z]of [...Object.values(KITCHEN_POINTS),...KITCHEN_TABLES[arena].map(([x,z])=>[x,z+.98]),[3.75,-2.02]]){const route=nav.route({x:.125,z:1.875},{x,z});assert.ok(route&&route.length);for(const p of route)assert.ok(!nav.obstacles.some(r=>p.x>r.left&&p.x<r.right&&p.z>r.top&&p.z<r.bottom));for(let i=1;i<route.length;i++)assert.ok(Math.hypot(route[i].x-route[i-1].x,route[i].z-route[i-1].z)<=.251);}}
});

test('movement consumes the full frame budget and stays consistent across step sizes',()=>{
 const positions=[];for(const dt of [.02,.1,.2]){const g=create();g.kitchen.walkTo(3.5,.5);let elapsed=0;while(elapsed<.8-1e-8){g.tick(dt);elapsed+=dt;}positions.push(g.kitchen.position);}for(const p of positions)assert.ok(Math.hypot(p.x-positions[0].x,p.z-positions[0].z)<.001);
});

test('an order requires walking and explicit station choices, with protected learning time',()=>{
 const g=create(),k=g.kitchen;assert.ok(k.command('order:0'));assert.equal(g.active,null);arrive(g);assert.ok(g.active);const frozen=JSON.stringify({tables:g.tables,position:k.position,jobs:g.jobs,elapsed:g.elapsed});tick(g,500);assert.equal(JSON.stringify({tables:g.tables,position:k.position,jobs:g.jobs,elapsed:g.elapsed}),frozen);solveActive(g);while(g.active)solveActive(g);assert.equal(g.tables[0].status,'preparing');assert.equal(g.active,null);assert.equal(g.jobs.length,0);assert.ok(k.command('order:0'));arrive(g);assert.ok(g.active);
});

test('prepared trays occupy hands and can be held on the counter without duplicating cooking',()=>{
 const g=create(),k=g.kitchen,t=g.tables[0];k.prepared(t);assert.equal(k.hands,'prepared');assert.ok(k.command('counter'));arrive(g);assert.equal(k.carry,null);assert.equal(k.counter.length,1);assert.ok(k.command('order:0'));arrive(g);assert.equal(k.counter.length,0);assert.equal(k.carry.orderId,t.orderId);assert.ok(k.command('order:0'));arrive(g);const jobs=g.jobs.length;assert.ok(jobs>0);assert.equal(k.carry,null);k.arrive({kind:'cook',tableId:t.id,orderId:t.orderId});assert.equal(g.jobs.length,jobs);
});

test('supply rewards and stock commit only when the carried crate reaches Pantry',()=>{
 const g=create(),k=g.kitchen;g.stock=0;assert.ok(k.command('receiving'));arrive(g);solveActive(g);assert.equal(k.carry.kind,'supplies');assert.equal(g.stock,0);assert.equal(g.runes,0);const cargo=k.carry;assert.ok(k.command('pantry'));g.paused=true;const snapshot=JSON.stringify(k.position);tick(g,30);assert.equal(JSON.stringify(k.position),snapshot);assert.equal(g.stock,0);g.paused=false;arrive(g);assert.equal(g.stock,g.maxStock);assert.ok(g.runes>0);const reward=g.runes;k.arrive({kind:'deposit'});assert.equal(g.runes,reward);assert.notEqual(k.carry,cargo);
});

test('washing is a timed batch, pauses safely and conserves serving dishes',()=>{
 const g=create(),k=g.kitchen;k.clean=0;k.dirty=k.capacity;assert.ok(k.command('sink'));arrive(g);assert.equal(g.active.task.variant,'washing');const frozen=g.elapsed;tick(g,50);assert.equal(g.elapsed,frozen);solveActive(g);assert.ok(k.busy);g.paused=true;const left=k.busy.left;tick(g,50);assert.equal(k.busy.left,left);g.paused=false;arrive(g);assert.equal(k.clean,k.capacity);assert.equal(k.dirty,0);assert.equal(k.washed,k.capacity);assert.equal(k.busy,null);
});

test('a trolley commits two physical destinations and credits each handoff once',()=>{
 const g=create({furnishings:{owned:['trolley'],equipped:['trolley']}}),k=g.kitchen;ready(g);g.spawnGuest();ready(g,1);const first=g.tables[0],second=g.tables[1];assert.ok(k.command('pick:0:0'));arrive(g);assert.ok(k.command('pick:1:0'));arrive(g);assert.equal(g.loaded.length,2);assert.equal(g.served,0);assert.ok(k.command('order:1'));assert.equal(g.run.loads[0].tableId,1);g.paused=true;tick(g,100);assert.equal(g.served,0);g.paused=false;arrive(g);assert.equal(g.served,2);assert.equal(first.deliveredParts.length,1);assert.equal(second.deliveredParts.length,1);assert.equal(k.dirty,2);assert.equal(g.run,null);const reward=g.runes;tick(g,1);assert.equal(g.runes,reward);
});

test('side requests can restock through the live kitchen and resume the same offer',()=>{
 const g=create({eventType:'side'}),k=g.kitchen;g.pendingSide={tableId:0,orderId:g.tables[0].orderId};g.stock=0;assert.equal(g.focused,true);assert.ok(k.command('receiving'));assert.equal(g.focused,false);arrive(g);assert.ok(g.active);solveActive(g);assert.equal(k.carry.kind,'supplies');assert.ok(k.command('pantry'));arrive(g);assert.equal(k.sideRestock,false);assert.equal(g.focused,true);assert.equal(g.pendingSide.orderId,g.tables[0].orderId);assert.ok(g.resolveSide(true));assert.equal(g.active,null);assert.equal(g.tables[0].status,'preparing');
});

test('ticket buttons drive travel through the visible HUD control',()=>{
 const saved=globalThis.document,d=documentDouble();globalThis.document=d;try{const root=new Element(),g=create();d.body.append(root);const hud=new KitchenHUD(root,{command:a=>g.kitchen.command(a),tea(){}});hud.update(g);const button=root.querySelector('[data-kitchen="order:0"]');assert.ok(button);button.click();assert.ok(g.kitchen.moving);assert.equal(g.active,null);arrive(g);assert.ok(g.active);hud.update(g);assert.equal(root.hidden,true);}finally{globalThis.document=saved;}
});

test('the live renderer follows simulated position and displays the real held load',()=>{
 const g=create({furnishings:{owned:['trolley'],equipped:['trolley']}}),container={clientWidth:393,clientHeight:740,getBoundingClientRect:()=>({left:0,top:0,width:393,height:740,right:393,bottom:740})};
 const view=Object.assign(Object.create(RestaurantView.prototype),{container,reduced:true,menu:false,liveKitchen:true,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}},raycaster:new THREE.Raycaster(),pointer:new THREE.Vector2()});view.setRestaurant(g.config);g.kitchen.walkTo(2,1.8);tick(g,.5);view.update(1,.016,g);assert.equal(view.world.chef.root.position.x,g.kitchen.position.x);assert.equal(view.world.chef.root.position.z,g.kitchen.position.z);assert.equal(view.world.canopy.visible,false);g.kitchen.prepared(g.tables[0]);view.update(2,.016,g);assert.equal(view.world.carrier.visible,true);assert.ok(view.world.carrier.children.length>0);let meshes=0;view.world.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(meshes<400);
 g.kitchen.carry=null;ready(g);g.kitchen.command('pick:0:0');arrive(g);g.kitchen.command('order:0');view.update(3,.016,g);const held=view.world.trolleyLoads.children[0];assert.ok(held);view.update(3.016,.016,g);assert.equal(view.world.trolleyLoads.children[0],held,'An unchanged carried meal must retain its geometry between frames');
});


test('the visible Pass action loads both shared-table meals onto the trolley',()=>{
 const g=create({furnishings:{owned:['trolley'],equipped:['trolley']}}),k=g.kitchen;ready(g,0,2);assert.ok(k.command('order:0'));arrive(g);assert.equal(g.loaded.length,1);assert.ok(k.command('pass'));arrive(g);assert.equal(g.loaded.length,2);assert.ok(k.command('order:0'));arrive(g);assert.equal(g.served,2);assert.equal(k.dirty,2);assert.equal(g.tables[0].deliveredParts.length,2);
});

test('an invalidated delivery cannot credit a replacement order or strand the route',()=>{
 const g=create(),k=g.kitchen;ready(g);k.command('pick:0:0');arrive(g);k.command('order:0');g.tables[0].orderId++;arrive(g);assert.equal(g.served,0);assert.equal(g.runes,0);assert.equal(g.run,null);assert.equal(k.clean+k.dirty+k.plated.size,k.capacity);
});
