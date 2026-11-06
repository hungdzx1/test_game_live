// Real engine outputs, disposable in-memory players; never reads/writes game saves.
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output=new URL('../unity-client/Assets/Tests/Fixtures/',import.meta.url);
await mkdir(output,{recursive:true});
const p=createPlayer('unity-fixture:1','Đạo hữu Ánh Nguyệt',0);
p.cultivation=12.25;p.inventory.tea=3;
const engine=new GameEngine([p,createPlayer('__proto__','Vân Sơn',1)],{}, {rng:()=>0.1});
const events=[];
engine.on('event',payload=>events.push({type:'game:event',version:1,sessionId:engine.transportId,seq:++engine.seq,serverTime:Date.now(),payload}));
const fixtures={};
fixtures['stopped.json']=engine.snapshot();
engine.setPhase('cultivation');engine.tick(250);fixtures['cultivation.json']=engine.snapshot();
engine.prepareBreakthrough(p.userId);engine.tick(250);fixtures['breakthrough.json']=engine.snapshot();
for(let i=0;i<80&&!engine.breakthrough.lastResult;i++)engine.tick(250);
fixtures['breakthrough-result.json']=engine.snapshot();
engine.setPhase('battle');engine.tick(250);fixtures['battle.json']=engine.snapshot();
engine.setPhase('paused');fixtures['paused-battle.json']=engine.snapshot();
engine.setPhase('battle');engine.setPhase('cultivation');fixtures['battle-result.json']=engine.snapshot();
fixtures['events.json']=events;
const hashes={};
for(const [name,value]of Object.entries(fixtures)){
  const bytes=JSON.stringify(value,null,2)+'\n';await writeFile(new URL(name,output),bytes);
  hashes[name]=createHash('sha256').update(bytes).digest('hex');
}
await writeFile(new URL('provenance.json',output),JSON.stringify({generatedAt:new Date().toISOString(),generator:'scripts/unity-network-fixtures.js',sources:['gameEngine.js:snapshot','battleService.js:snapshot','breakthroughService.js:publicState','playerStore.js:createPlayer','gameEngine.js:event'],syntheticPlayers:true,gameplayUnmodified:true,hashes},null,2)+'\n');
console.log('Captured '+Object.keys(fixtures).length+' engine fixture files, '+events.length+' real engine events.');
