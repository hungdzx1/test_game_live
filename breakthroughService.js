import {randomUUID,randomInt} from 'node:crypto';
export function probabilityFor(p,rules){const r=rules.realms[p.realmIndex];if(p.realmIndex===10)return 0;const itemBonus=Math.min(p.breakthrough.pillCount*rules.pillPoints,r.min<50?Math.max(0,85-r.min):100);return Math.max(r.min,Math.min(r.max,r.min+itemBonus+p.breakthrough.protectionPoints));}
export class BreakthroughService {
  constructor(engine,rng=()=>randomInt(0,1000000)/1000000){this.engine=engine;this.rng=rng;this.queue=[];this.active=null;this.lastResult=null;}
  enqueue(p){
    if(p.realmIndex>=10||p.stageIndex!==3||p.breakthrough.cooldownRemainingCultivationMs>0||this.active?.userId===p.userId||this.queue.includes(p.userId))return false;
    this.queue.push(p.userId);p.breakthrough.queued=true;this.engine.important=true;return true;
  }
  tick(dt){
    const e=this.engine;if(e.phase!=='cultivation')return;
    if(this.lastResult){this.lastResult.remainingMs=Math.max(0,this.lastResult.remainingMs-dt);if(!this.lastResult.remainingMs)this.lastResult=null;}
    if(this.active){
      this.active.elapsedMs=Math.min(this.active.durationMs,this.active.elapsedMs+dt);
      if(this.active.elapsedMs>=this.active.durationMs)this.complete();
      return;
    }
    // Leave a short result shot between ceremonies; every eligible player remains queued.
    if(this.lastResult)return;
    while(this.queue.length){
      const p=e.players.get(this.queue.shift());if(!p)continue;p.breakthrough.queued=false;
      if(p.stageIndex!==3||p.realmIndex>=10||p.breakthrough.cooldownRemainingCultivationMs>0)continue;
      const guaranteed=p.breakthrough.heavenlyFate>=e.rules.fateFailures;
      // Roll validation happens before inventory changes; preserve already-paid legacy prepared pills.
      const roll=this.rng();
      if(!Number.isFinite(roll)||roll<0||roll>=1)throw new Error('RNG không hợp lệ.');
      let usedPills=0,prepared=p.breakthrough.pillCount;
      const baseline=probabilityFor(p,e.rules);
      while(!guaranteed&&usedPills<p.inventory.pill&&p.breakthrough.pillCount<e.rules.maxPills){
        const before=probabilityFor(p,e.rules);p.breakthrough.pillCount++;
        if(probabilityFor(p,e.rules)<=before){p.breakthrough.pillCount--;break;}usedPills++;
      }
      const probability=probabilityFor(p,e.rules);p.inventory.pill-=usedPills;
      if(!Number.isFinite(roll)||roll<0||roll>=1)throw new Error('RNG không hợp lệ.');
      this.active={id:randomUUID(),userId:p.userId,realmIndex:p.realmIndex,probability,roll,outcome:guaranteed||roll*100<probability,guaranteed,usedPills,preparedPills:prepared,elapsedMs:0,durationMs:e.rules.breakthroughDurationMs,lightningCount:p.realmIndex+1};
      p.breakthrough.pillCount=0;e.animate(p,'cast',e.rules.breakthroughDurationMs);
      if(usedPills){e.audit('item:auto-pills',{userId:p.userId,count:usedPills,prepared,baseline,probability});e.event('item:used',p.userId,{item:'pill',count:usedPills,source:'breakthrough'});e.battle?.drainPills(p);}
      e.audit('breakthrough:roll',{...this.active});e.event('breakthrough:started',p.userId,{id:this.active.id,realmIndex:p.realmIndex,durationMs:this.active.durationMs,lightningCount:this.active.lightningCount,guaranteed});e.important=true;break;
    }
  }
  complete(){
    const e=this.engine,a=this.active;if(!a||e.phase!=='cultivation')return;
    const p=e.players.get(a.userId);this.active=null;if(!p)return;
    if(a.outcome){p.realmIndex=Math.min(10,p.realmIndex+1);p.stageIndex=0;Object.assign(p.breakthrough,{failedAttempts:0,protectionPoints:0,heavenlyFate:0,cooldownRemainingCultivationMs:0,queued:false});e.animate(p,'celebrate',3000);}
    else{const b=p.breakthrough;b.failedAttempts++;b.heavenlyFate++;b.protectionPoints=Math.min(e.rules.protectionCap,b.protectionPoints+e.rules.protectionPerFailure);b.cooldownRemainingCultivationMs=e.rules.breakthroughCooldownMs;e.animate(p,'hit',3000);}
    if(a.outcome)e.rewards?.drain(p);
    this.lastResult={id:a.id,userId:p.userId,outcome:a.outcome,realmIndex:p.realmIndex,remainingMs:3000};
    e.audit('breakthrough:completed',{...this.lastResult});e.event('breakthrough:completed',p.userId,{...this.lastResult});e.important=true;
  }
  publicState(){if(!this.active)return null;const {roll,outcome,probability,...publicData}=this.active;return publicData;}
}
