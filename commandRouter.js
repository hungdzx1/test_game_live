import {createPlayer,cleanName} from './playerStore.js';
export function normalizeCommand(text){if(typeof text!=='string'||text.length>200)throw new Error('Bình luận tối đa 200 ký tự.');return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim().replace(/\s+/g,' ');}
export function parseCommand(text,{admin=false}={}){const command=normalizeCommand(text);return ['nhap mon','tu luyen','diem danh','dung tra','1','2',...(admin?['thu do kiep']:[])].includes(command)?command:null;}
export class CommandRouter {
  constructor(engine,words=[]){this.engine=engine;this.words=words;this.seen=new Map();}
  handle({eventId,userId,name,text,source='demo'},{admin=false}={}){
    if(typeof eventId!=='string'||eventId.length<1||eventId.length>120)throw new Error('Sự kiện cần ID hợp lệ.');
    const key=`${source}:${eventId}`,now=Date.now();for(const [k,t]of this.seen)if(now-t>300000)this.seen.delete(k);if(this.seen.has(key))return {duplicate:true};
    const e=this.engine,command=normalizeCommand(text);let p=e.players.get(userId);
    if(command==='nhap mon'){
      if(!p){if(e.players.size>=500)throw new Error('Đã đạt giới hạn 500 đạo hữu demo.');p=createPlayer(userId,cleanName(name??'Đạo hữu',this.words),e.players.size);p.animationStartMs=e.elapsedMs;p.overrideUntil=e.elapsedMs+2400;e.join(p);}
      else {p.lastSeenAt=now;e.event('player:returned',p.userId);e.important=true;}
    }else{
      if(!p)throw new Error('Hãy nhập môn trước.');
      if(command==='1'||command==='2')e.battle.combat.skill(p.userId,command,key);
      else if(command==='tu luyen')e.quests.claim(p,'cultivate');
      else if(command==='diem danh')e.quests.claim(p,'checkIn');
      else if(command==='dung tra')e.items.useItem(p,'tea');
      else if(command==='thu do kiep'&&admin&&source==='demo')e.prepareBreakthrough(p.userId);
      else throw new Error('Lệnh không hợp lệ hoặc không đủ quyền.');
    }
    this.seen.set(key,now);if(this.seen.size>2000)this.seen.delete(this.seen.keys().next().value);return {ok:true,userId:p.userId};
  }
}
