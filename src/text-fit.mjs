export function labelClass(text){const value=String(text),longest=Math.max(...value.split(/\s+/).map(s=>Array.from(s).length));return value.length>18||longest>10?'label-choice--wide':'';}
export function wrapMeasuredText(text,width,measure){
  const lines=[];let line='';
  for(const word of String(text).trim().split(/\s+/)){
    if(!word)continue;
    if(measure(word)<=width){if(!line)line=word;else if(measure(line+' '+word)<=width)line+=' '+word;else{lines.push(line);line=word;}continue;}
    if(line){lines.push(line);line='';}let piece='';
    for(const letter of Array.from(word)){if(piece&&measure(piece+letter)>width){lines.push(piece);piece=letter;}else piece+=letter;}line=piece;
  }
  if(line)lines.push(line);return lines;
}
export function fitTextLayout(text,{width,height,maxFont=48,minFont=18,lineSpacing=1.3,measure}){
  for(let font=maxFont;font>=8;font-=2){const lines=wrapMeasuredText(text,width,s=>measure(s,font)),lineHeight=font*lineSpacing;if(lines.length*lineHeight<=height&&lines.every(line=>measure(line,font)<=width))return {font,lines,lineHeight,belowPreferredMinimum:font<minFont};}
  throw Error('Text cannot fit within the supplied surface.');
}
