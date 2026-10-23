import * as THREE from 'three';

// Four small, locally generated material maps per restaurant. No asset fetches,
// per-prop canvases or post-processing. Material ownership stays with the world.
function texture(size,draw){
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext?.('2d');if(!ctx)return null;draw(ctx,size);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=2;return map;
}
export function finishPalette(p,{arena='courtyard'}={}){
  const wood=texture(256,(c,n)=>{c.fillStyle='#fffaf2';c.fillRect(0,0,n,n);for(let i=0;i<24;i++){const x=i*11;c.strokeStyle=i%3?'#7a62450d':'#ffffff55';c.lineWidth=i%4?1:2;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x+5,70,x-6,160,x+2,n);c.stroke();}});
  const linen=texture(128,(c,n)=>{c.fillStyle='#fffdf8';c.fillRect(0,0,n,n);c.fillStyle='#77725b0b';for(let i=0;i<n;i+=6){c.fillRect(i,0,1,n);c.fillRect(0,i,n,1);}});
  const paper=texture(128,(c,n)=>{c.fillStyle='#fffdf8';c.fillRect(0,0,n,n);c.fillStyle='#9b80500a';for(let i=0;i<360;i++)c.fillRect(i*37%n,i*53%n,1,1);});
  for(const key of ['wood','woodLight','darkWood']){p[key].map=wood;p[key].roughness=.72;}
  p.cream.map=paper;p.cream.roughness=.96;
  for(const m of [p.team,...p.clothes]){m.map=linen;m.roughness=.91;}
  if(p.floor)p.floor.roughness=.92;
  p.white.roughness=.26;p.glass.roughness=.24;p.metal.roughness=.36;p.gold.roughness=.30;p.gold.metalness=.68;
  // Every surface has a material role. Food stays saturated, matte paper stays
  // quiet, and metallic trims catch the broad studio light instead of glitter.
  for(const value of Object.values(p))for(const m of Array.isArray(value)?value:[value])if(m?.isMeshStandardMaterial){m.vertexColors=true;m.envMapIntensity=.50;}
  for(const key of ['soup','syrup'])p[key].roughness=.25;
  for(const key of ['strawberry','blueberry','grape','tomato'])p[key].roughness=.38;
  for(const key of ['yoghurt','egg','banana','cheese'])p[key].roughness=.52;
  for(const key of ['bread','crust','pasta','potato'])p[key].roughness=.86;
  p.chefCloth=p.white.clone();p.chefCloth.map=linen;p.chefCloth.roughness=.88;p.chefCloth.envMapIntensity=.28;
  p.chefLeather=p.dark.clone();p.chefLeather.roughness=.48;p.chefLeather.envMapIntensity=.55;
  p.chefFabric=p.chefCloth.clone();p.chefFabric.color.set('#ffffff');
  p.chefHardware=p.metal.clone();p.chefHardware.color.set('#ffffff');p.chefHardware.metalness=.48;
  p.chefSole=p.chefLeather.clone();p.chefSole.color.set('#ffffff');
  p.white.envMapIntensity=.65;p.metal.envMapIntensity=.85;p.gold.envMapIntensity=.75;
  for(const m of p.skins)m.roughness=.86;
  for(const m of p.hairs)m.roughness=.72;
  // Two shared packaging finishes, rather than glossy ceramic cartons or wood
  // grain printed over every paper bag. Reuse the existing paper texture.
  p.kraft=p.woodLight.clone();p.kraft.color.set('#c69b6b');p.kraft.map=paper;p.kraft.roughness=.95;p.kraft.envMapIntensity=.18;
  p.carton=p.white.clone();p.carton.map=paper;p.carton.roughness=.90;p.carton.envMapIntensity=.22;
  p.upholstery=p.green.clone();p.upholstery.map=linen;p.upholstery.color.set(arena==='bistro'?'#b95d45':arena==='banquet'?'#496356':'#68816a');p.upholstery.roughness=.94;p.upholstery.envMapIntensity=.18;
  p.tableLinen=p.cream.clone();p.tableLinen.map=linen;p.tableLinen.roughness=.96;
  p.runnerFabric=p.green.clone();p.runnerFabric.map=linen;p.runnerFabric.roughness=.93;
  // Glazed enamel and satin metal use broad reflections rather than extra lights.
  if(arena==='bistro'){p.green.roughness=.28;p.green.envMapIntensity=.7;}
  p.metal.roughnessMap=wood;
  const contact=texture(128,(c,n)=>{const g=c.createRadialGradient(n/2,n/2,5,n/2,n/2,n/2);g.addColorStop(0,'#322b2580');g.addColorStop(.48,'#322b2540');g.addColorStop(1,'#322b2500');c.fillStyle=g;c.fillRect(0,0,n,n);});
  p.contact=new THREE.MeshBasicMaterial({map:contact,color:contact?'#ffffff':'#534434',transparent:true,opacity:contact?.30:.07,depthWrite:false,toneMapped:false});p.contact.userData.contact=true;
  return p;
}
let contactGeometry;
export function contactShadow(parent,p,x,y,z,width,depth){
  contactGeometry??=new THREE.PlaneGeometry(1,1);contactGeometry.userData.shared=true;
  const shadow=new THREE.Mesh(contactGeometry,p.contact);shadow.rotation.x=-Math.PI/2;shadow.position.set(x,y,z);shadow.scale.set(width,depth,1);shadow.renderOrder=1;parent.add(shadow);return shadow;
}
export function dressRestaurant(root,p,{arena,backdrop=root,venue={extraWidth:0,extraDepth:0,centerZ:0},plan,tables,box,cyl,ring}){
  const daylight=new THREE.MeshBasicMaterial({color:arena==='banquet'?'#eeeafa':'#fff3d6',transparent:true,opacity:arena==='bistro'?.08:.12,depthWrite:false,toneMapped:false});daylight.userData.contact=true;p.daylight=daylight;
  for(const x of [-3.1,0,3.1]){const vertices=[x-.52,.085,-3.86,x+.52,.085,-3.86,x+1.24,.085,-1.5,x-.03,.085,-1.5],geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex([0,2,1,0,3,2]);geometry.computeVertexNormals();const light=new THREE.Mesh(geometry,daylight);light.userData.daylight=true;light.userData.ownedGeometry=true;backdrop.add(light);}
  // Architectural rhythm and joinery, batched with the existing room by material.
  for(let i=0;i<18;i++)box(backdrop,p.wood,-4.08+i*.48,.48,-4.375,.027,.76,.028,.004);
  box(backdrop,p.woodLight,0,.92,-4.36,8.9,.055,.045,.008);
  // Large, quiet details give the room an intentional silhouette. All of these
  // join the existing material batches; no new material or light per prop.
  for(const x of [-4.35,4.35]){
    box(root,p.darkWood,x+Math.sign(x)*venue.extraWidth/2,.135,venue.centerZ,.12,.035,8.65+venue.extraDepth,.015);
    box(root,p.woodLight,x+(.08+venue.extraWidth/2)*Math.sign(x),.14,venue.centerZ,.025,.025,8.65+venue.extraDepth,.006);
  }
  for(const z of [-4.24,4.20])box(root,p.darkWood,0,.135,z<0?z-venue.extraDepth:z,8.75+venue.extraWidth,.035,.10,.012);
  box(backdrop,p.cream,0,1.04,-4.365,8.8,.045,.05,.008);
  // A restrained, scalloped back-wall band belongs to the architecture rather
  // than the interaction surfaces, so it cannot obscure station controls.
  for(const x of [-4.28,-1.58,1.58,4.28]){
    box(backdrop,p.woodLight,x,1.62,-4.19,.085,1.04,.07,.018);
    box(backdrop,p.gold,x,2.15,-4.16,.13,.035,.10,.009);
  }
  // Contact shadows follow the same floor plan as the physical fixtures.
  for(const f of plan.fixtures)contactShadow(root,p,f.x,.094,f.z,f.width+.25,f.depth+.20);
  for(const x of [-3.1,0,3.1]){box(backdrop,p.glass,x,1.45,-4.235,1.24,1.15,.012,.025);box(backdrop,p.wood,x,1.42,-4.19,1.31,.042,.04,.005);}
  for(const t of tables){
    if(arena==='banquet'){box(root,p.tableLinen,t.x,1.077,t.z,1.36,.012,.96,.04);for(const side of [-1,1])box(root,p.tableLinen,t.x,.99,t.z+side*.465,1.34,.17,.018,.025);}
    contactShadow(root,p,t.x,.091,t.z,1.8,1.45);
    const runner=box(root,p.runnerFabric,t.x,1.088,t.z,.34,.008,.84,.014);runner.userData.fabric=true;
    for(const dx of [-.145,.145])box(root,p.cream,t.x+dx,1.094,t.z,.009,.004,.81,.002);
    // Turned apron and foot detail: more crafted tables without more objects
    // after the static-material merge.
    box(root,p.darkWood,t.x,.902,t.z,1.25,.065,.90,.05);
    for(const dx of [-.57,.57])box(root,p.woodLight,t.x+dx,.95,t.z,.022,.045,.76,.006);
    cyl(root,p.woodLight,t.x,.22,t.z,.135,.17,.055,12);
  }
  if(arena==='courtyard'){
    for(let i=0;i<12;i++){const x=-2.65+i*.48;box(backdrop,i%2?p.cream:p.green,x,2.36,-4.12,.47,.16,.32,.045);}
    // Ivory awning hem and olive window boxes make this the light, airy café.
    box(backdrop,p.cream,0,2.27,-3.965,5.77,.035,.035,.01);
    for(const x of [-3.1,3.1]){box(backdrop,p.terra,x,.62,-4.0,1.25,.18,.25,.035);for(let i=0;i<5;i++)box(backdrop,i%2?p.leaf:p.leafDark,x-.48+i*.24,.77,-3.99,.25,.16,.26,.06);}
  }else if(arena==='bistro'){
    box(backdrop,p.darkWood,-1.52,1.85,-4.18,.68,.72,.065,.035);box(backdrop,p.dark,-1.52,1.85,-4.135,.57,.61,.02,.02);
    for(let i=0;i<3;i++){box(backdrop,p.cream,-1.58,2.02-i*.14,-4.12,.30-i*.05,.018,.008,.003);cyl(backdrop,p.gold,-1.33,2.02-i*.14,-4.105,.025,.025,.012,8).rotation.x=Math.PI/2;}
    box(backdrop,p.woodLight,1.58,1.63,-4.13,.72,.065,.25,.012);for(const x of [1.38,1.66]){cyl(backdrop,p.white,x,1.75,-4.10,.075,.06,.17,12);ring(backdrop,p.gold,x,1.79,-4.10,.078,.007).rotation.x=Math.PI/2;}
    for(const x of [-4.22,4.22]){box(backdrop,p.darkWood,x,1.43,-4.06,.23,1.28,.10,.025);box(backdrop,p.gold,x,2.03,-3.99,.28,.04,.09,.01);box(backdrop,p.cream,x,1.62,-3.99,.12,.45,.035,.016);}
  }else{
    for(const x of [-1.55,1.55]){box(backdrop,p.green,x,1.80,-4.20,.48,1.04,.026,.012);box(backdrop,p.gold,x,2.32,-4.17,.57,.045,.045,.008);box(backdrop,p.gold,x,1.28,-4.17,.48,.03,.03,.004);}
    // A few generous brass accents feel ceremonial without covering the room.
    for(const x of [-3.1,0,3.1])box(backdrop,p.gold,x,.58,-4.11,1.60,.025,.035,.005);
    for(const x of [-4.24,4.24]){box(backdrop,p.gold,x,1.66,-4.10,.05,.86,.035,.01);for(const dx of [-.11,.11])cyl(backdrop,p.cream,x+dx,2.08,-4.08,.035,.035,.20,10);}
  }
}
