import {preparationProfile} from './preparation-motion.mjs';
import {RECEIPT_FEED_MS} from './receipt-reading.mjs';
import {createHand} from './character-craft.mjs';
import {StationFeedback} from './station-feedback.mjs';
import {cleanWashingPatch} from './washing-scene.mjs';
import {finishGeometry} from './geometry-finish.mjs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createFoodLayer,createVessel,createPrepBase} from './food.mjs';
import {RECIPES} from './menu.mjs';
import {TICKET_RAIL,CHECKOUT} from './fixtures.mjs';
import {repairParts} from './tasks.mjs';
import {terminalWordLayout} from './terminal-layout.mjs';
import {fitTextLayout} from './text-fit.mjs';
import {MENU_MODES,tabletPairRects} from './tablet-matching.mjs';
import {buildObjectStation,beginObjectDrag,moveObjectDrag,endObjectDrag,addObjectIngredient,syncObjectPackage,placeObjectPackage} from './object-stations.mjs';
import {stationViewport} from './object-layout.mjs';
import {stationOffset} from './restaurant-layout.mjs';

export class StationScene {
  constructor(world,{setting,tableId=0,task,recipe=0,options=[],order=[],menuOrder=null,identity=null,viewport=null,rng=null,foodAssignment=null,prepPhase=0,packageOffset=0}){
    this.world=world;this.context={setting,tableId,task,recipe,options,order,menuOrder,identity,viewport,rng,foodAssignment,prepPhase,packageOffset};this.root=new THREE.Group();world.root.add(this.root);this.hits=[];this.motions=[];this.ownedMaterials=new Set();this.trays=[];this.plated=[];this.clock=0;this.p=world.palette;this.tabletImages=new Map();this.tabletImageLoads=[];this.failedTabletImages=new Set();this.matchState={matched:[],selected:null,wrong:null};this.disposed=false;
    this.hiddenOccluders=(['recipe','delivery','wash'].includes(setting)?world.occluders||[]:[world.atmosphereRain?.group,world.neighbourhood?.group]).filter(Boolean).map(o=>[o,o.visible]);for(const [o]of this.hiddenOccluders)o.visible=false;
    if(setting==='pickup'||viewport&&setting!=='conversation'){buildObjectStation(this,viewport||{width:393,height:740});this.placeInRestaurant();return;}
    if(setting==='conversation')this.makeConversation();if(setting==='recipe')this.makePrep();if(setting==='delivery'){this.makeCrate();if(task.kind==='sorting')this.makeSorter();}if(setting==='tablet')this.makeTablet();if(setting==='ticket')this.makeTicket();if(setting==='repair')this.makeCheckout();this.placeInRestaurant();world.root.updateMatrixWorld(true);
  }
  placeInRestaurant(){
    const delta=new THREE.Vector3(...(this.world.plan?.stationOffsets[this.context.setting]||stationOffset(this.world.arenaInfo?.id,this.context.setting)));
    if(!delta.lengthSq())return;
    // Bake a translation into the existing scene's direct children. The root
    // stays in world coordinates, preserving drag, food-flight and hand maths.
    for(const child of this.root.children)child.position.add(delta);
    for(const tray of this.trays)if(tray?.rest)tray.rest.add(delta);
    for(const key of ['targetPoint','cameraPoint','paperPoint'])if(this[key])this[key].add(delta);
    this.world.root.updateMatrixWorld(true);
  }
  box(parent,mat,x,y,z,w,h,d,r=.035){const m=new THREE.Mesh(finishGeometry(new RoundedBoxGeometry(w,h,d,r>=.025&&mat.visible!==false?2:1,Math.min(r,w/3,h/3,d/3))),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  cylinder(parent,mat,x,y,z,r1,r2,h,n=20,open=false){const m=new THREE.Mesh(finishGeometry(new THREE.CylinderGeometry(r1,r2,h,n,1,open)),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  ball(parent,mat,x,y,z,r=.08){const m=new THREE.Mesh(finishGeometry(new THREE.SphereGeometry(r,16,10)),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  group(x=0,y=0,z=0,parent=this.root){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
  canvasMaterial(draw,{width=1024,height=640,color='#eff5df',emissive=false}={}){
    let map;if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');if(ctx){draw(ctx,c);map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;}}
    const material=new THREE.MeshStandardMaterial({map:map||null,color:map?'#ffffff':color,roughness:emissive?.55:.9,...(emissive?{emissive:'#ffffff',emissiveMap:map||null,emissiveIntensity:map?.28:0}:{})});this.ownedMaterials.add(material);return material;
  }
  replaceMaterial(mesh,material){const old=mesh.material;mesh.material=material;if(this.ownedMaterials.delete(old)){old.map?.dispose();old.dispose();}}
  text(text,{title='',paper='#fff8e8',ink='#47624c'}={}){
    return this.canvasMaterial(ctx=>{ctx.fillStyle=paper;ctx.fillRect(0,0,768,512);ctx.strokeStyle='#d8cfb7';ctx.lineWidth=5;ctx.strokeRect(17,17,734,478);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';if(title){ctx.font='bold 28px sans-serif';ctx.fillText(title,384,65);ctx.beginPath();ctx.moveTo(60,106);ctx.lineTo(708,106);ctx.stroke();}
      const height=title?340:400,top=title?130:60,layout=fitTextLayout(text,{width:620,height,maxFont:48,minFont:20,lineSpacing:1.35,measure:(s,font)=>{ctx.font=`bold ${font}px Georgia`;return ctx.measureText(s).width;}});ctx.font=`bold ${layout.font}px Georgia`;layout.lines.forEach((line,i)=>ctx.fillText(line,384,top+(height-layout.lines.length*layout.lineHeight)/2+(i+.5)*layout.lineHeight));
    },{width:768,height:512,color:paper});
  }
  deliveryLabel(text,checked=false){return this.canvasMaterial(ctx=>{ctx.fillStyle=checked?'#e8f3d9':'#fff6dd';ctx.fillRect(0,0,1024,420);ctx.strokeStyle='#c5b88c';ctx.lineWidth=6;ctx.strokeRect(17,17,990,386);ctx.fillStyle='#76885e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 30px sans-serif';ctx.fillText(checked?'CHECKED DELIVERY':'FRESH DELIVERY',512,68);const layout=fitTextLayout(text,{width:924,height:250,maxFont:104,minFont:28,lineSpacing:1.15,measure:(s,font)=>{ctx.font=`bold ${font}px sans-serif`;return ctx.measureText(s).width;}});ctx.font=`bold ${layout.font}px sans-serif`;ctx.fillStyle='#456448';layout.lines.forEach((line,i)=>ctx.fillText(line,512,130+(250-layout.lines.length*layout.lineHeight)/2+(i+.5)*layout.lineHeight));},{width:1024,height:420});}
  target(parent,action,index,x,y,z,w,h,d){const m=this.box(parent,new THREE.MeshBasicMaterial({visible:false}),x,y,z,w,h,d,.005);this.ownedMaterials.add(m.material);m.userData.stationAction={action,index};this.hits.push(m);return m;}
  orderCaption(){const t=this.context.identity;return t?`${t.pickup?'PICKUP':'T'+(t.id+1)} · #${String(t.orderId).padStart(2,'0')} · ${t.name}`:`TABLE ${this.context.tableId+1}`;}
  makeConversation(){
    const guest=this.world.tables[this.context.tableId].guest,cue=this.context.task.dialogue?.cue||'book',p=this.p;
    this.cueGuest=guest;this.cueArmRotations=guest.arms.map(a=>a.rotation.clone());guest.body.add(this.root);guest.holdingCue=true;this.world.canopy.visible=false;
    this.cue=this.group(-.31,.63,.28);this.cue.rotation.set(-.22,.18,-.08);this.cueType=cue;
    if(cue==='ball'){this.ball(this.cue,p.bread,0,0,0,.14);this.box(this.cue,p.dark,0,0,.135,.02,.25,.016,.005);}
    else if(cue==='leaf'){this.cylinder(this.cue,p.terra,0,-.08,0,.085,.06,.12,8);for(const x of [-.045,.04]){const leaf=this.ball(this.cue,p.leaf,x,.04,0,.07);leaf.scale.set(.55,1.7,.45);leaf.rotation.z=x<0?.4:-.4;}}
    else if(cue==='clock'){this.cylinder(this.cue,p.gold,0,0,0,.14,.14,.035,16).rotation.x=Math.PI/2;this.box(this.cue,p.dark,0,.04,.024,.014,.10,.014,.004);this.box(this.cue,p.dark,.04,0,.024,.09,.014,.014,.004);}
    else if(cue==='tool'){this.box(this.cue,p.wood,0,0,0,.04,.33,.04,.012);this.box(this.cue,p.metal,0,.15,0,.20,.09,.08,.018);}
    else{this.box(this.cue,cue==='phone'?p.dark:cue==='book'?p.team:p.cream,0,0,0,cue==='phone'?.17:.30,.32,.045,.018);this.box(this.cue,cue==='phone'?p.glass:p.white,0,0,.028,cue==='phone'?.13:.25,.26,.015,.008);if(cue!=='phone')for(let i=0;i<3;i++)this.box(this.cue,cue==='map'?p.leaf:p.gold,0,.08-i*.07,.04,.18,.014,.012,.004);}
    guest.arms[0].rotation.set(-1.35,0,-.15);
  }
  makePrep(){
    const p=this.p,recipe=RECIPES[this.context.recipe];this.dish=recipe;this.world.prepStatic.visible=false;this.world.canopy.visible=false;
    this.box(this.root,p.woodLight,-2.25,1.32,2.9,2.62,.09,1.08,.06);this.vessel=createVessel(p,recipe.container);this.vessel.position.set(-2.25,1.38,2.60);this.root.add(this.vessel);this.containerName=recipe.container;this.targetPoint=new THREE.Vector3(-2.25,1.65,2.60);this.contents=this.group(0,recipe.container==='plate'?.065:0,0,this.vessel);this.contents.add(createPrepBase(p,this.context.recipe,this.context.prepPhase));
    const ids=this.context.order.length?this.context.order:this.context.task.blocks.map((_,i)=>i);ids.forEach((index,position)=>{const tray=this.group(-3.07+position*.82,1.43,3.21);this.cylinder(tray,p.white,0,0,0,.31,.27,.08,18);const asset=createFoodLayer(p,this.context.recipe,index%3+this.context.prepPhase*3);asset.position.y=.055;tray.add(asset);this.box(tray,p.cream,0,.07,.31,.73,.025,.26,.018);const card=new THREE.Mesh(new THREE.PlaneGeometry(.70,.245),this.text(this.context.task.blocks[index]));card.rotation.x=-Math.PI/2;card.position.set(0,.09,.31);tray.add(card);this.target(tray,'ingredient',index,0,.17,.03,.76,.42,.78);this.trays[index]={root:tray,asset,rest:tray.position.clone()};});this.target(this.root,'vessel',null,-2.25,1.6,2.60,1.0,.8,.93);
  }
  makeCrate(){
    this.world.canopy.visible=false;const p=this.p;this.crate=this.group(-3.20,.22,-1.95);const c=this.crate;this.box(c,p.wood,0,.04,0,1.30,.10,1.02);for(const x of [-.61,.61])this.box(c,p.woodLight,x,.5,0,.10,.86,1.02);for(const z of [-.47,.47])for(let i=0;i<4;i++)this.box(c,p.woodLight,0,.2+i*.20,z,1.28,.17,.07);
    this.lid=this.group(0,.96,-.50,c);this.box(this.lid,p.wood,0,.02,.5,1.35,.08,1.1);for(const x of [-.48,.48])this.box(this.lid,p.woodLight,x,.08,.5,.12,.04,1.05);this.label=this.box(c,this.deliveryLabel('Attach a label'),0,.53,.52,.95,.39,.025,.02);for(let i=0;i<6;i++)this.ball(c,i%2?p.leaf:p.tomato,(i%3-1)*.26,.72,Math.floor(i/3)*.34-.17,.15);this.target(c,'crate',null,0,.6,0,1.5,1.4,1.3);this.targetPoint=new THREE.Vector3(-3.2,1.0,-1.43);
  }
  makeSorter(){const p=this.p;this.sortTrays=[];this.sortPapers=[];for(const [index,c]of this.context.task.categories.entries()){const g=this.group(-3.8+index*1.35,1.12,-1.38);this.box(g,p.woodLight,0,0,0,1.20,.10,.68);this.box(g,p.wood,0,.20,-.34,1.2,.42,.06);const heading=this.box(g,this.text(c.name,{title:'LABEL TRAY'}),0,.41,-.30,1.13,.45,.025);this.target(g,'sort-destination',index,0,.15,0,1.25,.62,.75);this.sortTrays.push(g);}this.sortCard=this.box(this.root,this.text(this.context.task.cards[0].word,{title:'DELIVERY LABEL'}),-3.15,1.98,-1.32,1.2,.72,.035);this.targetPoint=null;}
  syncSorter(index){if(!this.sortCard||this.embedded)return;const card=this.context.task.cards[index];this.replaceMaterial(this.sortCard,this.text(card?.word||'Delivery organised',{title:`${index} / ${this.context.task.cards.length}`}));}
  limb(parent,material,from,to,radius){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a),mesh=this.cylinder(parent,material,...a.clone().add(b).multiplyScalar(.5).toArray(),radius,radius,delta.length(),10);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;}
  makeTablet(){
    const p=this.p,guest=this.world.tables[this.context.tableId].guest;this.world.canopy.visible=false;this.holdingGuest=guest;guest.body.add(this.root);guest.holdingTablet=true;guest.arms.forEach(a=>a.visible=false);
    // A held device keeps its physical proportions across customer body shapes.
    if(this.context.viewport)this.root.scale.set(1/guest.body.scale.x,1/guest.body.scale.y,1/guest.body.scale.z);
    const viewportRect=this.context.viewport&&stationViewport(this.context.viewport.width,this.context.viewport.height,'tablet'),screenHeight=viewportRect?.92*Math.max(1/2.2,Math.min(1.75,viewportRect.height/viewportRect.width)):.63;this.tablet=this.group(this.context.viewport?.18:0,this.context.viewport?1.12+Math.max(0,screenHeight-.9)*.45:.76,this.context.viewport?1.05:.60);this.tablet.rotation.set(.56,this.context.viewport?Math.PI-.42:Math.PI,0);this.box(this.tablet,this.world.furnishing.owned.includes('tablet')?p.team:p.dark,0,0,0,1.04,.78,.065,.055);this.tabletHome=this.box(this.tablet,p.gold,0,-.35,.04,.13,.018,.01,.005);this.tabletScreen=this.box(this.tablet,this.tabletMaterial(),0,.025,.04,.92,.63,.012,.025);
    if(this.context.task.kind==='matching'){
      this.context.menuOrder||={word:this.context.task.pairs.map((_,i)=>i),match:this.context.task.pairs.map((_,i)=>this.context.task.pairs.length-i-1)};
      for(const r of tabletPairRects(this.context.task,this.context.menuOrder)){const hit=this.target(this.tablet,'tablet-pair',r.index,((r.x+r.width/2)/1024-.5)*.92,.025+(.5-(r.y+r.height/2)/700)*.63,.061,r.width/1024*.92,r.height/700*.63,.025);hit.userData.stationAction.side=r.side;}
      if(this.context.task.mode==='picture'&&!this.context.viewport&&typeof Image!=='undefined')for(const [i,pair]of this.context.task.pairs.entries()){const image=new Image();this.tabletImageLoads.push(image);image.onload=()=>{if(this.disposed)return;this.tabletImages.set(i,image);this.replaceMaterial(this.tabletScreen,this.tabletMaterial());};image.onerror=()=>{if(this.disposed)return;this.failedTabletImages.add(i);this.replaceMaterial(this.tabletScreen,this.tabletMaterial());};image.src=pair.asset.src;}
    }else this.context.options.forEach((_,i)=>this.target(this.tablet,'tablet-option',i,(i%2-.5)*.445,.12-Math.floor(i/2)*.247,.061,.415,.21,.025));
    const rect=this.context.viewport&&stationViewport(this.context.viewport.width,this.context.viewport.height,'tablet'),heldHeight=rect?.92*Math.max(1/2.2,Math.min(1.75,rect.height/rect.width)):.63;
    for(const side of [-1,1]){const grip=new THREE.Vector3(side*(rect?.56:.49),rect?-heldHeight/2+.04:-.21,.025).applyEuler(this.tablet.rotation).add(this.tablet.position),elbow=[-side*.32,.56,.20];this.limb(this.root,guest.shirt,[-side*.245,.78,.01],elbow,.074);this.limb(this.root,guest.skin,elbow,grip.toArray(),.053);const hand=createHand(p,guest.skin,{side,grip:true});hand.position.copy(grip).add(new THREE.Vector3(0,-.08,.035).applyEuler(this.tablet.rotation));hand.quaternion.copy(this.tablet.quaternion);hand.rotateZ(Math.PI);this.root.add(hand);}
    this.world.root.updateMatrixWorld(true);this.cameraPoint=guest.body.localToWorld(new THREE.Vector3(0,.92,.34));
  }
  tabletMaterial(chosen=null){
    // Native task ink owns this screen, including transitions and rotation.
    // A plain backing cannot flash a second menu when its overlay is reframed.
    if(this.context.viewport)return this.canvasMaterial(ctx=>{ctx.fillStyle='#f6f6e8';ctx.fillRect(0,0,32,32);},{width:32,height:32,color:'#f6f6e8'});
    if(this.context.task.kind==='matching')return this.matchingTabletMaterial();
    return this.canvasMaterial(ctx=>{ctx.fillStyle='#eaf0dc';ctx.fillRect(0,0,768,512);ctx.fillStyle='#637d50';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 27px sans-serif';ctx.fillText(chosen?'ORDER SAVED · '+this.orderCaption():this.orderCaption()+(this.context.task.requested?' · CHOOSE TWO':' · MENU'),384,45);this.context.options.forEach((word,i)=>{const x=28+(i%2)*370,y=94+Math.floor(i/2)*200;const selected=chosen===word||this.listeningSelection?.includes(word);ctx.fillStyle=selected?(chosen?'#cce4b8':'#d6f1ea'):'#fffbeb';ctx.fillRect(x,y,340,171);ctx.strokeStyle=selected?'#40aaa9':'#c9d2b5';ctx.lineWidth=4;ctx.strokeRect(x,y,340,171);ctx.fillStyle='#536b43';let lines=[],font=32;for(;font>=18;font-=2){ctx.font=`bold ${font}px sans-serif`;lines=[];let line='';for(const part of word.split(' ')){if(ctx.measureText(line+' '+part).width>295&&line){lines.push(line);line=part;}else line+=(line?' ':'')+part;}if(line)lines.push(line);if(lines.length*font*1.25<130)break;}lines.forEach((text,j)=>ctx.fillText(text,x+170,y+86+(j-(lines.length-1)/2)*font*1.25));});},{width:768,height:512});
  }
  matchingTabletMaterial(){
    const task=this.context.task,order=this.context.menuOrder||{word:task.pairs.map((_,i)=>i),match:task.pairs.map((_,i)=>task.pairs.length-i-1)},state=this.matchState;
    return this.canvasMaterial(ctx=>{
      ctx.fillStyle='#eaf0dc';ctx.fillRect(0,0,1024,700);ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#44654f';ctx.font='bold 28px sans-serif';ctx.fillText(state.complete?'ORDER CONFIRMED':this.orderCaption(),32,40);ctx.textAlign='right';ctx.fillText(`${state.matched.length} / ${task.pairs.length}`,992,40);ctx.fillStyle='#7d9274';ctx.font='bold 21px sans-serif';ctx.textAlign='center';ctx.fillText(task.mode==='translation-reverse'?'TÜRKÇE':task.mode==='audio-translation'?'ENGLISH AUDIO':'ENGLISH',264,94);ctx.fillText(task.mode==='picture'?'PICTURES':task.mode==='translation-reverse'?'ENGLISH':'TÜRKÇE',760,94);
      for(const r of tabletPairRects(task,order)){
        const pair=task.pairs[r.index],matched=state.matched.includes(r.index),selected=state.selected?.side===r.side&&state.selected.index===r.index,wrong=state.wrong?.some(p=>p.side===r.side&&p.index===r.index);
        ctx.fillStyle=matched?'#d6e9c4':selected?'#d6f1ea':wrong?'#f5dfc5':'#fffbeb';ctx.fillRect(r.x,r.y,r.width,r.height);ctx.strokeStyle=selected?'#40aaa9':matched?'#86a779':wrong?'#c39568':'#c9d2b5';ctx.lineWidth=selected?5:3;ctx.strokeRect(r.x,r.y,r.width,r.height);
        if(r.side==='match'&&task.mode==='picture'){
          const image=this.tabletImages.get(r.index),size=Math.min(128,r.height-16);if(image)ctx.drawImage(image,r.x+(r.width-size)/2,r.y+(r.height-size)/2,size,size);
          else{const label=this.failedTabletImages.has(r.index)?pair.translation:'PICTURE',layout=fitTextLayout(label,{width:r.width-70,height:r.height-20,maxFont:36,minFont:22,lineSpacing:1.15,measure:(s,font)=>{ctx.font=`bold ${font}px sans-serif`;return ctx.measureText(s).width;}});ctx.fillStyle='#7d9274';ctx.font=`bold ${layout.font}px sans-serif`;layout.lines.forEach((line,i)=>ctx.fillText(line,r.x+r.width/2,r.y+r.height/2+(i-(layout.lines.length-1)/2)*layout.lineHeight));}
        }else{
          const label=task.mode==='translation-reverse'?(r.side==='word'?pair.translation:pair.word):task.mode==='audio-translation'&&r.side==='word'?'▶ LISTEN':r.side==='word'?pair.word:pair.translation,layout=fitTextLayout(label,{width:r.width-70,height:r.height-20,maxFont:42,minFont:22,lineSpacing:1.15,measure:(s,font)=>{ctx.font=`bold ${font}px sans-serif`;return ctx.measureText(s).width;}});ctx.font=`bold ${layout.font}px sans-serif`;ctx.fillStyle='#496448';layout.lines.forEach((line,i)=>ctx.fillText(line,r.x+r.width/2,r.y+r.height/2+(i-(layout.lines.length-1)/2)*layout.lineHeight));
        }
        if(matched){ctx.strokeStyle='#527d4c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(r.x+r.width-36,r.y+19);ctx.lineTo(r.x+r.width-29,r.y+26);ctx.lineTo(r.x+r.width-16,r.y+11);ctx.stroke();}
      }
      ctx.fillStyle='#6f8864';ctx.font='bold 23px sans-serif';ctx.fillText(state.complete?'ORDER SAVED · TO THE KITCHEN':'TAP A WORD AND ITS MATCH',512,669);
    },{width:1024,height:700});
  }
  updateMatching(state){this.matchState={...this.matchState,...state};if(!this.embedded)this.replaceMaterial(this.tabletScreen,this.tabletMaterial());for(const hit of this.hits)hit.userData.enabled=!this.embedded&&!this.matchState.complete&&!this.matchState.matched.includes(hit.userData.stationAction.index);}
  makeTicket(){
    const p=this.p,task=this.context.task;this.world.ticketRail.papers.visible=false;
    this.paperPivot=this.group(...TICKET_RAIL.clip);this.paper=new THREE.Mesh(new THREE.PlaneGeometry(TICKET_RAIL.width,TICKET_RAIL.height),this.text(task.prompt.replace('___','______'),{title:this.orderCaption()}));this.paper.position.set(0,-.385,-.005);this.paper.castShadow=true;this.paperPivot.add(this.paper);
    this.clip=this.group(...TICKET_RAIL.clip);this.box(this.clip,p.gold,0,.018,0,.13,.14,.06,.018);this.clipJaw=this.box(this.clip,p.woodLight,0,-.012,.04,.095,.12,.035,.012);this.cylinder(this.clip,p.metal,0,.022,.07,.019,.019,.14,10).rotation.z=Math.PI/2;
    this.target(this.clip,'stamp',null,0,.01,.05,.25,.26,.18);this.targetPoint=new THREE.Vector3(...TICKET_RAIL.clip);this.paperPoint=new THREE.Vector3(...TICKET_RAIL.paper);this.cameraPoint=this.paperPoint.clone();
  }
  makeCheckout(){
    const p=this.p;this.world.checkout.screen.visible=false;this.terminal=this.group(...CHECKOUT.screen);this.terminal.rotation.x=CHECKOUT.tilt;this.repairStage='find';this.repairIndex=repairParts(this.context.task).errorIndex;this.wordLayout=terminalWordLayout(repairParts(this.context.task).parts);
    this.display=new THREE.Mesh(new THREE.PlaneGeometry(CHECKOUT.width,CHECKOUT.height),this.terminalMaterial());this.display.position.z=.067;this.terminal.add(this.display);
    for(const word of this.wordLayout.words){const x=(word.x+word.width/2)/1024-.5,y=.5-(word.y+word.height/2)/640;this.target(this.terminal,'repair-part',word.index,x*CHECKOUT.width,y*CHECKOUT.height,.085,word.width/1024*CHECKOUT.width,word.height/640*CHECKOUT.height,.025);}
    this.context.options.forEach((_,i)=>{const x=(66+(i+.5)*(892/this.context.options.length))/1024-.5;const hit=this.target(this.terminal,'repair-option',i,x*CHECKOUT.width,(.5-491/640)*CHECKOUT.height,.085,(872/this.context.options.length)/1024*CHECKOUT.width,.085,.025);hit.userData.enabled=false;});
    this.clearKey=this.box(this.terminal,p.gold,.39,-.379,.067,.26,.075,.035,.015);const keyFace=new THREE.Mesh(new THREE.PlaneGeometry(.23,.06),this.text('BACKSPACE',{paper:'#dfc48e',ink:'#36584b'}));keyFace.position.set(.39,-.379,.091);this.terminal.add(keyFace);this.clearFace=keyFace;this.clearHit=this.target(this.terminal,'eraser',null,.39,-.375,.085,.33,.14,.08);this.clearHit.userData.enabled=false;
    this.terminal.updateMatrixWorld(true);this.targetPoint=this.clearKey.getWorldPosition(new THREE.Vector3());this.cameraPoint=new THREE.Vector3(...CHECKOUT.screen);this.printedReceipt=new THREE.Mesh(new THREE.PlaneGeometry(.27,.42),this.text('',{title:this.orderCaption()}));this.printedReceipt.position.set(...CHECKOUT.receipt);this.printedReceipt.visible=false;this.root.add(this.printedReceipt);
  }
  terminalMaterial(){
    const stage=this.repairStage,task=this.context.task,selected=this.repairIndex,parts=repairParts(task).parts;if(stage==='complete')parts.splice(0,parts.length);if(stage==='cleared')parts[selected]='_____';const layout=terminalWordLayout(parts);
    return this.canvasMaterial(ctx=>{ctx.fillStyle='#193d38';ctx.fillRect(0,0,1024,640);ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle=stage==='complete'?'#a7edc8':'#73d9d7';ctx.font='bold 30px sans-serif';ctx.fillText(stage==='complete'?'CHECKOUT · ORDER CORRECTED':this.orderCaption()+' · ORDER CHECK',66,54);ctx.fillStyle='#a6c0ac';ctx.font='22px sans-serif';ctx.fillText(stage==='find'?'SELECT THE WORD THAT NEEDS FIXING':stage==='selected'?'CLEAR THE SELECTED WORD WITH BACKSPACE':stage==='cleared'?'CHOOSE A REPLACEMENT BELOW':'RECEIPT PRINTING · READY TO SERVE',66,106);
      ctx.font=`bold ${layout.font}px monospace`;for(const word of layout.words){const marked=word.index===selected&&(stage==='selected'||this.repairHint),fixed=word.index===selected&&stage==='complete',text=word.index===selected?(stage==='cleared'?'_____':fixed?task.answer:word.text):word.text;ctx.fillStyle=marked?'#a67842':fixed?'#377f61':'#254c44';ctx.fillRect(word.x,word.y,word.width,word.height);ctx.fillStyle=marked?'#fff2bf':fixed?'#ceffdd':'#edf2dd';ctx.fillText(text,word.x+9,word.y+word.height/2);}
      if(stage==='cleared'){const cell=892/this.context.options.length;ctx.font='bold 26px monospace';this.context.options.forEach((word,i)=>{ctx.fillStyle='#e6edcf';ctx.fillRect(66+i*cell,456,cell-12,70);ctx.fillStyle='#2c5648';ctx.fillText(word,77+i*cell,491,cell-30);});}
      ctx.fillStyle=stage==='complete'?'#a7edc8':'#8eae9b';ctx.font='22px monospace';ctx.fillText(stage==='complete'?'✓ CORRECTED · PRINTING RECEIPT':stage==='selected'?'⌫ BACKSPACE':stage==='cleared'?'REPLACE THE CLEARED WORD':this.orderCaption()+' · REVIEW BEFORE CHECKOUT',66,578);
    },{emissive:true,color:'#193d38'});
  }
  updateTerminal(stage){this.repairStage=stage;if(!this.embedded)this.replaceMaterial(this.display,this.terminalMaterial());for(const hit of this.hits){const a=hit.userData.stationAction.action;hit.userData.enabled=!this.embedded&&(a==='repair-part'?stage==='find':a==='repair-option'?stage==='cleared':a==='eraser'?stage==='selected':false);}}
  beginDrag(kind,index){return beginObjectDrag(this,kind,index);}
  moveDrag(point){moveObjectDrag(this,point);}
  endDrag(options){endObjectDrag(this,options);}
  selectIngredient(index){for(const [i,t]of this.trays.entries())if(t){if(this.embedded){if(!this.dragging&&!t.movable.userData.returning){t.movable.position.y=i===index?.055:0;t.movable.scale.setScalar(i===index?1.025:1);}continue;}t.root.position.y=t.rest.y+(i===index?.08:0);t.root.scale.setScalar(i===index?1.04:1);}}
  addIngredient(index){
    if(this.embedded){addObjectIngredient(this,index);return;}
    const tray=this.trays[index];if(!tray||!tray.asset.visible)return;this.world.root.updateMatrixWorld(true);const from=tray.asset.getWorldPosition(new THREE.Vector3()),clone=tray.asset.clone(),feedback=!this.restoring;clone.position.copy(from);this.root.add(clone);tray.asset.visible=false;this.selectIngredient(null);const local=new THREE.Vector3(0,this.dish.heights[index%3+this.context.prepPhase*3],0),to=this.contents.localToWorld(local.clone());clone.userData.layer=index;this.plated[index]=clone;
    const pour=(['sunshine','noodles'].includes(this.dish.id)&&index===1)||(this.dish.id==='yoghurt'&&index===0)||(this.dish.id==='pancakes'&&index===2),arrange=['salad','fruit','pasta'].includes(this.dish.id);this.prepAction(index,to,pour,arrange);
    this.motions.push({duration:.72,run:t=>{clone.position.lerpVectors(from,to,t);clone.position.y+=Math.sin(t*Math.PI)*(arrange?.24:pour?.45:.65);clone.rotation.z=Math.sin(t*Math.PI)*(pour?.5:arrange?.06:.15);if(pour)clone.scale.set(1,Math.max(.15,t),1);},done:()=>{this.contents.add(clone);clone.position.copy(local);clone.rotation.set(0,0,0);clone.scale.set(1,1,1);if(feedback)this.prepFeedback(to,index);
      if(!arrange&&!pour)this.motions.push({duration:.18,run:t=>clone.scale.y=1-Math.sin(t*Math.PI)*.08,done:()=>clone.scale.y=1});
    }});

  }
  feedback(){return this.feedbackFx??=new StationFeedback(this.root);}
  prepFeedback(point,piece){
    const profile=preparationProfile(this.dish,piece),height=(this.dish.container==='plate'?.065:0)+this.dish.heights[piece]+.018;
    this.feedback().ripple(this.vessel,this.dish.container==='plate'?.35:.30,{height});
    const scale=this.contents.getWorldScale(new THREE.Vector3()).x;
    if(profile.hot)this.feedback().emit('steam',point,Math.min(1,scale));if(profile.crunch)this.feedback().emit('crumbs',point,Math.min(1,scale));
  }
  finishDishMotion(){
    if(this.restoring||!this.vessel)return;const home=this.vessel.rotation.clone(),final=this.context.prepPhase===2;
    this.feedback().finish(this.vessel,{radius:this.dish.container==='plate'?.43:.40,height:this.dish.container==='plate'?.083:this.dish.container==='pot'?.40:.38,final});
    if(final&&['garden','burger','pancakes','sunshine','noodles','pasta'].includes(this.dish.id)){
      const point=this.contents.localToWorld(new THREE.Vector3(0,this.dish.heights.at(-1)+.04,0));this.feedback().emit('steam',point,Math.min(1,this.contents.getWorldScale(new THREE.Vector3()).x));
    }
    this.motions.push({duration:.34,run:t=>{const wave=Math.sin(t*Math.PI);this.vessel.rotation.y=home.y+wave*(final?.075:.035);},done:()=>this.vessel.rotation.copy(home)});
  }
  sealParcel(parcel,{animate=true}={}){
    parcel.updateWorldMatrix(true,true);const inverse=parcel.matrixWorld.clone().invert(),bounds=new THREE.Box3();parcel.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld)));}});
    return this.feedback().stamp(parcel,new THREE.Vector3(bounds.max.x*.6,bounds.max.y+.02,bounds.min.z*.7),.7,{animate});
  }
  prepAction(index,landing,pour,arrange){
    const p=this.p,rig=this.group(...landing.toArray()),piece=this.embedded?this.foodAssignment[index]:index%3+this.context.prepPhase*3,kind=this.dish.layers[piece],detail=this.embedded?(['prep-butter-spread','prep-burger-spread','prep-cream'].includes(kind)?'spread':['prep-granola','prep-nuts','prep-pepper','prep-sesame','prep-parmesan','prep-mint','prep-scallion','prep-croutons'].includes(kind)?'garnish':null):null,action=pour?'pour':detail||(['garden','burger'].includes(this.dish.id)?'stack':this.dish.container==='pot'?(piece===2?'garnish':'stir'):this.dish.id==='pasta'&&piece===1?'spread':piece===2?'garnish':'arrange');
    if(this.embedded)rig.scale.copy(this.contents.getWorldScale(new THREE.Vector3()));
    this.prepTools||=[];const previous=this.prepTools[index];if(previous)previous.visible=false;this.prepTools[index]=rig;this.lastPrepAction={type:action,index,label:{pour:'Pouring into the dish.',stir:'Stirring the pot.',spread:'Spreading the sauce.',garnish:'Adding the finishing touches.',arrange:'Arranging the ingredients.',stack:'Stacking the next layer.'}[action]};rig.userData.prepAction=action;
    if(pour){const jug=this.group(.09,.64,.02,rig);this.cylinder(jug,p.white,0,0,0,.11,.085,.19,12);this.box(jug,p.metal,.12,0,0,.05,.12,.06,.01);const liquid=kind==='prep-honey'?p.syrup:['yoghurt','prep-dressing','prep-cream'].includes(kind)?p.cream:p.soup,stream=this.cylinder(rig,liquid,0,.29,0,.019,.024,.58,8);stream.visible=false;rig.userData.stream=stream;
      this.attachPrepHand(jug,[.30,.025,.035],[.75,.24,.35]);
      this.motions.push({duration:.72,run:t=>{jug.rotation.z=-Math.sin(t*Math.PI)*.72;stream.visible=t>.15&&t<.9;stream.scale.set(1,.4+.6*Math.sin(t*Math.PI),1);},done:()=>{rig.visible=false;}});
    }else{const utensil=this.group(0,.29,0,rig);this.box(utensil,p.woodLight,0,.17,0,.035,.31,.035,.01);const tip=this.ball(utensil,p.metal,0,-.01,0,.065);tip.scale.set(action==='garnish'?.45:.8,.28,1.3);
      this.attachPrepHand(utensil,[.16,.23,.045],[.62,.41,.36]);
      this.motions.push({duration:.72,run:t=>{utensil.position.x=Math.sin(t*Math.PI*2)*(action==='stir'?.13:.09);utensil.position.z=Math.cos(t*Math.PI*2)*(action==='stir'?.13:.03);utensil.position.y=.22+Math.sin(t*Math.PI)*.10;utensil.rotation.z=Math.sin(t*Math.PI*2)*.25;},done:()=>{rig.visible=false;}});
    }
  }
  attachPrepHand(parent,wrist,elbow){
    const side=this.prepLayout&&this.prepLayout.mode!=='columns'?-1:1,skin=this.world.chef.skin||this.p.skins[0],hand=createHand(this.p,skin,{side,grip:true,cuff:true});wrist=[wrist[0]*side,wrist[1],wrist[2]];elbow=[elbow[0]*side,elbow[1],elbow[2]];hand.position.set(...wrist);hand.rotation.z=-side*Math.PI/2;parent.add(hand);
    this.limb(parent,this.p.white,[wrist[0]+side*.025,wrist[1],wrist[2]],elbow,.078);hand.userData.contactObject=parent;return hand;
  }
  reject(index){const tray=this.trays[index];if(!tray)return;const x=tray.rest.x;this.motions.push({duration:.24,run:t=>tray.root.position.x=x+Math.sin(t*Math.PI*2)*.035*(1-t),done:()=>tray.root.position.x=x});}
  react(action,value=''){
    if(action==='wash-clean'){cleanWashingPatch(this,value);return;}
    if(action==='sort-sync'){this.sortIndex=value.index;this.syncSorter(value.index);if(this.embedded)syncObjectPackage(this,value.index);return;}
    if(action==='sort-place'&&this.sortTrays){if(this.embedded){placeObjectPackage(this,value);return;}const card=this.context.task.cards[value.index],g=this.sortTrays[value.category],paper=this.box(g,this.text(card.word),0,(this.embedded?.10:.08)+this.sortPapers.filter(p=>p.userData.category===value.category).length*.025,this.embedded?.18:0,this.embedded?.94:1.02,.018,this.embedded?.32:.52);paper.rotation.x=this.embedded?0:-.06;paper.rotation.y=(value.index%3-1)*.035;paper.userData.category=value.category;this.sortPapers.push(paper);if(this.embedded){paper.scale.setScalar(.8);this.motions.push({duration:.22,run:t=>{paper.scale.setScalar(.8+.2*Math.sin(t*Math.PI/2));},done:()=>paper.scale.setScalar(1)});}return;}
    if(action==='tablet-select'&&this.tablet){this.listeningSelection=[...(value.selected||[])];if(!this.embedded)this.replaceMaterial(this.tabletScreen,this.tabletMaterial(value.confirmed?'confirmed':null));}
    if(action==='label'&&this.crate){if(!this.approvalSeal)this.approvalSeal=this.feedback().stamp(this.label,new THREE.Vector3(.36,.135,.02),.65,{front:true,animate:!this.restoring});this.replaceMaterial(this.label,this.deliveryLabel(value,true));const from=this.lid.rotation.x;this.motions.push({duration:this.embedded?.30:1,run:t=>this.lid.rotation.x=from+(-1.35-from)*Math.sin(Math.min(1,t*1.6)*Math.PI/2)});}
    if(action==='tablet'&&this.tablet){if(this.context.task.kind==='matching')this.updateMatching({complete:true,matched:this.context.task.pairs.map((_,i)=>i)});else if(!this.embedded)this.replaceMaterial(this.tabletScreen,this.tabletMaterial(value));}
    if(['tablet-match','tablet-pair','tablet-miss'].includes(action)&&this.tablet){this.updateMatching(value);if(action==='tablet-miss')this.motions.push({duration:.35,run:t=>this.tablet.rotation.z=Math.sin(t*32)*.025*(1-t),done:()=>this.tablet.rotation.z=0});}
    if(action==='ticket-fill'&&this.paper)this.replaceMaterial(this.paper,this.text(value,{title:this.orderCaption()+' · READY'}));
    if(action==='clip'&&this.clip){this.motions.push({duration:.65,run:t=>{this.clipJaw.rotation.x=-Math.sin(t*Math.PI)*.35;this.paperPivot.rotation.z=Math.sin(t*Math.PI*2)*.035*(1-t);},done:()=>{this.paperPivot.rotation.z=0;this.clipJaw.rotation.x=0;this.replaceMaterial(this.paper,this.text(value,{title:this.orderCaption()+' · CONFIRMED',paper:'#eff5df'}));}});}
    if(action==='repair-select'&&this.display)this.updateTerminal('selected');
    if(action==='repair-hint'&&this.display){this.repairHint=true;this.replaceMaterial(this.display,this.terminalMaterial());}
    if(action==='erase'&&this.display){this.motions.push({duration:this.embedded?.22:.5,run:t=>this.clearKey.position.z=.067-Math.sin(t*Math.PI)*.018,done:()=>{this.clearKey.position.z=.067;this.repairHint=false;this.updateTerminal('cleared');}});}
    if(action==='repair'&&this.display){this.updateTerminal('complete');this.replaceMaterial(this.printedReceipt,this.text(value,{title:'LANGUINI · '+this.orderCaption()}));if(!this.embedded)this.printReceipt();}
    if(action==='print'&&this.printedReceipt)this.printReceipt();
    if(action==='receipt-feed'&&this.printedReceipt)this.setReceiptFeed(value);
    if(action==='receipt-ready'&&this.printedReceipt){this.motions=this.motions.filter(m=>!m.receiptFeed);this.setReceiptFeed(1);}
  }
  setReceiptFeed(progress){
    const t=Math.max(.001,Math.min(1,progress));this.receiptProgress=progress;this.printedReceipt.scale.y=1;
    if(this.receiptHeight){
      // Crop the full-size paper and UVs: ink keeps its size as it emerges.
      const h=this.receiptHeight,g=this.printedReceipt.geometry,positions=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<positions.count;i++){const top=i<2;positions.setY(i,(top?.5:-.5)*h*t);uv.setY(i,top?1:1-t);}
      positions.needsUpdate=true;uv.needsUpdate=true;g.computeBoundingSphere();this.printedReceipt.position.y=this.receiptBase+h*t/2;
    }else this.printedReceipt.scale.y=t;
  }
  printReceipt(){
    if(this.embedded&&this.surfaces?.receipt){this.focusSurface=this.receiptFocus||this.surfaces.receipt;this.cameraOffset=null;}
    this.printedReceipt.visible=true;this.receiptDriven=false;this.setReceiptFeed(0);
    this.motions.push({duration:RECEIPT_FEED_MS/1000,receiptFeed:true,run:t=>{if(!this.receiptDriven)this.setReceiptFeed(t*t*(3-2*t));}});
  }
  update(dt,reduced=false){this.clock+=dt;for(let i=this.motions.length-1;i>=0;i--){const m=this.motions[i];m.elapsed=(m.elapsed||0)+dt;const t=reduced?1:Math.min(1,m.elapsed/m.duration);m.run(t);if(t===1){m.done?.();this.motions.splice(i,1);}}this.feedbackFx?.update(dt,reduced);}
  dispose(){
    this.disposed=true;for(const image of this.tabletImageLoads){image.onload=null;image.onerror=null;}this.tabletImageLoads=[];this.tabletImages.clear();this.failedTabletImages.clear();
    this.feedbackFx?.dispose();
    if(this.cueGuest){this.cueGuest.holdingCue=false;this.cueGuest.arms.forEach((arm,i)=>arm.rotation.copy(this.cueArmRotations[i]));}
    for(const [o,visible]of this.hiddenOccluders||[])o.visible=visible;
    if(this.holdingGuest){this.holdingGuest.holdingTablet=false;this.holdingGuest.arms.forEach(a=>a.visible=true);}this.world.prepStatic.visible=true;this.world.canopy.visible=true;if(this.world.warmer)this.world.warmer.visible=this.world.furnishing.equipped.includes('warmer');this.world.ticketRail.papers.visible=true;this.world.checkout.screen.visible=true;this.world.checkout.screenMount.visible=true;
    const geometries=new Set();this.root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isMesh&&!o.geometry.userData.shared)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());this.ownedMaterials.forEach(m=>{m.map?.dispose();m.dispose();});this.root.removeFromParent();
  }
}
