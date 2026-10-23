export function terminalWordLayout(parts){
  let result=[];
  for(const font of [40,36,32,28,24]){
    const char=font*.61,line=font*1.48;let x=66,y=174;result=[];
    parts.forEach((text,index)=>{const width=Math.max(char*1.3,text.length*char)+18;if(x+width>958&&x>66){x=66;y+=line;}result.push({text,index,x,y,width,height:font+18});x+=width+10;});
    if(y+line<470)return {font,words:result};
  }
  return {font:24,words:result};
}
