import {cleanDesign} from './cafe-design.mjs';
import {venueLayout} from './venue-layout.mjs';

// The same plan drives scenery, navigation, guidance and station framing.
// Save IDs and the two/three/four-table capacities remain stable.
export function restaurantLayout(arena='courtyard',design={}){
 const d=cleanDesign(design),venue=venueLayout(arena),extra=venue.extraDepth,kitchenZ=-3.58-extra;
 const count=arena==='banquet'?4:arena==='bistro'?3:2;
 // Stable save IDs, newly authored plans. Chairs rotate with their table.
 let tables,tableAngles;
 if(d.layout==='classic'){
  const x=count===2?3.0:count===3?3.95:4.25;
  tables=count===2?[[-x,-.05],[x,-.05]]:count===3?[[-x,-.30],[x,-1.90],[x,1.0]]:[[-x,-1.85],[x,-1.85],[-x,1.45],[x,1.45]];
  tableAngles=tables.map(([x])=>x<0?Math.PI/2:-Math.PI/2);
 }else if(d.layout==='cosy'){
  const back=-.90-extra*.45;
  tables=[[-1.95,back],[1.95,count===2?1.25:back],[-1.95,1.35],[1.95,1.35]].slice(0,count);tableAngles=tables.map(()=>0);
 }else{
  tables=count===2?[[-2.5,-.8],[-2.5,1.30]]:count===3?[[-2.5,-1.65],[-2.5,1.25],[2.0,-1.65]]:[[-2.65,-3.0],[-2.65,-.8],[-2.65,1.4],[2.05,-2.3]];
  tableAngles=tables.map(()=>0);
 }
 const tablePoint=(i,dx=0,dz=1.20)=>{const [x,z]=tables[i],a=tableAngles[i];return [x+dx*Math.cos(a)+dz*Math.sin(a),z-dx*Math.sin(a)+dz*Math.cos(a)];};
 const tableBounds=tables.map(([x,z],i)=>{const rotated=Math.abs(Math.sin(tableAngles[i]))>.5;return {id:'table-'+i,x,z,width:rotated?1.8:3.2,depth:rotated?3.2:1.8};});
 const tableApproaches=tables.map((_,i)=>tablePoint(i));
 const guestApproaches=tables.flatMap((_,i)=>[-1,1].map(side=>({id:'guest-'+i+'-'+side,point:tablePoint(i,side*.96,1.20)})));
 const counterWidths=d.counter==='takeaway'?{checkout:1.75,pickup:2.15}:d.counter==='service'?{checkout:2.15,pickup:1.65}:{checkout:2,pickup:1.85};
 const checkout=[-2.7,3.48],pickup=[2.9,3.48],sink=[-4.0-venue.extraWidth*.15,kitchenZ+1.08];
 const points={pickup:[pickup[0],pickup[1]-.96],receiving:[-3.25,kitchenZ+1.02],pantry:[-2.9,kitchenZ+1.02],recipe:[-2.15,kitchenZ+1.02],ticket:[1.7,kitchenZ+1.02],repair:[checkout[0],checkout[1]-.95],pass:[2.25,kitchenZ+1.02],sink:[sink[0]+.72,sink[1]+.56],counter:[-.85,kitchenZ+1.02],cook0:[-2.15,kitchenZ+1.02],cook1:[0,kitchenZ+1.02],cook2:[3.25,kitchenZ+1.02]};
 const stationOffsets={recipe:[0,.75,kitchenZ-2.9],delivery:[-.35,0,kitchenZ+2.7],ticket:[.82,0,kitchenZ-2.9],repair:[checkout[0]-3.35,-.16,checkout[1]-2.95],wash:[sink[0]-2.8,-.65,sink[1]-.45]};
 const cookingSlots=[[-2.3,1.34,kitchenZ],[.05,1.34,kitchenZ],[3.32,1.40,kitchenZ],[-.80,1.34,kitchenZ+.15]];
 const fixtures=[
  {id:'kitchen',x:.2,z:kitchenZ,width:7.5,depth:1.12},
  {id:'sink',x:sink[0],z:sink[1],width:.82,depth:1.25},
  {id:'pantry',x:sink[0],z:kitchenZ-.17,width:.82,depth:.72},
  {id:'checkout',x:checkout[0],z:checkout[1],width:counterWidths.checkout,depth:.88},
  {id:'pickup',x:pickup[0],z:pickup[1],width:counterWidths.pickup,depth:.88}
 ];
 if(d.decor.welcome==='plant')fixtures.push({id:'welcome-plant',x:4.13+venue.extraWidth*.32,z:3.0,width:.38,depth:.38});
 return {design:d,counterWidths,venue,kitchenZ,tables,tableAngles,tableBounds,tableApproaches,guestApproaches,checkout,pickup,pickupApproach:[pickup[0],pickup[1]-.96],sink,points,stationOffsets,cookingSlots,fixtures,start:[0,kitchenZ+1.55],trolleyHome:[3.9+venue.extraWidth*.25,.1,kitchenZ+1.12],holding:[[-.85,1.34,kitchenZ+.25],[-.35,1.34,kitchenZ+.25]],cleanDishes:[sink[0]-.18,1.25,sink[1]-.38],dirtyDishes:[sink[0]+.18,1.25,sink[1]+.39],passSlot:i=>[1.92+(i%3-1)*.65,1.32,kitchenZ-.26+Math.floor(i/3)*.52]};
}

export function stationOffset(arena,setting){return restaurantLayout(arena).stationOffsets[setting]||[0,0,0];}
