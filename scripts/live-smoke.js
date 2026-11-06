// Standalone application smoke test. Only loopback HTTP/WS and disposable demo data.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createApplication} from '../server.js';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-live-smoke-'));
const app=await createApplication({dataRoot,port:0});
const checks=[];
try{
  const port=await app.listen(),base=`http://127.0.0.1:${port}`;
  async function post(action,value,userId='demo-smoke'){
    const response=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});
    assert.equal(response.status,200,`${action}: ${await response.text()}`);
  }
  const state=async()=>(await (await fetch(base+'/api/state')).json()).payload;
  async function until(fn){const end=Date.now()+8000;while(Date.now()<end){if(await fn())return;await delay(50);}throw new Error('Smoke timeout');}
  for(const route of ['/','/song','/js/livePanel.js','/js/liveOverlay.js'])assert.equal((await fetch(base+route)).status,200);
  await post('demo',30);await post('command',{text:'nhập môn',name:'Đạo Hữu Thử',eventId:'smoke-join'});
  const gift={loai:'qua',userId:'demo-smoke',ten:'Đạo Hữu Thử',giftId:'5655',qua:'Hồng demo',soKimCuong:1,soLuong:1};
  for(const count of [1,3,5])await post('demoLiveEvent',{...gift,eventId:`combo-${count}`,soLuong:count,rawMeta:{giftType:1,comboId:'smoke-combo',repeatEnd:false}});
  const final={...gift,eventId:'combo-final',soLuong:5,rawMeta:{giftType:1,comboId:'smoke-combo',repeatEnd:true}};
  await post('demoLiveEvent',final);await post('demoLiveEvent',final);
  assert.equal(app.engine.getPlayer('demo-smoke').buffs.length,5);checks.push('Combo 1/3/5 → five tea uses once, duplicate ignored');
  await post('phase','battle');const p=app.engine.getPlayer('demo-smoke'),exp=p.cultivation,buffMs=p.buffs[0].remainingMs;
  await post('command',{text:'1',eventId:'smoke-skill-1'});await post('command',{text:'2',eventId:'smoke-skill-2'});
  await post('demoLiveEvent',{...gift,eventId:'battle-pill',soKimCuong:10,rawMeta:{giftType:0}});
  await post('demoLiveEvent',{eventId:'smoke-likes',loai:'tim',userId:'demo-smoke',ten:p.name,soLuong:1000});
  await post('demoLiveEvent',{eventId:'smoke-follow',loai:'theodoi',userId:'demo-smoke',ten:p.name});
  await post('demoLiveEvent',{eventId:'smoke-enter',loai:'vao',userId:'demo-smoke',ten:p.name});
  assert.equal(p.inventory.pill,1);assert.equal(p.breakthrough.pillCount,0);assert.equal(p.cultivation,exp);assert.equal(p.buffs[0].remainingMs,buffMs);checks.push('Battle skills, gift inventory and wish pending; EXP/buff clock frozen');
  await post('demoConnection','connect');await until(async()=>(await state()).tiktok.state==='connected');await post('demoConnection','drop');
  await until(async()=>(await state()).tiktok.state==='reconnecting');const elapsed=app.engine.elapsedMs;
  await until(async()=>(await state()).tiktok.state==='connected');assert.ok(app.engine.elapsedMs>elapsed);checks.push('Demo transport recovers after real five-second delay while game continues');
  await post('demoConnection','offline');await until(async()=>(await state()).tiktok.code==='offline');await post('demoConnection','disconnect');
  await post('phase','cultivation');await until(()=>p.inventory.pill===0&&(p.breakthrough.pillCount===1||app.engine.breakthrough.active?.userId===p.userId&&app.engine.breakthrough.active.probability===100));assert.equal(p.inventory.pill,0);assert.ok(p.questState.points>=1);checks.push('Return applies deferred pill before next breakthrough roll and grants community points');
  await post('phase','paused');const disk=JSON.parse(await readFile(path.join(dataRoot,'data/demo/players.json'),'utf8'));assert.equal(disk.players.length,31);assert.ok(disk.runtime.interactions.seen.length>0);
  await assert.rejects(readFile(path.join(dataRoot,'data/players.json'),'utf8'),error=>error.code==='ENOENT');checks.push('Only temporary demo file written; real players file untouched');
  const report={timestamp:new Date().toISOString(),version:'0.4.0',result:'PASS',checks,players:disk.players.length,liveReality:'CHƯA KIỂM CHỨNG LIVE THẬT'};
  await writeFile(new URL('../test-results/phase4-smoke.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await app.close();}
