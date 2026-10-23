// Validated choices only: new saves keep the approved classic floor plan.
export const DESIGN_LAYOUTS=[
 {id:'classic',name:'Window café',copy:'Window seats · open centre'},
 {id:'cosy',name:'Dining clusters',copy:'Paired tables · shared aisle'},
 {id:'express',name:'Takeaway first',copy:'Grouped dining · clear collection'}
];
export const COUNTER_PLANS=[
 {id:'balanced',name:'Balanced',copy:'Standard capacity'},
 {id:'takeaway',name:'Takeaway counter',copy:'Wider collection · +1 supply'},
 {id:'service',name:'Table service',copy:'Wider service · +1 clean dish'}
];
export const ATMOSPHERES=[
 {id:'auto',name:'Changing days',copy:'Rotates each shift'},
 {id:'breakfast',name:'Sunny breakfast',copy:'Warm light · morning sounds'},
 {id:'rain',name:'Rainy afternoon',copy:'Cool light · rainfall'},
 {id:'evening',name:'Evening service',copy:'Amber light · quiet ambience'}
];
export const DECOR_SLOTS=[
 {id:'welcome',level:1,name:'Welcome corner',choices:[{id:'plant',name:'Potted fern'},{id:'menu',name:'Framed menu'}]},
 {id:'tables',level:2,name:'Table centres',choices:[{id:'flowers',name:'Fresh flowers'},{id:'pottery',name:'Handmade pottery'}]},
 {id:'wall',level:3,name:'Kitchen wall',choices:[{id:'gallery',name:'Food gallery'},{id:'clock',name:'Café clock'}]},
 {id:'entrance',level:4,name:'Entrance finish',choices:[{id:'lanterns',name:'Warm lanterns'},{id:'awning',name:'Striped canopy'}]},
 {id:'celebration',level:5,name:'Turnaround keepsake',choices:[{id:'wreath',name:'Laurel wreath'},{id:'rosette',name:'House rosette'}]}
];
export const RECOVERY_STAGES=[
 {rating:2.5,title:'Seats restored',copy:'Repaired upholstery'},
 {rating:3,title:'New life',copy:'Healthier plants'},
 {rating:3.5,title:'Made with care',copy:'Better crockery'},
 {rating:4,title:'A warm welcome',copy:'Brighter entrance'},
 {rating:4.5,title:'People are waiting',copy:'A queue outside'}
];
const choice=(list,value,fallback)=>list.some(x=>x.id===value)?value:fallback;
export function cleanDesign(value={}){return {layout:choice(DESIGN_LAYOUTS,value?.layout,'classic'),counter:choice(COUNTER_PLANS,value?.counter,'balanced'),atmosphere:choice(ATMOSPHERES,value?.atmosphere,'auto'),decor:Object.fromEntries(DECOR_SLOTS.filter(s=>s.choices.some(c=>c.id===value?.decor?.[s.id])).map(s=>[s.id,value.decor[s.id]]))};}
export function cleanDesigns(value={}){return Object.fromEntries(Object.entries(value||{}).filter(([k])=>/^[5-8]:(gryffindor|hufflepuff|slytherin|ravenclaw):(courtyard|bistro|banquet)$/.test(k)).map(([k,v])=>[k,cleanDesign(v)]));}
export function visibleDecor(design,level=0){const d=cleanDesign(design);return Object.fromEntries(DECOR_SLOTS.filter(s=>s.level<=level&&d.decor[s.id]).map(s=>[s.id,d.decor[s.id]]));}
export function chooseDecoration(design,slot,id,level){const spec=DECOR_SLOTS.find(s=>s.id===slot);if(!spec||spec.level>level||!spec.choices.some(c=>c.id===id))return null;const d=cleanDesign(design);d.decor[slot]=id;return d;}
export function atmosphereFor(design,shift=1){const d=cleanDesign(design);return d.atmosphere==='auto'?['breakfast','rain','evening'][Math.max(0,(Math.floor(shift)||1)-1)%3]:d.atmosphere;}
export const ATMOSPHERE_GREETINGS={breakfast:'Good morning! A lovely day for breakfast.',rain:'It is raining outside. It is nice and warm in here.',evening:'Good evening! This is a lovely place to finish the day.'};
export function cleanCafeProgress(value={}){return {pickups:Math.max(0,Math.min(100000,Math.floor(Number(value?.pickups))||0)),credited:[...new Set((Array.isArray(value?.credited)?value.credited:[]).filter(x=>typeof x==='string'&&/^\d+:\d+$/.test(x)))].slice(-128)};}
export function cleanCafeProgresses(value={}){return Object.fromEntries(Object.entries(value||{}).filter(([k])=>/^[5-8]:(gryffindor|hufflepuff|slytherin|ravenclaw):(courtyard|bistro|banquet)$/.test(k)).map(([k,v])=>[k,cleanCafeProgress(v)]));}
