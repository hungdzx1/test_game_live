import test from'node:test';import assert from'node:assert/strict';import{mkdtemp,readFile}from'node:fs/promises';import os from'node:os';import path from'node:path';import{WebSocket}from'ws';import{createApplication}from'../server.js';
test('Sect energy is committed through API/WebSocket and restored separately for DEMO/LIVE',async()=>{
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-sect-energy-'));let app;let ws;
  try{
    app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('LIVE forbidden in test');}});let port=await app.listen();let base=`http://127.0.0.1:${port}`;
    const post=async(action,value)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());};
    const snapshots=[];ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);ws.on('message',b=>{const m=JSON.parse(b);if(m.type==='state:snapshot')snapshots.push(m.payload);});
    await post('demoLiveEvent',{loai:'tim',eventId:'api-hearts',userId:'demo:likes',ten:'Đạo hữu',soLuong:2500});
    const state=(await(await fetch(base+'/api/state')).json()).payload;assert.deepEqual(state.interactions.sectEnergy,{level:2,power:1500,threshold:3000,maxLevel:3,full:false});
    const deadline=Date.now()+5000;while(!snapshots.some(s=>s.interactions?.sectEnergy?.power===1500)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.ok(snapshots.some(s=>s.interactions?.sectEnergy?.power===1500));
    await post('mode','live');assert.equal((await(await fetch(base+'/api/state')).json()).payload.interactions.sectEnergy.power,0);await post('mode','demo');assert.equal(app.engine.liveEvents.sectEnergy.power,1500);
    const saved=JSON.parse(await readFile(path.join(dataRoot,'data/demo/players.json')));assert.deepEqual(saved.runtime.interactions.sectEnergy,{version:2,totalLikes:2500,completedLevels:[1]});
    ws.terminate();ws=null;await app.close();app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('LIVE forbidden');}});await app.listen();assert.deepEqual(app.engine.liveEvents.sectEnergy.progress,{level:2,power:1500});
  }finally{ws?.terminate();if(app)await app.close();}
});
