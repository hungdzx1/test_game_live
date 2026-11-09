import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const output='test-results/levelup',root='unity-client/',validation='test-results/unity-concept02/project/';
await fs.mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
async function walk(dir){let files=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())files.push(...await walk(path));else files.push(path);}return files;}
if(process.argv.includes('--baseline')){
 await fs.writeFile(output+'/baseline.json',JSON.stringify(Object.fromEntries(await Promise.all([...await walk(root+'Assets'),...await walk(root+'Packages'),...await walk(root+'ProjectSettings')].map(async f=>[f,hash(await fs.readFile(f))]))),null,2),{flag:'wx'});
 await fs.copyFile(root+'Assets/Scenes/SectScene_Concept02.unity',output+'/original-scene.unity');console.log('Recorded original scene and protected Unity asset baseline.');
}else{
 for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp(root+dir,validation+dir,{recursive:true,preserveTimestamps:true});
 console.log('Synchronized isolated Unity validation project.');
}
