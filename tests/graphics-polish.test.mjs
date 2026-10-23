import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {finishGeometry,studioEnvironment} from '../src/geometry-finish.mjs';
import {createRestaurant,RestaurantView} from '../src/restaurant.mjs';
import {createFinishedDish,createFoodLayer} from '../src/food.mjs';
import {createDeliveryPackage} from '../src/delivery-props.mjs';

test('baked form shading preserves every vertex, normal, UV and index used for picking',()=>{
  for(const shape of [new RoundedBoxGeometry(2,1,3,1,.08),new THREE.SphereGeometry(1,12,8),new THREE.CylinderGeometry(.3,.4,.5,14)]){
    const original=shape.clone(),position=Array.from(shape.attributes.position.array),normal=Array.from(shape.attributes.normal.array),uv=Array.from(shape.attributes.uv.array),index=shape.index?Array.from(shape.index.array):null;
    const result=finishGeometry(shape),colors=result.attributes.color;
    assert.equal(result,shape);assert.deepEqual(Array.from(shape.attributes.position.array),position);assert.deepEqual(Array.from(shape.attributes.normal.array),normal);assert.deepEqual(Array.from(shape.attributes.uv.array),uv);assert.deepEqual(shape.index?Array.from(shape.index.array):null,index);
    assert.equal(colors.count,shape.attributes.position.count);assert.ok(colors.array.every(n=>Number.isFinite(n)&&n>=.799&&n<=1));assert.ok(Math.min(...colors.array)<.85);assert.ok(Math.max(...colors.array)>.99);
    const before=new THREE.Box3().setFromBufferAttribute(original.attributes.position),after=new THREE.Box3().setFromBufferAttribute(shape.attributes.position);assert.ok(before.equals(after));assert.equal(finishGeometry(shape).attributes.color,colors);shape.dispose();original.dispose();
  }
});

test('the studio environment is a bounded local texture with no asset URL or per-frame work',()=>{
  const map=studioEnvironment();assert.equal(map.image.width,128);assert.equal(map.image.height,64);assert.equal(map.image.data.byteLength,32768);assert.equal(map.mapping,THREE.EquirectangularReflectionMapping);assert.equal(map.colorSpace,THREE.SRGBColorSpace);assert.equal(map.minFilter,THREE.LinearFilter);
  const pixels=map.image.data;assert.ok(pixels.every(Number.isFinite));let light=0,dark=255;for(let i=0;i<pixels.length;i+=4){light=Math.max(light,pixels[i]);dark=Math.min(dark,pixels[i]);assert.equal(pixels[i+3],255);}assert.ok(light-dark>80);assert.equal(map.source.data.src,undefined);map.dispose();
});

test('all three restaurants retain the mesh budget and complete shading after material batching',()=>{
  for(const arena of ['courtyard','bistro','banquet']){
    const w=createRestaurant({arena});let meshes=0;const shared=new Map();
    w.root.traverse(o=>{if(!o.isMesh)return;meshes++;if(o.material.vertexColors){const colors=o.geometry.attributes.color;assert.ok(colors,arena+' missing baked colours after merge');assert.equal(colors.count,o.geometry.attributes.position.count);assert.ok(colors.array.every(n=>Number.isFinite(n)&&n>=0&&n<=1));}if(o.geometry.userData.shared)shared.set(o.geometry,(shared.get(o.geometry)||0)+1);});
    assert.ok(sceneBudget(w).room.meshes<320,arena+' must retain the existing room budget');assert.ok(sceneBudget(w).exterior.meshes<=50);assert.ok([...shared.values()].some(count=>count>=4),'Repeated character shapes remain shared');assert.equal(w.palette.white.vertexColors,true);assert.ok(w.palette.soup.roughness<w.palette.bread.roughness);assert.ok(w.palette.metal.envMapIntensity>w.palette.cream.envMapIntensity);
  }
});

test('paper packaging uses shared matte finishes instead of ceramic gloss or wooden grain',()=>{
  const p=createRestaurant().palette;
  for(const variant of [0,1,2,5]){const object=createDeliveryPackage(p,variant),materials=new Set();object.traverse(o=>{if(o.isMesh)materials.add(o.material);});assert.ok(materials.has(variant===2?p.carton:p.kraft));}
  assert.ok(p.kraft.roughness>p.white.roughness);assert.ok(p.carton.roughness>p.white.roughness);assert.equal(p.kraft.map,p.cream.map);assert.equal(p.carton.map,p.cream.map);assert.equal(p.kraft.vertexColors,true);
});

test('refined dishes keep their finite scale and use folded leaves and open curved pasta',()=>{
  const p=createRestaurant().palette;for(let i=0;i<9;i++){const meal=createFinishedDish(p,i),bounds=new THREE.Box3().setFromObject(meal);assert.ok(bounds.max.x<=.71&&bounds.min.x>=-.71);assert.ok(bounds.max.y<.75&&bounds.min.y>=-.01);meal.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.geometry.attributes.color.array.every(Number.isFinite));}});}
  const greens=createFoodLayer(p,4,0);assert.ok(greens.children.every(o=>o.geometry.type==='BufferGeometry'));const noodles=createFoodLayer(p,5,0);assert.equal(noodles.children.length,1,'Curved pasta shares one material batch');assert.equal(noodles.children[0].material,p.pasta);
  // Inspect the actual surface instead of relying on a constructor name that
  // is lost when several curved tubes share one buffer. Open ends leave edges
  // with one incident face; a closed solid or a capped tube would fail this.
  const geometry=noodles.children[0].geometry,positions=geometry.attributes.position,edges=new Map(),key=i=>[positions.getX(i),positions.getY(i),positions.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
  for(let i=0;i<positions.count;i+=3){const v=[key(i),key(i+1),key(i+2)];for(let j=0;j<3;j++){const edge=[v[j],v[(j+1)%3]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}}
  assert.ok([...edges.values()].filter(n=>n===1).length>=16,'Pasta retains its uncapped tube ends');assert.equal(geometry.userData.shared,true);assert.equal(createFoodLayer(p,5,0).children[0].geometry,geometry);
});

test('Light mode retains material reflections while omitting dynamic shadows',()=>{
  const map=studioEnvironment(),view=Object.assign(Object.create(RestaurantView.prototype),{scene:new THREE.Scene(),studioMap:map,motionQuery:{matches:false},renderer:{setPixelRatio(){},shadowMap:{}},resize(){},fallback:false});
  const previous=globalThis.window;globalThis.window={devicePixelRatio:2};try{
    view.applySettings({quality:'high'});assert.equal(view.scene.environment,map);assert.equal(view.renderer.shadowMap.enabled,true);
    view.applySettings({quality:'lite'});assert.equal(view.scene.environment,map);assert.equal(view.renderer.shadowMap.enabled,false);
    view.applySettings({quality:'high'});assert.equal(view.scene.environment,map);
  }finally{globalThis.window=previous;map.dispose();}
});
