import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CameraDirector} from '../../public/js/camera.js';
import {QualityGovernor} from '../../public/js/performance.js';
import {NoticeQueue} from '../../public/js/noticeQueue.js';
import {CAMERA_MODES} from '../../public/js/settings.js';
import {RealmAura} from '../../public/js/realmAura.js';
import {CharacterView} from '../../public/js/characters.js';
import {BattleScene} from '../../public/js/battleScene.js';
import {createPlayer} from '../../playerStore.js';

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
test('05-14 Notice priority, TTL and queue bound',()=>{
  let now=0;const n=new NoticeQueue({now:()=>now});for(let i=0;i<100;i++)n.push('thường');n.push('kết quả',true);assert.equal(n.queue.length,8);assert.equal(n.next(),'kết quả');now=10001;assert.equal(n.next(),null);
});
