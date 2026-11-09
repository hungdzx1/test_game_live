import { ITEM_NAMES,SPIRITUAL_ROOT_MULTIPLIER } from './cultivationConfig.js';
export function seedFor(id){let n=2166136261;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function cleanName(name,words=[],maxLength=20){let text=String(name).normalize('NFC').replace(/[<>\u0000-\u001f]/g,'').trim();for(const word of words)if(word){const escaped=word.normalize('NFC').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp(escaped,'giu'),'***');}return [...text].slice(0,maxLength).join('')||'Đạo hữu';}
export function createPlayer(userId,name,index=0){
  if(typeof userId!=='string'||!/^[\w:-]{1,100}$/.test(userId))throw new Error('User ID không hợp lệ.');
  const x=(index%10-4.5)*1.75,z=Math.floor(index/10)*1.9-4;
  return {schemaVersion:2,userId,name:cleanName(name),seed:seedFor(userId),index,homeX:x,homeZ:z,x,z,
    pendingStageRewards:0,pendingExp:0,pendingBlessings:0,lastBattleRewardId:null,animation:'teleport',animationStartMs:0,overrideUntil:2400,realmIndex:0,stageIndex:0,cultivation:0,
    spiritualRootMultiplier:1,inventory:Object.fromEntries(Object.keys(ITEM_NAMES).map(k=>[k,0])),buffs:[],
    breakthrough:{queued:false,failedAttempts:0,protectionPoints:0,cooldownRemainingCultivationMs:0,heavenlyFate:0,pillCount:0},
    questState:{points:0,checkInSession:null,cycleId:null,cycleCount:0,cooldownMs:0,passiveMs:0},lastSeenAt:Date.now(),focusCooldownMs:0};
}
export function migratePlayer(raw){
  if(!raw||typeof raw.name!=='string'||![undefined,1,2].includes(raw.schemaVersion))throw new Error('Dữ liệu người chơi không hợp lệ.');
  const base=createPlayer(raw.userId,raw.name,raw.index??0);
  const p={...base,...structuredClone(raw),schemaVersion:2,inventory:{...base.inventory,...raw.inventory},breakthrough:{...base.breakthrough,...raw.breakthrough},questState:{...base.questState,...raw.questState}};
  // Upgrade the old permanent x2 entitlement in memory, without consuming stock
  // or mutating the caller's save object. Validation still rejects unknown values.
  if(p.spiritualRootMultiplier===2)p.spiritualRootMultiplier=SPIRITUAL_ROOT_MULTIPLIER;
  const nonnegative=v=>Number.isFinite(v)&&v>=0&&v<=Number.MAX_SAFE_INTEGER;
  if(!['x','z','homeX','homeZ'].every(k=>Number.isFinite(p[k]))||!['pendingStageRewards','pendingBlessings','pendingExp','seed','index','cultivation','animationStartMs','overrideUntil','focusCooldownMs','lastSeenAt'].every(k=>nonnegative(p[k]))||!Number.isInteger(p.realmIndex)||p.realmIndex<0||p.realmIndex>10||!Number.isInteger(p.stageIndex)||p.stageIndex<0||p.stageIndex>3||![1,SPIRITUAL_ROOT_MULTIPLIER].includes(p.spiritualRootMultiplier)||!Array.isArray(p.buffs)||p.buffs.length>100||p.buffs.some(b=>!b||!['tea','blessing'].includes(b.kind)||b.multiplier!==2||!nonnegative(b.remainingMs))||Object.values(p.inventory).some(v=>!Number.isInteger(v)||!nonnegative(v))||['failedAttempts','protectionPoints','cooldownRemainingCultivationMs','heavenlyFate','pillCount'].some(k=>!nonnegative(p.breakthrough[k]))||['points','cycleCount','cooldownMs','passiveMs'].some(k=>!nonnegative(p.questState[k])))throw new Error(`Dữ liệu đạo hữu ${p.userId} bị lỗi; giữ nguyên file để kiểm tra.`);
  if(!Number.isInteger(p.pendingStageRewards)||!Number.isInteger(p.pendingBlessings)||(p.lastBattleRewardId!==null&&(typeof p.lastBattleRewardId!=='string'||p.lastBattleRewardId.length>100)))throw new Error('Phần thưởng chờ không hợp lệ.');
  // Phase 1 stored animation times without a session clock; do not freeze restored characters.
  if(raw.schemaVersion!==2){p.animation='idle';p.animationStartMs=0;p.overrideUntil=0;}
  p.name=cleanName(p.name);return p;
}
export function validateSave(saved){
  if(!saved||![1,2].includes(saved.schemaVersion)||!Array.isArray(saved.players)||saved.players.length>500)throw new Error('Định dạng lưu không hợp lệ.');
  const players=saved.players.map(migratePlayer);
  if(new Set(players.map(p=>p.userId)).size!==players.length)throw new Error('Trùng userId trong dữ liệu lưu.');
  return {...saved,players};
}
