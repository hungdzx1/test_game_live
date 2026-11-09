import {randomUUID} from 'node:crypto';
export class CycleService{
  constructor(engine){this.engine=engine;}
  setPhase(phase){
    const e=this.engine;if(phase==='resume')phase=e.previousPhase;
    if(!['cultivation','battle','paused','stopped'].includes(phase))throw new Error('Trạng thái không hợp lệ.');
    const prior=['paused','stopped'].includes(e.phase)?e.previousPhase:e.phase;
    if(['paused','stopped'].includes(phase)){if(['cultivation','battle'].includes(e.phase))e.previousPhase=e.phase;e.phase=phase;e.important=true;return;}
    if(phase!==prior||(phase==='battle'&&e.battle.current?.status!=='running')){
      if(phase==='battle'){e.battlesStarted++;e.phase='battle';e.battle.start();e.remainingMs=e.battle.remainingMs;}
      else {if(prior==='battle')e.completedCycles++;e.battle.finish();e.phase='cultivation';e.cycleId=randomUUID();e.remainingMs=e.battleRules.cycle.cultivationSeconds*1000;e.event('battle:return',null);e.rewards.apply(e.battle.current);for(const p of e.players.values()){p.x=p.homeX;p.z=p.homeZ;e.animate(p,'teleport',2000);}}
      e.phaseStart=Date.now();e.elapsedActiveMs=0;
    }
    e.phase=phase;e.previousPhase=phase;e.important=true;
    if(phase==='cultivation'){e.rewards.apply(e.battle.current);for(const p of e.players.values())e.rewards.drain(p);e.liveEvents?.flush();}
  }
  tick(dt){
    const e=this.engine;let left=dt;
    while(left>0&&['cultivation','battle'].includes(e.phase)){
      const untimed=e.phase==='battle'&&e.battle.current?.endOnKill===true;
      const step=untimed?left:Math.min(left,e.remainingMs);e.elapsedMs+=step;e.elapsedActiveMs+=step;
      if(e.phase==='cultivation'){e.cultivation.tick(step);e.breakthrough.tick(step);if(e.battle.result){e.battle.result.remainingMs=Math.max(0,e.battle.result.remainingMs-step);if(!e.battle.result.remainingMs)e.battle.result=null;}}
      else e.battle.tick(step);
      e.remainingMs=e.phase==='battle'?e.battle.remainingMs:Math.max(0,e.remainingMs-step);left-=step;
      if(e.phase==='battle'&&e.battle.current?.status==='finished')this.setPhase('cultivation');
      else if(e.remainingMs===0&&!untimed)this.setPhase(e.phase==='cultivation'?'battle':'cultivation');
    }
  }
}
