const profiles={
 courtyard:{level:0,washPlates:3,deliveryLabels:1,menuRounds:1,ticketRounds:1,checkoutRounds:1},
 bistro:{level:1,washPlates:6,deliveryLabels:2,menuRounds:1,ticketRounds:1,checkoutRounds:1},
 banquet:{level:2,washPlates:9,deliveryLabels:3,menuRounds:2,ticketRounds:2,checkoutRounds:2}
};
export function venueLearning(arena){return profiles[arena]||profiles.courtyard;}
export function activityRounds(arena,setting,kind,difficulty='relaxed'){
 const p=venueLearning(arena);
 return setting==='pickup'?(difficulty==='challenge'?2:1):setting==='wash'?p.washPlates:setting==='delivery'?(kind==='sorting'?1:p.deliveryLabels):setting==='tablet'?p.menuRounds:setting==='ticket'?p.ticketRounds:setting==='repair'?p.checkoutRounds:1;
}
// Preserve the order format, adding the later restaurant's required checks.
export function venueRoute(route,arena){
 const level=venueLearning(arena).level;if(!level)return route;
 const out=route.map(s=>({...s}));
 if(!out.some(s=>s.setting==='tablet'))out.splice(Math.max(0,out.findIndex(s=>s.setting==='recipe')),0,{setting:'tablet',phase:'order'});
 if(!out.some(s=>s.setting==='ticket'))out.splice(Math.max(0,out.findIndex(s=>s.setting==='recipe')),0,{setting:'ticket',phase:'prepare'});
 if(!out.some(s=>s.setting==='repair')){const final=out.findIndex(s=>s.phase==='serve');out.splice(final<0?out.length:final,0,{setting:'repair',phase:'serve'});}
 if(level===2){
  if(!out.some(s=>s.setting==='conversation'&&s.phase==='order'))out.unshift({setting:'conversation',phase:'order'});
  if(!out.some(s=>s.setting==='conversation'&&s.phase==='serve'))out.push({setting:'conversation',phase:'serve'});
 }
 return out;
}
