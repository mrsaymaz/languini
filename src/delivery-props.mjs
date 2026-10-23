import {finishGeometry} from './geometry-finish.mjs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const cache=new Map();
const geometry=(key,make)=>{if(!cache.has(key)){const g=finishGeometry(make());g.userData.shared=true;cache.set(key,g);}return cache.get(key);};
function mesh(g,shape,material,x=0,y=0,z=0){const m=new THREE.Mesh(shape,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const box=(g,m,x,y,z,w,h,d,r=.018)=>mesh(g,geometry(['box',w,h,d,r].join(':'),()=>new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3))),m,x,y,z);
const cylinder=(g,m,x,y,z,r1,r2,h)=>mesh(g,geometry(['cyl',r1,r2,h].join(':'),()=>new THREE.CylinderGeometry(r1,r2,h,14)),m,x,y,z);
function seal(g,p,x,y,z){const m=mesh(g,geometry('parcel-rune',()=>new THREE.OctahedronGeometry(.036,0)),p.rune,x,y,z);m.scale.set(.8,.28,1.3);}
export const PACKAGE_TYPES=['kraft-box','flour-sack','milk-carton','produce-basket','pantry-tin','bakery-bag'];
export function createDeliveryPackage(p,variant=0){
  const kind=PACKAGE_TYPES[((variant%6)+6)%6],g=new THREE.Group();g.userData.variant=((variant%6)+6)%6;g.userData.packageType=kind;g.userData.representative=true;
  if(kind==='kraft-box'){
    box(g,p.kraft,0,.19,0,.67,.38,.51,.025);box(g,p.wood,0,.388,0,.024,.009,.5,.002);box(g,p.cream,0,.394,0,.13,.012,.53,.003);box(g,p.cream,0,.20,.260,.14,.38,.012,.003);
    for(const z of [-.245,.245])box(g,p.wood,0,.377,z,.64,.013,.008,.001);
    for(const x of [-.25,.25])box(g,p.darkWood,x,.04,.262,.08,.014,.007,.001);
    box(g,p.white,-.15,.402,.03,.17,.008,.20,.003);seal(g,p,-.15,.413,.03);
  }else if(kind==='flour-sack'){
    box(g,p.cream,0,.20,0,.55,.40,.45,.08);box(g,p.kraft,0,.404,0,.48,.052,.11,.018);box(g,p.white,0,.22,.232,.33,.23,.009,.016);box(g,p.green,0,.13,.24,.27,.022,.009,.002);
    for(const x of [-.25,.25])box(g,p.woodLight,x,.22,.08,.012,.29,.017,.004);
    for(const x of [-.16,-.08,0,.08,.16])box(g,p.gold,x,.439,0,.020,.009,.07,.002);seal(g,p,0,.25,.244);
  }else if(kind==='milk-carton'){
    box(g,p.carton,0,.25,0,.42,.50,.35,.025);box(g,p.green,0,.12,0,.43,.12,.36,.016);for(const side of [-1,1]){const roof=box(g,p.cream,side*.105,.555,0,.255,.025,.35,.009);roof.rotation.z=side*-.58;}
    box(g,p.green,0,.625,0,.022,.06,.35,.005);cylinder(g,p.white,.10,.575,.07,.043,.043,.04);seal(g,p,0,.33,.184);box(g,p.gold,0,.22,.183,.22,.018,.010,.003);
  }else if(kind==='produce-basket'){
    box(g,p.darkWood,0,.04,0,.67,.08,.48,.025);for(const x of [-.31,.31])box(g,p.wood,x,.18,0,.045,.29,.48,.01);for(const z of [-.22,.22])for(const y of [.11,.22])box(g,p.woodLight,0,y,z,.67,.08,.035,.008);
    for(let i=0;i<5;i++){const a=i*2.4;const fruit=cylinder(g,i%2?p.tomato:p.leaf,Math.cos(a)*.20,.16,Math.sin(a)*.13,.085,.065,.12);fruit.rotation.z=.12*Math.sin(a);}
    for(const x of [-.31,.31])box(g,p.darkWood,x,.30,0,.048,.06,.22,.012);
    box(g,p.cream,0,.20,.245,.26,.16,.012,.012);seal(g,p,0,.22,.256);
  }else if(kind==='pantry-tin'){
    cylinder(g,p.metal,0,.25,0,.24,.24,.50);cylinder(g,p.cream,0,.25,0,.244,.244,.31);for(const y of [.014,.49])cylinder(g,p.metal,0,y,0,.25,.25,.024);cylinder(g,p.gold,0,.512,0,.067,.067,.009);for(const y of [.11,.39])cylinder(g,p.metal,0,y,0,.246,.246,.011);seal(g,p,0,.28,.249);
  }else{
    box(g,p.kraft,0,.24,0,.46,.48,.33,.04);box(g,p.wood,0,.49,0,.44,.035,.10,.008);for(const x of [-.19,.19])box(g,p.wood,x,.23,.164,.016,.40,.006,.003);box(g,p.white,0,.24,.174,.28,.24,.009,.01);seal(g,p,0,.28,.184);for(const x of [-.1,.1])box(g,p.gold,x,.51,0,.06,.01,.05,.002);
  }
  return g;
}
export function packageVariant(offset,index){return ((offset||0)+index)%PACKAGE_TYPES.length;}
