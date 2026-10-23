import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BistroGame} from '../src/core.mjs';
import {RestaurantView,createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {StationInteractions} from '../src/interactions.mjs';
import {fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {listeningPageLayout} from '../src/page-fit.mjs';
import {layoutSignals} from '../src/service-layout.mjs';
import {serviceGuidance} from '../src/service-guidance.mjs';
import {documentDouble} from './dom-double.mjs';
import {seeded} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units.find(u=>u.id==='g5u6');
const sizes=[[320,480],[320,568],[360,640],[393,740],[390,844],[430,850],[568,320],[667,375],[844,390],[1024,600],[1366,768]],wait=ms=>new Promise(r=>setTimeout(r,ms));
// Protected readback advances on available reading time. Slow CI/GC can
// legitimately defer it beyond a fixed 2.1-second wall-clock sleep.
async function waitUntil(predicate,message){
 const end=Date.now()+10000;
 while(!predicate()){assert.ok(Date.now()<end,message);await wait(25);}
}
async function harness(setting,run,{menu='listening-pair'}={}){
  const saved=globalThis.document,document=documentDouble();globalThis.document=document;
  const config={grade:5,unit:unit.id,team:'ravenclaw',arena:'bistro',difficulty:'challenge'},game=new BistroGame(config,unit.tasks,{rng:seeded(),demoSetting:setting,demoMenuMode:menu});game.start();game.openOrder(0);
  const container={clientWidth:393,clientHeight:740,getBoundingClientRect:()=>({left:0,top:0,right:container.clientWidth,bottom:container.clientHeight,width:container.clientWidth,height:container.clientHeight})};
  const view=Object.assign(Object.create(RestaurantView.prototype),{container,reduced:true,menu:false,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}},raycaster:new THREE.Raycaster(),pointer:new THREE.Vector2()});view.setRestaurant(config);
  const audio={wake(){},cancelSpeech(){},speak:async()=>({played:true})},c=new StationInteractions({getGame:()=>game,getView:()=>view,audio,onChanged(){},announce(){}});
  try{c.open();view.update(0,.016,game);c.updateTarget();await wait(0);await run({game,c,view,document,audio,container});}
  finally{c.close();view.station?.dispose();globalThis.document=saved;}
}

test('complete listening clues and independent replay fit 32,648 measured menu states',()=>{
  const fonts=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url))),world=createRestaurant();let states=0;
  for(const [width,height]of sizes){
    const task={kind:'listening',id:'probe',answer:'apple',options:['apple','pear','peach','bread']},s=new StationScene(world,{setting:'tablet',task,options:task.options,viewport:{width,height}}),f=fitSurfaceCamera(s.focusSurface,width,height,{setting:'tablet',offset:s.cameraOffset}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);
    camera.position.copy(f.position);camera.up.copy(f.up);camera.lookAt(f.target);camera.updateMatrixWorld();const r=surfaceTransform(projectSurface(s.focusSurface,camera,width,height));
    for(const font of fonts){const measure=(t,n)=>Array.from(t).reduce((a,c)=>a+(font.advances[c]??.7)*n,0);
      for(const grade of bank)for(const u of grade.units){const vocabulary=u.tasks.filter(t=>t.kind==='vocabulary').sort((a,b)=>measure(b.answer,15)-measure(a.answer,15));
        for(const t of vocabulary){const options=[t.answer,...vocabulary.filter(v=>v.answer!==t.answer).slice(0,3).map(v=>v.answer)];
          for(const requested of [false,true]){const supportText=requested?options.slice(0,2).join(' + '):t.answer,p=listeningPageLayout({width:r.width-2,height:r.height-2,options,requested,supportText,measure});
            assert.ok(p.fits,`${width}x${height} ${t.id} ${supportText}`);assert.ok(p.rowHeight>=44);assert.ok(p.audio>=44);assert.ok(p.supportFont>=15);
            assert.ok(p.flow==='wide'?p.supportHeight+56<=p.rowHeight*p.rows+p.gap*(p.rows-1):p.supportHeight<=p.audio);states++;
          }
        }
      }
    }s.dispose();
  }assert.equal(states,46376);
});

test('two-word hints keep replay separate and retain clue and selections through rotation',()=>harness('tablet',async({c,game,document:d,container,view})=>{
  const a=game.active;assert.equal(a.task.requested.length,2);c.chooseListeningWord(a.task.requested[0].word);c.hint();
  const caption=d.getElementById('listening-caption'),replay=d.getElementById('listen-again');
  assert.equal(caption.hidden,false);assert.equal(caption.textContent,a.task.requested.map(p=>p.word).join(' + '));assert.notEqual(caption.parentElement,replay.parentElement);
  const before=JSON.stringify(a.presentation.options);container.clientWidth=568;container.clientHeight=320;c.reframe();view.update(1,.016,game);c.updateTarget();
  assert.equal(game.active,a);assert.equal(d.getElementById('listening-caption').textContent,caption.textContent);assert.equal(d.getElementById('listening-caption').hidden,false);assert.equal(JSON.stringify(a.presentation.options),before);assert.deepEqual(a.selectedWords,[a.task.requested[0].word]);assert.equal(d.getElementById('listening-basket').textContent,'1 / 2 selected');
}));

test('unavailable speech reveals both words and keeps supported completion playable',()=>harness('tablet',async({c,game,audio,document:d})=>{
  audio.speak=async()=>({played:false,reason:'unsupported'});await c.speakPrompt(true);assert.equal(game.active.hinted,true);assert.equal(d.getElementById('listen-again').disabled,false);
  assert.equal(d.getElementById('listening-caption').textContent,game.active.task.requested.map(p=>p.word).join(' + '));
  for(const word of game.active.task.requested)c.chooseListeningWord(word.word);c.confirmListening();assert.equal(game.active.completed,true);assert.ok(game.learning.summary().supported>0);
}));

test('rotation restarts exact requested pronunciation and holds advancement until it finishes',()=>harness('recipe',async({c,game,audio,view,container})=>{
  let finish;const utterances=[];audio.speak=text=>{utterances.push(text);return new Promise(resolve=>finish=resolve);};audio.cancelSpeech=()=>finish?.({played:false,reason:'cancelled'});
  const first=c.speakPrompt(true),spoken=utterances[0];container.clientWidth=667;container.clientHeight=375;c.reframe();await first;view.update(1,.016,game);c.updateTarget();assert.deepEqual(utterances,[spoken,spoken]);
  for(let i=0;i<game.active.task.blocks.length;i++){c.chooseIngredient(i);await c.dropIngredient();}const a=game.active;await wait(700);assert.equal(c.doneReading,false);assert.ok(game.active===a);finish({played:true});await wait(0);assert.ok(game.active===a);await waitUntil(()=>game.active!==a,'Readback completes after requested speech');assert.equal(game.active.prepPhase,1);assert.notEqual(game.active,a);assert.equal(game.tables[0].step,0);assert.equal(game.completed,1);
  const second=game.active;const secondSpeech=c.speakPrompt(true);assert.equal(utterances.at(-1),second.task.blocks.join(' '));for(let i=0,count=game.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}await wait(700);assert.equal(game.active,second);finish({played:true});await secondSpeech;await wait(0);assert.ok(game.active===second);await waitUntil(()=>game.active!==second,'Readback completes after requested speech');assert.equal(game.active.prepPhase,2);const third=game.active;const thirdSpeech=c.speakPrompt(true);for(let i=0,count=game.active.task.blocks.length;i<count;i++){c.chooseIngredient(i);await c.dropIngredient();}await wait(700);assert.ok(game.active===third);finish({played:true});await thirdSpeech;await wait(0);assert.ok(game.active===third);await waitUntil(()=>game.active!==third,'Readback completes after requested speech');assert.equal(game.active,null);assert.equal(game.completed,3);
}));

test('selected matching cards survive refits without shuffling or losing the intended match',()=>harness('tablet',async({c,game,view,container})=>{
  await c.choosePair('word',0);const a=game.active,order=JSON.stringify(c.menuOrder);container.clientWidth=844;container.clientHeight=390;c.reframe();view.update(1,.016,game);c.updateTarget();assert.deepEqual(c.selectedPair,{side:'word',index:0});assert.equal(JSON.stringify(c.menuOrder),order);await c.choosePair('match',0);assert.deepEqual(a.matchedPairs,[0]);
},{menu:'translation'}));

test('pause followed by rotation replays the last request only once on resume',()=>harness('tablet',async({c,game,audio,view})=>{
  let finish;const utterances=[];audio.speak=text=>{utterances.push(text);return new Promise(resolve=>finish=resolve);};audio.cancelSpeech=()=>finish?.({played:false,reason:'cancelled'});
  const first=c.speakPrompt(true);c.pause();game.paused=true;audio.cancelSpeech();await first;c.reframe();assert.equal(utterances.length,1);game.paused=false;c.resume();view.update(1,.016,game);c.updateTarget();assert.equal(utterances.length,2);assert.equal(utterances[1],utterances[0]);finish({played:true});await wait(0);assert.equal(c.manualSpeech,false);assert.equal(c.replayAfterReady,null);
}));

test('five tall service markers stay separate and inside all supported work areas',()=>{
  for(const [width,height]of sizes)for(const tall of [68,90,112]){
    const signals=Array.from({length:5},(_,id)=>({id,x:width*.5,y:height*.45,width:144,height:tall})),points=layoutSignals(signals,width,height);
    assert.equal(new Set(points.map(p=>p.x+':'+p.y)).size,5);
    for(const a of points){assert.ok(a.height>=44);assert.ok(a.x-a.width/2>=12);assert.ok(a.x+a.width/2<=width-12);assert.ok(a.y-a.height>=(height<400?86:height<600?112:124));assert.ok(a.y<=height-(height<400?74:120));
      for(const b of points.filter(b=>b.id!==a.id))assert.ok(Math.abs(a.x-b.x)>=(a.width+b.width)/2+7.9||a.y-a.height>=b.y+7.9||b.y-b.height>=a.y+7.9);
    }
  }
});

test('guidance reflects destinations, ready meals and supplies without changing the service',()=>{
  const table=(id,status,patience=50)=>({id,orderId:id+1,status,patience,maxPatience:100,plan:[],step:0}),game={tables:[table(0,'waiting',10),table(1,'ready',40)],stock:0,maxStock:3,needsDelivery:true,loaded:[],selectedDish:null};
  const before=JSON.stringify(game);assert.equal(serviceGuidance(game).target,1);assert.equal(JSON.stringify(game),before);
  game.selectedDish={tableId:0};game.loaded=[game.selectedDish];assert.equal(serviceGuidance(game).target,0);assert.match(serviceGuidance(game).text,/Table 1/);
  game.selectedDish=null;game.tables[1].status='cooking';assert.equal(serviceGuidance(game).target,'supplies');game.stock=1;assert.equal(serviceGuidance(game).target,0);
  game.tables[1].status='waiting';game.tables[1].patience=5;assert.equal(serviceGuidance(game).target,1);
  game.tables[1].status='ready';game.tables[1].plan=[{setting:'repair'}];assert.match(serviceGuidance(game).text,/final check/);
  game.run={};assert.equal(serviceGuidance(game).target,null);assert.match(serviceGuidance(game).text,/on its way/);
});
