import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BistroGame} from '../src/core.mjs';
import {kitchenWorldActions,kitchenAction,placeWorldBadges} from '../src/kitchen-signifiers.mjs';
import {renderQuality} from '../src/render-quality.mjs';
import {prepBoardLayout} from '../src/prep-layout.mjs';
import {paperLabelLayout} from '../src/page-fit.mjs';
import {stationViewport} from '../src/object-layout.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {createRestaurant} from '../src/restaurant.mjs';
import {reviewMetrics} from '../src/review-cards.mjs';
import {seeded,solveActive} from './helpers.mjs';
const unit=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url)))[0].units[0],config={grade:5,unit:unit.id,arena:'courtyard',team:'gryffindor',difficulty:'relaxed'},six={id:'six-phone',kind:'sentence',prompt:'Öğretmenim bize okulda her gün ödev verir.',translation:'Öğretmenim bize okulda her gün ödev verir.',blocks:['My teacher','gives','us','homework','at school','every day.'],answer:'My teacher gives us homework at school every day.'};
function game(){const g=new BistroGame(config,unit.tasks,{liveKitchen:true,rng:seeded()});g.start();return g;}
function arrive(g){let n=0;while(!g.active&&(g.kitchen.pending||g.kitchen.moving)&&n++<300)g.tick(.1);assert.ok(n<300);}
test('phone Light quality keeps antialiasing and a bounded sharper render buffer',()=>{
 for(const mode of ['auto','lite','high'])for(const ratio of [1,2,3]){const p=renderQuality(mode,{pixelRatio:ratio,memory:4,cores:4});assert.equal(p.antialias,true);assert.ok(p.pixelRatio<=2);if(p.tier==='lite'){assert.equal(p.shadows,false);assert.equal(p.pixelRatio,Math.min(ratio,1.5));}}assert.equal(renderQuality('high',{pixelRatio:3}).pixelRatio,2);
});
test('phone preparation gives the meal more area than its translation while every block remains readable',()=>{
 for(const [width,height]of [[315,545],[360,640],[393,680],[390,740],[430,850]]){const r=stationViewport(width,height,'recipe'),p=prepBoardLayout(r.width,r.height,six);assert.equal(p.mode,'phone');assert.ok(p.vessel.width>=(width<320?120:150));assert.ok(p.vessel.width*p.vessel.height>p.note.width*p.note.height);for(const [i,b]of p.sources.entries()){assert.ok(b.label.width>=44&&b.label.height>=44);assert.equal(paperLabelLayout(six.blocks[i],b.label.width,b.label.height).fits,true);}}
});
test('shuffled physical ingredient racks fit the actual phrase assigned to each paper',()=>{
 const w=createRestaurant(config);for(const order of [[5,0,4,1,3,2],[2,4,0,5,1,3],[0,1,2,3,4,5]]){const s=new StationScene(w,{setting:'recipe',task:six,recipe:1,prepPhase:2,order,viewport:{width:320,height:480}});for(const [position,index]of order.entries()){const r=s.prepLayout.sources[position].label;assert.ok(paperLabelLayout(six.blocks[index],r.width,r.height).fits,six.blocks[index]);}s.dispose();}
});
test('nearby task signs describe current available actions and route through the normal kitchen command',()=>{
 const g=game(),t=g.tables[0];let n=0;while(t.plan[t.step]?.setting!=='recipe'&&n++<8){assert.ok(g.kitchen.command('order:0'));arrive(g);assert.ok(g.active);solveActive(g);}assert.ok(n<8);g.kitchen.clean--;g.kitchen.dirty++;
 const before=JSON.stringify({tables:g.tables,stock:g.stock,elapsed:g.elapsed,clean:g.kitchen.clean,dirty:g.kitchen.dirty}),actions=kitchenWorldActions(g);assert.ok(actions.some(a=>a.action==='order:0'&&a.station==='Prep'));assert.ok(actions.some(a=>a.action==='sink'));for(const a of actions){assert.ok(a.available);assert.deepEqual(a.point,kitchenAction(g,a.action).point);}assert.equal(JSON.stringify({tables:g.tables,stock:g.stock,elapsed:g.elapsed,clean:g.kitchen.clean,dirty:g.kitchen.dirty}),before);g.kitchen.command(actions.find(a=>a.action==='order:0').action);arrive(g);assert.equal(g.active.task.kind,'sentence');assert.equal(g.active.tableId,0);
});
test('world task signs disappear during protected English, pause and closing service',()=>{
 const g=game();assert.ok(kitchenWorldActions(g).length);g.paused=true;assert.deepEqual(kitchenWorldActions(g),[]);g.paused=false;g.kitchen.command('order:0');arrive(g);assert.deepEqual(kitchenWorldActions(g),[]);g.active=null;g.closingService=true;assert.deepEqual(kitchenWorldActions(g),[]);
});
test('phone reviews occupy a bounded fraction of the room and desktop review dimensions remain familiar',()=>{
 for(const w of [320,360,393,430]){const p=reviewMetrics(w,680);assert.ok(p.width<=148&&p.width<w*.47);assert.ok(p.height<=140);assert.ok(p.scoreWidth<=192);assert.ok(p.top+p.height<p.bottom);}const desktop=reviewMetrics(1366,768);assert.equal(desktop.width,190);assert.equal(desktop.height,174);
});

test('clustered phone task signs remain separated and avoid camera controls',()=>{
 const rect={left:8,right:385,top:164,bottom:554},camera={left:339,right:383,top:500,bottom:544},input=[{x:140,y:285},{x:130,y:300},{x:110,y:285},{x:140,y:310},{x:150,y:285}],before=JSON.stringify(input),placed=placeWorldBadges(input,rect,[camera]);assert.equal(JSON.stringify(input),before);
 for(const [i,p]of placed.entries()){const a={left:p.x-p.width/2,right:p.x+p.width/2,top:p.y-p.height/2,bottom:p.y+p.height/2};assert.ok(a.left>=rect.left&&a.right<=rect.right&&a.top>=rect.top&&a.bottom<=rect.bottom);for(const b of [...placed.slice(i+1).map(p=>({left:p.x-p.width/2,right:p.x+p.width/2,top:p.y-p.height/2,bottom:p.y+p.height/2})),camera])assert.ok(a.right+2<=b.left||a.left-2>=b.right||a.bottom+2<=b.top||a.top-2>=b.bottom);}
});
