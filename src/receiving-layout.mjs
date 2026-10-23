import {deliveryPageLayout,textLines,estimateText} from './page-fit.mjs';
export function receivingLayout(width,height,sorting=false,content=null){
  const wide=width/height>1.45,margin=Math.max(8,width*.023);
  if(!sorting){
    const top=wide?0:Math.min(224,height*.37),left=wide?width*.36:0,verticalMargin=Math.min(8,margin);
    const manifest={x:wide?left+margin:margin,y:wide?verticalMargin:top+6,width:width-left-margin*2,height:height-(wide?verticalMargin*2:top+margin+6)};
    const originalPaper={...manifest},labels=content&&deliveryPageLayout({width:manifest.width-2,height:manifest.height-2,...content});
    // Retain the original labels' grid and touch height; trim only unused paper.
    if(labels?.fits){
      const usedWidth=16+labels.cellWidth*labels.columns+5*(labels.columns-1)+4;
      manifest.width=Math.min(manifest.width,Math.ceil(usedWidth));
      const promptHeight=textLines(content.prompt,manifest.width-18,17,content.measure||estimateText).length*17*1.28+6;
      const usedHeight=16+18+promptHeight+10+5*(labels.rows-1)+labels.rowHeight*labels.rows+6;
      manifest.height=Math.min(manifest.height,Math.ceil(usedHeight));
      const fit=deliveryPageLayout({width:manifest.width-2,height:manifest.height-2,...content,preferredColumns:labels.columns,compactPaper:true,minimumRowHeight:labels.rowHeight});
      if(!fit.fits)Object.assign(manifest,originalPaper);
      if(wide){manifest.x=width-margin-manifest.width;manifest.y=(height-manifest.height)/2;}
      else{manifest.x=(width-manifest.width)/2;manifest.y=height-margin-manifest.height;}

    }
    const bay=wide?manifest.x-margin:manifest.y-6;
    const crateHeight=wide?Math.min((height-12)/1.20,(bay-12)/1.12*1.10/1.35):Math.min((bay-12)/1.20,(width-14)/1.12*1.10/1.35);
    const crateWidth=crateHeight*1.35/1.10;
    return {width,height,wide,crate:{x:wide?bay*.50:width*.50,y:wide?height*.49:bay*.50,width:crateWidth,height:crateHeight},manifest,originalPaper,labelLayout:labels?.fits?labels:null,ambient:[]};
  }
  if(wide){
    const binWidth=width*.26,cardHeight=Math.min(110,height*.50),cardY=height-cardHeight-margin;
    return {width,height,wide,bins:[{x:margin,y:margin,width:binWidth,height:height-margin*2},{x:width-margin-binWidth,y:margin,width:binWidth,height:height-margin*2}],parcel:{x:width*.50,y:cardY*.45,size:Math.min(92,cardY*.79)},card:{x:width*.30,y:cardY,width:width*.40,height:cardHeight}};
  }
  const binHeight=height*.38,cardHeight=Math.min(98,Math.max(82,height*.18)),cardY=height-cardHeight-margin,parcelSize=Math.min(104,Math.max(58,(cardY-binHeight-margin)*.70));
  return {width,height,wide,bins:[{x:margin,y:margin,width:width*.5-margin*1.5,height:binHeight},{x:width*.5+margin*.5,y:margin,width:width*.5-margin*1.5,height:binHeight}],parcel:{x:width*.50,y:binHeight+(cardY-binHeight)*.48,size:parcelSize},card:{x:width*.12,y:cardY,width:width*.76,height:cardHeight}};
}
