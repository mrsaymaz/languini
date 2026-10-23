import {checkoutStep} from './checkout-guidance.mjs';
// Layout uses actual font advances in the browser. The fallback is deliberately
// conservative for scene construction and server-side regression checks.
export const estimateText=(text,size)=>Array.from(String(text)).reduce((n,c)=>n+size*(/[MWĞÖÜŞÇ@]/.test(c)?.86:/[ilıI.,'! ]/.test(c)?.30:/[a-zçğıöşü]/i.test(c)?.58:.65),0);
export function textLines(text,width,size,measure=estimateText){
  const lines=[];let line='';
  for(const word of String(text).trim().split(/\s+/)){
    if(!word)continue;
    if(measure((line?line+' ':'')+word,size)<=width){line+=(line?' ':'')+word;continue;}
    if(line){lines.push(line);line='';}
    if(measure(word,size)<=width){line=word;continue;}
    let piece='';for(const c of Array.from(word)){if(piece&&measure(piece+c,size)>width){lines.push(piece);piece='';}piece+=c;}line=piece;
  }
  if(line)lines.push(line);return lines.length?lines:[''];
}
function matchingCandidate({width,height,pairs,mode,measure,flow,font,gap,padding,chrome='full'}){
  const n=pairs.length,columns=flow==='columns'?2:n,rows=flow==='columns'?n:2,labelRows=flow==='columns'?1:2;
  const header=chrome==='quiet'?20:28,footer=chrome==='quiet'?36:width<380?59:52,legend=chrome==='quiet'?10:13,sectionGap=chrome==='quiet'?4:6;
  const contentHeight=height-padding*2-header-footer-sectionGap*2;
  const rowHeight=(contentHeight-legend*labelRows-gap*(rows+labelRows-1))/rows,cellWidth=(width-padding*2-gap*(columns-1))/columns;
  if(mode==='numbers'){
    const availableWidth=width-padding*2,availableHeight=contentHeight-legend*labelRows-gap*(rows+labelRows-1);
    const wordColumnWidth=flow==='columns'?Math.max(58,Math.min(82,availableWidth*.25)):cellWidth;
    const matchColumnWidth=flow==='columns'?availableWidth-gap-wordColumnWidth:cellWidth;
    const wordRowHeight=flow==='rows'?44:rowHeight,matchRowHeight=flow==='rows'?availableHeight-wordRowHeight:rowHeight;
    const textHeight=Math.max(...pairs.map(p=>textLines(p.translation,matchColumnWidth-20,font,measure).length*font*1.24))+12;
    const fits=wordRowHeight>=44&&matchRowHeight>=Math.max(44,textHeight)&&wordColumnWidth>=48&&matchColumnWidth>=48;
    return {fits,flow,chrome,font,gap,padding,header,footer,legend,sectionGap,columns,rows,rowHeight:Math.min(wordRowHeight,matchRowHeight),cellWidth:Math.min(wordColumnWidth,matchColumnWidth),wordColumnWidth,matchColumnWidth,wordRowHeight,matchRowHeight,pictureSize:0,textHeight};
  }
  const labels=pairs.flatMap(p=>[p.word,p.translation]);
  const textHeight=Math.max(...labels.map(t=>textLines(t,cellWidth-20,font,measure).length*font*1.24))+12;
  const fits=rowHeight>=Math.max(44,textHeight)&&cellWidth>=48;
  return {fits,flow,chrome,font,gap,padding,header,footer,legend,sectionGap,columns,rows,rowHeight,cellWidth,pictureSize:Math.min(76,Math.floor(rowHeight-10),Math.floor(cellWidth-16)),textHeight};
}
export function menuPageLayout({width,height,pairs,mode='translation',measure=estimateText}){
  if(mode==='service-instructions')return packingPageLayout({width,height,pairs,measure});
  const preferred=width/height>1.45?'rows':'columns',fonts=[18,17,16,15.5,15,14.5],spacings=[{gap:8,padding:14},{gap:6,padding:10},{gap:4,padding:8},{gap:4,padding:6}];
  // Keep a stable arrangement throughout the round; matching never changes it.
  for(const font of fonts)for(const chrome of ['full','quiet'])for(const flow of [preferred,preferred==='rows'?'columns':'rows'])for(const spacing of spacings){
    const result=matchingCandidate({width,height,pairs,mode,measure,flow,font,chrome,...spacing});if(result.fits)return result;
  }
  return matchingCandidate({width,height,pairs,mode,measure,flow:preferred,font:14.5,gap:4,padding:8});
}
export function packingPageLayout({width,height,pairs,measure=estimateText}){
 let last;
 for(const font of [18,17,16,15,14.5])for(const padding of [12,8,6])for(const wide of (width/height>1.4?[true,false]:[false,true])){
  const header=20,footer=36,sectionGap=5,gap=6,legend=15,inner=width-padding*2,content=height-padding*2-header-footer-sectionGap*2,sourceWidth=wide?inner*.35:inner,bagWidth=wide?inner-sourceWidth-gap:inner,cellWidth=(bagWidth-gap)/2;
  const requestHeight=Math.max(44,...pairs.map(p=>textLines(p.word,sourceWidth-18,font,measure).length*font*1.24+14)),needed=Math.max(44,...pairs.map(p=>textLines(p.translation,cellWidth-18,font,measure).length*font*1.24+14));
  const requestArea=wide?content:legend+requestHeight,rowHeight=(content-(wide?0:requestArea+gap)-gap)/2,sourceCardHeight=wide?content-legend:requestHeight;
  last={fits:rowHeight>=needed&&sourceCardHeight>=requestHeight&&cellWidth>=44,flow:wide?'packing-wide':'packing-stack',chrome:'quiet',font,padding,header,footer,sectionGap,gap,legend,columns:2,rows:2,rowHeight,sourceWidth,requestArea,sourceCardHeight,cellWidth};if(last.fits)return last;
 }
 return last;
}
export function listeningPageLayout({width,height,options,requested=false,supportText='',measure=estimateText}){
  const wide=width/height>1.45;
  for(const font of [18,17,16,15])for(const padding of [14,10,8])for(const fraction of wide?[.28,.36,.42]:[1]){
    const gap=8,columns=2,rows=Math.ceil(options.length/columns),header=28,footer=wide?(requested?52:44):(requested?100:50),sectionGap=7;
    const inner=width-padding*2,audioWidth=wide?(inner-sectionGap)*fraction:52;
    const supportFont=15,supportWidth=wide?audioWidth:inner-audioWidth-8;
    const supportHeight=textLines(supportText,supportWidth-14,supportFont,measure).length*supportFont*1.25+10;
    // Replay and clues own separate areas. Reserve for the complete clue before
    // it is requested; selections and support never reshuffle the menu.
    const audio=wide?52:Math.max(48,supportHeight),optionWidth=wide?inner-audioWidth-sectionGap:inner;
    const rowHeight=(height-padding*2-header-(wide?0:audio)-footer-sectionGap*(wide?2:3)-gap*(rows-1))/rows,cellWidth=(optionWidth-gap)/2;
    const textHeight=Math.max(...options.map(t=>textLines(t,cellWidth-16,font,measure).length*font*1.24))+12;
    const supportFits=!wide||52+4+supportHeight<=rowHeight*rows+gap*(rows-1);
    const result={fits:rowHeight>=Math.max(44,textHeight)&&supportFits,flow:wide?'wide':'stack',font,padding,gap,header,audio,audioWidth,footer,sectionGap,rows,columns,rowHeight,cellWidth,supportFont,supportWidth,supportHeight};if(result.fits)return result;
  }
  return {fits:false,font:15,padding:8,gap:4,header:24,audio:44,footer:requested?82:44,sectionGap:4,rows:Math.ceil(options.length/2),columns:2,rowHeight:44,cellWidth:(width-20)/2};
}
export function paperLabelLayout(text,width,height,measure=estimateText){
  // Prefer a slightly smaller readable size to breaking a word such as homework.
  // Exceptionally long words still wrap when no supported size can contain them.
  for(const wholeWords of [true,false])for(const font of [17,16,15.5,15,14.5]){
    if(wholeWords&&text.split(/\s+/).some(w=>measure(w,font)>width-12))continue;
    const lines=textLines(text,width-12,font,measure),lineHeight=font*1.22;
    if(lines.length*lineHeight+10<=height)return {fits:true,font,lineHeight,lines};
  }
  const lines=textLines(text,width-12,14.5,measure);return {fits:false,font:14.5,lineHeight:17.69,lines};
}
export function recipeNoteLayout({width,height,task,compact=false,measure=estimateText}){
  for(const font of [17,16,15.5,15,14.5]){
    const promptLines=textLines(task.prompt,width-18,font,measure).length,answerLines=compact?0:textLines(task.blocks.join(' '),width-18,font,measure).length;
    const used=promptLines*font*1.25+answerLines*font*1.25+(compact?16:54);
    if(used<=height)return {fits:true,font,used};
  }
  return {fits:false,font:14.5,used:(textLines(task.prompt,width-18,14.5,measure).length+(compact?0:textLines(task.blocks.join(' '),width-18,14.5,measure).length))*18.125+54};
}
export function deliveryPageLayout({width,height,prompt,options,measure=estimateText,preferredColumns=null,compactPaper=false,minimumRowHeight=0}){
  const columnOptions=preferredColumns?[preferredColumns]:width/height>1.45?[options.length,2]:[2,options.length];
  for(const font of [17,16,15])for(const columns of columnOptions)for(const padding of (compactPaper?[8]:[14,10,8])){
    const gap=padding===8?5:8,rows=Math.ceil(options.length/columns),header=padding===8?18:22,promptFont=Math.min(17,font+1),promptHeight=textLines(prompt,width-padding*2,promptFont,measure).length*promptFont*1.28+6;
    const rowHeight=Math.min(76,(height-padding*2-header-promptHeight-10-gap*(rows-1))/rows),cellWidth=Math.min(190,(width-padding*2-gap*(columns-1))/columns);
    const textHeight=Math.max(...options.map(t=>textLines(t,cellWidth-16,font,measure).length*font*1.24))+10;
    const result={fits:rowHeight>=Math.max(44,textHeight,minimumRowHeight-.05),font,promptFont,padding,gap,header,promptHeight,rows,columns,rowHeight,cellWidth};if(result.fits)return result;
  }
  return {fits:false,font:15,promptFont:16,padding:8,gap:4,header:18,promptHeight:textLines(prompt,width-16,16,measure).length*20.48+8,rows:Math.ceil(options.length/2),columns:2,rowHeight:44,cellWidth:(width-20)/2};
}
export function conversationPageLayout({width,height,task,options,measure=estimateText}){
  const wide=width/height>1.45,arrangements=wide?['split','stack']:['stack'];
  for(const font of [17,16,15.5,15,14.5])for(const arrangement of arrangements)for(const fraction of (arrangement==='split'?[.36,.42]:[.84,.94,1]))for(const columns of [1,2])for(const padding of [10,7,5]){
    const questionWidth=Math.min(arrangement==='split'?280:450,width*fraction),questionFont=Math.max(17,font+1),questionPadding=padding===10?10:8,banner=task.dialogue?26:0;
    const questionHeight=textLines(task.prompt,questionWidth-24,questionFont,measure).length*questionFont*1.30+questionPadding*2+16+banner;
    const replyX=arrangement==='split'?questionWidth+12:0,replyWidth=width-replyX,gap=padding===10?7:5,rows=Math.ceil(options.length/columns),cellWidth=(replyWidth-gap*(columns-1))/columns;
    const rowHeight=Math.max(48,Math.max(...options.map(t=>textLines(t,cellWidth-padding*2-4,font,measure).length*font*1.30))+padding*2+2),replyHeight=rows*rowHeight+gap*(rows-1);
    const fits=arrangement==='split'?Math.max(questionHeight,replyHeight)<=height:questionHeight+replyHeight+10<=height;
    const result={fits,arrangement,font,questionFont,questionPadding,questionWidth,questionHeight,replyWidth,replyX,columns,rows,rowHeight,replyHeight,gap,padding};if(fits)return result;
  }
  return {fits:false,arrangement:'stack',font:14.5,questionFont:17,questionPadding:8,questionWidth:width*.84,questionHeight:height*.40,replyWidth:width,replyX:0,columns:2,rows:Math.ceil(options.length/2),rowHeight:height*.27,replyHeight:height*.55,gap:5,padding:5};
}

let canvas;
export function browserTextMeasure(root){
  if(typeof document==='undefined')return estimateText;
  canvas??=document.createElement('canvas');const context=canvas.getContext?.('2d');if(!context)return estimateText;
  const family=typeof getComputedStyle==='function'?getComputedStyle(root).fontFamily:'Arial, sans-serif';
  return (text,size)=>{context.font=`700 ${size}px ${family||'Arial, sans-serif'}`;return context.measureText(text).width;};
}

function packTokens(tokens,width,gap=5){
  let x=0,y=0,row=0;const rows=[];
  for(const token of tokens){if(x&&x+token.width>width+.01){rows.push(row);y+=row+gap;x=0;row=0;}x+=token.width+gap;row=Math.max(row,token.height);}
  return y+row;
}
// Touch screens may grow the text to 24px when the paper has room; desktop keeps 18px at most.
const TERMINAL_FONTS=[18,17,16,15,14.5],TOUCH_TERMINAL_FONTS=[24,22,20,...TERMINAL_FONTS];
export function terminalPageLayout({width,height,task,options=[],stage='find',clip=48,touch=false,measure=estimateText}){
  if(task.kind==='repair')return checkoutPageLayout({width,height,task,options,stage,touch,measure});
  const ticket=task.kind==='completion',gap=5,padding=8,inner=width-padding*2;
  for(const font of touch?TOUCH_TERMINAL_FONTS:TERMINAL_FONTS)for(const columns of [options.length,2,1].filter((n,i,a)=>n&&a.indexOf(n)===i)){
    const line=font*1.3,tokens=[];
    if(ticket){
      for(const word of task.prompt.replace('___',' ∎ ').trim().split(/\s+/))tokens.push(word==='∎'?{width:Math.min(inner,Math.max(64,measure(stage==='send'?task.answer:'?',font)+20)),height:44}:{width:Math.min(inner,measure(word,font)),height:line});
    }else{
      const [left,right]=task.prompt.split('___'),words=[...left.trim().split(/\s+/).filter(Boolean),stage==='replace'?'_____':stage==='print'?task.answer:task.broken,...right.trim().split(/\s+/).filter(Boolean)];
      const selected=left.trim()?left.trim().split(/\s+/).length:0;
      words.forEach((word,i)=>{const interactive=stage==='find'||i===selected;const w=Math.min(inner,Math.max(interactive?44:0,measure(word,font)+(interactive?16:0))),lines=textLines(word,w-(interactive?16:0),font,measure).length;tokens.push({width:w,height:Math.max(interactive?44:0,lines*line+(interactive?10:0))});});
    }
    const sentenceHeight=packTokens(tokens,inner,gap),hasOptions=ticket?stage!=='send':stage==='replace',cell=(inner-gap*(columns-1))/columns;
    const choiceHeight=hasOptions?Math.max(44,...options.map(t=>textLines(t,cell-16,font,measure).length*line+12)):0;
    const optionRows=hasOptions?Math.ceil(options.length/columns):0,choicesHeight=optionRows?choiceHeight*optionRows+(optionRows-1)*gap:0;
    const header=ticket?Math.max(clip,44):24,footer=ticket?22:18,action=ticket?(stage==='send'?44:0):['clear','print'].includes(stage)?44:0;
    const used=padding*2+header+sentenceHeight+choicesHeight+action+footer+gap*(2+(hasOptions?1:0)+(action?1:0));
    const result={fits:used<=height&&(!hasOptions||cell>=48),font,padding,gap,header,footer,sentenceHeight,choiceHeight,columns,used,action,choicesHeight};
    if(result.fits)return result;
  }
  return {fits:false,font:14.5,padding:8,gap:5,header:ticket?clip:24,footer:18,columns:2,choiceHeight:44,sentenceHeight:height*.55,used:height+1};
}

export function checkoutPageLayout({width,height,task,options=[],stage='find',touch=false,measure=estimateText}){
 const padding=6,gap=4,inner=width-padding*2,step=checkoutStep({completed:stage==='print',repairErased:stage==='replace',repairFound:stage==='clear'});
 const [left,right]=task.prompt.split('___'),words=[...left.trim().split(/\s+/).filter(Boolean),stage==='replace'?'_____':stage==='print'?task.answer:task.broken,...right.trim().split(/\s+/).filter(Boolean)],selected=left.trim()?left.trim().split(/\s+/).length:0;
 for(const font of touch?TOUCH_TERMINAL_FONTS:TERMINAL_FONTS)for(const columns of [options.length,2,1].filter((n,i,a)=>n&&a.indexOf(n)===i))for(const chrome of ['full','compact']){
  const instructionFont=chrome==='compact'?16:stage==='find'?20:18,bannerWidth=inner-48;
  const header=chrome==='compact'?32:Math.ceil(textLines(step.title,bannerWidth,instructionFont,measure).length*instructionFont*1.3+textLines(step.help,bannerWidth,12,measure).length*14.4+12);
  const tokens=words.map((word,i)=>{const interactive=stage==='find'||i===selected,w=Math.min(inner,Math.max(interactive?44:0,measure(word,font)+(interactive?16:0)));return {width:w,height:Math.max(interactive?44:0,textLines(word,w-(interactive?16:0),font,measure).length*font*1.3+(interactive?10:0))};});
  const sentenceHeight=packTokens(tokens,inner,5),hasOptions=stage==='replace',cell=(inner-gap*(columns-1))/columns,choiceHeight=hasOptions?Math.max(44,...options.map(t=>textLines(t,cell-16,font,measure).length*font*1.3+12)):0,rows=hasOptions?Math.ceil(options.length/columns):0,choicesHeight=rows?rows*choiceHeight+(rows-1)*gap:0,action=['clear','print'].includes(stage)?44:0,footer=12;
  const used=padding*2+header+sentenceHeight+choicesHeight+action+footer+gap*(2+(hasOptions?1:0)+(action?1:0));
  const result={fits:used<=height&&(!hasOptions||cell>=48),font,padding,gap,header,footer,sentenceHeight,choiceHeight,columns,used,action,choicesHeight,chrome,instructionFont};if(result.fits)return result;
 }
 return {fits:false,font:14.5,padding:6,gap:4,header:32,footer:12,columns:2,choiceHeight:44,sentenceHeight:height*.55,used:height+1,chrome:'compact',instructionFont:16};
}
export function receiptPageLayout({width,height,text,measure=estimateText}){
 const padding=8,header=22,label=12,action=22,gap=6,inner=width-padding*2;
 for(const font of [26,24,22,20,19,18,17,16,15,14.5]){const lines=textLines(text,inner,font,measure),sentenceHeight=lines.length*font*1.35,used=padding*2+header+label+action+gap*3+sentenceHeight;if(used<=height)return {fits:true,font,padding,header,label,action,gap,sentenceHeight,used};}
 return {fits:false,font:14.5,padding,header,label,action,gap,sentenceHeight:Math.max(24,height-padding*2-header-label-action-gap*3),used:height+1};
}

export function washingPageLayout({width,height,blocks,order,measure=estimateText}){
 if(blocks.length!==3){
  const header=height<270?40:48,footer=40,padding=8,gap=14,wide=width/height>1.4;
  const available=height-header-footer-4,pw=width-padding*2,ph=Math.min(available,pw*.88),plate={x:padding,y:header+(available-ph)/2,width:pw,height:ph};
  const cols=wide?Math.ceil(blocks.length/2):2,rows=Math.ceil(blocks.length/cols),cap=(pw-48-gap*(cols-1))/cols;
  for(const font of [17,16,15,14.5]){
   const sizes=order.map(index=>({index,width:Math.max(44,Math.min(cap,measure(blocks[index],font)+30)),height:Math.max(44,textLines(blocks[index],cap-30,font,measure).length*font*1.24+14)}));
   const rowHeights=Array.from({length:rows},(_,row)=>Math.max(...sizes.slice(row*cols,(row+1)*cols).map(r=>r.height))),used=rowHeights.reduce((n,h)=>n+h,0)+gap*(rows-1);
   let cursor=(ph-used)/2;const rects=[];
   for(let row=0;row<rows;row++){const cells=sizes.slice(row*cols,(row+1)*cols),span=cells.reduce((n,r)=>n+r.width,0)+gap*(cells.length-1);let x=(pw-span)/2;for(const r of cells){rects.push({...r,x,y:cursor+(rowHeights[row]-r.height)/2});x+=r.width+gap;}cursor+=rowHeights[row]+gap;}
   const fits=used<=ph-16&&rects.length===blocks.length&&rects.every(r=>r.x>=8&&r.y>=8&&r.x+r.width<=pw-8&&r.y+r.height<=ph-8);
   if(fits)return {fits,font,header,footer,padding,gap,plate,rects,wide};
  }
  return {fits:false,font:14.5,header,footer,padding,gap,plate,rects:[],wide};
 }
 const header=height<270?40:48,footer=40,padding=8,gap=14,wide=width/height>1.4;
 const available=height-header-footer-4,pw=width-padding*2,ph=Math.min(available,pw*.88),plate={x:padding,y:header+(available-ph)/2,width:pw,height:ph};
 for(const font of [17,16,15,14.5]){
  const cap=wide?Math.min(160,(pw-48-gap*2)/3):Math.min(196,pw*.72);
  const sizes=order.map(index=>{const width=Math.max(68,Math.min(cap,measure(blocks[index],font)+34)),height=Math.max(44,textLines(blocks[index],width-30,font,measure).length*font*1.24+14);return {index,width,height};});
  const total=sizes.reduce((n,r)=>n+r.height,0),spacing=wide?gap:Math.max(gap,Math.min(40,(ph-total-48)/(blocks.length-1)));
  const used=wide?Math.max(...sizes.map(r=>r.height)):total+spacing*(blocks.length-1);
  let cursor=(ph-used)/2;
  // Stable scattered positions keep swipe paths predictable after refits. Larger
  // plates gain more breathing room; short screens retain readable hit areas.
  const rects=sizes.map((r,slot)=>{
   const offset=wide?Math.min(14,Math.max(0,(ph-r.height-32)/2))*[-.65,.8,-.25][slot]:0;
   const y=wide?(ph-r.height)/2+offset:cursor;
   const rim=Math.max(12,pw*.5*(1-Math.sqrt(Math.max(0,1-Math.pow((y+r.height/2-ph/2)/(ph/2),2))))+8);
   const desired=wide?pw/2+(slot-1)*(cap+gap)-r.width/2:pw*[.32,.69,.36][slot]-r.width/2;
   const x=Math.max(rim,Math.min(pw-r.width-rim,desired));cursor+=r.height+spacing;return {...r,x,y};
  });
  const fits=used<=ph-24&&rects.every(r=>r.width>=44&&r.height>=44&&r.x>=8&&r.y>=8&&r.x+r.width<=pw-8&&r.y+r.height<=ph-8);
  if(fits)return {fits,font,header,footer,padding,gap,plate,rects,wide};
 }
 return {fits:false,font:14.5,header,footer,padding,gap,plate,rects:[],wide};
}
export function sortLabelLayout({width,height,word,translation='',showMeaning=true,measure=estimateText}){
 for(const font of [18,17,16,15,14.5])for(const meaningFont of [13,12]){const padding=6,header=13,gap=3,wordHeight=textLines(word,width-padding*2,font,measure).length*font*1.18,meaningHeight=showMeaning?textLines(translation,width-padding*2,meaningFont,measure).length*meaningFont*1.2:0,used=padding*2+header+gap+wordHeight+(meaningHeight?gap+meaningHeight:0);if(used<=height)return{fits:true,font,meaningFont,padding,header,gap,used};}
 return{fits:false,font:14.5,meaningFont:12,padding:4,header:13,gap:2,used:height+1};
}
