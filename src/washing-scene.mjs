import {spongePosition} from './motion-design.mjs';
import * as THREE from 'three';
import {createVessel} from './food.mjs';
import {stationViewport} from './object-layout.mjs';
import {washingPageLayout,browserTextMeasure} from './page-fit.mjs';

// Compose in camera-facing coordinates: the ceramic profile remains oblique,
// while the native sentence labels remain upright and readable on its surface.
export function buildWashingScene(s,viewport){
 const r=stationViewport(viewport.width,viewport.height,'wash'),layout=washingPageLayout({width:r.width-2,height:r.height-2,blocks:s.context.task.blocks,order:s.context.order,measure:browserTextMeasure(typeof document==='undefined'?null:document.getElementById('task-card'))}),unit=3.6/r.width,h=r.height*unit;
 const rig=s.group(2.8,3.7,.45),normal=new THREE.Vector3(0,7,5).normalize();rig.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);s.cameraOffset=normal.clone().multiplyScalar(5).toArray();s.cameraPoint=rig.position.clone();
 const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});s.ownedMaterials.add(material);const frame=new THREE.Mesh(new THREE.PlaneGeometry(3.6,h),material);frame.position.z=.72;rig.add(frame);s.surfaces.main={mesh:frame,width:3.6,height:h};s.focusSurface=s.surfaces.main;
 const xy=(x,y,z=0)=>new THREE.Vector3((x-r.width/2)*unit,(r.height/2-y)*unit,z),plate=layout.plate,cx=plate.x+plate.width/2,cy=plate.y+plate.height/2,rx=plate.width*unit/2,ry=plate.height*unit/2;
 const finish=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.12});s.ownedMaterials.add(m);return m;};
 const basin=s.box(rig,finish('#405f56'),0,0,-.95,4.25,h+.65,.22,.12);s.box(rig,finish('#b6c8bb'),0,0,-.82,3.97,h+.38,.10,.1);s.box(rig,finish('#648377'),0,0,-.75,3.66,h+.08,.08,.12);
 const dish=s.group(...xy(cx,cy,.01).toArray(),rig);dish.rotation.x=.24;
 // Reuse the actual serving crockery, including its baked vertex colors,
 // shaped well, foot and brass rim. Its shared geometry remains world-owned.
 const vessel=createVessel(s.p,'plate');vessel.rotation.x=Math.PI/2;vessel.scale.set(rx/.46,1,ry/.46/Math.cos(.24));dish.add(vessel);
 const wash={rig,layout,unit,plate,dish,vessel,patches:[],accepted:new Set()};s.washing=wash;
 // One local patch per grammatical block: sauce, crumbs, pasta and peas sit below each label.
 for(const [slot,b] of layout.rects.entries()){
  const x=plate.x+b.x+b.width/2,y=plate.y+b.y+b.height/2,g=s.group(...xy(x,y,.14+(r.height/2-y)*unit*Math.tan(.24)).toArray(),rig),m=new THREE.MeshStandardMaterial({color:['#a7723d','#ae6144','#8a7850'][slot%3],transparent:true,opacity:.63,roughness:1});s.ownedMaterials.add(m);g.rotation.x=.24;
  for(let j=0;j<4;j++){const smear=new THREE.Mesh(new THREE.CircleGeometry(1,18),m);smear.position.set((j-1.5)*b.width*unit*.13,Math.sin(j*2+slot)*b.height*unit*.20,0);smear.scale.set(b.width*unit*.24,b.height*unit*.54,1);smear.rotation.z=(j-1.5)*.09;g.add(smear);}
  for(let j=0;j<7;j++){const a=j*2.4+slot,px=Math.cos(a)*b.width*unit*.47,py=Math.sin(a)*Math.min(b.height*unit*.80,ry*.18),food=j%3===0?s.box(g,s.p.pasta,px,py,.025,.10,.035,.03,.009):j%3===1?s.ball(g,s.p.leaf,px,py,.035,.028):s.box(g,s.p.crust,px,py,.03,.05,.04,.04,.008);food.rotation.z=a;}
  wash.patches[b.index]={root:g,material:m,scale:g.scale.clone(),halfWidth:b.width*unit/2,halfHeight:b.height*unit/2,center:xy(x,y,.25+(r.height/2-y)*unit*Math.tan(.24))};
 }
 const skin=s.world.chef.skin||s.p.skins?.[0]||s.p.bread;
 // The left hand grips the rim. The working hand holds a two-tone sponge.
 const grip=s.group(...xy(plate.x+plate.width*.025,cy+plate.height*.12,.22).toArray(),rig);grip.rotation.z=-.3;
 s.box(grip,s.p.white,-.15,-.30,-.03,.32,.47,.20,.06);s.box(grip,s.p.green,-.15,-.10,.07,.33,.06,.04,.015);s.box(grip,skin,-.06,.05,0,.25,.32,.16,.07);
 for(let i=0;i<3;i++)s.box(grip,skin,.075,.13-i*.065,.09,.17,.055,.09,.025);s.ball(grip,skin,.10,-.07,.12,.075);
 const rest=xy(plate.x+plate.width*.86,plate.y+plate.height*.89,.26),hand=s.group(...rest.toArray(),rig);hand.rotation.z=.40;
 s.box(hand,s.p.white,.17,-.32,-.04,.36,.52,.22,.07);s.box(hand,s.p.green,.17,-.11,.08,.36,.065,.04,.015);s.box(hand,skin,.045,.015,.015,.27,.31,.19,.07);
 const sponge=s.group(-.075,.08,-.04,hand);s.box(sponge,s.p.leaf,-.015,-.015,-.01,.38,.25,.075,.035);s.box(sponge,s.p.cheese,-.015,.01,.05,.39,.26,.08,.035);
 for(let i=0;i<4;i++)s.box(hand,skin,-.10+i*.065,.15,.12,.055,.16,.07,.022);s.ball(hand,skin,-.17,-.025,.10,.075);
 wash.hand=hand;wash.rest=rest;wash.bubbles=s.group(0,0,0,rig);wash.bubbles.visible=false;
 const effectMaterial=(color,opacity,extra={})=>{const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,...extra});s.ownedMaterials.add(m);return m;};
 wash.bubbleShell=effectMaterial('#c9edf1',.24);wash.bubbleRim=effectMaterial('#a6d8df',.75);const bubbleHighlight=effectMaterial('#ffffff',.9),sphere=new THREE.SphereGeometry(1,12,8),rim=new THREE.TorusGeometry(1,.055,4,20);
 wash.trailMaterial=effectMaterial('#effbf5',.48);wash.soapTrail=new THREE.InstancedMesh(new THREE.CircleGeometry(1,12),wash.trailMaterial,10);wash.soapTrail.frustumCulled=false;wash.soapTrail.visible=false;wash.soapTrail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);rig.add(wash.soapTrail);wash.trailDummy=new THREE.Object3D();
 for(let i=0;i<12;i++){
  const bubble=s.group(0,0,0,wash.bubbles),radius=.038+(i%4)*.011,angle=i*2.4;
  bubble.userData.home=new THREE.Vector3(Math.cos(angle)*(.13+i%3*.075),Math.sin(angle)*.19,.035+(i%3)*.025);bubble.position.copy(bubble.userData.home);bubble.userData.radius=radius;bubble.scale.setScalar(radius);
  bubble.add(new THREE.Mesh(sphere,wash.bubbleShell),new THREE.Mesh(rim,wash.bubbleRim));const glint=new THREE.Mesh(sphere,bubbleHighlight);glint.position.set(-.32,.38,.78);glint.scale.set(.17,.10,.10);bubble.add(glint);
 }
 wash.shimmer=s.group(...xy(cx,cy,.19).toArray(),rig);wash.shimmer.rotation.x=.24;wash.shimmer.visible=false;
 wash.sheenMaterial=effectMaterial('#fffef2',0,{blending:THREE.AdditiveBlending});wash.sheen=new THREE.Mesh(new THREE.CircleGeometry(1,32),wash.sheenMaterial);wash.sheen.scale.set(rx*.13,ry*.65,1);wash.sheen.rotation.z=-.45;wash.shimmer.add(wash.sheen);wash.shineRadius=rx;
 const rinseMaterial=effectMaterial('#c2e8e4',.46);wash.rinse=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),rinseMaterial,8);wash.rinse.instanceMatrix.setUsage(THREE.DynamicDrawUsage);wash.rinse.frustumCulled=false;wash.rinse.visible=false;rig.add(wash.rinse);wash.rinseDummy=new THREE.Object3D();wash.rinseCenter=xy(cx,cy,.27);wash.rinseRadius={x:rx,y:ry};
 const star=new THREE.Shape();star.moveTo(0,1);star.lineTo(.18,.18);star.lineTo(1,0);star.lineTo(.18,-.18);star.lineTo(0,-1);star.lineTo(-.18,-.18);star.lineTo(-1,0);star.lineTo(-.18,.18);star.closePath();const starGeometry=new THREE.ShapeGeometry(star);
 wash.glintMaterial=effectMaterial('#fff9cc',0);wash.glints=[];
 for(const [x,y,size]of [[-.63,.34,.09],[.58,-.32,.075],[.37,.64,.065]]){const sparkle=new THREE.Mesh(starGeometry,wash.glintMaterial);sparkle.position.set(x*rx,y*ry,.025);sparkle.userData.size=size;sparkle.scale.setScalar(size);wash.shimmer.add(sparkle);wash.glints.push(sparkle);}
 // Sparse highlights keep the sink recognisable without competing with words.
 for(let i=0;i<4;i++){const drop=s.ball(rig,s.p.metal,-1.65+i*.13,h/2-.12,-.025,.022);drop.scale.y=1.6;}
 basin.userData.washingBasin=true;
}
export function cleanWashingPatch(s,{index,accepted=[],animate=false}={}){
 const w=s.washing;if(!w)return;
 for(const i of accepted){if(w.accepted.has(i))continue;w.accepted.add(i);const patch=w.patches[i];if(!patch)continue;
  if(!animate||i!==index){patch.root.visible=false;continue;}
  s.motions.push({duration:.42,run:t=>{patch.material.opacity=.63*(1-t);patch.root.scale.copy(patch.scale).multiplyScalar(1-t*.34);},done:()=>{patch.root.visible=false;}});
 }
 if(w.accepted.size===w.patches.length&&!w.clean){
  w.clean=true;w.shimmer.visible=true;
  const settle=()=>{w.shimmer.visible=true;w.sheen.visible=false;w.rinse.visible=false;w.glintMaterial.opacity=.65;w.glints.forEach(g=>g.scale.setScalar(g.userData.size));};
  if(animate){w.rinse.visible=true;w.sheen.visible=true;w.shimmer.visible=false;s.motions.push({washShine:true,duration:.84,run:t=>{const p=Math.max(0,(t-.5)*2);w.shimmer.visible=t>=.5;w.sheen.position.x=(p*2-1)*w.shineRadius*.58;w.sheenMaterial.opacity=Math.sin(p*Math.PI)*.3;w.glintMaterial.opacity=p?(.35+.55*Math.sin(p*Math.PI)):0;w.glints.forEach((g,i)=>{const q=Math.max(0,Math.min(1,p*1.6-i*.18));g.scale.setScalar(g.userData.size*(.75+.45*Math.sin(q*Math.PI)));g.rotation.z=Math.sin(q*Math.PI)*.16;});
    for(let i=0;i<8;i++){const phase=(t+i/8)%1,angle=-.25-phase*Math.PI*1.4;w.rinseDummy.position.copy(w.rinseCenter).add(new THREE.Vector3(Math.cos(angle)*w.rinseRadius.x*.92,Math.sin(angle)*w.rinseRadius.y*.91,.03));w.rinseDummy.rotation.set(0,0,angle+Math.PI/2);w.rinseDummy.scale.set(.018,.05+Math.sin(t*Math.PI)*.025,.009);w.rinseDummy.updateMatrix();w.rinse.setMatrixAt(i,w.rinseDummy.matrix);}w.rinse.instanceMatrix.needsUpdate=true;w.rinse.material.opacity=Math.sin(t*Math.PI)*.46;},done:settle});}
  else settle();
 }
 if(!animate){w.bubbles.visible=false;w.soapTrail.visible=false;return;}if(!w.patches[index])return;
 // Replace the hand motion when a quick swipe connects several chunks.
 s.motions=s.motions.filter(m=>!m.washHand);const from=w.hand.position.clone(),target=w.patches[index].center.clone().add(new THREE.Vector3(.10,-.10,.12));w.bubbles.position.copy(w.patches[index].center).add(new THREE.Vector3(0,0,.12));w.bubbles.visible=true;
 // Put the foam outside the native word card so it remains visible during taps.
 const patch=w.patches[index];w.bubbles.children.forEach((b,i)=>{const a=i*2.4,c=Math.cos(a),q=Math.sin(a);b.userData.home.set(Math.abs(c)>.65?Math.sign(c)*(patch.halfWidth+.08):c*patch.halfWidth,Math.abs(q)>.65?Math.sign(q)*(patch.halfHeight+.08):q*patch.halfHeight,.035+i%3*.025);b.position.copy(b.userData.home);});
 w.soapTrail.position.copy(patch.center).add(new THREE.Vector3(0,0,.07));w.soapTrail.visible=true;w.soapTrail.count=0;for(let i=0;i<10;i++){const a=i/9*Math.PI*1.4+.2,c=Math.cos(a),q=Math.sin(a);w.trailDummy.position.set(Math.abs(c)>.65?Math.sign(c)*(patch.halfWidth+.035):c*patch.halfWidth,Math.abs(q)>.65?Math.sign(q)*(patch.halfHeight+.035):q*patch.halfHeight,.012);w.trailDummy.scale.set(.038+i%3*.007,.016+i%2*.005,1);w.trailDummy.updateMatrix();w.soapTrail.setMatrixAt(i,w.trailDummy.matrix);}w.soapTrail.instanceMatrix.needsUpdate=true;
 s.motions.push({washHand:true,duration:.64,run:t=>{w.soapTrail.count=Math.min(10,Math.ceil(t*22));w.trailMaterial.opacity=.48*(1-t);w.hand.position.copy(spongePosition(from,target,w.rest,t));w.hand.rotation.z=.40+Math.sin(t*Math.PI*4)*.10;w.bubbleShell.opacity=.24*(1-t);w.bubbleRim.opacity=.75*(1-t);w.bubbles.children.forEach((b,i)=>{b.position.copy(b.userData.home);b.position.y+=t*(.16+i%3*.025);b.position.z+=t*.10;b.scale.setScalar(b.userData.radius*(.6+.5*Math.sin(t*Math.PI)));});},done:()=>{w.hand.position.copy(w.rest);w.hand.rotation.z=.40;w.bubbles.visible=false;w.soapTrail.visible=false;}});
}
