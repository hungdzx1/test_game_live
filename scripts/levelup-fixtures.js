import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
import {decodePng,measurePixels} from './audit-assets.js';
const folder='unity-client/Assets/Tests/Fixtures/LevelUp';await fs.mkdir(folder,{recursive:true});
const make=rng=>{const e=new GameEngine(Array.from({length:30},(_,i)=>createPlayer('level:'+i,'Đạo hữu '+i,i)),{}, {rng});e.setPhase('cultivation');return e;};
const save=async(name,value)=>fs.writeFile(folder+'/'+name+'.json',JSON.stringify(value,null,2)+'\n');
const event=(e,kind)=>({type:'game:event',version:1,sessionId:e.transportId,seq:++e.seq,serverTime:Date.now(),payload:e.events.findLast(x=>x.kind===kind)});
const stage=make(()=>0);await save('initial',stage.snapshot());stage.cultivation.add(stage.getPlayer('level:12'),stage.rules.realms[0].thresholds[0]);await save('stage',event(stage,'stage:up'));await save('stage-after',stage.snapshot());
stage.prepareBreakthrough('level:12');let index=0;for(const payload of stage.events.filter(x=>x.kind==='stage:up'&&x.stageIndex>1)){await save('multi-'+(++index),{...event(stage,'stage:up'),payload});}
for(const [name,rng]of [['realm',()=>0],['failure',()=>.999]]){const e=make(rng);e.prepareBreakthrough('level:29');e.tick(50);while(e.breakthrough.active)e.tick(250);await save(name,event(e,'breakthrough:completed'));await save(name+'-after',e.snapshot());}
const hidden=make(()=>0);hidden.cultivation.add(hidden.getPlayer('level:29'),hidden.rules.realms[0].thresholds[0]);await save('hidden',event(hidden,'stage:up'));await save('hidden-after',hidden.snapshot());
for(const path of ['Assets/Scripts/Effects/LevelUpPresenter.cs','Assets/Editor/LevelUpSetup.cs','Assets/Tests/Editor/LevelUpTests.cs','Assets/Tests/Fixtures/LevelUp',...(await fs.readdir(folder)).filter(x=>x.endsWith('.json')).map(x=>'Assets/Tests/Fixtures/LevelUp/'+x)]){
 try{await fs.access('unity-client/'+path+'.meta');}catch{await fs.writeFile('unity-client/'+path+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+path).digest('hex')+'\n'+(path.endsWith('/LevelUp')?'folderAsset: yes\n':''));}
}
const art='unity-client/Assets/Art/Characters/LVUP/',assets=[];for(const file of await fs.readdir(art))if(file.endsWith('.png')){const bytes=await fs.readFile(art+file),decoded=decodePng(bytes);assets.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),width:decoded.width,height:decoded.height,...measurePixels(decoded)});}
await fs.mkdir('docs/Tailieu_output/level-up',{recursive:true});await fs.writeFile('docs/Tailieu_output/level-up/asset-audit.json',JSON.stringify({assets,missing:['levelup_light_beams.png'],concept:'reference only'},null,2)+'\n');
console.log('Generated actual Node stage/success/failure/hidden/multiple-promotion fixtures in memory, audited seven original PNGs.');
