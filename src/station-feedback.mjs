import * as THREE from 'three';

// Bounded, event-driven feedback. No game rules, lights, textures or idle emission.
export class StationFeedback {
 constructor(parent){this.parent=parent;this.root=new THREE.Group();this.root.name='station-feedback';parent.add(this.root);this.batches=new Map();this.materials=new Set();this.geometries=new Set();this.dummy=new THREE.Object3D();this.stamps=[];this.ripples=[];this.finishes=[];}
 geometry(g){g.userData.shared=true;this.geometries.add(g);return g;}
 material(color,extra={}){const m=new THREE.MeshBasicMaterial({color,...extra});this.materials.add(m);return m;}
 emit(kind,worldPoint,scale=1){
  if(!['steam','crumbs'].includes(kind))return;
  let batch=this.batches.get(kind);
  if(!batch){const steam=kind==='steam',capacity=steam?8:10,geometry=this.geometry(steam?new THREE.SphereGeometry(1,8,6):new THREE.BoxGeometry(1,1,1)),material=this.material(steam?'#f6f3e8':'#b78b51',steam?{transparent:true,opacity:.22,depthWrite:false}:{}),mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.feedback=kind;this.root.add(mesh);batch={mesh,capacity,particles:[]};this.batches.set(kind,batch);}
  const origin=this.parent.worldToLocal(worldPoint.clone());batch.particles=Array.from({length:batch.capacity},(_,i)=>{const a=i*2.4,steam=kind==='steam';return {origin:origin.clone().add(new THREE.Vector3(Math.cos(a)*.09*scale,.035*scale,Math.sin(a)*.09*scale)),velocity:new THREE.Vector3(Math.cos(a)*(steam?.05:.34),steam?.35:.18+Math.abs(Math.sin(a))*.12,Math.sin(a)*(steam?.05:.34)).multiplyScalar(scale),age:0,life:steam?.66+i*.025:.36+i*.006,size:(steam?.04+i%3*.012:.017+i%3*.004)*scale,steam};});this.update(0);
 }
 stamp(parent,position,scale=1,{front=false,animate=true}={}){
  if(!this.sealGeometry){this.sealGeometry=this.geometry(new THREE.CylinderGeometry(.075,.075,.014,12));this.checkGeometry=this.geometry(new THREE.BoxGeometry(1,.009,.014));this.sealMaterial=this.material('#46715b');this.checkMaterial=this.material('#fff3cf');}
  const group=new THREE.Group();group.position.copy(position);if(front)group.rotation.x=Math.PI/2;parent.add(group);group.userData.approvalSeal=true;
  group.add(new THREE.Mesh(this.sealGeometry,this.sealMaterial));
  for(const [x,z,width,angle]of [[-.024,.006,.036,-.65],[.014,-.006,.064,.65]]){const check=new THREE.Mesh(this.checkGeometry,this.checkMaterial);check.position.set(x,.012,z);check.scale.x=width;check.rotation.y=angle;group.add(check);}
  group.userData.finalScale=scale;group.scale.setScalar(animate?.25*scale:scale);if(animate)this.stamps.push({group,elapsed:0});return group;
 }
 ripple(parent,radius=.45,{height=.065}={}){
  if(!this.rippleMesh){const geo=this.geometry(new THREE.RingGeometry(.94,1,40)),mat=this.material('#e7d3a3',{transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});this.rippleMesh=new THREE.Mesh(geo,mat);this.rippleMesh.rotation.x=-Math.PI/2;this.rippleMesh.renderOrder=2;}
  parent.add(this.rippleMesh);this.rippleMesh.position.set(0,height,0);this.rippleMesh.visible=true;this.rippleMesh.scale.setScalar(radius);this.ripples=[{mesh:this.rippleMesh,elapsed:0,radius}];
 }
 finish(parent,{radius=.43,height=.083,final=false}={}){
  if(!this.finishArc){this.finishArc=new THREE.Mesh(this.geometry(new THREE.RingGeometry(.97,1,48,1,0,Math.PI*.7)),this.material('#f4d693',{transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));this.finishArc.rotation.x=-Math.PI/2;this.finishArc.userData.preparationFinish=true;}
  parent.add(this.finishArc);this.finishArc.position.set(0,height,0);this.finishArc.scale.setScalar(radius);this.finishArc.visible=true;this.finishes=[{elapsed:0,final}];
 }
 update(dt,reduced=false){
  for(const f of this.finishes){f.elapsed+=dt;const t=reduced?1:Math.min(1,f.elapsed/.38);this.finishArc.rotation.z=-.8+t*1.4;this.finishArc.material.opacity=Math.sin(t*Math.PI)*(f.final?.8:.45);if(t===1)this.finishArc.visible=false;}this.finishes=this.finishes.filter(f=>!reduced&&f.elapsed<.38);

  for(const r of this.ripples){r.elapsed+=dt;const t=reduced?1:Math.min(1,r.elapsed/.42);r.mesh.scale.setScalar(r.radius*(.92+t*.20));r.mesh.material.opacity=Math.sin(t*Math.PI)*.35;if(t===1)r.mesh.visible=false;}this.ripples=this.ripples.filter(r=>!reduced&&r.elapsed<.42);
  for(const batch of this.batches.values()){
   if(!batch.particles.length)continue;
   if(reduced)batch.particles=[];
   batch.particles=batch.particles.filter(p=>(p.age+=dt)<p.life);batch.mesh.visible=!!batch.particles.length;batch.mesh.count=batch.particles.length;
   batch.particles.forEach((p,i)=>{const t=p.age/p.life;this.dummy.position.copy(p.origin).addScaledVector(p.velocity,p.age);if(!p.steam)this.dummy.position.y-=.7*p.age*p.age;else this.dummy.position.x+=Math.sin(t*Math.PI*1.5+i)*p.size*.55;this.dummy.rotation.set(p.steam?0:t*2,p.steam?0:t*3,0);this.dummy.scale.setScalar(p.size*(p.steam?(.6+t*1.5)*(1-t):1-t*.8));if(p.steam){this.dummy.scale.x*=.65;this.dummy.scale.y*=1.6;this.dummy.scale.z*=.65;}this.dummy.updateMatrix();batch.mesh.setMatrixAt(i,this.dummy.matrix);});batch.mesh.instanceMatrix.needsUpdate=true;
  }
  for(const stamp of this.stamps){stamp.elapsed+=dt;const t=reduced?1:Math.min(1,stamp.elapsed/.24);stamp.group.scale.setScalar(stamp.group.userData.finalScale*(.25+.75*(1-Math.pow(1-t,3))));}this.stamps=this.stamps.filter(s=>!reduced&&s.elapsed<.24);
 }
 dispose(){for(const b of this.batches.values())b.mesh.dispose();this.geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.rippleMesh?.removeFromParent();this.finishArc?.removeFromParent();this.finishes=[];this.ripples=[];this.root.removeFromParent();this.batches.clear();this.stamps=[];}
}
