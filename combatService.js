// Supplemental Phase 3 balance: defense reduction, minimum one damage, actual HP cap.
export function damageFor(attack,multiplier,defense){
  if(![attack,multiplier,defense].every(Number.isFinite)||attack<0||multiplier<=0||defense<0)throw new Error('Sát thương không hợp lệ.');
  const damage=Math.floor(attack*multiplier*100/(100+defense));if(!Number.isFinite(damage))throw new Error('Sát thương vượt giới hạn.');return Math.max(1,damage);
}
export function ranking(field,time){return field.participantIds.map(id=>({...field.participants[id],participationMs:Math.max(0,time-field.participants[id].joinedAt)})).sort((a,b)=>b.damage-a.damage||a.scoreAt-b.scoreAt||a.joinedAt-b.joinedAt||a.userId.localeCompare(b.userId));}
export class CombatService{
  constructor(battle){this.battle=battle;this.engine=battle.engine;}
  enemies(f){return [...f.mobs.filter(m=>m.status==='alive'),...(f.activeBoss?.status==='alive'?[f.activeBoss]:[])];}
  target(f,p){const enemies=this.enemies(f);return enemies.find(m=>m.id===p.targetId)||f.activeBoss&&enemies.find(m=>m.id===f.activeBoss.id)||enemies.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];}
  applyDamage(f,p,target,multiplier=1,skill=null){
    const b=this.battle.current,e=this.engine;
    if(e.phase!=='battle'||b?.status!=='running'||!b.fields.includes(f)||f.participants[p?.userId]!==p||p.hp<=0||target?.status!=='alive'||!this.enemies(f).includes(target))return 0;
    const amount=Math.min(target.hp,damageFor(p.atk,multiplier,target.def));target.hp=Math.max(0,target.hp-amount);
    p.damage+=amount;p[target.kind==='boss'?'bossDamage':'mobDamage']+=amount;p.scoreAt=b.elapsedMs;f.damageByUser[p.userId]=p.damage;
    if(target.kind==='boss'&&!p.bossIds.includes(target.id))p.bossIds.push(target.id);
    p.animation=skill==='2'?'cast':'attack';p.animationUntil=b.elapsedMs+650;target.animation='hit';target.animationUntil=b.elapsedMs+250;
    // Transmit occasional automatic hits; every skill/death is sent. Score is always in snapshots.
    if(skill||b.elapsedMs-p.lastEffectAt>=1500){p.lastEffectAt=b.elapsedMs;e.event('battle:hit',p.userId,{fieldId:f.id,targetId:target.id,x:target.x,z:target.z,fromX:p.x,fromZ:p.z,damage:amount,skill});}
    if(!target.hp){target.status='dead';target.lastHit=p.userId;target.deathAt=b.elapsedMs;e.important=true;e.event(target.kind==='boss'?'boss:killed':'mob:killed',p.userId,{fieldId:f.id,name:target.name,x:target.x,z:target.z});if(target.kind==='boss')this.battle.focus(f.id,'death');}
    if(target.kind==='boss'&&target.type===2&&!target.enraged&&target.hp>0&&target.hp<target.maxHp*.3){target.enraged=true;this.battle.focus(f.id,'enrage');e.event('boss:enraged',null,{fieldId:f.id,name:target.name});e.important=true;}
    return amount;
  }
  skill(userId,key,eventKey){
    const b=this.battle.current,e=this.engine;if(e.phase!=='battle'||b?.status!=='running')throw new Error('Kỹ năng chỉ dùng khi diệt ma.');
    if(eventKey&&b.skillEvents.includes(eventKey))return {duplicate:true};
    const f=b.fields.find(f=>Object.hasOwn(f.participants,userId)),p=f?.participants[userId],s=b.rules.skills[key];
    if(!p||p.hp<=0||!s)throw new Error('Đạo hữu chưa tham chiến hoặc đang hồi sinh.');
    if(b.elapsedMs<p.cooldowns[key])throw new Error(`Kỹ năng còn hồi ${Math.ceil((p.cooldowns[key]-b.elapsedMs)/1000)} giây.`);
    const target=this.target(f,p);if(!target)throw new Error('Chưa có mục tiêu còn sống.');
    const amount=this.applyDamage(f,p,target,s.multiplier,key);p.cooldowns[key]=b.elapsedMs+s.cooldownSeconds*1000;p.skillCount++;
    if(eventKey){b.skillEvents.push(eventKey);}e.important=true;return {damage:amount};
  }
  move(actor,target,dt,range=1.8){const dx=target.x-actor.x,dz=target.z-actor.z,d=Math.hypot(dx,dz);actor.facing=Math.atan2(dx,dz);if(d<=range)return true;const step=Math.min(d-range,actor.moveSpeed*dt/1000);actor.x+=dx/d*step;actor.z+=dz/d*step;actor.animation='walk';return false;}
  hurt(f,m,p,multiplier=1){
    const b=this.battle.current;if(p.hp<=0)return;p.hp=Math.max(0,p.hp-damageFor(m.atk,multiplier,p.def));p.animation=p.hp?'hit':'defeated';p.animationUntil=b.elapsedMs+400;
    if(!p.hp){p.reviveAt=b.elapsedMs+b.rules.combat.reviveMs;this.engine.event('battle:down',p.userId,{fieldId:f.id});}
  }
  tick(f,dt){
    const b=this.battle.current,t=b.elapsedMs;
    for(const p of Object.values(f.participants)){
      if(p.hp<=0){p.animation='defeated';if(t<p.reviveAt)continue;p.hp=p.maxHp;p.x=p.homeX;p.z=5;p.animation='teleport';p.animationUntil=t+700;this.engine.event('battle:revived',p.userId,{fieldId:f.id});}
      const target=this.target(f,p);if(!target){p.animation='idle';p.targetId=null;continue;}p.targetId=target.id;
      if(t>=p.animationUntil)p.animation='idle';if(this.move(p,target,dt)&&t>=p.attackAt){this.applyDamage(f,p,target);p.attackAt=t+b.rules.combat.attackIntervalMs;}
    }
    const alive=Object.values(f.participants).filter(p=>p.hp>0);if(!alive.length)return;
    for(const m of this.enemies(f)){
      const target=alive.find(p=>p.userId===m.targetId)||alive.reduce((a,p)=>Math.hypot(p.x-m.x,p.z-m.z)<Math.hypot(a.x-m.x,a.z-m.z)?p:a);m.targetId=target.userId;
      if(t>=m.animationUntil)m.animation='idle';if(this.move(m,target,dt,2)&&t>=m.attackAt){this.hurt(f,m,target,m.enraged?1.6:1);m.attackAt=t+m.attackInterval/(m.enraged?1.4:1);m.animation='attack';m.animationUntil=t+650;}
      if(m.kind==='boss'&&t>=m.specialAt){
        m.specialAt=t+(m.enraged?6500:12000);m.animation='cast';m.animationUntil=t+1000;
        if(m.type===1)this.battle.queueMobs(f,3,true);else for(const p of alive)if(m.type===2||Math.hypot(p.x-m.x,p.z-m.z)<6)this.hurt(f,m,p,m.enraged?1.3:.8);
        this.engine.event('boss:skill',null,{fieldId:f.id,bossType:m.type,x:m.x,z:m.z,enraged:m.enraged});
      }
    }
  }
}
