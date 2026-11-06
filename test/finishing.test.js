import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {AudioRuntime,SpeechQueue,spokenName} from '../public/js/audio.js';
import {audioSettings,displaySettings,cameraSettings,CAMERA_MODES} from '../public/js/settings.js';
import {CameraDirector} from '../public/js/camera.js';
import {QualityGovernor} from '../public/js/performance.js';
import {NoticeQueue} from '../public/js/noticeQueue.js';
import {RealmAura} from '../public/js/realmAura.js';
import {CharacterView} from '../public/js/characters.js';
import {BattleScene} from '../public/js/battleScene.js';
import {createPlayer} from '../playerStore.js';

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
test('05-11 Camera priority queue, cooldown, min shot, bounded burst, all modes and above-ground interpolation',()=>{
  const c=new THREE.PerspectiveCamera();c.position.set(23,28,40);const d=new CameraDirector(c),players=[{userId:'a',x:0,z:0},{userId:'b',x:5,z:5}];
  d.requestFocus({kind:'join',userId:'a',battlefieldId:null,priority:1,durationMs:3000});d.update(0,.016,players,'auto');assert.equal(d.followed,'a');
  d.update(100,.016,players,'auto');d.requestFocus({kind:'gift',userId:'b',priority:3});d.update(200,.016,players,'auto');assert.equal(d.followed,'a');assert.equal(d.requestFocus({kind:'gift',userId:'b',priority:3}),false);
  d.update(2100,.016,players,'auto');assert.equal(d.followed,'b');d.requestFocus({kind:'result',userId:'a',priority:5});d.update(2200,.016,players,'auto');assert.equal(d.followed,'a');
  for(let i=0;i<100;i++)d.requestFocus({kind:'join'+i,userId:'b',priority:1});assert.ok(d.queue.length<=8);assert.ok(d.seen.size<=200);
  d.active=null;d.queue=[];for(const mode of CAMERA_MODES){d.update(30000,.016,players,mode,null,null,null,{userId:'b'});assert.ok(Number.isFinite(c.position.x));assert.ok(c.position.y>=7);assert.ok(c.position.z>=6);}
  d.update(31000,.016,players,'followPlayer',null,null,null,{userId:'b'});assert.equal(d.followed,'b');
  assert.equal(d.requestFocus({kind:'boss',battlefieldId:0,priority:4}),true);d.queue=[];
  d.requestFocus({kind:'gift-high',userId:'b',priority:6});
  const battle={viewId:0,elapsedMs:6000,viewSince:0,view:{activeBoss:{type:2,status:'alive',x:0,z:0},top:[]}};
  d.update(32000,.016,players,'auto',null,battle,null,{settings:{priorities:{boss:7}}});assert.equal(d.followed,null);
  d.update(32100,.016,players,'auto',null,battle,null,{settings:{priorities:{boss:4}}});assert.equal(d.followed,'b');
});
test('05-15 Distinct 11 procedural realm shapes reuse resources without per-frame allocation',()=>{
  const aura=new RealmAura(new THREE.Group()),signatures=[];
  for(let realm=0;realm<11;realm++){
    aura.update(realm,0);signatures.push(JSON.stringify(aura.root.children.map(m=>[m.geometry.type,m.position.toArray(),m.scale.toArray()])));
    const ids=aura.root.children.map(m=>[m.uuid,m.geometry.uuid,m.material.uuid]);for(let t=0;t<100;t++)aura.update(realm,t*.016);
    assert.deepEqual(aura.root.children.map(m=>[m.uuid,m.geometry.uuid,m.material.uuid]),ids);
  }assert.equal(new Set(signatures).size,11);
  aura.update(10,2,true);assert.ok(aura.root.children.filter(c=>c.visible).length<=2);
  const previousDocument=globalThis.document;let canvases=0;
  globalThis.document={createElement(){canvases++;return {getContext:()=>({fillRect(){},fillText(){}})};}};
  try{
    const scene=new THREE.Scene(),p=createPlayer('pose','Đạo hữu',0),v=new CharacterView(scene,p);
    v.update({...p,animation:'run'},1000,.016);assert.ok(Math.abs(v.legs[0].rotation.x)>.1);
    v.update({...p,animation:'fly'},1100,.016);assert.ok(v.root.position.y>.3);assert.equal(v.arms[1].rotation.z,1.1);
    v.update({...p,animation:'bow'},1200,.016);assert.equal(v.body.rotation.x,.7);assert.equal(v.arms[0].rotation.x,-.9);v.dispose(scene);
    const b=new BattleScene(scene);b.sync({effectivePhase:'battle',battle:{status:'running',view:{id:0,mobs:[]}}});b.showDamage=false;
    const before=canvases;b.event({kind:'battle:hit',fieldId:0,damage:20},0);assert.equal(canvases,before);assert.equal(b.fx[0].text.visible,false);
    b.showDamage=true;b.event({kind:'battle:hit',fieldId:0,damage:20},1000);assert.equal(canvases,before+1);assert.equal(b.fx[1].text.visible,true);
  }finally{globalThis.document=previousDocument;}
});
test('05-15 Auto quality requires sustained measured low FPS; disabling preserves preset',()=>{
  const q=new QualityGovernor();q.configure('high');for(let i=0;i<100;i++)q.sample(50);assert.equal(q.level,'high');for(let i=0;i<100;i++)q.sample(50);assert.equal(q.level,'medium');assert.equal(q.fps,20);
  q.configure('high',false);for(let i=0;i<400;i++)q.sample(50);assert.equal(q.level,'high');assert.equal(q.sample(3000),false);
});
test('05-14 Notice priority, TTL and queue bound; settings reject invalid values',()=>{
  let now=0;const n=new NoticeQueue({now:()=>now});for(let i=0;i<100;i++)n.push('thường');n.push('kết quả',true);assert.equal(n.queue.length,8);assert.equal(n.next(),'kết quả');now=10001;assert.equal(n.next(),null);
  assert.throws(()=>audioSettings({masterVolume:2}));assert.throws(()=>displaySettings({particleScale:0}));assert.throws(()=>cameraSettings({priorities:{gift:11}}));assert.throws(()=>audioSettings({unknown:true}));assert.equal(cameraSettings({priorities:{gift:4}}).priorities.result,5);
});
