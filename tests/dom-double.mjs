// Interaction stand-in, not a layout engine or rendered-browser test.
const decode=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
export class Element {
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset={};this.style={setProperty(k,v){this[k]=v;}};this.listeners=new Map();this.hidden=false;this.disabled=false;this.className='';this._text='';this.classList={add:(...v)=>this.classes(v,[]),remove:(...v)=>this.classes([],v),contains:v=>this.className.split(/\s+/).includes(v),toggle:(v,force)=>{const on=force??!this.classList.contains(v);this.classes(on?[v]:[],on?[]:[v]);return on;}};}
  classes(add,remove){this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean).filter(v=>!remove.includes(v)),...add])].join(' ');}
  setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}
  getAttribute(k){return this.attributes[k]??null;}
  addEventListener(k,fn,options={}){const a=this.listeners.get(k)||[];a.push({fn,capture:options===true||!!options.capture});this.listeners.set(k,a);}
  dispatch(k,event={}){
    event.target??=this;event.type=k;event._stopped=false;event._immediate=false;
    const prevent=event.preventDefault;event.preventDefault=()=>{event.defaultPrevented=true;prevent?.();};
    event.stopPropagation=()=>event._stopped=true;event.stopImmediatePropagation=()=>{event._stopped=true;event._immediate=true;};
    const path=[];for(let n=this;n;n=n.parentElement)path.push(n);
    const invoke=(n,capture)=>{event.currentTarget=n;for(const item of n.listeners.get(k)||[]){if(item.capture===capture)item.fn(event);if(event._immediate)break;}if(!capture&&!event._immediate&&k==='click')n.onclick?.(event);};
    for(const n of [...path].reverse()){invoke(n,true);if(event._stopped)return event;}
    for(const n of path){invoke(n,false);if(event._stopped)break;}return event;
  }
  click(event={detail:0}){for(let n=this;n;n=n.parentElement)if(n.disabled||n.inert||n.hidden)return;return this.dispatch('click',event);}
  root(){let n=this;while(n.parentElement)n=n.parentElement;return n;}
  setPointerCapture(id){const root=this.root();root.captures??=new Map();root.captures.set(id,this);}
  releasePointerCapture(id){const root=this.root();if(root.captures?.get(id)===this){root.captures.delete(id);this.dispatch('lostpointercapture',{pointerId:id});}}
  focus(){}getContext(){return null;}
  append(...nodes){for(const n of nodes){if(n.parentElement)n.remove();n.parentElement=this;this.children.push(n);}}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.parentElement=null;}
  matches(selector){
    if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));
    if(selector.includes(' ')){const parts=selector.trim().split(/\s+/),last=parts.pop();return this.matches(last)&&!!this.parentElement?.closest(parts.join(' '));}
    if(selector.includes(':not(:disabled)')&&this.disabled)return false;selector=selector.replace(':not(:disabled)','');
    const tag=selector.match(/^[a-z]+/i)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;
    for(const [,id]of selector.matchAll(/#([\w-]+)/g))if(this.id!==id)return false;
    for(const [,c]of selector.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(c))return false;
    for(const [,k,v]of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g))if(!(k in this.attributes)||v!==undefined&&this.attributes[k]!==v)return false;
    return true;
  }
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  querySelectorAll(selector){const a=[];for(const child of this.children){if(child.matches(selector))a.push(child);a.push(...child.querySelectorAll(selector));}return a;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  set textContent(v){this._text=String(v);this.children=[];}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
  set innerHTML(html){
    this.children=[];this._text='';this._html=html;const stack=[this];
    for(const token of html.match(/<[^>]+>|[^<]+/g)||[]){
      if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}
      if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const node=new Element(tag);for(const a of token.slice(tag.length+1).matchAll(/([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))node.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).append(node);if(!/\/$/.test(token.slice(0,-1))&&!['IMG','INPUT','BR','HR','META','LINK','PATH'].includes(node.tagName))stack.push(node);
      }else stack.at(-1)._text+=decode(token);
    }
  }
  get innerHTML(){return this._html||'';}
  getBoundingClientRect(){
    if(this.rect)return this.rect;const m=this.style.transform?.match(/matrix\((.*)\)/)?.[1].split(',').map(Number),w=parseFloat(this.style.width)||100,h=parseFloat(this.style.height)||50;
    const points=m?[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]})):[{x:0,y:0},{x:w,y:h}];
    const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));return {left,top,right,bottom,width:right-left,height:bottom-top};
  }
}
export function documentDouble(){const body=new Element('body');body.innerHTML='<div id="play"><div id="task-card"></div><button id="station-action"></button></div>';return {body,getElementById:id=>body.querySelector('#'+id),createElement:tag=>new Element(tag),querySelectorAll:s=>body.querySelectorAll(s)};}

// Dispatch a browser-like captured pointer and its implicit capture release.
// Geometry is still a stand-in; this deliberately does not claim browser QA.
export function firePointer(node,type,event={}){
  const root=node.root(),id=event.pointerId??1,target=root.captures?.get(id)||node;
  const e={clientX:0,clientY:0,pointerId:id,pointerType:'touch',isPrimary:true,button:0,cancelable:true,...event};
  target.dispatch(type,e);
  if(type==='pointerup'||type==='pointercancel'){const captured=root.captures?.get(id);root.captures?.delete(id);captured?.dispatch('lostpointercapture',{pointerId:id});}
  return e;
}
