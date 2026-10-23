// Task clocks are model state; UI readiness/audio only supply a running gate.
export function freshnessBudget(task,difficulty='relaxed'){
 const words=String(task.answer||task.prompt||'').trim().split(/\s+/).length;
 const base=task.takeawayKind==='instructions'?34+task.pairs.length*7:task.kind==='matching'?22+task.pairs.length*5:task.kind==='sorting'?22+task.cards.length*4:task.kind==='repair'?38:task.kind==='sentence'?25:task.requested?30:task.kind==='question'?27:24;
 return Math.round((base+Math.min(14,words*.8))*(difficulty==='challenge'?.75:1));
}
export function ensureFreshness(active,difficulty='relaxed'){
 if(!active)return null;
 return active.freshness??={duration:freshnessBudget(active.task,difficulty),remaining:freshnessBudget(active.task,difficulty),started:false};
}
export function freshnessState(clock){
 const ratio=clock?Math.max(0,Math.min(1,clock.remaining/clock.duration)):1;
 return {ratio,grade:ratio>.5?'great':ratio>.25?'good':'late',seconds:Math.ceil(Math.max(0,clock?.remaining||0))};
}
export function advanceFreshness(active,dt,difficulty='relaxed',ready=true){
 const c=ensureFreshness(active,difficulty);if(!c||active.completed||!ready)return;
 const step=Math.max(0,Math.min(.25,Number.isFinite(dt)?dt:0));if(step>0)c.started=true;c.remaining=Math.max(0,c.remaining-step);
}
export function settleFreshness(active,difficulty='relaxed'){
 const c=ensureFreshness(active,difficulty);return {...freshnessState(c),timed:c.started};
}
export function freshnessTip(table,difficulty='relaxed'){
 return table?.freshnessCount?Math.round(2*table.freshnessScore/table.freshnessCount)*(difficulty==='challenge'?2:1):0;
}
export function freshnessRingMarkup(){return '<div class="freshness-ring" id="freshness-ring" data-grade="great" role="timer" aria-live="off" aria-label="Task freshness"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="freshness-track" cx="24" cy="24" r="20"/><circle id="freshness-arc" class="freshness-arc" cx="24" cy="24" r="20" pathLength="100"/></svg><b id="freshness-seconds"></b><small id="freshness-grade">Great</small></div>';}
