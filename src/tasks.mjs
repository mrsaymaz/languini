export const TASK_SETTINGS={
  pickup:{id:'pickup',name:'Takeaway collection',short:'Check labels',instruction:'Check the order labels before collection',icon:'clip',success:'Labels checked. Ready for collection!'},
  wash:{id:'wash',name:'Wash the dishes',short:'Connect and clean',instruction:'Tap or swipe through the blocks in sentence order',icon:'sink',success:'Sentence connected. Plate clean!'},
  tablet:{id:'tablet',name:'Customer’s menu',short:'Take order',instruction:'Listen, then choose from the customer’s menu',icon:'tablet',success:'Order taken. Let’s prepare it.'},
  conversation:{id:'conversation',name:'Guest conversation',short:'Have a chat',instruction:'Choose your reply',icon:'chat',success:'A happy guest. Let’s get cooking.'},
  delivery:{id:'delivery',name:'Delivery labels',short:'Label delivery',instruction:'Choose the right label',icon:'crate',success:'Delivery labelled. Your ingredients are ready.'},
  recipe:{id:'recipe',name:'Recipe rail',short:'Build a recipe',instruction:'Build the sentence in order',icon:'prep',success:'Recipe complete. To the kitchen!'},
  ticket:{id:'ticket',name:'Hanging order ticket',short:'Fill the ticket',instruction:'Tap the correct word to fill and send the ticket',icon:'clip',success:'Ticket filled. Sending it to the kitchen…'},
  repair:{id:'repair',name:'Checkout correction',short:'Check order',instruction:'Select the mistake on the checkout screen',icon:'repair',success:'Checkout corrected. Print the receipt to finish.'}
};
export function settingForTask(task){return task.variant?.startsWith('takeaway-')?'pickup':task.variant==='washing'?'wash':['listening','matching'].includes(task.kind)?'tablet':task.kind==='question'?'conversation':task.kind==='sentence'?'recipe':task.kind==='completion'?'ticket':task.kind==='repair'?'repair':'delivery';}
export function questionKey(task){return task.prompt.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export function listeningTask(source){return {id:source.id+'-listening',sourceId:source.id,kind:'listening',prompt:'Listen to the customer.',answer:source.answer,options:[...source.options],spoken:source.answer,readback:source.answer,translation:source.translation};}
export function readbackFor(task){return task.kind==='completion'?task.prompt.replace('___',task.answer):task.readback||task.answer;}
export function repairParts(task){const [left,right]=task.prompt.split('___');const before=left.trim()?left.trim().split(/\s+/):[],after=right.trim()?right.trim().split(/\s+/):[];return {parts:[...before,task.broken,...after],errorIndex:before.length};}
export function hintForTask(task,attempts=0,selected=[]){
  if(task.kind==='sorting')return 'Use the free meaning clue, then choose a heading.';
  if(task.kind==='matching'){const pair=task.pairs.find((_,i)=>!selected.includes(i));return pair?`Match “${pair.word}” with ${task.mode==='picture'?'its picture':`“${pair.translation}”`}.`:'All pairs are on the order.';}
  if(task.kind==='repair')return grammarClue(task)+` Check “${task.broken}”, clear it, then choose a correction.`;
  if(task.kind==='listening')return task.requested?`Choose both: ${task.requested.map(p=>p.word).join(' and ')}. Confirm after selecting two.`:`Your guest said “${task.answer}”. Listen again and find it on the tablet.`;
  if(task.kind==='sentence'){const wrong=selected.findIndex((id,i)=>id!==i);return wrong>=0?`Start with “${task.blocks[0]}”.`:`The next block is “${task.blocks[selected.length]||task.blocks[0]}”.`;}
  if(task.kind==='question')return attempts?`Try: “${task.answer}”`:'Listen to the guest’s question. Which reply answers it?';
  return attempts?`Look for “${task.answer}”.`:`It begins with “${task.answer.slice(0,Math.min(2,task.answer.length))}…”.`;
}
export function grammarClue(task){
  const answer=task.answer,broken=task.broken||'',before=task.prompt.split('___')[0].trim();
  if(broken&&answer===broken+'s')return `${before}: one person or thing. Add -s to the verb.`;
  if(answer==='has got'&&broken==='have got')return `${before}: one person. Use “has got”.`;
  if(/^(can|must|should|must not|cannot|can't) /.test(answer))return 'After a modal verb, use the base form of the next verb.';
  if(answer.startsWith('would love to '))return 'After “would love to”, use the base form of the verb.';
  if(answer.includes(' to ')&&broken.includes(' to '))return 'Check the verb form after “to”.';
  if(task.translation)return `Meaning: ${task.translation}`;
  return 'Read the whole sentence. Check how the subject and verb fit together.';
}
export function feedbackForTask(task,{attempts=1,selected=[]}={}){
  if(task.kind==='repair'||task.kind==='completion')return grammarClue(task);
  if(task.kind==='sentence')return `Build the meaning in order. ${hintForTask(task,attempts,selected)}`;
  if(task.kind==='vocabulary')return `Find the English label for “${task.translation||task.prompt}”. ${attempts>1?'It begins with “'+task.answer.slice(0,2)+'…”.':''}`;
  if(task.kind==='description')return `Use the definition: ${task.prompt}`;
  if(task.kind==='listening')return task.requested?'Replay both words. Tap a selected word to remove it, choose its replacement, then confirm again.':'Replay the customer. Listen for the complete word before choosing.';
  return 'Read the guest’s question again. Choose a reply that answers that question.';
}
