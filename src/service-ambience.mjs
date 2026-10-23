// Quiet procedural soundscape. Two bounded looping beds, sparse soft details,
// frame-driven scheduling, immediate speech ducking and complete pause cleanup.
export class ServiceAmbience {
 constructor(owner){this.owner=owner;this.nodes=[];this.transients=new Set();this.kind=null;this.next=0;this.running=false;}
 stop(){for(const n of [...this.nodes,...this.transients]){try{n.stop?.();}catch{}try{n.disconnect?.();}catch{}}this.nodes=[];this.transients.clear();this.master=null;this.running=false;}
 level(){const n=Number(this.owner.settings?.ambience??.55);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):.55;}
 set(kind,on){const ctx=this.owner.ctx;if(!on||!ctx||this.level()===0){this.stop();this.kind=kind;return;}if(this.running&&this.kind===kind){this.frame();return;}this.stop();this.kind=kind;
  try{
   // Longer loops with matched endpoints avoid a repeating seam. Stereo noise
   // moves gently; it does not imitate intelligible customer conversation.
   if(!this.noise){this.noise=ctx.createBuffer(2,ctx.sampleRate*8,ctx.sampleRate);for(let ch=0;ch<2;ch++){const d=this.noise.getChannelData(ch);let smooth=0;for(let i=0;i<d.length;i++){smooth=(smooth+(Math.random()*2-1)*.08)/1.08;d[i]=smooth;}const first=d[0],last=d.at(-1);for(let i=0;i<d.length;i++)d[i]-=last*(i/(d.length-1))+first*(1-i/(d.length-1));}}
   const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);this.master=master;this.nodes.push(master);
   for(const [frequency,volume]of [[420,.055],[kind==='rain'?1100:kind==='evening'?180:650,kind==='rain'?.10:.025]]){
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=this.noise;source.loop=true;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(master);source.start();this.nodes.push(source,filter,gain);
   }
   this.running=true;this.next=ctx.currentTime+6;this.frame();
  }catch{this.stop();}
 }
 frame(){const c=this.owner.ctx;if(!this.running||!c||c.state!=='running')return;
  const t=c.currentTime,target=this.level()*(this.owner.speaking?.12:1)*(.90+.10*Math.sin(t*.12));
  if(this.master?.gain.setTargetAtTime)this.master.gain.setTargetAtTime(target,t,this.owner.speaking?.06:.6);else if(this.master)this.master.gain.value=target;
  if(this.owner.speaking||t<this.next)return;this.next=t+9+Math.random()*8;
  // Rain has no sharp close-up drops or hiss bursts. Soft crockery belongs to
  // every room; occasional distant two-note birds belong only to morning.
  const bird=this.kind==='breakfast'&&Math.random()<.4;
  try{for(let i=0;i<2;i++){const o=c.createOscillator(),g=c.createGain(),at=t+i*(bird?.14:.025);o.type='sine';o.frequency.setValueAtTime(bird?1500+i*240:820+i*430,at);o.frequency.exponentialRampToValueAtTime(bird?1900+i*180:790+i*420,at+.12);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(bird?.006:.009,at+.015);g.gain.exponentialRampToValueAtTime(.0001,at+.22);o.connect(g);g.connect(this.master);this.transients.add(o);this.transients.add(g);o.onended=()=>{o.disconnect();g.disconnect();this.transients.delete(o);this.transients.delete(g);};o.start(at);o.stop(at+.24);}}catch{}
 }
}
