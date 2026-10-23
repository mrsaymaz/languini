const stage=document.getElementById('phone-stage'),shell=document.getElementById('phone-shell'),frame=document.getElementById('game-frame'),buttons=[...document.querySelectorAll('[data-setting]')],variants=document.getElementById('menu-variants'),modeButtons=[...document.querySelectorAll('[data-menu-demo]')];
let setting=new URLSearchParams(location.search).get('task')||'tablet',menuMode=new URLSearchParams(location.search).get('menu')||'picture';if(!buttons.some(b=>b.dataset.setting===setting))setting='tablet';if(!modeButtons.some(b=>b.dataset.menuDemo===menuMode))menuMode='picture';
const sizePicker=document.getElementById('preview-size'),recipePicker=document.getElementById('preview-recipe');let size=[393,740],labels=false;
function resize(){shell.style.width=(size[0]+24)+'px';shell.style.height=(size[1]+131)+'px';frame.style.width=size[0]+'px';frame.style.height=size[1]+'px';frame.width=size[0];frame.height=size[1];shell.style.setProperty('--phone-scale',Math.min(1,(stage.clientHeight-10)/(size[1]+131),(stage.clientWidth-8)/(size[0]+24)));}
function reflect(){document.getElementById('pickup-demo-control').hidden=setting!=='pickup';document.getElementById('recipe-demo-control').hidden=setting!=='recipe';document.getElementById('receiving-demo-control').hidden=setting!=='delivery';buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.setting===setting)));variants.hidden=setting!=='tablet';modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.menuDemo===menuMode)));}
function select(next){setting=next;reflect();frame.contentWindow?.postMessage({type:'bistro-demo',setting,menuMode,difficulty:setting==='pickup'?document.getElementById('pickup-difficulty').value:null,recipe:setting==='recipe'?+recipePicker.value:null,labels:setting==='delivery'&&labels},location.protocol==='file:'?'*':location.origin);}
buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.setting)));
modeButtons.forEach(b=>b.addEventListener('click',()=>{menuMode=b.dataset.menuDemo;select('tablet');}));
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='bistro-ready')select(setting);});
new ResizeObserver(resize).observe(stage);resize();reflect();

sizePicker.addEventListener('change',()=>{size=sizePicker.value.split(',').map(Number);resize();document.getElementById('preview-size-note').textContent=size.join(' × ')+' browser view · preview progress is separate from your café.';});
recipePicker.addEventListener('change',()=>select('recipe'));document.getElementById('preview-labels').addEventListener('click',()=>{labels=true;select('delivery');});document.getElementById('preview-sorting').addEventListener('click',()=>{labels=false;setting='service';select('delivery');});

document.getElementById('pickup-difficulty').addEventListener('change',()=>select('pickup'));
