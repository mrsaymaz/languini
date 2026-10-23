import {Element as ParsedElement} from './dom-double.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {build} from 'esbuild';
import {getLanguageBank,artworkSource,messageTargetOrigin} from '../src/local-runtime.mjs';
import {FLUENT_WORDS} from '../src/fluent-emoji.mjs';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const startup=await readFile(new URL('../public/startup.js',import.meta.url),'utf8');
const output=await build({entryPoints:[fileURLToPath(new URL('../src/app.mjs',import.meta.url))],bundle:true,write:false,minify:true,format:'iife',target:['es2020'],logLevel:'silent'});
const bundle=output.outputFiles[0].text;
// Replace only the GPU boundary. The shipped entry, restaurant construction,
// camera, first update and animation callbacks still execute their real code.
const rendererOutput=await build({entryPoints:[fileURLToPath(new URL('../src/app.mjs',import.meta.url))],bundle:true,write:false,minify:true,format:'iife',target:['es2020'],logLevel:'silent',plugins:[{
  name:'renderer-boundary',setup(builder){
    builder.onResolve({filter:/^three$/},()=>({path:'three',namespace:'renderer-boundary'}));
    builder.onLoad({filter:/.*/,namespace:'renderer-boundary'},()=>({resolveDir:fileURLToPath(new URL('../',import.meta.url)),contents:`
      export * from ${JSON.stringify(fileURLToPath(import.meta.resolve('three')))};
      export class WebGLRenderer {
        constructor(){this.domElement=document.createElement('canvas');this.shadowMap={};}
        setPixelRatio(){} setSize(){}
        render(scene,camera){
          if(globalThis.__rendererFailure)throw new Error(globalThis.__rendererFailure);
          if(!scene.isScene||!camera.isCamera)throw new Error('Missing restaurant scene or camera');
          let meshes=0;scene.traverseVisible(o=>{if(o.isMesh)meshes++;});
          globalThis.__rendererFrames.push({meshes,projection:[...camera.projectionMatrix.elements]});
        }
      }
    `}));
  }
}]});
const rendererBundle=rendererOutput.outputFiles[0].text;

function environment({storageBlocked=false,reduced=false,savedProfile=null}={}){
  const nodes=new Map(),events=new Map(),timers=new Map(),frames=new Map(),errors=[],metrics={fetches:0,frames:0,reloads:0};let serial=0;
  class Element {
    constructor(tag='DIV'){this.tagName=tag;this.hidden=false;this.children=[];this.dataset={};this.attributes={};this.style={setProperty(){}};this.listeners=new Map();this.classList={add(){},remove(){},toggle(){}};this.innerHTML='';this.textContent='';this.clientWidth=393;this.clientHeight=740;}
    getBoundingClientRect(){return {left:0,top:0,right:this.clientWidth,bottom:this.clientHeight,width:this.clientWidth,height:this.clientHeight};}
    set innerHTML(value){this._html=String(value);this._parsed=new ParsedElement();this._parsed.innerHTML=this._html;}get innerHTML(){return this._html; }
    setAttribute(k,v){this.attributes[k]=v;}addEventListener(k,v){this.listeners.set(k,v);}querySelectorAll(selector){return this._parsed?.querySelectorAll(selector)||[];}querySelector(selector){return selector?.startsWith('#')?nodes.get(selector.slice(1))||null:this._parsed?.querySelector(selector)||null;}focus(){}append(...children){this.children.push(...children);}prepend(...children){this.children.unshift(...children);}replaceChildren(...children){this.children=children;this.innerHTML='';}getContext(){return null;}
  }
  for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/gi)){const node=new Element(m[1].toUpperCase());node.hidden=/\bhidden\b/.test(m[0]);nodes.set(m[2],node);}
  const document={getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],createElement:tag=>new Element(tag.toUpperCase()),createElementNS:(_ns,tag)=>new Element(tag.toUpperCase()),body:new Element(),documentElement:new Element(),addEventListener(k,v){events.set('document:'+k,v);}};
  const location={protocol:'file:',origin:'null',href:'file:///Rune%20Bistro/index.html',search:'',reload(){metrics.reloads++;}};
  const window={location,matchMedia:()=>({matches:reduced}),addEventListener(k,v){events.set(k,v);},localStorage:{getItem:()=>savedProfile?JSON.stringify(savedProfile):null,setItem(){}},innerWidth:393,innerHeight:740};window.parent=window;
  if(storageBlocked)Object.defineProperty(window,'localStorage',{get(){throw Error('Local storage is blocked');}});
  const sandbox={window,self:window,document,location,URL,URLSearchParams,AbortController,performance,innerWidth:393,innerHeight:740,
    console:{log(){},warn(){},error(...args){errors.push(args);}},
    setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,delay});return id;},clearTimeout(id){timers.delete(id);},
    __rendererFrames:[],__rendererFailure:null,ResizeObserver:class{observe(){}},
    requestAnimationFrame(fn){metrics.frames++;const id=++serial;frames.set(id,fn);return id;},fetch(){metrics.fetches++;throw Error('file:// fetch deliberately blocked');}};
  vm.createContext(sandbox);vm.runInContext(startup,sandbox);
  function nextFrame(ms){const [id,fn]=frames.entries().next().value||[];assert.ok(fn,'A restaurant frame must be scheduled');frames.delete(id);fn(ms);}
  return {sandbox,nodes,events,timers,frames,errors,metrics,window,nextFrame};
}

test('the real opening scene renders with no service, changes arenas, starts and returns to setup',async()=>{
  for(const reduced of [false,true]){
    const env=environment({reduced});vm.runInContext(rendererBundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();
    assert.equal(env.nodes.get('loading').hidden,true);assert.equal(env.nodes.get('setup').hidden,false);
    assert.ok(env.sandbox.__rendererFrames.length>=1,'Opening requires a successful restaurant frame');
    for(const [index,arena]of ['courtyard','bistro','banquet'].entries()){
      env.nodes.get('setup-form').listeners.get('click')({target:{closest:()=>({dataset:{select:'arena',value:arena}})}});
      env.nextFrame(16*(index+1));
    }
    env.nodes.get('setup-form').listeners.get('submit')({preventDefault(){}});env.nextFrame(64);assert.equal(env.nodes.get('takeover-story').hidden,false);assert.equal(env.nodes.get('play').hidden,true);env.nodes.get('story-skip').listeners.get('click')();env.nextFrame(80);
    assert.equal(env.nodes.get('play').hidden,false);
    env.nodes.get('quit-button').listeners.get('click')();env.nextFrame(80);env.nextFrame(96);
    assert.equal(env.nodes.get('setup').hidden,false);assert.equal(env.nodes.get('play').hidden,true);
    assert.equal(env.frames.size,1);assert.equal(env.metrics.fetches,0);assert.equal(env.errors.length,0);
    for(const frame of env.sandbox.__rendererFrames){assert.ok(frame.meshes>100);assert.ok(frame.projection.every(Number.isFinite));}
  }
});

test('a first-frame render failure keeps startup blocked and offers a visible retry',async()=>{
  const env=environment();env.sandbox.__rendererFailure='Test: restaurant first frame failed';vm.runInContext(rendererBundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();
  assert.equal(env.nodes.get('setup').hidden,true);assert.equal(env.nodes.get('loading').hidden,false);assert.equal(env.frames.size,0);
  assert.match(env.nodes.get('loading').children[2].textContent,/restaurant first frame failed/);assert.equal(env.nodes.get('loading').children.at(-1).textContent,'Try again');
});

test('an animation-frame render failure after opening gives a retry instead of silently freezing',async()=>{
  const env=environment();vm.runInContext(rendererBundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();
  assert.equal(env.nodes.get('loading').hidden,true);env.sandbox.__rendererFailure='Test: restaurant frame interrupted';assert.doesNotThrow(()=>env.nextFrame(16));
  assert.equal(env.nodes.get('loading').hidden,false);assert.equal(env.frames.size,0);assert.match(env.nodes.get('loading').children[2].textContent,/restaurant frame interrupted/);
  env.nodes.get('loading').children.at(-1).listeners.get('click')();assert.equal(env.metrics.reloads,1);
});

test('the exact game entry can finish local startup with every network request blocked',async()=>{
  const env=environment();vm.runInContext(bundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();
  assert.equal(env.metrics.fetches,0);assert.equal(env.nodes.get('loading').hidden,true);assert.equal(env.nodes.get('setup').hidden,false);assert.equal(env.metrics.frames,1);
  assert.equal((env.nodes.get('lesson-grade-options').innerHTML.match(/data-lesson-grade=/g)||[]).length,4);assert.match(env.nodes.get('lesson-unit-list').innerHTML,/School Life/);assert.equal(env.timers.size,0);
  // The test intentionally has no WebGL renderer: its separate graphics message is visible.
  assert.match(env.nodes.get('graphics-warning').textContent,/WebGL/);assert.ok(!env.errors.some(args=>args.some(v=>String(v).includes('ReferenceError'))));
});

test('blocked file-origin storage does not prevent the setup screen from opening',async()=>{
  const env=environment({storageBlocked:true});vm.runInContext(bundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();assert.equal(env.nodes.get('loading').hidden,true);assert.equal(env.nodes.get('setup').hidden,false);
});

test('local artwork is embedded and exactly matches every shipped Fluent image',async()=>{
  for(const src of new Set(Object.values(FLUENT_WORDS).map(a=>a.src))){const local=artworkSource(src,{protocol:'file:'});assert.ok(local.startsWith('data:image/webp;base64,'));const bytes=Buffer.from(local.split(',')[1],'base64'),original=await readFile(new URL('../public/'+src.slice(2),import.meta.url));assert.deepEqual(bytes,original);assert.equal(artworkSource(src,{protocol:'https:'}),src);}
  assert.equal(getLanguageBank().reduce((n,g)=>n+g.units.length,0),44);assert.equal(getLanguageBank().flatMap(g=>g.units.flatMap(u=>u.tasks)).length,4805);
});

test('the extracted index loads classic scripts in startup order without module imports',()=>{
  assert.ok(!html.includes('type="module"'));assert.ok(html.indexOf('./startup.js?')<html.indexOf('./game.js?'));assert.doesNotThrow(()=>new vm.Script(bundle));assert.ok(!/\bimport\.meta\b/.test(bundle));
});

test('script load failures and initialization exceptions replace the spinner with a retry',()=>{
  for(const event of [{target:{tagName:'SCRIPT'}},{message:'A test initialization error'}]){const env=environment();env.events.get('error')(event);const panel=env.nodes.get('loading');assert.equal(panel.hidden,false);assert.match(panel.children[0].textContent,/could not open/);assert.equal(panel.children.at(-1).textContent,'Try again');assert.equal(env.timers.size,0);panel.children.at(-1).listeners.get('click')();assert.equal(env.metrics.reloads,1);}
});

test('a stalled startup has a finite timeout and does not silently hide its error',()=>{
  const env=environment(),watchdog=[...env.timers.values()][0];assert.equal(watchdog.delay,15000);watchdog.fn();assert.match(env.nodes.get('loading').children[2].textContent,/too long/);assert.equal(env.window.RuneBistroStartup.ready(),false);
});

test('the phone frame uses an explicit local HTML path and permits only its own window messages',async()=>{
  const phone=await readFile(new URL('../public/phone-preview.html',import.meta.url),'utf8'),script=await readFile(new URL('../public/phone-preview.js',import.meta.url),'utf8');assert.ok(phone.includes('src="./index.html?preview=phone'));assert.ok(!phone.includes('href="./"'));assert.equal(messageTargetOrigin({protocol:'file:',origin:'null'}),'*');assert.equal(messageTargetOrigin({protocol:'https:',origin:'https://example.com'}),'https://example.com');assert.ok(script.includes('e.source===frame.contentWindow'));assert.ok(script.includes('e.origin===location.origin'));assert.ok(script.includes("location.protocol==='file:'?'*':location.origin"));
});


test('actual setup blocks later arenas and cached selection until a saved Cafe win exists',async()=>{
 for(const won of [false,true,'diner']){
  const savedProfile={version:1,config:{grade:5,unit:'g5u1',team:'gryffindor',arena:'banquet',difficulty:'relaxed'},records:won?{'5:g5u1:gryffindor:relaxed:courtyard':{wins:1,stars:1,served:6,accuracy:80},...(won==='diner'?{'5:g5u1:gryffindor:relaxed:bistro':{wins:1,stars:1,served:8,accuracy:80}}:{})}:{}};
  // Three procedural room rebuilds can trigger GC in the bounded software VM.
  // Keep the startup/arena assertions below; this is not a device-speed test.
  const env=environment({reduced:true,savedProfile});vm.runInContext(rendererBundle,env.sandbox,{timeout:30000});await Promise.resolve();await Promise.resolve();
  for(const arena of ['bistro','banquet']){const button=env.nodes.get('arena-options').innerHTML.match(new RegExp(`<button[^>]*data-value="${arena}"[^>]*>`))[0];assert.equal(button.includes('disabled'),arena==='banquet'?won!=='diner':!won);}
  env.nodes.get('setup-form').listeners.get('click')({target:{closest:()=>({dataset:{select:'arena',value:'bistro'}})}});env.nodes.get('setup-form').listeners.get('submit')({preventDefault(){}});env.nodes.get('story-skip').listeners.get('click')();env.nextFrame(16);assert.equal(env.nodes.get('play-arena').textContent,won?'Languini Diner':'Languini Cafe');assert.equal(env.errors.length,0);
 }
});


test('tab return keeps Resume accessible and repeated hide/focus cycles preserve one render loop',async()=>{
 const env=environment({reduced:true});vm.runInContext(rendererBundle,env.sandbox,{timeout:10000});await Promise.resolve();await Promise.resolve();
 env.nodes.get('setup-form').listeners.get('submit')({preventDefault(){}});env.nodes.get('story-skip').listeners.get('click')();env.nextFrame(16);
 for(let i=0;i<3;i++){
  env.sandbox.document.hidden=true;env.events.get('document:visibilitychange')();assert.equal(env.nodes.get('pause-modal').hidden,false);assert.equal(env.sandbox.document.documentElement.dataset.paused,'true');
  env.nodes.get('resume-button').listeners.get('click')();assert.equal(env.sandbox.document.documentElement.dataset.paused,'true','Hidden page cannot resume timers');
  env.nextFrame(60000*(i+1));env.sandbox.document.hidden=false;env.events.get('document:visibilitychange')();env.events.get('focus')();assert.equal(env.nodes.get('pause-modal').hidden,false);
  env.nodes.get('resume-button').listeners.get('click')();env.nextFrame(60000*(i+1)+16);assert.equal(env.nodes.get('pause-modal').hidden,true);assert.equal(env.sandbox.document.documentElement.dataset.paused,'false');assert.equal(env.frames.size,1);
 }
 const css=await readFile(new URL('../public/motion.css',import.meta.url),'utf8');assert.ok(!css.includes('[data-paused=true] *,'));assert.match(css,/#pause-modal \.small-modal\{animation:none;opacity:1/);assert.equal(env.errors.length,0);
});
