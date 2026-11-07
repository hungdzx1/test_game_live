import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';
import {createPlayer,migratePlayer} from '../playerStore.js';
import {CommandRouter,normalizeCommand} from '../commandRouter.js';
import {totalMultiplier} from '../itemService.js';
import {probabilityFor} from '../breakthroughService.js';
import {DEFAULT_RULES,rulesFor} from '../cultivationConfig.js';
function setup(rng=()=>0){const e=new GameEngine([],{}, {rng});e.join(createPlayer('demo-test','Thanh Vân'));e.setPhase('cultivation');return {e,p:e.getPlayer('demo-test')};}
function advance(e,ms){for(let remaining=ms;remaining>0;){const step=Math.min(250,remaining);e.tick(step);remaining-=step;}}
test('02-01 exact normalized commands and duplicate join preserve progress; no admin bypass',()=>{
  const {e,p}=setup();p.cultivation=12;const router=new CommandRouter(e,['xấu']);
  router.handle({eventId:'a',userId:p.userId,name:'Đổi tên',text:' NHẬP   MÔN '});assert.equal(e.players.size,1);assert.equal(p.cultivation,12);
  assert.deepEqual(router.handle({eventId:'a',userId:p.userId,text:'tu luyện'}),{duplicate:true});
  assert.equal(normalizeCommand('ĐIỂM DANH'),'diem danh');assert.throws(()=>router.handle({eventId:'b',userId:p.userId,text:'xin tu luyện nhé'}));assert.throws(()=>router.handle({eventId:'c',userId:p.userId,text:'thử độ kiếp'}));
  router.handle({eventId:'d',userId:'another',name:'<xấu> rất dài'.repeat(10),text:'nhap mon'});assert.ok([...e.getPlayer('another').name].length<=20);assert.ok(!e.getPlayer('another').name.includes('xấu'));
});
test('02-02 / 02-03 exact server elapsed time and realm stats',()=>{
  let {e,p}=setup();advance(e,49950);assert.equal(p.stageIndex,0);advance(e,50);assert.equal(p.stageIndex,1);assert.ok(p.cultivation<1e-7);assert.equal(e.items.getEffectiveStats(p).atk,11);
  ({e,p}=setup());p.realmIndex=3;advance(e,279950);assert.equal(p.stageIndex,0);advance(e,50);assert.equal(p.stageIndex,1);assert.ok(p.cultivation<1e-7);assert.equal(e.items.getEffectiveStats(p).baseCultivationRate,2);
  assert.deepEqual(DEFAULT_RULES.realms.map(r=>[r.hp,r.atk,r.def,r.rate]),[[100,10,5,2],[180,18,9,2],[320,32,16,2],[560,56,28,2],[980,98,49,2],[1720,172,86,2],[3010,301,151,2],[5270,527,264,2],[9220,922,461,2],[16140,1614,807,2],[28240,2824,1412,2]]);
});
test('02-04 / 02-13 battle, pause, stopped freeze all EXP/buffs/cooldowns and item consumption',()=>{
  const {e,p}=setup();e.items.grantItem(p,'tea',2);e.items.useItem(p,'tea');p.breakthrough.cooldownRemainingCultivationMs=60000;
  for(const phase of ['battle','paused','stopped']){e.setPhase(phase);const exp=p.cultivation,buff=p.buffs[0].remainingMs,cd=p.breakthrough.cooldownRemainingCultivationMs;advance(e,10000);assert.equal(p.cultivation,exp);assert.equal(p.buffs[0].remainingMs,buff);assert.equal(p.breakthrough.cooldownRemainingCultivationMs,cd);assert.equal(e.cultivation.add(p,100),false);assert.throws(()=>e.items.useItem(p,'tea'));assert.equal(p.inventory.tea,1);assert.throws(()=>e.prepareBreakthrough(p.userId));}
  e.setPhase('cultivation');e.items.useItem(p,'tea');assert.equal(p.inventory.tea,0);
});
test('02-05 / 02-12 additive x2/x4/x6, permanent root, cap, partial expiry and global blessing',()=>{
  const {e,p}=setup();for(let i=1;i<=3;i++){e.items.grantItem(p,'tea');e.items.useItem(p,'tea');assert.equal(totalMultiplier(p,[],e.rules),i*2);}
  e.items.grantItem(p,'root',2);e.items.useItem(p,'root');assert.equal(totalMultiplier(p,[],e.rules),8);assert.throws(()=>e.items.useItem(p,'root'));assert.equal(p.inventory.root,1);
  p.buffs=[];e.items.grantItem(p,'tea');e.items.useItem(p,'tea');assert.equal(totalMultiplier(p,[],e.rules),4);p.buffs[0].remainingMs=125;e.tick(250);assert.equal(p.cultivation,1.5);assert.equal(p.buffs.length,0);assert.equal(totalMultiplier(p,[],e.rules),2);
  e.items.grantItem(p,'blessing');e.items.useItem(p,'blessing');e.join(createPlayer('new','Người mới',1));assert.equal(e.items.getEffectiveStats(e.getPlayer('new')).cultivationPerSecond,4);advance(e,30000);assert.equal(e.globalBuffs.length,0);assert.equal(p.spiritualRootMultiplier,2);
});
test('02-06 / 02-11 full stage queues once; one ceremony at a time',()=>{
  const {e,p}=setup();e.cultivation.add(p,500);assert.equal(p.stageIndex,3);assert.equal(p.cultivation,50);for(let i=0;i<10;i++)e.breakthrough.enqueue(p);assert.deepEqual(e.breakthrough.queue,[p.userId]);
  for(let i=0;i<10;i++){const q=createPlayer(`q${i}`,'Đệ tử',i+1);q.stageIndex=3;e.join(q);e.breakthrough.enqueue(e.getPlayer(q.userId));}
  e.tick(50);assert.equal(e.breakthrough.active.userId,p.userId);assert.equal(e.breakthrough.queue.length,10);assert.equal(p.breakthrough.queued,false);assert.equal(e.snapshot().payload.breakthroughQueueLength,10);
  assert.ok(!('outcome'in e.snapshot().payload.breakthrough));assert.ok(!('roll'in e.snapshot().payload.breakthrough));
});
test('02-07 / 02-08 success and failure apply only once, no loss on failure',()=>{
  for(const success of [true,false]){const {e,p}=setup(()=>success?0:.99);p.stageIndex=3;p.cultivation=70;e.breakthrough.enqueue(p);e.tick(50);advance(e,12000);assert.equal(p.realmIndex,success?1:0);assert.equal(p.stageIndex,success?0:3);assert.ok(p.cultivation>=70);if(!success){assert.equal(p.breakthrough.protectionPoints,8);assert.equal(p.breakthrough.cooldownRemainingCultivationMs,60000);}const realm=p.realmIndex,fails=p.breakthrough.failedAttempts;e.breakthrough.complete();assert.equal(p.realmIndex,realm);assert.equal(p.breakthrough.failedAttempts,fails);}
});
test('02-09 / 02-10 protection cap, Pmax, fifth failure enables one guaranteed ritual',()=>{
  const {e,p}=setup(()=>.999);p.realmIndex=9;p.stageIndex=3;
  for(let attempt=1;attempt<=5;attempt++){
    p.breakthrough.cooldownRemainingCultivationMs=0;e.breakthrough.lastResult=null;e.breakthrough.enqueue(p);e.tick(50);assert.equal(e.breakthrough.active.guaranteed,false);assert.ok(e.breakthrough.active.probability<=60);advance(e,12000);assert.equal(p.breakthrough.failedAttempts,attempt);assert.equal(p.breakthrough.protectionPoints,Math.min(24,attempt*8));
  }
  assert.equal(p.breakthrough.heavenlyFate,5);p.breakthrough.cooldownRemainingCultivationMs=0;e.breakthrough.lastResult=null;e.breakthrough.enqueue(p);e.tick(50);assert.equal(e.breakthrough.active.guaranteed,true);advance(e,12000);assert.equal(p.realmIndex,10);assert.equal(p.breakthrough.heavenlyFate,0);assert.equal(e.breakthrough.enqueue(p),false);
});
test('Pills consumed once at ceremony start, percentage clamp for every realm',()=>{
  const {e,p}=setup();for(let i=0;i<10;i++){p.realmIndex=i;p.breakthrough.pillCount=10;p.breakthrough.protectionPoints=24;assert.ok(probabilityFor(p,e.rules)<=e.rules.realms[i].max);}
  p.realmIndex=0;p.stageIndex=3;p.breakthrough.pillCount=0;e.items.grantItem(p,'pill',12);for(let i=0;i<10;i++)e.items.useItem(p,'pill');assert.throws(()=>e.items.useItem(p,'pill'));assert.equal(p.inventory.pill,2);e.breakthrough.enqueue(p);e.tick(50);assert.equal(p.breakthrough.pillCount,0);assert.throws(()=>e.items.useItem(p,'pill'));
});
test('02-14 model migration and in-flight restart preserve outcome/session/buffs without offline gains',()=>{
  const {e,p}=setup(()=>.99);p.stageIndex=3;e.items.grantItem(p,'tea');e.items.useItem(p,'tea');e.breakthrough.enqueue(p);e.tick(50);advance(e,5000);
  const saved=e.exportState(),restored=new GameEngine(saved.players,{}, {saved,rng:()=>{throw new Error('Must not reroll');}});const rp=restored.getPlayer(p.userId);assert.equal(restored.phase,'stopped');assert.notEqual(restored.transportId,e.transportId);assert.equal(restored.sessionId,e.sessionId);assert.equal(rp.cultivation,p.cultivation);assert.deepEqual(rp.buffs,p.buffs);assert.equal(restored.breakthrough.active.outcome,false);restored.setPhase('resume');advance(restored,7000);assert.equal(rp.breakthrough.failedAttempts,1);
  const again=restored.exportState(),third=new GameEngine(again.players,{}, {saved:again});assert.equal(third.breakthrough.active,null);assert.equal(third.getPlayer(p.userId).breakthrough.failedAttempts,1);
  const legacy={userId:'legacy',name:'Cũ',index:0,seed:1,x:0,z:0,homeX:0,homeZ:0,animation:'idle',animationStartMs:90000,overrideUntil:99999};const migrated=migratePlayer(legacy);assert.equal(migrated.realmIndex,0);assert.equal(migrated.overrideUntil,0);assert.throws(()=>migratePlayer({...migrated,cultivation:-1}));
});
test('Ceremony and cooldown suspend across battle/pause then resume from exact same roll',()=>{
  const {e,p}=setup(()=>.99);p.stageIndex=3;e.breakthrough.enqueue(p);e.tick(50);advance(e,1000);const original=structuredClone(e.breakthrough.active);
  for(const phase of ['battle','paused']){e.setPhase(phase);advance(e,20000);assert.deepEqual(e.breakthrough.active,original);assert.equal(p.realmIndex,0);}
  e.setPhase('cultivation');advance(e,11000);assert.equal(p.breakthrough.failedAttempts,1);assert.equal(p.breakthrough.cooldownRemainingCultivationMs,60000);advance(e,59950);assert.equal(e.breakthrough.active,null);e.tick(50);assert.ok(e.breakthrough.active);
});
test('02-15 Phi Thang accumulates EXP without creating realm twelve',()=>{const {e,p}=setup();p.realmIndex=10;e.cultivation.add(p,1e6);advance(e,10000);assert.equal(p.realmIndex,10);assert.equal(p.stageIndex,0);assert.equal(e.breakthrough.queue.length,0);assert.equal(e.breakthrough.active,null);assert.ok(p.cultivation>1e6);});
test('Free quests: exact commands, cooldown, cap, session check-in, all five redeemable items',()=>{
  const {e,p}=setup();e.quests.claim(p,'checkIn');assert.throws(()=>e.quests.claim(p,'checkIn'));e.quests.claim(p,'cultivate');assert.throws(()=>e.quests.claim(p,'cultivate'));
  for(let i=1;i<10;i++){advance(e,30000);e.quests.claim(p,'cultivate');}advance(e,30000);assert.throws(()=>e.quests.claim(p,'cultivate'));
  for(const item of ['tea','pill','root','blessing','camera']){p.questState.points=e.rules.quests.costs[item];const old=p.inventory[item];e.quests.redeem(p,item);assert.equal(p.inventory[item],old+1);assert.equal(p.questState.points,0);assert.throws(()=>e.quests.redeem(p,item));}
  const saved=e.exportState(),restored=new GameEngine(saved.players,{}, {saved});restored.setPhase('cultivation');assert.throws(()=>restored.quests.claim(restored.getPlayer(p.userId),'checkIn'));e.setPhase('battle');e.setPhase('cultivation');advance(e,30000);e.quests.claim(p,'cultivate');assert.equal(p.questState.cycleCount,1);
});
test('Configuration rejects malformed values; camera item cooldown does not consume twice',()=>{
  assert.throws(()=>rulesFor({maxMultiplier:NaN}));assert.throws(()=>rulesFor({realms:[]}));assert.throws(()=>rulesFor({quests:{costs:{root:-1}}}));const {e,p}=setup();e.items.grantItem(p,'camera',2);e.items.useItem(p,'camera');assert.throws(()=>e.items.useItem(p,'camera'));assert.equal(p.inventory.camera,1);
});
test('Manual phase switch while paused uses the new clock; repeated demo creation preserves progress',async()=>{
  const {e,p}=setup();e.setPhase('battle');e.tick(250);e.setPhase('paused');e.setPhase('resume');assert.equal(e.remainingMs,299750);e.setPhase('paused');e.setPhase('cultivation');assert.equal(e.remainingMs,600000);
  const {DemoEventSource}=await import('../demoEventSource.js');const demo=new DemoEventSource(e);demo.spawn(10);const first=e.getPlayer('demo-1');first.cultivation=42;first.inventory.root=1;demo.spawn(30);assert.equal(e.getPlayer('demo-1').cultivation,42);assert.equal(e.getPlayer('demo-1').inventory.root,1);assert.ok(e.players.has(p.userId));
});
