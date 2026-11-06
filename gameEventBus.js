import {CommandRouter,parseCommand} from './commandRouter.js';
import {cleanName} from './playerStore.js';
import {liveRulesFor,giftRulesFor,matchGift} from './liveConfig.js';
import {validateEvent,eventDigest} from './normalizeEvent.js';
import {ITEM_NAMES} from './cultivationConfig.js';
const TTL=24*60*60*1000,MAX_RECEIPTS=50000,MAX_INBOX=5000;
const emptyItems=()=>Object.fromEntries(Object.keys(ITEM_NAMES).map(k=>[k,0]));
export class GameEventBus{
  constructor(engine,{words=[],now=Date.now}={}){
    this.counters={received:0,accepted:0,rejected:0,duplicates:0};this.engine=engine;this.words=words;this.now=now;this.commands=new CommandRouter(engine,words);this.seen=new Map();this.combos=new Map();this.limits=new Map();this.notices=new Map();this.log=[];this.inbox=new Map();this.activations=new Map();this.likeTotals=new Map();this.likeDeltas=new Map();this.wish={power:0,cooldownUntil:0,pendingPoints:[],awards:0};this.lastWishNotice=-Infinity;this.banner=null;
  }
  get rules(){return liveRulesFor(this.engine.config.live);}
  diagnostic(message){const time=this.now();if(this.log.at(-1)?.message===message&&time-this.log.at(-1).timestamp<1000)return;this.log.push({message,timestamp:time});if(this.log.length>50)this.log.shift();}
  clean(){const t=this.now();for(const [k,expiry]of this.seen)if(expiry<=t)this.seen.delete(k);for(const [k,c]of this.combos)if(c.expires<=t){this.combos.delete(k);this.diagnostic('Combo hết hạn chưa có repeatEnd; không cấp thưởng tự động.');}for(const [k,v]of this.limits)if(v.end<=t)this.limits.delete(k);for(const [k,end]of this.notices)if(end<=t)this.notices.delete(k);}
  permit(event){
    const t=this.now(),r=this.rules,keys=[['global',r.eventsPerSecond],[`${event.source}:${event.userId}`,r.userEventsPerSecond]];
    for(const [key,max]of keys){const window=this.limits.get(key);if(window&&window.end>t&&window.count>=max)return false;}
    for(const [key]of keys){let window=this.limits.get(key);if(!window||window.end<=t){window={count:0,end:t+1000};this.limits.set(key,window);}window.count++;}return true;
  }
  notice(event,kind,data={}){
    const key=`${event.userId}:${kind}`,now=this.now();if((this.notices.get(key)??0)>now)return false;this.notices.set(key,now+this.rules.noticeCooldownMs);this.engine.event(kind,event.userId,{name:event.ten,...data});return true;
  }
  accept(raw,options={}){this.counters.received++;const result=this.process(raw,options);this.counters[result.duplicate?'duplicates':result.accepted===false?'rejected':'accepted']++;return result;}
  process(raw,{admin=false,bypassRate=false}={}){
    this.clean();let event;
    try{event=validateEvent(raw,this.words);}catch(error){this.diagnostic(error.message);return {accepted:false,reason:error.message};}
    const e=this.engine,key=eventDigest(`${event.source}:${event.rawMeta.streamId}:${event.loai}:${event.eventId}`);
    if(this.seen.has(key))return {duplicate:true};
    // Gifts and combat commands carry gameplay contributions. Skills keep their
    // authoritative per-player cooldown; cosmetic floods cannot consume their rate budget.
    const combatCommand=event.loai==='binhluan'&&['1','2'].includes(parseCommand(event.noiDung));
    if(event.loai!=='qua'&&!combatCommand&&!bypassRate&&!this.permit(event)){this.diagnostic('Đã giới hạn sự kiện quá nhanh; không phát thêm hiệu ứng/phần thưởng.');return {accepted:false,rateLimited:true};}
    if(this.seen.size>=MAX_RECEIPTS-1){this.diagnostic('Bộ chống trùng đã đầy; giữ an toàn, chờ bản ghi hết hạn trước khi nhận thêm.');return {accepted:false,reason:'dedup_full'};}
    try{
      if(event.loai==='binhluan'){
        const command=parseCommand(event.noiDung,{admin});
        if(command){
          if(command==='nhap mon'&&e.players.has(event.userId)){const p=e.getPlayer(event.userId);p.lastSeenAt=this.now();this.notice(event,'player:returned');}
          else this.commands.handle({eventId:event.eventId,source:event.source,userId:event.userId,name:event.ten,text:event.noiDung},{admin});
          if(command==='nhap mon')this.deliver(event.userId);
          if(command==='tu luyen')this.notice(event,'live:cultivation');
        }
      }else if(event.loai==='qua'){
        const result=this.gift(event);if(result?.accepted===false)return result;
      }else if(event.loai==='tim')this.like(event);
      else this.notice(event,event.loai==='theodoi'?'live:follow':'live:join');
      this.seen.set(key,this.now()+TTL);if(event.loai==='qua')e.important=true;this.flush();return {accepted:true};
    }catch(error){this.diagnostic(error.message);return {accepted:false,reason:error.message};}
  }
  gift(event){
    const meta=event.rawMeta;
    if(meta.giftType===1){
      const key=eventDigest(`${event.source}:${meta.streamId}:${event.userId}:${event.giftId}:${meta.comboId}`),done=`combo:${key}`;
      if(this.seen.has(done))return {duplicate:true};
      const previous=this.combos.get(key);
      if(previous&&(event.soLuong<previous.count||event.soKimCuong!==previous.price)){this.diagnostic('Combo thay đổi đơn giá hoặc lùi số lượng; không chốt thưởng.');return {accepted:false,reason:'combo_inconsistent'};}
      if(!meta.repeatEnd){if(this.combos.size>=5000&&!previous)return {accepted:false,reason:'combo_full'};this.combos.set(key,{count:event.soLuong,price:event.soKimCuong,expires:this.now()+120000});return;}
      this.grantGift(event);this.combos.delete(key);this.seen.set(done,this.now()+TTL);return;
    }this.grantGift(event);
  }
  grantGift(event){
    const mapping=matchGift(giftRulesFor(this.engine.config.giftRules),event);
    if(!mapping){this.diagnostic('Quà chưa có ánh xạ; không cấp vật phẩm. Thêm quy tắc trước khi thử lại.');throw new Error('Chưa có quy tắc cho quà này.');}
    let inbox=this.inbox.get(event.userId);if(!inbox){if(this.inbox.size>=MAX_INBOX)throw new Error('Danh sách quà chờ đã đầy; sự kiện chưa được chốt.');inbox={name:event.ten,items:emptyItems()};}
    const amount=event.soLuong*mapping.quantity;if(inbox.items[mapping.item]+amount>1e9)throw new Error('Quà chờ vượt giới hạn; sự kiện chưa được chốt.');
    inbox.items[mapping.item]+=amount;this.inbox.set(event.userId,inbox);this.deliver(event.userId);
    const total=event.soKimCuong*event.soLuong;
    if(this.notice(event,'live:gift',{giftName:event.qua,diamonds:total,quantity:event.soLuong,item:mapping.item,itemName:ITEM_NAMES[mapping.item],itemCount:amount,effect:mapping.effect,waiting:!this.engine.players.has(event.userId)}))this.banner={name:event.ten,userId:event.userId,giftName:event.qua,diamonds:total,itemName:ITEM_NAMES[mapping.item],item:mapping.item,count:amount,expiresAt:this.now()+4000};
  }
  deliver(userId){
    const p=this.engine.players.get(userId),inbox=this.inbox.get(userId);if(!p||!inbox)return;
    let activate=this.activations.get(userId);if(!activate)activate=emptyItems();
    for(const item of Object.keys(ITEM_NAMES)){
      const count=Math.min(inbox.items[item],Math.max(0,100000-p.inventory[item]));if(!count)continue;
      // grantItem is the common inventory mutation entry point (bounded batches).
      let left=count;while(left>0){const step=Math.min(100,left);this.engine.items.grantItem(p,item,step,'viewer_gift');left-=step;}
      inbox.items[item]-=count;activate[item]+=count;
    }
    if(Object.values(activate).some(n=>n>0))this.activations.set(userId,activate);
    if(!Object.values(inbox.items).some(n=>n>0))this.inbox.delete(userId);
  }
  like(event){
    const key=`${event.source}:${event.rawMeta.streamId}`,total=event.rawMeta.likeTotal;let count=event.soLuong;
    if(total!==undefined){
      const previous=this.likeTotals.get(key),unreported=this.likeDeltas.get(key)??0,difference=previous===undefined?Math.min(count,total):Math.max(0,total-previous);
      count=Math.max(0,difference-unreported);this.likeTotals.set(key,Math.max(previous??0,total));this.likeDeltas.set(key,Math.max(0,unreported-difference));
    }else this.likeDeltas.set(key,Math.min(Number.MAX_SAFE_INTEGER,(this.likeDeltas.get(key)??0)+count));
    if(count>1000000)throw new Error('Lượng tim nhảy bất thường; không cấp phúc lợi.');
    this.wish.power=Math.min(this.rules.wishThreshold,this.wish.power+count);this.wishReward();
    if(count&&this.now()-this.lastWishNotice>=1000){this.lastWishNotice=this.now();this.engine.event('live:likes',null,{power:this.wish.power,threshold:this.rules.wishThreshold});}
  }
  wishReward(){
    const r=this.rules,t=this.now(),e=this.engine;if(this.wish.power<r.wishThreshold||t<this.wish.cooldownUntil)return;
    this.wish.power=0;this.wish.cooldownUntil=t+r.wishCooldownMs;this.wish.awards++;
    // One bounded award per cooldown; overflow likes do not create an unlimited backlog.
    const ids=[...e.players.keys()];for(const id of ids){const pending=this.wish.pendingPoints.find(p=>p.ids[0]===id);if(pending)pending.points=Math.min(Number.MAX_SAFE_INTEGER,pending.points+r.wishPoints);else this.wish.pendingPoints.push({ids:[id],points:r.wishPoints});}
    e.event('live:wish',null,{points:r.wishPoints,participants:ids.length,pending:e.phase!=='cultivation'});e.important=true;
  }
  flush(){
    const e=this.engine;if(e.phase!=='cultivation')return;
    if(this.wish.pendingPoints.length){for(const reward of this.wish.pendingPoints.splice(0))for(const id of reward.ids){const p=e.players.get(id);if(p)p.questState.points=Math.min(Number.MAX_SAFE_INTEGER,p.questState.points+reward.points);}e.important=true;}
    for(const id of this.inbox.keys())this.deliver(id);
    let budget=50;
    for(const [id,items]of this.activations){const p=e.players.get(id);if(!p)continue;
      for(const item of Object.keys(ITEM_NAMES))while(items[item]>0&&budget>0){
        if(p.inventory[item]<=0){items[item]=0;break;}
        try{e.items.useItem(p,item);items[item]--;budget--;}
        catch{items[item]=0;break;} // Permanent root, Pmax/prepared-pill/camera limits: keep extras in inventory.
      }
      if(!Object.values(items).some(n=>n>0))this.activations.delete(id);if(!budget)break;
    }
  }
  tick(){this.clean();this.flush();}
  snapshot(admin=false){const result={wish:{power:this.wish.power,threshold:this.rules.wishThreshold,cooldownUntil:this.wish.cooldownUntil,awards:this.wish.awards,pending:this.wish.pendingPoints.length},giftBanner:this.banner?.expiresAt>this.now()?this.banner:null};if(admin)Object.assign(result,{pendingGiftUsers:this.inbox.size,log:this.log});return result;}
  exportState(){return structuredClone({version:1,counters:this.counters,seen:[...this.seen],combos:[...this.combos],inbox:[...this.inbox],activations:[...this.activations],likeTotals:[...this.likeTotals],likeDeltas:[...this.likeDeltas],wish:this.wish});}
  restore(raw){
    if(!raw)return;if(raw.counters){if(Object.keys(this.counters).some(k=>!Number.isSafeInteger(raw.counters[k])||raw.counters[k]<0))throw new Error('Bộ đếm sự kiện không hợp lệ.');this.counters={...raw.counters};}const invalid=()=>{throw new Error('Dữ liệu tương tác LIVE không hợp lệ; giữ nguyên file.');};
    const finite=n=>Number.isSafeInteger(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
    if(raw.version!==1||!Array.isArray(raw.seen)||raw.seen.length>MAX_RECEIPTS||raw.seen.some(pair=>!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||pair[0].length>100||!finite(pair[1]))||!Array.isArray(raw.combos)||raw.combos.length>5000||!Array.isArray(raw.inbox)||raw.inbox.length>MAX_INBOX||!Array.isArray(raw.activations)||raw.activations.length>500||!Array.isArray(raw.likeTotals)||raw.likeTotals.length>5000||!raw.wish||!finite(raw.wish.power)||!finite(raw.wish.cooldownUntil)||!finite(raw.wish.awards)||!Array.isArray(raw.wish.pendingPoints)||raw.wish.pendingPoints.length>1000)invalid();
    for(const [id,entry]of raw.inbox)if(typeof id!=='string'||!/^[\w:-]{1,100}$/.test(id)||!entry||typeof entry.name!=='string'||!entry.items||Object.keys(ITEM_NAMES).some(k=>!finite(entry.items[k])||entry.items[k]>1e9))invalid();
    for(const [id,items]of raw.activations)if(!this.engine.players.has(id)||!items||Object.keys(ITEM_NAMES).some(k=>!finite(items[k])||items[k]>1e9))invalid();
    for(const [key,c]of raw.combos)if(typeof key!=='string'||!c||!finite(c.count)||!finite(c.price)||!finite(c.expires))invalid();
    if(raw.likeDeltas&&(!Array.isArray(raw.likeDeltas)||raw.likeDeltas.length>5000))invalid();
    for(const [key,total]of [...raw.likeTotals,...(raw.likeDeltas??[])])if(typeof key!=='string'||!finite(total))invalid();
    for(const reward of raw.wish.pendingPoints)if(!finite(reward.points)||!Array.isArray(reward.ids)||reward.ids.length>500||reward.ids.some(id=>typeof id!=='string'))invalid();
    this.seen=new Map(raw.seen);this.combos=new Map(raw.combos);this.inbox=new Map(raw.inbox);this.activations=new Map(raw.activations);this.likeTotals=new Map(raw.likeTotals);this.likeDeltas=new Map(raw.likeDeltas??[]);this.wish=structuredClone(raw.wish);this.clean();
  }
}
