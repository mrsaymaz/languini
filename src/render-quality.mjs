export const QUALITY_MODES=['auto','lite','high'];
export function renderQuality(mode='auto',{pixelRatio=1,memory=8,cores=8}={}){
  const lite=mode==='lite'||mode==='auto'&&(memory<=4||cores<=4);
  return {mode:QUALITY_MODES.includes(mode)?mode:'auto',tier:lite?'lite':'high',pixelRatio:Math.max(.75,Math.min(pixelRatio,lite?1.5:2)),shadows:!lite,shadowSize:lite?512:1024,antialias:true};
}
// Diagnostics report CPU frame intervals and renderer counters, never a promise
// of device FPS or GPU time. Ignore long/background frames and warm-up.
export class FrameBudget {
  constructor(){this.samples=[];this.elapsed=0;this.window=[];this.slowWindows=0;}
  add(dt){this.elapsed+=dt;if(this.elapsed<3||dt<=0||dt>.20)return false;const ms=dt*1000;this.samples.push(ms);if(this.samples.length>600)this.samples.shift();this.window.push(ms);if(this.window.length<120)return false;const mean=this.window.reduce((a,b)=>a+b,0)/this.window.length;this.window=[];this.slowWindows=mean>29?this.slowWindows+1:0;return this.slowWindows>=2;}
  report(){const a=[...this.samples].sort((a,b)=>a-b);return {samples:a.length,frameMeanMs:a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):null,frameP95Ms:a.length?+a[Math.min(a.length-1,Math.floor(a.length*.95))].toFixed(2):null};}
}
