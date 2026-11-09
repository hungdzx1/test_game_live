import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='unity-client',validation='test-results/unity-concept02/project',output='test-results/unity-blessing-receipt';
await fs.mkdir(output,{recursive:true});
for(const file of ['Assets/Scripts/Effects/BlessingReceiptPresenter.cs','Assets/Editor/BlessingReceiptSetup.cs','Assets/Tests/Editor/BlessingReceiptTests.cs']){
  try{await fs.access(root+'/'+file+'.meta');}catch{await fs.writeFile(root+'/'+file+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+file).digest('hex')+'\n');}
}
const hash=b=>createHash('sha256').update(b).digest('hex');
async function walk(dir){const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())out.push(...await walk(file));else out.push(file);}return out;}
const preserved=[...await walk('data'),'caidat.json','package.json','package-lock.json',...await walk(root+'/Assets')].filter(f=>!f.endsWith('/Assets/Scenes/SectScene_Concept02.unity')&&!f.endsWith('/Assets/Art/Items/tbao_ban_phuc.png.meta'));
const baseline=Object.fromEntries(await Promise.all(preserved.map(async f=>[f,hash(await fs.readFile(f))])));
await fs.writeFile(output+'/protected-baseline.json',JSON.stringify(baseline,null,2));
await fs.copyFile(root+'/Assets/Scenes/SectScene_Concept02.unity',output+'/original-scene.unity');
for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp(root+'/'+dir,validation+'/'+dir,{recursive:true});
console.log('Prepared isolated project; protected '+preserved.length+' files and copied the original scene.');
