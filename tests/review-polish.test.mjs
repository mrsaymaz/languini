import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reviewCardPose} from '../src/review-card-motion.mjs';
import {DINING} from '../src/customer-reviews.mjs';
import {receiptReadMilliseconds,RECEIPT_FEED_MS} from '../src/receipt-reading.mjs';
import {receivingLayout} from '../src/receiving-layout.mjs';
import {deliveryPageLayout} from '../src/page-fit.mjs';

test('review revolves around its own vertical axis, displays the back and fades only after most of its turn',()=>{
 const settled=reviewCardPose('review',1),start=reviewCardPose('spin',0),middle=reviewCardPose('spin',.5),end=reviewCardPose('spin',1);
 for(const key of ['rx','ry','rz','lift','scale','opacity'])assert.ok(Math.abs(start[key]-settled[key])<1e-9,key+' is continuous');
 assert.equal(end.ry-start.ry,360);assert.equal(middle.ry,186);assert.ok(middle.backLight>middle.frontLight);assert.equal(middle.opacity,1);assert.equal(end.opacity,0);assert.ok(DINING.spin>=1);
 let previous=start.ry;
 for(let i=0;i<=200;i++){const p=reviewCardPose('spin',i/200);assert.ok(p.ry>=previous);previous=p.ry;for(const v of Object.values(p))assert.ok(Number.isFinite(v));assert.ok(p.scale>=.8&&p.scale<=1);}
 const nearStart=reviewCardPose('spin',.001),nearEnd=reviewCardPose('spin',.999);assert.ok(nearStart.ry-start.ry<.002);assert.ok(end.ry-nearEnd.ry<.002);
 for(const p of [0,.25,.5,1]){const pose=reviewCardPose('spin',p,{reduced:true});assert.equal(pose.ry,0);assert.equal(pose.rx,0);assert.equal(pose.rz,0);assert.equal(pose.lift,0);assert.equal(pose.scale,1);}
 const css=fs.readFileSync(new URL('../public/customer-reviews.css',import.meta.url),'utf8');assert.match(css,/perspective:850px/);assert.match(css,/transform-style:preserve-3d/);assert.match(css,/backface-visibility:hidden/);assert.match(css,/rotateY\(180deg\) translateZ\(3px\)/);for(const edge of ['left','right','top','bottom'])assert.ok(css.includes('.edge-'+edge));
});

test('every corrected check reads for exactly two seconds less while the physical feed stays unchanged',()=>{
 const tasks=JSON.parse(fs.readFileSync(new URL('../public/data/language.json',import.meta.url))).flatMap(g=>g.units.flatMap(u=>u.tasks)).filter(t=>t.kind==='repair');
 for(const t of tasks){const text=t.readback||t.prompt.replace('___',t.answer),words=text.trim().split(/\s+/).length,previous=Math.min(5000,Math.max(2400,1600+words*190));assert.equal(receiptReadMilliseconds(text),previous-2000);assert.ok(receiptReadMilliseconds(text)>=400);}
 assert.equal(RECEIPT_FEED_MS,850);
});

test('delivery backing gives surplus space to the crate while preserving label dimensions',()=>{
 for(const [width,height]of [[357,578],[394,688],[760,280]]){
  const content={prompt:'elma',options:['apple','orange','banana','pear']},l=receivingLayout(width,height,false,content),paper=l.manifest,old=l.originalPaper,labels=l.labelLayout;
  assert.ok(paper.width*paper.height<old.width*old.height*.85,'Backing has materially less blank area');
  const fit=deliveryPageLayout({width:paper.width-2,height:paper.height-2,...content,preferredColumns:labels.columns,compactPaper:true,minimumRowHeight:labels.rowHeight});
  assert.ok(fit.fits);assert.ok(fit.rowHeight>=labels.rowHeight-.05);assert.ok(fit.cellWidth>=labels.cellWidth-.05);
  if(width===357)assert.ok(l.crate.width>270,'The phone crate grows from the previous ~240 px layout');
 }
});
