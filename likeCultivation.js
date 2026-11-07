import {CULTIVATION_PER_LIKE,LIKE_STREAK_SIZE,LIKE_STREAK_IDLE_MS} from './cultivationConfig.js';
import {totalMultiplier} from './itemService.js';

// Only personal cultivation is delayed. Sect energy is handled immediately by GameEventBus.
export class LikeCultivation {
  constructor(engine,now){this.engine=engine;this.now=now;this.streaks=new Map();}
  settle(userId,count,amount){
    const p=this.engine.players.get(userId);if(!p)return;
    this.engine.cultivation.grant(p,amount);
    this.engine.audit('cultivation:likes',{userId,count,amount});this.engine.important=true;
  }
  add(userId,count){
    const p=this.engine.players.get(userId);if(!p||!count)return;
    this.flushIdle(userId);
    const rate=CULTIVATION_PER_LIKE*totalMultiplier(p,this.engine.globalBuffs,this.engine.rules);
    let current=this.streaks.get(userId)??{count:0,amount:0,lastAt:0};
    const take=Math.min(count,LIKE_STREAK_SIZE-current.count);
    current.count+=take;current.amount+=take*rate;count-=take;
    if(current.count===LIKE_STREAK_SIZE){this.settle(userId,current.count,current.amount);this.streaks.delete(userId);current={count:0,amount:0,lastAt:0};}
    // Coalesce complete groups in a large connector message without looping per heart.
    const complete=Math.floor(count/LIKE_STREAK_SIZE)*LIKE_STREAK_SIZE;
    if(complete)this.settle(userId,complete,complete*rate);
    count-=complete;current.count+=count;current.amount+=count*rate;
    if(current.count){current.lastAt=this.now();this.streaks.set(userId,current);}
    this.engine.important=true;
  }
  flushIdle(onlyUser){
    const now=this.now();
    const entries=onlyUser?[[onlyUser,this.streaks.get(onlyUser)]]:this.streaks;
    for(const [userId,streak]of entries)if(streak&&now-streak.lastAt>=LIKE_STREAK_IDLE_MS){
      this.settle(userId,streak.count,streak.amount);this.streaks.delete(userId);
    }
  }
  exportState(){return structuredClone([...this.streaks]);}
  restore(raw=[]){
    if(!Array.isArray(raw)||raw.length>500||new Set(raw.map(v=>Array.isArray(v)?v[0]:null)).size!==raw.length||raw.some(v=>!Array.isArray(v)||v.length!==2||!this.engine.players.has(v[0])||!v[1]||!Number.isInteger(v[1].count)||v[1].count<1||v[1].count>=LIKE_STREAK_SIZE||!Number.isFinite(v[1].amount)||v[1].amount<v[1].count*CULTIVATION_PER_LIKE||v[1].amount>v[1].count*CULTIVATION_PER_LIKE*100||!Number.isSafeInteger(v[1].lastAt)||v[1].lastAt<0))throw new Error('Chuỗi tim lưu không hợp lệ; giữ nguyên dữ liệu.');
    this.streaks=new Map(structuredClone(raw));
  }
}
