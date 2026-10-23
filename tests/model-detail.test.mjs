import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRestaurant} from '../src/restaurant.mjs';
import {createChef,chefPose,updateChef} from '../src/character-craft.mjs';
import {createFinishedDish,createFoodLayer,createVessel} from '../src/food.mjs';
import {RECIPES} from '../src/menu.mjs';
function count(root){let meshes=0,triangles=0;root.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));if(o.material.vertexColors)assert.equal(o.geometry.attributes.color.count,o.geometry.attributes.position.count);});return {meshes,triangles};}

test('detailed chef keeps the reach rig, face controls, identity proportions and batched mobile budget',()=>{
 const w=createRestaurant(),c=createChef(w.palette),n=count(c.root),b=new THREE.Box3().setFromObject(c.root);assert.equal(c.head.position.y,1.09);assert.deepEqual(c.arms.map(a=>a.position.toArray()),[[-.245,.8,0],[.245,.8,0]]);assert.equal(c.eyes.position.y,.018);assert.ok(b.max.y<1.64&&b.min.y>-.06);assert.ok(n.triangles>20000&&n.triangles<36000);assert.ok(n.meshes<=25,'No extra draw object per clothing seam');
 for(const options of [{moving:true},{carrying:true},{busy:true},{moving:true,busy:true,reduced:true}]){const pose=chefPose(1.13,options);updateChef(c,1.13,options);assert.equal(c.arms[0].rotation.x,pose.arms[0]);assert.equal(c.legs[1].rotation.x,pose.legs[1]);}
});
test('smoother serving vessels retain the exact full-size plate footprint and cache shared geometry',()=>{
 const p=createRestaurant().palette;for(const kind of ['plate','bowl','pot']){const a=createVessel(p,kind),b=createVessel(p,kind);assert.equal(a.children[0].geometry,b.children[0].geometry);assert.equal(a.children[0].geometry.userData.shared,true);assert.ok(count(a).triangles<9000);if(kind==='plate'){const bounds=new THREE.Box3().setFromObject(a);assert.ok(Math.abs(bounds.max.x-.46)<1e-6);assert.ok(Math.abs(bounds.min.x+.46)<1e-6);assert.ok(bounds.max.y<.083);}}
});
test('all 81 ingredient layers reuse bounded material batches with their ingredient semantics intact',()=>{
 const p=createRestaurant().palette;for(let dish=0;dish<9;dish++)for(let layer=0;layer<9;layer++){const a=createFoodLayer(p,dish,layer),b=createFoodLayer(p,dish,layer);assert.equal(a.userData.ingredient,RECIPES[dish].layers[layer]);assert.equal(a.userData.layer,layer);const n=count(a);assert.ok(n.meshes<=6,`${dish}:${layer} batches`);assert.ok(n.triangles<6500,`${dish}:${layer} geometry`);assert.equal(a.children[0].geometry,b.children[0].geometry);assert.equal(a.children[0].geometry.userData.shared,true);}
 for(let i=0;i<9;i++){const n=count(createFinishedDish(p,i));assert.ok(n.triangles<24000);assert.ok(n.meshes<28);}
});
test('three restaurant scenes keep bounded scenery, weather and geometry including hidden food and walking legs',()=>{
 for(const arena of ['courtyard','bistro','banquet']){const w=createRestaurant({arena}),n=count(w.root);const budget=sceneBudget(w);assert.ok(budget.room.meshes<320);assert.ok(budget.room.triangles<255000);assert.ok(budget.exterior.meshes<=50);assert.ok(budget.exterior.triangles<25000);assert.ok(n.triangles<275000,`${arena}: ${n.triangles}`);assert.equal(w.plan.fixtures.some(f=>f.id==='checkout'),true);}
});
