import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {giftRulesFor} from '../liveConfig.js';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn){const end=Date.now()+5000;while(Date.now()<end){if(await fn())return;await delay(20);}throw new Error('Không đạt điều kiện trong 5s.');}
async function temp(){const root=await mkdtemp(path.join(os.tmpdir(),'tutien-phase4-'));await mkdir(path.join(root,'data/demo'),{recursive:true});return root;}
const post=(base,action,value,userId,headers={})=>fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({action,value,userId})});
const native=(message,extra={})=>({common:{msgId:String(message),roomId:'999'},user:{id:'123',nickname:'Live Viewer'},...extra});
class Connector extends EventEmitter{
  constructor(){super();this.roomId='999';this.isConnected=false;}
  async connect(){this.isConnected=true;return {isConnected:true,roomId:this.roomId};}
  async disconnect(){this.isConnected=false;}
}
async function wsSnapshot(port){const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);try{return await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('WS timeout')),3000);ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='state:snapshot'){clearTimeout(timer);resolve(m.payload);}});});}finally{ws.terminate();}}
test('04-12/17 demo HTTP pipeline, mapping restart, combo replay disk persistence and real data isolation',async t=>{
  const root=await temp(),real=path.join(root,'data/players.json'),file=path.join(root,'data/demo/players.json');await writeFile(real,'{"sentinel":"never-touch"}');
  let app=await createApplication({dataRoot:root,port:0}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  for(const route of ['/','/song','/js/livePanel.js','/js/liveOverlay.js'])assert.equal((await fetch(base+route)).status,200);
  await post(base,'demo',10);await post(base,'phase','battle');
  const rule={...giftRulesFor()[0],id:'override',giftId:'5655',item:'root',quantity:2};assert.equal((await post(base,'giftRules',[rule])).status,200);
  const event={eventId:'http-gift',userId:'demo-1',ten:'Demo',loai:'qua',giftId:'5655',qua:'Demo',soKimCuong:1,soLuong:5,rawMeta:{giftType:1,repeatEnd:true,comboId:'http-combo'}};
  assert.equal((await post(base,'demoLiveEvent',event)).status,200);assert.equal(app.engine.getPlayer('demo-1').inventory.root,10);const oldId=app.engine.battle.current.id;
  await post(base,'phase','paused');const disk=JSON.parse(await readFile(file,'utf8'));assert.equal(disk.runtime.interactions.version,1);assert.ok(disk.runtime.interactions.seen.length>0);
  await app.close();app=await createApplication({dataRoot:root,port:0});port=await app.listen();base=`http://127.0.0.1:${port}`;
  assert.equal(app.engine.config.giftRules[0].item,'root');assert.equal(app.engine.battle.current.id,oldId);await post(base,'demoLiveEvent',{...event,eventId:'after-restart'});assert.equal(app.engine.getPlayer('demo-1').inventory.root,10);
  assert.equal(await readFile(real,'utf8'),'{"sentinel":"never-touch"}');assert.equal((await post(base,'giftRules',[rule,{...rule,id:'duplicate'}])).status,400);
});
test('04-16 real adapter→bus→engine→disk→WS, separate sessions, disconnect keeps game running, no signing secret leaks',async t=>{
  const root=await temp(),all=[];let app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{const c=new Connector();all.push(c);return c;}}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  await post(base,'demo',10);await post(base,'phase','paused');const demoFile=path.join(root,'data/demo/players.json'),realFile=path.join(root,'data/players.json'),demoBefore=await readFile(demoFile,'utf8');
  assert.equal((await post(base,'liveConnect',{username:'tester'})).status,400);assert.equal((await post(base,'mode','live')).status,200);assert.equal(app.engine.players.size,0);
  assert.equal((await post(base,'liveConnect',{username:'@tester',signApiKey:'PRIVATE_MEMORY_ONLY'})).status,200);await until(()=>app.adapter.snapshot().state==='connected');
  all[0].emit('chat',native(1,{comment:'nhập môn'}));await until(()=>app.engine.players.has('tt:123'));assert.equal(app.engine.mode,'live');
  await post(base,'phase','battle');const p=app.engine.getPlayer('tt:123'),exp=p.cultivation;
  all[0].emit('chat',native(2,{comment:'1'}));all[0].emit('gift',native(3,{giftId:'5655',gift:{type:1,diamondCount:1,name:'Hồng'},repeatCount:3,repeatEnd:1,groupId:'777'}));
  await until(()=>p.inventory.tea===3);assert.ok(app.engine.battle.current.fields[0].participants['tt:123'].damage>=20);assert.equal(p.cultivation,exp);
  await until(async()=>JSON.parse(await readFile(realFile,'utf8')).players[0]?.inventory.tea===3);
  const state=await wsSnapshot(port);assert.equal(state.mode,'live');assert.equal(state.players[0].userId,'tt:123');assert.equal(state.interactions.giftBanner.item,'tea');assert.equal(JSON.stringify(state).includes('PRIVATE_MEMORY_ONLY'),false);
  assert.equal((await post(base,'demoLiveEvent',{eventId:'fake',userId:'fake',loai:'tim',soLuong:1000})).status,400);assert.equal((await post(base,'clearDemo')).status,400);assert.equal((await post(base,'prepareBreakthrough',undefined,'tt:123')).status,400);
  await post(base,'liveDisconnect');const elapsed=app.engine.elapsedMs;await until(()=>app.engine.elapsedMs>elapsed);assert.equal(app.adapter.snapshot().state,'disconnected');assert.ok(app.engine.players.has('tt:123'));
  for(const file of [realFile,path.join(root,'caidat.json')])assert.equal((await readFile(file,'utf8')).includes('PRIVATE_MEMORY_ONLY'),false);
  assert.equal(await readFile(demoFile,'utf8'),demoBefore);await post(base,'mode','demo');assert.equal(app.engine.players.size,10);assert.equal(app.engine.phase,'paused');
});
test('CSRF token browser writes, cross-origin/metadata denial, secret settings rejected and storage errors pause LIVE',async t=>{
  const root=await temp(),app=await createApplication({dataRoot:root,port:0}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  const browser={Origin:base,'Sec-Fetch-Site':'same-origin'};
  assert.equal((await post(base,'demo',10,undefined,browser)).status,403);
  const session=await (await fetch(base+'/api/admin-session')).json();assert.equal((await post(base,'demo',10,undefined,{...browser,'X-CSRF-Token':session.token})).status,200);
  assert.equal((await post(base,'demo',10,undefined,{'Sec-Fetch-Site':'cross-site','X-CSRF-Token':session.token})).status,403);
  assert.equal((await post(base,'liveSettings',{signApiKey:'DO_NOT_STORE'})).status,400);assert.equal((await post(base,'mode','live')).status,200);
  await post(base,'phase','cultivation');await mkdir(path.join(root,'data/players.json.tmp'));assert.equal((await post(base,'phase','paused')).status,500);assert.equal(app.engine.phase,'paused');assert.equal((await (await fetch(base+'/health')).json()).ok,false);
});
test('Demo offline/drop/reconnect uses real adapter state machine without any live factory/network calls',async t=>{
  const root=await temp();let realCreated=0;const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{realCreated++;return new Connector();}}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  await post(base,'demo',10);await post(base,'demoConnection','offline');await until(async()=>(await (await fetch(base+'/api/state')).json()).payload.tiktok.code==='offline');
  await post(base,'demoConnection','connect');await until(async()=>(await (await fetch(base+'/api/state')).json()).payload.tiktok.state==='connected');
  await post(base,'demoConnection','drop');await until(async()=>(await (await fetch(base+'/api/state')).json()).payload.tiktok.state==='reconnecting');
  const state=(await (await fetch(base+'/api/state')).json()).payload;assert.equal(state.mode,'demo');assert.equal(state.players.length,10);assert.equal(realCreated,0);
  await post(base,'demoConnection','disconnect');await until(async()=>(await (await fetch(base+'/api/state')).json()).payload.tiktok.state==='disconnected');
});
test('LIVE input burst is bounded/batched; flooding cannot grow notices indefinitely or stop simulation',async t=>{
  const root=await temp();let connection;
  const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>connection=new Connector()}),port=await app.listen(),base=`http://127.0.0.1:${port}`;t.after(()=>app.close());
  await post(base,'mode','live');await post(base,'liveConnect',{username:'tester'});await until(()=>app.adapter.snapshot().state==='connected');connection.emit('chat',native(1,{comment:'nhập môn'}));await until(()=>app.engine.players.size===1);
  const elapsed=app.engine.elapsedMs;
  for(let i=0;i<2500;i++)connection.emit('follow',native(i+100));
  await until(()=>app.engine.elapsedMs>=elapsed+750);
  assert.equal(app.engine.players.size,1);assert.ok(app.engine.liveEvents.log.length<=50);assert.ok(app.engine.events.length<=100);assert.equal(app.engine.events.filter(e=>e.kind==='live:follow').length,1);assert.ok(app.engine.liveEvents.log.some(e=>e.message.includes('quá tải')));assert.equal((await (await fetch(base+'/health')).json()).ok,true);
});
test('NGAT while network connect is pending cancels intent without blocking game ticks or accepting late events',async t=>{
  const root=await temp();let resolve,connection;
  const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{connection=new Connector();connection.connect=()=>new Promise(r=>resolve=r);return connection;}}),port=await app.listen(),base=`http://127.0.0.1:${port}`;
  t.after(async()=>{resolve?.({isConnected:true});await app.close();});
  await post(base,'mode','live');await post(base,'liveConnect',{username:'tester'});assert.equal(app.adapter.snapshot().state,'connecting');
  assert.equal((await post(base,'liveDisconnect')).status,200);const elapsed=app.engine.elapsedMs;await until(()=>app.engine.elapsedMs>=elapsed+100);assert.equal(app.adapter.snapshot().state,'disconnecting');
  connection.emit('chat',native(1,{comment:'nhập môn'}));assert.equal(app.engine.players.size,0);connection.isConnected=true;resolve({isConnected:true});await until(()=>app.adapter.snapshot().state==='disconnected');assert.equal(app.engine.players.size,0);assert.equal(connection.isConnected,false);
});
