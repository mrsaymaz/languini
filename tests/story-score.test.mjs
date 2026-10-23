import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {StoryScore,STORY_CUES,STORY_SCORE} from '../src/story-score.mjs';
import {TakeoverStory,TAKEOVER_DURATION,takeoverCaption} from '../src/takeover-story.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {documentDouble} from './dom-double.mjs';
function audioDouble(){
 const records=[];const parameter=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
 const ctx={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:()=>({gain:parameter(),connect(){},disconnect(){}}),createOscillator:()=>{const n={frequency:parameter(),connect(){},disconnect(){},start(t){records.push({kind:'tone',t});},stop(t){records.push({kind:'stop',t});}};return n;},createBuffer:(_c,n)=>({getChannelData:()=>new Float32Array(n)}),createBiquadFilter:()=>({frequency:parameter(),Q:parameter(),connect(){},disconnect(){}}),createBufferSource:()=>({connect(){},disconnect(){},start(t){records.push({kind:'noise',t});},stop(t){records.push({kind:'stop',t});}})};
 return {ctx,settings:{music:true},records};
}
test('original score and Foley follow the restoration and leave room for the first guest',()=>{
 assert.equal(TAKEOVER_DURATION,32);assert.ok(STORY_SCORE.length>90);assert.ok(STORY_SCORE.every(n=>Number.isFinite(n.time)&&n.time>=0&&n.time<32));assert.ok(STORY_SCORE.some(n=>n.kind==='bass'&&n.time>=13));assert.ok(STORY_SCORE.some(n=>n.kind==='brush'&&n.time>=13));
 assert.deepEqual(STORY_CUES.filter(c=>['keys','ignition','till','bell'].includes(c.id)).map(c=>c.id),['keys','keys','ignition','till','bell']);assert.match(takeoverCaption(4).speaker,/OWNER/);assert.match(takeoverCaption(7).text,/I will/);
});
test('music and effects freeze, mute, resume without a backlog, and stop on disposal',()=>{
 const audio=audioDouble(),score=new StoryScore(audio);score.frame(.1);assert.ok(audio.records.some(n=>n.kind==='tone'));assert.ok(audio.records.some(n=>n.kind==='noise'));
 score.frame(.2,{paused:true});const n=audio.records.length;score.frame(2,{paused:true});assert.equal(audio.records.length,n);score.frame(2);assert.equal(audio.records.length,n);score.frame(2.3);assert.ok(audio.records.length>n);
 audio.settings.music=false;score.frame(2.4);const muted=audio.records.length;score.frame(3.3);assert.equal(audio.records.length,muted);audio.settings.music=true;score.frame(3.4);assert.equal(audio.records.length,muted);
 score.seek(27.2);const before=audio.records.length;score.frame(27.3);assert.equal(audio.records.length,before);score.finish();const finished=audio.records.length;score.frame(27);assert.equal(audio.records.length,finished);assert.equal(score.active,false);
});
test('Continue skips old sound cues rather than replaying them together',()=>{
 const audio=audioDouble(),score=new StoryScore(audio),cues=[];score.cue=id=>cues.push(id);score.frame(.1);score.seek(22);score.frame(22.05);assert.deepEqual(cues,['street']);score.frame(22.45);assert.deepEqual(cues,['street','tool']);score.frame(31);assert.deepEqual(cues,['street','tool']);assert.equal(score.last,31);score.finish();
});
test('native story controls preserve pause, mute, backgrounding, skip and a clean gameplay handoff',()=>{
 const previous=globalThis.document,doc=documentDouble();doc.body.innerHTML='<section id="setup"></section>'+readFileSync(new URL('../public/index.html',import.meta.url),'utf8').match(/<section id="takeover-story"[\s\S]*?<\/section>/)[0];doc.addEventListener=()=>{};globalThis.document=doc;
 try{
  const w=createRestaurant({}),v={world:w,container:{clientWidth:390,clientHeight:844},camera:new THREE.OrthographicCamera(),cameraTarget:new THREE.Vector3(),renderer:{toneMappingExposure:1},reduced:true},calls=[],audio={settings:{music:true},startStory(){calls.push('start')},storyFrame(t,s){calls.push({t,...s})},seekStory(t){calls.push({seek:t})},finishStory(fade){calls.push({finish:fade})},cancelSpeech(){}};
  let finished=0;const root=doc.getElementById('takeover-story'),story=new TakeoverStory(root,{getView:()=>v,audio,onSound:()=>audio.settings.music=!audio.settings.music,onFinish:()=>finished++});story.start();assert.equal(v.takeover,story.scene);assert.equal(doc.getElementById('setup').inert,true);
  story.tick(.2);doc.getElementById('story-pause').click();const elapsed=story.elapsed;story.tick(.2);assert.equal(story.elapsed,elapsed);assert.equal(calls.at(-1).paused,true);doc.getElementById('story-sound').click();assert.equal(audio.settings.music,false);assert.equal(doc.getElementById('story-sound').textContent,'Sound off');
  doc.getElementById('story-pause').click();doc.hidden=true;story.tick(.2);assert.equal(story.elapsed,elapsed);doc.hidden=false;doc.getElementById('story-next').click();assert.equal(story.elapsed,4);assert.deepEqual(calls.find(c=>c.seek),{seek:4});doc.getElementById('story-skip').click();assert.equal(finished,1);assert.equal(v.takeover,null);assert.equal(root.hidden,true);assert.equal(doc.getElementById('setup').inert,false);assert.deepEqual(calls.at(-1),{finish:false});story.finish();assert.equal(finished,1);
 }finally{globalThis.document=previous;}
});
