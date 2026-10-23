import {buildNeighbourhood,guestArrivalPose} from './neighbourhood.mjs';
import {taskIdentity,tableIdentity,intentIdentity} from './task-identity.mjs';
import {customerBehaviour} from './customer-behaviour.mjs';
import {cleanOverview,navigateOverview,panOverview,followOverview} from './overview-navigation.mjs';
import {OpeningWeather} from './opening-weather.mjs';
import {cleanDesign} from './cafe-design.mjs';
import {buildCafeRecovery,createAtmosphereRain} from './cafe-craft.mjs';
import {createCafeMemory} from './cafe-memory.mjs';
// Languini restaurant scene and station cameras.
import {diningStage,eatingPose} from './customer-reviews.mjs';
import {cameraTravel} from './motion-design.mjs';
import {venueLayout} from './venue-layout.mjs';
import {restaurantLayout} from './restaurant-layout.mjs';
import {buildRestaurantRoom} from './restaurant-room.mjs';
import {overviewCamera} from './restaurant-camera.mjs';
import {arenaPalette,floorColor,buildArenaIdentity} from './arena-craft.mjs';
import {createChef,updateChef,updateCharacterFace} from './character-craft.mjs';
import {applySceneLighting} from './scene-lighting.mjs';
import {kitchenTarget} from './kitchen-signifiers.mjs';
import {KITCHEN_TABLES,KITCHEN_POINTS} from './kitchen-flow.mjs';
import {finishGeometry,studioEnvironment} from './geometry-finish.mjs';
import {cleanProjects} from './refurbishment.mjs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {ARENAS,TEAMS} from './core.mjs';
import {StationScene} from './station-scene.mjs';
import {createCustomer,disposeCustomer,ensureCustomerUtensil,customerBehaviourProps,customerWalkPose} from './customers.mjs';
import {createVessel,createFinishedDish} from './food.mjs';
import {guestPose,GUEST_REACTION_SECONDS} from './guest-reactions.mjs';
import {cleanFurnishing,personalityFor} from './service-design.mjs';
import {FOOD_COLORS,RECIPES} from './menu.mjs';
import {TICKET_RAIL,CHECKOUT} from './fixtures.mjs';
import {fitSurfaceCamera,projectSurface,stationViewport} from './object-layout.mjs';
import {createDeliveryPackage} from './delivery-props.mjs';
import {finishPalette,dressRestaurant,contactShadow} from './art-direction.mjs';
import {renderQuality,FrameBudget} from './render-quality.mjs';

export const TABLE_LAYOUTS=KITCHEN_TABLES;
export const FOCUS_POINTS={pickup:[2.9,2.65,3.48],delivery:[-3.2,.95,-1.95],recipe:[-2.25,1.42,2.9],ticket:TICKET_RAIL.paper,repair:CHECKOUT.screen};
export const CAMERA_STYLES={pickup:{width:4,height:4,offset:[0,12,.06]},conversation:{width:2.8,height:3.5,offset:[3,.72,.5]},tablet:{width:2.7,height:3.2,offset:[-.6,.62,-.96],shift:.23},delivery:{width:4.1,height:4.6,offset:[3,2.8,4.2]},recipe:{width:4.2,height:4.3,offset:[0,12,.28]},ticket:{width:2.55,height:2.9,offset:[.45,1.15,4.4],shift:.22},repair:{width:2.7,height:3.1,offset:[1.5,1.45,4.0],shift:.22}};
export function cameraFrame(width,height,{menu=false,focus=null,liveKitchen=false,arena='courtyard'}={}){
  if(!focus)return overviewCamera(width,height,{menu,arena,liveKitchen});
  const style=CAMERA_STYLES[focus?.setting]||CAMERA_STYLES.delivery,aspect=width/height,mobile=width<760,viewHeight=focus?(mobile?style.width/aspect:style.height):(mobile?12.2*venueLayout(arena).overviewScale/aspect:12.1*venueLayout(arena).overviewScale),viewWidth=viewHeight*aspect,shift=mobile?(focus?(style.shift??.19):.11):(focus?.04:0);
  const target=focus?new THREE.Vector3(...focus.point):new THREE.Vector3(0,.7,.2-venueLayout(arena).extraDepth*.18);
  const offset=focus?new THREE.Vector3(...style.offset):new THREE.Vector3(...(liveKitchen?[6,16,12]:[10,13,16]));
  if(['conversation','tablet'].includes(focus?.setting)&&focus.angle)offset.applyAxisAngle(new THREE.Vector3(0,1,0),focus.angle);
  if(mobile&&focus?.setting==='conversation')target.add(new THREE.Vector3(offset.z,0,-offset.x).normalize().multiplyScalar(-viewWidth*.28));
  if(!mobile&&(menu||focus))target.add(new THREE.Vector3(offset.z,0,-offset.x).normalize().multiplyScalar(focus?viewWidth*.16:2.3));
  return {left:-viewWidth/2,right:viewWidth/2,top:viewHeight*(.5-shift),bottom:viewHeight*(-.5-shift),target,position:target.clone().add(offset),up:new THREE.Vector3(0,1,0)};
}
const geoCache=new Map();
const geometry=(key,fn)=>{if(!geoCache.has(key))geoCache.set(key,finishGeometry(fn()));return geoCache.get(key);};
const boxGeo=(x,y,z,r=.05)=>geometry(`b${x},${y},${z},${r}`,()=>new RoundedBoxGeometry(x,y,z,1,Math.min(r,x/3,y/3,z/3)));
const cylGeo=(r1,r2,h,n=12)=>geometry(`c${r1},${r2},${h},${n}`,()=>new THREE.CylinderGeometry(r1,r2,h,n));
const sphereGeo=(r,n=10)=>geometry(`s${r},${n}`,()=>new THREE.SphereGeometry(r,n,7));
function material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:0,...extra});}
function mesh(parent,geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(p,m,x,y,z,w,h,d,r=.05){return mesh(p,boxGeo(w,h,d,r),m,x,y,z);}
function cyl(p,m,x,y,z,r1,r2,h,n=12){return mesh(p,cylGeo(r1,r2,h,n),m,x,y,z);}
function ball(p,m,x,y,z,r=.15,n=10){return mesh(p,sphereGeo(r,n),m,x,y,z);}
function ring(p,m,x,y,z,r=.2,tube=.025){return mesh(p,geometry(`t${r},${tube}`,()=>new THREE.TorusGeometry(r,tube,5,16)),m,x,y,z);}
function mergeStatic(root){
  root.updateMatrixWorld(true);const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map(),old=[];
  root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;const key=o.material.uuid;let g=groups.get(key);if(!g){g={material:o.material,geometries:[]};groups.set(key,g);}const raw=o.geometry.clone(),copy=raw.index?raw.toNonIndexed():raw;if(copy!==raw)raw.dispose();copy.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));g.geometries.push(copy);old.push(o);});
  for(const o of old){o.removeFromParent();if(o.userData.ownedGeometry||o.userData.merged)o.geometry.dispose();}
  for(const g of groups.values()){const geometry=mergeGeometries(g.geometries,false);g.geometries.forEach(x=>x.dispose());if(!geometry)continue;const o=new THREE.Mesh(geometry,g.material);o.castShadow=!g.material.userData.contact;o.receiveShadow=!g.material.userData.contact;o.userData.merged=true;root.add(o);}
}
function textMaterial(text,bg='#173f37',color='#f6e7bf',size=1024){
  if(typeof document==='undefined')return material(bg);
  const c=document.createElement('canvas');c.width=size;c.height=size/4;const ctx=c.getContext('2d');if(!ctx)return material(bg);
  if(size!==1024)ctx.scale(size/1024,size/1024);
  ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#c8aa6c';ctx.lineWidth=12;ctx.strokeRect(15,15,994,226);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font='bold 96px Georgia';ctx.fillText(text,512,136);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return new THREE.MeshStandardMaterial({map:texture,roughness:.8});
}
function serviceFood(p,recipe,{pickup=false,side=false,caption='',identity=null}={}){const g=new THREE.Group();contactShadow(g,p,0,.002,0,.92,.86);g.add(createFinishedDish(p,recipe));if(side&&!pickup){const extra=createFinishedDish(p,8);extra.scale.setScalar(.32);extra.position.set(.45,0,.32);g.add(extra);}if(pickup){box(g,p.cream,0,.23,0,.68,.48,.56,.025);for(const x of [-.16,.16]){const handle=ring(g,p.wood,x,.53,0,.10,.014);handle.scale.y=1.1;}box(g,p.white,.12,.32,.29,.27,.20,.015,.005);}if(identity||caption){caption=identity?(identity.label+(caption?' · '+caption:'')):caption;const m=identityTagMaterial(identity||taskIdentity(),caption);m.userData.transient=true;box(g,m,0,.48,.30,.62,.21,.02,.005);}return g;}
function identityTagMaterial(id,label){const m=textMaterial(label,id.accent,'#fffdf5',256);m.userData.taskIdentity=id.key;m.userData.identityLabel=id.label;return m;}
function stockCrate(p){const g=createDeliveryPackage(p,0),id=taskIdentity({kind:'supplies'}),m=identityTagMaterial(id,'STOCK');m.userData.transient=true;box(g,m,0,.42,.27,.40,.16,.015,.004);return g;}
function carryTray(parent,p){const tray=new THREE.Group();box(tray,p.darkWood,0,-.055,0,.68,.035,.45,.04);for(const x of [-.32,.32])box(tray,p.gold,x,-.032,0,.025,.03,.42,.007);parent.add(tray);mergeStatic(tray);return tray;}
function clearDynamic(parent){const mats=new Set();for(const child of [...parent.children]){child.traverse(o=>{if(o.userData.merged)o.geometry.dispose();if(o.material?.userData.transient)mats.add(o.material);});child.removeFromParent();}for(const m of mats){m.map?.dispose();m.dispose();}}
function foodPlate(parent,palette,recipe,x=0,y=0,z=0){
 const g=createFinishedDish(palette,recipe);g.position.set(x,y,z);g.scale.setScalar(.78);parent.add(g);return g;
}
export function createRestaurant({arena='courtyard',team='gryffindor',furnishings={},postcards=0,projects={},reputationLevel=0,design={},atmosphere='breakfast'}={}){
  const furnishing=cleanFurnishing(furnishings),owned=new Set(furnishing.owned),renovation=cleanProjects(projects),finish=renovation.finish;
  const cafeDesign=cleanDesign(design),plan=restaurantLayout(arena,cafeDesign),venue=plan.venue,root=new THREE.Group(),environment=new THREE.Group(),canopy=new THREE.Group(),backdrop=new THREE.Group(),identity=new THREE.Group(),identityCanopy=new THREE.Group();root.add(environment,canopy);environment.add(backdrop,identity);canopy.add(identityCanopy);for(const g of [backdrop,identity,identityCanopy]){g.position.z=-venue.extraDepth;g.scale.x=venue.width/9.4;}
  const teamInfo=TEAMS.find(x=>x.id===team)||TEAMS[0],arenaInfo=ARENAS.find(x=>x.id===arena)||ARENAS[0];
  const p={cream:material('#f5ecd8'),white:material('#fff9ee'),wood:material('#ab815c'),woodLight:material('#ceb08a'),darkWood:material('#614b3c'),floor:material('#fffdf5'),green:material(arena==='banquet'?'#555377':arena==='bistro'?'#426b68':'#416e5a'),dark:material('#283c3d'),gold:material('#c5ac77',{metalness:.42,roughness:.4}),stone:material('#dadaca'),stoneDark:material('#aeb8a6'),leaf:material('#679365'),leafDark:material('#3e765b'),terra:material('#bb7350'),team:material(teamInfo.color),accent:material(teamInfo.accent),bread:material('#e4b66c'),tomato:material('#c75b47'),soup:material('#e7a14c'),berry:material('#be6e8d'),metal:material('#a4b6ae',{metalness:.6,roughness:.38}),glass:material('#c4e2d6',{roughness:.2,metalness:.13}),glow:new THREE.MeshBasicMaterial({color:'#ffe0a0'}),rune:material('#69edec',{emissive:'#16b4cb',emissiveIntensity:.5,metalness:.25,roughness:.24}),pants:material('#344847'),smile:material('#9a624f')};
  p.skins=['#f0c4a2','#d99e79','#a76f51','#e6b38c','#85553f','#ba805c','#f0d0b2'].map(c=>material(c));p.hairs=['#453127','#292d31','#a87340','#6f4030','#bfa481'].map(c=>material(c));p.clothes=['#668d7f','#ba7462','#6686a0','#d3ad63','#8e7eaa','#528a86','#ae8668','#b47e91'].map(c=>material(c));for(const [key,color]of Object.entries(FOOD_COLORS))p[key]=material(color);arenaPalette(p,arena);finishPalette(p,{arena});p.recoveryLevel=reputationLevel;
  box(environment,p.darkWood,0,-.20,venue.centerZ,9.7+venue.extraWidth,.34,9.4+venue.extraDepth,.15);box(environment,p.stoneDark,0,-.045,venue.centerZ,9.58+venue.extraWidth,.16,9.27+venue.extraDepth,.10);
  const tiles=new THREE.InstancedMesh(boxGeo(.825,.07,.80,.025),p.floor,121);const dummy=new THREE.Object3D(),color=new THREE.Color();let n=0;
  for(let i=0;i<11;i++)for(let j=0;j<11;j++){dummy.position.set((i-5)*.85*venue.width/9.4,.045,(j-5)*.82*venue.depth/9.1+venue.centerZ);dummy.scale.set(venue.width/9.4,1,venue.depth/9.1);dummy.updateMatrix();tiles.setMatrixAt(n,dummy.matrix);color.set(floorColor(arena,i,j));tiles.setColorAt(n++,color);}tiles.receiveShadow=true;environment.add(tiles);
  box(backdrop,p.stone,0,1.12,-4.53,9.4,2.15,.24);box(backdrop,p.stoneDark,0,.15,-4.32,9.4,.15,.25);
  box(environment,p.stone,-4.57-venue.extraWidth/2,.52,venue.centerZ,.23,.98,8.9+venue.extraDepth);box(environment,p.stoneDark,-4.55-venue.extraWidth/2,1.03,venue.centerZ,.34,.11,9.1+venue.extraDepth);
  box(environment,p.stone,4.57+venue.extraWidth/2,.35,-1+venue.centerZ,.23,.62,6.9+venue.extraDepth);box(environment,p.stoneDark,4.55+venue.extraWidth/2,.69,-1+venue.centerZ,.34,.10,6.9+venue.extraDepth);
  for(const x of [-3.1,0,3.1]){box(backdrop,p.darkWood,x,1.25,-4.36,1.55,1.8,.11,.12);box(backdrop,p.green,x,1.3,-4.28,1.31,1.55,.06,.16);for(const dx of [-.39,0,.39])box(backdrop,p.wood,x+dx,1.3,-4.22,.045,1.52,.045);box(backdrop,p.wood,x,.9,-4.19,1.35,.055,.08);box(backdrop,p.woodLight,x,.48,-4.15,1.8,.13,.33);}
  for(const x of [-4.25,4.25]){box(canopy,p.darkWood,x*(venue.width/9.4),1.75,-3.9-venue.extraDepth,.17,3.5,.17);box(canopy,p.darkWood,x*(venue.width/9.4),1.75,3.55,.17,3.5,.17);box(canopy,p.wood,x*(venue.width/9.4),3.46,-.2+venue.centerZ,.22,.20,7.8+venue.extraDepth);}
  for(const z of [-3.95,-2.55,-1.15,.25,1.65,3.6])box(canopy,p.wood,0,3.6,z<0?z-venue.extraDepth:z,8.9+venue.extraWidth,.12,.13);
  const signMat=textMaterial(arenaInfo.name.toUpperCase());box(backdrop,p.gold,0,2.93,-4.1,3.73,.80,.14,.10);box(backdrop,signMat,0,2.93,-4.005,3.56,.65,.07,.07);
  for(const x of [-3.5,3.5]){box(backdrop,p.darkWood,x,2.85,-3.6,.06,.55,.06);cyl(backdrop,p.gold,x,2.55,-3.6,.14,.19,.11,8);cyl(backdrop,p.glow,x,2.35,-3.6,.12,.12,.34,8);for(const dx of [-.11,.11])box(backdrop,p.gold,x+dx,2.35,-3.6,.02,.36,.02);cyl(backdrop,p.gold,x,2.15,-3.6,.18,.14,.08,8);}
  function plant(x,z,scale=1,flower=false){const g=new THREE.Group();g.position.set(x,.1,z);g.scale.setScalar(scale);environment.add(g);cyl(g,p.terra,0,.22,0,.26,.19,.43);cyl(g,p.terra,0,.45,0,.285,.285,.09);cyl(g,p.darkWood,0,.48,0,.24,.24,.03);for(let i=0;i<7;i++){const a=i*2.4;const l=ball(g,i%2?p.leaf:p.leafDark,Math.sin(a)*.16,.65+(i%3)*.1,Math.cos(a)*.16,.23,7);l.scale.set(reputationLevel>=2?.78:.7,reputationLevel>=2?1.55:1.4,reputationLevel>=2?.68:.6);l.rotation.z=Math.sin(a)*.5;if(flower&&i%2===0)ball(g,p.white,Math.sin(a)*.2,.88+(i%3)*.1,Math.cos(a)*.2,.09,7);}}
  for(const [x,z,s]of [[-3.9,-3.6,1.1],[3.9,-3.7,1.2],[-3.9,3.7,1.1],[3.9,3.7,1.1],[-4.05,.3,.8],[4.1,-.2,.85]]){if(cafeDesign.layout==='classic'&&Math.abs(z)<.5)continue;plant(x,z,s,true);}
  if(owned.has('plants'))for(const [x,z]of [[-4.4-venue.extraWidth/2,1.6],[4.4+venue.extraWidth/2,1.6],[3.8,-4.0-venue.extraDepth]])plant(x,z,.8,true);
  if(owned.has('lamps'))for(const x of [-2.5,-1.25,0,1.25,2.5]){cyl(canopy,p.gold,x,3.23,-2.45,.08,.12,.13,8);ball(canopy,p.glow,x,3.05,-2.45,.105,8);}
  if(owned.has('banner')){box(backdrop,p.gold,3.45,2.22,-4.12,1.5,.95,.05,.02);box(backdrop,textMaterial(teamInfo.name.toUpperCase(),teamInfo.color),3.45,2.22,-4.08,1.4,.84,.035,.02);}
  for(let i=0;i<Math.min(8,postcards);i++){const x=-3.6+(i%4)*.31,y=2.65-Math.floor(i/4)*.40;box(backdrop,p.gold,x,y,-4.11,.27,.34,.04,.01);box(backdrop,i%2?p.team:p.accent,x,y,-4.08,.22,.28,.02,.01);ball(backdrop,p.cream,x,y+.03,-4.055,.05,6);}
  for(let i=0;i<20;i++){const x=-4.1+(i%10)*.9,z=i<10?-3.98-venue.extraDepth:3.6;ball(canopy,i%3?p.leafDark:p.leaf,x*venue.width/9.4,3.67+(i%2)*.07,z,.27,7).scale.set(1.6,.4,1.0);}
  const {upperFixtures,prepStatic,railTickets,checkout,bench,trolley,trolleyLoads,warmer,supplyProps}=buildRestaurantRoom(root,environment,p,{plan,furnishing,renovation,box,cyl,ring,ball,textMaterial,foodPlate});
  const tables=[],layout=[...plan.tables,plan.pickup];
  for(let i=0;i<layout.length;i++){
    const [x,z]=layout[i],g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=plan.tableAngles[i]||0;environment.add(g);
    cyl(g,p.darkWood,0,.51,0,.09,.14,.87);cyl(g,p.darkWood,0,.13,0,.38,.34,.10);box(g,p.wood,0,1.0,0,1.4,.13,1.05,.08);box(g,p.team,0,1.077,0,.35,.016,1.02,.01);
    for(const side of [-1,1]){const chair=new THREE.Group();chair.position.set(side*.94,0,0);chair.rotation.y=side===-1?Math.PI/2:-Math.PI/2;g.add(chair);box(chair,p.upholstery,0,.49,0,.52,arena==='bistro'?.16:.12,.54,arena==='bistro'?.07:.04);if(reputationLevel>=1){box(chair,p.team,0,.565,0,.49,.035,.49,.04);box(chair,p.cream,0,1,-.148,.36,.34,.018,.02);}box(chair,p.wood,0,.95,-.23,.55,.72,.07);box(chair,p.upholstery,0,1,-.18,arena==='bistro'?.52:.44,arena==='bistro'?.58:.43,.055,.025);for(const dx of [-.20,.20])for(const dz of [-.20,.20])box(chair,p.darkWood,dx,.24,dz,.065,.47,.065);}
    if(reputationLevel>=2&&cafeDesign.decor.tables==='pottery'){cyl(g,p.terra,0,1.18,-.3,.10,.075,.18,20);ring(g,p.gold,0,1.22,-.3,.10,.008).rotation.x=-Math.PI/2;}else{cyl(g,p.white,0,1.18,-.3,.075,.10,.19,8);for(const dx of [-.07,.03,.08]){cyl(g,p.leaf,dx,1.35,-.3,.012,.012,.23,5);ball(g,p.cream,dx,1.48,-.3,.065,7);}}cyl(g,p.glass,.42,1.2,-.25,.085,.07,.24,10);
    const tableLabel=identityTagMaterial(taskIdentity({tableId:i,pickup:i===arenaInfo.tables}),i===arenaInfo.tables?'PICKUP':'T'+(i+1));tableLabel.userData.gameplaySign=true;box(g,tableLabel,.39,1.25,.32,.29,.27,.035,.015);
    if(owned.has('settings'))for(const side of [-1,1]){cyl(g,p.white,side*.43,1.09,.07,.19,.19,.025,16);box(g,p.gold,side*.43+.24,1.10,.07,.025,.018,.31,.005);}
    if(i===arenaInfo.tables){g.removeFromParent();}
    const readyRoot=new THREE.Group();readyRoot.position.set(...plan.passSlot(i));readyRoot.scale.setScalar(.43);root.add(readyRoot);readyRoot.visible=false;
    cyl(readyRoot,owned.has('tray')?p.gold:p.woodLight,0,-.04,0,.65,.65,.07,16);
    const readyFood=new THREE.Group();readyRoot.add(readyFood);// Build pass food when an order actually becomes ready.
    const foodRoot=new THREE.Group();foodRoot.position.set(x,1.10,z);foodRoot.scale.setScalar(.75);root.add(foodRoot);foodRoot.add(createFinishedDish(p,i));mergeStatic(foodRoot);foodRoot.visible=false;
    const guest=createCustomer(p,i,{walkable:true});const a=plan.tableAngles[i]||0;guest.root.position.set(x-.96*Math.cos(a),.5,z+.96*Math.sin(a));guest.root.rotation.y=Math.PI/2+a;guest.root.visible=false;root.add(guest.root);
    tables.push({id:i,pickup:i===arenaInfo.tables,x,z,angle:plan.tableAngles[i]||0,guest,customerId:i,foodRoot,readyRoot,readyFood,dishIndex:i,dishSignature:i+':1',anchor:new THREE.Vector3(x,2.15,z)});
  }
  const processing=new THREE.Group();root.add(processing);
  const pickup=tables.at(-1),[px,pz]=plan.pickup;pickup.guest.root.position.set(px-1.6,.5,pz);pickup.anchor.set(px,2.15,pz);cyl(environment,p.wood,px-1.6,.83,pz,.23,.23,.10,12);box(environment,p.darkWood,px-1.6,.43,pz,.10,.80,.10);
  dressRestaurant(environment,p,{arena,backdrop,venue,plan,tables:tables.filter(t=>!t.pickup),box,cyl,ring});
  const arenaIdentity=buildArenaIdentity(identity,identityCanopy,p,{arena,venue,box,cyl});
  // Bake static meshes by material to keep draw calls reasonable on phones.
  // Keep tall boundary details separately batched for close-up cutaways.
  environment.remove(backdrop,identity);mergeStatic(backdrop);mergeStatic(identity);mergeStatic(environment);environment.add(backdrop,identity);mergeStatic(upperFixtures);mergeStatic(prepStatic);mergeStatic(canopy);mergeStatic(bench);mergeStatic(trolley);mergeStatic(warmer);
  if(reputationLevel>0){const titles=['A FRESH START','OUR REGULARS RETURN','WORD IS SPREADING','A LOCAL FAVOURITE','A NEW CHAPTER'];box(root,p.gold,0,1.12,4.39,1.65,.49,.08,.035);box(root,textMaterial(titles[Math.min(4,reputationLevel-1)],'#365c4c','#fff2cf',512),0,1.12,4.44,1.56,.40,.015,.02);if(reputationLevel>=2)for(const x of [-1.0,1.0]){cyl(root,p.terra,x,.28,4.2,.15,.12,.30,10);ball(root,p.leaf,x,.54,4.2,.20,8);}if(reputationLevel>=3)for(const x of [-.65,0,.65]){const rosette=ball(root,p.gold,x,1.58,4.41,.09,8);rosette.scale.z=.25;}if(reputationLevel>=4)for(const x of [-1.6,1.6]){cyl(root,p.gold,x,1.35,4.25,.025,.025,2.4,8);ball(root,p.glow,x,2.58,4.25,.13,8);}if(reputationLevel>=5)box(root,p.gold,0,1.83,4.4,1.15,.07,.045,.02);}
  const recoveryRoot=buildCafeRecovery(root,p,{plan,design:cafeDesign,level:reputationLevel,box,cyl,ball,ring,textMaterial,createCustomer,mergeStatic});
  const neighbourhood=buildNeighbourhood(root,p,{plan,arena,level:reputationLevel,atmosphere,mergeStatic,createCustomer});
  const atmosphereRain=createAtmosphereRain(root,p,plan,atmosphere,mergeStatic);atmosphereRain.update(0,true);if(p.daylight)p.daylight.opacity=atmosphere==='rain'?.025:atmosphere==='evening'?.025:.08;
  const memoryPhoto=createCafeMemory(p);memoryPhoto.position.set(-1.05,1.67,plan.kitchenZ+.74);root.add(memoryPhoto);
  const chef=createChef(p);chef.root.position.set(plan.start[0],.13,plan.start[1]);root.add(chef.root);
  const characterContacts=new THREE.InstancedMesh(geometry('character-contact',()=>new THREE.PlaneGeometry(1,1)),p.contact,tables.length*2+1);characterContacts.count=0;characterContacts.renderOrder=1;characterContacts.frustumCulled=false;root.add(characterContacts);
  const carrier=new THREE.Group();carrier.position.set(0,.78,.38);chef.body.add(carrier);
  const steam=new THREE.Group();root.add(steam);const steamPuffs=[];const steamMat=new THREE.MeshBasicMaterial({color:'#fff4e0',transparent:true,opacity:.24,depthWrite:false});
  for(let i=0;i<9;i++){const puff=ball(steam,steamMat,0,2.0,2.9,.07+(i%3)*.025,7);puff.visible=false;steamPuffs.push(puff);}
  return {root,environment,neighbourhood,characterContacts,memoryPhoto,design:cafeDesign,atmosphere,recoveryRoot,atmosphereRain,venue,plan,occluders:[backdrop,identity,upperFixtures,recoveryRoot,atmosphereRain.group,neighbourhood.group],arenaIdentity,supplyProps,canopy,prepStatic,bench,trolley,warmer,trolleyLoads,processing,carrier,renovation,furnishing,palette:p,tables,chef,steamPuffs,arenaInfo,ticketRail:{papers:railTickets},checkout,waypoints:[],effects:[]};
}
export function setTableCustomer(world,tableId,customerId){const t=world.tables[tableId];if(!t||t.customerId===customerId)return;disposeCustomer(t.guest);t.guest=createCustomer(world.palette,customerId,{walkable:true});const a=t.pickup?0:t.angle;t.guest.root.position.set(t.x-(t.pickup?1.6:.96*Math.cos(a)),.5,t.z+(t.pickup?0:.96*Math.sin(a)));t.guest.root.rotation.y=Math.PI/2+a;world.root.add(t.guest.root);t.customerId=customerId;delete t.reaction;delete t.guestReaction;delete t.giftCard;t.speaking=false;}
export class RestaurantView {
  constructor(container,{onTap,onFloor,onStationAction,onStationGesture,onStationResize,onFailure,settings={}}={}){
    this.container=container;this.onTap=onTap;this.onFloor=onFloor;this.onStationAction=onStationAction;this.onStationGesture=onStationGesture;this.onStationResize=onStationResize;this.onFailure=onFailure;this.menu=true;this.motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');this.settings=settings;this.reduced=settings.motion==='reduced'||this.motionQuery.matches;this.fallback=false;this.frameBudget=new FrameBudget();this.quality=renderQuality(settings.quality,{pixelRatio:window.devicePixelRatio||1,memory:globalThis.navigator?.deviceMemory??8,cores:globalThis.navigator?.hardwareConcurrency??8});
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e9dfcb');this.scene.fog=new THREE.Fog('#e9dfcb',25,65);this.studioMap=studioEnvironment();this.scene.environmentIntensity=.32;this.scene.environment=this.studioMap;
    this.camera=new THREE.OrthographicCamera(-10,10,7,-7,.1,90);
    try{this.renderer=new THREE.WebGLRenderer({antialias:this.quality.antialias,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(this.quality.pixelRatio);this.renderer.shadowMap.enabled=this.quality.shadows;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;container.append(this.renderer.domElement);}
    catch(e){this.fallback=true;onFailure?.('3D graphics are unavailable. Try a browser with WebGL enabled.');return;}
    this.renderer.domElement.setAttribute('aria-label','Interactive 3D restaurant');this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;onFailure?.('Graphics paused. Waiting for the browser to restore the scene.');clearTimeout(this.contextTimer);const checkRecovery=()=>{if(!this.contextLost)return;if(document.hidden){this.contextTimer=setTimeout(checkRecovery,8000);return;}window.RuneBistroStartup?.fail('Graphics could not recover. Try again to reopen the café.');};this.contextTimer=setTimeout(checkRecovery,8000);});this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;clearTimeout(this.contextTimer);this.renderer.resetState?.();onFailure?.('');this.resize();});
    this.skyLight=new THREE.HemisphereLight('#fff4de','#849b91',1.65);this.scene.add(this.skyLight);const ambient=new THREE.AmbientLight('#fff7e9',.18);this.scene.add(ambient);
    const sun=new THREE.DirectionalLight('#fff0d1',3.2);sun.position.set(-5,11,6);sun.castShadow=true;this.sun=sun;sun.shadow.mapSize.set(this.quality.shadowSize,this.quality.shadowSize);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:30});sun.shadow.normalBias=.012;sun.shadow.bias=-.00015;sun.shadow.radius=3;this.scene.add(sun,sun.target);
    const fill=new THREE.DirectionalLight('#e4f1eb',.80);this.fillLight=fill;fill.position.set(7,5,-4);this.scene.add(fill);
    const ground=mesh(this.scene,new THREE.PlaneGeometry(200,200),material('#e5dcc8'),0,-.42,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;ground.receiveShadow=true;this.ground=ground;
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    const canvas=this.renderer.domElement;
    this.overview=cleanOverview();this.installOverviewGestures(canvas);
    canvas.addEventListener('pointerdown',e=>{if(e.overviewHandled)return;if(this.down||e.isPrimary===false||e.button>0)return;this.down={x:e.clientX,y:e.clientY,id:e.pointerId};if(this.focus&&this.stationReady()){const action=this.pickStationAction(e.clientX,e.clientY);this.down.gesture=!!this.onStationGesture?.('start',e,action);if(this.down.gesture)try{canvas.setPointerCapture(e.pointerId);}catch{}}});
    canvas.addEventListener('pointermove',e=>{if(this.down?.id===e.pointerId&&this.down.gesture)this.onStationGesture?.('move',e);});
    canvas.addEventListener('pointercancel',e=>{if(this.down?.id!==e.pointerId)return;this.onStationGesture?.('cancel',e);this.down=null;});
    canvas.addEventListener('lostpointercapture',e=>{if(this.down?.id!==e.pointerId)return;this.onStationGesture?.('cancel',e);this.down=null;});
    canvas.addEventListener('pointerup',e=>{if(e.overviewHandled)return;const down=this.down;if(!down||down.id!==e.pointerId)return;this.down=null;if(down.gesture){this.onStationGesture?.('end',e);try{canvas.releasePointerCapture(e.pointerId);}catch{}return;}if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>12||this.menu||!this.world)return;if(this.focus){if(!this.stationReady())return;const action=this.pickStationAction(e.clientX,e.clientY);if(action)this.onStationAction?.(action);return;}const rect=container.getBoundingClientRect();this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.hitMeshes);if(hits[0])this.onTap?.(hits[0].object.userData.tableId);else if(this.liveKitchen){const floor=this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.13),new THREE.Vector3());if(floor)this.onFloor?.(floor.x,floor.z);}});
    window.addEventListener('pointerup',e=>{if(this.down?.id!==e.pointerId)return;const gesture=this.down.gesture;this.down=null;if(gesture)this.onStationGesture?.('end',e);});
    window.addEventListener('pointercancel',e=>{if(this.down?.id!==e.pointerId)return;this.down=null;this.onStationGesture?.('cancel',e);});
    this.motionQuery.addEventListener?.('change',()=>this.applySettings(this.settings));
    window.addEventListener('blur',()=>{this.down=null;this.endObjectDrag({animate:true});});
    this.openingWeather=new OpeningWeather(container);this.setRestaurant({});this.resize();
  }
  setRestaurant(config,{reuse=false}={}){
    if(this.fallback)return;
    const visual=JSON.stringify({arena:config.arena||'courtyard',team:config.team||'gryffindor',furnishings:config.furnishings||{},projects:config.projects||{},postcards:config.postcards||0,reputationLevel:config.reputationLevel||0,design:cleanDesign(config.design),atmosphere:config.atmosphere||'breakfast'});
    if(reuse&&this.menu&&!this.focus&&this.world&&this.sceneSignature===visual)return false;
    this.overview=cleanOverview();this.manualOverview=false;this.followPaused=null;this.clearOverviewGesture?.();this.sceneSignature=visual;this.menuDirty=true;this.menuPrimed=false;this.menuElapsed=0;

    this.station?.dispose();this.station=null;
    this.focus=null;
    if(this.world){this.world.atmosphereRain?.dispose();this.world.neighbourhood?.dispose();this.scene.remove(this.world.root);const geometries=new Set(),materials=new Set();this.world.root.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isMesh){if(o.userData.merged||o.userData.ownedGeometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());for(const v of Object.values(this.world.palette))for(const m of Array.isArray(v)?v:[v])if(m?.isMaterial)materials.add(m);const maps=new Set();materials.forEach(m=>{if(m.map)maps.add(m.map);m.dispose();});maps.forEach(t=>t.dispose());}
    this.world=createRestaurant(config);this.scene.add(this.world.root);this.hitMeshes=[];
    this.world.tables.forEach(t=>{const hit=mesh(this.world.root,new THREE.BoxGeometry(1.8,2.3,1.5),new THREE.MeshBasicMaterial({visible:false}),t.x,1.1,t.z);hit.userData.tableId=t.id;this.hitMeshes.push(hit);});
    if(this.menu)this.world.tables.forEach(t=>t.guest.root.visible=true);
    this.openingWeather?.set(this.world.atmosphere);applySceneLighting(this);this.resize();
  }
  applySettings(settings){
    if(this.station?.dragging)this.onStationResize?.();this.settings=settings;this.reduced=settings.motion==='reduced'||this.motionQuery.matches;this.quality=renderQuality(settings.quality,{pixelRatio:window.devicePixelRatio||1,memory:globalThis.navigator?.deviceMemory??8,cores:globalThis.navigator?.hardwareConcurrency??8});
    if(typeof document!=='undefined'&&document.documentElement?.dataset)document.documentElement.dataset.motion=this.reduced?'reduced':'full';
    if(this.fallback)return;this.scene.environment=this.studioMap;this.renderer.setPixelRatio(this.quality.pixelRatio);this.renderer.shadowMap.enabled=this.quality.shadows;if(this.sun&&this.sun.shadow.mapSize.x!==this.quality.shadowSize){this.sun.shadow.mapSize.set(this.quality.shadowSize,this.quality.shadowSize);this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}applySceneLighting(this);this.resize();
  }
  diagnostics(){const info=this.renderer?.info;return {...this.frameBudget.report(),quality:this.quality.tier,pixelRatio:this.quality.pixelRatio,renderCalls:info?.render?.calls??null,renderTriangles:info?.render?.triangles??null,textures:info?.memory?.textures??null,geometries:info?.memory?.geometries??null};}
  setMenu(menu){this.menu=menu;this.menuDirty=true;this.menuPrimed=false;this.openingWeather?.visible(menu);if(this.renderer?.shadowMap)this.renderer.shadowMap.autoUpdate=!menu;this.focusTask(null);this.resize();}
  focusTask(setting,tableId=0,context={}){
    this.clearOverviewGesture?.();
    // Consecutive menu pages use the same physical screen. Keep its camera
    // settled instead of replaying the arrival flight between language tasks.
    const sameScreen=['tablet','pickup'].includes(setting)&&this.focus?.setting===setting&&this.focus.tableId===tableId&&this.stationReady();
    this.station?.dispose();this.station=null;if(!setting){this.focus=null;applySceneLighting(this);this.resize(true);return;}if(this.world&&context.customerId!=null)setTableCustomer(this.world,tableId,context.customerId);const t=this.world?.tables[tableId];
    const customer=setting==='conversation'||setting==='tablet';
    if(this.world&&context.task)this.station=new StationScene(this.world,{setting,tableId,...context,viewport:{width:this.container.clientWidth,height:this.container.clientHeight}});this.focus={setting,tableId,angle:t?.angle||0,point:this.station?.cameraPoint?.toArray()||(customer&&t?[t.guest.root.position.x,1.5,t.guest.root.position.z]:(FOCUS_POINTS[setting]||FOCUS_POINTS.ticket).map((n,i)=>n+(this.world?.plan.stationOffsets[setting]?.[i]||0)))};applySceneLighting(this);this.resize(!sameScreen);
  }
  stationReady(){return !this.cameraGoal||this.reduced||!this.cameraFlight&&this.camera.position.distanceTo(this.cameraGoal.position)<.025&&this.cameraTarget.distanceTo(this.cameraGoal.target)<.025&&['left','right','top','bottom'].every(k=>Math.abs(this.camera[k]-this.cameraGoal[k])<.018);}
  projectObject(key){const surface=this.station?.surfaces?.[key];return surface?projectSurface(surface,this.camera,this.container.clientWidth,this.container.clientHeight):null;}
  startObjectDrag(kind,index,pickup=null){
    if(!this.station?.beginDrag(kind,index))return false;const point=this.station.dragging.target.getWorldPosition(new THREE.Vector3());this.dragPlane=new THREE.Plane().setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()),point);
    const anchor=this.objectDragPoint();this.dragPickup=pickup?{x:anchor.x-pickup.x,y:anchor.y-pickup.y}:null;return true;
  }
  moveObjectDrag(x,y){
    if(!this.station?.dragging||!this.dragPlane)return;if(this.dragPickup){x+=this.dragPickup.x;y+=this.dragPickup.y;}
    const r=this.container.getBoundingClientRect();if(this.station.dragging.kind==='ingredient'){
      const d=this.station.dragging,points=this.projectObject('ingredient-'+d.index),anchor=this.objectDragPoint(),radius=this.station.trays[d.index].radius*(r.width/(this.camera.right-this.camera.left)),phone=this.station.prepLayout?.mode==='phone',left=phone?-radius:Math.min(-radius,...points.map(p=>r.left+p.x-anchor.x)),right=phone?radius:Math.max(radius,...points.map(p=>r.left+p.x-anchor.x)),top=phone?-radius:Math.min(-radius,...points.map(p=>r.top+p.y-anchor.y)),bottom=phone?radius:Math.max(radius,...points.map(p=>r.top+p.y-anchor.y)),work=this.workRect||stationViewport(r.width,r.height,'recipe');
      x=THREE.MathUtils.clamp(x,r.left+8-left,r.right-8-right);y=THREE.MathUtils.clamp(y,r.top+work.y+6-top,r.top+work.y+work.height-6-bottom);
    }
    this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const point=this.raycaster.ray.intersectPlane(this.dragPlane,new THREE.Vector3());if(point)this.station.moveDrag(point);const anchor=this.objectDragPoint();return anchor?{...anchor,pickup:this.dragPickup?{x:anchor.x-this.dragPickup.x,y:anchor.y-this.dragPickup.y}:anchor}:null;
  }
  objectDragPoint(){const d=this.station?.dragging;if(!d)return null;const r=this.container.getBoundingClientRect(),p=d.target.getWorldPosition(new THREE.Vector3()).project(this.camera);return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(.5-p.y*.5)*r.height};}
  endObjectDrag(options){this.station?.endDrag(options);this.dragPlane=null;this.dragPickup=null;}
  pickStationAction(x,y){if(this.fallback||!this.station)return null;const r=this.container.getBoundingClientRect();this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.world.root.updateMatrixWorld(true);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects(this.station.hits.filter(h=>h.userData.enabled!==false));return hits[0]?.object.userData.stationAction||null;}
  projectAction(){if(!this.station?.targetPoint)return null;const p=this.station.targetPoint.clone().project(this.camera);return{x:(p.x*.5+.5)*this.container.clientWidth,y:(-.5*p.y+.5)*this.container.clientHeight};}
  selectIngredient(index){this.station?.selectIngredient(index);}
  addIngredient(index){this.station?.addIngredient(index);}
  rejectIngredient(index){this.station?.reject(index);}
  reactStation(action,value){this.station?.react(action,value);if(action==='print'&&this.station?.context.setting==='repair')this.resize(!this.station.restoring);if(['conversation','tablet','tablet-pair'].includes(action)){const t=this.world?.tables[this.focus?.tableId];if(t)t.reaction=0;}}
  reactGuest(tableId,kind,customerId=null){
    const t=this.world?.tables[tableId];if(!t||!GUEST_REACTION_SECONDS[kind])return;if(customerId!=null)setTableCustomer(this.world,tableId,customerId);
    t.guestReaction={kind,elapsed:0,duration:GUEST_REACTION_SECONDS[kind]};
    if(kind==='gift'&&!t.giftCard){const card=new THREE.Group();t.guest.body.add(card);card.position.set(.32,.65,.30);box(card,this.world.palette.gold,0,0,0,.29,.20,.035,.012);box(card,this.world.palette.cream,0,0,.022,.25,.16,.012,.006);ball(card,this.world.palette.team,0,0,.035,.044,7);t.giftCard=card;}
    if(t.giftCard)t.giftCard.visible=kind==='gift';
  }
  setSpeaking(tableId,speaking){const t=this.world?.tables[tableId];if(t)t.speaking=speaking;}
  overviewEnabled(){return !!this.liveKitchen&&!this.menu&&!this.focus&&!this.takeover&&!this.story&&!this.navigationBlocked&&!this.contextLost;}
  // Portrait phones follow the chef until the player pinches, pans or zooms; Reset hands the camera back.
  followCapable(){return !!this.liveKitchen&&(this.viewport?.width??this.container.clientWidth)<760;}
  overviewChanged(){const s=this.overview||{zoom:1,x:0,y:0};return this.followCapable()?!!(this.manualOverview||this.followPaused):Math.abs(s.zoom-1)>.001||!!s.x||!!s.y;}
  changeOverview(value,{manual=true}={}){if(!this.overviewEnabled()||this.cameraFlight)return false;if(manual)this.manualOverview=true;this.overview=cleanOverview(value);this.resize();return true;}
  zoomOverview(delta){return this.changeOverview({...this.overview,zoom:this.overview.zoom+delta});}
  resetOverview(){this.followPaused=null;const changed=this.changeOverview({zoom:1,x:0,y:0},{manual:false});this.manualOverview=false;return changed;}
  followChef(kitchen){
    if(!kitchen?.position||!this.followCapable()||this.manualOverview||!this.overviewEnabled()||this.cameraFlight||!this.overviewBase)return;
    const destination=kitchen.route?.length?kitchen.route.at(-1).x.toFixed(2)+','+kitchen.route.at(-1).z.toFixed(2):'idle';
    if(this.followPaused){if(destination==='idle'||destination===this.followPaused.destination)return;this.followPaused=null;}
    this.overview=followOverview(this.overviewBase,{x:kitchen.position.x,y:.5,z:kitchen.position.z});this.cameraGoal=navigateOverview(this.overviewBase,this.overview);
  }
  revealOverviewPoint(point,rect){
    if(!this.overviewEnabled())return;const p=this.projectKitchenPoint(point),base=this.overviewBase;if(!p||!base)return;
    const cx=(rect.left+rect.right)/2,cy=(rect.top+rect.bottom)/2;
    // A revealed mark holds the view until the chef sets off somewhere new.
    if(this.followCapable()&&!this.manualOverview){const k=this.followKitchen;this.followPaused={destination:k?.route?.length?k.route.at(-1).x.toFixed(2)+','+k.route.at(-1).z.toFixed(2):'idle'};}
    this.changeOverview(panOverview(base,this.overview,cx-p.x,cy-p.y,this.viewport.width,this.viewport.height),{manual:false});
    const after=this.projectKitchenPoint(point);if(after.x<rect.left||after.x>rect.right||after.y<rect.top||after.y>rect.bottom)this.changeOverview({zoom:.9,x:0,y:0},{manual:false});
  }
  installOverviewGestures(canvas){
    const pointers=new Map();let gesture=null;
    this.clearOverviewGesture=()=>{pointers.clear();gesture=null;this.down=null;};
    const distance=()=>{const a=[...pointers.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);};
    canvas.addEventListener('wheel',e=>{if(!this.overviewEnabled()||this.cameraFlight)return;e.preventDefault();this.zoomOverview(-Math.sign(e.deltaY)*.04);},{passive:false});
    canvas.addEventListener('pointerdown',e=>{
      if(this.overviewEnabled()&&this.cameraFlight){e.overviewHandled=true;return;}if(!this.overviewEnabled()||e.button>0)return;e.overviewHandled=true;const p={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,p);try{canvas.setPointerCapture(e.pointerId);}catch{}
      if(pointers.size===1){const r=this.container.getBoundingClientRect();this.pointer.set((p.x-r.left)/r.width*2-1,-(p.y-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);gesture={start:p,last:p,moved:false,canPan:!this.raycaster.intersectObjects(this.hitMeshes).length};}
      else {gesture={pinch:true,distance:distance(),zoom:this.overview.zoom,moved:true};this.down=null;}
    });
    canvas.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId)||!gesture)return;if(!this.overviewEnabled()){this.clearOverviewGesture();return;}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(gesture.pinch){if(pointers.size>=2)this.changeOverview({...this.overview,zoom:gesture.zoom*distance()/Math.max(1,gesture.distance)});return;}
      if(Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)>10)gesture.moved=true;
      if(gesture.moved&&gesture.canPan){this.changeOverview(panOverview(this.overviewBase,this.overview,e.clientX-gesture.last.x,e.clientY-gesture.last.y,this.viewport.width,this.viewport.height));gesture.last={x:e.clientX,y:e.clientY};}
    });
    const end=(e,cancel=false)=>{if(!pointers.has(e.pointerId))return;e.overviewHandled=true;const g=gesture;pointers.delete(e.pointerId);if(!pointers.size)gesture=null;
      if(cancel||!g||g.moved||Math.hypot(e.clientX-g.start.x,e.clientY-g.start.y)>10||!this.overviewEnabled())return;
      const r=this.container.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.hitMeshes)[0];if(hit)this.onTap?.(hit.object.userData.tableId);else{const floor=this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.13),new THREE.Vector3());if(floor)this.onFloor?.(floor.x,floor.z);}
    };
    canvas.addEventListener('pointerup',e=>end(e));canvas.addEventListener('pointercancel',e=>end(e,true));canvas.addEventListener('lostpointercapture',e=>end(e,true));window.addEventListener('blur',this.clearOverviewGesture);
  }
  resize(animate=false){if(this.fallback)return;this.menuDirty=true;this.projectionRevision=(this.projectionRevision||0)+1;const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;const old=this.viewport;this.viewport={width:w,height:h};this.workRect=stationViewport(w,h,this.focus?.setting);if(this.station&&old&&(Math.abs(old.width-w)>2||Math.abs(old.height-h)>2)&&!this.pendingStationReframe){this.pendingStationReframe=true;this.down=null;this.endObjectDrag();Promise.resolve().then(()=>{this.pendingStationReframe=false;this.onStationResize?.();});}this.renderer.setSize(w,h,false);this.world?.neighbourhood?.setViewport(w,h);this.cameraGoal=this.station?.focusSurface?fitSurfaceCamera(this.station.focusSurface,w,h,{setting:this.focus.setting,offset:this.station.cameraOffset}):cameraFrame(w,h,{menu:this.menu,focus:this.focus,liveKitchen:this.liveKitchen,arena:this.world?.arenaInfo.id});
    if(!this.menu&&!this.focus&&this.liveKitchen){this.overviewBase=this.cameraGoal;this.overview=cleanOverview(this.overview);this.cameraGoal=navigateOverview(this.overviewBase,this.overview);}
    if(!animate||this.reduced||!this.cameraTarget){this.cameraFlight=null;this.cameraTarget=this.cameraGoal.target.clone();this.camera.position.copy(this.cameraGoal.position);this.camera.up.copy(this.cameraGoal.up);for(const key of ['left','right','top','bottom'])this.camera[key]=this.cameraGoal[key];this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();}else this.cameraFlight={elapsed:0,duration:this.focus?.setting ? .55 : .7,position:this.camera.position.clone(),target:this.cameraTarget.clone(),up:this.camera.up.clone(),...Object.fromEntries(['left','right','top','bottom'].map(k=>[k,this.camera[k]]))};}
  revealVenue(){
    if(this.menu){this.resize();return;}
    if(this.fallback||!this.cameraGoal||this.reduced)return;
    const goal=this.cameraGoal;this.camera.position.copy(goal.position).add(new THREE.Vector3(.55,.35,.22));this.cameraTarget.copy(goal.target);this.camera.up.copy(goal.up);
    for(const k of ['left','right','top','bottom'])this.camera[k]=goal[k]*1.035;
    this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    this.cameraFlight={elapsed:0,duration:.72,position:this.camera.position.clone(),target:this.cameraTarget.clone(),up:this.camera.up.clone(),...Object.fromEntries(['left','right','top','bottom'].map(k=>[k,this.camera[k]]))};
  }
  projectKitchenPoint(point){if(!point||this.fallback||!this.camera)return null;const p=new THREE.Vector3(point.x,point.y??.30,point.z).project(this.camera);return{x:(p.x*.5+.5)*this.container.clientWidth,y:(.5-p.y*.5)*this.container.clientHeight};}
  projectSupply(){if(this.fallback||!this.world)return{x:this.container.clientWidth*.24,y:this.container.clientHeight*.30};const p=new THREE.Vector3(this.world.plan.points.receiving[0],1.6,this.world.plan.kitchenZ).project(this.camera);return {x:(p.x*.5+.5)*this.container.clientWidth,y:(-.5*p.y+.5)*this.container.clientHeight};}
  projectTable(id){if(this.fallback)return{x:this.container.clientWidth*((id%2+1)/3),y:this.container.clientHeight*.32+Math.floor(id/2)*90};if(!this.world)return{x:-100,y:-100};const v=this.world.tables[id]?.anchor.clone();if(!v)return{x:-100,y:-100};v.project(this.camera);return {x:(v.x*.5+.5)*this.container.clientWidth,y:(-.5*v.y+.5)*this.container.clientHeight};}
  sendChef({type,table,station}){if(!this.world||this.reduced)return;const w=this.world;if(type==='cooking'){const [x,z]=w.plan.points['cook'+station];w.waypoints=[new THREE.Vector3(x,.13,z)];}else if(type==='served'){const t=w.tables[table];w.root.updateMatrixWorld(true);t.servingFrom=w.carrier.getWorldPosition(new THREE.Vector3());t.serving=0;w.waypoints=[new THREE.Vector3(w.plan.start[0],.13,w.plan.start[1])];}}
  dispatch(loads){if(!this.world)return;this.world.waypoints=[];this.world.trolleyLoads.userData.signature=null;}
  revealProject(id){const [x,z]=this.world.plan.points[id==='receiving'?'receiving':id==='kitchen'?'recipe':'pass'],point=[x,1.3,z];this.focus={setting:'delivery',point};this.resize(true);setTimeout(()=>{if(!this.station){this.focus=null;this.resize(true);}},1500);}
  reward(table,count=8){if(!this.world||this.reduced)return;const t=this.world.tables[table];for(let i=0;i<count;i++){const m=mesh(this.world.root,geometry('rune',()=>new THREE.OctahedronGeometry(.085,0)),this.world.palette.rune,t.x+(Math.random()-.5)*.6,1.5+Math.random()*.4,t.z);this.world.effects.push({mesh:m,life:0,delay:i*.045});}}
  updateKitchen(time,dt,game){
    const w=this.world,k=game.kitchen;
    w.waypoints=[];w.chef.root.position.set(k.position.x,.13,k.position.z);w.chef.root.rotation.y=k.rotation;
    w.chef.body.position.y=this.reduced?0:k.moving?Math.sin(time*17)*.028:0;
    updateChef(w.chef,time,{moving:k.moving,carrying:k.hands!=='empty',busy:!!k.busy,reduced:this.reduced||game.paused||game.focused});
    if(!w.live){
      const root=new THREE.Group();w.root.add(root);const guideMaterial=material('#465b50');const destination=ring(root,guideMaterial,0,.13,0,.27,.018);destination.rotation.x=-Math.PI/2;destination.castShadow=false;
      const path=new THREE.InstancedMesh(geometry('kitchen-path',()=>new THREE.CylinderGeometry(.035,.035,.008,6)),guideMaterial,16);path.castShadow=false;root.add(path);
      const footprint=new THREE.Group();root.add(footprint);for(const x of [-.07,.07]){const sole=cyl(footprint,w.palette.rune,x,.145,x<0?-.04:.04,.055,.055,.01,8);sole.scale.z=1.7;}
      const holding=new THREE.Group();root.add(holding);const plates=new THREE.Group();root.add(plates);w.live={root,destination,path,holding,plates,footprint,signature:''};
    }
    const live=w.live,target=kitchenTarget(game);live.destination.material.color.set(intentIdentity(game,target).accent);live.root.visible=!this.focus&&!this.menu&&!game.focused&&!game.paused&&game.state==='playing';live.destination.visible=!!target?.point||k.moving;
    if(target?.point||k.moving){const end=k.pending?.kind==='walk'?k.route.at(-1):target?.point||k.route.at(-1);live.destination.position.set(end.x,.13,end.z);}
    live.footprint.visible=!!k.tapMarker;if(k.tapMarker)live.footprint.position.set(k.tapMarker.x,0,k.tapMarker.z);
    const dummy=new THREE.Object3D(),dots=k.route.filter((_,i)=>i%2===0).slice(0,16);live.path.count=dots.length;
    dots.forEach((p,i)=>{dummy.position.set(p.x,.133,p.z);dummy.updateMatrix();live.path.setMatrixAt(i,dummy.matrix);});live.path.instanceMatrix.needsUpdate=true;
    const loads=game.run?game.run.loads.slice(game.run.index):game.loaded,cargo=k.carry,trolley=game.equipped.has('trolley')&&loads.length>0;
    const signature='live:'+JSON.stringify([cargo?.kind,cargo?.orderId,cargo?.recipe,loads.map(l=>l.orderId+':'+l.part)]);
    w.carrier.visible=!this.focus&&!trolley&&(!!cargo||loads.length>0);
    if(w.carrier.userData.signature!==signature){clearDynamic(w.carrier);w.carrier.userData.signature=signature;
      if(cargo?.kind==='supplies'){const crate=stockCrate(w.palette);crate.scale.setScalar(.62);crate.position.y=-.05;mergeStatic(crate);w.carrier.add(crate);}
      else if(cargo||loads.length){const load=loads[0],t=game.tables[cargo?.tableId??load?.tableId],dish=serviceFood(w.palette,cargo?.recipe??load.recipe,{pickup:t?.pickup,side:t?.side,caption:t?'#'+t.orderId:'',identity:tableIdentity(t)});dish.scale.setScalar(.43);mergeStatic(dish);w.carrier.add(dish);carryTray(w.carrier,w.palette);}
    }
    if(trolley){w.trolley.visible=!this.focus;w.trolley.position.set(k.position.x+.40,.1,k.position.z+.2);w.trolleyLoads.visible=true;
      if(w.trolleyLoads.userData.signature!==signature){clearDynamic(w.trolleyLoads);w.trolleyLoads.userData.signature=signature;loads.forEach((l,i)=>{const t=game.tables[l.tableId],dish=serviceFood(w.palette,l.recipe,{pickup:t.pickup,side:t.side,caption:'#'+l.orderId,identity:tableIdentity(t)});dish.scale.setScalar(.46);dish.position.x=(i-.5)*.55;mergeStatic(dish);w.trolleyLoads.add(dish);});}
    }
    const holdingSignature=k.counter.map(c=>c.kind+':'+c.orderId).join('|');
    if(live.holding.userData.signature!==holdingSignature){clearDynamic(live.holding);live.holding.userData.signature=holdingSignature;k.counter.forEach((c,i)=>{const dish=c.kind==='supplies'?stockCrate(w.palette):serviceFood(w.palette,c.recipe,{caption:'#'+c.orderId,identity:tableIdentity(game.tables[c.tableId])});dish.scale.setScalar(.45);dish.position.set(...w.plan.holding[i]);mergeStatic(dish);live.holding.add(dish);});}
    const plateSignature=k.clean+':'+k.dirty;
    if(live.plates.userData.signature!==plateSignature){clearDynamic(live.plates);live.plates.userData.signature=plateSignature;for(const [count,point,mat]of [[k.clean,w.plan.cleanDishes,w.palette.white],[k.dirty,w.plan.dirtyDishes,w.palette.stoneDark]])for(let i=0;i<count;i++)cyl(live.plates,mat,point[0],point[1]+i*.025,point[2],.13,.13,.022,14);mergeStatic(live.plates);}
  }
  menuWeatherMask(){
    const p=this.world.plan,v=p.venue,points=[];
    for(const x of [-v.width/2-.15,v.width/2+.15])for(const [y,z]of [[.13,-4.7-v.extraDepth],[.13,4.7],[3.45,-4.7-v.extraDepth]]){const q=new THREE.Vector3(x,y,z).project(this.camera);points.push({x:(q.x*.5+.5)*this.container.clientWidth,y:(.5-q.y*.5)*this.container.clientHeight});}
    points.sort((a,b)=>a.x-b.x||a.y-b.y);const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),half=ps=>{const h=[];for(const p of ps){while(h.length>1&&cross(h.at(-2),h.at(-1),p)<=0)h.pop();h.push(p);}return h;},a=half(points),b=half([...points].reverse());a.pop();b.pop();return [...a,...b];
  }
  updateMenu(time,dt,game){
    const w=this.world;this.menuElapsed=(this.menuElapsed||0)+Math.max(0,dt||0);this.motionClock=(this.motionClock||0)+(game?.paused?0:Math.max(0,dt||0));
    if(this.menuDirty&&this.openingWeather)this.openingWeather.setMask(this.menuWeatherMask());
    this.openingWeather?.visible(true);this.openingWeather?.set(w.atmosphere);this.openingWeather?.draw(this.motionClock,this.container.clientWidth,this.container.clientHeight,this.reduced);
    if(!this.menuPrimed){
      w.canopy.visible=false;w.chef.root.visible=false;w.carrier.visible=false;w.processing.visible=false;w.steamPuffs.forEach(o=>o.visible=false);
      for(const t of w.tables){t.guest.root.visible=false;if(t.friend)t.friend.root.visible=false;t.foodRoot.visible=false;t.readyRoot.visible=false;}
      for(const e of w.effects)e.mesh.visible=false;
      this.menuPrimed=true;this.menuDirty=true;
    }
    const flying=!!this.cameraFlight,animate=w.atmosphere==='evening'&&w.atmosphereRain.lightProgress<1&&!this.reduced;
    if(!this.menuDirty&&!flying&&(!animate||this.menuElapsed<1/30))return;
    if(flying&&!game?.paused){const f=this.cameraFlight;f.elapsed+=this.menuElapsed;const t=this.reduced?1:Math.min(1,f.elapsed/f.duration),pose=cameraTravel(f,this.cameraGoal,t);this.camera.position.copy(pose.position);this.cameraTarget.copy(pose.target);this.camera.up.copy(pose.up);for(const k of ['left','right','top','bottom'])this.camera[k]=pose[k];if(t===1)this.cameraFlight=null;this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();}
    if(!this.cameraFlight&&this.cameraGoal){this.camera.position.copy(this.cameraGoal.position);this.camera.lookAt(this.cameraGoal.target);this.camera.updateMatrixWorld();}
    if(!game?.paused){w.atmosphereRain?.update(this.motionClock,this.reduced);w.neighbourhood?.update(this.motionClock,{reduced:this.reduced,menu:true});}
    if(this.renderer.shadowMap){this.renderer.shadowMap.autoUpdate=false;if(this.menuDirty)this.renderer.shadowMap.needsUpdate=true;}
    this.renderer.render(this.scene,this.camera);this.menuElapsed=0;this.menuDirty=false;
  }
  update(time,dt,game,frameDt=dt){
    this.navigationBlocked=!game||game.paused||game.focused||game.closingService||game.state!=='playing';
    if(this.navigationBlocked)this.clearOverviewGesture?.();
    this.followKitchen=game?.kitchen||null;if(!this.navigationBlocked)this.followChef(game?.kitchen);
    if(this.fallback||this.contextLost||!this.world)return;this.openingWeather?.visible(this.menu&&!this.takeover&&!this.focus);if(this.takeover){if(this.renderer.shadowMap)this.renderer.shadowMap.autoUpdate=true;this.takeover.update();this.renderer.render(this.scene,this.camera);return;}this.settings||={};this.quality||=renderQuality();this.frameBudget||=new FrameBudget();const w=this.world;
    if(this.menu&&!this.focus){this.updateMenu(time,dt,game);return;}
    if(this.renderer.shadowMap)this.renderer.shadowMap.autoUpdate=true;
    if(this.cameraGoal&&!game?.paused&&!this.station?.dragging&&(this.cameraFlight||!this.menu&&!this.stationReady())){
      this.projectionRevision=(this.projectionRevision||0)+1;const f=this.cameraFlight;
      if(f){f.elapsed+=dt;const progress=this.reduced?1:Math.min(1,f.elapsed/f.duration),pose=cameraTravel(f,this.cameraGoal,progress);this.camera.position.copy(pose.position);this.cameraTarget.copy(pose.target);this.camera.up.copy(pose.up);for(const k of ['left','right','top','bottom'])this.camera[k]=pose[k];if(progress===1)this.cameraFlight=null;}
      else{const alpha=this.reduced?1:1-Math.exp(-dt*7);this.camera.position.lerp(this.cameraGoal.position,alpha);this.cameraTarget.lerp(this.cameraGoal.target,alpha);this.camera.up.lerp(this.cameraGoal.up,alpha).normalize();for(const k of ['left','right','top','bottom'])this.camera[k]=THREE.MathUtils.lerp(this.camera[k],this.cameraGoal[k],alpha);}
      this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    }
    this.motionClock=(this.motionClock||0)+(game?.paused?0:dt);time=this.motionClock;

    if(!game?.paused){this.station?.update(dt,this.reduced);if(!this.story){this.world.atmosphereRain?.update(time,this.reduced);w.neighbourhood?.update(time,{reduced:this.reduced});}}w.canopy.visible=(!game?.kitchen||this.menu)&&!this.focus;w.chef.root.visible=!this.focus||this.menu;
    for(const t of w.tables){const state=game?.tables[t.id];if(state&&state.status!=='empty'&&t.customerId!==state.guest)setTableCustomer(w,t.id,state.guest);t.guest.root.visible=this.menu||!!state&&state.status!=='empty';const personality=personalityFor(t.customerId),wave=this.reduced?0:Math.sin(time*(personality.id==='enthusiastic'?2:1.2)+t.id*2)*.025;t.guest.head.rotation.z=wave;t.guest.head.rotation.x=t.guest.holdingTablet?.16:0;t.guest.arms[1].rotation.x=-.85+wave*(personality.id==='enthusiastic'?9:2);t.guest.arms[1].rotation.z=.14;if(!this.reduced&&personality.id==='curious'&&!t.guest.holdingTablet)t.guest.head.rotation.y=Math.sin(time*.6)*.10;else t.guest.head.rotation.y=0;updateCharacterFace(t.guest,time,{reduced:this.reduced||game?.paused,speaking:t.speaking});t.guest.mouth.scale.y=t.speaking&&!this.reduced?.35+Math.abs(Math.sin(time*11))*.45:.42;
      if(!t.guest.holdingCue)t.guest.arms[0].rotation.set(-.85,0,-.14);
      const protectedTime=!!this.focus||!!game?.focused||!!t.guest.holdingTablet||!!t.guest.holdingCue||!!t.guestReaction||t.reaction!==undefined;
      const behaviour=customerBehaviour(state,time,{id:t.customerId,reduced:this.reduced,protectedTime});
      t.guest.head.rotation.x+=behaviour.headX;t.guest.head.rotation.y+=behaviour.headY;t.guest.head.rotation.z+=behaviour.headZ;t.guest.arms[1].rotation.x+=behaviour.armX;t.guest.arms[1].rotation.z+=behaviour.armZ;t.guest.arms[0].rotation.x+=behaviour.leftX;t.guest.arms[0].rotation.z+=behaviour.leftZ;customerBehaviourProps(t.guest,w.palette,behaviour.kind);if(behaviour.kind==='chat'&&!t.speaking)t.guest.mouth.scale.y=.42+Math.abs(Math.sin(time*7))*.14;
      if(t.reaction!==undefined){t.reaction+=game?.paused?0:dt;t.guest.head.rotation.x=this.reduced?0:Math.sin(t.reaction*9)*.15*(1-t.reaction/1.2);t.guest.arms[1].rotation.x=-1.1;if(t.reaction>1.2)delete t.reaction;}
      if(t.guestReaction){const r=t.guestReaction;r.elapsed+=game?.paused?0:dt;const pose=guestPose(r.kind,r.elapsed/r.duration,{reduced:this.reduced});t.guest.head.rotation.x+=pose.headX;t.guest.head.rotation.z+=pose.headZ;if(!t.guest.holdingTablet){t.guest.arms[1].rotation.x+=pose.armX;t.guest.arms[1].rotation.z=.14+pose.armZ;}if(!t.speaking)t.guest.mouth.scale.y=pose.mouth;if(r.elapsed>=r.duration){delete t.guestReaction;t.guest.arms[1].rotation.z=.14;if(t.giftCard)t.giftCard.visible=false;}}
      if(state?.partySize===2&&!t.friend){t.friend=createCustomer(w.palette,state.partyGuests[1],{walkable:true});t.friend.root.position.set(t.x+.95,.5,t.z);t.friend.root.rotation.y=-Math.PI/2;w.root.add(t.friend.root);}if(t.friend){t.friend.root.visible=!!state&&state.partySize===2&&state.status!=='empty';updateCharacterFace(t.friend,time,{reduced:this.reduced||game?.paused});}
      if(w.neighbourhood){
        if(t.arrivalOrder!==state?.orderId){t.arrivalOrder=state?.orderId;t.arrivalElapsed=0;}
        const protectedArrival=!!this.focus||!!game?.focused||!!state?.stockReserved||state?.status!=='waiting';
        if(protectedArrival||this.reduced)t.arrivalElapsed=4.6;else if(!game?.paused)t.arrivalElapsed=Math.min(4.6,(t.arrivalElapsed||0)+dt);
        const pose=guestArrivalPose(t,state,w.neighbourhood.layout,t.arrivalElapsed||0,{reduced:this.reduced,protectedTime:protectedArrival});
        t.arrivalStage=pose.stage;t.guest.root.position.set(pose.x,pose.y,pose.z);t.guest.root.rotation.y=pose.angle;customerWalkPose(t.guest,time,{...pose,reduced:this.reduced});
        if(pose.stage==='menu'){t.guest.head.rotation.x=.13;t.guest.head.rotation.y=-.10;}
        if(t.friend?.root.visible){if(pose.stage!=='settled'){t.friend.root.position.set(pose.x+.42,pose.y,pose.z+.12);t.friend.root.rotation.y=pose.angle;customerWalkPose(t.friend,time+.28,{...pose,reduced:this.reduced});}else{t.friend.root.position.set(t.x+.95,.5,t.z);t.friend.root.rotation.y=-Math.PI/2;customerWalkPose(t.friend,time,{reduced:this.reduced});}}
      }
      const recipe=state?.recipe??t.id%RECIPES.length,party=state?.partySize||1,signature=(state?.status||'preview')+':' +(state?.partyRecipes||[recipe]).join(',')+':'+(state?.side||false)+':'+(state?.orderId||0)+':'+state?.step+':'+(state?.dining&&diningStage(state.dining).stage!=='eat'?'eaten':'full')+':'+(state?.deliveredParts||[]).join(',')+':'+(state?.transitParts||[]).join(',')+(game?.kitchen?':'+game.loaded.filter(l=>l.orderId===state?.orderId).map(l=>l.part).join(','):'');
      if(t.dishSignature!==signature){
        for(const group of [t.foodRoot,t.readyFood]){clearDynamic(group);for(let i=0;i<party;i++){if(group===t.readyFood&&state?.status!=='ready')continue;if(state&&group===t.readyFood&&(state.deliveredParts?.includes(i)||state.transitParts?.includes(i)||game?.kitchen&&game.loaded.some(l=>l.orderId===state.orderId&&l.part===i)))continue;if(state&&group===t.foodRoot&&!state.deliveredParts?.includes(i))continue;const dish=group===t.foodRoot&&state?.dining&&diningStage(state.dining).stage!=='eat'&&!state.pickup?createVessel(w.palette,RECIPES[state?.partyRecipes?.[i]??recipe].container):serviceFood(w.palette,state?.partyRecipes?.[i]??recipe,{side:state?.side,pickup:state?.pickup&&state.step===state.plan.length,caption:state?'#'+state.orderId:'',identity:state?tableIdentity(state):null});dish.position.x=party>1?(i-.5)*.65:0;dish.scale.setScalar(party>1?.62:1);group.add(dish);}mergeStatic(group);}
        t.dishIndex=recipe;t.dishSignature=signature;
      }
      t.readyRoot.visible=!!state&&state.status==='ready'&&!this.focus&&!this.menu;
      t.foodRoot.visible=this.menu||!!state&&state.status!=='empty'&&(state.deliveredParts?.length||0)>0;
      if(t.serving!==undefined){t.serving=Math.min(1,t.serving+(this.reduced?1:game?.paused?0:dt/.42));const progress=t.serving,ease=progress*progress*(3-2*progress);
        t.foodRoot.position.lerpVectors(t.servingFrom||t.readyRoot.position,new THREE.Vector3(t.x,1.10,t.z),ease);t.foodRoot.scale.setScalar(.43+.32*ease);t.foodRoot.position.y+=Math.sin(progress*Math.PI)*.10;t.foodRoot.rotation.z=Math.sin(progress*Math.PI)*.025;
        if(progress>=1){delete t.serving;delete t.servingFrom;t.foodRoot.rotation.z=0;}
      }else{t.foodRoot.position.set(t.x,1.10,t.z);t.foodRoot.rotation.z=0;t.foodRoot.scale.setScalar(.75);}
      const dining=diningStage(state?.dining),eating=!!state?.dining&&dining?.stage==='eat'&&!state.pickup&&!this.menu;
      for(const guest of [t.guest,t.friend].filter(Boolean)){
        if(eating)ensureCustomerUtensil(guest,w.palette);if(guest.utensil)guest.utensil.visible=eating;
        if(eating){const pose=eatingPose(state.dining.elapsed,{reduced:this.reduced});guest.arms[1].rotation.x=pose.armX;guest.arms[1].rotation.z=pose.armZ;guest.head.rotation.x=pose.headX;guest.mouth.scale.y=pose.mouth;if(guest===t.friend)guest.head.rotation.y=0;}
        else if(guest===t.friend){const pose=customerBehaviour(state,time,{id:t.customerId,reduced:this.reduced,protectedTime:!!this.focus||!!game?.focused});guest.arms[1].rotation.set(-.85+pose.armX,0,.14+pose.armZ);guest.head.rotation.set(pose.headX,-pose.headY,pose.headZ);guest.mouth.scale.y=pose.kind==='chat'&&!game?.paused ? .42+Math.abs(Math.sin(time*7))*.14 : .42;}
        guest.root.scale.setScalar(state?.status==='leaving'&&!this.menu?(state.dining?(dining.stage==='depart'?1-dining.progress:1):Math.min(1,state.cooldown/1.3)):1);
      }
    }
    const jobSignature=(game?.jobs||[]).filter(j=>j.slot!=null).map(j=>j.id+':'+j.slot).join(',');
    if(w.processing.userData.signature!==jobSignature){clearDynamic(w.processing);w.processing.userData.signature=jobSignature;for(const j of (game?.jobs||[]).filter(j=>j.slot!=null)){const dish=serviceFood(w.palette,j.recipe,{caption:'#'+j.orderId+(game.tables[j.tableId].partySize===2?(j.part?' B':' A'):''),identity:tableIdentity(game.tables[j.tableId])});const pos=w.plan.cookingSlots[j.slot];dish.position.set(...pos);dish.scale.setScalar(.65);mergeStatic(dish);w.processing.add(dish);}}
    w.processing.visible=!this.focus&&!this.menu;w.prepStatic.visible=this.focus?.setting!=='recipe'&&!(game?.jobs||[]).some(j=>j.slot===0);
    const run=game?.run,load=run&&!run.returning?run.loads[run.index]:null,moving=!game?.paused&&!game?.focused;
    if(!game?.kitchen){
    if(run&&game.equipped.has('trolley')){w.trolley.visible=!this.focus;const dest=load?w.tables[load.tableId]:null,origin=new THREE.Vector3(...w.plan.trolleyHome),target=dest?new THREE.Vector3(...[w.plan.tableApproaches[dest.id]?.[0]??w.plan.pickupApproach[0],.1,w.plan.tableApproaches[dest.id]?.[1]??w.plan.pickupApproach[1]]):origin;if(moving)w.trolley.position.lerp(target,this.reduced?1:Math.min(1,dt*4));const signature=run.loads.slice(run.index).map(l=>l.orderId+':'+l.part).join(',');if(w.trolleyLoads.userData.signature!==signature){clearDynamic(w.trolleyLoads);w.trolleyLoads.userData.signature=signature;run.loads.slice(run.index).forEach((l,i)=>{const state=game.tables[l.tableId],dish=serviceFood(w.palette,l.recipe,{pickup:state.pickup,side:state.side,caption:'#'+state.orderId+(state.partySize===2?(l.part?' B':' A'):''),identity:tableIdentity(state)});dish.scale.setScalar(.5);dish.position.x=(i-.5)*.55;mergeStatic(dish);w.trolleyLoads.add(dish);});}}else{w.trolley.position.set(...w.plan.trolleyHome);w.trolleyLoads.visible=false;}w.trolleyLoads.visible=!!run;
    w.carrier.visible=!!load&&!game?.equipped.has('trolley')&&!this.focus;if(load&&w.carrier.userData.signature!==load.orderId+':'+load.part){clearDynamic(w.carrier);const state=game.tables[load.tableId],dish=serviceFood(w.palette,load.recipe,{pickup:state.pickup,side:state.side,caption:'#'+state.orderId,identity:tableIdentity(state)});dish.scale.setScalar(.42);mergeStatic(dish);w.carrier.add(dish);carryTray(w.carrier,w.palette);w.carrier.userData.signature=load.orderId+':'+load.part;}
    if(load&&!game.equipped.has('trolley')&&moving){const target=w.tables[load.tableId];w.chef.root.position.lerp(new THREE.Vector3(target.x,.13,target.z+.7),this.reduced?1:Math.min(1,dt*5));}
    }
    const hotJobs=(game?.jobs||[]).filter(j=>j.slot!=null&&['sunshine','noodles','pasta'].includes(RECIPES[j.recipe]?.id)),steamOrigins=w.plan.cookingSlots.map(([x,y,z])=>[x,y+.5,z]);
    w.steamPuffs.forEach((m,i)=>{m.visible=!!hotJobs.length&&!this.menu&&!this.reduced&&!this.focus&&!game?.paused;if(m.visible){const job=hotJobs[i%hotJobs.length],origin=steamOrigins[job.slot]||steamOrigins[1],phase=(time*.42+i/9)%1;m.position.set(origin[0]+Math.sin(i*2.2+time*.6)*.12,origin[1]+phase*.55,origin[2]+Math.cos(i*2.2)*.10);m.scale.setScalar((.45+phase)*(1-phase*.7));}});
    let walking=false;if(w.waypoints.length&&!game?.paused&&!game?.focused&&!run){const target=w.waypoints[0],delta=target.clone().sub(w.chef.root.position),distance=delta.length();if(distance<.08)w.waypoints.shift();else{walking=true;w.chef.root.position.addScaledVector(delta.normalize(),Math.min(distance,dt*3.6));w.chef.root.rotation.y=Math.atan2(delta.x,delta.z);}}
    if(!walking)w.chef.root.rotation.y=THREE.MathUtils.lerp(w.chef.root.rotation.y,0,.06);
    w.chef.body.position.y=this.reduced?0:Math.sin(time*(walking?14:2))*(walking?.035:.009);w.chef.arms[0].rotation.x=-.5+(walking?Math.sin(time*14)*.3:Math.sin(time*2)*.06);
    if(game?.kitchen)this.updateKitchen(time,dt,game);else updateChef(w.chef,time,{moving:walking,carrying:!!load,reduced:this.reduced||game?.paused||game?.focused});
    for(let i=w.effects.length-1;i>=0;i--){const e=w.effects[i];e.life+=game?.paused?0:dt;if(e.life<e.delay)continue;const t=e.life-e.delay;e.mesh.position.y+=(game?.paused?0:dt)*1.8;e.mesh.rotation.y+=(game?.paused?0:dt)*3;e.mesh.scale.setScalar(Math.max(0,1-t*.8));if(t>1.1){e.mesh.removeFromParent();w.effects.splice(i,1);}}
    if(w.characterContacts){const d=w.contactDummy??=new THREE.Object3D();let n=0;for(const guest of [w.chef,...w.tables.flatMap(t=>[t.guest,t.friend]).filter(Boolean)]){if(!guest.root.visible)continue;d.position.set(guest.root.position.x,guest.root.position.z>4.5?-.035:.096,guest.root.position.z);d.rotation.set(-Math.PI/2,0,0);const scale=guest.root.scale.x;d.scale.set(.64*scale,.44*scale,1);d.updateMatrix();w.characterContacts.setMatrixAt(n++,d.matrix);}w.characterContacts.count=n;w.characterContacts.instanceMatrix.needsUpdate=true;}
    this.renderer.render(this.scene,this.camera);
    if(this.frameBudget.add(frameDt)&&!['high','lite'].includes(this.settings.quality)&&this.quality.tier!=='lite'){this.quality=renderQuality('lite',{pixelRatio:window.devicePixelRatio||1});this.renderer.setPixelRatio(this.quality.pixelRatio);this.renderer.shadowMap.enabled=false;this.scene.environment=this.studioMap;this.resize();}
  }
}
