import test from 'node:test';
import assert from 'node:assert/strict';
import {CUSTOMER_PROFILES} from '../src/customer-profiles.mjs';
import {describeVoice,pickCustomerVoice,customerVoiceOptions} from '../src/customer-voices.mjs';
import {BistroAudio} from '../src/audio.mjs';
import {StationInteractions} from '../src/interactions.mjs';
const voice=(name,lang='en-US',extra={})=>({name,lang,voiceURI:name,localService:true,...extra});

test('voice personas distinguish female/male vendor names and leave generic voices unknown',()=>{
 for(const name of ['Samantha (Enhanced)','Microsoft Zira Desktop','Microsoft JennyNeural','Microsoft AriaMultilingualNeural','en-us-x-tpf-local female'])assert.equal(describeVoice(voice(name)).gender,'female',name);
 for(const name of ['Alex','Microsoft David Desktop','Microsoft GuyNeural','Microsoft AndrewMultilingualNeural','en-us-x-tpm-local male'])assert.equal(describeVoice(voice(name)).gender,'male',name);
 assert.equal(describeVoice(voice('Google US English')).gender,null);
 assert.equal(describeVoice(voice('Siri Voice 2')).gender,null);
 assert.equal(CUSTOMER_PROFILES.length,24);
 for(const profile of CUSTOMER_PROFILES){assert.ok(['male','female'].includes(profile.voiceGender));assert.equal(customerVoiceOptions(profile.id).gender,profile.voiceGender);}
 assert.deepEqual(customerVoiceOptions(undefined),{});
});

test('customer selection prefers American female and British male gender, stable distinct personas, local voices and graceful fallback',()=>{
 const list=[voice('Daniel','en-GB'),voice('Samantha'),voice('Samantha (Enhanced)'),voice('Alex'),voice('Ava'),voice('Tom'),voice('Microsoft JennyNeural','en-US',{localService:false})];
 for(const gender of ['female','male'])for(let id=0;id<12;id++){
  const options={gender,voiceSeed:id},selected=pickCustomerVoice(list,options);
  assert.equal(selected.lang,gender==='male'?'en-GB':'en-US');assert.equal(describeVoice(selected).gender,gender);
  assert.ok(selected===pickCustomerVoice([...list].reverse(),options));assert.equal(selected.localService,true);
 }
 assert.equal(new Set([0,1].map(voiceSeed=>describeVoice(pickCustomerVoice(list,{gender:'female',voiceSeed})).identity)).size,2);
 assert.equal(pickCustomerVoice([voice('Samantha'),voice('Samantha (Enhanced)')],{gender:'female'}).name,'Samantha (Enhanced)');
 assert.equal(pickCustomerVoice([voice('Alex'),voice('Google US English')],{gender:'female'}).name,'Google US English');
 assert.equal(pickCustomerVoice([voice('Samantha','en-GB'),voice('Alex')],{gender:'female'}).name,'Alex','US accent remains preferred when the requested gender is missing');
 assert.equal(pickCustomerVoice([voice('Samantha','en-GB')],{gender:'female'}).name,'Samantha');
 assert.equal(pickCustomerVoice([voice('Türkçe','tr-TR')],{gender:'female'}),null);
});

test('male customers use British natural voices and never Fred or a US default',()=>{
 const list=[voice('Fred','en-GB'),voice('Alex'),voice('Microsoft GuyNeural'),voice('Daniel (Enhanced)','en-GB'),voice('Microsoft Ryan Online (Natural)','en-GB'),voice('Microsoft George','en-GB'),voice('Serena','en-GB')];
 for(let voiceSeed=0;voiceSeed<24;voiceSeed++){
  const picked=pickCustomerVoice(list,{gender:'male',voiceSeed});assert.equal(picked.lang,'en-GB');assert.ok(['daniel','ryan'].includes(describeVoice(picked).identity));assert.ok(picked===pickCustomerVoice([...list].reverse(),{gender:'male',voiceSeed}));
 }
 assert.equal(pickCustomerVoice([voice('Fred'),voice('Alex'),voice('Daniel','en-GB')],{gender:'male'}).name,'Daniel');
 assert.equal(pickCustomerVoice([voice('Microsoft GuyNeural')],{gender:'male'}),null);
 assert.equal(pickCustomerVoice([voice('Fred','en-GB'),voice('Serena','en-GB')],{gender:'male'}),null);
 assert.equal(pickCustomerVoice([voice('Google UK English Male','en_GB')],{gender:'male'}).name,'Google UK English Male');
 assert.equal(pickCustomerVoice([voice('Google UK English','en-GB')],{gender:'male'}),null,'An unclassified voice cannot guarantee the requested gender');
});

async function withSynth(fn){
 const previousWindow=globalThis.window,previousUtterance=globalThis.SpeechSynthesisUtterance,listeners=new Set(),spoken=[];let voices=[];
 const synth={getVoices:()=>voices,cancel(){},speak:u=>spoken.push(u),addEventListener:(name,fn)=>listeners.add(fn),removeEventListener:(name,fn)=>listeners.delete(fn)};
 globalThis.window={speechSynthesis:synth};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 try{await fn({audio:new BistroAudio({speech:true}),spoken,listeners,setVoices:list=>{voices=list;},changed:()=>{for(const fn of [...listeners])fn();}});}
 finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousUtterance===undefined)delete globalThis.SpeechSynthesisUtterance;else globalThis.SpeechSynthesisUtterance=previousUtterance;}
}
test('late voice discovery uses the requested British customer voice and waits for speech to finish',async()=>withSynth(async({audio,spoken,listeners,setVoices,changed})=>{
 let finished=false;const pending=audio.speak('May I have some soup?',{gender:'male'}).then(r=>{finished=true;return r;});
 assert.equal(audio.speaking,true);assert.equal(spoken.length,0);assert.equal(listeners.size,1);
 setVoices([voice('Samantha'),voice('Daniel','en-GB')]);changed();assert.equal(listeners.size,0);assert.equal(spoken.length,1);assert.equal(spoken[0].voice.name,'Daniel');assert.equal(spoken[0].lang,'en-GB');
 await Promise.resolve();assert.equal(finished,false);spoken[0].onend();assert.equal((await pending).played,true);assert.equal(audio.speaking,false);
}));
test('cancelling voice discovery removes the listener and prevents stale speech',async()=>withSynth(async({audio,spoken,listeners,setVoices,changed})=>{
 const pending=audio.speak('An interrupted request.',{gender:'female'});audio.cancelSpeech();assert.equal((await pending).reason,'cancelled');assert.equal(listeners.size,0);
 setVoices([voice('Samantha')]);changed();await new Promise(r=>setTimeout(r,380));assert.equal(spoken.length,0);assert.equal(audio.pendingSpeech,null);
}));
test('an empty voice catalogue has a bounded fallback instead of blocking the task',async()=>withSynth(async({audio,spoken,listeners})=>{
 const pending=audio.speak('Please listen.',{gender:'female'});await new Promise(r=>setTimeout(r,380));assert.equal(spoken.length,1);assert.equal(spoken[0].lang,'en-US');assert.equal(spoken[0].voice,null);assert.equal(listeners.size,0);spoken[0].onerror();assert.equal((await pending).reason,'error');
}));
test('male speech requests British English and provides written fallback without a suitable voice',async()=>withSynth(async({audio,spoken,setVoices})=>{
 setVoices([voice('Fred'),voice('Microsoft GuyNeural'),voice('Samantha')]);assert.deepEqual(await audio.speak('May I have some tea?',{gender:'male'}),{played:false,reason:'voice-unavailable'});assert.equal(spoken.length,0);assert.equal(audio.speaking,false);
 setVoices([voice('Fred'),voice('Microsoft GuyNeural'),voice('Daniel (Enhanced)','en-GB')]);const pending=audio.speak('May I have some tea?',{gender:'male'});assert.equal(spoken[0].voice.name,'Daniel (Enhanced)');assert.equal(spoken[0].lang,'en-GB');spoken[0].onend();assert.equal((await pending).played,true);
}));

test('station speech follows the actual table guest, restores its voice and keeps shared tasks neutral',async()=>{
 const a={tableId:1,task:{kind:'sentence',blocks:['I','like','soup.']}},g={active:a,tables:[{guest:0},{guest:3}]},calls=[];let resolve;
 const c=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>g,getView:()=>({setSpeaking(){}}),epoch:1,audio:{wake(){},speak:(text,options)=>{calls.push({text,options});return new Promise(r=>resolve=r);}}});
 let pending=c.performSpeech(true,{text:'I like soup.'});const saved=c.speechSession;assert.equal(calls.at(-1).options.customerId,3);assert.equal(calls.at(-1).options.gender,'male');resolve({played:true});await pending;
 g.tables[1].guest=4;pending=c.performSpeech(true,{text:saved.text,voiceProfile:saved.voiceProfile});assert.equal(calls.at(-1).options.customerId,3);resolve({played:true});await pending;
 pending=c.performSpeech(true,{text:'A new request.'});assert.equal(calls.at(-1).options.gender,'female');resolve({played:true});await pending;
 a.task={kind:'question',prompt:'May I have some tea?'};pending=c.performSpeech();assert.equal(calls.at(-1).text,a.task.prompt);assert.equal(calls.at(-1).options.gender,'female');assert.equal(calls.at(-1).options.force,false);resolve({played:true});await pending;
 a.tableId=null;pending=c.performSpeech(true,{text:'Wash the plate.'});assert.deepEqual(calls.at(-1).options,{force:true});resolve({played:true});await pending;
});
