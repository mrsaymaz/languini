import {ServiceAmbience} from './service-ambience.mjs';
import {StoryScore} from './story-score.mjs';
import {pickCustomerVoice} from './customer-voices.mjs';
const cues={
  pickup:[[420,.065,.035],[610,.055,.025]],
  ceramic:[[980,.10,.045],[1460,.065,.022]],
  paper:[[640,.045,.027],[820,.04,.018]],
  clip:[[1170,.045,.04],[740,.06,.025]],
  print:[[340,.065,.025],[420,.065,.025],[540,.08,.03]],
  rune:[[880,.11,.055],[1320,.16,.04],[1760,.20,.025]],
};
export class BistroAudio {
  constructor(settings){this.settings=settings;this.ctx=null;this.musicTimer=null;this.step=0;this.speaking=false;this.pendingSpeech=null;this.running=false;this.storyScore=null;this.musicFade=false;this.atmosphere='breakfast';this.ambience=new ServiceAmbience(this);}
  wake(){try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.musicGain=this.ctx.createGain();this.musicGain.gain.value=.045;this.musicGain.connect(this.ctx.destination);}if(['suspended','interrupted'].includes(this.ctx.state))this.ctx.resume().catch(()=>{});}catch{} }
  tone(f=660,length=.15,type='sine',gain=.12,delay=0){
    if(!this.settings.music||!this.ctx||this.ctx.state!=='running')return;
    const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.009);g.gain.exponentialRampToValueAtTime(.001,t+length);o.connect(g);g.connect(this.ctx.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+length+.02);
  }
  effect(id){this.wake();if(cues[id]){cues[id].forEach(([n,d,g],i)=>this.tone(n,d,'sine',g,i*(id==='print'?.055:.035)));return;}if(id==='wrong'){this.tone(230,.12,'sine',.045);return;}const notes=id==='win'?[523,659,784,1047]:id==='serve'?[659,880,1047]:id==='correct'?[587,784]:[740];notes.forEach((n,i)=>this.tone(n,.17,'sine',.06,i*.08));}
  startStory(){this.music(false);this.finishStory(false);this.wake();if(this.ctx)this.storyScore=new StoryScore(this);}
  storyFrame(time,state){this.storyScore?.frame(time,state);}
  seekStory(time){this.storyScore?.seek(time);}
  finishStory(fade=false){this.storyScore?.finish(fade);this.storyScore=null;this.musicFade=fade;}
  setAtmosphere(kind){this.atmosphere=kind;this.ambience.set(kind,this.running&&this.settings.music&&!this.storyScore);}
  atmosphereFrame(){this.ambience.frame();}
  music(on){
    this.running=on;this.ambience.set(this.atmosphere,on&&this.settings.music&&!this.storyScore);clearTimeout(this.musicTimer);this.musicTimer=null;if(!on||!this.settings.music)return;this.wake();this.ambience.set(this.atmosphere,true);
    if(this.musicGain&&this.ctx){const t=this.ctx.currentTime;this.musicGain.gain.cancelScheduledValues(t);this.musicGain.gain.setValueAtTime(this.musicFade?.001:.045,t);this.musicGain.gain.linearRampToValueAtTime(.045,t+(this.musicFade?.8:.05));this.musicFade=false;}
    const notes=[261.63,329.63,392,493.88,440,392,329.63,293.66,220,329.63,392,440,392,329.63,293.66,329.63];
    const play=()=>{if(!this.running||!this.settings.music)return;if(this.ctx?.state==='running'){const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=notes[this.step++%notes.length];g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(this.speaking?.15:.55,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+.8);o.connect(g);g.connect(this.musicGain);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+.85);}this.musicTimer=setTimeout(play,440);};play();
  }
  cancelSpeech(){if(this.pendingSpeech)this.pendingSpeech('cancelled');try{window.speechSynthesis?.cancel();}catch{}this.speaking=false;this.ambience.frame();}
  speak(text,{force=false,gender=null,voiceSeed=0}={}){
    this.cancelSpeech();const synth=window.speechSynthesis;
    if(!synth||typeof globalThis.SpeechSynthesisUtterance!=='function')return Promise.resolve({played:false,reason:'unsupported'});
    if((!this.settings.speech&&!force)||!text)return Promise.resolve({played:false,reason:'disabled'});
    return new Promise(resolve=>{
      let done=false,timer,voiceTimer,voiceListener;
      const stopWaiting=()=>{clearTimeout(voiceTimer);if(voiceListener)synth.removeEventListener?.('voiceschanged',voiceListener);voiceListener=null;};
      const finish=(reason='ended')=>{if(done)return;done=true;clearTimeout(timer);stopWaiting();this.speaking=false;this.ambience.frame();if(this.pendingSpeech===finish)this.pendingSpeech=null;if(reason==='timeout')try{synth.cancel();}catch{}resolve({played:reason==='ended',reason});};
      this.pendingSpeech=finish;this.speaking=true;this.ambience.frame();
      const start=voices=>{if(done)return;stopWaiting();try{const u=new SpeechSynthesisUtterance(text);u.lang=gender==='male'?'en-GB':'en-US';u.rate=.88;u.voice=pickCustomerVoice(voices,{gender,voiceSeed});if(gender==='male'&&!u.voice){finish('voice-unavailable');return;}u.onend=()=>finish('ended');u.onerror=()=>finish('error');timer=setTimeout(()=>finish('timeout'),Math.min(45000,Math.max(12000,text.length*130)));synth.speak(u);}catch{finish('error');}};
      try{
        const voices=synth.getVoices?.()||[];
        if(voices.length||typeof synth.addEventListener!=='function'){start(voices);return;}
        // First-use voice lists may arrive asynchronously. This wait belongs to
        // the same cancellable speech session and keeps kitchen time protected.
        voiceListener=()=>{try{const ready=synth.getVoices?.()||[];if(ready.length)start(ready);}catch{finish('error');}};
        synth.addEventListener('voiceschanged',voiceListener);
        voiceTimer=setTimeout(()=>{try{start(synth.getVoices?.()||[]);}catch{finish('error');}},350);
      }catch{finish('error');}
    });
  }
}
