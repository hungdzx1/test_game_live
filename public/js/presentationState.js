import {TRIBULATION} from './breakthroughScene.js';
export function presentPlayers(state){
  if(state.effectivePhase==='battle'&&state.battle?.status==='running'){const f=state.battle.view;return f?state.players.filter(p=>Object.hasOwn(f.participants,p.userId)).map(p=>({...p,...f.participants[p.userId],animationStartMs:state.elapsedMs-Math.max(0,state.battle.elapsedMs-(f.participants[p.userId].animationUntil-650)),elevation:.3})):[];}
  const ceremony=state.breakthrough??state.breakthroughResult;
  return state.players.map(p=>p.userId===ceremony?.userId?{...p,x:TRIBULATION.x,z:TRIBULATION.z,elevation:TRIBULATION.y+.3,animation:state.breakthrough?'cast':ceremony.outcome?'celebrate':'hit'}:p);
}
