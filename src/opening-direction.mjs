// Shared edit sheet for acting, cameras, subtitles and sound. All times are seconds.
export const TAKEOVER_SHOTS=[
 {id:'memory',duration:4,title:'Once, this was everyone’s favourite café.'},
 {id:'handover',duration:5,title:'A promise. A fresh start.'},
 {id:'inspection',duration:6,title:'There is work to do.'},
 {id:'cleaning',duration:7,title:'Care comes first.'},
 {id:'repair',duration:4,title:'The kitchen comes back to life.'},
 {id:'opening',duration:6,title:'A fresh start begins with you.'}
];
export const TAKEOVER_DURATION=TAKEOVER_SHOTS.reduce((n,s)=>n+s.duration,0);
export const OPENING_BEATS=[
 ['remember',0,1.15],['straighten-sign',1.15,2.8],['look-back',2.8,4],
 ['offer-keys',4,4.6],['owner-promise',4.6,6.7],['chef-promise',6.7,7.7],['farewell',7.7,9],
 ['sticky-table',9,10.7],['try-till',10.7,12],['try-cooker',12,13.2],['resolve',13.2,15],
 ['sweep-floor',15,16.7],['wipe-table',16.7,18.3],['notice-photo',18.3,19],['wipe-photo',19,20.5],['study-photo',20.5,21.3],['straighten-photo',21.3,22],
 ['repair-cooker',22,24],['repair-till',24,26],['turn-open',26,27.15],['wait',27.15,28.3],['welcome',28.3,29.2],['reveal',29.2,32]
].map(([id,start,end])=>({id,start,end}));
export const OPENING_EVENTS={signStraight:2.2,keyTransfer:6.7,firstTillPress:10.98,secondTillPress:11.45,cookerTry:12.32,photoClean:20.5,cookerPanelClosed:23.35,cookerWorking:23.5,tillPanelClosed:25.35,tillWorking:25.5,lights:26.15,openSign:26.85,bell:28.3};
export const progress=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
export const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function takeoverShot(elapsed){let start=0;for(let index=0;index<TAKEOVER_SHOTS.length;index++){const s=TAKEOVER_SHOTS[index];if(elapsed<start+s.duration||index===TAKEOVER_SHOTS.length-1)return {...s,index,start,progress:progress(elapsed,start,start+s.duration)};start+=s.duration;}}
export function openingBeat(elapsed){const b=OPENING_BEATS.find(b=>elapsed<b.end)||OPENING_BEATS.at(-1);return {...b,progress:progress(elapsed,b.start,b.end)};}
export function takeoverCaption(t){
 const beat=openingBeat(t).id;
 if(['offer-keys','owner-promise'].includes(beat))return {speaker:'PREVIOUS OWNER',text:'“Please take good care of Languini.”'};
 if(beat==='chef-promise')return {speaker:'CHEF',text:'“I will.”'};
 const text={remember:'It used to be full of life.','straighten-sign':'Some places are worth another chance.','look-back':'Its next chapter starts with you.',farewell:'A promise worth keeping.','sticky-table':'This café needs some care.','try-till':'The checkout won’t start.','try-cooker':'Neither will the cooker.',resolve:'2.1 stars. A fresh start.','sweep-floor':'One small change…','wipe-table':'…then another.','notice-photo':'Something worth saving.','wipe-photo':'The good days are still here.','study-photo':'Let’s bring them back.','straighten-photo':'A place for new memories.','repair-cooker':'A little patience. A steady hand.','repair-till':'Ready for a second chance.','turn-open':'A fresh start begins with you.',wait:'',welcome:'Your first customer.',reveal:'Let’s earn back their trust.'}[beat];
 return {speaker:'',text:text??''};
}
// Let the doorbell own the quiet beat; Foley retains its independent bus.
export function storyMusicLevel(t){if(t>=27.05&&t<28.3)return .035;if(t>=28.3&&t<28.7)return .035+progress(t,28.3,28.7)*.815;if(t>=9&&t<15)return .45;return t<15?.7:.85;}
