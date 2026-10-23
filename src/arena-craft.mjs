import * as THREE from 'three';
import {finishGeometry} from './geometry-finish.mjs';
import {ARENA_VISUALS} from './presentation.mjs';

export function arenaPalette(p,arena){
 const colors=arena==='bistro'?{stone:'#eee0c8',stoneDark:'#b9c8bb',wood:'#a37a56',woodLight:'#c5a581',darkWood:'#544039',green:'#286667'}:arena==='banquet'?{stone:'#e2ddd6',stoneDark:'#bbb9c1',wood:'#795640',woodLight:'#ac8562',darkWood:'#423127',green:'#496356'}:{stone:'#dfd9c9',stoneDark:'#b8bfae',wood:'#ad8b63',woodLight:'#d0b68e',darkWood:'#63533f',green:'#4e795c'};
 for(const [key,color]of Object.entries(colors))p[key].color.set(color);
}
export function floorColor(arena,i,j){
 if(j<=2)return i%2?'#b9c6b6':'#c7d0bf';
 if(arena==='bistro')return (Math.floor(i/2)+j)%2?'#d6c4a5':'#e3d4b9';
 if(arena==='banquet')return i===0||i===10||j===0?'#9fa2b7':(i+j)%2?'#deded9':'#eee9dd';
 return (i+2*j)%3?'#e4dfcb':'#d4d9c0';
}
let archGeometry;
function arch(parent,p,x,y,z){
 archGeometry??=finishGeometry(new THREE.TorusGeometry(.69,.038,4,20,Math.PI));archGeometry.userData.shared=true;
 const m=new THREE.Mesh(archGeometry,p.woodLight);m.position.set(x,y,z);m.castShadow=true;parent.add(m);
}
export function buildArenaIdentity(environment,canopy,p,{arena,venue,box,cyl}){
 if(arena==='courtyard'){
  // A generous trellis and raised garden beds at the room boundary.
  for(const x of [-4.15,4.15]){
   box(environment,p.terra,x,.39,-3.25,.37,.55,1.35,.045);box(environment,p.darkWood,x,.68,-3.25,.31,.04,1.27,.02);
   for(let i=0;i<4;i++){const leaf=box(environment,i%2?p.leaf:p.leafDark,x,.91+i%2*.12,-3.75+i*.32,.43,.42,.38,.12);leaf.rotation.z=(i%2-.5)*.3;}
  }
  for(const x of [-1.53,1.53])for(const direction of [-1,1])for(let i=0;i<3;i++){const slat=box(environment,p.woodLight,x,1.57+i*.21,-4.10,.65,.025,.035,.004);slat.rotation.z=direction*.65;}
  for(const z of [-3.9,3.6])box(canopy,p.cream,0,3.48,z,8.5,.05,.04,.008);
 }else if(arena==='bistro'){
  for(const x of [-3.1,0,3.1]){arch(environment,p,x,1.70,-4.31);for(const dx of [-.69,.69])box(environment,p.woodLight,x+dx,1.30,-4.31,.076,.8,.076,.012);box(environment,p.gold,x,.83,-4.05,1.42,.024,.05,.005);}
  // Broad teal wall panels and inset parquet lines, rather than loose props.
  for(const x of [-1.53,1.53]){box(environment,p.green,x,.58,-4.07,.92,.66,.055,.03);for(const dx of [-.37,.37])box(environment,p.woodLight,x+dx,.58,-4.02,.02,.54,.02,.004);}
  for(let i=0;i<8;i++)for(const side of [-1,1]){const plank=box(environment,p.woodLight,side*(.14+i*.38),.089,-3.55,.34,.006,.014,.002);plank.rotation.y=side*.68;}
  box(canopy,p.darkWood,0,3.42,-3.92,8.4,.26,.20,.035);
 }else{
  // Fluted ivory columns and a stepped cornice give the hall its silhouette.
  for(const x of [-4.18,-1.53,1.53,4.18]){
   for(const y of [.23,2.43])box(environment,p.cream,x,y,-4.02,.31,.13,.20,.015);
   for(const dx of [-.072,0,.072])cyl(environment,p.cream,x+dx,1.34,-4.045,.032,.032,2.05,8);
   box(environment,p.gold,x,2.32,-3.99,.25,.035,.16,.005);
  }
  for(const [y,w]of [[2.57,8.8],[2.65,9.0]])box(environment,p.cream,0,y,-4.13,w,.075,.20,.015);
  for(const x of [-4.1,4.1]){box(environment,p.gold,x,.093,-.55,.025,.008,6.5,.003);box(environment,p.green,x*.97,.09,-.55,.06,.006,6.5,.003);}
  for(const x of [-1.53,1.53])for(const dx of [-.17,-.085,0,.085,.17])box(environment,p.green,x+dx,1.77,-4.145,.05,.91,.055,.014);
 }
 return {...ARENA_VISUALS[arena],arena};
}

export function dressRenovations(environment,canopy,p,{renovation,furnishing,bench,trolley,warmer,box,cyl,ring}){
 const r=renovation.items,equipped=new Set(furnishing.equipped),owned=new Set(furnishing.owned),trim=renovation.finish==='wood'?p.wood:renovation.finish==='ivory'?p.cream:p.team;
 if(r.receiving.stage>=1){
  for(const x of [-4.02,-2.68]){box(environment,trim,x,.66,-2.68,.055,.64,1.03,.012);box(environment,p.gold,x,.99,-2.68,.07,.05,.37,.01);}
  box(environment,trim,-3.35,.30,-2.63,1.48,.08,1.18,.025);
 }
 if(r.receiving.stage>=2){
  box(environment,trim,-3.35,1.95,-3.68,1.64,.98,.065,.025);
  for(let i=0;i<4;i++){const x=-3.94+i*.39;box(environment,p.woodLight,x,1.81,-3.39,.33,.25,.31,.018);box(environment,p.cream,x,1.82,-3.225,.18,.09,.008,.004);}
  for(const x of [-4.12,-2.58])box(environment,p.darkWood,x,1.96,-3.60,.045,1.12,.07,.01);
 }
 if(r.receiving.stage>=3){
  for(let i=0;i<8;i++)box(canopy,i%2?trim:p.cream,-4.14+i*.225,2.98,-2.95,.22,.035,1.15,.012);
  for(const x of [-4.22,-2.47])box(canopy,p.gold,x,2.74,-3.32,.035,.45,.035,.006);
  for(const x of [-2.58,-2.42])box(canopy,p.gold,x,2.65,-2.8,.018,.26,.018,.004);box(canopy,p.gold,-2.5,2.81,-2.8,.22,.035,.19,.01);
 }
 if(r.kitchen.stage>=1){
  box(environment,p.darkWood,-2.65,.68,1.45,1.47,.70,.55,.035);
  for(const x of [-3.02,-2.28]){box(environment,trim,x,.73,1.742,.68,.54,.025,.02);box(environment,p.gold,x,.91,1.765,.18,.028,.025,.005);}
 }
 if(r.kitchen.stage>=2){
  for(let i=0;i<4;i++)for(let j=0;j<2;j++)box(environment,(i+j)%2?p.white:p.cream,-3.22+i*.38,1.42+j*.27,1.097,.35,.24,.025,.012);
  for(const x of [-3.15,-2.75,-2.35])ring(environment,p.metal,x,1.52,.99,.045,.009);
 }
 if(bench.visible){
  box(bench,trim,-1.18,.48,1.45,1.28,.055,.68,.02);box(bench,p.darkWood,-1.18,1.10,1.82,1.30,.13,.035,.01);
  for(const x of [-1.59,-1.18,-.77])box(bench,trim,x,.72,1.42,.34,.36,.54,.02);
 }
 if(r.pass.stage>=1){
  box(environment,p.darkWood,1.35,.76,3.53,1.38,.72,.21,.025);
  for(const x of [.89,1.35,1.81]){box(environment,p.woodLight,x,.76,3.67,.022,.59,.06,.004);for(let i=0;i<3;i++)cyl(environment,p.white,x-.13,.55+i*.055,3.66,.115,.115,.025,12);}
 }
 if(r.pass.stage>=2){
  for(const x of [.67,2.03])box(environment,p.gold,x,1.46,3.65,.025,.28,.025,.004);
  box(environment,p.gold,1.35,1.60,3.65,1.4,.025,.025,.004);
  for(const z of [3.43,3.64])box(environment,p.darkWood,1.35,1.333,z,1.05,.012,.014,.002);
 }
 if(trolley.visible){
  for(const z of [-.3,.3]){box(trolley,p.gold,0,1.29,z,1.1,.028,.028,.005);for(const x of [-.5,.5])box(trolley,p.gold,x,1.19,z,.025,.22,.025,.005);}
  box(trolley,p.gold,.55,1.26,0,.035,.035,.61,.006);box(trolley,p.woodLight,0,.47,0,1.08,.025,.57,.01);
 }
 if(equipped.has('pantry')){
  box(environment,p.darkWood,-3.8,1.40,-3.69,1.08,1.23,.055,.025);for(const x of [-4.31,-3.29])box(environment,trim,x,1.4,-3.47,.055,1.23,.48,.012);
  for(const y of [.82,1.47,2.02])box(environment,p.woodLight,-3.8,y,-3.47,1.08,.055,.48,.012);
  for(const x of [-4.12,-3.8,-3.48])cyl(environment,p.cream,x,1.63,-3.47,.075,.075,.25,10);
 }
 if(equipped.has('warmer')){
  box(warmer,p.metal,1.5,1.72,3,1.15,.16,.68,.035);box(warmer,p.dark,1.5,1.64,3,.96,.025,.50,.01);box(warmer,p.gold,1.5,1.77,3.35,.85,.018,.018,.004);
 }
 if(equipped.has('prep')){
  box(environment,p.green,-2.45,1.31,2.45,.97,.025,.35,.02);for(const x of [-2.79,-2.47,-2.15]){box(environment,p.metal,x,1.44,2.45,.022,.34,.02,.004);cyl(environment,p.wood,x,1.62,2.45,.028,.028,.09,8);}
 }
 if(equipped.has('welcome')){box(environment,p.wood,.8,1.19,-3.7,.91,.025,.46,.02);cyl(environment,p.white,1.07,1.34,-3.7,.105,.12,.27,14);cyl(environment,p.gold,1.07,1.49,-3.7,.11,.11,.025,12);}
 if(owned.has('counter'))for(const x of [-2.65,0,2.65]){box(environment,p.cream,x,.65,3.49,2.13,.58,.026,.025);for(const dx of [-.87,.87])box(environment,p.gold,x+dx,.65,3.515,.016,.43,.012,.003);}
 if(owned.has('lamps'))for(const x of [-2.5,-1.25,0,1.25,2.5]){for(const dx of [-.08,.08])box(canopy,p.gold,x+dx,3.05,-2.45,.014,.24,.014,.004);cyl(canopy,p.gold,x,2.94,-2.45,.12,.10,.035,8);}
}
