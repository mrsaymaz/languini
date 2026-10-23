import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {LEAGUE_URL,LEAGUE_ARENAS,ULTI_ACCURACY,createLeague,leagueApi,startRequest,ultiClaim,livePoints,strength,gameSettings,hoursLabel} from '../src/ulti.mjs';
import {BistroGame,loadProfile,saveProfile,SAVE_KEY} from '../src/core.mjs';
import {finishShift} from './helpers.mjs';
const config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'},hour=3600000;
const shift=(overrides={})=>({id:'shift-1',eligible:true,...config,...overrides});
const win=(accuracy=80,overrides={})=>({won:true,accuracy,shift:shift(overrides)});
const memoryStorage=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),map:m};};
// A stand-in League: replies are queued per action; every request body is logged.
function fakeLeague(){
  const log=[],replies={start:[],claim:[],pools:[]};let clock=Date.UTC(2026,9,23,12);
  const fetchImpl=async(url,init)=>{const body=JSON.parse(init.body);log.push({url,body});const next=replies[body.action].shift()||{status:200,data:{status:'success'}};if(next.network)throw TypeError('offline');return {status:next.status,ok:next.status>=200&&next.status<300,json:async()=>next.data};};
  return {log,replies,fetchImpl,now:()=>clock,advance:ms=>{clock+=ms;}};
}
const make=(f,storage=memoryStorage(),api=LEAGUE_URL)=>createLeague({api,storage,fetchImpl:f.fetchImpl,now:f.now});

test('shift context maps to the League start request; demos and invalid context never ask',()=>{
  assert.deepEqual(LEAGUE_ARENAS,{courtyard:0,bistro:1,banquet:2});
  assert.deepEqual(startRequest(shift({arena:'banquet',difficulty:'challenge',unit:'g5u1<x>'})),{grade:5,team:'gryffindor',arena:2,pace:'challenge',unit:'g5u1x'});
  for(const bad of [{eligible:false},{grade:4},{grade:'5'},{team:'unknown'},{arena:'roof'},{difficulty:'easy'}])assert.equal(startRequest(shift(bad)),null,JSON.stringify(bad));
});
test('only won shifts with enough first-try accuracy are claimed',()=>{
  assert.deepEqual(ULTI_ACCURACY,{relaxed:60,challenge:75});
  assert.equal(ultiClaim(win(60)).claim,true);assert.deepEqual(ultiClaim(win(59)),{claim:false,reason:'accuracy',accuracy:59,needed:60});
  assert.equal(ultiClaim(win(75,{difficulty:'challenge'})).claim,true);assert.equal(ultiClaim(win(74,{difficulty:'challenge'})).reason,'accuracy');
  assert.equal(ultiClaim({...win(100),won:false}).reason,'not-won');assert.equal(ultiClaim(win(100),{preview:true}).reason,'practice');assert.equal(ultiClaim(win(100,{eligible:false})).reason,'practice');
});
test('a won shift asks for a ticket, then claims it once without ever sending points',async()=>{
  const f=fakeLeague(),league=make(f);
  f.replies.start.push({status:200,data:{status:'success',ticket:'T1'}});
  assert.equal(await league.start(shift({unit:'g5u4'})),'T1');assert.equal(await league.start(shift()),'T1','An existing ticket is reused');
  const device=league.device();assert.match(device,/^[A-Za-z0-9_-]{8,64}$/);
  assert.deepEqual(f.log[0].body,{action:'start',game:'languini',grade:5,team:'gryffindor',arena:0,pace:'relaxed',unit:'g5u4',device});assert.equal(f.log[0].url,LEAGUE_URL);
  f.replies.claim.push({status:200,data:{status:'success',points:4,requested:4,deviceWins:1,settings:{hours:72,capacity:500,maxStrength:2},pools:{5:{gryffindor:{points:4,players:1,entries:[[Math.floor(f.now()/60000),4]]}}}}});
  assert.deepEqual(await league.claim('shift-1'),{state:'counted',points:4,requested:4,deviceWins:1,reason:null,duplicate:false});
  assert.deepEqual(f.log[1].body,{action:'claim',ticket:'T1',device});
  assert.equal(f.log.some(r=>'points' in r.body),false);
  assert.deepEqual(await league.claim('shift-1'),{state:'no-ticket'});assert.equal(league.snapshot(5).teams[0].points,4);
});
test('League limits and refusals are reported; refusals are final',async()=>{
  const f=fakeLeague(),league=make(f);
  for(const [id,reply,expected]of [['a',{status:200,data:{status:'success',points:0,reason:'device-limit'}},{state:'counted',points:0,reason:'device-limit'}],['b',{status:400,data:{status:'error',reason:'too-fast'}},{state:'refused',reason:'too-fast'}],['c',{status:400,data:{status:'error'}},{state:'refused',reason:'refused'}]]){
    f.replies.start.push({status:200,data:{status:'success',ticket:'T'+id}});await league.start(shift({id}));f.replies.claim.push(reply);
    const result=await league.claim(id);for(const [k,v]of Object.entries(expected))assert.equal(result[k],v,id+' '+k);
  }
  assert.equal(league.outbox().length,0);
});
test('offline claims wait in the outbox, are resent later and expire after 47 hours',async()=>{
  const f=fakeLeague(),storage=memoryStorage(),league=make(f,storage);
  for(const id of ['a','b']){f.replies.start.push({status:200,data:{status:'success',ticket:'T'+id}});await league.start(shift({id}));}
  f.replies.claim.push({network:true},{status:503,data:{status:'error'}});
  assert.deepEqual(await league.claim('a'),{state:'queued'});assert.deepEqual(await league.claim('b'),{state:'queued'});assert.equal(league.outbox().length,2);
  const reloaded=make(f,storage);assert.equal(reloaded.outbox().length,2,'The outbox survives a reload');
  f.replies.claim.push({status:200,data:{status:'success',points:4}},{network:true});
  const sent=await reloaded.flush();assert.equal(sent[0].state,'counted');assert.equal(sent[1].state,'retry');assert.deepEqual(reloaded.outbox().map(x=>x.ticket),['Tb']);
  f.advance(47*hour+1);assert.deepEqual(await reloaded.flush(),[]);assert.equal(reloaded.outbox().length,0);
});
test('an offline start gives no ticket; unclaimed tickets are discarded or expire',async()=>{
  const f=fakeLeague(),league=make(f);
  f.replies.start.push({network:true});assert.equal(await league.start(shift()),null);assert.equal(league.ticketFor('shift-1'),null);
  f.replies.start.push({status:200,data:{status:'success',ticket:'T1'}},{status:200,data:{status:'success',ticket:'T2'}});
  await league.start(shift());league.discard('shift-1');assert.equal(league.ticketFor('shift-1'),null);
  await league.start(shift({id:'old'}));f.advance(48*hour+1);f.replies.start.push({status:200,data:{status:'success',ticket:'T3'}});await league.start(shift({id:'new'}));
  assert.equal(league.ticketFor('old'),null);assert.equal(league.ticketFor('new'),'T3');
});
test('an empty ultiApi makes no requests at all',async()=>{
  const f=fakeLeague(),league=make(f,memoryStorage(),'');
  assert.equal(league.enabled,false);assert.equal(await league.start(shift()),null);assert.deepEqual(await league.claim('shift-1'),{state:'off'});assert.deepEqual(await league.flush(),[]);await league.refresh(5);
  assert.equal(f.log.length,0);
  assert.equal(leagueApi(undefined),LEAGUE_URL);assert.equal(leagueApi({ultiApi:''}),'');assert.equal(leagueApi({ultiApi:' https://example.test/api/ulti '}),'https://example.test/api/ulti');
});
test('pools show live team points within the League hours, with Battle Arena strength',async()=>{
  const f=fakeLeague(),league=make(f),minute=Math.floor(f.now()/60000);
  assert.equal(league.snapshot(6).known,false);
  f.replies.pools.push({status:200,data:{status:'success',settings:{enabled:true,capacity:100,maxStrength:2,hours:24,games:{languini:{points:{relaxed:[4,6,8],challenge:[8,12,16]}}}},pools:{6:{slytherin:{players:2,entries:[[minute-60,9],[minute-25*60,50]]}}}}});
  const snap=await league.refresh(6);assert.deepEqual(f.log[0].body,{action:'pools',grade:6});
  assert.equal(snap.known,true);assert.equal(snap.online,true);assert.equal(snap.hours,24);assert.deepEqual(snap.game.points.relaxed,[4,6,8]);
  const slytherin=snap.teams.find(t=>t.id==='slytherin');assert.equal(slytherin.points,9);assert.equal(slytherin.players,2);assert.equal(slytherin.strength.toFixed(2),'1.30');
  assert.equal(snap.teams.find(t=>t.id==='gryffindor').points,0);
  assert.equal(gameSettings({enabled:true,games:{}}),null);assert.equal(gameSettings({enabled:false,games:{languini:{}}}),null);assert.equal(gameSettings({games:{languini:{enabled:false}}}),null);
  assert.equal(livePoints([[1,5]],1,2*hour),0);assert.equal(strength(400,100,2),2);assert.equal(strength(5,0,2),1);
  assert.equal(hoursLabel(72),'3 days');assert.equal(hoursLabel(24),'1 day');assert.equal(hoursLabel(36),'36 hours');
});
test('real shifts carry frozen unique League context; demos stay ineligible',()=>{
  const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank[0].units[0].tasks;
  const game=finishShift(config,tasks);assert.equal(game.result.won,true);assert.ok(Number.isInteger(game.result.accuracy));
  assert.deepEqual(startRequest(game.result.shift),{grade:5,team:'gryffindor',arena:0,pace:'relaxed',unit:'g5u1'});
  const other=new BistroGame({...config},tasks),demo=new BistroGame(config,tasks,{demoSetting:'tablet'});assert.notEqual(other.shift.id,game.shift.id);assert.ok(Object.isFrozen(other.shift));other.config.grade=8;assert.equal(other.shift.grade,5);
  demo.start();demo.finish(true);assert.equal(ultiClaim({...demo.result,accuracy:100}).claim,false);
});
test('the retired local ledger is dropped from old saves without touching runes or records',()=>{
  const old={version:1,wallets:{'5:gryffindor':30},records:{old:{stars:2,wins:1}},ulti:{version:1,pools:{'5:gryffindor':[{id:'x',source:'languini',amount:4,arena:'courtyard',difficulty:'relaxed',earnedAt:1,expiresAt:1+7*24*hour}]}}};
  const storage=memoryStorage();storage.setItem(SAVE_KEY,JSON.stringify(old));const p=loadProfile(storage);
  assert.equal('ulti' in p,false);assert.equal(p.wallets['5:gryffindor'],30);assert.equal(p.records.old.stars,2);
  saveProfile(storage,p);assert.equal('ulti' in JSON.parse(storage.getItem(SAVE_KEY)),false);
});
test('the page loads config.js between startup.js and game.js and points at the League',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),source=fs.readFileSync(new URL('../public/config.js',import.meta.url),'utf8');
  assert.ok(html.indexOf('./startup.js?')<html.indexOf('./config.js?')&&html.indexOf('./config.js?')<html.indexOf('./game.js?'));
  const sandbox={window:{}};vm.runInNewContext(source,sandbox);assert.equal(sandbox.window.LANGUINI_CONFIG.ultiApi,LEAGUE_URL);
  assert.ok(html.includes('id="ulti-note"'));assert.ok(/id="setup-ulti"[^>]*hidden/.test(html),'The Ulti button stays hidden until the League connection is known');
});
