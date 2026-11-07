import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {TikTokLiveConnection,WebcastChatMessage,WebcastSocialMessage,CommonMessageData,User,deserializeMessage} from 'tiktok-live-connector';
import {createApplication} from '../server.js';
import {fromTikTok} from '../normalizeEvent.js';
import {giftRulesFor,matchGift} from '../liveConfig.js';
import {GIFT_PRESETS,presetForRule} from '../public/js/ui/giftPresets.js';
const post=(base,action,value)=>fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});
async function until(predicate){const end=Date.now()+6000;while(!await predicate()){assert.ok(Date.now()<end,'Pipeline timeout');await new Promise(r=>setTimeout(r,25));}}
const baseData={common:{msgId:'1',roomId:'999'},user:{id:'123',nickname:'Live Viewer'}};
function decoded(schema,data){
  const codec=schema==='WebcastChatMessage'?WebcastChatMessage:WebcastSocialMessage,empty=new Uint8Array();
  const common={...CommonMessageData.decode(empty),...data.common};if(common.displayText)common.displayText={key:'',defaultPattern:'',pieces:[],...common.displayText};
  return deserializeMessage(schema,codec.encode({...codec.decode(empty),...data,common,user:{...User.decode(empty),...data.user}}).finish());
}

test('Native protobuf chat uses content; legacy comment remains supported; invalid content is not silently ignored',()=>{
  const native=decoded('WebcastChatMessage',{...baseData,content:'NHẬP MÔN'});
  assert.equal(native.comment,undefined);assert.equal(fromTikTok('chat',native,'999').noiDung,'NHẬP MÔN');
  assert.equal(fromTikTok('chat',{...baseData,comment:'nhap mon'},'999').noiDung,'nhap mon');
  assert.equal(fromTikTok('chat',{...baseData,content:'nhập môn',comment:'wrong'},'999').noiDung,'nhập môn');
  for(const extra of [{},{content:17},{content:'x'.repeat(201)}])assert.throws(()=>fromTikTok('chat',{...baseData,...extra},'999'),/bình luận|Bình luận/);
});

test('Three local presets match exact gift IDs and unit prices, never another gift at the same price; ranges stay compatible',()=>{
  assert.deepEqual(GIFT_PRESETS.map(g=>[g.id,g.diamonds]),[['5655',1],['9875',10],['1473096',20]]);
  const presets=GIFT_PRESETS.map((g,i)=>({id:'preset-'+i,giftId:g.id,giftName:g.name,minDiamonds:g.diamonds,maxDiamonds:g.diamonds,item:'pill',quantity:2,effect:'item',enabled:true}));
  const rules=giftRulesFor([...giftRulesFor(),...presets]);
  for(const [i,gift]of GIFT_PRESETS.entries()){
    const event={giftId:gift.id,qua:'Localized name',soKimCuong:gift.diamonds};assert.equal(matchGift(rules,event).id,'preset-'+i);assert.equal(presetForRule(presets[i]),gift);
    assert.equal(matchGift(presets,{...event,giftId:'999999'}),null);assert.equal(matchGift(presets,{...event,soKimCuong:gift.diamonds+1}),null);
    assert.ok(matchGift(rules,{...event,giftId:'999999'})); // Explicit existing price rules remain active.
  }
});

test('Real connector protobuf dispatch → adapter → game: content joins once, follow logs, errors show why, saves and modes remain isolated',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tutien-comments-'));let connection;
  await mkdir(path.join(root,'data'),{recursive:true});const cache=path.join(root,'data/tiktok-gifts.json');await writeFile(cache,'{"keep":"unused old cache"}');
  const app=await createApplication({dataRoot:root,port:0,connectorFactory:()=>{
    connection=new TikTokLiveConnection('fixture',{});
    connection.connect=async()=>({isConnected:true});connection.disconnect=async()=>{};return connection;
  }});t.after(()=>app.close());const base=`http://127.0.0.1:${await app.listen()}`;
  await post(base,'demo',10);await post(base,'phase','paused');const demoFile=path.join(root,'data/demo/players.json'),before=await readFile(demoFile,'utf8');
  await post(base,'mode','live');await post(base,'liveConnect',{username:'fixture'});await until(()=>app.adapter.snapshot().state==='connected');
  const chat=async(msgId,content)=>connection.processDecodedData({type:'WebcastChatMessage',data:decoded('WebcastChatMessage',{...baseData,common:{...baseData.common,msgId},content})});
  await chat('10','NHẬP MÔN');await until(()=>app.engine.players.has('tt:123'));await post(base,'phase','paused');const p=app.engine.getPlayer('tt:123');p.cultivation=42;
  await chat('10','NHẬP MÔN');await chat('11','nhap mon');await until(()=>app.engine.liveEvents.counters.duplicates===1);assert.equal(app.engine.players.size,1);assert.equal(p.cultivation,42);
  await chat('12','xin chào');
  const follow=decoded('WebcastSocialMessage',{...baseData,common:{...baseData.common,msgId:'13',displayText:{key:'pm_main_follow_message'}}});
  await connection.processDecodedData({type:'WebcastSocialMessage',data:follow});await connection.processDecodedData({type:'WebcastSocialMessage',data:follow});
  await until(()=>app.engine.liveEvents.log.some(r=>r.message.includes('[Follow]')));
  assert.equal(app.engine.events.filter(e=>e.kind==='live:follow').length,1);assert.equal(app.engine.players.size,1);
  connection.emit('chat',{...baseData,common:{...baseData.common,msgId:'14'},content:3});
  await until(()=>app.engine.liveEvents.log.some(r=>r.message.includes('Bỏ qua chat: Thiếu nội dung')));
  const log=app.engine.snapshot(true).payload.interactions.log;assert.ok(log.some(r=>r.message.includes('[Lệnh]')&&r.message.includes('nhap mon')));assert.ok(log.some(r=>r.message.includes('không phải lệnh game')));
  const dashboard=await (await fetch(base+'/api/dashboard')).json();assert.ok(dashboard.interactionLog.some(r=>r.message.includes('[Follow]')));assert.ok(dashboard.interactionLog.length<=20);
  assert.equal(app.engine.snapshot().payload.interactions.log,undefined);
  await post(base,'phase','paused');const saved=JSON.parse(await readFile(path.join(root,'data/players.json'),'utf8'));assert.equal(saved.players[0].userId,'tt:123');assert.equal(JSON.stringify(saved).includes('xin chào'),false);
  await post(base,'liveDisconnect');await post(base,'mode','demo');assert.equal(app.engine.players.size,10);assert.equal(await readFile(demoFile,'utf8'),before);assert.equal(await readFile(cache,'utf8'),'{"keep":"unused old cache"}');
});
