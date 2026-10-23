import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {RestaurantView,createRestaurant,setTableCustomer} from '../src/restaurant.mjs';import {StationScene} from '../src/station-scene.mjs';import {createFinishedDish} from '../src/food.mjs';import {chefPose,facePose,updateChef,updateCharacterFace} from '../src/character-craft.mjs';import {fitSurfaceCamera,projectSurface,stationViewport} from '../src/object-layout.mjs';import {applySceneLighting} from '../src/scene-lighting.mjs';import {BistroGame} from '../src/core.mjs';import {seeded} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units.find(u=>u.id==='g5u6'),task=unit.tasks.find(t=>t.kind==='sentence'),config={grade:5,unit:unit.id,arena:'bistro',team:'gryffindor',difficulty:'relaxed'};
function cameraFor(s,width,height){const f=fitSurfaceCamera(s.focusSurface,width,height,{setting:'recipe',offset:s.cameraOffset}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.up.copy(f.up);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;}
function viewFor(){const view=Object.assign(Object.create(RestaurantView.prototype),{container:{clientWidth:393,clientHeight:740},menu:false,reduced:true,liveKitchen:true,scene:new THREE.Scene(),renderer:{setSize(){},render(){}},camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90)});view.scene.background=new THREE.Color('#e9dfcb');view.setRestaurant(config);return view;}

test('chef stride moves independent legs while carrying keeps both hands steady and reduced motion settles',()=>{
 const world=createRestaurant(),chef=world.chef;assert.equal(chef.legs.length,2);updateChef(chef,.1,{moving:true,carrying:true});assert.notEqual(chef.legs[0].rotation.x,0);assert.equal(chef.legs[0].rotation.x,-chef.legs[1].rotation.x);const hands=chef.arms.map(a=>a.rotation.x);updateChef(chef,.2,{moving:true,carrying:true});assert.deepEqual(chef.arms.map(a=>a.rotation.x),hands);assert.equal(chef.head.rotation.x,.055);
 updateChef(chef,.2,{moving:true,carrying:true,reduced:true});assert.equal(chef.body.position.y,0);assert.equal(chef.body.rotation.z,0);assert.deepEqual(chef.legs.map(l=>l.rotation.x),[0,-0]);assert.equal(chef.eyes.scale.y,1);
 world.root.updateMatrixWorld(true);const foot=new THREE.Box3().setFromObject(chef.legs[0]);assert.ok(Math.abs(foot.min.y-.08)<.006,'Shoes rest at the tile surface');
 for(let i=0;i<24;i++){setTableCustomer(world,0,i);const c=world.tables[0].guest;updateCharacterFace(c,.13-i*.71,{reduced:true});assert.equal(c.eyes.scale.y,1);assert.ok(c.brows);const pose=facePose(.13,i);assert.ok(pose.eyeY>=.06&&pose.eyeY<=1);}
 assert.ok(facePose(.13).eyeY<.1);assert.equal(chefPose(.1,{carrying:true,reduced:true}).arms[0],-1.42);
});

test('station lighting narrows its shadow view and restores the arena overview without new shadow lights',()=>{
 const view=viewFor();view.sun=new THREE.DirectionalLight();view.fillLight=new THREE.DirectionalLight();view.skyLight=new THREE.HemisphereLight();view.scene.fog=new THREE.Fog('#fff',25,65);applySceneLighting(view);assert.equal(view.sun.shadow.camera.right,8);const background=view.scene.background.getHexString();
 view.focusTask('recipe',0,{task,recipe:0,order:[2,0,1]});assert.ok(view.sun.shadow.camera.right<8);assert.equal(view.scene.environmentIntensity,.35);assert.ok(view.sun.target.position.distanceTo(view.station.focusSurface.mesh.getWorldPosition(new THREE.Vector3()))<1e-8);assert.equal(view.renderer.toneMappingExposure,1.02);
 view.update(1,.016,{tables:[],jobs:[],state:'playing',focused:true,equipped:new Set(),paused:false});assert.equal(view.world.canopy.visible,false);assert.equal(view.world.chef.root.visible,false);view.focusTask(null);assert.equal(view.sun.shadow.camera.right,8);assert.equal(view.scene.environmentIntensity,.29);assert.equal(view.scene.background.getHexString(),background);assert.equal(view.station,null);
});

test('angled preparation grips tools while keeping recipe and sentence ink clear at small portrait and landscape sizes',()=>{
 const world=createRestaurant();let checked=0;
 for(const [width,height]of [[320,480],[393,740],[568,320],[844,390]])for(let recipe=0;recipe<9;recipe++)for(const prepPhase of [0,1,2]){
  const s=new StationScene(world,{setting:'recipe',task,recipe,prepPhase,order:[2,0,1],foodAssignment:[0,1,2],viewport:{width,height}}),camera=cameraFor(s,width,height);assert.ok(s.cameraOffset[2]>4);const work=stationViewport(width,height,'recipe');for(const p of projectSurface(s.focusSurface,camera,width,height))assert.ok(p.x>=work.x-.5&&p.x<=work.x+work.width+.5&&p.y>=work.y-.5&&p.y<=work.y+work.height+.5);
  for(let i=0;i<3;i++){s.addIngredient(i);s.update(.16);world.root.updateMatrixWorld(true);const rig=s.prepTools[i],hands=[];rig.traverse(o=>{if(o.userData.hand)hands.push(o);});assert.equal(hands.length,1);assert.ok(hands[0].userData.contactObject);assert.ok(hands[0].position.length()<.5);
   const meshes=[];for(const tool of s.prepTools)tool?.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});for(const key of ['recipe-note','ingredient-0','ingredient-1','ingredient-2']){const sf=s.surfaces[key];for(const [x,y]of [[0,0],[-.35,-.35],[-.35,.35],[.35,-.35],[.35,.35]]){const p=sf.mesh.localToWorld(new THREE.Vector3(x*sf.width,y*sf.height,.015)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);assert.equal(ray.intersectObjects(meshes,false).length,0,`${width}x${height} recipe ${recipe} hand over ${key} at ${x},${y}`);}}
   s.update(.5);checked++;
  }s.dispose();
 }assert.equal(checked,324);
});

test('completed preparation retains the exact food geometry used for serving all nine dishes',()=>{
 const world=createRestaurant();for(let recipe=0;recipe<9;recipe++)for(const prepPhase of [0,1,2]){
  const s=new StationScene(world,{setting:'recipe',task,recipe,prepPhase,order:[2,0,1],foodAssignment:[2,0,1],viewport:{width:393,height:740}});for(let i=0;i<3;i++){s.addIngredient(i);s.update(.5);}assert.ok(s.autoFinished);
  const canonical=createFinishedDish(world.palette,recipe);for(let layer=prepPhase*3;layer<(prepPhase+1)*3;layer++){const prepared=s.plated.find(g=>g.children[0]?.userData.layer===layer)?.children[0],served=canonical.children.find(g=>g.userData.layer===layer);assert.ok(prepared&&served);const a=[],b=[];prepared.traverse(o=>{if(o.isMesh)a.push(o.geometry.uuid+':'+o.material.uuid);});served.traverse(o=>{if(o.isMesh)b.push(o.geometry.uuid+':'+o.material.uuid);});assert.deepEqual(a,b);}
  s.dispose();
 }
});

test('served meal moves from the actual tray to the table, pauses and settles without modifying the game',()=>{
 const g=new BistroGame(config,unit.tasks,{liveKitchen:true,rng:seeded()});g.start();const t=g.tables[0],view=viewFor();t.deliveredParts=[0];t.status='leaving';t.cooldown=2;g.kitchen.position={x:t.id+1,z:1.2};view.update(1,.016,g);view.world.carrier.visible=true;view.world.root.updateMatrixWorld(true);const from=view.world.carrier.getWorldPosition(new THREE.Vector3()),snapshot=JSON.stringify({tables:g.tables,elapsed:g.elapsed,stock:g.stock,runes:g.runes});view.reduced=false;view.sendChef({type:'served',table:0});assert.equal(view.world.tables[0].serving,0);assert.ok(view.world.tables[0].servingFrom.distanceTo(from)<1e-8);view.update(1.1,.1,g);assert.ok(view.world.tables[0].serving>0&&view.world.tables[0].serving<1);g.paused=true;const at=view.world.tables[0].foodRoot.position.clone();view.update(1.2,.2,g);assert.ok(view.world.tables[0].foodRoot.position.distanceTo(at)<1e-8);g.paused=false;view.update(2,1,g);const model=view.world.tables[0];assert.equal(model.serving,undefined);assert.ok(model.foodRoot.position.distanceTo(new THREE.Vector3(model.x,1.10,model.z))<1e-8);assert.equal(model.foodRoot.scale.x,.75);assert.equal(model.foodRoot.rotation.z,0);assert.equal(JSON.stringify({tables:g.tables,elapsed:g.elapsed,stock:g.stock,runes:g.runes}),snapshot);
});
