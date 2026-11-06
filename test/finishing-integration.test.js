import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {JsonStore} from '../storage.js';
import {EventEmitter} from 'node:events';

async function setup(t){const root=await mkdtemp(path.join(os.tmpdir(),'tutien-phase5-'));const app=await createApplication({dataRoot:root,port:0}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());const get=async p=>{const r=await fetch(base+p);assert.equal(r.status,200);return r.json();};const post=(action,value,userId)=>fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});return {root,app,base,get,post};}
test('05-11/12/16 Dashboard real counts, no fabricated FPS, telemetry validation and all settings persist without partial invalid save',async t=>{
  const {root,app,base,get,post}=await setup(t);await post('demo',500);await post('phase','paused');
  const d=await get('/api/dashboard');assert.equal(d.players,500);assert.equal(d.realms.reduce((a,r)=>a+r.count,0),500);assert.deepEqual(d.renderReports,[]);assert.ok(d.load.rssMB>0);
  for(const [action,value]of [['audioSettings',{enabled:false,masterVolume:.25}],['displaySettings',{damageNumbers:false,shadows:false,particleScale:.5}],['cameraSettings',{minShotMs:2500,priorities:{gift:4}}],['camera','followBoss'],['balanceSettings',{boss:{difficultyK:[.5,.7,.9]},quests:{cultivateExp:45}}]])assert.equal((await post(action,value)).status,200);
  const file=path.join(root,'caidat.json'),before=await readFile(file,'utf8');assert.equal((await post('audioSettings',{masterVolume:2})).status,400);assert.equal((await post('balanceSettings',{boss:{difficultyK:[.5]}})).status,400);assert.equal(await readFile(file,'utf8'),before);
  const cfg=JSON.parse(before);assert.equal(cfg.audio.enabled,false);assert.equal(cfg.display.damageNumbers,false);assert.equal(cfg.cameraDirector.priorities.result,5);assert.equal(cfg.cameraDirector.priorities.gift,4);assert.equal(cfg.cultivation.quests.cultivateExp,45);
  const snapshot=await get('/api/state'),report={clientId:'test-renderer',sessionId:snapshot.sessionId,fps:29.5,drawCalls:250,triangles:10000,geometries:30,textures:4,rendered:60,quality:'medium'};
  const telemetry=v=>fetch(base+'/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)});
  assert.equal((await telemetry({...report,sessionId:'old'})).status,400);assert.equal((await telemetry(report)).status,200);assert.equal((await telemetry(report)).status,429);assert.equal((await get('/api/dashboard')).renderReports[0].fps,29.5);assert.equal(app.engine.players.size,500);
});
test('05-18 Backup/restore/reset confirmation, automatic pre-change backup, invalid file preserves data and demo/LIVE isolation',async t=>{
  const {root,app,get,post}=await setup(t);await post('demo',10);await post('phase','paused');
  const real=path.join(root,'data/players.json');await writeFile(real,'{"sentinel":"keep-real-bytes"}');const bundle=await get('/api/backup');assert.equal(bundle.mode,'demo');assert.equal(bundle.state.players.length,10);
  assert.equal((await post('resetData',{})).status,400);assert.equal(app.engine.players.size,10);
  const c=await get('/api/data-confirmation?purpose=reset');assert.equal((await post('resetData',{...c,phrase:'RESET LIVE'})).status,400);assert.equal(app.engine.players.size,10);
  const reset=await get('/api/data-confirmation?purpose=reset');assert.equal((await post('resetData',reset)).status,200);assert.equal(app.engine.players.size,0);assert.equal((await post('resetData',reset)).status,400);
  const restore=await get('/api/data-confirmation?purpose=restore');assert.equal((await post('restoreData',{...restore,bundle:{...bundle,mode:'live'}})).status,400);assert.equal(app.engine.players.size,0);
  assert.equal((await post('restoreData',{...restore,bundle})).status,200);assert.equal(app.engine.players.size,10);assert.equal(app.engine.phase,'stopped');
  const backups=await readdir(path.join(root,'data/backups'));assert.equal(backups.length,2);const states=await Promise.all(backups.map(async f=>JSON.parse(await readFile(path.join(root,'data/backups',f),'utf8'))));assert.deepEqual(states.map(s=>s.state.players.length).sort((a,b)=>a-b),[0,10]);assert.equal(await readFile(real,'utf8'),'{"sentinel":"keep-real-bytes"}');
});
test('05-24 Corrupt JSON and invalid semantic state are preserved with exact-byte backup, never silently reset',async()=>{
  for(const content of ['{broken JSON',JSON.stringify({schemaVersion:2,players:[],runtime:{elapsedMs:-1}})]){
    const root=await mkdtemp(path.join(os.tmpdir(),'tutien-corrupt-')),file=path.join(root,'data/demo/players.json');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,content);
    await assert.rejects(createApplication({dataRoot:root,port:0}));assert.equal(await readFile(file,'utf8'),content);const names=await readdir(path.dirname(file));const backup=names.find(n=>n.includes('.corrupt-'));assert.ok(backup);assert.equal(await readFile(path.join(path.dirname(file),backup),'utf8'),content);
  }
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-store-'));assert.deepEqual(await new JsonStore().read(path.join(root,'missing.json'),{safe:true}),{safe:true});
  await writeFile(path.join(root,'caidat.json'),'null');await assert.rejects(createApplication({dataRoot:root,port:0}));assert.ok((await readdir(root)).some(n=>n.includes('.corrupt-')));assert.equal(await readFile(path.join(root,'caidat.json'),'utf8'),'null');
});
test('05-25 Served frontend module graph and style links resolve locally without CDN/assets',async t=>{
  const {base}=await setup(t),visited=new Set();
  async function visit(url){assert.equal(new URL(url).origin,base);if(visited.has(url))return;visited.add(url);const r=await fetch(url);assert.equal(r.status,200,url);const text=await r.text();if(url.endsWith('.js'))for(const match of text.matchAll(/(?:^|\n)\s*import\s+(?:[^;\n]*?\sfrom\s*)?['"]([^'"]+)['"]/g)){const name=match[1];await visit(name==='three'?base+'/vendor/three/three.module.js':new URL(name,url).href);}}
  for(const page of ['/','/song']){const r=await fetch(base+page);assert.equal(r.status,200);const text=await r.text();for(const m of text.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))await visit(new URL(m[1],base).href);}
  assert.ok(visited.has(base+'/js/audio.js'));assert.ok(visited.has(base+'/vendor/three/three.core.js'));assert.ok(visited.size>20);
});
test('05-16/17 500 server players, 500 valid gifts and bounded secondary effects preserve all accepted contributions',()=>{
  const e=new GameEngine(Array.from({length:500},(_,i)=>createPlayer('p'+i,'Đạo hữu '+i,i)));e.setPhase('battle');
  for(let i=0;i<500;i++)assert.equal(e.liveEvents.accept({source:'demo',eventId:'gift-'+i,loai:'qua',userId:'p'+i,ten:'Test',giftId:'5655',qua:'Hồng',soKimCuong:1,soLuong:3,rawMeta:{giftType:0,streamId:'burst'}}).accepted,true);
  assert.equal([...e.players.values()].reduce((s,p)=>s+p.inventory.tea,0),1500);assert.equal(e.players.size,500);assert.ok(e.events.length<=100);assert.ok(e.liveEvents.log.length<=50);
  for(let i=0;i<500;i++)assert.equal(e.liveEvents.accept({source:'demo',eventId:'skill-'+i,loai:'binhluan',userId:'p'+i,ten:'Test',noiDung:'1',rawMeta:{streamId:'burst'}}).accepted,true);
  assert.equal(Object.values(e.battle.current.fields[0].participants).reduce((s,p)=>s+p.skillCount,0),500);
  const saved=e.exportState(),restored=new GameEngine(saved.players,{}, {saved});assert.equal([...restored.players.values()].reduce((s,p)=>s+p.inventory.tea,0),1500);assert.equal(restored.liveEvents.counters.accepted,1000);
});
test('05-17 Adapter gift burst above ordinary event rate/queue retains every contribution and deduplicates replay',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-gift-burst-'));let c;
  class Connector extends EventEmitter{async connect(){return {isConnected:true,roomId:'999'};}async disconnect(){}}
  const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>c=new Connector()}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  async function post(action,value){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200);}
  const wait=async fn=>{const end=Date.now()+10000;while(!fn()){assert.ok(Date.now()<end,'Gift processing timeout');await new Promise(r=>setTimeout(r,20));}};
  await post('mode','live');await post('liveConnect',{username:'tester'});await wait(()=>app.adapter.snapshot().state==='connected');
  const native=i=>({common:{msgId:String(i),roomId:'999'},user:{id:'123',nickname:'Demo'}});
  c.emit('chat',{...native(1),comment:'nhập môn'});await wait(()=>app.engine.players.size===1);await post('phase','battle');
  for(let i=0;i<1500;i++)c.emit('gift',{...native(i+100),giftId:'5655',gift:{type:0,diamondCount:1,name:'Hồng'},repeatCount:1});
  await wait(()=>app.engine.getPlayer('tt:123').inventory.tea===1500);
  c.emit('gift',{...native(100),giftId:'5655',gift:{type:0,diamondCount:1,name:'Hồng'},repeatCount:1});await post('phase','paused');
  assert.equal(app.engine.getPlayer('tt:123').inventory.tea,1500);assert.ok(app.engine.liveEvents.log.length<=50);assert.ok(app.engine.events.length<=100);
  const saved=JSON.parse(await readFile(path.join(root,'data/players.json'),'utf8'));assert.equal(saved.players[0].inventory.tea,1500);assert.ok(saved.runtime.interactions.counters.duplicates>=1);
});
