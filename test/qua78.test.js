import test from 'node:test';import assert from 'node:assert/strict';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';import {probabilityFor} from '../breakthroughService.js';
const make=()=>new GameEngine([createPlayer('p','Tu sĩ')],{}, {rng:()=>0});
const reload=e=>{const saved=JSON.parse(JSON.stringify(e.exportState()));return new GameEngine(saved.players,e.config,{saved});};
test('Qua7 new tea/root/blessings activate immediately in all phases; existing inventory and clocks stay intact',()=>{
 for(const phase of ['cultivation','battle','paused','stopped']){const e=make(),p=e.getPlayer('p');p.inventory.tea=7;p.inventory.root=3;p.inventory.blessing=4;e.setPhase(phase);
  for(const item of ['tea','root','blessing'])e.items.receiveItem(p,item,1,'viewer_gift');
  assert.deepEqual([p.inventory.tea,p.inventory.root,p.inventory.blessing],[7,3,4]);assert.equal(p.buffs[0].remainingMs,60000);assert.equal(p.spiritualRootMultiplier,3);assert.equal(e.items.blessingSnapshot().remainingMs,30000);
  if(phase!=='cultivation'){e.tick(250);assert.equal(p.buffs[0].remainingMs,60000);assert.equal(e.items.blessingSnapshot().remainingMs,30000);}
  e.items.receiveItem(p,'root',2);assert.equal(p.inventory.root,5);
 }
});
test('Qua7 pills remain in inventory until a ceremony; minimal useful amount matches every realm and protection',()=>{
 for(let realm=0;realm<10;realm++)for(const protection of [0,8,24]){
  const e=make(),p=e.getPlayer('p');p.realmIndex=realm;p.stageIndex=3;p.breakthrough.protectionPoints=protection;e.items.receiveItem(p,'pill',20);assert.equal(p.inventory.pill,20);assert.equal(p.breakthrough.pillCount,0);
  let needed=0,last=probabilityFor(p,e.rules);for(let n=1;n<=e.rules.maxPills;n++){p.breakthrough.pillCount=n;const chance=probabilityFor(p,e.rules);if(chance<=last)break;needed=n;last=chance;}p.breakthrough.pillCount=0;
  e.setPhase('cultivation');e.breakthrough.enqueue(p);e.tick(1);assert.equal(e.breakthrough.active.usedPills,needed);assert.equal(p.inventory.pill,20-needed);assert.equal(e.breakthrough.active.probability,last);assert.throws(()=>e.items.useItem(p,'pill'));assert.equal(p.breakthrough.pillCount,0);
  const r=reload(e);assert.equal(r.getPlayer('p').inventory.pill,20-needed);assert.equal(r.breakthrough.active.usedPills,needed);
 }
});
test('Qua7 prepared old pills, guaranteed fate, max realm and invalid RNG preserve remaining inventory',()=>{
 const e=make(),p=e.getPlayer('p');p.inventory.pill=8;p.breakthrough.pillCount=1;p.stageIndex=3;e.setPhase('cultivation');e.breakthrough.enqueue(p);e.tick(1);assert.equal(e.breakthrough.active.usedPills,0);assert.equal(e.breakthrough.active.preparedPills,1);assert.equal(p.inventory.pill,8);
 for(const realm of [0,10]){const g=make(),q=g.getPlayer('p');q.realmIndex=realm;q.stageIndex=realm===10?0:3;q.inventory.pill=8;q.breakthrough.heavenlyFate=5;g.setPhase('cultivation');g.breakthrough.enqueue(q);g.tick(0);assert.equal(q.inventory.pill,8);}
 const bad=make(),q=bad.getPlayer('p');q.stageIndex=3;q.inventory.pill=8;bad.breakthrough.rng=()=>NaN;bad.setPhase('cultivation');bad.breakthrough.enqueue(q);assert.throws(()=>bad.tick(1));assert.equal(q.inventory.pill,8);assert.equal(q.breakthrough.pillCount,0);
});
test('Qua7 saturated tea effects retain pending new gifts across restart without consuming old stock',()=>{
 const e=make(),p=e.getPlayer('p');p.inventory.tea=7;p.buffs=Array.from({length:100},()=>({kind:'tea',multiplier:2,remainingMs:1}));e.items.receiveItem(p,'tea',2);assert.equal(p.inventory.tea,9);assert.equal(e.liveEvents.activations.get('p').tea,2);
 const r=reload(e);r.setPhase('cultivation');r.tick(2);r.liveEvents.flush();assert.equal(r.getPlayer('p').inventory.tea,7);assert.equal(r.getPlayer('p').buffs.length,2);
});
test('Qua8 receipt scope survives full inbox and restart, personal and whole-sect gifts remain distinct',()=>{
 const config={sectLevels:[{level:1,likes:1,reward:{item:'pill',quantity:2},scope:'all'}]},e=new GameEngine([createPlayer('p','Tu sĩ')],config);const p=e.getPlayer('p');p.inventory.pill=100000;
 e.liveEvents.accept({source:'demo',loai:'tim',eventId:'all-award',userId:'p',ten:'Tu sĩ',soLuong:1,rawMeta:{streamId:'scope'}});const pending=e.liveEvents.inbox.get('p');assert.equal(pending.allItems.pill,2);assert.equal(pending.items.pill,2);
 const r=reload(e);r.getPlayer('p').inventory.pill=99998;r.setPhase('cultivation');r.liveEvents.flush();assert.equal(r.getPlayer('p').inventory.pill,100000);assert.equal(r.events.findLast(v=>v.kind==='item:received').scope,'all');
 r.items.receiveItem(r.getPlayer('p'),'tea');assert.equal(r.events.findLast(v=>v.kind==='item:received').scope,'personal');
 const invalid=e.exportState();invalid.runtime.interactions.inbox[0][1].allItems.pill=3;assert.throws(()=>new GameEngine(invalid.players,config,{saved:invalid}));
 const c=new GameEngine([createPlayer('p','Tu sĩ')],{sectLevels:[{level:1,likes:1,reward:{item:'camera',quantity:2},scope:'all'}]});c.setPhase('cultivation');c.liveEvents.accept({source:'demo',loai:'tim',eventId:'camera-all',userId:'p',ten:'Tu sĩ',soLuong:1,rawMeta:{streamId:'scope'}});assert.equal(c.getPlayer('p').inventory.camera,2);assert.equal(c.events.some(v=>v.kind==='camera:focus'),false);
});
