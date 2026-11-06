// Stage 04 fixtures from the unchanged authoritative backend, in memory only.
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='unity-client/Assets/Tests/Fixtures/Characters';await mkdir(dir,{recursive:true});
const provenance={generator:'scripts/unity-character-fixtures.js',syntheticPlayers:true,backendUnmodified:true,files:[]};
async function save(name,value){await writeFile(`${dir}/${name}.json`,JSON.stringify(value,null,2)+'\n');provenance.files.push(name);}
for(const count of [10,50,100,500]){
 const e=new GameEngine(Array.from({length:count},(_,i)=>{const p=createPlayer('character:'+i,'Disciple '+i,i);p.realmIndex=i%11;return p;}));
 e.setPhase('cultivation');for(let i=0;i<12;i++)e.tick(250);await save('players-'+count,e.snapshot());
}
for(const success of [true,false]){
 const e=new GameEngine(Array.from({length:10},(_,i)=>createPlayer('ritual:'+i,'Disciple '+i,i)),{}, {rng:()=>success?.01:.999});
 const events=[];e.on('event',payload=>events.push({type:'game:event',version:1,sessionId:e.transportId,seq:++e.seq,serverTime:Date.now(),payload}));
 e.setPhase('cultivation');for(let i=0;i<12;i++)e.tick(250);e.prepareBreakthrough('ritual:0');e.tick(250);await save(success?'ritual-start':'failure-start',e.snapshot());
 for(let i=0;i<8;i++)e.tick(250);await save(success?'ritual-strike':'failure-strike',e.snapshot());
 e.setPhase('paused');await save(success?'ritual-paused':'failure-paused',e.snapshot());e.setPhase('cultivation');
 while(!e.breakthrough.lastResult)e.tick(250);
 await save(success?'ritual-success':'ritual-failure',e.snapshot());
 e.trigger('teleport','ritual:1');e.trigger('celebrate','ritual:2');await save(success?'success-events':'failure-events',events);
}
await save('provenance',provenance);console.log('Captured real backend snapshots for 10/50/100/500 players, success/failure/pause and events.');
