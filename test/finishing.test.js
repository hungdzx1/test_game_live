import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioRuntime,SpeechQueue,spokenName} from '../public/js/audio.js';
import {audioSettings,displaySettings,cameraSettings} from '../public/js/settings.js';

class Param {value=0;setTargetAtTime(v){this.value=v;}setValueAtTime(v){this.value=v;}linearRampToValueAtTime(v){this.value=v;}exponentialRampToValueAtTime(v){this.value=v;}}
class Node {gain=new Param();frequency=new Param();connect(){}disconnect(){this.disconnected=true;}start(){this.started=true;}stop(){this.stopped=true;}}
class Context {
  static created=0;state='suspended';currentTime=0;sampleRate=100;destination=new Node();
  constructor(){Context.created++;}async resume(){this.state='running';}close(){this.state='closed';}
  createGain(){return new Node();}createOscillator(){return new Node();}createBufferSource(){return new Node();}createBiquadFilter(){return new Node();}createDynamicsCompressor(){return new Node();}createBuffer(){return {getChannelData:()=>new Float32Array(100)};}
}
class Utterance {constructor(text){this.text=text;}}
test('05-12 Web Audio gesture gate, eight procedural sounds, bounded priority voices and real mute/disposal (mock API)',async()=>{
  Context.created=0;let time=0;const a=new AudioRuntime({Context,now:()=>time,speechOptions:{synthesis:null}});
  assert.equal(Context.created,0);assert.equal(a.play('sword'),false);
  assert.equal(await a.unlock(),true);assert.equal(Context.created,1);assert.equal(a.ambient.length,2);
  a.configure({...a.settings,maxVoices:2});assert.equal(a.play('sword'),true);assert.equal(a.play('hit'),true);assert.equal(a.play('bell',5),true);assert.equal(a.voices.length,2);assert.ok(a.voices.some(v=>v.priority===5));
  for(const kind of ['sword','projectile','hit','lightning','teleport','bell','stage','boss']){time+=2000;a.update();assert.equal(a.play(kind,4),true);}
  const nodes=a.voices.map(v=>v.node);a.configure({...a.settings,enabled:false});assert.equal(a.master.gain.value,0);assert.equal(a.voices.length,0);assert.equal(a.ambient.length,0);assert.ok(nodes.every(n=>n.stopped&&n.disconnected));assert.equal(a.play('boss',10),false);
  a.dispose();assert.equal(a.context.state,'closed');
});
test('05-13 TTS local Vietnamese only, text fallback, priority/TTL/dedup and mute (mock API)',()=>{
  let time=0,voices=[],cancelled=0;const spoken=[],fallback=[];
  const synthesis={getVoices:()=>voices,speak:v=>spoken.push(v),cancel:()=>cancelled++,addEventListener(){},removeEventListener(){}};
  const q=new SpeechQueue({synthesis,Utterance,now:()=>time,fallback:t=>fallback.push(t)});q.configure(audioSettings({speechQueue:2}));q.unlocked=true;
  voices=[{lang:'en-US',localService:true},{lang:'vi-VN',localService:false}];q.push('Không gửi ra mạng',1,'missing');assert.equal(spoken.length,0);assert.match(fallback[0],/giọng Việt cục bộ/);
  voices=[{lang:'vi-VN',localService:true}];q.push('Đang đọc',1,'active');q.push('thấp',1,'low');q.push('quà',3,'gift');q.push('kết quả',5,'result');assert.equal(q.queue.length,2);assert.deepEqual(q.queue.map(x=>x.key),['result','gift']);assert.equal(q.push('trùng',5,'result'),false);
  spoken[0].onend();q.update();assert.equal(spoken[1].text,'kết quả');assert.equal(spoken[1].voice.localService,true);assert.equal(spoken[1].volume,.4);
  time=20000;q.update();assert.equal(q.active,null);assert.equal(q.queue.length,0);q.configure(audioSettings({speech:false}));assert.ok(cancelled>0);assert.equal(q.push('tắt',5,'off'),false);q.dispose();assert.equal([...spokenName('<b>Đạo hữu</b>'+ 'a'.repeat(30))].length,20);
});
test('05-14 Shared audio/display/camera settings reject invalid values',()=>{
  assert.throws(()=>audioSettings({masterVolume:2}));assert.throws(()=>displaySettings({particleScale:0}));assert.throws(()=>cameraSettings({priorities:{gift:11}}));assert.throws(()=>audioSettings({unknown:true}));assert.equal(cameraSettings({priorities:{gift:4}}).priorities.result,5);
});
