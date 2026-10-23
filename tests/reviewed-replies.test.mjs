import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {choicesFor} from '../src/core.mjs';
import {applyReviewedDistractors} from '../scripts/reviewed-distractors.mjs';
import {seeded} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url))),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
const review=JSON.parse(await readFile(new URL('../content/reviewed-distractors.json',import.meta.url)));
// Content words a learner could match between a question and a reply.
const STOP=new Set('the a an is are do does did to of in on at it for and you your i we they he she my our can what where who when how why which with be this that there was were will has have their his her its them us me am not no yes or but if so very from by as'.split(' '));
const stem=w=>{for(const s of ['ing','es','s','ed'])if(w.endsWith(s)&&w.length-s.length>=3)return w.slice(0,-s.length);return w;};
const words=s=>new Set((s.toLowerCase().match(/[a-z']+/g)||[]).filter(w=>!STOP.has(w)&&w.length>2).map(stem));
const shared=(a,b)=>[...words(a)].filter(w=>b.has(w)).length;

test('no conversation question can be answered by matching the question words',()=>{
 const giveaways=[];
 for(const t of tasks.filter(t=>t.kind==='question')){
  const q=words(t.prompt),answer=shared(t.answer,q);if(!answer)continue;
  for(const difficulty of ['relaxed','challenge'])for(let seed=1;seed<=40;seed++){
   const shown=choicesFor(t,difficulty,seeded(seed)).filter(o=>o!==t.answer);
   if(shown.every(o=>shared(o,q)<answer)){giveaways.push(t.id);break;}
  }
 }
 assert.deepEqual([...new Set(giveaways)],[]);
});
test('reviewed questions keep their answer first and offer three wrong replies for Challenge',()=>{
 assert.equal(Object.keys(review.wrongReplies).length,429);
 for(const [id,wrong]of Object.entries(review.wrongReplies)){
  const t=tasks.find(t=>t.id===id);assert.equal(t.kind,'question',id);assert.deepEqual(t.options,[t.answer,...wrong],id);
  assert.equal(choicesFor(t,'challenge',seeded(3)).length,4);assert.equal(choicesFor(t,'relaxed',seeded(3)).length,3);
 }
});
test('the reviewed replies file refuses unknown tasks, a repeated answer or a short list',()=>{
 const sample=()=>[{grade:5,units:[{id:'g5u1',tasks:[{id:'q',kind:'question',prompt:'Where?',answer:'Here.',options:['Here.','A.','B.']}]}]}];
 assert.throws(()=>applyReviewedDistractors(sample(),{wrongReplies:{missing:['A.','B.','C.']}}),/conversation question/);
 assert.throws(()=>applyReviewedDistractors(sample(),{wrongReplies:{q:['Here.','B.','C.']}}),/Review wrong replies/);
 assert.throws(()=>applyReviewedDistractors(sample(),{wrongReplies:{q:['A.','B.']}}),/Review wrong replies/);
 const ok=sample();applyReviewedDistractors(ok,{wrongReplies:{q:['A.','B.','C.']}});assert.deepEqual(ok[0].units[0].tasks[0].options,['Here.','A.','B.','C.']);
});
