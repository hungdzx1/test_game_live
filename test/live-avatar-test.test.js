import test from 'node:test';import assert from 'node:assert/strict';import {EventEmitter} from 'node:events';
import {mkdtemp,mkdir,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {WebSocket} from 'ws';
import {fromTikTok,validateEvent,isAvatarTestCommand} from '../normalizeEvent.js';import {GameEngine} from '../gameEngine.js';import {liveRulesFor} from '../liveConfig.js';import {createApplication} from '../server.js';
const photo='https://p16-sign.tiktokcdn.com/avatar.jpeg?x=1';
const native=(id=1,text='test avt',user='123')=>({common:{msgId:String(id),roomId:'999'},user:{id:user,nickname:'Đạo hữu thử ảnh',avatarThumb:{urlList:[photo]}},content:text});
const notices=e=>e.events.filter(x=>x.kind==='avatar:test');
async function until(check){const end=Date.now()+5000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,20));}throw Error('Avatar test timeout');}

test('LIVE avatar: only exact native test command carries safe avatar, gifts share fallback and unrelated chats stay empty',()=>{
 for(const command of ['test avt',' TEST   AVT ','test\tavt']){assert.equal(isAvatarTestCommand(command),true);assert.equal(fromTikTok('chat',native(1,command),'999').avatar,photo);}
 for(const command of ['nhập môn','test avt!','test avt now','1'])assert.equal(fromTikTok('chat',native(1,command),'999').avatar,null);
 const medium=native();medium.user.avatarThumb.urlList=['http://localhost/a'];medium.user.avatarMedium={urlList:[photo]};assert.equal(fromTikTok('chat',medium,'999').avatar,photo);delete medium.user.avatarMedium;assert.equal(fromTikTok('chat',medium,'999').avatar,null);
 const fake=validateEvent({source:'demo',eventId:'fake',userId:'demo',ten:'Demo',loai:'binhluan',noiDung:'test avt',avatar:photo,rawMeta:{streamId:'x'}});assert.equal(fake.avatar,null);
 const gift={...medium,giftId:'1',gift:{type:0,diamondCount:1,name:'Hồng'},repeatCount:1};gift.user.avatarLarge={urlList:[photo]};assert.equal(fromTikTok('gift',gift,'999').avatar,photo);
});

test('LIVE avatar: default off, LIVE-only opt-in, dedup/latest and unjoined viewers never create players or grant items',()=>{
 const e=new GameEngine([],{live:{avatarTestEnabled:true}});e.mode='demo';e.liveEvents.accept(fromTikTok('chat',native(1),'999'));assert.equal(notices(e).length,0);
 e.mode='live';e.config.live.avatarTestEnabled=false;e.liveEvents.accept(fromTikTok('chat',native(2),'999'));assert.equal(notices(e).length,0);e.config.live.avatarTestEnabled=true;
 for(const phase of ['cultivation','paused','battle']){e.setPhase(phase);const id=3+notices(e).length;const event=fromTikTok('chat',native(id),'999');e.liveEvents.accept(event);e.liveEvents.accept(event);}
 assert.equal(notices(e).length,3);assert.deepEqual(notices(e)[0].avatar,photo);assert.equal(notices(e)[0].durationMs,10000);assert.equal(notices(e)[0].name,'Đạo hữu thử ảnh');assert.match(e.liveEvents.log.at(-1).message,/đã gửi thử avatar/);assert.equal(e.players.size,0);assert.equal(JSON.stringify(e.exportState()).includes('tiktokcdn'),false);assert.equal(e.items.blessingSnapshot().remainingMs,0);assert.equal(e.cameraUserId,null);
 e.liveEvents.accept(fromTikTok('chat',native(9,'test avt','456'),'999'));assert.equal(notices(e).at(-1).userId,'tt:456');e.config.live.avatarTestEnabled=false;e.liveEvents.accept(fromTikTok('chat',native(10),'999'));assert.equal(notices(e).length,4);
});

test('LIVE avatar: settings are backward-compatible boolean-only and do not store a signing key',()=>{
 assert.equal(liveRulesFor().avatarTestEnabled,false);assert.equal(liveRulesFor({avatarTestEnabled:true}).avatarTestEnabled,true);for(const value of [1,'true',null,{}])assert.throws(()=>liveRulesFor({avatarTestEnabled:value}));assert.throws(()=>liveRulesFor({signApiKey:'secret'}));
});

class Connector extends EventEmitter{constructor(){super();this.roomId='999';}async connect(){return{isConnected:true,roomId:'999'};}async disconnect(){}}
test('LIVE avatar: native adapter -> real WS, toggle persistence/restart, no DEMO profile and no player/photo save',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'tutien-avatar-'));await mkdir(path.join(root,'data/demo'),{recursive:true});let connector;const factory=()=>connector=new Connector();
 let app=await createApplication({dataRoot:root,port:0,connectorFactory:factory}),port=await app.listen();t.after(()=>app.close());
 async function post(action,value){const r=await fetch(`http://127.0.0.1:${port}/api/control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());}
 await post('mode','live');await post('liveConnect',{username:'tester'});await until(()=>app.adapter.snapshot().state==='connected');const demoFile=path.join(root,'data/demo/players.json'),demoBefore=await readFile(demoFile,'utf8');
 const received=[];const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`);t.after(()=>ws.terminate());ws.on('message',b=>{const e=JSON.parse(b);if(e.type==='game:event'&&e.payload.kind==='avatar:test')received.push(e.payload);});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 await post('liveSettings',{avatarTestEnabled:true});connector.emit('chat',native(50));await until(()=>received.length===1);assert.equal(received[0].avatar,photo);assert.equal(received[0].userId,'tt:123');assert.equal(app.engine.players.size,0);assert.equal(app.adapter.snapshot().state,'connected');
 await post('liveSettings',{avatarTestEnabled:false});connector.emit('chat',native(51));await post('phase','paused');assert.equal(received.length,1);assert.equal(app.engine.players.size,0);assert.equal(await readFile(demoFile,'utf8'),demoBefore);
 const stored=JSON.parse(await readFile(path.join(root,'data/players.json'),'utf8'));assert.equal(stored.players.length,0);assert.equal(JSON.stringify(stored).includes('tiktokcdn'),false);await post('liveSettings',{avatarTestEnabled:true});ws.terminate();await app.close();app=await createApplication({dataRoot:root,port:0,connectorFactory:factory});port=await app.listen();assert.equal(app.engine.config.live.avatarTestEnabled,true);assert.equal(app.engine.mode,'demo');assert.equal(notices(app.engine).length,0);await post('liveSettings',{avatarTestEnabled:false});assert.equal(JSON.parse(await readFile(path.join(root,'caidat.json'),'utf8')).live.avatarTestEnabled,false);
});
