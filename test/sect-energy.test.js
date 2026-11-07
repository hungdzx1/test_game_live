import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SectEnergy,sectLevelsFor} from '../sectEnergy.js';
import {GameEngine} from '../gameEngine.js';
const like=(count,meta={})=>({source:'demo',loai:'tim',eventId:randomUUID(),userId:'demo:sect-energy',ten:'Đạo hữu',soLuong:count,rawMeta:{streamId:'sect-energy',...meta}});
test('Sect levels use per-level 1000/3000/5000, carry overflow, cap at full level3',()=>{
  const s=new SectEnergy();s.add(999);assert.deepEqual(s.progress,{level:1,power:999});s.add(2);assert.deepEqual(s.progress,{level:2,power:1});
  s.add(2999);assert.deepEqual(s.progress,{level:3,power:0});s.add(4999);assert.equal(s.snapshot().full,false);s.add(1);assert.equal(s.snapshot().full,true);s.add(1000000);assert.deepEqual(s.progress,{level:3,power:5000});
  const burst=new SectEnergy();burst.add(4321);assert.deepEqual(burst.progress,{level:3,power:321});
});
test('Sect energy uses reconciled/deduplicated likes and survives restart without double counting',()=>{
  const e=new GameEngine();const first=like(700,{likeTotal:10700});e.liveEvents.accept(first);e.liveEvents.accept(first);e.liveEvents.accept(like(700,{likeTotal:10700}));
  assert.equal(e.liveEvents.sectEnergy.power,700);e.liveEvents.accept(like(400));assert.deepEqual(e.liveEvents.sectEnergy.progress,{level:2,power:100});
  const saved=JSON.parse(JSON.stringify(e.exportState()));const restored=new GameEngine(saved.players,{}, {saved});restored.liveEvents.accept(like(400,{likeTotal:11100}));
  assert.deepEqual(restored.liveEvents.sectEnergy.progress,{level:2,power:100});restored.liveEvents.accept(like(50,{likeTotal:11150}));assert.equal(restored.liveEvents.sectEnergy.power,150);
  assert.deepEqual(restored.snapshot().payload.interactions.sectEnergy,{level:2,power:150,threshold:3000,maxLevel:3,full:false});
});
test('Legacy saves initialize only new sect energy; invalid new progress is rejected',()=>{
  const e=new GameEngine();e.liveEvents.accept(like(400));const saved=e.exportState();delete saved.runtime.interactions.sectEnergy;
  const oldWish=structuredClone(saved.runtime.interactions.wish);const restored=new GameEngine(saved.players,{}, {saved});assert.deepEqual(restored.liveEvents.sectEnergy.progress,{level:1,power:0});assert.deepEqual(restored.liveEvents.wish,oldWish);
  for(const value of [null,{level:0,power:0},{level:4,power:0},{level:1,power:1000},{level:2,power:-1},{level:3,power:5001}]){const bad=structuredClone(saved);bad.runtime.interactions.sectEnergy=value;assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}),/nguyên lực/);}
});
test('Energy tracks accepted likes in battle/paused and DEMO/LIVE stay separate; no repeating wish rewards',()=>{
  const demo=new GameEngine(),live=new GameEngine();live.mode='live';demo.setPhase('battle');demo.liveEvents.accept(like(1100));assert.deepEqual(demo.liveEvents.sectEnergy.progress,{level:2,power:100});assert.equal(live.liveEvents.sectEnergy.power,0);
  assert.equal(demo.liveEvents.wish.awards,0);assert.equal(demo.liveEvents.wish.power,0);demo.setPhase('paused');demo.liveEvents.accept(like(500));assert.equal(demo.liveEvents.sectEnergy.power,600);assert.equal(demo.liveEvents.wish.awards,0);assert.equal(demo.liveEvents.wish.power,0);
  const p=demo.liveEvents.sectEnergy.power;const malformed=like(2e6);assert.equal(demo.liveEvents.accept(malformed).accepted,false);assert.equal(demo.liveEvents.sectEnergy.power,p);
});

test('Configurable levels carry through six thresholds, award final row once and continue when a new level is appended',()=>{
  const rows=Array.from({length:6},(_,i)=>({level:i+1,likes:10,reward:{item:'tea',quantity:1},scope:'all'})),s=new SectEnergy(rows);
  assert.equal(s.add(45).length,4);assert.deepEqual(s.snapshot(),{level:5,power:5,threshold:10,maxLevel:6,full:false});
  assert.equal(s.add(15).length,2);assert.equal(s.snapshot().full,true);assert.equal(s.add(100).length,0);assert.equal(s.totalLikes,60);
  s.configure([...rows,{level:7,likes:20,reward:{item:'pill',quantity:1},scope:'all'}]);assert.deepEqual(s.progress,{level:7,power:0});assert.equal(s.add(20)[0].reward.item,'pill');assert.equal(s.snapshot().full,true);
});

test('Changing thresholds preserves accepted total and receipts, including lowering then raising thresholds',()=>{
  const s=new SectEnergy();s.add(2500);
  const rows=[1,2,3,4].map(level=>({level,likes:100,reward:{item:'root',quantity:1},scope:'all'}));s.configure(rows);assert.equal(s.totalLikes,2500);assert.equal(s.snapshot().full,true);assert.equal(s.add(10).length,0);
  rows.forEach(r=>r.likes=1000);s.configure(rows);assert.deepEqual(s.progress,{level:3,power:500});assert.equal(s.add(1500).length,0);assert.equal(s.totalLikes,4000);
  const restored=new SectEnergy(rows);restored.restore(s.exportState());assert.equal(restored.add(1000).length,0);assert.deepEqual(restored.exportState(),s.exportState());
});

test('Legacy fixed-level saves migrate against original thresholds and never replay their completed rewards',()=>{
  const rows=[1,2,3,4,5].map(level=>({level,likes:500,reward:{item:'blessing',quantity:1},scope:'all'})),s=new SectEnergy(rows);
  s.restore({level:2,power:1500});assert.equal(s.totalLikes,2500);assert.equal(s.completed.size,5);assert.equal(s.add(1).length,0);
  const full=new SectEnergy();full.restore({level:3,power:5000});assert.equal(full.totalLikes,9000);assert.equal(full.add(1).length,0);
});

test('Level settings reject sparse/invalid rows, unsafe rewards and scopes without mutating caller data',()=>{
  const good=sectLevelsFor();assert.equal(sectLevelsFor(good)[0].reward.item,'blessing');
  for(const value of [[],null,Array(2),Array(51).fill(good[0]),[{...good[0],level:2}],[{...good[0],likes:0}],[{...good[0],likes:1.5}],[{...good[0],scope:'actor'}],[{...good[0],reward:{item:'fake',quantity:1}}],[{...good[0],reward:{item:'tea',quantity:101}}]])assert.throws(()=>sectLevelsFor(value));
  const s=new SectEnergy();for(const raw of [{version:2,totalLikes:-1,completedLevels:[]},{version:2,totalLikes:0,completedLevels:[1,1]},{version:2,totalLikes:0,completedLevels:[51]}])assert.throws(()=>s.restore(raw));
});

test('Existing wish pending points and Ban Phuc survive migration; future likes only award configured levels',()=>{
  const e=new GameEngine();e.join({userId:'old',name:'Cũ'});const saved=e.exportState();saved.runtime.interactions.wish.pendingPoints=[{ids:['old'],points:3}];saved.runtime.interactions.wish.pendingBlessings=2;
  const r=new GameEngine(saved.players,{}, {saved});r.setPhase('battle');r.tick(0);assert.equal(r.getPlayer('old').questState.points,0);r.setPhase('cultivation');r.tick(0);assert.equal(r.getPlayer('old').questState.points,3);assert.equal(r.items.blessingSnapshot().remainingMs,60000);
  r.liveEvents.accept(like(100));assert.equal(r.getPlayer('old').questState.points,3);assert.equal(r.liveEvents.wish.awards,0);
});
