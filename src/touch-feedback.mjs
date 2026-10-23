// Visual feedback owns no answers, attempts or gameplay timers.
export class TouchFeedback {
 constructor({reduced=()=>false}={}){this.reduced=reduced;this.flights=new Set();}
 fly(node,target,{returning=false}={}){
  if(!node||!target||this.reduced()||!node.animate)return false;
  const a=node.getBoundingClientRect(),b=target.getBoundingClientRect();if(!a.width||!b.width)return false;
  const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
  node.setAttribute('aria-hidden','true');node.style.pointerEvents='none';
  const animation=node.animate([{translate:'0px 0px',scale:'1',opacity:1},{translate:`${dx}px ${dy}px`,scale:returning?'1':'0.88',opacity:returning?1:.7}],{duration:returning?220:180,easing:'cubic-bezier(.2,.75,.25,1)',fill:'forwards'});
  const entry={node,animation};this.flights.add(entry);const finish=()=>{node.remove();this.flights.delete(entry);};animation.finished.then(finish,finish);return true;
 }
 clear(){for(const {node,animation}of this.flights){animation.cancel();node.remove();}this.flights.clear();}
}
