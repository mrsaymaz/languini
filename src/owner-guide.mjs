// Presentation only. This module never answers tasks or changes rewards/timers.
import {settingForTask} from './tasks.mjs';
import {checkoutStep} from './checkout-guidance.mjs';
export const OWNER_ASSETS=Object.freeze(Object.fromEntries(['full','bust','point','think','smile','cheer'].map(p=>[p,{small:`./assets/saymaz/${p}-160.webp`,large:`./assets/saymaz/${p}-${p==='full'?480:['point','think'].includes(p)?160:320}.webp`}])));
export function ownerInstruction(a){
 if(!a?.task)return 'Tap a ticket to start. Follow the station signs.';
 const t=a.task,s=settingForTask(t);
 if(s==='pickup')return 'Match the pickup numbers with their English words. Check every label before collection.';
 if(s==='recipe')return 'Drag an ingredient to the dish, or tap both.';
 if(s==='wash')return 'Connect the sentence blocks to clean this plate.';
 if(s==='delivery')return t.kind==='sorting'?'Move the parcel to its heading. Tap or drag.':'Place a label on the crate. Tap or drag.';
 if(s==='ticket')return 'Fill the gap. Tap a word to send the ticket.';
 if(s==='repair')return checkoutStep(a).title+'. '+checkoutStep(a).help;
 if(s==='conversation')return 'Read the question. Choose a matching reply.';
 if(t.kind==='matching')return t.mode==='audio-translation'?'Listen to a word, then tap its Turkish match.':'Tap a card, then its matching card.';
 return t.requested?'Listen to the guest. Choose both words, then confirm.':'Listen to the guest, then tap the word you heard.';
}
export function ownerClue(a){
 const t=a?.task;if(!t)return ownerInstruction(a);
 if(t.kind==='sentence')return 'Read what you have built. Which block continues the sentence?';
 if(t.variant==='washing')return 'Start with the subject. Follow the sentence through to the end.';
 if(t.kind==='repair')return 'Read the whole sentence. Check how the subject and verb fit together.';
 if(t.kind==='completion')return 'Read the words on both sides of the gap. What fits?';
 if(t.kind==='matching')return 'Compare one pair at a time. Hint can highlight a matching pair.';
 if(t.kind==='listening')return 'Use Replay to listen again. Hint adds written support.';
 if(t.kind==='sorting')return 'Read the parcel and both headings. Hint can show its meaning.';
 return 'Think about what the guest is asking. Which reply answers that question?';
}
const KEY='languini-owner-guidance-v1';
export class OwnerGuide {
 constructor({storage,getGame,getMode=()=> 'auto',notify=()=>{}}){
  Object.assign(this,{storage,getGame,getMode,notify});this.seen=new Set();this.failed=new WeakSet();this.clock=0;this.lastReaction=-100;this.active=null;this.remaining=0;this.priority=0;
  try{const saved=JSON.parse(storage.getItem(KEY)||'[]');if(Array.isArray(saved))this.seen=new Set(saved.filter(s=>typeof s==='string').slice(0,80));}catch{}
  document.querySelectorAll('img[data-owner-image]').forEach(img=>this.watchImage(img));
  document.getElementById('task-card')?.addEventListener('click',e=>{if(e.target.closest('#hint-button')&&this.active)this.show('think',ownerClue(this.active),10,3);});
 }
 watchImage(img){img.addEventListener('error',()=>{img.hidden=true;img.closest('[data-owner-art]')?.classList.add('owner-art-unavailable');});}
 remember(key){this.seen.add(key);try{this.storage.setItem(KEY,JSON.stringify([...this.seen]));}catch{}}
 reset(){this.seen.clear();try{this.storage.setItem(KEY,'[]');}catch{}}

 start(){this.clear();this.lastReaction=-100;if(this.getMode()!=='off'&&!this.seen.has('welcome')){this.remember('welcome');this.notify('Your restaurant is ready. Tap a ticket to start.','bust');}}
 clear(){this.active=null;this.remaining=0;this.priority=0;this.button=null;this.note=null;this.original=null;}
 openStation(a){
  this.clear();if(!a)return;this.active=a;
  const root=document.getElementById('task-card'),mark=root?.querySelector('.station-mark'),status=root?.querySelector('.station-status > span:last-child');if(!mark||!status)return;
  mark.classList.add('owner-station-mark');mark.replaceChildren();
  const b=document.createElement('button');b.type='button';b.className='owner-guide-toggle';b.setAttribute('aria-label','Chef: station help');b.setAttribute('aria-expanded','false');b.title='Station help · tap to open or dismiss';
  const img=document.createElement('img');img.width=40;img.height=52;img.alt='';img.decoding='async';img.src=OWNER_ASSETS.point.small;this.watchImage(img);b.append(img);mark.append(b);this.button=b;this.image=img;
  this.original=status.querySelector('small');this.note=document.createElement('small');this.note.className='owner-station-note';this.note.hidden=true;status.append(this.note);
  b.addEventListener('click',()=>{if(this.remaining>0)this.dismiss();else this.show('point',ownerInstruction(a),12,3);});
  const key='station:'+settingForTask(a.task)+':'+(a.task.mode||a.task.kind);
  if(this.getMode()!=='off'&&(this.getMode()==='always'||!this.seen.has(key))){this.remember(key);this.show('point',typeof innerWidth!=='undefined'&&innerWidth<760?({recipe:'Build a sentence.',conversation:'Choose a reply.',wash:'Connect the words.',delivery:'Match the label.',tablet:'Choose from the menu.',pickup:'Match each pair.',ticket:'Pick the missing word.',repair:'Find the mistake.'}[settingForTask(a.task)]||'Answer in English.'):ownerInstruction(a),8,2);}
 }
 show(pose,text,seconds=6,priority=1){
  if(!this.button?.isConnected||priority<this.priority&&this.remaining>0)return false;
  this.image.src=OWNER_ASSETS[pose].small;this.image.hidden=false;this.note.textContent=text;this.note.dataset.manual=String(priority===3);this.note.hidden=false;if(this.original)this.original.hidden=true;this.button.setAttribute('aria-expanded','true');this.button.setAttribute('aria-label','Dismiss Chef’s station help');this.note.setAttribute('role','status');this.remaining=seconds;this.priority=priority;return true;
 }
 dismiss(){if(this.note)this.note.hidden=true;if(this.original)this.original.hidden=false;this.remaining=0;this.priority=0;if(this.button){this.button.setAttribute('aria-expanded','false');this.button.setAttribute('aria-label','Chef: station help');this.image.src=OWNER_ASSETS.point.small;}}
 event(e){
  const g=this.getGame(),a=g?.active;
  if(e.type==='incorrect'&&a&&a.attempts>=2){this.failed.add(a);if(this.getMode()!=='off')this.show('think',ownerClue(a),7,2);}
  if(e.type==='correct'&&a&&this.failed.has(a)){this.dismiss();if(this.getMode()!=='off')this.show('smile','Good recovery! You can continue this order.',4,1);}
  if(e.type==='served'&&g?.served>0&&g.served%3===0&&!g.closingService&&this.getMode()!=='off'&&this.clock-this.lastReaction>25){this.lastReaction=this.clock;this.notify('Three more guests served. Lovely teamwork!','cheer');}
 }
 tick(dt){
  const g=this.getGame();if(!g||g.paused||document.hidden)return;this.clock+=dt;
  if(this.active&&g.active!==this.active){this.dismiss();this.clear();return;}
  if(g.taskTimingReady===false)return;
  if(this.remaining>0){this.remaining=Math.max(0,this.remaining-dt);if(!this.remaining)this.dismiss();}
 }
 result(result){
  this.clear();const img=document.getElementById('owner-result-image'),copy=document.getElementById('owner-result-copy');if(!img||!copy)return;
  const pose=result.won?'cheer':'smile';img.hidden=false;img.src=OWNER_ASSETS[pose].large;img.srcset=`${OWNER_ASSETS[pose].small} 160w, ${OWNER_ASSETS[pose].large} 320w`;img.sizes='92px';
  copy.textContent=result.venueUnlocked?'Excellent service! Your next restaurant is ready.':result.won?'Excellent service! Take a moment to enjoy it.':'Every shift is practice. Let’s try again.';
 }
}
