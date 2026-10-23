import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BistroGame,TaskDeck,RECIPES,loadProfile,saveProfile,practiceKey} from '../src/core.mjs';
import {DIALOGUE_LINKS} from '../src/dialogue.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {StationInteractions} from '../src/interactions.mjs';
import {createRestaurant,RestaurantView,setTableCustomer} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {guestPose,GUEST_REACTION_SECONDS} from '../src/guest-reactions.mjs';
import {actionPlacement} from '../src/service-layout.mjs';
import {seeded,tick,solveActive} from './helpers.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),units=bank.flatMap(g=>g.units),unit=units[0],config={grade:5,unit:unit.id,team:'gryffindor',arena:'courtyard',difficulty:'relaxed'};
function dialogueGame(){const game=new BistroGame(config,unit.tasks,{rng:seeded(),demoSetting:'conversation',demoDialogue:true});game.start();game.openOrder(0);return game;}
function pairGame(){const food=units.find(u=>u.id==='g5u6'),game=new BistroGame({...config,unit:food.id,difficulty:'challenge'},food.tasks,{rng:seeded(),demoSetting:'tablet',demoMenuMode:'listening-pair'});game.start();game.openOrder(0);assert.equal(game.active.task.requested.length,2);return game;}

test('all 44 dialogue links connect reviewed questions inside their original grade and unit',()=>{
  assert.equal(DIALOGUE_LINKS.length,44);assert.equal(new Set(DIALOGUE_LINKS.map(l=>l.unit)).size,44);
  for(const link of DIALOGUE_LINKS){const u=units.find(u=>u.id===link.unit);assert.ok(u);for(const id of [link.first,link.second]){const task=u.tasks.find(t=>t.id===id);assert.equal(task?.kind,'question');assert.ok(task.options.includes(task.answer));}assert.notEqual(link.first,link.second);assert.ok(['book','map','leaf','menu','clock','receipt','ball','phone','tool'].includes(link.cue));}
});

test('a dialogue spends one supply and advances its station only after both answers',()=>{
  const game=dialogueGame(),t=game.tables[0],id=t.orderId,stock=game.stock;assert.equal(game.active.task.dialogue.turn,1);solveActive(game);assert.equal(game.active.task.dialogue.turn,2);assert.equal(t.step,0);assert.equal(game.stock,stock);assert.equal(t.orderId,id);assert.equal(game.completed,1);assert.equal(game.serve(0),false);
  solveActive(game);assert.equal(t.step,1);assert.deepEqual(t.settingsDone,['conversation']);assert.equal(t.status,'cooking');assert.equal(game.completed,2);assert.equal(game.firstCorrect,2);assert.equal(game.total,2);assert.equal(game.active,null);
});

test('follow-up questions preserve the accepted reply and do not consume unseen history early',()=>{
  for(const u of units){const deck=new TaskDeck(u.tasks,seeded()),first=deck.forSetting('conversation','relaxed',{dialogue:true});assert.equal(first.dialogue.turn,1);assert.ok(!deck.conversationState.seen.includes(first.dialogue.nextId));const second=deck.followUp(first);assert.equal(second.dialogue.previousAnswer,first.answer);assert.equal(second.dialogue.previousQuestion,first.prompt);assert.equal(second.dialogue.turn,2);assert.equal(deck.followUp(first),null);const seen=new Set([first.id,second.id]);for(let i=2;i<deck.groups.get('conversation').length;i++){const t=deck.forSetting('conversation');assert.ok(!seen.has(t.id));seen.add(t.id);}assert.equal(seen.size,deck.groups.get('conversation').length);}
});

test('saved conversation cycles preserve both turns and recover after an interrupted first turn',()=>{
  const game=dialogueGame(),memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},profile=loadProfile(storage),key=practiceKey(config),first=game.active.task;profile.practice[key]=game.deck.conversationState;saveProfile(storage,profile);const restored=loadProfile(storage),deck=new TaskDeck(unit.tasks,seeded(77),{conversationHistory:restored.practice[key]});assert.ok(!deck.forSetting('conversation','relaxed',{dialogue:true}).dialogue,'A seen first turn cannot repeat to force a pair');
  solveActive(game);assert.ok(game.deck.conversationState.seen.includes(first.id));assert.ok(game.deck.conversationState.seen.includes(first.dialogue.nextId));
});

test('both dialogue exchanges pause arrivals, cooking and patience, including a paused answer',()=>{
  const game=dialogueGame();for(let turn=0;turn<2;turn++){const snapshot=JSON.stringify(game.tables),elapsed=game.elapsed;tick(game,200);assert.equal(JSON.stringify(game.tables),snapshot);assert.equal(game.elapsed,elapsed);solveActive(game,{advance:false});const afterAnswer=JSON.stringify(game.tables);game.paused=true;assert.equal(game.completeTask(),false);tick(game,50);assert.equal(JSON.stringify(game.tables),afterAnswer);game.paused=false;game.completeTask();}
});

test('two-word listening alternates in Challenge and retains only same-unit vocabulary choices',()=>{
  for(const u of units){const deck=new TaskDeck(u.tasks,seeded()),single=deck.forSetting('tablet','challenge',{menuMode:'listening'}),pair=deck.forSetting('tablet','challenge',{menuMode:'listening'});assert.ok(!single.requested);assert.equal(pair.requested.length,2);assert.equal(new Set(pair.options).size,4);for(const word of pair.requested)assert.ok(u.tasks.some(t=>t.kind==='vocabulary'&&t.id===word.id&&t.answer===word.word));for(const option of pair.options)assert.ok(u.tasks.some(t=>t.kind==='vocabulary'&&t.answer===option));const gentle=deck.forSetting('tablet','relaxed',{menuMode:'listening'});assert.ok(!gentle.requested);}
});

test('listening requires exactly two selections and one confirmation, in either order',()=>{
  const game=pairGame(),a=game.active,words=a.task.requested.map(p=>p.word);assert.equal(game.answer(a.task.answer).accepted,false);assert.equal(game.confirmListening().accepted,false);game.toggleListeningWord(words[1]);assert.equal(game.confirmListening().accepted,false);game.toggleListeningWord(words[0]);assert.equal(a.completed,false);assert.equal(game.toggleListeningWord(a.task.options.find(w=>!words.includes(w))).full,true);assert.equal(game.confirmListening().completed,true);assert.equal(game.completed,1);assert.equal(game.confirmListening().accepted,false);assert.equal(game.toggleListeningWord(words[0]).accepted,false);
});

test('wrong listening selections can be removed and repaired without losing the order',()=>{
  const game=pairGame(),a=game.active,words=a.task.requested.map(p=>p.word),wrong=a.task.options.find(w=>!words.includes(w));game.toggleListeningWord(words[0]);game.toggleListeningWord(wrong);assert.equal(game.confirmListening().correct,false);assert.equal(game.active,a);assert.equal(game.tables[0].step,0);game.toggleListeningWord(wrong);game.toggleListeningWord(words[1]);assert.equal(game.confirmListening().correct,true);assert.equal(game.firstCorrect,0);assert.equal(game.total,1);for(const key of game.learning.keys(a.task))assert.equal(game.learning.state.items[key].supported,1);assert.ok(game.completeTask());assert.equal(game.tables[0].status,'cooking');
});

test('listening hints are free and selection is protected while the game is paused',()=>{
  const game=pairGame(),a=game.active,stock=game.stock;game.paused=true;assert.equal(game.toggleListeningWord(a.task.options[0]).accepted,false);assert.equal(game.confirmListening().accepted,false);game.paused=false;assert.ok(game.hint());for(const word of a.task.requested)game.toggleListeningWord(word.word);game.confirmListening();assert.equal(game.runes,0);assert.equal(game.stock,stock);assert.equal(game.firstCorrect,0);assert.ok(game.review.some(t=>t.id===a.task.id));
});

test('requested answer audio finishes before a follow-up can replace the first exchange',async()=>{
  const game=dialogueGame(),first=solveActive(game,{advance:false});let resolveSpeech,opened=0;
  const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,getView:()=>({setSpeaking(){}}),audio:{wake(){},speak:()=>new Promise(r=>resolveSpeech=r)},readbackSpoken:'OK',epoch:1,playbackSerial:0,doneReading:false,onChanged(){},open(){opened++;},close(){}});
  const spoken=controller.speakPrompt(true),pending=controller.presentReadback(first,.01);await new Promise(r=>setTimeout(r,160));assert.equal(game.active,first);assert.equal(opened,0);resolveSpeech({played:true});await spoken;await pending;assert.equal(game.active.task.dialogue.turn,2);assert.equal(opened,1);
});

test('requested answer audio protects the two-word confirmation before cooking begins',async()=>{
  const game=pairGame(),a=solveActive(game,{advance:false});let resolveSpeech,closed=0;
  const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,getView:()=>({setSpeaking(){}}),audio:{wake(){},speak:()=>new Promise(r=>resolveSpeech=r)},readbackSpoken:'OK',epoch:1,playbackSerial:0,onChanged(){},open(){},close(){closed++;}});
  const spoken=controller.speakPrompt(true),pending=controller.presentReadback(a,.01);await new Promise(r=>setTimeout(r,160));assert.equal(game.active,a);assert.equal(game.tables[0].status,'waiting');resolveSpeech({played:true});await spoken;await pending;assert.equal(game.tables[0].status,'cooking');assert.equal(closed,1);
});

test('the two-word controller mirrors toggles and confirms only a complete selection',()=>{
  const previous=globalThis.document,game=pairGame(),a=game.active,buttons=a.task.options.map((word,i)=>({dataset:{answer:String(i)},setAttribute(k,v){this[k]=v;},classList:{toggle(){}}})),nodes={'listening-basket':{},'listening-confirm':{}},reactions=[];
  globalThis.document={getElementById:id=>nodes[id]};try{const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,options:a.task.options,busy:false,root:{querySelectorAll:()=>buttons},getView:()=>({reactStation:(action,state)=>reactions.push({action,state})}),feedback(){},onChanged(){},presentCompleted(){}});controller.submit(a.task.requested[0].word);assert.equal(nodes['listening-confirm'].disabled,true);controller.submit(a.task.requested[1].word);assert.equal(nodes['listening-confirm'].disabled,false);assert.equal(reactions.at(-1).state.selected.length,2);controller.confirmListening();assert.equal(a.completed,true);assert.equal(nodes['listening-confirm'].disabled,true);}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('two-word tablet screens mirror selected cards and preserve their touch targets',()=>{
  const game=pairGame(),a=game.active,world=createRestaurant(),scene=new StationScene(world,{setting:'tablet',task:a.task,options:a.task.options});assert.equal(scene.hits.length,4);const before=scene.tabletScreen.material;scene.react('tablet-select',{selected:[a.task.options[0]],confirmed:false});assert.deepEqual(scene.listeningSelection,[a.task.options[0]]);assert.notEqual(scene.tabletScreen.material,before);scene.react('tablet-select',{selected:a.task.requested.map(p=>p.word),confirmed:true});assert.equal(scene.listeningSelection.length,2);scene.dispose();
});

test('conversation supporting objects are finite and restore guest poses after both turns',()=>{
  const world=createRestaurant();for(const link of DIALOGUE_LINKS){const u=units.find(u=>u.id===link.unit),task=new TaskDeck(u.tasks,seeded()).forSetting('conversation','relaxed',{dialogue:true}),guest=world.tables[0].guest,before=guest.arms.map(a=>a.rotation.toArray());const scene=new StationScene(world,{setting:'conversation',task});assert.equal(scene.cueType,link.cue);assert.equal(guest.holdingCue,true);scene.root.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});scene.dispose();assert.equal(guest.holdingCue,false);assert.deepEqual(guest.arms.map(a=>a.rotation.toArray()),before);}
});

test('all nine meals use bounded preparation tools, liquid streams and stable finished layers',()=>{
  const world=createRestaurant(),sentence=unit.tasks.find(t=>t.kind==='sentence'),actions=new Set();for(let recipe=0;recipe<RECIPES.length;recipe++){const scene=new StationScene(world,{setting:'recipe',task:sentence,recipe,order:[0,1,2]});for(let i=0;i<3;i++){scene.addIngredient(i);actions.add(scene.lastPrepAction.type);scene.update(.36);const rig=scene.prepTools.at(-1);if(rig.userData.prepAction==='pour')assert.equal(rig.userData.stream.visible,true);scene.update(1);assert.equal(rig.visible,false);assert.equal(scene.plated[i].position.y,RECIPES[recipe].heights[i]);}assert.equal(scene.prepTools.length,3);scene.dispose();}assert.deepEqual([...actions].sort(),['arrange','garnish','pour','spread','stack','stir']);
});

test('customer reactions have distinct finite poses and honour reduced motion',()=>{
  const poses=new Set();for(const kind of Object.keys(GUEST_REACTION_SECONDS)){const pose=guestPose(kind,.35);poses.add(JSON.stringify(pose));for(const value of Object.values(pose))assert.ok(Number.isFinite(value));const calm=guestPose(kind,.35,{reduced:true});assert.equal(calm.headX,0);assert.equal(calm.armX,0);}assert.ok(poses.size>=5);
});

test('returning guests recognise the player and postcard handoffs clean up after their reaction',()=>{
  const game=new BistroGame(config,unit.tasks,{rng:seeded()});game.start();const view=Object.assign(Object.create(RestaurantView.prototype),{world:createRestaurant(),menu:false,reduced:false,fallback:false,renderer:{render(){}},cameraGoal:null});view.reactGuest(0,'recognise',game.tables[0].guest);assert.equal(view.world.tables[0].guestReaction.kind,'recognise');view.update(0,.3,game);assert.ok(view.world.tables[0].guestReaction.elapsed>0);view.reactGuest(0,'gift');assert.equal(view.world.tables[0].giftCard.visible,true);view.update(3,3,game);assert.equal(view.world.tables[0].giftCard.visible,false);assert.equal(view.world.tables[0].guestReaction,undefined);setTableCustomer(view.world,0,(game.tables[0].guest+1)%24);assert.equal(view.world.tables[0].giftCard,undefined);
});

test('phone station actions stay within the viewport and above the English answer sheet',()=>{
  for(const [width,height]of [[320,480],[360,640],[393,740],[390,844],[844,390]]){const sheetTop=width<760?height*(height<650?.34:.37):height*.4,point=actionPlacement({x:-500,y:height+400},width,height,sheetTop);assert.ok(point.x>=84&&point.x<=width-84);assert.ok(point.y>=86);if(width<760)assert.ok(point.y+44<=sheetTop+1,`${width}×${height}: action overlaps sheet`);else assert.ok(point.y+44<height);}
});

test('new station markup keeps both word selections explicit and the accepted reply visible',()=>{
  const pair=pairGame().active.task,html=taskMarkup(pair,{options:pair.options});assert.ok(html.includes('id="listening-confirm"'));assert.equal((html.match(/aria-pressed="false"/g)||[]).length,4);assert.ok(!html.includes('<span>'+pair.answer+'</span>'),'The combined answer is never a choice');const game=dialogueGame();solveActive(game);const next=game.active.task,chat=taskMarkup(next,{options:next.options});assert.ok(chat.includes('Exchange 2 of 2'));assert.ok(chat.includes(next.dialogue.previousAnswer));
});

test('Enter confirms listening once and prevents a second default button activation',()=>{
  const game=pairGame();let confirmed=0,prevented=false;const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,busy:false,confirmListening(){confirmed++;}});controller.key({key:'Enter',preventDefault(){prevented=true;}});assert.equal(confirmed,1);assert.equal(prevented,true);
});

test('written fallback for unavailable speech records supported listening success',async()=>{
  const previous=globalThis.document,game=pairGame(),nodes={'listening-status':{},'listening-caption':{},'listen-again':{classList:{add(){},remove(){}}}};globalThis.document={getElementById:id=>nodes[id]};
  try{const controller=Object.assign(Object.create(StationInteractions.prototype),{getGame:()=>game,getView:()=>({setSpeaking(){}}),audio:{wake(){},speak:async()=>({played:false,reason:'unsupported'})},epoch:1,onChanged(){}});await controller.speakPrompt();assert.equal(game.active.hinted,true);assert.equal(nodes['listening-caption'].hidden,false);const task=game.active.task;for(const word of task.requested)game.toggleListeningWord(word.word);game.confirmListening();assert.equal(game.firstCorrect,0);for(const key of game.learning.keys(task))assert.equal(game.learning.state.items[key].supported,1);}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
