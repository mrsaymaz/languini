const normal=word=>word.normalize('NFKC').toLowerCase().trim();
export function twoItemListeningTask(first,pool,rng=Math.random){
  const candidates=pool.filter(p=>normal(p.word)!==normal(first.answer));
  if(candidates.length<3)return first;
  const mixed=[...candidates];for(let i=mixed.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[mixed[i],mixed[j]]=[mixed[j],mixed[i]];}
  const requested=[{id:first.sourceId,word:first.answer,translation:first.translation||pool.find(p=>normal(p.word)===normal(first.answer))?.translation||first.answer},mixed[0]],words=requested.map(p=>p.word);
  return {id:first.id+'-two-'+mixed[0].id,sourceId:first.sourceId,kind:'listening',variant:'two-item',prompt:'Listen, choose both words, then confirm.',requested:requested.map(({id,word,translation})=>({id,word,translation})),answer:words.join(' · '),options:[...words,mixed[1].word,mixed[2].word],spoken:`Please choose these two words: ${words[0]} and ${words[1]}.`,readback:`${words[0]} and ${words[1]}.`,translation:requested.map(p=>p.translation).join(' · ')};
}
