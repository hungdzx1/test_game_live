import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output='test-results/shared-boss';await fs.mkdir(output,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
async function walk(dir){let result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.isDirectory())result.push(...await walk(file));else result.push(file);}return result;}
if(process.argv.includes('--baseline')){
 const files=[...await walk('data'),...await walk('unity-client/Assets'),'caidat.json','package.json','package-lock.json'];
 await fs.writeFile(output+'/baseline.json',JSON.stringify(Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await fs.readFile(file))]))),null,2));
 await fs.copyFile('unity-client/Assets/Scenes/SectScene_Concept02.unity',output+'/original-scene.unity');console.log('Recorded '+files.length+' protected baseline files.');
}else{
 for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp('unity-client/'+dir,'test-results/unity-concept02/project/'+dir,{recursive:true,preserveTimestamps:true});
 console.log('Synchronized isolated Unity validation project.');
}
