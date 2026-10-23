import * as THREE from 'three';
import {venueLayout} from './venue-layout.mjs';

// Keep the entrance at the bottom and the kitchen at the top. Work surfaces
// retain their own camera; this framing applies only to the room overview.
export function overviewCamera(width,height,{menu=false,liveKitchen=false,arena='courtyard'}={}){
 const venue=venueLayout(arena),yaw=15*Math.PI/180,pitch=60*Math.PI/180;
 const offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(20);
 const target=new THREE.Vector3(0,.6,venue.centerZ),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,90);camera.position.copy(target).add(offset);camera.lookAt(target);camera.updateMatrixWorld();
 const points=[];for(const x of [-venue.width/2-.12,venue.width/2+.12]){
  for(const z of [-4.63-venue.extraDepth,4.63])points.push(new THREE.Vector3(x,-.2,z));
  points.push(new THREE.Vector3(x,3.4,-4.40-venue.extraDepth));
 }
 const local=points.map(p=>p.applyMatrix4(camera.matrixWorldInverse)),xs=local.map(p=>p.x),ys=local.map(p=>p.y),spanX=Math.max(...xs)-Math.min(...xs),spanY=Math.max(...ys)-Math.min(...ys);
 // A desktop has enough room to let the back wall share the decorative
 // header band. Keep the actual kitchen and entrance clear of the controls.
 // Phone/short landscape windows retain their established service framing.
 const landscape=width>height*1.4,desktop=width>=1024&&height>=600,top=menu?18:liveKitchen?(desktop?76:landscape&&height<450?130:172):90,bottom=menu?18:liveKitchen?(desktop?100:landscape&&height<450?85:154):90;
 const rect={x:10,y:top,width:Math.max(180,width-20),height:Math.max(130,height-top-bottom)},aspect=width/height;
 const viewHeight=Math.max(spanX*height/rect.width,spanY*height/rect.height)*1.035,viewWidth=viewHeight*aspect;
 const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
 target.addScaledVector(right,(Math.min(...xs)+Math.max(...xs))/2-((rect.x+rect.width/2)/width-.5)*viewWidth);
 target.addScaledVector(up,(Math.min(...ys)+Math.max(...ys))/2+((rect.y+rect.height/2)/height-.5)*viewHeight);
 if(menu&&width>=760)target.addScaledVector(right,2.1);
 return {left:-viewWidth/2,right:viewWidth/2,top:viewHeight/2,bottom:-viewHeight/2,target,position:target.clone().add(offset),up:new THREE.Vector3(0,1,0),overviewBounds:{spanX,spanY,centerX:((rect.x+rect.width/2)/width-.5)*viewWidth,centerY:(.5-(rect.y+rect.height/2)/height)*viewHeight}};
}
