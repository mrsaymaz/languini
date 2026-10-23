// A suggestion describes a real available action; it never spends stock,
// reprioritises a job or commits a delivery on the player's behalf.
export function serviceGuidance(game){
  const tables=game.tables||[],oldest=items=>[...items].sort((a,b)=>a.patience/a.maxPatience-b.patience/b.maxPatience||a.orderId-b.orderId)[0];
  const marker=t=>t.pickup?'pickup #'+t.orderId:'Table '+(t.id+1);
  if(game.run)return {icon:'serve',flow:2,text:'Your delivery is on its way. The next order can wait.',target:null};
  if(game.selectedDish){const t=tables[game.selectedDish.tableId];return {icon:'serve',flow:2,text:'Tap '+marker(t)+(game.loaded.length===2?' for the trolley’s first stop.': ' to deliver this meal.'),target:t.id};}
  const ready=oldest(tables.filter(t=>t.status==='ready'));
  if(ready)return {icon:'serve',flow:2,text:ready.step<ready.plan.length?'Finish the final check for '+marker(ready)+', then serve.':'Pick a ready dish, then tap '+marker(ready)+' to serve it.',target:ready.id};
  if(game.stock===0&&game.needsDelivery)return {icon:'crate',flow:1,text:'Receive supplies for '+game.maxStock+' orders, then return to your guests.',target:'supplies'};
  const waiting=oldest(tables.filter(t=>t.status==='waiting'));
  if(waiting)return {icon:'hand',flow:0,text:marker(waiting)+' is waiting to order.'+(game.needsDelivery?' You can also receive supplies.':' Tap the guest to begin.'),target:waiting.id};
  const queued=tables.filter(t=>t.status==='queued');
  if(queued.length>1)return {icon:'clock',flow:1,text:'Choose a queued ticket to put it next for its work space.',target:null};
  return {icon:'flame',flow:1,text:'Your kitchen is preparing the next dish.',target:null};
}
