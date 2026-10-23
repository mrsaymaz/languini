export const PROJECTS=[
 {id:'receiving',name:'Receiving alcove',stages:['Repaired delivery cart','Shelves and manifest board','Team awning and lantern'],reward:null},
 {id:'kitchen',name:'Kitchen work bay',stages:['Restored side worktop','Backsplash and utensil rail','Auxiliary preparation bench'],reward:'bench'},
 {id:'pass',name:'Serving pass',stages:['Restored pass and plate storage','Brass fittings and tray parking','Two-place serving trolley'],reward:'trolley'}
];
export const PROJECT_GOALS=[4,10,18],PROJECT_COSTS=[100,160,240];
const n=(v,max=100000)=>Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
export function cleanProjects(value={}){return {active:PROJECTS.some(p=>p.id===value.active)?value.active:'receiving',finish:['wood','ivory','team'].includes(value.finish)?value.finish:'team',items:Object.fromEntries(PROJECTS.map(p=>[p.id,{stage:n(value.items?.[p.id]?.stage,3),meals:n(value.items?.[p.id]?.meals)}]))};}
export function advanceProject(value,meals=1){const state=cleanProjects(value),item=state.items[state.active];item.meals=n(item.meals+meals);return state;}
export function buyProjectStage(profile,key,id){const p=PROJECTS.find(p=>p.id===id),state=cleanProjects(profile.projects?.[key]),item=state.items[id];if(!p||item.stage>=3||item.meals<PROJECT_GOALS[item.stage]||(profile.wallets[key]||0)<PROJECT_COSTS[item.stage])return false;profile.wallets[key]-=PROJECT_COSTS[item.stage++];profile.projects||={};profile.projects[key]=state;if(item.stage===3&&p.reward){const f=profile.furnishings[key]||{owned:[],equipped:[]};if(!f.owned.includes(p.reward))f.owned.push(p.reward);profile.furnishings[key]=f;}return {project:p,stage:item.stage};}
