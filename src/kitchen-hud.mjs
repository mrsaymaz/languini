import {taskIdentity,tableIdentity,intentIdentity,applyIdentity,identityAttributes} from './task-identity.mjs';
import {MIN_ZOOM,MAX_ZOOM,overviewEvents,edgeMarkers} from './overview-navigation.mjs';
import {ticketStateIcon} from './presentation.mjs';
import {icon} from './icons.mjs';
import {RECIPES} from './menu.mjs';
// Plain names for the carry line: "Table 2" rather than the ticket code.
const tableName=t=>t?.pickup?'Pickup #'+t.orderId:'Table '+(t.id+1);
import {cleanKitchenHelp,kitchenAction,kitchenTarget,kitchenTip,orderName,placeKitchenBadge,kitchenWorldActions,shortKitchenLabel,placeWorldBadges,simpleKitchenAction,simpleKitchenLabel,simpleKitchenScreen} from './kitchen-signifiers.mjs';
const jobToken=id=>id.key==='neutral'?'':'<small class="job-token">'+id.label+'</small>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class KitchenHUD {
  constructor(root,{command,tea}){
    this.root=root;this.command=command;this.tea=tea;this.signature='';
    this.orders=document.createElement('div');this.orders.className='kitchen-orders';this.orders.setAttribute('role','group');this.orders.setAttribute('aria-label','Kitchen tickets');
    this.leader=document.createElement('div');this.leader.className='kitchen-leader';this.leader.setAttribute('aria-hidden','true');this.leader.innerHTML='<svg width="100%" height="100%"><path fill="none"/></svg>';
    this.sign=document.createElement('button');this.sign.type='button';this.sign.className='kitchen-destination';this.sign.hidden=true;
    this.worldActions=document.createElement('div');this.worldActions.className='kitchen-world-actions';this.worldActions.setAttribute('role','group');this.worldActions.setAttribute('aria-label','Restaurant tasks');root.append(this.worldActions);this.carry=document.createElement('div');this.carry.className='kitchen-carry';this.carry.setAttribute('role','status');
    this.hint=document.createElement('p');this.hint.id='kitchen-guidance';this.hint.className='kitchen-hint';this.hint.setAttribute('role','status');this.hint.setAttribute('aria-live','polite');
    this.dock=document.createElement('nav');this.dock.className='kitchen-dock';this.dock.setAttribute('aria-label','Kitchen stations');root.append(this.orders,this.leader,this.sign,this.carry,this.hint,this.dock);
    this.camera=document.createElement('nav');this.camera.className='overview-controls';this.camera.setAttribute('aria-label','Restaurant camera');this.camera.title='Zoom the restaurant. Drag empty floor to pan.';
    this.camera.innerHTML='<button type="button" class="camera-quick-reset" data-camera="reset" aria-label="Reset view" hidden>'+icon('reset')+'</button><button type="button" class="camera-toggle" aria-label="Camera controls" aria-expanded="false">'+icon('camera')+'</button><div class="camera-tools"><button type="button" data-camera="out" aria-label="Zoom out">−</button><output aria-label="Camera zoom">100%</output><button type="button" data-camera="in" aria-label="Zoom in">+</button><button type="button" data-camera="reset" aria-label="Reset view">'+icon('reset')+'</button></div>';
    this.markers=document.createElement('div');this.markers.className='overview-markers';this.markers.setAttribute('role','group');this.markers.setAttribute('aria-label','Off-screen activity');root.append(this.camera,this.markers);
    this.camera.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!this.view)return;if(b.classList.contains('camera-toggle')){const open=this.camera.dataset.open!=='true';this.camera.dataset.open=String(open);b.setAttribute('aria-expanded',String(open));}else if(b.dataset.camera==='reset')this.view.resetOverview();else this.view.zoomOverview(b.dataset.camera==='in'?.05:-.05);this.position(this.game,this.view);});
    this.markers.addEventListener('click',e=>{const b=e.target.closest('[data-edge]'),m=this.activeMarkers?.find(m=>m.kind===b?.dataset.edge);if(m&&this.view){this.view.revealOverviewPoint(m.point,this.visibilityRect);this.position(this.game,this.view);}});
    root.addEventListener('click',e=>{const b=e.target.closest('[data-kitchen]');if(b&&!b.disabled){if(b.dataset.kitchen==='tea')tea();else command(b.dataset.kitchen);}});
  }
  update(game,view){
    const k=game?.kitchen;this.root.hidden=!k||game.closingService||game.focused||game.paused||game.state!=='playing';if(this.root.hidden)return;
    this.game=game;this.view=view;this.simple=simpleKitchenScreen(view?.container?.clientWidth??globalThis.innerWidth??1024,globalThis.matchMedia?.('(pointer:coarse)').matches);this.root.dataset.simple=String(this.simple);const target=kitchenTarget(game);this.target=target;applyIdentity(this.root,intentIdentity(game,target));applyIdentity(this.sign,intentIdentity(game,target));applyIdentity(this.carry,intentIdentity(game,target));
    const help=cleanKitchenHelp(k.help),firstUse=target?.lesson&&(help.mode==='always'||help.mode==='auto'&&!help.seen.includes(target.lesson));
    const tables=game.tables.filter(t=>!['empty','leaving'].includes(t.status));
    const signature=JSON.stringify([this.simple,k.carry?.kind,k.carry?.orderId,game.loaded.map(l=>l.orderId+':'+l.part),k.counter.map(c=>c.kind+':'+c.orderId)])+tables.map(t=>[t.id,t.orderId,t.status,t.step,k.description(t),t.recipe,k.selected===t.id].join(':')).join('|');
    if(this.signature!==signature){this.signature=signature;this.orders.innerHTML=tables.map(t=>'<button type="button" class="kitchen-ticket" '+identityAttributes(tableIdentity(t))+' data-kitchen="order:'+t.id+'" data-state="'+t.status+'" aria-pressed="'+(k.selected===t.id)+'"><span class="ticket-id"><span class="ticket-identity">'+esc(orderName(t))+'</span><i class="ticket-state">'+icon(kitchenAction(game,'order:'+t.id)?.icon||ticketStateIcon(t.status))+esc(k.description(t))+'</i></span><b>'+esc(t.partySize===2?t.partyRecipes.map(r=>RECIPES[r].name).join(' + '):RECIPES[t.recipe].name)+'</b><small>'+esc(t.name)+' · '+t.step+' of '+t.plan.length+' steps</small></button>').join('');}
    for(const t of tables){const button=this.orders.querySelector('[data-kitchen="order:'+t.id+'"]');if(button){button.style.setProperty('--ticket-progress',String(t.status==='cooking'?1-t.cookLeft/t.cookTotal:t.patience/t.maxPatience));button.dataset.recommended=String(target?.orderId===t.orderId&&!!target.action);button.dataset.firstUse=String(!!firstUse);button.disabled=!!k.busy||!!game.run||this.simple&&!simpleKitchenAction(game,'order:'+t.id)?.available;}}
    const cargo=k.carry,t=cargo?.tableId!=null?game.tables[cargo.tableId]:null;
    const load=cargo?.kind==='supplies'?'Carrying a crate to the Pantry':cargo?.kind==='prepared'?'Carrying '+tableName(t)+'’s tray to Cook':game.loaded.length?'Carrying '+game.loaded.map(l=>tableName(game.tables[l.tableId])).join(' + ')+'’s meal':game.run?'Serving meals':'Hands empty';
    const state=load+' · '+k.clean+' clean plate'+(k.clean===1?'':'s')+' · '+k.dirty+' to wash'+(k.flow>1?' · Flow ×'+k.flow:'');if(this.carry.textContent!==state)this.carry.textContent=state;
    const copy=kitchenTip(game,target);if(this.hint.textContent!==copy)this.hint.textContent=copy;this.hint.dataset.blocked=String(!!k.notice);this.hint.dataset.firstUse=String(!!firstUse);
    const signKey=JSON.stringify([target?.action,target?.label,target?.station,target?.identity,!!firstUse,!!target?.travelling,!!target?.automatic]);
    this.sign.hidden=!target;this.leader.hidden=!target;
    if(target&&this.signKey!==signKey){this.signKey=signKey;this.sign.innerHTML='<span class="destination-icon">'+icon(target.icon)+'</span><span><small>'+esc(target.station)+(target.identity?' · '+esc(target.identity):'')+'</small><b>'+esc(target.travelling?'Walking…':target.label)+'</b></span>'+(!target.automatic?icon('arrow'):'');this.sign.setAttribute('data-kitchen',target.action||'');this.sign.disabled=!target.action||!target.available;this.sign.setAttribute('aria-label',target.label+' at '+target.station+(target.identity?', '+target.identity:''));this.sign.setAttribute('aria-describedby','kitchen-guidance');this.sign.dataset.firstUse=String(!!firstUse);}
    const work=target?.action?target:null,pass=kitchenAction(game,'pass'),supply=kitchenAction(game,cargo?.kind==='supplies'?'pantry':'receiving'),counter=kitchenAction(game,'counter'),wash=kitchenAction(game,'sink');
    let buttons=[['work',work?.label||(game.run?'Delivering':k.busy?'Washing':'Cooking…'),work?.icon||'clock',work],['pass',game.loaded.length&&game.equipped.has('trolley')&&game.loaded.length<2&&pass?.lesson==='pick'?'Load 2nd':game.loaded.length?'Return meals':'Pass',game.equipped.has('trolley')?'trolley':'serve',pass],[cargo?.kind==='supplies'?'pantry':'receiving',cargo?.kind==='supplies'?'Pantry':'Supplies',cargo?.kind==='supplies'?'pantry':'crate',supply],['counter',counter?.label||'Counter','counter',counter],['sink',k.busy?'Washing…':'Wash '+k.dirty,'sink',wash],['tea','Tea · 25','cup',null]];
    if(this.simple)buttons=[['work',work?simpleKitchenLabel(work):target?.label||(game.run?'Delivering…':k.busy?'Washing…':'Cooking…'),work?.icon||target?.icon||'clock',work]];
    const dockKey=String(this.simple)+intentIdentity(game,target).key+intentIdentity(game,target).label+JSON.stringify(buttons.map(([a,l,i,intent])=>[a,l,i,intent?.reason,intent?.action,intentIdentity(game,intent).key,intentIdentity(game,intent).label]))+!!k.busy+!!game.run;
    if(this.dockKey!==dockKey){this.dockKey=dockKey;this.dock.innerHTML=buttons.map(([action,label,glyph,intent])=>'<button type="button" data-kitchen="'+action+'" '+identityAttributes(intentIdentity(game,intent||(action==='work'?target:null)))+' data-available="'+(action==='tea'||!!intent?.available)+'" '+(k.busy||game.run||action==='work'&&!work?'disabled':'')+' aria-describedby="kitchen-guidance" aria-label="'+esc(label+(intentIdentity(game,intent).key!=='neutral'?' · '+intentIdentity(game,intent).label:''))+'" title="'+esc(intent?.reason||(intent?intent.label+' · '+intent.station:label))+'">'+icon(glyph)+'<span class="dock-full">'+esc(label)+'</span><span class="dock-short">'+esc(action==='sink'?'Wash '+k.dirty:action==='receiving'?'Stock':action==='counter'?'Hold':this.simple?label:shortKitchenLabel(label))+'</span>'+jobToken(intentIdentity(game,intent||(action==='work'?target:null)))+'</button>').join('');}
    const busy=this.dock.querySelector('[data-kitchen="sink"]');if(busy)busy.style.setProperty('--wash',k.busy?1-k.busy.left/k.busy.total:0);
    if(view)this.position(game,view);
  }
  position(game,view){
    if(!this.root.hidden&&view){this.positionNavigation(game,view);this.positionWorldActions(game,view);}
    if(this.root.hidden||!this.target||!view?.projectKitchenPoint)return;
    
    this.sign.hidden=false;this.leader.hidden=false;
    const w=view.container.clientWidth,h=view.container.clientHeight;if(!w||!h)return;
    // The compact phone already has the same action in its ticket and dock.
    // Keep the floating guidance card out of the tiny restaurant playfield.
    if(w<760&&h<600){this.sign.hidden=true;this.leader.hidden=true;return;}
    const point=view.projectKitchenPoint(this.target.point);if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)){this.sign.hidden=true;this.leader.hidden=true;return;}
    const rail=this.orders.getBoundingClientRect(),viewport=view.container.getBoundingClientRect(),landscape=h<450&&w/h>1.4;
    const inset=typeof getComputedStyle==='function'?getComputedStyle(document.documentElement):null;
    const safeLeft=parseFloat(inset?.getPropertyValue('--safe-left'))||0,safeRight=parseFloat(inset?.getPropertyValue('--safe-right'))||0;
    const hintTop=this.hint.getBoundingClientRect().top-viewport.top;
    const box=placeKitchenBadge(point,w,h,{top:Math.max(landscape?126:204,Math.min(h*.45,rail.bottom-viewport.top+8)),bottom:!landscape&&hintTop>204?Math.min(h-178,hintTop-8):undefined,left:12+safeLeft,right:12+safeRight});
    if(w<760&&!landscape){box.x=w/2;box.y=rail.bottom-viewport.top+8+box.height/2;}
    this.sign.style.left=box.x+'px';this.sign.style.top=box.y+'px';this.sign.style.width=box.width+'px';
    const endY=point.y>box.y?box.y+box.height/2:box.y-box.height/2;
    this.leader.querySelector('path')?.setAttribute('d','M '+box.x+' '+endY+' L '+point.x+' '+point.y);
  }
  positionNavigation(game,view){
    const w=view.container.clientWidth,h=view.container.clientHeight,viewport=view.container.getBoundingClientRect(),rail=this.orders.getBoundingClientRect(),dock=this.dock.getBoundingClientRect(),hint=w<760&&this.hint.dataset.blocked!=='true'?{top:dock.top-34}:this.hint.getBoundingClientRect();
    const landscape=h<450&&w/h>1.4,controlsTop=Math.max(rail.bottom-viewport.top+8,(landscape?dock.top:hint.top)-viewport.top-54);
    this.camera.style.top=controlsTop+'px';
    const state=view.overview||{zoom:1,x:0,y:0},changed=view.overviewChanged?view.overviewChanged():Math.abs(state.zoom-1)>.001||!!state.x||!!state.y;
    this.camera.querySelector('output').textContent=Math.round(state.zoom*100)+'%';this.camera.querySelector('[data-camera=out]').disabled=state.zoom<=MIN_ZOOM+.0001;this.camera.querySelector('[data-camera=in]').disabled=state.zoom>=MAX_ZOOM-.0001;for(const b of this.camera.querySelectorAll('[data-camera=reset]'))b.hidden=!changed;
    // Marker centres leave a full finger target inside the unobstructed field.
    const top=rail.bottom-viewport.top+30,bottom=Math.max(top+54,controlsTop-30);
    this.markerRect={left:32,right:w-32,top,bottom};
    const cameraBox=this.camera.getBoundingClientRect();
    this.visibilityRect={left:8,right:w-8,top:rail.bottom-viewport.top+4,bottom:(landscape?dock.top:hint.top)-viewport.top-8};
    this.activeMarkers=edgeMarkers(overviewEvents(game),p=>view.projectKitchenPoint(p),this.markerRect,{visibleRect:this.visibilityRect,occlusions:[{left:cameraBox.left-viewport.left,right:cameraBox.right-viewport.left,top:cameraBox.top-viewport.top,bottom:cameraBox.bottom-viewport.top}]});
    const key=this.activeMarkers.map(m=>[m.kind,m.count,m.urgent,m.label,m.tableId,m.orderId].join(':')).join('|');
    if(key!==this.markerKey){this.markerKey=key;this.markers.innerHTML=this.activeMarkers.map(m=>'<button type="button" '+identityAttributes(m.count===1?intentIdentity(game,{tableId:m.tableId,action:m.kind==='supplies'?'receiving':null}):taskIdentity({kind:m.kind==='supplies'?'supplies':m.kind==='pickup'?'pickup':null}))+' data-edge="'+m.kind+'" data-urgent="'+m.urgent+'" aria-label="'+esc(m.label+(m.count>1?', '+m.count+' orders':'')+'. Show location')+'" title="'+esc(m.label)+'">'+icon(m.icon)+'<b>'+(m.count>1?m.count:'')+'</b><span class="edge-arrow">'+icon('arrow')+'</span></button>').join('');}
    for(const m of this.activeMarkers){const b=this.markers.querySelector('[data-edge="'+m.kind+'"]');b.style.left=m.x+'px';b.style.top=m.y+'px';b.querySelector('.edge-arrow').style.transform='rotate('+m.angle+'deg)';}
  }
  positionWorldActions(game,view){
    const items=kitchenWorldActions(game,{simple:this.simple}),key=JSON.stringify([this.simple,this.target?.action,items.map(a=>[a.action,a.label,a.identity,a.count,intentIdentity(game,a).key,intentIdentity(game,a).label,!!game.kitchen.busy,!!game.run])]);
    if(key!==this.worldActionKey){this.worldActionKey=key;this.worldActions.innerHTML=items.map(a=>'<button type="button" data-kitchen="'+a.action+'" '+identityAttributes(intentIdentity(game,a))+' data-world-action="'+a.action+'" data-primary="'+(a.action===this.target?.action)+'" aria-label="'+esc(a.label+(a.identity?' · '+a.identity:''))+'" title="'+esc(a.label+(a.identity?' · '+a.identity:''))+'" '+(game.kitchen.busy||game.run?'disabled':'')+'>'+icon(a.icon)+'<span class="job-copy"><b>'+esc(this.simple&&['cook','deposit','collect','serve'].includes(a.lesson)?simpleKitchenLabel(a):a.lesson==='wash'?'Wash':shortKitchenLabel(a.label))+'</b>'+jobToken(intentIdentity(game,a))+'</span>'+(a.count>1?'<i>'+a.count+'</i>':'')+'</button>').join('');}
    const w=view.container.clientWidth,h=view.container.clientHeight,rect=this.visibilityRect||{left:8,right:w-8,top:120,bottom:h-100},visible=[];
    for(const a of items){const n=this.worldActions.querySelector('[data-world-action="'+a.action+'"]'),point=view.projectKitchenPoint(a.badgePoint||a.point);if(!n||!point)continue;
      n.hidden=point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom;if(n.hidden)continue;
      visible.push({node:n,x:point.x,y:point.y,width:Math.min(90,Math.max(68,n.offsetWidth||76)),height:Math.max(44,n.offsetHeight||44)});
    }
    const viewport=view.container.getBoundingClientRect(),camera=this.camera.getBoundingClientRect(),avoid=[{left:camera.left-viewport.left,right:camera.right-viewport.left,top:camera.top-viewport.top,bottom:camera.bottom-viewport.top}];
    for(const p of placeWorldBadges(visible,rect,avoid)){p.node.style.left=p.x+'px';p.node.style.top=p.y+'px';}
  }
  hide(){this.root.hidden=true;this.signature='';this.dockKey='';this.signKey='';this.target=null;}
}
