import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../public/data/language.json',import.meta.url),bank=JSON.parse(await readFile(new URL('../content/wordrift-base.json',import.meta.url),'utf8'));
const tag='bistro-settings-v2';
const reviewed={
  'g5u6-ext26-g5u6-q9':['How much is it, please?','Where is the park?','What time is it?'],
  'g6u3-ext26-g6u3-q6':['A patient person waits calmly.','A patient person interrupts everyone.','A patient person refuses to wait.'],
  'g8u4-ext26-g8u4-q4':['Phone the caller again later.','End every call.','Change your number.'],
  'g8u4-ext26-g8u4-q6':['Could you repeat that, please?','Could you spell your name?','May I leave a message?']
};
const extraQuestions={
  g5u9:[['Who teaches pupils?','A teacher teaches pupils.','A chef teaches pupils.','A farmer teaches pupils.'],['Where does a doctor work?','A doctor works in a hospital.','A doctor works on a farm.','A doctor works at a bakery.'],['Who prepares meals in a restaurant?','A chef prepares meals.','A pilot prepares meals.','A dentist prepares meals.']],
  g7u11:[['What do you use to cut vegetables?','I use a knife.','I use a glass.','I use a plate.'],['What should you do first when cooking?','I should wash my hands.','I should serve the meal.','I should clear the plates.'],['How do you cook soup in a pot?','I boil it.','I freeze it.','I peel it.']],
  g7u12:[['Where can you stay on holiday?','I can stay at a hotel.','I can stay at a bus stop.','I can stay at a ticket machine.'],['What do you pack for a trip?','I pack a suitcase.','I pack a building.','I pack a road.'],['How can you travel to an island?','I can travel by boat.','I can travel by underground.','I can travel by tram.']],
  g8u11:[['What do you show to return a product?','I show the receipt.','I show a menu.','I show a timetable.'],['What can you ask for when a product is faulty?','I can ask for a refund.','I can ask for homework.','I can ask for directions.'],['Who helps customers in a shop?','A shop assistant helps them.','A pilot helps them.','A vet helps them.']],
  g8u12:[['Who examines sick animals?','A vet examines sick animals.','A pilot examines sick animals.','A chef examines sick animals.'],['What should you put in a pet’s water bowl?','I should put clean water in it.','I should put sand in it.','I should put sweets in it.'],['What do you use to groom a cat?','I use a soft brush.','I use a knife.','I use a fork.']]
};
const escapeRegExp=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function fullReplies(t){
  const answer=t.shortAnswer||t.answer,options=t.shortOptions||t.options;t.shortAnswer=answer;t.shortOptions=options;
  const override=reviewed[t.id];if(override){t.answer=override[0];t.options=override;return;}
  const re=new RegExp('(?<![a-z])'+escapeRegExp(answer)+'(?![a-z])','i');
  if(!re.test(t.readback))throw Error(`A full reply needs review: ${t.id}`);
  t.options=options.map(word=>{if(word===answer)return t.readback;let reply=t.readback.replace(re,word);reply=reply.replace(/\b(a|an)\s+([a-z][a-z-]*)/gi,(match,article,next)=>{const vowel=/^(hour|honest|heir)/i.test(next)||(/^[aeiou]/i.test(next)&&! /^(uni([^nmd]|$)|use|user|euro|one)/i.test(next)),a=vowel?'an':'a';return (article[0]===article[0].toUpperCase()?a[0].toUpperCase()+a.slice(1):a)+' '+next;});return reply[0].toUpperCase()+reply.slice(1);});
  t.answer=t.options[options.indexOf(answer)];
}
function errorFor(t){
  // Use an existing reviewed agreement or verb-form distractor, never a valid
  // alternative tense, a different modal meaning or a newly invented ending.
  const correct=t.answer.toLowerCase(),words=correct.split(' '),first=words[0];
  const agreement={am:'is',is:'are',are:'is',has:'have',have:'has',does:'do',do:'does'};
  if(agreement[first]){const wrong=[agreement[first],...words.slice(1)].join(' ');if(t.options.includes(wrong))return wrong;}
  if(/^[a-z]+s$/.test(first)&&!['was','is','has','does'].includes(first)){
    const candidates=t.options.filter(x=>x!==t.answer&&!x.endsWith('ing'));
    const wrong=candidates.find(x=>x.split(' ').length===words.length&&x.split(' ')[0].length<first.length&&x.split(' ').slice(1).join(' ')===words.slice(1).join(' '));if(wrong)return wrong;
  }
  if(/^(can|cannot|must|should|will|could|would|may|might)\b/.test(correct)){
    const wrong=t.options.find(x=>x!==t.answer&&/s$/.test(x)&&x.split(' ').length===words.length);if(wrong)return wrong;
  }
  // A finite predicate with an explicit subject cannot be a bare -ing form.
  const ing=t.options.find(x=>x!==t.answer&&/^[a-z]+ing$/.test(x));if(ing)return ing;
  return null;
}
let repairs=0,conversations=0;
for(const g of bank)for(const u of g.units){
  u.tasks=u.tasks.filter(t=>t.generatedBy!==tag);
  for(const t of u.tasks)if(t.kind==='question')fullReplies(t);
  if(!u.tasks.some(t=>t.kind==='question')){
    const source=extraQuestions[u.id];if(!source)throw Error('Missing reviewed conversation '+u.id);
    source.forEach(([prompt,answer,...wrong],i)=>u.tasks.push({id:`${u.id}-bistro-chat-${i+1}`,kind:'question',prompt,answer,options:[answer,...wrong],readback:answer,translation:'',generatedBy:tag}));
  }
  const additions=[];
  for(const t of u.tasks.filter(t=>t.kind==='completion')){const broken=errorFor(t);if(!broken)continue;const before=t.prompt.split('___');if(before.length!==2)continue;additions.push({id:t.id+'-ticket-repair',kind:'repair',prompt:t.prompt,broken,answer:t.answer,options:t.options,readback:t.prompt.replace('___',t.answer),translation:t.translation,sourceId:t.id,generatedBy:tag});}
  if(!additions.length)throw Error('No safe ticket repair for '+u.id);u.tasks.push(...additions);repairs+=additions.length;conversations+=u.tasks.filter(t=>t.kind==='question').length;
}
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const report={version,source:'Wordrift-v0.23.1.zip',grades:bank.length,units:bank.reduce((n,g)=>n+g.units.length,0),tasks:bank.reduce((n,g)=>n+g.units.reduce((m,u)=>m+u.tasks.length,0),0),conversations,repairs,derivedListening:bank.reduce((n,g)=>n+g.units.reduce((m,u)=>m+u.tasks.filter(t=>t.kind==='vocabulary').length,0),0),policy:'Reviewed Wordrift tasks; full-sentence replies; 15 reviewed conversations for previously uncovered units; ticket repairs only use reviewed agreement or invalid verb-form distractors. Listening variants reuse the exact vocabulary answers and distractors at runtime.'};
await writeFile(file,JSON.stringify(bank));await writeFile(new URL('../public/data/provenance.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
