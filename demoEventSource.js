import {randomUUID} from 'node:crypto';
import { seedFor } from './gameEngine.js';
const names = ['Thanh Vân', 'Minh Nguyệt', 'Bạch Liên', 'Thiên Phong', 'Ngọc Lam', 'Trúc An', 'Hải Đường', 'Vân Sơn', 'Diệp Linh', 'Tử Yên'];
export class DemoEventSource {
  constructor(engine) { this.engine = engine; }
  spawn(count) {
    if (!Number.isInteger(count) || count < 1 || count > 500) throw new Error('Số nhân vật phải từ 1 đến 500.');
    const needed=Array.from({length:count},(_,i)=>`demo-${i+1}`).filter(id=>!this.engine.players.has(id)).length;
    if(this.engine.players.size+needed>500)throw new Error('Tổng số đạo hữu demo vượt giới hạn 500.');
    // Reusing demo IDs must not reset their cultivation or inventory.
    for (let i = 0; i < count; i++) {
      const userId = `demo-${i + 1}`, x = (i % 10 - 4.5) * 1.75, z = Math.floor(i / 10) * 1.9 - 4;
      if(!this.engine.players.has(userId))this.emit({eventId:randomUUID(),loai:'binhluan',userId,ten:`${names[i % 10]} ${Math.floor(i / 10) + 1}`,noiDung:'nhập môn'},{bypassRate:true});
    }
    if(this.engine.battle.current?.status!=='running')this.engine.setPhase('cultivation');
  }
  emit(event,options={}){if(this.engine.mode!=='demo')throw new Error('Sự kiện giả chỉ dùng trong chế độ demo.');return this.engine.liveEvents.accept({...event,source:'demo',rawMeta:{streamId:this.engine.sessionId,...event.rawMeta}},options);}
  send(kind, id) { this.engine.trigger(kind, id); }
}
