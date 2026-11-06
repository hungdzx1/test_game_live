import {TRIBULATION_PLATFORM_CENTER as TRIBULATION,sectSeat,SECT_SEATS} from './sectLayout.js';
export function presentPlayers(state){
  if(state.effectivePhase==='battle'&&state.battle?.status==='running'){const f=state.battle.view;return f?state.players.filter(p=>Object.hasOwn(f.participants,p.userId)).map(p=>({...p,...f.participants[p.userId],animationStartMs:state.elapsedMs-Math.max(0,state.battle.elapsedMs-(f.participants[p.userId].animationUntil-650)),elevation:.3})):[];}
  const ceremony=state.breakthrough??state.breakthroughResult;
  return state.players.map((p,i)=>{
    if(p.userId===ceremony?.userId)return {...p,x:TRIBULATION.x,z:TRIBULATION.z,elevation:TRIBULATION.y+.3,sectVisible:true,animation:state.breakthrough?'cast':ceremony.outcome?'celebrate':'hit'};
    const seat=sectSeat(i);
    // Keep the existing demo stroll displacement in the new local seat space.
    return {...p,...seat,x:seat.x+(Number.isFinite(p.homeX)?p.x-p.homeX:0),z:seat.z+(Number.isFinite(p.homeZ)?p.z-p.homeZ:0),sectVisible:i<SECT_SEATS};
  });
}
