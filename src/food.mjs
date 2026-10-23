import {finishGeometry} from './geometry-finish.mjs';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RECIPES} from './menu.mjs';
const cache=new Map();
function geo(key,make){if(!cache.has(key)){const g=finishGeometry(make());if(key==='bun-dome'||key.startsWith('toasted-disc-')){const pos=g.attributes.position,col=g.attributes.color;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),m=.91+.07*Math.sin(x*53+z*27)*Math.sin(z*61-x*17)+.035*Math.sin(y*35);col.setXYZ(i,col.getX(i)*m,col.getY(i)*m,col.getZ(i)*m);}}if(!g.getAttribute('uv')){const p=g.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)+.5,p.getZ(i)+.5);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}g.userData.shared=true;cache.set(key,g);}return cache.get(key);}
function mesh(parent,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,m,x,y,z,w,h,d,r=.02)=>mesh(p,geo(`b${w},${h},${d},${r}`,()=>new RoundedBoxGeometry(w,h,d,r>=.02?2:1,Math.min(r,w/3,h/3,d/3))),m,x,y,z);
const ball=(p,m,x,y,z,r=.08)=>mesh(p,geo(`s${r}`,()=>new THREE.SphereGeometry(r,16,10)),m,x,y,z);
const disc=(p,m,x,y,z,r=.1,h=.025)=>mesh(p,geo(`c${r},${h}`,()=>new THREE.CylinderGeometry(r,r,h,28)),m,x,y,z);
const torus=(p,m,x,y,z,r=.1,t=.025)=>{const o=mesh(p,geo(`t${r},${t}`,()=>new THREE.TorusGeometry(r,t,6,r>.25?48:24)),m,x,y,z);o.rotation.x=Math.PI/2;return o;};
function cheeseFold(g,p,x=0,y=.10,z=0,size=.47){
 const a=size/2,points=[[-a,0,-a],[a,0,-a],[a,-.035,a*.78],[a*.67,-.06,a],[-a,0,a]],vertices=[0,.007,0],indices=[];
 for(const [x,y,z]of points)vertices.push(x,y,z);for(let i=1;i<=5;i++)indices.push(0,i===5?1:i+1,i);
 const bottom=vertices.length/3;for(let i=0;i<bottom;i++)vertices.push(vertices[i*3],vertices[i*3+1]-.012,vertices[i*3+2]);for(let i=1;i<=5;i++)indices.push(bottom,bottom+i,bottom+(i===5?1:i+1));
 for(let i=1;i<=5;i++){const next=i===5?1:i+1;indices.push(i,bottom+i,next,next,bottom+i,bottom+next);}
 const geometry=geo('draped-cheese-'+size,()=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;});return mesh(g,geometry,p.cheese,x,y,z);
}
function tomatoSlice(g,p,x,y,z,r=.11){disc(g,p.tomato,x,y,z,r,.03);disc(g,p.strawberry,x,y+.018,z,r*.76,.006);for(let i=0;i<4;i++){const a=i*Math.PI/2+.3,seed=ball(g,p.cream,x+Math.cos(a)*r*.47,y+.024,z+Math.sin(a)*r*.47,.009);seed.scale.set(1.4,.35,.65);seed.rotation.y=-a;}}
function toasted(g,p,x,y,z,r=.28,height=.015){
 const geometry=geo('toasted-disc-'+r+','+height,()=>{const geometry=finishGeometry(new THREE.CylinderGeometry(r,r,height,32)),positions=geometry.attributes.position,normals=geometry.attributes.normal,colors=geometry.attributes.color;for(let i=0;i<positions.count;i++){if(normals.getY(i)<.5)continue;const radius=Math.hypot(positions.getX(i),positions.getZ(i))/r,variation=.90+.10*radius;colors.setXYZ(i,variation,variation,variation);}return geometry;});return mesh(g,geometry,p.bread,x,y,z);
}
function syrupPool(g,p){const geometry=geo('syrup-pool',()=>{const path=new THREE.Shape();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,r=.20+Math.sin(a*3)*.012+Math.cos(a*5)*.009,x=Math.cos(a)*r,y=Math.sin(a)*r;i?path.lineTo(x,y):path.moveTo(x,y);}const geometry=new THREE.ShapeGeometry(path,32);geometry.rotateX(-Math.PI/2);return geometry;});mesh(g,geometry,p.syrup,0,.013,0);for(const [x,z]of [[-.16,.10],[.14,-.10]]){const drip=ball(g,p.syrup,x,-.005,z,.04);drip.scale.set(.8,.35,1.3);}}
function leaves(g,p,count=5,radius=.20){
 const shape=geo('curled-leaf',()=>{
  const vertices=[],indices=[];
  // A curved central rib and gently ruffled edge give leaves a real volume.
  for(let side=0;side<2;side++)for(let j=0;j<=8;j++)for(let i=0;i<=4;i++){
   const t=j/8,u=(i-2)/2,width=Math.sin(Math.PI*t)*.095*(1+.08*Math.sin(j*2.1));
   vertices.push(u*width,.006+Math.sin(Math.PI*t)*(.025-.018*Math.abs(u))+Math.sin(j*2.2)*Math.abs(u)*.006-side*.006,-.16+t*.29);
  }
  for(let side=0;side<2;side++)for(let j=0;j<8;j++)for(let i=0;i<4;i++){const a=side*45+j*5+i,b=a+5;indices.push(...(side?[a,a+1,b,a+1,b+1,b]:[a,b,a+1,a+1,b,b+1]));}
  const rim=[0,1,2,3,4,9,14,19,24,29,34,39,44,43,42,41,40,35,30,25,20,15,10,5];for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];indices.push(a,b,a+45,b,b+45,a+45);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
 for(let i=0;i<count;i++){
  const a=i*2.4,leaf=new THREE.Group();leaf.position.set(Math.cos(a)*radius,.025+i%2*.02,Math.sin(a)*radius);leaf.rotation.set(0,a,Math.sin(a)*.12);g.add(leaf);mesh(leaf,shape,i%2?p.leaf:p.leafDark);
  const vein=geo('leaf-vein',()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0,.009,-.145),new THREE.Vector3(0,.033,-.015),new THREE.Vector3(0,.01,.115)]),8,.0028,4,false));mesh(leaf,vein,i%2?p.leafDark:p.leaf);
 }
}
function berries(g,p){for(let i=0;i<5;i++){const a=i*2.4;ball(g,p.blueberry,Math.cos(a)*.20,.055,Math.sin(a)*.17,.055);}for(const [x,z]of [[-.12,-.06],[.1,.12]]){const o=ball(g,p.strawberry,x,.07,z,.085);o.scale.set(.8,1,.75);for(let i=0;i<4;i++)ball(g,p.yoghurt,x+Math.sin(i*2)*.055,.105,z+Math.cos(i*2)*.045,.008);}}
function cucumber(g,p,x,z,y=.025){disc(g,p.cucumberSkin,x,y,z,.10,.035);disc(g,p.cucumber,x,y+.020,z,.081,.009);for(let i=0;i<4;i++)disc(g,p.yoghurt,x+Math.sin(i*1.57)*.04,y+.026,z+Math.cos(i*1.57)*.04,.009,.004);}
function carrot(g,p,x,z,y=.03){disc(g,p.carrot,x,y,z,.055,.045);disc(g,p.soup,x,y+.025,z,.027,.005);}
function banana(g,p,x,z,y=.025){disc(g,p.banana,x,y,z,.075,.035);disc(g,p.yoghurt,x,y+.020,z,.041,.007);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;ball(g,p.crust,x+Math.cos(a)*.017,y+.025,z+Math.sin(a)*.017,.004).scale.set(.6,.3,1.5);}}
function pasta(g,p,count=9){
  const shape=geo('pasta-elbow',()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.075,0,-.035),new THREE.Vector3(-.045,.008,.035),new THREE.Vector3(.025,.012,.055),new THREE.Vector3(.075,0,.015)]),12,.024,8,false));
  for(let i=0;i<count;i++){const a=i*2.4,r=.06+(i%3)*.085,o=mesh(g,shape,p.pasta,Math.cos(a)*r,.03+Math.floor(i/6)*.025,Math.sin(a)*r);o.rotation.y=a;o.rotation.z=(i%3-.5)*.12;}
}
function mushroom(g,p,x,z,y=.05){const cap=ball(g,p.mushroom,x,y+.015,z,.085);cap.scale.set(1,.4,.9);box(g,p.mushroomGill,x,y-.035,z,.04,.06,.045,.01);torus(g,p.mushroomGill,x,y-.012,z,.058,.005);}
export function createFoodLayer(p,dishIndex,index,{motionParts=false}={}){
  const recipe=RECIPES[dishIndex%RECIPES.length],kind=recipe.layers[index],g=new THREE.Group();g.userData.ingredient=kind;g.userData.layer=index;
  if(kind==='bread'||kind==='bread-top'){box(g,p.crust,0,.04,0,.58,.08,.46,.055);box(g,p.bread,0,.058,0,.53,.055,.41,.045);if(kind==='bread-top'){for(const z of [-.12,0,.12]){box(g,p.crust,0,.088,z,.35,.005,.014,.002);for(const x of [-.17,-.055,.075,.18]){const seed=ball(g,p.cream,x,.092,z+.035,.008);seed.scale.set(1.6,.35,.65);}}}}
  if(kind==='garden-filling'){leaves(g,p,4,.15);for(const x of [-.13,.12]){tomatoSlice(g,p,x,.055,.02,.115);cucumber(g,p,x,-.1,.085);}cheeseFold(g,p,0,.10,.03,.44);}
  if(kind==='root-vegetables'){for(let i=0;i<5;i++){const a=i*2.4;carrot(g,p,Math.cos(a)*.20,Math.sin(a)*.17);box(g,p.potato,Math.cos(a+.7)*.20,.03,Math.sin(a+.7)*.17,.08,.06,.075,.015);}}
  if(kind==='golden-broth'||kind==='noodle-broth'){disc(g,p.soup,0,0,0,.365,.018);torus(g,p.soup,0,.007,0,.354,.009);for(let i=0;i<7;i++){const a=i*2.4;disc(g,p.gold,Math.cos(a)*.25,.012,Math.sin(a)*.25,.019,.004);}}
  if(kind==='soup-herbs'){leaves(g,p,4,.16);for(const x of [-.16,.08,.20])carrot(g,p,x,.04,.025);}
  if(kind==='yoghurt'){disc(g,p.yoghurt,0,.025,0,.29,.05);for(let i=0;i<3;i++)torus(g,p.cream,0,.052+i*.004,0,.06+i*.07,.012);}
  if(kind==='mixed-berries')berries(g,p);
  if(kind==='banana-mint'){for(let i=0;i<4;i++)banana(g,p,-.18+i*.115,-.13);leaves(g,p,2,.06);}
  if(kind==='bun-bottom'){disc(g,p.crust,0,.035,0,.30,.07);disc(g,p.bread,0,.075,0,.29,.025);}
  if(kind==='burger-filling'){disc(g,p.patty,0,.035,0,.285,.07);const cheese=cheeseFold(g,p,0,.078,0,.47);cheese.rotation.y=.3;leaves(g,p,5,.16);for(const x of [-.12,.12])tomatoSlice(g,p,x,.13,0,.14);}
  if(kind==='bun-top'){mesh(g,geo('bun-dome',()=>new THREE.SphereGeometry(.30,32,16,0,Math.PI*2,0,Math.PI/2)),p.bread).scale.y=.55;for(let i=0;i<12;i++){const a=i*2.4,r=.07+(i%3)*.06,o=ball(g,p.yoghurt,Math.cos(a)*r,.17*Math.sqrt(1-r*r/.09),Math.sin(a)*r,.012);o.scale.set(1.5,.4,.6);o.rotation.y=a;}}
  if(kind==='salad-leaves')leaves(g,p,7,.18);
  if(kind==='salad-vegetables'){for(const [x,z]of [[-.14,0],[.1,.14],[.11,-.15]]){cucumber(g,p,x,z);ball(g,p.tomato,x+.045,.06,z+.04,.062);}for(let i=0;i<7;i++)ball(g,p.cheese,Math.sin(i*2.4)*.25,.035,Math.cos(i*2.4)*.22,.027);}
  if(kind==='feta-carrot'){for(let i=0;i<5;i++){const a=i*2.4;box(g,p.yoghurt,Math.cos(a)*.21,.025,Math.sin(a)*.21,.055,.05,.055,.008);const ribbon=box(g,p.carrot,Math.cos(a+1)*.15,.022,Math.sin(a+1)*.15,.13,.012,.025,.004);ribbon.rotation.y=a;}leaves(g,p,2,.06);}
  if(kind==='pasta')pasta(g,p,11);
  if(kind==='mushroom-sauce'){disc(g,p.cream,0,.007,0,.25,.014);for(const [x,z]of [[-.17,-.08],[.13,-.14],[.1,.14],[-.12,.13]])mushroom(g,p,x,z);}
  if(kind==='parmesan-basil'){for(let i=0;i<12;i++){const a=i*2.4;box(g,p.yoghurt,Math.cos(a)*(.08+i%3*.07),.012,Math.sin(a)*.20,.05,.012,.013,.003).rotation.y=a;}leaves(g,p,3,.065);}
  if(kind==='pancakes'){for(let i=0;i<2;i++){disc(g,p.crust,0,.021+i*.049,0,.30,.042);toasted(g,p,0,.043+i*.049,0,.282,.009);}}
  if(kind==='pancake-banana'){disc(g,p.crust,0,.023,0,.29,.046);toasted(g,p,0,.048,0,.27,.008);for(let i=0;i<3;i++)banana(g,p,-.12+i*.12,-.07,.069);}
  if(kind==='berry-syrup'){syrupPool(g,p);berries(g,p);}
  if(kind==='noodles-carrot'){pasta(g,p,12);for(const x of [-.2,0,.2])carrot(g,p,x,.10,.06);}
  if(kind==='egg-scallion'){for(const x of [-.13,.14]){const egg=disc(g,p.egg,x,.025,0,.12,.045);egg.scale.z=.8;disc(g,p.yolk,x,.050,0,.061,.008);}for(let i=0;i<5;i++)torus(g,p.leaf,Math.sin(i*2.4)*.23,.025,Math.cos(i*2.4)*.23,.025,.009);}
  if(kind==='melon-grapes'){for(let i=0;i<5;i++){const a=i*2.4;box(g,p.melon,Math.cos(a)*.18,.04,Math.sin(a)*.18,.11,.08,.10,.015);ball(g,p.grape,Math.cos(a+.4)*.20,.05,Math.sin(a+.4)*.20,.06);}}
  if(kind==='apple-orange'){for(let i=0;i<4;i++){const a=i*1.57;const slice=disc(g,i%2?p.apple:p.orange,Math.cos(a)*.19,.03,Math.sin(a)*.19,.095,.045);slice.scale.z=.55;}}
  if(kind==='berries-cream'){berries(g,p);for(let i=0;i<3;i++){const cream=ball(g,p.yoghurt,.03,.035+i*.035,0,.075-i*.016);cream.scale.y=.6;}leaves(g,p,2,.025);}
  if(kind==='prep-lettuce')leaves(g,p,5,.15);
  if(kind==='prep-tomato')for(const x of [-.13,.12])tomatoSlice(g,p,x,.025,0,.115);
  if(kind==='prep-cheese')cheeseFold(g,p,0,.02,0,.44);
  if(kind==='prep-cucumber')for(const x of [-.16,0,.16])cucumber(g,p,x,.02);
  if(kind==='prep-patty')disc(g,p.patty,0,.035,0,.285,.07);
  if(kind==='prep-pasta')pasta(g,p,11);
  if(kind==='prep-mushrooms')for(const [x,z]of [[-.17,-.08],[.13,-.14],[.1,.14],[-.12,.13]])mushroom(g,p,x,z);
  if(kind==='prep-carrot')for(let i=0;i<5;i++)carrot(g,p,Math.sin(i*2.4)*.20,Math.cos(i*2.4)*.17);
  if(kind==='prep-mint')leaves(g,p,3,.065);
  if(kind==='prep-banana')for(let i=0;i<4;i++)banana(g,p,-.18+i*.12,-.03);
  if(kind==='prep-granola')for(let i=0;i<11;i++){const a=i*2.4;box(g,p.crust,Math.sin(a)*.23,.015,Math.cos(a)*.21,.035,.025,.027,.008);}
  if(kind==='prep-honey'){for(const z of [-.09,.01,.11])box(g,p.syrup,0,.007,z,.33,.014,.018,.006);}
  if(kind==='prep-feta')for(let i=0;i<5;i++){const a=i*2.4;box(g,p.yoghurt,Math.cos(a)*.21,.025,Math.sin(a)*.21,.055,.05,.055,.008);}
  if(kind==='prep-cream')disc(g,p.cream,0,.007,0,.25,.014);
  if(kind==='prep-parmesan')for(let i=0;i<12;i++){const a=i*2.4;box(g,p.yoghurt,Math.cos(a)*(.08+i%3*.07),.012,Math.sin(a)*.20,.05,.012,.013,.003).rotation.y=a;}
  if(kind==='prep-egg')for(const x of [-.13,.14]){disc(g,p.egg,x,.025,0,.12,.045).scale.z=.8;disc(g,p.yolk,x,.050,0,.061,.008);}
  if(kind==='prep-scallion')for(let i=0;i<7;i++)torus(g,p.leaf,Math.sin(i*2.4)*.22,.025,Math.cos(i*2.4)*.20,.025,.009);
  if(kind==='prep-cream-top')for(let i=0;i<3;i++)ball(g,p.yoghurt,.03,.02+i*.03,0,.065-i*.014).scale.y=.6;
  if(kind==='prep-butter-spread'||kind==='prep-burger-spread'){
    for(const z of [-.10,0,.10])box(g,kind==='prep-butter-spread'?p.cream:p.syrup,0,.008,z,.40,.016,.065,.016);
  }
  if(kind==='prep-peppers')for(let i=0;i<5;i++){const a=i*2.4;box(g,p.carrot,Math.cos(a)*.17,.016,Math.sin(a)*.15,.13,.025,.032,.01).rotation.y=a;}
  if(kind==='prep-dressing')for(const z of [-.10,0,.10])box(g,p.cream,0,.008,z,.34,.012,.013,.004);
  if(kind==='prep-corn')for(let i=0;i<9;i++){const a=i*2.4;ball(g,p.gold,Math.sin(a)*.22,.014,Math.cos(a)*.20,.026).scale.set(.8,.7,1.1);}
  if(kind==='prep-peas')for(let i=0;i<8;i++){const a=i*2.4;ball(g,p.leaf,Math.sin(a)*.21,.018,Math.cos(a)*.19,.029);}
  if(kind==='prep-croutons')for(let i=0;i<5;i++){const a=i*2.4;box(g,p.crust,Math.sin(a)*.21,.022,Math.cos(a)*.18,.065,.043,.06,.012).rotation.y=a;}
  if(kind==='prep-compote'){disc(g,p.strawberry,0,.01,0,.25,.02);for(let i=0;i<4;i++)ball(g,p.blueberry,Math.sin(i*2.4)*.17,.024,Math.cos(i*2.4)*.17,.027);}
  if(kind==='prep-apple')for(let i=0;i<4;i++){const a=i*1.57;disc(g,p.apple,Math.cos(a)*.19,.022,Math.sin(a)*.17,.08,.035).scale.z=.55;}
  if(kind==='prep-nuts')for(let i=0;i<7;i++){const a=i*2.4;const nut=ball(g,p.crust,Math.sin(a)*.22,.018,Math.cos(a)*.19,.032);nut.scale.set(1.3,.65,.65);nut.rotation.y=a;}
  if(kind==='prep-onion')for(const x of [-.12,.12])torus(g,p.cream,x,.012,0,.095,.015);
  if(kind==='prep-pickles')for(const x of [-.14,0,.14])cucumber(g,p,x,-.03);
  if(kind==='prep-spinach')leaves(g,p,4,.15);
  if(kind==='prep-pepper')for(let i=0;i<11;i++){const a=i*2.4;ball(g,p.patty,Math.sin(a)*.23,.007,Math.cos(a)*.20,.008);}
  if(kind==='prep-butter'){const pat=box(g,p.banana,.02,.015,.015,.12,.03,.105,.012);pat.rotation.y=.25;}
  if(kind==='prep-sesame')for(let i=0;i<12;i++){const a=i*2.4;const seed=ball(g,p.cream,Math.sin(a)*.24,.008,Math.cos(a)*.21,.012);seed.scale.set(1.4,.3,.6);seed.rotation.y=a;}
  if(kind==='prep-kiwi')for(const x of [-.14,.12]){disc(g,p.cucumberSkin,x,.017,0,.105,.034);disc(g,p.cucumber,x,.038,0,.091,.009);disc(g,p.cream,x,.044,0,.025,.004);for(let i=0;i<7;i++){const a=i*.9;ball(g,p.patty,x+Math.sin(a)*.053,.049,Math.cos(a)*.053,.006);}}
  return batchFood(g,kind,p,motionParts);
}
// Cache material batches per ingredient. Seeds and veins add shape without a
// draw call each; semantic layer groups and shared-geometry ownership survive.
function batchFood(g,kind,p,motionParts=false){
 g.updateMatrixWorld(true);
 if(motionParts){g.prepParts=[];g.traverse(o=>{if(!o.isMesh)return;let top=o;while(top.parent!==g)top=top.parent;g.prepParts.push({geometry:o.geometry,material:o.material,matrix:o.matrixWorld.clone(),pivot:top.position.clone(),piece:g.children.indexOf(top)});});}
 const groups=new Map();g.traverse(o=>{if(!o.isMesh)return;let list=groups.get(o.material);if(!list)groups.set(o.material,list=[]);list.push(o);});g.clear();
 for(const [mat,objects]of groups){const role=Object.keys(p).find(k=>p[k]===mat);const geometry=geo('food-batch-'+kind+'-'+role,()=>{const list=objects.map(o=>{const c=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();return c.applyMatrix4(o.matrixWorld);}),merged=mergeGeometries(list,false);list.forEach(c=>c.dispose());return merged;});mesh(g,geometry,mat);}
 return g;
}
export function createVessel(p,type){
  const g=new THREE.Group();g.userData.container=type;
  if(type==='plate'){
    mesh(g,geo('porcelain-plate',()=>new THREE.LatheGeometry([[0,.015],[.32,.015],[.425,.032],[.46,.055],[.457,.069],[.425,.074],[.35,.049],[0,.049]].map(([x,y])=>new THREE.Vector2(x,y)),48)),p.white);
    disc(g,p.cream,0,.052,0,.335,.012);torus(g,p.white,0,.017,0,.295,.012);torus(g,p.gold,0,.078,0,.437,.0035);if(p.recoveryLevel>=3)torus(g,p.team,0,.075,0,.405,.003);
  }
  else if(type==='pot'){mesh(g,geo('pot-open',()=>new THREE.CylinderGeometry(.41,.35,.36,32,1,true)),p.metal,0,.18,0);disc(g,p.dark,0,.02,0,.35,.025);torus(g,p.metal,0,.36,0,.41,.025);for(const x of [-.49,.49]){box(g,p.darkWood,x,.25,0,.21,.07,.12,.035);for(const z of [-.035,.035])ball(g,p.metal,Math.sign(x)*.401,.27,z,.014);}torus(g,p.metal,0,.045,0,.359,.012);}
  else{mesh(g,geo('bowl',()=>new THREE.LatheGeometry([[0,.03],[.12,.03],[.26,.12],[.40,.33],[.405,.35],[.38,.36],[.36,.32],[.235,.13],[.10,.07],[0,.07]].map(([x,y])=>new THREE.Vector2(x,y)),40)),p.white);torus(g,p.cream,0,.35,0,.39,.018);torus(g,p.white,0,.026,0,.13,.014);torus(g,p.gold,0,.371,0,.39,.0035);}
  return g;
}
export function createFinishedDish(p,dishIndex){const recipe=RECIPES[dishIndex%RECIPES.length],g=new THREE.Group(),vessel=createVessel(p,recipe.container);g.add(vessel);g.userData.finishedDish=recipe.id;recipe.layers.forEach((_,i)=>{const layer=createFoodLayer(p,dishIndex,i);layer.position.y=(recipe.container==='plate'?.065:0)+recipe.heights[i];g.add(layer);});return g;}

// All earlier accepted ingredients are restored on the same vessel at phase changes/refits.
// Ingredient-to-block assignments remain independent of grammatical order.
export function createPrepBase(p,dishIndex,phase=0){
  const g=new THREE.Group();
  for(let i=0;i<phase*3;i++){const layer=createFoodLayer(p,dishIndex,i);layer.position.y=RECIPES[dishIndex].heights[i];g.add(layer);}
  g.userData.prepBase=true;return g;
}
export function createPrepIngredient(p,dishIndex,piece){
  const g=createFoodLayer(p,dishIndex,piece,{motionParts:true});g.userData.prepPiece=piece;
  g.userData.pour=['golden-broth','noodle-broth','prep-cream','prep-honey','prep-dressing','yoghurt'].includes(RECIPES[dishIndex].layers[piece]);return g;
}
export function createPrepJug(p,dishIndex,piece=1){
  const g=new THREE.Group(),kind=RECIPES[dishIndex].layers[piece],liquid=kind==='prep-honey'?p.syrup:['prep-cream','prep-dressing','yoghurt'].includes(kind)?p.cream:p.soup;
  mesh(g,geo('prep-jug-open',()=>new THREE.CylinderGeometry(.155,.115,.28,28,1,true)),p.white,0,.15,0);disc(g,p.white,0,.018,0,.115,.026);disc(g,liquid,0,.225,0,.140,.012);
  const lip=torus(g,p.cream,0,.29,0,.154,.014);const handle=torus(g,p.white,.18,.16,0,.085,.021);handle.rotation.set(0,Math.PI/2,0);const spout=box(g,p.white,0,.285,-.15,.12,.028,.14,.012);spout.rotation.x=-.18;
  g.userData.pour=true;g.userData.container='ingredient-jug';return g;
}
