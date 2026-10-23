import {icon} from './icons.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const GRADE_LEVELS=Object.freeze({5:'A1',6:'A1+',7:'A2',8:'A2+'});
// Browsing copy only; assessed content remains in the protected language bank.
export const UNIT_DESCRIPTIONS=Object.freeze({
 g5u1:'School places, subjects and everyday school routines.',g5u2:'Classroom objects, instructions and learning together.',g5u3:'Daily routines, interests and personal information.',g5u4:'Family members, relationships and life at home.',g5u5:'Places in town, directions and neighbourhood life.',g5u6:'Countries, people and places around the world.',g5u7:'Animals, plants, weather and the natural world.',g5u8:'Space, planets and ideas about the future.',g5u9:'Jobs, workplaces and what people do.',g5u10:'Toys, preferences and shopping conversations.',
 g6u1:'School activities, responsibilities and people at school.',g6u2:'Classroom routines, teamwork and learning activities.',g6u3:'Habits, hobbies and talking about everyday life.',g6u4:'Family life, shared activities and responsibilities.',g6u5:'City places, local services and finding your way.',g6u6:'Countries, traditions and cultural experiences.',g6u7:'Nature, environmental problems and caring for the planet.',g6u8:'The universe, inventions and future possibilities.',g6u9:'Prices, purchases and talking about money.',g6u10:'Healthy habits, feelings and everyday well-being.',
 g7u1:'Describe people’s looks, character and personal qualities.',g7u2:'Sports, equipment, training and sporting habits.',g7u3:'Life stories, achievements and events in the past.',g7u4:'Wildlife, habitats and protecting endangered animals.',g7u5:'TV programmes, preferences and viewing habits.',g7u6:'Parties, invitations and organising celebrations.',g7u7:'Dreams, hopes and predictions about the future.',g7u8:'Public places, services and reasons to visit them.',g7u9:'Environmental problems and ways to protect nature.',g7u10:'Planets, space exploration and comparisons.',g7u11:'Ingredients, kitchen tools and preparing food.',g7u12:'Travel plans, holiday activities and destinations.',
 g8u1:'Friendship, invitations, trust and making arrangements.',g8u2:'Teenage routines, interests and preferences.',g8u3:'Recipes, cooking methods and kitchen equipment.',g8u4:'Phone conversations, messages and staying in touch.',g8u5:'Online activities, communication and internet habits.',g8u6:'Adventure activities, equipment and preferences.',g8u7:'Destinations, sightseeing and travel experiences.',g8u8:'Household jobs, responsibilities and helping at home.',g8u9:'Discoveries, inventions and scientific work.',g8u10:'Natural events, disasters and their effects.',g8u11:'Shopping, prices and everyday service conversations.',g8u12:'Animals, pet needs and responsible care.'
});
export const unitNumber=u=>Number(/u(\d+)$/.exec(u?.id||'')?.[1])||1;
export class LessonPicker {
 constructor({getBank,getConfig,onSelect,onOpen,onClose}){
  Object.assign(this,{getBank,getConfig,onSelect,onOpen,onClose});
  this.showTopics=false;this.root=document.getElementById('lesson-modal');this.tabs=document.getElementById('lesson-grade-options');this.list=document.getElementById('lesson-unit-list');this.trigger=document.getElementById('choose-lesson');
  document.getElementById('lesson-topics-toggle').addEventListener('click',()=>{this.showTopics=!this.showTopics;this.render();});
  this.tabs.addEventListener('click',e=>{const b=e.target.closest('[data-lesson-grade]');if(b)this.chooseGrade(+b.dataset.lessonGrade);});
  this.tabs.addEventListener('keydown',e=>{const grades=this.getBank().map(g=>g.grade),at=grades.indexOf(this.grade);let next;if(e.key==='ArrowRight')next=grades[(at+1)%grades.length];if(e.key==='ArrowLeft')next=grades[(at+grades.length-1)%grades.length];if(e.key==='Home')next=grades[0];if(e.key==='End')next=grades.at(-1);if(next){e.preventDefault();this.chooseGrade(next);this.tabs.querySelector('[aria-selected="true"]')?.focus();}});
  this.list.addEventListener('click',e=>{const b=e.target.closest('[data-lesson-unit]');if(b)this.chooseUnit(b.dataset.lessonUnit);});
  document.getElementById('close-lessons').addEventListener('click',()=>this.close());
  this.root.addEventListener('click',e=>{if(e.target===this.root)this.close();});
 }
 sync(){
  const c=this.getConfig(),grade=this.getBank().find(g=>g.grade===c.grade),u=grade?.units.find(u=>u.id===c.unit);if(!u)return;
  this.trigger.innerHTML=`<span class="lesson-grade-token" aria-hidden="true">${c.grade}</span><span class="lesson-selection"><small>GRADE ${c.grade} · ${GRADE_LEVELS[c.grade]} · UNIT&nbsp;${unitNumber(u)}</small><strong>${esc(u.title)}</strong></span>${icon('arrow')}`;
  this.trigger.setAttribute('aria-label',`Choose lesson. Grade ${c.grade} ${GRADE_LEVELS[c.grade]}, Unit ${unitNumber(u)}: ${u.title}`);
  if(this.root.hidden)this.grade=c.grade;
  this.render();
 }
 render(){
  const bank=this.getBank(),c=this.getConfig(),grade=bank.find(g=>g.grade===this.grade)||bank[0];if(!grade)return;this.grade=grade.grade;
  this.tabs.innerHTML=bank.map(g=>`<button type="button" role="tab" id="lesson-grade-${g.grade}" data-lesson-grade="${g.grade}" aria-selected="${this.grade===g.grade}" aria-label="Grade ${g.grade} ${GRADE_LEVELS[g.grade]}" aria-controls="lesson-unit-list" tabindex="${this.grade===g.grade?'0':'-1'}"><span>GRADE ${g.grade}</span><b>${GRADE_LEVELS[g.grade]}</b></button>`).join('');
  this.list.setAttribute('aria-labelledby','lesson-grade-'+this.grade);
  this.list.innerHTML=grade.units.map(u=>{const selected=c.grade===grade.grade&&c.unit===u.id;return `<button type="button" class="lesson-unit-card" data-lesson-unit="${esc(u.id)}" aria-pressed="${selected}"><span class="lesson-unit-number" aria-hidden="true">${unitNumber(u)}</span><span class="lesson-unit-copy"><strong>${esc(u.title)}</strong><span>${esc(UNIT_DESCRIPTIONS[u.id]||'Explore vocabulary and everyday English in this unit.')}</span>${u.subthemes?.length?`<span class="lesson-unit-topics" ${this.showTopics?'':'hidden'}>${esc(u.subthemes.map(s=>s.title).join(' · '))}</span>`:''}</span><span class="lesson-unit-check" aria-hidden="true">${icon(selected?'check':'arrow')}</span></button>`;}).join('');
  document.getElementById('lesson-list-label').textContent=`${grade.units.length} units`;const topics=document.getElementById('lesson-topics-toggle');topics.hidden=!grade.units.some(u=>u.subthemes?.length);topics.textContent=this.showTopics?'Hide topics':'Show topics';topics.setAttribute('aria-pressed',String(this.showTopics));
 }
 open(){this.showTopics=false;this.grade=this.getConfig().grade;this.render();this.onOpen();this.tabs.querySelector('[aria-selected="true"]')?.focus();this.list.querySelector('[aria-pressed="true"]')?.scrollIntoView?.({block:'nearest'});}
 close(){if(this.root.hidden)return;this.onClose();this.grade=this.getConfig().grade;}
 chooseGrade(grade){if(!this.getBank().some(g=>g.grade===grade))return;this.grade=grade;this.render();this.list.scrollTop=0;this.tabs.querySelector('[aria-selected="true"]')?.focus();}
 chooseUnit(id){const g=this.getBank().find(g=>g.grade===this.grade),u=g?.units.find(u=>u.id===id);if(!u)return false;this.onSelect(g.grade,u.id);this.close();return true;}
}
