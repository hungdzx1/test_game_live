import {ITEM_NAMES} from './cultivationConfig.js';
export class QuestService {
  constructor(engine){this.engine=engine;}
  tick(p,dt){const q=p.questState,r=this.engine.rules.quests;q.cooldownMs=Math.max(0,q.cooldownMs-dt);q.passiveMs+=dt;while(q.passiveMs>=r.passiveIntervalMs){q.passiveMs-=r.passiveIntervalMs;q.points+=r.passivePoints;this.engine.important=true;}}
  claim(p,kind){
    const e=this.engine,q=p.questState,r=e.rules.quests;if(e.phase!=='cultivation')throw new Error('Nhiệm vụ chỉ nhận trong pha tu luyện.');
    if(kind==='checkIn'){if(q.checkInSession===e.sessionId)throw new Error('Đã điểm danh phiên này.');q.checkInSession=e.sessionId;q.points+=r.checkInPoints;}
    else if(kind==='cultivate'){
      if(q.cycleId!==e.cycleId){q.cycleId=e.cycleId;q.cycleCount=0;}
      if(q.cooldownMs>0||q.cycleCount>=r.perCycleLimit)throw new Error('Nhiệm vụ đang hồi hoặc đã đủ hạn mức chu kỳ.');
      q.cooldownMs=r.cooldownMs;q.cycleCount++;q.points+=r.cultivatePoints;e.cultivation.add(p,r.cultivateExp);
    }else throw new Error('Nhiệm vụ không hợp lệ.');
    e.event('quest:completed',p.userId,{kind});e.important=true;
  }
  redeem(p,item){const e=this.engine;if(e.phase!=='cultivation')throw new Error('Chỉ đổi vật phẩm khi tu luyện.');if(!Object.hasOwn(ITEM_NAMES,item))throw new Error('Vật phẩm không hợp lệ.');const cost=e.rules.quests.costs[item];if(p.questState.points<cost)throw new Error('Chưa đủ điểm nhiệm vụ.');e.items.receiveItem(p,item,1,'quest');p.questState.points-=cost;e.event('quest:redeemed',p.userId,{item});}
}
