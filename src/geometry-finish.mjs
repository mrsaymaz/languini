import * as THREE from 'three';

// Quiet, baked form shading survives Light mode without a post-processing pass.
// Never move vertices: station projection, pickup and language surfaces keep
// their exact geometry. Shared shapes receive this attribute only once.
export function finishGeometry(geometry){
  if(geometry.getAttribute('color')||!geometry.getAttribute('normal'))return geometry;
  const normals=geometry.getAttribute('normal'),colors=new Float32Array(normals.count*3);
  for(let i=0;i<normals.count;i++){
    const up=Math.max(-1,Math.min(1,normals.getY(i))),shade=.92+.08*Math.max(0,up)-.12*Math.max(0,-up);
    colors[i*3]=shade;colors[i*3+1]=shade;colors[i*3+2]=shade;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.userData.formShading=true;return geometry;
}

// A tiny procedural studio environment: a warm ceiling, broad cream softboxes
// and a muted floor. Created once per view, with no downloads or image assets.
export function studioEnvironment(){
  const width=128,height=64,data=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const v=y/(height-1),u=x/width,ceiling=Math.max(0,Math.cos(v*Math.PI)),floor=Math.max(0,-Math.cos(v*Math.PI));
    const distance=Math.min(Math.abs(u-.18),1-Math.abs(u-.18));
    const panel=Math.exp(-distance*distance/.009-(v-.34)**2/.025);
    const fill=Math.exp(-((u-.70)**2)/.022-(v-.43)**2/.07);
    const base=118+ceiling*64-floor*40;
    const i=(y*width+x)*4;
    data[i]=Math.min(255,base+panel*95+fill*55+14);
    data[i+1]=Math.min(255,base+panel*85+fill*61+7);
    data[i+2]=Math.min(255,base+panel*66+fill*57);
    data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
  texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.needsUpdate=true;texture.userData.studio=true;return texture;
}
