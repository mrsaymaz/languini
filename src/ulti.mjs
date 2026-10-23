// Local, non-spendable shift rewards. Keep expired receipts for deduplication
// and the later game-system connection; only live receipts count as currency.
export const ULTI_LIFETIME_MS=7*24*60*60*1000;
export const ULTI_REWARDS=Object.freeze({courtyard:4,bistro:6,banquet:8});
const poolPattern=/^[5-8]:(gryffindor|hufflepuff|slytherin|ravenclaw)$/;
export function ultiPoolKey(config){const key=`${config?.grade}:${config?.team}`;return poolPattern.test(key)?key:null;}
export function ultiReward(config){const base=ULTI_REWARDS[config?.arena];return base&&['relaxed','challenge'].includes(config?.difficulty)?base*(config.difficulty==='challenge'?2:1):0;}
let serial=0;
export function newShiftId(){return globalThis.crypto?.randomUUID?.()||`languini-${Date.now().toString(36)}-${(++serial).toString(36)}-${Math.random().toString(36).slice(2)}`;}
export function cleanUlti(value){
  const out={version:1,pools:{}},ids=new Set();
  if(value?.version!==1||!value.pools||typeof value.pools!=='object')return out;
  for(const [key,rows]of Object.entries(value.pools)){
    if(!poolPattern.test(key)||!Array.isArray(rows))continue;
    const awards=[];
    for(const row of rows){
      if(!row||typeof row.id!=='string'||!row.id.length||row.id.length>160||ids.has(row.id)||!Number.isSafeInteger(row.earnedAt)||row.earnedAt<0||!Number.isSafeInteger(row.expiresAt)||row.expiresAt!==row.earnedAt+ULTI_LIFETIME_MS||row.amount!==ultiReward(row)||!row.amount)continue;
      ids.add(row.id);awards.push({id:row.id,source:'languini',amount:row.amount,arena:row.arena,difficulty:row.difficulty,earnedAt:row.earnedAt,expiresAt:row.expiresAt});
    }
    if(awards.length)out.pools[key]=awards;
  }
  return out;
}
export function mergeUlti(...values){
  const pools={};for(const value of values)for(const [key,rows]of Object.entries(cleanUlti(value).pools))(pools[key]||=[]).push(...rows);
  return cleanUlti({version:1,pools});
}
export function ultiPool(profile,config,now=Date.now()){
  const key=ultiPoolKey(config),raw=key&&profile?.ulti?.pools?.[key],rows=Array.isArray(raw)?raw:[],awards=rows.filter(a=>a.earnedAt<=now&&now<a.expiresAt);
  return {key,balance:awards.reduce((n,a)=>n+a.amount,0),nextExpiry:awards.length?Math.min(...awards.map(a=>a.expiresAt)):null,awards};
}
export function creditUlti(profile,result,{now=Date.now(),preview=false}={}){
  const shift=result?.shift,key=ultiPoolKey(shift),amount=ultiReward(shift),pool=ultiPool(profile,shift,now);
  if(preview||result?.won!==true||shift?.eligible!==true||!key||!amount||typeof shift.id!=='string'||!shift.id.length||shift.id.length>160||!Number.isSafeInteger(now)||!Number.isSafeInteger(now+ULTI_LIFETIME_MS)||now<0)return {credited:false,amount:0,key,balance:pool.balance,reason:'ineligible'};
  profile.ulti=cleanUlti(profile.ulti);
  const previous=Object.values(profile.ulti.pools).flat().find(a=>a.id===shift.id);
  if(previous)return {credited:false,amount:previous.amount,key,balance:ultiPool(profile,shift,now).balance,expiresAt:previous.expiresAt,reason:'already-credited'};
  const award={id:shift.id,source:'languini',amount,arena:shift.arena,difficulty:shift.difficulty,earnedAt:now,expiresAt:now+ULTI_LIFETIME_MS};
  (profile.ulti.pools[key]||=[]).push(award);
  return {credited:true,amount,key,balance:ultiPool(profile,shift,now).balance,expiresAt:award.expiresAt};
}
// Read-only projection for a future integration. No spend/transfer API is wired.
export function ultiSnapshot(profile,now=Date.now()){
  const ledger=cleanUlti(profile?.ulti);
  return {version:1,source:'languini',asOf:now,pools:Object.fromEntries(Object.keys(ledger.pools).map(key=>{const [grade,team]=key.split(':');const p=ultiPool({ulti:ledger},{grade,team},now);return [key,{grade:Number(grade),team,balance:p.balance,awards:p.awards.map(a=>({...a}))}];}))};
}
