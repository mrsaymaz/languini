import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {overviewCamera} from '../src/restaurant-camera.mjs';import {restaurantLayout} from '../src/restaurant-layout.mjs';import {venueLayout} from '../src/venue-layout.mjs';
const sizes=[[1024,600],[1280,720],[1366,768],[1920,1080],[2560,1080]],arenas=['courtyard','bistro','banquet'];
function camera(f){const c=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);c.position.copy(f.position);c.lookAt(f.target);c.updateProjectionMatrix();c.updateMatrixWorld();return c;}
test('desktop service fills the room at a scale close to the opening view without changing the angle',()=>{
 for(const arena of arenas)for(const [width,height]of sizes){const f=overviewCamera(width,height,{arena,liveKitchen:true}),m=overviewCamera(width,height,{arena,menu:true}),d=f.position.clone().sub(f.target);assert.ok((f.top-f.bottom)/(m.top-m.bottom)<=1.34,'Desktop room should stay close to the opening scale');assert.ok(Math.abs(THREE.MathUtils.radToDeg(Math.atan2(d.y,Math.hypot(d.x,d.z)))-60)<1e-8);assert.ok(Math.abs(THREE.MathUtils.radToDeg(Math.atan2(d.x,d.z))-15)<1e-8);}
});
test('all desktop kitchen/table anchors clear the ticket rail and dock while the whole venue fits',()=>{
 for(const arena of arenas)for(const [width,height]of sizes){const c=camera(overviewCamera(width,height,{arena,liveKitchen:true})),plan=restaurantLayout(arena),venue=venueLayout(arena);for(const [x,z]of [...plan.tables,...Object.values(plan.points),plan.pickup])for(const y of [.3,1.3]){const p=new THREE.Vector3(x,y,z).project(c),px=(p.x*.5+.5)*width,py=(.5-p.y*.5)*height;assert.ok(px>=24&&px<=width-24,arena+' horizontal anchor');assert.ok(py>=170&&py<=height-145,`${arena} ${width}x${height} target y=${py}`);}
 const corners=[];for(const x of [-venue.width/2-.12,venue.width/2+.12]){for(const z of [-4.63-venue.extraDepth,4.63])corners.push([x,-.2,z]);corners.push([x,3.4,-4.4-venue.extraDepth]);}for(const v of corners){const p=new THREE.Vector3(...v).project(c);assert.ok(Math.abs(p.x)<.99&&Math.abs(p.y)<.99,'Keep entrance, floor and back wall within the viewport');}}
});
test('phone/short-window, opening and non-kitchen frames exactly retain the previous release poses',()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/overview-v0470.json',import.meta.url)));for(const {frame,...options}of fixtures){const f=overviewCamera(options.width,options.height,options);assert.deepEqual({left:f.left,right:f.right,top:f.top,bottom:f.bottom,target:f.target.toArray(),position:f.position.toArray(),up:f.up.toArray()},frame,JSON.stringify(options));}
});
