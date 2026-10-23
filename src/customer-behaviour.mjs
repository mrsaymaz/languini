const still=()=>({kind:'rest',headX:0,headY:0,headZ:0,armX:0,armZ:0,leftX:0,leftZ:0});
export function customerBehaviour(state,time,{id=0,reduced=false,protectedTime=false}={}){
 const p=still();if(!state||state.status==='empty'||state.status==='leaving'||state.dining||reduced||protectedTime)return p;
 const phase=((time+id*2.37)%12+12)%12,window=(start,length)=>phase>=start&&phase<start+length?Math.sin((phase-start)/length*Math.PI)**2:0;
 const patience=state.maxPatience>0?state.patience/state.maxPatience:1;
 if(patience<.3){const v=window(1,2);if(v){p.kind='raise';p.armX=-1.6*v;p.armZ=-.7*v;p.headY=-.22*v;}return p;}
 if(patience<.6){const v=window(2,2.5);if(v){p.kind='watch';p.leftX=-.9*v;p.leftZ=.4*v;p.headX=.24*v;p.headY=.22*v;}return p;}
 if(state.partySize===2){const v=window(1,3);if(v){p.kind='chat';p.headY=.35*v;p.headZ=.04*Math.sin(time*3)*v;p.armX=-.2*v;}return p;}
 if(['waiting','queued'].includes(state.status)){const v=window(.5,4);if(v){p.kind='menu';p.headX=.23*v;p.leftX=-.55*v;p.armX=-.55*v;}return p;}
 const v=window(5,2.8);if(v){p.kind='kitchen';p.headY=-.38*v;p.headX=-.04*v;}return p;
}
