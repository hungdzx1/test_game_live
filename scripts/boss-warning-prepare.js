import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const out='test-results/boss-warning/';await fs.mkdir(out,{recursive:true});
async function walk(p){const result=[];for(const e of await fs.readdir(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory())result.push(...await walk(f));else result.push(f);}return result;}
if(process.argv.includes('--baseline')){
 const files=[...await walk('unity-client/Assets'),...await walk('unity-client/Packages'),...await walk('unity-client/ProjectSettings'),...await walk('data'),...(await fs.readdir('.')).filter(p=>p.endsWith('.js')),'caidat.json','package.json','package-lock.json','public/song.html'];
 await fs.writeFile(out+'baseline.json',JSON.stringify(Object.fromEntries(await Promise.all(files.map(async p=>[p,createHash('sha256').update(await fs.readFile(p)).digest('hex')]))),null,2),{flag:'wx'});
 await fs.copyFile('unity-client/Assets/Scenes/SectScene_Concept02.unity',out+'original-scene.unity');console.log('Recorded boss warning baseline '+files.length+' files.');
}else{
 for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp('unity-client/'+dir,'test-results/unity-concept02/project/'+dir,{recursive:true,preserveTimestamps:true});console.log('Synchronized isolated boss warning project.');
}
