export const INHERITED_REVIEWS=150,INHERITED_TOTAL=315;
export const REPUTATION_MILESTONES=[
 {rating:2.5,title:'Another chance',copy:'Customers are giving your café another chance.',owner:'They are giving us another chance. Keep earning their trust!',returning:'I heard the café has a new owner. I wanted to try it again.'},
 {rating:3,title:'Regulars return',copy:'Familiar faces are finding their way back.',owner:'Our regulars are coming back. They can see your hard work!',returning:'It is good to be back. The café feels different now.'},
 {rating:3.5,title:'Word spreads',copy:'Guests are telling their friends about Languini.',owner:'Word is spreading! Your guests are recommending Languini.',returning:'I told my friends about this place!'},
 {rating:4,title:'A neighbourhood favourite',copy:'Your café has become a local favourite.',owner:'Four stars! You have made this a neighbourhood favourite.',returning:'This is one of my favourite places in the neighbourhood.'},
 {rating:4.5,title:'The turnaround is complete',copy:'A struggling café has become a place people love.',owner:'Look how far we have come. You have turned this café around!',returning:'You have turned this café into somewhere special.'}
];
export const reputationKey=c=>`${c.grade}:${c.team}:${c.arena}`;
const validKey=k=>/^[5-8]:(gryffindor|hufflepuff|slytherin|ravenclaw):(courtyard|bistro|banquet)$/.test(k);
export function cleanReputation(value={}){
 const count=Number.isInteger(value.count)&&value.count>=0?Math.min(1e6,value.count):0;
 const total=Number.isFinite(value.total)?Math.max(count,Math.min(count*5,value.total)):count*3;
 return {count,total,introSeen:value.introSeen===true,shiftSerial:Number.isSafeInteger(value.shiftSerial)&&value.shiftSerial>=0?value.shiftSerial:0,level:Math.max(0,Math.min(5,Math.floor(value.level)||0)),credited:[...new Set((Array.isArray(value.credited)?value.credited:[]).filter(v=>typeof v==='string'&&/^\d+:\d+$/.test(v)))].slice(-256)};
}
export function cleanReputations(value={}){return Object.fromEntries(Object.entries(value||{}).filter(([k])=>validKey(k)).map(([k,v])=>[k,cleanReputation(v||{})]));}
export function reputationAverage(value={}){const s=cleanReputation(value);return (INHERITED_TOTAL+s.total)/(INHERITED_REVIEWS+s.count);}
export function reputationSnapshot(value={}){const s=cleanReputation(value);return {average:reputationAverage(s),reviews:INHERITED_REVIEWS+s.count,newReviews:s.count,level:s.level};}
export function customerRating(ratings={}){const values=['taste','service','speed'].map(k=>ratings[k]).filter(n=>Number.isFinite(n)&&n>=1&&n<=3);return values.length?values.reduce((a,b)=>a+b,0)/values.length/3*5:null;}
export function ratingText(value){return Number.isFinite(value)?String(Math.round(value*10)/10):'—';}
export function creditReview(state,id,value){
 if(!Number.isFinite(value)||value<1||value>5||!/^\d+:\d+$/.test(id)||state.credited.includes(id))return null;
 const before=reputationSnapshot(state);state.count++;state.total+=value;state.credited=[...state.credited,id].slice(-256);
 const average=reputationAverage(state),level=REPUTATION_MILESTONES.filter(m=>average+1e-10>=m.rating).length;
 const milestones=REPUTATION_MILESTONES.slice(state.level,Math.max(state.level,level));state.level=Math.max(state.level,level);
 return {before,after:reputationSnapshot(state),milestones};
}
export function reputationProgress(before,state,reviews=[]){const after=reputationSnapshot(state),next=REPUTATION_MILESTONES.find(m=>m.rating>after.average+1e-10);return {before,after,change:after.average-before.average,count:reviews.length,shiftAverage:reviews.length?reviews.reduce((a,b)=>a+b.score,0)/reviews.length:null,next,progress:next?Math.max(0,Math.min(1,(after.average-2.1)/(next.rating-2.1))):1};}
