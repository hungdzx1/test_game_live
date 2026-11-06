import {ranking} from './combatService.js';
export class RewardService{
  constructor(engine){this.engine=engine;}
  finalize(b){
    if(b.status!=='running')return false;b.status='finished';
    for(const f of b.fields){if(!f.participantIds.length)continue;f.status='finished';
      f.results=ranking(f,b.elapsedMs).filter(p=>p.damage>0).map((p,index)=>({userId:p.userId,name:p.name,realmIndex:f.id,damage:p.damage,bossDamage:p.bossDamage,mobDamage:p.mobDamage,skillCount:p.skillCount,bossCount:p.bossIds.length,participationMs:p.participationMs,rank:index+1,stages:f.participantIds.length===1?b.rules.rewards.solo:index<3?b.rules.rewards[`top${index+1}`]:b.rules.rewards.others,blessing:f.participantIds.length===1||index>=3}));
    }return true;
  }
  apply(b){
    const e=this.engine;if(e.phase!=='cultivation'||b?.status!=='finished')return;
    for(const f of b.fields){if(f.rewardState==='applied')continue;
      for(const r of f.results??[]){const p=e.players.get(r.userId);if(!p||p.lastBattleRewardId===b.id)continue;
        p.pendingStageRewards=Math.min(Number.MAX_SAFE_INTEGER,p.pendingStageRewards+r.stages);p.lastBattleRewardId=b.id;
        if(r.blessing)p.pendingBlessings++;this.drain(p);
      }f.rewardState='applied';
    }e.important=true;
  }
  drain(p){
    const e=this.engine;if(e.phase!=='cultivation')return;
    const blessings=Math.min(p.pendingBlessings,Math.max(0,100000-p.inventory.blessing));
    if(blessings>0){p.inventory.blessing+=blessings;p.pendingBlessings-=blessings;e.audit('item:granted',{userId:p.userId,item:'blessing',count:blessings,source:'battle'});e.important=true;}
    while(p.pendingStageRewards>0){
      if(p.realmIndex===10){p.questState.points=Math.min(Number.MAX_SAFE_INTEGER,p.questState.points+p.pendingStageRewards*e.battleRules.rewards.endgamePointsPerStage);p.pendingStageRewards=0;break;}
      if(p.stageIndex===3){e.breakthrough.enqueue(p);break;}
      p.stageIndex++;p.pendingStageRewards--;e.event('stage:up',p.userId,{stageIndex:p.stageIndex,source:'battle'});
    }
    if(p.stageIndex===3&&p.realmIndex<10)e.breakthrough.enqueue(p);
    if(p.pendingExp>0){const amount=p.pendingExp;p.pendingExp=0;e.cultivation.add(p,amount);}
  }
}
