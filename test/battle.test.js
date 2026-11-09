import test from 'node:test';import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
import {BOSS_DEFAULTS,BOSS_REWARD} from '../bossConfig.js';import {battleRulesFor} from '../battleConfig.js';
import {BattleService as LegacyBattleService} from '../battleService.js';import {CommandRouter} from '../commandRouter.js';
const make=(n=1,config={})=>{const e=new GameEngine(Array.from({length:n},(_,i)=>createPlayer('p'+i,'Đạo hữu '+i,i)),config);e.battle.rng=()=>0;return e;};
export const advance=(e,ms)=>{while(ms>0){const step=Math.min(ms,250);e.tick(step);ms-=step;}};
const field=e=>e.battle.current.fields[0];
const reveal=e=>advance(e,e.battle.warningRemainingMs);
const kill=e=>{reveal(e);field(e).participants.p0.atk=1e15;e.battle.skill('p0','1',crypto.randomUUID());};
const reload=e=>{const saved=JSON.parse(JSON.stringify(e.exportState()));return new GameEngine(saved.players,{}, {saved});};

test('Adaptive boss: one arena/one random boss, fixed HP snapshot, no deadline and reward3/2',()=>{
 const e=make(3);e.setPhase('battle');reveal(e);const b=e.battle.current,f=field(e);assert.equal(b.endOnKill,true);assert.equal(b.durationMs,0);assert.equal(b.fields.length,1);assert.equal(f.bossHistory.length,1);assert.equal(f.activeBoss.maxHp,7776);assert.deepEqual(f.activeBoss.reward,BOSS_REWARD);assert.equal(e.remainingMs,0);
 const hp=f.activeBoss.maxHp;e.join({...createPlayer('late','Mới'),realmIndex:10});assert.equal(f.activeBoss.maxHp,hp);assert.equal(f.participantIds.length,4);assert.equal(f.mobs.length,0);assert.throws(()=>e.battle.selectView(1));
});
test('Adaptive boss: uniform conditional draws exclude previous type and survive restart',()=>{
 const e=make();let seed=72;const counts=[0,0,0];e.battle.rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};let last=null;
 for(let i=0;i<120;i++){e.setPhase('battle');const index=e.battle.current.bossIndex;assert.notEqual(index,last);counts[index]++;last=index;kill(e);assert.equal(e.phase,'cultivation');}
 assert.ok(counts.every(n=>n>25&&n<55));const r=reload(e);r.battle.rng=()=>0;r.setPhase('battle');assert.notEqual(r.battle.current.bossIndex,last);
});
test('Adaptive boss: 600s cultivation, no-player fight stays open beyond former15-minute cycle',()=>{
 const e=make(0);e.setPhase('cultivation');advance(e,600000);assert.equal(e.phase,'battle');advance(e,1000000);assert.equal(e.phase,'battle');assert.equal(field(e).bossHistory.length,1);assert.equal(field(e).activeBoss.status,'alive');assert.equal(e.globalBuffs.length,0);assert.equal(e.battle.finish(),false);e.battle.completeBoss('timeout');assert.equal(e.phase,'battle');
});
test('Adaptive boss: auto only lasts around4min, cooldown skills can shorten it without hard HP lock',()=>{
 const auto=make();auto.setPhase('battle');reveal(auto);advance(auto,180000);assert.equal(auto.phase,'battle');advance(auto,79000);assert.equal(auto.phase,'battle');advance(auto,1000);assert.equal(auto.phase,'cultivation');assert.equal(field(auto).activeBoss.elapsedMs,260000);
 const skilled=make();skilled.setPhase('battle');reveal(skilled);while(skilled.phase==='battle'){const b=skilled.battle.current,p=field(skilled).participants.p0;for(const key of ['1','2'])if(skilled.phase==='battle'&&b.elapsedMs>=p.cooldowns[key])skilled.battle.skill('p0',key,crypto.randomUUID());if(skilled.phase==='battle')advance(skilled,250);}
 assert.ok(field(skilled).activeBoss.elapsedMs>180000&&field(skilled).activeBoss.elapsedMs<250000);assert.ok(skilled.battle.balance.skillUse>.25);
});
test('Adaptive boss: learns previous skill use, scaling follows current ATK rather than old raw damage',()=>{
 const e=make();e.setPhase('battle');const first=field(e).activeBoss.maxHp;reveal(e);advance(e,260000);assert.equal(e.battle.balance.observations,1);assert.equal(e.battle.balance.skillUse,.125);e.setPhase('battle');assert.ok(field(e).activeBoss.maxHp<first);
 const old=field(e).activeBoss.maxHp;e.getPlayer('p0').realmIndex=5;kill(e);e.setPhase('battle');assert.ok(field(e).activeBoss.maxHp>old);const r=reload(e);assert.deepEqual(r.battle.balance,e.battle.balance);assert.deepEqual(r.battle.current.scaling,e.battle.current.scaling);
});
test('Adaptive boss: automatic ATK/skills unchanged, pause freezes HP, clock, EXP and buffs',()=>{
 const e=make(2);e.setPhase('battle');reveal(e);const f=field(e),max=f.activeBoss.maxHp,router=new CommandRouter(e),input={eventId:'skill',userId:'p0',text:'1'};
 router.handle(input);router.handle(input);assert.equal(f.activeBoss.hp,max-20);assert.throws(()=>router.handle({...input,eventId:'again'}));router.handle({eventId:'s2',userId:'p0',text:'2'});assert.equal(f.participants.p0.damage,50);
 e.getPlayer('p0').buffs.push({kind:'tea',multiplier:2,remainingMs:30000});advance(e,1000);assert.equal(f.activeBoss.hp,max-70);const hp=f.participants.p0.hp;e.setPhase('paused');const before=e.exportState();advance(e,20000);assert.deepEqual(e.exportState(),before);assert.equal(f.participants.p0.hp,hp);assert.equal(e.getPlayer('p0').cultivation,0);
 const r=reload(e);assert.equal(field(r).activeBoss.hp,max-70);r.setPhase('resume');new CommandRouter(r).handle(input);assert.equal(field(r).participants.p0.skillCount,2);assert.equal(r.getPlayer('p0').buffs[0].remainingMs,30000);
});
test('Adaptive boss: kill immediately returns to cultivation, caps damage, rewards everyone exactly once',()=>{
 const e=make(2);e.setPhase('battle');reveal(e);e.join(createPlayer('late','Đến trước hạ'));const f=field(e),boss=f.activeBoss;boss.hp=3;
 assert.equal(e.battle.applyDamage(f,f.participants.p0,boss,3,'1'),3);advance(e,1);assert.equal(e.phase,'cultivation');assert.equal(f.bossHistory.length,1);assert.equal(e.battle.applyDamage(f,f.participants.p0,boss),0);assert.ok([...e.players.values()].every(p=>p.inventory.pill===2&&p.pendingStageRewards===0&&p.inventory.blessing===0));assert.equal(f.participants.late.damage,0);assert.equal(e.items.blessingSnapshot().durationMs,90000);
 e.join(createPlayer('after','Đến sau'));assert.equal(e.getPlayer('after').inventory.pill,0);const before=e.exportState();e.battle.finish();e.battle.award(boss);e.rewards.apply(e.battle.current);assert.deepEqual(e.exportState(),before);const r=reload(e);assert.equal(r.getPlayer('p0').inventory.pill,2);assert.equal(r.items.blessingSnapshot().durationMs,90000);
});
test('Adaptive boss: full inventory queues both pills durably and drains later without duplication',()=>{
 const e=make();e.getPlayer('p0').inventory.pill=100000;e.setPhase('battle');kill(e);assert.equal(e.battle.pendingPills.p0,2);const r=reload(e);r.setPhase('resume');r.getPlayer('p0').inventory.pill-=1;r.battle.drainPills(r.getPlayer('p0'));assert.equal(r.getPlayer('p0').inventory.pill,100000);assert.equal(r.battle.pendingPills.p0,1);r.getPlayer('p0').inventory.pill-=1;r.battle.drainPills(r.getPlayer('p0'));assert.equal(r.battle.pendingPills.p0,undefined);
});
test('Adaptive boss: target validation, active settings frozen, next round applies new target',()=>{
 const e=make();e.setPhase('battle');const old=field(e).activeBoss.maxHp;e.battleRules=battleRulesFor({boss:{targetSeconds:300}});assert.equal(field(e).activeBoss.maxHp,old);kill(e);e.setPhase('battle');assert.equal(field(e).activeBoss.maxHp,3240);
 for(const targetSeconds of [0,180,240.5,3601,null,'240',Infinity])assert.throws(()=>battleRulesFor({boss:{targetSeconds}}));assert.equal(battleRulesFor().boss.targetSeconds,240);
});
export function oldSharedSave(){
 const e=make();e.setPhase('battle');const saved=JSON.parse(JSON.stringify(e.exportState())),b=saved.runtime.battle,boss=b.fields[0].bossHistory[0];delete b.endOnKill;delete b.selectionMode;delete b.scaling;delete saved.runtime.bossBalance;b.durationMs=900000;b.elapsedMs=12.5;boss.hp=9990;boss.maxHp=10000;boss.durationMs=300000;boss.elapsedMs=12.5;boss.warningElapsedMs=3000;boss.reward=structuredClone(BOSS_DEFAULTS[0].reward);delete boss.endOnKill;b.fields[0].activeBoss=structuredClone(boss);saved.runtime.remainingMs=299987.5;return saved;
}
test('Adaptive boss: old shared save keeps HP/progress; removes deadline and queued bosses without re-awarding',()=>{
 const saved=oldSharedSave(),bytes=JSON.stringify(saved),r=new GameEngine(saved.players,{}, {saved});assert.equal(JSON.stringify(saved),bytes);assert.equal(field(r).activeBoss.hp,9990);assert.equal(field(r).activeBoss.elapsedMs,12.5);assert.equal(r.battle.current.endOnKill,true);assert.equal(r.remainingMs,0);assert.deepEqual(field(r).activeBoss.reward,BOSS_REWARD);assert.equal(r.getPlayer('p0').inventory.pill,0);r.setPhase('resume');kill(r);assert.equal(r.phase,'cultivation');assert.equal(field(r).bossHistory.length,1);assert.equal(reload(r).getPlayer('p0').inventory.pill,2);
});
test('Adaptive boss: corrupt HP/calibration/rewards/history/balance or recipients are rejected',()=>{
 const e=make();e.setPhase('battle');const saved=JSON.parse(JSON.stringify(e.exportState()));
 for(const mutate of [s=>s.runtime.battle.fields[0].bossHistory[0].hp=-1,s=>s.runtime.battle.fields[0].bossHistory[0].rewarded=true,s=>s.runtime.battle.scaling.hp++,s=>s.runtime.battle.fields[0].bossHistory[0].durationMs=100,s=>s.runtime.bossBalance.skillUse=2,s=>s.runtime.bossPendingPills.unknown=1]){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}));}
});
test('Adaptive boss: legacy eleven arenas remain archived with earned rewards intact',()=>{
 const e=make(2);e.battle=new LegacyBattleService(e);e.phase=e.previousPhase='battle';e.battle.start();e.getPlayer('p0').pendingStageRewards=2;e.getPlayer('p1').inventory.pill=17;const saved=JSON.parse(JSON.stringify(e.exportState())),r=new GameEngine(saved.players,{}, {saved});assert.equal(r.battle.current,null);assert.equal(r.battle.legacy.fields.length,11);assert.equal(r.previousPhase,'cultivation');assert.equal(r.getPlayer('p1').inventory.pill,17);r.setPhase('resume');assert.equal(r.getPlayer('p0').stageIndex,2);assert.equal(reload(r).battle.legacy.id,saved.runtime.battle.id);
});
test('Adaptive boss: special user IDs, late DEMO joins and500 disciples preserve HP and reward contracts',async()=>{
 const e=new GameEngine([createPlayer('__proto__','Đạo hữu')]);e.setPhase('battle');const boss=field(e).activeBoss,max=boss.maxHp,id=e.battle.current.id;const {DemoEventSource}=await import('../demoEventSource.js');new DemoEventSource(e).spawn(10);assert.equal(e.battle.current.id,id);assert.equal(boss.maxHp,max);assert.equal(field(e).participants.__proto__.userId,'__proto__');
 const many=make(500);many.setPhase('battle');assert.equal(field(many).activeBoss.maxHp,1296000);kill(many);assert.ok([...many.players.values()].every(p=>p.inventory.pill===2));assert.equal(many.items.blessingSnapshot().durationMs,90000);
});
