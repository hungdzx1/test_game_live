import test from 'node:test';import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const make=()=>new GameEngine([createPlayer('p','Đạo hữu')]);
const field=e=>e.battle.current.fields[0];
const advance=(e,ms)=>{while(ms>0){const dt=Math.min(250,ms);e.tick(dt);ms-=dt;}};
test('TB02 warning gates direct damage and skills without consuming cooldowns, timer, HP or buffs',()=>{
 const e=make();e.setPhase('battle');const f=field(e),p=f.participants.p,boss=f.activeBoss;e.getPlayer('p').buffs.push({kind:'tea',multiplier:2,remainingMs:60000});
 assert.equal(e.remainingMs,3000);assert.equal(e.battle.applyDamage(f,p,boss,100),0);assert.throws(()=>e.battle.skill('p','1','early'),/cảnh báo/);
 advance(e,2999);assert.equal(boss.hp,boss.maxHp);assert.equal(boss.elapsedMs,0);assert.equal(e.battle.current.elapsedMs,0);assert.equal(p.skillCount,0);assert.equal(p.cooldowns['1'],0);assert.equal(e.getPlayer('p').buffs[0].remainingMs,60000);
 assert.equal(e.snapshot().payload.battle.bossWarningRemainingMs,1);assert.equal(e.snapshot().payload.battle.bossRemainingMs,0);
 advance(e,1);assert.equal(e.remainingMs,0);assert.equal(e.battle.warningRemainingMs,0);assert.equal(boss.hp,boss.maxHp);assert.equal(e.battle.skill('p','1','early').damage,20);
 advance(e,1000);assert.equal(boss.hp,boss.maxHp-30);assert.equal(boss.elapsedMs,1000);
});
test('TB02 each new round gets its own warning; lethal volley ends the only boss without a hidden successor',()=>{
 const e=make();e.join(createPlayer('q','Khác'));e.setPhase('battle');const f=field(e);advance(e,3000);f.participants.p.atk=1e9;f.participants.q.atk=1e9;
 const first=f.activeBoss.type;advance(e,1000);assert.equal(e.phase,'cultivation');assert.equal(f.bossHistory.length,1);assert.equal(f.participants.q.damage,0);
 e.setPhase('battle');assert.notEqual(field(e).activeBoss.type,first);assert.equal(e.remainingMs,3000);assert.equal(e.battle.applyDamage(field(e),field(e).participants.p,field(e).activeBoss),0);advance(e,3000);assert.equal(e.battle.warningRemainingMs,0);assert.equal(field(e).activeBoss.hp,field(e).activeBoss.maxHp);
});
test('TB02 pause/stop and restart keep exact fractional warning progress without replay or rewards',()=>{
 const e=make();e.setPhase('battle');advance(e,1234.5);e.setPhase('paused');const before=JSON.stringify(e.exportState());advance(e,30000);assert.equal(JSON.stringify(e.exportState()),before);
 const saved=JSON.parse(before),r=new GameEngine(saved.players,{}, {saved});assert.equal(r.phase,'stopped');assert.equal(r.battle.warningRemainingMs,1765.5);r.setPhase('resume');advance(r,1765.5);assert.equal(r.remainingMs,0);assert.equal(field(r).activeBoss.hp,field(r).activeBoss.maxHp);assert.equal(r.globalBuffs.length,0);
});
test('TB02 old shared-boss saves continue immediately; malformed partial warning clocks are rejected',()=>{
 const e=make();e.setPhase('battle');const save=e.exportState(),boss=save.runtime.battle.fields[0].bossHistory[0];delete boss.warningDurationMs;delete boss.warningElapsedMs;delete save.runtime.battle.fields[0].activeBoss.warningDurationMs;delete save.runtime.battle.fields[0].activeBoss.warningElapsedMs;save.runtime.remainingMs=300000;
 const r=new GameEngine(save.players,{}, {saved:save});r.setPhase('resume');assert.equal(r.battle.warningRemainingMs,0);assert.equal(r.battle.skill('p','1').damage,20);
 for(const values of [{warningDurationMs:3000},{warningDurationMs:3000,warningElapsedMs:-1},{warningDurationMs:3000,warningElapsedMs:3001},{warningDurationMs:1,warningElapsedMs:0}]){const bad=structuredClone(save);Object.assign(bad.runtime.battle.fields[0].bossHistory[0],values);assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}));}
});
