// A drop follows the visible object as well as the fingertip. No language
// answers are inspected here: every destination gets the same tolerance.
export function clippedRect(node,viewport){
  if(!node||node.hidden||node.disabled||node.inert)return null;
  const r=node.getBoundingClientRect();let left=r.left,top=r.top,right=r.right,bottom=r.bottom;
  for(let parent=node.parentElement;parent;parent=parent.parentElement){
    if(parent.hidden||parent.inert)return null;
    if(parent.classList?.contains('surface-scroll')||parent.classList?.contains('object-surface')){
      const p=parent.getBoundingClientRect();left=Math.max(left,p.left);top=Math.max(top,p.top);right=Math.min(right,p.right);bottom=Math.min(bottom,p.bottom);
    }
  }
  if(viewport){left=Math.max(left,viewport.left);top=Math.max(top,viewport.top);right=Math.min(right,viewport.right);bottom=Math.min(bottom,viewport.bottom);}
  return right>left&&bottom>top?{left,top,right,bottom,width:right-left,height:bottom-top}:null;
}
export function polygonDistance(point,polygon){
  let inside=false,distance=Infinity;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j],b=polygon[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy||1)));
    distance=Math.min(distance,Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy));
    if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside?0:distance;
}
export function placementTarget(targets,points,{padding=14,viewport=null}={}){
  for(const point of points.filter(Boolean)){
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y))continue;
    if(viewport&&(point.x<viewport.left||point.x>viewport.right||point.y<viewport.top||point.y>viewport.bottom))continue;
    let best=null;
    for(const target of targets){
      const r=clippedRect(target.node,viewport);if(!r)continue;
      const dx=Math.max(r.left-point.x,0,point.x-r.right),dy=Math.max(r.top-point.y,0,point.y-r.bottom),distance=Math.max(Math.hypot(dx,dy),target.polygon?polygonDistance(point,target.polygon):0);
      if(distance<=padding&&(!best||distance<best.distance))best={...target,distance};
    }
    if(best)return best;
  }
  return null;
}
