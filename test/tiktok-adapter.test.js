import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {TikTokAdapter,connectionFactory} from '../tiktokAdapter.js';
import {ControlEvent,WebcastEvent,SignConfig,VERSION} from 'tiktok-live-connector';
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
class Connector extends EventEmitter{
  constructor(error=null){super();this.error=error;this.roomId='999';this.isConnected=false;this.closed=0;}
  async connect(){if(this.error)throw this.error;this.isConnected=true;return {roomId:this.roomId,isConnected:true};}
  async disconnect(){this.isConnected=false;this.closed++;}
}
function clock(){let time=0,index=0;const timers=new Map();return {setTimer(fn,ms){const key=++index;timers.set(key,{fn,at:time+ms});return key;},clearTimer(key){timers.delete(key);},async advance(ms){time+=ms;for(const [key,timer]of [...timers])if(timer.at<=time){timers.delete(key);timer.fn();}await settle();},get pending(){return timers.size;}};}
test('04-01 offline error Vietnamese, no claimed connection; 04-04 one in-flight connection/listeners',async()=>{
  let resolve;const c=new Connector();c.connect=()=>new Promise(r=>resolve=r);let created=0;
  const a=new TikTokAdapter({factory:()=>{created++;return c;}});a.connect('@tester','private-key');a.connect('tester');assert.equal(created,1);assert.equal(a.snapshot().state,'connecting');assert.equal(c.listenerCount(WebcastEvent.CHAT),1);
  c.isConnected=true;resolve({isConnected:true,roomId:'999'});await settle();assert.equal(a.snapshot().state,'connected');assert.equal(JSON.stringify(a.snapshot()).includes('private-key'),false);await a.disconnect();
  const error=new Error('Must not expose raw private key');error.name='UserOfflineError';const offline=new TikTokAdapter({factory:()=>new Connector(error)});offline.connect('tester');await settle();assert.equal(offline.snapshot().state,'error');assert.match(offline.snapshot().message,/chưa LIVE/);assert.equal(offline.timer,null);await offline.disconnect();
});
test('04-02 manual disconnect cancels scheduled retry and late connect completion cannot resurrect it',async()=>{
  const timers=clock(),c=new Connector();let created=0;const a=new TikTokAdapter({...timers,factory:()=>{created++;return c;}});a.connect('tester');await settle();c.emit(ControlEvent.DISCONNECTED,{code:1006});await settle();assert.equal(timers.pending,1);await a.disconnect();await timers.advance(5000);assert.equal(created,1);assert.equal(a.snapshot().state,'disconnected');assert.equal(timers.pending,0);
  let resolve;const late=new Connector();late.connect=()=>new Promise(r=>resolve=r);const b=new TikTokAdapter({factory:()=>late});b.connect('tester');const stopping=b.disconnect();late.isConnected=true;resolve({isConnected:true});await stopping;assert.equal(b.snapshot().state,'disconnected');assert.equal(late.isConnected,false);
});
test('04-03 reconnect waits 5s, caps at ten, recovers with one listener per event and NGAT cancels',async()=>{
  const timers=clock(),all=[];let fail=false;
  const a=new TikTokAdapter({...timers,factory:()=>{const c=new Connector(fail?new Error('network'):null);all.push(c);return c;}});
  a.connect('tester');await settle();assert.equal(all.length,1);fail=true;all[0].emit(ControlEvent.DISCONNECTED,{code:1006});await settle();
  await timers.advance(4999);assert.equal(all.length,1);await timers.advance(1);assert.equal(all.length,2);
  for(let n=1;n<10;n++)await timers.advance(5000);assert.equal(all.length,11);assert.equal(a.snapshot().code,'exhausted');assert.equal(a.snapshot().attempts,10);assert.equal(timers.pending,0);
  await timers.advance(50000);assert.equal(all.length,11);fail=false;a.connect('tester');await settle();assert.equal(a.snapshot().state,'connected');assert.equal(all.at(-1).listenerCount(WebcastEvent.GIFT),1);assert.equal(all[0].listenerCount(WebcastEvent.GIFT),0);await a.disconnect();
});
test('Stream end never reconnects; signing/rate/protocol errors do not expose raw errors',async()=>{
  const timers=clock(),c=new Connector(),a=new TikTokAdapter({...timers,factory:()=>c});a.connect('tester');await settle();c.emit(WebcastEvent.STREAM_END,{action:3});await settle();assert.equal(a.snapshot().state,'ended');await timers.advance(50000);assert.equal(timers.pending,0);await a.disconnect();
  for(const [name,code]of [['SignAPIError','signing'],['InvalidUniqueIdError','username'],['SchemaDecodeError','protocol']]){const error=new Error('SECRET_KEY_IN_RAW_EXCEPTION');error.name=name;const adapter=new TikTokAdapter({factory:()=>new Connector(error)});adapter.connect('tester','SECRET_KEY');await settle();assert.equal(adapter.snapshot().code,code);assert.equal(adapter.snapshot().state,'error');assert.equal(JSON.stringify(adapter.snapshot()).includes('SECRET'),false);await adapter.disconnect();}
});
test('Actual installed connector event dispatch feeds native v3 payloads through adapter normalization',async()=>{
  const c=connectionFactory('test_channel','');assert.equal(typeof c.connect,'function');assert.equal(c.options.processInitialData,false);assert.equal(c.options.authenticateWs,false);assert.equal(SignConfig.apiKey,undefined);
  // Use the installed decoder's dispatch method, while replacing only its network connect/disconnect.
  c.connect=async()=>({isConnected:true,roomId:'999'});c.disconnect=async()=>{};
  const events=[],adapter=new TikTokAdapter({factory:()=>c,onEvent:e=>events.push(e)});adapter.connect('test_channel');await settle();
  const common={msgId:'1001',roomId:'999'},user={id:'123456',nickname:'Đạo hữu'};
  await c.processDecodedData({type:'WebcastChatMessage',data:{common,user,content:'nhập môn'}});
  await c.processDecodedData({type:'WebcastGiftMessage',data:{common:{...common,msgId:'1002'},user,giftId:'5655',gift:{type:1,name:'Hồng',diamondCount:1},groupId:'77',repeatCount:3,repeatEnd:1}});
  await c.processDecodedData({type:'WebcastLikeMessage',data:{common:{...common,msgId:'1003'},user,count:5,total:'105'}});
  await c.processDecodedData({type:'WebcastSocialMessage',data:{common:{...common,msgId:'1004',displayText:{key:'pm_main_follow'}},user}});
  assert.deepEqual(events.map(e=>e.loai),['binhluan','qua','tim','theodoi']);assert.equal(events[1].soLuong,3);assert.equal(events[2].soLuong,5);assert.equal(events[0].userId,'tt:123456');await adapter.disconnect();
});
test.skip('04-18 CHƯA KIỂM CHỨNG LIVE THẬT: cần streamer tự bật LIVE và nhận sự kiện thật');
