// English League (Mr. Saymaz's tally system): a won shift adds Ulti to the
// student's (grade, team) pool in the League's Battle Arena. The League decides
// the points from game + arena + pace; the game never sends a points value and
// holds no secret. An empty ultiApi (or the phone preview) switches all of this off.
export const LEAGUE_GAME='languini';
export const LEAGUE_URL='https://mrsaymaz.netlify.app/api/ulti';
export const LEAGUE_TEAMS=Object.freeze(['gryffindor','hufflepuff','slytherin','ravenclaw']);
// League arena index for each restaurant: Cafe, Diner, Bistro.
export const LEAGUE_ARENAS=Object.freeze({courtyard:0,bistro:1,banquet:2});
// First-try accuracy a won shift needs before it is claimed.
export const ULTI_ACCURACY=Object.freeze({relaxed:60,challenge:75});
// Only used to draw pools before the League has ever answered.
export const LEAGUE_FALLBACK=Object.freeze({capacity:100,maxStrength:2,hours:72});
const STORE='languini-league.v1',TICKET_MS=48*3600000,OUTBOX_MS=47*3600000;

let serial=0;
export function newShiftId(){return globalThis.crypto?.randomUUID?.()||`languini-${Date.now().toString(36)}-${(++serial).toString(36)}-${Math.random().toString(36).slice(2)}`;}
// config.js may be missing (use the League URL) or set ultiApi:'' (fully off).
export function leagueApi(config){return config&&typeof config.ultiApi==='string'?config.ultiApi.trim():LEAGUE_URL;}
// The League's start request for a shift, or null when the shift can never be claimed.
export function startRequest(shift){
  if(shift?.eligible!==true||![5,6,7,8].includes(shift.grade)||!LEAGUE_TEAMS.includes(shift.team)||!(shift.arena in LEAGUE_ARENAS)||!(shift.difficulty in ULTI_ACCURACY))return null;
  return {grade:shift.grade,team:shift.team,arena:LEAGUE_ARENAS[shift.arena],pace:shift.difficulty,unit:String(shift.unit||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,24)};
}
// Whether a finished shift is claimed: a real won shift with enough first-try answers.
export function ultiClaim(result,{preview=false}={}){
  const shift=result?.shift;
  if(preview||!startRequest(shift))return {claim:false,reason:'practice'};
  if(result.won!==true)return {claim:false,reason:'not-won'};
  const needed=ULTI_ACCURACY[shift.difficulty],accuracy=Number(result.accuracy)||0;
  return accuracy>=needed?{claim:true,accuracy,needed}:{claim:false,reason:'accuracy',accuracy,needed};
}
export function livePoints(entries,hours,now=Date.now()){
  const after=now-hours*3600000;
  return (Array.isArray(entries)?entries:[]).reduce((n,[minute,points])=>minute*60000>after&&Number.isFinite(points)?n+points:n,0);
}
// Battle Arena strength: 1 + (max − 1) × √(points ÷ capacity).
export function strength(points,capacity,maxStrength){
  if(!(capacity>0))return 1;
  return 1+(Math.max(1,maxStrength)-1)*Math.sqrt(Math.min(Math.max(points,0),capacity)/capacity);
}
// This game's League settings, or null while the League has not switched it on.
export function gameSettings(settings){
  const game=settings?.games?.[LEAGUE_GAME];
  return settings&&settings.enabled!==false&&game&&game.enabled!==false?game:null;
}
export function hoursLabel(hours){return hours%24===0?`${hours/24} day${hours===24?'':'s'}`:`${hours} hours`;}

function randomId(length=24){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',bytes=new Uint8Array(length);
  if(globalThis.crypto?.getRandomValues)globalThis.crypto.getRandomValues(bytes);else for(let i=0;i<length;i++)bytes[i]=Math.floor(Math.random()*256);
  return Array.from(bytes,b=>chars[b%chars.length]).join('');
}

export function createLeague({api=LEAGUE_URL,storage=globalThis.localStorage,fetchImpl=globalThis.fetch?.bind(globalThis),now=()=>Date.now(),timeoutMs=8000}={}){
  const enabled=!!api;
  let memory={};
  const load=()=>{try{const raw=storage?.getItem(STORE);if(raw){const data=JSON.parse(raw);if(data&&typeof data==='object')return data;}}catch{}return memory;};
  const save=data=>{memory=data;try{storage?.setItem(STORE,JSON.stringify(data));}catch{}};
  const state=()=>{const s=load();if(!s.pools||typeof s.pools!=='object')s.pools={};if(!Array.isArray(s.outbox))s.outbox=[];if(!s.tickets||typeof s.tickets!=='object')s.tickets={};return s;};
  function device(){
    const s=state();
    if(typeof s.device!=='string'||!/^[A-Za-z0-9_-]{8,64}$/.test(s.device)){s.device=randomId();save(s);}
    return s.device;
  }
  // ok: 2xx with status 'success'. refused: 4xx or a non-retryable failure.
  // retry: network error, timeout, 5xx or retry:true.
  async function request(body){
    if(!enabled||!fetchImpl)return {kind:'off'};
    const controller=typeof AbortController==='function'?new AbortController():null,timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try{
      const res=await fetchImpl(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller?.signal});
      let data=null;try{data=await res.json();}catch{}
      if(res.status>=500||data?.retry===true)return {kind:'retry',status:res.status,data};
      if(res.ok&&data?.status==='success')return {kind:'ok',data};
      return {kind:'refused',status:res.status,data};
    }catch{return {kind:'retry'};}
    finally{if(timer)clearTimeout(timer);}
  }
  function remember(data){
    const s=state();
    if(data?.settings&&typeof data.settings==='object')s.settings=data.settings;
    if(data?.pools&&typeof data.pools==='object')for(const [grade,pool] of Object.entries(data.pools))s.pools[grade]={at:now(),pool};
    save(s);
  }
  // Last known settings and this grade's pool, with live totals and strengths.
  function snapshot(grade){
    const s=state(),settings=s.settings||null,base={...LEAGUE_FALLBACK,...(settings||{})},pool=s.pools[grade]?.pool||{},t=now();
    const teams=LEAGUE_TEAMS.map(id=>{const points=livePoints(pool[id]?.entries,base.hours,t);return {id,points,players:pool[id]?.players||0,strength:strength(points,base.capacity,base.maxStrength)};});
    return {enabled,known:!!s.pools[grade],settings,game:gameSettings(settings),capacity:base.capacity,hours:base.hours,teams,updatedAt:s.pools[grade]?.at||null};
  }
  async function refresh(grade){
    if(!enabled)return snapshot(grade);
    const reply=await request({action:'pools',grade});
    if(reply.kind==='ok')remember(reply.data);
    return {...snapshot(grade),online:reply.kind==='ok'};
  }
  function forgetOld(s){
    const t=now();
    for(const [id,entry] of Object.entries(s.tickets))if(!entry||t-entry.at>TICKET_MS)delete s.tickets[id];
    s.outbox=s.outbox.filter(item=>item&&t-item.at<=OUTBOX_MS);
  }
  // Ask for a ticket when a shift opens, kept under the shift ID. null when offline or refused.
  async function start(shift){
    const body=startRequest(shift);
    if(!enabled||!body)return null;
    const existing=state().tickets[shift.id];if(existing)return existing.ticket;
    const reply=await request({action:'start',game:LEAGUE_GAME,...body,device:device()});
    if(reply.kind!=='ok'||typeof reply.data.ticket!=='string')return null;
    const s=state();forgetOld(s);s.tickets[shift.id]={ticket:reply.data.ticket,at:now(),grade:body.grade,team:body.team};save(s);
    return reply.data.ticket;
  }
  const ticketFor=id=>state().tickets[id]?.ticket||null;
  function discard(id){const s=state();if(s.tickets[id]){delete s.tickets[id];save(s);}}
  async function send(ticket){
    const reply=await request({action:'claim',ticket,device:device()});
    if(reply.kind==='ok'){remember(reply.data);const d=reply.data;return {state:'counted',points:d.points||0,requested:d.requested,deviceWins:d.deviceWins,reason:d.reason||null,duplicate:!!d.duplicate};}
    if(reply.kind==='refused')return {state:'refused',reason:reply.data?.reason||'refused'};
    return {state:'retry'};
  }
  // Claim only after a qualifying win. A network or server failure queues the
  // ticket in the outbox; a refusal is final.
  async function claim(id){
    if(!enabled)return {state:'off'};
    const s=state(),entry=s.tickets[id];
    if(!entry)return {state:'no-ticket'};
    delete s.tickets[id];save(s);
    const result=await send(entry.ticket);
    if(result.state==='retry'){const q=state();q.outbox.push({ticket:entry.ticket,at:entry.at,grade:entry.grade,team:entry.team});forgetOld(q);save(q);return {state:'queued'};}
    return result;
  }
  // Resend queued wins (on launch and after the next win); drop items older than 47 hours.
  async function flush(){
    if(!enabled)return [];
    const s=state();forgetOld(s);save(s);const results=[];
    for(const item of s.outbox.slice()){
      const result=await send(item.ticket);
      if(result.state!=='retry'){const q=state();q.outbox=q.outbox.filter(x=>x.ticket!==item.ticket);save(q);}
      results.push({...item,...result});
    }
    return results;
  }
  const outbox=()=>state().outbox.slice();
  return {enabled,device,refresh,snapshot,start,ticketFor,discard,claim,flush,outbox};
}
