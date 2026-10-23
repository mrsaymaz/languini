import test from 'node:test';
import assert from 'node:assert/strict';
import {Element,documentDouble} from './dom-double.mjs';
import {OwnerGuide,ownerInstruction,ownerClue} from '../src/owner-guide.mjs';
function fixture(t,{mode='auto',saved=[],brokenStorage=false}={}){
 const old=globalThis.document,doc=documentDouble();globalThis.document=doc;t.after(()=>globalThis.document=old);
 Element.prototype.replaceChildren=function(...nodes){this.children=[];this.append(...nodes);};
 Object.defineProperty(Element.prototype,'isConnected',{configurable:true,get(){return this.root()===doc.body;}});
 const root=doc.getElementById('task-card');root.innerHTML='<div class="station-status"><span class="station-mark"></span><span class="station-description"><b>Recipe</b><small>Original station information</small></span></div>';
 const query=root.querySelector.bind(root);root.querySelector=s=>s==='.station-status > span:last-child'?query('.station-description'):query(s);
 const values=new Map([['languini-owner-guidance-v1',JSON.stringify(saved)]]),storage={getItem:k=>{if(brokenStorage)throw Error('blocked');return values.get(k);},setItem:(k,v)=>{if(brokenStorage)throw Error('blocked');values.set(k,v);}};
 const active={task:{kind:'sentence',blocks:['I','like','pasta']},attempts:0},game={active,paused:false,served:0};let notices=[];
 const guide=new OwnerGuide({storage,getGame:()=>game,getMode:()=>mode,notify:(...args)=>notices.push(args)});guide.openStation(active);return {guide,game,active,values,root,notices};
}
test('first-use guidance saves separately and manual Help remains available after dismissal',t=>{
 const f=fixture(t);assert.ok(f.guide.remaining>0);assert.match(f.guide.note.textContent,/Drag an ingredient/);f.guide.dismiss();assert.equal(f.guide.original.hidden,false);
 f.guide.openStation(f.active);assert.equal(f.guide.remaining,0);f.guide.button.click();assert.ok(f.guide.remaining>0);assert.equal(f.guide.button.getAttribute('aria-expanded'),'true');
 const saved=JSON.parse(f.values.get('languini-owner-guidance-v1'));assert.ok(saved.includes('station:recipe:sentence'));
});
test('pause and camera readiness protect guidance time; closing a task discards its message',t=>{
 const {guide,game}=fixture(t);const before=guide.remaining;game.paused=true;guide.tick(5);assert.equal(guide.remaining,before);game.paused=false;game.taskTimingReady=false;guide.tick(5);assert.equal(guide.remaining,before);game.taskTimingReady=true;guide.tick(1);assert.equal(guide.remaining,before-1);game.active=null;guide.tick(1);assert.equal(guide.active,null);assert.equal(guide.remaining,0);
});
test('repeated mistakes and successful recovery select distinct poses without changing scoring state',t=>{
 const {guide,game,active}=fixture(t);active.attempts=2;const before=JSON.stringify(game);guide.event({type:'incorrect'});assert.match(guide.image.src,/think-160/);assert.doesNotMatch(guide.note.textContent,/I|pasta/);guide.event({type:'correct'});assert.match(guide.image.src,/smile-160/);assert.equal(JSON.stringify(game),before);
});
test('quiet mode suppresses automatic tips and reactions while permitting requested help',t=>{
 const {guide,game,active,notices}=fixture(t,{mode:'off'});assert.equal(guide.remaining,0);active.attempts=3;guide.event({type:'incorrect'});assert.equal(guide.remaining,0);guide.button.click();assert.ok(guide.remaining>0);game.served=3;guide.event({type:'served'});assert.equal(notices.length,0);
});
test('served milestones have a cooldown and do not backlog into the next task',t=>{
 const {guide,game,notices}=fixture(t);game.served=3;guide.event({type:'served'});assert.equal(notices.length,1);game.served=6;guide.event({type:'served'});assert.equal(notices.length,1);guide.clock+=26;guide.event({type:'served'});assert.equal(notices.length,2);game.closingService=true;guide.clock+=26;game.served=9;guide.event({type:'served'});assert.equal(notices.length,2);
});
test('blocked storage does not stop play and resetting tips restores first-use explanations',t=>{
 const {guide,active}=fixture(t,{brokenStorage:true});guide.start();guide.dismiss();guide.reset();guide.openStation(active);assert.ok(guide.remaining>0);
});
test('instruction and hint text follows real task types without supplying sentence answers',()=>{
 assert.match(ownerInstruction({task:{kind:'completion'}}),/send the ticket/);assert.match(ownerInstruction({task:{kind:'matching',mode:'audio-translation'}}),/Listen/);assert.match(ownerInstruction({task:{kind:'repair'},repairFound:true}),/Clear/);assert.match(ownerInstruction({task:{kind:'sentence',variant:'washing'}}),/clean/);assert.match(ownerClue({task:{kind:'sentence',answer:'I like pasta'}}),/continues/);
});
