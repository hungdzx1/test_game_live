import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const folder='unity-client/Assets/Tests/Fixtures/Camera9';await fs.mkdir(folder,{recursive:true});
const e=new GameEngine(Array.from({length:30},(_,i)=>createPlayer('cam:'+i,'Đạo hữu '+i,i)),{}, {rng:()=>0});e.setPhase('cultivation');
const save=async(name,value)=>fs.writeFile(folder+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const event=(kind,id,fields={})=>({type:'game:event',version:1,sessionId:e.transportId,seq:++e.seq,serverTime:Date.now(),payload:{eventId:'camera9-'+kind+'-'+e.seq,kind,userId:id,timestamp:Date.now(),...fields}});
await save('initial',e.snapshot());await save('joined-a',event('player:joined','cam:26'));await save('joined-b',event('player:joined','cam:27'));await save('returned',event('player:returned','cam:26'));
await save('gift',event('item:received','cam:12',{item:'tea',itemName:'Trà ngộ đạo',count:2,source:'viewer_gift',scope:'personal'}));
await save('gift-b',event('item:received','cam:13',{item:'pill',itemName:'Độ kiếp đan',count:1,source:'viewer_gift',scope:'personal'}));
await save('donor',event('blessing:activated',null,{source:'viewer_gift',count:3,remainingMs:90000,durationMs:90000,multiplier:2,donor:{userId:'cam:12',name:'Đạo hữu ban phúc',avatar:null}}));
await save('donor-b',event('blessing:activated',null,{source:'viewer_gift',count:1,remainingMs:120000,durationMs:120000,multiplier:2,donor:{userId:'cam:13',name:'Tiên hữu thứ hai',avatar:null}}));
e.prepareBreakthrough('cam:12');e.tick(50);for(let i=0;i<4;i++)e.tick(250);await save('ritual',e.snapshot());e.setPhase('battle');await save('battle',e.snapshot());e.setPhase('paused');await save('paused',e.snapshot());
const files=['Assets/Editor/Camera9Setup.cs','Assets/Scripts/Effects/DonorAvatarView.cs','Assets/Tests/Editor/Camera9Tests.cs','Assets/Tests/Fixtures/Camera9',...(await fs.readdir(folder)).filter(x=>x.endsWith('.json')).map(x=>'Assets/Tests/Fixtures/Camera9/'+x)];
for(const p of files){try{await fs.access('unity-client/'+p+'.meta');}catch{await fs.writeFile('unity-client/'+p+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+p).digest('hex')+'\n'+(p==='Assets/Tests/Fixtures/Camera9'?'folderAsset: yes\n':''));}}
console.log('Camera9 fixtures generated from authoritative Node state; existing data untouched.');
