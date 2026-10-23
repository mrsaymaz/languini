import {customerRating,ratingText} from './reputation.mjs';
import {diningStage} from './customer-reviews.mjs';
import {icon} from './icons.mjs';
import {reviewCardPose} from './review-card-motion.mjs';
export function reviewMetrics(width,height){const phone=width<760;return {phone,width:Math.min(phone?148:190,width-24),height:phone?140:174,top:phone?(height>420?172:96):Math.min(104,height*.22),bottom:height-(phone?118:72),scoreWidth:Math.min(phone?192:250,width-28)};}
// Native text stays crisp above its table; no pointer targets cover the arena.
export class ReviewCards {
 constructor(root){this.root=root;this.cards=new Map();this.scores=new Map();}
 update(game,view,width,height){
  this.root.hidden=!game||game.state!=='playing'||!!game.focused||!!view?.focus||!!view?.menu;
  this.updateScores(game,view,width,height);const live=new Set(),placed=[],obstacles=[...(typeof document!=='undefined'?(document.querySelectorAll?.('.kitchen-world-actions button,.kitchen-orders,.overview-controls')||[]):[])].filter(n=>!n.hidden).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height).map(r=>({left:r.left-6,right:r.right+6,top:r.top-6,bottom:r.bottom+6}));
  for(const t of game?.tables||[]){
   const phase=diningStage(t.dining);if(t.status!=='leaving'||!['review','spin'].includes(phase?.stage))continue;
   live.add(t.orderId);let card=this.cards.get(t.orderId);
   if(!card){card=document.createElement('section');card.className='customer-review';card.setAttribute('aria-label',`Customer review, ${t.pickup?'Pickup':'Table '+(t.id+1)}`);
    card.innerHTML=`<div class="review-shadow" aria-hidden="true"></div><div class="review-turntable"><div class="review-face review-front"><header><span>LANGUINI<small>${t.pickup?'PICKUP':'TABLE '+(t.id+1)} · #${t.orderId}</small></span><i class="review-medallion">${icon('serve')}</i></header><h3 class="review-customer-name">Guest review</h3><div class="review-ratings">`+['taste','service','speed'].map(key=>`<div class="rating-row"><b>${key[0].toUpperCase()+key.slice(1)}</b><span aria-label="${t.dining.ratings[key]??'Not assessed'} out of 3 stars">${[1,2,3].map(n=>`<i class="review-star">${icon('star',n<=(t.dining.ratings[key]||0)?'earned':'unearned')}</i>`).join('')}</span></div>`).join('')+`</div><footer>${icon('check')} Thank you, chef!</footer><div class="review-foil" aria-hidden="true"></div></div><div class="review-face review-back" aria-hidden="true"><div class="review-back-frame"><span class="review-monogram">L</span><b>LANGUINI</b><small>A lovely day’s service</small><span class="review-back-stars">${icon('star')}${icon('star')}${icon('star')}</span></div><div class="review-foil"></div></div><i class="review-edge edge-left" aria-hidden="true"></i><i class="review-edge edge-right" aria-hidden="true"></i><i class="review-edge edge-top" aria-hidden="true"></i><i class="review-edge edge-bottom" aria-hidden="true"></i></div>`;
    card.querySelector('.review-customer-name').textContent=t.name||'Customer review';this.root.append(card);this.cards.set(t.orderId,card);
   }
   const metrics=reviewMetrics(width,height),point=view.projectTable(t.id),w=metrics.width,h=metrics.height,top=metrics.top,bottom=metrics.bottom;card.dataset.compact=String(metrics.phone);
   let x=Math.max(w/2+12,Math.min(width-w/2-12,point.x)),y=Math.max(top+h,Math.min(bottom,point.y-10));
   const candidates=[];
   for(const dx of [0,-w-8,w+8,-2*(w+8),2*(w+8)])for(const dy of [0,h+8,-h-8,2*(h+8)]){
    const cx=Math.max(w/2+12,Math.min(width-w/2-12,x+dx)),cy=Math.max(Math.min(bottom,top+h),Math.min(bottom,y+dy));
    const overlap=placed.reduce((n,o)=>n+Math.max(0,w+8-Math.abs(cx-o.x))*Math.max(0,h+8-Math.abs(cy-o.y)),0);
    candidates.push({x:cx,y:cy,cost:(overlap+obstacles.reduce((sum,r)=>sum+Math.max(0,Math.min(cx+w/2,r.right)-Math.max(cx-w/2,r.left))*Math.max(0,Math.min(cy,r.bottom)-Math.max(cy-h,r.top)),0))*1000+Math.abs(cx-x)+Math.abs(cy-y)});
   }
   ({x,y}=candidates.sort((a,b)=>a.cost-b.cost)[0]);
   placed.push({x,y});card.style.left=x+'px';card.style.top=y+'px';card.style.width=w+'px';
   const pose=reviewCardPose(phase.stage,phase.progress,{reduced:view.reduced}),turntable=card.querySelector('.review-turntable');
   card.style.height=h+'px';card.style.transform='translate(-50%,-100%)';card.style.opacity=String(pose.opacity);
   turntable.style.transform=`translateY(${pose.lift}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg) scale(${pose.scale})`;
   card.querySelector('.review-shadow').style.transform=`translateY(7px) scaleX(${.25+.75*Math.abs(Math.cos(pose.ry*Math.PI/180))})`;
   card.style.setProperty('--review-shine',String(pose.shine*180-80)+'%');card.style.setProperty('--review-front-light',String(pose.frontLight));card.style.setProperty('--review-back-light',String(pose.backLight));
  }
  for(const [id,card]of this.cards)if(!live.has(id)){card.remove();this.cards.delete(id);}
 }
 updateScores(game,view,width,height){
  const live=new Set(),placed=[];
  for(const t of game?.tables||[]){
   const phase=diningStage(t.dining);if(t.status!=='leaving'||phase?.stage!=='score')continue;
   const score=t.dining.score??customerRating(t.dining.ratings);if(score==null)continue;live.add(t.orderId);let node=this.scores.get(t.orderId);
   if(!node){node=document.createElement('section');node.className='customer-rating';node.dataset.high=String(score>4);node.dataset.perfect=String(score===5);node.setAttribute('role','status');
    const label=document.createElement('strong');label.textContent=(t.name||'Customer')+': '+ratingText(score)+' STARS';node.append(label);
    const stars=document.createElement('span');stars.className='rating-stars';stars.setAttribute('aria-hidden','true');stars.innerHTML=Array.from({length:5},(_,i)=>icon('star',i<Math.round(score)?'earned':'unearned')).join('');node.append(stars);
    const caption=document.createElement('small');caption.textContent=score===5?'PERFECT REVIEW!':score>4?'A LOVELY REVIEW!':'THANK YOU FOR YOUR REVIEW';node.append(caption);this.root.append(node);this.scores.set(t.orderId,node);
   }
   const point=view.projectTable(t.id),w=reviewMetrics(width,height).scoreWidth,h=width<760?84:104,low=width<760?Math.min(height-118,256):Math.min(height-84,Math.max(176,height*.28));let x=Math.max(w/2+14,Math.min(width-w/2-14,point.x)),y=Math.max(low,Math.min(height-84,point.y-12));
   for(const p of placed)if(Math.abs(p.y-y)<h&&Math.abs(p.x-x)<w)y=Math.max(low,Math.min(height-84,p.y+h+8));placed.push({x,y});node.style.left=x+'px';node.style.top=y+'px';node.style.width=w+'px';node.style.opacity=String(Math.min(1,phase.progress*12,(1-phase.progress)*9));
  }
  for(const [id,node]of this.scores)if(!live.has(id)){node.remove();this.scores.delete(id);}
 }

}
