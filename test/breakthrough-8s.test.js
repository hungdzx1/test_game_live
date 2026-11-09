import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {WebSocket} from 'ws';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';import {rulesFor} from '../cultivationConfig.js';import {createApplication} from '../server.js';
function advance(e,ms){while(ms>0){const step=Math.min(250,ms);e.tick(step);ms-=step;}}
function start(duration=8000,rng=()=>0){const p=createPlayer('eight','Đạo hữu tám giây');p.stageIndex=3;const e=new GameEngine([p],{cultivation:{breakthroughDurationMs:duration}},{rng});e.setPhase('cultivation');e.breakthrough.enqueue(e.getPlayer('eight'));e.tick(1);return e;}
async function until(check){const end=Date.now()+5000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out waiting for eight-second ceremony');}

test('Eight-second ritual: config and exact completion boundary preserve success/failure and cooldown',async()=>{
 assert.equal(rulesFor().breakthroughDurationMs,8000);assert.equal(JSON.parse(await readFile(new URL('../caidat.json',import.meta.url),'utf8')).cultivation.breakthroughDurationMs,8000);
 for(const duration of [8000,12000,20000])assert.equal(rulesFor({breakthroughDurationMs:duration}).breakthroughDurationMs,duration);
 for(const duration of [7999,20001,NaN])assert.throws(()=>rulesFor({breakthroughDurationMs:duration}));
 for(const success of [true,false]){const e=start(8000,()=>success?0:.999),id=e.breakthrough.active.id;assert.equal(e.snapshot().payload.breakthrough.durationMs,8000);advance(e,7999);assert.equal(e.breakthrough.active.elapsedMs,7999);assert.equal(e.getPlayer('eight').realmIndex,0);assert.equal(e.events.some(v=>v.kind==='breakthrough:completed'),false);e.tick(1);assert.equal(e.breakthrough.active,null);assert.equal(e.breakthrough.lastResult.id,id);assert.equal(e.getPlayer('eight').realmIndex,success?1:0);assert.equal(e.getPlayer('eight').breakthrough.cooldownRemainingCultivationMs,success?0:60000);e.breakthrough.complete();assert.equal(e.events.filter(v=>v.kind==='breakthrough:completed').length,1);}
});

test('Eight-second ritual: restart preserves 8/12/20-second saves without reroll, pause/battle freeze and new rituals use eight',()=>{
 for(const duration of [8000,12000,20000]){
  const e=start(duration,()=>.999);advance(e,2000);const saved=e.exportState(),active=structuredClone(saved.runtime.active);
  const restored=new GameEngine(saved.players,{}, {saved,rng:()=>{throw Error('Must not reroll');}});assert.equal(restored.rules.breakthroughDurationMs,8000);assert.deepEqual(restored.breakthrough.active,active);
  for(const phase of ['stopped','paused','battle']){restored.setPhase(phase);advance(restored,500);assert.deepEqual(restored.breakthrough.active,active);}
  restored.setPhase('cultivation');advance(restored,duration-2001);assert.equal(restored.breakthrough.active.id,active.id);restored.tick(1);assert.equal(restored.breakthrough.active,null);assert.equal(restored.getPlayer('eight').breakthrough.failedAttempts,1);
 }
 const e=start(12000);advance(e,9000);const saved=e.exportState();assert.doesNotThrow(()=>new GameEngine(saved.players,{}, {saved}));
 for(const duration of [7999,20001]){const bad=structuredClone(saved);bad.runtime.active.durationMs=duration;bad.runtime.active.elapsedMs=1000;assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}));}
});

test('Eight-second ritual: real HTTP/WS broadcasts 8000ms and durable restart retains active ritual and real-data sentinel',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'tutien-eight-'));await mkdir(path.join(root,'data'),{recursive:true});const real=path.join(root,'data/players.json');await writeFile(real,'{"sentinel":"eight"}');
 let app=await createApplication({dataRoot:root,port:0}),port=await app.listen();t.after(()=>app.close());app.engine.join(createPlayer('eight-api','Đạo hữu tám giây'));
 const notices=[];const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());ws.on('message',b=>{const e=JSON.parse(b);if(e.type==='game:event'&&e.payload.kind==='breakthrough:started')notices.push(e.payload);});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 async function control(action,value){const response=await fetch(`http://127.0.0.1:${port}/api/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId:'eight-api'})});assert.equal(response.status,200,await response.text());}
 await control('phase','cultivation');await control('prepareBreakthrough');await until(()=>notices.length>0);assert.equal(notices[0].durationMs,8000);await control('phase','paused');
 const saved=JSON.parse(await readFile(path.join(root,'data/demo/players.json'),'utf8'));assert.equal(saved.runtime.active.durationMs,8000);const id=saved.runtime.active.id;ws.terminate();await app.close();app=await createApplication({dataRoot:root,port:0});port=await app.listen();assert.equal(app.engine.breakthrough.active.id,id);assert.equal(app.engine.breakthrough.active.durationMs,8000);assert.equal(app.engine.breakthrough.active.outcome,saved.runtime.active.outcome);assert.equal(await readFile(real,'utf8'),'{"sentinel":"eight"}');
});
