import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {GameEngine} from '../gameEngine.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){const end=Date.now()+6000;while(Date.now()<end){if(await fn())return;await delay(20);}throw Error('Like cultivation integration timeout');}
async function post(base,action,value,userId){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.equal(r.status,200,await r.text());}
const native=(id,extra={})=>({common:{msgId:String(id),roomId:'999'},user:{id:'123',nickname:'Đạo hữu LIVE'},...extra});
class Connector extends EventEmitter{
  constructor(){super();this.roomId='999';}
  async connect(){this.isConnected=true;return {isConnected:true,roomId:this.roomId};}
  async disconnect(){this.isConnected=false;}
}

test('Like cultivation API/WS: immediate energy, idle personal EXP is durable, buffed seconds/hearts, remainder restart and mode isolation',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-heart-exp-'));await mkdir(path.join(root,'data'),{recursive:true});
  const real=path.join(root,'data/players.json'),file=path.join(root,'data/demo/players.json');await writeFile(real,JSON.stringify(new GameEngine().exportState()));
  let app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}}),port=await app.listen(),base=`http://127.0.0.1:${port}`;
  t.after(()=>app.close());await post(base,'demo',1);await post(base,'phase','paused');
  const snapshots=[],ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state:snapshot')snapshots.push(m.payload);});
  const p=app.engine.getPlayer('demo-1'),before=p.cultivation;
  await post(base,'demoLiveEvent',{loai:'tim',eventId:'idle-10',userId:p.userId,soLuong:10});
  assert.equal(p.cultivation,before);assert.equal(p.pendingExp,0);assert.equal(app.engine.liveEvents.sectEnergy.power,10);
  await until(async()=>JSON.parse(await readFile(file,'utf8')).players[0].pendingExp===20);
  await until(()=>snapshots.some(s=>s.players[0].pendingExp===20&&s.interactions.sectEnergy.power===10));
  await post(base,'phase','cultivation');await post(base,'grantItem','tea',p.userId);await post(base,'useItem','tea',p.userId);
  const start={exp:p.cultivation,elapsed:app.engine.elapsedMs};await until(()=>app.engine.elapsedMs>=start.elapsed+500);
  const delta=p.cultivation-start.exp;assert.ok(Math.abs(delta-4*(app.engine.elapsedMs-start.elapsed)/1000)<1e-7);
  await post(base,'phase','paused');await post(base,'demoLiveEvent',{loai:'tim',eventId:'buffed-100',userId:p.userId,soLuong:100});assert.equal(p.pendingExp,400);
  await post(base,'mode','live'); // Inactive DEMO streaks/state cannot affect the LIVE engine.
  assert.equal(app.engine.players.size,0);assert.equal(app.engine.liveEvents.sectEnergy.power,0);
  await post(base,'mode','demo');assert.equal(app.engine.getPlayer(p.userId).pendingExp,400);
  const receiptTime=Date.now()+60000;app.engine.liveEvents.now=()=>receiptTime;
  await post(base,'demoLiveEvent',{loai:'tim',eventId:'restart-17',userId:p.userId,soLuong:17});
  const disk=JSON.parse(await readFile(file,'utf8'));assert.equal(disk.runtime.interactions.likeStreaks[0][1].amount,68);
  ws.terminate();await app.close();app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});port=await app.listen();base=`http://127.0.0.1:${port}`;
  app.engine.liveEvents.now=()=>receiptTime+999;await post(base,'phase','paused');assert.equal(app.engine.getPlayer(p.userId).pendingExp,400);
  app.engine.liveEvents.now=()=>receiptTime+1000;await until(async()=>JSON.parse(await readFile(file,'utf8')).players[0].pendingExp===468);
  await post(base,'demoLiveEvent',{loai:'tim',eventId:'restart-17',userId:p.userId,soLuong:17});assert.equal(app.engine.getPlayer(p.userId).pendingExp,468);
  assert.equal(app.engine.liveEvents.sectEnergy.power,127);assert.equal(JSON.parse(await readFile(real,'utf8')).players.length,0);
});

test('Like cultivation native adapter: more than 1000 queued single-heart contributions survive rate limits and replay once',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-live-heart-exp-'));let connector;
  const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>connector=new Connector()}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  await post(base,'sectLevels',[{level:1,likes:1000000,reward:null,scope:'all'}]);await post(base,'mode','live');await post(base,'liveConnect',{username:'tester'});
  await until(()=>app.adapter.snapshot().state==='connected');connector.emit('chat',native(1,{comment:'nhập môn'}));await until(()=>app.engine.players.has('tt:123'));
  await post(base,'phase','paused');const p=app.engine.getPlayer('tt:123'),before=p.cultivation;
  for(let i=0;i<1100;i++)connector.emit('like',native(100+i,{count:1,total:String(i+1)}));
  const file=path.join(root,'data/players.json');await until(async()=>JSON.parse(await readFile(file,'utf8')).players[0]?.pendingExp===2200);
  assert.equal(p.cultivation,before);assert.equal(app.engine.liveEvents.sectEnergy.power,1100);assert.equal(app.engine.liveEvents.counters.rejected,0);
  connector.emit('like',native(100,{count:1,total:'1'}));await until(()=>app.engine.liveEvents.counters.duplicates===1);
  await post(base,'phase','cultivation');await post(base,'phase','paused');assert.ok(p.cultivation>=before+2200-450);assert.equal(p.pendingExp,0);
  assert.equal(app.engine.liveEvents.sectEnergy.power,1100);assert.equal(app.engine.liveEvents.likeCultivation.streaks.size,0);
});
