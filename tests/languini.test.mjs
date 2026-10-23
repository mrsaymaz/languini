import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {ARENAS,SAVE_KEY} from '../src/core.mjs';
import {venueLayout} from '../src/venue-layout.mjs';
import {createRestaurant,cameraFrame} from '../src/restaurant.mjs';
import {KitchenNavigation,KITCHEN_POINTS,KITCHEN_TABLES} from '../src/kitchen-flow.mjs';
import {receiptReadMilliseconds} from '../src/receipt-reading.mjs';

test('Languini renames the restaurant without changing the existing save identity',()=>{
 assert.deepEqual(ARENAS.map(a=>a.name),['Languini Cafe','Languini Diner','Languini Bistro']);
 assert.deepEqual(ARENAS.map(a=>a.id),['courtyard','bistro','banquet']);assert.equal(SAVE_KEY,'rune-bistro-v1');
 for(const path of ['public/index.html','public/phone-preview.html','src/task-ui.mjs','src/restaurant.mjs','src/object-stations.mjs']){const text=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');assert.ok(!/Rune Bistro|RUNE BISTRO|RUNE <b>BISTRO/.test(text));assert.match(text,/LANGUINI|Languini/);}
});

test('larger venues provide real floor and walkable space while retaining reachable service anchors',()=>{
 let lastArea=0,lastCells=0,lastWidth=0;
 for(const arena of ARENAS){const v=venueLayout(arena.id),world=createRestaurant({arena:arena.id}),nav=new KitchenNavigation(arena.id),bounds=new THREE.Box3().setFromObject(world.environment),area=v.width*v.depth,cells=nav.cells.filter(c=>c.open).length;
  assert.ok(area>lastArea);assert.ok(cells>lastCells);assert.ok(bounds.max.x-bounds.min.x>lastWidth);assert.equal(world.venue.width,v.width);
  for(const [x,z]of [...Object.values(KITCHEN_POINTS),...KITCHEN_TABLES[arena.id].map(([x,z])=>[x,z+.98]),[v.pickup[0],v.pickup[1]+.98]])assert.ok(nav.route({x:.125,z:1.875},{x,z})?.length);
  lastArea=area;lastCells=cells;lastWidth=bounds.max.x-bounds.min.x;
 }
});

test('expanded overview cameras preserve usable station and guest positions on phones',()=>{
 for(const arena of ARENAS)for(const liveKitchen of [false,true])for(const [width,height]of [[320,480],[360,640],[393,740],[430,850],[844,390],[1366,768]]){
  const f=cameraFrame(width,height,{arena:arena.id,liveKitchen}),c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();
  for(const [x,z]of [...KITCHEN_TABLES[arena.id],venueLayout(arena.id).pickup,...Object.values(KITCHEN_POINTS)]){const p=new THREE.Vector3(x,1.3,z).project(c);assert.ok(Math.abs(p.x)<.96&&Math.abs(p.y)<.96,`${arena.id} ${width}x${height} anchor ${x},${z}`);}
 }
});

test('corrected check reading time scales with the sentence and stays bounded',()=>{
 assert.equal(receiptReadMilliseconds('Tea.'),400);assert.ok(receiptReadMilliseconds('I would like a bowl of soup for lunch.')>receiptReadMilliseconds('Tea.'));assert.equal(receiptReadMilliseconds('word '.repeat(100)),3000);
});
