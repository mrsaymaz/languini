import {receiptReadMilliseconds} from '../src/receipt-reading.mjs';
import {receiptPageLayout} from '../src/page-fit.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
function sameObject(actual,expected,message){assert.ok(actual===expected,message||'Scene object identity');}
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame,ARENAS,RECIPES} from '../src/core.mjs';
import {RestaurantView,createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {StationInteractions} from '../src/interactions.mjs';
import {stationViewport,fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {automaticStationSpeech,requestedStationSpeech} from '../src/station-speech.mjs';
import {sortingTask} from '../src/delivery-sorting.mjs';
import {matchingTask,matchingVocabulary} from '../src/tablet-matching.mjs';
import {PROJECTS} from '../src/refurbishment.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {repairParts} from '../src/tasks.mjs';
import {seeded} from './helpers.mjs';
import {documentDouble,Element,firePointer} from './dom-double.mjs';
import {clippedRect,placementTarget} from '../src/pointer-placement.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units.find(u=>u.id==='g5u6'),config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'challenge'};
const phones=[[320,480],[320,568],[360,640],[393,740],[430,850],[844,390]];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function cameraFor(s,width,height){const f=fitSurfaceCamera(s.focusSurface,width,height,{setting:s.context.setting,offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.up.copy(f.up);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();return c;}
function sceneTask(setting){return setting==='sorting'?sortingTask(config.unit,'challenge',seeded()):setting==='matching'?matchingTask(matchingVocabulary(unit.tasks).slice(0,4),'translation'):unit.tasks.find(t=>t.kind===({recipe:'sentence',delivery:'vocabulary',tablet:'vocabulary',ticket:'completion',repair:'repair'}[setting]));}
// Protected readback advances on available reading time. Slow CI/GC can
// legitimately defer it beyond a fixed 2.1-second wall-clock sleep.
async function waitUntil(predicate,message){
 const end=Date.now()+10000;
 while(!predicate()){assert.ok(Date.now()<end,message);await wait(25);}
}
async function harness(setting,fn,{width=393,height=740,tasks=unit.tasks}={}){
  const previous=globalThis.document,document=documentDouble();globalThis.document=document;
  const g=new BistroGame(config,tasks,{rng:seeded(),demoSetting:setting==='sorting'?'delivery':setting,demoMenuMode:setting==='tablet'?'translation':null,demoSorting:setting==='sorting'});g.start();if(['delivery','sorting'].includes(setting)){g.stock=1;g.openDelivery();if(setting==='delivery')g.active.task=sceneTask('delivery');}else g.openOrder(0);
  const container={clientWidth:width,clientHeight:height,getBoundingClientRect:()=>({left:0,top:0,right:width,bottom:height,width,height})};
  const view=Object.assign(Object.create(RestaurantView.prototype),{container,reduced:true,menu:false,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}},raycaster:new THREE.Raycaster(),pointer:new THREE.Vector2()});view.setRestaurant(config);
  const spoken=[],audio={wake(){},cancelSpeech(){},speak:async(text)=>{spoken.push(text);return {played:true};}};
  const controller=new StationInteractions({getGame:()=>g,getView:()=>view,audio,onChanged(){},announce(){}});
  try{controller.open();view.update(0,.016,g);controller.updateTarget();await fn({g,view,controller,document,spoken});}
  finally{controller.close();view.station?.dispose();globalThis.document=previous;}
}
function point(node){const r=node.getBoundingClientRect();return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};}
function pointer(x,y,id=1){return {clientX:x,clientY:y,pointerId:id,isPrimary:true,cancelable:true,preventDefault(){}};}
function drag(c,payload,from,to){assert.ok(c.beginPointer(pointer(from.x,from.y),payload));c.movePointer(pointer(to.x,to.y));c.endPointer(pointer(to.x,to.y));}

test('every object station fits portrait and landscape phone work areas without a popup sheet',()=>{
  const w=createRestaurant();let cases=0;
  for(const [width,height]of phones)for(const type of ['recipe','delivery','sorting','matching','ticket','repair']){
    const setting=type==='sorting'?'delivery':type==='matching'?'tablet':type,task=sceneTask(type),s=new StationScene(w,{setting,task,recipe:0,options:task.options||[],order:[2,0,1],viewport:{width,height}}),camera=cameraFor(s,width,height),r=stationViewport(width,height,setting);
    for(const p of projectSurface(s.focusSurface,camera,width,height)){assert.ok(p.x>=r.x-.5&&p.x<=r.x+r.width+.5,type+' horizontal');assert.ok(p.y>=r.y-.5&&p.y<=r.y+r.height+.5,type+' vertical');}
    for(const [key,surface]of Object.entries(s.surfaces)){const t=surfaceTransform(projectSurface(surface,camera,width,height));assert.ok(t&&t.matrix.every(Number.isFinite));if(key.startsWith('ingredient')){assert.ok(t.width>=76,'Prep papers need a readable ink area');assert.ok(t.height>=44,'Sentence labels need touch height');}if(key==='clip')assert.ok(t.height>=44,'The clip remains touchable');}
    if(['ticket','repair'].includes(setting)){const meshes=[];w.root.updateMatrixWorld(true);w.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});for(const x of [-.35,0,.35])for(const y of [-.35,0,.35]){const sf=s.surfaces.main,p=sf.mesh.localToWorld(new THREE.Vector3(x*sf.width,y*sf.height,.014)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);ray.near=camera.near;const first=ray.intersectObjects(meshes,false)[0]?.object;assert.ok(first===sf.mesh||setting==='ticket'&&first?.parent===s.clip,setting+' clear paper/screen at '+width+'x'+height+' '+first?.material.color?.getHexString());}}
    s.dispose();cases++;
  }assert.equal(cases,36);
});

test('all curriculum sentence chunks have wide labels and complete text in the object interface',()=>{
  const tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='sentence');assert.equal(tasks.length,1520);
  for(const t of tasks){assert.ok(t.blocks.length>=3&&t.blocks.length<=5);assert.equal(t.blockRoles.length,t.blocks.length);const html=taskMarkup(t,{recipe:RECIPES[0]});assert.ok(html.includes('data-object="recipe-note"'));assert.ok(html.includes('data-object="vessel"'));assert.ok(!html.includes('CHECK SENTENCE'));}
});

test('phone tablet screens remain physically unobstructed in fully refurbished arenas',()=>{
  const task=sceneTask('matching');let checked=0;
  for(const arena of ARENAS){const w=createRestaurant({arena:arena.id,projects:{items:Object.fromEntries(PROJECTS.map(p=>[p.id,{stage:3,meals:18}]))}});w.tables.forEach(t=>t.guest.root.visible=true);
    for(const table of w.tables)for(const [width,height]of [[320,568],[393,740],[844,390]]){const s=new StationScene(w,{setting:'tablet',tableId:table.id,task,viewport:{width,height}}),camera=cameraFor(s,width,height),meshes=[];w.root.updateMatrixWorld(true);w.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});
      for(const [x,y]of [[-.4,.4],[0,.4],[.4,.4],[-.4,0],[0,0],[.4,0],[-.4,-.4],[0,-.4],[.4,-.4]]){const p=s.tabletScreen.localToWorld(new THREE.Vector3(x*.92,y*s.surfaces.main.height,.014)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);ray.near=camera.near;ray.far=camera.far;const first=ray.intersectObjects(meshes,false)[0];assert.ok(first?.object===s.tabletScreen,`${arena.id} table ${table.id} ${width}x${height} at ${x},${y}: ${first?.object.material.color?.getHexString()} d=${first?.distance}`);checked++;}s.dispose();
    }
  }assert.equal(checked,324);
});

test('food appearance is assigned independently of sentence order and all nine dishes finish',()=>{
  const w=createRestaurant(),task=sceneTask('recipe');for(let recipe=0;recipe<RECIPES.length;recipe++){
    const s=new StationScene(w,{setting:'recipe',task,recipe,order:[2,0,1],foodAssignment:[2,0,1],viewport:{width:393,height:740}});assert.deepEqual(s.foodAssignment,[2,0,1]);for(let i=0;i<3;i++){s.addIngredient(i);s.update(.5);assert.equal(s.trays[i].asset.visible,false);assert.equal(s.trays[i].paper.mesh.visible,true);assert.ok(s.plated[i].parent===s.contents);}
    assert.equal(s.autoFinished,true);s.root.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});s.dispose();
  }
});

test('dragging a sentence label moves its actual ingredient and keeps the label attached',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  const t=view.station.trays[0],before=t.asset.getWorldPosition(new THREE.Vector3()),labelBefore=t.label.mesh.getWorldPosition(new THREE.Vector3()),from=point(d.getElementById('word-bank').querySelector('[data-block="0"]')),to=point(d.getElementById('dish-drop'));
  assert.ok(c.beginPointer(pointer(from.x,from.y),{kind:'ingredient',index:0}));c.movePointer(pointer(to.x,to.y));assert.ok(view.station.dragging);assert.ok(t.asset.getWorldPosition(new THREE.Vector3()).distanceTo(before)>.1);assert.ok(t.label.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(labelBefore)>.1);assert.ok(!c.ghost);
  c.endPointer(pointer(to.x,to.y));assert.deepEqual(g.active.ingredients,[0]);assert.equal(t.asset.visible,false);assert.equal(view.station.dragging,null);await wait(390);
}));

test('missing a plate and pointer cancellation do not record an English mistake',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  const from=point(d.getElementById('word-bank').querySelector('[data-block="0"]'));for(const to of [{x:3,y:720},{x:190,y:20},{x:3,y:3}]){drag(c,{kind:'ingredient',index:0},from,to);assert.equal(g.active.attempts,0);assert.deepEqual(g.active.ingredients,[]);assert.equal(view.station.trays[0].asset.visible,true);}
  c.beginPointer(pointer(from.x,from.y),{kind:'ingredient',index:0});c.movePointer(pointer(190,300));c.cancelDrag();assert.equal(view.station.dragging,null);assert.equal(g.active.attempts,0);assert.deepEqual(g.active.ingredients,[]);
}));

test('a valid drop in the wrong sentence order records one mistake and returns the food',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  drag(c,{kind:'ingredient',index:2},point(d.getElementById('word-bank').querySelector('[data-block="2"]')),point(d.getElementById('dish-drop')));assert.equal(g.active.attempts,1);assert.deepEqual(g.active.ingredients,[]);assert.equal(view.station.trays[2].asset.visible,true);assert.match(d.getElementById('task-feedback').textContent,/next block/);
}));

test('a second finger and an unsettled camera cannot start an ingredient drag',async()=>harness('recipe',async({g,controller:c})=>{
  assert.equal(c.beginPointer({...pointer(100,300),isPrimary:false},{kind:'ingredient',index:0}),false);c.surface.ready=false;assert.equal(c.beginPointer(pointer(100,300),{kind:'ingredient',index:0}),false);c.surface.ready=true;assert.ok(c.beginPointer(pointer(100,300),{kind:'ingredient',index:0}));assert.equal(c.beginPointer(pointer(160,300,2),{kind:'ingredient',index:1}),false);c.endPointer(pointer(100,200,2));assert.ok(c.drag);assert.equal(g.active.ingredients.length,0);
}));

test('tap ingredient then tap dish provides the same preparation without extra confirmation',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  const first=g.active;
  for(let phase=0;phase<3;phase++){
    assert.equal(g.active.prepPhase,phase);
    if(phase>0){assert.equal(g.tables[0].step,0);assert.equal(g.tables[0].status,'waiting');assert.notEqual(g.active.task.answer,first.task.answer);assert.equal(view.station.contents.children[0].children.length,phase*3);}
    for(let i=0,count=g.active.task.blocks.length;i<count;i++){d.getElementById('word-bank').querySelector(`[data-block="${i}"]`).click();d.getElementById('dish-drop').click();if(i===count-1)await waitUntil(()=>!g.active||g.active.prepPhase===phase+1,'Preparation readback advances to the next phase');else await wait(400);}
  }
  assert.equal(g.completed,3);assert.equal(g.active,null);assert.equal(g.tables[0].status,'cooking');assert.equal(c.surface.active,false);
}));

test('sorting drags reach either physical bin and misses preserve the current label',async()=>harness('sorting',async({g,controller:c,document:d})=>{
  const a=g.active,from=point(d.getElementById('sort-card'));drag(c,{kind:'sorting'},from,{x:3,y:720});assert.equal(a.sortIndex,0);assert.equal(a.attempts,0);
  const bin=d.getElementById('task-card').querySelector(`[data-sort="${a.task.cards[0].category}"]`);drag(c,{kind:'sorting'},from,point(bin));assert.equal(a.sortIndex,1);await wait(260);assert.equal(c.busy,false);
}));

test('a delivery sticker can be dragged directly from its manifest onto the crate',async()=>harness('delivery',async({g,controller:c,document:d})=>{
  const index=c.options.indexOf(g.active.task.answer),from={x:190,y:480};drag(c,{kind:'label',index},from,point(d.getElementById('crate-drop')));assert.equal(g.active.completed,true);await wait(900);assert.equal(g.active,null);assert.equal(g.stock,g.maxStock);
}));

test('tapping a ticket option fills the blank and clips it automatically without another control',async()=>harness('ticket',async({g,controller:c,document:d})=>{
 const a=g.active,index=c.options.indexOf(a.task.answer),button=c.root.querySelector(`[data-answer="${index}"]`);
 button.click();assert.equal(a.completed,true);assert.equal(d.getElementById('ticket-gap').textContent,a.task.answer);assert.equal(g.completeTask(),false);assert.equal(d.getElementById('stamp-button').hidden,true);assert.equal(d.getElementById('ticket-grip').hidden,true);
 await waitUntil(()=>a.stamped,'Correct ticket clips automatically after readback');assert.equal(a.stamped,true);await waitUntil(()=>!g.active,'Automatic clipping finishes without another control');assert.equal(g.active,null);assert.equal(g.completed,1);assert.equal(g.tables[0].step,1);
}));

test('checkout waits for its physical print key and prints and advances exactly once',async()=>harness('repair',async({g,view,controller:c,document:d})=>{
  const a=g.active,index=repairParts(a.task).errorIndex,word=d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`);c.locate(index,word);await c.erase();c.submit(a.task.answer);assert.equal(a.completed,true);assert.equal(g.completeTask(),false);assert.equal(view.station.printedReceipt.visible,false);assert.equal(d.getElementById('print-button').hidden,false);
  await wait(900);const pending=c.printReceipt();assert.equal(a.printed,true);assert.equal(view.station.printedReceipt.visible,true);assert.equal(g.printReceipt(),false);await pending;assert.equal(g.active,null,'Printing finishes the task automatically');assert.equal(d.getElementById('take-receipt'),null);assert.equal(g.completed,1);assert.equal(g.printReceipt(),false);
}));

test('screen refitting preserves sentence order, ingredient assignments and accepted placements',async()=>harness('recipe',async({g,view,controller:c})=>{
  c.chooseIngredient(0);await c.dropIngredient();const a=g.active,presentation=JSON.stringify(a.presentation);view.container.clientWidth=844;view.container.clientHeight=390;c.reframe();assert.equal(g.active,a);assert.equal(JSON.stringify(a.presentation),presentation);assert.deepEqual(a.ingredients,[0]);assert.equal(view.station.trays[0].asset.visible,false);assert.equal(c.root.querySelector('[data-block="0"]').disabled,true);
}));

test('automatic speech contains only a guest line or a listening request',()=>{
  for(const t of bank.flatMap(g=>g.units.flatMap(u=>u.tasks))){if(t.kind==='question')assert.equal(automaticStationSpeech(t),t.prompt);else assert.equal(automaticStationSpeech(t),'');}
  const t={kind:'listening',spoken:'library',answer:'library'};assert.equal(automaticStationSpeech(t),'library');assert.equal(requestedStationSpeech(sceneTask('recipe')),sceneTask('recipe').blocks.join(' '));
});

test('opening preparation, delivery and ticket stations does not narrate instructions',async()=>{
  for(const setting of ['recipe','delivery','sorting','ticket','repair'])await harness(setting,async({spoken})=>{await Promise.resolve();assert.deepEqual(spoken,[]);});
});

test('explicit English playback remains available on an object and is the only speech requested',async()=>harness('recipe',async({g,controller:c,spoken})=>{await c.speakPrompt(true);assert.deepEqual(spoken,[g.active.task.blocks.join(' ')]);}));

test('the phone stylesheet reserves safe controls, wrapping text and scrollable object surfaces',()=>{
  const css=fs.readFileSync(new URL('../public/objects.css',import.meta.url),'utf8');for(const rule of ['env(safe-area-inset-bottom)','min-height:48px','overflow-wrap:anywhere','touch-action:none','touch-action:pan-y','overscroll-behavior:contain','transform-origin:0 0'])assert.ok(css.includes(rule),rule);
  assert.ok(!css.includes('text-overflow:ellipsis'));assert.ok(!css.includes('line-clamp'));
  const oldDocument=globalThis.document,oldStyle=globalThis.getComputedStyle;globalThis.document={documentElement:{}};globalThis.getComputedStyle=()=>({getPropertyValue:k=>k.endsWith('bottom')?'34px':k.endsWith('top')?'47px':'0px'});try{const r=stationViewport(393,740,'tablet');assert.ok(r.y>=101);assert.ok(740-r.y-r.height>=98);}finally{globalThis.document=oldDocument;globalThis.getComputedStyle=oldStyle;}
});

test('ingredient touch areas never overlap, including short landscape phones',()=>{
  const w=createRestaurant();
  for(const [width,height]of [...phones,[568,320],[667,375],[740,360],[1024,600]]){
    const s=new StationScene(w,{setting:'recipe',task:sceneTask('recipe'),recipe:0,order:[2,0,1],viewport:{width,height}}),camera=cameraFor(s,width,height),work=stationViewport(width,height,'recipe');
    const rects=[0,1,2].map(i=>{const ps=projectSurface(s.surfaces['ingredient-'+i],camera,width,height);return {left:Math.min(...ps.map(p=>p.x)),right:Math.max(...ps.map(p=>p.x)),top:Math.min(...ps.map(p=>p.y)),bottom:Math.max(...ps.map(p=>p.y))};});
    for(const r of rects){assert.ok(r.top>=work.y-1,`${width}x${height}: clear of header`);assert.ok(r.bottom<=work.y+work.height+1,`${width}x${height}: clear of assistance`);assert.ok(r.bottom-r.top>=47.9);}
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(rects[i].bottom+2<=rects[j].top||rects[j].bottom+2<=rects[i].top||rects[i].right+2<=rects[j].left||rects[j].right+2<=rects[i].left,`${width}x${height}: labels ${i} and ${j} cannot cover each other`);
    s.dispose();
  }
});

test('captured touch drops ignore their compatibility click and the next quick tap works',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  const source=d.getElementById('word-bank').querySelector('[data-block="0"]'),from=point(source),to=point(d.getElementById('dish-drop'));
  firePointer(source,'pointerdown',{clientX:from.x,clientY:from.y});
  firePointer(d.body,'pointermove',{clientX:to.x,clientY:to.y});
  firePointer(d.body,'pointerup',{clientX:to.x,clientY:to.y});
  source.click({detail:1,pointerId:1});assert.deepEqual(g.active.ingredients,[0]);assert.equal(c.drag,null);
  const next=d.getElementById('word-bank').querySelector('[data-block="1"]');next.click({detail:1,pointerId:2});assert.equal(c.selectedIngredient,1,'No station-wide post-drag click lock');
  d.getElementById('dish-drop').click();assert.deepEqual(g.active.ingredients,[0,1],'No input lock while the previous piece settles');
}));

test('a visible ingredient over the plate lands even with the fingertip below the rim',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  const from=point(d.getElementById('word-bank').querySelector('[data-block="0"]')),plate=d.getElementById('dish-drop').getBoundingClientRect(),finger={x:(plate.left+plate.right)/2,y:plate.bottom+24};
  assert.ok(finger.y>plate.bottom+14);drag(c,{kind:'ingredient',index:0},from,finger);assert.deepEqual(g.active.ingredients,[0]);
}));

test('a rejected ingredient returns smoothly and can be picked up during its return',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  const source=d.getElementById('word-bank').querySelector('[data-block="2"]');drag(c,{kind:'ingredient',index:2},point(source),point(d.getElementById('dish-drop')));
  const movable=view.station.trays[2].movable;assert.ok(movable.userData.returning);assert.equal(g.active.attempts,1);
  c.beginPointer(pointer(180,400),{kind:'ingredient',index:2});c.movePointer(pointer(180,300));assert.ok(view.station.dragging);assert.equal(movable.userData.returning,undefined);c.cancelDrag();view.station.update(.3);assert.ok(movable.position.distanceTo(view.station.trays[2].moveRest)<.001);assert.equal(g.active.attempts,1);
}));

test('canceled capture cannot leave a selected piece or turn into a phantom tap',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  const source=d.getElementById('word-bank').querySelector('[data-block="0"]'),from=point(source);
  firePointer(source,'pointerdown',{clientX:from.x,clientY:from.y});firePointer(d.body,'pointermove',{clientX:180,clientY:280});firePointer(d.body,'pointercancel',{clientX:180,clientY:280});
  source.click({detail:1,pointerId:1});assert.equal(c.selectedIngredient,null);assert.equal(c.drag,null);assert.equal(g.active.attempts,0);
  firePointer(source,'pointerdown',{clientX:from.x,clientY:from.y,pointerId:2});firePointer(source,'pointerup',{clientX:from.x,clientY:from.y,pointerId:2});source.click({detail:1,pointerId:2});assert.equal(c.selectedIngredient,0);
}));

test('every delivery sticker is available on one manifest and its whole face accepts touch dragging',async()=>harness('delivery',async({g,controller:c,document:d})=>{
  const index=c.options.indexOf(g.active.task.answer),source=c.root.querySelector(`[data-answer="${index}"]`);
  assert.equal(c.root.querySelector('[data-page="delivery"]').querySelector('.surface-scroll'),null);
  assert.equal(c.root.querySelectorAll('.label-choice').length,c.options.length);
  source.click();assert.equal(c.selectedLabel,index);c.clearObjectSelection();
  firePointer(source,'pointerdown',{clientX:200,clientY:420});assert.ok(c.drag);const to=point(d.getElementById('crate-drop'));firePointer(d.body,'pointermove',{clientX:to.x,clientY:to.y});firePointer(d.body,'pointerup',{clientX:to.x,clientY:to.y});assert.equal(g.active.completed,true);
}));

test('drops use only the visible part of a scrollable destination',()=>{
  const surface=new Element(),scroll=new Element(),gap=new Element('button');surface.className='object-surface';scroll.className='surface-scroll';surface.append(scroll);scroll.append(gap);
  surface.rect={left:20,top:80,right:300,bottom:400};scroll.rect={left:32,top:95,right:288,bottom:385};gap.rect={left:80,top:370,right:180,bottom:430};
  assert.deepEqual(clippedRect(gap),{left:80,top:370,right:180,bottom:385,width:100,height:15});assert.equal(placementTarget([{node:gap}],[{x:120,y:410}],{padding:0}),null);
  gap.rect={left:80,top:410,right:180,bottom:460};assert.equal(clippedRect(gap),null);gap.rect={left:80,top:110,right:180,bottom:160};gap.disabled=true;assert.equal(placementTarget([{node:gap}],[{x:120,y:130}]),null);
});

test('the final pointerup position is used even when its last move was coalesced',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  const source=d.getElementById('word-bank').querySelector('[data-block="0"]'),from=point(source),to=point(d.getElementById('dish-drop'));
  firePointer(source,'pointerdown',{clientX:from.x,clientY:from.y});firePointer(d.body,'pointermove',{clientX:from.x,clientY:from.y-15});firePointer(d.body,'pointerup',{clientX:to.x,clientY:to.y});assert.deepEqual(g.active.ingredients,[0]);
}));

test('an out-of-window release safely cancels a clamped ingredient',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  const from=point(d.getElementById('word-bank').querySelector('[data-block="0"]'));drag(c,{kind:'ingredient',index:0},from,{x:-30,y:280});assert.deepEqual(g.active.ingredients,[]);assert.equal(g.active.attempts,0);
}));

test('the ticket stays under its pickup point rather than jumping by its paper height',async()=>harness('ticket',async({g,view,controller:c,document:d})=>{
  c.chooseTicket(c.options.indexOf(g.active.task.answer));c.dropTicketWord();
  const from={x:190,y:520};c.beginPointer(pointer(from.x,from.y),{kind:'ticket'});view.station.paperPivot.updateWorldMatrix(true,false);const before=view.station.paperPivot.getWorldPosition(new THREE.Vector3()).project(view.camera);c.movePointer(pointer(from.x,from.y-20));const after=view.objectDragPoint(),beforeY=(.5-before.y*.5)*view.container.clientHeight;assert.ok(Math.abs(after.y-beforeY+20)<1);c.cancelDrag();
}));

test('native device controls cannot be bypassed by obsolete screen raycast buttons',async()=>{
  for(const setting of ['tablet','repair'])await harness(setting,async({view})=>{assert.ok(view.station.hits.length);assert.ok(view.station.hits.every(h=>h.userData.enabled===false));});
});

test('the newly revealed clear and print keys scroll into the register view',async()=>harness('repair',async({g,controller:c,document:d})=>{
  const scroll=c.root.querySelector('.surface-scroll');scroll.rect={left:20,top:80,right:373,bottom:400};scroll.scrollTop=0;
  d.getElementById('erase-button').rect={left:40,top:430,right:340,bottom:480};const error=repairParts(g.active.task).errorIndex,word=d.getElementById('repair-sentence').querySelector(`[data-part="${error}"]`);word.click();assert.ok(scroll.scrollTop>=92);
  await c.erase();scroll.scrollTop=0;d.getElementById('print-button').rect={left:40,top:490,right:340,bottom:540};c.submit(g.active.task.answer);assert.ok(scroll.scrollTop>=152);assert.equal(d.getElementById('print-button').disabled,false);assert.equal(g.active.printed,undefined);
}));

test('both a captured horizontal swipe and the keyboard backspace clear the selected word',async()=>{
  for(const mode of ['swipe','keyboard'])await harness('repair',async({g,controller:c,document:d})=>{
    const index=repairParts(g.active.task).errorIndex,word=d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`);word.click();
    if(mode==='swipe'){assert.equal(word.disabled,false);firePointer(word,'pointerdown',{clientX:160,clientY:260});firePointer(d.body,'pointerup',{clientX:220,clientY:262});}
    else c.key({key:'Backspace',preventDefault(){}});
    assert.equal(g.active.repairErased,true);await wait(260);assert.equal(d.getElementById('repair-options').hidden,false);
  });
});

test('pause during requested audio and completion cannot strand the order on resume',async()=>harness('recipe',async({g,controller:c})=>{
  for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}const a=g.active;let finish;
  c.audio.speak=()=>new Promise(resolve=>finish=resolve);c.audio.cancelSpeech=()=>finish?.({played:false,reason:'cancelled'});
  const first=c.speakPrompt(true);c.pause();g.paused=true;c.audio.cancelSpeech();await first;assert.equal(c.doneReading,false);
  g.paused=false;c.resume();assert.equal(c.manualSpeech,true);await wait(550);assert.equal(c.doneReading,false);assert.equal(g.active,a,'Requested audio protects the translation reveal');finish({played:true});await wait(2100);assert.equal(g.active.prepPhase,1);assert.notEqual(g.active,a);assert.equal(g.tables[0].step,0);assert.equal(g.completed,1);
}));

test('all three ingredients accept immediate deliberate taps while their food settles',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  for(let i=0,count=g.active.task.blocks.length;i<count;i++){d.getElementById('word-bank').querySelector(`[data-block="${i}"]`).click();d.getElementById('dish-drop').click();}
  assert.deepEqual(g.active.ingredients,[0,1,2]);assert.equal(g.active.completed,true);await wait(700);assert.equal(g.completed,1);
}));

test('the sorting card also explains its tap route and a bin accepts that selection once',async()=>harness('sorting',async({g,controller:c,document:d})=>{
  const a=g.active;d.getElementById('sort-card').click();assert.equal(c.root.dataset.selected,'sorting');assert.equal(a.sortIndex,0);c.root.querySelector(`[data-sort="${a.task.cards[0].category}"]`).click();assert.equal(a.sortIndex,1);assert.equal(c.root.dataset.selected,undefined);await wait(240);assert.equal(d.getElementById('sort-card').disabled,false);
}));

test('repeated taps cannot answer or automatically send a ticket twice',async()=>harness('ticket',async({g,controller:c,document:d})=>{
 const a=g.active,index=c.options.indexOf(a.task.answer),button=c.root.querySelector(`[data-answer="${index}"]`);button.click();button.click();c.chooseTicket(index);assert.equal(g.completed,1);assert.equal(a.stamped,undefined);
 await wait(1650);assert.equal(g.active,null);assert.equal(a.stamped,true);assert.equal(g.stampTicket(),false);assert.equal(g.drainEvents().filter(e=>e.type==='stamped').length,1);assert.equal(g.tables[0].step,1);
}));

test('Enter on a focused native replay button preserves its own action',async()=>harness('ticket',async({g,controller:c,document:d})=>{
  const a=g.active;c.chooseTicket(c.options.indexOf(a.task.answer));c.dropTicketWord();c.key({key:'Enter',target:d.getElementById('read-button'),preventDefault(){throw Error('Native Enter must be allowed');}});assert.equal(a.stamped,undefined);
}));

test('the clip clearance follows its physical size on large and small screens',async()=>{
  for(const [width,height]of [[320,480],[430,850],[800,1100],[1280,800]])await harness('ticket',async({view,controller:c})=>{
    const main=view.projectObject('main'),clip=view.projectObject('clip'),top=Math.min(...main.map(p=>p.y)),bottom=Math.max(...clip.map(p=>p.y)),padding=parseFloat(c.root.style['--clip-clearance']);assert.ok(top+14+padding>=bottom+11,'Printed heading stays below the clip');
  },{width,height});
});

test('rotating during receipt printing keeps its physical finish and rewards only once',async()=>harness('repair',async({g,controller:c,document:d})=>{
  const a=g.active,index=repairParts(a.task).errorIndex;c.locate(index,d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`));await c.erase();c.submit(a.task.answer);c.printReceipt();c.reframe();await wait(260);assert.equal(g.active,a,'Receipt finish remains protected');await wait(700);assert.equal(g.active,a,'The printed correction remains visible briefly after rotation');assert.equal(d.getElementById('printed-receipt').hidden,false);assert.equal(d.getElementById('take-receipt'),null);await wait(receiptReadMilliseconds(a.task.readback||a.task.prompt.replace('___',a.task.answer))+180);assert.equal(g.completed,1);assert.equal(g.active,null);c.maybeAdvance();assert.equal(g.completed,1);
}));

test('four native menu pairs remain on one page through hints, matching and completion',async()=>harness('tablet',async({g,controller:c,document:d})=>{
  const a=g.active,main=c.root.querySelector('[data-page="matching"]');assert.equal(a.task.kind,'matching');assert.equal(a.task.pairs.length,4);assert.equal(main.querySelector('.surface-scroll'),null);assert.equal(main.dataset.fit,'true');
  c.hint();assert.equal(d.getElementById('task-feedback').textContent,'The highlighted cards go together.');const size=main.style.width+':'+main.style.height;
  for(let i=0;i<4;i++){c.root.querySelector(`[data-side="word"][data-pair="${i}"]`).click();c.root.querySelector(`[data-side="match"][data-pair="${i}"]`).click();assert.equal(a.matchedPairs.length,i+1);assert.equal(main.style.width+':'+main.style.height,size);assert.equal(main.dataset.fit,'true');if(i<3)await wait(190);}
  assert.equal(a.completed,true);await wait(780);assert.equal(g.completed,1);assert.equal(g.active,null);
},{width:568,height:320}));

test('the same task surface clears compact recipe state before opening a menu',async()=>harness('recipe',async({g,controller:c})=>{
  assert.ok(c.root.classList.contains('recipe-compact'));c.chooseIngredient(0);c.dropIngredient();assert.equal(c.root.dataset.hasIngredients,'true');
  g.active={...g.active,task:sceneTask('matching'),presentation:null,completed:false,matchedPairs:[],ingredients:[]};c.open();c.updateTarget();assert.equal(c.root.classList.contains('recipe-compact'),false);assert.equal(c.root.dataset.hasIngredients,undefined);assert.ok(c.root.querySelector('[data-page="matching"]'));assert.equal(c.root.querySelector('[data-page]').dataset.fit,'true');
},{width:320,height:480}));

test('sorted parcels land in their trays and rotation preserves parcel identity and stock progress',async()=>harness('sorting',async({g,view,controller:c})=>{
  const a=g.active,first=view.station.currentPackage.userData.variant;await c.chooseSort(a.task.cards[0].category);assert.equal(view.station.sortedPackages.length,1);assert.equal(view.station.sortedPackages[0].userData.variant,first);assert.equal(view.station.currentPackage.userData.variant,(first+1)%6);
  const next=view.station.currentPackage.userData.variant;c.reframe();assert.equal(a.sortIndex,1);assert.equal(view.station.sortedPackages.length,1);assert.equal(view.station.currentPackage.userData.variant,next);assert.equal(view.station.sortedPackages[0].parent,view.station.sortTrays[a.task.cards[0].category]);
  for(let i=1;i<a.task.cards.length;i++)await c.chooseSort(a.task.cards[i].category);assert.equal(view.station.sortedPackages.length,a.task.cards.length);assert.equal(a.completed,true);assert.equal(new Set(view.station.sortedPackages.map(p=>p.userData.variant)).size,6);
}));

test('liquid ingredients use source jugs but only food lands at full dish scale',()=>{
  const world=createRestaurant(),task=sceneTask('recipe');let pours=0;for(const[width,height]of[[320,480],[844,390]])for(let recipe=0;recipe<RECIPES.length;recipe++)for(const prepPhase of [0,1,2]){
    const s=new StationScene(world,{setting:'recipe',task,recipe,prepPhase,order:[2,0,1],foodAssignment:[2,0,1],viewport:{width,height}});for(let i=0;i<3;i++){const tray=s.trays[i];if(tray.portion.userData.pour){assert.equal(tray.asset.userData.container,'ingredient-jug');pours++;}s.addIngredient(i);s.update(.5);s.update(.2);assert.equal(s.plated[i].userData.container,undefined);assert.equal(s.plated[i].parent,s.contents);assert.ok(s.plated[i].scale.distanceTo(new THREE.Vector3(1,1,1))<1e-6);assert.equal(tray.paper.mesh.visible,true);}s.dispose();
  }assert.equal(pours,20);
});

test('camera travel has an exact finish before controls unlock, with an immediate reduced-motion path',async()=>harness('recipe',async({g,view,controller:c})=>{
  view.reduced=false;view.focusTask('recipe',0,{...view.station.context});assert.equal(view.stationReady(),false);view.update(.3,.3,g);assert.equal(view.stationReady(),false);view.update(.56,.26,g);assert.equal(view.cameraFlight,null);assert.equal(view.stationReady(),true);assert.ok(view.camera.position.distanceTo(view.cameraGoal.position)<1e-6);c.updateTarget();assert.equal(c.surface.ready,true);
  view.focusTask('tablet',0,{task:sceneTask('matching')});assert.equal(view.stationReady(),false);view.reduced=true;view.resize(true);assert.equal(view.cameraFlight,null);assert.equal(view.stationReady(),true);
}));

test('explicit cancellation releases the captured pointer and leaves the next deliberate input usable',async()=>harness('recipe',async({g,controller:c,document})=>{
  const button=document.getElementById('word-bank').querySelector('[data-block="0"]'),from=point(button),dest=point(document.getElementById('dish-drop'));
  firePointer(button,'pointerdown',{clientX:from.x,clientY:from.y,pointerId:41});firePointer(button,'pointermove',{clientX:dest.x,clientY:dest.y,pointerId:41});assert.equal(c.drag.moved,true);assert.equal(button.root().captures.get(41),button);
  c.cancelDrag();assert.equal(button.root().captures.has(41),false);assert.equal(g.active.attempts,0);firePointer(button,'pointerup',{clientX:dest.x,clientY:dest.y,pointerId:41});assert.equal(g.active.ingredients.length,0);
  firePointer(button,'pointerdown',{clientX:from.x,clientY:from.y,pointerId:42});firePointer(button,'pointerup',{clientX:from.x,clientY:from.y,pointerId:42});button.click({detail:1});document.getElementById('dish-drop').click();assert.deepEqual(g.active.ingredients,[0]);
}));

test('native answer callbacks cannot submit before their station camera is ready',async()=>harness('tablet',async({g,controller:c,document})=>{
  const a=g.active;c.surface.ready=false;document.querySelectorAll('[data-pair]')[0].click();assert.equal(c.selectedPair,null);c.submit(a.task.answer);assert.equal(a.completed,false);assert.equal(a.attempts,0);
  c.surface.ready=true;document.querySelectorAll('[data-pair]')[0].click();assert.ok(c.selectedPair);
}));

test('disabled customer speech exposes a supported written two-word listening order without blocking replay',async()=>harness('tablet',async({g,controller:c,document})=>{
  const a=g.active;a.task=g.deck.forSetting('tablet','challenge',{menuMode:'listening-pair'});a.selectedWords=[];a.pairSupport=[];a.hinted=false;a.completed=false;delete a.presentation;c.audio.speak=async()=>({played:false,reason:'disabled'});c.open();await c.speakPrompt(false);
  const caption=document.getElementById('listening-caption');assert.equal(caption.hidden,false);for(const p of a.task.requested)assert.ok(caption.textContent.includes(p.word));assert.equal(a.hinted,true);assert.equal(document.getElementById('listen-again').disabled,false);assert.equal(c.manualSpeech,false);
}));

test('sorted parcels retain their own reviewed word tag and the receiving lid opens before answering',async()=>{
  await harness('sorting',async({g,view,controller:c})=>{const a=g.active,word=a.task.cards[0].word;await c.chooseSort(a.task.cards[0].category);const parcel=view.station.sortedPackages[0];assert.equal(parcel.userData.word,word);assert.ok(parcel.children.some(o=>o.userData.word===word));assert.equal(a.sortIndex,1);});
  await harness('delivery',async({view})=>assert.ok(view.station.lid.rotation.x<-1));
});


test('checkout leads with its instruction and a single error cue, then names every required stage',async()=>harness('repair',async({g,controller:c,document:d})=>{
 const a=g.active,index=repairParts(a.task).errorIndex,word=d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`),scroll=d.getElementById('repair-instruction').parentElement;
 assert.equal(scroll.children[0],d.getElementById('repair-instruction'));assert.equal(d.getElementById('repair-title').textContent,'Find the mistake');assert.equal(d.getElementById('repair-sentence').querySelectorAll('.error-cue').length,1);assert.equal(word.classList.contains('error-cue'),true);assert.equal(word.textContent,a.task.broken);assert.equal(!!a.repairFound,false);assert.equal(a.repairCueShown,true);
 word.click();assert.equal(d.getElementById('repair-title').textContent,'Clear the selected word');await c.erase();assert.equal(d.getElementById('repair-title').textContent,'Choose the correct word');assert.equal(d.getElementById('repair-instruction').hidden,false);c.submit(a.task.answer);assert.equal(d.getElementById('repair-title').textContent,'Print the receipt');assert.equal(g.learning.summary().supported,1);assert.equal(g.firstCorrect,1,'The visual cue is supported practice without recording an English error');assert.equal(d.getElementById('receipt-sentence').textContent,'');assert.equal(d.getElementById('repair-sentence').hidden,true);assert.equal(d.getElementById('task-readback').hidden,true);
}));

test('printed corrected receipts have a clear sightline and remain inside the work area in every arena',()=>{
 const task=sceneTask('repair');let cases=0;for(const arena of ARENAS){const world=createRestaurant({arena:arena.id});for(const [width,height]of [...phones,[568,320],[667,375],[1024,600]]){
 const s=new StationScene(world,{setting:'repair',task,recipe:0,options:task.options,viewport:{width,height}});s.react('repair',task.readback||task.prompt.replace('___',task.answer));s.react('print');s.update(1,true);const camera=cameraFor(s,width,height);world.root.updateMatrixWorld(true);const receipt=s.surfaces.receipt,work=stationViewport(width,height,'repair'),points=projectSurface(receipt,camera,width,height);
 assert.ok(s.printedReceipt.parent===s.terminal);assert.ok(s.printedReceipt.position.x-s.surfaces.main.width/2-s.surfaces.receipt.width/2>.10,'Paper is beside, not inside, the display');assert.equal(s.printedReceipt.visible,true);assert.equal(s.printedReceipt.position.x,s.receiptPrinter.position.x);assert.ok(s.receiptBase>s.receiptSlot.position.y+.015/2,'The paper starts above the slot rather than inside its housing');for(const p of points){assert.ok(p.x>=work.x-.5&&p.x<=work.x+work.width+.5);assert.ok(p.y>=work.y-.5&&p.y<=work.y+work.height+.5);}
 const meshes=[];world.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});for(const x of [-.38,0,.38])for(const y of [-.38,0,.38]){const p=receipt.mesh.localToWorld(new THREE.Vector3(x*receipt.width,y*receipt.height,.004)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);sameObject(ray.intersectObjects(meshes,false)[0]?.object,s.printedReceipt,arena.id+' '+width+'x'+height+' clear receipt');}s.dispose();cases++;}}
 assert.equal(cases,27);
});

test('automatic receipt finish respects pause, camera readiness and requested speech, and commits once',async()=>harness('repair',async({g,view,controller:c,document:d})=>{
 const a=g.active,index=repairParts(a.task).errorIndex;assert.equal(d.getElementById('take-receipt'),null);c.locate(index,d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`));await c.erase();c.submit(a.task.answer);
 const printing=c.printReceipt();assert.equal(a.printed,true);assert.equal(c.printAnimating,true);assert.equal(g.active,a);assert.equal(g.completed,1);assert.equal(g.printReceipt(),false);
 await wait(920);assert.equal(view.station.printedReceipt.scale.y,1,'Receipt fully feeds without intervening render frames');assert.equal(d.getElementById('printed-receipt').hidden,false);assert.equal(g.active,a,'Paper is shown before automatic advancement');
 g.paused=true;c.pause();await wait(400);assert.equal(g.active,a,'Pause protects the automatic finish');assert.equal(g.completed,1);
 g.paused=false;c.manualSpeech=true;c.resume();await wait(540);assert.equal(g.active,a,'Requested speech protects the finish');c.manualSpeech=false;c.surface.ready=false;c.maybeAdvance();assert.equal(g.active,a,'Unready camera protects the finish');c.surface.ready=true;c.maybeAdvance();await printing;assert.equal(g.active,null);assert.equal(g.completed,1);c.maybeAdvance();assert.equal(g.completed,1);
}));


test('every corrected receipt fits its projected paper with measured fonts at eleven screen sizes',()=>{
 const tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='repair'),fonts=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url))),world=createRestaurant();let cases=0;
 for(const [width,height]of [[320,480],[320,568],[360,640],[393,740],[390,844],[430,850],[568,320],[667,375],[844,390],[1024,600],[1366,768]]){
 const s=new StationScene(world,{setting:'repair',task:tasks[0],options:tasks[0].options,viewport:{width,height}});s.react('print');s.update(1,true);const camera=cameraFor(s,width,height),paper=surfaceTransform(projectSurface(s.surfaces.receipt,camera,width,height));
 for(const font of fonts){const measure=(t,n)=>Array.from(t).reduce((a,c)=>a+(font.advances[c]??.7)*n,0);for(const task of tasks){const p=receiptPageLayout({width:paper.width-2,height:paper.height-6,text:task.readback||task.prompt.replace('___',task.answer),measure});assert.ok(p.fits,`${font.name} ${width}x${height} ${task.id}`);assert.ok(p.font>=14.5);assert.equal(p.action,22);cases++;}}s.dispose();}assert.equal(cases,tasks.length*22);
});

test('later plating phases preserve earlier food and partial sentences through rotation and wrong drops',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
  for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);c.dropIngredient();}await waitUntil(()=>g.active?.prepPhase===1,'First phase advances after protected readback');
  for(const phase of [1,2]){
    assert.equal(g.active.prepPhase,phase);assert.match(d.getElementById('task-card').textContent,new RegExp(`Plating ${phase+1} / 3`));assert.equal(g.tables[0].step,0);
    c.chooseIngredient(2);await c.dropIngredient();assert.deepEqual(g.active.ingredients,[]);assert.equal(g.active.attempts,1);
    c.chooseIngredient(0);await c.dropIngredient();const a=g.active,presentation=JSON.stringify(a.presentation);view.update(0,.5,g);view.container.clientWidth=phase===1?844:393;view.container.clientHeight=phase===1?390:740;c.reframe();view.update(0,.5,g);
    assert.ok(g.active===a);assert.equal(JSON.stringify(a.presentation),presentation);assert.deepEqual(a.ingredients,[0]);const base=view.station.contents.children.find(g=>g.userData.prepBase);assert.equal(base.children.length,phase*3);assert.equal(view.station.trays[0].asset.visible,false);assert.equal(d.getElementById('word-bank').querySelector('[data-block="0"]').disabled,true);
    g.paused=true;c.chooseIngredient(1);assert.deepEqual(a.ingredients,[0]);g.paused=false;for(let i=1;i<a.task.blocks.length;i++){c.chooseIngredient(i);await c.dropIngredient();}await waitUntil(()=>phase===2?g.active===null:g.active?.prepPhase===phase+1,'Later phase advances after protected readback');
  }
  assert.equal(g.active,null);assert.equal(g.tables[0].status,'cooking');assert.equal(g.completed,3);assert.equal(g.history.filter(h=>h.setting==='recipe').length,1);
}));

test('all later sentences accept captured swipes without carrying over the previous selection',async()=>harness('recipe',async({g,controller:c,document:d})=>{
  for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);c.dropIngredient();}await waitUntil(()=>g.active?.prepPhase===1,'First phase advances after protected readback');
  for(const phase of [1,2]){assert.equal(c.selectedIngredient,null);assert.equal(g.active.prepPhase,phase);
    for(let i=0,count=g.active.task.blocks.length;i<count;i++){const from=point(d.getElementById('word-bank').querySelector(`[data-block="${i}"]`)),to=point(d.getElementById('dish-drop'));drag(c,{kind:'ingredient',index:i},from,to);assert.equal(g.active.ingredients.length,i+1);}await waitUntil(()=>phase===2?g.active===null:g.active?.prepPhase===phase+1,'Later phase advances after protected readback');
  }
  assert.equal(g.active,null);assert.equal(g.completed,3);assert.equal(g.tables[0].step,1);
}));

test('freshness ring runs only during available input and survives rotation, pause, audio and expiry',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
 const a=g.active,clock=a.freshness,ring=d.getElementById('freshness-ring');assert.ok(ring);const start=clock.remaining;g.tick(.2);c.updateTarget();assert.ok(clock.remaining<start);assert.equal(ring.dataset.grade,'great');const after=clock.remaining;
 c.surface.ready=false;const ready=view.stationReady;view.stationReady=()=>false;c.updateTarget();g.tick(.2);assert.equal(clock.remaining,after);view.stationReady=ready;c.surface.ready=true;
 c.busy=true;c.updateTarget();g.tick(.2);assert.equal(clock.remaining,after);c.busy=false;g.paused=true;c.updateTarget();g.tick(.2);assert.equal(clock.remaining,after);assert.equal(d.getElementById('freshness-grade').textContent,'Paused');g.paused=false;
 let finish;c.audio.speak=()=>new Promise(resolve=>finish=resolve);const speech=c.speakPrompt(true);g.tick(.2);assert.equal(clock.remaining,after);finish({played:true});await speech;c.updateTarget();g.tick(.2);assert.ok(clock.remaining<after);
 clock.remaining=clock.duration*.4;c.updateTarget();assert.equal(ring.dataset.grade,'good');clock.remaining=clock.duration*.1;c.updateTarget();assert.equal(ring.dataset.grade,'late');view.container.clientWidth=844;view.container.clientHeight=390;const left=clock.remaining;c.reframe();assert.ok(g.active===a);assert.ok(g.active.freshness===clock);assert.equal(clock.remaining,left);clock.remaining=0;c.updateTarget();assert.equal(d.getElementById('freshness-seconds').textContent,'0s');assert.equal(d.getElementById('word-bank').querySelector('[data-block="0"]').disabled,false);assert.equal(a.completed,false);
}));

test('checkout prints the corrected English only on a separate paper, then waits for protected reading',async()=>harness('repair',async({g,view,controller:c,document:d})=>{
 const a=g.active;c.locate(repairParts(a.task).errorIndex,d.getElementById('repair-sentence').querySelector(`[data-part="${repairParts(a.task).errorIndex}"]`));await c.erase();c.submit(a.task.answer);assert.equal(d.getElementById('repair-sentence').hidden,true);assert.equal(d.getElementById('repair-options').hidden,true);assert.equal(d.getElementById('task-readback').textContent,'');assert.equal(d.getElementById('receipt-sentence').textContent,'');assert.equal(view.station.printedReceipt.visible,false);
 g.paused=true;await c.printReceipt();assert.equal(!!a.printed,false);g.paused=false;const printing=c.printReceipt();assert.ok(view.station.focusSurface===view.station.receiptFocus);assert.ok(view.station.printedReceipt.position.x>.8);await new Promise(r=>setTimeout(r,560));assert.equal(d.getElementById('receipt-sentence').textContent,a.task.readback||a.task.prompt.replace('___',a.task.answer));assert.equal(d.getElementById('printed-receipt').hidden,false);assert.ok(g.active===a);await printing;assert.equal(g.active,null);assert.equal(g.completed,1);
}));

test('receipt feed crops physical paper without stretching its ink, with a stable full-size projection',()=>{
 const world=createRestaurant(),task=sceneTask('repair'),s=new StationScene(world,{setting:'repair',task,options:task.options,viewport:{width:393,height:740}});
 s.react('print');const anchor=s.surfaces.receipt.mesh.position.clone(),h=s.receiptHeight;
 for(const progress of [.1,.35,.7,1]){s.setReceiptFeed(progress);const g=s.printedReceipt.geometry,p=g.attributes.position,uv=g.attributes.uv;
  assert.equal(s.printedReceipt.scale.y,1);assert.ok(Math.abs((p.getY(0)-p.getY(2))/h-progress)<1e-6);assert.ok(Math.abs(uv.getY(2)-(1-progress))<1e-6);assert.ok(s.surfaces.receipt.mesh.position.distanceTo(anchor)<1e-9);assert.ok(Math.abs(s.printedReceipt.position.y-h*progress/2-s.receiptBase)<1e-9);
 }s.dispose();
});

test('tab pause during printing freezes the feed and resumes the same corrected receipt once',async()=>harness('repair',async({g,view,controller:c,document:d})=>{
 const a=g.active,index=repairParts(a.task).errorIndex;c.locate(index,d.getElementById('repair-sentence').querySelector(`[data-part="${index}"]`));await c.erase();c.submit(a.task.answer);
 const printing=c.printReceipt();await wait(160);g.paused=true;c.pause();const p=a.receiptFeedProgress;await wait(200);assert.equal(a.receiptFeedProgress,p);assert.equal(c.printAnimating,true);assert.ok(g.active===a);
 g.paused=false;c.resume();await printing;assert.equal(g.completed,1);assert.equal(g.active,null);assert.equal(d.getElementById('take-receipt'),null);
}));


test('wrong ticket taps stay on the task and cannot send an incorrect sentence',async()=>harness('ticket',async({g,controller:c,document:d})=>{
 const a=g.active,wrong=c.options.findIndex(value=>value!==a.task.answer);c.root.querySelector(`[data-answer="${wrong}"]`).click();assert.equal(a.completed,false);assert.equal(a.attempts,1);assert.equal(a.stamped,undefined);assert.equal(d.getElementById('ticket-gap').textContent,'?');await wait(900);assert.ok(g.active===a);assert.equal(g.completed,0);
 c.chooseTicket(c.options.indexOf(a.task.answer));await wait(1650);assert.equal(g.active,null);assert.equal(g.completed,1);assert.equal(g.firstCorrect,0);
}));

test('automatic ticket send waits for pause, camera readiness and speech then preserves its clip animation',async()=>harness('ticket',async({g,controller:c,document:d})=>{
 const a=g.active;c.chooseTicket(c.options.indexOf(a.task.answer));g.paused=true;c.pause();await wait(950);assert.equal(a.stamped,undefined);assert.ok(g.active===a);
 g.paused=false;c.resume();c.surface.ready=false;await wait(600);assert.equal(a.stamped,undefined);c.surface.ready=true;c.manualSpeech=true;c.maybeAdvance();assert.equal(a.stamped,undefined);
 c.manualSpeech=false;c.updateTarget();assert.equal(a.stamped,true);g.paused=true;c.pause();await wait(350);assert.equal(c.stampAnimating,true);assert.ok(g.active===a);g.paused=false;c.resume();await wait(750);assert.equal(g.active,null);assert.equal(g.completed,1);
}));

test('rotation restores the filled word and automatic clipping without a second send',async()=>harness('ticket',async({g,view,controller:c,document:d})=>{
 const a=g.active;c.chooseTicket(c.options.indexOf(a.task.answer));c.reframe();assert.ok(g.active===a);assert.equal(d.getElementById('ticket-gap').textContent,a.task.answer);assert.equal(d.getElementById('stamp-button').hidden,true);await wait(260);assert.equal(a.stamped,true);
 view.container.clientWidth=844;view.container.clientHeight=390;c.reframe();assert.ok(g.active===a);await wait(1000);assert.equal(g.active,null);assert.equal(g.completed,1);assert.equal(g.drainEvents().filter(e=>e.type==='stamped').length,1);assert.equal(g.tables[0].step,1);
}));

test('preparation hides Turkish until correct and protects the full two-second reveal before fresh ingredients',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
 const a=g.active,meaning=a.task.prompt;assert.equal(d.getElementById('prep-translation').hidden,true);assert.equal(d.getElementById('prep-translation').textContent,'');assert.ok(!c.root.textContent.includes(meaning));c.hint();assert.equal(d.getElementById('prep-translation').hidden,true);
 c.chooseIngredient(2);await c.dropIngredient();assert.equal(a.completed,false);assert.equal(d.getElementById('prep-translation').hidden,true);for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}
 assert.equal(a.completed,true);assert.equal(d.getElementById('prep-translation').hidden,false);assert.equal(d.getElementById('prep-translation').textContent,meaning);await wait(900);assert.ok(g.active===a);
 g.paused=true;c.pause();const left=a.prepRevealRemaining;await wait(250);assert.equal(a.prepRevealRemaining,left);g.paused=false;c.resume();c.surface.ready=false;await wait(200);assert.equal(a.prepRevealRemaining,left);c.surface.ready=true;c.manualSpeech=true;await wait(200);assert.equal(a.prepRevealRemaining,left);c.manualSpeech=false;
 await wait(left+150);assert.equal(g.active.prepPhase,1);assert.equal(d.getElementById('prep-translation').hidden,true);assert.equal(d.getElementById('prep-translation').textContent,'');assert.equal(g.completed,1);
},{tasks:unit.tasks.filter(t=>t.kind!=='sentence'||t.translation)}));

test('rotation preserves translation time remaining rather than skipping or restarting the reveal',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
 const a=g.active;for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}await wait(650);const left=a.prepRevealRemaining;assert.ok(left>1000&&left<1600);view.container.clientWidth=844;view.container.clientHeight=390;c.reframe();view.update(0,.1,g);c.updateTarget();assert.ok(g.active===a);assert.equal(d.getElementById('prep-translation').textContent,a.task.prompt);assert.ok(a.prepRevealRemaining<=left);
 await wait(500);assert.ok(g.active===a);assert.ok(a.prepRevealRemaining<left);await waitUntil(()=>g.active?.prepPhase===1,'Rotation preserves and completes the remaining protected reading time');assert.equal(g.active.prepPhase,1);assert.equal(g.completed,1);
},{tasks:unit.tasks.filter(t=>t.kind!=='sentence'||t.translation)}));

test('a supplied completion without Turkish reveals its English sentence with the correct language',async()=>harness('recipe',async({g,controller:c,document:d})=>{
 const t=g.active.task;assert.equal(t.adaptedFrom,'completion');for(let i=0,count=g.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}
 assert.equal(g.active.completed,true);assert.equal(d.getElementById('prep-translation').textContent,t.answer);assert.equal(d.getElementById('prep-translation').lang,'en');assert.ok(!c.root.textContent.includes('Read the Turkish meaning'));
},{tasks:[unit.tasks.find(t=>t.adaptedFrom==='completion')]}));

test('five native ingredient controls survive rotation and require all subject/verb/object/time blocks',async()=>harness('recipe',async({g,view,controller:c,document:d})=>{
 const a=g.active;assert.equal(a.task.blocks.length,5);assert.equal(c.root.querySelectorAll('[data-block]').length,5);
 for(let i=0;i<3;i++){d.getElementById('word-bank').querySelector(`[data-block="${i}"]`).click();d.getElementById('dish-drop').click();}
 assert.equal(a.completed,false);assert.equal(g.total,0);assert.equal(d.getElementById('prep-translation').hidden,true);
 const saved=JSON.stringify(a.presentation);view.container.clientWidth=844;view.container.clientHeight=390;c.reframe();view.update(0,.5,g);c.updateTarget();assert.equal(JSON.stringify(a.presentation),saved);assert.deepEqual(a.ingredients,[0,1,2]);assert.equal(c.root.querySelectorAll('[data-block]').length,5);
 for(let i=3;i<5;i++){d.getElementById('word-bank').querySelector(`[data-block="${i}"]`).click();d.getElementById('dish-drop').click();}
 assert.equal(a.completed,true);assert.equal(g.total,1);assert.equal(d.getElementById('prep-translation').textContent,a.task.translation);assert.equal(d.getElementById('prep-count').textContent,'5 / 5');
},{tasks:[{id:'teacher-five-block-test',kind:'sentence',blocks:['My teacher','gives','us','homework','every day.'],answer:'My teacher gives us homework every day.',prompt:'Öğretmenim bize her gün ödev verir.',translation:'Öğretmenim bize her gün ödev verir.'}]}));


test('consecutive menu rounds keep the screen camera settled and all new answers fitted',async()=>harness('tablet',async({g,view,controller:c})=>{
  const first=g.active;first.activityRounds=2;view.reduced=false;
  const position=view.camera.position.clone(),target=view.cameraTarget.clone();
  for(let i=0;i<first.task.pairs.length;i++)assert.equal(g.matchPair(i,i).correct,true);
  c.doneReading=true;c.maybeAdvance();
  assert.equal(g.active.activityRound,1);assert.notEqual(g.active,first);
  assert.equal(view.cameraFlight,null);assert.equal(c.surface.ready,true);
  assert.ok(view.camera.position.distanceTo(position)<1e-6);assert.ok(view.cameraTarget.distanceTo(target)<1e-6);
  const page=c.root.querySelector('[data-page]');assert.equal(page.dataset.fit,'true');assert.equal(c.root.dataset.moving,'false');
  assert.equal(page.inert,false);assert.equal(c.selectedPair,null);assert.equal(c.wrongPair,null);
  assert.equal(c.root.querySelectorAll('[data-pair]').length,g.active.task.pairs.length*2);
  assert.ok(c.root.querySelectorAll('[data-pair]').every(b=>!b.disabled));
},{width:320,height:480}));

test('a menu for another guest still waits for its new camera before accepting answers',async()=>harness('tablet',async({g,view,controller:c})=>{
  view.reduced=false;const task=g.active.task;
  view.focusTask('tablet',1,{task});c.surface.update();
  assert.ok(view.cameraFlight);assert.equal(c.surface.ready,false);
  c.choosePair('word',0);assert.equal(c.selectedPair,null);assert.equal(g.active.attempts,0);
  view.update(1,.56,g);c.surface.update();assert.equal(c.surface.ready,true);
  c.choosePair('word',0);assert.deepEqual(c.selectedPair,{side:'word',index:0});
}));
