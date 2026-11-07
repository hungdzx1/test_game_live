import {ITEM_NAMES} from './cultivationConfig.js';
export const BLESSING_DURATION_MS=30000;
export function normalizeBlessings(buffs){
  let remainingMs=0,durationMs=0;
  for(const buff of buffs){
    const duration=buff.durationMs===undefined?buff.remainingMs:buff.durationMs;
    if(!Number.isFinite(duration)||duration<buff.remainingMs||duration>Number.MAX_SAFE_INTEGER)throw new Error('Thời gian Ban Phúc lưu không hợp lệ; giữ nguyên dữ liệu.');
    if(buff.remainingMs>0){remainingMs+=buff.remainingMs;durationMs+=duration;}
  }
  if(remainingMs>Number.MAX_SAFE_INTEGER||durationMs>Number.MAX_SAFE_INTEGER)throw new Error('Thời gian Ban Phúc vượt giới hạn an toàn.');
  return remainingMs>0?[{kind:'blessing',multiplier:2,remainingMs,durationMs}]:[];
}
export function totalMultiplier(player,globalBuffs,rules){
  const temporary=[...player.buffs,...globalBuffs].filter(b=>b.remainingMs>0).reduce((sum,b)=>sum+b.multiplier,0);
  const permanent=player.spiritualRootMultiplier===2?2:0;
  return Math.min(rules.maxMultiplier,Math.max(1,permanent+temporary));
}
export class ItemService {
  constructor(engine){this.engine=engine;}
  activateBlessing(count=1,source='item'){
    if(!Number.isSafeInteger(count)||count<1||count>Number.MAX_SAFE_INTEGER/BLESSING_DURATION_MS)throw new Error('Số lần Ban Phúc không hợp lệ.');
    const current=this.blessingSnapshot(),added=count*BLESSING_DURATION_MS;
    const remainingMs=current.remainingMs+added,durationMs=current.durationMs+added;
    if(remainingMs>Number.MAX_SAFE_INTEGER||durationMs>Number.MAX_SAFE_INTEGER)throw new Error('Thời gian Ban Phúc vượt giới hạn an toàn.');
    this.engine.globalBuffs=[{kind:'blessing',multiplier:2,remainingMs,durationMs}];
    this.engine.event('blessing:activated',null,{source,count,remainingMs,durationMs,multiplier:2});this.engine.important=true;
  }
  blessingSnapshot(){
    const buff=normalizeBlessings(this.engine.globalBuffs)[0];
    return {remainingMs:buff?.remainingMs??0,durationMs:buff?.durationMs??0,multiplier:2};
  }
  grantItem(p,item,count=1,source='admin_demo'){
    if(!Object.hasOwn(ITEM_NAMES,item)||!Number.isInteger(count)||count<1||count>100||p.inventory[item]+count>100000)throw new Error('Vật phẩm hoặc số lượng không hợp lệ.');
    p.inventory[item]+=count;this.engine.audit('item:granted',{userId:p.userId,item,count,source});this.engine.important=true;
  }
  useItem(p,item){
    const e=this.engine,r=e.rules;if(!Object.hasOwn(ITEM_NAMES,item)||!p.inventory[item])throw new Error('Không có vật phẩm trong túi.');
    if(e.phase!=='cultivation')throw new Error('Vật phẩm được giữ trong túi. Chỉ dùng khi đang tu luyện.');
    if(item==='root'&&p.spiritualRootMultiplier===2)throw new Error('Linh căn đã biến dị; không tiêu hao thêm vật phẩm.');
    if(item==='pill'&&(p.realmIndex===10||e.breakthrough.active?.userId===p.userId||p.breakthrough.pillCount>=r.maxPills))throw new Error('Không thể chuẩn bị thêm đan lúc này.');
    if(item==='camera'&&p.focusCooldownMs>0)throw new Error('Quay Cam đang hồi chiêu.');
    if(item==='tea'&&p.buffs.length>=100)throw new Error('Đã đạt giới hạn hiệu ứng đang chờ.');
    if(item==='blessing')this.activateBlessing();
    p.inventory[item]--;
    if(item==='tea')p.buffs.push({kind:'tea',multiplier:2,remainingMs:r.buffDurationMs});
    if(item==='root')p.spiritualRootMultiplier=2;
    if(item==='pill')p.breakthrough.pillCount++;
    if(item==='camera'){p.focusCooldownMs=r.focusCooldownMs;e.animate(p,'celebrate',3000);e.event('camera:focus',p.userId,{durationMs:3000,priority:2});}
    if(p.pendingBlessings>0)e.rewards?.drain(p);
    e.event('item:used',p.userId,{item,name:ITEM_NAMES[item]});e.important=true;
  }
  expireBuff(dt){
    const expire=list=>list.map(b=>({...b,remainingMs:Math.max(0,b.remainingMs-dt)})).filter(b=>b.remainingMs>0);
    for(const p of this.engine.players.values())p.buffs=expire(p.buffs);
    this.engine.globalBuffs=expire(this.engine.globalBuffs);
  }
  getEffectiveStats(p){
    const e=this.engine,r=e.rules.realms[p.realmIndex],factor=1+.1*Math.min(2,p.stageIndex);
    return {hp:Math.round(r.hp*factor),atk:Math.round(r.atk*factor),def:Math.round(r.def*factor),baseCultivationRate:r.rate,cultivationPerSecond:r.rate*totalMultiplier(p,e.globalBuffs,e.rules)};
  }
}
