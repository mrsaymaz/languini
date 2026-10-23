// Real CSS/DOM regression harness; this does not replace the full WebGL checks.
import {choicesFor} from '../src/core.mjs';
import {taskMarkup} from '../src/task-ui.mjs';
import {stationViewport,ObjectStationUI} from '../src/object-layout.mjs';
import {receivingLayout} from '../src/receiving-layout.mjs';
import {browserTextMeasure} from '../src/page-fit.mjs';
window.checkLabelControls=async tasks=>{
 const root=document.getElementById('task-card'),width=innerWidth,height=innerHeight,measure=browserTextMeasure(root),viewport=stationViewport(width,height,'delivery'),view={container:{clientWidth:width,clientHeight:height}};
 const ui=new ObjectStationUI(root,()=>view),issues=[];let cases=0;const byShape=new Map();
 for(const task of tasks)for(const difficulty of ['relaxed','challenge']){
  // Stable variation covers correct answers in every cell over the viewport run.
  let seed=cases+width*height;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const options=choicesFor(task,difficulty,rng),layout=receivingLayout(viewport.width,viewport.height,false,{prompt:task.prompt,options,measure});
  root.innerHTML=taskMarkup(task,{options,shared:true});const main=root.querySelector('[data-page]');main.classList.add('object-surface');Object.assign(main.style,{left:viewport.x+layout.manifest.x+'px',top:viewport.y+layout.manifest.y+'px',width:layout.manifest.width+'px',height:layout.manifest.height+'px',transform:'none'});
  ui.layoutKey='';ui.inkScale=1;ui.fitPages({context:{task,options},receivingLayout:layout});
  const paper=main.getBoundingClientRect(),buttons=[...root.querySelectorAll('.label-choice')];
  for(const button of buttons){const b=button.getBoundingClientRect(),ink=button.querySelector('.label-text').getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2),bad=b.left<paper.left-1||b.right>paper.right+1||b.top<paper.top-1||b.bottom>paper.bottom+1||b.width<43||b.height<43||!button.contains(hit)||ink.top<b.top-1||ink.bottom>b.bottom+1||ink.left<b.left-1||ink.right>b.right+1;
   if(bad&&issues.length<30)issues.push({id:task.id,difficulty,text:button.textContent,paper:paper.toJSON(),button:b.toJSON(),ink:ink.toJSON(),hit:hit?.className,columns:main.style.getPropertyValue('--page-columns')});
  }
  if(buttons.filter(b=>b.textContent.trim()===task.answer).length!==1)issues.push({id:task.id,reason:'Correct answer is not rendered exactly once'});
  const shape=options.length+' choices / '+main.style.getPropertyValue('--page-columns')+' columns';byShape.set(shape,(byShape.get(shape)||0)+1);cases++;
  if(cases%160===0)await new Promise(r=>setTimeout(r,0));
 }
 return {width,height,cases,issues,shapes:Object.fromEntries(byShape)};
};
