import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {numberWords,takeawayNumberTask} from '../src/takeaway-numbers.mjs';
import {BistroGame,ARENAS} from '../src/core.mjs';
import {settingForTask} from '../src/tasks.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {requestedStationSpeech} from '../src/station-speech.mjs';
import {menuPageLayout} from '../src/page-fit.mjs';
import {stationViewport,fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {seeded,tick} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank[0].units[0].tasks;
const config=(arena='courtyard',difficulty='relaxed')=>({grade:5,unit:'g5u1',team:'gryffindor',arena,difficulty});

test('zero to two hundred have unique, correctly formed British English names',()=>{
 const examples={0:'zero',12:'twelve',13:'thirteen',15:'fifteen',18:'eighteen',20:'twenty',21:'twenty-one',40:'forty',50:'fifty',80:'eighty',99:'ninety-nine',100:'one hundred',101:'one hundred and one',112:'one hundred and twelve',121:'one hundred and twenty-one',199:'one hundred and ninety-nine',200:'two hundred'};
 for(const [n,words]of Object.entries(examples))assert.equal(numberWords(+n),words);
 const names=Array.from({length:201},(_,n)=>numberWords(n));assert.equal(new Set(names).size,201);assert.ok(names.every(s=>/^[a-z]+(?:[ -][a-z]+)*$/.test(s)));
 for(const invalid of [-1,201,1.5,NaN,Infinity,'12'])assert.throws(()=>numberWords(invalid),RangeError);
});

test('number generation includes both endpoints and creates four distinct pairs per page',()=>{
 const keep=[0,12,100,200],excluded=Array.from({length:201},(_,i)=>i).filter(n=>!keep.includes(n));
 const task=takeawayNumberTask('relaxed',seeded(),1,excluded);assert.deepEqual(task.pairs.map(p=>p.number).sort((a,b)=>a-b),keep);assert.equal(task.pairs.length,4);assert.equal(settingForTask(task),'pickup');
 for(const p of task.pairs){assert.equal(p.word,String(p.number));assert.equal(p.translation,numberWords(p.number));}
 assert.ok(!taskMarkup(task).includes('TÜRKÇE'));assert.match(taskMarkup(task),/ENGLISH WORDS/);assert.match(taskMarkup(task),/NUMBER/);
 assert.equal(requestedStationSpeech(task,{word:'12'}),'twelve');
});

test('Relaxed requires four pairs and Challenge eight distinct pairs before one pickup release',()=>{
 for(const arena of ARENAS)for(const difficulty of ['relaxed','challenge']){
  const g=new BistroGame(config(arena.id,difficulty),tasks,{rng:seeded(),demoSetting:'pickup'});g.start();const t=g.tables.at(-1);assert.ok(t.pickup);assert.ok(g.openOrder(t.id));
  const rounds=difficulty==='challenge'?2:1,seen=new Set();assert.equal(g.active.activityRounds,rounds);
  const stock=g.stock;
  for(let round=0;round<rounds;round++){
   const a=g.active;assert.equal(a.activityRound,round);assert.equal(a.task.pairs.length,4);assert.equal(g.answer(a.task.answer).accepted,false);assert.equal(g.readyLoads().length,0);
   for(const p of a.task.pairs){assert.ok(!seen.has(p.number));seen.add(p.number);}
   g.paused=true;assert.equal(g.matchPair(0,0).accepted,false);g.paused=false;
   assert.equal(g.matchPair(0,1).correct,false);assert.equal(a.matchedPairs.length,0);
   for(let i=0;i<4;i++){assert.equal(g.matchPair(i,i).correct,true);assert.equal(g.matchPair(i,i).accepted,false);if(i<3)assert.equal(a.completed,false);}
   if(round<rounds-1){assert.equal(a.reward,0);assert.equal(t.reward,0);assert.ok(g.completeTask().nextActivityRound);assert.equal(t.step,0);assert.equal(g.stock,stock);assert.equal(g.runes,0);assert.equal(g.readyLoads().length,0);}
  }
  assert.equal(seen.size,rounds*4);assert.ok(g.completeTask().ready);assert.equal(g.completeTask(),false);assert.equal(t.step,1);assert.equal(g.history.filter(h=>h.setting==='pickup').length,1);assert.equal(g.readyLoads().length,1);
  assert.ok(g.chooseDish(t.id));assert.ok(g.deliver(t.id));tick(g,2);assert.equal(g.served,1);const reward=g.runes;assert.equal(g.handoff({tableId:t.id,orderId:t.orderId,part:0,recipe:t.recipe}),false);assert.equal(g.runes,reward);
  assert.ok(Object.keys(g.learning.state.items).every(key=>key.startsWith('number:')));
 }
});

test('real takeaway events finish their route at the number-label counter',()=>{
 for(const arena of ARENAS){const g=new BistroGame(config(arena.id,'challenge'),tasks,{rng:seeded(),eventType:'takeaway',liveKitchen:true});g.start();g.sequence=Math.floor(g.arena.goal/2);assert.ok(g.spawnGuest());const t=g.tables.at(-1);assert.ok(t.pickup&&t.status==='waiting');assert.equal(t.plan.at(-1).setting,'pickup');assert.equal(t.plan.at(-1).phase,'serve');assert.equal(t.plan.filter(s=>s.setting==='pickup').length,1);t.step=t.plan.length-1;t.status='ready';g.activate(t);assert.deepEqual(g.kitchen.stagePoint(t),{x:g.kitchen.layout.pickupApproach[0],z:g.kitchen.layout.pickupApproach[1]});assert.equal(g.active.activityRounds,2);}
});

test('all number names fit four-pair phone pages without smaller text or targets',()=>{
 const fonts=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url))),sizes=[[320,480],[360,640],[390,844],[430,932],[568,320],[667,375],[844,390],[1366,768]];
 for(const font of fonts){const measure=(t,n)=>[...t].reduce((s,c)=>s+(font.advances[c]??.7)*n,0),longest=Array.from({length:201},(_,n)=>({number:n,word:String(n),translation:numberWords(n)})).sort((a,b)=>measure(b.translation,18)-measure(a.translation,18));
  for(const [w,h]of sizes){const r=stationViewport(w,h,'pickup');for(const n of Array.from({length:201},(_,n)=>n)){const pairs=[{word:String(n),translation:numberWords(n)},...longest.filter(p=>p.number!==n).slice(0,3)],p=menuPageLayout({width:r.width-2,height:r.height-2,pairs,mode:'numbers',measure});assert.ok(p.fits,`${font.name} ${w}×${h}: ${n}`);assert.ok(p.font>=14.5&&p.rowHeight>=44);}}
 }
 const w=createRestaurant(),task=takeawayNumberTask('challenge',seeded()),s=new StationScene(w,{setting:'pickup',task,viewport:{width:390,height:844}}),f=fitSurfaceCamera(s.focusSurface,390,844,{setting:'pickup',offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();const p=surfaceTransform(projectSurface(s.focusSurface,c,390,844));assert.ok(Math.abs(p.width-354)<.1);s.dispose();
});

test('the raised preparation surface clears kitchen props and guests without lifting the overview board',()=>{
 const task={kind:'sentence',blocks:['Our teacher','is','helpful.'],answer:'Our teacher is helpful.'};
 for(const arena of ARENAS)for(const [width,height]of [[320,480],[390,844],[568,320]]){
  const w=createRestaurant({...config(arena.id),furnishings:{owned:['warmer','prep'],equipped:['warmer','prep']},projects:{items:{kitchen:{stage:3},receiving:{stage:3},pass:{stage:3}}}});w.tables.forEach(t=>t.guest.root.visible=true);assert.equal(w.prepStatic.position.y,0);
  const s=new StationScene(w,{setting:'recipe',task,recipe:0,viewport:{width,height}});assert.ok(s.focusSurface.mesh.getWorldPosition(new THREE.Vector3()).y>2.9);
  const f=fitSurfaceCamera(s.focusSurface,width,height,{setting:'recipe',offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();const meshes=[];w.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});
  for(const x of [-.47,-.25,0,.25,.47])for(const y of [-.47,-.25,0,.25,.47]){const point=s.focusSurface.mesh.localToWorld(new THREE.Vector3(x*s.focusSurface.width,y*s.focusSurface.height,.04)).project(c),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(point.x,point.y),c);let first=ray.intersectObjects(meshes,false)[0]?.object;while(first&&first!==s.root)first=first.parent;assert.equal(first,s.root,`${arena.id} ${width}×${height}: no kitchen prop pierces preparation`);}
  s.dispose();
 }
});
