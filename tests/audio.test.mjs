import test from 'node:test';
import assert from 'node:assert/strict';
import {BistroAudio} from '../src/audio.mjs';

test('speech waits for the utterance, supports manual replay while muted and settles cancellation',async()=>{
  const originalWindow=globalThis.window,originalUtterance=globalThis.SpeechSynthesisUtterance;let spoken;
  globalThis.window={speechSynthesis:{getVoices:()=>[{lang:'en-GB'},{lang:'en-US',name:'Samantha'}],cancel(){},speak(u){spoken=u;}}};
  globalThis.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  try{
    const audio=new BistroAudio({speech:true});let finished=false;const first=audio.speak('The headteacher leads the school.').then(result=>{finished=true;return result;});
    await Promise.resolve();assert.equal(finished,false,'Do not advance when speech has only started');assert.equal(spoken.lang,'en-US');assert.equal(spoken.voice.name,'Samantha');spoken.onend();assert.deepEqual(await first,{played:true,reason:'ended'});
    audio.settings.speech=false;assert.equal((await audio.speak('A muted automatic prompt.')).reason,'disabled');
    const replay=audio.speak('library',{force:true});assert.equal(spoken.text,'library');audio.cancelSpeech();assert.deepEqual(await replay,{played:false,reason:'cancelled'});assert.equal(audio.pendingSpeech,null);
    const next=audio.speak('teacher',{force:true});spoken.onerror();assert.equal((await next).reason,'error');assert.equal(audio.speaking,false);
  }finally{if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;if(originalUtterance===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=originalUtterance;}
});
