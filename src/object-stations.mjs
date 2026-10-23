import {animatePreparation} from './preparation-motion.mjs';
import * as THREE from 'three';
import {buildWashingScene} from './washing-scene.mjs';
import {stationViewport} from './object-layout.mjs';
import {createPrepBase,createPrepIngredient,createPrepJug,createVessel,createFoodLayer} from './food.mjs';
import {RECIPES,PREP_PHASE_COUNT,PREP_PHASE_NAMES} from './menu.mjs';
import {prepBoardLayout} from './prep-layout.mjs';
import {receivingLayout} from './receiving-layout.mjs';
import {createDeliveryPackage,packageVariant} from './delivery-props.mjs';
import {browserTextMeasure,textLines} from './page-fit.mjs';
import {contactShadow} from './art-direction.mjs';

function plane(s,key,parent,width,height,position,rotation=[0,0,0],color='#fff6df'){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),s.canvasMaterial(ctx=>{ctx.fillStyle=color;ctx.fillRect(0,0,1024,640);},{color}));
  m.position.set(...position);m.rotation.set(...rotation);m.receiveShadow=true;parent.add(m);const surface={mesh:m,width,height};s.surfaces[key]=surface;return surface;
}
function board(s,viewport,setting,center){
  const rect=stationViewport(viewport.width,viewport.height,setting),w=3.3,h=w*rect.height/rect.width/(setting==='recipe'?Math.cos(Math.atan2(4.5,10)):1);
  s.box(s.root,s.p.darkWood,center[0],center[1]-.045,center[2],w+.10,.12,h+.10,.075);
  s.box(s.root,s.p.woodLight,...center,w,.12,h,.06);
  const surface=plane(s,'board',s.root,w,h,[center[0],center[1]+.066,center[2]],[-Math.PI/2,0,0],'#d4a36c');s.focusSurface=surface;s.cameraOffset=setting==='recipe'?[0,10,4.5]:[0,12,.06];
  s.replaceMaterial(surface.mesh,s.canvasMaterial(ctx=>{
    ctx.fillStyle='#d6b48d';ctx.fillRect(0,0,1024,640);
    for(let x=0;x<1024;x+=128){ctx.fillStyle=x%256?'#d1ad83':'#d8b78f';ctx.fillRect(x,0,127,640);ctx.fillStyle='#8b634b28';ctx.fillRect(x,0,2,640);}
    for(let i=0;i<64;i++){const x=(i*67)%1024;ctx.strokeStyle=i%3?'#f7e7cd24':'#97634312';ctx.lineWidth=i%4?1:2;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+Math.sin(i)*17,180,x-Math.cos(i)*13,410,x+Math.sin(i*2)*8,640);ctx.stroke();}
    ctx.strokeStyle='#f6dab059';ctx.lineWidth=8;ctx.strokeRect(9,9,1006,622);
    // Routed juice groove and restrained knife marks remain part of the wood,
    // beneath every native card and the unchanged full-size serving vessel.
    ctx.strokeStyle='#7e593c40';ctx.lineWidth=3;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(24,24,976,592,18);else ctx.rect(24,24,976,592);ctx.stroke();
    ctx.strokeStyle='#fff1d333';ctx.lineWidth=2;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(28,28,968,584,16);else ctx.rect(28,28,968,584);ctx.stroke();
    for(let i=0;i<17;i++){ctx.strokeStyle=i%2?'#72523b15':'#fff2dc24';ctx.lineWidth=1;const x=110+i*39,y=190+i%4*44;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+44,y+23);ctx.stroke();}
  },{color:'#d4aa79'}));
  const at=(u,v,y=.10)=>surface.mesh.localToWorld(new THREE.Vector3((u-.5)*w,(.5-v)*h,y));
  s.world.root.updateMatrixWorld(true);
  for(const u of [.025,.975])for(const v of [.018,.982]){const p=at(u,v,.012);s.cylinder(s.root,s.p.gold,p.x,p.y,p.z,.025,.025,.012,10);}
  return {w,h,at,surface,rect};
}
function patchScreen(s,mesh,width,height){mesh.geometry.dispose();mesh.geometry=new THREE.PlaneGeometry(width,height);s.surfaces.main={mesh,width,height};s.focusSurface=s.surfaces.main;}

export function buildObjectStation(s,viewport){
  s.embedded=true;s.surfaces={};s.world.canopy.visible=false;if(s.world.warmer&&s.context.setting==='ticket')s.world.warmer.visible=false;
  if(s.context.setting==='pickup')makePickup(s,viewport);
  else if(s.context.setting==='wash'){buildWashingScene(s,viewport);}
  else if(s.context.setting==='recipe')makePrep(s,viewport);
  else if(s.context.setting==='delivery')makeReceiving(s,viewport);
  else if(s.context.setting==='tablet'){
    s.makeTablet();const r=stationViewport(viewport.width,viewport.height,'tablet'),height=.92*Math.max(1/2.2,Math.min(1.75,r.height/r.width));
    patchScreen(s,s.tabletScreen,.92,height);s.tabletScreen.scale.set(1,1,1);
    const housing=s.tablet.children[0];housing.scale.y=(height+.15)/.78;s.tabletHome.position.y=-height/2-.025;
    // Native buttons own the screen. Legacy raycast rectangles were laid out
    // for a different aspect ratio and must never answer through its bezel.
    s.hits.forEach(hit=>hit.userData.enabled=false);
    for(const x of [-.49,.49])s.box(s.tablet,s.p.gold,x,0,.041,.012,height+.08,.012,.003);
    // Inspect the held screen from close over the right side. Keeping the eye
    // close prevents the room's walls and the guest's head crossing its controls.
    s.tabletScreen.updateWorldMatrix(true,false);s.cameraOffset=new THREE.Vector3(0,0,1).transformDirection(s.tabletScreen.matrixWorld).multiplyScalar(.18).toArray();
  }else if(s.context.setting==='ticket'){
    s.makeTicket();const r=stationViewport(viewport.width,viewport.height,'ticket'),height=.60*Math.max(.30,Math.min(1.55,r.height/r.width));
    s.paperPivot.position.y+=.25;s.clip.position.y+=.25;s.clip.scale.setScalar(Math.min(1,250/r.width));patchScreen(s,s.paper,.60,height);s.paper.position.y=-height/2-.025;
    s.box(s.root,s.p.metal,s.clip.position.x,2.20,2.49,.035,.28,.035,.005);
    plane(s,'clip',s.clip,.28,.12,[0,-.10,.105]);s.cameraOffset=[0,.10,8];
  }else if(s.context.setting==='repair'){
    s.makeCheckout();const r=stationViewport(viewport.width,viewport.height,'repair'),height=.84*Math.max(.30,Math.min(1.55,r.height/r.width));
    s.terminal.position.y+=.12;s.world.checkout.screenMount.visible=false;patchScreen(s,s.display,.84,height);s.box(s.terminal,s.p.dark,0,0,-.025,1.0,height+.17,.15,.06);
    s.clearKey.visible=false;s.clearFace.visible=false;s.cameraOffset=null;
    s.hits.forEach(hit=>hit.userData.enabled=false);
    s.receiptPrinter=s.box(s.terminal,s.p.white,.98,-height/2-.06,.12,.80,.13,.25,.025);s.receiptSlot=s.box(s.terminal,s.p.dark,.98,-height/2+.013,.25,.76,.015,.02,.003);
    s.terminal.add(s.printedReceipt);s.printedReceipt.geometry.dispose();s.receiptHeight=height*.90;s.receiptBase=-height/2+.025;s.printedReceipt.geometry=new THREE.PlaneGeometry(.74,s.receiptHeight);s.printedReceipt.rotation.set(0,0,0);s.printedReceipt.position.set(.98,s.receiptBase+s.receiptHeight/2,.25);s.surfaces.receipt={mesh:s.group(.98,s.receiptBase+s.receiptHeight/2,.25,s.terminal),width:.74,height:s.receiptHeight};s.receiptFocus={mesh:s.group(.98,s.receiptBase+s.receiptHeight/2-.015,.25,s.terminal),width:.76,height:s.receiptHeight+.03};
  }
  s.world.root.updateMatrixWorld(true);
}

function makePickup(s,viewport){
  const [x,z]=s.world.plan.pickup,center=[x,2.65,z],b=board(s,viewport,'pickup',center);
  const surface=plane(s,'main',s.root,b.w-.10,b.h*(b.w-.10)/b.w,[x,center[1]+.085,z],[-Math.PI/2,0,0],'#f6eddc');
  s.focusSurface=surface;s.cameraOffset=[0,12,.06];s.tablet=s.group();s.tabletScreen=surface.mesh;
  // Packing bags sit outside the paper, leaving all eight touch cards clear.
  for(const side of [-1,1]){const bag=createDeliveryPackage(s.p,4);bag.scale.setScalar(.65);bag.position.set(x+side*(b.w/2+.35),center[1]-.12,z+.4);s.root.add(bag);}
  s.box(s.root,s.p.gold,x,center[1]+.12,z-b.h/2+.05,.35,.04,.12,.01);
}

function makePrep(s,viewport){
  const recipe=RECIPES[s.context.recipe];s.dish=recipe;s.world.prepStatic.visible=false;
  const b=board(s,viewport,'recipe',[-2.2,2.12,2.6]),measure=browserTextMeasure(typeof document==='undefined'?null:document.getElementById('task-card')||document.documentElement),layoutTask={...s.context.task,blocks:(s.context.order.length?s.context.order:s.context.task.blocks.map((_,i)=>i)).map(i=>s.context.task.blocks[i])},layout=prepBoardLayout(b.rect.width,b.rect.height,layoutTask,{measure});s.prepBoard=b;s.prepLayout=layout;
  const point=(x,y,z=.10)=>b.at(x/layout.width,y/layout.height,z),unit=b.w/layout.width,yUnit=layout.mode==='phone'?b.h/layout.height:unit,rectSurface=(key,parent,r,origin=[0,0],elevation=.02)=>plane(s,key,parent,r.width*unit,r.height*yUnit,[(r.x+r.width/2-origin[0])*unit,elevation,(r.y+r.height/2-origin[1])*yUnit],[-Math.PI/2,0,0]);
  const vp=point(layout.vessel.x,layout.vessel.y,.10);s.vessel=createVessel(s.p,recipe.container);s.vessel.scale.setScalar(layout.vessel.width*unit/.98);s.vessel.position.copy(vp);s.root.add(s.vessel);contactShadow(s.root,s.p,vp.x,vp.y-.012,vp.z,layout.vessel.width*unit*1.22,layout.vessel.height*unit*1.22);s.containerName=recipe.container;
  const cloth=s.box(s.root,s.p.green,vp.x,vp.y-.026,vp.z,layout.vessel.width*unit*1.08,.022,layout.vessel.height*unit*1.08,.04);cloth.rotation.y=.025;
  s.contents=s.group(0,recipe.container==='plate'?.065:0,0,s.vessel);s.contents.add(createPrepBase(s.p,s.context.recipe,s.context.prepPhase));
  const notePoint=point(layout.note.x+layout.note.width/2,layout.note.y+layout.note.height/2,.022);plane(s,'recipe-note',s.root,layout.note.width*unit,layout.note.height*yUnit,notePoint.toArray(),[-Math.PI/2,0,0]);
  const drop=plane(s,'vessel',s.root,layout.vessel.width*unit*1.1,layout.vessel.height*unit*1.1,[vp.x,vp.y+.40,vp.z],[-Math.PI/2,0,0]);drop.mesh.visible=false;
  s.target(s.root,'vessel',null,vp.x,vp.y+.24,vp.z,layout.vessel.width*unit*1.08,.7,layout.vessel.height*unit*1.08);s.targetPoint=vp.clone().add(new THREE.Vector3(0,.35,0));
  const count=s.context.task.blocks.length;
  s.foodAssignment=s.context.foodAssignment?Array.from({length:count},(_,i)=>s.context.foodAssignment[i%s.context.foodAssignment.length]):Array.from({length:count},(_,i)=>i%3);const rng=s.context.rng||Math.random;for(let i=s.context.foodAssignment?0:count-1;i>0;i--){const j=Math.floor(rng()*(i+1));[s.foodAssignment[i],s.foodAssignment[j]]=[s.foodAssignment[j],s.foodAssignment[i]];}
  s.foodAssignment=s.foodAssignment.map(piece=>piece+s.context.prepPhase*3);
  const ids=s.context.order.length?s.context.order:s.context.task.blocks.map((_,i)=>i);
  ids.forEach((index,position)=>{
    const r=layout.sources[position],p=point(r.food.x,r.food.y,.07),tray=s.group(...p.toArray()),radius=r.food.size*unit/2;
    // The cream prep paper sits UNDER the saucer, just as in v0.8/0.9.
    const movable=s.group(0,0,0,tray),paper=rectSurface('prep-paper-'+index,movable,r.paper,[r.food.x,r.food.y],.008);
    s.replaceMaterial(paper.mesh,s.canvasMaterial(ctx=>{ctx.fillStyle='#fff6df';ctx.fillRect(0,0,1024,640);ctx.strokeStyle='#d7c69e';ctx.lineWidth=5;ctx.strokeRect(12,12,1000,616);ctx.fillStyle='#aaa080';ctx.font='bold 22px sans-serif';ctx.fillText('LANGUINI · PREP',35,43);ctx.fillStyle='#d7c69e';ctx.fillRect(35,58,954,2);},{color:'#fff6df'}));
    contactShadow(tray,s.p,0,.026,0,radius*2.45,radius*2.45);s.cylinder(tray,s.p.cream,0,.035,0,radius,radius*.88,.045,24);s.cylinder(tray,s.p.white,0,.06,0,radius*.88,radius*.88,.015,24);
    const portion=createPrepIngredient(s.p,s.context.recipe,s.foodAssignment[index]),asset=portion.userData.pour?createPrepJug(s.p,s.context.recipe,s.foodAssignment[index]):portion;asset.position.y=.085;asset.scale.setScalar(Math.min(1,radius/.32)*.92);movable.add(asset);
    const label=rectSurface('ingredient-'+index,movable,r.label,[r.food.x,r.food.y],.018);label.mesh.visible=false;
    const hit=s.target(tray,'ingredient',index,0,.18,0,Math.max(.48,radius*2),.40,Math.max(.48,radius*2));
    s.trays[index]={root:tray,movable,asset,portion,paper,label,hit,radius,rest:tray.position.clone(),moveRest:movable.position.clone(),piece:s.foodAssignment[index]};
  });
}
function makeReceiving(s,viewport){
  const b=board(s,viewport,'delivery',[-3.0,2.15,-1.4]),measure=browserTextMeasure(typeof document==='undefined'?null:document.getElementById('task-card')||document.documentElement),l=receivingLayout(b.rect.width,b.rect.height,s.context.task.kind==='sorting',{prompt:s.context.task.prompt,options:s.context.options,measure}),unit=b.w/l.width;
  s.receivingBoard=b;s.receivingLayout=l;s.packages=[];
  const point=(x,y,z=.10)=>b.at(x/l.width,y/l.height,z),surface=(key,parent,r,origin=[0,0],elevation=.02)=>plane(s,key,parent,r.width*unit,r.height*unit,[(r.x+r.width/2-origin[0])*unit,elevation,(r.y+r.height/2-origin[1])*unit],[-Math.PI/2,0,0]);
  if(s.context.task.kind==='sorting'){
    s.sortTrays=[];s.sortPapers=[];s.sortedPackages=[];
    for(const [index,r]of l.bins.entries()){
      const p=point(r.x+r.width/2,r.y+r.height/2),g=s.group(...p.toArray()),w=r.width*unit,h=r.height*unit;
      s.box(g,s.p.darkWood,0,0,0,w,.08,h,.02);s.box(g,s.p.woodLight,0,.045,0,w-.07,.02,h-.07,.01);
      for(const x of [-w/2,w/2])s.box(g,s.p.wood,x,.13,0,.04,.26,h,.01);for(const z of [-h/2,h/2])s.box(g,s.p.woodLight,0,.13,z,w+.04,.26,.035,.01);
      for(const x of [-w/2+.05,w/2-.05])for(const z of [-h/2+.05,h/2-.05])s.cylinder(g,s.p.gold,x,.27,z,.022,.022,.015,8);
      const sf=plane(s,'sort-bin-'+index,g,w-.07,h-.05,[0,.29,0],[-Math.PI/2,0,0]);sf.mesh.visible=false;s.target(g,'sort-destination',index,0,.20,0,w,.55,h);s.sortTrays.push(g);
    }
    const p=point(l.parcel.x,l.parcel.y,.10),g=s.group(...p.toArray());s.sortCardGroup=g;contactShadow(s.root,s.p,p.x,p.y-.018,p.z,l.parcel.size*unit*1.2,l.parcel.size*unit);
    const parcel=createDeliveryPackage(s.p,packageVariant(s.context.packageOffset,0));parcel.scale.setScalar(l.parcel.size*unit/.67);g.add(parcel);s.currentPackage=parcel;s.packages.push(parcel);
    const sf=surface('sort-card',g,l.card,[l.parcel.x,l.parcel.y],.02);s.sortCard=sf.mesh;const join=(l.card.y-l.parcel.y)*unit;s.box(g,s.p.cream,0,.008,join/2,12*unit,.012,Math.max(.02,join),.004);s.target(g,'sort-card',null,0,.2,0,l.parcel.size*unit,.75,l.parcel.size*unit);s.targetPoint=null;
  }else{
    const r=l.crate,p=point(r.x,r.y,.10);s.makeCrate();s.crate.position.copy(p);const scale=Math.min(r.width*unit/1.35,r.height*unit/1.10);s.crate.scale.setScalar(scale);
    s.lid.rotation.x=-1.05;s.lid.add(s.label);s.label.rotation.x=-Math.PI/2;s.label.position.set(0,.09,.5);s.label.scale.set(.95,.8,1);
    for(const child of s.crate.children)if(child.geometry?.type==='SphereGeometry')child.visible=false;
    for(let i=0;i<3;i++){const parcel=createDeliveryPackage(s.p,packageVariant(s.context.packageOffset,i));parcel.scale.setScalar(.40);parcel.position.set((i-1)*.33,.22,i%2?.10:-.1);s.crate.add(parcel);s.packages.push(parcel);}
    const drop=plane(s,'crate',s.root,r.width*unit,r.height*unit,[p.x,p.y+.9*scale,p.z],[-Math.PI/2,0,0]);drop.mesh.visible=false;
    const mr=l.manifest,mp=point(mr.x+mr.width/2,mr.y+mr.height/2,.025);plane(s,'manifest',s.root,mr.width*unit,mr.height*unit,mp.toArray(),[-Math.PI/2,0,0]);
    l.ambient.forEach(([x,y],i)=>{const prop=createDeliveryPackage(s.p,packageVariant(s.context.packageOffset,i+3));prop.position.copy(point(x,y,.08));prop.scale.setScalar(Math.min(.65,(l.wide?54:42)*unit/.67));s.root.add(prop);s.packages.push(prop);});
    s.targetPoint=p.clone().add(new THREE.Vector3(0,.7*scale,0));
  }
}
export function syncObjectPackage(s,index){
  if(!s.currentPackage)return;const variant=packageVariant(s.context.packageOffset,index);if(s.currentPackage.userData.variant===variant)return;
  s.currentPackage.removeFromParent();const parcel=createDeliveryPackage(s.p,variant);parcel.userData.variant=variant;parcel.scale.setScalar(s.receivingLayout.parcel.size*s.receivingBoard.w/s.receivingLayout.width/.67);s.sortCardGroup.add(parcel);s.currentPackage=parcel;
}
export function placeObjectPackage(s,{index,category}){
  const l=s.receivingLayout,r=l.bins[category],parent=s.sortTrays[category],count=s.sortedPackages.filter(p=>p.userData.category===category).length,unit=s.receivingBoard.w/l.width,parcel=createDeliveryPackage(s.p,packageVariant(s.context.packageOffset,index));
  parcel.userData.category=category;parcel.userData.word=s.context.task.cards[index].word;attachParcelTag(s,parcel,parcel.userData.word);s.sealParcel(parcel,{animate:!s.restoring});const size=Math.min(r.width*.34,r.height*.24,52)*unit;parcel.scale.setScalar(size/.67);parcel.position.set((count%2-.5)*r.width*unit*.40,.07,r.height*unit*(.18+Math.floor(count/2)*.16));parcel.rotation.y=(index%3-1)*.09;parent.add(parcel);s.sortedPackages.push(parcel);
  const scale=parcel.scale.clone();s.motions.push({duration:.24,run:t=>{parcel.position.y=.07+Math.sin(t*Math.PI)*.07;parcel.scale.copy(scale).multiplyScalar(.85+.15*Math.sin(t*Math.PI/2));},done:()=>{parcel.position.y=.07;parcel.scale.copy(scale);}});
}

function attachParcelTag(s,parcel,word){
  const material=s.canvasMaterial(c=>{c.fillStyle='#fff8e5';c.fillRect(0,0,256,128);c.strokeStyle='#ac9670';c.lineWidth=3;c.strokeRect(3,3,250,122);c.fillStyle='#365d47';c.textAlign='center';c.textBaseline='middle';let font=27,lines;for(;font>=12;font--){lines=textLines(word,224,font,(t,n)=>{c.font=`700 ${n}px sans-serif`;return c.measureText(t).width;});if(lines.length*font*1.22<=108)break;}c.font=`700 ${font}px sans-serif`;lines.forEach((line,i)=>c.fillText(line,128,64+(i-(lines.length-1)/2)*font*1.22));},{width:256,height:128});
  const tag=s.box(parcel,material,0,.36,.025,.40,.007,.24,.005);tag.userData.word=word;
}
export function beginObjectDrag(s,kind,index){
  const target=kind==='ingredient'?s.trays[index]?.movable:kind==='sorting'?s.sortCardGroup:kind==='ticket'?s.paperPivot:null;
  if(!target)return false;if(kind==='ingredient'&&!s.trays[index].asset.visible)return false;
  const returning=target.userData.returning;if(returning){returning.cancelled=true;target.position.copy(returning.position);target.scale.copy(returning.scale);if(returning.label)returning.label.position.copy(returning.labelPosition);delete target.userData.returning;}
  s.dragging={target,kind,index,position:kind==='ingredient'?s.trays[index].moveRest.clone():target.position.clone(),scale:kind==='ingredient'?new THREE.Vector3(1,1,1):target.scale.clone()};
  
  target.scale.multiplyScalar(kind==='sorting'?.70:1.05);return true;
}
export function moveObjectDrag(s,worldPoint){if(!s.dragging)return;const t=s.dragging.target;t.position.copy(t.parent.worldToLocal(worldPoint.clone()));}
export function endObjectDrag(s,{animate=false}={}){
  const d=s.dragging;if(!d)return;s.dragging=null;
  if(animate){const from=d.target.position.clone(),scale=d.target.scale.clone(),labelFrom=d.label?.position.clone();d.target.userData.returning=d;
    s.motions.push({duration:.22,run:t=>{if(d.cancelled)return;const ease=1-Math.pow(1-t,3);d.target.position.lerpVectors(from,d.position,ease);d.target.scale.lerpVectors(scale,d.scale,ease);if(d.label){d.label.position.lerpVectors(labelFrom,d.labelPosition,ease);}},done:()=>{if(!d.cancelled){d.target.position.copy(d.position);d.target.scale.copy(d.scale);if(d.label){d.label.position.copy(d.labelPosition);}delete d.target.userData.returning;}}});
  }else{d.target.position.copy(d.position);d.target.scale.copy(d.scale);if(d.label){d.label.position.copy(d.labelPosition);}}
}
export function addObjectIngredient(s,index){
  const tray=s.trays[index];if(!tray||!tray.asset.visible)return;const feedback=!s.restoring;
  s.world.root.updateMatrixWorld(true);const from=tray.asset.getWorldPosition(new THREE.Vector3()),clone=tray.portion.clone();s.root.add(clone);clone.position.copy(from);tray.asset.visible=false;tray.used=true;tray.landed=false;tray.hit.userData.enabled=false;
  const piece=tray.piece;
  const local=new THREE.Vector3(0,s.dish.heights[piece],0),to=s.contents.localToWorld(local.clone());s.plated[index]=clone;
  const land=()=>{
    s.contents.add(clone);clone.position.copy(local);clone.rotation.set(0,0,0);clone.scale.set(1,1,1);tray.landed=true;if(feedback)s.prepFeedback(to,piece);
    if(s.trays.filter(t=>t?.landed).length===s.context.task.blocks.length&&!s.autoFinished){s.autoFinished=true;finishPreparedMeal(s);if(feedback)s.finishDishMotion();}
  };
  if(s.restoring)land();else animatePreparation(s,{tray,clone,from,to,local,index,land});
}
export function finishPreparedMeal(s){
  const plated=new Set(s.plated);
  for(const child of [...s.contents.children])if(!plated.has(child)&&!child.userData.prepBase)child.removeFromParent();
  const finished=new Set();
  for(const tray of s.trays){const group=s.plated[s.trays.indexOf(tray)],piece=tray.piece;
    if(finished.has(piece)){group.removeFromParent();continue;}finished.add(piece);
    group.clear();group.add(createFoodLayer(s.p,s.context.recipe,piece));
    group.position.set(0,s.dish.heights[piece],0);group.rotation.set(0,0,0);group.scale.set(1,1,1);
  }
  // The vessel already owns the .065 plate offset, shared with the pass model.
  s.lastPrepAction={type:'finish',label:s.context.prepPhase<PREP_PHASE_COUNT-1?`Phase complete. Next: ${PREP_PHASE_NAMES[s.context.prepPhase+1].toLowerCase()} the same dish.`:'Meal finished. Ready for the kitchen.'};
}
