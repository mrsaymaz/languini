// Intervals are measured in completed English activities, not elapsed seconds.
const keyOf=text=>String(text||'').normalize('NFKC').toLowerCase().trim().replace(/[.!?]+$/,'');
const number=(value,max=1000000)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):0;
export function cleanLearning(value={}){
  const clock=number(value.clock),items={};
  for(const [key,record]of Object.entries(value.items||{}).slice(-2400)){
    if(key.length>200||!record||typeof record!=='object')continue;
    items[key]={independent:number(record.independent),supported:number(record.supported),streak:number(record.streak,20),last:Math.min(clock,number(record.last)),due:number(record.due)};
  }
  return {clock,items};
}
export class LearningMemory {
  constructor(tasks,state={}){
    this.state=cleanLearning(state);this.vocabulary=new Map(tasks.filter(t=>t.kind==='vocabulary').map(t=>[keyOf(t.answer),t.answer]));
  }
  keys(task){
    if(task.variant==='takeaway-numbers')return task.pairs.map(p=>'number:'+p.number);
    if(task.takeawayKind)return task.pairs.map(p=>'service:'+task.takeawayKind+':'+p.id);
    if(task.kind==='sorting')return task.cards.map(c=>'classification:'+c.id);
    if(task.kind==='matching')return task.pairs.map(p=>'word:'+keyOf(p.word));
    if(task.requested)return task.requested.map(p=>'word:'+keyOf(p.word));
    const answer=keyOf(task.answer),source=task.sourceId||task.id;
    if(['vocabulary','description','definition','listening'].includes(task.kind)&&this.vocabulary.has(answer))return ['word:'+answer];
    return ['task:'+source];
  }
  priority(task){
    return Math.max(...this.keys(task).map(key=>{const r=this.state.items[key];return !r?1:r.due<=this.state.clock?4+(this.state.clock-r.due)/100:r.streak>=3?-2:0;}));
  }
  record(task,{supported=false,pairSupport=[]}={}){
    this.state.clock++;
    this.keys(task).forEach((key,index)=>{
      const assisted=supported||pairSupport.includes(index),r=this.state.items[key]||{independent:0,supported:0,streak:0,last:0,due:0};
      r[assisted?'supported':'independent']++;r.streak=assisted?0:Math.min(20,r.streak+1);r.last=this.state.clock;
      r.due=this.state.clock+(assisted?3:[5,12,25,45][Math.min(3,r.streak-1)]);this.state.items[key]=r;
    });
  }
  summary(){const records=Object.values(this.state.items);return {independent:records.reduce((n,r)=>n+r.independent,0),supported:records.reduce((n,r)=>n+r.supported,0),secure:records.filter(r=>r.streak>=3).length};}
}
