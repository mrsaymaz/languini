// Bottom-edge positions for object signals; use a stable grid near their objects.
export function layoutSignals(signals,width,height,{top,bottom}={}){
  if(!signals.length)return [];
  const margin=12,gap=8,cellWidth=Math.min(Math.max(...signals.map(s=>s.width||144)),width-2*margin),fullHeight=Math.max(...signals.map(s=>s.height||68));
  const minTop=top??(height<400?86:height<600?112:124),maxBottom=bottom??height-(height<400?74:120);
  const columns=Math.max(1,Math.floor((width-2*margin+gap)/(cellWidth+gap))),rows=Math.ceil(signals.length/columns);
  const compact=rows*fullHeight+(rows-1)*gap>maxBottom-minTop,cellHeight=compact?64:fullHeight;
  const gridWidth=columns*cellWidth+(columns-1)*gap,left=(width-gridWidth)/2+cellWidth/2,cells=[];
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++)cells.push({x:left+column*(cellWidth+gap),y:minTop+cellHeight+row*(cellHeight+gap)});
  const placed=[];
  for(const signal of signals){
    const candidates=cells.filter(c=>!c.used).sort((a,b)=>Math.hypot(a.x-signal.x,a.y-signal.y)-Math.hypot(b.x-signal.x,b.y-signal.y)),best=candidates[0]||cells.at(-1);best.used=true;
    placed.push({id:signal.id,x:best.x,y:best.y,width:Math.min(signal.width||144,cellWidth),height:compact?64:signal.height||68,compact});
  }
  return placed;
}

export function actionPlacement(point,width,height,sheetTop){
  const low=height<500?86:118,high=width<760?Math.max(low,sheetTop-54):height-65;
  return {x:Math.max(84,Math.min(width-84,point.x)),y:Math.max(low,Math.min(high,point.y))};
}
