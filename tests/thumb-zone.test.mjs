import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {terminalPageLayout} from '../src/page-fit.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
const font=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url)))[0],measure=(t,n)=>Array.from(t).reduce((a,c)=>a+(font.advances[c]??.7)*n,0);
const phones=[[320,480],[320,568],[360,640],[393,740],[390,844],[430,850],[568,320],[667,375],[844,390]];
function page(world,kind,width,height){
 const task=tasks.find(t=>t.kind===kind),s=new StationScene(world,{setting:kind==='repair'?'repair':'ticket',task,options:task.options,viewport:{width,height}});
 const f=fitSurfaceCamera(s.focusSurface,width,height,{setting:s.context.setting,offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.up.copy(f.up);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();
 const corners=projectSurface(s.focusSurface,c,width,height),r=surfaceTransform(corners),clip=kind==='completion'?Math.max(48,Math.max(...projectSurface(s.surfaces.clip,c,width,height).map(p=>p.y))-Math.min(...corners.map(p=>p.y))-2):0;
 s.dispose();return {width:r.width-2,height:r.height-2,clip};
}

test('touch tickets and checkouts grow their text without losing a fit on any phone size',()=>{
 const world=createRestaurant(),portrait={};
 for(const [width,height]of phones)for(const kind of ['repair','completion']){
  const r=page(world,kind,width,height);
  for(const t of tasks.filter(t=>t.kind===kind))for(const stage of kind==='repair'?['find','clear','replace','print']:['choose','send']){
   const desk=terminalPageLayout({...r,task:t,options:t.options,stage,measure}),touch=terminalPageLayout({...r,task:t,options:t.options,stage,touch:true,measure});
   assert.ok(touch.fits,`${width}×${height} ${t.id} ${stage}`);assert.ok(touch.font>=desk.font);assert.ok(touch.used<=r.height);if(touch.choicesHeight)assert.ok(touch.choiceHeight>=44);
   if(width===393&&height===740)(portrait[kind]||=[]).push(touch.font);
  }
 }
 for(const [kind,list]of Object.entries(portrait))assert.ok(list.reduce((a,b)=>a+b,0)/list.length>=20,kind+' text should grow on a 393×740 phone');
});
test('desktop layouts keep the 18px ceiling',()=>{
 const t=tasks.find(t=>t.kind==='completion');assert.equal(terminalPageLayout({width:600,height:900,task:t,options:t.options,stage:'choose',clip:48,measure}).font,18);
 assert.equal(terminalPageLayout({width:600,height:900,task:t,options:t.options,stage:'choose',clip:48,touch:true,measure}).font,24);
});
