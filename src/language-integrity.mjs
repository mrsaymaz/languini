// Answer keys and their visible choices must agree before an activity can play.
const text=v=>typeof v==='string'&&v.trim().length>0;
const key=v=>String(v).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB');
export function answerChoicesValid(task,options){
 if(!Array.isArray(options)||options.length<2||options.some(v=>!text(v))||new Set(options.map(key)).size!==options.length)return false;
 const allowed=new Set([...(task.options||[]),task.answer]);
 if(options.some(v=>!allowed.has(v)))return false;
 return task.requested?task.requested.every(p=>options.filter(v=>v===p.word).length===1):options.filter(v=>v===task.answer).length===1;
}
export function auditLanguageBank(bank){
 const issues=[],ids=new Set(),counts={grades:bank.length,units:0,tasks:0,choiceTasks:0,sentences:0,labelTasks:0};
 const fail=(t,unit,reason)=>issues.push({unit,id:t.id,reason});
 for(const grade of bank)for(const unit of grade.units){counts.units++;for(const task of unit.tasks){
  counts.tasks++;if(!['description','vocabulary','completion','question','sentence','repair'].includes(task.kind))fail(task,unit.id,'Unsupported task kind');
  if(!text(task.id)||ids.has(task.id))fail(task,unit.id,'Missing or duplicate task ID');ids.add(task.id);
  if(!text(task.prompt)||!text(task.answer))fail(task,unit.id,'Empty prompt or answer');
  if(task.kind==='sentence'){
   counts.sentences++;
   if(!Array.isArray(task.blocks)||task.blocks.length<2||task.blocks.some(v=>!text(v))||key(task.blocks.join(' '))!==key(task.answer))fail(task,unit.id,'Sentence blocks do not reconstruct the answer');
  }else{
   counts.choiceTasks++;
   if(!answerChoicesValid(task,task.options)||task.options.length<2)fail(task,unit.id,'Choices must contain one correct answer and distinct nonempty alternatives');
   if(['vocabulary','description'].includes(task.kind))counts.labelTasks++;
   if(['completion','repair'].includes(task.kind)&&(task.prompt.match(/___/g)||[]).length!==1)fail(task,unit.id,'Expected one sentence gap');
   if(task.kind==='repair'&&(!text(task.broken)||key(task.broken)===key(task.answer)))fail(task,unit.id,'Correction does not change the broken word');
  }
 }}
 return {counts,issues};
}
