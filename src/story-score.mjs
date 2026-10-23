// Original, locally synthesised score. No audio downloads or remote services.
// Sparse felt-piano harmonics become a small café trio as the room is restored.
import {OPENING_EVENTS as E,storyMusicLevel} from './opening-direction.mjs';
const hz=n=>440*2**((n-69)/12);
export const STORY_CUES=[
 [0,'street'],[E.signStraight,'sign'],[4.3,'keys'],[E.keyTransfer+.05,'keys'],[9,'creak'],[9.35,'sticky'],[E.firstTillPress,'failedTill'],[E.secondTillPress,'failedTill'],[E.cookerTry,'failedCooker'],[13.8,'sleeve'],
 [15.35,'sweep'],[15.95,'sweep'],[16.45,'sweep'],[17.05,'wipe'],[17.65,'wipe'],[19.2,'wipe'],[19.8,'wipe'],[20.35,'wipe'],[20.55,'photo'],
 [22.4,'tool'],[22.8,'tool'],[E.cookerPanelClosed,'panel'],[E.cookerWorking,'ignition'],[24.4,'tool'],[24.8,'tool'],[E.tillPanelClosed,'panel'],[E.tillWorking,'till'],
 [E.lights,'light'],[E.openSign,'sign'],[E.bell,'bell']
].map(([time,id])=>({time,id}));
const SCORE=[];
const piano=(time,midi,gain=.036,length=1.15)=>SCORE.push({time,kind:'piano',midi,gain,length});
// An unfinished C–E–D–B motif returns in the photograph, then resolves to C.
[[0,60],[.04,67],[.25,72],[.90,76],[1.55,74],[2.2,71],[4.15,60],[4.21,64],[4.8,67],[5.7,72],[6.8,76],[7.5,74],[8.2,71],[9.1,57],[9.18,64],[10.8,60],[12.2,62],[13.5,67]].forEach(([time,n])=>piano(time,n,time>=9?.025:.035,time<3?1.1:1.45));
const chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],melody=[72,0,76,79,76,74,72,0,69,72,76,0,74,72,69,67];
for(let beat=0;beat<18;beat++){
 const time=15+beat*.625,chord=chords[Math.floor(beat/4)%4];SCORE.push({time,kind:'bass',midi:chord[beat%2?1:0]-12,gain:.05,length:.48});
 if(beat%2===1)SCORE.push({time,kind:'brush',gain:.019,length:.13});
 if(beat%4===0)chord.slice(1).forEach((n,i)=>piano(time+i*.025,n,.017,.75));
 if(time<18.2||time>21.4)for(let e=0;e<2;e++){const n=melody[(beat*2+e)%melody.length];if(n)piano(time+e*.3125,n,.028,.8);}
}
[[19.15,72],[19.75,76],[20.35,74],[20.95,71],[21.55,72],[26.05,64],[26.12,67],[26.3,72],[28.65,72],[29.2,76],[29.75,74],[30.3,71],[30.85,72]].forEach(([time,n])=>piano(time,n,.037,.95));
[48,55,60,64].forEach((n,i)=>piano(30.9+i*.035,n,.025,1.0));
export const STORY_SCORE=SCORE.sort((a,b)=>a.time-b.time);
export class StoryScore {
 constructor(audio){this.audio=audio;this.ctx=audio.ctx;this.nodes=new Set();this.active=true;this.last=-.01;this.paused=false;this.master=this.ctx.createGain();this.master.gain.value=.7;this.master.connect(this.ctx.destination);this.musicBus=this.ctx.createGain();this.foleyBus=this.ctx.createGain();this.musicBus.connect(this.master);this.foleyBus.connect(this.master);}
 track(source,gain,extra=[]){const node={source,gain,extra};this.nodes.add(node);source.onended=()=>{source.disconnect();gain.disconnect();extra.forEach(n=>n.disconnect());this.nodes.delete(node);};return node;}
 note(midi,time=0,length=1.2,gain=.04,kind='piano',freq=null,bus='music'){
  if(!this.active||!this.audio.settings.music||this.ctx.state!=='running')return;
  const at=this.ctx.currentTime+time,f=freq??hz(midi);
  // Short hammer attack and decaying partials, or the soft rounded bass pluck.
  const partials=kind==='bass'?[[1,1],[2,.22]]:[[1,1],[2,.27],[3,.09]];
  for(const [ratio,weight]of partials){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f*ratio,at);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(gain*weight,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+length);o.connect(g);g.connect(bus==='foley'?this.foleyBus:this.musicBus);this.track(o,g);o.start(at);o.stop(at+length+.02);}
 }
 noise(length=.15,gain=.025,frequency=1500,time=0,bus='foley'){
  if(!this.active||!this.audio.settings.music||this.ctx.state!=='running')return;
  const at=this.ctx.currentTime+time,n=Math.max(1,Math.ceil(this.ctx.sampleRate*length)),buffer=this.ctx.createBuffer(1,n,this.ctx.sampleRate),data=buffer.getChannelData(0);
  // Seeded noise: the same soft brush/wipe texture on every playthrough.
  let seed=71237;for(let i=0;i<n;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741823.5-1);}
  const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(gain,at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+length);source.connect(filter);filter.connect(g);g.connect(bus==='music'?this.musicBus:this.foleyBus);this.track(source,g,[filter]);source.start(at);source.stop(at+length+.02);
 }
 cue(id){
  const tone=(midi,time,length,gain,kind='piano',freq=null)=>this.note(midi,time,length,gain,kind,freq,'foley');
  if(id==='street'){this.noise(1.9,.012,370);return;}
  if(id==='keys'){[2200,3100,2700].forEach((f,i)=>tone(0,i*.045,.15,.018,'piano',f));return;}
  if(id==='creak'){tone(0,0,.28,.027,'bass',113);this.noise(.32,.018,480);return;}
  if(id==='failedTill'){tone(0,0,.09,.018,'bass',180);tone(0,.11,.06,.013,'bass',140);return;}
  if(id==='failedCooker'){this.noise(.055,.022,1650);this.noise(.055,.022,1650,.12);return;}
  if(id==='sweep'||id==='wipe'){this.noise(id==='sweep'?.38:.25,.026,id==='sweep'?1800:850);return;}
  if(id==='sticky'||id==='sleeve'){this.noise(.12,.016,700);return;}
  if(id==='panel'){this.noise(.065,.027,540);tone(0,0,.10,.014,'bass',210);return;}
  if(id==='photo'){this.noise(.19,.016,1100);tone(79,0,.65,.021);return;}
  if(id==='tool'){this.noise(.05,.023,1200);tone(0,0,.07,.015,'piano',890);return;}
  if(id==='ignition'){this.noise(.1,.03,1800);this.noise(.65,.025,260,.07);return;}
  if(id==='till'){tone(0,0,.14,.023,'piano',1046.5);tone(0,.1,.15,.018,'piano',1318.5);return;}
  if(id==='light'){this.noise(.06,.016,1900);tone(76,.06,.8,.021);return;}
  if(id==='sign'){this.noise(.08,.015,600);return;}
  if(id==='bell'){[76,83,88].forEach((n,i)=>tone(n,i*.045,.85,.035));}
 }
 clear(){const at=this.ctx.currentTime;for(const node of [...this.nodes]){try{node.gain.gain.cancelScheduledValues(at);node.gain.gain.setTargetAtTime(.0001,at,.008);node.source.stop(at+.04);}catch{}}}
 seek(time){this.clear();this.last=time;}
 frame(time,{paused=false}={}){
  if(!this.active)return;const stopped=paused||!this.audio.settings.music||this.ctx.state!=='running';
  if(stopped){if(!this.paused)this.clear();this.paused=true;this.last=time;return;}
  if(this.paused){this.paused=false;this.last=time;return;}
  if(time<this.last||time-this.last>.5){this.seek(time);return;}
  this.musicBus.gain.setValueAtTime(storyMusicLevel(time),this.ctx.currentTime);
  for(const note of STORY_SCORE)if(note.time>this.last&&note.time<=time){if(note.kind==='brush')this.noise(note.length,note.gain,3400,0,'music');else this.note(note.midi,0,note.length,note.gain,note.kind);}
  for(const cue of STORY_CUES)if(cue.time>this.last&&cue.time<=time)this.cue(cue.id);
  this.last=time;
 }
 finish(fade=false){if(!this.active)return;this.active=false;const at=this.ctx.currentTime;if(fade){this.master.gain.setTargetAtTime(.0001,at,.16);}else this.clear();setTimeout(()=>{this.clear();this.master.disconnect();this.musicBus.disconnect();this.foleyBus.disconnect();},fade?850:70);}
}
