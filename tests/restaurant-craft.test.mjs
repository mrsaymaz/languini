import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createRestaurant,RestaurantView} from '../src/restaurant.mjs';
import {BistroGame} from '../src/core.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {StationFeedback} from '../src/station-feedback.mjs';
import {STATION_VISUALS,ARENA_VISUALS,PROJECT_VISUALS,ticketStateIcon} from '../src/presentation.mjs';
import {icon,ICON_NAMES} from '../src/icons.mjs';
import {TASK_SETTINGS} from '../src/tasks.mjs';
import {CATALOG} from '../src/service-design.mjs';
import {PROJECTS} from '../src/refurbishment.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {fitSurfaceCamera} from '../src/object-layout.mjs';
import {seeded} from './helpers.mjs';
const unit=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)))[0].units[0],sentence=unit.tasks.find(t=>t.kind==='sentence'),config={grade:5,unit:unit.id,arena:'bistro',team:'gryffindor',difficulty:'relaxed'};
const context=(recipe=0)=>({setting:'recipe',task:sentence,recipe,order:[2,0,1],foodAssignment:[0,1,2],viewport:{width:393,height:740}});

test('station, arena, shop and ticket controls resolve to one complete semantic icon family',()=>{
 for(const [id,visual]of Object.entries(STATION_VISUALS)){assert.ok(ICON_NAMES.includes(visual.icon),id);assert.equal(TASK_SETTINGS[id].icon,visual.icon);assert.match(icon(visual.icon),new RegExp('data-glyph="'+visual.icon+'"'));}
 for(const visual of [...Object.values(ARENA_VISUALS),...Object.values(PROJECT_VISUALS),...CATALOG])assert.ok(ICON_NAMES.includes(visual.icon));
 assert.notEqual(icon('sink'),icon('cup'));assert.notEqual(icon('counter'),icon('toast'));assert.notEqual(ticketStateIcon('cooking'),ticketStateIcon('ready'));
 for(const kind of ['question','vocabulary','sentence','completion','repair']){const task=unit.tasks.find(t=>t.kind===kind),html=taskMarkup(task,{options:task.options||[]});assert.ok(html.includes('data-glyph='));assert.ok(!html.includes('Take receipt'));}
});

test('particle feedback remains bounded after repeated actions, clears on reduced motion and releases its resources',()=>{
 const root=new THREE.Group(),fx=new StationFeedback(root);for(let i=0;i<30;i++){fx.emit('crumbs',new THREE.Vector3(1,2,3));fx.emit('steam',new THREE.Vector3(1,2,3));}
 assert.equal(fx.batches.size,2);assert.equal(fx.root.children.length,2);assert.equal(fx.batches.get('crumbs').mesh.count,10);assert.equal(fx.batches.get('steam').mesh.count,8);assert.equal(fx.batches.get('steam').mesh.material.depthWrite,false);
 for(const b of fx.batches.values())assert.ok(b.mesh.instanceMatrix.array.every(Number.isFinite));
 fx.update(.2);assert.ok(fx.batches.get('crumbs').particles.every(p=>p.age===.2));fx.update(0,true);assert.ok([...fx.batches.values()].every(b=>!b.mesh.visible&&b.particles.length===0));
 const stamp=fx.stamp(root,new THREE.Vector3(),1);fx.update(0,true);assert.equal(stamp.scale.x,1);assert.equal(fx.stamps.length,0);
 let disposed=0;const count=fx.geometries.size+fx.materials.size;for(const resource of [...fx.geometries,...fx.materials])resource.addEventListener('dispose',()=>disposed++);fx.dispose();assert.equal(disposed,count);assert.equal(fx.root.parent,null);
});

test('real preparation emits crumbs for bread and steam for hot broth, with silent restoration',()=>{
 const world=createRestaurant(config),bread=new StationScene(world,context());bread.addIngredient(0);bread.update(.30);assert.equal(bread.feedbackFx,undefined);bread.update(.12);assert.ok(bread.feedbackFx.batches.get('crumbs').mesh.visible);bread.update(1);assert.equal(bread.feedbackFx.batches.get('crumbs').mesh.visible,false);
 bread.addIngredient(1);bread.update(.3);bread.update(.12);assert.equal(bread.feedbackFx.batches.get('crumbs').mesh.visible,false,'Vegetable filling does not produce bread crumbs');
 const soup=new StationScene(world,context(1));soup.addIngredient(1);soup.update(.3);soup.update(.18);assert.ok(soup.feedbackFx.batches.get('steam').mesh.visible);assert.equal(soup.feedbackFx.batches.has('crumbs'),false);
 const restored=new StationScene(world,context());restored.restoring=true;restored.addIngredient(0);restored.restoring=false;restored.update(.3);restored.update(.06);assert.equal(restored.feedbackFx,undefined,'Accepted food restored after rotation does not replay a success burst');bread.dispose();soup.dispose();restored.dispose();
});

test('delivery approval seal stamps once and remains fully formed on restored packages',()=>{
 const world=createRestaurant(config),task=unit.tasks.find(t=>t.kind==='vocabulary'),s=new StationScene(world,{setting:'delivery',task,options:task.options,viewport:{width:393,height:740}});
 s.react('label',task.answer);const seal=s.approvalSeal;assert.ok(seal?.userData.approvalSeal);assert.ok(seal.scale.x<seal.userData.finalScale);s.react('label',task.answer);assert.ok(s.approvalSeal===seal);assert.equal(s.feedbackFx.stamps.length,1);s.update(.3);assert.equal(seal.scale.x,seal.userData.finalScale);assert.equal(s.feedbackFx.stamps.length,0);
 const restored=new StationScene(world,{setting:'delivery',task,options:task.options,viewport:{width:844,height:390}});restored.restoring=true;restored.react('label',task.answer);assert.equal(restored.feedbackFx.stamps.length,0);assert.equal(restored.approvalSeal.scale.x,restored.approvalSeal.userData.finalScale);s.dispose();restored.dispose();
});

test('station feedback freezes during pause and overview steam follows real hot cooking jobs',()=>{
 const game=new BistroGame(config,unit.tasks,{rng:seeded()});game.start();const world=createRestaurant(config),view=Object.assign(Object.create(RestaurantView.prototype),{world,reduced:false,menu:false,renderer:{render(){}},scene:{},camera:{},focus:null});let updates=0;view.station={update(){updates++;}};
 game.paused=true;view.update(0,.1,game);assert.equal(updates,0);game.paused=false;view.update(.1,.1,game);assert.equal(updates,1);assert.ok(world.steamPuffs.every(p=>!p.visible));
 game.jobs=[{slot:1,recipe:1,tableId:0,orderId:game.tables[0].orderId,part:0}];const before=JSON.stringify({jobs:game.jobs,tables:game.tables,elapsed:game.elapsed,runes:game.runes});view.update(.2,.016,game);assert.ok(world.steamPuffs.every(p=>p.visible&&Math.abs(p.position.x-world.plan.cookingSlots[1][0])<.13));assert.equal(JSON.stringify({jobs:game.jobs,tables:game.tables,elapsed:game.elapsed,runes:game.runes}),before);
 game.jobs[0].recipe=2;view.update(.3,.016,game);assert.ok(world.steamPuffs.every(p=>!p.visible),'A cold yoghurt job has no steam');game.jobs[0].recipe=1;game.paused=true;view.update(.4,.016,game);assert.ok(world.steamPuffs.every(p=>!p.visible));
});

test('all arena renovation stages add visible structure within the room and exterior mesh budgets',()=>{
 const signatures=[];for(const arena of ['courtyard','bistro','banquet']){let previous=0;for(const stage of [0,1,2,3]){
  const finish=['wood','ivory','team','ivory'][stage],world=createRestaurant({arena,projects:{finish,items:Object.fromEntries(PROJECTS.map(p=>[p.id,{stage,meals:18}]))}});let meshes=0,vertices=0;world.root.traverse(o=>{if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.material.vertexColors)assert.ok(o.geometry.attributes.color?.count===o.geometry.attributes.position.count);}});
  assert.ok(sceneBudget(world).room.meshes<(stage?350:320),arena+' '+stage+' bounded room draw objects');assert.ok(sceneBudget(world).exterior.meshes<=50);assert.ok(vertices>previous,arena+' stage '+stage+' adds actual geometry');previous=vertices;assert.equal(world.bench.visible,stage===3);assert.equal(world.trolley.visible,stage===3);
  if(stage===0){const floor=world.environment.children.find(o=>o.isInstancedMesh);signatures.push(world.palette.green.color.getHexString()+':'+Array.from(floor.instanceColor.array).slice(0,18).join(','));assert.equal(world.arenaIdentity.arena,arena);}
 }}assert.equal(new Set(signatures).size,3);
});

test('fully upgraded warming equipment leaves ticket and receipt ink clear across arenas and viewports',()=>{
 let cases=0;for(const arena of ['courtyard','bistro','banquet']){
  const world=createRestaurant({arena,projects:{items:Object.fromEntries(PROJECTS.map(p=>[p.id,{stage:3,meals:18}]))},furnishings:{owned:['pantry','warmer'],equipped:['pantry','warmer']}});
  for(const setting of ['ticket','repair'])for(const [width,height]of [[320,480],[393,740],[844,390],[1024,600]]){
   const task=unit.tasks.find(t=>t.kind===(setting==='ticket'?'completion':'repair')),s=new StationScene(world,{setting,task,options:task.options,viewport:{width,height}}),sf=s.focusSurface,f=fitSurfaceCamera(sf,width,height,{setting,offset:s.cameraOffset}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.up.copy(f.up);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();world.root.updateMatrixWorld(true);
   const meshes=[];world.root.traverseVisible(o=>{if(!o.isMesh||o.material.visible===false)return;let n=o;while(n){if(n===s.clip)return;n=n.parent;}meshes.push(o);});
   for(const x of [-.35,0,.35])for(const y of [-.35,0,.2]){const p=sf.mesh.localToWorld(new THREE.Vector3(x*sf.width,y*sf.height,.014)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const first=ray.intersectObjects(meshes,false)[0]?.object;assert.ok(first===sf.mesh,arena+' '+setting+' '+width+'x'+height+' ink blocked by '+first?.material?.color?.getHexString());}
   if(setting==='ticket')assert.equal(world.warmer.visible,false);s.dispose();assert.equal(world.warmer.visible,true,'Equipment returns when leaving the task');cases++;
  }
 }assert.equal(cases,24);
});
