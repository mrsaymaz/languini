import * as THREE from 'three';
import {kitchenAction} from './kitchen-signifiers.mjs';
export const MIN_ZOOM=.9,MAX_ZOOM=1.25;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function cleanOverview(value={}){const zoom=clamp(Number(value.zoom)||1,MIN_ZOOM,MAX_ZOOM),limit=Math.max(0,1-1/zoom)/2;return{zoom,x:clamp(Number(value.x)||0,-limit,limit),y:clamp(Number(value.y)||0,-limit,limit)};}
export function navigateOverview(frame,value){
 const state=cleanOverview(value),b=frame.overviewBounds;if(!b)return frame;
 const direction=frame.position.clone().sub(frame.target).normalize(),right=new THREE.Vector3().crossVectors(frame.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const offset=right.clone().multiplyScalar(b.centerX*(1-1/state.zoom)+state.x*b.spanX).addScaledVector(up,b.centerY*(1-1/state.zoom)+state.y*b.spanY);
 return{...frame,left:frame.left/state.zoom,right:frame.right/state.zoom,top:frame.top/state.zoom,bottom:frame.bottom/state.zoom,target:frame.target.clone().add(offset),position:frame.position.clone().add(offset)};
}
// Screen-space distance is converted using the *current* orthographic scale.
export function panOverview(frame,state,dx,dy,width,height){const s=cleanOverview(state),b=frame.overviewBounds;return cleanOverview({...s,x:s.x-dx*(frame.right-frame.left)/s.zoom/width/b.spanX,y:s.y+dy*(frame.top-frame.bottom)/s.zoom/height/b.spanY});}
export function overviewEvents(g){
 if(!g?.kitchen||g.state!=='playing'||g.paused||g.focused||g.closingService)return[];
 const k=g.kitchen,events=[];
 for(const t of g.tables){if(!['waiting','preparing','prepared','ready'].includes(t.status))continue;
  const complete=t.status==='ready'&&t.step===t.plan.length,kind=t.pickup?'pickup':complete?'meal':'guest';
  const point=kitchenAction(g,'order:'+t.id)?.point||k.tablePoint(t);
  events.push({id:'order:'+t.orderId,tableId:t.id,orderId:t.orderId,kind,icon:kind==='pickup'?'bag':complete?'serve':'customer',label:kind==='pickup'?'Takeaway ready for attention':complete?'Meal ready':t.name+'’s order needs attention',point,urgent:t.patience/t.maxPatience<.25});
 }
 if(g.needsDelivery&&k.carry?.kind!=='supplies')events.push({id:'supplies',kind:'supplies',icon:'crate',label:'Supplies needed',point:k.point('receiving'),urgent:false});
 return events;
}
export function edgeMarkers(events,project,rect,{visibleRect=rect,occlusions=[]}={}){
 const groups=new Map(),cx=(rect.left+rect.right)/2,cy=(rect.top+rect.bottom)/2;
 for(const e of events){const p=project(e.point);if(!p||!Number.isFinite(p.x+p.y))continue;if(p.x>=visibleRect.left&&p.x<=visibleRect.right&&p.y>=visibleRect.top&&p.y<=visibleRect.bottom&&!occlusions.some(r=>p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom))continue;
  let g=groups.get(e.kind);if(!g){g={...e,count:0,point:e.point,p};groups.set(e.kind,g);}g.count++;if(e.urgent&&!g.urgent){Object.assign(g,e,{p});}g.urgent ||= e.urgent;
 }
 const result=[];
 for(const g of [...groups.values()].sort((a,b)=>Number(b.urgent)-Number(a.urgent))){const dx=g.p.x-cx,dy=g.p.y-cy,scale=Math.min((rect.right-rect.left)/2/Math.max(.001,Math.abs(dx)),(rect.bottom-rect.top)/2/Math.max(.001,Math.abs(dy)));let x=cx+dx*scale,y=cy+dy*scale;
  // Four types at most. Move along the edge to keep 44px touch targets apart.
  const horizontal=Math.abs(y-rect.top)<1||Math.abs(y-rect.bottom)<1;
  for(let n=0;n<12&&result.some(m=>Math.hypot(m.x-x,m.y-y)<54);n++){if(horizontal)x=clamp(x+(n%2? -1:1)*Math.ceil((n+1)/2)*56,rect.left,rect.right);else y=clamp(y+(n%2?-1:1)*Math.ceil((n+1)/2)*56,rect.top,rect.bottom);}
  result.push({...g,x,y,angle:Math.atan2(dy,dx)*180/Math.PI});
 }
 return result;
}
