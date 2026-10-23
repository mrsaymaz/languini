import {sceneBudget} from './scene-budget.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
function sameObject(actual,expected,message){assert.ok(actual===expected,message||'Scene object identity');}
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {createRestaurant,setTableCustomer,TABLE_LAYOUTS,FOCUS_POINTS,CAMERA_STYLES,cameraFrame} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {CUSTOMER_PROFILES} from '../src/customer-profiles.mjs';
import {TICKET_RAIL,CHECKOUT} from '../src/fixtures.mjs';
import {ARENAS,TEAMS,RECIPES} from '../src/core.mjs';

test('all arena/team combinations build finite complete 3D scenes',()=>{
  for(const a of ARENAS)for(const t of TEAMS){const world=createRestaurant({arena:a.id,team:t.id});assert.equal(world.tables.filter(t=>!t.pickup).length,a.tables);assert.equal(world.tables.filter(t=>t.pickup).length,1);let meshes=0,instances=0;const mergedColors=new Set();world.root.traverse(o=>{if(!o.isMesh)return;meshes++;if(o.isInstancedMesh)instances+=o.count;const attr=o.geometry.attributes.position;for(let i=0;i<attr.count;i++){assert.ok(Number.isFinite(attr.getX(i)));assert.ok(Number.isFinite(attr.getY(i)));assert.ok(Number.isFinite(attr.getZ(i)));}if(o.userData.merged)mergedColors.add(o.material.color.getHexString());});assert.equal(instances,121,'Floor tiles must survive static batching');assert.ok(sceneBudget(world).room.meshes<320);assert.ok(sceneBudget(world).exterior.meshes<=50);assert.ok(sceneBudget(world).walking.meshes<=world.tables.length*4);assert.ok(mergedColors.has('a4b6ae'),'Metal kitchen props must survive batching');assert.ok(mergedColors.has('679365'),'Plants must survive batching');const bounds=new THREE.Box3().setFromObject(world.environment);assert.ok(bounds.max.y<5);assert.ok(bounds.min.x>=-6.0-world.venue.extraWidth/2&&bounds.max.x<=6.0+world.venue.extraWidth/2);}
});
test('table markers remain on screen at desktop and phone aspect ratios',()=>{
  for(const [width,height]of [[1440,900],[1280,720],[393,852],[390,844],[360,740],[844,390]])for(const a of ARENAS){const f=cameraFrame(width,height,{arena:a.id}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();for(const [x,z]of TABLE_LAYOUTS[a.id]){const p=new THREE.Vector3(x,2.15,z).project(camera);const screenX=(p.x*.5+.5)*width,screenY=(-p.y*.5+.5)*height;assert.ok(screenX>50&&screenX<width-50,`${a.id} at ${width}x${height}: horizontal marker ${screenX}`);assert.ok(screenY>100&&screenY<height-100,`${a.id} at ${width}x${height}: vertical marker ${screenY}`);}}
});
test('static entrypoint includes all wired controls and local assets',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8'),app=await readFile(new URL('../src/app.mjs',import.meta.url),'utf8'),ui=await readFile(new URL('../src/task-ui.mjs',import.meta.url),'utf8'),interactions=await readFile(new URL('../src/interactions.mjs',import.meta.url),'utf8'),freshness=await readFile(new URL('../src/task-freshness.mjs',import.meta.url),'utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');const dynamic=new Set([...(app+ui+interactions+freshness).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));for(const m of (app+interactions).matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1])||dynamic.has(m[1]),`Missing wired control #${m[1]}`);assert.ok(html.includes('viewport-fit=cover'));assert.ok(!/https?:\/\//.test(html),'No remote asset dependencies');
  const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));for(const asset of ['style.css','tasks.css','stations.css','game.js'])assert.ok(html.includes(`./${asset}?v=${version}`),`Missing or stale ${asset}`);
});
test('close-ups keep each station above the phone task sheet',()=>{
  for(const [width,height]of [[393,740],[393,852],[360,640],[390,844],[1440,900]])for(const [setting,point]of Object.entries({...FOCUS_POINTS,conversation:[-2.6,1.5,-1.1],tablet:[1.2,1.5,-1.1]})){const f=cameraFrame(width,height,{focus:{point,setting}}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();const projected=new THREE.Vector3(...point).project(camera);const x=projected.x*.5+.5,y=-projected.y*.5+.5;assert.ok(width<760&&setting==='conversation'?x>.7&&x<.9:x>.15&&x<.65,`Focus x=${x}`);assert.ok(y>.15&&y<.53,`Focus y=${y}`);if(width<760)assert.ok(y<.37,'Keep station above the bottom sheet');}
});

test('each camera has a distinct angle and recipe view is aerial',()=>{
  const directions=Object.values(CAMERA_STYLES).map(s=>new THREE.Vector3(...s.offset).normalize()),direction=setting=>new THREE.Vector3(...CAMERA_STYLES[setting].offset).normalize();assert.equal(new Set(directions.map(v=>v.toArray().map(n=>n.toFixed(2)).join(','))).size,Object.keys(CAMERA_STYLES).length);assert.ok(direction('conversation').y<.3,'Guest view should be at face level');assert.ok(direction('recipe').y>.99,'Recipe view must look down onto the counter');assert.ok(direction('pickup').y>.99,'Pickup labels must be viewed from above');
});

test('physical stations animate, remain pickable and restore the shared restaurant',async()=>{
  const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),tasks=bank[0].units[0].tasks,world=createRestaurant();
  const context={conversation:{kind:'question'},tablet:{kind:'vocabulary'},delivery:{kind:'vocabulary'},recipe:{kind:'sentence'},ticket:{kind:'completion'},repair:{kind:'repair'}};
  for(const [setting,{kind}]of Object.entries(context))for(const recipe of setting==='recipe'?RECIPES.map((_,i)=>i):[0]){
    const task=tasks.find(t=>t.kind===kind),scene=new StationScene(world,{setting,task,recipe,options:task.options||[],order:[2,0,1]});
    if(setting==='recipe'){assert.equal(world.prepStatic.visible,false);assert.equal(world.canopy.visible,false);scene.addIngredient(0);scene.update(.3);assert.ok(scene.motions.length);scene.update(1);assert.equal(scene.trays[0].asset.visible,false);}
    if(setting==='tablet'){sameObject(scene.root.parent,world.tables[0].guest.body);assert.ok(world.tables[0].guest.holdingTablet);assert.ok(world.tables[0].guest.arms.every(a=>!a.visible));const material=scene.tabletScreen.material;scene.react('tablet',task.answer);assert.notEqual(scene.tabletScreen.material,material);assert.equal(scene.hits.length,task.options.length);}
    if(setting==='delivery'){scene.react('label',task.answer);scene.update(1.1);assert.ok(scene.lid.rotation.x<-1);}
    if(setting==='ticket'){assert.equal(world.ticketRail.papers.visible,false);scene.react('ticket-fill',task.answer);scene.react('clip',task.answer);scene.update(.33);assert.ok(Math.abs(scene.clipJaw.rotation.x)>.1);scene.update(1);assert.equal(scene.clipJaw.rotation.x,0);assert.equal(scene.paperPivot.rotation.z,0);}
    if(setting==='repair'){assert.equal(world.checkout.screen.visible,false);assert.equal(scene.repairStage,'find');assert.equal(scene.clearHit.userData.enabled,false);scene.react('repair-select');assert.equal(scene.clearHit.userData.enabled,true);scene.react('erase');scene.update(.25);assert.ok(scene.clearKey.position.z<.06);scene.update(1);assert.equal(scene.repairStage,'cleared');assert.ok(scene.hits.filter(h=>h.userData.stationAction.action==='repair-option').every(h=>h.userData.enabled));scene.react('repair',task.answer);scene.update(1);assert.equal(scene.repairStage,'complete');assert.equal(scene.printedReceipt.visible,true);assert.equal(scene.printedReceipt.scale.y,1);}
    world.root.updateMatrixWorld(true);for(const hit of scene.hits){const point=hit.getWorldPosition(new THREE.Vector3()),ray=new THREE.Raycaster(point.clone().add(new THREE.Vector3(0,10,0)),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(hit).length,'Touch volume must be raycastable');}
    scene.root.traverse(o=>{if(o.isMesh)for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));});
    scene.dispose();sameObject(scene.root.parent,null);assert.equal(world.prepStatic.visible,true);assert.equal(world.canopy.visible,true);assert.equal(world.ticketRail.papers.visible,true);assert.equal(world.checkout.screen.visible,true);assert.ok(world.tables[0].guest.arms.every(a=>a.visible));
  }
});

function focusedCamera(setting,point,width=393,height=740,angle=0){const f=cameraFrame(width,height,{focus:{setting,point:point.toArray(),angle}}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera;}
function visibleMeshes(root){const meshes=[];root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});return meshes;}
test('customer-held menu is unobstructed from behind the right shoulder at every table',()=>{
  const task={options:['teacher','library','headteacher','school']};
  for(const arena of ARENAS){const world=createRestaurant({arena:arena.id});world.tables.forEach(t=>t.guest.root.visible=true);
    for(const table of world.tables)for(const [width,height]of [[393,740],[1440,900]]){
      const scene=new StationScene(world,{setting:'tablet',tableId:table.id,task,options:task.options});world.root.updateMatrixWorld(true);const camera=focusedCamera('tablet',scene.cameraPoint,width,height,table.angle),meshes=visibleMeshes(world.root),offset=camera.position.clone().sub(scene.cameraPoint),forward=new THREE.Vector3(0,0,1).applyQuaternion(table.guest.root.quaternion),right=new THREE.Vector3(1,0,0).applyQuaternion(table.guest.root.quaternion);assert.ok(offset.dot(forward)<0,'Camera is behind the customer');assert.ok(offset.dot(right)>0,'Camera is at the customer’s right');
      for(const hit of scene.hits){const point=hit.getWorldPosition(new THREE.Vector3()).project(camera),ray=new THREE.Raycaster();assert.ok(Math.abs(point.x)<.85);if(width<760)assert.ok(point.y>.25&&point.y<.80,'Menu choices stay in the visible phone playfield');ray.setFromCamera(new THREE.Vector2(point.x,point.y),camera);sameObject(ray.intersectObjects(meshes,false)[0]?.object,scene.tabletScreen,`${arena.id} table ${table.id}: menu must not be obscured`);}scene.dispose();
    }
  }
});

test('all 24 customer profiles render, hold the menu and replace the previous table model',()=>{
  assert.equal(CUSTOMER_PROFILES.length,24);assert.ok(new Set(CUSTOMER_PROFILES.map(p=>p.hairstyle)).size>=9);assert.equal(new Set(CUSTOMER_PROFILES.map(p=>p.skin)).size,7);assert.equal(new Set(CUSTOMER_PROFILES.map(p=>p.outfit)).size,5);
  const world=createRestaurant(),task={options:['a','b','c','d']};
  for(const profile of CUSTOMER_PROFILES){const previous=world.tables[0].guest;setTableCustomer(world,0,profile.id);const guest=world.tables[0].guest;assert.equal(guest.profile.id,profile.id);if(previous!==guest)assert.equal(previous.root.parent,null);guest.root.visible=true;const scene=new StationScene(world,{setting:'tablet',task,options:task.options}),camera=focusedCamera('tablet',scene.cameraPoint,393,740,world.tables[0].angle),meshes=visibleMeshes(guest.root);world.root.updateMatrixWorld(true);
    for(const hit of scene.hits){const p=hit.getWorldPosition(new THREE.Vector3()).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(p.x,p.y),camera);sameObject(ray.intersectObjects(meshes,false)[0]?.object,scene.tabletScreen,profile.name);}scene.dispose();
    world.root.updateMatrixWorld(true);for(const x of [-.076,.076]){const point=guest.head.localToWorld(new THREE.Vector3(x,.018,.21)),forward=new THREE.Vector3(0,0,1).transformDirection(guest.head.matrixWorld),ray=new THREE.Raycaster(point.clone().addScaledVector(forward,1),forward.clone().negate()),first=ray.intersectObjects(visibleMeshes(guest.root),false)[0]?.object;assert.ok(first?.material===world.palette.dark||first?.material===world.palette.leafDark,`${profile.name}: hair and glasses must leave eyes visible`);}
  }
});

test('hanging paper meets its clip and checkout display sits in the existing terminal',()=>{
  const world=createRestaurant(),task={prompt:'Our teacher ___ the club.',broken:'like',answer:'likes',options:['likes','like','liking']};
  const ticket=new StationScene(world,{setting:'ticket',task});world.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(ticket.paper);assert.ok(bounds.min.y>1.265,'Paper stays above the counter');assert.ok(Math.abs(bounds.max.y-TICKET_RAIL.clip[1])<.03,'Top edge is gripped by the clip');assert.ok(Math.abs(bounds.min.z-(TICKET_RAIL.clip[2]+world.plan.stationOffsets.ticket[2]))<.02);const normal=new THREE.Vector3(0,0,1).applyQuaternion(ticket.paper.getWorldQuaternion(new THREE.Quaternion()));assert.ok(normal.z>.99,'Hanging paper faces the player');ticket.dispose();
  const checkout=new StationScene(world,{setting:'repair',task,options:task.options});world.root.updateMatrixWorld(true);assert.ok(checkout.display.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...CHECKOUT.screen).add(new THREE.Vector3(...world.plan.stationOffsets.repair)))<.075);assert.ok(checkout.cameraPoint.x<0&&checkout.cameraPoint.z>3,'Checkout stays beside the entrance on the left');checkout.dispose();
});

test('all nine dishes plate distinct ingredients at stable landing heights',async()=>{
  const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),task=bank[0].units[0].tasks.find(t=>t.kind==='sentence'),world=createRestaurant();assert.equal(RECIPES.length,9);assert.ok(RECIPES.every(r=>r.layers.length===9&&new Set(r.layers).size===9));
  for(let recipe=0;recipe<RECIPES.length;recipe++){const scene=new StationScene(world,{setting:'recipe',task,recipe,order:[2,0,1]});for(let i=0;i<3;i++){scene.addIngredient(i);scene.update(1);sameObject(scene.plated[i].parent,scene.contents);assert.equal(scene.plated[i].position.x,0);assert.equal(scene.plated[i].position.z,0);assert.equal(scene.plated[i].position.y,RECIPES[recipe].heights[i]);}world.root.updateMatrixWorld(true);
    if(['garden','burger','pancakes'].includes(RECIPES[recipe].id))for(let i=1;i<3;i++){const below=new THREE.Box3().setFromObject(scene.plated[i-1]),above=new THREE.Box3().setFromObject(scene.plated[i]);assert.ok(above.min.y-below.max.y<.035,'Layers touch rather than float');assert.ok(above.max.y>below.max.y,'New layer visibly increases the stack');}
    for(const layer of scene.plated){const bounds=new THREE.Box3().setFromObject(layer);assert.ok(bounds.min.y>1.40);assert.ok(bounds.min.x>-2.66&&bounds.max.x<-1.84,'Food stays inside the vessel');}scene.dispose();
  }
});
