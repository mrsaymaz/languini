import {createHand,createEyes,batchCharacterPart} from './character-craft.mjs';
import {finishGeometry} from './geometry-finish.mjs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CUSTOMER_PROFILES} from './customer-profiles.mjs';
const cache=new Map();
function geometry(key,make){if(!cache.has(key)){const g=finishGeometry(make());g.userData.shared=true;cache.set(key,g);}return cache.get(key);}
function mesh(p,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
const box=(p,m,x,y,z,w,h,d,r=.025)=>mesh(p,geometry(`b${w},${h},${d},${r}`,()=>new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3))),m,x,y,z);
const ball=(p,m,x,y,z,r=.1)=>mesh(p,geometry(`s${r}`,()=>new THREE.SphereGeometry(r,12,9)),m,x,y,z);
const ring=(p,m,x,y,z,r=.048,t=.009)=>mesh(p,geometry(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,5,18)),m,x,y,z);
function batch(part){
  part.updateMatrixWorld(true);const inv=part.matrixWorld.clone().invert(),groups=new Map(),old=[];
  part.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;if(!groups.has(key))groups.set(key,{m:o.material,list:[]});const clone=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();clone.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));groups.get(key).list.push(clone);old.push(o);});
  old.forEach(o=>o.removeFromParent());for(const {m,list}of groups.values()){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());const o=mesh(part,g,m);o.userData.ownedGeometry=true;}
}
export function createCustomer(p,id=0,{standing=false,walkable=false}={}){
  const profile=CUSTOMER_PROFILES[((id%CUSTOMER_PROFILES.length)+CUSTOMER_PROFILES.length)%CUSTOMER_PROFILES.length],root=new THREE.Group(),body=new THREE.Group();root.add(body);body.scale.set(profile.width,profile.height,profile.width);
  const skin=p.skins[profile.skin],hair=p.hairs[profile.hair],shirt=p.clothes[profile.shirt],accent=p.clothes[(profile.shirt+3)%p.clothes.length];
  const seatedLegs=walkable?new THREE.Group():body;if(walkable)body.add(seatedLegs);
  if(!standing)for(const x of [-.105,.105]){box(seatedLegs,p.pants,x,.18,.14,.14,.32,.14);box(seatedLegs,p.pants,x,.35,.025,.14,.14,.30);box(seatedLegs,p.dark,x,.035,.23,.18,.09,.27);}
  if(standing)for(const x of [-.105,.105]){box(body,p.pants,x,.245,0,.14,.45,.14);box(body,p.dark,x,.035,.05,.18,.09,.27);}
  mesh(body,geometry('torso',()=>new THREE.CapsuleGeometry(.215,.23,4,10)),shirt,0,.67,0).scale.z=.76;
  if(profile.outfit==='striped')for(const y of [.57,.67,.77])for(const z of [-.156,.156])box(body,p.cream,0,y,z,.35,.035,.015,.004);
  if(profile.outfit==='cardigan'||profile.outfit==='jacket'){box(body,p.cream,0,.66,.163,.12,.35,.025,.008);for(const x of [-.085,.085]){const lapel=box(body,accent,x,.79,.17,.09,.16,.025,.008);lapel.rotation.z=-Math.sign(x)*.25;}for(const y of [.57,.66,.75])ball(body,p.gold,.04,y,.19,.013);for(const x of [-.145,.145]){box(body,accent,x,.565,.17,.09,.095,.025,.012);box(body,p.cream,x,.60,.186,.07,.009,.009,.003);}}
  if(profile.outfit==='hoodie'){const hood=ball(body,accent,0,.87,-.12,.18);hood.scale.set(1,.75,.6);for(const x of [-.06,.06])box(body,p.cream,x,.75,.176,.014,.14,.015,.004);box(body,accent,0,.56,.17,.25,.09,.025,.015);}
  if(profile.outfit==='polo'){for(const x of [-.045,.045])box(body,p.cream,x,.84,.16,.07,.06,.025,.01).rotation.z=Math.sign(x)*.35;box(body,accent,0,.74,.175,.025,.13,.015,.003);}
  const neck=ball(body,skin,0,.91,0,.073);neck.scale.y=1.3;
  const head=new THREE.Group();head.position.y=1.09;body.add(head);
  ball(head,skin,0,0,0,.21).scale.set(.94,1.08,.91);
  const cap=mesh(head,geometry('hair-cap',()=>new THREE.SphereGeometry(.217,14,8,0,Math.PI*2,0,Math.PI*.40)),profile.hairstyle==='scarf'?accent:hair,0,.015,-.015);cap.scale.set(1,1,1.02);
  if(['crop','sidepart','swept'].includes(profile.hairstyle))for(let i=0;i<4;i++){const fringe=ball(head,hair,-.13+i*.085,.115+(profile.hairstyle==='swept'?i*.018:0),.11,.075);fringe.scale.set(.85,.65,.72);}
  if(profile.hairstyle==='sidepart')box(head,hair,-.16,.04,.09,.06,.16,.09,.02);
  if(profile.hairstyle==='curls'||profile.hairstyle==='coils')for(let i=0;i<11;i++){const a=i*2.4,r=profile.hairstyle==='coils'?.21:.18;ball(head,hair,Math.cos(a)*r,.10+(i%3)*.045,Math.sin(a)*r,.075+(i%2)*.013);}
  if(profile.hairstyle==='bob'){box(head,hair,0,-.055,-.12,.37,.30,.17,.07);for(const x of [-.18,.18])box(head,hair,x,-.045,.015,.07,.26,.19,.035);}
  if(profile.hairstyle==='ponytail'){ball(head,hair,0,-.005,-.20,.12);box(head,accent,0,-.055,-.24,.15,.04,.12,.012);for(let i=0;i<3;i++)ball(head,hair,.02,-.11-i*.07,-.23,.095-i*.01);}
  if(profile.hairstyle==='braids')for(const x of [-.18,.18]){for(let i=0;i<4;i++)ball(head,hair,x+(i%2?.014:-.014),-.09-i*.065,.015,.048);box(head,accent,x,-.30,.015,.055,.035,.06,.01);}
  if(profile.hairstyle==='bun'){ball(head,hair,0,.17,-.17,.12);ring(head,accent,0,.17,-.225,.075,.012);}
  if(profile.hairstyle==='scarf'){box(head,accent,0,-.11,-.125,.40,.37,.19,.07);for(const x of [-.17,.17])box(head,accent,x,-.10,.02,.065,.31,.12,.025);box(body,accent,0,.85,.10,.32,.17,.18,.045);}
  for(const x of [-.20,.20])ball(head,skin,x,-.012,0,.041);
  ball(head,skin,0,-.037,.181,.036);batch(head);
  const {eyes,brows}=createEyes(p,profile.id%3===0?p.leafDark:p.dark,hair);head.add(eyes,brows);
  const mouth=mesh(head,geometry('customer-smile',()=>new THREE.TorusGeometry(.043,.0075,5,18,Math.PI)),p.smile,0,-.078,.182);mouth.scale.y=.42;mouth.rotation.z=Math.PI;
  if(profile.glasses!=='none'){const glasses=new THREE.Group();head.add(glasses);
    for(const x of [-.077,.077])if(profile.glasses==='round')ring(glasses,p.darkWood,x,.02,.205,.051,.008);else{for(const dy of [-.038,.038])box(glasses,p.dark,x,.02+dy,.204,.102,.013,.014,.004);for(const dx of [-.047,.047])box(glasses,p.dark,x+dx,.02,.204,.012,.077,.014,.004);}
    box(glasses,p.dark,0,.028,.21,.043,.013,.015,.004);for(const x of [-.17,.17])box(glasses,p.dark,x,.033,.11,.014,.015,.19,.004);
    batchCharacterPart(glasses);
  }
  // Batch only the torso; the head, mouth and arms retain independent animation.
  head.removeFromParent();if(walkable)seatedLegs.removeFromParent();batch(body);body.add(head);if(walkable){batch(seatedLegs);body.add(seatedLegs);}
  const arms=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.245,.78,0);body.add(arm);mesh(arm,geometry('arm',()=>new THREE.CapsuleGeometry(.073,.18,3,8)),shirt,0,-.09,0);const hand=createHand(p,skin,{side,grip:true});hand.position.set(0,-.23,.015);arm.add(hand);arm.rotation.set(-.85,0,side*.14);arms.push(arm);}
  const standingLegs=walkable?new THREE.Group():null,legs=[];
  if(walkable){body.add(standingLegs);standingLegs.visible=false;for(const x of [-.105,.105]){const leg=new THREE.Group();leg.position.set(x,.46,0);standingLegs.add(leg);box(leg,p.pants,0,-.22,0,.14,.45,.14);box(leg,p.dark,0,-.425,.05,.18,.09,.27);batch(leg);legs.push(leg);}}
  root.userData.customerId=profile.id;return {root,body,head,arms,mouth,eyes,brows,profile,skin,shirt,seated:!standing,seed:profile.id,...(walkable?{seatedLegs,standingLegs,legs}: {})};
}
export function disposeCustomer(customer){customer.root.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();});customer.root.removeFromParent();}

export function ensureCustomerUtensil(guest,p){
 if(guest.utensil)return guest.utensil;const spoon=new THREE.Group();guest.arms[1].add(spoon);
 box(spoon,p.metal,0,-.31,.055,.018,.18,.018,.006);ball(spoon,p.metal,0,-.405,.055,.033).scale.set(.65,1.2,.35);batch(spoon);guest.utensil=spoon;return spoon;
}

// Props are created only when a live guest needs them; geometry and finishes share caches.
export function customerBehaviourProps(guest,p,kind){
 if(kind==='menu'&&!guest.menuProp){const menu=new THREE.Group();guest.arms[0].add(menu);box(menu,p.carton,.18,-.29,.13,.32,.26,.024,.01);for(let i=0;i<3;i++)box(menu,p.green,.18,-.23-i*.06,.145,.20-i*.025,.012,.004,.001);batch(menu);guest.menuProp=menu;}
 if(kind==='watch'&&!guest.watchProp){const watch=new THREE.Group();guest.arms[0].add(watch);box(watch,p.dark,0,-.21,.035,.095,.04,.09,.01);box(watch,p.metal,0,-.21,.086,.06,.035,.015,.008);batch(watch);guest.watchProp=watch;}
 if(guest.menuProp)guest.menuProp.visible=kind==='menu';if(guest.watchProp)guest.watchProp.visible=kind==='watch';
}

export function customerWalkPose(guest,time,{standing=false,walking=false,reduced=false}={}){
 if(!guest.standingLegs)return;guest.seatedLegs.visible=!standing;guest.standingLegs.visible=standing;
 guest.legs.forEach((leg,i)=>leg.rotation.x=walking&&!reduced?Math.sin(time*10+i*Math.PI)*.30:0);
 guest.body.position.y=walking&&!reduced?Math.abs(Math.sin(time*10))*.018:0;
 if(standing){guest.arms.forEach((arm,i)=>arm.rotation.set(walking&&!reduced?Math.sin(time*10+i*Math.PI)*.22:-.18,0,i?.10:-.10));}
}
