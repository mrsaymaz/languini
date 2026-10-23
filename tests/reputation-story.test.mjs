import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {cleanReputation,cleanReputations,customerRating,ratingText,reputationAverage,reputationKey,reputationSnapshot,creditReview,REPUTATION_MILESTONES} from '../src/reputation.mjs';
import {BistroGame,ARENAS,loadProfile,saveProfile} from '../src/core.mjs';import {DINING,diningStage} from '../src/customer-reviews.mjs';import {ReviewCards} from '../src/review-cards.mjs';import {TakeoverScene,takeoverShot,TAKEOVER_DURATION,TAKEOVER_SHOTS} from '../src/takeover-story.mjs';import {createRestaurant} from '../src/restaurant.mjs';import {eventFor} from '../src/service-events.mjs';import {reputationResult} from '../src/reputation-ui.mjs';import {Element} from './dom-double.mjs';import {seeded,tick,finishShift} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank[0].units[0].tasks,config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};

test('existing category stars convert to five, with exact inherited average and idempotent review credit',()=>{
 assert.equal(customerRating({taste:3,service:3,speed:3}),5);assert.equal(ratingText(customerRating({taste:3,service:3,speed:2})),'4.4');assert.equal(ratingText(customerRating({taste:3,service:3,speed:2.5})),'4.7');assert.equal(customerRating({}),null);assert.equal(customerRating({taste:null,service:3,speed:3}),5);
 const s=cleanReputation();assert.equal(reputationAverage(s),2.1);assert.equal(reputationSnapshot(s).reviews,150);for(let i=1;i<=6;i++)assert.ok(creditReview(s,'1:'+i,5));assert.ok(Math.abs(reputationAverage(s)-345/156)<1e-10);assert.equal(s.count,6);assert.equal(creditReview(s,'1:6',1),null);assert.equal(creditReview(s,'bad',5),null);assert.equal(creditReview(s,'1:7',NaN),null);assert.equal(s.count,6);
});

test('reputation, intro completion and ownership survive saves independently of lessons and pace',()=>{
 const mem=new Map(),storage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v)},p=loadProfile(storage),key=reputationKey(config),state=cleanReputation({introSeen:true});creditReview(state,'1:1',5);p.reputations[key]=state;assert.ok(saveProfile(storage,p));const restored=loadProfile(storage);assert.deepEqual(restored.reputations[key],state);assert.equal(reputationKey({...config,unit:'g5u2',difficulty:'challenge'}),key);assert.notEqual(reputationKey({...config,team:'ravenclaw'}),key);assert.notEqual(reputationKey({...config,arena:'bistro'}),key);assert.equal(cleanReputations({'bad':state})['bad'],undefined);assert.equal(cleanReputation({count:-5,total:Infinity}).count,0);
});

test('all five story milestones are crossed once and keep earned visual progress after a lower review',()=>{
 const s=cleanReputation(),crossed=[];for(let i=1;i<=721;i++)crossed.push(...creditReview(s,'1:'+i,5).milestones.map(m=>m.rating));assert.deepEqual(crossed,REPUTATION_MILESTONES.map(m=>m.rating));assert.equal(s.level,5);creditReview(s,'2:1',1);assert.equal(s.level,5);assert.equal(creditReview(s,'2:2',5).milestones.length,0);assert.ok(REPUTATION_MILESTONES.every(m=>m.owner&&m.returning&&m.copy));
});

test('every regular shift has a complete pickup task, including every event candidate and both paces',()=>{
 for(const arena of ARENAS)for(const difficulty of ['relaxed','challenge'])for(const eventType of ['mixed','side','takeaway','together']){
  const g=finishShift({...config,arena:arena.id,difficulty},tasks,{eventType});assert.equal(g.result.won,true);assert.equal(g.history.filter(h=>h.setting==='pickup').length,1,`${arena.id}/${difficulty}/${eventType}`);assert.equal(g.takeawayScheduled,true);assert.ok(g.shiftReviews.length>0);assert.equal(g.reputation.count,g.shiftReviews.length);assert.equal(g.result.reputation.count,g.shiftReviews.length);assert.equal(g.result.reputation.before.average,2.1);assert.ok(g.result.reputation.after.average>2.1);
 }
 for(const arena of ARENAS){let history=[],ids=[];for(let i=0;i<8;i++){const e=eventFor(arena.id,history,()=>0);ids.push(e.id);history=[...history,e.id].slice(-4);}assert.equal(new Set(ids.slice(0,4)).size,4);assert.ok(ids.includes('takeaway'));}
});

test('a customer rating commits only after the card turns, freezes on pause and cannot pay twice',()=>{
 const g=new BistroGame(config,tasks,{rng:seeded()}),t=g.tables[0];g.start();g.active=null;Object.assign(t,{status:'leaving',name:'Cenk',dining:{elapsed:DINING.eat+DINING.review,ratings:{taste:3,service:3,speed:3}}});g.spawnClock=999;
 tick(g,DINING.spin-.2);assert.equal(g.reputation.count,0);g.paused=true;const elapsed=t.dining.elapsed;tick(g,20);assert.equal(t.dining.elapsed,elapsed);g.paused=false;tick(g,.3);assert.equal(diningStage(t.dining).stage,'score');assert.equal(g.reputation.count,1);assert.equal(t.dining.score,5);const events=g.drainEvents().filter(e=>e.type==='customer_rating');assert.equal(events.length,1);assert.equal(events[0].name,'Cenk');g.commitPendingReviews();g.finish(false);assert.equal(g.reputation.count,1);assert.equal(g.result.reputation.count,1);assert.equal(g.drainEvents().filter(e=>e.type==='customer_rating').length,0);
 const html=reputationResult(g.result.reputation);assert.match(html,/2\.10/);assert.match(html,/2\.12/);assert.match(html,/1 new review/);
});

test('named score reveals follow the card and reserve celebrations strictly for ratings above four',()=>{
 const previous=globalThis.document;globalThis.document={createElement:t=>new Element(t)};try{
  for(const score of [2,3.5,4,4.7,5]){const root=new Element(),ui=new ReviewCards(root),t={id:0,name:'Cenk',orderId:1,status:'leaving',dining:{elapsed:DINING.eat+DINING.review+.4,score,ratings:{taste:3,service:3,speed:3}}},g={state:'playing',tables:[t]},v={projectTable:()=>({x:195,y:400})};ui.update(g,v,390,844);assert.equal(ui.cards.size,1);assert.equal(ui.scores.size,0);t.dining.elapsed=DINING.eat+DINING.review+DINING.spin+.5;ui.update(g,v,390,844);assert.equal(ui.cards.size,0);assert.equal(ui.scores.size,1);assert.match(root.textContent,new RegExp('Cenk: '+score+' STARS'));assert.equal(ui.scores.get(1).dataset.high,String(score>4));assert.equal(ui.scores.get(1).dataset.perfect,String(score===5));t.status='empty';ui.update(g,v,390,844);assert.equal(root.children.length,0);}
 }finally{globalThis.document=previous;}
});

test('the handover, dirty-room inspection, cleaning, repairs and opening have finite phone/landscape scenes and clean disposal',()=>{
 assert.equal(TAKEOVER_SHOTS.length,6);assert.equal(TAKEOVER_DURATION,32);assert.equal(takeoverShot(0).id,'memory');assert.equal(takeoverShot(15).id,'cleaning');assert.equal(takeoverShot(32).id,'opening');
 for(const arena of ARENAS){const w=createRestaurant({arena:arena.id}),home=w.chef.root.position.clone(),v={world:w,container:{clientWidth:390,clientHeight:844},camera:new THREE.OrthographicCamera(-1,1,1,-1,.1,90),cameraTarget:new THREE.Vector3(),renderer:{toneMappingExposure:1},reduced:false},s=new TakeoverScene(v);
  for(const [width,height]of [[320,480],[390,844],[568,320]])for(const time of [1,5,9,12,15,19,27.5,31.8]){v.container.clientWidth=width;v.container.clientHeight=height;s.elapsed=time;s.update();assert.ok([v.camera.left,v.camera.right,v.camera.top,v.camera.bottom,...v.camera.position].every(Number.isFinite));if(time===1)assert.equal(s.oldWoman.root.visible,true);if(time===5)assert.ok(s.dirt.children.some(x=>x.visible));if(time===27.5){assert.ok(s.dirt.children.every(x=>!x.visible));assert.equal(s.repairs.visible,false);}}
  s.root.traverse(o=>{if(o.isMesh&&o.material.vertexColors)assert.ok(o.geometry.getAttribute('color'),'Story meshes retain the room’s baked vertex shading');});s.dispose();assert.equal(s.root.parent,null);assert.ok(w.chef.root.position.equals(home));assert.equal(s.broom.parent,null);assert.equal(s.tool.parent,null);
 }
});

 test('simultaneous customer scores take turns so phone celebrations cannot cover each other',()=>{
 const g=new BistroGame(config,tasks);g.start();g.active=null;g.spawnClock=9999;const scoreStart=DINING.eat+DINING.review+DINING.spin;
 for(const [i,t]of g.tables.slice(0,2).entries())Object.assign(t,{status:'leaving',name:i?'Ada':'Cenk',orderId:i+1,dining:{elapsed:scoreStart-.05,ratings:{taste:3,service:3,speed:3}}});
 tick(g,.1);assert.equal(g.tables.filter(t=>diningStage(t.dining)?.stage==='score').length,1);assert.equal(g.reputation.count,1);tick(g,DINING.score+.3);assert.equal(g.tables.filter(t=>diningStage(t.dining)?.stage==='score').length,1);assert.equal(g.reputation.count,2);tick(g,DINING.score+1);assert.equal(g.shiftReviews.length,2);
 });
