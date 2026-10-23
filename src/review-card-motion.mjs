const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>t*t*(3-2*t);
// Presentation only. Dining time remains owned by the simulation.
export function reviewCardPose(stage,progress,{reduced=false}={}){
 const p=clamp(progress),exit=stage==='spin';
 if(reduced)return {rx:0,ry:0,rz:0,lift:0,scale:1,opacity:exit?1-smooth(p):1,shine:.5,frontLight:1,backLight:1};
 const enter=smooth(clamp(p*10)),turn=exit?smooth(p):0;
 const ry=exit?6+360*turn:6+(1-enter)*-18,rx=exit?-4+Math.sin(p*Math.PI)*10:-4-(1-enter)*8;
 const fade=exit?smooth(clamp((p-.68)/.32)):0;
 return {rx,ry,rz:exit?Math.sin(p*Math.PI)*-4:(1-enter)*-2,lift:exit?-Math.sin(p*Math.PI)*10:(1-enter)*7,scale:exit?1-.18*smooth(clamp((p-.5)*2)):.9+.1*enter,opacity:exit?1-fade:enter,shine:exit?turn:p*.7,frontLight:.78+.22*Math.max(0,Math.cos(ry*Math.PI/180)),backLight:.78+.22*Math.max(0,-Math.cos(ry*Math.PI/180))};
}
