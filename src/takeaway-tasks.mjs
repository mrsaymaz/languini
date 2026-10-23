import {takeawayNumberTask,numberWords} from './takeaway-numbers.mjs';
import {CUSTOMER_PROFILES} from './customer-profiles.mjs';
export const TAKEAWAY_MODES=[
 {id:'names',name:'Names on bags',after:1,columns:['ORDER FOR','BAG NAME']},
 {id:'quantities',name:'Order quantities',after:2,columns:['ORDER NOTE','PACKING LABEL']},
 {id:'times',name:'Collection times',after:3,columns:['COLLECTION TIME','SAY THE TIME']},
 {id:'instructions',name:'Packing requests',after:4,columns:['CUSTOMER REQUEST','BAG LABEL']}
];
export function practicalMode(progress=0){const available=TAKEAWAY_MODES.filter(m=>progress>=m.after);return available.length?available[(progress-1)%available.length].id:null;}
const foods=[['sandwich','sandwiches'],['soup','soups'],['salad','salads'],['burger','burgers'],['drink','drinks'],['pancake','pancakes'],['apple','apples'],['banana','bananas']];
export function takeawayTask(mode='numbers',difficulty='relaxed',rng=Math.random,serial=1,{exclude=[],grade=5}={}){
 if(mode==='numbers'||!TAKEAWAY_MODES.some(m=>m.id===mode))return takeawayNumberTask(difficulty,rng,serial,exclude.filter(Number.isInteger));
 const spec=TAKEAWAY_MODES.find(m=>m.id===mode),names=CUSTOMER_PROFILES.map(p=>p.name),pairs=[];
 if(mode==='names')for(const [i,name]of names.entries())pairs.push({id:'bag-name-'+i,word:'For '+name,translation:name,spoken:'This order is for '+name+'.'});
 if(mode==='quantities')for(let i=0;i<32;i++){const n=1+i%4,[one,many]=foods[Math.floor(i/4)],food=n===1?one:many;pairs.push({id:'bag-quantity-'+i,word:`${n} × ${food}`,translation:numberWords(n)+' '+food});}
 if(mode==='times')for(let h=1;h<=12;h++)for(const min of [0,15,30,45]){const next=numberWords(h===12?1:h+1),words=min===0?numberWords(h)+" o’clock":grade>=7?(min===15?'quarter past '+numberWords(h):min===30?'half past '+numberWords(h):'quarter to '+next):numberWords(h)+' '+numberWords(min);pairs.push({id:`collection-${h}-${min}`,word:`${h}:${String(min).padStart(2,'0')}`,translation:words});}
 if(mode==='instructions')for(let i=0;i<24;i++){const name=names[i%names.length],n=1+i%2,food=n===1?'sandwich':'sandwiches',omit=i%3===0?'cheese':i%3===1?'tomatoes':'onions';pairs.push({id:'packing-request-'+i,word:`${name}: ${numberWords(n)} ${food}, no ${omit}, please.`,translation:`${name} · ${n} ${food} · no ${omit}`});}
 const used=new Set(exclude),pool=pairs.filter(p=>!used.has(p.id));for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 if(pool.length<4)throw new RangeError('Four unused takeaway labels are required.');const selected=pool.slice(0,4),prompt={names:'Match each order to the name on its bag.',quantities:'Check the food and quantity on each packing label.',times:'Match the collection time to its English words.',instructions:'Match each customer request to the correct packing label.'}[mode];
 return {id:'takeaway-'+mode+'-'+serial,kind:'matching',variant:'takeaway-'+mode,mode:'service-'+mode,takeawayKind:mode,title:spec.name,columnLabels:spec.columns,prompt,pairs:selected,answer:selected.map(p=>p.word+' = '+p.translation).join('; '),readback:selected.map(p=>p.spoken||p.word).join('. '),rounds:difficulty==='challenge'?2:1,functional:true,contentSource:'Reviewed Languini functional-service templates v0.45.0'};
}
