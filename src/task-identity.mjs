// Service identity is independent of house colours, difficulty and correctness.
const palette=Object.freeze({
 table0:{accent:'#32664b',tint:'#e9f2e7'},table1:{accent:'#8b405f',tint:'#f8e9ef'},
 table2:{accent:'#94492d',tint:'#f8ece1'},table3:{accent:'#246d73',tint:'#e4f2f0'},
 pickup:{accent:'#69489c',tint:'#f0eafa'},wash:{accent:'#315f9e',tint:'#e8f0fa'},
 supplies:{accent:'#805b26',tint:'#f6efdd'},neutral:{accent:'#465b50',tint:'#f2f1e8'}
});
export function taskIdentity({tableId=null,orderId=null,pickup=false,kind=null}={}){
 const table=Number.isInteger(tableId)&&tableId>=0&&tableId<4;
 const key=kind==='wash'?'wash':kind==='supplies'?'supplies':pickup?'pickup':table?'table'+tableId:'neutral';
 const label=key==='wash'?'WASH':key==='supplies'?'STOCK':key==='pickup'?'P'+(orderId||''):table?'T'+(tableId+1):'JOBS';
 return {key,label,...palette[key]};
}
export const tableIdentity=t=>taskIdentity({tableId:t?.id,orderId:t?.orderId,pickup:t?.pickup});
export function intentIdentity(game,intent){
 if(intent?.lesson==='wash'||intent?.action==='sink')return taskIdentity({kind:'wash'});
 if(['receive','deposit'].includes(intent?.lesson)||['receiving','pantry'].includes(intent?.action))return taskIdentity({kind:'supplies'});
 const table=game?.tables?.[intent?.tableId];if(table)return tableIdentity(table);
 if(intent?.lesson==='collect'&&intent?.action?.startsWith('counter:')&&game?.kitchen?.counter[+intent.action.split(':')[1]]?.kind==='supplies')return taskIdentity({kind:'supplies'});
 return taskIdentity();
}
export function activeIdentity(game){const a=game?.active;return a?.purpose==='washing'?taskIdentity({kind:'wash'}):a?.purpose==='delivery'?taskIdentity({kind:'supplies'}):tableIdentity(game?.tables?.[a?.tableId]);}
export const identityStyle=id=>'--job-accent:'+id.accent+';--job-tint:'+id.tint;
export const identityAttributes=id=>'data-task-identity="'+id.key+'" data-job-label="'+id.label+'" style="'+identityStyle(id)+'"';
export function applyIdentity(node,id){if(!node)return;node.dataset.taskIdentity=id.key;node.dataset.jobLabel=id.label;node.style.setProperty('--job-accent',id.accent);node.style.setProperty('--job-tint',id.tint);}
