export const GUEST_REACTION_SECONDS={welcome:1.5,recognise:1.8,thinking:1.2,understood:1.2,delighted:1.8,gift:2.2};
export function guestPose(kind,progress,{reduced=false}={}){
  const p=Math.max(0,Math.min(1,progress)),fade=Math.sin(p*Math.PI),wave=Math.sin(p*Math.PI*5)*fade;
  if(reduced)return {headX:0,headZ:0,armX:0,armZ:0,mouth:kind==='thinking'?.42:.65};
  if(kind==='thinking')return {headX:.08*fade,headZ:.13*fade,armX:-.3*fade,armZ:0,mouth:.37};
  if(kind==='understood')return {headX:Math.sin(p*Math.PI*4)*.14*(1-p),headZ:0,armX:-.13*fade,armZ:0,mouth:.64};
  if(kind==='delighted'||kind==='gift')return {headX:-.07*fade,headZ:wave*.04,armX:-(kind==='gift'?.6:.45)*fade,armZ:.24*fade,mouth:.82};
  return {headX:-.04*fade,headZ:wave*.08,armX:-(kind==='recognise'?.65:.4)*fade,armZ:wave*.3,mouth:.7};
}
