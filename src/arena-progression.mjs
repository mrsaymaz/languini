// Saved successful services unlock each restaurant in sequence.
function completed(profile,arena){
 return Object.entries(profile?.records||{}).some(([key,r])=>new RegExp('^([5-8]):g\\1u\\d{1,2}:(gryffindor|hufflepuff|slytherin|ravenclaw):(relaxed|challenge):'+arena+'$').test(key)&&Number.isInteger(r?.wins)&&r.wins>0);
}
export const cafeCompleted=profile=>completed(profile,'courtyard');
export const dinerCompleted=profile=>completed(profile,'bistro');
export function arenaUnlocked(profile,arena){return arena==='courtyard'||arena==='bistro'&&cafeCompleted(profile)||arena==='banquet'&&cafeCompleted(profile)&&dinerCompleted(profile);}
export function arenaRequirement(arena){return 'Win Languini '+(arena==='banquet'?'Diner':'Cafe')+' to unlock';}
export function permittedArena(profile,arena){return arenaUnlocked(profile,arena)?arena:arenaUnlocked(profile,'bistro')?'bistro':'courtyard';}
