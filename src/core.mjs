import {newShiftId} from './ulti.mjs';
import {CRITIC_WEIGHT,CRITIC_GREETING,criticCandidate} from './food-critic.mjs';
import {cleanDesign,cleanDesigns,cleanCafeProgress,cleanCafeProgresses,atmosphereFor,ATMOSPHERE_GREETINGS} from './cafe-design.mjs';
import {takeawayTask,practicalMode} from './takeaway-tasks.mjs';
import {ServiceDirector} from './service-director.mjs';
import {cleanReputation,cleanReputations,reputationSnapshot,reputationProgress,customerRating,creditReview,REPUTATION_MILESTONES} from './reputation.mjs';
import {takeawayNumberTask} from './takeaway-numbers.mjs';
import {venueLearning,venueRoute,activityRounds} from './venue-learning.mjs';
import {DINING,newOrderReview,recordOrderReview,customerReview,taskQuality,diningDuration,diningStage} from './customer-reviews.mjs';
import {advanceFreshness,settleFreshness,freshnessTip} from './task-freshness.mjs';
import {cleanKitchenHelp} from './kitchen-signifiers.mjs';
import {KitchenFlow} from './kitchen-flow.mjs';
import {sortingTask} from './delivery-sorting.mjs';
import {cleanProjects,advanceProject} from './refurbishment.mjs';
import {eventFor,cleanEventHistory,SERVICE_EVENTS} from './service-events.mjs';
import {settingForTask,repairParts,listeningTask,questionKey} from './tasks.mjs';
import {CUSTOMER_PROFILES} from './customer-profiles.mjs';
import {RECIPES,PREP_PHASE_COUNT} from './menu.mjs';
import {matchingVocabulary,matchingTask} from './tablet-matching.mjs';
import {ORDER_TYPES,orderTypeFor,routeFor,cleanFurnishing,itemFor,personalityFor} from './service-design.mjs';
import {LearningMemory,cleanLearning} from './learning.mjs';
import {dialogueLinksFor} from './dialogue.mjs';
import {twoItemListeningTask} from './listening-orders.mjs';
export {CATALOG} from './service-design.mjs';
export {RECIPES} from './menu.mjs';
export const TEAMS = [
  {id:'gryffindor',name:'Gryffindor',animal:'Lion',color:'#b64c46',accent:'#f2c879',short:'G'},
  {id:'hufflepuff',name:'Hufflepuff',animal:'Bear',color:'#c49b45',accent:'#ffe0a1',short:'H'},
  {id:'slytherin',name:'Slytherin',animal:'Snake',color:'#428875',accent:'#a5d6bd',short:'S'},
  {id:'ravenclaw',name:'Ravenclaw',animal:'Eagle',color:'#507ea8',accent:'#b4d6e6',short:'R'}
];
export const ARENAS = [
  {id:'courtyard',name:'Languini Cafe',label:'2 tables · 6 orders',tables:2,goal:6,patience:85,arrival:6.8,color:'#498b78',tag:'3 wash plates · short orders',icon:'leaf'},
  {id:'bistro',name:'Languini Diner',label:'3 tables · 8 orders',tables:3,goal:8,patience:74,arrival:4.8,color:'#c17b57',tag:'6 wash plates · full checks',icon:'cup'},
  {id:'banquet',name:'Languini Bistro',label:'4 tables · 10 orders',tables:4,goal:10,patience:68,arrival:4.0,color:'#7173a4',tag:'9 wash plates · multi-step service',icon:'crown'}
];
export const UPGRADES = [
  {id:'kitchen',name:'Quick kitchen',description:'−15% cooking time / level',icon:'flame'},
  {id:'comfort',name:'Cozy corners',description:'+6s patience / level',icon:'heart'},
  {id:'tips',name:'House hospitality',description:'+2 runes per guest / level',icon:'rune'}
];
export const SAVE_KEY='rune-bistro-v1';
export function shuffle(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function choicesFor(task,difficulty,rng=Math.random){
  const wrong=[...new Set(task.options||[])].filter(x=>x!==task.answer);
  return shuffle([task.answer,...shuffle(wrong,rng).slice(0,difficulty==='challenge'?3:2)],rng);
}
export class TaskDeck {
  constructor(tasks,rng=Math.random,{conversationHistory={},learning=null}={}){
    this.rng=rng;this.learning=learning;this.groups=new Map();this.previousBySetting=new Map();this.cursor=0;const questions=new Set();
    for(const t of tasks){const setting=settingForTask(t);if(setting==='conversation'){const key=questionKey(t);if(questions.has(key))continue;questions.add(key);}if(!this.groups.has(setting))this.groups.set(setting,[]);this.groups.get(setting).push(t);if(t.kind==='vocabulary'){if(!this.groups.has('tablet'))this.groups.set('tablet',[]);this.groups.get('tablet').push(listeningTask(t));}}
    const ids=new Set((this.groups.get('conversation')||[]).map(t=>t.id));this.seenConversations=new Set((Array.isArray(conversationHistory.seen)?conversationHistory.seen:[]).filter(id=>ids.has(id)));if(ids.has(conversationHistory.last))this.previousBySetting.set('conversation',conversationHistory.last);
    this.kinds=shuffle([...this.groups.keys()],rng);this.bags=new Map();
    this.menuPools={translation:matchingVocabulary(tasks),picture:matchingVocabulary(tasks,{pictures:true})};this.menuPools['translation-reverse']=this.menuPools.translation;this.menuPools['audio-translation']=this.menuPools.translation;this.menuModeBag=[];this.menuWordBags=new Map();this.menuSerial=0;this.pickupSerial=0;this.listeningSerial=0;this.dialogueLinks=dialogueLinksFor(tasks);
    if(!this.kinds.length)throw Error('This unit has no playable language tasks.');
  }
  next(){
    return this.forSetting(this.kinds[this.cursor++%this.kinds.length]);
  }
  forSetting(setting,difficulty='relaxed',{menuMode=null,relatedTo=null,dialogue=false,pairCount=null,forcePairListening=false,excludeNumbers=[],pickupMode='numbers',grade=5}={}){
    if(setting==='pickup')return takeawayTask(pickupMode,difficulty,this.rng,++this.pickupSerial,{exclude:excludeNumbers,grade});
    if(setting==='wash'){const source=this.forSetting('recipe',difficulty);return {...source,id:source.id+'-wash-'+(this.washSerial=(this.washSerial||0)+1),sourceId:source.sourceId||source.id,variant:'washing'};}
    if(!this.groups.has(setting))throw Error(`This unit has no ${setting} task.`);
    const forcePair=menuMode==='listening-pair'||forcePairListening;if(menuMode==='listening-pair')menuMode='listening';
    if(setting==='tablet'){
      const size=pairCount||(difficulty==='challenge'?4:3),available=['listening',...['translation','translation-reverse','audio-translation','picture'].filter(mode=>this.menuPools[mode].length>=size)];
      this.menuModeBag=this.menuModeBag.filter(mode=>available.includes(mode));
      if(!this.menuModeBag.length){this.menuModeBag=shuffle(available,this.rng);if(this.menuModeBag.length>1&&this.menuModeBag.at(-1)===this.previousMenuMode)[this.menuModeBag[0],this.menuModeBag[this.menuModeBag.length-1]]=[this.menuModeBag.at(-1),this.menuModeBag[0]];}
      const mode=available.includes(menuMode)?menuMode:this.menuModeBag.pop();this.previousMenuMode=mode;
      if(mode!=='listening'){
        const pairs=[];let bag=this.menuWordBags.get(mode)||[];
        while(pairs.length<size){if(!bag.length)bag=shuffle(this.menuPools[mode],this.rng);if(this.learning)bag.sort((a,b)=>this.learning.priority({kind:'vocabulary',answer:a.word,id:a.id})-this.learning.priority({kind:'vocabulary',answer:b.word,id:b.id}));const pair=bag.pop();if(!pairs.some(p=>p.id===pair.id))pairs.push(pair);}
        this.menuWordBags.set(mode,bag);return matchingTask(pairs,mode,++this.menuSerial);
      }
    }
    let bag=this.bags.get(setting);
    if(!bag?.length){let pool=this.groups.get(setting);if(setting==='conversation'){const unseen=pool.filter(t=>!this.seenConversations.has(t.id));if(unseen.length)pool=unseen;else this.seenConversations.clear();}bag=shuffle(pool,this.rng);if(bag.length>1&&bag.at(-1).id===this.previousBySetting.get(setting))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];this.bags.set(setting,bag);}
    if(this.learning)bag.sort((a,b)=>this.learning.priority(a)-this.learning.priority(b));
    if(relatedTo&&setting!=='conversation'){
      const tokens=new Set(String(relatedTo).toLowerCase().match(/[a-z]{4,}/g)?.filter(w=>!['this','that','with','have','does','your','what','there','they','from','would','could','like','please','which','sentence'].includes(w))||[]);
      let related=-1;for(let i=0;i<bag.length;i++)if([...tokens].some(w=>new RegExp(`\\b${w}\\b`,'i').test(bag[i].prompt+' '+bag[i].answer)))related=i;
      if(related>=0)bag.push(bag.splice(related,1)[0]);
    }
    let link=null;
    if(setting==='conversation'&&dialogue){link=this.dialogueLinks.find(l=>!this.seenConversations.has(l.first)&&!this.seenConversations.has(l.second)&&bag.some(t=>t.id===l.first));if(link)bag.push(bag.splice(bag.findIndex(t=>t.id===link.first),1)[0]);}
    let t=bag.pop();this.previousBySetting.set(setting,t.id);if(setting==='conversation')this.seenConversations.add(t.id);
    if(link)t={...t,dialogue:{turn:1,total:2,topic:link.topic,cue:link.cue,nextId:link.second}};
    if(setting==='tablet'&&(forcePair||difficulty==='challenge'&&++this.listeningSerial%2===0))t=twoItemListeningTask(t,this.menuPools.translation,this.rng);
    return t;
  }
  followUp(first){
    const d=first.dialogue;if(d?.turn!==1||this.seenConversations.has(d.nextId))return null;
    const next=this.groups.get('conversation')?.find(t=>t.id===d.nextId);if(!next)return null;
    const bag=this.bags.get('conversation');if(bag){const index=bag.findIndex(t=>t.id===next.id);if(index>=0)bag.splice(index,1);}
    this.seenConversations.add(next.id);this.previousBySetting.set('conversation',next.id);
    return {...next,dialogue:{turn:2,total:2,topic:d.topic,cue:d.cue,previousQuestion:first.prompt,previousAnswer:first.answer}};
  }
  get conversationState(){return {seen:[...this.seenConversations],last:this.previousBySetting.get('conversation')||null};}
}
export function normalizeConfig(config={},bank=[]){
  const grade=bank.some(g=>g.grade===+config.grade)?+config.grade:(bank[0]?.grade||5);
  const units=bank.find(g=>g.grade===grade)?.units||[];
  return {grade,unit:units.some(u=>u.id===config.unit)?config.unit:units[0]?.id,
    team:TEAMS.some(t=>t.id===config.team)?config.team:'gryffindor',
    difficulty:config.difficulty==='challenge'?'challenge':'relaxed',
    arena:ARENAS.some(a=>a.id===config.arena)?config.arena:'courtyard',cooperative:false};
}
function bounded(n,max=1e7){return Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;}
export function loadProfile(storage){
  const base={version:1,kitchenHelp:cleanKitchenHelp(),designs:{},cafeProgress:{},projects:{},reputations:{},eventHistory:{},wallets:{},upgrades:{},records:{},practice:{},learning:{},guests:{},furnishings:{},config:{},settings:{music:true,speech:true,ambience:.55,quality:'auto',motion:'system'}};
  try{const d=JSON.parse(storage.getItem(SAVE_KEY));if(!d||d.version!==1)return base;
    for(const [k,v] of Object.entries(d.wallets||{}))if(/^([5-8]):(gryffindor|hufflepuff|slytherin|ravenclaw)$/.test(k))base.wallets[k]=bounded(v);
    for(const [k,v] of Object.entries(d.upgrades||{}))if(k in base.wallets)base.upgrades[k]=Object.fromEntries(UPGRADES.map(u=>[u.id,bounded(v?.[u.id],3)]));
    for(const [k,v] of Object.entries(d.records||{}))if(typeof v==='object'&&v)base.records[k]={stars:bounded(v.stars,3),served:bounded(v.served),accuracy:bounded(v.accuracy,100),wins:bounded(v.wins)};
    for(const [key,value]of Object.entries(d.practice||{})){const m=/^([5-8]):g([5-8])u\d{1,2}$/.exec(key);if(!m||m[1]!==m[2]||!value||typeof value!=='object')continue;const seen=[...new Set((Array.isArray(value.seen)?value.seen:[]).filter(id=>typeof id==='string'&&id.length<=160))].slice(-256);base.practice[key]={seen,last:typeof value.last==='string'&&value.last.length<=160?value.last:null};}
    for(const [key,value]of Object.entries(d.learning||{})){const m=/^([5-8]):g([5-8])u\d{1,2}$/.exec(key);if(m&&m[1]===m[2]&&value&&typeof value==='object')base.learning[key]=cleanLearning(value);}
    for(const [key,value]of Object.entries(d.furnishings||{}))if(/^([5-8]):(gryffindor|hufflepuff|slytherin|ravenclaw)$/.test(key)&&value&&typeof value==='object')base.furnishings[key]=cleanFurnishing(value);
    for(const [key,value]of Object.entries(d.guests||{}))if(/^([5-8]):(gryffindor|hufflepuff|slytherin|ravenclaw)$/.test(key)&&value&&typeof value==='object'){const guests={};for(const [id,record]of Object.entries(value))if(CUSTOMER_PROFILES.some(p=>String(p.id)===id)&&record&&typeof record==='object')guests[id]={visits:bounded(record.visits,10000),favourite:bounded(record.favourite,RECIPES.length-1)};base.guests[key]=guests;}
    for(const [key,value]of Object.entries(d.projects||{}))if(/^[5-8]:(gryffindor|hufflepuff|slytherin|ravenclaw)$/.test(key))base.projects[key]=cleanProjects(value);
    base.kitchenHelp=cleanKitchenHelp(d.kitchenHelp);base.designs=cleanDesigns(d.designs);base.cafeProgress=cleanCafeProgresses(d.cafeProgress);
    base.eventHistory=cleanEventHistory(d.eventHistory);base.reputations=cleanReputations(d.reputations);
    base.config=d.config&&typeof d.config==='object'?d.config:{};
    base.settings={music:d.settings?.music!==false,speech:d.settings?.speech!==false,ambience:Number.isFinite(d.settings?.ambience)?Math.max(0,Math.min(1,d.settings.ambience)):.55,quality:['auto','lite','high'].includes(d.settings?.quality)?d.settings.quality:'auto',motion:d.settings?.motion==='reduced'?'reduced':'system'};return base;
  }catch{return base;}
}
export function saveProfile(storage,profile){try{storage.setItem(SAVE_KEY,JSON.stringify(profile));return true;}catch{return false;}}
export function walletKey(config){return `${config.grade}:${config.team}`;}
export function practiceKey(config){return `${config.grade}:${config.unit}`;}
export function recordKey(config){return `${config.grade}:${config.unit}:${config.team}:${config.difficulty}:${config.arena}`;}
export function upgradeCost(level){return 65+level*55;}
export function buyUpgrade(profile,config,id){
  if(!UPGRADES.some(u=>u.id===id))return false;const k=walletKey(config);
  const ups=profile.upgrades[k]||Object.fromEntries(UPGRADES.map(u=>[u.id,0]));const level=bounded(ups[id],3);
  if(level>=3||(profile.wallets[k]||0)<upgradeCost(level))return false;
  profile.wallets[k]-=upgradeCost(level);ups[id]=level+1;profile.upgrades[k]=ups;return true;
}
export function buyItem(profile,config,id){
  const item=itemFor(id),key=walletKey(config);if(!item||item.project)return false;const furniture=cleanFurnishing(profile.furnishings[key]);
  if(furniture.owned.includes(id)||(profile.wallets[key]||0)<item.cost)return false;
  profile.wallets[key]-=item.cost;furniture.owned.push(id);if(item.group==='equipment'&&furniture.equipped.length<2)furniture.equipped.push(id);profile.furnishings[key]=furniture;return true;
}
export function equipItem(profile,config,id){
  const key=walletKey(config),furniture=cleanFurnishing(profile.furnishings[key]);if(itemFor(id)?.group!=='equipment'||!furniture.owned.includes(id))return false;
  const index=furniture.equipped.indexOf(id);if(index>=0)furniture.equipped.splice(index,1);else if(furniture.equipped.length<2)furniture.equipped.push(id);else return false;profile.furnishings[key]=furniture;return true;
}
export function saveResult(profile,config,result){
  const k=recordKey(config),previous=profile.records[k]||{stars:0,served:0,accuracy:0,wins:0};
  profile.records[k]={stars:Math.max(previous.stars,result.stars),served:Math.max(previous.served,result.served),accuracy:Math.max(previous.accuracy,result.accuracy),wins:previous.wins+(result.won?1:0)};
}
export function orderPlan(arena,index,difficulty='relaxed'){
  return venueRoute(routeFor(orderTypeFor(arena,index,difficulty)),arena);
}
export class BistroGame {
  constructor(config,tasks,{rng=Math.random,upgrades={},demoSetting=null,demoMenuMode=null,demoDialogue=false,conversationHistory={},learning={},guests={},furnishings={},projects={},eventHistory=[],eventType=null,demoSorting=false,liveKitchen=false,reputation={},guaranteeTakeaway=true,design={},cafeProgress={},connectedService=false}={}){
    this.config=config;this.shift=Object.freeze({id:newShiftId(),grade:config.grade,unit:config.unit,team:config.team,arena:config.arena,difficulty:config.difficulty,eligible:!demoSetting});this.venue=venueLearning(config.arena);this.rng=rng;this.upgrades=upgrades;this.demoSetting=demoSetting;this.demoMenuMode=demoSetting==='tablet'?demoMenuMode:null;this.arena=ARENAS.find(x=>x.id===config.arena)||ARENAS[0];
    this.design=cleanDesign(design);this.cafeProgress=cleanCafeProgress(cafeProgress);this.connectedService=connectedService;this.episodeExtra=0;this.furnishings=cleanFurnishing(furnishings);this.equipped=new Set(this.furnishings.equipped);this.guests=JSON.parse(JSON.stringify(guests));this.learning=new LearningMemory(tasks,learning);
    this.deck=new TaskDeck(tasks,rng,{conversationHistory,learning:this.learning});this.state='idle';this.paused=false;this.active=null;this.maxStock=(this.equipped.has('pantry')?5:3)+(this.design.counter==='takeaway'?1:0);this.stock=this.maxStock;this.selectedDish=null;this.serviceEvent=null;this.eventDone=false;this.dialogueOffers=0;this.demoDialogue=demoDialogue;this.role=0;
    this.projects=cleanProjects(projects);this.eventCandidate=SERVICE_EVENTS.find(e=>e.id===eventType)||eventFor(config.arena,eventHistory,rng);this.demoSorting=demoSorting;this.deliverySerial=0;this.jobs=[];this.jobSerial=0;this.loaded=[];this.run=null;this.pendingSide=null;
    this.tables=Array.from({length:this.arena.tables},(_,id)=>({id,status:'empty',patience:0,maxPatience:1,recipe:0,cookLeft:0,cookTotal:1,cooldown:0,reward:0,guest:0,plan:[],step:0,stockReserved:false}));
    this.tables.push({id:this.arena.tables,pickup:true,status:'empty',patience:0,maxPatience:1,recipe:0,cookLeft:0,cookTotal:1,cooldown:0,reward:0,guest:0,plan:[],step:0,stockReserved:false});
    this.served=0;this.missed=0;this.runes=0;this.total=0;this.firstCorrect=0;this.completed=0;this.combo=0;this.bestCombo=0;
    this.reputation=cleanReputation(reputation);this.reputationStart=reputationSnapshot(this.reputation);this.reputation.shiftSerial++;this.shiftReviews=[];this.reputationMilestones=[];this.guaranteeTakeaway=guaranteeTakeaway;this.takeawayScheduled=false;this.cleanlinessQuality=1;this.closingService=false;this.freshnessTotals={great:0,good:0,late:0,tips:0};this.elapsed=0;this.spawnClock=0;this.sequence=0;this.review=[];this.events=[];this.boostUsed=false;this.history=[];this.deliveries=0;this.customerBag=[];this.previousCustomer=null;this.recipeBag=[];this.previousRecipe=null;
    this.atmosphere=atmosphereFor(this.design,this.reputation.shiftSerial);this.director=connectedService&&!demoSetting?new ServiceDirector(this,this.atmosphere):null;
    this.kitchen=liveKitchen&&!demoSetting?new KitchenFlow(this):null;
  }
  emit(type,detail={}){this.events.push({type,...detail});}
  drainEvents(){return this.events.splice(0);}
  start(){if(this.state!=='idle')return;this.state='playing';this.spawnGuest();this.spawnClock=this.arena.arrival*(this.kitchen?1.35:1);this.emit('start');}
  get goal(){return this.arena.goal+this.episodeExtra;}
  outstanding(){return this.tables.filter(t=>!['empty','leaving'].includes(t.status)).reduce((n,t)=>n+(t.partySize||1)-(t.deliveredParts?.length||0),0);}
  beginEvent(type,orderId=null){const spec=SERVICE_EVENTS.find(e=>e.id===type);this.serviceEvent={...spec,type,orderId};this.emit('service_event',{event:this.serviceEvent});}
  spawnGuest(){
    if(this.state!=='playing'||this.active||this.director?.offer||this.pendingSide||this.served+this.outstanding()>=this.goal)return false;
    const outstanding=this.outstanding(),remaining=this.goal-this.served-outstanding;
    const final=remaining===1;if(final&&(outstanding>0||this.director?.holdFinal&&this.takeawayScheduled))return false;
    const large=!!this.director?.queuedLarge&&remaining>=2;
    const guaranteedPickup=this.guaranteeTakeaway&&!this.demoSetting&&!this.takeawayScheduled&&!final&&this.sequence>=Math.min(3,this.goal-2);
    let event=!this.run&&!this.demoSetting&&!final&&!this.serviceEvent&&!this.eventDone&&this.sequence>=Math.max(1,Math.floor(this.goal/2)-(this.eventCandidate.id==='together'?1:0))&&this.eventCandidate.id!=='mixed';
    if(event&&this.eventCandidate.id==='together'&&remaining<3)event=false;
    if(guaranteedPickup)event=this.eventCandidate.id==='takeaway'&&!this.eventDone&&!this.serviceEvent;
    const pickup=large||!!this.director&&!this.takeawayScheduled&&final||this.demoSetting==='pickup'||guaranteedPickup||event&&this.eventCandidate.id==='takeaway';if(large)event=false;
    const t=this.tables.find(t=>t.status==='empty'&&!!t.pickup===!!pickup);if(!t)return false;
    const patience=(this.arena.patience+(this.upgrades.comfort||0)*6+(this.equipped.has('welcome')?12:0))*(this.config.difficulty==='challenge'?.78:1)*(this.kitchen?(this.config.difficulty==='challenge'?1.2:1.3):1);
    if(final&&!this.eventDone&&!this.serviceEvent&&!this.demoSetting){this.eventDone=true;this.emit('event_skipped',{event:this.eventCandidate});}
    let orderType=pickup?'takeaway':final?'special':orderTypeFor(this.arena.id,this.sequence,this.config.difficulty);
    if(event){orderType=this.eventCandidate.id==='side'?'simple':this.eventCandidate.id==='takeaway'?'takeaway':'simple';this.beginEvent(this.eventCandidate.id,this.sequence+1);}
    const descriptors=this.demoSetting?[{setting:this.demoSetting==='delivery'?'tablet':this.demoSetting,phase:this.demoSetting==='pickup'?'serve':'order'}]:routeFor(orderType);
    if(!this.customerBag.length){this.customerBag=shuffle(CUSTOMER_PROFILES.map(p=>p.id),this.rng);if(this.customerBag.at(-1)===this.previousCustomer)[this.customerBag[0],this.customerBag[this.customerBag.length-1]]=[this.customerBag.at(-1),this.customerBag[0]];}
    if(this.sequence===0&&this.config.arena==='courtyard'){const regular=this.customerBag.find(id=>(this.guests[id]?.visits||0)>0);if(regular!=null)this.customerBag.push(this.customerBag.splice(this.customerBag.indexOf(regular),1)[0]);}
    const guest=this.customerBag.pop();this.previousCustomer=guest;
    if(!this.recipeBag.length)this.recipeBag=shuffle(RECIPES.map((_,i)=>i),this.rng);
    let recipe=this.recipeBag.pop();const visits=this.guests[guest]?.visits||0;if(visits>0&&visits%2===1)recipe=this.guests[guest].favourite;this.previousRecipe=recipe;
    const together=event&&this.eventCandidate.id==='together',partyRecipes=together||large?[recipe,(recipe+1)%RECIPES.length]:[recipe],partyGuests=together||large?[guest,(guest+1)%CUSTOMER_PROFILES.length]:[guest];
    const route=together||large?[{setting:'tablet',phase:'order'},{setting:'recipe',phase:'prepare',part:0},{setting:'recipe',phase:'prepare',part:1},...(this.config.difficulty==='challenge'?[{setting:'repair',phase:'serve'}]:[])]:descriptors;
    const planned=this.demoSetting?route:venueRoute(route,this.arena.id);if(pickup&&!this.demoSetting){planned.push({setting:'pickup',phase:'serve',pickupMode:'numbers'});const mode=this.connectedService&&practicalMode(this.cafeProgress.pickups);if(mode)planned.push({setting:'pickup',phase:'serve',pickupMode:mode});}
    if(pickup)this.takeawayScheduled=true;const critic=criticCandidate(this,{pickup,event,final,large});if(critic)this.criticSpawned=true;const personality={...personalityFor(guest)},name=CUSTOMER_PROFILES[guest].name;if(visits>0&&this.reputation.level)personality.returning=REPUTATION_MILESTONES[this.reputation.level-1].returning;
    if(large)this.director.largeSpawned();Object.assign(t,{episodeLarge:large,atmosphereGreeting:ATMOSPHERE_GREETINGS[this.atmosphere],status:'waiting',patience,maxPatience:patience,recipe,guest,name,personality,visits,greeting:critic?CRITIC_GREETING:visits?personality.returning:personality.greeting,critic,criticSlip:false,reward:0,freshnessCount:0,freshnessScore:0,reviewScores:newOrderReview(),dining:null,firstHandoff:null,plan:planned.map(d=>({...d,task:null})),orderType,orderLabel:together?'Serve together':ORDER_TYPES[orderType].name,orderReason:ORDER_TYPES[orderType].reason,final,event,partySize:partyRecipes.length,partyRecipes,partyGuests,deliveredParts:[],transitParts:[],readyParts:[],side:false,sideOffered:false,step:0,stockReserved:false,cooked:false,delivered:false,orderId:++this.sequence,task:null,settingsDone:[],languageContext:''});if(this.demoSetting==='pickup'){t.status='ready';t.cooked=true;t.readyParts=[0];}this.emit('arrival',{table:t.id,final,critic});return true;
  }
  get focused(){return !!this.active||!!this.director?.offer||!!this.pendingSide&&!this.kitchen?.sideRestock;}
  get needsDelivery(){return this.stock<=1||!!this.director?.needsSupplies;}
  get phase(){if(this.closingService)return 'Guests are enjoying their meals';if(this.served>=this.goal-1||this.tables.some(t=>t.final&&!['empty','leaving'].includes(t.status)))return 'Final table';return this.served===0?'Opening service':this.serviceEvent?'A little change of pace':'In the flow';}
  tick(dt){
    if(this.state!=='playing'||this.paused)return;
    dt=Math.max(0,Math.min(.25,Number.isFinite(dt)?dt:0));
    if(this.closingService){this.tickDining(dt);}if(this.closingService){if(!this.tables.some(t=>t.dining&&diningStage(t.dining).stage!=='done'))this.finish(true);return;}
    if(this.active){advanceFreshness(this.active,dt,this.config.difficulty,this.taskTimingActive==null||this.taskTimingActive===this.active&&this.taskTimingReady);return;}
    if(this.focused)return;this.director?.tick(dt);if(this.focused)return;this.tickDining(dt);this.elapsed+=dt;
    this.kitchen?.tick(dt);if(this.focused)return;
    this.tickJobs(dt);this.tickRun(dt);if(this.state!=='playing')return;
    for(const t of this.tables){
      if(t.status==='leaving'){if(t.dining)continue;t.cooldown-=dt;if(t.cooldown<=0)t.status='empty';continue;}
      if(t.transitParts?.length)continue;
      if(['waiting','ready','queued','preparing','prepared'].includes(t.status)){
        if(t.status==='ready'&&this.kitchen)t.readyAge=(t.readyAge||0)+dt;
        t.patience=Math.max(0,t.patience-dt*(t.status==='ready'&&this.equipped.has('warmer')?.6:1));if(t.patience<=0){t.status='leaving';t.cooldown=2;this.kitchen?.invalidate(t);if(this.selectedDish?.orderId===t.orderId)this.selectedDish=null;this.loaded=this.loaded.filter(l=>l.orderId!==t.orderId);this.closeEvent(t,false);this.director?.missed(t);if(t.critic)this.criticReview={name:t.name,left:true};this.jobs=this.jobs.filter(j=>j.orderId!==t.orderId);this.missed++;this.combo=0;this.emit('missed',{table:t.id});if(this.missed>=3){this.finish(false);return;}}
      }
    }
    this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnGuest();this.spawnClock=this.arena.arrival*(this.config.difficulty==='challenge'?.65:1)*(this.kitchen?1.4:1);}
  }
  configureActivity(a){a.activityRound=0;a.activityRounds=activityRounds(this.config.arena,settingForTask(a.task),a.task.kind,this.config.difficulty);return a;}
  nextActivityTask(a){
    const setting=settingForTask(a.task),history=[...(a.activityHistory||[]),a.task],used=new Set(history.map(t=>t.sourceId||t.id));
    let next=this.deck.forSetting(setting,this.config.difficulty,{menuMode:this.demoMenuMode,pairCount:this.venue.level?4:null,forcePairListening:this.venue.level===2,excludeNumbers:history.flatMap(t=>t.pairs?.map(p=>p.number??p.id)??[]),pickupMode:a.task.takeawayKind||'numbers',grade:this.config.grade});
    const pool=this.deck.groups.get(setting==='wash'?'recipe':setting)||[];
    if(used.has(next.sourceId||next.id)){const candidate=pool.find(t=>!used.has(t.id)&&!history.some(previous=>previous.answer===t.answer))||[...pool].filter(t=>t.answer!==a.task.answer).sort((x,y)=>history.map(t=>t.answer).lastIndexOf(x.answer)-history.map(t=>t.answer).lastIndexOf(y.answer))[0];if(candidate)next=setting==='wash'?{...candidate,id:candidate.id+'-wash-round-'+history.length,sourceId:candidate.id,variant:'washing'}:candidate;}
    return {next,history};
  }
  activate(t){const stage=t.plan[t.step];if(!stage)return false;
    if(stage.part!=null)t.recipe=t.partyRecipes[stage.part];
    if(!stage.task){const offer=stage.setting==='conversation'&&stage.phase==='order'&&(!this.demoSetting||this.demoDialogue),dialogue=offer&&(this.venue.level>0||this.demoDialogue||this.dialogueOffers++%(this.config.difficulty==='challenge'?2:3)===0);stage.task=this.deck.forSetting(stage.setting,this.config.difficulty,{menuMode:this.demoMenuMode,relatedTo:t.languageContext,dialogue,pairCount:this.venue.level?4:null,forcePairListening:this.venue.level===2,pickupMode:stage.pickupMode||'numbers',grade:this.config.grade});}
    this.active={tableId:t.id,task:stage.task,phase:stage.phase,purpose:'order',attempts:0,completed:false,ingredients:[],matchedPairs:[],pairSupport:[],selectedWords:[]};if(stage.setting==='recipe')this.active.prepPhase=0;this.configureActivity(this.active);t.task=stage.task;this.emit('task',{table:t.id,setting:stage.setting,step:t.step,total:t.plan.length});return this.active;}
  openOrder(tableId){
    if(this.closingService||this.state!=='playing'||this.paused||this.active||this.director?.offer||this.pendingSide)return false;const t=this.tables[tableId];
    if(!t||!['waiting','ready'].includes(t.status)||!t.plan[t.step])return false;
    if(t.status==='ready'&&t.plan[t.step].phase!=='serve')return false;
    if(!t.stockReserved){if(this.stock<(t.partySize||1)){this.emit('stock_needed');return false;}this.stock-=t.partySize||1;t.stockReserved=true;}
    return this.activate(t);
  }
  openWashing(){
    if(this.closingService||!this.kitchen||this.state!=='playing'||this.paused||this.focused||this.kitchen.hands!=='empty'||this.kitchen.busy||this.run||!this.kitchen.dirty)return false;
    const task=this.deck.forSetting('wash',this.config.difficulty);
    this.active={tableId:null,purpose:'washing',phase:'washing',task,washCount:this.kitchen.dirty,attempts:0,completed:false,ingredients:[],matchedPairs:[],pairSupport:[],selectedWords:[]};this.configureActivity(this.active);this.emit('task',{table:null,setting:'wash'});return this.active;
  }
  openDelivery(){
    if(this.closingService||this.state!=='playing'||this.paused||this.active||this.director?.offer||!this.needsDelivery)return false;
    const mixed=!this.demoSetting&&!this.tables.some(t=>t.final&&!['empty','leaving'].includes(t.status))&&!this.eventDone&&!this.serviceEvent&&this.eventCandidate.id==='mixed';if(mixed)this.beginEvent('mixed');const sort=this.demoSorting||mixed||this.deliverySerial++%3===0;
    this.active={tableId:null,purpose:'delivery',task:(sort&&sortingTask(this.config.unit,this.config.difficulty,this.rng,this.deliverySerial,this.learning,this.venue.level))||this.deck.forSetting('delivery'),attempts:0,completed:false,ingredients:[],sortIndex:0,pairSupport:[]};this.configureActivity(this.active);this.emit('task',{table:null,setting:'delivery'});return this.active;
  }
  answer(value){
    const a=this.active;if(!a||a.completed||this.state!=='playing'||this.paused)return {accepted:false};
    if(a.task.kind==='sorting'&&a.sortIndex!==a.task.cards.length)return {accepted:false};
    if(a.task.kind==='repair'&&(!a.repairFound||!a.repairErased))return {accepted:false};
    if(a.task.kind==='sentence'&&a.ingredients.length!==a.task.blocks.length)return {accepted:false};
    if(a.task.kind==='matching'&&a.matchedPairs.length!==a.task.pairs.length)return {accepted:false};
    if(a.task.requested&&!a.listeningConfirmed)return {accepted:false};
    if(a.purpose==='delivery'&&!a.labelPlaced)return {accepted:false};
    if(value!==a.task.answer)return this.recordMistake();
    if(a.attempts===0){this.total++;if(!a.hinted)this.firstCorrect++;}a.attempts++;
    a.freshnessResult=settleFreshness(a,this.config.difficulty);if(a.freshnessResult.timed){this.freshnessTotals[a.freshnessResult.grade]++;if(a.purpose==='order'){const table=this.tables[a.tableId];table.freshnessCount=(table.freshnessCount||0)+1;table.freshnessScore=(table.freshnessScore||0)+({great:1,good:.5,late:0}[a.freshnessResult.grade]);}}
    if(a.purpose==='order')recordOrderReview(this.tables[a.tableId],a,settingForTask(a.task));
    a.completed=true;this.completed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    this.learning.record(a.task,{supported:a.task.kind==='sorting'?false:a.task.kind==='matching'?!!a.hinted:a.attempts>1||!!a.hinted||!!a.repairCueShown,pairSupport:a.pairSupport||[]});this.emit('learning');
    const first=a.attempts===1&&!a.hinted,multiplier=this.config.difficulty==='challenge'?2:1;
    if(a.purpose==='order'&&!first&&this.tables[a.tableId]?.critic)this.tables[a.tableId].criticSlip=true;
    a.reward=a.purpose==='washing'?0:(a.purpose==='delivery'?5:10+(first?5:0)+Math.min(5,Math.floor(this.combo/3)))*multiplier;
    if(a.prepPhase!=null&&a.prepPhase<PREP_PHASE_COUNT-1||a.activityRound<(a.activityRounds||1)-1)a.reward=0;
    if(a.purpose==='order')this.tables[a.tableId].reward+=a.reward;
    this.emit('correct',{table:a.tableId,setting:settingForTask(a.task),first});return {accepted:true,correct:true,completed:true,readback:a.task.readback||a.task.answer,first};
  }
  recordMistake(){const a=this.active;if(!a||a.completed||this.paused||this.state!=='playing')return {accepted:false};if(a.attempts===0)this.total++;a.attempts++;this.combo=0;if(!this.review.some(t=>t.id===a.task.id))this.review.push(a.task);this.emit('incorrect',{table:a.tableId});return {accepted:true,correct:false,attempts:a.attempts};}
  toggleListeningWord(value){const a=this.active;if(!a?.task.requested||a.completed||this.paused||this.state!=='playing'||!a.task.options.includes(value))return {accepted:false};const index=a.selectedWords.indexOf(value);if(index>=0)a.selectedWords.splice(index,1);else if(a.selectedWords.length<2)a.selectedWords.push(value);else return {accepted:false,full:true};return {accepted:true,selected:[...a.selectedWords]};}
  confirmListening(){const a=this.active;if(!a?.task.requested||a.completed||this.paused||a.selectedWords.length!==2||this.state!=='playing')return {accepted:false};if(!a.task.requested.every(p=>a.selectedWords.includes(p.word)))return this.recordMistake();a.listeningConfirmed=true;return this.answer(a.task.answer);}
  matchPair(wordIndex,matchIndex){
    const a=this.active;if(!a||a.task.kind!=='matching'||a.completed||this.paused||this.state!=='playing')return {accepted:false};
    const valid=index=>Number.isInteger(index)&&index>=0&&index<a.task.pairs.length;
    if(!valid(wordIndex)||!valid(matchIndex)||a.matchedPairs.includes(wordIndex)||a.matchedPairs.includes(matchIndex))return {accepted:false};
    if(wordIndex!==matchIndex){a.pairSupport||=[];a.pairSupport.push(wordIndex,matchIndex);return this.recordMistake();}
    a.matchedPairs.push(wordIndex);const word=a.task.pairs[wordIndex].word;
    return a.matchedPairs.length===a.task.pairs.length?{...this.answer(a.task.answer),word,pair:wordIndex}:{accepted:true,correct:true,completed:false,word,pair:wordIndex};
  }
  locateRepair(index){const a=this.active;if(!a||a.task.kind!=='repair'||a.completed||a.repairFound||this.paused||this.state!=='playing')return {accepted:false};if(index!==repairParts(a.task).errorIndex)return this.recordMistake();a.repairFound=true;return {accepted:true,correct:true};}
  eraseRepair(){const a=this.active;if(!a||a.task.kind!=='repair'||!a.repairFound||a.repairErased||this.paused||a.completed)return false;a.repairErased=true;this.emit('erased');return true;}
  stampTicket(){const a=this.active;if(!a||a.task.kind!=='completion'||!a.completed||a.stamped||this.paused)return false;a.stamped=true;this.emit('stamped');return true;}
  printReceipt(){const a=this.active;if(!a||a.task.kind!=='repair'||!a.completed||a.printed||this.paused||this.state!=='playing')return false;a.printed=true;this.emit('printed');return true;}
  attachLabel(value){const a=this.active;if(!a||a.purpose!=='delivery'||a.completed||this.paused)return {accepted:false};if(value!==a.task.answer)return this.recordMistake();a.labelPlaced=true;return this.answer(value);}
  addIngredient(index){
    const a=this.active;if(!a||a.task.kind!=='sentence'||a.completed||this.paused)return {accepted:false};if(a.ingredients.includes(index))return {accepted:false};
    if(index!==a.ingredients.length)return this.recordMistake();a.ingredients.push(index);this.emit('ingredient',{index,table:a.tableId});
    if(a.ingredients.length===a.task.blocks.length)return {...this.answer(a.task.answer),ingredient:index};
    return {accepted:true,correct:true,completed:false,ingredient:index};
  }
  completeTask(){
    const a=this.active;if(!a?.completed||this.state!=='playing'||this.paused)return false;
    if(a.task.kind==='completion'&&!a.stamped)return false;
    if(a.task.kind==='repair'&&!a.printed)return false;
    if(a.task.dialogue?.turn===1){const next=this.deck.followUp(a.task);if(next){const t=this.tables[a.tableId];this.history.push({purpose:'order',orderId:t.orderId,setting:'conversation',turn:1});this.active={tableId:t.id,task:next,phase:a.phase,purpose:'order',attempts:0,completed:false,ingredients:[],matchedPairs:[],pairSupport:[],selectedWords:[]};t.task=next;this.emit('task',{table:t.id,setting:'conversation',step:t.step,total:t.plan.length});return {followup:true};}}
    if(a.prepPhase!=null&&a.prepPhase<PREP_PHASE_COUNT-1){
      const t=this.tables[a.tableId],pool=this.deck.groups.get('recipe')||[],history=[...(a.prepHistory||[]),a.task],used=new Set(history.map(task=>task.answer));
      let next=this.deck.forSetting('recipe',this.config.difficulty);
      // Adaptive priority cannot repeat any sentence already used for this meal.
      if(used.has(next.answer))next=pool.find(task=>!used.has(task.answer))||next;
      this.active={tableId:a.tableId,task:next,phase:a.phase,purpose:'order',prepPhase:a.prepPhase+1,prepHistory:history,prepPrevious:a.task,attempts:0,completed:false,ingredients:[],matchedPairs:[],pairSupport:[],selectedWords:[]};
      t.task=next;this.emit('task',{table:t.id,setting:'recipe',step:t.step,total:t.plan.length,prepPhase:this.active.prepPhase});return {nextPrepPhase:true};
    }
    if(a.activityRound<(a.activityRounds||1)-1){
      const {next,history}=this.nextActivityTask(a);
      this.active={tableId:a.tableId,phase:a.phase,purpose:a.purpose,task:next,activityRound:a.activityRound+1,activityRounds:a.activityRounds,activityHistory:history,activityQualities:[...(a.activityQualities||[]),taskQuality(a)],washCount:a.washCount,attempts:0,completed:false,ingredients:[],matchedPairs:[],pairSupport:[],selectedWords:[],sortIndex:0};
      if(a.purpose==='order')this.tables[a.tableId].task=next;
      this.emit('task',{table:a.tableId,setting:settingForTask(next),round:this.active.activityRound,total:this.active.activityRounds});return {nextActivityRound:true};
    }
    this.active=null;
    if(a.purpose==='washing'){this.history.push({purpose:'washing',setting:'wash'});const qualities=[...(a.activityQualities||[]),taskQuality(a)];this.cleanlinessQuality=qualities.reduce((n,q)=>n+q,0)/qualities.length;this.kitchen.rinse(a.washCount);return {washing:true};}
    if(a.purpose==='delivery'){if(this.kitchen){this.kitchen.received(a);return {carrySupplies:true};}return this.finishDelivery(a);}
    const t=this.tables[a.tableId];t.settingsDone.push(settingForTask(a.task));t.languageContext=a.task.prompt+' '+a.task.answer;t.step++;t.task=t.plan[t.step]?.task||null;
    this.history.push({purpose:'order',orderId:t.orderId,setting:settingForTask(a.task)});
    if(t.event&&this.serviceEvent?.type==='side'&&!t.sideOffered&&t.step===1){t.sideOffered=true;this.pendingSide={tableId:t.id,orderId:t.orderId};this.emit('side_offer',{table:t.id});return {offer:true};}
    if(t.plan[t.step]&&t.plan[t.step].phase!=='serve'){if(this.kitchen){t.status='preparing';return {handoff:true};}this.activate(t);return {next:true};}
    if(a.phase==='serve'){this.emit('ready_to_serve',{table:t.id});return {ready:true};}
    if(this.kitchen){this.kitchen.prepared(t);return {prepared:true};}
    this.queueCooking(t);return {cooking:true};
  }
  finishDelivery(a){this.stock=this.maxStock;this.deliveries++;this.runes+=a.reward;this.history.push({purpose:'delivery',setting:'delivery'});this.emit('restocked',{reward:a.reward,stock:this.stock});this.director?.deliveryReceived();if(this.serviceEvent?.type==='mixed'){const reward=6*(this.config.difficulty==='challenge'?2:1);this.runes+=reward;this.emit('event_bonus',{reward});this.eventDone=true;this.serviceEvent=null;this.emit('event_complete',{success:true});}return {restocked:true};}
  hint(){const a=this.active;if(!a||a.completed)return false;a.hinted=true;if(a.task.kind==='sorting')a.pairSupport.push(a.sortIndex);if(!this.review.some(t=>t.id===a.task.id))this.review.push(a.task);return true;}
  sortLabel(category){const a=this.active;if(!a||a.task.kind!=='sorting'||a.completed||this.paused||this.state!=='playing'||![0,1].includes(category))return {accepted:false};const card=a.task.cards[a.sortIndex];if(card.category!==category){a.pairSupport.push(a.sortIndex);return {...this.recordMistake(),clue:`${card.word}: ${card.translation}. Try the other heading.`};}const index=a.sortIndex++;this.emit('sorted',{index,category,word:card.word});if(a.sortIndex===a.task.cards.length){a.labelPlaced=true;return {...this.answer(a.task.answer),word:card.word,index};}return {accepted:true,correct:true,completed:false,word:card.word,index};}
  resolveSide(accept){const offer=this.pendingSide,t=this.tables[offer?.tableId];if(!offer||!t||t.orderId!==offer.orderId||this.active||this.paused)return false;if(accept){if(this.stock<1)return false;this.stock--;t.side=true;t.plan.splice(t.step,0,{setting:'ticket',phase:'prepare',task:null});}else{t.event=false;this.eventDone=true;this.serviceEvent=null;this.emit('event_complete',{success:false});}this.pendingSide=null;if(this.kitchen)t.status='preparing';else this.activate(t);return true;}
  queueCooking(t){t.status='queued';t.recipe=t.partyRecipes?.[0]??t.recipe;t.readyParts=[];for(const [part,recipe]of (t.partyRecipes||[t.recipe]).entries()){const total=RECIPES[recipe].time*(this.demoSetting?1:2.5)*Math.max(.45,1-(this.upgrades.kitchen||0)*.15)*(this.equipped.has('prep')?.8:1);this.jobs.push({id:++this.jobSerial,tableId:t.id,orderId:t.orderId,part,recipe,left:total,total,slot:null});}this.assignJobs();}
  assignJobs(){const slots=[0,1,2,...(this.equipped.has('bench')?[3]:[])];for(const slot of slots){if(this.jobs.some(j=>j.slot===slot))continue;const j=this.jobs.find(j=>j.slot==null&&(slot===RECIPES[j.recipe].station||slot===3&&RECIPES[j.recipe].station!==1));if(j){j.slot=slot;const t=this.tables[j.tableId];t.status='cooking';this.emit('cooking',{table:t.id,station:RECIPES[j.recipe].station,slot,recipe:j.recipe});}}for(const t of this.tables){const jobs=this.jobs.filter(j=>j.orderId===t.orderId);if(jobs.length){t.status=jobs.some(j=>j.slot!=null)?'cooking':'queued';t.cookLeft=Math.max(...jobs.map(j=>j.left));t.cookTotal=Math.max(...jobs.map(j=>j.total));}}}
  prioritise(tableId){if(this.active||this.paused||this.pendingSide)return false;const first=this.jobs.filter(j=>j.tableId===tableId&&j.slot==null);if(!first.length)return false;this.jobs=[...first,...this.jobs.filter(j=>!first.includes(j))];this.assignJobs();return true;}
  tickJobs(dt){for(const j of [...this.jobs]){if(j.slot==null)continue;j.left=Math.max(0,j.left-dt);if(!j.left){this.jobs.splice(this.jobs.indexOf(j),1);const t=this.tables[j.tableId];if(t.orderId!==j.orderId)continue;t.readyParts.push(j.part);if(t.readyParts.length===(t.partySize||1)){t.status='ready';t.cooked=true;t.readyAge=0;this.emit('ready',{table:t.id});}}}this.assignJobs();}
  readyLoads(){return this.tables.flatMap(t=>t.status==='ready'&&t.step===t.plan.length?(t.partyRecipes||[t.recipe]).flatMap((recipe,part)=>t.deliveredParts?.includes(part)||t.transitParts?.includes(part)?[]:[{tableId:t.id,orderId:t.orderId,part,recipe}]):[]);}
  chooseDish(tableId,part=0){if(this.state!=='playing'||this.paused||this.focused||this.run)return false;const load=this.readyLoads().find(l=>l.tableId===tableId&&l.part===part);if(!load)return false;const index=this.loaded.findIndex(l=>l.orderId===load.orderId&&l.part===part);if(index>=0)this.loaded.splice(index,1);else{if(this.loaded.length>=(this.equipped.has('trolley')?2:1))this.loaded=[];this.loaded.push(load);}this.selectedDish=this.loaded[0]||null;return true;}
  deliver(tableId){if(this.state!=='playing'||this.paused||this.focused||this.run||!this.loaded.length||!this.loaded.some(l=>l.tableId===tableId))return false;const loads=[...this.loaded.filter(l=>l.tableId===tableId),...this.loaded.filter(l=>l.tableId!==tableId)];if(loads.some(l=>!this.readyLoads().some(r=>r.orderId===l.orderId&&r.part===l.part)))return false;for(const l of loads){const t=this.tables[l.tableId];t.transitParts.push(l.part);if(t.transitParts.length+t.deliveredParts.length===(t.partySize||1))t.status='delivering';}this.run={loads,index:0,left:1.1,total:1.1,returning:false};this.loaded=[];this.selectedDish=null;this.emit('dispatch',{loads});if(this.kitchen)this.kitchen.dispatch(this.run);return true;}
  tickRun(dt){if(this.kitchen)return;const run=this.run;if(!run)return;run.left-=dt;if(run.left>0)return;if(run.returning){this.run=null;return;}const load=run.loads[run.index];this.handoff(load);if(this.state!=='playing')return;run.index++;run.returning=run.index===run.loads.length;run.left=run.total=run.returning?.65:.8;}
  closeEvent(t,success){if(this.serviceEvent?.orderId!==t.orderId)return;this.eventDone=true;const event=this.serviceEvent;this.serviceEvent=null;this.emit('event_complete',{event,success});}
  serve(tableId){if(!this.chooseDish(tableId))return false;return this.deliver(tableId);}
  handoff(load){const t=this.tables[load.tableId];if(!t||t.orderId!==load.orderId||t.deliveredParts.includes(load.part)||!t.transitParts.includes(load.part))return false;t.transitParts=t.transitParts.filter(p=>p!==load.part);t.deliveredParts.push(load.part);const complete=t.deliveredParts.length===(t.partySize||1),multiplier=this.config.difficulty==='challenge'?2:1;
    const together=t.partySize===2,within=!t.firstHandoff||this.elapsed-t.firstHandoff<=7;if(!t.firstHandoff)t.firstHandoff=this.elapsed;
    const freshTip=load.part===0?freshnessTip(t,this.config.difficulty):0;this.freshnessTotals.tips+=freshTip;
    const reward=freshTip+(load.part===0?t.reward:0)+((this.upgrades.tips||0)*2+(complete&&!this.demoSetting?ORDER_TYPES[t.orderType].bonus:0)+(t.final?10:0)+(complete&&t.event&&(!together||within)?6:0))*multiplier;
    this.kitchen?.onServed(load);this.served++;this.runes+=reward;this.projects=advanceProject(this.projects);this.emit('project_progress',{projects:this.projects});const guest=t.partyGuests?.[load.part]??t.guest,previous=this.guests[guest]||{visits:0,favourite:load.recipe},visits=previous.visits+1;this.guests[guest]={visits,favourite:previous.favourite};
    if(complete&&t.pickup&&!this.demoSetting){const key=`${this.reputation.shiftSerial}:${t.orderId}`;if(!this.cafeProgress.credited.includes(key)){this.cafeProgress.pickups++;this.cafeProgress.credited=[...this.cafeProgress.credited,key].slice(-128);this.emit('cafe_progress');}}
    if(t.pickup)this.director?.pickupServed(t,complete);
    if(complete){t.status='leaving';t.delivered=true;t.cooldown=diningDuration;t.dining={elapsed:0,ratings:t.critic&&!t.criticSlip?{taste:3,service:3,speed:3}:customerReview(t,this.restaurantCleanliness())};this.closeEvent(t,true);}else t.status='ready';
    this.emit('served',{table:load.tableId,reward,freshnessTip:freshTip,steps:t.step,name:CUSTOMER_PROFILES[guest].name,thanks:t.personality.thanks,postcard:visits===3,final:t.final,part:load.part});if(this.served>=this.goal&&!this.director?.holdFinal){this.closingService=true;this.run=null;this.loaded=[];this.selectedDish=null;}return reward;}
  restaurantCleanliness(){
    if(!this.kitchen)return this.cleanlinessQuality;
    const backlog=Math.max(0,this.kitchen.dirty-1)/Math.max(1,this.kitchen.capacity);
    return this.cleanlinessQuality*(1-Math.min(.6,backlog*.6));
  }
  tickDining(dt){
    let scoreOwner=this.tables.find(t=>t.dining&&t.status==='leaving'&&diningStage(t.dining).stage==='score');const scoreStart=DINING.eat+DINING.review+DINING.spin;
    for(const t of this.tables){if(!t.dining||t.status!=='leaving')continue;
      const before=diningStage(t.dining).stage;let elapsed=Math.min(diningDuration,t.dining.elapsed+dt);if(scoreOwner&&scoreOwner!==t&&t.dining.elapsed<scoreStart&&elapsed>=scoreStart)elapsed=scoreStart-1e-6;t.dining.elapsed=elapsed;t.cooldown=Math.max(0,diningDuration-t.dining.elapsed);
      const stage=diningStage(t.dining).stage;if(stage!==before&&stage==='review')this.emit('customer_review',{table:t.id,ratings:t.dining.ratings});
      if(stage==='score'){scoreOwner??=t;this.commitCustomerReview(t);}
      if(stage==='done'){this.commitCustomerReview(t);t.status='empty';this.emit('customer_departed',{table:t.id});}
    }
  }
  commitCustomerReview(t){
    if(!t.dining||t.dining.credited)return false;const perfect=!!t.critic&&!t.criticSlip,score=customerRating(t.dining.ratings);if(score==null)return false;t.dining.credited=true;t.dining.score=score;
    const review={name:t.name||CUSTOMER_PROFILES[t.guest]?.name||'Customer',score,orderId:t.orderId,table:t.id,...(t.critic?{critic:true,perfect}:{})};this.shiftReviews.push(review);if(t.critic)this.criticReview={name:review.name,perfect,score};
    if(!this.demoSetting){const change=creditReview(this.reputation,`${this.reputation.shiftSerial}:${t.orderId}`,score,perfect?CRITIC_WEIGHT:1);if(change)this.reputationMilestones.push(...change.milestones);}
    this.emit('customer_rating',review);return review;
  }
  commitPendingReviews(){for(const t of this.tables)this.commitCustomerReview(t);}
  resolveEpisode(accept){const accepted=this.director?.resolve(accept)||false;if(accepted&&this.served>=this.goal&&!this.director.holdFinal)this.closingService=true;return accepted;}
  boost(){if(this.state!=='playing'||this.paused||this.active||this.boostUsed)return false;this.boostUsed=true;for(const t of this.tables)t.patience=Math.min(t.maxPatience,t.patience+15);this.emit('boost');return true;}
  finish(won){if(this.state==='finished')return;this.commitPendingReviews();this.active=null;this.run=null;this.jobs=[];this.loaded=[];this.selectedDish=null;this.pendingSide=null;this.state='finished';this.result={shift:this.shift,freshness:{...this.freshnessTotals},won,served:this.served,goal:this.goal,runes:this.runes,accuracy:this.total?Math.round(this.firstCorrect/this.total*100):0,missed:this.missed,bestCombo:this.bestCombo,completed:this.completed,deliveries:this.deliveries,review:this.review.slice(0,6)};
    if(this.director)this.result.episode=this.director.summary();
    this.result.critic=this.criticReview||null;
    this.result.reputation=reputationProgress(this.reputationStart,this.reputation,this.shiftReviews);this.result.reputation.milestones=[...this.reputationMilestones];if(this.kitchen)this.result.kitchen=this.kitchen.summary();
    this.result.stars=won?(this.result.accuracy>=85&&this.missed===0?3:this.result.accuracy>=65&&this.missed<=1?2:1):0;this.emit('finish',{result:this.result});
  }
}
