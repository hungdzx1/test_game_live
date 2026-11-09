import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const output='test-results/qua78',root='unity-client/',validation='test-results/unity-concept02/project/';await fs.mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');async function walk(dir){let files=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+entry.name;if(entry.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
if(process.argv.includes('--baseline')){
 const files=[...await walk(root+'Assets'),...await walk(root+'Packages'),...await walk(root+'ProjectSettings'),...(await fs.readdir('.')).filter(f=>f.endsWith('.js')),'package.json','package-lock.json'];
 await fs.writeFile(output+'/baseline.json',JSON.stringify(Object.fromEntries(await Promise.all(files.map(async f=>[f,hash(await fs.readFile(f))]))),null,2),{flag:'wx'});
 await fs.copyFile(root+'Assets/Scenes/SectScene_Concept02.unity',output+'/original-scene.unity');
 for(const p of ['Assets/Scripts/Scenes/CameraRig.cs','Assets/Scripts/Effects/ItemReceiptPresenter.cs'])await fs.copyFile(root+p,output+'/'+p.split('/').at(-1)+'.before.txt');
 console.log('Recorded protected source baseline; player files excluded because the user game can remain running.');
}else{for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp(root+dir,validation+dir,{recursive:true,preserveTimestamps:true});console.log('Synchronized isolated Unity validation project.');}
