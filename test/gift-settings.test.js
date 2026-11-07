import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {giftRulesFor,liveRulesFor,matchGift} from '../liveConfig.js';
import {GameEngine} from '../gameEngine.js';
import {createApplication} from '../server.js';
import {createPlayer} from '../playerStore.js';

const rule={id:'selected',giftId:'990001',giftName:'Hoa Hồng kiểm thử',minDiamonds:1,maxDiamonds:1,item:'pill',quantity:2,effect:'item',enabled:true};
const post=(base,action,value,userId)=>fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});
let serial=0;
const like=()=>({source:'demo',loai:'tim',eventId:'like-'+(++serial),userId:'p1',ten:'Test',soLuong:10,rawMeta:{streamId:'test'}});
const levels=item=>[1,2].map(level=>({level,likes:10,reward:{item,quantity:2},scope:'all'}));
function engine(reward='tea'){
  const e=new GameEngine([],{sectLevels:levels(reward)});e.setPhase('cultivation');e.join(createPlayer('p1','Một'));e.join(createPlayer('p2','Hai'));return e;
}

test('ID+name catalog mappings match by ID; old ID-only, name-only and price ranges remain compatible',()=>{
  const rules=giftRulesFor([...giftRulesFor(),rule]),event={giftId:'990001',qua:'Renamed by TikTok',soKimCuong:1};assert.equal(matchGift(rules,event).item,'pill');
  assert.equal(matchGift(rules,{...event,giftId:'other',qua:rule.giftName}).item,'tea');
  assert.throws(()=>giftRulesFor([rule,{...rule,id:'dup'}]),/Trùng/);assert.equal(liveRulesFor({}).wishReward,'points');assert.throws(()=>liveRulesFor({wishReward:'exec'}));assert.throws(()=>liveRulesFor({wishPoints:101}));
});
test('All item rewards from likes respect battle lock, persist, auto-use through item service and deduplicate',()=>{
  for(const reward of ['tea','pill','root','camera']){
    const e=engine(reward);e.setPhase('battle');const initial=e.getPlayer('p1').cultivation,event=like();assert.equal(e.liveEvents.accept(event).accepted,true);e.liveEvents.accept(event);
    for(const p of e.players.values()){assert.equal(p.inventory[reward],2);assert.equal(p.cultivation,initial);assert.equal(p.buffs.length,0);assert.equal(p.spiritualRootMultiplier,1);}
    const saved=JSON.parse(JSON.stringify(e.exportState())),r=new GameEngine(saved.players,e.config,{saved});r.setPhase('cultivation');r.tick(0);const p=r.getPlayer('p1');
    assert.equal(r.liveEvents.sectEnergy.completed.size,1);assert.equal(r.liveEvents.sectEnergy.level,2);assert.equal(r.liveEvents.sectEnergy.power,0);
    if(reward==='tea')assert.equal(p.buffs.length,2);if(reward==='pill')assert.equal(p.breakthrough.pillCount,2);if(reward==='root'){assert.equal(p.spiritualRootMultiplier,2);assert.equal(p.inventory.root,1);}if(reward==='camera'){assert.equal(p.focusCooldownMs,10000);assert.equal(p.inventory.camera,1);}
  }
});
test('Level Ban Phuc is once for the sect, freezes in battle/pause, survives configuration change/restart',()=>{
  const e=engine('blessing');e.setPhase('battle');e.liveEvents.accept(like());assert.equal(e.items.blessingSnapshot().remainingMs,60000);
  const saved=JSON.parse(JSON.stringify(e.exportState()));e.config.sectLevels=levels('tea');const r=new GameEngine(saved.players,e.config,{saved});r.setPhase('paused');r.tick(0);assert.equal(r.items.blessingSnapshot().remainingMs,60000);r.setPhase('cultivation');r.tick(0);
  assert.equal(r.items.blessingSnapshot().remainingMs,60000);assert.equal(r.liveEvents.levelRewards.length,0);r.tick(0);assert.equal(r.items.blessingSnapshot().remainingMs,60000);assert.equal(r.getPlayer('p1').questState.points,0);
  const legacy=JSON.parse(JSON.stringify(r.exportState()));delete legacy.runtime.interactions.wish.pendingBlessings;
  assert.doesNotThrow(()=>new GameEngine(legacy.players,r.config,{saved:legacy}));
});
test('Community item overflow is retained without losing awards or partially granting rewards',()=>{
  const e=engine('tea');e.setPhase('battle');e.getPlayer('p1').inventory.tea=100000;e.liveEvents.accept(like());assert.equal(e.liveEvents.inbox.get('p1').items.tea,2);assert.equal(e.getPlayer('p2').inventory.tea,2);
  e.liveEvents.inbox.get('p1').items.tea=1e9;e.liveEvents.accept(like());assert.equal(e.liveEvents.levelRewards.length,1);assert.equal(e.liveEvents.sectEnergy.completed.size,2);assert.equal(e.getPlayer('p2').inventory.tea,2);
});
test('Manual gift settings persist across restart and modes; removed catalog API cannot fetch TikTok',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-gift-api-'));let liveCalls=0,app;
  try{
    app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{liveCalls++;throw new Error('Should not connect');}});let base=`http://127.0.0.1:${await app.listen()}`;
    for(const query of ['', '?refresh=1&username=fixture'])assert.equal((await fetch(base+'/api/tiktok/gifts'+query)).status,404);assert.equal(liveCalls,0);
    assert.equal((await fetch(base+'/api/tiktok/gifts',{headers:{Origin:'https://invalid.example'}})).status,403);
    assert.equal((await post(base,'giftRules',[rule])).status,200);assert.equal((await post(base,'sectLevels',levels('tea'))).status,200);
    await post(base,'demo',10);await post(base,'phase','battle');const first=[...app.engine.players.values()][0],id=first.userId,exp=first.cultivation;
    assert.equal((await post(base,'demoLiveEvent',{...like(),userId:id})).status,200);assert.equal(first.inventory.tea,2);assert.equal(first.cultivation,exp);
    await post(base,'mode','live');assert.equal(app.engine.players.size,0);assert.equal(app.engine.liveEvents.sectEnergy.completed.size,0);await post(base,'mode','demo');assert.equal(app.engine.liveEvents.sectEnergy.completed.size,1);
    await app.close();app=await createApplication({dataRoot:root,port:0});base=`http://127.0.0.1:${await app.listen()}`;
    const snapshot=(await (await fetch(base+'/api/state')).json()).payload;assert.deepEqual(snapshot.config.sectLevels,levels('tea'));assert.deepEqual(snapshot.config.giftRules,[rule]);assert.equal(app.engine.getPlayer(id).inventory.tea,2);assert.equal((await fetch(base+'/api/tiktok/gifts')).status,404);assert.equal(liveCalls,0);
  }finally{await app?.close();}
});
