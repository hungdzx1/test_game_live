import {EventEmitter} from 'node:events';
import {TikTokLiveConnection,ControlEvent,WebcastEvent,SignConfig} from 'tiktok-live-connector';
import {usernameFor,liveRulesFor} from './liveConfig.js';
import {fromTikTok} from './normalizeEvent.js';
export function connectionFactory(username,key){
  // This package caches its signer client globally; replace the cache before key changes.
  SignConfig.apiKey=key||undefined;SignConfig.cachedInstance=undefined;
  return new TikTokLiveConnection(username,{processInitialData:false,enableExtendedGiftInfo:false,authenticateWs:false,useMobile:false,signApiKey:key||undefined,webClientOptions:{timeout:{request:15000},retry:{limit:0}},wsClientOptions:{handshakeTimeout:15000}});
}
export function liveError(error){
  const name=error?.exception?.name??error?.name??'',status=error?.exception?.response?.statusCode??error?.response?.statusCode;
  if(name==='UserOfflineError')return {code:'offline',retry:false,message:'Kênh chưa LIVE hoặc LIVE đã kết thúc. Hãy lên LIVE bằng TikTok/LIVE Studio rồi bấm NỐI.'};
  if(name==='InvalidUniqueIdError')return {code:'username',retry:false,message:'Tên tài khoản TikTok không hợp lệ hoặc không tồn tại. Kiểm tra lại tên kênh.'};
  if(name.includes('Sign')||status===401||status===403)return {code:'signing',retry:name==='SignatureRateLimitError',message:name==='SignatureRateLimitError'?'Dịch vụ ký đang giới hạn tần suất. Đang chờ nối lại.':'Không thể ký kết nối. Kiểm tra khóa ký Euler Stream hoặc phiên bản connector.'};
  if(status===429)return {code:'rate_limit',retry:true,message:'TikTok đang giới hạn tần suất; chờ trước khi nối lại.'};
  if(name.includes('Schema')||name.includes('Response'))return {code:'protocol',retry:false,message:'TikTok trả dữ liệu không tương thích hoặc không tìm thấy kênh. Kiểm tra tên kênh và phiên bản connector.'};
  return {code:'network',retry:true,message:'Mất mạng hoặc không thể kết nối TikTok. Game nội bộ vẫn tiếp tục.'};
}
export class TikTokAdapter extends EventEmitter{
  constructor({factory=connectionFactory,onEvent=()=>{},words=[],settings={},setTimer=setTimeout,clearTimer=clearTimeout}={}){
    super();this.factory=factory;this.onEvent=onEvent;this.words=words;this.settings=liveRulesFor(settings);this.setTimer=setTimer;this.clearTimer=clearTimer;this.connection=null;this.operation=null;this.timer=null;this.generation=0;this.intent=false;this.attempts=0;this.username='';this.key='';this.history=[];this.state={state:'disconnected',message:'Chưa kết nối TikTok LIVE',attempts:0,username:''};
  }
  status(state,message,code=''){this.state={state,message,code,attempts:this.attempts,username:this.username};this.history.push({...this.state,timestamp:Date.now()});if(this.history.length>20)this.history.shift();this.emit('status',this.snapshot());}
  snapshot(){return {...this.state,history:[...this.history]};}
  connect(username,key=''){
    username=usernameFor(username);if(typeof key!=='string'||key.length>512||/[\r\n]/.test(key))throw new Error('Khóa ký không hợp lệ.');
    if(this.intent||this.operation||this.connection||this.timer)return {alreadyConnecting:true};
    this.username=username;this.key=key;this.attempts=0;this.intent=true;this.generation++;this.begin(this.generation);return {started:true};
  }
  begin(generation){
    if(!this.intent||generation!==this.generation||this.operation)return;
    this.status(this.attempts?'reconnecting':'connecting',this.attempts?`Đang nối lại TikTok · lần ${this.attempts}/${this.settings.maxReconnectAttempts}`:'Đang nối TikTok LIVE…');
    const op=this.open(generation);this.operation=op;op.finally(()=>{if(this.operation===op)this.operation=null;}).catch(()=>{});
  }
  async open(generation){
    let c;
    try{
      c=this.factory(this.username,this.key);this.connection=c;
      const current=()=>generation===this.generation&&this.intent&&this.connection===c;
      const bind=(name,fn)=>c.on(name,fn);
      for(const [name,kind]of [[WebcastEvent.CHAT,'chat'],[WebcastEvent.GIFT,'gift'],[WebcastEvent.LIKE,'like'],[WebcastEvent.FOLLOW,'follow'],[WebcastEvent.MEMBER,'member']])bind(name,data=>{
        if(!current())return;try{const event=fromTikTok(kind,data,c.roomId,this.words);Promise.resolve(this.onEvent(event)).catch(()=>this.emit('diagnostic','Không thể xử lý sự kiện; kiểm tra nhật ký cục bộ.'));}catch{this.emit('diagnostic','Bỏ qua sự kiện thiếu ID/đơn giá hoặc dữ liệu không hợp lệ.');}
      });
      bind(ControlEvent.ERROR,error=>{if(current()){const info=liveError(error);this.status(this.state.state,info.message,info.code);}});
      bind(ControlEvent.DISCONNECTED,()=>{if(current())this.lost(c,generation);});
      bind(WebcastEvent.STREAM_END,()=>{if(current()){this.intent=false;this.generation++;this.clearTimer(this.timer);this.timer=null;this.key='';this.status('ended','Phiên LIVE đã kết thúc. Game vẫn chạy; bấm NỐI khi có phiên mới.','ended');this.dispose(c);}});
      const state=await c.connect();
      if(!current()){await this.dispose(c);return;}
      if(!state?.isConnected&&!c.isConnected)throw new Error('Unconfirmed connection');
      this.attempts=0;this.status('connected','Đã kết nối TikTok LIVE');
    }catch(error){
      if(c)await this.dispose(c);if(generation!==this.generation||!this.intent)return;
      const info=liveError(error);if(info.retry)this.schedule(generation,info);else{this.intent=false;this.key='';this.status('error',info.message,info.code);}
    }
  }
  async dispose(c){if(!c)return;c.removeAllListeners();c.on(ControlEvent.ERROR,()=>{});if(this.connection===c)this.connection=null;try{await c.disconnect();}catch{} }
  async lost(c,generation){await this.dispose(c);if(generation===this.generation&&this.intent)this.schedule(generation,liveError(new Error('Disconnected')));}
  schedule(generation,info){
    if(this.timer||generation!==this.generation||!this.intent)return;
    if(this.attempts>=this.settings.maxReconnectAttempts){this.intent=false;this.key='';this.status('error',`Không thể kết nối sau ${this.settings.maxReconnectAttempts} lần thử. Kiểm tra tên kênh/LIVE và bấm NỐI lại.`,'exhausted');return;}
    this.status('reconnecting',`${info.message} Thử lại sau ${this.settings.reconnectSeconds} giây.`,info.code);
    this.timer=this.setTimer(()=>{this.timer=null;this.attempts++;this.begin(generation);},this.settings.reconnectSeconds*1000);this.timer?.unref?.();
  }
  async disconnect(){this.intent=false;this.generation++;this.clearTimer(this.timer);this.timer=null;this.key='';this.status('disconnecting','Đang ngắt TikTok LIVE; game nội bộ vẫn tiếp tục.');const c=this.connection;await this.dispose(c);await this.operation;this.operation=null;this.status('disconnected','Đã ngắt TikTok LIVE; game nội bộ vẫn tiếp tục.');}
}
