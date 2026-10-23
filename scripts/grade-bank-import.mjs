export const normalize=s=>String(s).normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export const UNMATCHED_THEMES=new Set(['g5u9','g7u11','g7u12','g8u11','g8u12']);
const aliases=new Set(['g5u5','g5u6','g5u8','g6u9','g6u10','g5u10']);
const clean=s=>String(s).replace(/^[\s.…]+|[\s.…]+$/g,'').trim();
const finish=s=>/[.!?]$/.test(s.trim())?s.trim():s.trim()+'.';
const quote=s=>'“'+s+'”';
const unique=a=>[...new Set(a)];
const sourceInfo=(grade,unit,record)=>({file:`grade${grade}.json`,grade,unit,record});
function attachSource(task,source){task.bankSource=source;return task;}
function addTask(unit,task){
  const key=normalize(task.prompt),same=unit.tasks.find(t=>t.kind===task.kind&&normalize(t.prompt)===key&&normalize(t.answer)===normalize(task.answer));
  if(same){if(task.bankSource)attachSource(same,task.bankSource);return false;}unit.tasks.push(task);return true;
}
function questionChoices(unit,index,replies){
  const exclusions={'g7u1q1':['g7u1q7'],'g7u1q7':['g7u1q1','g7u1q2','g7u1q3'],'g8u1q3':['g8u1q5'],'g8u1q5':['g8u1q3']},q=unit.questions[index];
  const indices=unique([3,6,4,5,7,8,1,2].map(offset=>(index+offset)%unit.questions.length));
  return unique([replies[index],...indices.filter(i=>!exclusions[q.id]?.includes(unit.questions[i].id)).map(i=>replies[i])]).slice(0,4);
}
export function mergeGradeBanks(input,sources,replyRefinements={}){
  const bank=structuredClone(input),mappings=[],skipped=[];let importedQuestions=0,matchedQuestions=0,addedVocabulary=0,addedDescriptions=0,derivedQuestions=0;
  for(const source of sources){
    const grade=bank.find(g=>g.grade===source.grade);if(!grade)throw Error('Unsupported grade '+source.grade);
    for(const raw of source.units){
      if(UNMATCHED_THEMES.has(raw.id)){skipped.push({grade:source.grade,sourceUnit:raw.id,sourceTitle:raw.title,reason:'No matching existing theme in this grade'});continue;}
      const unit=grade.units.find(u=>u.id===raw.id);if(!unit)throw Error('Cannot add a unit: '+raw.id);
      if(normalize(unit.title)!==normalize(raw.title)&&!aliases.has(raw.id))throw Error(`Theme requires an explicit mapping: ${source.grade}/${raw.id}: ${raw.title} ≠ ${unit.title}`);
      mappings.push({grade:source.grade,sourceUnit:raw.id,sourceTitle:raw.title,targetUnit:unit.id,targetTitle:unit.title});
      const words=unique(raw.translations.map(t=>t.en));if(words.length<3)throw Error('Too few vocabulary choices in '+raw.id);
      for(const t of raw.translations){const task={id:`${unit.id}-upload-${t.id}`,kind:'vocabulary',prompt:t.tr,answer:t.en,options:[t.en,...words.filter(w=>w!==t.en)],translation:t.tr,readback:'',bankSource:sourceInfo(source.grade,raw.id,t.id)};if(addTask(unit,task))addedVocabulary++;}
      for(const t of raw.descriptions){if(!t.options.includes(t.answer)||new Set(t.options).size<3)throw Error('Invalid definition '+t.id);if(addTask(unit,{id:`${unit.id}-upload-${t.id}`,kind:'description',prompt:t.clue,answer:t.answer,options:t.options,translation:'',readback:t.answer,bankSource:sourceInfo(source.grade,raw.id,t.id)}))addedDescriptions++;}
      const replies=raw.questions.map(q=>finish(replyRefinements[q.id]||q.a));
      raw.questions.forEach((q,i)=>{
        const answer=replies[i],same=unit.tasks.find(t=>t.kind==='question'&&normalize(t.prompt)===normalize(q.q)),origin=sourceInfo(source.grade,raw.id,q.id);
        if(same){same.options=unique(same.options.map(s=>s===same.answer?answer:s));same.answer=answer;same.readback=answer;attachSource(same,origin);matchedQuestions++;}
        else{unit.tasks.push({id:`${unit.id}-upload-${q.id}`,kind:'question',prompt:q.q,answer,options:questionChoices(raw,i,replies),readback:answer,translation:'',bankSource:origin});importedQuestions++;}
      });

    }
  }
  for(const grade of bank)for(const unit of grade.units){
    const seen=new Set();unit.tasks=unit.tasks.filter(t=>{if(t.kind!=='question')return true;const key=normalize(t.prompt);if(seen.has(key))return false;seen.add(key);return true;});
    // Vocabulary conversations draw only on this exact grade and theme. They
    // supplement, rather than duplicate, the source's natural question pairs.
    for(const t of unit.tasks.filter(t=>t.kind==='description')){
      if(seen.size>=12)break;const prompt=`Which word means ${quote(clean(t.prompt))}?`;if(seen.has(normalize(prompt)))continue;const answer=`The word is ${quote(t.answer)}.`;unit.tasks.push({id:t.id+'-guest',kind:'question',prompt,answer,options:unique(t.options).map(word=>`The word is ${quote(word)}.`),readback:answer,translation:'',sourceId:t.id,derivedPractice:'definition'});seen.add(normalize(prompt));derivedQuestions++;
    }
    for(const t of unit.tasks.filter(t=>t.kind==='vocabulary')){
      if(seen.size>=12)break;const prompt=`What is the English word for ${quote(t.translation||t.prompt)}?`;if(seen.has(normalize(prompt)))continue;const answer=`The English word is ${quote(t.answer)}.`;unit.tasks.push({id:t.id+'-guest',kind:'question',prompt,answer,options:unique([t.answer,...t.options]).slice(0,8).map(word=>`The English word is ${quote(word)}.`),readback:answer,translation:t.translation,sourceId:t.id,derivedPractice:'translation'});seen.add(normalize(prompt));derivedQuestions++;
    }
    if(seen.size<12)throw Error('Insufficient conversation variety in '+unit.id);
    for(const kind of ['question','vocabulary','description','sentence','completion','repair'])if(!unit.tasks.some(t=>t.kind===kind))throw Error('Missing '+kind+' in '+unit.id);
    const ids=new Set();for(const t of unit.tasks){if(ids.has(t.id))throw Error('Duplicate task '+t.id);ids.add(t.id);}
  }
  return {bank,report:{mappings,skipped,importedQuestions,matchedQuestions,derivedQuestions,addedVocabulary,addedDescriptions,replyRefinements:Object.keys(replyRefinements).length}};
}
