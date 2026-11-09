import {randomUUID} from 'node:crypto';
import {createVoiceCache,voiceName} from './voiceCache.js';

export const VOICE_TEXT={
  join:'Chào mừng đạo hữu',joinEnd:'gia nhập tông môn!',with:'cùng',others:'người khác gia nhập tông môn!',
  success:'Chúc mừng đạo hữu',failure:'Thiên kiếp vô tình! Đạo hữu',failureEnd:'độ kiếp thất bại. Hãy dưỡng sức, chờ ngày tái chiến!',
  donor:'Cảm tạ đạo hữu',donorEnd:'đã ban ân trạch cho toàn tông môn.',
  boss:'Ma khí xâm thiên! Ma vương sắp xuất thế. Chư vị đạo hữu, mau chuẩn bị nghênh chiến!',
  fallbackJoin:'Chào mừng các đạo hữu gia nhập tông môn!',fallbackSuccess:'Chúc mừng đạo hữu độ kiếp thành công!',
  fallbackFailure:'Thiên kiếp vô tình! Đạo hữu hãy dưỡng sức, chờ ngày tái chiến!',fallbackDonor:'Cảm tạ đạo hữu đã ban ân trạch cho toàn tông môn!'
};
export const realmTail=name=>`độ kiếp thành công, tấn thăng ${name}!`;
export function vietnameseNumber(n){
  if(!Number.isInteger(n)||n<1||n>499)throw Error('Invalid join count');const d=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  function tens(v,full=false){const t=Math.floor(v/10),u=v%10;if(!t)return (full&&u?'lẻ ':'')+(u?d[u]:'');return (t===1?'mười':d[t]+' mươi')+(u?' '+(u===1&&t>1?'mốt':u===5?'lăm':d[u]):'');}
  return n<100?tens(n):d[Math.floor(n/100)]+' trăm'+(n%100?' '+tens(n%100,true):'');
}

// Presentation service: observes committed events; never mutates gameplay or save data.
export class VoiceService{
  constructor({directory,worker,emit=()=>{},now=Date.now}={}){this.options={directory,worker};this.emit=emit;this.now=now;this.epoch=0;this.seen=new Set();this.seenUsers=new Set();this.timers=new Set();this.state=null;this.status='idle';this.closed=false;}
  configure(engine){
    const enabled=engine.config.audio?.enabled!==false&&engine.config.audio?.speech!==false;
    const key=engine.transportId+':'+engine.mode+':'+enabled;
    if(key!==this.context){this.context=key;this.epoch++;this.batch=null;this.lanes=new Map();for(const t of this.timers)clearTimeout(t);this.timers.clear();this.seen.clear();this.seenUsers.clear();this.warningCycle=null;this.previous=null;}
    this.enabled=enabled;this.state=engine;
  }
  reset(engine){this.context=null;this.configure(engine);}
  start(){
    if(this.starting)return this.starting;
    this.status='warming';this.starting=(async()=>{
      this.cache=await createVoiceCache(this.options);if(this.closed){this.cache.close();return;}
      await this.cache.worker.start?.();
      // Fallbacks first: the client can use them while the remaining vocabulary warms.
      const first=['fallbackJoin','fallbackSuccess','fallbackFailure','fallbackDonor','boss'];
      for(const id of first)await this.cache.ensure(VOICE_TEXT[id],{fixed:true});
      this.status='ready';
      const rest=[...Object.values(VOICE_TEXT),...(this.state?.rules.realms??[]).map(r=>realmTail(r.name)),...Array.from({length:100},(_,i)=>vietnameseNumber(i+1))];
      for(const text of rest){if(this.closed)break;await this.cache.ensure(text,{fixed:true,priority:-1});}
      this.prewarmed=true;
    })().catch(()=>{this.status='unavailable';});return this.starting;
  }
  manifest(){if(!this.enabled)return {status:'disabled',ready:false,prewarmed:false,clips:{}};this.start();return {status:this.status,ready:this.status==='ready',prewarmed:!!this.prewarmed,clips:Object.fromEntries(['fallbackJoin','fallbackSuccess','fallbackFailure','fallbackDonor','boss'].filter(k=>this.cache?.has(VOICE_TEXT[k])).map(k=>[k,this.cache.key(VOICE_TEXT[k])]))};}
  later(fn,ms){const timer=setTimeout(()=>{this.timers.delete(timer);fn();},ms);timer.unref();this.timers.add(timer);return timer;}
  accept(event,engine){
    this.configure(engine);if(!this.enabled||this.seen.has(event.eventId))return;
    this.seen.add(event.eventId);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value);
    const name=voiceName(engine.players.get(event.userId)?.name??event.name),created=this.now();
    if(event.kind==='player:joined'){
      if(this.seenUsers.has(event.userId))return;this.seenUsers.add(event.userId);
      if(this.batch&&created>=this.batch.created+1000)this.flushBatch(this.batch);
      if(!this.batch){const batch=this.batch={id:randomUUID(),name,users:new Set(),created,epoch:this.epoch};if(name&&this.cache)this.cache.ensure(name,{priority:1}).catch(()=>{});batch.timer=this.later(()=>this.flushBatch(batch),1000);}
      this.batch.users.add(event.userId);
    }else if(event.kind==='breakthrough:completed'&&typeof event.outcome==='boolean'){
      const realm=engine.rules.realms[event.realmIndex]?.name;if(event.outcome&&!realm)return;
      this.prepare({id:event.eventId,type:'breakthrough',parts:event.outcome?[VOICE_TEXT.success,name,realmTail(realm)]:[VOICE_TEXT.failure,name,VOICE_TEXT.failureEnd],name,created,priority:2,fallback:event.outcome?'fallbackSuccess':'fallbackFailure',epoch:this.epoch});
    }else if(event.kind==='blessing:activated'&&event.donor?.userId){const donor=voiceName(event.donor.name);this.prepare({id:event.eventId,type:'donor',parts:[VOICE_TEXT.donor,donor,VOICE_TEXT.donorEnd],name:donor,created,priority:3,fallback:'fallbackDonor',epoch:this.epoch});}
  }
  flushBatch(batch){
    if(this.batch!==batch)return;this.batch=null;clearTimeout(batch.timer);this.timers.delete(batch.timer);
    const count=batch.users.size,parts=[VOICE_TEXT.join,batch.name,...(count>1?[VOICE_TEXT.with,vietnameseNumber(count-1),VOICE_TEXT.others]:[VOICE_TEXT.joinEnd])];
    this.prepare({id:batch.id,type:'join',parts,name:batch.name,count,created:batch.created,priority:1,fallback:'fallbackJoin',epoch:batch.epoch});
  }
  observe(engine){
    this.configure(engine);const prev=this.previous;this.previous={cycle:engine.cycleId,left:engine.remainingMs,phase:engine.phase};
    if(!this.enabled||engine.phase!=='cultivation'||!prev||prev.cycle!==engine.cycleId||prev.left<=10000||engine.remainingMs>10000||this.warningCycle===engine.cycleId)return;
    this.warningCycle=engine.cycleId;const created=this.now();this.prepare({id:randomUUID(),type:'boss',parts:[VOICE_TEXT.boss],created,priority:4,fallback:'boss',epoch:this.epoch,cycleId:engine.cycleId});
  }
  async prepare(job){
    const lane=this.lanes.get(job.priority)??[];this.lanes.set(job.priority,lane);
    if(lane.length>=128)return;
    const slot={epoch:job.epoch,done:false,payload:null};lane.push(slot);
    try{
      const notice=()=>{slot.payload={eventId:'voice:'+job.id,kind:'voice:notice',timestamp:this.now(),text:job.parts.filter(Boolean).join(' '),createdAt:job.created,expiresAt:job.created+15000};};
      if(this.status!=='ready'){notice();return;}
      const cache=this.cache,deadline=job.created+2000;let ids=null;
      const pending=job.parts.every(Boolean)?Promise.all(job.parts.map(text=>cache.ensure(text,{priority:job.priority}))):Promise.reject(Error('Missing name'));
      // Late work may populate cache, but never emits a second announcement.
      let timer;const timeout=new Promise(resolve=>{timer=this.later(()=>resolve(null),Math.max(0,deadline-this.now()));});
      ids=await Promise.race([pending.catch(()=>null),timeout]);clearTimeout(timer);this.timers.delete(timer);
      if(this.closed||job.epoch!==this.epoch||!this.enabled)return;
      const fallback=cache.key(VOICE_TEXT[job.fallback]);if(!cache.entries.has(fallback)){notice();return;}
      slot.payload={eventId:'voice:'+job.id,kind:'voice:announcement',timestamp:this.now(),voiceId:job.id,voiceType:job.type,text:job.parts.filter(Boolean).join(' '),priority:job.priority,createdAt:job.created,deadlineAt:deadline,expiresAt:job.created+15000,clips:ids??[fallback],fallback,fallbackOnly:!ids,count:job.count??1,cycleId:job.cycleId??null};
    }catch{ /* Speech failure must not affect the simulation. */ }
    finally{
      slot.done=true;
      // Cached B must not overtake uncached A in the same priority lane.
      // Other lanes remain independent so a boss warning can interrupt promptly.
      while(lane[0]?.done){const ready=lane.shift();if(!this.closed&&this.enabled&&ready.epoch===this.epoch&&ready.payload)this.emit(ready.payload);}
    }
  }
  close(){this.closed=true;this.epoch++;for(const timer of this.timers)clearTimeout(timer);this.timers.clear();this.cache?.close();}
}
