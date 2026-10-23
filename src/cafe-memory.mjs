import * as THREE from 'three';
import {finishGeometry} from './geometry-finish.mjs';
// A permanent keepsake, shared visually by the opening story and the café.
export function createCafeMemory(p){
 const root=new THREE.Group();let material=p.cream;
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=256;const c=canvas.getContext?.('2d');
  if(c){
   c.fillStyle='#dfc278';c.fillRect(0,0,384,256);c.fillStyle='#f1e5c7';c.fillRect(12,12,360,232);c.fillStyle='#76623d';c.font='bold 23px Georgia';c.textAlign='center';c.fillText('THE GOOD DAYS',192,43);
   c.fillStyle='#b9c8aa';c.fillRect(24,59,336,173);c.fillStyle='#f5e8cd';c.fillRect(65,70,254,114);c.fillStyle='#446451';c.fillRect(60,70,264,30);c.fillStyle='#ead6a2';c.font='bold 18px Georgia';c.fillText('LANGUINI',192,91);
   for(const x of [111,192,273]){c.fillStyle='#997841';c.beginPath();c.ellipse(x,203,30,10,0,0,Math.PI*2);c.fill();c.fillStyle='#66503c';c.fillRect(x-3,209,6,17);c.fillStyle='#7d6c50';c.beginPath();c.arc(x,133,15,0,Math.PI*2);c.fill();c.fillStyle='#d6b28a';c.beginPath();c.arc(x,139,13,0,Math.PI*2);c.fill();c.fillStyle=x===192?'#967064':'#526b4a';c.fillRect(x-15,152,30,33);}
   const map=new THREE.CanvasTexture(canvas);material=new THREE.MeshBasicMaterial({map});
  }
 }
 const frame=new THREE.Mesh(finishGeometry(new THREE.BoxGeometry(.86,.64,.065)),p.darkWood);frame.userData.ownedGeometry=true;root.add(frame);
 const picture=new THREE.Mesh(finishGeometry(new THREE.PlaneGeometry(.77,.55)),material);picture.position.z=.035;picture.userData.ownedGeometry=true;root.add(picture);return root;
}
