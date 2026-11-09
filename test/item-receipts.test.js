import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {createApplication} from '../server.js';
const receipts=e=>e.events.filter(v=>v.kind==='item:received');
test('Item receipt reports the actual successful grant once, with no award on use or invalid grant',()=>{
  const e=new GameEngine([createPlayer('receipt','Viewer')]);e.setPhase('cultivation');const p=e.getPlayer('receipt');
  for(const item of ['tea','pill','root'])e.items.grantItem(p,item,3,'admin_demo');
  assert.deepEqual(receipts(e).map(v=>[v.userId,v.item,v.count,v.source]),['tea','pill','root'].map(item=>['receipt',item,3,'admin_demo']));
  assert.equal(new Set(receipts(e).map(v=>v.eventId)).size,3);assert.ok(receipts(e).every(v=>v.itemName&&Number.isFinite(v.timestamp)));
  e.items.useItem(p,'tea');assert.equal(receipts(e).length,3);assert.equal(p.inventory.tea,2);
  for(const count of [0,-1,101,1.5])assert.throws(()=>e.items.grantItem(p,'tea',count));
  assert.equal(receipts(e).length,3);assert.equal(p.inventory.tea,2);
});
test('Rapid gifts bypass only notice cooldown; combo and waiting gifts report exactly the delivered item quantity',()=>{
  const e=new GameEngine([createPlayer('joined','Viewer')]);e.setPhase('cultivation');
  const gift=(id,userId,count=1,meta={})=>({source:'demo',loai:'qua',eventId:id,userId,ten:'Viewer',giftId:'5655',qua:'Rose',soKimCuong:1,soLuong:count,rawMeta:{streamId:'receipt',giftType:0,...meta}});
  for(let i=0;i<3;i++)assert.equal(e.liveEvents.accept(gift('fast'+i,'joined')).accepted,true);
  assert.equal(e.events.filter(v=>v.kind==='live:gift').length,1);assert.equal(receipts(e).length,3);
  e.liveEvents.accept(gift('fast0','joined'));assert.equal(receipts(e).length,3);
  e.liveEvents.accept(gift('combo-pending','joined',5,{giftType:1,comboId:'combo',repeatEnd:false}));assert.equal(receipts(e).length,3);
  e.liveEvents.accept(gift('combo-end','joined',5,{giftType:1,comboId:'combo',repeatEnd:true}));
  assert.equal(receipts(e).at(-1).count,5);assert.equal(receipts(e).reduce((sum,r)=>sum+r.count,0),8);
  e.liveEvents.accept(gift('waiting','new',4));assert.equal(receipts(e).length,4);
  e.join(createPlayer('new','New Viewer'));e.liveEvents.deliver('new');
  assert.equal(receipts(e).at(-1).count,4);assert.equal(receipts(e).at(-1).userId,'new');
  e.liveEvents.deliver('new');assert.equal(receipts(e).length,5);
});
test('Committed receipt reaches WebSocket and inventory persists after server restart without replaying the award',async t=>{
  const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-item-receipts-'));
  let app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE');}});t.after(()=>app.close());
  let port=await app.listen();const events=[];const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());
  ws.on('message',raw=>{const message=JSON.parse(raw);if(message.type==='game:event')events.push(message.payload);});
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  const id='api-receipt';app.engine.join(createPlayer(id,'API Viewer'));const before=app.engine.getPlayer(id).inventory.tea;
  const response=await fetch(`http://127.0.0.1:${port}/api/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'grantItem',userId:id,value:'tea'})});
  assert.equal(response.status,200);
  const deadline=Date.now()+5000;while(!events.some(v=>v.kind==='item:received')){assert.ok(Date.now()<deadline,'Receipt WS timeout');await new Promise(r=>setTimeout(r,20));}
  assert.equal(events.find(v=>v.kind==='item:received').count,1);assert.equal(app.engine.getPlayer(id).inventory.tea,before);assert.equal(app.engine.getPlayer(id).buffs[0].remainingMs,60000);
  ws.terminate();await app.close();app=await createApplication({dataRoot,port:0});
  assert.equal(app.engine.getPlayer(id).inventory.tea,before);assert.equal(app.engine.getPlayer(id).buffs[0].remainingMs,60000);assert.equal(receipts(app.engine).length,0);
});
