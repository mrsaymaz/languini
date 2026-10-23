// Reviewed wrong replies for conversation questions. Only the listed questions
// change, the correct reply stays first, and each list must be ready for Challenge.
export function applyReviewedDistractors(bank,review){
 const tasks=new Map(bank.flatMap(g=>g.units.flatMap(u=>u.tasks)).map(t=>[t.id,t])),changed=[];
 for(const [id,wrong]of Object.entries(review.wrongReplies)){
  const task=tasks.get(id);
  if(task?.kind!=='question')throw Error('Reviewed replies need a conversation question: '+id);
  if(!Array.isArray(wrong)||wrong.length!==3||new Set(wrong).size!==3||wrong.some(w=>typeof w!=='string'||!w.trim()||w.trim()!==w||w===task.answer))throw Error('Review wrong replies: '+id);
  task.options=[task.answer,...wrong];changed.push(id);
 }
 return {policy:review.policy,changed:changed.length};
}
