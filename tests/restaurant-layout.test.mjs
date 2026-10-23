import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {restaurantLayout} from '../src/restaurant-layout.mjs';
import {KitchenNavigation} from '../src/kitchen-flow.mjs';
import {cameraFrame,createRestaurant} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {fitSurfaceCamera,projectSurface} from '../src/object-layout.mjs';

test('window seating preserves the central spine and reaches every oriented serving approach',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const bench of [false,true]){
  const p=restaurantLayout(arena),nav=new KitchenNavigation(arena,{bench});
  assert.equal(p.tables.length,{courtyard:2,bistro:3,banquet:4}[arena]);
  for(const b of p.tableBounds)assert.ok(Math.abs(b.x)-b.width/2>=.79,'Oriented chairs preserve the central aisle');
  for(let z=p.start[1];z<3;z+=.25)assert.ok(!nav.obstacles.some(r=>0>r.left&&0<r.right&&z>r.top&&z<r.bottom));
  const approaches=[...Object.values(p.points),p.pickupApproach,...p.tableApproaches];
  for(const [x,z]of approaches){const nearest=nav.nearest(x,z);assert.ok(Math.hypot(nearest.x-x,nearest.z-z)<.23,`${arena}: stop beside the requested fixture`);const path=nav.route({x:p.start[0],z:p.start[1]},{x,z});assert.ok(path?.length);for(const cell of path)assert.ok(!nav.obstacles.some(r=>cell.x>r.left&&cell.x<r.right&&cell.z>r.top&&cell.z<r.bottom));}
  assert.ok(p.checkout[0]<0&&p.pickup[0]>0&&p.checkout[1]>3&&p.pickup[1]>3);
  assert.ok(p.sink[0]<p.points.recipe[0]&&p.points.pass[0]>p.points.recipe[0]);
 }
});

test('all portrait overview cameras use the approved 60 degree pitch and 15 degree yaw',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const [width,height]of [[320,480],[360,640],[390,844],[430,932]]){
  const f=cameraFrame(width,height,{arena,liveKitchen:true}),d=f.position.clone().sub(f.target);
  assert.ok(Math.abs(THREE.MathUtils.radToDeg(Math.atan2(d.y,Math.hypot(d.x,d.z)))-60)<1e-8);
  assert.ok(Math.abs(THREE.MathUtils.radToDeg(Math.atan2(d.x,d.z))-15)<1e-8);
  const c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();
  const p=restaurantLayout(arena);for(const [x,z]of [...p.tables,...Object.values(p.points),p.pickup]){const v=new THREE.Vector3(x,1.3,z).project(c);assert.ok(Math.abs(v.x)<.96&&Math.abs(v.y)<.96);}
 }
});

test('moving the prep counter preserves the close-up board, papers, plate and native surface size',()=>{
 const task={id:'layout-six',kind:'sentence',blocks:['My teacher','gives','us','homework','at school','every day.'],answer:'My teacher gives us homework at school every day.'};
 let first;
 for(const arena of ['courtyard','bistro','banquet']){
  const w=createRestaurant({arena}),s=new StationScene(w,{setting:'recipe',task,recipe:0,viewport:{width:390,height:844}});
  const geometry={board:s.prepBoard.rect,layout:s.prepLayout,vessel:s.vessel.scale.toArray()};if(first)assert.deepEqual(geometry,first);else first=geometry;
  const f=fitSurfaceCamera(s.focusSurface,390,844,{setting:'recipe',offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();
  const projected=projectSurface(s.focusSurface,c,390,844);assert.ok(Math.abs(projected[1].x-projected[0].x-354)<.01);
  for(let i=0;i<6;i++){s.addIngredient(i);s.update(.6);}
  assert.equal(s.autoFinished,true);assert.equal(s.plated.filter(p=>p.parent===s.contents).length,3);s.dispose();
 }
});

test('tall kitchen fixtures cut away for work and restore when the station closes',()=>{
 const w=createRestaurant({arena:'banquet'}),task={kind:'sentence',blocks:['Our teacher','is','helpful.'],answer:'Our teacher is helpful.'};
 const original=w.occluders.map(o=>o.visible),s=new StationScene(w,{setting:'recipe',task,recipe:0,viewport:{width:390,height:844}});
 assert.ok(w.occluders.every(o=>!o.visible));
 const f=fitSurfaceCamera(s.focusSurface,390,844,{setting:'recipe',offset:s.cameraOffset}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();
 const meshes=[];w.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});
 for(const x of [-.4,0,.4])for(const y of [-.4,0,.4]){
  const point=s.focusSurface.mesh.localToWorld(new THREE.Vector3(x*s.focusSurface.width,y*s.focusSurface.height,.04)).project(c),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(point.x,point.y),c);
  let hit=ray.intersectObjects(meshes,false)[0]?.object;while(hit&&hit!==s.root)hit=hit.parent;
  assert.equal(hit,s.root,'Room signs, wall and hood must not obscure the prep work surface');
 }
 s.dispose();assert.deepEqual(w.occluders.map(o=>o.visible),original);
});
