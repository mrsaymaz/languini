// One food critic per normal shift: the first ordinary dine-in guest after the
// opening order. Every English task for them must be right first time without
// a hint; a perfect visit writes a five-star review that counts three times.
// A slip or a lost critic costs nothing beyond the usual review.
export const CRITIC_WEIGHT=3;
export const CRITIC_GREETING='I write about cafés. Today I only accept answers that are right the first time!';
export function criticCandidate(game,{pickup,event,final,large}){
  return !game.demoSetting&&!game.criticSpawned&&!pickup&&!event&&!final&&!large&&game.sequence>=1;
}
export function criticSummary(review){
  if(!review)return null;
  if(review.left)return {title:'The food critic left',copy:`${review.name} left before eating. There is no extra review this time.`};
  return review.perfect?{title:'Five stars from the food critic',copy:`${review.name}: every answer was right first time. This review counts ${CRITIC_WEIGHT} times.`}:{title:'The food critic noticed',copy:`${review.name} saw a mistake or a hint, so this review counts once. Try for first-time answers next shift.`};
}
