// Record genuine backend snapshots; no production save files are read or written.
import fs from'node:fs';import crypto from'node:crypto';import{GameEngine}from'../gameEngine.js';
const root='unity-client/Assets/Tests/Fixtures/Blessing';fs.mkdirSync(root,{recursive:true});
const players=JSON.parse(fs.readFileSync('unity-client/Assets/Tests/Fixtures/SectHud/level2.json')).payload.players;
const advance=(e,ms)=>{for(let left=ms;left>0;left-=250)e.tick(Math.min(250,left));};
const e=()=>{const engine=new GameEngine(players);engine.setPhase('cultivation');return engine;};
const gift=engine=>engine.liveEvents.accept({source:'demo',loai:'qua',eventId:crypto.randomUUID(),userId:players[0].userId,ten:players[0].name,giftId:'999',qua:'Quà demo',soKimCuong:100,soLuong:1,rawMeta:{streamId:'blessing-fixture',giftType:0}});
const cases={idle:x=>{},'active-30':x=>gift(x),'remaining-15':x=>{gift(x);advance(x,15000);},'stacked-50':x=>{gift(x);advance(x,10000);gift(x);},'level-up':x=>x.liveEvents.accept({source:'demo',loai:'tim',eventId:crypto.randomUUID(),userId:players[0].userId,ten:players[0].name,soLuong:1000,rawMeta:{streamId:'blessing-fixture'}}),expired:x=>{gift(x);advance(x,30000);},paused:x=>{gift(x);x.setPhase('paused');advance(x,5000);},battle:x=>{gift(x);x.setPhase('battle');advance(x,1000);}};
for(const[name,run]of Object.entries(cases)){const engine=e();run(engine);fs.writeFileSync(root+'/'+name+'.json',JSON.stringify(engine.snapshot(),null,2)+'\n');}
const meta=(p,folder=false)=>{if(!fs.existsSync(p+'.meta'))fs.writeFileSync(p+'.meta','fileFormatVersion: 2\nguid: '+crypto.randomUUID().replaceAll('-','')+'\n'+(folder?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n':''));};meta(root,true);for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.json')))meta(root+'/'+file);
console.log('Recorded '+Object.keys(cases).length+' real-engine blessing snapshots.');
