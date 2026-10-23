import * as THREE from 'three';
// The gameplay overview leans on a stronger key and a quieter sky so tops,
// sides and shadows of the low-poly forms separate; close-ups and the opening
// film keep their own balance.
export const ARENA_LIGHTING={
 courtyard:{background:'#e5e8dc',key:'#fff2dc',sky:'#edf5ec',ground:'#829d8e',fill:'#d9ece5',exposure:1.02,keyPower:2.85,overview:{keyPower:3.15,skyPower:1.12,fillPower:.52}},
 bistro:{background:'#e3e5d8',key:'#fff0d7',sky:'#f1f3e3',ground:'#7d968c',fill:'#d2e8e4',exposure:1.01,keyPower:2.95,overview:{keyPower:3.2,skyPower:1.1,fillPower:.52}},
 banquet:{background:'#d4c4b6',key:'#ffdfb3',sky:'#e6d9ce',ground:'#847566',fill:'#cfdbdf',exposure:1.03,keyPower:2.65,overview:{keyPower:2.95,skyPower:1.08,fillPower:.5}}
};
export const ATMOSPHERE_LIGHTING={rain:{background:'#aebfc4',key:'#e0edf1',sky:'#dbe9ed',ground:'#788f8d',fill:'#cadfe5',exposure:1.01,keyPower:2.45,skyPower:1.2,fillPower:.55},evening:{background:'#7b879d',key:'#ffd7a4',sky:'#aab7d1',ground:'#5d6173',fill:'#bdcbe3',exposure:1.04,keyPower:1.35,skyPower:.85,fillPower:.40}};
// The colour distant scenery fades towards: the overview background for this venue and weather.
export const hazeColor=(arena,atmosphere)=>(ATMOSPHERE_LIGHTING[atmosphere]||ARENA_LIGHTING[arena]||ARENA_LIGHTING.courtyard).background;
export function applySceneLighting(view){
 if(!view.sun||!view.fillLight||!view.skyLight)return;
 const arena=view.world?.arenaInfo?.id||'courtyard',setting=view.focus?.setting,close=!!setting;let p=ARENA_LIGHTING[arena]||ARENA_LIGHTING.courtyard;
 if(close)p={...ARENA_LIGHTING.courtyard,key:'#fff5e8',sky:'#f0f4f1',fill:'#e3ece8',exposure:1.02};
 if(!view.story&&!close&&p.overview)p={...p,...p.overview};
 const mood=!view.story&&!close?ATMOSPHERE_LIGHTING[view.world?.atmosphere]:null;if(mood)Object.assign(p={...p},mood);
 const center=view.station?.focusSurface?.mesh?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3(...(view.focus?.point||[0,.7,0]));
 if(view.ground)view.ground.material.color.set(mood?p.background:'#e5dcc8');
 view.scene.background.set(p.background);view.scene.fog?.color.set(p.background);view.scene.environmentIntensity=close?.35:.29;
 view.skyLight.color.set(p.sky);view.skyLight.groundColor.set(p.ground);view.skyLight.intensity=close?1.35:(p.skyPower??1.45);view.fillLight.color.set(p.fill);view.fillLight.intensity=close?.95:(p.fillPower??.65);
 view.sun.color.set(p.key);view.sun.intensity=close?2.65:p.keyPower;view.sun.target.position.copy(close?center:new THREE.Vector3(0,.5,0));view.sun.position.copy(view.sun.target.position).add(new THREE.Vector3(-5,11,6));view.sun.target.updateMatrixWorld();
 const extent=close?Math.max(2.2,Math.min(5,(view.station?.focusSurface?.width||3)*1.2)):8;
 Object.assign(view.sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});view.sun.shadow.camera.updateProjectionMatrix();view.sun.shadow.needsUpdate=true;if(view.renderer?.shadowMap)view.renderer.shadowMap.needsUpdate=true;
 if(view.renderer)view.renderer.toneMappingExposure=p.exposure;
}
