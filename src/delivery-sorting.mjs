import packs from '../content/sorting-packs.json' with {type:'json'};
import additionalPacks from '../public/data/additional-sorting.json' with {type:'json'};
export const SORTING_PACKS=packs;
export const ADDITIONAL_SORTING_PACKS=additionalPacks;
export function sortingPack(unit,serial=0){
 const variants=[...packs.filter(p=>p.unit===unit),...additionalPacks.filter(p=>p.unit===unit)];
 // Keep headings stable for three visits, then revisit another same-unit topic.
 return variants[Math.floor(Math.max(0,serial-1)/3)%variants.length]||null;
}
export function sortingTask(unit,difficulty='relaxed',rng=Math.random,serial=0,learning=null,extraPerCategory=0){
 const pack=sortingPack(unit,serial);if(!pack)return null;
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const priority=c=>learning?learning.priority({kind:'sorting',cards:[c]})+.25*learning.priority({kind:'vocabulary',answer:c.word,id:c.id}):0;
 const count=(difficulty==='challenge'?3:2)+extraPerCategory,cards=shuffle([0,1].flatMap(index=>shuffle(pack.cards.filter(c=>c.category===index)).sort((a,b)=>priority(b)-priority(a)).slice(0,count)));
 return {id:`${unit}-sorting-${serial}`,kind:'sorting',prompt:'Put each label under the correct heading.',answer:'Delivery organised.',readback:'Delivery organised. The supplies are ready.',categories:pack.categories.map(c=>({...c})),cards:cards.map(c=>({...c})),options:[]};
}
