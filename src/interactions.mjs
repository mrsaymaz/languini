import {activeIdentity,applyIdentity} from './task-identity.mjs';
import {TouchFeedback} from './touch-feedback.mjs';
import {answerChoicesValid} from './language-integrity.mjs';
import {ensureFreshness,freshnessState} from './task-freshness.mjs';
import {PREP_PHASE_COUNT,PREP_PHASE_NAMES} from './menu.mjs';
import {RECEIPT_FEED_MS,receiptReadMilliseconds} from './receipt-reading.mjs';
import {STATION_VISUALS} from './presentation.mjs';
import {customerVoiceOptions} from './customer-voices.mjs';
import {WashingConnections} from './washing-connections.mjs';
import {checkoutStep} from './checkout-guidance.mjs';
import {choicesFor,shuffle,RECIPES} from './core.mjs';
import {TASK_SETTINGS,settingForTask,readbackFor,repairParts,hintForTask,feedbackForTask} from './tasks.mjs';
import {taskMarkup,esc} from './task-ui.mjs';
import {actionPlacement} from './service-layout.mjs';
import {icon} from './icons.mjs';
import {ObjectStationUI} from './object-layout.mjs';
import {placementTarget} from './pointer-placement.mjs';
import {automaticStationSpeech,requestedStationSpeech} from './station-speech.mjs';
const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
export class StationInteractions {
  constructor({getGame,getView,audio,onChanged,announce,onStationOpened,onStationClosed}){
    Object.assign(this,{getGame,getView,audio,onChanged,announce,onStationOpened,onStationClosed});this.root=$('task-card');this.target=$('station-action');this.epoch=0;this.playbackSerial=0;this.busy=false;this.selectedIngredient=null;this.selectedLabel=null;this.consumedClicks=new WeakSet();this.touchFeedback=new TouchFeedback({reduced:()=>!!this.view?.reduced});this.surface=new ObjectStationUI(this.root,getView);this.target.addEventListener('click',()=>this.actTarget());
    // Capture can be unavailable after a browser gesture or an interrupted touch.
    // The window fallback still ends that one pointer, including outside a label.
    if(typeof window!=='undefined'&&window.addEventListener){window.addEventListener('pointermove',e=>this.movePointer(e),{passive:false});window.addEventListener('pointerup',e=>this.endPointer(e));window.addEventListener('pointercancel',e=>{if(this.drag?.pointerId===e.pointerId)this.cancelDrag();});window.addEventListener('blur',()=>this.cancelDrag());}
  }
  get game(){return this.getGame();}get view(){return this.getView();}
  open({restoredSpeech=null,restoredPair=null}={}){
    const a=this.game?.active;if(!a)return;this.game.taskTimingActive=a;this.game.taskTimingReady=false;ensureFreshness(a,this.game.config.difficulty);this.touchFeedback?.clear();this.washingUI?.destroy();this.washingUI=null;this.cancelDrag();this.epoch++;this.playbackSerial++;this.removeGhost();this.busy=false;this.doneReading=false;this.needsReplay=false;this.sortPlayback=null;this.sortNeedsReplay=false;this.stampAnimating=false;this.printAnimating=false;this.selectedIngredient=null;this.selectedLabel=null;this.selectedTicket=null;this.audioPairIndex=null;this.currentSpeechPromise=null;this.manualSpeech=!!restoredSpeech?.force;this.manualNeedsReplay=false;this.speechSession=null;this.replayAfterReady=restoredSpeech;this.pausedSpeech=null;
    const t=a.task,setting=settingForTask(t),table=a.tableId==null?null:this.game.tables[a.tableId],recipeIndex=table?.recipe||0;
    this.selectedPair=restoredPair&&!a.matchedPairs.includes(restoredPair.index)?restoredPair:null;this.wrongPair=null;this.lastMatchedWord=null;this.menuOrder=null;
    if(t.kind==='matching'){const indices=t.pairs.map((_,i)=>i);this.menuOrder={word:shuffle(indices),match:shuffle(indices)};if(this.menuOrder.word.every((v,i)=>v===this.menuOrder.match[i]))this.menuOrder.match.push(this.menuOrder.match.shift());}
    const presentation=a.presentation||{};if(presentation.menuOrder)this.menuOrder=presentation.menuOrder;this.options=answerChoicesValid(t,presentation.options)?presentation.options:(t.requested?shuffle(t.options):['sentence','matching','sorting'].includes(t.kind)?[]:choicesFor(t,this.game.config.difficulty));this.order=presentation.order||(t.kind==='sentence'?shuffle(t.blocks.map((_,i)=>i)):[]);
    if(this.order.length&&this.order.every((v,i)=>v===i))[this.order[0],this.order[1]]=[this.order[1],this.order[0]];a.presentation={options:this.options,order:this.order,menuOrder:this.menuOrder,foodAssignment:presentation.foodAssignment||shuffle(Array.from({length:t.blocks?.length||3},(_,i)=>i%3)),packageOffset:presentation.packageOffset??Math.floor(Math.random()*6),scrollTops:presentation.scrollTops||[]};
    this.root.innerHTML=taskMarkup(t,{tableId:a.tableId||0,recipe:RECIPES[recipeIndex],options:this.options,step:(table?.step||0)+1,total:table?.plan.length||1,route:table?.plan.map(s=>s.setting)||[],shared:a.purpose==='delivery'||a.purpose==='washing',menuOrder:setting==='wash'?{wash:this.order}:this.menuOrder,identity:table,difficulty:this.game.config.difficulty,stock:setting==='wash'?a.washCount:this.game.maxStock,prepPhase:a.prepPhase||0,activityRound:a.activityRound||0,activityRounds:a.activityRounds||1});
    this.root.scrollTop=0;this.root.classList.remove('recipe-compact');delete this.root.dataset.hasIngredients;delete this.root.dataset.completed;delete this.root.dataset.restored;delete this.root.dataset.feedback;this.root.dataset.menuMode=t.kind==='matching'?t.mode:'listening';
    applyIdentity(this.root,activeIdentity(this.game));this.root.dataset.setting=setting;this.root.style.setProperty('--station-accent',STATION_VISUALS[setting].accent);this.root.setAttribute('aria-label',TASK_SETTINGS[setting].name);this.root.hidden=false;$('play').classList.add('task-open');$('play').dataset.station=setting;
    this.view.focusTask(setting,a.tableId||0,{task:t,recipe:recipeIndex,options:this.options,order:this.order,customerId:table?.guest,menuOrder:this.menuOrder,identity:table,foodAssignment:a.presentation.foodAssignment,prepPhase:a.prepPhase||0,packageOffset:a.presentation.packageOffset});this.surface.open();
    this.root.querySelectorAll('[data-answer]').forEach(button=>{const index=+button.dataset.answer;button.addEventListener('click',()=>{if(setting==='delivery')this.chooseLabel(index);else if(setting==='ticket')this.chooseTicket(index);else this.submit(this.options[index],button);});if(setting==='delivery')this.bindDrag(button,{kind:'label',index});if(setting==='ticket')this.bindDrag(button,{kind:'ticket-word',index});});
    if(t.kind==='sorting'){this.bindDrag($('sort-card'),{kind:'sorting'});$('sort-card').addEventListener('click',()=>{if(this.busy||a.completed||this.game.paused)return;this.root.dataset.selected='sorting';$('sort-card').setAttribute('aria-pressed','true');this.feedback('Now tap its matching tray, or drag the parcel there.');});this.root.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>this.chooseSort(+b.dataset.sort)));this.syncSorting();}
    if(setting==='wash')this.washingUI=new WashingConnections(this.root,{getActive:()=>this.game?.active,isPaused:()=>this.game?.paused,isReady:()=>this.surface?.ready!==false&&!this.busy,onBlock:i=>this.connectWash(i)});else if(t.kind==='sentence')this.renderIngredients();
    if(setting==='delivery'&&t.kind!=='sorting')$('crate-drop').onclick=()=>this.dropLabel();
    if(t.kind==='matching'){
      this.root.querySelectorAll('[data-pair]').forEach(button=>button.addEventListener('click',()=>this.choosePair(button.dataset.side,+button.dataset.pair)));
      this.root.querySelectorAll('.pair-picture img').forEach(img=>{const fallback=()=>{img.hidden=true;img.nextElementSibling.hidden=false;};img.addEventListener('error',fallback);if(img.complete&&!img.naturalWidth)fallback();});
      this.syncMatching();
    }
    if(t.kind==='completion'){$('stamp-button').addEventListener('click',()=>this.stamp());$('ticket-gap').addEventListener('click',()=>this.dropTicketWord());this.bindDrag($('ticket-grip'),{kind:'ticket'});$('ticket-grip').addEventListener('click',()=>this.stamp());}
    if(t.kind==='repair'){
      a.repairCueShown=true;$('receipt-sentence').textContent='';
      $('repair-sentence').querySelectorAll('[data-part]').forEach(button=>button.addEventListener('click',()=>this.locate(+button.dataset.part,button)));
      $('erase-button').addEventListener('click',()=>this.erase());$('print-button').addEventListener('click',()=>this.printReceipt());
      let start=null;const receipt=$('repair-sentence');receipt.addEventListener('pointerdown',e=>{if(!a.repairFound||a.repairErased||this.game.paused||e.isPrimary===false||e.button>0)return;start={x:e.clientX,y:e.clientY,id:e.pointerId};try{receipt.setPointerCapture(e.pointerId);}catch{}});receipt.addEventListener('pointerup',e=>{if(start?.id===e.pointerId&&Math.abs(e.clientX-start.x)>28&&Math.abs(e.clientX-start.x)>Math.abs(e.clientY-start.y)*1.4)this.erase();start=null;});receipt.addEventListener('pointercancel',()=>start=null);receipt.addEventListener('lostpointercapture',()=>start=null);
    }
    if(t.kind==='listening')$('listen-again').addEventListener('click',()=>this.speakPrompt(true));if(t.requested){$('listening-confirm').addEventListener('click',()=>this.confirmListening());this.syncListening();}
    $('hint-button').addEventListener('click',()=>this.hint());$('read-button').addEventListener('click',()=>this.speakPrompt(true));
    const station=this.view.station;if(station)station.restoring=true;try{this.restoreStation(a);this.root.querySelectorAll('.matched,.connected,.fixed,.filled,.confirmed,.correct').forEach(n=>n.dataset.motionRestore='true');}finally{if(station)station.restoring=false;}if(a.hinted&&t.kind==='listening')this.showListeningSupport();if(a.hinted&&$('language-support'))$('language-support').hidden=false;this.root.querySelectorAll('.surface-scroll').forEach((n,i)=>n.scrollTop=a.presentation.scrollTops?.[i]||0);this.announce(a.prepPhase!=null?`Plating phase ${a.prepPhase+1} of ${PREP_PHASE_COUNT}. ${PREP_PHASE_NAMES[a.prepPhase]} the dish by building the sentence.`:t.kind==='matching'||t.requested?t.prompt:TASK_SETTINGS[setting].instruction);this.onStationOpened?.(a);this.pendingPrompt=!restoredSpeech&&!a.completed&&!a.promptHeard&&!!automaticStationSpeech(t);this.updateTarget();
  }
  close(){this.onStationClosed?.();this.touchFeedback?.clear();this.washingUI?.destroy();this.washingUI=null;this.cancelDrag();this.surface?.close();this.epoch++;this.playbackSerial++;this.removeGhost();this.root.hidden=true;this.target.hidden=true;$('play').classList.remove('task-open');delete $('play').dataset.station;this.view?.focusTask(null);}
  cancel(){this.close();this.audio.cancelSpeech();}
  feedback(text,kind=''){if(!$('task-feedback'))return;if(this.view?.container?.clientWidth<760&&!kind&&this.root.dataset.setting==='recipe'&&text.startsWith('Phase '))text='Build the sentence with the ingredients.';$('task-feedback').textContent=text;$('task-feedback').className='task-feedback '+kind;if(this.root.dataset)this.root.dataset.feedback=kind;}
  speakPrompt(force=false,options={}){const pending=this.performSpeech(force,options);this.currentSpeechPromise=pending;return pending;}
  async performSpeech(force=false,{text:replayText,voiceProfile:restoredVoice=null}={}){
    const a=this.game?.active;if(!a||a.completed&&!force)return;const epoch=this.epoch,promptSerial=this.promptSerial=(this.promptSerial||0)+1,t=a.task,setting=settingForTask(t);
    const text=replayText||(force?requestedStationSpeech(t,{completed:a.completed,index:a.sortIndex,word:this.selectedPair?t.pairs?.[this.selectedPair.index]?.word:this.lastMatchedWord}):automaticStationSpeech(t));if(!text)return;
    const voiceProfile=restoredVoice||(a.tableId==null?{}:customerVoiceOptions(this.game.tables?.[a.tableId]?.guest));
    const session={a,text,force,voiceProfile};this.speechSession=session;this.game.taskTimingReady=false;
    if(force){this.manualSpeech=true;this.pendingPrompt=false;}
    const audioPair=t.kind==='matching'&&t.mode==='audio-translation'?t.pairs.findIndex(p=>p.word===text):-1;if(audioPair>=0){this.audioPairIndex=audioPair;this.syncMatching();}
    if(t.kind==='listening'&&!a.completed){$('listening-status').textContent='Your customer is speaking…';$('listen-again').classList.add('playing');}
    this.view.setSpeaking(a.tableId,setting==='conversation'||t.kind==='listening');this.audio.wake();
    const result=await this.audio.speak(text,{force,...voiceProfile});
    if(epoch!==this.epoch||promptSerial!==this.promptSerial||this.game?.active!==a)return;
    this.speechSession=null;this.manualSpeech=false;if(result.played)a.promptHeard=true;this.view.setSpeaking(a.tableId,false);
    if(audioPair>=0){this.audioPairIndex=null;if(!result.played&&result.reason!=='cancelled'){a.audioTextSupport=[...new Set([...(a.audioTextSupport||[]),audioPair])];a.pairSupport=[...new Set([...a.pairSupport,audioPair])];this.onChanged();this.feedback('Voice unavailable. Match the written English word to Turkish.');}this.syncMatching();}
    if(t.kind==='listening'&&!a.completed){$('listen-again').classList.remove('playing');$('listening-status').textContent=result.played?(t.requested?'Select two words, then confirm.':'Choose the word you heard.'):'Tap to hear your customer.';if(!result.played&&result.reason!=='cancelled'){this.game.hint();this.onChanged();this.showListeningSupport();$('listening-status').textContent='Use the written clue while voice is unavailable.';}}
    if(a.completed)this.maybeAdvance();
  }
  showListeningSupport(){const t=this.game?.active?.task;if(t?.kind!=='listening')return;$('listening-caption').hidden=false;$('listening-caption').textContent=t.requested?t.requested.map(p=>p.word).join(' + '):t.answer;}
  hint(){const a=this.game?.active;if(!a||a.completed||this.busy)return;this.game.hint();if(a.task.kind==='sorting'){this.syncSorting();const card=a.task.cards[a.sortIndex];this.feedback(`${card.word}: ${card.translation}. Heading: ${a.task.categories[card.category].name}`);return;}if($('language-support'))$('language-support').hidden=false;if(a.task.kind==='repair'){$('repair-sentence').querySelector(`[data-part="${repairParts(a.task).errorIndex}"]`)?.classList.add('hinted');this.view.reactStation('repair-hint',repairParts(a.task).errorIndex);}if(a.task.kind==='listening')this.showListeningSupport();if(a.task.kind==='matching'){if(a.task.mode==='audio-translation'){a.audioTextSupport=a.task.pairs.map((_,i)=>i);this.syncMatching();}const index=a.task.pairs.findIndex((_,i)=>!a.matchedPairs.includes(i));this.root.querySelectorAll(`[data-pair="${index}"]`).forEach(b=>b.classList.add('hinted'));this.feedback('The highlighted cards go together.');this.onChanged();return;}this.feedback(hintForTask(a.task,a.attempts,a.task.kind==='matching'?a.matchedPairs:a.ingredients));}
  syncSorting(){const a=this.game?.active;if(a?.task.kind!=='sorting')return;if($('sort-card'))$('sort-card').disabled=this.busy||a.completed||this.game.paused;const card=a.task.cards[a.sortIndex];$('sort-count').textContent=`${a.sortIndex} / ${a.task.cards.length}`;$('sort-word').textContent=card?.word||'Delivery organised';$('sort-meaning').textContent=card?.translation||'';$('sort-meaning').hidden=this.game.config.difficulty==='challenge'&&!a.pairSupport.includes(a.sortIndex);this.root.querySelectorAll('[data-sort]').forEach(b=>{b.disabled=this.busy||a.completed||this.game.paused;if(a.hinted)b.querySelector('small').hidden=false;const index=+b.dataset.sort;$('sort-stack-'+index).textContent=a.task.cards.slice(0,a.sortIndex).filter(c=>c.category===index).length+' parcels';});this.view.reactStation('sort-sync',{index:a.sortIndex,support:a.pairSupport});}
  async chooseSort(category){if(this.surface?.ready===false)return;const a=this.game?.active;if(a?.task.kind!=='sorting'||this.busy||this.game.paused)return;const result=this.game.sortLabel(category);if(!result.accepted)return;if(this.root.dataset)delete this.root.dataset.selected;$('sort-card')?.setAttribute('aria-pressed','false');this.onChanged();if(!result.correct){this.feedback(result.clue,'wrong');this.syncSorting();return;}this.view.reactStation('sort-place',{index:result.index,category});if(result.completed){this.syncSorting();this.presentCompleted(a,null,.85,result.word+'. '+a.task.readback);return;}this.busy=true;this.root.querySelectorAll('[data-sort]').forEach(b=>b.disabled=true);this.feedback(result.word+' organised.','success');await this.sortReadback(a,result.word);}
  async sortReadback(a,word){const epoch=this.epoch,serial=++this.playbackSerial;this.sortPlayback={a,word};this.busy=true;await wait(220);if(epoch!==this.epoch||serial!==this.playbackSerial||this.game?.active!==a)return;if(this.game.paused){this.sortNeedsReplay=true;return;}this.sortPlayback=null;this.busy=false;this.syncSorting();}
  syncMatching(action='tablet-match'){
    const a=this.game?.active;if(a?.task.kind!=='matching')return;
    this.root.querySelectorAll('[data-pair]').forEach(button=>{const index=+button.dataset.pair,side=button.dataset.side,matched=a.matchedPairs.includes(index);button.classList.toggle('matched',matched);button.classList.toggle('selected',this.selectedPair?.side===side&&this.selectedPair.index===index);button.classList.toggle('pair-wrong',this.wrongPair?.some(p=>p.side===side&&p.index===index)||false);button.setAttribute('aria-pressed',String(this.selectedPair?.side===side&&this.selectedPair.index===index));button.disabled=matched||a.completed||this.busy||a.task.mode==='audio-translation'&&side==='word'&&this.manualSpeech&&this.audioPairIndex!==index;if(a.task.mode==='audio-translation'&&side==='word'){const text=button.querySelector('.audio-word'),face=button.querySelector('.audio-face');if(text)text.hidden=!(a.audioTextSupport||[]).includes(index);if(face)face.hidden=!!text&&!text.hidden;button.classList.toggle('playing',this.manualSpeech&&this.audioPairIndex===index);}});
    if(a.task.takeawayKind==='instructions'){const next=a.task.pairs.findIndex((_,i)=>!a.matchedPairs.includes(i)),current=next<0?a.task.pairs.length-1:next;this.root.querySelectorAll('[data-side=word][data-pair]').forEach(b=>{b.hidden=+b.dataset.pair!==current;});if($('packing-request-count'))$('packing-request-count').textContent=next<0?'ALL BAGS CHECKED':'REQUEST '+(current+1)+' / '+a.task.pairs.length;}
    $('matched-count').textContent=`${a.matchedPairs.length} / ${a.task.pairs.length}`;
    $('menu-order-summary').innerHTML=a.task.pairs.map((p,i)=>`<i class="menu-progress-dot ${a.matchedPairs.includes(i)?'filled':''}" aria-label="${esc(p.word)}${a.matchedPairs.includes(i)?' added':''}">${a.matchedPairs.includes(i)?icon('check'):''}</i>`).join('');
    for(const id of ['hint-button','read-button'])$(id).disabled=this.busy||a.completed;
    this.view.reactStation(action,{matched:[...a.matchedPairs],selected:this.selectedPair,wrong:this.wrongPair});
  }
  async choosePair(side,index){
    if(this.surface?.ready===false)return;
    const a=this.game?.active;if(a?.task.kind!=='matching'||a.completed||this.busy||this.game.paused||!['word','match'].includes(side)||!a.task.pairs[index]||a.matchedPairs.includes(index))return;
    if(a.task.takeawayKind==='instructions'&&side==='word'&&a.task.pairs.findIndex((_,i)=>!a.matchedPairs.includes(i))!==index)return;
    this.root.querySelectorAll('.pair-card.hinted').forEach(b=>b.classList.remove('hinted'));
    if(a.task.mode==='audio-translation'&&side==='word'){if(this.manualSpeech&&this.audioPairIndex!==index)return;this.speakPrompt(true,{text:a.task.pairs[index].word});}
    const previous=this.selectedPair;
    if(!previous||previous.side===side){this.selectedPair=previous?.index===index?null:{side,index};this.syncMatching();this.feedback(a.task.takeawayKind?(this.selectedPair?side==='word'?'Now choose the matching bag label.':'Now choose its customer request.':'Choose a request and its matching label.'):a.task.mode==='numbers'?(this.selectedPair?side==='word'?'Now choose its English words.':'Now choose its number.':'Choose a number and its English words.'):this.selectedPair?`Now choose ${side==='word'?(a.task.mode==='picture'?'its picture.':a.task.mode==='translation-reverse'?'its English word.':'its Turkish meaning.'):a.task.mode==='translation-reverse'?'its Turkish meaning.':a.task.mode==='audio-translation'?'its English audio.':'its English word.'}`:'Choose one English card and its match.');return;}
    const wordIndex=side==='word'?index:previous.index,matchIndex=side==='match'?index:previous.index,epoch=this.epoch;
    while(a.task.mode==='audio-translation'&&this.manualSpeech&&this.currentSpeechPromise){this.busy=true;this.syncMatching();await this.currentSpeechPromise;if(epoch!==this.epoch||this.game?.active!==a)return;this.busy=false;if(this.game.paused){this.syncMatching();return;}}
    const result=this.game.matchPair(wordIndex,matchIndex);
    if(!result.accepted)return;this.selectedPair=null;this.busy=true;this.onChanged();
    if(!result.correct){this.wrongPair=[previous,{side,index}];this.syncMatching('tablet-miss');this.feedback(`Try a different match for “${a.task.pairs[wordIndex].word}”.`,'wrong');await wait(500);if(epoch!==this.epoch)return;this.wrongPair=null;this.busy=false;this.syncMatching();return;}
    this.lastMatchedWord=result.word;this.syncMatching('tablet-pair');
    if(result.completed){this.presentCompleted(a,null,.75,a.task.mode==='numbers'?a.task.pairs[wordIndex].translation:result.word);return;}
    this.feedback(`${result.word} added to the order.`,'success');
    await wait(180);
    if(epoch!==this.epoch||this.game?.active!==a)return;this.view.setSpeaking(a.tableId,false);this.busy=false;this.syncMatching();this.feedback('Added! Match the next pair.','success');
  }
  connectWash(index){const a=this.game?.active;if(a?.task.variant!=='washing'||this.busy||this.game.paused||this.surface?.ready===false)return {accepted:false};const result=this.game.addIngredient(index);if(!result.accepted)return result;this.washingUI?.sync();this.onChanged();if(!result.correct){this.feedback('Keep your clean links. Try the next block.','wrong');return result;}this.view.reactStation('wash-clean',{index,accepted:[...a.ingredients],animate:true});this.audio.effect?.('ceramic');this.feedback(a.ingredients.length+' / '+a.task.blocks.length+' connected.','success');if(result.completed)this.presentCompleted(a,null,.85);return result;}
  renderIngredients(){
    const a=this.game?.active;if(!a||a.task.kind!=='sentence')return;const blocks=a.task.blocks;
    const compact=this.view.station?.prepLayout?.mode!=='columns';this.root.classList.toggle('recipe-compact',compact);this.root.dataset.hasIngredients=String(a.ingredients.length>0);const tray=$('sentence-tray'),slot=compact?$('compact-sentence-slot'):this.root.querySelector('.recipe-note-ink');if(tray&&slot&&tray.parentElement!==slot)slot.append(tray);
    $('sentence-tray').innerHTML=a.ingredients.length?a.ingredients.map(i=>`<span class="placed-chunk">${esc(blocks[i])}</span>`).join(' '):'<span class="recipe-empty">Your sentence collects here.</span>';
    $('word-bank').innerHTML=this.order.map((index,key)=>`<button type="button" data-object="ingredient-${index}" class="word-block ingredient-option ${this.selectedIngredient===index?'selected':''} ${a.ingredients.includes(index)?'used':''}" data-block="${index}" ${a.ingredients.includes(index)||a.completed?'disabled':''} aria-pressed="${this.selectedIngredient===index}" aria-label="Ingredient: ${esc(blocks[index])}"><span>${esc(blocks[index])}</span><small>${key+1}</small></button>`).join('');
    $('word-bank').querySelectorAll('[data-block]').forEach(button=>{const index=+button.dataset.block;button.addEventListener('click',()=>this.chooseIngredient(index));this.bindDrag(button,{kind:'ingredient',index});});if(this.surface)this.surface.layoutKey='';this.surface?.update();
    if($('prep-count'))$('prep-count').textContent=`${a.ingredients.length} / ${blocks.length}`;
    if($('prep-progress'))$('prep-progress').style.setProperty('--progress',((a.prepPhase||0)*blocks.length+a.ingredients.length)/(blocks.length*PREP_PHASE_COUNT));
    if($('dish-drop'))$('dish-drop').onclick=()=>this.dropIngredient();
  }
  chooseIngredient(index){const a=this.game?.active;if(!a||a.completed||this.busy||this.game.paused||!a.task.blocks?.[index]||a.ingredients.includes(index)||this.surface?.ready===false)return;this.selectedIngredient=index;this.root.dataset.selected='ingredient';this.view.selectIngredient(index);this.root.querySelectorAll('[data-block]').forEach(button=>{const selected=+button.dataset.block===index;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});this.audio.effect?.('pickup');this.feedback('Selected: “'+a.task.blocks[index]+'”. Place it in the highlighted dish.');this.updateTarget();}
  chooseLabel(index){const a=this.game?.active;if(!a||a.completed||this.busy||this.game.paused||!this.options[index]||this.surface?.ready===false)return;this.selectedLabel=index;this.root.dataset.selected='label';this.root.querySelectorAll('[data-answer]').forEach(button=>{const selected=+button.dataset.answer===index;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});this.feedback('Attach this sticker to the crate. Drag it, or tap the crate.');this.updateTarget();}
  async dropIngredient(){if(this.surface?.ready===false)return;
    const a=this.game?.active,index=this.selectedIngredient;if(!a||a.completed||this.busy||this.game.paused)return;if(index==null){this.feedback('Choose a word ingredient first, then place it in the dish.');return;}const result=this.game.addIngredient(index);if(!result.accepted)return;this.selectedIngredient=null;delete this.root.dataset.selected;
    if(!result.correct){this.view.rejectIngredient(index);this.feedback(feedbackForTask(a.task,{attempts:a.attempts,selected:a.ingredients}),'wrong');this.onChanged();this.renderIngredients();this.updateTarget();return;}
    this.view.addIngredient(index);this.audio.effect?.('ceramic');this.renderIngredients();this.onChanged();this.updateTarget();
    if(result.completed){this.presentCompleted(a,null,.65);return;}
    this.feedback('Added. Choose the next part of your sentence.','success');
  }
  dropLabel(){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||a.completed||this.busy||this.game.paused)return;if(this.selectedLabel==null){this.feedback('Choose a delivery sticker first, then attach it to the crate.');return;}const button=this.root.querySelector(`[data-answer="${this.selectedLabel}"]`),value=this.options[this.selectedLabel],result=this.game.attachLabel(value);if(result.accepted&&result.correct&&!this.ghost)this.labelFlight(button,$('crate-drop'));this.lastLabelResult=result;button?.classList.remove('selected');button?.setAttribute('aria-pressed','false');this.selectedLabel=null;delete this.root.dataset.selected;this.handleResult(result,button,a);this.updateTarget();}
  locate(index,button){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||a.completed||this.busy)return;const result=this.game.locateRepair(index);if(!result.accepted)return;this.onChanged();if(!result.correct){button.classList.add('keep-word');this.feedback('That part can stay. Find the part that needs changing.','wrong');return;}
    button.classList.add('flagged');this.view.reactStation('repair-select',index);$('repair-sentence').querySelectorAll('button').forEach(b=>b.disabled=b!==button);$('erase-button').hidden=false;this.feedback('You found it. Clear the highlighted word.');this.revealControl($('erase-button'));this.updateTarget();
  }
  async erase(){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||a.completed||this.busy||!this.game.eraseRepair())return;const epoch=this.epoch;this.busy=true;this.view.reactStation('erase');this.onChanged();const word=$('repair-sentence').querySelector('.flagged');word.textContent='_____';word.classList.add('erased');$('erase-button').hidden=true;this.feedback('Clearing the selected word…');this.updateTarget();await wait(240);if(epoch!==this.epoch)return;this.busy=false;$('repair-options').hidden=false;$('repair-instruction').hidden=false;this.feedback('Choose the replacement word.');this.revealControl($('repair-options'));this.updateTarget();}
  submit(value,button){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||a.completed||this.busy||this.game.paused)return;if(a.task.requested){this.chooseListeningWord(value);return;}this.handleResult(this.game.answer(value),button,a);}
  syncListening(){
    const a=this.game?.active;if(!a?.task.requested)return;
    this.root.querySelectorAll('[data-answer]').forEach(button=>{const word=this.options[+button.dataset.answer],selected=a.selectedWords.includes(word);button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected);button.disabled=!!a.completed||this.busy;});
    $('listening-basket').textContent=`${a.selectedWords.length} / 2 selected`;
    $('listening-confirm').disabled=a.selectedWords.length!==2||a.completed||this.busy||this.game.paused;
    this.view.reactStation('tablet-select',{selected:[...a.selectedWords],confirmed:!!a.completed});
  }
  chooseListeningWord(value){if(this.surface?.ready===false)return;const result=this.game.toggleListeningWord(value);if(!result.accepted){if(result.full)this.feedback('Two words are selected. Tap one to remove it before choosing another.');return;}this.syncListening();this.feedback(result.selected.length===2?'Ready to check? Confirm both words.':'Listen again or choose the other word.');}
  confirmListening(){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a?.task.requested||this.busy||this.game.paused)return;const result=this.game.confirmListening();if(!result.accepted)return;this.syncListening();this.handleResult(result,null,a);}
  handleResult(result,button,a){if(!result.accepted)return;this.onChanged();if(!result.correct){button?.classList.add('incorrect');if(button?.classList.contains('answer-button'))button.disabled=true;this.feedback(feedbackForTask(a.task,{attempts:a.attempts,selected:a.ingredients}),'wrong');return;}this.presentCompleted(a,button);}
  presentCompleted(a,button,minDuration=.85,spoken=readbackFor(a.task)){
    const t=a.task,setting=settingForTask(t);this.view.setSpeaking(a.tableId,false);this.busy=true;button?.classList.add('correct');this.root.querySelectorAll('button').forEach(b=>b.disabled=b.id!=='read-button');this.feedback(a.prepPhase!=null&&a.prepPhase<PREP_PHASE_COUNT-1?`Sentence complete. Next: ${PREP_PHASE_NAMES[a.prepPhase+1].toLowerCase()} the same dish with the next ingredients.`:t.dialogue?.turn===1?'Understood. Your guest has one more question.':setting==='conversation'&&a.phase==='serve'?'Your guest is happy. The dish is ready to deliver.':a.attempts>1||a.hinted?'You repaired it. Your order can continue.':TASK_SETTINGS[setting].success,'success');
    if(setting==='recipe'){const meaning=t.translation||(!t.additionalSource?t.prompt:'');this.feedback(meaning?'Correct. Read the Turkish meaning before continuing.':'Correct. Read your complete English sentence.','success');$('prep-translation').textContent=meaning||t.answer;$('prep-translation').lang=meaning?'tr':'en';$('prep-translation').hidden=false;$('prep-build-cue').hidden=true;this.surface.layoutKey='';}
    if(setting==='wash')this.feedback(`${(a.activityRound||0)+1} / ${a.activityRounds||1} plates clean. ${(a.activityRound||0)+1<(a.activityRounds||1)?'Next plate coming…':'Batch complete. Rinsing…'}`,'success');
    if(setting==='conversation')this.view.reactStation('conversation');
    if(['tablet','pickup'].includes(setting)){$('tablet-confirmation').textContent=t.kind==='matching'?`ORDER CONFIRMED · ${t.pairs.length} PAIRS`:`ADDED: ${t.answer.toUpperCase()}`;$('tablet-confirmation').classList.add('confirmed');this.view.reactStation('tablet',t.answer);}
    if(setting==='pickup'){const more=a.activityRound<a.activityRounds-1;$('tablet-confirmation').textContent=more?'4 CHECKED · NEXT SET':'ALL LABELS CHECKED';this.feedback(more?'Four labels checked. Next set coming…':'All labels checked. Ready for collection!','success');}
    if(setting==='delivery')this.view.reactStation('label',t.answer);
    this.root.dataset.completed='true';this.root.dataset.restored=String(!!this.view.station?.restoring);
    if(setting==='ticket'){$('ticket-gap').textContent=t.answer;$('ticket-gap').classList.add('filled');this.view.reactStation('ticket-fill',readbackFor(t));$('ticket-stamp').textContent='FILLED · SENDING AUTOMATICALLY';$('stamp-button').hidden=true;$('stamp-button').disabled=true;$('ticket-grip').hidden=true;$('ticket-grip').disabled=true;}
    if(setting==='repair'){const word=$('repair-sentence').querySelector('.flagged');word.textContent='✓';word.classList.add('fixed');$('repair-sentence').hidden=true;$('repair-options').hidden=true;$('ticket-stamp').textContent='READY TO PRINT';this.view.reactStation('repair',readbackFor(t));$('print-button').hidden=false;$('print-button').disabled=false;this.revealControl($('print-button'));}
    $('task-readback').textContent=t.kind==='repair'?'':t.kind==='vocabulary'?`${t.answer} — ${t.translation}`:readbackFor(t);$('task-readback').hidden=['question','listening','matching','repair'].includes(t.kind);this.announce(`Correct. ${readbackFor(t)}`);this.updateTarget();this.readbackSpoken=spoken;this.presentReadback(a,minDuration);
  }
  async presentReadback(a,duration=.55){if(a.prepPhase!=null)return this.presentPrepTranslation(a);const epoch=this.epoch,serial=++this.playbackSerial;this.doneReading=false;await wait(Math.max(.12,Math.min(.85,duration))*1000);if(epoch!==this.epoch||serial!==this.playbackSerial||this.game?.active!==a)return;this.doneReading=true;this.busy=false;this.maybeAdvance();}
  async presentPrepTranslation(a){
    const epoch=this.epoch;this.doneReading=false;a.prepRevealRemaining??=2000;let last=Date.now();
    while(a.prepRevealRemaining>0){await wait(40);if(epoch!==this.epoch||this.game?.active!==a)return;const now=Date.now();
      if(!this.game.paused&&this.surface?.ready!==false&&!this.manualSpeech&&!this.speechSession&&!this.replayAfterReady)a.prepRevealRemaining=Math.max(0,a.prepRevealRemaining-Math.min(80,now-last));last=now;
    }
    this.doneReading=true;this.busy=false;this.maybeAdvance();
  }
  chooseTicket(index,forDrag=false){if(!this.game?.active||this.game.active.completed||this.busy||this.game.paused||!this.options[index]||this.surface?.ready===false)return;this.selectedTicket=index;this.root.dataset.selected='ticket-word';this.root.querySelectorAll('[data-answer]').forEach(b=>{const selected=+b.dataset.answer===index;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});if(!forDrag)this.dropTicketWord();}
  dropTicketWord(){if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||a.completed||this.busy||this.game.paused)return;if(this.selectedTicket==null){this.feedback('Tap the correct word below to fill the blank.');return;}const index=this.selectedTicket;this.selectedTicket=null;delete this.root.dataset.selected;this.submit(this.options[index],this.root.querySelector(`[data-answer="${index}"]`));}
  async printReceipt(){
    if(this.surface?.ready===false)return;const a=this.game?.active;if(!a?.completed||!this.game.printReceipt())return;
    this.audio.effect?.('print');this.view.reactStation('print');$('print-button').disabled=true;$('ticket-stamp').textContent='PRINTING';this.onChanged();await this.feedReceipt();
  }
  async feedReceipt(){
    const a=this.game?.active;if(!a?.printed)return;const epoch=this.epoch;this.printAnimating=true;
    this.view.station.receiptDriven=true;$('receipt-sentence').textContent=readbackFor(a.task);$('printed-receipt').hidden=false;this.surface.layoutKey='';
    let progress=a.receiptFeedProgress||0,last=Date.now();this.view.reactStation('receipt-feed',progress*progress*(3-2*progress));this.updateTarget();
    while(progress<1){await wait(24);if(epoch!==this.epoch||this.game?.active!==a)return;const now=Date.now();
      if(!this.game.paused&&this.surface?.ready!==false)progress=Math.min(1,progress+Math.min(60,now-last)/RECEIPT_FEED_MS);
      last=now;a.receiptFeedProgress=progress;this.view.reactStation('receipt-feed',progress*progress*(3-2*progress));this.updateTarget();
    }
    if(epoch===this.epoch)await this.showReceipt();
  }
  async showReceipt(){
    const a=this.game?.active;if(!a?.printed)return;const epoch=this.epoch;
    this.printAnimating=true;$('receipt-sentence').textContent=readbackFor(a.task);this.view.reactStation('receipt-ready');this.surface.layoutKey='';$('printed-receipt').hidden=false;
    this.feedback('Read your corrected check. Continuing automatically…','success');this.updateTarget();
    let remaining=receiptReadMilliseconds(readbackFor(a.task)),last=Date.now();
    while(remaining>0){await wait(80);if(epoch!==this.epoch||this.game?.active!==a)return;const now=Date.now();if(!this.game.paused&&this.surface?.ready!==false&&!this.manualSpeech)remaining-=Math.min(120,now-last);last=now;}
    this.printAnimating=false;this.maybeAdvance();
  }
  async stamp(){
    if(this.surface?.ready===false)return;const a=this.game?.active;if(!a||!this.game.stampTicket())return;
    this.stampAnimating=true;this.audio.effect?.('clip');this.view.reactStation('clip',readbackFor(a.task));$('ticket-stamp').textContent='SENT TO THE KITCHEN';$('stamp-button').disabled=true;$('ticket-grip').disabled=true;this.onChanged();this.updateTarget();await this.finishTicketClip(a);
  }
  async finishTicketClip(a){
    const epoch=this.epoch;let remaining=690,last=Date.now();
    while(remaining>0){await wait(24);if(epoch!==this.epoch||this.game?.active!==a)return;const now=Date.now();if(!this.game.paused&&this.surface?.ready!==false&&!this.manualSpeech)remaining-=Math.min(60,now-last);last=now;}
    this.stampAnimating=false;this.maybeAdvance();
  }
  maybeAdvance(){const a=this.game?.active;if(!a?.completed||!this.doneReading||this.surface?.ready===false||this.game.paused||this.stampAnimating||this.printAnimating||this.manualSpeech)return;if(a.task.kind==='repair'&&!a.printed){this.feedback('The correction is ready. Press the register’s print key.','success');return;}if(a.task.kind==='completion'&&!a.stamped){this.stamp();return;}const result=this.game.completeTask();if(!result)return;this.onChanged();if(this.game?.active)this.open();else this.close();}
  pause(){this.touchFeedback?.clear();this.washingUI?.end({type:'pointercancel',pointerId:this.washingUI.stroke?.id});this.cancelDrag();this.pausedSpeech=this.speechSession||this.replayAfterReady;if(this.manualSpeech)this.manualNeedsReplay=true;if(this.sortPlayback){this.sortNeedsReplay=true;this.playbackSerial++;}if(this.game?.active?.completed&&this.game.active.prepPhase==null&&!this.doneReading){this.needsReplay=true;this.playbackSerial++;}}
  resume(){const a=this.game?.active;if(!a)return;if(this.pausedSpeech?.a===a){this.replayAfterReady=this.pausedSpeech;this.pausedSpeech=null;this.pendingPrompt=false;this.manualSpeech=!!this.replayAfterReady.force;this.manualNeedsReplay=false;this.updateTarget();}if(this.manualNeedsReplay){this.manualNeedsReplay=false;this.speakPrompt(true);}if(this.sortNeedsReplay&&this.sortPlayback){this.sortNeedsReplay=false;this.sortReadback(a,this.sortPlayback.word);return;}if(a.completed&&this.needsReplay){this.needsReplay=false;this.presentReadback(a,.5);}else this.maybeAdvance();}
  act(action){if(!action)return;if(action.action==='sort-destination'){this.chooseSort(action.index);return;}if(action.action==='stamp'){this.stamp();return;}if(this.busy||this.game?.paused)return;if(action.action==='tablet-pair'){this.choosePair(action.side,action.index);return;}if(action.action==='ingredient')this.chooseIngredient(action.index);else if(action.action==='vessel')this.dropIngredient();else if(action.action==='crate')this.dropLabel();else if(action.action==='eraser')this.erase();else if(action.action==='repair-part'){const button=$('repair-sentence').querySelector(`[data-part="${action.index}"]`);if(button)this.locate(action.index,button);}else if(action.action==='repair-option')this.submit(this.options[action.index],this.root.querySelector(`[data-answer="${action.index}"]`));else if(action.action==='tablet-option')this.submit(this.options[action.index],this.root.querySelector(`[data-answer="${action.index}"]`));}
  actTarget(){const a=this.game?.active;if(!a)return;if(a.task.kind==='completion')this.stamp();else if(a.task.kind==='repair')this.erase();else if(a.task.kind==='sentence')this.dropIngredient();else if(a.purpose==='delivery')this.dropLabel();}
  updateTarget(){
    this.root.dataset.paused=String(!!this.game?.paused);
    const a=this.game?.active;
    if(a?.task.kind==='repair'){const step=checkoutStep(a);for(const [id,text]of [['repair-step',step.number+' / 4'],['repair-title',step.title],['repair-help',step.help]])if($(id).textContent!==text)$(id).textContent=text;const main=this.root.querySelector('[data-page="checkout"]');if(main)main.dataset.printed=String(!!a.printed);}
    if(this.root.dataset){const a=this.game?.active;this.root.dataset.stage=a?.task.kind==='repair'?(a.completed?'print':a.repairErased?'replace':a.repairFound?'clear':'find'):a?.completed?'send':'choose';}
    if(a?.task.kind==='sentence'&&settingForTask(a.task)==='recipe'){
      const selected=this.selectedIngredient!=null&&!a.completed,drop=$('dish-drop'),label=$('dish-drop-label');if(drop){drop.dataset.ready=String(selected);drop.setAttribute('aria-label',selected?'Place '+a.task.blocks[this.selectedIngredient]+' in the dish':'Choose an ingredient before placing it');}if(label){const phone=this.view?.container?.clientWidth<760,text=phone?(selected?'Drop here':a.completed?'Ready':'Plate'):(selected?'Place ingredient here':a.completed?'Beautifully plated':'Choose an ingredient');if(label.textContent!==text)label.textContent=text;}
      this.root.dataset.hasSelection=String(selected);
    }
    this.surface?.update();this.washingUI?.lines();this.syncFreshness(a);
    if(this.root.dataset)this.root.dataset.interaction=this.drag?.moved?'dragging':this.busy?'settling':a?.completed?'completed':'ready';
    if($('hint-button'))$('hint-button').disabled=this.busy||!!a?.completed;
    if(a?.task.kind==='sorting'&&$('sort-card'))$('sort-card').disabled=this.busy||a.completed||this.game.paused;
    if(this.replayAfterReady&&this.surface?.ready!==false&&!this.game?.paused){const replay=this.replayAfterReady;this.replayAfterReady=null;if(replay.a===a)this.speakPrompt(replay.force,{text:replay.text,voiceProfile:replay.voiceProfile});}
    if(this.pendingPrompt&&this.surface?.ready!==false&&!this.game?.paused){this.pendingPrompt=false;this.speakPrompt(false);}
    if(a?.completed&&this.surface?.ready!==false&&this.doneReading&&(a.task.kind!=='repair'||a.printed)){this.maybeAdvance();if(this.game?.active!==a)return;}
    if(this.surface?.active){this.target.hidden=true;return;}if(!a){this.target.hidden=true;return;}
    let text='';if(a.task.kind==='repair'&&a.repairFound&&!a.repairErased&&!this.busy)text='Clear selected word';else if(a.task.kind==='sentence'&&this.selectedIngredient!=null&&!this.busy)text=`Add to the ${this.view.station?.containerName||'vessel'}`;else if(a.purpose==='delivery'&&this.selectedLabel!=null&&!this.busy)text='Attach the label';this.target.hidden=!text;if(!text)return;this.target.textContent=text;const projected=this.view.projectAction()||{x:innerWidth*.5,y:innerHeight*.3},sheetTop=this.root.getBoundingClientRect?.().top??innerHeight*.4,point=actionPlacement({x:projected.x,y:projected.y+37},innerWidth,innerHeight,sheetTop);this.target.style.left=`${point.x}px`;this.target.style.top=`${point.y}px`;this.target.disabled=!!this.game.paused;
  }
  syncFreshness(a){
    if(!a||!this.game)return;
    const ready=this.surface?.ready!==false&&!this.game.paused&&!a.completed&&!this.busy&&!this.speechSession&&!this.manualSpeech&&!this.pendingPrompt&&!this.replayAfterReady&&!this.sortPlayback;
    this.game.taskTimingActive=a;this.game.taskTimingReady=ready;
    const clock=ensureFreshness(a,this.game.config.difficulty),state=freshnessState(clock),node=$('freshness-ring');if(!node)return;
    node.dataset.grade=state.grade;node.dataset.expired=String(clock.remaining<=0);node.dataset.running=String(ready&&clock.remaining>0);$('freshness-arc').style.setProperty('stroke-dashoffset',100*(1-state.ratio));
    const label=this.game.paused?'Paused':state.grade[0].toUpperCase()+state.grade.slice(1);$('freshness-seconds').textContent=state.seconds+'s';$('freshness-grade').textContent=label;
    node.setAttribute('aria-label',`${label} freshness, ${state.seconds} seconds left${ready?'':', clock stopped'}`);
    node.title='Green: great · Yellow: good · Red: late. Fresh timing adds up to 2 tips per order (4 in Challenge). You can finish after time runs out.';
  }
  key(event){if(['Enter',' '].includes(event.key)&&event.target?.closest?.('button,a,select,input'))return;const a=this.game?.active;if(!a||this.game.paused||this.surface?.ready===false)return;const index=+event.key-1;if(a.completed){if(event.key==='Enter'){event.preventDefault();if(a.task.kind==='repair'){if(!a.printed)this.printReceipt();}else this.stamp();}return;}if(this.busy)return;
    if(a.task.kind==='matching'){const side=/^[1-4]$/.test(event.key)?'word':/^[a-d]$/i.test(event.key)?'match':null;if(side){event.preventDefault();if(a.task.takeawayKind==='instructions'&&side==='word'){[...this.root.querySelectorAll('[data-side=word][data-pair]')].find(b=>!b.hidden)?.click();return;}const row=side==='word'?index:event.key.toLowerCase().charCodeAt(0)-97;this.root.querySelector(`[data-side="${side}"][data-pair="${this.menuOrder[side][row]}"]`)?.click();}return;}
    if(a.task.kind==='sorting'){if(/^[12]$/.test(event.key)){event.preventDefault();this.chooseSort(index);}return;}
    if(a.task.kind==='repair'&&!a.repairFound){if(/^[1-9]$/.test(event.key))$('repair-sentence').querySelectorAll('[data-part]')[index]?.click();return;}
    if(a.task.kind==='repair'&&!a.repairErased){if(['Enter','Backspace','Delete'].includes(event.key)){event.preventDefault();this.erase();}return;}
    if(a.task.variant==='washing'&&/^[1-5]$/.test(event.key)){event.preventDefault();this.root.querySelectorAll('[data-wash-block]')[index]?.click();return;}
    if(/^[1-4]$/.test(event.key)){if(a.task.kind==='sentence')$('word-bank').querySelectorAll('button')[index]?.click();else this.root.querySelectorAll('[data-answer]')[index]?.click();}
    if(event.key==='Enter'){if(a.task.requested){event.preventDefault();this.confirmListening();}else if(a.task.kind==='completion')this.dropTicketWord();else this.actTarget();}
  }
  restoreStation(a){
    if(a.task.variant==='washing'){this.washingUI?.sync();this.view.reactStation('wash-clean',{accepted:[...a.ingredients],animate:false});}else if(a.task.kind==='sentence')for(const i of a.ingredients)this.view.addIngredient(i);
    if(a.task.kind==='sorting'){for(let i=0;i<a.sortIndex;i++)this.view.reactStation('sort-place',{index:i,category:a.task.cards[i].category});this.syncSorting();}
    if(a.task.kind==='repair'&&a.repairFound){const word=$('repair-sentence').querySelector(`[data-part="${repairParts(a.task).errorIndex}"]`);word?.classList.add('flagged');$('repair-sentence').querySelectorAll('button').forEach(b=>b.disabled=b!==word||a.repairErased);this.view.reactStation('repair-select');$('erase-button').hidden=!!a.repairErased;if(a.repairErased){if(word){word.textContent='_____';word.classList.add('erased');}this.view.reactStation('erase');$('repair-options').hidden=false;$('repair-instruction').hidden=false;}}
    if(a.completed){this.presentCompleted(a,null,.2);const epoch=this.epoch;if(a.stamped){$('stamp-button').disabled=true;$('ticket-grip').disabled=true;this.stampAnimating=true;this.view.reactStation('clip',readbackFor(a.task));this.finishTicketClip(a);}if(a.printed){this.printAnimating=true;this.view.reactStation('print');$('print-button').disabled=true;this.feedReceipt();}}
  }
  revealControl(node){const scroll=node?.closest('.surface-scroll');if(!scroll||!node.getBoundingClientRect)return;const r=node.getBoundingClientRect(),v=scroll.getBoundingClientRect();if(r.bottom>v.bottom-12)scroll.scrollTop+=r.bottom-v.bottom+12;}
  reframe(){
    const a=this.game?.active;if(!a)return;
    const replay=this.speechSession||this.replayAfterReady||this.pausedSpeech,pair=this.selectedPair;
    if(a.presentation)a.presentation.scrollTops=[...this.root.querySelectorAll('.surface-scroll')].map(n=>n.scrollTop||0);
    this.audio.cancelSpeech();this.open({restoredSpeech:replay?.a===a?replay:null,restoredPair:pair});
  }
  bindDrag(button,payload){
    if(!button)return;button.classList.add('draggable-piece');
    // Suppress only the compatibility click produced by this completed drag.
    // The next pointerdown clears it, so another quick tap always works.
    button.addEventListener('click',event=>{if(!this.consumedClicks.has(button)||event.detail===0)return;this.consumedClicks.delete(button);event.preventDefault?.();event.stopImmediatePropagation?.();},{capture:true});
    button.addEventListener('pointerdown',event=>{if(this.beginPointer(event,payload,button))try{button.setPointerCapture(event.pointerId);}catch{}});
    button.addEventListener('pointermove',event=>this.movePointer(event));
    button.addEventListener('pointerup',event=>this.endPointer(event));
    button.addEventListener('pointercancel',event=>{if(this.drag?.pointerId===event.pointerId)this.cancelDrag();});
    button.addEventListener('lostpointercapture',event=>{if(this.drag?.pointerId===event.pointerId)this.cancelDrag();});
  }
  beginPointer(event,payload,source=null){
    const a=this.game?.active;if(this.drag||event.isPrimary===false||event.button>0||!a||this.game.paused||this.surface?.ready===false||source?.disabled||a.completed&&payload.kind!=='ticket'||this.busy&&payload.kind!=='ticket')return false;
    if(event.pointerType==='touch'&&source?.dataset.scrollDrag==='handle'&&!event.target?.closest?.('.drag-grip'))return false;
    if(payload.kind==='ingredient'&&a.ingredients.includes(payload.index))return false;if(payload.kind==='ticket'&&(!a.completed||a.stamped))return false;
    if(source)this.consumedClicks.delete(source);this.lastMoveEvent=null;
    this.drag={pointerId:event.pointerId,payload,source,x:event.clientX,y:event.clientY,moved:false,epoch:this.epoch};return true;
  }
  worldPointer(phase,event,action){
    if(phase==='start'){const payload=action?.action==='ingredient'?{kind:'ingredient',index:action.index}:action?.action==='sort-card'?{kind:'sorting'}:null;return payload?this.beginPointer(event,payload):false;}
    if(phase==='move')this.movePointer(event);if(phase==='end'){const d=this.drag;this.endPointer(event);if(d&&!d.moved){if(d.payload.kind==='ingredient')this.chooseIngredient(d.payload.index);}}
    if(phase==='cancel')this.cancelDrag();return true;
  }
  movePointer(event){
    const d=this.drag;if(!d||d.pointerId!==event.pointerId||d.epoch!==this.epoch||this.game?.paused||this.lastMoveEvent===event)return;this.lastMoveEvent=event;
    if(!d.moved&&Math.hypot(event.clientX-d.x,event.clientY-d.y)>8){d.moved=true;const p=d.payload;if(p.kind==='ingredient')this.chooseIngredient(p.index);if(p.kind==='label')this.chooseLabel(p.index);if(p.kind==='ticket-word')this.chooseTicket(p.index,true);d.physical=!!this.view.startObjectDrag?.(p.kind,p.index,{x:d.x,y:d.y});
      if(!d.physical){this.removeGhost();this.ghost=document.createElement('div');this.ghost.className='drag-word';this.ghost.textContent=p.kind==='ticket'?'Completed ticket':p.kind==='sorting'?this.game.active.task.cards[this.game.active.sortIndex].word:p.kind==='ingredient'?this.game.active.task.blocks[p.index]:this.options[p.index];document.body.append(this.ghost);}}
    if(!d.moved)return;this.root.dataset.dragging=d.payload.kind;if(d.payload.kind==='ingredient'&&['touch','pen'].includes(event.pointerType)){if(!this.dragCaption){this.dragCaption=document.createElement('div');this.dragCaption.className='ingredient-drag-caption';this.dragCaption.setAttribute('aria-hidden','true');document.body.append(this.dragCaption);}this.dragCaption.textContent=this.game.active.task.blocks[d.payload.index];this.dragCaption.style.left=Math.max(90,Math.min((this.view?.container?.clientWidth||globalThis.innerWidth||390)-90,event.clientX))+'px';this.dragCaption.style.top=Math.max(110,event.clientY-100)+'px';}if(event.cancelable)event.preventDefault();
    const lift=d.payload.kind==='ticket'?0:event.pointerType==='mouse'?24:48;
    if(d.physical)d.anchor=this.view.moveObjectDrag?.(event.clientX,event.clientY-lift);
    if(this.ghost){this.ghost.style.left=event.clientX+'px';this.ghost.style.top=(event.clientY-lift)+'px';const r=this.ghost.getBoundingClientRect();d.anchor={x:event.clientX,y:event.clientY-lift-r.height/2};}
    this.surface?.update();this.root.querySelectorAll('.drop-ready').forEach(n=>n.classList?.remove('drop-ready'));const target=this.dropDestination(d.payload,event);target?.node?.classList.add('drop-ready');this.root.dataset.landing=target?'ready':'searching';
    if(target?.node!==d.destination?.node){this.feedback(target?'Release to place.':'Move onto a landing area, or release to return it.');d.destination=target;}
  }
  dropDestination(payload,event){
    const id={ingredient:'dish-drop',label:'crate-drop','ticket-word':'ticket-gap',ticket:'stamp-button'}[payload.kind],targets=payload.kind==='sorting'?[...this.root.querySelectorAll('[data-sort]')].map(node=>({node,category:+node.dataset.sort})):id?[{node:$(id)}]:[];
    const viewport=this.view.container?.getBoundingClientRect?.(),finger={x:event.clientX,y:event.clientY};
    for(const target of targets){const key=target.node?.dataset.object,points=key&&this.view.projectObject?.(key);if(points)target.polygon=points.map(p=>({x:p.x+(viewport?.left||0),y:p.y+(viewport?.top||0)}));}
    // A clamped paper must not turn a release over the header/footer into a drop.
    const work=this.view.workRect;if(payload.kind==='ingredient'&&viewport&&work&&(finger.x<viewport.left+work.x-8||finger.x>viewport.left+work.x+work.width+8||finger.y<viewport.top+work.y-8||finger.y>viewport.top+work.y+work.height+8))return null;
    // A finger outside the playing area cancels even if a clamped object remains inside.
    if(viewport&&(finger.x<viewport.left||finger.x>viewport.right||finger.y<viewport.top||finger.y>viewport.bottom))return null;
    return placementTarget(targets,payload.kind==='ticket'?[finger]:[this.drag?.anchor,this.drag?.anchor?.pickup,finger],{padding:payload.kind==='sorting'?10:payload.kind==='ticket'?20:14,viewport});
  }
  endPointer(event){
    const d=this.drag;if(!d||d.pointerId!==event.pointerId)return;this.movePointer(event);if(!d.moved){this.drag=null;this.releasePointer(d);return;}
    if(d.source)this.consumedClicks.add(d.source);const dest=this.dropDestination(d.payload,event);this.drag=null;this.releasePointer(d);delete this.root.dataset.dragging;delete this.root.dataset.landing;
    this.lastLabelResult=null;const floating=this.ghost;
    if(dest&&d.epoch===this.epoch&&!this.game?.paused){const p=d.payload;if(p.kind==='ingredient')this.dropIngredient();else if(p.kind==='label')this.dropLabel();else if(p.kind==='ticket-word')this.dropTicketWord();else if(p.kind==='ticket')this.stamp();else this.chooseSort(dest.category);}
    else{this.clearObjectSelection();this.view.selectIngredient?.(null);this.feedback('Returned safely. Try the placement again.');}
    const returned=!dest||d.payload.kind==='ingredient'&&this.game?.active&&!this.game.active.ingredients.includes(d.payload.index);
    const labelFailed=d.payload.kind==='label'&&!this.lastLabelResult?.correct;this.ghost=null;if(floating&&!this.touchFeedback?.fly(floating,(!dest||labelFailed)?d.source:dest.node,{returning:!dest||labelFailed}))floating?.remove();
    this.view.endObjectDrag?.({animate:returned});if(!dest)this.view.selectIngredient?.(null);this.removeGhost();this.root.querySelectorAll('.drop-ready').forEach(n=>n.classList?.remove('drop-ready'));this.surface?.update();
  }
  clearObjectSelection(){$('sort-card')?.setAttribute('aria-pressed','false');this.selectedIngredient=null;this.selectedLabel=null;this.selectedTicket=null;if(this.root?.dataset){delete this.root.dataset.selected;if(['recipe','delivery','ticket'].includes(this.root.dataset.setting))this.root.querySelectorAll('[data-block],[data-answer]').forEach(n=>{n.classList?.remove('selected');n.setAttribute('aria-pressed','false');});}}
  releasePointer(d){try{const source=d?.source||this.view?.renderer?.domElement;source?.releasePointerCapture?.(d?.pointerId);}catch{}}
  cancelDrag(){const d=this.drag;this.drag=null;this.releasePointer(d);if(d?.moved&&d.source)this.consumedClicks.add(d.source);this.clearObjectSelection();this.view?.endObjectDrag?.({animate:true});this.view?.selectIngredient?.(null);if(this.root?.dataset){delete this.root.dataset.selected;delete this.root.dataset.dragging;delete this.root.dataset.landing;}this.removeGhost();this.root?.querySelectorAll?.('.drop-ready').forEach(n=>n.classList?.remove('drop-ready'));}
  labelFlight(source,target){if(!source||!target||typeof document==='undefined')return;const r=source.getBoundingClientRect(),n=document.createElement('div');n.className='drag-word';n.textContent=source.textContent;n.style.left=(r.left+r.width/2)+'px';n.style.top=(r.top+r.height/2)+'px';document.body.append(n);if(!this.touchFeedback?.fly(n,target))n.remove();}
  removeGhost(){this.dragCaption?.remove();this.dragCaption=null;this.ghost?.remove();this.ghost=null;}
}
