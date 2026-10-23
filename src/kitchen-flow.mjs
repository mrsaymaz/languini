import {cleanKitchenHelp,kitchenAction,kitchenTarget,simpleKitchenAction} from './kitchen-signifiers.mjs';
import {venueLayout} from './venue-layout.mjs';
import {restaurantLayout} from './restaurant-layout.mjs';
import {RECIPES} from './menu.mjs';

export const KITCHEN_TABLES=Object.fromEntries(['courtyard','bistro','banquet'].map(id=>[id,restaurantLayout(id).tables]));
export const KITCHEN_POINTS=restaurantLayout().points;
const key=load=>load.orderId+':'+load.part;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

// A small navigation grid keeps the chef out of tables, chairs and counters.
// No render object, timer or animation callback owns this state.
export class KitchenNavigation {
  constructor(arena,{bench=false,design={}}={}){
    const plan=restaurantLayout(arena,design),venue=plan.venue;this.cols=34+venue.extraWidth*4;this.rows=34+venue.extraDepth*4;this.step=.25;this.origin={x:-4.125-venue.extraWidth/2,z:-3.875-venue.extraDepth};
    this.obstacles=plan.tableBounds.map(f=>({id:f.id,left:f.x-f.width/2,right:f.x+f.width/2,top:f.z-f.depth/2,bottom:f.z+f.depth/2}));
    for(const f of plan.fixtures)this.obstacles.push({id:f.id,left:f.x-f.width/2-.13,right:f.x+f.width/2+.13,top:f.z-f.depth/2-.13,bottom:f.z+f.depth/2+.13});
    this.cells=Array.from({length:this.cols*this.rows},(_,id)=>{const x=this.origin.x+(id%this.cols)*this.step,z=this.origin.z+Math.floor(id/this.cols)*this.step;return {id,x,z,open:!this.obstacles.some(r=>x>r.left&&x<r.right&&z>r.top&&z<r.bottom)};});
  }
  nearest(x,z){let best=null,cost=Infinity;for(const cell of this.cells)if(cell.open){const d=Math.hypot(cell.x-x,cell.z-z);if(d<cost){cost=d;best=cell;}}return best;}
  route(from,to){
    const start=this.nearest(from.x,from.z),end=this.nearest(to.x,to.z);if(!start||!end)return null;
    const queue=[start.id],previous=new Int32Array(this.cells.length).fill(-1);previous[start.id]=start.id;
    for(let i=0;i<queue.length;i++){const id=queue[i];if(id===end.id)break;const col=id%this.cols,row=Math.floor(id/this.cols);
      for(const next of [col? id-1:-1,col<this.cols-1?id+1:-1,row?id-this.cols:-1,row<this.rows-1?id+this.cols:-1])if(next>=0&&previous[next]===-1&&this.cells[next].open){previous[next]=id;queue.push(next);}
    }
    if(previous[end.id]===-1)return null;const path=[];let id=end.id;while(id!==start.id){path.push({x:this.cells[id].x,z:this.cells[id].z});id=previous[id];}
    path.push({x:start.x,z:start.z});return path.reverse();
  }
}

export class KitchenFlow {
  constructor(game){
    this.game=game;this.help=cleanKitchenHelp();this.notice='';this.layout=restaurantLayout(game.config.arena,game.design);this.position={x:this.layout.start[0],z:this.layout.start[1]};this.rotation=0;this.route=[];this.pending=null;this.busy=null;this.carry=null;this.counter=[];this.counterCapacity=game.equipped.has('bench')?2:1;
    this.capacity=game.arena.tables+1+(game.design?.counter==='service'?1:0);this.clean=this.capacity;this.dirty=0;this.plated=new Set();this.washed=0;this.handoffs=0;this.flow=0;this.bestFlow=0;this.steps=0;this.selected=null;
    this.navigation=new KitchenNavigation(game.config.arena,{bench:game.equipped.has('bench')||game.projects.items.kitchen.stage>=3,design:game.design});
  }
  get locked(){return this.game.closingService||this.game.state!=='playing'||this.game.paused||this.game.focused;}
  get moving(){return this.route.length>0;}
  get hands(){return this.carry?.kind||(this.game.loaded.length||this.game.run?'meal':'empty');}
  point(name){const p=this.layout.points[name];return p?{x:p[0],z:p[1]}:null;}
  tablePoint(t){const p=t.pickup?this.layout.pickupApproach:this.layout.tableApproaches[t.id];return {x:p[0],z:p[1]};}
  learn(lesson){if(lesson&&!this.help.seen.includes(lesson)){this.help.seen.push(lesson);this.game.emit('kitchen_learned',{lesson});}}
  reject(message){this.notice=message;this.game.emit('kitchen_notice',{message});return false;}
  travel(point,action){const route=this.navigation.route(this.position,point);if(!route)return this.reject('That route is blocked. Choose another station.');this.autoStorage=null;this.route=route;this.pending=action;this.notice='';this.steps++;return true;}
  walkTo(x,z){if(this.locked||this.game.run||this.busy)return false;const accepted=this.travel({x,z},{kind:'walk'});if(accepted){const p=this.route.at(-1)||this.position;this.tapMarker={...p,left:.8};}return accepted;}
  nudge(x,z){return this.walkTo(this.position.x+x*.6,this.position.z+z*.6);}
  stagePoint(t){const setting=t.plan[t.step]?.setting;return ['conversation','tablet'].includes(setting)?this.tablePoint(t):this.point(setting);}
  commandSimple(action){
    if(this.game.closingService||this.locked||this.game.run||this.busy)return this.command(action);
    const intent=simpleKitchenAction(this.game,action);
    if(!intent?.requiresStorage)return intent&&!intent.available?this.reject(intent.reason):this.command(action);
    const next={kind:'storeThen',storageKind:intent.storageKind,intent,cargo:this.carry,storedCargo:intent.storedCargo,loads:[...this.game.loaded],tableId:intent.tableId,orderId:intent.orderId};
    if(!this.travel(this.point(next.storageKind==='unload'?'pass':'counter'),next))return false;
    this.autoStorage=next;if(intent.tableId!=null)this.selected=intent.tableId;return true;
  }
  command(action){
    if(this.game.closingService)return false;
    if(action==='receiving'&&this.game.pendingSide&&!this.game.active&&!this.game.paused)this.sideRestock=true;
    if(this.locked||this.game.run||this.busy)return false;
    const g=this.game;
    if(action==='work'&&this.sideRestock)action=this.carry?'pantry':'receiving';
    if(this.sideRestock&&!['receiving','pantry'].includes(action))return this.reject('Finish the delivery and carry it to Pantry, then answer the side request.');
    if(action.startsWith('order:')){
      const t=g.tables[+action.split(':')[1]];if(!t||['empty','leaving','delivering'].includes(t.status))return false;this.selected=t.id;
      if(t.status==='queued'){g.prioritise(t.id);g.emit('kitchen_notice',{message:'This ticket is next for its work space.'});return true;}
      if(t.status==='cooking')return this.reject('This dish is cooking. Work on another ticket.');
      if(t.status==='prepared'){
        if(this.carry?.kind==='prepared'&&this.carry.orderId===t.orderId)return this.travel(this.point('cook'+RECIPES[t.partyRecipes[0]].station),{kind:'cook',tableId:t.id,orderId:t.orderId});
        const index=this.counter.findIndex(c=>c.kind==='prepared'&&c.orderId===t.orderId);if(index>=0)return this.command('counter:'+index);
        return this.reject('Set down your current load before collecting this tray.');
      }
      if(t.status==='ready'&&t.step===t.plan.length){
        if(g.loaded.some(l=>l.orderId===t.orderId))return g.deliver(t.id);
        return this.command('pick:'+t.id+':'+g.readyLoads().find(l=>l.tableId===t.id)?.part);
      }
      if(this.hands!=='empty')return this.reject('Put your load on the counter or pass before starting English.');
      if(t.status==='waiting'&&!t.stockReserved&&g.stock<(t.partySize||1))return this.command('receiving');
      return this.travel(this.stagePoint(t),{kind:'task',tableId:t.id,orderId:t.orderId,step:t.step});
    }
    if(action.startsWith('pick:')){
      if(this.carry)return this.reject('Set this load down first.');const [,id,part]=action.split(':'),load=g.readyLoads().find(l=>l.tableId===+id&&l.part===+part);if(!load)return false;
      if(!this.plated.has(key(load))&&this.clean===0)return this.reject('Wash a batch at the sink to get clean serving dishes.');
      if(g.loaded.length>=(g.equipped.has('trolley')?2:1)&&!g.loaded.some(l=>key(l)===key(load)))return this.reject('Your tray is full. Serve it or put it back on the pass.');
      return this.travel(this.point('pass'),{kind:'pick',...load});
    }
    if(action==='pass'){
      if(g.loaded.length){const extra=g.equipped.has('trolley')&&g.loaded.length<2&&g.readyLoads().find(l=>!g.loaded.some(held=>key(held)===key(l)));return extra?this.command('pick:'+extra.tableId+':'+extra.part):this.travel(this.point('pass'),{kind:'unload'});}
      const load=g.readyLoads().find(l=>l.tableId===this.selected)||g.readyLoads()[0];return load?this.command('pick:'+load.tableId+':'+load.part):this.reject('No checked meal is ready at the pass yet.');
    }
    if(action==='work'){const next=kitchenTarget(g);return next?.action?this.command(next.action):this.reject('Cooking is in progress. Choose another ticket when it is ready.');}
    if(action==='receiving'){
      if(!g.needsDelivery)return this.reject('The pantry has enough supplies.');if(this.hands!=='empty')return this.reject('Deposit or set down your load before receiving supplies.');return this.travel(this.point('receiving'),{kind:'receive'});
    }
    if(action==='pantry')return this.carry?.kind==='supplies'?this.travel(this.point('pantry'),{kind:'deposit'}):this.reject('Collect a labeled delivery first.');
    if(action==='sink'){
      if(this.hands!=='empty')return this.reject('Set down your load before washing.');return this.dirty?this.travel(this.point('sink'),{kind:'wash'}):this.reject('All serving dishes are clean.');
    }
    if(action==='counter'){
      if(g.loaded.length)return this.travel(this.point('pass'),{kind:'unload'});if(!this.carry)return this.counter.length?this.command('counter:0'):this.reject('The holding counter is empty.');
      return this.counter.length<this.counterCapacity?this.travel(this.point('counter'),{kind:'stash'}):this.reject('The holding counter is full. Finish or collect its tray.');
    }
    if(action.startsWith('counter:')){if(this.hands!=='empty')return this.reject('Your hands are full.');const index=+action.split(':')[1];return this.counter[index]?this.travel(this.point('counter'),{kind:'collect',cargo:this.counter[index]}):false;}
    return false;
  }
  tick(dt){
    if(this.locked)return;
    if(this.tapMarker){this.tapMarker.left-=dt;if(this.tapMarker.left<=0)this.tapMarker=null;}
    if(this.busy){this.busy.left=Math.max(0,this.busy.left-dt);if(!this.busy.left){const count=this.busy.count;this.busy=null;this.dirty-=count;this.clean+=count;this.washed+=count;this.learn('wash');this.game.emit('kitchen_washed',{count});}return;}
    let remaining=dt*(this.game.config.difficulty==='challenge'?4.2:3.6);
    while(this.route.length&&remaining>0){const target=this.route[0],d=distance(this.position,target);
      if(d<.001){this.route.shift();continue;}
      this.rotation=Math.atan2(target.x-this.position.x,target.z-this.position.z);
      if(d<=remaining){this.position.x=target.x;this.position.z=target.z;remaining-=d;this.route.shift();}
      else{this.position.x+=(target.x-this.position.x)*remaining/d;this.position.z+=(target.z-this.position.z)*remaining/d;remaining=0;}
    }
    if(!this.route.length&&this.pending){const action=this.pending;this.pending=null;this.arrive(action);}
  }
  arrive(a){
    const g=this.game,t=g.tables[a.tableId];
    if(a.kind==='storeThen'){
      if(this.autoStorage!==a)return;this.autoStorage=null;
      if(a.orderId!=null&&(!t||t.orderId!==a.orderId||['empty','leaving'].includes(t.status)))return;
      if(a.storageKind==='unload'){
        if(this.carry||g.loaded.length!==a.loads.length||g.loaded.some((l,i)=>key(l)!==key(a.loads[i])))return;
        g.loaded=[];g.selectedDish=null;
      }else{
        if(this.carry!==a.cargo)return;
        if(a.storageKind==='swap'){
          const i=this.counter.indexOf(a.storedCargo);if(i<0)return;
          this.counter[i]=this.carry;this.carry=a.storedCargo;this.learn('stash');this.learn('collect');return;
        }
        if(this.counter.length>=this.counterCapacity){this.reject('Counter full. Finish your current tray first.');return;}
        this.counter.push(this.carry);this.carry=null;
      }
      this.learn('stash');
      // Resolve the same cargo object after storage; its counter index may change.
      const action=a.storedCargo?'counter:'+this.counter.indexOf(a.storedCargo):a.intent.action;
      this.command(action);return;
    }
    if(a.orderId!=null&&(!t||t.orderId!==a.orderId||['empty','leaving'].includes(t.status))){if(a.kind==='handoff'&&g.run?.loads[g.run.index]===a.load){if(this.plated.delete(key(a.load)))this.dirty++;this.nextDelivery(g.run);}return;}
    if(a.kind==='task'){
      if(this.hands!=='empty'||t.step!==a.step||!['waiting','preparing','ready'].includes(t.status))return;
      const lesson=kitchenAction(g,'order:'+t.id)?.lesson;const active=t.status==='preparing'?g.activate(t):g.openOrder(t.id);if(active){this.learn(lesson);g.emit('kitchen_task');}return;
    }
    if(a.kind==='receive'){if(this.hands==='empty'&&g.openDelivery())g.emit('kitchen_task');return;}
    if(a.kind==='cook'){if(this.carry?.orderId===t.orderId&&this.carry.kind==='prepared'&&t.status==='prepared'){this.carry=null;this.learn('cook');g.queueCooking(t);g.emit('kitchen_loaded',{table:t.id});}return;}
    if(a.kind==='deposit'){if(this.carry?.kind==='supplies'){const cargo=this.carry;this.carry=null;g.finishDelivery(cargo.task);this.learn('deposit');this.sideRestock=false;}return;}
    if(a.kind==='pick'){
      const load=g.readyLoads().find(l=>key(l)===key(a));if(!load||this.carry)return;
      const fresh=!this.plated.has(key(load));if(fresh&&this.clean<1)return;
      if(g.chooseDish(load.tableId,load.part)){this.learn('pick');if(fresh){this.clean--;this.plated.add(key(load));}}return;
    }
    if(a.kind==='unload'){this.learn('stash');g.loaded=[];g.selectedDish=null;return;}
    if(a.kind==='wash'){if(g.openWashing())g.emit('kitchen_task');return;}
    if(a.kind==='stash'){if(this.carry&&this.counter.length<this.counterCapacity){this.counter.push(this.carry);this.carry=null;this.learn('stash');}return;}
    if(a.kind==='collect'){const index=this.counter.indexOf(a.cargo);if(index>=0&&this.hands==='empty'){this.carry=this.counter.splice(index,1)[0];this.learn('collect');}return;}
    if(a.kind==='walk'){this.learn('move');return;}
    if(a.kind==='handoff'){
      const run=g.run;if(!run||run.loads[run.index]!==a.load)return;
      g.handoff(a.load);if(g.state!=='playing'){this.route=[];this.pending=null;return;}
      this.nextDelivery(run);
    }
  }
  nextDelivery(run){const g=this.game;if(g.run!==run)return;run.index++;if(run.index<run.loads.length){const load=run.loads[run.index];this.travel(this.tablePoint(g.tables[load.tableId]),{kind:'handoff',tableId:load.tableId,orderId:load.orderId,load});}else g.run=null;}
  dispatch(run){const load=run.loads[0];this.travel(this.tablePoint(this.game.tables[load.tableId]),{kind:'handoff',tableId:load.tableId,orderId:load.orderId,load});}
  prepared(t){t.status='prepared';t.recipe=t.partyRecipes[0];this.carry={kind:'prepared',tableId:t.id,orderId:t.orderId,recipe:t.recipe};this.game.emit('kitchen_prepared',{table:t.id});}
  received(task){this.carry={kind:'supplies',task};this.learn('receive');this.game.emit('kitchen_received');}
  onServed(load){this.learn('serve');if(this.plated.delete(key(load)))this.dirty++;this.handoffs++;const t=this.game.tables[load.tableId];this.flow=(t.readyAge||0)<(this.game.config.difficulty==='challenge'?16:24)?this.flow+1:1;this.bestFlow=Math.max(this.bestFlow,this.flow);}
  invalidate(t){
    if(this.carry?.orderId===t.orderId)this.carry=null;this.counter=this.counter.filter(c=>c.orderId!==t.orderId);
    for(const k of [...this.plated])if(k.startsWith(t.orderId+':')){this.plated.delete(k);this.dirty++;}
    if(this.pending?.orderId===t.orderId&&!this.game.run){this.route=[];this.pending=null;this.autoStorage=null;}this.flow=0;
  }
  rinse(count){count=Math.min(this.dirty,count);if(count>0)this.busy={count,left:1.2,total:1.2};}
  summary(){return {washed:this.washed,handoffs:this.handoffs,bestFlow:this.bestFlow,moves:this.steps};}
  description(t){if(t.status==='waiting')return 'Take order';if(t.status==='preparing')return {recipe:'Prepare',ticket:'Fill ticket',repair:'Check note',tablet:'Read menu',conversation:'Talk to guest',pickup:'Match numbers'}[t.plan[t.step]?.setting]||'Continue';if(t.status==='prepared')return 'Load cooking';if(t.status==='cooking')return 'Cooking';if(t.status==='queued')return 'Prioritise';if(t.status==='ready')return t.step<t.plan.length?(t.plan[t.step].setting==='pickup'?(t.plan[t.step].pickupMode&&t.plan[t.step].pickupMode!=='numbers'?'Check labels':'Match numbers'):'Final check'):this.game.loaded.some(l=>l.orderId===t.orderId)?'Serve':'Pick up';return 'On its way';}
  guidance(){
    if(this.busy)return 'Washing a batch… Other dishes keep cooking.';
    if(this.game.run)return 'Delivering your load. Rewards arrive with the meal.';
    if(this.pending&&this.pending.kind!=='walk')return 'On the way. Tap another ticket to change your plan.';
    if(this.carry?.kind==='supplies')return 'Carry the labeled crate to Pantry to restock.';
    if(this.carry?.kind==='prepared')return 'Load this tray at its cooking station, or set it on Counter.';
    if(this.game.loaded.length)return this.game.equipped.has('trolley')&&this.game.loaded.length<2?'Pass can load a second meal. Tap the matching ticket to serve.':'Tap the matching ticket to serve. Counter returns your load to Pass.';
    if(!this.clean&&this.dirty)return 'Clean serving dishes are low. Wash a batch at Sink.';
    return 'Tap a ticket to walk and work. Tap the floor to move freely.';
  }
}
