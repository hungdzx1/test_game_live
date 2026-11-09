import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';

const plan=()=>['tea','pill','blessing','root','camera','tea'].map((item,i)=>({level:i+1,likes:(i+1)*10,reward:{item,quantity:2},scope:'all'}));
const event=(count,id='level-likes')=>({source:'demo',loai:'tim',eventId:id,userId:'p1',ten:'Đạo hữu',soLuong:count,rawMeta:{streamId:'level-config'}});
const delay=ms=>new Promise(r=>setTimeout(r,ms));

test('Six-level plan delivers all five rewards to current members, one global Ban Phuc, final MAX once; API/WS/restart/modes',async()=>{
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-levels-'));let app,ws;
  try{
    app=await createApplication({dataRoot,port:0});let base=`http://127.0.0.1:${await app.listen()}`;
    const post=async(action,value)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());};
    await post('sectLevels',plan());await post('demo',10);await post('phase','battle');const p=app.engine.getPlayer('demo-1'),exp=p.cultivation;
    const snapshots=[];ws=new WebSocket(base.replace('http','ws')+'/ws');ws.on('message',b=>{const m=JSON.parse(b);if(m.type==='state:snapshot')snapshots.push(m.payload);});
    await post('demoLiveEvent',event(165));await post('demoLiveEvent',event(165));
    const expected={level:6,power:15,threshold:60,maxLevel:6,full:false};assert.deepEqual(app.engine.liveEvents.sectEnergy.snapshot(),expected);
    for(const member of app.engine.players.values()){assert.equal(member.inventory.tea,0);assert.equal(member.inventory.pill,2);assert.equal(member.inventory.root,1);assert.equal(member.inventory.camera,2);assert.equal(member.buffs.length,2);assert.equal(member.spiritualRootMultiplier,3);}assert.equal(p.cultivation,exp);assert.equal(app.engine.items.blessingSnapshot().remainingMs,60000);
    const end=Date.now()+5000;while(!snapshots.some(s=>s.interactions?.sectEnergy?.level===6)&&Date.now()<end)await delay(20);assert.deepEqual(snapshots.find(s=>s.interactions?.sectEnergy?.level===6).interactions.sectEnergy,expected);
    await post('demoLiveEvent',event(45,'max'));assert.equal(p.buffs.length,4);assert.equal(p.inventory.tea,0);await post('demoLiveEvent',event(1000,'capped'));assert.equal(p.buffs.length,4);assert.equal(app.engine.liveEvents.sectEnergy.snapshot().full,true);assert.equal(p.questState.points,0);
    const extended=[...plan(),{level:7,likes:10,reward:{item:'pill',quantity:1},scope:'all'}];await post('sectLevels',extended);assert.equal(app.engine.liveEvents.sectEnergy.level,7);assert.equal(p.inventory.pill,2);
    await post('demoLiveEvent',event(10,'extra-level'));assert.equal(p.inventory.pill,3);await post('mode','live');assert.equal(app.engine.players.size,0);assert.equal(app.engine.liveEvents.sectEnergy.power,0);await post('mode','demo');assert.equal(app.engine.getPlayer('demo-1').inventory.pill,3);
    ws.terminate();ws=null;await app.close();app=await createApplication({dataRoot,port:0});base=`http://127.0.0.1:${await app.listen()}`;assert.deepEqual(app.engine.config.sectLevels,extended);assert.deepEqual(app.engine.liveEvents.sectEnergy.snapshot(),{level:7,power:10,threshold:10,maxLevel:7,full:true});assert.equal(app.engine.getPlayer('demo-1').inventory.pill,3);
    await post('demoLiveEvent',event(1,'restart-capped'));assert.equal(app.engine.getPlayer('demo-1').inventory.pill,3);
  }finally{ws?.terminate();await app?.close();}
});

test('Invalid level settings preserve both disk config and active progression; lowering/removing does not erase total',async()=>{
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-levels-invalid-')),app=await createApplication({dataRoot,port:0});
  try{
    const base=`http://127.0.0.1:${await app.listen()}`,post=value=>fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'sectLevels',value})});
    assert.equal((await post(plan())).status,200);const before=await readFile(path.join(dataRoot,'caidat.json'),'utf8');
    for(const bad of [[],[{...plan()[0],likes:-1}],[{...plan()[0],scope:'actor'}],[{...plan()[0],reward:{item:'tea',quantity:0}}]])assert.equal((await post(bad)).status,400);
    assert.equal(await readFile(path.join(dataRoot,'caidat.json'),'utf8'),before);assert.deepEqual(app.engine.config.sectLevels,plan());assert.equal(app.engine.liveEvents.sectEnergy.totalLikes,0);
    app.engine.liveEvents.accept(event(165));const count=app.engine.items.blessingSnapshot().remainingMs;assert.equal((await post([{level:1,likes:1,reward:{item:'blessing',quantity:100},scope:'all'}])).status,200);assert.equal(app.engine.liveEvents.sectEnergy.totalLikes,165);assert.equal(app.engine.items.blessingSnapshot().remainingMs,count);
    assert.equal((await post(plan())).status,200);assert.equal(app.engine.liveEvents.sectEnergy.totalLikes,165);assert.equal(app.engine.items.blessingSnapshot().remainingMs,count);
  }finally{await app.close();}
});

test('Pending level reward survives full inbox, config changes and restart with original item/count/recipients',()=>{
  const rows=[{level:1,likes:10,reward:{item:'tea',quantity:2},scope:'all'}],e=new GameEngine([createPlayer('p1','Một'),createPlayer('p2','Hai')],{sectLevels:rows});e.setPhase('battle');
  e.liveEvents.inbox.set('p1',{name:'Một',items:{tea:1e9,pill:0,root:0,blessing:0,camera:0}});e.liveEvents.accept(event(10));assert.equal(e.liveEvents.levelRewards.length,1);assert.equal(e.getPlayer('p2').inventory.tea,0);
  e.config.sectLevels=[{...rows[0],reward:{item:'pill',quantity:99}}];e.liveEvents.sectEnergy.configure(e.config.sectLevels);const saved=e.exportState(),r=new GameEngine(saved.players,e.config,{saved});r.setPhase('battle');r.join(createPlayer('late','Sau mốc'));
  r.liveEvents.inbox.get('p1').items.tea=0;r.liveEvents.flush();assert.equal(r.liveEvents.levelRewards.length,0);assert.equal(r.getPlayer('p1').buffs.length,2);assert.equal(r.getPlayer('p2').buffs.length,2);assert.equal(r.getPlayer('late').inventory.tea,0);assert.equal(r.getPlayer('late').buffs.length,0);assert.equal(r.getPlayer('p1').inventory.pill,0);
  r.liveEvents.accept(event(100,'after-change'));assert.equal(r.getPlayer('p2').buffs.length,2);
  const invalid=structuredClone(saved);invalid.runtime.interactions.levelRewards[0].level=51;assert.throws(()=>new GameEngine(invalid.players,e.config,{saved:invalid}));
});
