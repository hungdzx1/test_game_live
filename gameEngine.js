import {GameEventBus} from './gameEventBus.js';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { rulesFor, STAGES } from './cultivationConfig.js';
import { migratePlayer } from './playerStore.js';
import { ItemService,normalizeBlessings } from './itemService.js';
import { CultivationService } from './cultivationService.js';
import { BreakthroughService, probabilityFor } from './breakthroughService.js';
import { QuestService } from './questService.js';
import {battleRulesFor} from './battleConfig.js';
import {BattleService} from './battleService.js';
import {RewardService} from './rewardService.js';
import {CycleService} from './cycleService.js';
export { seedFor } from './playerStore.js';
export const animations = ['idle', 'walk', 'meditate', 'standUp', 'attack', 'teleport', 'celebrate'];
export class GameEngine extends EventEmitter {
  constructor(players = [], config = {}, {saved=null,rng}={}) {
    super(); this.players = new Map(players.map(p => [p.userId, migratePlayer(p)])); this.config = config;this.rules=rulesFor(config.cultivation);
    this.phase = 'stopped'; this.previousPhase = 'cultivation'; this.remainingMs = 600000;
    this.elapsedMs = 0; this.seq = 0; this.sessionId = randomUUID();this.transportId=randomUUID(); this.events = [];
    this.cycleId=randomUUID();this.globalBuffs=[];this.auditLog=[];this.important=false;this.demoSpeed=1;this.animationPreview=false;
    this.items=new ItemService(this);this.quests=new QuestService(this);this.breakthrough=new BreakthroughService(this,rng);this.cultivation=new CultivationService(this);
    this.battleRules=battleRulesFor(config);this.battle=new BattleService(this);this.rewards=new RewardService(this);this.cycle=new CycleService(this);
    this.phaseStart=Date.now();this.elapsedActiveMs=0;this.remainingMs=this.battleRules.cycle.cultivationSeconds*1000;
    this.mode='demo';this.completedCycles=0;this.battlesStarted=0;this.cameraUserId=null;this.liveEvents=new GameEventBus(this);
    if(saved?.schemaVersion===2)this.restore(saved);
  }
  event(kind, userId, data={}) {
    const event = { eventId: randomUUID(), kind, userId, timestamp: Date.now(),...data };
    this.events.push(event); if (this.events.length > 100) this.events.shift(); this.emit('event', event);
  }
  audit(kind,data){this.auditLog.push({kind,timestamp:Date.now(),...data});if(this.auditLog.length>100)this.auditLog.shift();}
  animate(p,animation,duration){p.animation=animation;p.animationStartMs=this.elapsedMs;p.overrideUntil=this.elapsedMs+duration;}
  join(player) { if (this.players.has(player.userId)) return;if(this.players.size>=500)throw new Error('Đã đạt giới hạn 500 đạo hữu demo.');const p=migratePlayer(player);this.players.set(p.userId,p);if(this.battle.current?.status==='running')this.battle.join(p);this.event('player:joined',p.userId);this.important=true; }
  getPlayer(id){const p=this.players.get(id);if(!p)throw new Error('Không tìm thấy đạo hữu.');return p;}
  clearDemo(){if(this.mode!=='demo')throw new Error('Chỉ xóa được dữ liệu demo.');this.liveEvents=new GameEventBus(this,{words:this.liveEvents.words});this.players.clear();this.breakthrough.queue=[];this.breakthrough.active=null;this.breakthrough.lastResult=null;this.globalBuffs=[];this.events=[];this.battle.current=null;this.battle.result=null;this.setPhase('stopped');this.previousPhase='cultivation';this.remainingMs=this.battleRules.cycle.cultivationSeconds*1000;this.elapsedActiveMs=0;this.important=true;}
  prepareBreakthrough(id){const p=this.getPlayer(id);if(this.phase!=='cultivation')throw new Error('Chỉ chuẩn bị độ kiếp khi tu luyện.');if(p.realmIndex>=10)throw new Error('Đã đạt Phi Thăng.');if(this.breakthrough.active?.userId===id)throw new Error('Đạo hữu đang độ kiếp.');const thresholds=this.rules.realms[p.realmIndex].thresholds;const needed=thresholds.slice(p.stageIndex).reduce((a,b)=>a+b,0);this.cultivation.add(p,Math.max(0,needed-p.cultivation));this.audit('demo:prepare',{userId:id});this.important=true;}
  setPhase(phase) {
    this.cycle.setPhase(phase);
  }
  trigger(kind, userId) {
    const p = this.players.get(userId); if (!p) throw new Error('Không tìm thấy đạo hữu mô phỏng.');
    if (!['focus', 'attack', 'celebrate', 'teleport','run','fly','bow'].includes(kind)) throw new Error('Sự kiện không hợp lệ.');
    if (kind !== 'focus') { p.animation = kind; p.animationStartMs = this.elapsedMs; p.overrideUntil = this.elapsedMs + 2600; }
    this.event(kind, userId);
  }
  tick(dt) {
    this.events = this.events.filter(e => Date.now() - e.timestamp < 10000);
    if (!['cultivation', 'battle'].includes(this.phase)){this.liveEvents.tick();return;}
    if(!Number.isFinite(dt))return;
    dt = Math.max(0, Math.min(250, dt));this.cycle.tick(dt);this.liveEvents.tick();
    if(this.phase==='battle')return;
    for (const p of this.players.values()) {
      if(this.breakthrough.active?.userId===p.userId){p.animation='cast';continue;}
      if (p.overrideUntil > this.elapsedMs) continue;
      const t = this.elapsedMs + p.index * 730;
      const cycle = t % 18000;
      const animation = !this.animationPreview&&this.phase==='cultivation'?'meditate':cycle < 5000 ? 'meditate' : cycle < 6500 ? 'standUp' : cycle < 13000 ? 'walk' : 'idle';
      if (p.animation !== animation) { p.animation = animation; p.animationStartMs = this.elapsedMs; }
      if (animation === 'walk') { p.x = p.homeX + Math.sin(t / 1800) * .65; p.z = p.homeZ + Math.cos(t / 1800) * .65; }
    }
  }
  exportState(){return structuredClone({schemaVersion:2,players:[...this.players.values()],runtime:{elapsedMs:this.elapsedMs,remainingMs:this.remainingMs,previousPhase:['cultivation','battle'].includes(this.phase)?this.phase:this.previousPhase,sessionId:this.sessionId,cycleId:this.cycleId,globalBuffs:this.globalBuffs,queue:this.breakthrough.queue,active:this.breakthrough.active,lastResult:this.breakthrough.lastResult,auditLog:this.auditLog,animationPreview:this.animationPreview,phaseStart:this.phaseStart,elapsedActiveMs:this.elapsedActiveMs,battle:this.battle.current,battleResult:this.battle.result,completedCycles:this.completedCycles,battlesStarted:this.battlesStarted,interactions:this.liveEvents.exportState()}});}
  restore(saved){
    const r=saved.runtime;if(!r||!Number.isFinite(r.elapsedMs)||r.elapsedMs<0||!Number.isFinite(r.remainingMs)||r.remainingMs<0||!['cultivation','battle'].includes(r.previousPhase)||typeof r.sessionId!=='string'||typeof r.cycleId!=='string'||!Array.isArray(r.globalBuffs)||r.globalBuffs.length>100||r.globalBuffs.some(b=>b.kind!=='blessing'||b.multiplier!==2||!Number.isFinite(b.remainingMs)||b.remainingMs<0)||!Array.isArray(r.queue)||r.queue.length>500||new Set(r.queue).size!==r.queue.length||r.queue.some(id=>!this.players.has(id)))throw new Error('Trạng thái phiên lưu không hợp lệ; giữ nguyên dữ liệu.');
    const a=r.active;
    if(a&&(!this.players.has(a.userId)||typeof a.id!=='string'||typeof a.outcome!=='boolean'||!Number.isFinite(a.roll)||a.roll<0||a.roll>=1||!Number.isFinite(a.probability)||a.probability<0||a.probability>100||!Number.isFinite(a.elapsedMs)||a.elapsedMs<0||!Number.isFinite(a.durationMs)||a.durationMs<10000||a.durationMs>20000||a.elapsedMs>a.durationMs||!Number.isInteger(a.realmIndex)||a.realmIndex!==this.players.get(a.userId).realmIndex||a.realmIndex>=10||this.players.get(a.userId).stageIndex!==3||a.lightningCount!==a.realmIndex+1))throw new Error('Kết quả độ kiếp lưu không hợp lệ.');
    if(r.lastResult&&(!this.players.has(r.lastResult.userId)||typeof r.lastResult.outcome!=='boolean'||!Number.isFinite(r.lastResult.remainingMs)||r.lastResult.remainingMs<0||r.lastResult.remainingMs>3000))throw new Error('Hoạt cảnh kết quả lưu không hợp lệ.');
    for(const k of ['completedCycles','battlesStarted']){if(r[k]!==undefined&&(!Number.isSafeInteger(r[k])||r[k]<0))throw new Error('Bộ đếm chu kỳ không hợp lệ.');this[k]=r[k]??0;}
    this.battle.restore(r.battle,r.battleResult);this.liveEvents.restore(r.interactions);
    this.phaseStart=r.phaseStart??Date.now();this.elapsedActiveMs=r.elapsedActiveMs??0;
    this.elapsedMs=r.elapsedMs;this.remainingMs=r.remainingMs;this.previousPhase=r.previousPhase;
    // Keep the gameplay session ID to avoid claiming check-in again by restarting the server.
    this.sessionId=r.sessionId;this.cycleId=r.cycleId;this.globalBuffs=normalizeBlessings(r.globalBuffs);this.breakthrough.queue=[...r.queue];this.breakthrough.active=structuredClone(a);this.breakthrough.lastResult=structuredClone(r.lastResult);this.auditLog=Array.isArray(r.auditLog)?r.auditLog.slice(-100):[];this.animationPreview=r.animationPreview===true;
  }
  snapshot(admin=false) {
    const players=[...this.players.values()].map(p=>({...p,...this.items.getEffectiveStats(p),realm:this.rules.realms[p.realmIndex].name,stage:STAGES[p.stageIndex],cultivationRequired:this.rules.realms[p.realmIndex].thresholds[p.stageIndex]??null,activeBuffs:[...p.buffs,...this.globalBuffs],breakthroughProbability:probabilityFor(p,this.rules)}));
    return { type:'state:snapshot',version:1,sessionId:this.transportId,seq:++this.seq,serverTime:Date.now(),payload:{phase:this.phase,effectivePhase:['paused','stopped'].includes(this.phase)?this.previousPhase:this.phase,phaseStart:this.phaseStart,elapsedActiveMs:this.elapsedActiveMs,cycleId:this.cycleId,completedCycles:this.completedCycles,battlesStarted:this.battlesStarted,cameraUserId:this.cameraUserId,battle:this.battle.snapshot(),battleResult:this.battle.result,remainingMs:this.remainingMs,elapsedMs:this.elapsedMs,players,focusedScene:(['paused','stopped'].includes(this.phase)?this.previousPhase:this.phase)==='battle'?'battle':this.breakthrough.active?'breakthrough':'sect',interactions:this.liveEvents.snapshot(admin),config:Object.fromEntries(Object.entries(this.config).filter(([k])=>['schemaVersion','host','port','graphics','camera','cultivation','cycle','skills','boss','combat','rewards','live','giftRules','sectLevels','audio','display','cameraDirector'].includes(k))),mode:this.mode,demoSpeed:this.demoSpeed,animationPreview:this.animationPreview,breakthroughQueueLength:this.breakthrough.queue.length,breakthrough:this.breakthrough.publicState(),breakthroughResult:this.breakthrough.lastResult,...(admin?{auditLog:this.auditLog}:{} )}};
  }
}
