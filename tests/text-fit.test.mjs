import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {labelClass,fitTextLayout,wrapMeasuredText} from '../src/text-fit.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {RECIPES} from '../src/core.mjs';
const bank=JSON.parse(await readFile(new URL('../public/data/language.json',import.meta.url),'utf8')),tasks=bank.flatMap(g=>g.units.flatMap(u=>u.tasks));
const measure=(text,font)=>Array.from(text).reduce((sum,c)=>sum+(/[MWŞĞ]/.test(c)?.9:/[ilı.,' ]/.test(c)?.28:.59)*font,0);
test('long delivery labels get a full row and preserve all words in their markup',()=>{
  for(const text of ['responsibility','neighbourhood','police station','Please deliver the classroom dictionaries to the school library.']){const html=taskMarkup({kind:'vocabulary',prompt:text,answer:text,options:[text],translation:text},{recipe:RECIPES[0],options:[text]});if(text.length>18||text.split(/\s+/).some(w=>w.length>10))assert.equal(labelClass(text),'label-choice--wide');assert.ok(html.includes(text));assert.ok(html.includes('class="label-text"'));assert.ok(html.includes('lang="en"'));}
});
test('all delivery words and 3D paper sentences fit without losing letters',()=>{
  const labels=new Set(tasks.filter(t=>['vocabulary','description'].includes(t.kind)).flatMap(t=>t.options));
  for(const text of labels){const r=fitTextLayout(text,{width:924,height:250,maxFont:104,minFont:28,lineSpacing:1.15,measure});assert.ok(!r.belowPreferredMinimum);assert.ok(r.lines.every(line=>measure(line,r.font)<=924));assert.ok(r.lines.length*r.lineHeight<=250);assert.equal(r.lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));}
  for(const text of tasks.filter(t=>['completion','repair','sentence'].includes(t.kind)).map(t=>t.readback||t.answer)){const r=fitTextLayout(text,{width:620,height:340,maxFont:48,minFont:20,lineSpacing:1.35,measure});assert.ok(!r.belowPreferredMinimum,text);assert.equal(r.lines.join('').replace(/\s/g,''),text.replace(/\s/g,''));}
  const long='extraordinarilylongunbrokenlabel';const lines=wrapMeasuredText(long,80,s=>measure(s,14));assert.ok(lines.length>1);assert.equal(lines.join(''),long);
});
test('delivery controls allow natural height, wrapping and full-row long labels',async()=>{
  const css=await readFile(new URL('../public/stations.css',import.meta.url),'utf8');assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));assert.match(css,/\.label-choice--wide[^}]*grid-column:1\/-1/);assert.match(css,/\.label-choice>\.label-text[^}]*overflow-wrap:anywhere/);assert.match(css,/\.delivery-labels>\.label-choice\{[^}]*height:auto/);assert.match(css,/\.label-choice>\.answer-key\{[^}]*position:absolute/);
});
