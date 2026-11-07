import test from'node:test';import assert from'node:assert/strict';import{mkdtemp,readFile}from'node:fs/promises';import os from'node:os';import path from'node:path';import{WebSocket}from'ws';import{createApplication}from'../server.js';
test('Ban Phuc level activation is durable via API/WS, deduplicated, and isolated across mode/restart',async()=>{
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-blessing-'));let app,ws;
  try{
    app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE in test');}});const port=await app.listen(),base=`http://127.0.0.1:${port}`,snapshots=[];
    const post=async(action,value)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());};
    ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);ws.on('message',bytes=>{const m=JSON.parse(bytes);if(m.type==='state:snapshot')snapshots.push(m.payload);});
    const value={loai:'tim',eventId:'blessing-levels',userId:'demo:likes',ten:'Đạo Hữu',soLuong:4000};await post('demoLiveEvent',value);await post('demoLiveEvent',value);
    assert.deepEqual((await(await fetch(base+'/api/state')).json()).payload.interactions.blessing,{remainingMs:60000,durationMs:60000,multiplier:2});
    const deadline=Date.now()+5000;while(!snapshots.some(s=>s.interactions.blessing.remainingMs===60000)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(snapshots.some(s=>s.interactions.blessing.remainingMs===60000));
    await post('mode','live');assert.equal(app.engine.items.blessingSnapshot().remainingMs,0);await post('mode','demo');assert.equal(app.engine.items.blessingSnapshot().remainingMs,60000);
    const saved=JSON.parse(await readFile(path.join(dataRoot,'data/demo/players.json'),'utf8'));assert.equal(saved.runtime.globalBuffs[0].remainingMs,60000);assert.equal(saved.runtime.globalBuffs[0].durationMs,60000);
    ws.terminate();ws=null;await app.close();app=await createApplication({dataRoot,port:0});await app.listen();assert.equal(app.engine.items.blessingSnapshot().remainingMs,60000);assert.equal(app.engine.phase,'stopped');
  }finally{ws?.terminate();if(app)await app.close();}
});
