import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {neighbourhoodPlan,guestArrivalPose} from '../src/neighbourhood.mjs';
import {createRestaurant,RestaurantView} from '../src/restaurant.mjs';
import {restaurantLayout} from '../src/restaurant-layout.mjs';
import {customerWalkPose} from '../src/customers.mjs';
import {KitchenNavigation} from '../src/kitchen-flow.mjs';

test('exterior recovery has a clear doorway, progressive repairs and bounded pickup queue for every venue and arrangement',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const layout of ['classic','cosy','express']){
  const p=restaurantLayout(arena,{layout}),nav=new KitchenNavigation(arena,{design:{layout}}),before=JSON.stringify(nav.obstacles);
  for(let level=0;level<=5;level++){
   const n=neighbourhoodPlan(p,level);assert.ok(n.door[1]>4.5&&n.pickup[1]>5);assert.ok(n.menu[0]<-1);
   assert.equal(n.queue,level>=5?2:level>=4?1:0);assert.equal(n.cracks,level>=3?0:level>=2?3:level>=1?6:9);
   for(const point of [...Object.values(p.points),...p.tableApproaches,p.pickupApproach])assert.ok(nav.route({x:p.start[0],z:p.start[1]},{x:point[0],z:point[1]})?.length);
  }
  assert.equal(JSON.stringify(nav.obstacles),before);
 }
});

test('neighbourhood geometry stays finite and inexpensive, shares one sign atlas and adds no lights',()=>{
 for(const arena of ['courtyard','bistro','banquet']){
  const w=createRestaurant({arena,reputationLevel:5,atmosphere:'rain'}),n=w.neighbourhood;let triangles=0,meshes=0,lights=0;const maps=new Set();
  n.group.traverse(o=>{if(o.isLight)lights++;if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));if(o.material.map&&!Object.values(w.palette).some(m=>m?.map===o.material.map))maps.add(o.material.map);});
  assert.equal(lights,0);assert.ok(meshes<=50,`${arena}: ${meshes} exterior batches`);assert.ok(triangles<25000,`${arena}: ${triangles} exterior triangles including two people`);assert.ok(maps.size<=1);
  assert.equal(n.layout.queue,2);n.setViewport(393,680);assert.equal(n.far.visible,false);n.setViewport(768,1024);assert.equal(n.far.visible,true);
  const b=new THREE.Box3().setFromObject(n.group);assert.ok(b.min.x>=-24.01&&b.max.x<=24.01&&b.max.y<4);
  n.update(1);assert.equal(n.drips.geometry.attributes.position.count,32);assert.ok(n.drips.geometry.attributes.position.array.every(Number.isFinite));
  n.update(2,{reduced:true});const still=Array.from(n.drips.geometry.attributes.position.array);n.update(200,{reduced:true});assert.deepEqual(Array.from(n.drips.geometry.attributes.position.array),still);assert.ok(n.foliage.every(f=>f.rotation.z===0));
 }
});

test('arriving customers pause at the menu, enter through the door and yield immediately to English without changing the order',()=>{
 for(const arena of ['courtyard','bistro','banquet']){
  const w=createRestaurant({arena}),n=w.neighbourhood.layout,state={status:'waiting',patience:85,maxPatience:85,stockReserved:false},before=JSON.stringify(state);
  for(const table of w.tables){
   const stages=[.2,1.65,2.4,3.3,4.2,4.6].map(t=>guestArrivalPose(table,state,n,t));
   assert.equal(stages[0].stage,'approach');assert.equal(stages[1].stage,'menu');assert.equal(stages.at(-1).stage,'settled');
   for(const pose of stages)assert.ok([pose.x,pose.y,pose.z,pose.angle].every(Number.isFinite));
   for(const option of [{reduced:true},{protectedTime:true}])assert.equal(guestArrivalPose(table,state,n,.2,option).stage,'settled');
   customerWalkPose(table.guest,1,{standing:true,walking:true});assert.ok(table.guest.standingLegs.visible);assert.ok(!table.guest.seatedLegs.visible);assert.ok(table.guest.legs[0].rotation.x*table.guest.legs[1].rotation.x<0);
   customerWalkPose(table.guest,100,{standing:false,reduced:true});assert.ok(!table.guest.standingLegs.visible&&table.guest.seatedLegs.visible);assert.equal(table.guest.body.position.y,0);
  }
  assert.equal(JSON.stringify(state),before);
 }
});

test('arrival animation freezes on pause and settles before a protected task while the scene keeps existing order state',()=>{
 const view=Object.assign(Object.create(RestaurantView.prototype),{container:{clientWidth:393,clientHeight:680},menu:false,reduced:false,fallback:false,scene:new THREE.Scene(),camera:new THREE.OrthographicCamera(-10,10,7,-7,.1,90),renderer:{setSize(){},render(){},shadowMap:{}}});
 view.setRestaurant({});const state={status:'waiting',orderId:1,guest:0,patience:85,maxPatience:85,recipe:0,partySize:1,partyRecipes:[0],deliveredParts:[],transitParts:[],plan:[],step:0},game={state:'playing',tables:[state],paused:false,focused:false,jobs:[],loaded:[],equipped:new Set()};
 view.update(0,.5,game);const table=view.world.tables[0],elapsed=table.arrivalElapsed,position=table.guest.root.position.clone();game.paused=true;view.update(100,5,game);assert.equal(table.arrivalElapsed,elapsed);assert.ok(table.guest.root.position.equals(position));game.paused=false;game.focused=true;view.update(101,.01,game);assert.equal(table.arrivalStage,'settled');assert.equal(table.arrivalElapsed,4.6);assert.equal(state.patience,85);
});
