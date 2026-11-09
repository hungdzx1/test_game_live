import test from 'node:test';import assert from 'node:assert/strict';import{randomUUID}from'node:crypto';
import{GameEngine}from'../gameEngine.js';import{createPlayer}from'../playerStore.js';
const advance=(e,ms)=>{for(let left=ms;left>0;left-=250)e.tick(Math.min(250,left));};
const setup=()=>{const e=new GameEngine();e.join(createPlayer('blessed','Đạo Hữu'));e.setPhase('cultivation');return e;};
const gift=(extra={})=>({source:'demo',loai:'qua',eventId:randomUUID(),userId:'blessed',ten:'Đạo Hữu',giftId:'999',qua:'Quà thử',soKimCuong:100,soLuong:1,rawMeta:{streamId:'blessing',giftType:0},...extra});
const likes=count=>({source:'demo',loai:'tim',eventId:randomUUID(),userId:'blessed',ten:'Đạo Hữu',soLuong:count,rawMeta:{streamId:'blessing'}});
test('Ban Phuc refresh extends time by 30s and stays x2; tea/root remain additive',()=>{
  const e=setup(),p=e.getPlayer('blessed');e.items.grantItem(p,'blessing',2);e.items.useItem(p,'blessing');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,4);
  advance(e,10000);assert.equal(p.cultivation,40);e.items.useItem(p,'blessing');assert.deepEqual(e.items.blessingSnapshot(),{remainingMs:50000,durationMs:60000,multiplier:2});assert.equal(e.globalBuffs.length,1);assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,4);
  e.join(createPlayer('new','Mới'));assert.equal(e.items.getEffectiveStats(e.getPlayer('new')).cultivationPerSecond,4);
  e.items.grantItem(p,'tea');e.items.useItem(p,'tea');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,8);
  e.items.grantItem(p,'root');e.items.useItem(p,'root');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,14);
});
test('Sect promotion gives 30s per actual level, reconciled likes and MAX do not repeat blessing',()=>{
  const e=setup(),raw=likes(1000);e.liveEvents.accept(raw);e.liveEvents.accept(raw);assert.equal(e.items.blessingSnapshot().remainingMs,30000);
  e.liveEvents.accept(likes(3000));assert.equal(e.items.blessingSnapshot().remainingMs,60000);e.liveEvents.accept(likes(5000));e.liveEvents.accept(likes(9999));assert.equal(e.items.blessingSnapshot().remainingMs,60000);
  const burst=setup();burst.liveEvents.accept(likes(9000));assert.equal(burst.items.blessingSnapshot().remainingMs,60000);assert.equal(burst.items.getEffectiveStats(burst.getPlayer('blessed')).cultivationPerSecond,4);
  const saved=burst.exportState(),restored=new GameEngine(saved.players,{}, {saved});assert.equal(restored.items.blessingSnapshot().remainingMs,60000);restored.liveEvents.accept(likes(1));assert.equal(restored.items.blessingSnapshot().remainingMs,60000);
});
test('Mapped gift combos extend once at final count; before-join and battle gifts retain existing pending flow',()=>{
  const e=setup(),meta={streamId:'blessing',giftType:1,comboId:'batch',repeatEnd:false};
  e.liveEvents.accept(gift({soLuong:1,rawMeta:meta}));e.liveEvents.accept(gift({soLuong:3,rawMeta:meta}));assert.equal(e.globalBuffs.length,0);
  const final=gift({soLuong:3,rawMeta:{...meta,repeatEnd:true}});e.liveEvents.accept(final);e.liveEvents.accept(final);e.liveEvents.accept(gift({soLuong:3,rawMeta:{...meta,repeatEnd:true}}));assert.equal(e.items.blessingSnapshot().remainingMs,90000);assert.equal(e.globalBuffs.length,1);
  e.setPhase('battle');e.liveEvents.accept(gift());assert.equal(e.getPlayer('blessed').inventory.blessing,0);assert.equal(e.items.blessingSnapshot().remainingMs,120000);e.setPhase('cultivation');assert.equal(e.items.blessingSnapshot().remainingMs,120000);
  const guest=gift({userId:'not-joined'});e.liveEvents.accept(guest);assert.equal(e.items.blessingSnapshot().remainingMs,120000);e.join(createPlayer('not-joined','Khách'));e.liveEvents.deliver('not-joined');e.liveEvents.flush();assert.equal(e.items.blessingSnapshot().remainingMs,150000);
});
test('Countdown freezes in battle/pause/stopped, expires exactly, and restart has no offline gain',()=>{
  const e=setup();e.items.activateBlessing();advance(e,29999);assert.equal(e.items.blessingSnapshot().remainingMs,1);
  for(const phase of ['battle','paused','stopped']){e.setPhase(phase);advance(e,10000);assert.equal(e.items.blessingSnapshot().remainingMs,1);}
  const saved=e.exportState(),restored=new GameEngine(saved.players,{}, {saved});assert.equal(restored.items.blessingSnapshot().remainingMs,1);restored.setPhase('cultivation');restored.tick(2);assert.deepEqual(restored.items.blessingSnapshot(),{remainingMs:0,durationMs:0,multiplier:2});assert.equal(restored.globalBuffs.length,0);
});
test('Legacy parallel Ban Phuc merges remaining time without losing players; malformed extension refuses restore',()=>{
  const e=setup(),saved=e.exportState();saved.runtime.globalBuffs=[{kind:'blessing',multiplier:2,remainingMs:10000},{kind:'blessing',multiplier:2,remainingMs:20000}];
  const restored=new GameEngine(saved.players,{}, {saved});assert.equal(restored.players.size,1);assert.deepEqual(restored.items.blessingSnapshot(),{remainingMs:30000,durationMs:30000,multiplier:2});assert.equal(restored.globalBuffs.length,1);
  for(const durationMs of [null,-1,'30000',NaN,Infinity,9999]){const bad=structuredClone(saved);bad.runtime.globalBuffs[0].durationMs=durationMs;assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}),/Ban Phúc/);}
});
test('Sect gifts and level blessings in separate DEMO/LIVE engines have independent timers',()=>{
  const demo=setup(),live=setup();live.mode='live';demo.liveEvents.accept(gift());live.liveEvents.accept(likes(9000));advance(demo,1000);assert.equal(demo.items.blessingSnapshot().remainingMs,29000);assert.equal(live.items.blessingSnapshot().remainingMs,60000);
});
