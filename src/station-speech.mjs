import {readbackFor} from './tasks.mjs';

export function automaticStationSpeech(task){
  if(task.kind==='listening')return task.spoken;
  if(task.kind==='question')return task.prompt;
  return '';
}
export function requestedStationSpeech(task,{completed=false,index=0,word=null}={}){
  if(completed)return readbackFor(task);
  if(task.kind==='sorting')return task.cards[index]?.word||'';
  if(task.variant==='takeaway-numbers')return word?task.pairs.find(p=>p.word===word)?.translation||word:task.readback;
  if(task.kind==='matching')return word||task.pairs.map(p=>p.word).join('. ');
  if(task.kind==='listening')return task.spoken;
  if(task.kind==='sentence')return task.blocks.join(' ');
  if(task.kind==='repair')return task.prompt.replace('___',task.broken);
  return task.prompt.replace('___','…');
}
