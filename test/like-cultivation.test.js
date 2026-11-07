import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {DEFAULT_RULES,rulesFor} from '../cultivationConfig.js';

let serial=0;
function setup(){
  const e=new GameEngine();for(const id of ['a','b']){const p=createPlayer(id,id);p.realmIndex=10;e.join(p);}
  e.setPhase('cultivation');let now=10000;e.liveEvents.now=()=>now;
  return {e,p:e.getPlayer('a'),q:e.getPlayer('b'),time:t=>{now=t;}};
}
const likes=(count,extra={})=>({source:'demo',loai:'tim',eventId:`hearts-${++serial}`,userId:'a',ten:'A',soLuong:count,rawMeta:{streamId:'room'},...extra});
function send(e,count,extra){const result=e.liveEvents.accept(likes(count,extra));assert.equal(result.accepted,true,JSON.stringify(result));}

test('Tu vi part 1: all 11 realms use 2/s; old settings keep stats/thresholds but cannot restore old rates',()=>{
  const old=structuredClone(DEFAULT_RULES);old.realms.forEach((r,i)=>r.rate=i+1);old.realms[3].hp=777;
  const expected=structuredClone(old);expected.realms.forEach(r=>r.rate=2);assert.deepEqual(rulesFor(old),expected);
  for(let i=0;i<11;i++){
    const {e,p}=setup();p.realmIndex=i;for(let n=0;n<4;n++)e.tick(250);
    assert.equal(p.cultivation,2,`realm ${i}`);assert.equal(e.snapshot().payload.players[0].cultivationPerSecond,2);
  }
  assert.deepEqual(old.realms.map(r=>r.rate),Array.from({length:11},(_,i)=>i+1));
});

test('Tu vi part 1: sect energy is immediate; personal streak settles at exactly 100 or 1s idle per user',()=>{
  const {e,p,q,time}=setup();send(e,99);assert.equal(e.liveEvents.sectEnergy.power,99);assert.equal(p.cultivation,0);
  time(10999);e.tick(0);assert.equal(p.cultivation,0);send(e,7,{userId:'b'});
  time(11000);e.tick(0);assert.equal(p.cultivation,198);assert.equal(q.cultivation,0);
  time(11999);e.tick(0);assert.equal(q.cultivation,14);
  send(e,100);assert.equal(p.cultivation,398);assert.equal(e.liveEvents.likeCultivation.streaks.size,0);
  send(e,80);time(12500);send(e,30);assert.equal(p.cultivation,598);
  time(13499);e.tick(0);assert.equal(p.cultivation,598);time(13500);e.tick(0);assert.equal(p.cultivation,618);
});

test('Tu vi part 1: new streak after idle, zero counts and duplicate receipts do not extend the timer',()=>{
  const {e,p,time}=setup();const raw=likes(10);assert.equal(e.liveEvents.accept(raw).accepted,true);
  time(10999);assert.equal(e.liveEvents.accept(raw).duplicate,true);send(e,0);
  time(11000);send(e,5);assert.equal(p.cultivation,20);
  time(12000);e.tick(0);assert.equal(p.cultivation,30);assert.equal(e.liveEvents.sectEnergy.power,15);
});

test('Tu vi part 1: tea, blessing, root and cap affect seconds and hearts consistently; capture buffs at receipt',()=>{
  for(const items of [[],['tea'],['blessing'],['root'],['tea','blessing'],['tea','blessing','root'],['tea','tea','blessing','root','tea']]){
    const {e,p,time}=setup();for(const item of items){e.items.grantItem(p,item);e.items.useItem(p,item);}
    const rate=items.length?2*Math.min(8,items.length*2):2;
    assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,rate);
    send(e,10);e.tick(250);assert.equal(p.cultivation,rate*.25);
    p.buffs=[];e.globalBuffs=[];p.spiritualRootMultiplier=1;
    time(11000);e.tick(0);assert.equal(p.cultivation,rate*10+rate*.25);
  }
  const {e,p,time}=setup();send(e,50);e.items.grantItem(p,'tea');e.items.useItem(p,'tea');send(e,50);
  assert.equal(p.cultivation,300);time(12000);e.tick(0);assert.equal(p.cultivation,300);
});

test('Tu vi part 1: battle/pause/stopped retain personal EXP until cultivation and never multiply it twice',()=>{
  for(const phase of ['battle','paused','stopped']){
    const {e,p,time}=setup();e.items.grantItem(p,'tea');e.items.useItem(p,'tea');e.setPhase(phase);
    send(e,101);assert.equal(e.liveEvents.sectEnergy.power,101);assert.equal(p.cultivation,0);assert.equal(p.pendingExp,400);
    time(11000);e.tick(250);assert.equal(p.pendingExp,404);assert.equal(p.cultivation,0);assert.equal(p.buffs[0].remainingMs,30000);
    e.setPhase('cultivation');assert.equal(p.pendingExp,0);assert.equal(p.cultivation,404);e.liveEvents.tick();assert.equal(p.cultivation,404);
  }
});

test('Tu vi part 1: large counts, 100 single events and auto stage/ceremony queue retain all earned EXP',()=>{
  const {e,p,time}=setup();send(e,999999);assert.equal(p.cultivation,1999800);
  time(11000);e.tick(0);assert.equal(p.cultivation,1999998);
  const singles=setup();for(let i=0;i<100;i++)send(singles.e,1);assert.equal(singles.p.cultivation,200);assert.equal(singles.e.liveEvents.counters.rejected,0);
  const low=setup();low.p.realmIndex=0;send(low.e,250);assert.equal(low.p.stageIndex,2);assert.equal(low.p.cultivation,150);
  low.time(11000);low.e.tick(0);assert.equal(low.p.stageIndex,3);assert.equal(low.p.cultivation,50);assert.deepEqual(low.e.breakthrough.queue,['a']);
});

test('Tu vi part 1: room totals/replay reconciliation cannot assign other viewers hearts to a character',()=>{
  const {e,p,time}=setup();send(e,5,{rawMeta:{streamId:'room',likeTotal:5}});
  send(e,10,{rawMeta:{streamId:'room',likeTotal:205}});assert.equal(e.liveEvents.sectEnergy.power,205);
  send(e,10,{rawMeta:{streamId:'room',likeTotal:205}});send(e,5);send(e,5,{rawMeta:{streamId:'room',likeTotal:210}});
  time(11000);e.tick(0);assert.equal(p.cultivation,40);assert.equal(e.liveEvents.sectEnergy.power,210);
  send(e,10,{userId:'guest'});assert.equal(e.players.size,2);assert.equal(e.liveEvents.likeCultivation.streaks.has('guest'),false);assert.equal(e.liveEvents.sectEnergy.power,220);
});

test('Tu vi part 1: promotion reward starts after the triggering hearts and only affects subsequent hearts',()=>{
  const {e,p,time}=setup();send(e,1000);assert.equal(p.cultivation,2000);assert.equal(e.items.blessingSnapshot().remainingMs,30000);
  send(e,1);time(11000);e.tick(0);assert.equal(p.cultivation,2004);
});

test('Tu vi part 1: persisted remainder restores exactly once, no offline passive EXP, independent modes and legacy saves',()=>{
  const {e,p,time}=setup();send(e,150);assert.equal(p.cultivation,200);const saved=e.exportState();
  const restored=new GameEngine(saved.players,{}, {saved});restored.liveEvents.now=()=>11000;
  restored.tick(0);assert.equal(restored.getPlayer('a').cultivation,200);assert.equal(restored.getPlayer('a').pendingExp,100);
  assert.equal(restored.liveEvents.sectEnergy.power,150);restored.setPhase('cultivation');assert.equal(restored.getPlayer('a').cultivation,300);restored.tick(0);assert.equal(restored.getPlayer('a').cultivation,300);
  const live=setup();live.e.mode='live';live.time(11000);live.e.tick(0);assert.equal(live.p.cultivation,0);
  delete saved.runtime.interactions.likeStreaks;const old=new GameEngine(saved.players,{}, {saved});assert.equal(old.liveEvents.likeCultivation.streaks.size,0);
  time(11000);e.tick(0);assert.equal(p.cultivation,300);
});

test('Tu vi part 1: invalid persisted streaks refuse restore; rejected heart input leaves cultivation and energy untouched',()=>{
  const {e}=setup();send(e,1);const saved=e.exportState();
  for(const patch of [{count:100},{count:-1},{amount:-1},{amount:201},{lastAt:NaN},{lastAt:-1}]){
    const bad=structuredClone(saved);Object.assign(bad.runtime.interactions.likeStreaks[0][1],patch);
    assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}),/Chuỗi tim/);
  }
  for(const count of [-1,1.1,1000001])assert.equal(e.liveEvents.accept(likes(count)).accepted,false);
  assert.equal(e.getPlayer('a').cultivation,0);assert.equal(e.liveEvents.sectEnergy.power,1);
  send(e,1,{rawMeta:{streamId:'room',likeTotal:1}});const before=e.liveEvents.exportState();
  assert.equal(e.liveEvents.accept(likes(1,{rawMeta:{streamId:'room',likeTotal:1000002}})).accepted,false);
  assert.deepEqual([...e.liveEvents.likeTotals],before.likeTotals);assert.deepEqual([...e.liveEvents.likeDeltas],before.likeDeltas);
  assert.deepEqual(e.liveEvents.likeCultivation.exportState(),before.likeStreaks);
});
