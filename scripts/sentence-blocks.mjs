// Authored constituent boundaries, reviewed independently of the visual layout.
// Missing future sentences must be reviewed rather than split to fill UI slots.
export function applySentenceBlocks(bank,review){
 const counts={},changed=[];let total=0;
 for(const grade of bank)for(const unit of grade.units)for(const task of unit.tasks){
  if(task.kind!=='sentence')continue;
  const entry=review.sentences[task.answer];
  if(!entry||entry.blocks.length<2||entry.blocks.length>8||entry.blocks.length!==entry.roles.length||entry.blocks.some(b=>!b.trim())||entry.blocks.join(' ')!==task.answer)throw Error('Review grammatical blocks: '+task.id);
  if(JSON.stringify(task.blocks)!==JSON.stringify(entry.blocks))changed.push(task.id);
  task.blocks=[...entry.blocks];task.blockRoles=[...entry.roles];
  counts[entry.blocks.length]=(counts[entry.blocks.length]||0)+1;total++;
 }
 return {policy:review.policy,total,changed:changed.length,byBlockCount:counts};
}
