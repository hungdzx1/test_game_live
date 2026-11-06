import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CharacterView,CharacterManager} from '../public/js/characters.js';
import {EnemyView} from '../public/js/battleScene.js';
import {appearanceFor} from '../public/js/proceduralCostumes.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const player=(i=0)=>({userId:'p'+i,name:'Đạo hữu '+i,seed:i,index:i,x:i%10,z:Math.floor(i/10),realmIndex:0,animation:'meditate',animationStartMs:0});
const signature=view=>{const result=[];view.body.traverse(o=>{if(o.isMesh)result.push([o.name,o.geometry.attributes.position.count,o.geometry.attributes.color?.array.slice(0,3)]);});return JSON.stringify(result);};

test('06.2 stable seed selects six hair/five robes/four weapons; reload geometry and palettes match',()=>{
  const variants=Array.from({length:120},(_,i)=>appearanceFor(i));
  for(const [key,count]of [['hair',6],['robe',5],['weapon',4]])assert.equal(new Set(variants.map(a=>a[key])).size,count);
  assert.equal(new Set(Array.from({length:720},(_,i)=>appearanceFor(i).palette)).size,6);
  const actual=(v,key)=>JSON.stringify(key==='hair'?[...v.fullHead.attributes.position.array,...v.hair.geometry.attributes.position.array]:key==='robe'?[...v.body.children[0].geometry.attributes.position.array,...v.skirt.geometry.attributes.position.array]:[...v.weapon.geometry.attributes.position.array]);
  for(const [key,count,step]of [['hair',6,1],['robe',5,6],['weapon',4,30]]){
    const shapes=[];for(let i=0;i<count;i++){const scene=new THREE.Scene(),v=new CharacterView(scene,player(i*step));shapes.push(actual(v,key));v.dispose(scene);}assert.equal(new Set(shapes).size,count,'Actual distinct '+key+' geometry');
  }
  const scene=new THREE.Scene(),p=Object.freeze(player(29387)),before=JSON.stringify(p),a=new CharacterView(scene,p),b=new CharacterView(scene,p);
  assert.deepEqual(a.appearance,b.appearance);assert.equal(signature(a),signature(b));assert.equal(a.head.geometry,b.head.geometry);assert.equal(a.head.material,b.head.material);
  for(let t=0;t<500;t++)a.update(p,t*16,.016);assert.equal(JSON.stringify(p),before);assert.equal(signature(a),signature(b));
});
test('06.2 all twelve poses are finite/distinct and cross-legged joints recover after hit/death',()=>{
  const p=player(),v=new CharacterView(new THREE.Scene(),p),poses=new Set();
  const animations=['meditate','standUp','walk','run','fly','bow','attack','cast','hit','defeated','celebrate','teleport'];
  for(const animation of animations){
    v.update({...p,animation},600,.1);v.root.updateMatrixWorld(true);
    v.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),animation));
    poses.add(JSON.stringify([v.body.position.toArray(),v.body.rotation.toArray(),v.root.scale.toArray(),...v.arms.map(a=>a.rotation.toArray()),...v.legs.map(a=>a.rotation.toArray())]));
  }
  assert.equal(poses.size,animations.length);
  v.update(p,1000,.016);assert.ok(v.legs[0].rotation.z<0&&v.legs[1].rotation.z>0);assert.ok(v.knees.every(k=>k.rotation.x>1));assert.equal(v.weapon.visible,false);
  v.update({...p,animation:'idle'},1200,.016);assert.equal(v.body.rotation.z,0);assert.ok(v.knees.every(k=>k.rotation.x===0));
});
test('06.2 distance/low LOD and sparse labels keep 60/40 caps; focus retains detail and all eleven realm values',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),manager=new CharacterManager(scene),input=Array.from({length:100},(_,i)=>player(i));camera.position.set(10,30,50);
  manager.sync(input);manager.update(0,.016,camera,'p99');assert.equal(manager.views.size,60);
  assert.ok([...manager.views.values()].filter(v=>v.tag.visible).length<=9);
  const focus=manager.views.get('p99');assert.equal(focus.detailed,true);assert.equal(focus.hair.visible,true);assert.equal(focus.tag.material.opacity,1);
  const far=[...manager.views.values()].find(v=>v!==focus);assert.equal(far.detailed,false);assert.equal(far.head.geometry,far.simpleHead);assert.ok(far.tag.material.opacity<1);
  manager.limit=40;manager.nextSelection=0;manager.update(1000,.016,camera,'p99');assert.equal(manager.views.size,40);
  for(let realm=0;realm<11;realm++){focus.update({...input[99],realmIndex:realm},2000,.016,camera,true);assert.equal(focus.realmAura.realm,realm);}
  assert.ok(input.every(p=>p.realmIndex===0));
});
test('06.2 LOD switches and disposal preserve cached geometry/material; only owned name textures are disposed',()=>{
  const scene=new THREE.Scene(),p=player(1223),v=new CharacterView(scene,p),camera=new THREE.PerspectiveCamera();camera.position.set(0,2,5);
  const geometry=v.fullHead,material=v.head.material;let geometryDisposals=0,materialDisposals=0,labelDisposals=0;
  geometry.addEventListener('dispose',()=>geometryDisposals++);material.addEventListener('dispose',()=>materialDisposals++);v.tag.material.map.addEventListener('dispose',()=>labelDisposals++);
  const signatureBefore=signature(v),children=[];v.root.traverse(o=>children.push(o.uuid));
  for(let i=0;i<200;i++){v.low=i%2===0;camera.position.z=i%2?5:80;v.update(p,i*16,.016,camera,i%3===0);}
  const after=[];v.root.traverse(o=>after.push(o.uuid));assert.deepEqual(after,children);v.low=false;v.update(p,4000,.016,camera,true);assert.equal(signature(v),signatureBefore);
  v.dispose(scene);assert.equal(geometryDisposals,0);assert.equal(materialDisposals,0);assert.equal(labelDisposals,1);
  const reload=new CharacterView(scene,p);assert.equal(reload.fullHead,geometry);assert.equal(reload.head.material,material);
});
test('06.2 three boss silhouettes, clear HP, server movement/hit/death and bounded low effects',()=>{
  const scene=new THREE.Scene(),views=[0,1,2].map(type=>new EnemyView(scene,type,true)),signatures=[];
  for(const [type,v]of views.entries()){
    signatures.push(signature(v));const state=Object.freeze({id:'boss'+type,x:3,z:-4,facing:.7,spawnTime:0,animation:'walk',hp:25,maxHp:100,status:'alive'}),before=JSON.stringify(state);
    v.update(state,1,.016);assert.equal(v.root.position.x,3);assert.equal(v.root.position.z,-4);assert.equal(v.body.rotation.y,.7);assert.equal(v.hp.scale.x,1.1*.25);
    v.body.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(v.body);assert.ok(box.max.y<v.hp.position.y,'Aura/hair/crown below HP');
    v.update({...state,animation:'attack'},1.1,.016);assert.ok(Math.abs(v.arms[1].rotation.x)>.1);v.update({...state,animation:'hit'},1.2,.016);assert.notEqual(v.body.rotation.z,0);
    const ids=[];v.root.traverse(o=>ids.push(o.uuid));v.low=true;v.update({...state,enraged:true},2,.016);assert.equal(v.cape.visible,false);if(v.halo)assert.equal(v.halo.visible,false);
    v.update({...state,status:'dead',deathAt:2000},3,.016);assert.equal(v.root.visible,false);v.update({...state,id:'next'},4,.016);assert.equal(v.root.visible,true);
    const after=[];v.root.traverse(o=>after.push(o.uuid));assert.deepEqual(after,ids);assert.equal(JSON.stringify(state),before);
  }
  assert.equal(new Set(signatures).size,3);
});
