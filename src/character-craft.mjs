import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {finishGeometry} from './geometry-finish.mjs';
const cache=new Map();
function shape(key,make){if(!cache.has(key)){const g=finishGeometry(make());g.userData.shared=true;cache.set(key,g);}return cache.get(key);}
function mesh(parent,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(p,m,x,y,z,w,h,d,r=.02,detail=1){return mesh(p,shape(`b${w},${h},${d},${r},${detail}`,()=>new RoundedBoxGeometry(w,h,d,detail,Math.min(r,w/3,h/3,d/3))),m,x,y,z);}
function ball(p,m,x,y,z,r=.08,detail=12){return mesh(p,shape(`s${r},${detail}`,()=>new THREE.SphereGeometry(r,detail,Math.round(detail*2/3))),m,x,y,z);}
function cylinder(p,m,x,y,z,r1,r2,h){return mesh(p,shape(`c${r1},${r2},${h}`,()=>new THREE.CylinderGeometry(r1,r2,h,16)),m,x,y,z);}
export function batchCharacterPart(part){
 part.updateWorldMatrix(true,true);const inverse=part.matrixWorld.clone().invert(),groups=new Map(),old=[];
 part.traverse(o=>{if(!o.isMesh)return;let group=groups.get(o.material);if(!group){group=[];groups.set(o.material,group);}const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));group.push(g);old.push(o);});
 for(const o of old){o.removeFromParent();if(o.userData.ownedGeometry)o.geometry.dispose();}
 for(const [m,list]of groups){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());const o=mesh(part,g,m);o.userData.ownedGeometry=true;}
 return part;
}
// Wrist at the origin; joined fingers point along -Y. Batch by material.
export function createHand(p,skin,{side=1,grip=false,cuff=false,detail=1}={}){
 const g=new THREE.Group();g.userData.hand=true;g.userData.grip=grip;
 box(g,skin,0,-.048,.005,.12,.13,.075,.034,detail);
 for(let i=0;i<4;i++){const finger=box(g,skin,(i-1.5)*.027,-.125+(i===0||i===3?.009:0),grip?.035:.01,.026,grip?.062:.086,.033,.012,detail);finger.rotation.x=grip?-.65:-.08;}
 const thumb=box(g,skin,side*.071,-.045,.038,.045,.075,.045,.018,detail);thumb.rotation.z=side*.50;thumb.rotation.x=grip?-.45:0;
 if(cuff){box(g,p.white,0,.025,0,.157,.075,.12,.018);box(g,p.team,0,.001,.064,.11,.013,.012,.003);}
 return batchCharacterPart(g);
}
export function createEyes(p,iris=p.leafDark,browMaterial=p.hairs[0],detail=12){
 const eyes=new THREE.Group(),brows=new THREE.Group();eyes.position.y=.018;brows.position.y=.074;
 for(const x of [-.076,.076]){ball(eyes,p.white,x,0,.178,.029,detail).scale.set(.94,.78,.46);ball(eyes,iris,x,0,.193,.018,detail).scale.set(.86,1,.55);ball(eyes,p.white,x-.005,.006,.204,.0055).scale.z=.5;box(brows,browMaterial,x,0,.177,.067,.017,.015,.005).rotation.z=-Math.sign(x)*.08;}
 batchCharacterPart(eyes);batchCharacterPart(brows);return {eyes,brows};
}
export function facePose(time,seed=0,{reduced=false,speaking=false}={}){
 const phase=(time+seed*.71)%(4.6+(seed%4)*.43),blink=reduced?0:Math.max(0,1-Math.abs(phase-.13)/.10);
 return {eyeY:1-blink*.94,browY:speaking&&!reduced?.006*Math.sin(time*4):0};
}
export function updateCharacterFace(person,time,{reduced=false,speaking=false}={}){
 const pose=facePose(time,person.seed||0,{reduced,speaking});if(person.eyes)person.eyes.scale.y=pose.eyeY;if(person.brows)person.brows.position.y=.074+pose.browY;
}
// Detail is concentrated on the single playable chef; customer geometry keeps
// its existing budget. Every rigid part is still one draw object per material.
export function createChef(p){
 const root=new THREE.Group(),body=new THREE.Group(),torso=new THREE.Group();root.add(body);body.add(torso);const skin=p.skins[0],hair=p.hairs[0],cloth=p.chefCloth||p.white,leather=p.chefLeather||p.dark;
 // Bake garment / hardware colour into vertex attributes so a seam or button
 // does not require its own draw call. Each animation joint remains independent.
 const batch=part=>{
  if(p.chefFabric)part.traverse(o=>{if(!o.isMesh)return;const source=o.material,target=[cloth,p.team,p.cream,p.pants].includes(source)?p.chefFabric:[p.gold,p.metal].includes(source)?p.chefHardware:[p.dark,p.darkWood,leather].includes(source)?p.chefSole:null;if(!target)return;
   const old=o.geometry,g=old.clone(),colors=g.attributes.color;for(let i=0;i<colors.count;i++)colors.setXYZ(i,colors.getX(i)*source.color.r,colors.getY(i)*source.color.g,colors.getZ(i)*source.color.b);if(o.userData.ownedGeometry)old.dispose();o.geometry=g;o.material=target;o.userData.ownedGeometry=true;
  });
  return batchCharacterPart(part);
 };
 const soft=(g,m,x,y,z,w,h,d,r=.02)=>box(g,m,x,y,z,w,h,d,r,2);
 const smooth=(g,m,x,y,z,r)=>ball(g,m,x,y,z,r,24);
 const seam=(g,m,points,r=.003)=>{const key='chef-seam-'+JSON.stringify(points)+r;return mesh(g,shape(key,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),12,r,5,false)),m);};
 mesh(torso,shape('chef-torso-detailed',()=>new THREE.CapsuleGeometry(.215,.255,6,24)),cloth,0,.685,0).scale.z=.79;
 for(const side of [-1,1]){
  soft(torso,p.cream,side*.055,.872,.137,.085,.085,.035,.012).rotation.z=side*.4;
  soft(torso,p.team,side*.142,.76,.174,.045,.29,.025,.008).rotation.z=-side*.12;
  for(const y of [.74,.80]){smooth(torso,p.gold,side*.052,y,.185,.013);ball(torso,p.darkWood,side*.052,y,.197,.0035);}
  seam(torso,p.cream,[[side*.17,.70,.162],[side*.185,.62,.157],[side*.17,.46,.152]],.003);
  soft(torso,p.team,side*.205,.59,-.015,.045,.035,.30,.014);
 }
 soft(torso,p.team,0,.58,.18,.35,.34,.035,.035);
 // Bound pocket, folded lip and two practical tools, kept within the apron.
 soft(torso,p.cream,0,.50,.203,.22,.095,.012,.012);soft(torso,p.team,0,.518,.211,.19,.043,.009,.008);
 soft(torso,p.gold,0,.69,.207,.075,.028,.012,.006);
 for(const x of [-.158,.158])seam(torso,p.cream,[[x,.68,.204],[x,.57,.209],[x,.455,.202]],.0025);
 seam(torso,p.cream,[[-.09,.52,.217],[-.087,.468,.217],[0,.464,.217],[.087,.468,.217],[.09,.52,.217]],.002);
 soft(torso,p.metal,-.056,.551,.206,.012,.09,.012,.005);smooth(torso,p.metal,-.056,.600,.207,.018).scale.set(.75,1,.3);
 soft(torso,p.dark,.055,.552,.207,.013,.10,.013,.004);soft(torso,p.gold,.055,.59,.216,.008,.028,.006,.002);
 const legs=[];for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.108,.43,0);body.add(leg);
  soft(leg,p.pants,0,-.17,0,.153,.36,.16,.04);
  soft(leg,p.pants,0,-.357,0,.15,.04,.157,.012);
  seam(leg,p.dark,[[side*.047,-.02,.079],[side*.052,-.19,.083],[side*.045,-.32,.079]],.003);
  soft(leg,leather,0,-.424,.058,.18,.10,.27,.035);
  soft(leg,p.pants,0,-.409,.095,.16,.07,.17,.032);
  soft(leg,p.cream,0,-.462,.062,.174,.017,.255,.007);
  for(const y of [-.395,-.413])soft(leg,p.darkWood,0,y,.158,.11,.008,.012,.003);
  soft(leg,p.gold,0,-.382,.085,.065,.016,.065,.006);
  batch(leg);legs.push(leg);
 }
 const head=new THREE.Group();head.position.y=1.09;body.add(head);const shell=new THREE.Group();head.add(shell);
 smooth(shell,skin,0,0,0,.211).scale.set(.96,1.09,.92);cylinder(torso,skin,0,.918,0,.073,.073,.11);
 const back=smooth(shell,hair,0,.075,-.035,.211);back.scale.set(1,.65,1);
 for(const x of [-.201,.201]){smooth(shell,skin,x,-.015,0,.043).scale.z=.82;soft(shell,p.smile,x,-.014,.025,.021,.038,.008,.009);}
 smooth(shell,skin,0,-.039,.183,.038);soft(shell,skin,0,-.09,.14,.11,.065,.06,.025);
 // Swept locks blend into the established hairline rather than changing it.
 for(const side of [-1,1])for(let i=0;i<3;i++){const lock=smooth(shell,hair,side*(.159-i*.021),.095+i*.015,.105-i*.009,.05);lock.scale.set(.62,1.2,.42);lock.rotation.z=side*.45;}
 mesh(shell,shape('chef-hat-band-detailed',()=>new THREE.CylinderGeometry(.225,.215,.115,32)),cloth,0,.224,0);
 cylinder(shell,p.cream,0,.18,0,.224,.224,.022);
 for(const [x,y,z,r]of [[-.12,.335,0,.145],[.04,.367,.012,.165],[.15,.325,-.025,.135]])smooth(shell,cloth,x,y,z,r);
 for(let i=0;i<11;i++){const a=i/11*Math.PI*2;seam(shell,p.cream,[[Math.sin(a)*.220,.19,Math.cos(a)*.220],[Math.sin(a)*.224,.235,Math.cos(a)*.224],[Math.sin(a)*.225,.272,Math.cos(a)*.225]],.0025);}
 batch(shell);batch(torso);
 const {eyes,brows}=createEyes(p,p.leafDark,hair,20);head.add(eyes,brows);
 const mouth=mesh(head,shape('chef-smile-detailed',()=>new THREE.TorusGeometry(.043,.0075,8,28,Math.PI)),p.smile,0,-.078,.181);mouth.scale.y=.42;mouth.rotation.z=Math.PI;
 const arms=[];for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.245,.80,0);body.add(arm);
  mesh(arm,shape('chef-arm-detailed',()=>new THREE.CapsuleGeometry(.078,.17,5,20)),cloth,0,-.085,0);
  seam(arm,p.cream,[[side*.057,.015,.026],[side*.069,-.085,.029],[side*.055,-.17,.029]],.003);
  const hand=createHand({...p,white:cloth},skin,{side,grip:true,cuff:true,detail:2});hand.position.set(0,-.235,.012);arm.add(hand);arm.rotation.set(-.3,0,side*.10);batch(arm);arms.push(arm);
 }
 root.userData.modelDetail='stylised-mid-poly';
 return {root,body,head,arms,legs,eyes,brows,mouth,seed:0,skin,shirt:p.white};
}
export function chefPose(time,{moving=false,carrying=false,busy=false,reduced=false}={}){
 const swing=moving&&!reduced?Math.sin(time*15)*.38:0;
 return {headX:busy?.10:carrying?.055:0,legs:[swing,-swing],bodyY:moving&&!reduced?Math.abs(Math.sin(time*15))*.014:0,bodyZ:moving&&!reduced?Math.sin(time*15)*.018:0,arms:[0,1].map(i=>carrying?-1.42:busy?-.90+(reduced?0:Math.sin(time*12+i)*.08):-.30+(i?-swing:swing)*.72)};
}
export function updateChef(chef,time,options){const pose=chefPose(time,options);chef.body.position.y=pose.bodyY;chef.body.rotation.z=pose.bodyZ;chef.head.rotation.x=pose.headX;chef.legs?.forEach((leg,i)=>leg.rotation.x=pose.legs[i]);chef.arms.forEach((arm,i)=>arm.rotation.x=pose.arms[i]);updateCharacterFace(chef,time,options);}
