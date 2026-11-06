import {audioSettings} from './settings.js';
export function spokenName(value){return [...String(value??'Đạo hữu').normalize('NFC').replace(/<[^>]*>/g,'').replace(/[<>\u0000-\u001f]/g,'').trim()].slice(0,20).join('')||'Đạo hữu';}
export function announcement(event,state){
  const p=state?.players.find(p=>p.userId===event.userId),name=spokenName(p?.name??event.name);
  if(event.kind==='breakthrough:started')return {text:`Đạo hữu ${name} đang độ kiếp, thiên lôi đã giáng xuống!`,priority:4};
  if(event.kind==='breakthrough:completed')return {text:event.outcome?`Chúc mừng ${name} đột phá thành công lên ${state?.config?.cultivation?.realms[event.realmIndex]?.name??p?.realm??'cảnh giới mới'}!`:'Độ kiếp thất bại. Hãy tiếp tục tích lũy thiên mệnh.',priority:5};
  if(event.kind==='battle:prepare')return {text:'Ma giới xâm lược! Đạo hữu xuất chiến!',priority:3};
  if(event.kind==='boss:killed')return {text:`${event.name??'Boss'} đã bị tiêu diệt!`,priority:4};
  return null;
}
export class SpeechQueue{
  constructor({synthesis=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,now=()=>performance.now(),fallback=()=>{}}={}){this.synth=synthesis;this.Utterance=Utterance;this.now=now;this.fallback=fallback;this.queue=[];this.active=null;this.enabled=false;this.unlocked=false;this.seen=new Map();this.voices=[];this.refresh=()=>{this.voices=this.synth?.getVoices?.().filter(v=>/^vi(?:-|_)/i.test(v.lang)&&v.localService===true)??[];};this.synth?.addEventListener?.('voiceschanged',this.refresh);this.refresh();}
  configure(settings){this.settings=settings;this.enabled=settings.enabled&&settings.speech;if(!this.enabled)this.clear();else this.queue.length=Math.min(this.queue.length,settings.speechQueue);}
  push(text,priority=1,key=text){
    text=String(text).replace(/[<>\u0000-\u001f]/g,'').slice(0,240);const now=this.now();for(const [k,time]of this.seen)if(now-time>30000)this.seen.delete(k);if(this.seen.has(key))return false;this.seen.set(key,now);if(this.seen.size>100)this.seen.delete(this.seen.keys().next().value);
    if(!this.enabled)return false;this.refresh();if(!this.unlocked||!this.voices.length||!this.Utterance){this.fallback(text+(this.voices.length?' · Bấm Bật âm thanh tại nguồn phát để nghe giọng đọc.':' · Không có giọng Việt cục bộ; dùng thông báo chữ.'));return false;}
    this.queue.push({text,priority,created:now,key});this.queue.sort((a,b)=>b.priority-a.priority||a.created-b.created);this.queue.length=Math.min(this.settings.speechQueue,this.queue.length);this.update();return true;
  }
  update(){const now=this.now();this.queue=this.queue.filter(x=>now-x.created<15000);if(this.active&&now-this.active.started>12000){this.synth?.cancel();this.active=null;}if(this.active||!this.enabled||!this.unlocked||!this.queue.length)return;this.refresh();if(!this.voices.length){this.queue=[];return;}const next=this.queue.shift(),utterance=new this.Utterance(next.text);utterance.voice=this.voices[0];utterance.lang='vi-VN';utterance.volume=this.settings.masterVolume*this.settings.speechVolume;utterance.rate=.95;
    const active={...next,started:now};this.active=active;const done=()=>{if(this.active===active)this.active=null;};utterance.onend=done;utterance.onerror=()=>{done();this.fallback('Giọng đọc chưa phát được; thông báo chữ vẫn hoạt động.');};try{this.synth.speak(utterance);}catch{done();this.fallback('Không phát được giọng đọc; dùng thông báo chữ.');}
  }
  clear(){this.queue=[];this.active=null;this.synth?.cancel?.();}
  dispose(){this.clear();this.synth?.removeEventListener?.('voiceschanged',this.refresh);}
}
const SOUND={sword:[650,.13,'sawtooth'],projectile:[950,.3,'triangle'],hit:[130,.12,'square'],lightning:[70,.9,'noise'],teleport:[330,.65,'sine'],bell:[660,.8,'sine'],stage:[440,.7,'triangle'],boss:[82,1.4,'noise']};
export class AudioRuntime{
  constructor({Context=globalThis.AudioContext??globalThis.webkitAudioContext,now=()=>performance.now(),fallback=()=>{},speechOptions={}}={}){this.Context=Context;this.now=now;this.fallback=fallback;this.context=null;this.voices=[];this.ambient=[];this.lastSound=new Map();this.unlocked=false;this.speech=new SpeechQueue({now,fallback,...speechOptions});this.configure({});}
  configure(input){this.settings=audioSettings(input);this.speech.configure(this.settings);if(this.context){const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.settings.enabled?this.settings.masterVolume:0,t,.03);this.fxBus.gain.setTargetAtTime(this.settings.effects?this.settings.effectsVolume:0,t,.03);this.musicBus.gain.setTargetAtTime(this.settings.music?this.settings.musicVolume*.15:0,t,.1);}
    while(this.voices.length>this.settings.maxVoices)this.stopVoice(this.voices.reduce((a,v)=>v.priority<a.priority?v:a));if(!this.settings.enabled||!this.settings.effects)this.stopEffects();if(!this.settings.enabled||!this.settings.music)this.stopAmbient();else if(this.unlocked)this.startAmbient();
  }
  async unlock(){
    if(!this.Context){this.fallback('Trình duyệt không hỗ trợ Web Audio; game tiếp tục bằng hình ảnh.');return false;}
    try{if(!this.context){const c=this.context=new this.Context();this.master=c.createGain();this.fxBus=c.createGain();this.musicBus=c.createGain();const compressor=c.createDynamicsCompressor();this.fxBus.connect(this.master);this.musicBus.connect(this.master);this.master.connect(compressor);compressor.connect(c.destination);this.compressor=compressor;this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.6;}
      await this.context.resume();this.unlocked=this.context.state==='running';this.speech.unlocked=this.unlocked;this.configure(this.settings);if(!this.unlocked)this.fallback('Âm thanh đang bị chặn. Hãy bấm trực tiếp trong Browser Source.');return this.unlocked;
    }catch{this.fallback('Không được phép phát âm thanh; hãy bật từ nguồn phát.');return false;}
  }
  play(kind,priority=1){
    if(!this.unlocked||this.context?.state!=='running'||!this.settings.enabled||!this.settings.effects)return false;const now=this.now();if(now-(this.lastSound.get(kind)??-Infinity)<(priority>=4?200:90))return false;this.lastSound.set(kind,now);
    if(this.voices.length>=this.settings.maxVoices){const low=this.voices.reduce((a,v)=>v.priority<a.priority?v:a);if(low.priority>=priority)return false;this.stopVoice(low);}
    const c=this.context,[frequency,duration,type]=SOUND[kind]??SOUND.hit,node=type==='noise'?c.createBufferSource():c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='noise'?1200:6000;
    if(type==='noise')node.buffer=this.noise;else{node.type=type;node.frequency.setValueAtTime(frequency,c.currentTime);node.frequency.exponentialRampToValueAtTime(kind==='stage'?frequency*2:Math.max(40,frequency*.4),c.currentTime+duration);}
    gain.gain.setValueAtTime(.001,c.currentTime);gain.gain.linearRampToValueAtTime(.14,c.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);node.connect(filter);filter.connect(gain);gain.connect(this.fxBus);
    const voice={node,gain,filter,priority,end:now+duration*1000+100};this.voices.push(voice);node.onended=()=>this.stopVoice(voice);node.start();node.stop(c.currentTime+duration+.02);return true;
  }
  stopVoice(v){const i=this.voices.indexOf(v);if(i<0)return;this.voices.splice(i,1);v.node.onended=null;try{v.node.stop();}catch{}for(const n of [v.node,v.gain,v.filter])n.disconnect();}
  stopEffects(){for(const v of [...this.voices])this.stopVoice(v);}
  startAmbient(){if(!this.context||this.ambient.length||!this.settings.enabled||!this.settings.music)return;for(const frequency of this.finalBoss?[82.41,123.615]:[110,165]){const node=this.context.createOscillator(),gain=this.context.createGain();node.type='sine';node.frequency.value=frequency;gain.gain.value=.12;node.connect(gain);gain.connect(this.musicBus);node.start();this.ambient.push({node,gain});}}
  stopAmbient(){for(const {node,gain}of this.ambient){try{node.stop();}catch{}node.disconnect();gain.disconnect();}this.ambient=[];}
  scene(finalBoss=false){if(this.finalBoss===finalBoss)return;this.finalBoss=finalBoss;this.ambient.forEach((v,i)=>v.node.frequency.setTargetAtTime((finalBoss?82.41:110)*(i?1.5:1),this.context.currentTime,.5));}
  event(event,state){const speech=announcement(event,state);if(speech)this.speech.push(speech.text,speech.priority,event.eventId);const sounds={'player:joined':'teleport',teleport:'teleport','stage:up':'stage','breakthrough:started':'lightning','breakthrough:completed':event.outcome?'stage':'hit','boss:killed':'boss','boss:skill':'lightning','battle:prepare':'bell','battle:hit':event.skill==='2'?'lightning':event.skill==='1'?'projectile':'sword','mob:killed':'hit','live:gift':'bell'};if(sounds[event.kind])this.play(sounds[event.kind],speech?.priority??1);}
  update(){for(const v of [...this.voices])if(v.end<this.now())this.stopVoice(v);this.speech.update();}
  dispose(){this.stopEffects();this.stopAmbient();this.speech.dispose();this.context?.close?.();}
}
