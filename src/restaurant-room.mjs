import * as THREE from 'three';
import {batchCharacterPart} from './character-craft.mjs';
import {stationBox as box,stationCylinder as cyl,stationRing as ring,stationPipe} from './station-craft.mjs';
import {CHECKOUT} from './fixtures.mjs';
import {createDeliveryPackage} from './delivery-props.mjs';

// Compact furniture built in semantic zones. Upgrades stay on counters or at
// the boundary, so none can insert an island into the central walking aisle.
export function buildRestaurantRoom(root,environment,p,{plan,furnishing,renovation,ball,textMaterial,foodPlate}){
 const upperFixtures=new THREE.Group();root.add(upperFixtures);
 const k=plan.kitchenZ,owned=new Set(furnishing.owned),equipped=new Set(furnishing.equipped),r=renovation.items,trim=renovation.finish==='wood'?p.wood:renovation.finish==='ivory'?p.cream:p.team;
 const counter=(parent,x,z,w,d=.88,mat=p.green)=>{
  box(parent,mat,x,.64,z,w,1.06,d,.045);box(parent,p.darkWood,x,.16,z,w+.02,.12,d+.02,.025);box(parent,owned.has('counter')?p.cream:p.woodLight,x,1.22,z,w+.12,.13,d+.10,.04);
  const fronts=Math.max(1,Math.round(w/.8));for(let i=0;i<fronts;i++){const xx=x-w/2+(i+.5)*w/fronts;box(parent,mat,xx,.68,z+d/2+.018,w/fronts-.07,.72,.035,.02);box(parent,p.gold,xx,.91,z+d/2+.047,.20,.026,.028,.006);}
 };
 // Continuous back counter, with prep, cooking and finished-food pass.
 counter(environment,.2,k,7.5,1.12);
 const prepStatic=new THREE.Group();root.add(prepStatic);const prepShift=plan.stationOffsets.recipe;prepStatic.position.set(prepShift[0],0,prepShift[2]);
 box(prepStatic,p.wood,-2.5,1.33,2.88,1.25,.10,.75);foodPlate(prepStatic,p,0,-2.5,1.40,2.87);
 box(prepStatic,p.cream,-1.62,1.33,2.85,.38,.035,.55,.025);for(let i=0;i<3;i++)box(prepStatic,p.team,-1.62,1.36,2.66+i*.16,.24,.025,.09,.015);
 for(let i=0;i<3;i++){cyl(prepStatic,p.white,-3.30+i*.23,1.37,2.48,.10,.09,.14,12);ball(prepStatic,p.leaf,-3.30+i*.23,1.48,2.48,.09,7);}
 box(environment,p.dark,0,1.33,k,1.30,.13,.80,.035);for(const x of [-.34,.34]){ring(environment,p.metal,x,1.41,k,.22,.025).rotation.x=-Math.PI/2;}
 cyl(environment,p.metal,0,1.63,k,.34,.29,.42,16);cyl(environment,p.soup,0,1.85,k,.31,.31,.018,16);for(const x of [-.41,.41])ring(environment,p.metal,x,1.66,k,.10,.023).rotation.y=Math.PI/2;
 // Cast-iron supports, inset enamel front, control knobs and a quiet vent rail.
 for(const x of [-.34,.34])for(const side of [-1,1]){box(environment,p.dark,x+side*.16,1.43,k,.035,.025,.43,.008);box(environment,p.dark,x,1.43,k+side*.16,.43,.025,.035,.008);}
 for(const x of [-.39,0,.39]){const knob=cyl(environment,p.metal,x,1.13,k+.592,.055,.055,.035,24);knob.rotation.x=Math.PI/2;box(environment,p.dark,x,1.148,k+.617,.009,.036,.008,.003);}
 for(let i=0;i<7;i++)box(environment,p.dark,-.24+i*.08,.40,k+.60,.043,.012,.012,.004);
 for(const x of [-.29,.29]){const rivet=cyl(environment,p.metal,x,.89,k+.608,.012,.012,.008,12);rivet.rotation.x=Math.PI/2;}
 box(environment,p.dark,0,.69,k+.59,.70,.60,.025,.06);box(environment,p.glow,0,.67,k+.615,.47,.30,.012,.025);box(environment,p.gold,0,.97,k+.63,.47,.035,.035,.008);
 box(upperFixtures,p.metal,0,2.45,k-.12,1.48,.18,.83,.05);box(upperFixtures,p.metal,0,2.74,k-.30,.69,.43,.39,.035);
 // The beverage/third cooking space occupies the end of the pass.
 box(environment,p.darkWood,3.35,1.38,k,.66,.20,.67,.03);cyl(environment,p.glass,3.35,1.77,k,.24,.23,.60,14);cyl(environment,p.berry,3.35,1.74,k,.21,.21,.46,14);cyl(environment,p.metal,3.35,2.08,k,.27,.27,.06,14);box(environment,p.gold,3.35,1.63,k+.29,.045,.065,.12,.01);
 const railTickets=new THREE.Group();root.add(railTickets);const railShift=new THREE.Vector3(...plan.stationOffsets.ticket);
 for(const x of [.62,1.34])box(railTickets,p.metal,x,1.70,2.48,.035,.8,.035,.005);box(railTickets,p.metal,.98,2.08,2.48,.94,.045,.045,.008);
 for(const x of [.74,1.15]){box(railTickets,p.cream,x,1.85,2.51,.30,.41,.015,.008);box(railTickets,p.gold,x,2.04,2.53,.07,.06,.03,.005);for(let i=0;i<3;i++)box(railTickets,p.green,x,1.93-i*.09,2.529,.18,.013,.005,.002);}
 railTickets.position.copy(railShift);
 // Pantry and a separate side-return sink. Crates stay under the shelving.
 const [sx,sz]=plan.sink;counter(environment,sx,sz,.82,1.25);
 box(environment,p.metal,sx,1.31,sz,.76,.055,.88,.04);box(environment,p.dark,sx,1.345,sz,.53,.015,.60,.055);box(environment,p.metal,sx,1.35,sz+.02,.43,.012,.46,.045);
 stationPipe(environment,p.metal,[[sx-.27,1.36,sz-.40],[sx-.27,1.63,sz-.40],[sx-.24,1.73,sz-.40],[sx-.07,1.73,sz-.40],[sx-.045,1.66,sz-.40]],.025);
 cyl(environment,p.metal,sx-.27,1.37,sz-.40,.055,.055,.028,24);box(environment,p.gold,sx-.18,1.39,sz-.40,.10,.018,.025,.006);
 cyl(environment,p.dark,sx,1.36,sz+.02,.052,.052,.006,24);for(const x of [-.024,0,.024])box(environment,p.metal,sx+x,1.365,sz+.02,.008,.004,.061,.002);
 for(let i=0;i<4;i++)box(environment,p.metal,sx+.31,1.35,sz-.25+i*.16,.045,.012,.11,.009);
 box(upperFixtures,p.darkWood,sx,1.08,k-.17,.82,1.84,.72,.035);for(const y of [.37,.92,1.50,2.0])box(upperFixtures,p.woodLight,sx,y,k+.03,.85,.065,.62,.015);
 const supplyProps=[];for(let i=0;i<5;i++){const parcel=createDeliveryPackage(p,i);parcel.position.set(sx+(i%2?-.20:.20),.42+Math.floor(i/2)*.51,k+.06);parcel.scale.setScalar(.28);environment.add(parcel);supplyProps.push(parcel.userData.packageType);}
 if(equipped.has('pantry')||r.receiving.stage>=2)for(const x of [-3.0,-2.5,-2.0]){box(environment,p.woodLight,x,2.12,k-.38,.40,.07,.35,.01);cyl(environment,p.cream,x,2.28,k-.38,.09,.09,.23,10);}
 if(r.receiving.stage>=1)box(environment,trim,sx,.23,k+.08,.86,.07,.66,.015);
 if(r.receiving.stage>=3)box(upperFixtures,trim,sx,2.18,k-.15,.94,.075,.77,.025);
 if(r.kitchen.stage>=1)box(environment,trim,-2.35,1.31,k+.38,1.7,.035,.28,.015);
 if(r.kitchen.stage>=2||equipped.has('prep')){box(environment,p.woodLight,-2.1,1.95,k-.42,1.6,.08,.29,.02);for(const x of [-2.6,-2.15,-1.7]){cyl(environment,p.cream,x,2.08,k-.42,.08,.08,.20,10);}}
 const bench=new THREE.Group();root.add(bench);bench.visible=r.kitchen.stage>=3||equipped.has('bench');box(bench,trim,-.85,1.28,k+.22,1.12,.10,.66,.025);box(bench,p.woodLight,-.85,.89,k+.48,1.0,.46,.04,.02);
 const warmer=new THREE.Group();root.add(warmer);warmer.visible=equipped.has('warmer');for(const x of [1.14,2.70])box(warmer,p.gold,x,1.60,k-.02,.035,.58,.035,.005);box(warmer,p.metal,1.92,1.92,k-.02,1.72,.10,.78,.035);box(warmer,p.glow,1.92,1.86,k-.02,1.45,.015,.52,.01);
 if(r.pass.stage>=1)box(environment,trim,1.92,1.31,k+.48,1.85,.055,.17,.015);
 if(r.pass.stage>=2)for(const x of [1.35,1.92,2.49])for(let i=0;i<3;i++)cyl(environment,p.white,x,.44+i*.04,k+.49,.12,.12,.025,12);
 const trolley=new THREE.Group();root.add(trolley);trolley.position.set(...plan.trolleyHome);trolley.visible=r.pass.stage>=3||equipped.has('trolley');trolley.rotation.y=Math.PI/2;
 for(const y of [.4,1.1])box(trolley,p.woodLight,0,y,0,1.2,.08,.68,.02);for(const x of [-.5,.5]){box(trolley,p.gold,x,.7,0,.045,.9,.045,.008);for(const z of [-.25,.25])cyl(trolley,p.dark,x,.16,z,.11,.11,.07,10).rotation.z=Math.PI/2;}box(trolley,p.gold,.53,1.3,0,.035,.035,.66,.005);
 const trolleyLoads=new THREE.Group();trolleyLoads.position.y=1.16;trolley.add(trolleyLoads);
 // Front counters face the dining area, leaving the entrance in the middle.
 const [cx,cz]=plan.checkout;counter(environment,cx,cz,plan.counterWidths?.checkout||2,.88);const checkoutRoot=new THREE.Group();root.add(checkoutRoot);checkoutRoot.position.set(...plan.stationOffsets.repair);
 box(checkoutRoot,p.green,3.35,1.38,2.95,1.12,.20,.78,.04);box(checkoutRoot,p.metal,3.35,1.68,2.62,.15,.45,.15,.025);
 const screenMount=new THREE.Group();screenMount.position.set(...CHECKOUT.screen);screenMount.rotation.x=CHECKOUT.tilt;checkoutRoot.add(screenMount);box(screenMount,p.dark,0,0,0,1.30,.87,.10,.06);box(screenMount,p.gold,0,-.38,.06,.24,.024,.015,.006);
 for(const x of [-.60,.60])for(const y of [-.37,.37]){const screw=cyl(screenMount,p.metal,x,y,.055,.013,.013,.012,12);screw.rotation.x=Math.PI/2;}
 for(let i=0;i<5;i++)box(checkoutRoot,p.dark,3.86,1.47,2.80+i*.06,.012,.035,.025,.004);
 box(checkoutRoot,p.dark,3.35,1.35,3.35,.89,.018,.012,.004);box(checkoutRoot,p.gold,3.35,1.32,3.36,.20,.035,.025,.006);
 const checkoutScreen=box(screenMount,textMaterial('LANGUINI'),0,0,.058,CHECKOUT.width,CHECKOUT.height,.012,.02);
 for(let i=0;i<9;i++)box(checkoutRoot,i===8?p.rune:p.cream,3.10+(i%3)*.16,1.505,2.99+Math.floor(i/3)*.12,.12,.035,.09,.015);
 box(checkoutRoot,p.white,...CHECKOUT.printer,.32,.27,.44,.04);box(checkoutRoot,p.dark,3.98,1.61,3.32,.25,.035,.04,.008);
 // Retain the separately controlled screen and mount, batch fixed keycaps,
 // printer, drawer and vents rather than submitting every screw individually.
 const checkoutBody=new THREE.Group();checkoutRoot.add(checkoutBody);for(const child of [...checkoutRoot.children])if(child!==screenMount&&child!==checkoutBody)checkoutBody.add(child);batchCharacterPart(checkoutBody);
 const bezel=new THREE.Group();screenMount.add(bezel);for(const child of [...screenMount.children])if(child!==checkoutScreen&&child!==bezel)bezel.add(child);batchCharacterPart(bezel);
 const [px,pz]=plan.pickup;counter(environment,px,pz,plan.counterWidths?.pickup||1.85,.88);for(const x of [px-.54,px,px+.54])for(let i=0;i<3;i++)cyl(environment,p.white,x,.40+i*.045,pz+.39,.14,.14,.03,12);
 if(equipped.has('welcome')){cyl(environment,p.white,cx-.65,1.40,cz,.09,.10,.26,12);box(environment,p.woodLight,cx-.60,1.30,cz,.45,.035,.43,.015);}
 // A modest mat and low front walls define the entrance without hiding guests.
 box(environment,p.green,0,.105,3.88,1.55,.014,.70,.04);for(const side of [-1,1])box(environment,p.stone,side*(2.9+plan.venue.extraWidth*.22),.36,4.40,3.0,.55,.18,.035);
 const signs=[['PREP',-2.2,1.13,k+.65],['COOK',0,1.13,k+.65],['PASS',1.92,1.13,k+.65],['WASH',sx,1.91,sz-.45],['PANTRY',sx,2.16,k+.08],['CHECKOUT',cx,1.06,cz-.49],['PICKUP',px,1.06,pz-.49]];
 for(const [name,x,y,z]of signs){const label=textMaterial(name,'#365c4c','#fff5dd',256);label.userData.gameplaySign=true;const sign=box(environment,label,x,y,z,name==='CHECKOUT'?1.12:.72,.23,.025,.012);if(z>2)sign.rotation.y=Math.PI;}
 return {upperFixtures,prepStatic,railTickets,checkout:{root:checkoutRoot,screenMount,screen:checkoutScreen},bench,trolley,trolleyLoads,warmer,supplyProps};
}
