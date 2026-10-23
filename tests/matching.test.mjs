import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {TaskDeck,BistroGame,ARENAS} from '../src/core.mjs';
import {matchingVocabulary,matchingTask,tabletPairRects,wordKey} from '../src/tablet-matching.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {StationInteractions} from '../src/interactions.mjs';
import {createRestaurant,cameraFrame} from '../src/restaurant.mjs';
import {seeded} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8'));
const food=bank[0].units.find(u=>u.id==='g5u6');
const config={grade:5,unit:food.id,team:'gryffindor',arena:'bistro',difficulty:'relaxed'};
function gameFor(mode='picture',difficulty='relaxed'){
  const game=new BistroGame({...config,difficulty},food.tasks,{rng:seeded(),demoSetting:'tablet'});game.start();game.tables[0].plan[0].task=matchingTask(matchingVocabulary(food.tasks,{pictures:mode==='picture'}).slice(0,difficulty==='challenge'?4:3),mode);game.openOrder(0);return game;
}

test('every matching menu stays inside its original unit and rotates all supported modes',()=>{
  let pictureUnits=0;
  for(const grade of bank)for(const unit of grade.units)for(const difficulty of ['relaxed','challenge']){
    const count=difficulty==='challenge'?4:3,deck=new TaskDeck(unit.tasks,seeded()),expected=['listening','translation','translation-reverse','audio-translation'];
    if(matchingVocabulary(unit.tasks,{pictures:true}).length>=count){expected.push('picture');if(difficulty==='relaxed')pictureUnits++;}
    const original=JSON.stringify(unit),seen=[];let previous;
    for(let cycle=0;cycle<5;cycle++){
      const modes=[];
      for(let i=0;i<expected.length;i++){
        const task=deck.forSetting('tablet',difficulty),mode=task.mode||'listening';modes.push(mode);seen.push(mode);assert.notEqual(mode,previous,unit.id);previous=mode;
        if(task.kind==='matching'){
          assert.equal(task.pairs.length,count);assert.equal(new Set(task.pairs.map(p=>wordKey(p.word))).size,count);
          assert.equal(new Set(task.pairs.map(p=>mode==='picture'?p.asset.src:wordKey(p.translation))).size,count);
          for(const pair of task.pairs){const source=unit.tasks.find(t=>t.id===pair.id);assert.equal(source?.kind,'vocabulary');assert.equal(pair.word,source.answer);assert.equal(pair.translation,source.translation||source.prompt);}
        }else if(task.requested){assert.equal(difficulty,'challenge');assert.equal(task.requested.length,2);for(const word of task.requested)assert.ok(unit.tasks.some(t=>t.id===word.id&&t.answer===word.word));}else assert.ok(unit.tasks.some(t=>t.id===task.sourceId&&t.answer===task.spoken));
      }
      assert.deepEqual(modes.sort(),[...expected].sort());
    }
    assert.equal(JSON.stringify(unit),original);
  }
  assert.ok(pictureUnits>=25,`Picture coverage: ${pictureUnits}/44 units`);
});

test('matching gates order completion, prevents duplicate rewards and keeps mistakes recoverable',()=>{
  const g=gameFor(),a=g.active;
  assert.equal(g.answer(a.task.answer).accepted,false);assert.equal(g.completeTask(),false);
  for(const invalid of [-1,3,NaN,'0'])assert.equal(g.matchPair(invalid,invalid).accepted,false);
  assert.equal(g.matchPair(0,1).correct,false);assert.equal(g.total,1);assert.deepEqual(a.matchedPairs,[]);
  assert.equal(g.matchPair(0,0).completed,false);assert.equal(g.matchPair(0,0).accepted,false);assert.equal(g.matchPair(1,0).accepted,false);
  g.paused=true;assert.equal(g.matchPair(1,1).accepted,false);g.paused=false;
  assert.equal(g.matchPair(1,1).completed,false);assert.equal(g.answer(a.task.answer).accepted,false);
  const result=g.matchPair(2,2);assert.equal(result.completed,true);assert.equal(result.word,a.task.pairs[2].word);assert.equal(g.firstCorrect,0);assert.equal(g.total,1);assert.equal(g.completed,1);assert.equal(a.reward,10);assert.equal(g.matchPair(2,2).accepted,false);assert.ok(g.completeTask());
  for(const difficulty of ['relaxed','challenge']){
    const perfect=gameFor('translation',difficulty),task=perfect.active.task;for(let i=0;i<task.pairs.length;i++)perfect.matchPair(i,i);assert.equal(perfect.firstCorrect,1);assert.equal(perfect.active.reward,difficulty==='challenge'?30:15);
  }
});

test('preview opens each menu mode directly and missing pictures never cross unit coverage',()=>{
  for(const mode of ['picture','translation','listening']){const game=new BistroGame(config,food.tasks,{demoSetting:'tablet',demoMenuMode:mode});game.start();assert.equal(game.tables[0].plan[0].task,null,'Waiting tables must not consume a menu round');game.openOrder(0);assert.equal(game.active.task.mode||'listening',mode);}
  const unit=bank[0].units[0],game=new BistroGame({...config,unit:unit.id},unit.tasks,{demoSetting:'tablet',demoMenuMode:'picture'});game.start();game.openOrder(0);assert.notEqual(game.active.task.mode,'picture');
});

test('matching cards preserve complete labels, independently ordered columns and image fallbacks',()=>{
  for(const mode of ['picture','translation']){
    const task=gameFor(mode,'challenge').active.task,order={word:[3,1,0,2],match:[1,0,2,3]},html=taskMarkup(task,{menuOrder:order});
    assert.equal([...html.matchAll(/class="pair-card /g)].length,8);
    for(const pair of task.pairs)assert.ok(html.includes(pair.word));
    assert.ok(html.indexOf('data-pair="3" data-side="word"')<html.indexOf('data-pair="1" data-side="word"'));
    if(mode==='picture'){assert.equal([...html.matchAll(/<img /g)].length,4);assert.ok(html.includes('pair-image-fallback'));assert.ok(!/https?:\/\//.test(html));}else{for(const pair of task.pairs)assert.ok(html.includes(pair.translation));assert.ok(html.includes('lang="tr"'));}
    const rects=tabletPairRects(task,order);assert.equal(rects.length,8);for(const r of rects){assert.ok(r.x>=0&&r.x+r.width<=1024);assert.ok(r.y>=120&&r.y+r.height<=640);assert.equal(order[r.side].includes(r.index),true);}
  }
});

test('physical matching tablet mirrors pair state and stays visible behind every customer table',()=>{
  const task=gameFor('picture','challenge').active.task,menuOrder={word:[3,1,0,2],match:[1,0,2,3]};
  for(const arena of ARENAS){
    const world=createRestaurant({arena:arena.id});world.tables.forEach(t=>t.guest.root.visible=true);
    for(const table of world.tables)for(const [width,height]of [[393,740],[360,640],[1440,900]]){
      const scene=new StationScene(world,{setting:'tablet',tableId:table.id,task,menuOrder});assert.equal(scene.hits.length,8);
      const frame=cameraFrame(width,height,{focus:{setting:'tablet',point:scene.cameraPoint.toArray(),angle:table.angle}}),camera=new THREE.OrthographicCamera(frame.left,frame.right,frame.top,frame.bottom,.1,90);camera.position.copy(frame.position);camera.lookAt(frame.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();world.root.updateMatrixWorld(true);
      const meshes=[];world.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});
      for(const hit of scene.hits){const position=hit.getWorldPosition(new THREE.Vector3()).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(position.x,position.y),camera);assert.ok(Math.abs(position.x)<.85);if(width<760)assert.ok(position.y>.25&&position.y<.85);assert.ok(ray.intersectObjects(meshes,false)[0]?.object===scene.tabletScreen,`${arena.id} table ${table.id} at ${width}x${height}: ${hit.userData.stationAction.side} ${hit.userData.stationAction.index} must be unobstructed`);}
      scene.react('tablet-pair',{matched:[1],selected:null});assert.ok(scene.hits.filter(h=>h.userData.stationAction.index===1).every(h=>!h.userData.enabled));assert.ok(scene.hits.filter(h=>h.userData.stationAction.index!==1).every(h=>h.userData.enabled));
      scene.react('tablet',task.answer);assert.ok(scene.matchState.complete);assert.ok(scene.hits.every(h=>!h.userData.enabled));scene.dispose();assert.equal(scene.disposed,true);
    }
  }
});

test('all shipped Fluent artwork is traceable, optimized and covered by the included Microsoft license',async()=>{
  const audit=JSON.parse(await readFile(new URL('../content/fluent-emoji-assets.json',import.meta.url),'utf8'));assert.equal(audit.license,'MIT');assert.match(audit.revision,/^[a-f0-9]{40}$/);
  let total=0;for(const asset of audit.assets){const bytes=await readFile(new URL('../public/assets/fluent/'+asset.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(bytes.length,asset.bytes);assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(asset.source.includes('/3D/'));total+=bytes.length;}
  assert.ok(audit.assets.length>=100);assert.ok(total<1500000,`Artwork size: ${total}`);
  const license=await readFile(new URL('../public/assets/fluent/LICENSE.txt',import.meta.url),'utf8');assert.ok(license.includes('MIT License'));assert.ok(license.includes('Microsoft Corporation'));
});

test('pair interaction gives a brief silent reaction before accepting another pair',async()=>{
  const game=gameFor();let spoken=0;const reactions=[];
  const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,getView:()=>({setSpeaking(){}}),audio:{speak:async()=>{spoken++;return {played:true};}},root:{querySelectorAll:()=>[]},epoch:1,busy:false,selectedPair:null,onChanged(){},feedback(){},syncMatching(action){reactions.push(action);}});
  await controller.choosePair('word',0);const pending=controller.choosePair('match',0);assert.equal(controller.busy,true);assert.deepEqual(game.active.matchedPairs,[0]);
  await controller.choosePair('word',1);assert.equal(controller.selectedPair,null);await pending;assert.equal(controller.busy,false);assert.equal(spoken,0);await controller.choosePair('word',1);assert.equal(controller.selectedPair.index,1);assert.ok(reactions.includes('tablet-pair'));
});
