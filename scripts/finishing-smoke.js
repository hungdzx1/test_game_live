// Real loopback application, isolated files. Never changes the user's players/config.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-finish-smoke-'));
// Keep enough battle wall time for HTTP round-trips even on a busy test machine.
const config={schemaVersion:1,port:3000,graphics:'medium',camera:'auto',cycle:{cultivationSeconds:10,battleSeconds:60}};
await writeFile(path.join(dataRoot,'caidat.json'),JSON.stringify(config));
await mkdir(path.join(dataRoot,'data/demo'),{recursive:true});
const fixture=new GameEngine(Array.from({length:500},(_,i)=>({...createPlayer('demo-'+i,'Đạo hữu '+i,i),realmIndex:i%11})),config);
await writeFile(path.join(dataRoot,'data/demo/players.json'),JSON.stringify(fixture.exportState()));
let app=await createApplication({dataRoot,port:0}),ws;
const checks=[],samples=[],messages=[],seenBattles=new Set();let lastBattle;
const wallStart=performance.now(),cpuStart=process.cpuUsage();
try{
  let port=await app.listen(),base=`http://127.0.0.1:${port}`;
  const get=async p=>(await fetch(base+p)).json();
  async function post(action,value,userId){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.equal(r.status,200,action+': '+await r.text());}
  for(const route of ['/','/song','/js/audio.js','/js/realmAura.js','/js/streamerPanel.js','/vendor/three/three.module.js'])assert.equal((await fetch(base+route)).status,200);
  ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);ws.on('message',raw=>messages.push({time:performance.now(),type:JSON.parse(raw).type}));await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  await post('demoSpeed',10);await post('phase','resume');
  const end=Date.now()+60000;
  while(app.engine.completedCycles<2){
    assert.ok(Date.now()<end,'Two cycles must finish in 60s');const e=app.engine;
    if(e.phase==='battle'&&!seenBattles.has(e.battle.current.id)){
      seenBattles.add(e.battle.current.id);lastBattle=e.battle.current;assert.equal(lastBattle.fields.filter(f=>f.participantIds.length).length,11);
      const p=e.getPlayer('demo-0'),exp=p.cultivation;await post('command',{text:'1',eventId:'skill1-'+seenBattles.size},p.userId);await post('command',{text:'2',eventId:'skill2-'+seenBattles.size},p.userId);
      for(let i=0;i<5;i++)await post('demoLiveEvent',{eventId:`burst-${seenBattles.size}-${i}`,loai:'qua',userId:p.userId,ten:p.name,giftId:'5655',qua:'Hồng',soKimCuong:1,soLuong:1,rawMeta:{giftType:0}});
      assert.equal(p.cultivation,exp);checks.push(`Battle ${seenBattles.size}: eleven active fields, both skills and gifts freeze EXP`);
    }
    if(lastBattle?.status==='finished'){
      assert.ok(lastBattle.fields.every(f=>f.bossHistory.length===3));assert.ok(lastBattle.fields.every(f=>f.rewardState==='applied'));const before=JSON.stringify(e.exportState().players);e.rewards.apply(lastBattle);assert.equal(JSON.stringify(e.exportState().players),before);
    }
    samples.push(await get('/api/dashboard'));await delay(100);
  }
  await post('phase','paused');assert.equal(app.engine.completedCycles,2);assert.equal(app.engine.players.size,500);checks.push('Two continuous shortened cycles; all 33 boss histories per battle; rewards idempotent');
  ws.terminate();ws=null;const backup=await get('/api/backup'),session=app.engine.transportId;
  assert.equal(backup.state.runtime.completedCycles,2);await assert.rejects(readFile(path.join(dataRoot,'data/players.json')),e=>e.code==='ENOENT');
  await app.close();app=await createApplication({dataRoot,port:0});port=await app.listen();base=`http://127.0.0.1:${port}`;
  assert.equal(app.engine.players.size,500);assert.equal(app.engine.completedCycles,2);assert.equal(app.engine.phase,'stopped');assert.notEqual(app.engine.transportId,session);assert.deepEqual(app.engine.exportState().players,backup.state.players);checks.push('Restart preserves 500 players, counters, gifts and reward IDs without offline gains');
  const cpu=process.cpuUsage(cpuStart),wallMs=performance.now()-wallStart;
  const rollingMax=type=>Math.max(0,...messages.map(m=>messages.filter(n=>n.type===type&&n.time>=m.time&&n.time<m.time+1000).length));
  const report={timestamp:new Date().toISOString(),version:'0.5.0',result:'PASS',checks,environment:{platform:process.platform,node:process.version,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalRamGB:os.totalmem()/1073741824},players:500,cycles:2,cycleSeconds:config.cycle,demoSpeed:10,wallMs,cpuMs:{user:cpu.user/1000,system:cpu.system/1000},maxRssMB:Math.max(...samples.map(s=>s.load.rssMB)),maxTickMs:Math.max(...samples.map(s=>s.load.maxTickMs)),maxCommitMs:Math.max(...samples.map(s=>s.load.commitMs)),maxMessagesInSlidingSecond:{snapshots:rollingMax('state:snapshot'),effects:rollingMax('game:event')},render:{fps:null,gpuMemory:null,status:'CHƯA KIỂM CHỨNG: không có phiên WebGL được công cụ cho phép kiểm tra'},loadBenchmarks:[]};
  // Allow a small client-delivery boundary jitter; server enforces 80 per rolling second.
  assert.ok(report.maxMessagesInSlidingSecond.effects<=84);
  report.memoryByCycle=[0,1].map(c=>({completedCycles:c,samples:samples.filter(s=>s.completedCycles===c).length,rssMinMB:Math.min(...samples.filter(s=>s.completedCycles===c).map(s=>s.load.rssMB)),rssMaxMB:Math.max(...samples.filter(s=>s.completedCycles===c).map(s=>s.load.rssMB))}));
  for(const count of [10,30,60,100,500]){const e=new GameEngine(Array.from({length:count},(_,i)=>({...createPlayer('p'+i,'Demo '+i,i),realmIndex:i%11})));e.setPhase('battle');const start=performance.now();for(let i=0;i<1200;i++)e.tick(250);assert.equal(e.players.size,count);report.loadBenchmarks.push({players:count,simulatedSeconds:300,wallMs:performance.now()-start});}
  await writeFile(new URL('../test-results/phase5-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{ws?.terminate();await app.close();}
