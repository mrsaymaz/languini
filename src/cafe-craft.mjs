import * as THREE from 'three';
import {visibleDecor} from './cafe-design.mjs';
// Every choice has an authored anchor at a boundary or on existing furniture.
// The resulting fixed geometry joins material batches; no obstacle moves here.
export function buildCafeRecovery(root,p,{plan,design,level,box,cyl,ball,ring,textMaterial,createCustomer,mergeStatic}){
 const group=new THREE.Group();group.userData.cafeRecovery=true;root.add(group);const d=visibleDecor(design,level),k=plan.kitchenZ;
 const frame=(x,y,z,title,w=.78,h=.53)=>{box(group,p.wood,x,y,z,w,h,.055,.025);box(group,textMaterial(title,'#fff1d5','#365c4c',256),x,y,z+.037,w-.09,h-.09,.015,.009);};
 if(d.welcome==='plant'){const x=4.13+plan.venue.extraWidth*.32; cyl(group,p.terra,x,.32,3.0,.17,.13,.35,16);for(let i=0;i<5;i++){const a=i*2.4;ball(group,i%2?p.leaf:p.leafDark,x+Math.sin(a)*.09,.60+i%2*.08,3.0+Math.cos(a)*.07,.15,12).scale.set(.65,1.8,.7);}}
 if(d.welcome==='menu')frame(-3.25,1.92,k-.50,'TODAY’S MENU');
 if(d.wall==='gallery')for(let i=0;i<3;i++){frame(-2.75+i*.63,2.28,k-.48,['FRESH','LOCAL','MADE HERE'][i],.52,.38);const plate=cyl(group,p.white,-2.75+i*.63,2.28,k-.43,.07,.07,.015,20);plate.rotation.x=Math.PI/2;}
 if(d.wall==='clock'){const x=2.55,y=2.30,z=k-.44;const face=cyl(group,p.cream,x,y,z,.23,.23,.045,32);face.rotation.x=Math.PI/2;const rim=ring(group,p.gold,x,y,z+.027,.23,.014);box(group,p.dark,x,y+.055,z+.055,.018,.12,.014,.004);box(group,p.dark,x+.05,y,z+.055,.11,.018,.014,.004);}
 if(level>=4){box(group,p.glow,0,.14,4.27,1.28,.018,.06,.01);for(const x of [-1.05,1.05])box(group,p.gold,x,.17,4.18,.05,.04,.35,.009);}
 if(d.entrance==='lanterns')for(const x of [-1.13,1.13]){cyl(group,p.gold,x,1.12,4.27,.028,.028,1.7,12);cyl(group,p.gold,x,2.02,4.27,.13,.17,.10,16);ball(group,p.glow,x,1.88,4.27,.11,16);}
 if(d.entrance==='awning'){for(let i=0;i<10;i++)box(group,i%2?p.cream:p.team,-.9+i*.2,2.30,4.25,.20,.075,.42,.03);box(group,p.gold,0,2.25,4.43,2.04,.035,.035,.008);}
 if(d.celebration==='wreath'){for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const leaf=ball(group,p.leafDark,Math.sin(a)*.20,2.10+Math.cos(a)*.20,4.42,.062,10);leaf.scale.set(.5,1,.3);leaf.rotation.z=-a;}ball(group,p.gold,0,2.10,4.43,.075,12).scale.z=.3;}
 if(d.celebration==='rosette'){const r=ball(group,p.gold,0,2.1,4.42,.19,16);r.scale.z=.22;for(const x of [-.08,.08])box(group,p.team,x,1.86,4.42,.07,.24,.02,.012).rotation.z=x<0?-.15:.15;}

 mergeStatic(group);return group;
}
// Bounded, local geometry: weather lives outside the walkable floor and in
// the window recesses. One line buffer; no particles, textures or new lights.
export function createAtmosphereRain(root,p,plan,atmosphere,mergeStatic){
 const group=new THREE.Group();group.userData.atmosphereExterior=true;root.add(group);const fixed=new THREE.Group();group.add(fixed);
 const rainDay=atmosphere==='rain',dusk=atmosphere==='evening',mats=[],geos=[];
 const mat=(color,opacity=1)=>{const m=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,toneMapped:false});mats.push(m);return m;};
 const sky=mat(rainDay?'#718f9f':dusk?'#f3bf70':'#a9e5f1'),cloud=mat(rainDay?'#c0cbd0':dusk?'#b2a8b3':'#fff7e1'),paving=mat(rainDay?'#8caaa9':dusk?'#7b838e':'#d5d0b8'),shine=mat(rainDay?'#bedde0':'#ffd89b',rainDay?.42:.16),warm=mat('#ffc263',.34);
 const add=(geometry,material,x,y,z)=>{geos.push(geometry);const m=new THREE.Mesh(geometry,material);m.userData.ownedGeometry=true;m.position.set(x,y,z);fixed.add(m);return m;};
 const slab=(m,x,y,z,w,h,d)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const edge=5.12+plan.venue.extraWidth/2;
 slab(paving,0,-.06,5.0,10.5+plan.venue.extraWidth,.045,.9);
 for(const side of [-1,1])slab(paving,side*edge,-.06,plan.venue.centerZ,.65,.045,9.8+plan.venue.extraDepth);
 // Bright/cool window glass and silhouettes sit behind the existing mullions.
 for(const wx of [-3.1,0,3.1]){
  const x=wx*plan.venue.width/9.4,z=-4.235-plan.venue.extraDepth;
  slab(sky,x,1.30,z,1.20*plan.venue.width/9.4,1.42,.012);
  for(let i=0;i<3;i++){const c=add(new THREE.SphereGeometry(.21,10,6),cloud,x+(i-1)*.19,1.65+(i%2)*.09,z+.012);c.scale.set(1,.48,.06);}
  if(!rainDay){const sun=add(new THREE.SphereGeometry(dusk?.11:.15,12,8),mat(dusk?'#fff1be':'#ffe59c'),x+.30,1.88,z+.018);sun.scale.z=.05;}
 }
 // Exterior clouds are deliberately at the right edge, visible in portrait.
 const clouds=[];
 // Broad floor beams and an exterior sun remain legible from the overview.
 if(!rainDay&&!dusk){
  const gold=mat('#ffd272',.25),sun=mat('#ffe390'),ray=mat('#f6c46c');
  const x=-4.25-plan.venue.extraWidth*.35,z=plan.kitchenZ-.65;add(new THREE.SphereGeometry(.48,16,10),sun,x,3.05,z);
  for(let i=0;i<10;i++){const a=i*Math.PI/5,m=slab(ray,x+Math.sin(a)*.72,3.05+Math.cos(a)*.72,z,.065,.24,.045);m.rotation.z=-a;}
  for(const x of [-3.05,0,3.05]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([x-.55,.097,plan.kitchenZ+.65,x+.55,.097,plan.kitchenZ+.65,x+2.15,.097,plan.kitchenZ+4.65,x+.40,.097,plan.kitchenZ+4.65],3));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();add(g,gold,0,0,0);}
 }
 for(let j=0;j<(rainDay?3:2);j++){
  const c=new THREE.Group();c.userData.baseX=j===0?-edge:edge-.10;c.position.set(c.userData.baseX,1.8+j*.25,-2.4-j*.8-plan.venue.extraDepth*.35);group.add(c);clouds.push(c);
  for(let i=0;i<3;i++){const m=add(new THREE.SphereGeometry(.52,10,6),cloud,0,0,0);c.add(m);m.position.set((i-1)*.22,i%2*.12,0);m.scale.set(1,.8,.8);}
 }
 const puddles=[];
 if(rainDay)for(const [x,z]of [[-2.3,5.05],[2.7,4.9],[edge,-.1],[edge,2.3]]){
  const m=add(new THREE.CircleGeometry(.37,24),shine,x,-.029,z);m.rotation.x=-Math.PI/2;m.scale.set(1.6,.65,1);
  const r=add(new THREE.RingGeometry(.13,.143,24),mat('#d4eff0',.36),x,-.024,z);r.rotation.x=-Math.PI/2;group.add(r);puddles.push(r);
 }
 const lamp=dusk?mat('#ffdf91'):null;
 if(dusk){const pole=mat('#69776b');for(const x of [-1.05,1.05]){slab(pole,x,1.45,4.40,.07,1.4,.07);add(new THREE.SphereGeometry(.17,12,8),lamp,x,2.17,4.40);}for(const [x,z]of [[-1.1,3.4],[1.1,3.4],[-2.6,-.1],[2.6,-.1]]){const pool=add(new THREE.CircleGeometry(1.1,32),warm,x,.098,z);pool.rotation.x=-Math.PI/2;pool.scale.set(.8,1.15,1);}}
 if(mergeStatic){mergeStatic(fixed);clouds.forEach(c=>mergeStatic(c));}
 let lightStart=null,lightProgress=1;
 const count=rainDay?240:0,positions=new Float32Array(count*6),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.userData.atmosphereRain=true;
 const material=new THREE.LineBasicMaterial({color:'#d3edf6',transparent:true,opacity:.90,depthWrite:false}),rain=new THREE.LineSegments(geometry,material);rain.visible=rainDay;rain.userData.ownedGeometry=true;rain.frustumCulled=false;group.add(rain);
 return {group,mesh:rain,geometry,count,clouds,puddles,get lightProgress(){return lightProgress;},update(time=0,reduced=false){const t=reduced?0:time;
  if(dusk){if(lightStart===null&&!reduced)lightStart=time;lightProgress=reduced?1:Math.min(1,Math.max(0,(time-(lightStart??time))/1.1));warm.opacity=.08+.30*lightProgress;lamp.color.set(lightProgress>.75?'#ffe7aa':'#c8a87c');}
  for(let i=0;i<count;i++){let x,z,y;if(i<48){const w=Math.floor(i/16);x=(-3.1+w*3.1)*plan.venue.width/9.4+(i%16/16-.5)*1.10;y=.62+((i*.137-t*.65)%1+1)%1*1.35;z=-4.205-plan.venue.extraDepth;}else if(i<176){const side=i<112?1:-1,index=(i-48)%64;x=side*(edge+((i*.27)%1-.5)*.52);z=-4.0-plan.venue.extraDepth+index/64*(8.6+plan.venue.extraDepth);y=.30+((i*.173-t*.70)%1+1)%1*2.8;}else{x=-4.9+(i-176)/64*9.8;z=4.82+(i%3)*.15;y=.25+((i*.173-t*.75)%1+1)%1*2.8;}positions.set([x,y,z,x+.07,y-.38,z],i*6);}
  geometry.attributes.position.needsUpdate=true;clouds.forEach((c,i)=>c.position.x=c.userData.baseX+Math.sin(t*.09+i)*.08);puddles.forEach((r,i)=>{const phase=(t*.48+i*.23)%1;r.scale.setScalar(.5+phase*1.8);r.material.opacity=reduced?.26:(1-phase)*.32;});
 },dispose(){geometry.dispose();material.dispose();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());group.traverse(o=>{if(o.userData.merged)o.geometry.dispose();});group.removeFromParent();}};
}
