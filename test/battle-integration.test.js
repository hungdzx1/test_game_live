import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
async function post(base,action,value,userId='battle-demo-0-0'){return fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});}
async function snapshot(port){const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('WS timeout')),3000);ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state:snapshot'){clearTimeout(timer);resolve(m.payload);}});});}finally{ws.terminate();}}
test('03-20 HTTP/WS reload preserves battle, disk restart preserves boss/cooldowns/IDs and rewards',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-phase3-'));await mkdir(path.join(root,'data/demo'),{recursive:true});const file=path.join(root,'data/demo/players.json'),real=path.join(root,'data/players.json');await writeFile(real,'{"untouched":"phase3"}');
  let app=await createApplication({dataRoot:root,port:0}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  for(const url of ['/','/song','/js/battleScene.js','/js/battlePanel.js','/js/battleOverlay.js'])assert.equal((await fetch(base+url)).status,200);
  assert.equal((await post(base,'battleSettings',{cultivationSeconds:10,battleSeconds:15})).status,200);assert.equal((await post(base,'battleSettings',{battleSeconds:0})).status,400);
  assert.equal((await post(base,'battleDemo')).status,200);assert.equal(app.engine.players.size,44);assert.equal((await post(base,'battleDemo')).status,400);
  assert.equal((await post(base,'command',{text:'1',eventId:'persistent-skill'})).status,200);assert.equal((await post(base,'phase','paused')).status,200);
  const first=await snapshot(port),second=await snapshot(port);assert.equal(first.battle.id,second.battle.id);assert.deepEqual(first.battle.view,second.battle.view);assert.equal(first.remainingMs,second.remainingMs);assert.equal(first.battle.fields.filter(f=>f.count).length,11);
  const disk=JSON.parse(await readFile(file,'utf8'));assert.equal(disk.runtime.battle.id,first.battle.id);assert.equal(disk.runtime.battle.fields[0].participants['battle-demo-0-0'].skillCount,1);
  await app.close();app=await createApplication({dataRoot:root,port:0});port=await app.listen();base=`http://127.0.0.1:${port}`;assert.equal(app.engine.phase,'stopped');assert.equal(app.engine.battle.current.id,first.battle.id);
  assert.equal(app.engine.battle.current.fields[0].activeBoss.hp,disk.runtime.battle.fields[0].activeBoss.hp);assert.equal(app.engine.battle.current.fields[0].activeBoss,app.engine.battle.current.fields[0].bossHistory[0]);
  await post(base,'phase','resume');await post(base,'command',{text:'1',eventId:'persistent-skill'});await post(base,'phase','paused');assert.equal(app.engine.battle.current.fields[0].participants['battle-demo-0-0'].skillCount,1);
  await post(base,'battleView',10);assert.equal(app.engine.battle.current.viewId,10);assert.equal(app.engine.battle.current.id,first.battle.id);
  await post(base,'phase','cultivation');await post(base,'phase','paused');const before=app.engine.exportState().players;app.engine.rewards.apply(app.engine.battle.current);assert.deepEqual(app.engine.exportState().players,before);
  const saved=JSON.parse(await readFile(file,'utf8'));assert.ok(saved.players.some(p=>p.lastBattleRewardId===first.battle.id));assert.ok(saved.runtime.battle.fields.every(f=>f.rewardState==='applied'));
  const config=JSON.parse(await readFile(path.join(root,'caidat.json'),'utf8'));assert.equal(config.cycle.battleSeconds,15);assert.equal(config.cultivation.realms.length,11);assert.equal(config.graphics,'medium');assert.equal(await readFile(real,'utf8'),'{"untouched":"phase3"}');
});
