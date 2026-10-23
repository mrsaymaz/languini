const small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];

// British English, consistent with the game's English reading voice.
export function numberWords(value){
 if(!Number.isInteger(value)||value<0||value>200)throw new RangeError('Pickup numbers must be integers from 0 to 200.');
 if(value<20)return small[value];
 if(value<100)return tens[Math.floor(value/10)]+(value%10?'-'+small[value%10]:'');
 const hundreds=small[Math.floor(value/100)]+' hundred',rest=value%100;
 return hundreds+(rest?' and '+numberWords(rest):'');
}

export function takeawayNumberTask(difficulty='relaxed',rng=Math.random,serial=1,exclude=[]){
 const used=new Set(exclude),pool=Array.from({length:201},(_,i)=>i).filter(n=>!used.has(n));
 if(pool.length<4)throw new RangeError('Four distinct pickup numbers are required.');
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const pairs=pool.slice(0,4).map(n=>({id:'pickup-number-'+n,number:n,word:String(n),translation:numberWords(n)}));
 return {id:'takeaway-numbers-'+serial,kind:'matching',variant:'takeaway-numbers',mode:'numbers',prompt:'Match each pickup number to its English words.',pairs,answer:pairs.map(p=>p.word+' = '+p.translation).join('; '),readback:pairs.map(p=>p.translation).join('. '),numberRange:[0,200],rounds:difficulty==='challenge'?2:1};
}
