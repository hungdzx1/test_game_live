import test from 'node:test';import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';import {fromTikTok,safeAvatar} from '../normalizeEvent.js';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {WebSocket} from 'ws';import {createApplication} from '../server.js';
const avatar='https://p16-sign.tiktokcdn.com/avatar.jpeg?x=1';
const native=()=>({user:{id:'123',nickname:'Đạo hữu tặng phúc',avatarThumb:{urlList:[avatar]}},common:{msgId:'111',roomId:'999'},giftId:'999',gift:{type:0,diamondCount:100,name:'Phúc'},repeatCount:1});
test('Camera9 donor: native gift carries only a safe CDN photo; chats and arbitrary URLs stay avatar-free',()=>{
 const data=native();assert.equal(fromTikTok('gift',data,'999').avatar,avatar);assert.equal(fromTikTok('chat',{...data,content:'nhập môn'},'999').avatar,null);
 for(const url of ['http://p16.tiktokcdn.com/a','https://localhost/a','https://127.0.0.1/a','https://tiktokcdn.com.evil.test/a','https://user:pass@p16.tiktokcdn.com/a','file:///C:/private','https://example.invalid/a','x'.repeat(2049)])assert.equal(safeAvatar(url),null,url);
 data.user.avatarThumb.urlList[0]='http://localhost/a';assert.equal(fromTikTok('gift',data,'999').avatar,null);
});
test('Camera9 donor: blessing emits name/photo exactly once, anonymous boss rewards stay anonymous and gameplay is unchanged',()=>{
 const e=new GameEngine([createPlayer('tt:123','Đạo hữu')]);e.setPhase('battle');const event=fromTikTok('gift',native(),'999');assert.equal(e.liveEvents.accept(event).accepted,true);e.liveEvents.accept(event);
 const notices=e.events.filter(x=>x.kind==='blessing:activated');assert.equal(notices.length,1);assert.deepEqual(notices[0].donor,{userId:'tt:123',name:'Đạo hữu tặng phúc',avatar});assert.equal(e.items.blessingSnapshot().remainingMs,30000);assert.equal(e.getPlayer('tt:123').inventory.blessing,0);
 e.items.activateBlessing(2,'boss:Boss_2');assert.equal(e.events.at(-1).donor,undefined);assert.equal(e.items.blessingSnapshot().remainingMs,90000);assert.equal(JSON.stringify(e.exportState().players).includes('tiktokcdn'),false);
});
test('Camera9 donor: pre-join blessing keeps attribution through restart; old inbox saves remain valid',()=>{
 const e=new GameEngine();e.liveEvents.accept(fromTikTok('gift',native(),'999'));const saved=JSON.parse(JSON.stringify(e.exportState()));
 const r=new GameEngine(saved.players,{}, {saved});r.setPhase('cultivation');r.liveEvents.accept({source:'demo',eventId:'join',loai:'binhluan',userId:'tt:123',ten:'Đạo hữu',noiDung:'nhập môn',rawMeta:{streamId:'test'}});
 assert.equal(r.events.filter(x=>x.kind==='blessing:activated').at(-1).donor.avatar,avatar);assert.equal(r.items.blessingSnapshot().remainingMs,30000);
 const old=structuredClone(saved);delete old.runtime.interactions.inbox[0][1].donor;assert.doesNotThrow(()=>new GameEngine(old.players,{}, {saved:old}));
 const bad=structuredClone(saved);bad.runtime.interactions.inbox[0][1].donor.avatar='https://localhost/a';assert.throws(()=>new GameEngine(bad.players,{}, {saved:bad}));
});
test('Camera9 donor: HTTP grant broadcasts attributed blessing over real WS, keeps real data and player schema untouched',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'tutien-camera9-'));await mkdir(path.join(root,'data'),{recursive:true});const real=path.join(root,'data/players.json');await writeFile(real,'{"sentinel":"camera9"}');
 const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{throw Error('No real LIVE');}});t.after(()=>app.close());const port=await app.listen();app.engine.join(createPlayer('donor-api','Người nhận'));const received=[];
 const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());ws.on('message',raw=>{const msg=JSON.parse(raw);if(msg.type==='game:event'&&msg.payload.kind==='blessing:activated')received.push(msg.payload);});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 const result=await fetch(`http://127.0.0.1:${port}/api/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'demoLiveEvent',value:{source:'demo',eventId:'donor-http',userId:'donor-api',ten:'Người donate',loai:'qua',giftId:'999',qua:'Phúc',soKimCuong:100,soLuong:1,avatar,rawMeta:{streamId:'camera9',giftType:0}}})});assert.equal(result.status,200,await result.text());
 const end=Date.now()+3000;while(!received.length&&Date.now()<end)await new Promise(r=>setTimeout(r,10));assert.equal(received.length,1);assert.deepEqual(received[0].donor,{userId:'donor-api',name:'Người donate',avatar});assert.equal(await readFile(real,'utf8'),'{"sentinel":"camera9"}');assert.equal(JSON.stringify(app.engine.exportState().players).includes('avatar'),false);
});
