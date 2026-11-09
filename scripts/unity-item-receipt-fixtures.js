import {mkdir,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
const folder='unity-client/Assets/Tests/Fixtures/ItemReceipts';await mkdir(folder,{recursive:true});
async function meta(file,dir=false){try{await access(file+'.meta');}catch{await writeFile(file+'.meta',`fileFormatVersion: 2\nguid: ${createHash('md5').update('TuTienLive:ItemReceipts:'+file).digest('hex')}\n${dir?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n':''}`);}}
await meta(folder,true);
const engine=new GameEngine(Array.from({length:30},(_,i)=>createPlayer('receipt:'+i,'Đạo hữu '+i)),{}, {rng:()=>0});engine.setPhase('cultivation');
async function record(name,value){const file=folder+'/'+name+'.json';await writeFile(file,JSON.stringify(value,null,2)+'\n');await meta(file);}
await record('initial',engine.snapshot());
for(const [item,count]of [['tea',3],['pill',2],['root',5]]){
 engine.items.grantItem(engine.getPlayer('receipt:29'),item,count,'admin_demo');
 await record(item,{type:'game:event',version:1,sessionId:engine.transportId,seq:++engine.seq,serverTime:Date.now(),payload:engine.events.findLast(v=>v.kind==='item:received')});
}
await record('after',engine.snapshot());
engine.prepareBreakthrough('receipt:4');engine.tick(50);await record('ritual',engine.snapshot());
console.log('Recorded actual Node receipt payloads and 30-player/ritual snapshots using memory only.');
