// Transfer only newly generated stage-04 assets; preserve main project script GUIDs/layout.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const source='test-results/unity-stage03/validation-project/Assets',target='unity-client/Assets';
async function files(dir){const r=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())r.push(...await files(p));else r.push(p);}return r;}
const metas=(await files(source)).filter(p=>p.endsWith('.meta')),map=new Map();
for(const p of metas){const relative=path.relative(source,p);try{const a=(await readFile(p,'utf8')).match(/^guid: (\w+)/m)?.[1],b=(await readFile(path.join(target,relative),'utf8')).match(/^guid: (\w+)/m)?.[1];if(a&&b)map.set(a,b);}catch(e){if(e.code!=='ENOENT')throw e;}}
const outputs=(await files(source)).filter(p=>{
 const relative=path.relative(source,p).split(path.sep).join('/');
 return /^Resources\/(CharacterPrefab|TribulationPrefab)\.prefab(\.meta)?$/.test(relative)
  || /^Materials\/Characters\/(SharedUnlit\.mat|SpriteUnlit\.mat|ProceduralDisk\.asset)(\.meta)?$/.test(relative)
  || /^Art\/Characters\/Character_1\/[^/]+\.png\.meta$/.test(relative);
});
const statePath='test-results/unity-stage04/sync-state.json';let previous={};try{previous=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const pending=[],state={};
for(const p of outputs){const dest=path.join(target,path.relative(source,p));let bytes=await readFile(p);if(/\.(prefab|mat|asset|meta)$/.test(p)){let text=bytes.toString('utf8');if(!text.includes('\0'))bytes=Buffer.from(text.replace(/guid: (\w+)/g,(s,g)=>'guid: '+(map.get(g)??g)));}
 try{const current=await readFile(dest);if(!dest.endsWith('.png.meta')&&!current.equals(bytes)&&createHash('sha256').update(current).digest('hex')!==previous[dest])throw new Error('Refusing to overwrite edited asset: '+dest);}catch(e){if(e.code!=='ENOENT')throw e;}
 pending.push([dest,bytes]);state[dest]=createHash('sha256').update(bytes).digest('hex');}
for(const [dest,bytes]of pending){await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);}await writeFile(statePath,JSON.stringify(state,null,2));
console.log('Transferred '+outputs.length+' stage-04 generated files; retained '+map.size+' main GUIDs. No scene or old asset transfer.');
