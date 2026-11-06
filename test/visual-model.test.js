import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CharacterManager} from '../public/js/characters.js';
import {CameraDirector} from '../public/js/camera.js';
import {Effects} from '../public/js/effects.js';
import {GameEngine,animations} from '../gameEngine.js';
import {DemoEventSource} from '../demoEventSource.js';
// Only model transforms/resource lifetime are tested here; this is not a WebGL screenshot test.
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
test('Seven animation transforms; 100 server players / 60 meshes; snapshots reuse resources',()=>{
  const engine=new GameEngine();new DemoEventSource(engine).spawn(100);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();camera.position.set(10,20,30);
  const manager=new CharacterManager(scene);manager.sync([...engine.players.values()]);manager.update(0,.016,camera,'demo-1');assert.equal(manager.views.size,60);assert.equal(engine.players.size,100);
  const original=manager.views.get('demo-1');const ids=[...manager.views.values()].map(v=>v.root.uuid);
  for(let i=0;i<100;i++){manager.sync([...engine.players.values()]);manager.update(i*100,.016,camera,'demo-1');}
  assert.deepEqual([...manager.views.values()].map(v=>v.root.uuid),ids);
  const p=engine.players.get('demo-1'),poses=new Set();
  for(const animation of animations){p.animation=animation;p.animationStartMs=0;original.update(p,500,.016);poses.add(JSON.stringify([original.body.position.y,original.root.scale.x,...original.arms.map(a=>a.rotation.toArray()),...original.legs.map(a=>a.rotation.toArray())]));assert.ok(Number.isFinite(original.body.position.y));}
  assert.equal(poses.size,7);
  manager.limit=40;manager.nextSelection=0;manager.update(11000,.016,camera,'demo-1');assert.equal(manager.views.size,40);
  manager.sync([]);assert.equal(manager.views.size,0);assert.equal(scene.children.length,0);
});
test('Camera interpolation remains above ground; focus priority/duration; pooled effects quality',()=>{
  const camera=new THREE.PerspectiveCamera();camera.position.set(23,28,40);const director=new CameraDirector(camera),players=[{userId:'one',x:0,z:0},{userId:'two',x:5,z:3}];
  director.requestFocus('one',1,1000);director.update(0,.016,players,'auto');assert.equal(director.followed,'one');director.requestFocus('two',3,500);director.update(100,.016,players,'auto');assert.equal(director.followed,'two');director.update(700,.016,players,'overview');assert.equal(director.active,null);
  for(const mode of ['overview','orbit','follow','auto'])for(let t=0;t<10000;t+=16){director.update(t,.016,players,mode);assert.ok(camera.position.y>=7);assert.ok(camera.position.z>=0);}
  const effects=new Effects(new THREE.Scene());effects.quality('low');assert.equal(effects.particles.geometry.drawRange.count,100);effects.quality('high');assert.equal(effects.particles.geometry.drawRange.count,600);for(let i=0;i<1000;i++)effects.trigger(players[0],i);assert.equal(effects.pool.length,12);effects.update(10000);assert.ok(effects.pool.every(p=>!p.ring.visible));
});
