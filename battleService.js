import {randomUUID} from 'node:crypto';
import {FIELD_NAMES,battleRulesFor} from './battleConfig.js';
import {createMonster,createBoss} from './monsterFactory.js';
import {CombatService,ranking} from './combatService.js';
export class BattleService{
  constructor(engine){this.engine=engine;this.current=null;this.result=null;this.combat=new CombatService(this);}
  start(){
    const e=this.engine;this.current={id:randomUUID(),cycleId:e.cycleId,status:'running',elapsedMs:0,durationMs:e.battleRules.cycle.battleSeconds*1000,rules:structuredClone(e.battleRules),skillEvents:[],viewId:null,manualView:null,viewSince:0,focusQueue:[],focusReason:null,focusAt:0,fields:FIELD_NAMES.map((name,id)=>({id,name,realmIndex:id,participantIds:[],participants:{},joinedAtByUser:{},mobs:[],nextMob:0,pendingMobs:0,activeBoss:null,bossHistory:[],damageByUser:{},rewardState:'pending',status:'inactive'}))};
    for(const f of this.current.fields)f.battleId=this.current.id;
    e.event('battle:prepare',null,{battleId:this.current.id});
    for(const p of e.players.values())this.join(p,false);
    for(const f of this.current.fields)if(f.participantIds.length){this.schedule(f);this.spawnMobs(f);}
    this.chooseView();e.important=true;
  }
  join(p,schedule=true){
    const b=this.current;if(b?.status!=='running')return;const f=b.fields[p.realmIndex];if(Object.hasOwn(f.participants,p.userId))return;
    const stats=this.engine.items.getEffectiveStats(p),i=f.participantIds.length,x=(i%10-4.5)*1.3;
    f.participantIds.push(p.userId);Object.defineProperty(f.joinedAtByUser,p.userId,{enumerable:true,writable:true,configurable:true,value:b.elapsedMs});Object.defineProperty(f.participants,p.userId,{enumerable:true,writable:true,configurable:true,value:{userId:p.userId,name:p.name,realmIndex:p.realmIndex,stageIndex:p.stageIndex,hp:stats.hp,maxHp:stats.hp,atk:stats.atk,def:stats.def,moveSpeed:b.rules.combat.moveSpeed,x,z:5+Math.floor(i/10)*.4,homeX:x,joinedAt:b.elapsedMs,damage:0,bossDamage:0,mobDamage:0,scoreAt:b.elapsedMs,skillCount:0,bossIds:[],cooldowns:{'1':0,'2':0},targetId:null,attackAt:b.elapsedMs,reviveAt:0,animation:'teleport',animationUntil:b.elapsedMs+700,lastEffectAt:-1500}});
    Object.defineProperty(f.damageByUser,p.userId,{enumerable:true,writable:true,configurable:true,value:0});f.status='running';this.queueMobs(f,3);
    if(schedule){this.schedule(f);this.spawnMobs(f);this.chooseView();}this.engine.event('battle:joined',p.userId,{fieldId:f.id});this.engine.important=true;
  }
  queueMobs(f,count,summon=false){f.pendingMobs+=count;if(summon)f.pendingSummons=(f.pendingSummons??0)+count;}
  spawnMobs(f){
    const b=this.current;f.mobs=f.mobs.filter(m=>m.status==='alive'||b.elapsedMs-(m.deathAt??0)<800);
    let count=f.mobs.filter(m=>m.status==='alive').length;
    while(f.pendingMobs>0&&count<b.rules.combat.maxActiveMobs){const summon=(f.pendingSummons??0)>0;f.mobs.push(createMonster(f,f.nextMob++,this.engine.rules.realms[f.id],b.elapsedMs,summon?0:null));if(summon)f.pendingSummons--;f.pendingMobs--;count++;}
  }
  schedule(f){
    const b=this.current,t=b.elapsedMs/b.durationMs*300;
    if(f.activeBoss&&f.activeBoss.status==='alive'&&t>=b.rules.boss.spawnWindows[f.activeBoss.type][1]){f.activeBoss.status='timeout';this.engine.event('boss:timeout',null,{fieldId:f.id,name:f.activeBoss.name});this.engine.important=true;}
    for(let index=0;index<3;index++){
      const [start,end]=b.rules.boss.spawnWindows[index];
      if(t>=start&&t<end&&!f.bossHistory.some(m=>m.type===index)){
        const boss=createBoss(f,index,this.engine.rules.realms[f.id],b.rules,b.elapsedMs);f.activeBoss=boss;f.bossHistory.push(boss);this.focus(f.id,'spawn');this.engine.event('boss:spawned',null,{fieldId:f.id,name:boss.name});this.engine.important=true;
      }
    }
  }
  focus(id,reason){const b=this.current;if(!b)return;if(b.viewId===id){b.focusReason=reason;b.focusAt=b.elapsedMs;return;}const queued=b.focusQueue.find(x=>x.id===id);if(queued)queued.reason=reason;else b.focusQueue.push({id,reason});if(b.focusQueue.length>11)b.focusQueue.shift();}
  selectView(value){const b=this.current;if(!b)throw new Error('Chưa có chiến trường.');if(value!=='auto'&&(!Number.isInteger(value)||!b.fields[value]?.participantIds.length))throw new Error('Chiến trường chưa có người.');b.manualView=value==='auto'?null:value;if(value!=='auto'){b.viewId=value;b.viewSince=b.elapsedMs;b.focusReason=null;}this.engine.important=true;}
  chooseView(){
    const b=this.current,ids=b.fields.filter(f=>f.participantIds.length).map(f=>f.id);if(!ids.length)return;
    if(b.manualView!==null){b.viewId=b.manualView;return;}
    if(b.viewId!==null&&b.elapsedMs-b.viewSince<b.rules.combat.cameraDwellMs)return;
    const queued=b.focusQueue.findIndex(x=>x.id!==b.viewId&&ids.includes(x.id));const event=queued>=0?b.focusQueue.splice(queued,1)[0]:null;
    b.viewId=event?.id??ids[(ids.indexOf(b.viewId)+1)%ids.length];b.focusReason=event?.reason??'rotation';b.focusAt=b.elapsedMs;b.viewSince=b.elapsedMs;
    b.focusQueue=b.focusQueue.filter(x=>x.id!==b.viewId);
  }
  tick(dt){const b=this.current;if(b?.status!=='running')return;b.elapsedMs=Math.min(b.durationMs,b.elapsedMs+dt);for(const f of b.fields){if(!f.participantIds.length)continue;this.schedule(f);this.spawnMobs(f);this.combat.tick(f,dt);}this.chooseView();}
  finish(){const b=this.current;if(!b||!this.engine.rewards.finalize(b))return false;
    for(const f of b.fields)if(f.activeBoss?.status==='alive')f.activeBoss.status='timeout';
    this.result={battleId:b.id,resultId:b.id,remainingMs:12000,fields:b.fields.filter(f=>f.participantIds.length).map(f=>({id:f.id,name:f.name,results:f.results,bosses:f.bossHistory.map(m=>({name:m.name,status:m.status,lastHit:m.lastHit}))}))};
    this.engine.event('battle:result',null,{battleId:b.id});this.engine.important=true;return true;
  }
  snapshot(){
    const b=this.current;if(!b)return null;const f=b.fields[b.viewId];
    return {id:b.id,status:b.status,elapsedMs:b.elapsedMs,durationMs:b.durationMs,viewId:b.viewId,manualView:b.manualView,viewSince:b.viewSince,focusReason:b.focusReason,focusAt:b.focusAt,
      fields:b.fields.map(f=>({id:f.id,name:f.name,count:f.participantIds.length,status:f.status,bossName:f.activeBoss?.name,bossStatus:f.activeBoss?.status})),
      view:f?structuredClone({...f,top:ranking(f,b.elapsedMs).slice(0,5),results:undefined}):null};
  }
  restore(raw,result){
    if(!raw){this.result=structuredClone(result??null);return;}
    const invalid=()=>{throw new Error('Trạng thái chiến đấu lưu không hợp lệ; giữ nguyên dữ liệu.');};
    if(typeof raw.id!=='string'||!['running','finished'].includes(raw.status)||!Number.isFinite(raw.elapsedMs)||raw.elapsedMs<0||!Number.isFinite(raw.durationMs)||raw.durationMs<10000||raw.elapsedMs>raw.durationMs||!Array.isArray(raw.fields)||raw.fields.length!==11||!Array.isArray(raw.skillEvents)||raw.skillEvents.length>3601000||!Array.isArray(raw.focusQueue))invalid();
    if(!raw.rules||!Number.isFinite(raw.viewSince)||raw.viewSince<0||raw.viewSince>raw.elapsedMs||(raw.viewId!==null&&(!Number.isInteger(raw.viewId)||raw.viewId<0||raw.viewId>10))||(raw.manualView!==null&&(!Number.isInteger(raw.manualView)||raw.manualView<0||raw.manualView>10))||raw.focusQueue.length>11||raw.skillEvents.some(k=>typeof k!=='string'||k.length>250))invalid();
    battleRulesFor(raw.rules);const allIds=new Set();
    const finite=(v)=>Number.isFinite(v)&&v>=0&&v<=Number.MAX_SAFE_INTEGER;
    for(const [id,f]of raw.fields.entries()){
      if(f.id!==id||!Array.isArray(f.participantIds)||!f.participants||!Array.isArray(f.mobs)||!Array.isArray(f.bossHistory)||f.bossHistory.length>3||!Number.isInteger(f.pendingMobs)||f.pendingMobs<0||!Number.isInteger(f.nextMob)||f.nextMob<0||!['pending','applied'].includes(f.rewardState))invalid();
      for(const userId of f.participantIds){const p=f.participants[userId];if(allIds.has(userId)||!this.engine.players.has(userId)||!p||p.userId!==userId||p.realmIndex!==id||!['hp','maxHp','atk','def','joinedAt','damage','bossDamage','mobDamage','scoreAt','attackAt','reviveAt','animationUntil','skillCount'].every(k=>finite(p[k]))||p.hp>p.maxHp||!Number.isFinite(p.x)||!Number.isFinite(p.z)||!p.cooldowns||!finite(p.cooldowns['1'])||!finite(p.cooldowns['2'])||!Array.isArray(p.bossIds))invalid();allIds.add(userId);}
      for(const m of [...f.mobs,...f.bossHistory])if(!['hp','maxHp','atk','def','spawnTime','attackAt','animationUntil'].every(k=>finite(m[k]))||m.hp>m.maxHp||!Number.isFinite(m.x)||!Number.isFinite(m.z)||!['alive','dead','timeout'].includes(m.status))invalid();
      if(f.activeBoss&&!f.bossHistory.some(m=>m.id===f.activeBoss.id))invalid();
    }
    this.current=structuredClone(raw);this.result=structuredClone(result??null);
    // JSON loses object aliases: activeBoss must point to the history object again.
    for(const f of this.current.fields)if(f.activeBoss)f.activeBoss=f.bossHistory.find(m=>m.id===f.activeBoss.id);
  }
}
