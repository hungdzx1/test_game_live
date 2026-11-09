import {randomUUID,randomInt} from 'node:crypto';
import {BOSS_FORMAT,BOSS_SELECTION,BOSS_REWARD,encountersFor} from './bossConfig.js';
import {BattleService as LegacyBattleService} from './battleService.js';
import {battleRulesFor} from './battleConfig.js';
import {damageFor,ranking} from './combatService.js';
const own=(object,key,value)=>Object.defineProperty(object,key,{value,writable:true,enumerable:true,configurable:true});
const safe=n=>Number.isSafeInteger(n)&&n>=0;
const finite=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
export class BossService{
  constructor(engine){
    this.engine=engine;this.current=null;this.result=null;this.legacy=null;this.legacyResult=null;this.migratedLegacy=false;this.pendingPills=Object.create(null);
    this.balance={lastBossIndex:null,skillUse:.25,observations:0};this.rng=()=>randomInt(0,0x100000000)/0x100000000;
    // Existing command routing remains the sole entry point for skills.
    this.combat={skill:(...args)=>this.skill(...args),applyDamage:(...args)=>this.applyDamage(...args)};
  }
  start(){
    const e=this.engine,rules=structuredClone(e.battleRules),id=randomUUID();
    const field={id:0,name:'Lôi đài tông môn',realmIndex:null,battleId:id,participantIds:[],participants:Object.create(null),joinedAtByUser:Object.create(null),mobs:[],activeBoss:null,bossHistory:[],damageByUser:Object.create(null),rewardState:'applied',status:'running'};
    const choices=[0,1,2].filter(i=>i!==this.balance.lastBossIndex),roll=this.rng();
    if(!Number.isFinite(roll)||roll<0||roll>=1)throw new Error('Nguồn ngẫu nhiên boss không hợp lệ.');
    const index=choices[Math.floor(roll*choices.length)];
    this.current={format:BOSS_FORMAT,selectionMode:BOSS_SELECTION,endOnKill:true,id,cycleId:e.cycleId,status:'running',elapsedMs:0,durationMs:0,rules,skillEvents:[],viewId:0,manualView:null,viewSince:0,focusReason:'boss',focusAt:0,fields:[field],bossIndex:index,scaling:null};
    this.result=null;for(const p of e.players.values())this.join(p);this.spawn(index);this.balance.lastBossIndex=index;
    e.event('battle:prepare',null,{battleId:id,format:BOSS_FORMAT});e.important=true;
  }
  join(player){
    const b=this.current;if(b?.status!=='running')return;const f=b.fields[0];if(Object.hasOwn(f.participants,player.userId))return;
    const stats=this.engine.items.getEffectiveStats(player),index=f.participantIds.length;
    const p={userId:player.userId,name:player.name,realmIndex:player.realmIndex,stageIndex:player.stageIndex,hp:stats.hp,maxHp:stats.hp,atk:stats.atk,def:stats.def,x:(index%10-4.5)*1.3,z:5+Math.floor(index/10)*.4,joinedAt:b.elapsedMs,damage:0,bossDamage:0,mobDamage:0,scoreAt:b.elapsedMs,skillCount:0,bossIds:[],cooldowns:{'1':0,'2':0},attackAt:b.elapsedMs+b.rules.combat.attackIntervalMs,animation:'attack',animationUntil:0,lastEffectAt:-1500};
    f.participantIds.push(player.userId);own(f.participants,player.userId,p);own(f.joinedAtByUser,player.userId,b.elapsedMs);own(f.damageByUser,player.userId,0);
    if(this.warningRemainingMs>0)p.animation='idle';
    this.engine.event('battle:joined',player.userId,{fieldId:0});this.engine.important=true;
  }
  spawn(index){
    const b=this.current,f=b.fields[0],row=b.rules.boss.encounters[index];b.bossIndex=index;
    const dps=this.damageModel(),baseDps=Math.max(10,dps.auto),targetSeconds=b.rules.boss.targetSeconds;
    const hp=Math.min(1e15,Math.max(1,Math.ceil((baseDps+dps.skills*this.balance.skillUse)*targetSeconds)));
    b.scaling={baseDps,skillDps:dps.skills,skillUse:this.balance.skillUse,targetSeconds,hp,skillDamage:0,skillCapacity:0,migrated:false};
    const boss={id:b.id+':'+row.id,assetId:row.id,kind:'boss',type:index,name:row.name,hp,maxHp:hp,atk:0,def:0,x:0,z:-3,status:'alive',spawnTime:b.elapsedMs,elapsedMs:0,durationMs:0,endOnKill:true,warningDurationMs:3000,warningElapsedMs:0,attackAt:0,animation:'idle',animationUntil:0,rewarded:false,reward:structuredClone(BOSS_REWARD),lastHit:null};
    f.activeBoss=boss;f.bossHistory.push(boss);this.engine.remainingMs=boss.warningDurationMs;
    for(const p of Object.values(f.participants)){p.attackAt=b.elapsedMs+b.rules.combat.attackIntervalMs;p.animation='idle';}
    this.engine.event('boss:spawned',null,{fieldId:0,battleId:b.id,bossId:boss.id,bossIndex:index,name:boss.name,hp:boss.hp});this.engine.important=true;
  }
  damageModel(){
    const b=this.current;let auto=0,skills=0,autoError=0,skillError=0;
    for(const p of Object.values(b.fields[0].participants)){
      const a=damageFor(p.atk,1,0)*1000/b.rules.combat.attackIntervalMs-autoError,nextAuto=auto+a;autoError=(nextAuto-auto)-a;auto=nextAuto;
      for(const rule of Object.values(b.rules.skills)){const s=damageFor(p.atk,rule.multiplier,0)/rule.cooldownSeconds-skillError,nextSkills=skills+s;skillError=(nextSkills-skills)-s;skills=nextSkills;}
    }
    return {auto,skills};
  }
  get warningRemainingMs(){const boss=this.current?.fields[0].activeBoss;return this.current?.status==='running'&&boss?Math.max(0,(boss.warningDurationMs??0)-(boss.warningElapsedMs??0)):0;}
  get remainingMs(){const boss=this.current?.fields[0].activeBoss;return this.current?.status==='running'?this.warningRemainingMs||(this.current.endOnKill?0:Math.max(0,boss.durationMs-boss.elapsedMs)):0;}
  completeBoss(status,lastHit=null){
    const b=this.current,f=b.fields[0],boss=f.activeBoss;if(b?.status!=='running'||boss.status!=='alive')return;
    if(b.endOnKill&&status!=='dead')return;
    boss.status=status;boss.lastHit=lastHit;boss.deathAt=b.elapsedMs;
    if(status==='dead')this.award(boss);
    this.engine.event(status==='dead'?'boss:killed':'boss:timeout',lastHit,{fieldId:0,battleId:b.id,bossId:boss.id,bossIndex:boss.type,name:boss.name,x:boss.x,z:boss.z});
    if(b.endOnKill){
      if(b.scaling?.skillCapacity>0){const observed=Math.min(1,b.scaling.skillDamage/b.scaling.skillCapacity);this.balance.skillUse=this.balance.skillUse*.5+observed*.5;this.balance.observations++;}
      this.finish();
    }else if(b.bossIndex<2)this.spawn(b.bossIndex+1);else this.finish();this.engine.important=true;
  }
  award(boss){
    if(boss.rewarded)return;const e=this.engine,{blessings,pills}=boss.reward;
    for(const p of e.players.values())if(!safe((this.pendingPills[p.userId]??0)+pills))throw new Error('Phần thưởng Đan chờ vượt giới hạn an toàn.');
    boss.rewarded=true;boss.rewardRecipients=[...e.players.keys()];
    if(blessings)e.items.activateBlessing(blessings,'boss:'+boss.assetId);
    if(pills)for(const p of e.players.values()){own(this.pendingPills,p.userId,(this.pendingPills[p.userId]??0)+pills);this.drainPills(p);}
    e.audit('boss:reward',{battleId:this.current.id,bossId:boss.id,blessings,pills,recipients:e.players.size});
  }
  drainPills(player){
    let pending=this.pendingPills[player.userId]??0;
    while(pending>0&&player.inventory.pill<100000){const count=Math.min(100,pending,100000-player.inventory.pill);this.engine.items.receiveItem(player,'pill',count,'boss_reward');pending-=count;own(this.pendingPills,player.userId,pending);}
    if(!pending)delete this.pendingPills[player.userId];
  }
  applyDamage(field,player,boss,multiplier=1,skill=null){
    const b=this.current,e=this.engine;
    if(e.phase!=='battle'||b?.status!=='running'||this.warningRemainingMs>0||field!==b.fields[0]||!player||field.participants[player.userId]!==player||boss!==field.activeBoss||boss.status!=='alive')return 0;
    const amount=Math.min(boss.hp,damageFor(player.atk,multiplier,0));boss.hp-=amount;player.damage+=amount;player.bossDamage+=amount;player.scoreAt=b.elapsedMs;field.damageByUser[player.userId]=player.damage;
    if(skill&&b.scaling)b.scaling.skillDamage+=amount;
    if(!player.bossIds.includes(boss.id))player.bossIds.push(boss.id);
    player.animation='attack';boss.animation='hit';boss.animationUntil=b.elapsedMs+200;
    if(skill||b.elapsedMs-player.lastEffectAt>=1500){player.lastEffectAt=b.elapsedMs;e.event('battle:hit',player.userId,{fieldId:0,bossId:boss.id,targetId:boss.id,bossIndex:boss.type,x:boss.x,z:boss.z,fromX:player.x,fromZ:player.z,damage:amount,skill});}
    if(boss.hp===0)this.completeBoss('dead',player.userId);return amount;
  }
  skill(userId,key,eventId){
    const b=this.current,e=this.engine;if(e.phase!=='battle'||b?.status!=='running')throw new Error('Kỹ năng chỉ dùng khi đánh boss.');
    if(eventId&&b.skillEvents.includes(eventId))return {duplicate:true};
    if(this.warningRemainingMs>0)throw new Error('Boss đang xuất hiện; chờ hết cảnh báo 3 giây để dùng kỹ năng.');
    const f=b.fields[0],p=f.participants[userId],rule=b.rules.skills[key];if(!p||!rule)throw new Error('Đạo hữu chưa tham chiến.');
    if(b.elapsedMs<p.cooldowns[key])throw new Error(`Kỹ năng còn hồi ${Math.ceil((p.cooldowns[key]-b.elapsedMs)/1000)} giây.`);
    p.cooldowns[key]=b.elapsedMs+rule.cooldownSeconds*1000;p.skillCount++;if(eventId){b.skillEvents.push(eventId);if(b.endOnKill&&b.skillEvents.length>4096)b.skillEvents.shift();}
    const amount=this.applyDamage(f,p,f.activeBoss,rule.multiplier,key);e.important=true;
    if(b.status==='finished')e.setPhase('cultivation');return {damage:amount};
  }
  tick(dt){
    const b=this.current;if(b?.status!=='running')return;
    const f=b.fields[0],boss=f.activeBoss;
    if(this.warningRemainingMs>0){
      const step=Math.min(dt,this.warningRemainingMs);boss.warningElapsedMs+=step;dt-=step;
      for(const p of Object.values(f.participants))p.animation='idle';
      if(this.warningRemainingMs===0){this.engine.event('boss:appeared',null,{battleId:b.id,bossId:boss.id,bossIndex:boss.type});this.engine.important=true;}
      if(dt<=0)return;
    }
    b.elapsedMs=b.endOnKill?b.elapsedMs+dt:Math.min(b.durationMs,b.elapsedMs+dt);boss.elapsedMs=b.endOnKill?boss.elapsedMs+dt:Math.min(boss.durationMs,boss.elapsedMs+dt);
    if(b.scaling)b.scaling.skillCapacity+=this.damageModel().skills*dt/1000;
    // A timeout never awards loot or accepts a hit at/after its deadline.
    if(!b.endOnKill&&boss.elapsedMs>=boss.durationMs){this.completeBoss('timeout');return;}
    for(const p of Object.values(f.participants)){
      if(b.status!=='running'||f.activeBoss!==boss)break;
      p.animation='attack';if(b.elapsedMs<p.attackAt)continue;p.attackAt=b.elapsedMs+b.rules.combat.attackIntervalMs;
      this.applyDamage(f,p,f.activeBoss);
    }
  }
  finish(){
    const b=this.current;if(!b||this.result?.resultId===b.id)return false;const f=b.fields[0];
    if(b.endOnKill&&f.activeBoss?.status==='alive')return false;
    if(f.activeBoss?.status==='alive'){f.activeBoss.status='timeout';f.activeBoss.deathAt=b.elapsedMs;}
    b.status='finished';f.status='finished';f.results=ranking(f,b.elapsedMs).map((p,i)=>({userId:p.userId,name:p.name,rank:i+1,damage:p.damage,stages:0,blessing:false}));
    this.result={format:BOSS_FORMAT,resultId:b.id,battleId:b.id,remainingMs:12000,fields:[{id:0,name:f.name,results:f.results,bosses:f.bossHistory.map(p=>({name:p.name,status:p.status,lastHit:p.lastHit,rewarded:p.rewarded,reward:p.reward}))}]};
    this.engine.event('battle:result',null,{battleId:b.id,format:BOSS_FORMAT});this.engine.important=true;return true;
  }
  selectView(value){if(value!=='auto'&&value!==0)throw new Error('Tất cả đạo hữu cùng đánh boss trên một lôi đài.');if(!this.current)throw new Error('Chưa có trận boss.');this.current.manualView=value==='auto'?null:0;}
  snapshot(){
    const b=this.current;if(!b)return null;const f=b.fields[0];
    return {format:BOSS_FORMAT,id:b.id,status:b.status,elapsedMs:b.elapsedMs,durationMs:b.durationMs,endOnKill:b.endOnKill===true,selectionMode:b.selectionMode??null,targetDurationMs:b.endOnKill?b.rules.boss.targetSeconds*1000:null,bossIndex:b.bossIndex,bossRemainingMs:b.status==='running'&&!b.endOnKill?Math.max(0,f.activeBoss.durationMs-f.activeBoss.elapsedMs):0,bossWarningRemainingMs:this.warningRemainingMs,viewId:0,manualView:b.manualView,viewSince:0,focusReason:'boss',focusAt:0,fields:[{id:0,name:f.name,count:f.participantIds.length,status:f.status,bossName:f.activeBoss?.name,bossStatus:f.activeBoss?.status}],view:structuredClone({...f,top:ranking(f,b.elapsedMs).slice(0,5)})};
  }
  restore(raw,result,extra={}){
    if(extra.balance!==undefined&&extra.balance!==null){
      const value=extra.balance;if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['lastBossIndex','skillUse','observations'].includes(k))||!(value.lastBossIndex===null||Number.isInteger(value.lastBossIndex)&&value.lastBossIndex>=0&&value.lastBossIndex<=2)||!Number.isFinite(value.skillUse)||value.skillUse<0||value.skillUse>1||!safe(value.observations))throw new Error('Dữ liệu cân bằng boss không hợp lệ; giữ nguyên dữ liệu.');
      this.balance=structuredClone(value);
    }
    this.pendingPills=Object.create(null);
    if(extra.pendingPills!==undefined&&extra.pendingPills!==null&&(typeof extra.pendingPills!=='object'||Array.isArray(extra.pendingPills)))throw new Error('Đan thưởng boss chờ không hợp lệ.');
    for(const[id,count]of Object.entries(extra.pendingPills??{})){if(!this.engine.players.has(id)||!safe(count))throw new Error('Đan thưởng boss chờ không hợp lệ.');own(this.pendingPills,id,count);}
    this.legacy=null;this.legacyResult=null;
    if(extra.legacy){const archive=new LegacyBattleService(this.engine);archive.restore(extra.legacy,extra.legacyResult);this.legacy=archive.current;this.legacyResult=archive.result;}
    if(!raw){this.result=structuredClone(result??null);return;}
    if(raw.format!==BOSS_FORMAT){
      // Validate and archive old arenas. Never replay the removed eleven-field simulation.
      const old=new LegacyBattleService(this.engine);old.restore(raw,result);this.legacy=old.current;this.legacyResult=old.result;
      this.migratedLegacy=true;return;
    }
    if(raw.endOnKill===true){this.restoreAdaptive(raw,result);return;}
    const invalid=()=>{throw new Error('Trạng thái chiến đấu boss lưu không hợp lệ; giữ nguyên dữ liệu.');};
    if(typeof raw.id!=='string'||!['running','finished'].includes(raw.status)||!Number.isFinite(raw.elapsedMs)||raw.elapsedMs<0||!Number.isFinite(raw.durationMs)||raw.durationMs<30000||raw.elapsedMs>raw.durationMs||!Array.isArray(raw.fields)||raw.fields.length!==1||!Array.isArray(raw.skillEvents)||raw.skillEvents.length>3601000||raw.skillEvents.some(x=>typeof x!=='string'||x.length>250)||!Number.isInteger(raw.bossIndex)||raw.bossIndex<0||raw.bossIndex>2)invalid();
    const rules=battleRulesFor(raw.rules),rows=encountersFor(rules.boss.encounters),f=raw.fields[0];
    if(raw.durationMs!==rows.reduce((sum,row)=>sum+row.durationSeconds*1000,0))invalid();
    if(!f||f.id!==0||!Array.isArray(f.participantIds)||!f.participants||!f.damageByUser||!Array.isArray(f.mobs)||f.mobs.length||!Array.isArray(f.bossHistory)||f.bossHistory.length!==raw.bossIndex+1||new Set(f.participantIds).size!==f.participantIds.length||Object.keys(f.participants).length!==f.participantIds.length)invalid();
    for(const id of f.participantIds){const p=f.participants[id];if(!this.engine.players.has(id)||!p||p.userId!==id||!['hp','maxHp','atk','def','joinedAt','damage','bossDamage','mobDamage','scoreAt','skillCount','attackAt','animationUntil'].every(k=>finite(p[k]))||p.hp!==p.maxHp||p.hp<1||!p.cooldowns||!finite(p.cooldowns['1'])||!finite(p.cooldowns['2'])||!Array.isArray(p.bossIds)||!Number.isFinite(p.x)||!Number.isFinite(p.z))invalid();}
    for(const [i,boss]of f.bossHistory.entries())if(boss.type!==i||boss.assetId!==rows[i].id||boss.id!==raw.id+':'+rows[i].id||!safe(boss.hp)||boss.maxHp!==rows[i].hp||boss.hp>boss.maxHp||boss.durationMs!==rows[i].durationSeconds*1000||!Number.isFinite(boss.elapsedMs)||boss.elapsedMs<0||boss.elapsedMs>boss.durationMs||!['alive','dead','timeout'].includes(boss.status)||typeof boss.rewarded!=='boolean'||boss.rewarded!==(boss.status==='dead')||boss.status==='dead'&&boss.hp!==0||i<raw.bossIndex&&boss.status==='alive'||JSON.stringify(boss.reward)!==JSON.stringify(rows[i].reward))invalid();
    if(f.activeBoss?.id!==f.bossHistory.at(-1).id||raw.status==='running'&&f.bossHistory.at(-1).status!=='alive')invalid();
    for(const boss of f.bossHistory){
      // Saves created before TB02 have no warning fields and continue without replaying an intro.
      if(boss.warningDurationMs===undefined&&boss.warningElapsedMs===undefined)continue;
      if(boss.warningDurationMs!==3000||!finite(boss.warningElapsedMs)||boss.warningElapsedMs>3000||boss.warningElapsedMs<3000&&boss.elapsedMs!==0)invalid();
    }
    this.current=structuredClone(raw);this.current.rules=rules;this.current.fields[0].activeBoss=this.current.fields[0].bossHistory.at(-1);this.result=structuredClone(result??null);
    this.balance.lastBossIndex??=raw.bossIndex;
    if(this.current.status==='running'){
      // Validate the old save first, then preserve its current HP/clock/history.
      const b=this.current,boss=b.fields[0].activeBoss,dps=this.damageModel();
      b.endOnKill=true;b.selectionMode=BOSS_SELECTION;b.durationMs=0;b.skillEvents=b.skillEvents.slice(-4096);boss.durationMs=0;boss.endOnKill=true;boss.reward=structuredClone(BOSS_REWARD);
      b.scaling={migrated:true,baseDps:dps.auto,skillDps:dps.skills,skillUse:this.balance.skillUse,targetSeconds:rules.boss.targetSeconds,hp:boss.maxHp,skillDamage:0,skillCapacity:0};
      this.migratedAdaptive=true;
    }
  }
  restoreAdaptive(raw,result){
    const invalid=()=>{throw new Error('Trạng thái boss ngẫu nhiên lưu không hợp lệ; giữ nguyên dữ liệu.');};
    if(raw.selectionMode!==BOSS_SELECTION||typeof raw.id!=='string'||!['running','finished'].includes(raw.status)||!finite(raw.elapsedMs)||raw.durationMs!==0||!Number.isInteger(raw.bossIndex)||raw.bossIndex<0||raw.bossIndex>2||!Array.isArray(raw.fields)||raw.fields.length!==1||!Array.isArray(raw.skillEvents)||raw.skillEvents.length>4096||raw.skillEvents.some(x=>typeof x!=='string'||x.length>250))invalid();
    const rules=battleRulesFor(raw.rules),rows=rules.boss.encounters,f=raw.fields[0],s=raw.scaling;
    if(!s||typeof s.migrated!=='boolean'||!['baseDps','skillDps','skillUse','targetSeconds','hp','skillDamage','skillCapacity'].every(k=>finite(s[k]))||s.skillUse>1||s.targetSeconds!==rules.boss.targetSeconds||!safe(s.hp)||s.hp<1)invalid();
    if(!s.migrated&&s.hp!==Math.min(1e15,Math.max(1,Math.ceil((s.baseDps+s.skillDps*s.skillUse)*s.targetSeconds))))invalid();
    if(!f||f.id!==0||!Array.isArray(f.participantIds)||f.participantIds.length>500||new Set(f.participantIds).size!==f.participantIds.length||!f.participants||Object.keys(f.participants).length!==f.participantIds.length||!f.damageByUser||!Array.isArray(f.mobs)||f.mobs.length||!Array.isArray(f.bossHistory)||f.bossHistory.length<1||f.bossHistory.length>3||!s.migrated&&f.bossHistory.length!==1)invalid();
    for(const id of f.participantIds){const p=f.participants[id];if(!this.engine.players.has(id)||!p||p.userId!==id||!['hp','maxHp','atk','def','joinedAt','damage','bossDamage','mobDamage','scoreAt','skillCount','attackAt','animationUntil'].every(k=>finite(p[k]))||p.hp!==p.maxHp||p.hp<1||!p.cooldowns||!finite(p.cooldowns['1'])||!finite(p.cooldowns['2'])||!Array.isArray(p.bossIds)||!Number.isFinite(p.x)||!Number.isFinite(p.z))invalid();}
    for(const [i,boss]of f.bossHistory.entries()){
      const active=i===f.bossHistory.length-1,row=rows[boss.type];
      if(!row||!Number.isInteger(boss.type)||boss.assetId!==row.id||boss.id!==raw.id+':'+row.id||!safe(boss.hp)||!safe(boss.maxHp)||boss.maxHp<1||boss.hp>boss.maxHp||!finite(boss.elapsedMs)||!['alive','dead','timeout'].includes(boss.status)||typeof boss.rewarded!=='boolean'||boss.rewarded!==(boss.status==='dead')||boss.status==='dead'&&boss.hp!==0||!active&&boss.status==='alive')invalid();
      if(active){if(boss.type!==raw.bossIndex||boss.maxHp!==s.hp||s.migrated&&boss.maxHp!==row.hp||boss.endOnKill!==true||boss.durationMs!==0||JSON.stringify(boss.reward)!==JSON.stringify(BOSS_REWARD)||raw.status==='running'&&boss.status!=='alive'||raw.status==='finished'&&boss.status!=='dead')invalid();}
      else if(boss.durationMs!==row.durationSeconds*1000||boss.elapsedMs>boss.durationMs||boss.maxHp!==row.hp||JSON.stringify(boss.reward)!==JSON.stringify(row.reward))invalid();
      if(boss.warningDurationMs!==undefined||boss.warningElapsedMs!==undefined)if(boss.warningDurationMs!==3000||!finite(boss.warningElapsedMs)||boss.warningElapsedMs>3000||boss.warningElapsedMs<3000&&boss.elapsedMs!==0)invalid();
    }
    if(f.activeBoss?.id!==f.bossHistory.at(-1).id)invalid();
    this.current=structuredClone(raw);this.current.rules=rules;this.current.fields[0].activeBoss=this.current.fields[0].bossHistory.at(-1);this.result=structuredClone(result??null);this.balance.lastBossIndex??=raw.bossIndex;
  }
}
