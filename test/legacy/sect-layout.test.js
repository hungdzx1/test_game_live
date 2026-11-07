import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SECT_BOUNDS,SECT_CAMERA_ANCHOR,TRIBULATION_PLATFORM_CENTER,sectSeat} from '../../public/js/sectLayout.js';
import {TRIBULATION,BreakthroughScene} from '../../public/js/breakthroughScene.js';
import {presentPlayers} from '../../public/js/presentationState.js';
import {CharacterManager} from '../../public/js/characters.js';
import {CameraDirector} from '../../public/js/camera.js';

globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
const players=count=>Array.from({length:count},(_,i)=>Object.freeze({userId:'p'+i,name:'Đạo hữu '+i,seed:i,index:i,x:100+i,z:200+i,animation:'meditate',animationStartMs:0}));
function frame(camera){
  camera.updateMatrixWorld(true);
  const result={};
  for(const [name,b]of Object.entries(SECT_BOUNDS)){
    const pts=[];
    for(let i=0;i<64;i++)for(const y of [0,b.height])pts.push(new THREE.Vector3(b.center.x+Math.sin(i*Math.PI/32)*b.radius,b.center.y+y,b.center.z+Math.cos(i*Math.PI/32)*b.radius).project(camera));
    result[name]={left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),bottom:Math.min(...pts.map(p=>p.y)),top:Math.max(...pts.map(p=>p.y))};
    for(const p of pts){assert.ok(Math.abs(p.x)<.94,`${name} horizontal crop: ${p.x}`);assert.ok(p.y>-.6&&p.y<.73,`${name} outside scene safe area: ${p.y}`);assert.ok(p.z>-1&&p.z<1);}
  }
  assert.ok(result.courtyard.top<result.tribulation.bottom,'The two areas remain vertically separated');
}

test('06.1 courtyard/platform volumes fit 720x1280 and 1080x1920 overview, auto and legacy orbit',()=>{
  for(const [w,h]of [[720,1280],[1080,1920]])for(const mode of ['overview','sectOverview','cultivationGroup','auto','orbit','breakthrough']){
    const camera=new THREE.PerspectiveCamera(45,w/h,.1,200);camera.position.copy(SECT_CAMERA_ANCHOR.position);
    const director=new CameraDirector(camera);director.target.copy(SECT_CAMERA_ANCHOR.target);
    for(let t=0;t<48000;t+=500){director.update(t,.1,[],mode);frame(camera);}
  }
});
test('06.1 frozen server snapshots keep all 60 identities; shared seat/platform anchors never mutate gameplay',()=>{
  const input=players(60),before=JSON.stringify(input),shown=presentPlayers({players:input});
  assert.equal(shown.length,60);assert.equal(shown.filter(p=>p.sectVisible).length,12);
  assert.equal(new Set(shown.slice(0,12).map(p=>`${p.x}:${p.z}`)).size,12);
  assert.deepEqual(shown.map(p=>p.userId),input.map(p=>p.userId));
  assert.deepEqual(sectSeat(12),sectSeat(0));assert.equal(TRIBULATION,TRIBULATION_PLATFORM_CENTER);
  for(const outcome of [true,false]){
    const p=presentPlayers({players:input,breakthroughResult:{userId:'p59',outcome}})[59];
    assert.equal(p.x,TRIBULATION.x);assert.equal(p.z,TRIBULATION.z);assert.equal(p.elevation,TRIBULATION.y+.3);assert.equal(p.sectVisible,true);
  }
  assert.equal(JSON.stringify(input),before);
  const walk=presentPlayers({players:[{...input[0],homeX:100,homeZ:200,x:100.5,z:199.7,animation:'walk'}]})[0];assert.equal(walk.x,sectSeat(0).x+.5);assert.ok(Math.abs(walk.z-sectSeat(0).z+.3)<1e-12);assert.equal(walk.animation,'walk');
  const view=new BreakthroughScene(new THREE.Scene());assert.deepEqual(view.group.position.toArray(),Object.values(TRIBULATION));
});
test('06.1 twelve representatives, hidden-user focus and ceremony remain visible; battle uses original cap and positions',()=>{
  const scene=new THREE.Scene(),manager=new CharacterManager(scene),camera=new THREE.PerspectiveCamera();camera.position.copy(SECT_CAMERA_ANCHOR.position);
  const input=players(60),shown=presentPlayers({players:input});manager.sync(shown);manager.update(0,.016,camera,null);assert.equal(manager.views.size,12);
  const sharedGeometry=manager.views.get('p0').head.geometry,sharedMaterial=manager.views.get('p0').head.material;
  for(let i=1;i<20;i++){
    manager.sync(shown);manager.update(i*1000,.016,camera,'p59');assert.equal(manager.views.size,12);assert.ok(manager.views.has('p59'));assert.equal(manager.views.has('p11'),false);
  }
  const active=presentPlayers({players:input,breakthrough:{userId:'p59'}});manager.sync(active);manager.update(21000,.016,camera,'p59');assert.equal(manager.views.size,13);
  const part=Object.fromEntries(input.map((p,i)=>[p.userId,{x:i,z:-i,animationUntil:1000,animation:'attack'}]));
  const battle=presentPlayers({players:input,effectivePhase:'battle',elapsedMs:0,battle:{status:'running',elapsedMs:0,view:{participants:part}}});
  assert.equal(battle[59].x,59);assert.equal(battle[59].z,-59);assert.equal(battle[59].sectVisible,undefined);
  manager.sync(battle);manager.update(22000,.016,camera,null);assert.equal(manager.views.size,60);
  manager.sync(shown);manager.update(23000,.016,camera,null);assert.equal(manager.views.size,12);
  assert.equal(manager.views.get('p0').head.geometry,sharedGeometry);assert.equal(manager.views.get('p0').head.material,sharedMaterial);
  assert.notEqual(sharedGeometry.attributes.position.array.length,0);
});
