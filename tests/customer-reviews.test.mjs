import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BistroGame} from '../src/core.mjs';
import {DINING,diningDuration,diningStage,customerReview,eatingPose} from '../src/customer-reviews.mjs';
import {ReviewCards} from '../src/review-cards.mjs';
import {Element} from './dom-double.mjs';
import {seeded,tick,solveActive} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units[0];
const config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
function make(){const g=new BistroGame(config,unit.tasks,{rng:seeded(),demoSetting:'recipe'});g.arena={...g.arena,goal:1};g.start();g.openOrder(0);return g;}

test('Taste assesses all three phases, with independent service and answering speed ratings',()=>{
 const g=make(),t=g.tables[0];
 for(let phase=0;phase<3;phase++){
  assert.equal(g.active.prepPhase,phase);tick(g,phase===0?1:30);if(phase)for(let i=0;i<3;i++)g.recordMistake();
  solveActive(g,{advance:false});g.completeTask();
 }
 assert.equal(t.reviewScores.taste.length,3);assert.equal(t.reviewScores.service.length,0);assert.equal(t.reviewScores.speed.length,3);
 const r=customerReview(t,1);assert.equal(r.taste,2);assert.equal(r.service,3);assert.ok(r.speed<3);
 assert.equal(customerReview({...t,reviewScores:{taste:[1],service:[.2],speed:[0]}},.2).service,1);
 assert.deepEqual(customerReview({reviewScores:{taste:[1],service:[1],speed:[1]}},1),{taste:3,service:3,speed:3});
});

test('washing accuracy and actual dish backlog affect restaurant service quality',()=>{
 const g=make();g.active=null;g.kitchen={capacity:6,dirty:1};assert.equal(g.restaurantCleanliness(),1);g.kitchen.dirty=6;assert.ok(g.restaurantCleanliness()<.6);g.cleanlinessQuality=.4;g.kitchen.dirty=1;assert.equal(g.restaurantCleanliness(),.4);
});

test('the last guest eats, reviews, spins and departs before victory; paused time never counts',()=>{
 const g=make(),t=g.tables[0];solveActive(g);tick(g,25);assert.ok(g.serve(0));tick(g,1.2);
 assert.equal(g.served,1);assert.equal(g.state,'playing');assert.equal(g.closingService,true);assert.equal(diningStage(t.dining).stage,'eat');assert.equal(t.status,'leaving');
 assert.equal(g.openOrder(0),false);g.stock=0;assert.equal(g.openDelivery(),false);assert.equal(g.openWashing(),false);
 const start=t.dining.elapsed;g.paused=true;tick(g,90);assert.equal(t.dining.elapsed,start);g.paused=false;
 tick(g,DINING.eat);assert.equal(diningStage(t.dining).stage,'review');assert.equal(g.drainEvents().filter(e=>e.type==='customer_review').length,1);
 tick(g,DINING.review-.2);assert.equal(g.state,'playing');assert.equal(diningStage(t.dining).stage,'review');tick(g,.3);assert.equal(diningStage(t.dining).stage,'spin');
 tick(g,DINING.spin+DINING.score+DINING.depart+.3);assert.equal(g.state,'finished');assert.equal(g.result.won,true);assert.equal(t.status,'empty');assert.equal(g.drainEvents().filter(e=>e.type==='finish').length,1);
 const reward=g.runes;g.tick(100);assert.equal(g.runes,reward);assert.ok(t.dining.elapsed<=diningDuration);
});

test('review cards stay table-owned, show three labelled star rows and spin without blocking play',()=>{
 const previous=globalThis.document;globalThis.document={createElement:tag=>new Element(tag)};
 try{
  for(const [width,height]of [[320,480],[393,740],[844,390]]){
   const root=new Element(),cards=new ReviewCards(root),t={id:0,orderId:7,status:'leaving',dining:{elapsed:DINING.eat+.2,ratings:{taste:3,service:2,speed:1}}},g={state:'playing',tables:[t]},view={projectTable:()=>({x:width-10,y:height/2})};
   cards.update(g,view,width,height);const card=root.children[0];assert.equal(cards.cards.size,1);assert.equal(card.querySelectorAll('.rating-row').length,3);assert.equal(card.querySelectorAll('.earned').length,6);assert.ok(card.textContent.includes('Taste'));assert.ok(parseFloat(card.style.left)+parseFloat(card.style.width)/2<=width-11);
   const node=card;t.dining.elapsed=DINING.eat+DINING.review+DINING.spin/2;cards.update(g,view,width,height);assert.ok(cards.cards.get(7)===node);assert.ok(Math.abs(parseFloat(card.querySelector('.review-turntable').style.transform.split('rotateY(')[1])-186)<1e-6);
   view.reduced=true;cards.update(g,view,width,height);assert.match(card.querySelector('.review-turntable').style.transform,/rotateY\(0deg\)/);g.paused=true;const frozen=card.querySelector('.review-turntable').style.transform;cards.update(g,view,width,height);assert.equal(card.querySelector('.review-turntable').style.transform,frozen);
   t.status='empty';cards.update(g,view,width,height);assert.equal(cards.cards.size,0);assert.equal(root.children.length,0);
  }
 }finally{globalThis.document=previous;}
 const css=fs.readFileSync(new URL('../public/customer-reviews.css',import.meta.url),'utf8');assert.match(css,/pointer-events:none/);
 for(const reduced of [false,true])for(let t=0;t<4;t+=.1)for(const n of Object.values(eatingPose(t,{reduced})))assert.ok(Number.isFinite(n));
});
