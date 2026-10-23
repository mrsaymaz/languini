import {CUSTOMER_PROFILES} from './customer-profiles.mjs';
// SpeechSynthesisVoice has no standard gender field. Recognize explicit vendor
// labels and known voice personas; leave opaque/generic voices unclassified.
const PERSONAS={
 female:'samantha|victoria|ava|allison|susan|zoe|joelle|nicky|zira|aria|jenny|michelle|ana|amber|ashley|cora|elizabeth|emma|jane|luna|monica|nancy|olivia|sara|serena|linda|kimberly|kendra|joanna|salli|ivy|ruth|danielle',
 male:'alex|fred|tom|evan|nathan|aaron|daniel|arthur|jamie|oliver|gordon|lee|rishi|david|mark|guy|christopher|eric|roger|andrew|brian|steffan|tony|davis|jason|jacob|brandon|benjamin|derek|joey|justin|matthew|stephen|gregory|kevin|george|ryan|thomas|harry'
};
const personaPatterns=Object.fromEntries(Object.entries(PERSONAS).map(([gender,names])=>[gender,new RegExp('(?:^|[^a-z])('+names+')(?:(?:multilingual)?(?:neural)?)?(?:$|[^a-z])','i')]));
export function describeVoice(voice){
 const text=(voice.name||'')+' '+(voice.voiceURI||'');let gender=null;
 if(/(?:^|[^a-z])female(?:$|[^a-z])/i.test(text))gender='female';else if(/(?:^|[^a-z])male(?:$|[^a-z])/i.test(text))gender='male';
 let persona;for(const [kind,pattern]of Object.entries(personaPatterns)){const match=text.match(pattern);if(match){gender??=kind;persona=match[1].toLowerCase();break;}}
 const identity=persona||(voice.name||voice.voiceURI||'default').toLowerCase().replace(/\b(?:enhanced|premium|compact|natural|online|desktop|mobile)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 return {gender,identity};
}
const language=v=>(v.lang||'').replace(/_/g,'-').toLowerCase();
const quality=v=>/premium/i.test(v.name||'')?4:/enhanced/i.test(v.name||'')?3:/natural/i.test(v.name||'')?2:v.default?1:0;
const novelty=v=>/\b(?:fred|ralph|albert|bahh|boing|bubbles|bad news|good news|hysterical|jester|organ|trinoids|whisper|wobble|zarvox)\b/i.test((v.name||'')+' '+(v.voiceURI||''));
function maleTier(v){
 const label=(v.name||'')+' '+(v.voiceURI||''),persona=describeVoice(v).identity;
 if(/premium|enhanced|natural|neural/i.test(label))return 3;
 if(['tom','evan','nathan','aaron','daniel','arthur','jamie','oliver','gordon','lee','rishi','guy','andrew','brian','christopher','roger','eric'].includes(persona))return 2;
 return 1;
}
export function pickCustomerVoice(voices,{gender=null,voiceSeed=0}={}){
 const english=voices.filter(v=>/^en(?:-|$)/.test(language(v))&&!novelty(v)),us=english.filter(v=>language(v)==='en-us'),same=list=>list.filter(v=>describeVoice(v).gender===gender),unknown=list=>list.filter(v=>describeVoice(v).gender===null);
 let pool=gender?(same(us).length?same(us):unknown(us).length?unknown(us):us.length?us:same(english).length?same(english):english):us.length?us:english;
 if(gender==='male'){
  // Male guests use installed British voices. Fred and novelty voices stay
  // excluded. Require a recognized male persona or explicit male vendor label;
  // never guess from a generic British voice or use the browser default.
  const british=english.filter(v=>['en-gb','en-uk'].includes(language(v))),allMen=same(british),alternatives=allMen.filter(v=>!['alex','david','mark'].includes(describeVoice(v).identity)),men=alternatives.length?alternatives:allMen,natural=men.filter(v=>maleTier(v)===3),modern=men.filter(v=>maleTier(v)===2);
  pool=natural.length?natural:modern.length?modern:men.length?men:[];
 }
 const local=pool.filter(v=>v.localService!==false);if(local.length)pool=local;
 const ordered=[...pool].sort((a,b)=>quality(b)-quality(a)||String(a.name||a.voiceURI||'').localeCompare(String(b.name||b.voiceURI||''))||String(a.voiceURI||'').localeCompare(String(b.voiceURI||'')));
 const unique=new Map();for(const voice of ordered){const key=describeVoice(voice).identity;if(!unique.has(key))unique.set(key,voice);}
 const candidates=[...unique.values()],seed=Number.isFinite(voiceSeed)?Math.abs(Math.floor(voiceSeed)):0;
 return candidates.length?candidates[seed%candidates.length]:null;
}
export function customerVoiceOptions(customerId){
 const profile=CUSTOMER_PROFILES.find(p=>p.id===customerId);return profile?{gender:profile.voiceGender,voiceSeed:Math.floor(profile.id/2),customerId:profile.id}:{};
}
