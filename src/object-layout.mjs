import * as THREE from 'three';
import {browserTextMeasure,menuPageLayout,listeningPageLayout,paperLabelLayout,deliveryPageLayout,recipeNoteLayout,conversationPageLayout,terminalPageLayout,receiptPageLayout,washingPageLayout,sortLabelLayout} from './page-fit.mjs';

// These are CSS pixels, including the space reserved for browser-safe controls.
function safeInset(edge){
  if(typeof getComputedStyle!=='function'||typeof document==='undefined')return 0;
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bistro-safe-'+edge))||0;
}
export function stationViewport(width,height,setting='tablet'){
  const wide=width>height*1.4,menu=['tablet','pickup'].includes(setting),margin=Math.max(width<380?12:18,safeInset('left')+8,safeInset('right')+8),top=Math.max(height<500?62:82,safeInset('top')+54),bottom=(menu?(wide&&height<500?12:64):(wide&&height<500?(setting==='recipe'?36:48):(height<500?76:80)))+safeInset('bottom');
  const w=Math.min(width-margin*2,menu?(wide?760:520):setting==='recipe'||setting==='delivery'?760:520);
  return {x:(width-w)/2,y:top,width:w,height:Math.max(160,height-top-bottom)};
}
export function surfaceCorners({mesh,width,height}){
  mesh.updateWorldMatrix(true,false);
  return [[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>mesh.localToWorld(new THREE.Vector3(x*width,y*height,.004)));
}
export function projectSurface(surface,camera,width,height){
  return surfaceCorners(surface).map(p=>{p.project(camera);return {x:(p.x*.5+.5)*width,y:(.5-p.y*.5)*height};});
}
export function surfaceTransform(points){
  const [a,b,,d]=points,width=Math.hypot(b.x-a.x,b.y-a.y),height=Math.hypot(d.x-a.x,d.y-a.y);
  if(width<1||height<1||!points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;
  return {width,height,matrix:[(b.x-a.x)/width,(b.y-a.y)/width,(d.x-a.x)/height,(d.y-a.y)/height,a.x,a.y]};
}
export function fitSurfaceCamera(surface,width,height,{setting='tablet',offset=null}={}){
  const corners=surfaceCorners(surface),center=corners.reduce((p,v)=>p.add(v),new THREE.Vector3()).multiplyScalar(.25);
  const surfaceRight=corners[1].clone().sub(corners[0]).normalize(),surfaceUp=corners[0].clone().sub(corners[3]).normalize(),normal=surfaceRight.clone().cross(surfaceUp).normalize();
  const direction=setting==='tablet'?normal.clone().multiplyScalar(offset?new THREE.Vector3(...offset).length():8):offset?new THREE.Vector3(...offset):normal.clone().multiplyScalar(8);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,90);if(setting==='tablet')camera.up.copy(surfaceUp);camera.position.copy(center).add(direction);camera.lookAt(center);camera.updateMatrixWorld();
  const local=corners.map(p=>p.clone().applyMatrix4(camera.matrixWorldInverse)),xs=local.map(p=>p.x),ys=local.map(p=>p.y),rect=stationViewport(width,height,setting);
  const viewHeight=Math.max((Math.max(...ys)-Math.min(...ys))*height/rect.height,(Math.max(...xs)-Math.min(...xs))*height/rect.width),viewWidth=viewHeight*width/height;
  const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  const target=center.clone().addScaledVector(right,-((rect.x+rect.width/2)/width-.5)*viewWidth).addScaledVector(up,((rect.y+rect.height/2)/height-.5)*viewHeight);
  return {left:-viewWidth/2,right:viewWidth/2,top:viewHeight/2,bottom:-viewHeight/2,target,position:target.clone().add(direction),up:camera.up.clone()};
}
export function insideRect(x,y,rect,padding=0){return !!rect&&x>=rect.left-padding&&x<=rect.right+padding&&y>=rect.top-padding&&y<=rect.bottom+padding;}

export class ObjectStationUI {
  constructor(root,getView){this.root=root;this.getView=getView;this.ready=true;}
  open(){this.active=true;this.objectNodes=null;this.layoutKey='';this.inkScale=1;this.auditRetries=0;this.auditPending=false;this.root.classList.add('object-ui');this.update();if(typeof document!=='undefined'&&!this.fontWatchRegistered){this.fontWatchRegistered=true;const probe=browserTextMeasure(this.root)('responsibility büyükbaba',16);document.fonts?.ready.then(()=>{if(!this.active)return;this.layoutKey='';if(Math.abs(browserTextMeasure(this.root)('responsibility büyükbaba',16)-probe)>.1)this.getView()?.onStationResize?.();else this.update();});}}
  close(){this.active=false;this.ready=true;}
  update(){
    if(!this.active)return;const view=this.getView(),station=view?.station;if(!station)return;
    this.ready=view.stationReady?.()!==false;const moving=String(!this.ready);for(const n of this.root.querySelectorAll('.conversation-replies,.guest-question'))if(n.inert!==!this.ready)n.inert=!this.ready;if(this.root.dataset.moving!==moving)this.root.dataset.moving=moving;
    if(!this.objectNodes||!this.layoutKey)this.objectNodes=[...this.root.querySelectorAll('[data-object]')];
    const revision=view.projectionRevision||0,project=revision!==this.projectedRevision||!this.ready||station.dragging||station.motions?.length||this.hadMotions||!this.layoutKey;
    if(project)for(const node of this.objectNodes){
      const points=view.projectObject?.(node.dataset.object),t=points&&surfaceTransform(points);if(!t)continue;
      node.classList.add('object-surface');const w=Math.round(t.width*10)/10+'px',h=Math.round(t.height*10)/10+'px';if(node.style.width!==w)node.style.width=w;if(node.style.height!==h)node.style.height=h;
      const matrix='matrix('+t.matrix.map(v=>Math.round(v*1000)/1000).join(',')+')';if(node.style.transform!==matrix)node.style.transform=matrix;
      if(node.inert!==!this.ready)node.inert=!this.ready;
    }
    const receipt=this.root.querySelector('[data-object="receipt"]');if(receipt&&!receipt.hidden){
      const p=station.receiptProgress??1,height=parseFloat(receipt.style.height)||0,offset=(1-p)*height;
      receipt.style.clipPath=`inset(${offset}px 0 0 0)`;const ink=receipt.querySelector('.receipt-ink');if(ink)ink.style.translate=`0 ${offset}px`;
    }
    this.projectedRevision=revision;this.hadMotions=!!station.motions?.length;
    if(this.ready&&!station.dragging){const fitted=this.fitPages(station);if(!fitted&&this.auditPending)this.auditPage();}
    for(const node of this.root.querySelectorAll('.surface-scroll')){
      const below=node.scrollHeight-node.clientHeight-(node.scrollTop||0)>8,above=(node.scrollTop||0)>8,state=below?(above?'both':'below'):(above?'above':'none');
      if(node.dataset.scrollState!==state)node.dataset.scrollState=state;
    }
    if(project&&station.context?.setting==='ticket'&&!station.dragging&&!station.paperPivot?.userData.returning){
      const paper=view.projectObject('main'),clip=view.projectObject('clip');
      if(paper&&clip){const clearance=Math.max(48,Math.max(...clip.map(p=>p.y))-Math.min(...paper.map(p=>p.y))-2);this.root.style.setProperty('--clip-clearance',Math.round(clearance)+'px');}
    }
  }
  fitPages(station){
    const main=this.root.querySelector('[data-page]'),labels=[...this.root.querySelectorAll('[data-block]')],view=this.getView(),key=[station.context.task.id,station.sortIndex,this.root.querySelector('#sort-meaning')?.hidden,view?.container?.clientWidth,view?.container?.clientHeight,main?.style.width,main?.style.height,this.root.dataset.stage,this.root.style.getPropertyValue?.('--clip-clearance'),...labels.map(n=>n.style.width+':'+n.style.height)].join('|');if(key===this.layoutKey)return false;this.layoutKey=key;
    const nativeMeasure=browserTextMeasure(this.root),measure=(text,size)=>nativeMeasure(text,size*this.inkScale),task=station.context.task;
    if(main){const width=parseFloat(main.style.width)-2,height=parseFloat(main.style.height)-2;let p;
      if(main.dataset.page==='wash'){p=washingPageLayout({width,height,blocks:task.blocks,order:station.context.order,measure});main.style.setProperty('--wash-font',p.font+'px');const plate=this.root.querySelector('#washing-plate');for(const [k,v]of Object.entries(p.plate))plate.style[k==='x'?'left':k==='y'?'top':k]=v+'px';for(const r of p.rects){const n=this.root.querySelector('[data-wash-block="'+r.index+'"]');if(n)for(const key of ['x','y','width','height'])n.style[key==='x'?'left':key==='y'?'top':key]=r[key]+'px';}}
      if(main.dataset.page==='matching')p=menuPageLayout({width,height,pairs:task.pairs,mode:task.mode,measure});
      if(main.dataset.page==='listening')p=listeningPageLayout({width,height,options:station.context.options,requested:!!task.requested,supportText:task.requested?task.requested.map(p=>p.word).join(' + '):task.answer,measure});
      if(main.dataset.page==='delivery')p=deliveryPageLayout({width,height,prompt:task.prompt,options:station.context.options,measure,preferredColumns:station.receivingLayout?.labelLayout?.columns,compactPaper:!!station.receivingLayout?.labelLayout,minimumRowHeight:station.receivingLayout?.labelLayout?.rowHeight||0});
      if(main.dataset.page==='ticket'||main.dataset.page==='checkout'){const touch=(view?.container?.clientWidth??globalThis.innerWidth??1024)<760||!!globalThis.matchMedia?.('(pointer:coarse)').matches;main.dataset.thumb=String(touch);p=terminalPageLayout({width,height,task,options:station.context.options,stage:this.root.dataset.stage,clip:parseFloat(this.root.style.getPropertyValue?.('--clip-clearance'))||48,touch,measure});}
      if(p){if(main.dataset.page==='delivery')main.querySelectorAll('.label-choice').forEach((node,i)=>{node.style.gridColumn=String(i%p.columns+1);node.style.gridRow=String(Math.floor(i/p.columns)+1);});main.dataset.fit=String(p.fits);main.dataset.flow=p.flow||'grid';main.dataset.chrome=p.chrome||'full';for(const [k,v]of Object.entries(p))if(typeof v==='number')main.style.setProperty('--page-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),v+'px');main.style.setProperty('--page-columns',String(p.columns));main.style.setProperty('--page-rows',String(p.rows));main.style.setProperty('--pair-count',String(task.pairs?.length||p.rows));this.auditPending=true;}
    }
    const sort=this.root.querySelector('#sort-card');if(sort){const card=task.cards[station.sortIndex||0]||{word:'Delivery organised',translation:''},p=sortLabelLayout({width:parseFloat(sort.style.width),height:parseFloat(sort.style.height),word:card.word,translation:card.translation,showMeaning:this.root.querySelector('#sort-meaning')?.hidden===false,measure});sort.dataset.fit=String(p.fits);for(const [k,v]of Object.entries(p))if(typeof v==='number')sort.style.setProperty('--sort-'+k,v+'px');}
    const receipt=this.root.querySelector('[data-object="receipt"]');if(receipt){const p=receiptPageLayout({width:parseFloat(receipt.style.width)-2,height:parseFloat(receipt.style.height)-6,text:receipt.querySelector('.receipt-sentence')?.textContent||'',measure});receipt.dataset.fit=String(p.fits);for(const [key,value]of Object.entries(p))if(typeof value==='number')receipt.style.setProperty('--receipt-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value+'px');}
    for(const node of labels){const index=+node.dataset.block,position=station.context.order.indexOf(index),r=station.prepLayout?.sources[position]?.label,p=paperLabelLayout(task.blocks[index],r?.width||parseFloat(node.style.width),r?.height||parseFloat(node.style.height),measure);node.style.setProperty('--label-font',p.font+'px');node.style.setProperty('--label-line',p.lineHeight+'px');node.dataset.fit=String(p.fits);}
    if(station.prepLayout){const note=this.root.querySelector('.recipe-note'),r=station.prepLayout.note,p=recipeNoteLayout({width:r.width,height:r.height,task,compact:station.prepLayout.mode!=='columns',measure});note?.style.setProperty('--note-font',p.font+'px');if(note)note.dataset.fit=String(p.fits);}
    if(task.kind==='question'&&view?.container){const r=stationViewport(view.container.clientWidth,view.container.clientHeight,'conversation'),p=conversationPageLayout({width:r.width,height:r.height,task,options:station.context.options,measure}),question=this.root.querySelector('.guest-question'),replies=this.root.querySelector('.conversation-replies');if(question&&replies){question.style.left=r.x+'px';question.style.top=r.y+'px';question.style.width=p.questionWidth+'px';question.style.right='auto';question.style.setProperty('--question-font',p.questionFont+'px');question.style.setProperty('--question-padding',p.questionPadding+'px');replies.style.left=r.x+p.replyX+'px';replies.style.right='auto';replies.style.width=p.replyWidth+'px';replies.style.bottom='auto';replies.style.top=r.y+(p.arrangement==='split'?(r.height-p.replyHeight)/2:r.height-p.replyHeight)+'px';replies.style.height=p.replyHeight+'px';replies.style.gridTemplateColumns=`repeat(${p.columns},minmax(0,1fr))`;replies.style.gridAutoRows=p.rowHeight+'px';replies.style.gap=p.gap+'px';replies.style.setProperty('--reply-padding',p.padding+'px');replies.style.setProperty('--reply-font',p.font+'px');this.root.dataset.conversationFit=String(p.fits);}}
    return true;
  }
  auditPage(){
    this.auditPending=false;const main=this.root.querySelector('[data-page]');if(!main?.clientHeight)return;
    const bounds=main.getBoundingClientRect();let overflow=false;
    for(const node of main.querySelectorAll('button,.pair-label,.pair-image-fallback,.label-text,.task-feedback')){
      const r=node.getBoundingClientRect();if(!r.width||!r.height)continue;
      if(r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1)overflow=true;
      if(node.tagName==='BUTTON'){const ink=node.querySelector('.pair-label,.pair-image-fallback,.label-text')?.getBoundingClientRect();if(ink&&(ink.top<r.top+2||ink.bottom>r.bottom-2||ink.left<r.left+2||ink.right>r.right-2))overflow=true;}
    }
    main.dataset.overflow=String(overflow);
    if(overflow&&this.auditRetries<2){this.inkScale*=1.07;this.auditRetries++;this.layoutKey='';}
  }
}
