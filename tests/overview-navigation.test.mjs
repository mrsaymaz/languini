import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {overviewCamera} from '../src/restaurant-camera.mjs';import {MIN_ZOOM,MAX_ZOOM,FOLLOW_ZOOM,cleanOverview,navigateOverview,panOverview,followOverview,overviewEvents,edgeMarkers} from '../src/overview-navigation.mjs';
import {BistroGame} from '../src/core.mjs';import {seeded} from './helpers.mjs';import {RestaurantView} from '../src/restaurant.mjs';
const unit=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)))[0].units[0];
const create=()=>{const g=new BistroGame({grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'},unit.tasks,{liveKitchen:true,rng:seeded()});g.start();return g;};
test('zoom limits and pan clamps survive extreme input and return exactly to the default framing',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const [w,h]of [[320,480],[390,844],[844,390],[1024,600],[1366,768],[2560,1080]]){const base=overviewCamera(w,h,{liveKitchen:true,arena});assert.equal(cleanOverview({zoom:99}).zoom,MAX_ZOOM);assert.equal(cleanOverview({zoom:-99}).zoom,MIN_ZOOM);
 for(const zoom of [.9,1,1.1,1.25]){const state=panOverview(base,{zoom},1e9,-1e9,w,h),limit=Math.max(0,1-1/zoom)/2;assert.ok(Math.abs(state.x)<=limit&&Math.abs(state.y)<=limit);const f=navigateOverview(base,state);assert.ok(Math.abs((base.top-base.bottom)/(f.top-f.bottom)-zoom)<1e-12);assert.deepEqual(f.position.clone().sub(f.target).toArray().map(x=>+x.toFixed(10)),base.position.clone().sub(base.target).toArray().map(x=>+x.toFixed(10)));}
 const reset=navigateOverview(base,{zoom:1,x:1,y:1});assert.deepEqual(reset.position,base.position);assert.deepEqual(reset.target,base.target);}
});
test('zoom keeps the room centre fixed while pan follows the drag direction',()=>{const w=390,h=844,base=overviewCamera(w,h,{liveKitchen:true}),b=base.overviewBounds;const right=new THREE.Vector3().crossVectors(base.up,base.position.clone().sub(base.target)).normalize(),up=new THREE.Vector3().crossVectors(base.position.clone().sub(base.target),right).normalize();const centre=base.target.clone().addScaledVector(right,b.centerX).addScaledVector(up,b.centerY);function project(f){const c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateMatrixWorld();return centre.clone().project(c);}
 const before=project(base),zoomed=project(navigateOverview(base,{zoom:1.25}));assert.ok(before.distanceTo(zoomed)<1e-12);const p=project(navigateOverview(base,panOverview(base,{zoom:1.25},10,10,w,h)));assert.ok(p.x>zoomed.x&&p.y<zoomed.y);
});
test('camera controls cannot change story, setup, protected tasks, pause or arrival flights',()=>{const v=Object.assign(Object.create(RestaurantView.prototype),{liveKitchen:true,menu:false,overview:cleanOverview(),resize(){this.resized=true;}});for(const key of ['menu','focus','takeover','story','navigationBlocked','contextLost','cameraFlight']){v[key]=true;assert.equal(v.zoomOverview(.1),false,key);assert.equal(v.resized,undefined);v[key]=false;}assert.equal(v.zoomOverview(.1),true);assert.equal(v.overview.zoom,1.1);});
test('activity markers are read-only, follow order destinations, and disappear during protected time',()=>{const g=create(),snapshot=JSON.stringify(g.tables);const events=overviewEvents(g);assert.ok(events.some(e=>e.kind==='guest'));assert.ok(events.every(e=>Number.isFinite(e.point.x+e.point.z)));assert.equal(JSON.stringify(g.tables),snapshot);for(const key of ['paused','closingService']){g[key]=true;assert.deepEqual(overviewEvents(g),[]);g[key]=false;}g.active={};assert.deepEqual(overviewEvents(g),[]);g.active=null;
 const t=g.tables[0];Object.assign(t,{status:'ready',plan:[],step:0,readyParts:[0],cooked:true});assert.equal(overviewEvents(g)[0].kind,'meal');assert.deepEqual(overviewEvents(g)[0].point,g.kitchen.point('pass'));t.pickup=true;assert.equal(overviewEvents(g)[0].icon,'bag');t.status='empty';assert.ok(!overviewEvents(g).some(e=>e.id==='order:'+t.orderId));g.stock=0;assert.ok(overviewEvents(g).some(e=>e.kind==='supplies'));
});
test('off-screen marks aggregate counts, retain urgency and clear as soon as their source is visible',()=>{const rect={left:32,right:358,top:200,bottom:500},project=p=>p;const events=[{id:'1',kind:'guest',point:{x:400,y:160},urgent:false},{id:'2',kind:'guest',point:{x:500,y:300},urgent:true},{id:'3',kind:'meal',point:{x:600,y:200}}];let m=edgeMarkers(events,project,rect);assert.equal(m.length,2);assert.equal(m[0].count,2);assert.equal(m[0].urgent,true);assert.equal(m[0].id,'2');for(const p of m){assert.ok(p.x>=rect.left&&p.x<=rect.right&&p.y>=rect.top&&p.y<=rect.bottom);assert.ok(Number.isFinite(p.angle));}assert.ok(Math.hypot(m[0].x-m[1].x,m[0].y-m[1].y)>=54);assert.deepEqual(edgeMarkers(events,()=>({x:200,y:300}),rect),[]);assert.deepEqual(edgeMarkers(events,()=>null,rect),[]);assert.deepEqual(edgeMarkers(events,()=>({x:200,y:180}),rect,{visibleRect:{...rect,top:160}}),[],'A visible source needs no mark just because a button centre needs extra padding');assert.equal(edgeMarkers(events,()=>({x:200,y:300}),rect,{occlusions:[{left:180,right:220,top:280,bottom:320}]}).length,2);});

test('real pointer handlers separate taps, drags, pinches, cancelled and distant releases',async()=>{
 const {Element}=await import('./dom-double.mjs'),oldWindow=globalThis.window;globalThis.window={addEventListener(){}};
 try{const canvas=new Element('canvas'),container={clientWidth:390,clientHeight:844,getBoundingClientRect:()=>({left:0,top:0,width:390,height:844})};let walks=0;
 const v=Object.assign(Object.create(RestaurantView.prototype),{container,liveKitchen:true,menu:false,overview:cleanOverview({zoom:MAX_ZOOM}),reduced:true,camera:new THREE.OrthographicCamera(),renderer:{setSize(){}},pointer:new THREE.Vector2(),raycaster:new THREE.Raycaster(),hitMeshes:[],onFloor(){walks++;}});v.resize();v.installOverviewGestures(canvas);
 const send=(type,id,x=100,y=300)=>canvas.dispatch(type,{pointerId:id,clientX:x,clientY:y,button:0});
 send('pointerdown',1);send('pointerup',1);assert.equal(walks,1);
 send('pointerdown',1);send('pointerup',1,200,300);assert.equal(walks,1,'A distant release without a move event is not a tap');
 send('pointerdown',1);send('pointermove',1,150,330);send('pointerup',1,150,330);assert.equal(walks,1);assert.ok(v.overview.x||v.overview.y);
 send('pointerdown',1,150,380);send('pointerdown',2,230,380);send('pointermove',2,300,380);send('pointerup',1,150,380);send('pointerup',2,300,380);assert.equal(walks,1);assert.equal(v.overview.zoom,MAX_ZOOM);
 send('pointerdown',1);send('pointercancel',1);send('pointerup',1);assert.equal(walks,1);
 send('pointerdown',1);send('lostpointercapture',1);send('pointerup',1);assert.equal(walks,1);
 }finally{globalThis.window=oldWindow;}
});

test('phones follow the chef at the closer zoom, centred in the usable area and clamped to the room',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const [w,h]of [[320,480],[390,844],[430,850]]){
  const base=overviewCamera(w,h,{liveKitchen:true,arena}),b=base.overviewBounds,dir=base.position.clone().sub(base.target).normalize(),right=new THREE.Vector3().crossVectors(base.up,dir).normalize(),up=new THREE.Vector3().crossVectors(dir,right).normalize();
  const centre=base.target.clone().addScaledVector(right,b.centerX).addScaledVector(up,b.centerY),f=navigateOverview(base,followOverview(base,centre));
  const c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateMatrixWorld();
  const start=centre.clone().project(c);
  assert.equal(followOverview(base,centre).zoom,FOLLOW_ZOOM);assert.ok(Math.abs(followOverview(base,centre).x)<1e-9&&Math.abs(followOverview(base,centre).y)<1e-9,'The room centre needs no pan');
  const near=centre.clone().addScaledVector(right,b.spanX*.05),state=followOverview(base,near),g=navigateOverview(base,state),d=new THREE.OrthographicCamera(g.left,g.right,g.top,g.bottom,.1,90);d.position.copy(g.position);d.lookAt(g.target);d.updateMatrixWorld();
  assert.ok(near.clone().project(d).distanceTo(start)<1e-9,'A point inside the clamp lands where the room centre was');
  const far=followOverview(base,centre.clone().addScaledVector(right,b.spanX*5)),limit=(1-1/FOLLOW_ZOOM)/2;assert.ok(Math.abs(far.x-limit)<1e-12,'A far point is clamped to the room edge');
 }
});
test('following stops for manual camera use, pauses for a revealed mark and resumes on Reset or a new walk',()=>{
 const g=create(),k=g.kitchen,container={clientWidth:390,clientHeight:844};
 const v=Object.assign(Object.create(RestaurantView.prototype),{container,liveKitchen:true,menu:false,overview:cleanOverview(),reduced:true,camera:new THREE.OrthographicCamera(),renderer:{setSize(){}},cameraTarget:new THREE.Vector3()});v.resize();
 v.followChef(k);assert.equal(v.overview.zoom,FOLLOW_ZOOM);assert.equal(v.overviewChanged(),false,'Following is the phone default, so Reset stays hidden');
 const followed=JSON.stringify(v.overview);k.position.x+=1.5;v.followChef(k);assert.notEqual(JSON.stringify(v.overview),followed,'The view moves with the chef');
 v.zoomOverview(-.1);const manual=JSON.stringify(v.overview);k.position.x-=1;v.followChef(k);assert.equal(JSON.stringify(v.overview),manual,'Manual zoom stops following');assert.equal(v.overviewChanged(),true);
 v.resetOverview();assert.equal(v.overviewChanged(),false);v.followChef(k);assert.equal(v.overview.zoom,FOLLOW_ZOOM);
 v.followKitchen=k;v.projectKitchenPoint=()=>({x:600,y:900});v.revealOverviewPoint({x:0,z:0},{left:0,right:390,top:0,bottom:844});assert.equal(v.overviewChanged(),true);const revealed=JSON.stringify(v.overview);
 v.followChef(k);assert.equal(JSON.stringify(v.overview),revealed,'A revealed mark stays visible while the chef is idle');
 k.route=[{x:k.position.x+.5,z:k.position.z}];v.followChef(k);assert.notEqual(JSON.stringify(v.overview),revealed,'A new walk resumes following');assert.equal(v.overviewChanged(),false);
 container.clientWidth=1366;container.clientHeight=768;v.resize();v.resetOverview();v.followChef(k);assert.equal(v.overview.zoom,1,'Desktop keeps the full-room view');
});
