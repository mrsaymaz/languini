import * as THREE from 'three';
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>1-Math.pow(1-clamp(t),3);
const liquids=new Set(['golden-broth','noodle-broth','yoghurt','prep-cream','prep-honey','prep-dressing']);
const leaves=new Set(['salad-leaves','prep-lettuce','prep-spinach','prep-mint']);
const sprinkle=new Set(['prep-granola','prep-nuts','prep-parmesan','prep-pepper','prep-sesame','prep-scallion','prep-croutons','prep-corn','prep-peas']);
export function preparationProfile(dish,piece){
 const kind=dish.layers[piece],type=liquids.has(kind)?'pour':leaves.has(kind)?'tumble':sprinkle.has(kind)?'sprinkle':['garden','burger','pancakes'].includes(dish.id)?'stack':'arrange';
 return{kind,type,duration:type==='pour'?.46:.40,hot:['golden-broth','noodle-broth','prep-patty','bread','bread-top','bun-top','pancakes','pasta'].includes(kind),crunch:['bread','bread-top','bun-bottom','bun-top','pancakes','prep-granola','prep-croutons','prep-nuts'].includes(kind)};
}
// Animate existing ingredient components in a few instanced batches. The shared
// food geometry stays untouched; the canonical batched layer returns on landing.
function componentRig(portion,parent){
 const parts=portion.prepParts;if(!parts?.length)return null;
 const root=new THREE.Group(),batches=new Map();root.name='ingredient-tumble';parent.add(root);
 for(const part of parts){const key=part.geometry.uuid+part.material.uuid;let batch=batches.get(key);if(!batch)batches.set(key,batch={geometry:part.geometry,material:part.material,parts:[]});batch.parts.push(part);}
 if(batches.size>12){root.removeFromParent();return null;}
 for(const b of batches.values()){b.mesh=new THREE.InstancedMesh(b.geometry,b.material,b.parts.length);b.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);b.mesh.frustumCulled=false;b.mesh.castShadow=true;b.mesh.receiveShadow=true;root.add(b.mesh);}
 const matrix=new THREE.Matrix4(),shift=new THREE.Matrix4(),rotation=new THREE.Matrix4(),back=new THREE.Matrix4(),axis=new THREE.Vector3();
 return{root,batches,update(t){for(const b of batches.values()){b.parts.forEach((part,i)=>{const seed=part.piece*2.39996,progress=clamp((t-(part.piece%5)*.018)/.89),wave=Math.sin(progress*Math.PI)*(1-progress*.35),pivot=part.pivot;
   axis.set(Math.cos(seed),.25,Math.sin(seed)).normalize();rotation.makeRotationAxis(axis,wave*.9);shift.makeTranslation(pivot.x+Math.sin(seed)*wave*.045,pivot.y+wave*(.075+part.piece%3*.018),pivot.z+Math.cos(seed)*wave*.045);back.makeTranslation(-pivot.x,-pivot.y,-pivot.z);
   matrix.copy(shift).multiply(rotation).multiply(back).multiply(part.matrix);b.mesh.setMatrixAt(i,matrix);
  });b.mesh.instanceMatrix.needsUpdate=true;}},dispose(){for(const b of batches.values())b.mesh.dispose();root.removeFromParent();}};
}
export function animatePreparation(s,{tray,clone,from,to,local,index,land}){
 const profile=preparationProfile(s.dish,tray.piece);tray.preparation=profile;
 const initial=tray.asset.getWorldScale(new THREE.Vector3()),landing=s.contents.getWorldScale(new THREE.Vector3()),foodChildren=[...clone.children];
 const scatter=profile.type==='tumble'||profile.type==='sprinkle',rig=scatter?componentRig(tray.portion,clone):null;
 if(rig){for(const child of foodChildren)child.visible=false;rig.update(0);}
 // Liquid stays over the vessel and grows from the impact point. A soup disc
 // no longer flies across the work board as if it were a solid ingredient.
 if(profile.type==='pour'){clone.position.copy(to);clone.scale.copy(landing).multiply(new THREE.Vector3(.08,.08,.08));}
 else clone.scale.copy(initial);
 s.prepAction(index,to,profile.type==='pour',scatter);
 const toolMotion=s.motions.at(-1);if(toolMotion)toolMotion.duration=profile.duration;
 const tool=s.prepTools[index];if(scatter&&tool)tool.visible=false;
 s.motions.push({duration:profile.duration,preparation:true,run:t=>{
  const e=ease(t);
  if(profile.type==='pour'){const fill=ease((t-.13)/.87);clone.position.copy(to);clone.scale.copy(landing).multiply(new THREE.Vector3(.08+.92*fill,.08+.92*fill,.08+.92*fill));}
  else{clone.position.lerpVectors(from,to,e);clone.position.y+=Math.sin(t*Math.PI)*(scatter?.16:.22);clone.scale.lerpVectors(initial,landing,e);clone.rotation.z=Math.sin(t*Math.PI)*(profile.type==='stack'?.035:.065);}
  rig?.update(t);
 },done:()=>{rig?.dispose();for(const child of foodChildren)child.visible=true;clone.rotation.set(0,0,0);land();
   // Only a new layer settles; earlier layers and sentence papers stay fixed.
   if(profile.type==='stack')s.motions.push({duration:.14,run:t=>clone.scale.y=1-Math.sin(t*Math.PI)*.055,done:()=>clone.scale.set(1,1,1)});
 }});
}
