import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const folder='unity-client/Assets/Tests/Fixtures/AdaptiveBoss';await fs.mkdir(folder,{recursive:true});
const save=async(e,name)=>fs.writeFile(`${folder}/${name}.json`,JSON.stringify(e.snapshot(),null,2)+'\n');
const advance=(e,ms)=>{while(ms>0){const step=Math.min(ms,250);e.tick(step);ms-=step;}};
for(let index=0;index<3;index++){
 const e=new GameEngine(Array.from({length:30},(_,i)=>createPlayer('adaptive:'+i,'Đạo hữu '+i,i)));e.battle.rng=()=>index/3+.01;e.setPhase('battle');
 if(index===0)await save(e,'warning');advance(e,203125);await save(e,'boss'+index);
 if(index===0){e.setPhase('paused');await save(e,'paused');e.setPhase('resume');const f=e.battle.current.fields[0];e.battle.applyDamage(f,f.participants['adaptive:0'],f.activeBoss,1e9);advance(e,1);await save(e,'completed');}
}
const empty=new GameEngine();empty.setPhase('battle');advance(empty,1203000);await save(empty,'long');
for(const relative of ['Assets/Tests/Fixtures/AdaptiveBoss',...(await fs.readdir(folder)).filter(f=>f.endsWith('.json')).map(f=>'Assets/Tests/Fixtures/AdaptiveBoss/'+f),'Assets/Tests/Editor/AdaptiveBossTests.cs']){
 try{await fs.access('unity-client/'+relative+'.meta');}catch{await fs.writeFile('unity-client/'+relative+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+relative).digest('hex')+'\n'+(relative.endsWith('AdaptiveBoss')?'folderAsset: yes\n':''));}
}
console.log('Generated adaptive boss fixtures using the actual Node engine.');
