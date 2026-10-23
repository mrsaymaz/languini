// Service formats use existing stations and the selected unit's reviewed bank.
export const ORDER_TYPES = {
  simple:{name:'Simple order',reason:'A quick order, freshly prepared.',route:[['tablet','order'],['recipe','prepare']],bonus:0},
  request:{name:'Customer request',reason:'Hear the guest, prepare the dish, then check back.',route:[['conversation','order'],['recipe','prepare'],['conversation','serve']],bonus:5},
  kitchen:{name:'Kitchen ticket',reason:'The clipped ticket guides this dish into preparation.',route:[['tablet','order'],['ticket','prepare'],['recipe','prepare']],bonus:5},
  correction:{name:'Order check',reason:'Prepare the dish and correct its checkout before serving.',route:[['tablet','order'],['recipe','prepare'],['repair','serve']],bonus:5},
  special:{name:'Special table',reason:'A welcome, an order, a recipe and a final check.',route:[['conversation','order'],['tablet','order'],['recipe','prepare'],['repair','serve']],bonus:12},
  takeaway:{name:'Takeaway collection',reason:'Prepare a parcel, check its note and match the pickup number labels before collection.',route:[['tablet','order'],['recipe','prepare'],['repair','serve']],bonus:8}
};
const FORMATS={courtyard:['simple','simple','request','kitchen','correction'],bistro:['request','kitchen','correction','simple','special'],banquet:['request','kitchen','special','correction']};
export function orderTypeFor(arena,index,difficulty='relaxed'){
  const formats=FORMATS[arena]||FORMATS.courtyard;
  if(arena==='banquet'&&difficulty==='challenge')return 'special';
  return formats[index%formats.length];
}
export function routeFor(type){return (ORDER_TYPES[type]||ORDER_TYPES.simple).route.map(([setting,phase])=>({setting,phase}));}
export const PERSONALITIES=[
  {id:'enthusiastic',name:'Enthusiastic',greeting:'It is lovely to be here!',returning:'Hello again! I love this café.',thanks:'That looks wonderful!'},
  {id:'thoughtful',name:'Thoughtful',greeting:'This is a lovely place to read.',returning:'Hello again. It is nice to be back.',thanks:'Thank you for preparing my meal.'},
  {id:'curious',name:'Curious',greeting:'I am ready to try something new.',returning:'Hello again! What is new today?',thanks:'That was an interesting visit!'},
  {id:'friendly',name:'Friendly',greeting:'Hello! Thank you for welcoming me.',returning:'It is good to see you again!',thanks:'See you next time!'}
];
export const personalityFor=id=>PERSONALITIES[id%PERSONALITIES.length];

export const CATALOG=[
  {id:'bench',group:'equipment',name:'Auxiliary preparation bench',description:'Second preparation space',cost:0,project:'kitchen',icon:'prep'},
  {id:'trolley',group:'equipment',name:'Two-place serving trolley',description:'Carry 2 meals per trip',cost:0,project:'pass',icon:'trolley'},
  {id:'pantry',group:'equipment',name:'Extra pantry',description:'+2 supplies per delivery',cost:80,icon:'pantry'},
  {id:'warmer',group:'equipment',name:'Warming shelf',description:'Ready dishes: 40% slower patience loss',cost:95,icon:'warmer'},
  {id:'prep',group:'equipment',name:'Preparation kit',description:'20% faster cooking',cost:110,icon:'prep'},
  {id:'welcome',group:'equipment',name:'Welcome tea',description:'+12s guest patience',cost:90,icon:'cup'},
  {id:'plants',group:'decoration',name:'Garden corner',description:'Extra greenery',cost:45,icon:'leaf'},
  {id:'lamps',group:'decoration',name:'Lantern garland',description:'Warm overhead light',cost:60,icon:'sparkles'},
  {id:'counter',group:'decoration',name:'Polished counter',description:'Ivory and gold finish',cost:85,icon:'counter'},
  {id:'settings',group:'decoration',name:'Table settings',description:'Plates and gold cutlery',cost:65,icon:'serve'},
  {id:'banner',group:'decoration',name:'Team display',description:'Team name and colours',cost:70,icon:'crown'},
  {id:'tablet',group:'expression',name:'Team tablet case',description:'Team colour',cost:40,icon:'tablet'},
  {id:'tray',group:'expression',name:'Gold serving tray',description:'Gold finish',cost:40,icon:'serve'}
];
export const itemFor=id=>CATALOG.find(item=>item.id===id);
export function cleanFurnishing(value={}){
  const owned=[...new Set((Array.isArray(value.owned)?value.owned:[]).filter(id=>itemFor(id)))];
  const equipped=[...new Set((Array.isArray(value.equipped)?value.equipped:[]).filter(id=>owned.includes(id)&&itemFor(id)?.group==='equipment'))].slice(0,2);
  return {owned,equipped};
}
