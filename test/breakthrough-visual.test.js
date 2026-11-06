import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BreakthroughScene,TRIBULATION} from '../public/js/breakthroughScene.js';
import {presentPlayers} from '../public/js/presentationState.js';
import {CharacterView} from '../public/js/characters.js';
import {CameraDirector} from '../public/js/camera.js';
import {Effects} from '../public/js/effects.js';
globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
test('Reload reconstructs ceremony positions/camera; 1–10 timed strikes with shared geometry',()=>{
  const scene=new THREE.Scene(),view=new BreakthroughScene(scene),geometry=view.lightning.geometry,player={userId:'p',name:'Đạo hữu',seed:1,index:0,x:0,z:0,animationStartMs:0,animation:'meditate'};
  for(let count=1;count<=10;count++){let strikes=0,wasVisible=false;for(let t=0;t<=12000;t+=10){view.update({durationMs:12000,elapsedMs:t,lightningCount:count});if(view.lightning.visible&&!wasVisible)strikes++;wasVisible=view.lightning.visible;}assert.equal(strikes,count);assert.equal(view.lightning.geometry,geometry);}
  const active={userId:'p',durationMs:12000,elapsedMs:1800,lightningCount:1};const state={players:[player],breakthrough:active};const rendered=presentPlayers(state);assert.equal(player.x,0);assert.equal(rendered[0].x,TRIBULATION.x);assert.equal(rendered[0].animation,'cast');
  const character=new CharacterView(scene,rendered[0]);character.update(rendered[0],5000,.1);assert.ok(character.arms[0].rotation.x<0);const camera=new THREE.PerspectiveCamera();camera.position.set(23,28,40);const director=new CameraDirector(camera);director.update(0,1,rendered,'overview',active);assert.equal(director.followed,'p');assert.ok(director.look.y>4);
  view.low=true;view.update(active);assert.equal(view.shake,0);assert.equal(view.lightning.visible,true);view.update(null,{outcome:true});assert.equal(view.clouds.visible,false);assert.equal(view.lightning.visible,false);assert.ok(view.flash.intensity>0);
  const failed=presentPlayers({players:[player],breakthroughResult:{userId:'p',outcome:false}});character.update(failed[0],1000,.1);assert.equal(failed[0].animation,'hit');assert.ok(character.body.rotation.x>0);assert.equal(presentPlayers({players:[player]})[0].x,0);
});
test('Five item visuals use a bounded pool and expire',()=>{const effects=new Effects(new THREE.Scene());for(let i=0;i<200;i++)effects.item({x:0,z:0},['tea','root','pill','blessing','camera'][i%5],i);assert.equal(effects.itemPool.length,8);effects.update(10000);assert.ok(effects.itemPool.every(s=>!s.group.visible));});
