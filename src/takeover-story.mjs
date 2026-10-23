import {createCafeMemory} from './cafe-memory.mjs';
import {finishGeometry} from './geometry-finish.mjs';
import * as THREE from 'three';
import {createEyes,createHand,updateChef,updateCharacterFace} from './character-craft.mjs';
import {overviewCamera} from './restaurant-camera.mjs';
import {CHECKOUT} from './fixtures.mjs';
import {TAKEOVER_SHOTS,TAKEOVER_DURATION,takeoverShot,takeoverCaption,openingBeat,OPENING_EVENTS as EVENTS,progress,smooth as ease} from './opening-direction.mjs';
export {TAKEOVER_SHOTS,TAKEOVER_DURATION,takeoverShot,takeoverCaption} from './opening-direction.mjs';
const down=new THREE.Vector3(0,-1,0);
const snapshot=nodes=>nodes.filter(Boolean).map(o=>({o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone(),visible:o.visible}));
const restore=states=>states.forEach(({o,position,quaternion,scale,visible})=>{o.position.copy(position);o.quaternion.copy(quaternion);o.scale.copy(scale);o.visible=visible;});
const vLight=light=>light?{intensity:light.intensity,color:light.color.clone()}:null;
export class TakeoverScene {
 constructor(view){
  this.view=view;this.world=view.world;this.elapsed=0;this.root=new THREE.Group();this.dirt=new THREE.Group();this.repairs=new THREE.Group();this.root.add(this.dirt,this.repairs);this.world.root.add(this.root);this.materials=new Set();
  const p=this.world.palette;this.brown=this.mat('#66523b');this.rust=this.mat('#9b6047');this.grey=this.mat('#aeb4b0');this.red=this.mat('#a74b3c');this.paper=this.mat('#f5e8cc');this.gold=this.mat('#dcbd74');
  this.oldWoman=this.makeOwner(p);this.root.add(this.oldWoman.root);
  // A modest doorway frames the handover while the restaurant remains behind it.
  this.doorway=new THREE.Group();this.root.add(this.doorway);for(const x of [-1.55,1.55])this.box(this.doorway,p.darkWood,x,1.5,4.76,.13,2.8,.14);this.box(this.doorway,p.green,0,2.97,4.76,3.3,.49,.18);
  this.sign(this.doorway,this.world.arenaInfo.name.toUpperCase(),[0,2.97,4.87],2.95,.33,'#fff1d2','#43614d');
  this.doorSign=new THREE.Group();this.doorSign.position.set(0,1.36,4.91);this.doorway.add(this.doorSign);this.closed=this.sign(this.doorSign,'CLOSED',[0,0,.005],.90,.34,'#f7ead1','#814c3d');this.open=this.sign(this.doorSign,'OPEN',[0,0,-.005],.90,.34,'#fff0bd','#37664e');this.open.rotation.y=Math.PI;
  for(let i=0;i<35;i++){const x=((i*47)%89)/10-4.3,z=((i*31)%79)/10-3.8+this.world.venue.centerZ;const patch=this.disc(this.dirt,this.brown,x,.13,z,.19+(i%4)*.07);patch.scale.z=.45+(i%3)*.18;patch.rotation.y=i*1.7;patch.userData.cleanAt=i/35;}
  const k=this.world.plan.kitchenZ;
  for(let i=0;i<12;i++){const patch=this.disc(this.dirt,this.brown,-3.2+i*.55,1.30,k+.15,.17);patch.userData.cleanAt=.4+i/24;}
  for(const t of this.world.plan.tables){const patch=this.box(this.dirt,this.brown,t[0],1.087,t[1],1.35,.025,.99);patch.userData.cleanAt=.66;for(let i=0;i<3;i++){const scratch=this.box(this.dirt,p.darkWood,t[0]-.42+i*.3,1.105,t[1],.018,.008,.68);scratch.rotation.y=.25;scratch.userData.cleanAt=.70;}}
  this.sign(this.repairs,'OUT OF ORDER',[0,1.60,k+.65],1.0,.38,'#fff0d5','#985347');
  const [cx,cz]=this.world.plan.checkout;this.sign(this.repairs,'OUT OF ORDER',[cx,1.88,cz+.15],1.1,.38,'#fff0d5','#985347');
  this.broom=new THREE.Group();this.root.add(this.broom);this.box(this.broom,p.wood,0,.48,0,.034,.85,.034);this.box(this.broom,p.gold,0,.09,0,.38,.13,.13);for(let i=0;i<7;i++)this.box(this.broom,this.brown,-.15+i*.05,.015,0,.025,.10,.10);
  this.tool=new THREE.Group();this.world.chef.arms[0].add(this.tool);this.box(this.tool,p.metal,0,-.34,.04,.035,.18,.035);this.box(this.tool,p.metal,0,-.44,.04,.11,.045,.035);
  this.keys=new THREE.Group();this.oldWoman.arms[1].add(this.keys);const ring=new THREE.Mesh(new THREE.TorusGeometry(.043,.008,5,16),this.gold);ring.position.set(0,-.29,.035);ring.userData.takeoverOwned=true;this.keys.add(ring);this.box(this.keys,this.gold,0,-.36,.035,.018,.10,.018);this.box(this.keys,this.gold,.026,-.40,.035,.065,.020,.018);
  this.actorHome=snapshot([this.world.chef.root,this.world.chef.body,this.world.chef.head,this.world.chef.eyes,this.world.chef.brows,this.world.chef.mouth,...this.world.chef.arms,...this.world.chef.legs]);
  this.ticketVisible=this.world.ticketRail.papers.visible;this.prepVisible=this.world.prepStatic.visible;this.chefHome=this.world.chef.root.position.clone();this.canopyVisible=this.world.canopy.visible;
  this.occluders=this.world.occluders.map(o=>[o,o.visible]);
  this.firstGuest=this.world.tables[0].guest.root;this.guestHome={position:this.firstGuest.position.clone(),rotation:this.firstGuest.rotation.clone()};
  // A small framed memory gives the restoration an object the player recognises.
  this.photo=createCafeMemory(p);this.root.add(this.photo);this.photo.position.set(-1.05,1.67,k+.74);
  this.photo.traverse(o=>{if(o.material?.map)this.materials.add(o.material);});
  this.rainVisible=this.world.atmosphereRain?.mesh.visible;if(this.world.atmosphereRain)this.world.atmosphereRain.mesh.visible=false;this.memoryVisible=this.world.memoryPhoto.visible;this.world.memoryPhoto.visible=false;
  this.photoDust=this.dustSurface(this.photo,.72,.40);this.photoDust.position.set(0,-.02,.06);
  this.floorDust=this.dustSurface(this.root,1.6,.75);this.floorDust.position.set(.15,.125,1.2);this.floorDust.rotation.x=-Math.PI/2;
  const table=this.world.plan.tables[0];this.tableDust=this.dustSurface(this.root,1.35,.82);this.tableDust.position.set(table[0],1.113,table[1]+.08);this.tableDust.rotation.x=-Math.PI/2;
  this.cloth=this.box(this.root,p.cream,0,0,0,.18,.035,.17);this.cloth.visible=false;
  this.sticky=this.ball(this.root,this.brown,0,0,0,.045);this.sticky.visible=false;
  this.stool=new THREE.Group();this.root.add(this.stool);this.stool.position.set(-.70,.13,k+1.10);this.box(this.stool,p.woodLight,0,.41,0,.60,.08,.48);for(const x of [-.23,.23])for(const z of [-.16,.16])this.box(this.stool,p.darkWood,x,.20,z,.06,.40,.06);
  this.panels=[];for(const [x,z]of [[.48,k+.69],[cx+.45,cz+.50]]){const panel=new THREE.Group();panel.position.set(x,1.08,z);this.root.add(panel);this.box(panel,this.grey,0,-.14,0,.28,.28,.035);this.ball(panel,p.gold,-.09,-.045,.027,.018);this.panels.push(panel);}
  this.pressButton=this.box(this.root,this.grey,cx+.45,1.11,cz+.50,.11,.075,.025);
  this.cookerDark=this.box(this.root,p.dark,0,.67,k+.633,.49,.32,.015);this.cookerGlow=this.box(this.root,p.glow,0,.67,k+.645,.47,.30,.015);
  this.flames=new THREE.Group();this.root.add(this.flames);for(const x of [-.34,.34]){const flame=this.mesh(this.flames,new THREE.TorusGeometry(.20,.016,5,16),this.mat('#72b4ce'),x,1.435,k);flame.rotation.x=-Math.PI/2;}
  this.screenCover=this.sign(this.world.checkout.screenMount,'',[0,0,.077],CHECKOUT.width,CHECKOUT.height,'#263d35','#263d35');this.screenReady=this.sign(this.world.checkout.screenMount,'READY TO SERVE',[0,0,.079],CHECKOUT.width,CHECKOUT.height,'#f4e5b9','#3f6c54');
  this.rolledCuffs=this.world.chef.arms.map(arm=>this.mesh(arm,new THREE.CylinderGeometry(.09,.09,.09,10),p.cream,0,-.135,0));
  this.roomSigns=[];this.world.root.traverse(o=>{if(o.isMesh&&o.material?.userData?.gameplaySign)this.roomSigns.push([o,o.visible]);});
  this.roomGlow=[];this.world.environment.traverse(o=>{if(o.isMesh&&o.material===p.glow)this.roomGlow.push([o,o.visible]);});
  this.lamp=this.ball(this.root,p.glow,1.48,2.65,4.77,.12);this.lamp.visible=false;
  this.savedSun=vLight(view.sun);this.savedSky=vLight(view.skyLight);
 }
 mat(color){const m=new THREE.MeshStandardMaterial({color,roughness:.84});this.materials.add(m);return m;}
 mesh(parent,geometry,material,x,y,z){const m=new THREE.Mesh(finishGeometry(geometry),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;m.userData.takeoverOwned=true;parent.add(m);return m;}
 box(parent,mat,x,y,z,w,h,d){return this.mesh(parent,new THREE.BoxGeometry(w,h,d),mat,x,y,z);}
 disc(parent,mat,x,y,z,r){return this.mesh(parent,new THREE.CylinderGeometry(r,r,.006,12),mat,x,y,z);}
 ball(parent,mat,x,y,z,r){return this.mesh(parent,new THREE.SphereGeometry(r,12,8),mat,x,y,z);}
 sign(parent,text,position,w,h,ink='#345543',paper='#f5e8cc'){
  let m=this.paper;if(typeof document!=='undefined'){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext?.('2d');if(c){c.fillStyle=paper;c.fillRect(0,0,512,128);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font='bold 44px Georgia';c.fillText(text,256,66,490);const map=new THREE.CanvasTexture(canvas);m=new THREE.MeshBasicMaterial({map});this.materials.add(m);}}
  return this.mesh(parent,new THREE.PlaneGeometry(w,h),m,...position);
 }
 makeOwner(p){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);const dress=p.clothes[4],skin=p.skins[0];this.mesh(body,new THREE.CylinderGeometry(.20,.30,.52,12),dress,0,.37,0);this.mesh(body,new THREE.CapsuleGeometry(.215,.25,4,12),dress,0,.77,0);this.box(body,p.cream,0,.76,.18,.14,.31,.025);
  for(const x of [-.13,.13]){this.box(body,p.dark,x,.10,.07,.17,.12,.27);for(const y of [.69,.77,.85])this.ball(body,p.gold,.055,y,.205,.012);}
  const head=new THREE.Group();head.position.y=1.17;body.add(head);this.ball(head,skin,0,0,0,.205).scale.set(.96,1.08,.94);this.ball(head,this.grey,0,.09,-.055,.209).scale.set(1,.7,.9);this.ball(head,this.grey,0,.15,-.19,.11);this.ball(head,skin,0,-.035,.182,.032);
  const {eyes,brows}=createEyes(p,p.leafDark,this.grey);head.add(eyes,brows);for(const x of [-.077,.077])this.mesh(head,new THREE.TorusGeometry(.049,.007,5,16),p.darkWood,x,.018,.211);this.box(head,p.darkWood,0,.02,.212,.05,.009,.009);
  const mouth=this.mesh(head,new THREE.TorusGeometry(.043,.006,5,16,Math.PI),p.smile,0,-.077,.182);mouth.rotation.z=Math.PI;mouth.scale.y=.5;
  const arms=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.245,.88,0);body.add(arm);this.mesh(arm,new THREE.CapsuleGeometry(.073,.19,3,8),dress,0,-.09,0);const hand=createHand(p,skin,{side,grip:true});hand.position.y=-.24;arm.add(hand);arms.push(arm);}
  return {root,body,head,arms,eyes,brows,mouth,seed:37};
 }
 dustSurface(parent,width,height){
  let map=null;if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=384;c.height=192;const ctx=c.getContext?.('2d');if(ctx){ctx.fillStyle='#68513ab0';for(let i=0;i<85;i++){ctx.beginPath();ctx.ellipse((i*83)%384,(i*43)%192,15+i%21,3+i%7,(i%7)*.17,0,Math.PI*2);ctx.fill();}map=new THREE.CanvasTexture(c);}}
  const material=new THREE.MeshBasicMaterial({color:map?'#ffffff':'#68513a',map,transparent:true,opacity:map?.85:.52,depthWrite:false});this.materials.add(material);const m=this.mesh(parent,new THREE.PlaneGeometry(width,height),material,0,0,0);m.userData.wipeWidth=width;return m;
 }
 wipe(surface,q){q=Math.max(0,Math.min(1,q));const w=surface.userData.wipeWidth,pos=surface.geometry.attributes.position,uv=surface.geometry.attributes.uv;for(const i of [0,2]){pos.setX(i,-w/2+w*q);uv.setX(i,q);}pos.needsUpdate=true;uv.needsUpdate=true;surface.visible=q<.999;surface.geometry.computeBoundingSphere();}
 reach(person,index,target,stretch=1.15){const arm=person.arms[index];person.root.updateWorldMatrix(true,true);const local=arm.parent.worldToLocal(new THREE.Vector3(...target)).sub(arm.position);arm.quaternion.setFromUnitVectors(down,local.clone().normalize());arm.scale.y=Math.min(stretch,Math.max(.85,local.length()/.34));}
 face(person,feeling='calm',look=0){person.eyes.position.x=look;person.brows.position.y=feeling==='concern'?.061:feeling==='determined'?.080:.074;person.mouth.scale.y=feeling==='concern'?.12:feeling==='relieved'?.64:.42;}
 closeFrame(point,offset,spanW=2.5,spanH=2.0){
  const v=this.view,width=v.container.clientWidth||390,height=v.container.clientHeight||844,aspect=width/height;
  const caption=v.storyCaptionHeight||145,rect={x:12,y:76,w:width-24,h:Math.max(115,height-88-caption)};
  const h=Math.max(spanW*height/rect.w,spanH*height/rect.h),target=new THREE.Vector3(...point),off=new THREE.Vector3(...offset),temp=new THREE.PerspectiveCamera();temp.position.copy(target).add(off);temp.lookAt(target);temp.updateMatrixWorld();
  const right=new THREE.Vector3(1,0,0).applyQuaternion(temp.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(temp.quaternion);
  target.addScaledVector(right,-((rect.x+rect.w/2)/width-.5)*h*aspect);target.addScaledVector(up,((rect.y+rect.h/2)/height-.5)*h);
  return {target,position:target.clone().add(off),left:-h*aspect/2,right:h*aspect/2,top:h/2,bottom:-h/2,up:new THREE.Vector3(0,1,0)};
 }
 update(){
  const v=this.view,w=this.world,t=this.elapsed,s=takeoverShot(t),beat=openingBeat(t),q=beat.progress,reduced=v.reduced,k=w.plan.kitchenZ,chef=w.chef,owner=this.oldWoman,table=w.plan.tables[0],[cx,cz]=w.plan.checkout;
  this.beat=beat.id;this.actionState={floor:progress(t,15.15,16.55),table:progress(t,16.9,18.1),photo:progress(t,19.15,EVENTS.photoClean),cookerWorking:t>=EVENTS.cookerWorking,tillWorking:t>=EVENTS.tillWorking};
  w.canopy.visible=false;w.ticketRail.papers.visible=false;w.prepStatic.visible=t>=26&&this.prepVisible;w.tables.forEach(o=>{o.guest.root.visible=false;o.foodRoot.visible=false;o.readyRoot.visible=false;});chef.root.visible=true;w.carrier.visible=false;
  for(const [o,visible]of this.occluders)o.visible=beat.id==='reveal'&&visible;for(const [o]of this.roomSigns)o.visible=false;for(const [o]of this.roomGlow)o.visible=false;
  updateChef(chef,t*2,{reduced});chef.head.rotation.set(0,0,0);chef.body.rotation.set(0,0,0);chef.body.scale.set(1,1,1);chef.arms.forEach((a,i)=>{a.rotation.set(-.3,0,(i?1:-1)*.1);a.scale.set(1,1,1);});this.face(chef);
  owner.body.position.y=0;owner.body.rotation.set(0,0,0);owner.head.rotation.set(0,0,0);owner.arms.forEach(a=>{a.rotation.set(0,0,0);a.scale.set(1,1,1);});updateCharacterFace(owner,t,{reduced});this.face(owner,'concern');
  owner.root.visible=t<9;this.doorway.visible=t<9||beat.id==='turn-open';this.doorSign.rotation.set(0,0,-.14*(1-ease(progress(t,1.4,EVENTS.signStraight))));if(t>=26)this.doorSign.rotation.y=Math.PI*ease(progress(t,26.45,26.95));this.open.visible=true;this.closed.visible=true;
  const keyHand=t>=EVENTS.keyTransfer?chef.arms[0]:owner.arms[1];if(this.keys.parent!==keyHand)keyHand.add(this.keys);this.keys.visible=t>=4&&t<7.7;this.keys.rotation.z=reduced?0:Math.sin(t*5)*.05;
  this.broom.visible=false;this.tool.visible=false;this.cloth.visible=false;this.sticky.visible=false;this.stool.visible=t>=18.3&&t<22;this.lamp.visible=t>=EVENTS.lights;this.flames.visible=this.actionState.cookerWorking;this.cookerDark.visible=!this.actionState.cookerWorking;this.cookerGlow.visible=this.actionState.cookerWorking;
  this.screenCover.visible=!this.actionState.tillWorking;this.screenReady.visible=this.actionState.tillWorking;this.pressButton.position.z=cz+.50;
  this.panels.forEach((o,i)=>{o.visible=t>=22+i*2&&t<24+i*2;o.rotation.x=-(1-ease(progress(t,i?25.05:23.05,i?EVENTS.tillPanelClosed:EVENTS.cookerPanelClosed)))*.85;});
  this.repairs.visible=t<26;this.repairs.children.forEach((o,i)=>o.visible=t<(i?EVENTS.tillWorking:EVENTS.cookerWorking));
  for(const d of this.dirt.children){const featured=Math.abs(d.position.x-table[0])<.8&&Math.abs(d.position.z-table[1])<.6&&d.position.y>1;d.visible=!featured&&t<15+(d.userData.cleanAt??.5)*3.1;}
  this.wipe(this.floorDust,this.actionState.floor);this.wipe(this.tableDust,this.actionState.table);this.wipe(this.photoDust,.22+.78*this.actionState.photo);this.photo.position.set(-1.05,1.67,k+.74);this.photo.rotation.z=-.12*(1-ease(progress(t,21.3,22)));this.rolledCuffs.forEach((o,i)=>o.visible=t>=13.65+i*.25);
  let frame;
  if(s.id==='memory'){
   chef.root.visible=false;owner.root.position.set(.16,.13,5.10);owner.root.rotation.y=Math.PI;
   if(beat.id==='remember')frame=this.closeFrame([-1.05,1.67,k+.74],[.7,.9,5],1.25,.95);
   else {if(t<2.8)this.reach(owner,0,[.38,1.30,4.96]);else{owner.root.rotation.y=Math.PI*(1-ease(q));owner.head.rotation.y=-.75*Math.sin(q*Math.PI);}
    frame=this.closeFrame([.1,1.38,5],[1.8,1.0,6],2.3,2.1);}
  }else if(s.id==='handover'){
   chef.root.position.set(-.34,.13,5.30);chef.root.rotation.y=Math.PI/2;owner.root.position.set(.34,.13,5.30);owner.root.rotation.y=-Math.PI/2;
   const offer=ease(progress(t,4,4.6)),release=1-ease(progress(t,7.7,8.1));chef.arms[0].rotation.x=-.3-1.22*offer*release;owner.arms[1].rotation.x=-1.4*release;
   if(!reduced&&t<7.7){chef.arms[0].rotation.z=Math.sin(t*6)*.018;owner.arms[1].rotation.z=-Math.sin(t*6)*.018;}
   if(t>=6.7){this.face(owner,'relieved',-.008);owner.head.rotation.x=-.09*Math.sin(progress(t,6.7,7.4)*Math.PI);chef.head.rotation.x=.10*Math.sin(progress(t,6.7,7.3)*Math.PI);}
   if(beat.id==='farewell'){owner.root.position.x=.34+ease(q)*2.8;owner.root.rotation.y=Math.PI/2;owner.body.rotation.z=reduced?0:Math.sin(q*15)*.018;chef.head.rotation.y=.36;}
   frame=this.closeFrame([t<7.7?0:.3,1.1,5.3],[1.1,1.0,6],t<7.7?1.9:2.8,1.8);
  }else if(beat.id==='sticky-table'){
   chef.root.position.set(table[0]+.30,.13,table[1]+.72);chef.root.rotation.y=Math.PI;
   const lift=ease(progress(t,9.7,10.25)),hand=[table[0]+.55+lift*.08,1.11+lift*.03,table[1]+.40];this.reach(chef,0,hand);chef.head.rotation.x=.20*(1-lift);chef.head.rotation.y=-.16*lift;this.face(chef,'concern');this.sticky.visible=t>9.65;this.sticky.position.set(...hand);this.sticky.scale.set(.8,.2,.7);frame=this.closeFrame([table[0]+.45,1.06,table[1]],[2.3,2.0,5],2.0,1.8);
  }else if(beat.id==='try-till'){
   chef.root.position.set(cx+.18,.13,cz+.80);chef.root.rotation.y=Math.PI;const press=Math.max(0,1-Math.abs(t-EVENTS.firstTillPress)/.13,1-Math.abs(t-EVENTS.secondTillPress)/.13);this.reach(chef,0,[cx+.45,1.11,cz+.52-press*.025]);this.pressButton.position.z-=press*.025;this.screenCover.material.color.set(press>.6?'#638571':'#ffffff');this.face(chef,'concern');chef.head.rotation.x=-.12;frame=this.closeFrame([cx+.24,1.38,cz+.45],[2.6,1.8,5],2.2,2.0);
  }else if(beat.id==='try-cooker'){
   chef.root.position.set(.24,.13,k+.95);chef.root.rotation.y=Math.PI;this.reach(chef,0,[.47,1.02,k+.66]);chef.arms[0].rotateY(reduced?0:Math.sin(q*7)*.24);chef.head.rotation.x=.1;this.face(chef,'concern');frame=this.closeFrame([.12,1.17,k+.45],[2.2,2.2,5],2.4,2.1);
  }else if(beat.id==='resolve'){
   chef.root.position.set(0,.13,1.1);chef.root.rotation.y=0;this.reach(chef,1,[.02,.97,1.29]);chef.root.updateWorldMatrix(true,true);const sleeve=chef.arms[1].localToWorld(new THREE.Vector3(0,-.12,.04));this.reach(chef,0,sleeve.toArray());chef.head.rotation.x=.16*(1-ease(q));this.face(chef,'determined');frame=this.closeFrame([0,1.10,1.1],[.8,1.0,6],1.7,1.8);
  }else if(beat.id==='sweep-floor'){
   const x=-.65+1.6*this.actionState.floor;chef.root.position.set(x-.27,.13,1.6);chef.root.rotation.y=0;this.broom.visible=true;if(this.broom.parent!==this.root)this.root.add(this.broom);this.broom.position.set(x,.14,1.22);this.broom.rotation.set(0,0,-.15);this.broom.scale.set(1,1,1);this.broom.updateWorldMatrix(true,true);const grip=this.broom.localToWorld(new THREE.Vector3(0,.75,0));this.reach(chef,1,grip.toArray(),1.3);frame=this.closeFrame([.1,.72,1.3],[1.7,3.3,5],2.3,2.0);
  }else if(beat.id==='wipe-table'){
   const x=table[0]-.675+1.35*this.actionState.table;chef.root.position.set(x-.245,.13,table[1]+.72);chef.root.rotation.y=Math.PI;this.cloth.visible=true;this.cloth.position.set(x,1.13,table[1]+.28);this.cloth.rotation.set(0,0,0);this.reach(chef,0,this.cloth.position.toArray());chef.head.rotation.x=.15;frame=this.closeFrame([table[0],1.04,table[1]+.2],[2.2,2.8,5],2.7,2.0);
  }else if(['notice-photo','wipe-photo','study-photo','straighten-photo'].includes(beat.id)){
   chef.root.position.set(-.70,.61,k+1.10);chef.root.rotation.y=Math.PI;chef.head.rotation.y=.18;chef.head.rotation.x=-.04;this.face(chef,t>=20.5?'relieved':'calm',.008);
   if(beat.id==='wipe-photo'){this.photo.updateWorldMatrix(true,true);const target=this.photo.localToWorld(new THREE.Vector3(-.36+.72*(.22+.78*this.actionState.photo),-.02,.09));this.cloth.visible=true;this.cloth.position.copy(target);this.cloth.rotation.set(Math.PI/2,0,this.photo.rotation.z);this.reach(chef,1,target.toArray(),1.35);}
   if(beat.id==='straighten-photo'){this.photo.updateWorldMatrix(true,true);const edge=this.photo.localToWorld(new THREE.Vector3(.35,0,.06));this.reach(chef,1,edge.toArray(),1.35);}
   frame=beat.id==='study-photo'?this.closeFrame([-.70,1.68,k+1.10],[5,1.3,-3],1.55,1.45):this.closeFrame([-1.0,1.63,k+.82],[-2.5,.7,5],beat.id==='notice-photo'?1.9:1.65,1.4);
  }else if(s.id==='repair'){
   const cooker=beat.id==='repair-cooker',x=cooker?.48:cx+.45,z=cooker?k+.69:cz+.50;chef.root.position.set(x-.245,.13,z+.32);chef.root.rotation.y=Math.PI;this.tool.visible=true;if(this.tool.parent!==chef.arms[0])chef.arms[0].add(this.tool);this.reach(chef,0,[x,1.01,z+.08]);chef.arms[0].rotateY(reduced?0:Math.sin(q*20)*.22);chef.head.rotation.x=.12;this.face(chef,'determined');frame=this.closeFrame([x,1.15,z],[2.1,1.8,5],2.0,1.9);
  }else{
   chef.root.position.set(-.5,.13,beat.id==='turn-open'?4.7:3.7);chef.root.rotation.y=0;
   if(beat.id==='turn-open'){this.reach(chef,1,[-.35,1.25,4.91]);frame=this.closeFrame([-.1,1.25,4.8],[2.4,.8,5],2.05,1.8);}
   else if(beat.id==='wait'){chef.head.rotation.x=-.035;this.face(chef,'calm');frame=this.closeFrame([-.5,1.13,3.7],[1.4,1.0,6],1.9,1.8);}
   else {const approach=w.plan.guestApproaches?.[0]?.point||[this.guestHome.position.x,table[1]+.85];const path=[[28.3,.45,5.3],[28.85,.45,4.6],[29.5,0,3.1],[30.35,0,approach[1]],[31.25,approach[0],approach[1]],[32,this.guestHome.position.x,this.guestHome.position.z]],index=Math.min(path.length-2,Math.max(0,path.reduce((last,p,i)=>t>=p[0]?i:last,0))),a=path[index],b=path[index+1],step=progress(t,a[0],b[0]);this.firstGuest.visible=true;this.firstGuest.position.set(THREE.MathUtils.lerp(a[1],b[1],step),THREE.MathUtils.lerp(.13,this.guestHome.position.y,ease(progress(t,31.65,32))),THREE.MathUtils.lerp(a[2],b[2],step));this.firstGuest.rotation.y=THREE.MathUtils.lerp(Math.atan2(b[1]-a[1],b[2]-a[2]),this.guestHome.rotation.y,ease(progress(t,31.65,32)));this.face(chef,'relieved',.014);chef.head.rotation.y=.5*ease(progress(t,28.3,28.8));chef.root.rotation.y=.35*ease(progress(t,28.7,29.3));
    frame=this.closeFrame([-.3,1.1,3.7],[1.4,1.0,6],1.9,1.8);
    if(beat.id==='reveal'){const wide=overviewCamera(v.container.clientWidth||390,v.container.clientHeight||844,{arena:w.arenaInfo.id,liveKitchen:true}),blend=reduced?1:ease(q);for(const key of ['left','right','top','bottom'])frame[key]=THREE.MathUtils.lerp(frame[key],wide[key],blend);frame.target.lerp(wide.target,blend);frame.position.lerp(wide.position,blend);}
   }
  }
  if(!reduced&&beat.id!=='reveal'){const zoom=1-ease(q)*.018;for(const key of ['left','right','top','bottom'])frame[key]*=zoom;}
  for(const key of ['left','right','top','bottom'])v.camera[key]=frame[key];v.camera.up.copy(frame.up);v.camera.position.copy(frame.position);v.camera.lookAt(frame.target);v.camera.updateProjectionMatrix();v.camera.updateMatrixWorld();v.cameraTarget.copy(frame.target);
  const warm=t<15?0:ease(progress(t,15,26));v.renderer.toneMappingExposure=.80+warm*.24;if(v.sun){v.sun.intensity=this.savedSun.intensity*(.72+warm*.28);v.sun.color.copy(this.savedSun.color).lerp(new THREE.Color('#ffe4b5'),warm*.2);}if(v.skyLight)v.skyLight.intensity=this.savedSky.intensity*(.8+warm*.2);
 }
 dispose(){
  const w=this.world;restore(this.actorHome);w.ticketRail.papers.visible=this.ticketVisible;w.prepStatic.visible=this.prepVisible;for(const [o,visible]of [...this.roomSigns,...this.roomGlow])o.visible=visible;w.memoryPhoto.visible=this.memoryVisible;if(w.atmosphereRain)w.atmosphereRain.mesh.visible=this.rainVisible;this.firstGuest.position.copy(this.guestHome.position);this.firstGuest.rotation.copy(this.guestHome.rotation);this.firstGuest.visible=false;w.chef.body.scale.y=1;for(const [o,visible]of this.occluders)o.visible=visible;if(this.savedSun){this.view.sun.intensity=this.savedSun.intensity;this.view.sun.color.copy(this.savedSun.color);}if(this.savedSky)this.view.skyLight.intensity=this.savedSky.intensity;w.chef.root.position.copy(this.chefHome);w.chef.root.rotation.set(0,0,0);w.chef.head.rotation.set(0,0,0);w.chef.arms.forEach((a,i)=>a.rotation.set(-.3,0,(i?1:-1)*.1));w.carrier.visible=false;w.canopy.visible=this.canopyVisible;
  this.broom.removeFromParent();this.tool.removeFromParent();this.keys.removeFromParent();this.screenCover.removeFromParent();this.screenReady.removeFromParent();this.rolledCuffs.forEach(o=>o.removeFromParent());this.root.removeFromParent();for(const root of [this.root,this.broom,this.tool,this.keys,this.screenCover,this.screenReady,...this.rolledCuffs])root.traverse(o=>{if(o.isMesh&&(o.userData.takeoverOwned||o.userData.ownedGeometry))o.geometry.dispose();});for(const m of this.materials){m.map?.dispose();m.dispose();}this.view.renderer.toneMappingExposure=1.02;
 }
}

export class TakeoverStory {
 constructor(root,{getView,onFinish,audio=null,onSound=null}){Object.assign(this,{root,getView,onFinish,audio,onSound});root.querySelector('#story-skip').addEventListener('click',()=>this.finish(false));root.querySelector('#story-next').addEventListener('click',()=>this.next());root.querySelector('#story-sound')?.addEventListener('click',()=>{this.onSound?.();this.render();this.syncAudio();});root.querySelector('#story-pause').addEventListener('click',()=>{this.paused=!this.paused;this.audio?.cancelSpeech();this.syncAudio();this.render();});}
 start(){this.elapsed=0;this.paused=false;this.active=true;this.lastShot=-1;this.lastCaption='';this.captionSize='';const v=this.getView();this.scene=new TakeoverScene(v);v.takeover=this.scene;this.root.hidden=false;document.getElementById('setup').inert=true;this.root.querySelector('#story-skip').focus();this.audio?.startStory();this.render();}
 syncAudio(){this.audio?.storyFrame(this.elapsed,{paused:this.paused||document.hidden||!!this.getView()?.contextLost});}
 tick(dt){if(!this.active)return;if(this.paused||document.hidden||this.getView()?.contextLost){this.syncAudio();return;}this.elapsed=Math.min(TAKEOVER_DURATION,this.elapsed+Math.max(0,Math.min(.25,dt)));this.scene.elapsed=this.elapsed;this.render();this.syncAudio();if(this.elapsed>=TAKEOVER_DURATION)this.finish(true);}
 render(){const s=takeoverShot(this.elapsed),caption=takeoverCaption(this.elapsed);this.root.dataset.shot=s.id;this.root.dataset.beat=openingBeat(this.elapsed).id;this.root.dataset.silent=String(!caption.text);this.root.dataset.paused=String(this.paused);if(this.lastShot!==s.index){this.lastShot=s.index;this.root.querySelector('#story-title').textContent=s.title;this.root.querySelector('#story-chapter').textContent=`A FRESH START · ${s.index+1} / ${TAKEOVER_SHOTS.length}`;this.root.querySelector('#story-next').textContent=s.index===TAKEOVER_SHOTS.length-1?'Open the café':'Continue';}
  const key=caption.speaker+caption.text;if(key!==this.lastCaption){this.lastCaption=key;this.root.querySelector('#story-copy').textContent=caption.text;const speaker=this.root.querySelector('#story-speaker');if(speaker){speaker.textContent=caption.speaker;speaker.hidden=!caption.speaker;}}
  this.root.querySelector('#story-progress').style.width=(this.elapsed/TAKEOVER_DURATION*100)+'%';this.root.querySelector('#story-pause').textContent=this.paused?'Resume scene':'Pause scene';
  const sound=this.root.querySelector('#story-sound');if(sound){const on=this.audio?.settings.music??false;sound.textContent=on?'Sound on':'Sound off';sound.setAttribute('aria-pressed',String(on));}
  const v=this.getView(),size=key+':'+this.paused+':'+v.container.clientWidth+':'+v.container.clientHeight;if(size!==this.captionSize){this.captionSize=size;const box=this.root.querySelector('.story-caption')?.getBoundingClientRect();if(box?.height)v.storyCaptionHeight=box.height;}
 }
 next(){const s=takeoverShot(this.elapsed);this.audio?.cancelSpeech();this.elapsed=s.start+s.duration;if(this.elapsed>=TAKEOVER_DURATION)this.finish(true);else{this.scene.elapsed=this.elapsed;this.render();this.audio?.seekStory(this.elapsed);this.syncAudio();}}
 finish(natural=false){if(!this.active)return;this.active=false;this.audio?.finishStory(natural);this.scene.dispose();this.getView().takeover=null;delete this.getView().storyCaptionHeight;this.root.hidden=true;document.getElementById('setup').inert=false;this.onFinish();}
}
