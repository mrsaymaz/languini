import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BistroGame} from '../src/core.mjs';
import {CRITIC_WEIGHT,criticSummary} from '../src/food-critic.mjs';
import {cleanReputation,creditReview} from '../src/reputation.mjs';
import {seeded,solveActive} from './helpers.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),unit=bank[0].units[0];
const config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
// The helpers' service loop, with a hook that runs before each English task is solved.
function play(config,{before=()=>{},options={}}={}){
 const game=new BistroGame(config,unit.tasks,{rng:seeded(),...options}),arrivals=[];game.start();
 const emit=game.emit.bind(game);game.emit=(type,data)=>{if(type==='arrival')arrivals.push({...game.tables[data.table]});return emit(type,data);};
 let n=0;while(game.state==='playing'&&n++<10000){
  if(game.active){before(game);solveActive(game);continue;}
  if(game.pendingSide){game.resolveSide(game.stock>0);continue;}
  if(!game.run){const ready=game.readyLoads()[0];if(ready){game.chooseDish(ready.tableId,ready.part);game.deliver(ready.tableId);}else for(const t of game.tables)if(t.status==='waiting'||t.status==='ready'){if(game.openOrder(t.id))break;}}
  if(!game.active&&game.needsDelivery&&game.tables.some(t=>t.status==='waiting'&&!t.stockReserved&&game.stock<(t.partySize||1)))game.openDelivery();game.tick(.2);
 }
 assert.equal(game.state,'finished');return {game,arrivals};
}

test('each normal shift has exactly one critic: an ordinary dine-in guest after the opening order',()=>{
 for(const arena of ['courtyard','bistro','banquet'])for(const difficulty of ['relaxed','challenge']){
  const {game,arrivals}=play({...config,arena,difficulty}),critics=arrivals.filter(t=>t.critic);
  assert.equal(critics.length,1,arena+' '+difficulty);const c=critics[0];
  assert.ok(c.orderId>=2);assert.ok(!c.pickup);assert.ok(!c.final);assert.equal(c.partySize,1);assert.ok(!c.event);
  assert.equal(game.shiftReviews.filter(r=>r.critic).length,1);
 }
});
test('a perfect critic visit writes a five-star review that counts three times',()=>{
 const {game}=play(config),review=game.shiftReviews.find(r=>r.critic);
 assert.equal(review.perfect,true);assert.equal(review.score,5);assert.deepEqual(game.result.critic,{name:review.name,perfect:true,score:5});
 assert.equal(game.reputation.count,game.shiftReviews.length-1+CRITIC_WEIGHT);
 assert.match(criticSummary(game.result.critic).copy,/counts 3 times/);
});
test('a mistake or a hint for the critic leaves an ordinary review and no penalty',()=>{
 for(const slip of ['mistake','hint']){
  let slipped=false;
  const {game}=play(config,{before:g=>{const a=g.active,t=a.tableId!=null?g.tables[a.tableId]:null;if(!slipped&&t?.critic&&a.purpose==='order'){slipped=true;if(slip==='hint')g.hint();else g.recordMistake();}}});
  const review=game.shiftReviews.find(r=>r.critic);assert.ok(slipped,slip);assert.equal(review.perfect,false,slip);
  assert.equal(game.reputation.count,game.shiftReviews.length,'Every review counts once');assert.match(criticSummary(game.result.critic).copy,/counts once/);
 }
});
test('demonstrations never bring a critic and weighted reviews stay bounded',()=>{
 const demo=new BistroGame(config,unit.tasks,{demoSetting:'tablet',rng:seeded()});demo.start();for(let i=0;i<6;i++)demo.spawnGuest();assert.ok(!demo.tables.some(t=>t.critic));
 const s=cleanReputation();assert.equal(creditReview(s,'1:1',5,0),null);assert.equal(creditReview(s,'1:1',5,9),null);assert.ok(creditReview(s,'1:1',5,3));assert.equal(s.count,3);assert.equal(s.total,15);assert.equal(creditReview(s,'1:1',5,3),null,'A review is credited once');
 assert.equal(criticSummary({name:'Ali',left:true}).title,'The food critic left');assert.equal(criticSummary(null),null);
});
