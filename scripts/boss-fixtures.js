import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const directory='unity-client/Assets/Tests/Fixtures/SharedBoss';await fs.mkdir(directory,{recursive:true});
const players=Array.from({length:30},(_,i)=>createPlayer('boss:'+i,'Đạo hữu '+i,i)),e=new GameEngine(players);
const save=async name=>fs.writeFile(directory+'/'+name+'.json',JSON.stringify(e.snapshot(),null,2)+'\n');
const reveal=()=>{while(e.battle.warningRemainingMs>0)e.tick(Math.min(250,e.battle.warningRemainingMs));};
e.setPhase('cultivation');await save('cultivation');e.setPhase('battle');reveal();await save('boss1');
e.battle.current.fields[0].activeBoss.hp=5000;await save('half');
const kill=()=>{const f=e.battle.current.fields[0];e.battle.combat.applyDamage(f,f.participants['boss:0'],f.activeBoss,1000000);reveal();};
kill();await save('boss2');kill();await save('boss3');e.tick(125);e.setPhase('paused');await save('paused');e.setPhase('resume');kill();e.setPhase('cultivation');await save('completed');
for(const file of ['Assets/Scripts/Effects/BossBattlePresenter.cs','Assets/Editor/BossBattleSetup.cs','Assets/Tests/Editor/BossBattleTests.cs','Assets/Tests/Fixtures/SharedBoss',...(await fs.readdir(directory)).filter(f=>f.endsWith('.json')).map(f=>'Assets/Tests/Fixtures/SharedBoss/'+f)]){
 try{await fs.access('unity-client/'+file+'.meta');}catch{await fs.writeFile('unity-client/'+file+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+file).digest('hex')+'\n'+(file.endsWith('SharedBoss')?'folderAsset: yes\n':''));}
}
console.log('Generated shared boss fixtures from the real Node engine, preserving existing asset GUIDs.');
