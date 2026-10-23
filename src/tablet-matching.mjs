import {FLUENT_WORDS} from './fluent-emoji.mjs';
import {artworkSource} from './local-runtime.mjs';

export const MENU_MODES={
  numbers:{label:'PICKUP NUMBERS',instruction:'Match each number with its English words'},
  'translation-reverse':{label:'TÜRKÇE ↔ ENGLISH',instruction:'Match each Turkish word to its English meaning'},
  'audio-translation':{label:'ENGLISH AUDIO ↔ TÜRKÇE',instruction:'Play an English word, then match its Turkish meaning'},
  translation:{label:'ENGLISH ↔ TÜRKÇE',instruction:'Match each English word to its Turkish meaning'},
  picture:{label:'PICTURE MENU',instruction:'Match each English word to its picture'},
  listening:{label:'LISTENING ORDER',instruction:'Listen, then choose from the customer’s menu'}
};
export const wordKey=word=>String(word).normalize('NFKC').toLowerCase().trim();
export function matchingVocabulary(tasks,{pictures=false}={}){
  const seenWords=new Set(),seenMatches=new Set(),result=[];
  for(const source of tasks){
    if(source.kind!=='vocabulary')continue;
    const word=source.answer.trim(),translation=(source.translation||source.prompt||'').trim(),original=FLUENT_WORDS[wordKey(word)],asset=original?{...original,src:artworkSource(original.src)}:null;
    const key=wordKey(word),match=pictures?asset?.src:wordKey(translation);
    if(!word||!translation||!match||seenWords.has(key)||seenMatches.has(match))continue;
    seenWords.add(key);seenMatches.add(match);result.push({id:source.id,word,translation,...(asset?{asset}:{})});
  }
  return result;
}
export function matchingTask(pairs,mode,serial=0){
  if(!['translation','picture','translation-reverse','audio-translation'].includes(mode)||pairs.length<3)throw Error('A matching menu needs at least three clear pairs.');
  return {id:`menu-${mode}-${serial}-${pairs[0].id}`,kind:'matching',mode,prompt:MENU_MODES[mode].instruction,
    pairs:pairs.map(p=>({...p})),answer:pairs.map(p=>p.word).join(', '),readback:pairs.map(p=>p.word).join(', ')};
}
// Shared canvas rectangles also define the physical tablet’s raycast targets.
export function tabletPairRects(task,order){
  const count=task.pairs.length,gap=12,height=(504-gap*(count-1))/count,rects=[];
  for(let row=0;row<count;row++)for(const [column,side]of ['word','match'].entries())rects.push({
    side,index:order[side][row],x:32+column*496,y:126+row*(height+gap),width:464,height
  });
  return rects;
}
