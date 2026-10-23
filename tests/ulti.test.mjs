import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ULTI_LIFETIME_MS,ultiReward,ultiPool,creditUlti,cleanUlti,ultiSnapshot} from '../src/ulti.mjs';
import {BistroGame,loadProfile,saveProfile,buyUpgrade,buyItem} from '../src/core.mjs';
import {finishShift} from './helpers.mjs';
const now=Date.UTC(2026,9,19,12),day=86400000,config={grade:5,unit:'g5u1',team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
const fresh=()=>loadProfile({getItem:()=>null});
const win=(id='one',overrides={})=>({won:true,shift:{...config,id,eligible:true,...overrides}});
test('every venue/pace reward matches the six requested Ulti amounts',()=>{
 for(const [arena,relaxed,challenge]of [['courtyard',4,8],['bistro',6,12],['banquet',8,16]])for(const [difficulty,expected]of [['relaxed',relaxed],['challenge',challenge]]){
  const p=fresh(),r=creditUlti(p,win(arena+difficulty,{arena,difficulty}),{now});assert.equal(r.amount,expected);assert.equal(ultiPool(p,config,now).balance,expected);assert.equal(r.expiresAt,now+7*day);
 }
 assert.equal(ultiReward({...config,arena:'bad'}),0);assert.equal(ultiReward({...config,difficulty:'bad'}),0);
});
test('sixteen grade/team pools remain isolated while lessons, paces and venues contribute together',()=>{
 const p=fresh(),teams=['gryffindor','hufflepuff','slytherin','ravenclaw'];
 for(const grade of [5,6,7,8])for(const team of teams)creditUlti(p,win(`${grade}:${team}`,{grade,team}),{now});
 creditUlti(p,win('second',{unit:'g5u4',arena:'banquet',difficulty:'challenge'}),{now});
 for(const grade of [5,6,7,8])for(const team of teams)assert.equal(ultiPool(p,{grade,team},now).balance,grade===5&&team==='gryffindor'?20:4);
 assert.equal(Object.keys(p.ulti.pools).length,16);
});
test('each reward expires at its own exact 168-hour boundary, including when offline',()=>{
 const p=fresh();creditUlti(p,win(),{now});creditUlti(p,win('later',{difficulty:'challenge'}),{now:now+3*day});
 assert.equal(ultiPool(p,config,now+7*day-1).balance,12);assert.equal(ultiPool(p,config,now+7*day).balance,8);assert.equal(ultiPool(p,config,now+10*day).balance,0);
 assert.equal(ultiPool(p,config,now+7*day).nextExpiry,now+10*day);assert.equal(ultiPool(p,config,now-1).balance,0);
 const restored=loadProfile({getItem:()=>JSON.stringify(p)});assert.equal(ultiPool(restored,config,now+10*day).balance,0);
});
test('a shift can be credited only once, including after save/load and after expiry',()=>{
 const p=fresh(),result=win();assert.equal(creditUlti(p,result,{now}).credited,true);assert.equal(creditUlti(p,result,{now:now+day}).credited,false);
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};saveProfile(storage,p);const restored=loadProfile(storage);
 assert.equal(creditUlti(restored,result,{now:now+8*day}).credited,false);assert.equal(ultiPool(restored,config,now+8*day).balance,0);assert.equal(restored.ulti.pools['5:gryffindor'].length,1);
 assert.equal(creditUlti(restored,win('one',{grade:6}),{now:now+8*day}).credited,false);assert.equal(ultiPool(restored,{...config,grade:6},now+8*day).balance,0);
});
test('failure, preview, practice, invalid context and missing shift identities award nothing',()=>{
 for(const [result,opts]of [[{...win(),won:false},{}],[win(),{preview:true}],[win('x',{eligible:false}),{}],[win('x',{team:'unknown'}),{}],[win('x',{grade:4}),{}],[win('x',{difficulty:'other'}),{}],[{won:true},{}],[win('',{}),{}]]){const p=fresh();assert.equal(creditUlti(p,result,{now,...opts}).credited,false);assert.equal(ultiPool(p,config,now).balance,0);}
});
test('old saves migrate without changing runes, records, progress or purchases; Ulti cannot pay',()=>{
 const old={version:1,wallets:{'5:gryffindor':0},records:{old:{stars:2,wins:1}}},p=loadProfile({getItem:()=>JSON.stringify(old)});assert.deepEqual(p.ulti,{version:1,pools:{}});creditUlti(p,win(),{now});assert.equal(buyUpgrade(p,config,'kitchen'),false);assert.equal(buyItem(p,config,'banner'),false);assert.equal(ultiPool(p,config,now).balance,4);assert.equal(p.wallets['5:gryffindor'],0);assert.equal(p.records.old.stars,2);
});
test('malformed awards cannot introduce invalid pools, amounts, dates or duplicate shift IDs',()=>{
 const p=fresh();creditUlti(p,win(),{now});const row=p.ulti.pools['5:gryffindor'][0];
 const c=cleanUlti({version:1,pools:{bad:[row],'5:gryffindor':[row,row,{...row,id:'bad-amount',amount:999},{...row,id:'bad-time',expiresAt:now+1},{...row,id:'bad-start',earnedAt:NaN}]}});assert.equal(c.pools['5:gryffindor'].length,1);assert.equal(c.pools.bad,undefined);
});
test('future integration snapshot exposes active dated receipts and cannot mutate the ledger',()=>{
 const p=fresh();creditUlti(p,win(),{now});const s=ultiSnapshot(p,now);assert.equal(s.pools['5:gryffindor'].balance,4);assert.equal(s.pools['5:gryffindor'].awards[0].expiresAt,now+ULTI_LIFETIME_MS);s.pools['5:gryffindor'].awards[0].amount=99;assert.equal(ultiPool(p,config,now).balance,4);assert.equal(ultiSnapshot(p,now+7*day).pools['5:gryffindor'].balance,0);
});
test('real completed shifts carry immutable unique reward context; demos remain ineligible',()=>{
 const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),tasks=bank[0].units[0].tasks;
 const game=finishShift(config,tasks);assert.equal(game.result.won,true);const p=fresh();assert.equal(creditUlti(p,game.result,{now}).amount,4);assert.equal(creditUlti(p,game.result,{now}).credited,false);
 const other=new BistroGame({...config},tasks),demo=new BistroGame(config,tasks,{demoSetting:'tablet'});assert.notEqual(other.shift.id,game.shift.id);assert.ok(Object.isFrozen(other.shift));other.config.grade=8;assert.equal(other.shift.grade,5);demo.start();demo.finish(true);assert.equal(creditUlti(p,demo.result,{now}).credited,false);
});


test('older open tabs cannot overwrite another grade/team award when saving',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},a=loadProfile(storage),b=loadProfile(storage);
 creditUlti(a,win('tab-a'),{now});saveProfile(storage,a);
 creditUlti(b,win('tab-b',{grade:6,team:'ravenclaw',difficulty:'challenge'}),{now});saveProfile(storage,b);
 saveProfile(storage,a);const restored=loadProfile(storage);
 assert.equal(ultiPool(restored,config,now).balance,4);assert.equal(ultiPool(restored,{grade:6,team:'ravenclaw'},now).balance,8);
 assert.equal(creditUlti(restored,win('tab-a'),{now:now+8*day}).credited,false);
});
