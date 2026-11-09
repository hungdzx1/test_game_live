import test from 'node:test';import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';import {createPlayer,migratePlayer,validateSave} from '../playerStore.js';
import {createApplication} from '../server.js';import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {WebSocket} from 'ws';

test('Permanent root x3: new receipt, duplicates, additive buffs, cap and exact expiry',()=>{
 const e=new GameEngine([createPlayer('p','Đạo hữu')]),p=e.getPlayer('p');p.inventory.root=4;
 e.items.receiveItem(p,'root',3);assert.equal(p.spiritualRootMultiplier,3);assert.equal(p.inventory.root,6);assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,6);
 e.setPhase('cultivation');assert.throws(()=>e.items.useItem(p,'root'));assert.equal(p.inventory.root,6);
 e.items.receiveItem(p,'tea');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,10);
 e.items.receiveItem(p,'blessing');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,14);
 e.items.receiveItem(p,'tea');assert.equal(e.items.getEffectiveStats(p).cultivationPerSecond,16);
 p.buffs=[];e.globalBuffs=[];e.tick(250);assert.equal(p.cultivation,1.5);assert.equal(p.spiritualRootMultiplier,3);
 const saved=e.exportState(),r=new GameEngine(saved.players,{}, {saved});assert.equal(r.getPlayer('p').spiritualRootMultiplier,3);assert.equal(r.getPlayer('p').inventory.root,6);
});

test('Saved x2 root upgrades to x3 without consuming items, mutating input, or accepting invalid multipliers',()=>{
 const old=createPlayer('old','Tu sĩ cũ');old.spiritualRootMultiplier=2;old.inventory.root=7;old.cultivation=42;old.pendingExp=5;old.buffs=[{kind:'tea',multiplier:2,remainingMs:12345}];const bytes=JSON.stringify(old);
 const p=migratePlayer(old);assert.equal(p.spiritualRootMultiplier,3);assert.deepEqual({...p,spiritualRootMultiplier:2},old);assert.equal(JSON.stringify(old),bytes);
 const saved=validateSave({schemaVersion:2,players:[old]});assert.equal(saved.players[0].spiritualRootMultiplier,3);assert.equal(migratePlayer(p).spiritualRootMultiplier,3);assert.equal(migratePlayer(createPlayer('new','Mới')).spiritualRootMultiplier,1);
 for(const value of [0,1.5,4,NaN,'3',null])assert.throws(()=>migratePlayer({...old,spiritualRootMultiplier:value}));
});

test('HTTP/WS and restart expose root x3; old DEMO and LIVE files migrate independently without losing stock',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'tutien-root3-')),demoFile=path.join(dir,'data/demo/players.json'),liveFile=path.join(dir,'data/players.json');await mkdir(path.dirname(demoFile),{recursive:true});
 const make=id=>{const e=new GameEngine([createPlayer(id,'Tu sĩ')]),s=e.exportState();s.players[0].spiritualRootMultiplier=2;s.players[0].inventory.root=5;s.players[0].cultivation=42;return JSON.stringify(s);};
 await writeFile(demoFile,make('demo-old'));const liveBytes=make('live-old');await writeFile(liveFile,liveBytes);
 let app=await createApplication({dataRoot:dir,port:0});t.after(async()=>app.close());let base=`http://127.0.0.1:${await app.listen()}`;
 const post=async(action,value,userId='demo-old')=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.equal(r.status,200,await r.text());};
 assert.equal(app.engine.getPlayer('demo-old').spiritualRootMultiplier,3);assert.equal(await readFile(liveFile,'utf8'),liveBytes);
 const ws=new WebSocket(base.replace('http','ws')+'/ws');t.after(()=>ws.terminate());
 const state=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No WebSocket snapshot')),5000);ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state:snapshot'){clearTimeout(timer);resolve(m.payload);}});});
 assert.equal(state.players[0].spiritualRootMultiplier,3);assert.equal(state.players[0].cultivationPerSecond,6);
 await post('grantItem','root');assert.equal(app.engine.getPlayer('demo-old').inventory.root,6);ws.terminate();await app.close();
 const disk=JSON.parse(await readFile(demoFile,'utf8'));assert.equal(disk.players[0].spiritualRootMultiplier,3);assert.equal(disk.players[0].inventory.root,6);assert.equal(disk.players[0].cultivation,42);assert.equal(await readFile(liveFile,'utf8'),liveBytes);
 app=await createApplication({dataRoot:dir,port:0});base=`http://127.0.0.1:${await app.listen()}`;assert.equal(app.engine.getPlayer('demo-old').inventory.root,6);assert.equal(app.engine.getPlayer('demo-old').spiritualRootMultiplier,3);
 // The same load/validation path used for LIVE upgrades the entitlement in memory.
 const live=validateSave(JSON.parse(await readFile(liveFile,'utf8')));assert.equal(live.players[0].spiritualRootMultiplier,3);assert.equal(live.players[0].inventory.root,5);assert.equal(await readFile(liveFile,'utf8'),liveBytes);
});
