import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {verifyPreservation} from '../scripts/verify-preservation.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {createFinishedDish} from '../src/food.mjs';
import {fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {terminalPageLayout} from '../src/page-fit.mjs';
import {polygonDistance,placementTarget} from '../src/pointer-placement.mjs';
import {FrameBudget,renderQuality} from '../src/render-quality.mjs';
import {BistroAudio} from '../src/audio.mjs';
import {SAVE_KEY,loadProfile,saveProfile} from '../src/core.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
const sizes=[[320,480],[320,568],[360,640],[393,740],[390,844],[430,850],[568,320],[667,375],[844,390],[1024,600],[1366,768]];
const fonts=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url)));
function screen(scene,width,height){const f=fitSurfaceCamera(scene.focusSurface,width,height,{setting:scene.context.setting,offset:scene.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.up.copy(f.up);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();return c;}

test('the release preserves every protected content byte and exact curriculum catalog',async()=>{assert.deepEqual(await verifyPreservation(),{protectedFiles:13,units:44,preservedTasks:3033,tasks:4805,conversations:921});});

test('all ticket and register stages fit projected pages with measured fonts and real clip clearance',()=>{
  const world=createRestaurant();let states=0;
  for(const font of fonts){const measure=(t,n)=>Array.from(t).reduce((a,c)=>a+(font.advances[c]??.7)*n,0);
    for(const [width,height]of sizes)for(const kind of ['repair','completion']){
      const task=tasks.find(t=>t.kind===kind),s=new StationScene(world,{setting:kind==='repair'?'repair':'ticket',task,options:task.options,viewport:{width,height}}),camera=screen(s,width,height),corners=projectSurface(s.focusSurface,camera,width,height),r=surfaceTransform(corners);
      const clip=kind==='completion'?Math.max(48,Math.max(...projectSurface(s.surfaces.clip,camera,width,height).map(p=>p.y))-Math.min(...corners.map(p=>p.y))-2):0;
      if(kind==='completion'){const touch=surfaceTransform(projectSurface(s.surfaces.clip,camera,width,height));assert.ok(touch.height>=44&&touch.height<=54,'Clip has a consistent phone touch height');assert.ok(clip<60,'Clip must not consume half a landscape page');}
      for(const t of tasks.filter(t=>t.kind===kind))for(const stage of kind==='repair'?['find','clear','replace','print']:['choose','send']){
        const p=terminalPageLayout({width:r.width-2,height:r.height-2,task:t,options:t.options,stage,clip,measure});assert.ok(p.fits,`${font.name} ${width}×${height} ${t.id} ${stage}`);assert.ok(p.font>=14.5&&p.used<=r.height-2);if(p.action)assert.equal(p.action,44);if(p.choicesHeight)assert.ok(p.choiceHeight>=44);states++;
      }s.dispose();
    }
  }assert.equal(states,34408);
});

test('finished preparation and served meals have the same layer geometry and placement for all nine dishes',()=>{
  const world=createRestaurant(),task=tasks.find(t=>t.kind==='sentence');
  for(let recipe=0;recipe<9;recipe++){
    const s=new StationScene(world,{setting:'recipe',task,recipe,prepPhase:2,order:[2,0,1],foodAssignment:[2,0,1],viewport:{width:393,height:740}});
    for(const i of [0,1,2])s.addIngredient(i);s.update(.5);s.update(.5);assert.ok(s.autoFinished);assert.equal(s.contents.children.length,4);assert.ok(s.plated.every(g=>g.parent===s.contents));
    function signature(root){root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),out=[];root.traverse(o=>{if(!o.isMesh)return;const matrix=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld);out.push([o.geometry.uuid,o.material.uuid,matrix.elements.map(n=>+n.toFixed(5)||0)]);});return out.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));}
    const prepared=s.contents.clone();prepared.position.set(0,0,0);prepared.scale.set(1,1,1);
    const meal=createFinishedDish(world.palette,recipe);meal.children[0].removeFromParent();for(const layer of meal.children)layer.position.y-=s.dish.container==='plate'?.065:0;
    assert.deepEqual(signature(prepared),signature(meal),s.dish.name);assert.ok(s.trays.every(t=>t.paper.mesh.visible&&!t.asset.visible));s.dispose();
  }
});

test('ordinary scenes remain below the existing mesh budget while arena details stay distinct',()=>{
  const counts=[];for(const arena of ['courtyard','bistro','banquet']){const w=createRestaurant({arena});let meshes=0;w.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(sceneBudget(w).room.meshes<320);assert.ok(sceneBudget(w).exterior.meshes<=50);assert.equal(w.palette.cream.roughness,.96);assert.ok(w.palette.white.roughness<w.palette.cream.roughness);const contact=w.environment.children.find(o=>o.material?.userData.contact);assert.ok(contact&&!contact.castShadow&&!contact.receiveShadow);counts.push(meshes);}assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]);
});

test('a tilted destination rejects the empty corners of its bounding box',()=>{
  const polygon=[{x:100,y:0},{x:200,y:100},{x:100,y:200},{x:0,y:100}],node={getBoundingClientRect:()=>({left:0,top:0,right:200,bottom:200})};
  assert.equal(polygonDistance({x:100,y:100},polygon),0);assert.ok(polygonDistance({x:10,y:10},polygon)>50);
  assert.equal(placementTarget([{node,polygon}],[{x:10,y:10}],{padding:14}),null);assert.ok(placementTarget([{node,polygon}],[{x:100,y:100}],{padding:14}));
});

test('light graphics respect weak hardware and auto degrades only after sustained slow frames',()=>{
  assert.equal(renderQuality('auto',{pixelRatio:3,memory:4,cores:8}).shadows,false);assert.equal(renderQuality('high',{pixelRatio:3,memory:2,cores:2}).pixelRatio,2);assert.ok(renderQuality('lite',{pixelRatio:3}).pixelRatio<=1.5);
  const budget=new FrameBudget();for(let i=0;i<200;i++)assert.equal(budget.add(1/60),false);assert.equal(budget.report().frameP95Ms,16.67);
  let degraded=false;for(let i=0;i<360;i++)degraded||=budget.add(.04);assert.equal(degraded,true);const before=budget.report().samples;budget.add(8);assert.equal(budget.report().samples,before,'Backgrounding does not masquerade as frame cost');
});

test('old saves retain progress and accept optional graphics settings without changing save identity',()=>{
  const old={version:1,wallets:{'5:gryffindor':190},upgrades:{'5:gryffindor':{comfort:2}},practice:{'5:g5u1':{seen:['q1'],last:'q1'}},furnishings:{'5:gryffindor':{owned:['pantry'],equipped:['pantry']}},settings:{music:false,speech:true}},memory=new Map([[SAVE_KEY,JSON.stringify(old)]]),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
  const p=loadProfile(storage);assert.equal(p.wallets['5:gryffindor'],190);assert.deepEqual(p.practice,old.practice);assert.deepEqual(p.furnishings,old.furnishings);assert.equal(p.settings.quality,'auto');p.settings.quality='lite';p.settings.motion='reduced';assert.ok(saveProfile(storage,p));const restored=loadProfile(storage);assert.equal(restored.version,1);assert.equal(restored.settings.quality,'lite');assert.equal(restored.settings.motion,'reduced');assert.equal(restored.upgrades['5:gryffindor'].comfort,2);
});

test('a broken voice list and a lost speech callback resolve safely, cancelling the timed-out utterance',async()=>{
  const previous={window:globalThis.window,utterance:globalThis.SpeechSynthesisUtterance,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};let watchdog,cancels=0;
  try{globalThis.window={speechSynthesis:{getVoices(){throw Error('Voice service unavailable');},cancel(){cancels++;},speak(){}}};globalThis.SpeechSynthesisUtterance=class{};const a=new BistroAudio({speech:true});assert.equal((await a.speak('hello')).reason,'error');assert.equal(a.speaking,false);
    window.speechSynthesis.getVoices=()=>[];globalThis.setTimeout=fn=>{watchdog=fn;return 1;};globalThis.clearTimeout=()=>{};const pending=a.speak('A lost voice callback.');assert.equal(a.speaking,true);watchdog();assert.equal((await pending).reason,'timeout');assert.equal(a.pendingSpeech,null);assert.equal(a.speaking,false);assert.ok(cancels>=3);
  }finally{globalThis.window=previous.window;globalThis.SpeechSynthesisUtterance=previous.utterance;globalThis.setTimeout=previous.setTimeout;globalThis.clearTimeout=previous.clearTimeout;}
});

test('notched portrait and landscape layouts retain complete terminal content and physical clip controls',()=>{
  const previous={document:globalThis.document,style:globalThis.getComputedStyle};let inset;
  globalThis.document={documentElement:{},getElementById:()=>null,createElement:()=>({getContext:()=>null})};globalThis.getComputedStyle=()=>({getPropertyValue:k=>inset?.[k]||'0px'});
  try{const world=createRestaurant();for(const [width,height,values]of [[393,740,{'--bistro-safe-top':'47px','--bistro-safe-bottom':'34px'}],[844,390,{'--bistro-safe-left':'47px','--bistro-safe-right':'47px','--bistro-safe-bottom':'21px'}]]){
    inset=values;for(const kind of ['completion','repair']){
      const task=tasks.filter(t=>t.kind===kind).sort((a,b)=>b.prompt.length-a.prompt.length)[0],s=new StationScene(world,{setting:kind==='repair'?'repair':'ticket',task,options:task.options,viewport:{width,height}}),c=screen(s,width,height),corners=projectSurface(s.focusSurface,c,width,height),r=surfaceTransform(corners),clip=kind==='completion'?Math.max(48,Math.max(...projectSurface(s.surfaces.clip,c,width,height).map(p=>p.y))-Math.min(...corners.map(p=>p.y))-2):0;
      for(const stage of kind==='repair'?['find','clear','replace','print']:['choose','send'])assert.ok(terminalPageLayout({width:r.width-2,height:r.height-2,task,options:task.options,stage,clip}).fits);
      assert.ok(corners.every(p=>p.y>=60&&p.y<=height-(height>width?34:21)));s.dispose();
    }
  }}finally{globalThis.document=previous.document;globalThis.getComputedStyle=previous.style;}
});
