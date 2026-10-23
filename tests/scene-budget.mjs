// Preserve the pre-neighbourhood room budget, then account for scenery and
// hidden walking alternatives separately. Every mesh belongs to one scope.
export function sceneBudget(world){
 const walking=new Set(world.tables.flatMap(t=>[t.guest?.standingLegs,t.friend?.standingLegs]).filter(Boolean));
 const result={room:{meshes:0,triangles:0},exterior:{meshes:0,triangles:0},walking:{meshes:0,triangles:0},total:{meshes:0,triangles:0}};
 world.root.traverse(o=>{
  if(!o.isMesh)return;let scope='room';for(let p=o;p;p=p.parent){if(p===world.neighbourhood?.group){scope='exterior';break;}if(walking.has(p)){scope='walking';break;}}
  const triangles=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);
  for(const key of [scope,'total']){result[key].meshes++;result[key].triangles+=triangles;}
 });return result;
}
