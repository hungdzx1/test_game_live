import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {VoiceCache,voiceName,wavInfo} from '../voiceCache.js';
import {VoiceService,VOICE_TEXT,vietnameseNumber,realmTail} from '../voiceService.js';
import {createApplication} from '../server.js';

export function fixtureWav(seconds=.1){const frames=Math.round(seconds*22050),b=Buffer.alloc(44+frames*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*2,40);for(let i=0;i<frames;i++)b.writeInt16LE(Math.round(5000*Math.sin(i*.05)),44+i*2);return b;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=5000){const end=Date.now()+ms;while(!fn()){assert.ok(Date.now()<end,'Voice test timeout');await sleep(10);}}
async function setup(t,{worker,now}={}){const directory=await mkdtemp(path.join(os.tmpdir(),'tutien-voice-')),events=[],calls=[];worker??={synthesize:async text=>{calls.push(text);return fixtureWav();}};const service=new VoiceService({directory,worker,now,emit:event=>events.push(event)}),engine=new GameEngine();engine.config.audio={enabled:true,speech:true};engine.setPhase('cultivation');service.configure(engine);await service.start();t.after(()=>service.close());return {service,engine,events,calls,directory};}
const event=(kind,userId,other={})=>({kind,userId,eventId:crypto.randomUUID(),timestamp:Date.now(),...other});
function join(service,engine,id,name){const player=createPlayer(id,name);engine.join(player);service.accept(event('player:joined',id),engine);}

test('Voice normalization, exact Vietnamese counts, validated WAV and cache keyed by content/voice',async t=>{
 assert.equal(voiceName(' 🌟 <b>Nguyễn</b>  Văn\u0000 A 🎁 '),'Nguyễn Văn A');assert.equal(voiceName('🎁💖'),'');assert.equal([...voiceName('A'.repeat(80))].length,40);
 for(const [n,text]of [[1,'một'],[10,'mười'],[11,'mười một'],[21,'hai mươi mốt'],[25,'hai mươi lăm'],[100,'một trăm'],[101,'một trăm lẻ một'],[499,'bốn trăm chín mươi chín']])assert.equal(vietnameseNumber(n),text);
 for(const n of [0,500,1.5])assert.throws(()=>vietnameseNumber(n));
 assert.equal(wavInfo(fixtureWav()).seconds,.1);assert.throws(()=>wavInfo(Buffer.alloc(44)));assert.throws(()=>wavInfo(fixtureWav().subarray(0,48)));
 const directory=await mkdtemp(path.join(os.tmpdir(),'tutien-voice-cache-'));let calls=0,release;
 const worker={synthesize:()=>{calls++;return new Promise(r=>release=()=>r(fixtureWav()));}},cache=new VoiceCache({directory,worker,version:'v1'});await cache.init();t.after(()=>cache.close());
 const a=cache.ensure('Tên A'),b=cache.ensure('Tên A');assert.equal(a,b);assert.equal(calls,1);release();const key=await a;assert.equal(await b,key);await cache.ensure('Tên A');assert.equal(calls,1);
 assert.notEqual(cache.key('Tên mới'),key);assert.notEqual(new VoiceCache({version:'v2'}).key('Tên A'),key);assert.equal(await cache.get('../players'),null);
 const restarted=new VoiceCache({directory,worker,version:'v1'});await restarted.init();assert.equal(restarted.has('Tên A'),true);assert.equal((await restarted.get(key)).length,fixtureWav().length);restarted.close();
});

test('Voice cache caps disk/RAM, coalesces misses and keeps good WAV on synthesis failure',async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'tutien-voice-lru-')),cache=new VoiceCache({directory,version:'x',maxBytes:fixtureWav().length*3,worker:{synthesize:async text=>text==='bad'?Buffer.alloc(1):fixtureWav()}});await cache.init();t.after(()=>cache.close());
 const fixed=await cache.ensure('fixed',{fixed:true});for(let i=0;i<8;i++)await cache.ensure('name'+i);assert.ok(cache.entries.size<=3);assert.ok(cache.entries.has(fixed));await assert.rejects(cache.ensure('bad'));assert.equal(cache.has('bad'),false);assert.ok(await cache.get(fixed));
 cache.maxBytes=1e9;for(let i=0;i<40;i++){const key=await cache.ensure('ram'+i);await cache.get(key);}assert.equal(cache.ram.size,32);assert.ok((await readdir(directory)).every(p=>/^[a-f0-9]{64}\.wav$/.test(p)));
});

test('Admission voice groups A + 10 others once, ignores duplicates/returns and freezes count after 1 second',async t=>{
 const {service,engine,events,calls}=await setup(t);const before=engine.exportState();
 join(service,engine,'a','Đạo A');for(let i=0;i<10;i++)join(service,engine,'u'+i,'Khác '+i);service.accept(event('player:joined','a'),engine);service.accept(event('player:returned','u0'),engine);
 await until(()=>events.length===1);assert.equal(events[0].count,11);assert.equal(events[0].text,'Chào mừng đạo hữu Đạo A cùng mười người khác gia nhập tông môn!');assert.equal(events[0].clips.length,5);assert.equal(events[0].fallbackOnly,false);assert.ok(Date.now()-events[0].createdAt>=990);assert.equal(calls.filter(x=>x.startsWith('Khác')).length,0);
 join(service,engine,'late','Đến sau');await until(()=>events.length===2);assert.equal(events[0].count,11);assert.equal(events[1].count,1);assert.equal(events[1].text,'Chào mừng đạo hữu Đến sau gia nhập tông môn!');assert.equal(engine.players.size,12);assert.equal(JSON.stringify(engine.exportState()).includes('voice:'),false);assert.equal(before.runtime.elapsedMs,engine.elapsedMs);
});

test('Admission bursts of 10/50/100 generate one voice per batch and only synthesize first name',async t=>{
 for(const n of [10,50,100]){const {service,engine,events,calls}=await setup(t);for(let i=0;i<n;i++)join(service,engine,'u'+i,'Tên '+i);await until(()=>events.length===1);assert.equal(events[0].count,n);assert.equal(events[0].text,`Chào mừng đạo hữu Tên 0 cùng ${vietnameseNumber(n-1)} người khác gia nhập tông môn!`);assert.equal(calls.filter(x=>x.startsWith('Tên ')).length,1);assert.equal(engine.players.size,n);service.close();}
});

test('Admission window is fixed even when timer delivery is late; unavailable Piper still emits text',async t=>{
 let time=100000;const {service,engine,events}=await setup(t,{now:()=>time});join(service,engine,'first','Đầu');time+=1000;join(service,engine,'next','Sau');await until(()=>events.length===1);assert.equal(events[0].count,1);assert.ok(events[0].text.includes('Đầu'));await until(()=>events.length===2);assert.equal(events[1].count,1);assert.ok(events[1].text.includes('Sau'));
 service.status='unavailable';service.accept(event('breakthrough:completed','first',{outcome:false,realmIndex:0}),engine);assert.equal(events[2].kind,'voice:notice');assert.ok(events[2].text.includes('Đầu'));
});

test('Voice synthesis admission stays bounded under concurrent unique names and rejects failed phonemes safely',async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'tutien-voice-overload-'));let release;const cache=new VoiceCache({directory,worker:{synthesize:()=>new Promise(r=>release=()=>r(fixtureWav())),close:()=>release?.()}});await cache.init();t.after(()=>cache.close());const first=cache.ensure('first');const rest=Array.from({length:128},(_,i)=>cache.ensure('queued '+i).catch(()=>null));assert.equal(cache.queue.length,128);await assert.rejects(cache.ensure('over limit'));release();await first;cache.close();await Promise.all(rest);
 const {service,engine,events}=await setup(t,{worker:{synthesize:async text=>{if(text==='Không đọc được')throw Error('Unsupported phonemes');return fixtureWav();}}});join(service,engine,'bad','Không đọc được');await until(()=>events.length===1);assert.equal(events[0].fallbackOnly,true);assert.equal(engine.players.size,1);
});

test('Slow/missing/failed names use complete fallback at deadline; late synthesis never speaks twice',async t=>{
 let release;const {service,engine,events}=await setup(t,{worker:{synthesize:async text=>text==='Chậm'?new Promise(r=>release=()=>r(fixtureWav())):fixtureWav()}});
 join(service,engine,'slow','Chậm');await until(()=>events.length===1);assert.ok(events[0].fallbackOnly);assert.deepEqual(events[0].clips,[service.cache.key(VOICE_TEXT.fallbackJoin)]);assert.ok(events[0].timestamp-events[0].createdAt>=1950);release();await until(()=>service.cache.has('Chậm'));await sleep(30);assert.equal(events.length,1);
 join(service,engine,'empty','🎁');await until(()=>events.length===2);assert.equal(events[1].fallbackOnly,true);
});

test('Donor attribution, confirmed outcome/new realm, event dedup, mute and session invalidation',async t=>{
 const {service,engine,events}=await setup(t);engine.join(createPlayer('x','Tên cũ'));
 const done=event('breakthrough:completed','x',{outcome:true,realmIndex:2});service.accept(done,engine);service.accept(done,engine);service.accept(event('blessing:activated',null,{source:'boss_reward'}),engine);
 service.accept(event('blessing:activated',null,{donor:{userId:'donor-a',name:'Ân Nhân'}}),engine);service.accept(event('breakthrough:completed','x',{outcome:false,realmIndex:2}),engine);
 await until(()=>events.length===3);assert.equal(events.filter(e=>e.voiceType==='donor').length,1);assert.ok(events.some(e=>e.text.includes(realmTail(engine.rules.realms[2].name))));assert.ok(events.some(e=>e.text.includes('Tên cũ')&&e.priority===2));
 engine.players.get('x').name='Tên mới';service.accept(event('breakthrough:completed','x',{outcome:false,realmIndex:2}),engine);await until(()=>events.length===4);assert.ok(events[3].text.includes('Tên mới'));
 join(service,engine,'cancel','Bị hủy');engine.transportId=crypto.randomUUID();service.configure(engine);await sleep(1100);assert.equal(events.length,4);
 engine.config.audio.speech=false;service.configure(engine);service.accept(event('breakthrough:completed','x',{outcome:false,realmIndex:2}),engine);await sleep(30);assert.equal(events.length,4);
});

test('Boss speech crosses server 10-second mark once per cycle, never on reconnect or per-boss intro',async t=>{
 const {service,engine,events}=await setup(t);engine.remainingMs=10100;service.observe(engine);engine.remainingMs=9900;service.observe(engine);await until(()=>events.length===1);assert.equal(events[0].voiceType,'boss');assert.equal(events[0].cycleId,engine.cycleId);
 for(let i=0;i<4;i++){service.observe(engine);service.accept(event('boss:appeared',null),engine);}await sleep(30);assert.equal(events.length,1);
 engine.transportId=crypto.randomUUID();service.configure(engine);service.observe(engine);await sleep(20);assert.equal(events.length,1);
 engine.cycleId=crypto.randomUUID();engine.remainingMs=12000;service.observe(engine);engine.remainingMs=9900;service.observe(engine);await until(()=>events.length===2);
});

test('Same-priority FIFO survives slow name A and cached name B while boss priority stays independent',async t=>{
 const {service,engine,events}=await setup(t,{worker:{synthesize:async text=>{if(text==='Người A')await sleep(150);return fixtureWav();}}});await service.cache.ensure('Người B');
 service.accept(event('blessing:activated',null,{donor:{userId:'a',name:'Người A'}}),engine);service.accept(event('blessing:activated',null,{donor:{userId:'b',name:'Người B'}}),engine);
 engine.remainingMs=10100;service.observe(engine);engine.remainingMs=9900;service.observe(engine);await until(()=>events.length===3);
 assert.equal(events[0].voiceType,'boss');assert.ok(events[1].text.includes('Người A'));assert.ok(events[2].text.includes('Người B'));
});

test('Voice HTTP/WS uses v1 optional event, safe read-only WAV route and preserves player saves across restart',async t=>{
 const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-voice-http-'));await mkdir(path.join(dataRoot,'data/demo'),{recursive:true});const initial=new GameEngine().exportState();await writeFile(path.join(dataRoot,'data/demo/players.json'),JSON.stringify(initial));
 const worker={synthesize:async()=>fixtureWav()},app=await createApplication({dataRoot,port:0,voiceWorker:worker});await app.listen();t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port;
 const before=await readFile(path.join(dataRoot,'data/demo/players.json'),'utf8');await fetch(base+'/api/voice/manifest');let manifest;await until(async()=>true);
 for(let i=0;i<200;i++){manifest=await(await fetch(base+'/api/voice/manifest')).json();if(manifest.prewarmed)break;await sleep(15);}assert.equal(manifest.ready,true);assert.equal(manifest.prewarmed,true);assert.equal(await readFile(path.join(dataRoot,'data/demo/players.json'),'utf8'),before);
 const key=manifest.clips.fallbackJoin,r=await fetch(base+'/api/voice/clip/'+key+'.wav');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/audio\/wav/);wavInfo(Buffer.from(await r.arrayBuffer()));assert.equal((await fetch(base+'/api/voice/clip/not-a-hash.wav')).status,404);assert.equal((await fetch(base+'/api/voice/manifest',{headers:{Origin:'https://evil.invalid'}})).status,403);
 const messages=[],ws=new WebSocket(base.replace('http:','ws:')+'/ws');t.after(()=>ws.terminate());ws.on('message',b=>messages.push(JSON.parse(b)));await until(()=>messages.length>0);
 app.engine.join(createPlayer('http-a','A'));app.engine.join(createPlayer('http-b','B'));await until(()=>messages.some(m=>m.payload.kind==='voice:announcement'));
 const voice=messages.find(m=>m.payload.kind==='voice:announcement');assert.equal(voice.version,1);assert.equal(voice.sessionId,app.engine.transportId);assert.equal(voice.payload.count,2);assert.equal(voice.payload.priority,1);
 ws.terminate();const replay=[],ws2=new WebSocket(base.replace('http:','ws:')+'/ws');t.after(()=>ws2.terminate());ws2.on('message',b=>replay.push(JSON.parse(b)));await until(()=>replay.length>0);await sleep(100);assert.equal(replay.some(m=>m.payload.kind==='voice:announcement'),false);
 assert.equal(JSON.stringify(app.engine.exportState()).includes('voiceId'),false);assert.deepEqual([...app.engine.players.keys()],['http-a','http-b']);
 const clear=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'clearDemo'})});assert.equal(clear.status,200);app.engine.join(createPlayer('http-a','A'));await until(()=>replay.some(m=>m.payload.kind==='voice:announcement'));assert.equal(replay.find(m=>m.payload.kind==='voice:announcement').payload.count,1);
});
