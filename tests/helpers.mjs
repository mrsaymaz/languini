import assert from 'node:assert/strict';
import {BistroGame} from '../src/core.mjs';
import {repairParts} from '../src/tasks.mjs';
export function seeded(seed=12345){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function tick(game,seconds){for(let i=0;i<Math.ceil(seconds/.1);i++)game.tick(.1);}
export function solveActive(game,{advance=true}={}){
  const a=game.active;assert.ok(a);let result;
  if(a.task.kind==='sorting'){while(!a.completed)result=game.sortLabel(a.task.cards[a.sortIndex].category);}
  else if(a.purpose==='delivery')result=game.attachLabel(a.task.answer);
  else if(a.task.requested){for(const p of a.task.requested)assert.ok(game.toggleListeningWord(p.word).accepted);result=game.confirmListening();}
  else if(a.task.kind==='matching'){for(let i=0;i<a.task.pairs.length;i++)result=game.matchPair(i,i);}
  else if(a.task.kind==='sentence'){for(let i=0;i<a.task.blocks.length;i++)result=game.addIngredient(i);}
  else{if(a.task.kind==='repair'){assert.ok(game.locateRepair(repairParts(a.task).errorIndex).correct);assert.ok(game.eraseRepair());}result=game.answer(a.task.answer);if(a.task.kind==='completion')assert.ok(game.stampTicket());if(a.task.kind==='repair')assert.ok(game.printReceipt());}
  assert.equal(result.correct,true,a.task.id);if(advance){const done=game.completeTask();assert.ok(done);if(done.nextPrepPhase||done.nextActivityRound)solveActive(game);}return a;
}
export function finishShift(config,tasks,options={}){
  const game=new BistroGame(config,tasks,{rng:seeded(),...options});game.start();let iterations=0;
  while(game.state==='playing'&&iterations++<10000){
    if(game.active){solveActive(game);continue;}
    if(game.pendingSide){if(game.stock>0)game.resolveSide(true);else game.resolveSide(false);continue;}
    if(!game.run){const ready=game.readyLoads()[0];if(ready){assert.ok(game.chooseDish(ready.tableId,ready.part));assert.ok(game.deliver(ready.tableId));}else for(const t of game.tables)if(t.status==='waiting'||t.status==='ready'){if(game.openOrder(t.id))break;}}
    if(!game.active&&game.needsDelivery&&game.tables.some(t=>t.status==='waiting'&&!t.stockReserved&&game.stock<(t.partySize||1)))assert.ok(game.openDelivery());game.tick(.2);
  }
  assert.equal(game.state,'finished',JSON.stringify(config));return game;
}
