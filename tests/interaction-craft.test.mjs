import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {customerBehaviour} from '../src/customer-behaviour.mjs';
import {customerBehaviourProps,createCustomer,disposeCustomer} from '../src/customers.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {applySceneLighting} from '../src/scene-lighting.mjs';
import {TouchFeedback} from '../src/touch-feedback.mjs';
import {WashingConnections} from '../src/washing-connections.mjs';
import {Element} from './dom-double.mjs';
const state={status:'waiting',patience:90,maxPatience:100};
test('customer gestures describe order state without changing patience, answers or order data',()=>{
 for(const [data,kind]of [[state,'menu'],[{...state,partySize:2},'chat'],[{...state,status:'cooking'},'kitchen'],[{...state,patience:45},'watch'],[{...state,patience:20},'raise']]){
  const before=JSON.stringify(data),poses=Array.from({length:240},(_,i)=>customerBehaviour(data,i/20));assert.ok(poses.some(p=>p.kind===kind));assert.ok(poses.some(p=>p.kind==='rest'));assert.equal(JSON.stringify(data),before);for(const p of poses)for(const [k,v]of Object.entries(p))if(k!=='kind')assert.ok(Number.isFinite(v)&&Math.abs(v)<=1.61);
 }
});
test('guest gestures yield to English, explicit reactions, dining and reduced motion',()=>{
 for(let time=0;time<24;time+=.25){for(const options of [{protectedTime:true},{reduced:true}])assert.equal(customerBehaviour(state,time,options).kind,'rest');for(const data of [{...state,dining:{elapsed:1}},{...state,status:'empty'},{...state,status:'leaving'}])assert.equal(customerBehaviour(data,time).kind,'rest');}
 assert.notDeepEqual(customerBehaviour(state,2,{id:0}),customerBehaviour(state,2,{id:1}));
});
test('guest props reuse lazily created geometry and disappear when gestures end',()=>{
 const w=createRestaurant(),g=createCustomer(w.palette,7);customerBehaviourProps(g,w.palette,'rest');assert.equal(g.menuProp,undefined);customerBehaviourProps(g,w.palette,'menu');const m=g.menuProp;assert.equal(m.visible,true);customerBehaviourProps(g,w.palette,'watch');const watch=g.watchProp;assert.equal(m.visible,false);assert.equal(watch.visible,true);customerBehaviourProps(g,w.palette,'menu');assert.equal(g.menuProp,m);assert.equal(watch.visible,false);let owned=0,disposed=0;g.root.traverse(o=>{if(o.userData.ownedGeometry){owned++;o.geometry.addEventListener('dispose',()=>disposed++);}});disposeCustomer(g);assert.equal(disposed,owned);
});
test('venue finishes have distinct upholstery, shared cloth and glazed versus matte surfaces',()=>{
 const colors=[];for(const arena of ['courtyard','bistro','banquet']){const w=createRestaurant({arena}),p=w.palette;colors.push(p.upholstery.color.getHex());assert.ok(p.upholstery.roughness>.9&&p.white.roughness<.3);assert.ok(p.gold.metalness>.6);assert.ok(p.tableLinen.roughness>.9);assert.equal(w.characterContacts.instanceMatrix.count,w.tables.length*2+1);assert.equal(w.characterContacts.material,p.contact);assert.equal(w.characterContacts.castShadow,false);}assert.equal(new Set(colors).size,3);
});
test('English close-ups use the same neutral light across all restaurants and weather choices',()=>{
 let expected;for(const id of ['courtyard','bistro','banquet'])for(const atmosphere of ['breakfast','rain','evening']){const v={world:{arenaInfo:{id},atmosphere},focus:{setting:'recipe'},scene:Object.assign(new THREE.Scene(),{background:new THREE.Color()}),sun:new THREE.DirectionalLight(),fillLight:new THREE.DirectionalLight(),skyLight:new THREE.HemisphereLight(),renderer:{shadowMap:{}}};applySceneLighting(v);const value=[v.sun.color.getHex(),v.skyLight.color.getHex(),v.fillLight.color.getHex(),v.renderer.toneMappingExposure];expected??=value;assert.deepEqual(value,expected);}
});
function flightNode(){const n=new Element();n.rect={left:20,top:20,width:90,height:44};let resolve,reject;n.animate=(frames,options)=>{n.frames=frames;n.options=options;return {finished:new Promise((a,b)=>{resolve=a;reject=b;}),cancel(){reject(new Error('cancelled'));}};};return {n,finish:()=>resolve()};}
test('label returns and placements animate to measured targets, release nodes and respect reduced motion',async()=>{
 const fx=new TouchFeedback(),target=new Element();target.rect={left:200,top:300,width:120,height:80};const {n,finish}=flightNode();assert.equal(fx.fly(n,target,{returning:true}),true);assert.equal(n.options.duration,220);assert.equal(n.frames[1].translate,'195px 298px');assert.equal(fx.flights.size,1);finish();await Promise.resolve();assert.equal(fx.flights.size,0);const reduced=new TouchFeedback({reduced:()=>true});assert.equal(reduced.fly(flightNode().n,target),false);
});
test('closing or pausing clears all pending visual flights without touching game state',async()=>{
 const fx=new TouchFeedback(),target=new Element();target.rect={left:100,top:100,width:90,height:44};const {n}=flightNode();fx.fly(n,target);fx.clear();assert.equal(fx.flights.size,0);await Promise.resolve();assert.equal(n.parentElement,null);
});
test('washing highlights touch ownership and clears it on cancellation without accepting a word',()=>{
 const root=new Element();root.innerHTML='<div id="washing-plate"><button data-wash-block="0">We</button><button data-wash-block="1">cook</button></div>';const active={task:{variant:'washing',blocks:['We','cook']},ingredients:[],completed:false};let accepted=0;const ui=new WashingConnections(root,{getActive:()=>active,isPaused:()=>false,isReady:()=>true,onBlock:()=>{accepted++;return {correct:true};}}),node=ui.nodes[0];ui.down({target:node,pointerId:1,isPrimary:true,button:0,clientX:10,clientY:10});assert.equal(node.classList.contains('touch-held'),true);assert.equal(ui.plate.classList.contains('touch-destination'),true);ui.end({pointerId:1,type:'pointercancel'});assert.equal(accepted,0);assert.equal(node.classList.contains('touch-held'),false);assert.equal(ui.plate.classList.contains('touch-destination'),false);ui.destroy();
});
