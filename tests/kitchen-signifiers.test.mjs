import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame,ARENAS,loadProfile,saveProfile} from '../src/core.mjs';
import {KitchenHUD} from '../src/kitchen-hud.mjs';
import {RestaurantView} from '../src/restaurant.mjs';
import {cleanKitchenHelp,kitchenAction,kitchenTarget,kitchenTip,recommendKitchen,placeKitchenBadge} from '../src/kitchen-signifiers.mjs';
import {documentDouble,Element} from './dom-double.mjs';
import {seeded,solveActive,tick} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units.find(u=>u.id==='g5u6');
function create(options={}){const {arena='bistro',difficulty='relaxed',...extra}=options;const g=new BistroGame({grade:5,unit:unit.id,team:'gryffindor',arena,difficulty},unit.tasks,{liveKitchen:true,rng:seeded(),...extra});g.start();return g;}
function arrive(g){let n=0;while((g.kitchen.moving||g.kitchen.pending||g.kitchen.busy||g.run)&&!g.active&&g.state==='playing'&&n++<1000)g.tick(.1);assert.ok(n<1000);}
function ready(g,id=0){g.jobs=g.jobs.filter(j=>j.tableId!==id);const t=g.tables[id];Object.assign(t,{status:'ready',step:0,plan:[],cooked:true,partySize:1,partyRecipes:[0],readyParts:[0],transitParts:[],deliveredParts:[]});return t;}
function withHUD(g,fn){const previous=globalThis.document,d=documentDouble();globalThis.document=d;try{const root=new Element();d.body.append(root);const hud=new KitchenHUD(root,{command:a=>{g.kitchen.command(a);hud.update(g);},tea(){}});hud.update(g);return fn(hud,root);}finally{globalThis.document=previous;}}

test('recommendations alone can complete 48 services across modes, arenas, events and equipment',()=>{
 let services=0;for(const arena of ARENAS)for(const difficulty of ['relaxed','challenge'])for(const eventType of ['mixed','side','takeaway','together'])for(const equipped of [[],['bench','trolley']]){
 const g=create({arena:arena.id,difficulty,eventType,furnishings:{owned:equipped,equipped}});let n=0;
 while(g.state==='playing'&&n++<25000){const k=g.kitchen;assert.equal(k.clean+k.dirty+k.plated.size,k.capacity);
 if(g.active){solveActive(g);continue;}if(g.pendingSide&&!k.sideRestock){g.resolveSide(g.stock>0);continue;}
 if(!k.moving&&!k.pending&&!k.busy&&!g.run){const advice=recommendKitchen(g);if(advice){assert.ok(advice.available);assert.ok(advice.point);assert.ok(k.command('work'),JSON.stringify(advice));const actual=kitchenTarget(g);assert.equal(actual?.station,advice.station);}}
 g.tick(.15);
 }assert.ok(n<25000);assert.equal(g.result?.won,true,JSON.stringify(g.config));services++;}assert.equal(services,48);
});

test('the destination badge and contextual primary button perform the same advertised action',()=>{
 for(const control of ['sign','work']){const g=create();withHUD(g,(hud,root)=>{assert.match(hud.sign.textContent,/Take order/);assert.match(hud.sign.textContent,/#1/);assert.equal(root.querySelector('[data-kitchen="order:0"]').dataset.recommended,'true');const before=JSON.stringify({tables:g.tables,stock:g.stock});hud.update(g);assert.equal(JSON.stringify({tables:g.tables,stock:g.stock}),before,'Rendering advice cannot mutate service');(control==='sign'?hud.sign:hud.dock.querySelector('[data-kitchen="work"]')).click();assert.equal(g.kitchen.pending.tableId,0);assert.match(hud.sign.textContent,/Walking/);arrive(g);assert.ok(g.active);hud.update(g);assert.equal(root.hidden,true);});}
});

test('tray, crate, plate and trolley advice stays attached to real destinations and order identities',()=>{
 const g=create({furnishings:{owned:['trolley'],equipped:['trolley']}}),k=g.kitchen;
 k.prepared(g.tables[0]);let a=recommendKitchen(g);assert.equal(a.station,'Cook');assert.equal(a.orderId,1);assert.equal(a.label,'Load cooker');k.command('counter');assert.equal(kitchenTarget(g).label,'Set down');k.command('work');assert.equal(k.pending.kind,'stash','Work must honour the sign when a manual route overrides its usual recommendation');arrive(g);assert.equal(kitchenAction(g,'order:0').station,'Counter');k.command('order:0');arrive(g);k.command('work');arrive(g);
 ready(g);g.spawnGuest();ready(g,1);k.command('pick:0:0');arrive(g);assert.equal(recommendKitchen(g).station,'Table 1');assert.equal(kitchenAction(g,'pass').tableId,1);k.command('pass');arrive(g);assert.equal(g.loaded.length,2);assert.match(kitchenTip(g,recommendKitchen(g)),/matching table/);k.command('order:1');assert.equal(kitchenTarget(g).tableId,1);arrive(g);assert.equal(g.served,2);
 k.clean=0;k.dirty=k.capacity;k.plated.clear();ready(g,0);assert.equal(recommendKitchen(g).station,'Sink');k.command('work');arrive(g);assert.equal(g.active.task.variant,'washing');solveActive(g);arrive(g);assert.equal(k.clean,k.capacity);
 g.stock=0;k.command('receiving');arrive(g);solveActive(g);assert.equal(recommendKitchen(g).station,'Pantry');withHUD(g,hud=>assert.match(hud.carry.textContent,/Carrying a crate to the Pantry/));k.command('work');arrive(g);assert.equal(g.stock,g.maxStock);
});

test('blocked actions explain themselves until the player chooses a valid route',()=>{
 const g=create(),k=g.kitchen;assert.equal(k.command('sink'),false);withHUD(g,hud=>{assert.match(hud.hint.textContent,/clean/);assert.equal(hud.hint.dataset.blocked,'true');});k.command('work');assert.equal(k.notice,'');arrive(g);while(g.active)solveActive(g);k.prepared(g.tables[0]);g.stock=0;k.command('receiving');assert.match(k.notice,/load/);assert.match(kitchenAction(g,'sink').reason,/Hands full/);k.command('counter');assert.equal(k.notice,'');
});

test('first-use tips learn only successful use, persist safely, and restore without changing progress',()=>{
 const g=create(),k=g.kitchen;const first=kitchenTarget(g);assert.match(kitchenTip(g,first),/Tap the highlighted/);k.command('work');assert.ok(!k.help.seen.includes('take'));arrive(g);assert.ok(k.help.seen.includes('take'));assert.equal(g.drainEvents().filter(e=>e.type==='kitchen_learned'&&e.lesson==='take').length,1);
 g.active=null;g.paused=false;k.route=[];k.pending=null;g.tables[0].status='waiting';let tip=kitchenTip(g,kitchenTarget(g));assert.ok(!tip.includes('Tap the highlighted'));k.help.mode='always';assert.match(kitchenTip(g,kitchenTarget(g)),/Tap the highlighted/);k.help.mode='off';assert.ok(!kitchenTip(g,kitchenTarget(g)).includes('Tap the highlighted'));
 const memory=new Map(),storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)},profile=loadProfile(storage);profile.wallets['5:gryffindor']=87;profile.kitchenHelp=k.help;assert.ok(saveProfile(storage,profile));const restored=loadProfile(storage);assert.equal(restored.version,1);assert.equal(restored.wallets['5:gryffindor'],87);assert.deepEqual(restored.kitchenHelp,k.help);assert.deepEqual(cleanKitchenHelp({mode:'bad',seen:['serve','serve','untrusted',null]}),{mode:'auto',seen:['serve']});
 k.help=cleanKitchenHelp();assert.match(kitchenTip(g,kitchenTarget(g)),/Tap the highlighted/);assert.equal(restored.wallets['5:gryffindor'],87);
});

test('guidance and signs hide during English, side decisions, pause and terminal states',()=>{
 const g=create();withHUD(g,(hud,root)=>{for(const state of ['active','side','pause','finished']){g.active=state==='active'?{}:null;g.pendingSide=state==='side'?{}:null;g.paused=state==='pause';g.state=state==='finished'?'finished':'playing';hud.update(g);assert.equal(root.hidden,true,state);assert.equal(kitchenTarget(g),null,state);}});
});

test('one badge stays inside the available playfield across phone sizes and safe side insets',()=>{
 for(const [w,h]of [[320,480],[320,568],[393,740],[568,320],[667,375],[844,390],[1366,768]])for(const point of [{x:-300,y:-100},{x:w/2,y:h/2},{x:w+200,y:h+200}]){const b=placeKitchenBadge(point,w,h,{left:24,right:30});assert.ok(b.x-b.width/2>=24);assert.ok(b.x+b.width/2<=w-30);assert.ok(b.y-b.height/2>=(h<450?126:204));assert.ok(b.y+b.height/2<=h-(h<450?90:178));assert.deepEqual(b.anchor,point);}
});

test('free movement has finite footprint confirmation and does not alter English outcomes',()=>{
 const g=create(),k=g.kitchen;k.walkTo(2,1.8);assert.ok(k.tapMarker);const count=g.total;tick(g,1);assert.equal(k.tapMarker,null);for(let n=0;k.moving&&n<100;n++)g.tick(.1);assert.equal(g.total,count);assert.ok(k.help.seen.includes('move'));assert.equal(g.runes,0);
});

test('scene signifiers point to the recommendation before any click and retain bounded geometry',()=>{
 const g=create(),container={clientWidth:393,clientHeight:740,getBoundingClientRect:()=>({left:0,top:0,width:393,height:740})};const view=Object.assign(Object.create(RestaurantView.prototype),{container,reduced:true,menu:false,liveKitchen:true,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}},raycaster:new THREE.Raycaster(),pointer:new THREE.Vector2()});view.setRestaurant(g.config);view.update(1,.016,g);const p=kitchenTarget(g).point;assert.equal(view.world.live.destination.visible,true);assert.equal(view.world.live.destination.position.x,p.x);assert.equal(view.world.live.destination.position.z,p.z);assert.ok(Number.isFinite(view.projectKitchenPoint(p).x));let meshes=0;view.world.live.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(meshes<40);g.kitchen.walkTo(3,1.8);view.update(2,.016,g);assert.equal(view.world.live.footprint.visible,true);for(const state of ['active','side','pause','finished']){g.active=state==='active'?{}:null;g.pendingSide=state==='side'?{}:null;g.paused=state==='pause';g.state=state==='finished'?'finished':'playing';view.updateKitchen(3,.016,g);assert.equal(view.world.live.root.visible,false,state);}
});
