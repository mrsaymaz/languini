import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BistroGame} from '../src/core.mjs';
import {KitchenHUD} from '../src/kitchen-hud.mjs';
import {simpleKitchenAction,simpleKitchenLabel,kitchenWorldActions,kitchenTarget} from '../src/kitchen-signifiers.mjs';
import {documentDouble,Element} from './dom-double.mjs';
import {seeded,solveActive} from './helpers.mjs';
const unit=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)))[0].units[0];
function game(equipped=[]){const g=new BistroGame({grade:5,unit:unit.id,arena:'courtyard',team:'gryffindor',difficulty:'relaxed'},unit.tasks,{liveKitchen:true,rng:seeded(),furnishings:{owned:equipped,equipped}});g.start();g.spawnGuest();return g;}
function arrive(g){let n=0;while(!g.active&&(g.kitchen.pending||g.kitchen.moving||g.run)&&n++<500)g.tick(.1);assert.ok(n<500);}
function ready(g,id=0){const t=g.tables[id];Object.assign(t,{status:'ready',step:0,plan:[],cooked:true,readyAge:0,partySize:1,partyRecipes:[0],partyGuests:[0],readyParts:[0],deliveredParts:[],transitParts:[]});return t;}
test('phone job switches walk to storage before opening the selected English task',()=>{
 const g=game(),k=g.kitchen;k.prepared(g.tables[0]);const tray=k.carry,before=JSON.stringify({tables:g.tables,carry:k.carry,counter:k.counter});const a=simpleKitchenAction(g,'order:1');assert.equal(a.requiresStorage,true);assert.deepEqual(a.point,k.stagePoint(g.tables[1]));assert.equal(JSON.stringify({tables:g.tables,carry:k.carry,counter:k.counter}),before);
 assert.ok(k.commandSimple('order:1'));const pending=k.pending;assert.equal(kitchenTarget(g).label,'Switching jobs…');assert.equal(k.carry,tray);assert.equal(k.counter.length,0);assert.equal(g.active,null);
 g.paused=true;const frozen=JSON.stringify(k.position);g.tick(20);assert.equal(JSON.stringify(k.position),frozen);assert.equal(k.carry,tray);g.paused=false;arrive(g);
 assert.equal(k.carry,null);assert.deepEqual(k.counter,[tray]);assert.equal(g.active.tableId,1);assert.equal(g.runes,0);assert.equal(g.jobs.length,0);k.arrive(pending);assert.deepEqual(k.counter,[tray]);
});
test('stored trays remain selectable and cook only after an explicit Cook action',()=>{
 const g=game(),k=g.kitchen;k.prepared(g.tables[0]);const tray=k.carry;k.commandSimple('order:1');arrive(g);solveActive(g);while(g.active)solveActive(g);
 const a=kitchenWorldActions(g,{simple:true}).find(a=>a.action==='counter:0');assert.ok(a);assert.ok(a.badgePoint.y>1);assert.equal(simpleKitchenLabel(a),'Collect');assert.ok(k.commandSimple(a.action));arrive(g);assert.equal(k.carry,tray);assert.equal(k.counter.length,0);assert.equal(g.jobs.length,0);assert.equal(simpleKitchenLabel(kitchenTarget(g)),'Cook');k.commandSimple('work');arrive(g);assert.equal(k.carry,null);assert.equal(g.jobs.length,1);
});
test('a cooked meal returns to the pass on a job switch without losing or duplicating a plate',()=>{
 const g=game(),k=g.kitchen;ready(g);k.command('pick:0:0');arrive(g);const plated=[...k.plated],clean=k.clean;k.commandSimple('order:1');assert.equal(g.loaded.length,1);arrive(g);assert.equal(g.loaded.length,0);assert.deepEqual([...k.plated],plated);assert.equal(k.clean,clean);assert.equal(g.served,0);assert.equal(g.runes,0);assert.equal(g.active.tableId,1);
 solveActive(g);while(g.active)solveActive(g);k.commandSimple('order:0');arrive(g);assert.equal(g.loaded.length,1);assert.equal(k.clean,clean);assert.equal(simpleKitchenLabel(kitchenTarget(g)),'Serve T1');k.commandSimple('work');arrive(g);assert.equal(g.served,1);assert.equal(k.clean+k.dirty+k.plated.size,k.capacity);
});
test('a full holding counter swaps trays at the counter and never deletes either order',()=>{
 const g=game(),k=g.kitchen;k.prepared(g.tables[0]);const first=k.carry;k.command('counter');arrive(g);k.prepared(g.tables[1]);const second=k.carry;assert.equal(simpleKitchenAction(g,'order:0').storageKind,'swap');k.commandSimple('order:0');assert.equal(k.carry,second);arrive(g);assert.equal(k.carry,first);assert.deepEqual(k.counter,[second]);assert.equal(g.jobs.length,0);
});
test('a full counter rejects unrelated switches and preserves a clear current destination',()=>{
 const g=game(),k=g.kitchen;k.counter.push({kind:'supplies',task:{id:'saved'}});k.prepared(g.tables[0]);const tray=k.carry;assert.equal(k.commandSimple('order:1'),false);assert.match(k.notice,/Counter full/);assert.equal(k.carry,tray);assert.equal(k.counter.length,1);assert.equal(simpleKitchenLabel(kitchenTarget(g)),'Cook');assert.ok(!kitchenWorldActions(g,{simple:true}).some(a=>a.action==='order:1'));
});
test('stored supply crates credit stock and rewards only when explicitly restocked',()=>{
 const g=game(),k=g.kitchen;g.stock=0;k.command('receiving');arrive(g);solveActive(g);const crate=k.carry;assert.equal(crate.kind,'supplies');k.commandSimple('sink');assert.equal(k.carry,crate,'Unavailable washing must not store a crate');k.clean--;k.dirty++;k.commandSimple('sink');arrive(g);assert.deepEqual(k.counter,[crate]);assert.equal(g.stock,0);assert.equal(g.runes,0);solveActive(g);while(k.busy)g.tick(.1);k.commandSimple('counter:0');arrive(g);assert.equal(k.carry,crate);assert.equal(simpleKitchenLabel(kitchenTarget(g)),'Restock');k.commandSimple('work');arrive(g);assert.equal(g.stock,g.maxStock);assert.ok(g.runes>0);
});
test('cancelling or changing a storage walk cannot execute its abandoned job',()=>{
 const g=game(),k=g.kitchen;k.prepared(g.tables[0]);const tray=k.carry;k.commandSimple('order:1');const old=k.pending;k.walkTo(0,0);arrive(g);assert.equal(k.carry,tray);assert.equal(k.counter.length,0);k.arrive(old);assert.equal(k.carry,tray);assert.equal(g.active,null);k.commandSimple('work');arrive(g);assert.equal(g.jobs.length,1);
});
test('stale destination identities and closing state cannot start replacement tasks',()=>{
 const g=game(),k=g.kitchen;k.prepared(g.tables[0]);const tray=k.carry;k.commandSimple('order:1');g.tables[1].orderId++;arrive(g);assert.equal(k.carry,tray);assert.equal(g.active,null);assert.equal(k.counter.length,0);g.closingService=true;assert.equal(k.commandSimple('order:1'),false);
});
test('trolley capacity remains useful without a Return control',()=>{
 const g=game(['trolley']),k=g.kitchen;ready(g);ready(g,1);k.commandSimple('order:0');arrive(g);assert.equal(g.loaded.length,1);assert.equal(simpleKitchenAction(g,'order:1').requiresStorage,undefined);k.commandSimple('order:1');arrive(g);assert.equal(g.loaded.length,2);k.commandSimple('work');arrive(g);assert.equal(g.served,2);assert.equal(k.clean+k.dirty+k.plated.size,k.capacity);
});
test('two stored counter slots have individual Collect actions with no manual storage badges',()=>{
 const g=game(['bench']),k=g.kitchen;for(const t of g.tables.slice(0,2)){k.prepared(t);k.command('counter');arrive(g);}const actions=kitchenWorldActions(g,{simple:true});assert.deepEqual(actions.filter(a=>a.action.startsWith('counter:')).map(a=>a.action).sort(),['counter:0','counter:1']);assert.ok(!actions.some(a=>['stash'].includes(a.lesson)));assert.ok(actions.every(a=>a.label!=='Return meals'&&a.label!=='Set down'));
});
test('a protected restocking request offers only its receiving and pantry route',()=>{
 const g=game(),k=g.kitchen;g.stock=0;k.sideRestock=true;assert.equal(simpleKitchenAction(g,'order:1').available,false);assert.ok(!kitchenWorldActions(g,{simple:true}).some(a=>a.action==='order:1'));assert.equal(k.commandSimple('order:1'),false);assert.equal(k.pending,null);assert.equal(simpleKitchenAction(g,'receiving').available,true);assert.ok(k.commandSimple('receiving'));arrive(g);assert.equal(g.active.purpose,'delivery');
});
test('phone HUD has one main action while desktop retains its station dock',()=>{
 const saved=globalThis.document;globalThis.document=documentDouble();try{const g=game(),k=g.kitchen,root=new Element();globalThis.document.body.append(root);const hud=new KitchenHUD(root,{command:a=>k.commandSimple(a),tea(){}});hud.position=()=>{};k.prepared(g.tables[0]);for(const width of [320,393,759]){hud.update(g,{container:{clientWidth:width}});assert.equal(root.dataset.simple,'true');assert.equal(hud.dock.children.length,1);assert.equal(hud.dock.querySelector('[data-kitchen="work"] .dock-full').textContent,'Cook');assert.ok(!hud.dock.querySelector('[data-kitchen="counter"]'));assert.ok(!hud.dock.querySelector('[data-kitchen="pass"]'));}hud.update(g,{container:{clientWidth:1366}});assert.equal(root.dataset.simple,'false');assert.equal(hud.dock.children.length,6);}finally{globalThis.document=saved;}
});
