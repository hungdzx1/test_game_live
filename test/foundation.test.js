import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { WebSocket } from 'ws';
import { GameEngine, seedFor } from '../gameEngine.js';
import { DemoEventSource } from '../demoEventSource.js';
import { JsonStore } from '../storage.js';
import { createApplication } from '../server.js';
import { request } from 'node:http';
test('Stable identities, all demo sizes, bounded tick, pause and animations',()=>{
  const engine=new GameEngine(), demo=new DemoEventSource(engine);
  for(const count of [10,30,60,100,500]){demo.spawn(count);assert.equal(engine.players.size,count);assert.equal(new Set([...engine.players.values()].map(p=>p.userId)).size,count);}
  assert.equal(seedFor('demo-1'),engine.players.get('demo-1').seed);
  engine.tick(10000);assert.equal(engine.elapsedMs,250);
  engine.setPhase('paused');engine.tick(100);assert.equal(engine.elapsedMs,250);engine.setPhase('resume');assert.equal(engine.phase,'cultivation');
  engine.animationPreview=true;
  const seen=new Set();for(let i=0;i<400;i++){engine.tick(50);seen.add(engine.players.get('demo-1').animation);}
  for(const a of ['idle','walk','meditate','standUp'])assert.ok(seen.has(a),a);
  for(const a of ['attack','celebrate','teleport']){demo.send(a,'demo-1');assert.equal(engine.players.get('demo-1').animation,a);}
  assert.ok(engine.events.length<=100);assert.throws(()=>demo.spawn(NaN));assert.throws(()=>engine.trigger('attack','unknown'));
});
test('Serialized atomic writes; corrupt JSON is preserved',async()=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'tutien-store-')),file=path.join(folder,'saved.json'),store=new JsonStore();
  await Promise.all(Array.from({length:20},(_,i)=>store.write(file,{schemaVersion:1,i})));
  assert.equal((await store.read(file)).i,19);await writeFile(file,'{invalid');await assert.rejects(store.read(file,{}));assert.equal(await readFile(file,'utf8'),'{invalid');
});
test('HTTP, validation, WebSocket reload/reconnect, config restart, real-data isolation',async t=>{
  const folder=await mkdtemp(path.join(os.tmpdir(),'tutien-http-'));await mkdir(path.join(folder,'data'),{recursive:true});const real=path.join(folder,'data/players.json');await writeFile(real,'{"schemaVersion":1,"players":[{"userId":"real-preserve"}]}');
  let app=await createApplication({dataRoot:folder,port:0});let port=await app.listen();t.after(async()=>app.close());
  let base=`http://127.0.0.1:${port}`;
  const post=async(body,headers={})=>fetch(`${base}/api/control`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  for(const route of ['/','/health'])assert.equal((await fetch(base+route)).status,200,route);
  assert.equal((await post({action:'demo',value:30})).status,200);assert.equal(app.engine.players.size,30);
  assert.equal((await post({action:'demo',value:-1})).status,400);
  assert.equal((await post({action:'graphics',value:'invalid'})).status,400);
  assert.equal((await post({action:'demo',value:30},{Origin:'https://evil.example'})).status,403);
  const badHostStatus=await new Promise((resolve,reject)=>{const req=request(base+'/api/state',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});
  assert.equal(badHostStatus,403);
  async function snapshot(){return new Promise((resolve,reject)=>{const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);const timeout=setTimeout(()=>{ws.terminate();reject(new Error('WS timeout'));},3000);ws.once('error',reject);ws.once('message',data=>{clearTimeout(timeout);ws.close();resolve(JSON.parse(data));});});}
  const first=await snapshot(),second=await snapshot();assert.equal(first.payload.players.length,30);assert.equal(second.payload.players.length,30);assert.ok(second.seq>first.seq);
  await post({action:'graphics',value:'low'});await post({action:'camera',value:'orbit'});await app.close();
  app=await createApplication({dataRoot:folder,port:0});port=await app.listen();base=`http://127.0.0.1:${port}`;
  assert.equal(app.engine.players.size,30);assert.equal(app.engine.config.graphics,'low');assert.equal(app.engine.config.camera,'orbit');
  await post({action:'clearDemo'});assert.equal(app.engine.players.size,0);assert.match(await readFile(real,'utf8'),/real-preserve/);
});
