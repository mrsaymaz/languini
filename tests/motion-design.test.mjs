import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {cameraTravel,menuCameraPosition,smoothTravel,spongePosition} from '../src/motion-design.mjs';
import {RestaurantView,createRestaurant,cameraFrame} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {StationFeedback} from '../src/station-feedback.mjs';
import {WashingConnections} from '../src/washing-connections.mjs';
import {documentDouble} from './dom-double.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),sentence=bank[0].units[0].tasks.find(t=>t.kind==='sentence');
function viewFor(){const v=Object.assign(Object.create(RestaurantView.prototype),{container:{clientWidth:393,clientHeight:740},reduced:false,menu:false,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){}}});v.setRestaurant({});return v;}
const close=(a,b)=>assert.ok(a.distanceTo(b)<1e-8);

test('camera arcs have exact endpoints, smooth monotonic travel and bounded lift',()=>{
 const from=cameraFrame(393,740),goal=cameraFrame(393,740,{focus:{setting:'repair',point:[3.35,1.8,2.9]}});let previous=-1;
 for(let i=0;i<=100;i++){const t=i/100,p=cameraTravel(from,goal,t),ease=smoothTravel(t);assert.ok(ease>=previous);previous=ease;assert.ok(p.position.toArray().every(Number.isFinite));const linear=new THREE.Vector3().lerpVectors(from.position,goal.position,ease);assert.ok(p.position.distanceTo(linear)<=.207);}
 close(cameraTravel(from,goal,0).position,from.position);close(cameraTravel(from,goal,1).position,goal.position);close(cameraTravel(from,goal,1).target,goal.target);
 for(let i=0;i<120;i++)assert.ok(menuCameraPosition(from,i).distanceTo(from.position)<.112);close(menuCameraPosition(from,100,true),from.position);
});

test('venue reveal and task camera pause, settle exactly and honor reduced motion without changing the game',()=>{
 const v=viewFor(),g={paused:false,tables:[],loaded:[],jobs:[],state:'playing'};v.revealVenue();assert.ok(v.cameraFlight);const start=v.camera.position.clone();g.paused=true;v.update(1,.3,g);close(v.camera.position,start);assert.equal(v.cameraFlight.elapsed,0);g.paused=false;const saved=JSON.stringify(g);v.update(2,.8,g);assert.equal(v.cameraFlight,null);close(v.camera.position,v.cameraGoal.position);assert.equal(JSON.stringify(g),saved);
 v.focusTask('recipe',0,{task:sentence,recipe:0,order:[0,1,2]});assert.equal(v.stationReady(),false);v.update(3,.6,g);assert.equal(v.stationReady(),true);close(v.camera.position,v.cameraGoal.position);v.reduced=true;v.resize(true);v.revealVenue();assert.equal(v.cameraFlight,null);v.station.dispose();
});

test('ingredient landing ripples reuse one mesh, finish and dispose even after repeated actions',()=>{
 const root=new THREE.Group(),dish=new THREE.Group();root.add(dish);const fx=new StationFeedback(root);for(let i=0;i<100;i++)fx.ripple(dish,.46);assert.equal(fx.ripples.length,1);assert.equal(dish.children.length,1);fx.update(.15);assert.ok(fx.rippleMesh.material.opacity>0);fx.update(.3);assert.equal(fx.rippleMesh.visible,false);assert.equal(fx.ripples.length,0);fx.ripple(dish,.3);fx.update(0,true);assert.equal(fx.rippleMesh.visible,false);let disposed=0;fx.rippleMesh.geometry.addEventListener('dispose',()=>disposed++);fx.dispose();assert.equal(disposed,1);assert.equal(dish.children.length,0);
});

test('washing scrubs twice without moving word surfaces and the final rinse ends cleanly',()=>{
 const world=createRestaurant(),task={...sentence,variant:'washing'},s=new StationScene(world,{setting:'wash',task,order:[0,1,2],viewport:{width:393,height:740}}),w=s.washing,frame=s.focusSurface.mesh.matrix.clone(),from=w.hand.position.clone(),target=w.patches[0].center.clone().add(new THREE.Vector3(.1,-.1,.12));
 close(spongePosition(from,target,w.rest,0),from);close(spongePosition(from,target,w.rest,1),w.rest);
 s.react('wash-clean',{index:0,accepted:[0],animate:true});s.update(.25);assert.ok(w.hand.position.distanceTo(target)<.12);assert.ok(s.focusSurface.mesh.matrix.equals(frame));s.update(.45);close(w.hand.position,w.rest);
 s.react('wash-clean',{index:2,accepted:[0,1,2],animate:true});s.update(.2);assert.equal(w.rinse.visible,true);assert.ok(w.rinse.material.opacity>0);assert.ok(w.rinse.instanceMatrix.array.every(Number.isFinite));s.update(.7);assert.equal(w.rinse.visible,false);assert.equal(w.bubbles.visible,false);assert.equal(w.soapTrail.visible,false);assert.equal(w.sheen.visible,false);close(w.hand.position,w.rest);s.dispose();
 const restored=new StationScene(world,{setting:'wash',task,order:[0,1,2],viewport:{width:393,height:740}});restored.react('wash-clean',{accepted:[0,1,2],animate:false});assert.equal(restored.washing.rinse.visible,false);assert.equal(restored.motions.length,0);restored.dispose();
});

test('stationary washing links retain their SVG node instead of restarting the drawing each frame',()=>{
 const d=documentDouble(),root=d.createElement('div'),task={...sentence,variant:'washing'},active={task,ingredients:[],completed:false};root.innerHTML=taskMarkup(task,{order:[0,1,2]});d.body.append(root);const ui=new WashingConnections(root,{getActive:()=>active,isPaused:()=>false,isReady:()=>true,onBlock:()=>({correct:true})}),plate=root.querySelector('#washing-plate');plate.style.width='300px';plate.style.height='300px';active.ingredients=[0,1];ui.lines();const svg=root.querySelector('#washing-links'),first=svg.children[0];assert.ok(first);ui.lines();assert.ok(svg.children[0]===first);assert.equal(first.getAttribute('pathLength'),'1');ui.destroy();
});
