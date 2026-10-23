import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRestaurant} from '../src/restaurant.mjs';
import {restaurantLayout} from '../src/restaurant-layout.mjs';
import {createAtmosphereRain} from '../src/cafe-craft.mjs';
import {floorColor} from '../src/arena-craft.mjs';
import {ARENA_LIGHTING,ATMOSPHERE_LIGHTING,applySceneLighting,hazeColor} from '../src/scene-lighting.mjs';
const luminance=hex=>{const c=new THREE.Color(hex);return .2126*c.r+.7152*c.g+.0722*c.b;};

test('the gameplay overview has a stronger key against the sky; close-ups and the opening film keep their balance',()=>{
 for(const [arena,p]of Object.entries(ARENA_LIGHTING)){assert.ok(p.overview.keyPower/p.overview.skyPower>p.keyPower/1.45+.6,arena);}
 const view=()=>({sun:new THREE.DirectionalLight(),fillLight:new THREE.DirectionalLight(),skyLight:new THREE.HemisphereLight(),scene:new THREE.Scene(),renderer:{toneMappingExposure:1},world:{arenaInfo:{id:'courtyard'},atmosphere:'breakfast'}});
 const overview=view();overview.scene.background=new THREE.Color();applySceneLighting(overview);assert.equal(overview.sun.intensity,ARENA_LIGHTING.courtyard.overview.keyPower);assert.equal(overview.skyLight.intensity,ARENA_LIGHTING.courtyard.overview.skyPower);
 const story=view();story.story=true;story.scene.background=new THREE.Color();applySceneLighting(story);assert.equal(story.sun.intensity,ARENA_LIGHTING.courtyard.keyPower);assert.equal(story.skyLight.intensity,1.45);
 const close=view();close.focus={setting:'recipe'};close.scene.background=new THREE.Color();applySceneLighting(close);assert.equal(close.sun.intensity,2.65);assert.equal(close.skyLight.intensity,1.35);
 const rain=view();rain.world.atmosphere='rain';rain.scene.background=new THREE.Color();applySceneLighting(rain);assert.equal(rain.sun.intensity,ATMOSPHERE_LIGHTING.rain.keyPower);
});
test('floor tiles sit below the cream furniture and pavement in value',()=>{
 const p=createRestaurant().palette,cream=luminance('#'+p.cream.color.getHexString());
 for(const arena of ['courtyard','bistro','banquet'])for(let i=0;i<11;i++)for(let j=0;j<11;j++)assert.ok(luminance(floorColor(arena,i,j))<cream-.08,`${arena} ${i},${j}`);
});
test('distant shops fade towards the weather haze, cast no shadows and leave the room palette untouched',()=>{
 for(const [arena,atmosphere]of [['courtyard','breakfast'],['bistro','rain'],['banquet','evening']]){
  const w=createRestaurant({arena,atmosphere}),far=w.neighbourhood.far,haze=new THREE.Color(hazeColor(arena,atmosphere));let meshes=0;
  far.traverse(o=>{if(!o.isMesh||o.material.transparent)return;meshes++;assert.equal(o.material.userData.haze,true);assert.equal(o.castShadow,false);});
  assert.ok(meshes>0);
  const cream=w.palette.cream.color;assert.equal(cream.getHexString(),'f5ecd8','The room keeps its own cream');
  const hazed=[...new Set((()=>{const m=[];far.traverse(o=>{if(o.isMesh&&o.material.userData.haze)m.push(o.material);});return m;})())];
  for(const m of hazed){const expected=new THREE.Color(m.userData.hazeFrom).lerp(haze,.45);assert.ok(Math.abs(expected.r-m.color.r)+Math.abs(expected.g-m.color.g)+Math.abs(expected.b-m.color.b)<1e-6,arena);}
 }
});
test('the big sun is a setup-view prop; window suns, clouds and fading beams stay during play',()=>{
 const root=new THREE.Group(),plan=restaurantLayout('courtyard'),w=createAtmosphereRain(root,{},plan,'breakfast');
 const sun=[];w.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='IcosahedronGeometry'&&o.material.color.getHexString()==='ffe390')sun.push(o);});assert.equal(sun.length,1);
 w.update(1,true);assert.equal(sun[0].visible,true,'Setup shows the sun');
 w.update(1,true,{menu:false});assert.equal(sun[0].visible,false,'A shift hides it');
 const beams=[];w.group.traverse(o=>{if(o.isMesh&&o.geometry.attributes.color?.itemSize===4)beams.push(o);});assert.equal(beams.length,3);
 for(const b of beams){const a=b.geometry.attributes.color.array;assert.deepEqual([a[3],a[7],a[11],a[15]],[1,1,0,0],'Each beam fades away from the window');assert.equal(b.material.vertexColors,true);assert.equal(b.material.transparent,true);}
 for(const c of w.clouds){assert.ok(c.position.y>3,'Clouds float above the tree line');assert.ok(Math.abs(c.position.x)>5.12+plan.venue.extraWidth/2,'Clouds stay outside the walls');}
 w.dispose();
 for(const mood of ['rain','evening']){const m=createAtmosphereRain(new THREE.Group(),{},plan,mood);let big=0;m.group.traverse(o=>{if(o.isMesh&&o.geometry.type==='IcosahedronGeometry'&&o.material.color?.getHexString()==='ffe390')big++;});assert.equal(big,0,mood+' has no big sun');m.dispose();}
});
