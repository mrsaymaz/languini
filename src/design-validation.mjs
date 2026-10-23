import {restaurantLayout} from './restaurant-layout.mjs';
import {KitchenNavigation} from './kitchen-flow.mjs';
import {cleanDesign} from './cafe-design.mjs';
// Use the same chair-inclusive clearance and grid as actual carrying/serving.
export function validateDesign(arena,design){
 const d=cleanDesign(design),plan=restaurantLayout(arena,d),nav=new KitchenNavigation(arena,{design:d}),from={x:plan.start[0],z:plan.start[1]},stops=[...Object.entries(plan.points),['collection',plan.pickupApproach],['entrance',[0,3.95]],...plan.tableApproaches.map((p,i)=>['table-'+i,p]),...plan.guestApproaches.map(g=>[g.id,g.point])];
 const routes=stops.map(([id,[x,z]])=>{const end=nav.nearest(x,z),path=nav.route(from,{x,z}),gap=end?Math.hypot(end.x-x,end.z-z):Infinity;return {id,x,z,path:path||[],valid:gap<.23&&!!path?.length};});
 const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.width+b.width)/2-.02&&Math.abs(a.z-b.z)<(a.depth+b.depth)/2-.02;
 const physical=plan.tables.map(([x,z],i)=>({x,z,width:plan.tableAngles[i]?1.05:2.48,depth:plan.tableAngles[i]?2.48:1.05}));
 const seating=physical.every((a,i)=>physical.slice(i+1).every(b=>!overlap(a,b))&&plan.fixtures.every(b=>!overlap(a,b)));
 const valid=seating&&routes.every(r=>r.valid);return {valid,plan,routes,message:valid?'Routes clear':'Route blocked'};
}
