import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {finishGeometry} from './geometry-finish.mjs';
// Shared medium-detail shapes only for the working fixtures, never the room's
// furniture or interaction/projection planes. Static room batching still owns
// the final combined buffers.
const cache=new Map();
function geometry(key,make){if(!cache.has(key)){const g=finishGeometry(make());g.userData.shared=true;cache.set(key,g);}return cache.get(key);}
function part(parent,mat,g,x,y,z){const mesh=new THREE.Mesh(g,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
export function stationBox(parent,mat,x,y,z,w,h,d,r=.035){return part(parent,mat,geometry('b'+[w,h,d,r],()=>new RoundedBoxGeometry(w,h,d,r>=.025?2:1,Math.min(r,w/3,h/3,d/3))),x,y,z);}
export function stationCylinder(parent,mat,x,y,z,a,b,h,n=24){return part(parent,mat,geometry('c'+[a,b,h,n],()=>new THREE.CylinderGeometry(a,b,h,Math.max(n,a>=.08?24:12))),x,y,z);}
export function stationRing(parent,mat,x,y,z,r=.2,tube=.025){return part(parent,mat,geometry('r'+[r,tube],()=>new THREE.TorusGeometry(r,tube,8,r>.15?32:20)),x,y,z);}
export function stationPipe(parent,mat,points,r=.025){return part(parent,mat,geometry('p'+JSON.stringify(points)+r,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,8,false)),0,0,0);}
