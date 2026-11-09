import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const folder='unity-client/Assets/Tests/Fixtures/Qua78';await fs.mkdir(folder,{recursive:true});
const e=new GameEngine(Array.from({length:30},(_,i)=>({...createPlayer('qua:'+i,'Đạo hữu '+i,i),realmIndex:i===12?0:10})),{}, {rng:()=>0});e.setPhase('cultivation');
const save=async(name,value)=>fs.writeFile(folder+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const receipt=()=>({type:'game:event',version:1,sessionId:e.transportId,seq:++e.seq,serverTime:Date.now(),payload:e.events.findLast(v=>v.kind==='item:received')});
await save('initial',e.snapshot());e.items.receiveItem(e.getPlayer('qua:12'),'tea');await save('personal',receipt());
for(let i=0;i<30;i++){e.items.receiveItem(e.getPlayer('qua:'+i),'pill',2,'boss_reward');await save('group-'+i,receipt());}
e.prepareBreakthrough('qua:12');e.tick(50);for(let i=0;i<4;i++)e.tick(250);await save('ritual',e.snapshot());
for(const path of ['Assets/Scripts/Effects/GroupReceiptPresenter.cs','Assets/Scripts/Effects/IdleCameraPresenter.cs','Assets/Editor/Qua78Setup.cs','Assets/Tests/Editor/Qua78Tests.cs','Assets/Tests/Fixtures/Qua78',...(await fs.readdir(folder)).filter(x=>x.endsWith('.json')).map(x=>'Assets/Tests/Fixtures/Qua78/'+x)]){
 try{await fs.access('unity-client/'+path+'.meta');}catch{await fs.writeFile('unity-client/'+path+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+path).digest('hex')+'\n'+(path.endsWith('/Qua78')?'folderAsset: yes\n':''));}
}
console.log('Generated personal/all/ritual payloads from the authoritative Node engine in memory.');
