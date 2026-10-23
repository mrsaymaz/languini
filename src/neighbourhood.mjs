import * as THREE from 'three';
import {finishGeometry} from './geometry-finish.mjs';
import {contactShadow} from './art-direction.mjs';

const shapes=new Map();
function shape(key,make){if(!shapes.has(key)){const g=finishGeometry(make());g.userData.shared=true;shapes.set(key,g);}return shapes.get(key);}
const cube=()=>shape('cube',()=>new THREE.BoxGeometry(1,1,1));
const sphere=()=>shape('crown',()=>new THREE.SphereGeometry(1,10,7));
const tube=()=>shape('pole',()=>new THREE.CylinderGeometry(1,1,1,10));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export function neighbourhoodPlan(plan,level=0){
 const half=plan.venue.width/2;
 return {half,front:4.58,door:[0,4.73],menu:[-1.48,5.25],pickup:[plan.pickup[0],5.30],
  pavement:{left:-half-2.3,right:half+2.3,top:4.58,bottom:7.25},
  road:{x:0,z:9.50,width:48,depth:4.5},
  queue:level>=5?2:level>=4?1:0,
  cracks:level>=3?0:level>=2?3:level>=1?6:9,
  repaired:level>=1,healthy:level>=2,restoredSign:level>=3,litEntrance:level>=4};
}

// World scenery only. It never enters the navigation grid or owns a timer.
// The room's camera framing and all interaction anchors stay independent.
export function buildNeighbourhood(root,p,{plan,arena,level=0,atmosphere='breakfast',mergeStatic,createCustomer}){
 const group=new THREE.Group(),near=new THREE.Group(),far=new THREE.Group(),moving=new THREE.Group();
 group.name='Neighbourhood';group.userData.neighbourhood=true;group.add(near,far,moving);root.add(group);
 const layout=neighbourhoodPlan(plan,level),mats=[],r=layout.half,rain=atmosphere==='rain',evening=atmosphere==='evening';
 const material=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.88,vertexColors:true,...extra});mats.push(m);return m;};
 const pavement=material(rain?'#a8b9b4':arena==='banquet'?'#c6bbaa':'#d2cbbb'),road=material(rain?'#60797c':'#7b8883'),curb=material('#bbb8aa'),mortar=material('#b7b3a5');
 const paint=material(level>=3?(arena==='bistro'?'#4c7977':arena==='banquet'?'#625d55':'#66816a'):'#939c89');
 const leaf=material(layout.healthy?'#66865c':'#8b9270'),leafDark=material(layout.healthy?'#486e56':'#747d60');
 const fronts=['#9eafa0','#b7a88f','#8da9a4'].map(c=>material(c)),window=material(evening?'#c9aa71':'#a9c5c2',{roughness:.35});
 const warm=new THREE.MeshBasicMaterial({color:'#ffdc9b',transparent:true,opacity:evening?.30:.07,depthWrite:false,toneMapped:false});mats.push(warm);
 const wet=new THREE.MeshBasicMaterial({color:'#c7e2df',transparent:true,opacity:.45,depthWrite:false,toneMapped:false});mats.push(wet);
 const add=(parent,g,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(parent,m,x,y,z,w,h,d)=>add(parent,cube(),m,x,y,z,w,h,d);
 const ball=(parent,m,x,y,z,xr,yr=xr,zr=xr)=>add(parent,sphere(),m,x,y,z,xr,yr,zr);
 const pole=(parent,m,x,y,z,radius,height)=>add(parent,tube(),m,x,y,z,radius,height,radius);
 const line=(parent,m,a,b,width=.025)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),o=box(parent,m,...av.add(bv).multiplyScalar(.5),width,d.length(),width);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
 const labels=['LANGUINI','TODAY’S MENU','08:00 – 20:00','TAKEAWAY','BOOKS','FLOWERS','BAKERY','WELCOME'];
 let atlas=null;try{if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');if(ctx){ctx.fillStyle='#f4edda';ctx.fillRect(0,0,512,512);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 31px Georgia';labels.forEach((s,i)=>{ctx.fillStyle=i===0?'#fff4dd':'#f4edda';ctx.fillRect(0,i*64,512,64);ctx.fillStyle=i===0?'#3e6552':'#4a5a4e';ctx.fillText(s,256,i*64+33,486);});atlas=new THREE.CanvasTexture(c);atlas.colorSpace=THREE.SRGBColorSpace;}}}catch{}
 const ink=material('#ffffff',{map:atlas,roughness:.96});
 const label=(parent,index,x,y,z,w,h)=>{const g=finishGeometry(new THREE.PlaneGeometry(w,h)),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,(7-index+uv.getY(i))/8);const o=add(parent,g,ink,x,y,z);o.userData.ownedGeometry=true;return o;};
 const framed=(parent,index,x,y,z,w,h,frame=p.darkWood)=>{box(parent,frame,x,y,z,w,h,.07);label(parent,index,x,y,z+.041,w-.09,h-.07);};
 // The kerb, paving and road continue to the crop instead of forming a bare
 // floating platform. Distances are world metres, not viewport percentages.
 box(near,pavement,0,-.15,5.93,r*2+4.6,.18,2.64);
 for(const side of [-1,1]){box(near,pavement,side*(r+1.17),-.15,plan.venue.centerZ,2.26,.18,9.5+plan.venue.extraDepth);box(near,curb,side*(r+2.34),-.13,plan.venue.centerZ,.12,.22,9.6+plan.venue.extraDepth);}
 box(near,curb,0,-.13,7.25,r*2+4.8,.22,.16);
 box(near,road,0,-.28,9.56,48,.14,4.50);box(far,pavement,0,-.16,12.32,48,.16,1.05);
 for(let i=-10;i<=10;i++)box(near,p.cream,i*2.2,-.203,9.70,.95,.008,.065);
 for(let i=-6;i<=6;i++){box(near,mortar,i*1.15,-.053,5.94,.012,.008,2.40);box(near,mortar,i*1.15+.575,-.052,6.05,1.14,.008,.012);}
 for(const side of [-1,1])for(let i=0;i<9+plan.venue.extraDepth;i++)box(near,mortar,side*(r+1.15),-.052,3.9-i,2.15,.008,.012);
 // Repair milestones change only fixed external finishes and planting.
 for(let i=0;i<layout.cracks;i++){const x=-4.0+(i*1.37)%8,z=5.1+(i%3)*.53;line(near,p.stoneDark,[x,-.045,z],[x+.20,-.045,z+.10],.015);line(near,p.stoneDark,[x+.20,-.045,z+.10],[x+.29,-.045,z+.28],.012);}
 box(near,layout.repaired?p.stone:p.stoneDark,0,.015,4.74,1.78,.14,.42);box(near,p.darkWood,0,.098,4.98,1.35,.018,.47);box(near,paint,0,.11,4.98,1.20,.01,.34);
 // Low frontage wings preserve the service counter sightlines. A clear gap
 // stays open between the two doorway posts; the awning is above the path.
 for(const side of [-1,1]){
  box(near,paint,side*2.95,.37,4.55,3.0,.67,.10);box(near,p.woodLight,side*2.95,.74,4.55,3.05,.07,.18);
  box(near,layout.restoredSign?p.darkWood:paint,side*1.03,1.16,4.65,.115,2.16,.13);
 }
 box(near,paint,0,2.32,4.65,2.27,.29,.18);framed(near,0,0,2.33,4.77,1.85,.22,layout.restoredSign?p.gold:p.woodLight);
 framed(near,1,-1.55,1.45,4.62,.88,.30);framed(near,2,1.57,1.44,4.62,.82,.22);
 // A real menu board below its title uses marks, never assessed task answers.
 box(near,p.dark,-1.55,1.08,4.65,.86,.42,.025);for(let i=0;i<3;i++)box(near,p.cream,-1.60,1.20-i*.11,4.67,.53-i*.055,.017,.006);
 const canopy=(parent,x,z,width,striped=false)=>{
  const stripes=striped?10:1;for(let i=0;i<stripes;i++){const xx=x-width/2+(i+.5)*width/stripes,m=striped&&i%2?p.cream:paint;box(parent,m,xx,2.10,z,width/stripes,.065,.90).rotation.x=.06;box(parent,m,xx,1.99,z+.46,width/stripes,.18,.045);}
  line(parent,p.metal,[x-width*.42,1.65,z-.38],[x-width*.42,2.08,z+.34]);line(parent,p.metal,[x+width*.42,1.65,z-.38],[x+width*.42,2.08,z+.34]);
 };
 canopy(near,0,5.10,2.35,arena==='courtyard');
 // The external collection hatch shares the existing pickup counter; it is
 // scenery for that service point, not another task or navigation obstacle.
 const px=plan.pickup[0];for(const x of [px-.84,px+.84])box(near,arena==='bistro'?p.metal:p.wood,x,1.22,4.59,.065,1.0,.10);
 box(near,p.woodLight,px,.87,4.70,1.80,.08,.36);box(near,paint,px,1.75,4.59,1.80,.12,.13);framed(near,3,px,1.78,4.68,1.31,.22,arena==='banquet'?p.gold:p.metal);canopy(near,px,4.96,1.95,arena==='bistro');
 const planter=(parent,x,z,size=.38,flowers=false)=>{pole(parent,p.terra,x,.17,z,size,.46);pole(parent,p.darkWood,x,.405,z,size*.89,.025);for(let i=0;i<5;i++){const a=i*2.4;ball(parent,i%2?leaf:leafDark,x+Math.cos(a)*size*.46,.58+(i%2)*.13,z+Math.sin(a)*size*.40,size*.55,.26,size*.52);if(flowers&&layout.healthy)ball(parent,p.cream,x+Math.cos(a)*size*.42,.82+(i%2)*.08,z+Math.sin(a)*size*.4,.055);}};
 for(const x of [-1.68,1.68])planter(near,x,5.43,.30,true);
 const bench=(x,z)=>{for(const xx of [x-.63,x+.63]){box(near,p.darkWood,xx,.23,z,.08,.49,.65);box(near,p.darkWood,xx,.64,z-.25,.07,.73,.07);}for(let i=0;i<4;i++){box(near,p.wood,x,.49,z-.23+i*.145,1.6,.055,.11);box(near,layout.repaired?p.woodLight:paint,x,.80+i*.10,z-.29,1.60,.065,.055);}};
 const tree=(x,z,scale=1)=>{const t=new THREE.Group();t.position.set(x,-.05,z);t.scale.setScalar(scale);near.add(t);pole(t,p.darkWood,0,.85,0,.085,1.70);line(t,p.darkWood,[0,1.0,0],[.33,1.60,.08],.07);ball(t,leafDark,0,1.85,0,.66,.85,.62);ball(t,leaf,-.35,1.94,.10,.49,.57,.45);ball(t,leaf,.38,2.10,-.10,.47,.60,.48);const contact=contactShadow(near,p,x,-.049,z,1.8*scale,1.4*scale);contact.geometry=finishGeometry(contact.geometry.clone());contact.userData.ownedGeometry=true;};
 for(const [x,z,s]of [[-r-1.28,-2.1,.94],[r+1.34,-2.7,1.05],[-r-1.42,5.95,.76],[r+1.35,5.95,.80]])tree(x,z,s);
 for(const side of [-1,1]){box(near,p.stoneDark,side*(r+2.0),.25,1.45,.17,.60,2.3);box(near,p.stone,side*(r+2.0),.58,1.45,.23,.08,2.38);}
 if(arena==='courtyard'){
  bench(-3.43,6.15);for(const x of [-3.16,3.4]){box(near,p.terra,x,.45,4.66,1.05,.24,.27);for(let i=0;i<4;i++)ball(near,i%2?leaf:leafDark,x-.38+i*.25,.67,4.65,.17,.19,.17);}
  const bike=new THREE.Group();bike.position.set(-r-1.05,.1,3.50);bike.rotation.y=.15;near.add(bike);
  for(const x of [-.53,.53]){const wheel=add(bike,shape('wheel',()=>new THREE.TorusGeometry(.31,.025,5,20)),p.dark,x,.32,0);for(let i=0;i<5;i++){const a=i*Math.PI/5;line(bike,p.metal,[x+Math.sin(a)*.28,.32+Math.cos(a)*.28,.005],[x-Math.sin(a)*.28,.32-Math.cos(a)*.28,.005],.009);}}
  for(const [a,b]of [[[-.53,.32,0],[-.16,.71,0]],[[-.16,.71,0],[.15,.32,0]],[[.15,.32,0],[-.53,.32,0]],[[-.16,.71,0],[.38,.73,0]],[[.38,.73,0],[.15,.32,0]],[[.38,.73,0],[.53,.32,0]]])line(bike,paint,a,b,.035);box(bike,p.dark,-.15,.79,0,.25,.055,.13);line(bike,p.metal,[.38,.73,0],[.39,.96,0]);box(bike,p.dark,.39,.97,0,.23,.03,.035);
  for(const x of [-r-1.8,-r-.4]){pole(near,p.metal,x,.32,3.50,.025,.70);box(near,p.metal,x,.67,3.50,.38,.035,.035);}
 }else if(arena==='bistro'){
  bench(-3.70,6.10);for(let i=0;i<4;i++)box(near,i%2?p.cream:p.metal,-4.25+i*.34,.38,4.62,.30,.44,.035);
  for(const side of [-1,1]){pole(near,p.metal,side*(r+1.1),.28,4.73,.065,.66);ball(near,p.cream,side*(r+1.1),.65,4.73,.09);}
 }else{
  box(near,p.woodLight,-3.28,-.01,5.97,2.55,.10,1.70);for(let i=0;i<8;i++)box(near,p.darkWood,-4.40+i*.32,.045,5.97,.013,.008,1.68);
  for(const x of [-4.15,-2.40])planter(near,x,6.70,.25,true);
  pole(near,p.darkWood,-3.28,.36,6.00,.075,.75);pole(near,p.tableLinen,-3.28,.75,6.00,.41,.065);
  for(const x of [-3.96,-2.60]){box(near,p.upholstery,x,.38,6.0,.43,.09,.42);box(near,p.darkWood,x,.60,6.19,.44,.44,.065);for(const dx of [-.15,.15])pole(near,p.darkWood,x+dx,.16,6.0,.023,.42);}
 }
 // Quiet neighbouring shops sit beyond the outer pavement, outside the room.
 const shop=(x,z,w,d,h,index)=>{
  box(far,fronts[index%3],x,h/2-.15,z,w,h,d);box(far,p.stoneDark,x,h-.12,z,w+.13,.12,d+.12);box(far,p.cream,x,.10,z+d/2+.025,w,.26,.07);
  for(const dx of [-w*.27,w*.27]){box(far,p.cream,x+dx,.95,z+d/2+.045,w*.29,1.10,.06);box(far,window,x+dx,.96,z+d/2+.083,w*.25,.99,.025);box(far,p.cream,x+dx,.95,z+d/2+.10,w*.26,.045,.035);}
  framed(far,4+index%3,x,1.73,z+d/2+.08,w*.74,.28,fronts[(index+1)%3]);
  for(const side of [-1,1])for(const dz of [-d*.23,d*.23]){box(far,p.cream,x+side*(w/2+.025),1.01,z+dz,.05,.99,d*.31);box(far,window,x+side*(w/2+.055),1.02,z+dz,.025,.88,d*.26);box(far,p.cream,x+side*(w/2+.072),1.02,z+dz,.025,.035,d*.27);}
  box(far,fronts[(index+1)%3],x-w*.26,h+.04,z-.2,.32,.34,.38);box(far,p.stoneDark,x-w*.26,h+.23,z-.2,.40,.07,.45);
 };
 for(const side of [-1,1])for(let i=0;i<3;i++)shop(side*(r+4.10),-4.70+i*4.05-plan.venue.extraDepth*.3,2.75,2.25,2.15+(i%2)*.24,i+(side>0?1:0));
 for(let i=0;i<3;i++)shop(-7.1+i*7.1,-10.7-plan.venue.extraDepth,5.7,1.8,2.20+i*.12,i);
 // Two small leaf clusters sway together, not every plant in the scene.
 const foliage=[];for(const side of [-1,1]){const f=new THREE.Group();f.position.set(side*(r+1.1),.48,.30);moving.add(f);for(let i=0;i<4;i++)ball(f,leaf,Math.sin(i*2)*.17,i*.08,Math.cos(i*2)*.15,.16,.24,.14);mergeStatic(f);foliage.push(f);box(near,p.stone,side*(r+1.1),.14,.30,.70,.34,.63);}
 const puddles=[];if(rain)for(const [x,z,s]of [[-3.0,6.60,.55],[2.0,6.15,.48],[r+1.1,.8,.40]]){const o=add(moving,shape('puddle',()=>new THREE.CircleGeometry(1,24)),wet,x,-.043,z,s, s*.48,1);o.rotation.x=-Math.PI/2;puddles.push(o);}
 const dripsGeometry=new THREE.BufferGeometry(),dripPositions=new Float32Array(rain?16*6:0);dripsGeometry.setAttribute('position',new THREE.BufferAttribute(dripPositions,3));const dripMaterial=new THREE.LineBasicMaterial({color:'#d5edf1',transparent:true,opacity:.65,depthWrite:false});const drips=new THREE.LineSegments(dripsGeometry,dripMaterial);drips.userData.ownedGeometry=true;drips.frustumCulled=false;drips.visible=rain;moving.add(drips);
 const lamps=new THREE.Group();moving.add(lamps);const bulbs=[];
 for(const x of [-1.04,1.04,plan.pickup[0]-.88,plan.pickup[0]+.88]){box(near,p.gold,x,1.73,4.83,.09,.24,.10);const b=ball(lamps,evening||layout.litEntrance?p.glow:p.cream,x,1.70,4.89,.072,.095,.072);bulbs.push(b);}
 for(const [x,z,s]of [[0,5.21,.70],[plan.pickup[0],5.24,.66]]){const o=add(lamps,shape('pool',()=>new THREE.CircleGeometry(1,24)),warm,x,-.044,z,s,s*.70,1);o.rotation.x=-Math.PI/2;}
 const queue=new THREE.Group();queue.name='Reputation queue';near.add(queue);
 for(let i=0;i<layout.queue;i++){const c=createCustomer(p,[5,8][i],{standing:true});c.root.position.set(plan.pickup[0]+.65,-.04,5.95+i*.64);c.root.rotation.y=Math.PI;queue.add(c.root);}
 // One baked tree shade gives Light graphics the same ground contact cue.
 if(!rain&&!evening)for(const side of [-1,1]){const shade=new THREE.Group();near.add(shade);for(let i=0;i<4;i++){const o=add(shade,shape('shade',()=>new THREE.CircleGeometry(1,14)),p.contact,side*(r+.65)+i*.12,-.048,-1.1+i*.32,.42,.26,1);o.rotation.x=-Math.PI/2;}mergeStatic(shade);}
 mergeStatic(near);mergeStatic(far);mergeStatic(lamps);
 // Contact sheets and glow pools must not cast opaque rectangle shadows.
 for(const parent of [near,far,lamps])parent.traverse(o=>{if(o.isMesh&&(o.material.transparent||o.material.userData.contact))o.castShadow=false;});
 let lightStart=null;
 return {group,near,far,moving,layout,queue,foliage,puddles,drips,materials:mats,
  setViewport(width){far.visible=width>=600;},
  update(time=0,{reduced=false,menu=false}={}){
   const t=reduced||menu?0:time;foliage.forEach((f,i)=>f.rotation.z=reduced||menu?0:Math.sin(t*.65+i)*.025);
   if(evening){if(lightStart===null)lightStart=time;warm.opacity=.10+.25*(reduced?1:smooth((time-lightStart)/1.1));}
   for(let i=0;i<16&&rain;i++){const x=(i<8?0:plan.pickup[0])+((i%8)/7-.5)*(i<8?2.2:1.8),y=1.95-((i*.173+t*.8)%1)*1.70,z=i<8?5.56:5.42;dripPositions.set([x,y,z,x+.015,y-.14,z+.015],i*6);}
   if(rain)dripsGeometry.attributes.position.needsUpdate=true;
  },
  dispose(){dripsGeometry.dispose();dripMaterial.dispose();}
 };
}

// A visual arrival uses the existing guest and never delays a ticket, changes
// patience, or creates an extra customer. English close-ups settle immediately.
export function guestArrivalPose(table,state,layout,elapsed,{reduced=false,protectedTime=false}={}){
 const seated={x:table.x-(table.pickup?1.6:.96*Math.cos(table.angle)),y:.5,z:table.z+(table.pickup?0:.96*Math.sin(table.angle)),angle:Math.PI/2+(table.pickup?0:table.angle),standing:false,walking:false};
 const destination=table.pickup?{x:layout.pickup[0],y:-.03,z:layout.pickup[1],angle:Math.PI,standing:true,walking:false}:seated;
 if(reduced||protectedTime||state?.status!=='waiting'||state?.stockReserved||elapsed>=4.6)return {...destination,stage:'settled'};
 const side=table.id%2?-1:1,start=[side*(layout.half+1.15),6.28],menu=[layout.menu[0],layout.menu[1]];
 const segment=(a,b,t,stage)=>{const q=smooth(t);return {x:a[0]+(b[0]-a[0])*q,y:-.03,z:a[1]+(b[1]-a[1])*q,angle:Math.atan2(b[0]-a[0],b[1]-a[1]),standing:true,walking:true,stage};};
 if(elapsed<1.35)return segment(start,menu,elapsed/1.35,'approach');
 if(elapsed<2.05)return {x:menu[0],y:-.03,z:menu[1],angle:Math.PI,standing:true,walking:false,stage:'menu'};
 if(table.pickup)return {...segment(menu,layout.pickup,(elapsed-2.05)/1.6,'pickup'),...(elapsed>=3.65?{...destination,stage:'settled'}:{})};
 if(elapsed<2.90)return segment(menu,[0,4.42],(elapsed-2.05)/.85,'entrance');
 // Travel down the central aisle, then to the free side of the selected chair.
 const inner=[0,table.z+(table.angle?Math.sin(table.angle)*.96:0)];
 if(elapsed<3.75){const o=segment([0,4.42],inner,(elapsed-2.90)/.85,'aisle');o.y=.13;return o;}
 const o=segment(inner,[seated.x,seated.z],(elapsed-3.75)/.85,'seat');o.y=.13;return o;
}
