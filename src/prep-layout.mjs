import {estimateText,textLines,paperLabelLayout} from './page-fit.mjs';

// Coordinates are CSS pixels on the board. Ink and touch regions are planned
// together with their physical saucers, rather than fitted independently.
function originalPrepLayout(width,height,task,{measure=estimateText}={}){
  const wide=width/height>1.45,compact=!wide&&height<420,margin=Math.max(7,width*.022);
  if(compact){
    const rowHeight=height<330?53:62,gap=5,sourceHeight=rowHeight*3+gap*2,sourceTop=height-sourceHeight-margin,noteHeight=sourceTop-9;
    const paperWidth=width-margin*2,foodSize=Math.min(48,rowHeight-8),labelX=margin+foodSize+12,labelWidth=width-margin-labelX-6;
    return {mode:'rows',width,height,margin,note:{x:width*.36,y:margin,width:width*.64-margin,height:noteHeight-margin},vessel:{x:width*.17,y:noteHeight*.52,width:Math.min(width*.28,noteHeight*.88),height:Math.min(width*.28,noteHeight*.88)},sources:[0,1,2].map(i=>{
      const y=sourceTop+i*(rowHeight+gap);return {paper:{x:margin,y,width:paperWidth,height:rowHeight},food:{x:margin+foodSize/2+7,y:y+rowHeight/2,size:foodSize},label:{x:labelX,y:y+3,width:labelWidth,height:rowHeight-6}};
    })};
  }
  const left=wide?width*.32:0,sourceWidth=wide?width-left:width,paperWidth=(sourceWidth-margin*4)/3,foodSize=Math.min(wide?Math.max(44,height*.30):72,Math.max(46,paperWidth*.68));
  const minInk=Math.max(...task.blocks.map(t=>textLines(t,paperWidth-16,15,measure).length))*15*1.22+12;
  const labelHeight=Math.max(minInk,Math.min(wide?88:120,height*(wide?.33:.23))),paperHeight=foodSize+labelHeight+16,top=wide?(height-paperHeight)/2:height-paperHeight-margin;
  return {mode:wide?'wide':'columns',width,height,margin,note:wide?{x:margin,y:margin,width:left-margin*2,height:height*.65}:{x:margin,y:margin,width:width*.59,height:Math.min(210,top-margin*2)},vessel:wide?{x:left/2,y:height*.84,width:Math.min(left*.85,height*.28),height:Math.min(left*.85,height*.28)}:{x:width*.82,y:Math.min(210,top-margin*2)*.53,width:width*.30,height:width*.30},sources:[0,1,2].map(i=>{
    const x=left+margin+i*(paperWidth+margin);return {paper:{x,y:top,width:paperWidth,height:paperHeight},food:{x:x+paperWidth/2,y:top+foodSize/2+5,size:foodSize},label:{x:x+2,y:top+foodSize+10,width:paperWidth-4,height:labelHeight}};
  })};
}

function phonePrepLayout(width,height,task,{measure=estimateText}={}){
 const margin=Math.max(7,width*.022),gap=5,count=task.blocks.length,cols=count<=3?1:2,rows=Math.ceil(count/cols),rackWidth=width-margin*2;
 const noteHeight=Math.max(42,textLines(task.translation||task.prompt,rackWidth-22,14.5,measure).length*14.5*1.25+18);
 const maxDiameter=Math.min(width*.68,height*.43),minimum=height<390?72:110;
 let last;
 for(let diameter=maxDiameter;diameter>=minimum-1;diameter-=2){
  const note={x:margin,y:margin+diameter+gap,width:rackWidth,height:noteHeight},top=note.y+note.height+gap,rowHeight=(height-margin-top-gap*(rows-1))/rows;
  if(rowHeight<52)continue;const sources=[];
  for(let row=0;row<rows;row++){
   const blocks=task.blocks.slice(row*cols,row*cols+cols),foodSize=Math.min(cols===1?44:26,rowHeight-8),nominal=(rackWidth-gap*(cols-1))/cols;
   let split=nominal,best=-Infinity;
   if(blocks.length===2)for(let cut=foodSize+62;cut<=rackWidth-gap-foodSize-62;cut+=2){const widths=[cut,rackWidth-gap-cut],fits=blocks.map((text,i)=>paperLabelLayout(text,widths[i]-foodSize-12,rowHeight-4,measure)),score=fits.reduce((sum,p)=>sum+(p.fits?1000:0)+p.font,0)-Math.abs(cut-nominal)*.001;if(score>best){best=score;split=cut;}}
   for(let col=0;col<blocks.length;col++){
    const paperWidth=blocks.length===1?rackWidth:col===0?split:rackWidth-gap-split,x=margin+(col===0?0:split+gap),y=top+row*(rowHeight+gap);
    sources.push({paper:{x,y,width:paperWidth,height:rowHeight},food:{x:x+foodSize/2+4,y:y+rowHeight/2,size:foodSize},label:{x:x+foodSize+9,y:y+2,width:paperWidth-foodSize-12,height:rowHeight-4}});
   }
  }
  last={mode:'phone',width,height,margin,note,vessel:{x:width/2,y:margin+diameter/2,width:diameter,height:diameter},sources};
  if(sources.every((r,i)=>paperLabelLayout(task.blocks[i],r.label.width,r.label.height,measure).fits))return last;
 }
 return last;
}

// Extra sentence blocks occupy the existing rack. The board, recipe note and
// receiving vessel always use the established three-slot station geometry.
export function prepBoardLayout(width,height,task,{measure=estimateText}={}){
 if(width<600&&width/height<=1.45){const phone=phonePrepLayout(width,height,task,{measure});if(phone)return phone;}
 const base=originalPrepLayout(width,height,{...task,blocks:task.blocks.slice(0,3)},{measure}),count=task.blocks.length;
 if(count<=3)return base;
 const {margin}=base,gap=5,bottom=height-margin,wide=base.mode==='wide';
 const top=wide?margin:base.note.y+base.note.height+gap;
 const old=base.sources[0],left=wide?old.paper.x-margin:0;
 const available=bottom-top,stackHeight=Math.min(old.paper.height,(available-gap)/2);
 // On ordinary portrait phones, keep the original saucers and put a second
 // row in the unused work area; the existing bottom three positions remain.
 if(!wide&&base.mode==='columns'&&stackHeight-old.food.size-7>=46){
  const sources=task.blocks.map((_,i)=>{const slot=i%3,row=i<3?1:0,x=base.sources[slot].paper.x,y=bottom-stackHeight-(row===0?stackHeight+gap:0),foodSize=old.food.size,labelHeight=stackHeight-foodSize-7;
   return {paper:{x,y,width:old.paper.width,height:stackHeight},food:{x:x+old.paper.width/2,y:y+foodSize/2+2,size:foodSize},label:{x:x+2,y:y+foodSize+5,width:old.paper.width-4,height:labelHeight}};
  });
  return {...base,sources};
 }
 // Existing compact row treatment, in two columns when room is limited.
 // It changes only the ingredient rack; the main plate never shrinks/moves.
 const cols=2,rows=Math.ceil(count/cols),cellWidth=(width-left-margin*3)/2,rowHeight=(available-gap*(rows-1))/rows;
 const sources=[];
 for(let row=0;row<rows;row++){
  const start=row*cols,blocks=task.blocks.slice(start,start+cols),rackWidth=width-left-margin*2;
  const foodSize=Math.min(old.food.size,rowHeight-4,cellWidth*.35),minimum=foodSize+8+44;
  let split=cellWidth,best=-Infinity;
  // Give a longer phrase the spare width beside its shorter neighbour.
  // This uses the rack's existing space without changing the station or plate.
  if(blocks.length===2)for(let cut=minimum;cut<=rackWidth-margin-minimum;cut+=1){
   const widths=[cut,rackWidth-margin-cut],labels=blocks.map((b,i)=>paperLabelLayout(b,widths[i]-foodSize-8,rowHeight-2,measure));
   const score=labels.reduce((s,p)=>s+(p.fits?1000:0)+p.font,0)-Math.abs(cut-cellWidth)*.001;
   if(score>best){best=score;split=cut;}
  }
  for(let col=0;col<blocks.length;col++){
   const paperWidth=blocks.length===1?rackWidth:col===0?split:rackWidth-margin-split,x=left+margin+(col===0?0:split+margin),y=top+row*(rowHeight+gap),labelX=x+foodSize+6;
   sources.push({paper:{x,y,width:paperWidth,height:rowHeight},food:{x:x+foodSize/2+2,y:y+rowHeight/2,size:foodSize},label:{x:labelX,y:y+1,width:paperWidth-foodSize-8,height:rowHeight-2}});
  }
 }
 return {...base,sources};
}
