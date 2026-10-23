import {tableIdentity,taskIdentity,applyIdentity} from './task-identity.mjs';
import {createLeague,leagueApi,ultiClaim,hoursLabel,ULTI_ACCURACY} from './ulti.mjs';
import {CRITIC_GREETING,criticSummary} from './food-critic.mjs';
import {DesignEditor} from './design-editor.mjs';
import {cleanDesign,cleanCafeProgress,atmosphereFor,ATMOSPHERES,DECOR_SLOTS} from './cafe-design.mjs';
import {TakeoverStory} from './takeover-story.mjs';
import {reputationKey,cleanReputation} from './reputation.mjs';
import {reputationBadge,reputationResult} from './reputation-ui.mjs';
import {LessonPicker} from './lesson-picker.mjs';
import {OwnerGuide,OWNER_ASSETS} from './owner-guide.mjs';
import {ReviewCards} from './review-cards.mjs';
import {arenaUnlocked,permittedArena,arenaRequirement} from './arena-progression.mjs';
import {ARENA_VISUALS,PROJECT_VISUALS} from './presentation.mjs';
import {cleanKitchenHelp,simpleKitchenScreen} from './kitchen-signifiers.mjs';
import {KitchenHUD} from './kitchen-hud.mjs';
import {PROJECTS,PROJECT_GOALS,PROJECT_COSTS,cleanProjects,buyProjectStage} from './refurbishment.mjs';
import {eventFor,SERVICE_EVENTS} from './service-events.mjs';
import {getLanguageBank,messageTargetOrigin} from './local-runtime.mjs';
import {TEAMS,ARENAS,RECIPES,UPGRADES,BistroGame,normalizeConfig,loadProfile,saveProfile,walletKey,practiceKey,recordKey,saveResult,buyUpgrade,upgradeCost,CATALOG,buyItem,equipItem} from './core.mjs';
import {layoutSignals} from './service-layout.mjs';
import {serviceGuidance} from './service-guidance.mjs';
import {CUSTOMER_PROFILES} from './customer-profiles.mjs';
import {RestaurantView} from './restaurant.mjs';
import {BistroAudio} from './audio.mjs';
import {icon,hydrateIcons} from './icons.mjs';
import {TASK_SETTINGS,settingForTask,readbackFor} from './tasks.mjs';
import {StationInteractions} from './interactions.mjs';

const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reviewCards=new ReviewCards(document.getElementById('customer-reviews'));
const previewMode=new URLSearchParams(location.search).get('preview')==='phone';
let storage;if(previewMode){const memory=new Map();storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};document.body.classList.add('preview-embedded');}else try{storage=window.localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable');}};}
const profile=loadProfile(storage),audio=new BistroAudio(profile.settings),league=createLeague({api:previewMode?'':leagueApi(window.LANGUINI_CONFIG),storage});
let kitchenHUD,lessonPicker,takeoverStory,designEditor;let storyStartsShift=false;
const ownerGuide=new OwnerGuide({storage,getGame:()=>game,getMode:()=>profile.kitchenHelp.mode,notify:ownerToast});
function ownerToast(text,pose){toast(text);const img=document.createElement('img');img.src=OWNER_ASSETS[pose].small;img.alt='';img.width=38;img.height=46;img.decoding='async';ownerGuide.watchImage(img);$('toast').prepend(img);$('toast').dataset.owner='true';}
let bank=[],config,game=null,view=null,interactions=null,taskEpoch=0,toastTimer,lastFrame=0,uiClock=0,labels=[],lastFocus=null,saveWarningShown=false,previewSetting=null;
const team=()=>TEAMS.find(t=>t.id===config.team),arena=()=>ARENAS.find(a=>a.id===config.arena),unit=()=>bank.find(g=>g.grade===config.grade)?.units.find(u=>u.id===config.unit),wallet=()=>profile.wallets[walletKey(config)]||0;
let ultiRefreshAt=0,leagueGrade=null,leagueAt=0;const ticketRequests=new Map();
const paceName=id=>id==='challenge'?'Challenge':'Relaxed';
// Pools are fetched when the grade changes, when the dialog opens and every five minutes while setup shows.
function syncLeague(force=false){
  if(!league.enabled||!config||(!force&&$('setup').hidden&&$('ulti-modal').hidden))return;const grade=config.grade,now=Date.now();
  if(!force&&grade===leagueGrade&&now-leagueAt<300000)return;leagueGrade=grade;leagueAt=now;league.refresh(grade).then(()=>refreshUlti());
}
function ultiRules(snap){
  if(!snap.settings)return 'Win a shift to add Ulti to your team in the English League. Connecting to the League…';
  if(!snap.game)return 'Languini is not switched on in the English League yet. Shifts still earn runes and stars.';
  const points=snap.game.points,table=Array.isArray(points?.relaxed)&&Array.isArray(points?.challenge)?` Cafe/Diner/Bistro: Relaxed ${points.relaxed.join('/')} · Challenge ${points.challenge.join('/')}.`:'';
  return `Win a shift with ${ULTI_ACCURACY.relaxed}% first-try accuracy on Relaxed or ${ULTI_ACCURACY.challenge}% on Challenge to add Ulti to your team's Battle Arena pool. Points last ${hoursLabel(snap.hours)}.${table}`;
}
const ULTI_REASONS={'device-limit':'Today’s Ulti wins on this device are used up.','team-limit':'Your team reached today’s Ulti limit.',off:'Languini is not switched on in the League yet.','too-fast':'This shift finished too quickly to count.',expired:'This shift’s League ticket expired.'};
function ultiResultHTML(u,grade,teamName){
  if(u.state==='sending')return '<b>Ulti</b><span>Sending your win to the English League…</span>';
  if(u.state==='accuracy')return `<b>Ulti</b><span>Ulti needs ${u.needed}% first-try accuracy on ${paceName(game?.config.difficulty)}. You got ${u.accuracy}%.</span>`;
  if(u.state==='queued')return '<b>Ulti</b><span>Saved on this device. It will be sent when you are back online.</span>';
  if(u.state==='no-ticket')return '<b>Ulti</b><span>This shift could not reach the League when it opened.</span>';
  if(u.state==='counted'&&u.points>0)return `<b>+${u.points} Ulti</b><span>for Grade ${grade} ${esc(teamName)}!</span>`;
  return `<b>Ulti</b><span>${ULTI_REASONS[u.reason]||'The League could not count this shift.'}</span>`;
}
function refreshUlti(){
  if(!config)return;$('setup-ulti').hidden=!league.enabled;const node=$('result-ulti'),receipt=game?.result?.ulti;node.hidden=!league.enabled||!receipt;
  if(!league.enabled)return;syncLeague();
  const snap=league.snapshot(config.grade),mine=snap.teams.find(t=>t.id===config.team),value=snap.known?String(mine.points):'–',badge=$('setup-ulti-value');
  if(badge&&badge.textContent!==value)badge.textContent=value;
  const context=$('setup-ulti-context');if(context)context.textContent=`Grade ${config.grade} · ${team().name}`;
  $('setup-ulti').setAttribute('aria-label',`Ulti: ${snap.known?mine.points+' League points':'not loaded yet'} · Grade ${config.grade} · ${team().name}`);
  if(!$('ulti-modal').hidden){
    $('ulti-title').textContent=`Grade ${config.grade} · ${team().name}`;$('ulti-balance').textContent=value+' Ulti';$('ulti-note').textContent=ultiRules(snap);
    const stamp=JSON.stringify([config.team,snap.known,snap.capacity,snap.teams.map(t=>t.points)]);
    if($('ulti-awards').dataset.stamp!==stamp){$('ulti-awards').dataset.stamp=stamp;$('ulti-awards').innerHTML=snap.known?snap.teams.map(t=>{const info=TEAMS.find(x=>x.id===t.id),fill=Math.round(Math.min(1,t.points/snap.capacity)*100);return `<li class="ulti-team${t.id===config.team?' current':''}" style="--team-color:${info.color}"><b>${info.name}</b><span>${t.points} / ${snap.capacity} · x${t.strength.toFixed(2)}</span><i class="ulti-bar" aria-hidden="true"><i style="width:${fill}%"></i></i></li>`;}).join(''):'<li class="ulti-empty">The League has not answered yet.</li>';}
  }
  if(!$('results').hidden&&receipt){const html=ultiResultHTML(receipt,game.shift.grade,TEAMS.find(t=>t.id===game.shift.team)?.name||'');if(node.innerHTML!==html)node.innerHTML=html;}
}
function openUlti(){openModal('ulti-modal');syncLeague(true);refreshUlti();}
// A ticket is asked for when a shift opens; without one (offline) it is asked for again after each served guest.
function requestTicket(shift){
  if(!league.enabled||ticketRequests.has(shift.id)||league.ticketFor(shift.id))return;
  ticketRequests.set(shift.id,league.start(shift).finally(()=>ticketRequests.delete(shift.id)));
}
// Claims a qualifying win once its ticket request has settled; the receipt fills in as the League answers.
function claimUlti(result){
  if(!league.enabled)return null;const rule=ultiClaim(result,{preview:previewMode});
  if(!rule.claim){league.discard(result.shift.id);return rule.reason==='accuracy'?{state:'accuracy',accuracy:rule.accuracy,needed:rule.needed}:null;}
  const receipt={state:'sending'};
  Promise.resolve(ticketRequests.get(result.shift.id)).then(()=>league.claim(result.shift.id)).then(reply=>{Object.assign(receipt,reply);refreshUlti();if(reply.state==='counted')league.flush().then(()=>refreshUlti());});
  return receipt;
}
function sceneConfig(){const key=walletKey(config);return {...config,furnishings:profile.furnishings[key]||{},projects:profile.projects[key]||{},postcards:Object.values(profile.guests[key]||{}).filter(g=>g.visits>=3).length,design:cleanDesign(profile.designs[reputationKey(config)]),atmosphere:game?.state==='playing'?game.atmosphere:atmosphereFor(profile.designs[reputationKey(config)],cleanReputation(profile.reputations[reputationKey(config)]).shiftSerial+1),reputationLevel:cleanReputation(profile.reputations[reputationKey(config)]).level};}
function persist(){profile.config={...config};if(!saveProfile(storage,profile)&&!saveWarningShown){saveWarningShown=true;toast('Saving is unavailable in this browser. You can still play this session.');}}
function toast(text){clearTimeout(toastTimer);$('toast').dataset.owner='false';$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2900);}
function announce(text){$('announcer').textContent=text;}
function setFlow(index){$('flow-guide').querySelectorAll('.flow-step').forEach((el,i)=>el.classList.toggle('active',i===index));}
function updateAudioButtons(){
  const music=profile.settings.music,speech=profile.settings.speech;
  $('setup-sound').innerHTML=icon(music?'volume':'volumeoff');$('setup-sound').setAttribute('aria-pressed',String(music));
  $('setup-speech').innerHTML=icon(speech?'speech':'speechoff');$('setup-speech').setAttribute('aria-pressed',String(speech));
  $('pause-music').innerHTML=icon(music?'volume':'volumeoff')+` Sound ${music?'on':'off'}`;
  $('pause-speech').innerHTML=icon(speech?'speech':'speechoff')+` Voices ${speech?'on':'off'}`;
}
function toggleMusic(){profile.settings.music=!profile.settings.music;audio.wake();audio.music(!!game&&game.state==='playing'&&!game.paused);if(takeoverStory?.active)takeoverStory.syncAudio();updateAudioButtons();persist();}
function toggleSpeech(){profile.settings.speech=!profile.settings.speech;if(!profile.settings.speech)audio.cancelSpeech();updateAudioButtons();persist();}
function syncDisplaySettings(){document.querySelectorAll('[data-ambience-volume]').forEach(n=>{n.value=profile.settings.ambience;});document.querySelectorAll('[data-kitchen-guidance]').forEach(n=>{n.value=profile.kitchenHelp.mode;});document.querySelectorAll('[data-display-setting]').forEach(n=>{n.value=profile.settings[n.dataset.displaySetting]|| (n.dataset.displaySetting==='quality'?'auto':'system');});document.documentElement.dataset.motion=view?.reduced?'reduced':'full';}
function openModal(id){clearTimeout(toastTimer);$('toast').hidden=true;syncDisplaySettings();if(id==='pause-modal'&&$('performance-note')){const d=view?.diagnostics?.();$('performance-note').textContent=d?.quality==='lite'?'Light graphics active.':'Use Light graphics on slower devices.';}lastFocus=document.activeElement;$(id).hidden=false;$(id).querySelector('button:not(:disabled)')?.focus();}
function closeModal(id){$(id).hidden=true;lastFocus?.focus?.();}
function renderSetup(){
  config.arena=permittedArena(profile,config.arena);
  const palette=ARENA_VISUALS[config.arena];document.documentElement.dataset.arena=config.arena;document.documentElement.style.setProperty('--arena-accent',palette.accent);document.documentElement.style.setProperty('--arena-surface',palette.surface);
  const forecast=eventFor(config.arena,profile.eventHistory[walletKey(config)+':'+config.arena]||[],()=>0);if($('service-forecast'))$('service-forecast').textContent='Takeaway every shift · '+(forecast.id==='takeaway'?'Pickup number labels':forecast.name+' also expected');else{const note=document.createElement('p');note.id='service-forecast';note.className='service-forecast';note.textContent='Takeaway every shift · '+(forecast.id==='takeaway'?'Pickup number labels':forecast.name+' also expected');$('equipment-note').after(note);}
  document.documentElement.style.setProperty('--team',team().color);
  lessonPicker?.sync();const designButton=$('setup-design');if(designButton){const level=cleanReputation(profile.reputations[reputationKey(config)]).level,d=cleanDesign(profile.designs[reputationKey(config)]),pending=DECOR_SLOTS.filter(s=>s.level<=level&&!d.decor[s.id]).length;designButton.innerHTML=icon('prep')+' Design'+(pending?' <span class=design-earned aria-label="'+pending+' decorations earned" title="'+pending+' decorations earned">'+pending+'</span>':'');} $('setup-reputation').innerHTML=reputationBadge(profile.reputations[reputationKey(config)]);
  $('team-options').innerHTML=TEAMS.map(t=>`<button type="button" class="team-option" data-select="team" data-value="${t.id}" aria-pressed="${config.team===t.id}" style="--team-color:${t.color}" title="${t.name} · ${t.animal}"><span class="crest">${icon(t.animal.toLowerCase())}</span><span>${t.name}</span></button>`).join('');
  $('difficulty-options').innerHTML=[['relaxed','Relaxed','Take your time'],['challenge','Challenge','Busier café · 2× runes']].map(([id,title,desc])=>`<button type="button" class="difficulty-option" data-select="difficulty" data-value="${id}" aria-pressed="${config.difficulty===id}" title="${desc}"><b>${title}</b></button>`).join('');
  $('arena-options').innerHTML=ARENAS.map(a=>{const stars=profile.records[recordKey({...config,arena:a.id})]?.stars||0,locked=!arenaUnlocked(profile,a.id);return `<button type="button" class="arena-option" ${locked?'disabled aria-disabled="true"':''} data-select="arena" data-value="${a.id}" aria-pressed="${config.arena===a.id}" style="--arena-color:${ARENA_VISUALS[a.id].accent};--arena-surface:${ARENA_VISUALS[a.id].surface}" title="${a.label} · ${ARENA_VISUALS[a.id].description}">${icon(locked?'lock':ARENA_VISUALS[a.id].icon)}<span class="arena-stars">${Array.from({length:stars},()=>icon('star')).join('')}</span><b>${a.name}</b><small class="${locked?'arena-lock':''}">${locked?'Win '+(a.id==='banquet'?'Diner':'Café'):a.label}</small></button>`;}).join('');
  refreshUlti();$('setup-wallet').innerHTML=icon('rune')+wallet();const f=profile.furnishings[walletKey(config)];$('equipment-note').textContent=f?.equipped?.length?'Equipment: '+f.equipped.map(id=>CATALOG.find(i=>i.id===id)?.name).join(' · '):'Choose up to two equipment items in the café shop.';$('equipment-note').hidden=!f?.equipped?.length;$('equipment-note').classList.toggle('equipped-summary',!!f?.equipped?.length);updateAudioButtons();
}
function showSetup(){
  if(game?.state==='playing'){game.commitPendingReviews();processEvents();}lessonPicker?.close();designEditor?.close();
  ownerGuide.clear();
  document.documentElement.dataset.paused='false';
  taskEpoch++;interactions?.cancel();kitchenHUD?.hide();$('play').classList.remove('live-kitchen');if(view)view.liveKitchen=false;audio.cancelSpeech();audio.music(false);game=null;$('results').hidden=true;$('pause-modal').hidden=true;$('play').hidden=true;$('task-card').hidden=true;$('setup').hidden=false;$('play').classList.remove('task-open');
  renderSetup();view?.setMenu(true);view?.setRestaurant(sceneConfig());view?.revealVenue();persist();
}
function selectConfig(field,value){if(field==='arena'&&!arenaUnlocked(profile,value)){toast(arenaRequirement(value)+'.');return;}config=normalizeConfig({...config,[field]:field==='grade'?+value:value},bank);renderSetup();persist();view.setRestaurant(sceneConfig(),{reuse:true});if(field==='arena')view.revealVenue();audio.wake();audio.effect('tap');}
function requestService(){if(!previewMode&&!cleanReputation(profile.reputations[reputationKey(config)]).introSeen){playTakeover(true);return;}startService();}
function playTakeover(startShift=false){if(game?.state==='playing'||view?.fallback||view?.contextLost)return;storyStartsShift=startShift;closeModal('help-modal');ownerGuide.clear();audio.cancelSpeech();audio.music(false);$('setup').hidden=true;$('results').hidden=true;$('play').hidden=true;view.liveKitchen=false;view.setRestaurant(sceneConfig());view.setMenu(false);takeoverStory.start();}
function finishTakeover(){if(storyStartsShift){const key=reputationKey(config),state=cleanReputation(profile.reputations[key]);state.introSeen=true;profile.reputations[key]=state;persist();startService();const first=game?.tables.find(t=>t.status==='waiting');if(first&&view?.world?.tables[first.id]){view.world.tables[first.id].arrivalOrder=first.orderId;view.world.tables[first.id].arrivalElapsed=4.6;}}else showSetup();}
function startService(demoSetting=null,demoMenuMode=null,liveKitchen=true){
  lessonPicker?.close();
  document.documentElement.dataset.paused='false';
  if(!arenaUnlocked(profile,config.arena)){const required=arenaRequirement(config.arena);config.arena=permittedArena(profile,config.arena);renderSetup();persist();toast(required+'.');}
  if(view?.fallback||view?.contextLost){toast('Graphics need to recover before opening the café.');return;}
  if(!unit()?.tasks.length){toast('This unit could not be loaded. Please choose another unit.');return;}
  taskEpoch++;interactions?.cancel();audio.cancelSpeech();const ups=profile.upgrades[walletKey(config)]||{};game=new BistroGame({...config},unit().tasks,{upgrades:{...ups},demoSetting:typeof demoSetting==='string'?demoSetting:null,demoMenuMode,demoDialogue:previewMode&&demoSetting==='conversation',conversationHistory:previewMode&&demoSetting==='conversation'?{}:profile.practice[practiceKey(config)]||{},learning:profile.learning[practiceKey(config)]||{},guests:profile.guests[walletKey(config)]||{},furnishings:profile.furnishings[walletKey(config)]||{},projects:profile.projects[walletKey(config)]||{},eventHistory:profile.eventHistory[walletKey(config)+':'+config.arena]||[],eventType:eventFor(config.arena,profile.eventHistory[walletKey(config)+':'+config.arena]||[],()=>0).id,demoSorting:demoSetting==='delivery',liveKitchen:typeof demoSetting!=='string'&&liveKitchen,reputation:profile.reputations[reputationKey(config)]||{},design:profile.designs[reputationKey(config)]||{},cafeProgress:profile.cafeProgress[reputationKey(config)]||{},connectedService:typeof demoSetting!=='string'});requestTicket(game.shift);if(!demoSetting&&!previewMode){profile.reputations[reputationKey(config)]=game.reputation;persist();}
  $('setup').hidden=true;$('results').hidden=true;$('pause-modal').hidden=true;$('play').hidden=false;$('task-card').hidden=true;$('play').classList.remove('task-open');
  document.documentElement.style.setProperty('--team',team().color);$('play-team').innerHTML=icon(team().animal.toLowerCase());$('play-arena').textContent=arena().name;$('play-unit').textContent=unit().title;$('play-unit').title=`Grade ${config.grade} · ${unit().title} · ${config.difficulty==='challenge'?'Challenge':'Relaxed'}`;
  if(game.kitchen)game.kitchen.help=cleanKitchenHelp(profile.kitchenHelp);kitchenHUD?.hide();syncDisplaySettings();
  view.liveKitchen=!!game.kitchen;$('play').classList.toggle('live-kitchen',!!game.kitchen);view.setRestaurant(sceneConfig());view.setMenu(false);view.revealVenue();createLabels();setFlow(0);audio.wake();audio.setAtmosphere(game.atmosphere);audio.music(true);game.start();processEvents();updateHUD();persist();
  $('context-tip').innerHTML=icon('hand')+'<span>Tap a guest to take an order.</span>';$('context-tip').hidden=false;ownerGuide.start();
}
function createLabels(){
  $('table-labels').innerHTML=game.tables.map(t=>`<button type="button" class="table-label" data-table="${t.id}" hidden></button>`).join('');labels=[...$('table-labels').children];
  labels.forEach(el=>el.addEventListener('click',()=>tapTable(+el.dataset.table)));
}
function tapTable(id){
  if(!game||game.state!=='playing'||game.paused||game.active)return;audio.wake();if(game.kitchen){kitchenCommand('order:'+id);return;}const t=game.tables[id];if(game.selectedDish){if(game.deliver(id)){setFlow(2);processEvents();}else toast('Choose the matching '+(game.tables[game.selectedDish.tableId].pickup?'pickup marker.':'table marker.'));updateHUD();return;}
  if(t.status==='queued'){game.prioritise(id);toast('This ticket is next for its preparation space.');updateHUD();return;}
  if(t.status==='waiting'||t.status==='ready'&&t.step<t.plan.length){if(game.openOrder(id))openTask();else if(game.stock<=0&&game.openDelivery()){openTask();toast('Fresh supplies first, then back to your guest.');}setFlow(t.status==='ready'?2:0);processEvents();}
  else if(t.status==='ready'){game.chooseDish(id);toast(`Dish selected. Tap Table ${id+1} to deliver it.`);}
  else if(t.status==='cooking')toast('Cooking away! Take another order while you wait.');
  updateHUD();
}
function kitchenCommand(action){if(!game?.kitchen)return;audio.wake();if(simpleKitchenScreen(innerWidth,matchMedia('(pointer:coarse)').matches))game.kitchen.commandSimple(action);else game.kitchen.command(action);processEvents();updateHUD();}
function openDelivery(){if(game?.kitchen){kitchenCommand('receiving');return;}if(game?.openDelivery()){openTask();processEvents();updateHUD();}}
function openTask(){interactions.open();}
function processEvents(){
  if(!game)return;for(const e of game.drainEvents()){
    if(e.type==='task'&&game.active){setFlow(game.active.phase==='serve'?2:game.active.phase==='order'?0:1);if(e.setting==='conversation'){profile.practice[practiceKey(config)]=game.deck.conversationState;persist();}}
    if(e.type==='kitchen_learned'){profile.kitchenHelp=cleanKitchenHelp({...profile.kitchenHelp,seen:[...profile.kitchenHelp.seen,e.lesson]});persist();}
    if(e.type==='kitchen_task')openTask();
    if(e.type==='kitchen_notice')toast(e.message);
    if(e.type==='kitchen_loaded'||e.type==='kitchen_washed')audio.effect('ceramic');
    if(e.type==='kitchen_received')toast('Labeled and packed. Carry the crate to Pantry.');
    if(e.type==='cafe_progress'&&!game.demoSetting&&!previewMode){profile.cafeProgress[reputationKey(config)]=game.cafeProgress;persist();}
    if(e.type==='episode_bonus'){const k=walletKey(config);profile.wallets[k]=(profile.wallets[k]||0)+e.reward;persist();audio.effect('serve');toast('Neighbourhood order complete · +'+e.reward+' runes');}
    if(e.type==='episode_notice'){announce(e.message);}
    if(e.type==='episode_offer')renderEpisodeOffer();
    if(e.type==='arrival'){const t=game.tables[e.table];view.reactGuest(e.table,t.visits>0?'recognise':'welcome',t.guest);announce(`${t.name} is waiting at Table ${e.table+1}.`);if(e.critic){announce(`${t.name} is a food critic. Answer every task right the first time.`);toast(`Food critic ${t.name}: “${CRITIC_GREETING}”`);}else if(e.final)toast('Final table! A special order to finish your service.');else if(t.visits>0)toast(`${t.name}: “${t.reputationGreeting||t.personality.returning}”`);else if(!game.atmosphereGreetingShown){game.atmosphereGreetingShown=true;toast(`${t.name}: “${t.atmosphereGreeting}”`);}}
    if(e.type==='ready'){audio.effect('tap');announce(`Table ${e.table+1}: dish ready to serve.`);}
    if(e.type==='learning'){profile.learning[practiceKey(config)]=game.learning.state;persist();}
    if(e.type==='service_event'){const key=walletKey(config)+':'+config.arena;profile.eventHistory[key]=[...(profile.eventHistory[key]||[]),e.event.type].slice(-4);persist();toast(e.event.name+' · a different service request.');}
    if(e.type==='event_skipped'){const key=walletKey(config)+':'+config.arena;profile.eventHistory[key]=[...(profile.eventHistory[key]||[]),e.event.id].slice(-4);persist();}
    if(e.type==='project_progress'){profile.projects[walletKey(config)]=game.projects;persist();}
    if(e.type==='event_bonus'){profile.wallets[walletKey(config)]=(profile.wallets[walletKey(config)]||0)+e.reward;persist();toast('Delivery organised! +'+e.reward+' event runes');}
    if(e.type==='dispatch')view.dispatch?.(e.loads);
    if(e.type==='side_offer')renderSideOffer();
    if(e.type==='ready_to_serve')toast('Order checked. Pick its dish, then tap the matching table.');
    if(e.type==='event_complete')announce(e.success?'Special order complete. Back to service.':'The special guest has left. Continue your service.');
    if(e.type==='ingredient')audio.effect('tap');
    if(e.type==='stamped')audio.effect('correct');
    if(e.type==='incorrect'){audio.effect('wrong');if(e.table!=null)view.reactGuest(e.table,'thinking');}
    if(e.type==='correct'){audio.effect('correct');if(e.table!=null)view.reactGuest(e.table,'understood');}
    if(e.type==='cooking'){view.sendChef(e);$('context-tip').innerHTML=icon('flame')+'<span>Your dish is cooking. You can take another order.</span>';}
    if(e.type==='served'){requestTicket(game.shift);audio.effect('rune');const k=walletKey(config);profile.guests[k]=game.guests;profile.wallets[k]=(profile.wallets[k]||0)+e.reward;persist();view.sendChef(e);view.reactGuest(e.table,e.postcard?'gift':'delighted');view.reward(e.table,e.final?16:8);audio.effect('serve');$('wallet-value').closest('.rune-wallet').classList.remove('pop');requestAnimationFrame(()=>$('wallet-value').closest('.rune-wallet').classList.add('pop'));toast(e.postcard?`${e.name} left you a postcard! +${e.reward} runes`:`${e.name}: “${e.thanks}” +${e.reward} runes${e.freshnessTip?' · Freshness +'+e.freshnessTip:''}`);}
    if(e.type==='restocked'){const k=walletKey(config);profile.wallets[k]=(profile.wallets[k]||0)+e.reward;persist();audio.effect('serve');toast(`Supplies for ${game.maxStock} orders! +${e.reward} runes`);}
    if(e.type==='stock_needed')announce('Your café needs a fresh delivery.');
    if(e.type==='missed'){audio.effect('wrong');toast('A guest had to leave. A fresh order is on its way.');}
    if(e.type==='boost'){audio.effect('correct');toast('Tea time! Your guests feel refreshed.');}
    if(e.type==='customer_review'){const r=e.ratings;announce(`Table ${e.table+1} review: Taste ${r.taste??'unrated'}, Service ${r.service}, Speed ${r.speed??'unrated'} out of 3 stars.`);}
    if(e.type==='customer_rating'){if(!game.demoSetting&&!previewMode){profile.reputations[reputationKey(config)]=game.reputation;persist();}announce(e.name+': '+Number(e.score.toFixed(1))+' stars.');if(!game.paused&&e.score>4){audio.effect(e.score===5?'rune':'serve');view.reward(e.table,e.score===5?9:5);}}
    if(e.type==='finish'){e.result.ulti=claimUlti(e.result);const locked=['bistro','banquet'].filter(id=>!arenaUnlocked(profile,id));saveResult(profile,config,e.result);e.result.venueUnlocked=locked.find(id=>arenaUnlocked(profile,id));persist();showResults(e.result);}
    ownerGuide.event(e);
  }
}
function updateHUD(){
  if(!game)return;$('wallet-value').textContent=wallet();$('service-count').textContent=`${game.served} / ${game.goal} served`;$('service-progress-bar').style.width=`${game.served/game.goal*100}%`;
  const heartsKey=String(game.missed);if($('hearts').dataset.key!==heartsKey){$('hearts').dataset.key=heartsKey;$('hearts').innerHTML=Array.from({length:3},(_,i)=>icon('heart',i<game.missed?'lost':'')).join('');$('hearts').setAttribute('aria-label',`${3-game.missed} guest hearts remaining`);}
  $('tea-button').disabled=game.closingService||game.boostUsed||wallet()<25||game.focused||game.paused;
  applyIdentity($('delivery-button'),taskIdentity({kind:'supplies'}));$('delivery-button').hidden=game.closingService||!game.needsDelivery||game.focused||!!game.selectedDish;$('delivery-button').disabled=!game.needsDelivery||game.focused||game.paused;$('delivery-button').dataset.urgent=String(game.stock===0);$('stock-count').textContent=`${game.stock} / ${game.maxStock}`;$('delivery-label').textContent=game.needsDelivery?'Supplies needed':'Supplies';
  renderServiceExtras();
  if(game.state!=='playing')return;
  kitchenHUD?.update(game,view);
  if(game.closingService){$('context-tip').hidden=false;$('context-tip').innerHTML=icon('star')+'<span>Enjoy your meal! Reviews are on their way.</span>';return;}
  if(!game.focused&&!game.kitchen){const guide=serviceGuidance(game),key=guide.icon+guide.text;game.suggestedTarget=guide.target;$('context-tip').hidden=false;if($('context-tip').dataset.key!==key){$('context-tip').dataset.key=key;$('context-tip').innerHTML=icon(guide.icon)+'<span>'+esc(guide.text)+'</span>';}setFlow(guide.flow);$('delivery-button').dataset.recommended=String(guide.target==='supplies');}
}
function updateLabels(){
  if(!game)return;$('table-labels').hidden=game.focused||!!game.kitchen;if(game.kitchen){kitchenHUD?.position(game,view);return;}if(game.focused)return;game.tables.forEach((t,i)=>{const el=labels[i];if(!el)return;applyIdentity(el,tableIdentity(t));const visible=['waiting','cooking','ready','queued','delivering'].includes(t.status);el.hidden=!visible;if(!visible)return;
    const pos=view.projectTable(i);el.style.left=`${Math.max(82,Math.min(innerWidth-82,pos.x))}px`;el.style.top=`${Math.max(210,Math.min(innerHeight-190,pos.y))}px`;
    const recipe=RECIPES[t.recipe],meta=t.plan[t.step]?TASK_SETTINGS[t.plan[t.step].setting]:null,signature=`${t.orderId}:${t.status}:${t.recipe}:${t.step}:${meta?.id||'serve'}:${game.loaded.map(l=>l.orderId+':'+l.part).join(',')}`;
    if(el.dataset.signature!==signature){el.dataset.signature=signature;el.dataset.status=t.status;el.innerHTML=icon(t.status==='ready'?'serve':['cooking','queued','delivering'].includes(t.status)?'clock':meta?.icon||'clock',t.status==='cooking'?'cooking-ring':'')+`<span><b>${game.loaded.some(l=>l.orderId===t.orderId)?'Deliver here':t.status==='ready'?(t.step<t.plan.length?'Final check':'Ready to serve'):t.status==='cooking'?'Preparing…':t.status==='queued'?'Prioritise ticket':t.status==='delivering'?'On its way':'Waiting to order'}</b><small><span class="signal-identity">${t.pickup?'Pickup #'+t.orderId:'T'+(i+1)+' · #'+t.orderId} · ${esc(t.name)}${t.final?' · Finale':''}${t.critic?' · ★ Critic':''}</span><span class="signal-dish">${esc(t.partySize===2?t.partyRecipes.map(r=>RECIPES[r].name).join(' + '):recipe.name)}${t.side?' + side':''}</span></small><span class="patience-bar"><i></i></span></span>`;}
    el.dataset.recommended=String(game.suggestedTarget===t.id);
    el.disabled=!!game.active||game.paused;el.classList.toggle('delivery-target',game.loaded.some(l=>l.orderId===t.orderId));el.classList.toggle('urgent',t.patience/t.maxPatience<.25);
    el.querySelector('.patience-bar i').style.transform=`scaleX(${t.status==='cooking'?1-t.cookLeft/t.cookTotal:t.patience/t.maxPatience})`;
    el.setAttribute('aria-label',`${t.pickup?'Pickup #'+t.orderId:'Table '+(i+1)+', order #'+t.orderId}, ${t.name}, ${t.partySize===2?t.partyRecipes.map(r=>RECIPES[r].name).join(' and '):recipe.name}, ${t.status==='ready'?(t.step<t.plan.length?'finish the final check':'ready to serve'):t.status==='cooking'?'cooking':t.status==='queued'?'queued, tap to prioritise':t.status==='delivering'?'on its way':'waiting to order'}`);
  });
  const visible=labels.filter(e=>!e.hidden),signals=visible.map(el=>{if(el.dataset.compact!=='true')el.dataset.fullHeight=String(el.offsetHeight||68);return {id:el.dataset.table,...view.projectTable(+el.dataset.table),width:el.offsetWidth||144,height:+el.dataset.fullHeight||68};});
  const supply=$('delivery-button');if(!supply.hidden)signals.push({id:'supplies',...view.projectSupply(),width:supply.offsetWidth||144,height:supply.offsetHeight||58});
  for(const point of layoutSignals(signals,innerWidth,innerHeight)){const el=point.id==='supplies'?supply:labels[+point.id];el.dataset.compact=String(point.compact);el.style.left=`${point.x}px`;el.style.top=`${point.y}px`;}

}
function showResults(result){
  taskEpoch++;interactions?.close();audio.cancelSpeech();audio.music(false);if(result.won)audio.effect('win');$('play').hidden=true;$('task-card').hidden=true;
  $('result-eyebrow').textContent=`${team().name.toUpperCase()} · ${arena().name.toUpperCase()}`;
  $('result-reputation').innerHTML=reputationResult(result.reputation);$('result-stars').setAttribute('aria-label','Shift award: '+result.stars+' out of 3');$('result-stars').innerHTML=Array.from({length:3},(_,i)=>icon('star',i>=result.stars?'dim':'')).join('');
  $('result-title').textContent=result.won?(result.stars===3?'Beautifully served.':'A lovely day’s service.'):'A fresh start awaits.';
  $('result-subtitle').textContent=result.won?`${result.completed} English tasks completed.`:'Try again. Your runes are saved.';if(result.venueUnlocked)$('result-subtitle').textContent+=' '+ARENAS.find(a=>a.id===result.venueUnlocked).name+' unlocked!';
  $('result-stats').innerHTML=`<div class="result-stat"><b>${result.served}/${result.goal}</b><small>GUESTS SERVED</small></div><div class="result-stat"><b>${result.accuracy}%</b><small>FIRST-TRY ACCURACY</small></div><div class="result-stat"><b>${icon('rune')} +${result.runes}</b><small>RUNES EARNED</small></div>`;
  if($('result-details'))$('result-details').open=false;const summary=game.learning.summary();$('result-learning').textContent=`English: ${summary.independent} independent · ${summary.supported} supported · ${summary.secure} secure.`;
  if(result.freshness)$('result-learning').textContent+=` Freshness: ${result.freshness.great} great · ${result.freshness.good} good · ${result.freshness.late} late · +${result.freshness.tips} freshness tips.`;
  document.querySelectorAll('.critic-result').forEach(n=>n.remove());const critic=criticSummary(result.critic);if(critic){const note=document.createElement('section');note.className='critic-result';note.dataset.perfect=String(!!result.critic.perfect);note.innerHTML='<h3>'+icon('star')+esc(critic.title)+'</h3><p>'+esc(critic.copy)+'</p>';$('result-reputation').after(note);}
  document.querySelectorAll('.episode-result').forEach(n=>n.remove());if(result.episode){const section=document.createElement('section');section.className='episode-result';section.innerHTML='<h3>'+esc(result.episode.title)+'</h3><p>'+esc(result.episode.completed?'Larger order completed.':result.episode.declined?'Original goal retained.':'Service episode finished.')+'</p>';$('result-review').before(section);}if(result.kitchen)$('result-learning').textContent+=' Kitchen: '+result.kitchen.handoffs+' handoffs · '+result.kitchen.washed+' dishes washed · best flow '+result.kitchen.bestFlow+'.';
  $('result-review').innerHTML=result.review.length?'<h3>Practise next</h3>'+result.review.slice(0,3).map(t=>`<div class="review-item"><span>${esc(t.kind==='vocabulary'?t.translation:t.kind==='repair'?t.prompt.replace('___',t.broken):t.prompt)}</span><b>${esc(readbackFor(t))}</b></div>`).join(''):'';
  if(result.reputation?.milestones?.length)view.setRestaurant({...sceneConfig(),atmosphere:game.atmosphere});ownerGuide.result(result);const milestone=result.reputation?.milestones?.at(-1);if(milestone){$('owner-result-copy').textContent=milestone.owner;const image=$('owner-result-image');image.src=OWNER_ASSETS.cheer.large;image.srcset=OWNER_ASSETS.cheer.small+' 160w, '+OWNER_ASSETS.cheer.large+' 320w';}openModal('results');refreshUlti();
}
function pauseGame(){if(!game||game.state!=='playing'||game.paused)return;interactions?.pause();game.paused=true;if(view){view.navigationBlocked=true;view.clearOverviewGesture?.();}document.documentElement.dataset.paused='true';audio.cancelSpeech();audio.music(false);updateAudioButtons();openModal('pause-modal');updateHUD();}
function resumeGame(){if(!game||document.hidden||view?.contextLost)return;lastFrame=0;game.paused=false;document.documentElement.dataset.paused='false';closeModal('pause-modal');audio.wake();audio.music(true);interactions?.resume();updateHUD();}
function renderShop(){
  const key=walletKey(config),ups=profile.upgrades[key]||{};$('shop-balance').innerHTML=icon('rune')+`<b>${wallet()} runes</b><span> · Grade ${config.grade} · ${esc(team().name)}</span>`;
  $('shop-items').innerHTML=UPGRADES.map(u=>{const level=ups[u.id]||0,cost=upgradeCost(level);return `<div class="shop-item"><span class="upgrade-icon">${icon(u.icon)}</span><div class="shop-description"><b>${u.name}</b><p>${u.description}</p><span class="upgrade-level">${[0,1,2].map(i=>`<i class="${i<level?'filled':''}"></i>`).join('')}</span></div><button type="button" class="buy-button" data-upgrade="${u.id}" ${level>=3||wallet()<cost?'disabled':''}>${level>=3?'Maxed':icon('rune')+cost}</button></div>`;}).join('');
  renderFurnishings();
  $('shop-items').querySelectorAll('[data-upgrade]').forEach(btn=>btn.addEventListener('click',()=>{if(buyUpgrade(profile,config,btn.dataset.upgrade)){persist();renderShop();renderSetup();view.setRestaurant(sceneConfig());audio.effect('correct');toast('Your café just got a little better.');}}));
}
function renderFurnishings(){
  renderProjects();
  const key=walletKey(config),f=profile.furnishings[key]||{owned:[],equipped:[]};
  $('furnishing-items').innerHTML=['equipment','decoration','expression'].map(group=>`<section class="shop-group"><h3>${group==='equipment'?'Equipment · 2 slots':group==='decoration'?'Furnishings':'Finishing touches'}</h3>${CATALOG.filter(i=>i.group===group).map(item=>{const owned=f.owned.includes(item.id),equipped=f.equipped.includes(item.id);return `<div class="shop-item"><span class="upgrade-icon">${icon(item.icon)}</span><div class="shop-description"><b>${esc(item.name)}</b><p>${esc(item.description)}</p></div>${!owned&&item.project?'<span class="project-unlock">Complete '+(item.project==='kitchen'?'Kitchen work bay':'Serving pass')+'</span>':owned?group==='equipment'?`<button type="button" class="buy-button equip-button" data-equip="${item.id}" aria-pressed="${equipped}" ${!equipped&&f.equipped.length>=2?'disabled':''}>${equipped?'Equipped':'Equip'}</button>`:'<span class="owned-item">Placed</span>':`<button type="button" class="buy-button" data-buy="${item.id}" ${wallet()<item.cost?'disabled':''}>${icon('rune')}${item.cost}</button>`}</div>`;}).join('')}</section>`).join('');
  const refresh=()=>{persist();renderShop();renderSetup();view.setRestaurant(sceneConfig());audio.effect('correct');};
  $('furnishing-items').querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{if(buyItem(profile,config,b.dataset.buy))refresh();}));
  $('furnishing-items').querySelectorAll('[data-equip]').forEach(b=>b.addEventListener('click',()=>{if(equipItem(profile,config,b.dataset.equip))refresh();}));
  const guests=profile.guests[key]||{};$('guestbook').innerHTML='<h3>Your regulars</h3>'+(Object.entries(guests).sort((a,b)=>b[1].visits-a[1].visits).slice(0,8).map(([id,g])=>`<p>${esc(CUSTOMER_PROFILES[+id].name)} <span>${g.visits} visits${g.visits>=3?' · Postcard received':' · Postcard at 3 visits'}</span></p>`).join('')||'<p>Postcards unlock after 3 visits.</p>');
}
function renderProjects(){let node=$('projects');if(!node){node=document.createElement('section');node.id='projects';node.className='projects';$('furnishing-items').before(node);}const key=walletKey(config),state=cleanProjects(profile.projects[key]);node.innerHTML='<h3>Restaurant projects</h3>'+PROJECTS.map(p=>{const item=state.items[p.id],done=item.stage===3;return `<article class="project-card ${state.active===p.id?'active':''}"><div class="project-heading">${icon(PROJECT_VISUALS[p.id].icon)}<b>${p.name} · ${item.stage}/3</b></div><div class="project-stages" aria-label="${item.stage} of 3 stages built">${PROJECT_VISUALS[p.id].features.map((feature,i)=>`<span data-built="${i<item.stage}" title="${esc(feature)}">${i<item.stage?icon('check'):'<i>'+String(i+1)+'</i>'}<span>${esc(feature)}</span></span>`).join('')}</div><p>${done?'Completed':esc(p.stages[item.stage])}</p><small>${done?'Built':item.meals+' / '+PROJECT_GOALS[item.stage]+' meals · '+PROJECT_COSTS[item.stage]+' runes'}</small><div>${!done?`<button type="button" data-project="${p.id}" ${state.active===p.id?'disabled':''}>${state.active===p.id?'Active project':'Work on this'}</button><button type="button" data-build="${p.id}" ${item.meals<PROJECT_GOALS[item.stage]||wallet()<PROJECT_COSTS[item.stage]?'disabled':''}>Build stage ${item.stage+1}</button>`:''}</div></article>`;}).join('')+`<label>Finish <select id="project-finish"><option value="wood">Warm wood</option><option value="ivory">Painted ivory</option><option value="team">Team colour</option></select></label>`;node.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>{state.active=b.dataset.project;profile.projects[key]=state;persist();renderProjects();}));node.querySelectorAll('[data-build]').forEach(b=>b.addEventListener('click',()=>{const built=buyProjectStage(profile,key,b.dataset.build);if(!built)return;persist();renderShop();renderSetup();view.setRestaurant(sceneConfig());closeModal('shop-modal');const returnResults=!$('results').hidden;$('results').hidden=true;$('setup').hidden=true;view.setMenu(true);view.revealProject?.(built.project.id);setTimeout(()=>{if(!game||game.state!=='playing'){if(returnResults)$('results').hidden=false;else $('setup').hidden=false;}},1550);toast(built.project.name+': '+built.project.stages[built.stage-1]+' completed!');}));$('project-finish').value=state.finish;$('project-finish').addEventListener('change',e=>{state.finish=e.target.value;profile.projects[key]=state;persist();view.setRestaurant(sceneConfig());});}
function renderSideOffer(){let node=$('side-offer');if(!node){node=document.createElement('section');node.id='side-offer';node.className='side-offer';$('play').append(node);}const offer=game?.pendingSide;node.hidden=!offer||!!game.active||game.paused||!!game.kitchen?.sideRestock;if(node.hidden){delete node.dataset.signature;return;}const signature=offer.orderId+':'+game.stock;if(node.dataset.signature===signature)return;node.dataset.signature=signature;const t=game.tables[offer.tableId];node.innerHTML=`<b>${esc(t.name)}: One more, please?</b><p>Table ${t.id+1} · #${t.orderId} · ${esc(RECIPES[t.recipe].name)} + fruit side · 1 supply · ticket check · bonus</p><button type="button" id="accept-side" ${game.stock<1?'disabled':''}>Add the side</button><button type="button" id="decline-side">Keep original order</button>${game.stock<1?'<button type="button" id="side-restock">Receive supplies first</button>':''}`;$('accept-side').onclick=()=>{if(game.resolveSide(true)){openTask();processEvents();updateHUD();}};$('decline-side').onclick=()=>{if(game.resolveSide(false)){openTask();processEvents();updateHUD();}};if($('side-restock'))$('side-restock').onclick=openDelivery;}
function renderEpisodeOffer(){
 let node=$('episode-offer');if(!node){node=document.createElement('section');node.id='episode-offer';node.className='episode-offer';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label','A restaurant opportunity');$('play').append(node);}
 const offer=game?.director?.offer;node.hidden=!offer||game.paused||!!game.active;if(node.hidden){delete node.dataset.offer;return;}
 if(node.dataset.offer===String(offer.id))return;node.dataset.offer=String(offer.id);const supply=offer.kind==='supplies';node.innerHTML=`<div class="episode-card"><small>${esc(game.director.story.title)}</small><h2>${esc(offer.title)}</h2><p>${esc(offer.copy)}</p><p class="episode-impact">${supply?'Receiving → English check → Pantry':'Shift goal +2 meals · collection labels required'}</p><button type="button" id="episode-accept" class="primary-button" ${!supply&&game.stock<2?'disabled':''}>${supply?'Receive packaging':'Accept two meals'}</button><button type="button" id="episode-decline" class="secondary-button">${supply?'Continue without delivery':'Keep original goal'}</button></div>`;
 const resolve=accept=>{if(game.resolveEpisode(accept)){node.hidden=true;delete node.dataset.offer;processEvents();updateHUD();$('pause-button').focus();}};node.querySelector('#episode-accept').onclick=()=>resolve(true);node.querySelector('#episode-decline').onclick=()=>resolve(false);node.querySelector('#episode-accept').focus();
}
function renderServiceExtras(){
  renderSideOffer();renderEpisodeOffer();
  const eventTable=game.serviceEvent?.orderId?game.tables.find(t=>t.orderId===game.serviceEvent.orderId):null;const note=game.serviceEvent?game.serviceEvent.name+(eventTable?` · ${eventTable.pickup?'Pickup #'+eventTable.orderId:'T'+(eventTable.id+1)+' · #'+eventTable.orderId}${eventTable.partySize===2?' · '+eventTable.deliveredParts.length+'/2 meals served':''}`:game.serviceEvent.type==='mixed'?' · Restock '+game.maxStock+' orders':''):game.phase;
  const episodeTask=game.director?.needsSupplies?'Packaging · Receiving → Pantry':'';$('shift-note').textContent=game.serviceEvent?note:episodeTask;$('shift-note').hidden=game.focused||!$('shift-note').textContent;
  const ready=game.readyLoads(),pass=$('serving-pass');pass.hidden=!!game.kitchen||game.focused||!ready.length||game.paused||!!game.run;
  const signature=ready.map(l=>l.orderId+':'+l.part+':'+game.loaded.some(x=>x.orderId===l.orderId&&x.part===l.part)).join('|');
  if(pass.dataset.signature!==signature){pass.dataset.signature=signature;pass.innerHTML='<span class="pass-heading">'+(game.equipped.has('trolley')?'TROLLEY · LOAD UP TO TWO · TAP FIRST DESTINATION':'READY TO SERVE · PICK A DISH')+'</span><div class="pass-dishes">'+ready.map(l=>{const t=game.tables[l.tableId],selected=game.loaded.some(x=>x.orderId===l.orderId&&x.part===l.part);return `<button type="button" class="pass-dish" data-dish="${l.tableId}" data-part="${l.part}" aria-pressed="${selected}">${icon(RECIPES[l.recipe].icon)}<span><b>${t.pickup?'Pickup #'+t.orderId:'T'+(t.id+1)+' · #'+t.orderId}${t.partySize===2?' · '+(l.part?'B':'A'):''} · ${esc(t.name)}</b><small>${esc(RECIPES[l.recipe].name)}${t.side?' + side':''}</small></span></button>`;}).join('')+'</div>';pass.querySelectorAll('[data-dish]').forEach(b=>b.addEventListener('click',()=>{game.chooseDish(+b.dataset.dish,+b.dataset.part);updateHUD();}));}
  $('flow-guide').hidden=!!ready.length;$('context-tip').classList.toggle('with-pass',!!ready.length);
}
function openShop(){renderShop();openModal('shop-modal');}
function frame(ms){
  try{
    const time=ms/1000,frameDt=lastFrame?Math.max(0,(ms-lastFrame)/1000||0):0,dt=Math.min(.08,frameDt);lastFrame=ms;
    if(game){if(!view?.cameraFlight)game.tick(dt);processEvents();uiClock+=dt;if(uiClock>.1){uiClock=0;updateHUD();}if(!$('play').hidden)updateLabels();}
    if(Date.now()>=ultiRefreshAt){ultiRefreshAt=Date.now()+1000;refreshUlti();}audio.atmosphereFrame();takeoverStory?.tick(document.hidden?0:frameDt);ownerGuide.tick(dt);view?.update(time,dt,game,frameDt);reviewCards.update(game,view,innerWidth,innerHeight);interactions?.updateTarget();requestAnimationFrame(frame);
  }catch(error){reportFailure(error);}
}
function wireUI(){
  document.querySelectorAll('[data-kitchen-guidance]').forEach(n=>n.addEventListener('change',()=>{profile.kitchenHelp.mode=n.value;if(game?.kitchen)game.kitchen.help=cleanKitchenHelp(profile.kitchenHelp);syncDisplaySettings();persist();updateHUD();}));
  document.querySelectorAll('[data-restart-guidance]').forEach(n=>n.addEventListener('click',()=>{ownerGuide.reset();profile.kitchenHelp=cleanKitchenHelp();if(game?.kitchen)game.kitchen.help=cleanKitchenHelp();syncDisplaySettings();persist();updateHUD();toast('Kitchen tips restored for each action.');}));
  document.querySelectorAll('[data-ambience-volume]').forEach(n=>n.addEventListener('input',()=>{profile.settings.ambience=Number(n.value);audio.setAtmosphere(audio.atmosphere);syncDisplaySettings();persist();}));
  document.querySelectorAll('[data-display-setting]').forEach(n=>n.addEventListener('change',()=>{profile.settings[n.dataset.displaySetting]=n.value;view?.applySettings(profile.settings);syncDisplaySettings();persist();}));
  window.visualViewport?.addEventListener('resize',()=>view?.resize());
  $('setup-form').addEventListener('submit',e=>{e.preventDefault();requestService();});
  $('setup-form').addEventListener('click',e=>{const b=e.target.closest('[data-select]');if(b)selectConfig(b.dataset.select,b.dataset.value);});
  $('choose-lesson').addEventListener('click',()=>lessonPicker?.open());
  $('setup-sound').addEventListener('click',toggleMusic);$('setup-speech').addEventListener('click',toggleSpeech);$('pause-music').addEventListener('click',toggleMusic);$('pause-speech').addEventListener('click',toggleSpeech);
  $('replay-story').addEventListener('click',()=>playTakeover(false));$('open-help').addEventListener('click',()=>openModal('help-modal'));$('close-help').addEventListener('click',()=>closeModal('help-modal'));
  $('setup-ulti').addEventListener('click',openUlti);$('result-ulti').addEventListener('click',openUlti);$('close-ulti').addEventListener('click',()=>closeModal('ulti-modal'));
  $('setup-design').addEventListener('click',()=>designEditor.open());$('result-design').addEventListener('click',()=>designEditor.open());$('setup-shop').addEventListener('click',openShop);$('result-shop').addEventListener('click',openShop);$('close-shop').addEventListener('click',()=>closeModal('shop-modal'));
  $('pause-button').addEventListener('click',pauseGame);$('resume-button').addEventListener('click',resumeGame);$('quit-button').addEventListener('click',showSetup);
  $('back-to-setup').addEventListener('click',showSetup);$('play-again').addEventListener('click',requestService);
  $('delivery-button').addEventListener('click',openDelivery);
  $('tea-button').addEventListener('click',()=>{if(wallet()<25||!game||game.boostUsed)return;if(!game.tables.some(t=>['waiting','ready'].includes(t.status)&&t.patience<t.maxPatience-5)){toast('Save your tea for guests who need a little patience.');return;}if(game.boost()){profile.wallets[walletKey(config)]-=25;persist();processEvents();updateHUD();}});
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(takeoverStory?.active)takeoverStory.syncAudio();if(document.hidden)pauseGame();else if(game?.paused)openModal('pause-modal');});window.addEventListener('focus',()=>{lastFrame=0;if(game?.paused)openModal('pause-modal');});window.addEventListener('pageshow',()=>{lastFrame=0;if(game?.paused)openModal('pause-modal');});window.addEventListener('blur',()=>{interactions?.cancelDrag();if(game?.state==='playing')pauseGame();});
  document.addEventListener('pointerdown',()=>audio.wake(),{passive:true});
  document.addEventListener('keydown',e=>{
    const modal=takeoverStory?.active?$('takeover-story'):([...document.querySelectorAll('.modal-backdrop')].reverse().find(el=>!el.hidden)||(!game?.paused&&game?.director?.offer?$('episode-offer'):null));
    if(e.key==='Tab'&&modal){const focus=[...modal.querySelectorAll('button:not(:disabled),select')];if(!focus.length)return;const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;}
    if(takeoverStory?.active){if(e.key==='Escape'){e.preventDefault();takeoverStory.finish();}return;}if(e.key==='Escape'){if(!$('ulti-modal').hidden)closeModal('ulti-modal');else if(!$('design-modal').hidden)designEditor?.close();else if(!$('lesson-modal').hidden)lessonPicker?.close();else if(!$('shop-modal').hidden)closeModal('shop-modal');else if(!$('help-modal').hidden)closeModal('help-modal');else if(game?.paused)resumeGame();else pauseGame();return;}
    if(modal||!game||game.paused)return;
    if(game.kitchen&&!game.active&&!e.target?.closest?.('select,input,textarea')){const directions={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]},dir=directions[e.key];if(dir){e.preventDefault();game.kitchen.nudge(...dir);processEvents();updateHUD();}else if(e.key==='e'||e.key===' '&&!e.target?.closest?.('button,a')){e.preventDefault();kitchenCommand('work');}return;}
    if(game.active)interactions?.key(e);
  });
  if(previewMode)window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='bistro-demo')startPreviewDemo(e.data.setting,e.data.menuMode,e.data);});
}
function startPreviewDemo(setting,menuMode=null,extras={}){
  if(previewMode&&setting==='design'){showSetup();profile.reputations[reputationKey(config)]={introSeen:true,count:720,total:3600,level:5};renderSetup();view?.setRestaurant(sceneConfig());designEditor?.open();return;}
  if(previewMode&&['breakfast','rain','evening','episode'].includes(setting)){config=normalizeConfig({...config,grade:5,unit:'g5u6',arena:'courtyard'},bank);profile.designs[reputationKey(config)]={...cleanDesign(profile.designs[reputationKey(config)]),atmosphere:setting==='episode'?'rain':setting};startService();if(setting==='episode'){game.director.stage='supplier';game.director.pending='supplies';game.director.packaging=0;game.tick(0);processEvents();updateHUD();}return;}
  const practicalPreview={names:'names',quantities:'quantities',times:'times',packing:'instructions'}[setting];if(previewMode&&practicalPreview){startPreviewDemo('pickup',null,{...extras,pickupMode:practicalPreview});return;}
  if(view?.fallback)return;if(previewMode&&setting==='story'){if(game){interactions?.cancel();game=null;}playTakeover(false);return;}
  if(previewMode&&bank.length&&setting==='wash'){config=normalizeConfig({...config,grade:5,unit:'g5u6',arena:'bistro'},bank);previewSetting='wash';startService();game.kitchen.clean=0;game.kitchen.dirty=game.kitchen.capacity;game.kitchen.arrive({kind:'wash'});processEvents();updateHUD();return;}
  if(previewMode&&bank.length&&setting==='live'){config=normalizeConfig({...config,grade:5,unit:'g5u6',arena:'bistro'},bank);previewSetting='live';startService();return;}
  if(previewMode&&(extras.recipe!=null||extras.labels))previewSetting=null;
  if(previewMode&&bank.length&&['mixed','side','takeaway','together','bench','trolley','projects'].includes(setting)){startFeaturePreview(setting);return;}
  if(!previewMode||!bank.length||!(Object.hasOwn(TASK_SETTINGS,setting)||setting==='service'))return;
  if(setting==='tablet')menuMode=['picture','translation','translation-reverse','audio-translation','translation-four','listening','listening-pair'].includes(menuMode)?menuMode:'picture';
  if(setting==='pickup'&&['relaxed','challenge'].includes(extras.difficulty)){config=normalizeConfig({...config,difficulty:extras.difficulty},bank);previewSetting=null;renderSetup();}
  if(!extras.pickupMode&&previewSetting===setting&&game?.active&&!game.active.completed&&settingForTask(game.active.task)===setting&&(setting!=='tablet'||(game.active.task.mode||(game.active.task.requested?'listening-pair':'listening'))===menuMode))return;
  previewSetting=setting;if(setting==='service'){showSetup();return;}
  if(setting==='tablet'){config=normalizeConfig({...config,grade:5,unit:'g5u6',difficulty:['listening-pair','translation-four'].includes(menuMode)?'challenge':'relaxed'},bank);renderSetup();}
  startService(setting,menuMode==='translation-four'?'translation':menuMode);if(setting==='delivery'){game.stock=1;game.openDelivery();}else game.openOrder(setting==='pickup'?game.tables.find(t=>t.pickup).id:0);if(setting==='pickup'&&extras.pickupMode){game.active.task=game.deck.forSetting('pickup',config.difficulty,{pickupMode:extras.pickupMode,grade:config.grade});delete game.active.presentation;}if(setting==='recipe'&&extras.recipe!=null&&Number.isInteger(+extras.recipe)){const recipe=Math.max(0,Math.min(8,+extras.recipe));game.tables[0].recipe=game.tables[0].partyRecipes[0]=recipe;}if(setting==='delivery'&&extras.labels){game.active.task=game.deck.forSetting('delivery');game.demoSorting=false;}openTask();processEvents();updateHUD();
}
function startFeaturePreview(feature){
 config=normalizeConfig({...config,grade:5,unit:'g5u6',arena:feature==='together'?'banquet':'bistro',difficulty:'relaxed'},bank);
 const key=walletKey(config);if(feature==='projects'){showSetup();const stage=((window.bistroPreviewStage||0)+1)%4;window.bistroPreviewStage=stage;profile.projects[key]={active:'kitchen',finish:'team',items:Object.fromEntries(PROJECTS.map(p=>[p.id,{stage,meals:18}]))};profile.furnishings[key]={owned:stage===3?['bench','trolley']:[],equipped:[]};profile.wallets[key]=1000;view.setRestaurant(sceneConfig());openShop();return;}
 if(feature==='bench'||feature==='trolley')profile.furnishings[key]={owned:[feature],equipped:[feature]};
 startService(null,null,false);game.tables.forEach(t=>t.status='empty');game.sequence=Math.floor(game.goal/2);game.eventCandidate=SERVICE_EVENTS.find(e=>e.id===feature)||SERVICE_EVENTS[0];
 if(feature==='mixed'){game.stock=1;game.openDelivery();openTask();}
 else if(feature==='bench'||feature==='trolley'){game.eventDone=true;for(let i=0;i<2;i++){game.spawnGuest();const t=game.tables[i];t.plan=[];t.step=0;t.recipe=t.partyRecipes[0]=0;game.queueCooking(t);}if(feature==='trolley'){game.jobs=[];for(const t of game.tables.slice(0,2)){t.status='ready';t.readyParts=[0];}}}
 else{game.spawnGuest();const t=game.tables.find(t=>t.event);game.openOrder(t.id);openTask();}
 processEvents();updateHUD();
}
async function boot(){
  hydrateIcons();wireUI();
  bank=getLanguageBank();config=normalizeConfig(profile.config,bank);
  designEditor=new DesignEditor({root:$('design-modal'),getConfig:()=>config,getDesign:()=>profile.designs[reputationKey(config)],getLevel:()=>cleanReputation(profile.reputations[reputationKey(config)]).level,onOpen:()=>openModal('design-modal'),onClose:()=>closeModal('design-modal'),onApply:d=>{if(game?.state==='playing')return;profile.designs[reputationKey(config)]=d;persist();view?.setRestaurant(sceneConfig());view?.revealVenue();renderSetup();toast('Design applied. Walking routes are clear.');}});
  lessonPicker=new LessonPicker({getBank:()=>bank,getConfig:()=>config,onSelect:(grade,unit)=>{config=normalizeConfig({...config,grade,unit},bank);renderSetup();persist();view?.setRestaurant(sceneConfig(),{reuse:true});audio.wake();audio.effect('tap');},onOpen:()=>{$('setup').inert=true;openModal('lesson-modal');},onClose:()=>{$('setup').inert=false;closeModal('lesson-modal');}});
  view=new RestaurantView($('world'),{onTap:tapTable,onFloor:(x,z)=>{if(game?.kitchen?.walkTo(x,z)){audio.wake();processEvents();updateHUD();}},onStationAction:action=>interactions?.act(action),onStationGesture:(phase,event,action)=>interactions?.worldPointer(phase,event,action),onStationResize:()=>interactions?.reframe(),settings:profile.settings,onFailure:message=>{$('graphics-warning').hidden=!message;$('graphics-warning').textContent=message;if(message&&game?.state==='playing')pauseGame();}});
  takeoverStory=new TakeoverStory($('takeover-story'),{getView:()=>view,onFinish:finishTakeover,audio,onSound:toggleMusic});
  kitchenHUD=new KitchenHUD($('kitchen-hud'),{command:kitchenCommand,tea:()=>$('tea-button').click()});
  window.RuneBistroDiagnostics=()=>view?.diagnostics();
window.LanguiniDiagnostics=window.RuneBistroDiagnostics;
  interactions=new StationInteractions({getGame:()=>game,getView:()=>view,audio,onChanged:()=>{processEvents();updateHUD();},announce,onStationOpened:a=>{clearTimeout(toastTimer);$('toast').hidden=true;ownerGuide.openStation(a);},onStationClosed:()=>ownerGuide.clear()});
  renderSetup();syncDisplaySettings();view.setRestaurant(sceneConfig(),{reuse:true});view.update(0,0,game);
  if(view.fallback){$('start-button').disabled=true;const retry=document.createElement('button');retry.type='button';retry.className='secondary-button';retry.textContent='Retry graphics';retry.addEventListener('click',()=>location.reload());$('graphics-warning').append(retry);}
  if(window.RuneBistroStartup&&!window.RuneBistroStartup.ready())return;$('loading').hidden=true;$('setup').hidden=false;view.revealVenue();requestAnimationFrame(frame);if(league.enabled)league.flush().then(()=>refreshUlti());
  if(previewMode){profile.settings.music=false;startPreviewDemo(new URLSearchParams(location.search).get('demo')||'conversation',new URLSearchParams(location.search).get('menu'),{recipe:new URLSearchParams(location.search).get('recipe'),labels:new URLSearchParams(location.search).get('labels')==='1'});if(window.parent!==window)window.parent.postMessage({type:'bistro-ready'},messageTargetOrigin());}
}
function reportFailure(error){console.error(error);if(window.RuneBistroStartup){window.RuneBistroStartup.fail(error);return;}$('loading').hidden=false;$('loading').innerHTML=`<strong>A little kitchen delay.</strong><span>${esc(error.message)}</span><button class="primary-button" id="retry-load">Try again</button>`;$('retry-load').addEventListener('click',()=>location.reload());}
boot().catch(reportFailure);
