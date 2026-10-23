import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {menuPageLayout,listeningPageLayout,paperLabelLayout,deliveryPageLayout,recipeNoteLayout,conversationPageLayout,textLines} from '../src/page-fit.mjs';
import {prepBoardLayout} from '../src/prep-layout.mjs';
import {receivingLayout} from '../src/receiving-layout.mjs';
import {matchingVocabulary} from '../src/tablet-matching.mjs';
import {stationViewport,ObjectStationUI,fitSurfaceCamera,projectSurface,surfaceTransform} from '../src/object-layout.mjs';
import {createRestaurant,setTableCustomer} from '../src/restaurant.mjs';
import {StationScene} from '../src/station-scene.mjs';
import {createDeliveryPackage,PACKAGE_TYPES,packageVariant} from '../src/delivery-props.mjs';
import {documentDouble} from './dom-double.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))),units=bank.flatMap(g=>g.units),tasks=units.flatMap(u=>u.tasks),fonts=JSON.parse(fs.readFileSync(new URL('./fixtures/mobile-font-metrics.json',import.meta.url)));
const phones=[[320,480],[320,568],[360,640],[393,740],[430,850],[390,844],[568,320],[667,375],[844,390],[1024,600]];
const measurer=font=>{const cache=new Map();return (text,size)=>{const key=size+':'+text;if(!cache.has(key))cache.set(key,Array.from(text).reduce((n,c)=>n+(font.advances[c]??.7)*size,0));return cache.get(key);};};
function optionsFor(t,measure,count=4){return [t.answer,...[...new Set(t.options)].filter(x=>x!==t.answer).sort((a,b)=>measure(b,16)-measure(a,16)).slice(0,count-1)];}
function screenSize(w,h,setting){const r=stationViewport(w,h,setting);if(setting==='tablet'){const ratio=Math.max(1/2.2,Math.min(1.75,r.height/r.width)),width=Math.min(r.width,r.height/ratio);return {width:width-2,height:width*ratio-2};}return r;}

test('all translation matching choices fit one page in real font metrics across every unit',()=>{
  let cases=0;
  for(const font of fonts){const measure=measurer(font);for(const[w,h]of phones){const size=screenSize(w,h,'tablet');for(const u of units){const words=matchingVocabulary(u.tasks).sort((a,b)=>Math.max(measure(b.word,18),measure(b.translation,18))-Math.max(measure(a.word,18),measure(a.translation,18)));for(const word of words)for(const count of[3,4]){const pairs=[word,...words.filter(p=>p!==word).slice(0,count-1)];if(pairs.length<3)continue;const p=menuPageLayout({...size,pairs,measure});assert.ok(p.fits,`${font.name} ${w}x${h} ${u.id}: ${word.word}`);assert.ok(p.font>=14.5);assert.ok(p.rowHeight>=44);assert.ok(p.cellWidth>=48);assert.ok(p.textHeight<=p.rowHeight+.01);cases++;}}}}
  assert.ok(cases>=1600);
});

test('picture menu cards and written image fallbacks fit without growing the page',()=>{
  const measure=measurer(fonts[0]);let cases=0;
  for(const[w,h]of phones)for(const u of units){const words=matchingVocabulary(u.tasks,{pictures:true}).sort((a,b)=>measure(b.translation,18)-measure(a.translation,18));for(const word of words)for(const count of[3,4]){const pairs=[word,...words.filter(p=>p!==word).slice(0,count-1)];if(pairs.length<3)continue;const p=menuPageLayout({...screenSize(w,h,'tablet'),pairs,mode:'picture',measure});assert.ok(p.fits,`${w}x${h} ${u.id}: ${word.word}`);assert.ok(p.pictureSize>=32);assert.ok(p.pictureSize<=p.rowHeight-9);cases++;}}
  assert.ok(cases>100);
});

test('every one- and two-word listening menu keeps all choices and confirmation on its page',()=>{
  let cases=0;for(const font of fonts){const measure=measurer(font);for(const[w,h]of phones)for(const t of tasks.filter(t=>t.kind==='vocabulary'))for(const requested of[false,true]){const p=listeningPageLayout({...screenSize(w,h,'tablet'),options:optionsFor(t,measure),requested,measure});assert.ok(p.fits,`${font.name} ${w}x${h} ${t.id} two=${requested}`);assert.ok(p.rowHeight>=44);assert.ok(p.font>=15);cases++;}}
  assert.equal(cases,fonts.length*phones.length*1054*2);
});

test('all vocabulary and definition delivery labels retain their size on a compact backing paper',()=>{
 let cases=0,trimmed=0;
 for(const font of fonts){const measure=measurer(font);for(const[w,h]of phones){const r=stationViewport(w,h,'delivery');for(const t of tasks.filter(t=>['vocabulary','description'].includes(t.kind)))for(const count of[3,4]){
  const options=optionsFor(t,measure,count),l=receivingLayout(r.width,r.height,false,{prompt:t.prompt,options,measure}),manifest=l.manifest;
  const p=deliveryPageLayout({width:manifest.width-2,height:manifest.height-2,prompt:t.prompt,options,measure,preferredColumns:l.labelLayout?.columns,compactPaper:!!l.labelLayout,minimumRowHeight:l.labelLayout?.rowHeight||0});
  assert.ok(p.fits,`${font.name} ${w}x${h} ${t.id}`);assert.ok(p.rowHeight>=44);assert.ok(p.font>=15);
  if(l.labelLayout){assert.ok(p.rowHeight>=l.labelLayout.rowHeight-.05,'Label cards retain their height');assert.ok(p.cellWidth>=l.labelLayout.cellWidth-.05,'Label cards retain their width');assert.ok(manifest.width<=l.originalPaper.width);assert.ok(manifest.height<=l.originalPaper.height);if(manifest.height<l.originalPaper.height-5)trimmed++;}cases++;
 }}}
 assert.equal(cases,fonts.length*phones.length*(1054+787)*2);assert.ok(trimmed>cases*.5);
});

test('all 1520 sentence tasks fit the papers beneath the saucers with readable ink',()=>{
  let cases=0;for(const font of fonts){const measure=measurer(font);for(const[w,h]of phones){const r=stationViewport(w,h,'recipe');for(const t of tasks.filter(t=>t.kind==='sentence')){const l=prepBoardLayout(r.width,r.height,t,{measure});for(const [i,s]of l.sources.entries()){const p=paperLabelLayout(t.blocks[i],s.label.width,s.label.height,measure);assert.ok(p.fits,`${font.name} ${w}x${h} ${t.id}: ${t.blocks[i]}`);assert.ok(p.font>=14.5);assert.ok(s.label.height>=44);assert.ok(s.paper.y>=-1&&s.paper.y+s.paper.height<=l.height+1);assert.ok(s.paper.x<=s.food.x-s.food.size/2&&s.paper.x+s.paper.width>=s.food.x+s.food.size/2);assert.ok(s.label.x>=s.food.x+s.food.size/2+3||s.label.y>=s.food.y+s.food.size/2+3,'Ink stays clear of the food');}
      const note=recipeNoteLayout({width:l.note.width,height:l.note.height,task:t,compact:l.mode!=='columns',measure});assert.ok(note.fits,`${font.name} ${w}x${h} ${t.id}: recipe note`);cases++;}}}
  assert.equal(cases,fonts.length*phones.length*1520);
});

test('all full-sentence guest reply menus fit without a scrolling reply list',()=>{
  let cases=0;for(const font of fonts){const measure=measurer(font);for(const[w,h]of phones){const r=stationViewport(w,h,'conversation');for(const t of tasks.filter(t=>t.kind==='question'))for(const count of[3,4]){const p=conversationPageLayout({...r,task:t,options:optionsFor(t,measure,count),measure});assert.ok(p.fits,`${font.name} ${w}x${h} ${t.id}`);assert.ok(p.font>=14.5);assert.ok(p.rowHeight>=48);if(p.arrangement==='split')assert.ok(p.replyX>=p.questionWidth+10);else assert.ok(p.questionHeight+p.replyHeight+10<=r.height);cases++;}}}
  assert.equal(cases,fonts.length*phones.length*921*2);
});

test('menu font, row heights and positions do not depend on which answers have been matched',()=>{
  const pairs=matchingVocabulary(units[0].tasks).slice(0,4),a=menuPageLayout({width:354,height:560,pairs}),b=menuPageLayout({width:354,height:560,pairs:pairs.map((p,i)=>({...p,matched:i<2,selected:i===2}))});assert.deepEqual(a,b);assert.equal(textLines('responsibility',65,16).join(''),'responsibility');
});

test('notched phones reserve safe controls while matching remains one page',()=>{
  const oldStyle=globalThis.getComputedStyle,oldDocument=globalThis.document;globalThis.document={documentElement:{}};globalThis.getComputedStyle=()=>({getPropertyValue:k=>k.endsWith('top')?'47px':k.endsWith('bottom')?'34px':'0px'});
  try{const r=stationViewport(393,740,'tablet');assert.ok(r.y>=101);assert.ok(740-r.y-r.height>=98);const pairs=matchingVocabulary(units[0].tasks).slice(0,4);assert.ok(menuPageLayout({width:r.width-2,height:r.height-2,pairs}).fits);}finally{globalThis.getComputedStyle=oldStyle;globalThis.document=oldDocument;}
});

test('all 24 customer shapes give the tablet its full upright phone work area',()=>{
  const world=createRestaurant(),measure=measurer(fonts[0]),vocab=units.map(u=>matchingVocabulary(u.tasks).sort((a,b)=>Math.max(measure(b.word,18),measure(b.translation,18))-Math.max(measure(a.word,18),measure(a.translation,18))).slice(0,4)).filter(p=>p.length>=3),task={id:'framing',kind:'matching',mode:'translation',pairs:vocab[0]};let cases=0;
  for(let customer=0;customer<24;customer++){setTableCustomer(world,0,customer);world.tables[0].guest.root.visible=true;for(const[width,height]of phones){const s=new StationScene(world,{setting:'tablet',task,viewport:{width,height}}),f=fitSurfaceCamera(s.focusSurface,width,height,{setting:'tablet',offset:s.cameraOffset}),camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,90);camera.position.copy(f.position);camera.up.copy(f.up);camera.lookAt(f.target);camera.updateProjectionMatrix();camera.updateMatrixWorld();const t=surfaceTransform(projectSurface(s.focusSurface,camera,width,height)),expected=screenSize(width,height,'tablet');
    assert.ok(Math.abs(t.matrix[0]-1)<1e-6&&Math.abs(t.matrix[1])<1e-6&&Math.abs(t.matrix[2])<1e-6&&Math.abs(t.matrix[3]-1)<1e-6,'The full menu stays upright');assert.ok(Math.abs(t.width-2-expected.width)<.01&&Math.abs(t.height-2-expected.height)<.01,'The held screen uses the planned page, not a shrunken rotated bounding box');assert.ok(s.tabletHome.position.y<s.tabletScreen.position.y-s.surfaces.main.height/2-.01&&Math.abs(s.tabletHome.position.y)<(s.surfaces.main.height+.15)/2,'The home bar stays in the bezel, outside the menu');for(const pairs of vocab)assert.ok(menuPageLayout({width:t.width-2,height:t.height-2,pairs,measure}).fits,`${customer} at ${width}x${height}`);
    if((width===320&&height===480)||(width===568&&height===320)){const meshes=[];world.root.updateMatrixWorld(true);world.root.traverseVisible(o=>{if(o.isMesh&&o.material.visible!==false)meshes.push(o);});for(const x of[-.4,0,.4])for(const y of[-.4,0,.4]){const p=s.tabletScreen.localToWorld(new THREE.Vector3(x*.92,y*s.surfaces.main.height,.014)).project(camera),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);ray.near=camera.near;const first=ray.intersectObjects(meshes,false)[0];assert.ok(first?.object===s.tabletScreen,`Customer ${customer} cannot cover the menu at ${width}x${height} (${x},${y}): ${first?.object.geometry?.type} ${first?.object.material?.color?.getHexString()} d=${first?.distance}`);}}
    s.dispose();cases++;}}
  assert.equal(cases,240);
});

test('prep saucers retain the old physical relationship: the cream paper lies below the food',()=>{
  const w=createRestaurant(),task=tasks.find(t=>t.kind==='sentence');for(const[width,height]of[[320,480],[393,740],[844,390]]){const s=new StationScene(w,{setting:'recipe',task,recipe:0,order:[2,0,1],viewport:{width,height}});for(const tray of s.trays){const paper=tray.paper.mesh.getWorldPosition(new THREE.Vector3()),food=tray.asset.getWorldPosition(new THREE.Vector3());assert.ok(paper.y<food.y);assert.ok(tray.paper.height>0&&tray.paper.width>0);assert.equal(tray.link,undefined,'No floating string-tag replaces the prep paper');}s.dispose();}
});

test('delivery packages have six distinct low-poly silhouettes and finite shared geometry',()=>{
  const w=createRestaurant();const signatures=new Set();for(let i=0;i<6;i++){const p=createDeliveryPackage(w.palette,i),bounds=new THREE.Box3().setFromObject(p);assert.equal(p.userData.packageType,PACKAGE_TYPES[i]);assert.ok(p.userData.representative);assert.ok(bounds.max.y<.8);const parts=[];p.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.userData.shared);for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));parts.push(o.geometry.type+':'+o.geometry.attributes.position.count);}});signatures.add(parts.join('|'));}assert.equal(signatures.size,6);assert.equal(w.supplyProps.length,5);
});

test('incoming parcel and both sorting trays occupy separate readable work areas',()=>{
  for(const[w,h]of phones){const r=stationViewport(w,h,'delivery'),l=receivingLayout(r.width,r.height,true);for(const b of l.bins){assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=l.width&&b.y+b.height<=l.height);const overlapX=Math.max(0,Math.min(b.x+b.width,l.card.x+l.card.width)-Math.max(b.x,l.card.x)),overlapY=Math.max(0,Math.min(b.y+b.height,l.card.y+l.card.height)-Math.max(b.y,l.card.y));assert.equal(overlapX*overlapY,0,'Parcel label cannot cover a tray');}assert.ok(l.card.y+l.card.height<=l.height);}
});

test('package appearance rotates independently of the assessed sorting category',()=>{
  const categories=[0,0,1,0,1,1];for(let offset=0;offset<6;offset++){const variants=categories.map((_,i)=>packageVariant(offset,i));assert.equal(new Set(variants).size,6);assert.notEqual(variants[0],variants[1]);assert.notEqual(variants[2],variants[4]);}
});

test('the live page audit requests a bounded refit when actual browser ink exceeds a button',()=>{
  const d=documentDouble(),root=d.getElementById('task-card');root.innerHTML='<div data-page="matching"><button><span class="pair-label">responsibility</span></button></div>';const main=root.querySelector('[data-page]'),button=main.querySelector('button'),ink=button.querySelector('.pair-label');main.clientHeight=300;main.rect={left:10,top:80,right:310,bottom:380,width:300,height:300};button.rect={left:25,top:110,right:155,bottom:165,width:130,height:55};ink.rect={left:30,top:116,right:150,bottom:159,width:120,height:43};const ui=new ObjectStationUI(root,()=>null);ui.inkScale=1;ui.auditRetries=0;ui.layoutKey='old';ui.auditPage();assert.equal(main.dataset.overflow,'false');ink.rect.bottom=190;ui.auditPage();assert.equal(main.dataset.overflow,'true');assert.equal(ui.auditRetries,1);assert.equal(ui.layoutKey,'');ui.auditPage();ui.auditPage();assert.equal(ui.auditRetries,2,'No endless refit cycle');
});

test('the shipped phone page uses the real game and enables header controls and whole-sticker dragging',()=>{
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../public/mobile.css',import.meta.url),'utf8');assert.ok(html.includes('id="choose-lesson"'));assert.ok(html.includes('id="lesson-modal"'));assert.ok(!html.includes('id="unit-select"'));assert.ok(html.includes('class="setup-quick-tools"'));assert.ok(css.includes('.setup-quick-tools{pointer-events:auto}'));assert.ok(css.includes('min-height:44px'));assert.ok(css.includes('grid-template-columns:repeat(var(--page-columns)'));assert.ok(!css.includes('line-clamp'));assert.ok(!css.includes('text-overflow:ellipsis'));
});
