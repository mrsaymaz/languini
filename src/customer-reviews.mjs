// Order-owned assessments survive task replacement, including all prep phases.
export const DINING={eat:3.8,review:3.2,spin:1.05,score:2.1,depart:.4};
export const diningDuration=Object.values(DINING).reduce((a,b)=>a+b,0);
export function newOrderReview(){return {taste:[],service:[],speed:[]};}
export function taskQuality(a){return Math.max(.15,1-Math.max(0,a.attempts-1)*.22-((a.hinted||a.repairCueShown)?.2:0));}
export function recordOrderReview(table,a,setting){
 const r=table.reviewScores??=newOrderReview();
 r[setting==='recipe'?'taste':'service'].push(taskQuality(a));
 r.speed.push(a.freshnessResult?.ratio??1);
}
const mean=list=>list.reduce((a,b)=>a+b,0)/list.length;
export function customerReview(table,cleanliness=1){
 const r=table.reviewScores||newOrderReview(),stars=(value,high=.85,mid=.55)=>value==null?null:value>=high?3:value>=mid?2:1;
 return {taste:stars(r.taste.length?mean(r.taste):null),service:stars(mean([...r.service,cleanliness])),speed:stars(r.speed.length?mean(r.speed):null,.5,.25)};
}
export function diningStage(dining){
 if(!dining)return null;let t=dining.elapsed;
 for(const [stage,duration]of Object.entries(DINING)){if(t<duration)return {stage,progress:Math.max(0,t/duration)};t-=duration;}
 return {stage:'done',progress:1};
}
export function eatingPose(elapsed,{reduced=false}={}){
 const bite=Math.max(0,Math.sin(elapsed*Math.PI*1.5));
 return {armX:reduced?-1.8:-1.0-bite*1.25,armZ:reduced?-.25:-bite*.48,headX:reduced?.08:.07+bite*.09,mouth:reduced?.5:.4+Math.abs(Math.sin(elapsed*12))*.26};
}
