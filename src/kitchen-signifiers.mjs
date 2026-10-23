import {RECIPES} from './menu.mjs';

export const KITCHEN_LESSONS=['numbers','take','prepare','ticket','repair','menu','cook','pick','serve','receive','deposit','stash','collect','wash','move'];
export function cleanKitchenHelp(value){return {mode:['auto','always','off'].includes(value?.mode)?value.mode:'auto',seen:[...new Set((Array.isArray(value?.seen)?value.seen:[]).filter(v=>KITCHEN_LESSONS.includes(v)))]};}
const loadKey=l=>l.orderId+':'+l.part;
export const orderName=t=>t.pickup?'Pickup #'+t.orderId:'T'+(t.id+1)+' · #'+t.orderId;
const at=(g,action,label,station,icon,lesson,point,table,reason='')=>({action,label,station,icon,lesson,point,tableId:table?.id,orderId:table?.orderId,identity:table?orderName(table):'',reason,available:!reason});
const stageInfo={pickup:['Match numbers','Pickup','clip','numbers'],conversation:['Take order','Guest','chat','take'],tablet:['Read menu','Menu','tablet','menu'],recipe:['Prepare','Prep','prep','prepare'],ticket:['Fill ticket','Ticket','clip','ticket'],repair:['Check note','Checkout','repair','repair']};

// Descriptions are read-only. Each action is dispatched through KitchenFlow.command,
// including the Work shortcut, so a sign cannot promise a different action.
export function kitchenAction(g,action){
 const k=g.kitchen;if(!k||g.closingService)return null;
 if(action?.startsWith('order:')){
  const t=g.tables[+action.split(':')[1]];if(!t||['empty','leaving'].includes(t.status))return null;
  if(t.status==='prepared'){
   const held=k.carry?.kind==='prepared'&&k.carry.orderId===t.orderId;
   if(!held){const i=k.counter.findIndex(c=>c.orderId===t.orderId);if(i>=0)return kitchenAction(g,'counter:'+i);}
   return at(g,action,'Load cooker','Cook','flame','cook',k.point('cook'+RECIPES[t.partyRecipes[0]].station),t,held?'':'Set down your current load before collecting this tray.');
  }
  if(t.status==='queued'||t.status==='cooking'||t.status==='delivering')return at(g,action,t.status==='queued'?'Prioritise':'Cooking…',t.status==='delivering'?'Guest':'Cook','clock',null,k.tablePoint(t),t,t.status==='queued'?'':'Still cooking—choose another ticket.');
  if(t.status==='ready'&&t.step===t.plan.length){
   if(g.loaded.some(l=>l.orderId===t.orderId))return at(g,action,t.pickup?'Deliver pickup':'Serve T'+(t.id+1),t.pickup?'Pickup':'Table '+(t.id+1),'serve','serve',k.tablePoint(t),t);
   const l=g.readyLoads().find(l=>l.tableId===t.id&&!g.loaded.some(h=>loadKey(h)===loadKey(l)));
   return l?kitchenAction(g,'pick:'+t.id+':'+l.part):null;
  }
  if(k.hands!=='empty')return at(g,action,'Hands full','Counter','hand',null,k.point('counter'),t,'Hands full—set your load down before starting English.');
  if(t.status==='waiting'&&!t.stockReserved&&g.stock<(t.partySize||1))return kitchenAction(g,'receiving');
  let [label,station,icon,lesson]=stageInfo[t.plan[t.step]?.setting]||['Continue','Guest','hand','take'];
  if(t.plan[t.step]?.setting==='pickup'&&t.plan[t.step].pickupMode&&t.plan[t.step].pickupMode!=='numbers')label='Check '+({names:'bag names',quantities:'quantities',times:'collection times',instructions:'packing'}[t.plan[t.step].pickupMode]||'labels');
  return at(g,action,t.status==='ready'&&t.plan[t.step]?.setting!=='pickup'?'Final check':label,station,icon,lesson,k.stagePoint(t),t);
 }
 if(action?.startsWith('pick:')){
  const [,id,part]=action.split(':'),t=g.tables[+id],l=g.readyLoads().find(l=>l.tableId===+id&&l.part===+part);if(!l)return null;
  const reason=k.carry?'Hands full—set your load down first.':!k.plated.has(loadKey(l))&&!k.clean?'No clean plates—wash a batch at Sink.':g.loaded.length>=(g.equipped.has('trolley')?2:1)?'Tray full—serve your load or return it to Pass.':'';
  return at(g,action,'Collect meal','Pass','serve','pick',k.point('pass'),t,reason);
 }
 if(action==='receiving')return at(g,action,'Get supplies','Supplies','crate','receive',k.point('receiving'),null,!g.needsDelivery?'Pantry stocked—continue a ticket.':k.hands!=='empty'?'Hands full—set your load down first.':'');
 if(action==='pantry')return at(g,action,'Store crate','Pantry','pantry','deposit',k.point('pantry'),null,k.carry?.kind==='supplies'?'':'Collect a labeled delivery first.');
 if(action==='sink')return at(g,action,'Wash dishes','Sink','sink','wash',k.point('sink'),null,k.hands!=='empty'?'Hands full—set your load down first.':!k.dirty?'All serving dishes are clean.':'');
 if(action==='counter'){
  if(g.loaded.length)return at(g,action,'Return meals','Pass','serve','stash',k.point('pass'));
  if(!k.carry)return k.counter.length?kitchenAction(g,'counter:0'):at(g,action,'Counter empty','Counter','counter',null,k.point('counter'),null,'The holding counter is empty.');
  return at(g,action,'Set down','Counter','counter','stash',k.point('counter'),g.tables[k.carry.tableId],k.counter.length>=k.counterCapacity?'Counter full—collect its stored load first.':'');
 }
 if(action?.startsWith('counter:')){const c=k.counter[+action.split(':')[1]];if(!c)return null;return at(g,action,c.kind==='supplies'?'Collect crate':'Collect tray','Counter','hand','collect',k.point('counter'),g.tables[c.tableId],k.hands!=='empty'?'Hands full—set your load down first.':'');}
 if(action==='pass'){
  const extra=g.readyLoads().find(l=>!g.loaded.some(h=>loadKey(h)===loadKey(l)));
  if(g.loaded.length&&(!g.equipped.has('trolley')||g.loaded.length>=2||!extra))return at(g,action,'Return meals','Pass','serve','stash',k.point('pass'));
  const l=g.loaded.length?extra:g.readyLoads().find(l=>l.tableId===k.selected)||extra;
  return l?kitchenAction(g,'pick:'+l.tableId+':'+l.part):at(g,action,'Pass empty','Pass','serve',null,k.point('pass'),null,'No checked meal is ready at Pass yet.');
 }
 return null;
}

export const simpleKitchenScreen=(width,coarse=false)=>width<760||coarse;
// Preview the ordinary command with free hands, without changing the restaurant.
// Only a storage-related blocker can become a safe, two-stop job switch.
export function simpleKitchenAction(g,action){
 if(action==='work')action=kitchenTarget(g)?.action;
 if(!action)return null;
 const current=kitchenAction(g,action),k=g.kitchen;
 if(current&&k.sideRestock&&!['receiving','pantry'].includes(action))return {...current,available:false,reason:'Restock first to continue this request.'};
 if(!current||current.available||k.hands==='empty'||k.sideRestock)return current;
 const free=Object.create(g),hands=Object.create(k);free.kitchen=hands;free.loaded=[];hands.game=free;hands.carry=null;
 Object.defineProperty(hands,'hands',{value:'empty'});
 const next=kitchenAction(free,action);
 if(!next?.available)return next||current;
 const cargo=next.action.startsWith('counter:')?k.counter[+next.action.split(':')[1]]:null;
 if(k.carry&&k.counter.length>=k.counterCapacity&&!cargo)return {...next,available:false,reason:k.carry.kind==='supplies'?'Counter full. Restock first.':'Counter full. Cook this tray first.'};
 return {...next,requiresStorage:true,storageKind:k.carry?(cargo?'swap':'stash'):'unload',storedCargo:cargo};
}

export function simpleKitchenLabel(intent){
 if(!intent)return '';
 if(intent.lesson==='stash')return 'Setting down…';
 if(intent.lesson==='cook')return 'Cook';
 if(intent.lesson==='deposit')return 'Restock';
 if(intent.lesson==='collect')return 'Collect';
 if(intent.lesson==='serve')return intent.station==='Pickup'?'Deliver pickup':'Serve T'+(intent.tableId+1);
 return shortKitchenLabel(intent.label);
}

export function recommendKitchen(g){
 const k=g?.kitchen;if(!k||g.closingService||g.state!=='playing'||g.focused||g.paused)return null;
 if(g.run){const l=g.run.loads[g.run.index],t=g.tables[l?.tableId];return t?{...at(g,null,'Delivering…',t.pickup?'Pickup':'Table '+(t.id+1),'serve',null,k.tablePoint(t),t),automatic:true}:null;}
 if(k.busy)return {...at(g,null,'Washing…','Sink','sink',null,k.point('sink')),automatic:true};
 if(k.sideRestock)return kitchenAction(g,k.carry?'pantry':'receiving');
 if(k.carry)return kitchenAction(g,k.carry.kind==='supplies'?'pantry':'order:'+k.carry.tableId);
 if(g.loaded.length)return kitchenAction(g,'order:'+g.loaded[0].tableId);
 if(g.director?.needsSupplies)return kitchenAction(g,'receiving');
 const ready=g.tables.filter(t=>t.status==='ready'&&t.step===t.plan.length);
 if(!k.clean&&k.dirty&&ready.length)return kitchenAction(g,'sink');
 const selected=g.tables[k.selected];
 const eligible=g.tables.filter(t=>['preparing','prepared','ready','waiting'].includes(t.status));
 const sorted=[...eligible].sort((a,b)=>a.patience/a.maxPatience-b.patience/b.maxPatience||a.orderId-b.orderId);
 const t=selected&&eligible.includes(selected)?selected:sorted.find(t=>t.status==='ready')||sorted.find(t=>t.status==='preparing'||t.status==='prepared')||sorted[0];
 if(t){const intent=kitchenAction(g,'order:'+t.id);if(intent?.available)return intent;}
 if(k.counter.length)return kitchenAction(g,'counter:0');
 if(k.dirty)return kitchenAction(g,'sink');
 if(g.needsDelivery)return kitchenAction(g,'receiving');
 return null;
}
export function kitchenTarget(g){
 const k=g?.kitchen;if(!k||g.closingService||g.focused||g.paused||g.state!=='playing')return null;
 const p=k.pending;
 if(p?.kind==='storeThen')return {...p.intent,action:null,label:'Switching jobs…',station:p.storageKind==='unload'?'Pass':'Counter',point:k.point(p.storageKind==='unload'?'pass':'counter'),automatic:true,travelling:true};
 if(p&&p.kind!=='walk'){
  const action=p.kind==='task'||p.kind==='cook'?'order:'+p.tableId:p.kind==='pick'?'pick:'+p.tableId+':'+p.part:p.kind==='receive'?'receiving':p.kind==='deposit'?'pantry':p.kind==='wash'?'sink':p.kind==='stash'||p.kind==='unload'?'counter':p.kind==='collect'?'counter:'+k.counter.indexOf(p.cargo):null;
  if(action){const intent=kitchenAction(g,action);if(intent)return {...intent,travelling:true};}
 }
 return recommendKitchen(g);
}
export function kitchenTip(g,target){
 const k=g.kitchen,help=cleanKitchenHelp(k.help);
 if(k.notice)return k.notice;
 if(g.run)return 'Delivering '+target?.identity+'. Rewards arrive with the meal.';
 if(k.busy)return 'Washing a batch. Other dishes keep cooking.';
 if(k.moving)return k.pending?.kind==='walk'?'Walking to your floor marker. Tap a ticket to choose work.':'Walking to '+target?.station+(target?.identity?' · '+target.identity:'')+'. Tap another ticket to change jobs.';
 if(!target)return 'Cooking is in progress. Choose a ticket when its next action is ready.';
 if(help.mode==='always'||help.mode==='auto'&&!help.seen.includes(target.lesson)){
  const lessons={numbers:'Check each collection label. Number practice matches each pickup number to its English words. Challenge has two sets of four pairs.',take:'Tap the highlighted ticket or guest sign to take an order.',menu:'Tap the Menu sign or highlighted ticket to read the menu.',prepare:'Tap Prep or the highlighted ticket to prepare this order.',ticket:'Tap Ticket or the highlighted ticket to check its words.',repair:'Tap Checkout or the highlighted ticket to check its note.',cook:'Your tray is ready. Tap Cook to load it.',pick:'The meal is checked. Tap Pass to collect it.',serve:'Carry this meal to its guest. Tap the matching table sign.',receive:'Tap Supplies to label a fresh delivery.',deposit:'You are carrying a crate. Tap Pantry to restock.',stash:'Tap Counter to set down your load.',collect:'Tap Counter to collect the stored load.',wash:'Tap Sink, then tap or swipe the sentence blocks to clean a batch.'};
  return lessons[target.lesson]||'Tap the highlighted sign to continue.';
 }
 return target.label+' → '+target.station+(target.identity?' · '+target.identity:'');
}

// One contextual badge, clamped away from top tickets and bottom controls.
// A leader retains the real world anchor when its badge has to move.
export function placeKitchenBadge(point,width,height,{top,bottom,left=12,right=12}={}){
 const landscape=height<450&&width/height>1.4,bw=Math.min(188,width-left-right),bh=landscape?50:58;
 const low=top??(landscape?126:204),high=bottom??height-(landscape?90:178);
 const x=Math.max(left+bw/2,Math.min(width-right-bw/2,point.x));
 const y=Math.max(low+bh/2,Math.min(Math.max(low+bh/2,high-bh/2),point.y-bh/2-12));
 return {x,y,width:bw,height:bh,anchor:{x:point.x,y:point.y}};
}

export function kitchenWorldActions(g,{simple=false}={}){
 if(!g?.kitchen||g.focused||g.paused||g.closingService||g.state!=='playing')return [];
 const describe=simple?simpleKitchenAction:kitchenAction;
 const actions=g.tables.filter(t=>!['empty','leaving'].includes(t.status)).sort((a,b)=>(b.id===g.kitchen.selected)-(a.id===g.kitchen.selected)||a.patience/a.maxPatience-b.patience/b.maxPatience).map(t=>describe(g,'order:'+t.id));
 if(g.kitchen.dirty)actions.push(describe(g,'sink'));
 if(g.needsDelivery||g.kitchen.carry?.kind==='supplies')actions.push(describe(g,g.kitchen.carry?.kind==='supplies'?'pantry':'receiving'));
 if(simple)g.kitchen.counter.forEach((_,i)=>actions.push(describe(g,'counter:'+i)));
 else if(g.kitchen.counter.length||g.kitchen.carry||g.loaded.length)actions.push(kitchenAction(g,'counter'));
 const groups=new Map();for(const a of actions){if(!a?.available||!a.action||!a.point)continue;const index=a.action.startsWith('counter:')?+a.action.split(':')[1]:null,slot=simple&&index!=null?g.kitchen.layout.holding[index]:null;const key=simple&&index!=null?a.action:a.point.x.toFixed(2)+':'+a.point.z.toFixed(2);if(groups.has(key)){if(groups.get(key).action!==a.action)groups.get(key).count++;continue;}groups.set(key,{...a,badgePoint:slot?{x:slot[0],y:slot[1],z:slot[2]}:undefined,count:1});}return [...groups.values()];
}
export function shortKitchenLabel(label){return ({'Take order':'Order','Read menu':'Menu','Prepare':'Prep','Fill ticket':'Ticket','Check note':'Check','Final check':'Check','Load cooker':'Cook','Collect meal':'Collect','Return meals':'Return','Get supplies':'Stock','Store crate':'Store','Set down':'Hold','Counter empty':'Hold','Wash dishes':'Wash','Match numbers':'Numbers'}[label]||label.replace(/^Serve T/,'T').replace(/^Deliver pickup$/,'Pickup').replace(/^Check /,'').replace(/^Tea · /,'Tea '));}

// Compact task badges share the usable playfield without covering one another.
export function placeWorldBadges(items,rect,occlusions=[]){
 const placed=[];for(const item of items){const w=item.width||76,h=item.height||44,candidates=[];
  for(const dx of [0,-w-8,w+8])for(const dy of [0,-h-8,h+8,-2*(h+8),2*(h+8)]){
   const x=Math.max(rect.left+w/2,Math.min(rect.right-w/2,item.x+dx)),y=Math.max(rect.top+h/2,Math.min(rect.bottom-h/2,item.y-20+dy));
   const box={left:x-w/2-3,right:x+w/2+3,top:y-h/2-3,bottom:y+h/2+3};
   const overlap=[...placed.map(p=>({left:p.x-p.width/2,right:p.x+p.width/2,top:p.y-p.height/2,bottom:p.y+p.height/2})),...occlusions].reduce((sum,r)=>sum+Math.max(0,Math.min(box.right,r.right)-Math.max(box.left,r.left))*Math.max(0,Math.min(box.bottom,r.bottom)-Math.max(box.top,r.top)),0);
   candidates.push({x,y,cost:overlap*10000+Math.hypot(x-item.x,y-(item.y-20))});
  }
  const best=candidates.sort((a,b)=>a.cost-b.cost)[0];placed.push({...item,...best,width:w,height:h});
 }return placed;
}
