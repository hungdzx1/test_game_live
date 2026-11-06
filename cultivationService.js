export class CultivationService {
  constructor(engine){this.engine=engine;}
  add(p,amount){
    const e=this.engine;
    if(e.phase!=='cultivation')return false;
    if(!Number.isFinite(amount)||amount<0||amount>Number.MAX_SAFE_INTEGER)throw new Error('Tu vi không hợp lệ.');
    p.cultivation=Math.min(Number.MAX_SAFE_INTEGER,p.cultivation+amount);
    while(p.realmIndex<10&&p.stageIndex<3){
      const needed=e.rules.realms[p.realmIndex].thresholds[p.stageIndex];
      if(p.cultivation+1e-8<needed)break;
      p.cultivation=Math.max(0,p.cultivation-needed);p.stageIndex++;
      e.animate(p,'standUp',1500);e.event('stage:up',p.userId,{stageIndex:p.stageIndex});e.important=true;
    }
    if(p.realmIndex<10&&p.stageIndex===3)e.breakthrough.enqueue(p);
    return true;
  }
  grant(p,amount){
    if(!Number.isFinite(amount)||amount<0||amount>Number.MAX_SAFE_INTEGER)throw new Error('Tu vi không hợp lệ.');
    if(this.engine.phase==='cultivation')return this.add(p,amount);
    p.pendingExp=Math.min(Number.MAX_SAFE_INTEGER,p.pendingExp+amount);this.engine.important=true;return false;
  }
  tick(dt){
    const e=this.engine;if(e.phase!=='cultivation')return;
    // Split at expiry boundaries so even the last fractional second of a buff counts exactly.
    let remaining=dt;
    while(remaining>1e-8){
      let step=remaining;
      for(const b of e.globalBuffs)if(b.remainingMs>0)step=Math.min(step,b.remainingMs);
      for(const p of e.players.values())for(const b of p.buffs)if(b.remainingMs>0)step=Math.min(step,b.remainingMs);
      for(const p of e.players.values()){
        const b=p.breakthrough;b.cooldownRemainingCultivationMs=Math.max(0,b.cooldownRemainingCultivationMs-step);
        p.focusCooldownMs=Math.max(0,p.focusCooldownMs-step);
        this.add(p,e.items.getEffectiveStats(p).cultivationPerSecond*step/1000);
        e.quests.tick(p,step);
      }
      e.items.expireBuff(step);remaining-=step;
    }
  }
}
