import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {createPlayer} from '../playerStore.js';
import {setTimeout as delay} from 'node:timers/promises';
async function temporary(){const root=await mkdtemp(path.join(os.tmpdir(),'tutien-phase2-'));await mkdir(path.join(root,'data/demo'),{recursive:true});return root;}
async function post(base,action,value,userId='demo-1'){return fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});}
async function until(fn,timeout=5000){const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await delay(25);}throw new Error('Điều kiện kiểm thử không đạt trong thời hạn.');}
test('02-14 HTTP -> engine -> durable start -> WS; restart active ceremony and preserve real data',async t=>{
  const root=await temporary(),file=path.join(root,'data/demo/players.json'),real=path.join(root,'data/players.json');await writeFile(real,'{"doNotTouch":true}');
  let app=await createApplication({dataRoot:root,port:0}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(async()=>app.close());
  assert.equal((await post(base,'demo',10)).status,200);assert.equal((await post(base,'grantItem','tea')).status,200);assert.equal((await post(base,'useItem','tea')).status,200);
  assert.equal((await post(base,'command',{eventId:'join-again',text:'NHAP MON',name:'Other'})).status,200);assert.equal(app.engine.players.size,10);
  assert.equal((await post(base,'command',{eventId:'checkin',text:'điểm danh'})).status,200);
  assert.equal((await post(base,'cultivationSettings',{maxMultiplier:6,fateFailures:6})).status,200);
  let sawStart=false,durableAtStart=false,exposedRoll=false;const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());
  ws.on('message',async raw=>{const m=JSON.parse(raw);if(m.type==='game:event'&&m.payload.kind==='breakthrough:started'){sawStart=true;const disk=JSON.parse(await readFile(file,'utf8'));durableAtStart=disk.runtime.active?.id===m.payload.id;exposedRoll='roll'in m.payload||'outcome'in m.payload;}});
  assert.equal((await post(base,'prepareBreakthrough')).status,200);await until(()=>sawStart&&durableAtStart);assert.equal(exposedRoll,false);
  await post(base,'phase','paused');const before=JSON.parse(await readFile(file,'utf8'));assert.ok(before.runtime.active);const id=before.runtime.active.id,outcome=before.runtime.active.outcome;
  const oldTransport=app.engine.transportId;ws.close();await app.close();app=await createApplication({dataRoot:root,port:0});port=await app.listen();base=`http://127.0.0.1:${port}`;
  assert.equal(app.engine.phase,'stopped');assert.notEqual(app.engine.transportId,oldTransport);assert.equal(app.engine.breakthrough.active.id,id);assert.equal(app.engine.breakthrough.active.outcome,outcome);assert.equal(app.engine.rules.maxMultiplier,6);assert.equal(app.engine.rules.fateFailures,6);
  const p=app.engine.getPlayer('demo-1');assert.equal(p.cultivation,before.players[0].cultivation);assert.deepEqual(p.buffs,before.players[0].buffs);
  await post(base,'phase','resume');assert.equal((await post(base,'command',{eventId:'checkin-after-restart',text:'điểm danh'})).status,400);
  await post(base,'demoSpeed',10);await until(()=>app.engine.breakthrough.active?.id!==id,5000);
  // State mutates before the asynchronous atomic commit finishes. Wait for disk evidence,
  // not merely the in-memory completion, when checking durability under parallel test load.
  await until(async()=>JSON.parse(await readFile(file,'utf8')).runtime.lastResult?.id===id,5000);
  const result=JSON.parse(await readFile(file,'utf8'));assert.equal(result.runtime.lastResult.id,id);assert.equal(result.players[0].realmIndex,outcome?1:0);assert.equal(result.players[0].breakthrough.failedAttempts,outcome?0:1);
  assert.equal(await readFile(real,'utf8'),'{"doNotTouch":true}');
});
test('Phase-1 migration keeps backup and player identity; corrupt JSON refuses startup without writes',async t=>{
  const root=await temporary(),file=path.join(root,'data/demo/players.json');const p=createPlayer('legacy','Người cũ');delete p.schemaVersion;delete p.inventory;delete p.breakthrough;delete p.questState;
  const original=JSON.stringify({schemaVersion:1,players:[p]});await writeFile(file,original);
  const app=await createApplication({dataRoot:root,port:0});await app.listen();await app.close();
  assert.equal(await readFile(file+'.v1.backup','utf8'),original);const migrated=JSON.parse(await readFile(file,'utf8'));assert.equal(migrated.schemaVersion,2);assert.equal(migrated.players[0].userId,'legacy');assert.equal(migrated.players[0].seed,p.seed);
  const corrupt='{not valid';await writeFile(file,corrupt);await assert.rejects(createApplication({dataRoot:root,port:0}),/Không đọc được/);assert.equal(await readFile(file,'utf8'),corrupt);
});
test('Storage write failure pauses simulation and cannot silently persist unacknowledged gains',async t=>{
  const root=await temporary(),file=path.join(root,'data/demo/players.json'),app=await createApplication({dataRoot:root,port:0});const port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  await post(base,'demo',10);await post(base,'phase','paused');const before=await readFile(file,'utf8');
  await mkdir(file+'.tmp');const response=await post(base,'grantItem','root');assert.equal(response.status,500);
  assert.equal((await (await fetch(base+'/health')).json()).ok,false);assert.equal(app.engine.phase,'paused');assert.equal((await post(base,'phase','resume')).status,400);assert.equal(await readFile(file,'utf8'),before);
});
