import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';
import {createPlayer,validateSave} from '../playerStore.js';
import {CommandRouter} from '../commandRouter.js';
import {battleRulesFor} from '../battleConfig.js';
import {damageFor,ranking} from '../combatService.js';
function make(realms=[0],config={}){const players=realms.map((r,i)=>({...createPlayer(`p${i}`,`Đạo hữu ${i}`,i),realmIndex:r}));return new GameEngine(players,config,{rng:()=>0});}
function advance(e,ms){while(ms>0){const dt=Math.min(250,ms);e.tick(dt);ms-=dt;}}
const field=e=>e.battle.current.fields[0];
test('03-01/02/03/18 exact 600/300 cycle, frozen EXP/buffs/items/pending EXP, return resumes',()=>{
  const e=make();e.setPhase('cultivation');advance(e,599750);assert.equal(e.phase,'cultivation');assert.equal(e.remainingMs,250);
  advance(e,250);assert.equal(e.phase,'battle');assert.equal(e.remainingMs,300000);const cycle=e.cycleId;
  const p=e.getPlayer('p0');p.buffs.push({kind:'tea',multiplier:2,remainingMs:30000});const exp=p.cultivation,realm=p.realmIndex,stage=p.stageIndex;
  e.cultivation.grant(p,12);e.items.grantItem(p,'tea');assert.throws(()=>e.items.useItem(p,'tea'));assert.equal(e.cultivation.add(p,10000),false);
  advance(e,60000);assert.equal(p.cultivation,exp);assert.equal(p.realmIndex,realm);assert.equal(p.stageIndex,stage);assert.equal(p.buffs[0].remainingMs,30000);assert.equal(p.inventory.tea,1);assert.equal(p.pendingExp,12);
  advance(e,240000);assert.equal(e.phase,'cultivation');assert.equal(e.remainingMs,600000);assert.notEqual(e.cycleId,cycle);assert.equal(p.pendingExp,0);assert.equal(p.buffs[0].remainingMs,30000);
  advance(e,250);assert.equal(p.buffs[0].remainingMs,29750);assert.ok(p.cultivation>exp);assert.equal(p.x,p.homeX);assert.ok(e.battle.result);
});
test('03-04/05/06 eleven independent fields, empty idle, fixed boss HP and 3N mob queue',()=>{
  const e=make([0,3,10]);e.setPhase('battle');const b=e.battle.current;assert.equal(b.fields.length,11);
  assert.equal(b.fields.filter(f=>f.status==='running').length,3);
  for(const f of b.fields){if(!f.participantIds.length){assert.equal(f.activeBoss,null);assert.equal(f.mobs.length,0);continue;}assert.equal(f.mobs.length,3);assert.equal(f.activeBoss.maxHp,Math.round(e.rules.realms[f.id].atk*90*.65*e.battleRules.boss.soloFactor));}
  const large=make(Array(100).fill(0),{combat:{maxActiveMobs:12}});large.setPhase('battle');assert.equal(field(large).mobs.length,12);assert.equal(field(large).pendingMobs,288);
  const f=field(large);for(const m of f.mobs){m.status='dead';m.deathAt=0;}advance(large,1000);assert.equal(f.mobs.filter(m=>m.status==='alive').length,12);assert.equal(f.pendingMobs,276);
});
test('03-07 auto combat, retaliation, KO/revive; pause freezes everything',()=>{
  const e=make();e.setPhase('battle');advance(e,15000);const f=field(e),p=f.participants.p0;assert.ok(p.damage>0);assert.ok(p.hp<p.maxHp||p.reviveAt>0);
  p.hp=0;p.reviveAt=e.battle.current.elapsedMs+10000;const dead=e.exportState();e.setPhase('paused');advance(e,20000);assert.equal(e.battle.current.elapsedMs,dead.runtime.battle.elapsedMs);assert.equal(p.hp,0);
  e.setPhase('resume');advance(e,9750);assert.equal(p.hp,0);advance(e,250);assert.ok(p.hp>0);assert.equal(e.players.size,1);
});
test('03-08/09/10 skills exact x2/x3, own cooldown, no replay even after disk restart',()=>{
  const e=make([0,0]);e.setPhase('battle');const f=field(e),b=e.battle.current,p=f.participants.p0,boss=f.activeBoss,router=new CommandRouter(e);
  const input={eventId:'one',userId:'p0',text:'1'};router.handle(input);assert.equal(p.damage,20);assert.equal(p.cooldowns['1'],10000);assert.equal(p.skillCount,1);assert.equal(boss.hp,boss.maxHp-20);
  router.handle(input);assert.equal(p.damage,20);assert.throws(()=>router.handle({...input,eventId:'spam'}),/hồi/);
  router.handle({eventId:'two',userId:'p0',text:'2'});assert.equal(p.damage,50);assert.equal(p.cooldowns['2'],25000);assert.equal(p.skillCount,2);
  router.handle({eventId:'other',userId:'p1',text:'1'});assert.equal(f.participants.p1.damage,20);
  const saved=JSON.parse(JSON.stringify(e.exportState())),restored=new GameEngine(validateSave(saved).players,{}, {saved});restored.setPhase('resume');
  new CommandRouter(restored).handle(input);assert.equal(field(restored).participants.p0.damage,50);assert.equal(field(restored).participants.p0.skillCount,2);
  // Cooldown depends on active battle time, never wall time or browser FPS.
  p.attackAt=1e8;f.participants.p1.attackAt=1e8;boss.hp=boss.maxHp=1e7;boss.attackAt=boss.specialAt=1e8;f.mobs=[];f.pendingMobs=0;
  advance(e,9750);assert.throws(()=>e.battle.combat.skill('p0','1'),/hồi/);advance(e,250);assert.equal(e.battle.combat.skill('p0','1').damage,20);assert.equal(p.cooldowns['2'],25000);
  e.setPhase('paused');assert.throws(()=>e.battle.combat.skill('p0','2'));assert.equal(b.elapsedMs,10000);
});
test('03-11/12/14 exact boss windows, late arrival fixes N only for next boss, timeout is not kill',()=>{
  const e=make();e.setPhase('battle');const f=field(e),first=f.activeBoss,hp=first.maxHp;
  e.join(createPlayer('late','Muộn'));assert.equal(first.maxHp,hp);assert.equal(first.spawnParticipants,1);assert.equal(f.participants.late.joinedAt,0);
  for(const p of Object.values(f.participants))p.attackAt=1e9;
  advance(e,90000);assert.equal(first.status,'timeout');assert.equal(first.lastHit,null);assert.equal(f.bossHistory.length,1);
  advance(e,9750);assert.equal(f.bossHistory.length,1);advance(e,250);assert.equal(f.activeBoss.type,1);assert.equal(f.activeBoss.spawnParticipants,2);assert.equal(f.activeBoss.maxHp,Math.round(2*10*90*.85));
  advance(e,90000);assert.equal(f.activeBoss.status,'timeout');advance(e,10000);assert.equal(f.activeBoss.type,2);advance(e,90000);assert.equal(f.activeBoss.status,'timeout');assert.equal(f.bossHistory.length,3);
  e.join(createPlayer('very-late','Rất muộn'));assert.equal(f.bossHistory.length,3);assert.equal(f.participants['very-late'].joinedAt,290000);
});
test('03-13 actual damage cap, single kill credit, invalid damage/cross-field rejected and enrage once',()=>{
  const e=make([0,1]);e.setPhase('battle');const f=field(e),p=f.participants.p0,boss=f.activeBoss;
  boss.hp=3;assert.equal(e.battle.combat.applyDamage(f,p,boss,3),3);assert.equal(boss.hp,0);assert.equal(p.damage,3);assert.equal(boss.status,'dead');assert.equal(boss.lastHit,'p0');assert.equal(e.battle.combat.applyDamage(f,p,boss),0);
  assert.equal(e.battle.combat.applyDamage(f,p,e.battle.current.fields[1].activeBoss),0);assert.equal(p.damage,3);
  for(const attack of [-1,NaN,Infinity])assert.throws(()=>damageFor(attack,1,0));assert.equal(damageFor(10,2,100),10);
  advance(e,200000);const third=f.activeBoss;p.hp=p.maxHp;third.hp=third.maxHp*.3+1;e.battle.combat.applyDamage(f,p,third,2);assert.equal(third.enraged,true);const count=e.events.filter(e=>e.kind==='boss:enraged').length;e.battle.combat.applyDamage(f,p,third);assert.equal(e.events.filter(e=>e.kind==='boss:enraged').length,count);
});
function score(e,values){const f=field(e);f.activeBoss.hp=f.activeBoss.maxHp=100000;for(const [i,n]of values.entries()){const p=f.participants[`p${i}`];p.atk=n;e.battle.combat.applyDamage(f,p,f.activeBoss);}return f;}
test('03-15/16/17 rank rewards 5/4/3/1, gate/pending, exactly once across reload and successful breakthrough',()=>{
  const e=make([0,0,0,0]);e.setPhase('battle');const f=score(e,[40,30,20,10]);assert.deepEqual(ranking(f,0).map(p=>p.userId),['p0','p1','p2','p3']);
  e.setPhase('cultivation');assert.deepEqual(f.results.map(r=>r.stages),[5,4,3,1]);assert.equal(e.getPlayer('p0').realmIndex,0);assert.equal(e.getPlayer('p0').stageIndex,3);assert.equal(e.getPlayer('p0').pendingStageRewards,2);assert.equal(e.getPlayer('p3').inventory.blessing,1);
  const before=e.exportState();e.battle.finish();e.rewards.apply(e.battle.current);assert.deepEqual(e.exportState().players,before.players);
  const disk=JSON.parse(JSON.stringify(before)),restored=new GameEngine(disk.players,{}, {saved:disk,rng:()=>0});restored.setPhase('resume');restored.rewards.apply(restored.battle.current);assert.equal(restored.getPlayer('p0').pendingStageRewards,2);assert.equal(restored.getPlayer('p3').inventory.blessing,1);
  advance(restored,12250);const p=restored.getPlayer('p0');assert.equal(p.realmIndex,1);assert.equal(p.stageIndex,2);assert.equal(p.pendingStageRewards,0);
});
test('Solo/two/zero contributors, deterministic ties and Phi Thang overflow',()=>{
  for(const [n,expected]of [[1,[1]],[2,[5,4]],[4,[5,4,3,1]]]){const e=make(Array(n).fill(0));e.setPhase('battle');const f=score(e,Array(n).fill(10));e.setPhase('cultivation');assert.deepEqual(f.results.map(p=>p.stages),expected);assert.deepEqual(f.results.map(p=>p.userId),Array.from({length:n},(_,i)=>`p${i}`));}
  const zero=make();zero.setPhase('battle');zero.setPhase('cultivation');assert.equal(field(zero).results.length,0);assert.equal(zero.getPlayer('p0').stageIndex,0);
  const e=make([10]);e.setPhase('battle');const f=e.battle.current.fields[10];e.battle.combat.applyDamage(f,f.participants.p0,f.activeBoss);e.setPhase('cultivation');assert.equal(e.getPlayer('p0').realmIndex,10);assert.equal(e.getPlayer('p0').questState.points,10);assert.equal(e.getPlayer('p0').inventory.blessing,1);
});
test('03-19 camera dwell/manual changes never reset simulation; all fields advance',()=>{
  const e=make([0,2,10]);e.setPhase('battle');const b=e.battle.current,initial=b.viewId;advance(e,7750);assert.equal(b.viewId,initial);advance(e,250);assert.notEqual(b.viewId,initial);
  const hp=b.fields.map(f=>f.activeBoss?.hp);e.battle.selectView(10);assert.equal(b.viewId,10);assert.deepEqual(b.fields.map(f=>f.activeBoss?.hp),hp);advance(e,20000);assert.equal(b.viewId,10);assert.ok(b.fields[0].participants.p0.damage>0);assert.ok(b.fields[2].participants.p1.damage>0);assert.ok(b.fields[10].participants.p2.damage>0);
  assert.throws(()=>e.battle.selectView(9));e.battle.selectView('auto');advance(e,8000);assert.notEqual(b.viewId,10);
});
test('Battle configuration, short cycle, restart validation and old schema compatibility',()=>{
  for(const value of [0,-1,NaN,Infinity,3601])assert.throws(()=>battleRulesFor({cycle:{battleSeconds:value}}));assert.throws(()=>battleRulesFor({boss:{spawnWindows:[[0,90],[80,190],[200,290]]}}));
  const e=make([0],{cycle:{cultivationSeconds:10,battleSeconds:15}});e.setPhase('cultivation');advance(e,10000);assert.equal(e.phase,'battle');assert.equal(e.remainingMs,15000);advance(e,15000);assert.equal(e.phase,'cultivation');assert.equal(e.remainingMs,10000);assert.equal(field(e).bossHistory.length,3);
  const disk=JSON.parse(JSON.stringify(e.exportState()));disk.runtime.battle.fields[0].participants.p0.hp=-1;assert.throws(()=>new GameEngine(disk.players,{}, {saved:disk}),/chiến đấu/);
  const legacy=e.exportState();delete legacy.runtime.battle;delete legacy.runtime.battleResult;for(const p of legacy.players){delete p.pendingStageRewards;delete p.pendingExp;delete p.lastBattleRewardId;}const migrated=new GameEngine(legacy.players,{}, {saved:legacy});assert.equal(migrated.getPlayer('p0').pendingStageRewards,0);
});

test('Supplemental solo balance: Pham Nhan can defeat first boss automatically',()=>{
  const e=make();e.setPhase('battle');advance(e,90000);assert.equal(field(e).bossHistory[0].status,'dead');assert.equal(field(e).participants.p0.skillCount,0);
});
test('Boss specials: shockwave hits nearby disciples and Blood General queues Ma Binh',()=>{
  const e=make([0,0]);e.setPhase('battle');const f=field(e),b=e.battle.current;
  for(const p of Object.values(f.participants)){p.x=0;p.z=-3;p.attackAt=1e9;}
  f.mobs=[];f.pendingMobs=0;f.activeBoss.attackAt=1e9;f.activeBoss.specialAt=0;
  advance(e,250);assert.ok(Object.values(f.participants).every(p=>p.hp<p.maxHp));
  b.elapsedMs=100000;e.battle.schedule(f);assert.equal(f.activeBoss.type,1);f.activeBoss.specialAt=0;
  for(const p of Object.values(f.participants))p.hp=p.maxHp;
  advance(e,250);assert.equal(f.pendingMobs,3);assert.equal(f.pendingSummons,3);advance(e,250);assert.equal(f.mobs.length,3);assert.ok(f.mobs.every(m=>m.type===0));assert.equal(f.pendingSummons,0);
});

test('Special IDs are own keys; full inventory defers blessing; demo join cannot interrupt battle',async()=>{
  const e=new GameEngine([createPlayer('__proto__','Đạo hữu')]);e.setPhase('battle');const f=field(e),p=e.getPlayer('__proto__');assert.equal(Object.keys(f.participants).length,1);assert.equal(f.participants.__proto__.userId,'__proto__');
  p.inventory.blessing=100000;e.battle.combat.skill('__proto__','1');e.setPhase('cultivation');assert.equal(p.pendingBlessings,1);assert.equal(p.inventory.blessing,100000);e.items.useItem(p,'blessing');assert.equal(p.pendingBlessings,0);assert.equal(p.inventory.blessing,100000);
  e.setPhase('battle');const id=e.battle.current.id;const {DemoEventSource}=await import('../demoEventSource.js');new DemoEventSource(e).spawn(10);assert.equal(e.phase,'battle');assert.equal(e.battle.current.id,id);assert.equal(field(e).participantIds.length,11);
});
