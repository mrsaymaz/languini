import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame} from '../src/core.mjs';
import {KitchenHUD} from '../src/kitchen-hud.mjs';
import {RestaurantView} from '../src/restaurant.mjs';
import {taskIdentity,tableIdentity,intentIdentity,activeIdentity} from '../src/task-identity.mjs';
import {kitchenAction,kitchenTarget,kitchenWorldActions} from '../src/kitchen-signifiers.mjs';
import {documentDouble,Element} from './dom-double.mjs';
import {seeded} from './helpers.mjs';
const unit=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)))[0].units[0];
function game(){const g=new BistroGame({grade:5,unit:unit.id,arena:'banquet',team:'gryffindor',difficulty:'relaxed'},unit.tasks,{liveKitchen:true,rng:seeded()});g.start();g.spawnGuest();return g;}
function arrive(g){let n=0;while((g.kitchen.pending||g.kitchen.moving||g.run)&&!g.active&&n++<500)g.tick(.1);assert.ok(n<500);}
function luminance(hex){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
function view(g){const v=Object.assign(Object.create(RestaurantView.prototype),{container:{clientWidth:393,clientHeight:740,getBoundingClientRect:()=>({left:0,top:0,width:393,height:740})},reduced:true,menu:false,liveKitchen:true,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}},raycaster:new THREE.Raycaster(),pointer:new THREE.Vector2()});v.setRestaurant(g.config);return v;}
function tags(root){const out=[];root.traverse(o=>{if(o.material?.userData.taskIdentity)out.push({key:o.material.userData.taskIdentity,label:o.material.userData.identityLabel,material:o.material});});return out;}
test('four stable table colours and three shared-task colours carry readable independent identities',()=>{
 const all=[...Array.from({length:4},(_,tableId)=>taskIdentity({tableId})),taskIdentity({pickup:true,orderId:17}),taskIdentity({kind:'wash'}),taskIdentity({kind:'supplies'})];assert.equal(new Set(all.map(v=>v.accent)).size,7);for(const id of all){assert.ok((luminance('#fffdf5')+.05)/(luminance(id.accent)+.05)>=4.5,id.key);assert.ok((luminance(id.tint)+.05)/(luminance(id.accent)+.05)>=4.5,id.key);assert.ok(id.label);}assert.equal(all[4].label,'P17');assert.equal(taskIdentity({tableId:99}).key,'neutral');const a=tableIdentity({id:1,orderId:1}),b=tableIdentity({id:1,orderId:42});assert.equal(a.key,b.key);assert.equal(a.accent,b.accent);a.accent='red';assert.notEqual(tableIdentity({id:1}).accent,'red');
});
test('an order keeps its identity from first task through prepared, stored, cooked and collected states',()=>{
 const g=game(),k=g.kitchen,t=g.tables[1],expected=tableIdentity(t);for(const setting of ['conversation','tablet','recipe','ticket','repair']){Object.assign(t,{status:'preparing',plan:[{setting}],step:0});assert.equal(intentIdentity(g,kitchenAction(g,'order:1')).key,expected.key);}k.prepared(t);assert.equal(intentIdentity(g,kitchenTarget(g)).key,expected.key);k.command('counter');arrive(g);assert.equal(intentIdentity(g,kitchenAction(g,'order:1')).key,expected.key);assert.equal(kitchenWorldActions(g,{simple:true}).find(a=>a.action==='counter:0').count,1);k.command('order:1');arrive(g);assert.equal(intentIdentity(g,kitchenTarget(g)).key,expected.key);k.command('order:1');arrive(g);assert.equal(intentIdentity(g,kitchenAction(g,'order:1')).key,expected.key);assert.equal(g.jobs.length,1);g.jobs=[];Object.assign(t,{status:'ready',plan:[],step:0,cooked:true,readyParts:[0],deliveredParts:[],transitParts:[]});k.command('pick:1:0');arrive(g);assert.equal(intentIdentity(g,kitchenTarget(g)).key,expected.key);
});
test('washing, supplies and pickup identity override incidental table context',()=>{
 const g=game();assert.equal(intentIdentity(g,{action:'sink',tableId:1}).key,'wash');assert.equal(intentIdentity(g,{action:'pantry',tableId:0}).key,'supplies');g.kitchen.counter=[{kind:'supplies'}];assert.equal(intentIdentity(g,{action:'counter:0',lesson:'collect'}).key,'supplies');g.tables[0].pickup=true;assert.equal(intentIdentity(g,{tableId:0}).key,'pickup');for(const [purpose,key]of [['washing','wash'],['delivery','supplies'],['order','pickup']]){g.active={purpose,tableId:0};assert.equal(activeIdentity(g).key,key);}g.active=null;
});
test('phone, tablet and desktop controls expose the same identity without mutating service',()=>{
 const previous=globalThis.document;globalThis.document=documentDouble();try{const g=game(),k=g.kitchen,root=new Element(),hud=new KitchenHUD(root,{command:a=>k.commandSimple(a),tea(){}});globalThis.document.body.append(root);hud.position=()=>{};k.prepared(g.tables[1]);const before=JSON.stringify({tables:g.tables,carry:k.carry,stock:g.stock,runes:g.runes});for(const width of [320,393,768,1024,1366]){hud.update(g,{container:{clientWidth:width}});const ticket=hud.orders.querySelector('[data-kitchen="order:1"]'),work=hud.dock.querySelector('[data-kitchen="work"]');assert.equal(ticket.dataset.taskIdentity,'table1');assert.equal(work.dataset.taskIdentity,'table1');assert.equal(work.querySelector('.job-token').textContent,'T2');assert.equal(root.style['--job-accent'],tableIdentity(g.tables[1]).accent);}assert.equal(JSON.stringify({tables:g.tables,carry:k.carry,stock:g.stock,runes:g.runes}),before);}finally{globalThis.document=previous;}
});
test('3D carried, stored and cooking tags and destination ring keep the table identity',()=>{
 const g=game(),k=g.kitchen,v=view(g),t=g.tables[1];k.prepared(t);const before=JSON.stringify({tables:g.tables,carry:k.carry,stock:g.stock,runes:g.runes});v.update(1,.016,g);assert.equal(tags(v.world.carrier)[0].key,'table1');assert.equal(v.world.live.destination.material.color.getHexString(),tableIdentity(t).accent.slice(1));assert.equal(JSON.stringify({tables:g.tables,carry:k.carry,stock:g.stock,runes:g.runes}),before);k.command('counter');arrive(g);v.update(2,.016,g);assert.equal(tags(v.world.live.holding)[0].key,'table1');k.command('order:1');arrive(g);k.command('order:1');arrive(g);v.update(3,.016,g);assert.equal(tags(v.world.processing)[0].key,'table1');assert.ok(tags(v.world.root).some(t=>t.label==='T1'));const material=tags(v.world.processing)[0].material;let disposed=false;material.addEventListener('dispose',()=>disposed=true);g.jobs=[];v.update(4,.016,g);assert.equal(disposed,true);
});
test('stock crates remain ochre when carried and stored without table attribution',()=>{
 const g=game(),k=g.kitchen,v=view(g);k.received({purpose:'delivery',task:{}});v.update(1,.016,g);assert.equal(tags(v.world.carrier)[0].key,'supplies');k.command('counter');arrive(g);v.update(2,.016,g);assert.equal(tags(v.world.live.holding)[0].key,'supplies');
});
