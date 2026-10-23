import * as THREE from 'three';
// Finite camera travel with exact endpoints; task ink stays still after arrival.
export const smoothTravel=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
export function cameraTravel(from,goal,progress){
 const t=THREE.MathUtils.clamp(progress,0,1),ease=smoothTravel(t),arc=Math.sin(t*Math.PI)**2;
 const distance=from.position.distanceTo(goal.position),amount=Math.min(1,distance/3);
 const right=new THREE.Vector3(goal.position.z-goal.target.z,0,goal.target.x-goal.position.x).normalize();
 const position=new THREE.Vector3().lerpVectors(from.position,goal.position,ease).addScaledVector(right,arc*.10*amount);position.y+=arc*.18*amount;
 return {position,target:new THREE.Vector3().lerpVectors(from.target,goal.target,ease),up:new THREE.Vector3().lerpVectors(from.up,goal.up,ease).normalize(),...Object.fromEntries(['left','right','top','bottom'].map(k=>[k,THREE.MathUtils.lerp(from[k],goal[k],ease)]))};
}
// A still overview avoids subpixel shimmer in distant furniture and signage.
export function menuCameraPosition(goal,time,reduced=false){return goal.position.clone();}
// Approach, two short figure-eight scrubs, then return to the rim.
export function spongePosition(from,target,rest,t){
 const position=new THREE.Vector3();if(t<.24)position.lerpVectors(from,target,smoothTravel(t/.24));
 else if(t<.72){const p=(t-.24)/.48;position.copy(target);position.x+=Math.sin(p*Math.PI*4)*.075;position.y+=Math.sin(p*Math.PI*8)*.022;position.z+=Math.sin(p*Math.PI*4)*.008;}
 else position.lerpVectors(target,rest,smoothTravel((t-.72)/.28));
 return position;
}
