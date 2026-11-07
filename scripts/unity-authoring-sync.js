// Publish only the new authored scene/assets. Original scene/prefabs are never overwritten.
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const from='test-results/unity-stage03/validation-project',to='unity-client';
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){let p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const guid=s=>s.match(/^guid: (\w+)/m)?.[1],hash=b=>createHash('sha256').update(b).digest('hex');
const map=new Map();
for(const p of (await walk(from+'/Assets')).filter(p=>p.endsWith('.meta'))){try{const a=guid(await readFile(p,'utf8')),b=guid(await readFile(to+'/'+path.relative(from,p),'utf8'));if(a&&b)map.set(a,b);}catch(e){if(e.code!=='ENOENT')throw e;}}
const files=[...await walk(from+'/Assets/SceneAuthoring'),from+'/Assets/SceneAuthoring.meta',from+'/Assets/Scenes/SectScene_Editable.unity',from+'/Assets/Scenes/SectScene_Editable.unity.meta',from+'/ProjectSettings/EditorBuildSettings.asset'];
const scripts=new Map();for(const p of (await walk(to+'/Assets/Scripts')).filter(p=>p.endsWith('.cs'))){try{scripts.set(path.basename(p,'.cs'),guid(await readFile(p+'.meta','utf8')));}catch(e){if(e.code!=='ENOENT')throw e;}}
// Recover script mappings even if the validation .meta was subsequently synchronized.
for(const p of files.filter(p=>/\.(unity|prefab)$/.test(p))){const s=await readFile(p,'utf8');for(const block of s.split(/^--- /m)){
 const c=block.match(/m_EditorClassIdentifier: [^\r\n]*\.([A-Za-z0-9_]+)/),g=block.match(/m_Script: \{[^}]*guid: (\w+)/);
 if(c&&g&&scripts.has(c[1]))map.set(g[1],scripts.get(c[1]));
}}
const statePath='test-results/unity-scene-authoring/sync-state.json';let old={};try{old=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const pending=[],state={};
for(const p of files){const dest=to+'/'+path.relative(from,p).split(path.sep).join('/');let bytes=await readFile(p);
 if(/\.(unity|prefab|asset|mat|meta)$/.test(p)&&!bytes.includes(0)){bytes=Buffer.from(bytes.toString().replace(/(guid: |m_SourceFontFileGUID: )([a-f0-9]{32})/g,(s,k,g)=>k+(map.get(g)??g)));}
 try{const current=await readFile(dest);if(!current.equals(bytes)&&!dest.endsWith('.meta')&&!dest.includes('/Fonts/')&&!dest.includes('/Shaders/')&&!dest.endsWith('EditorBuildSettings.asset')&&hash(current)!==old[dest])throw new Error('Refusing to overwrite edited authored asset: '+dest);}catch(e){if(e.code!=='ENOENT')throw e;}
 pending.push([dest,bytes]);state[dest]=hash(bytes);
}
pending.sort((a,b)=>Number(b[0].endsWith('.meta'))-Number(a[0].endsWith('.meta')));
for(const [dest,bytes]of pending){await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);}
await writeFile(statePath,JSON.stringify(state,null,2));console.log('Transferred '+pending.length+' new-scene/generated files, '+map.size+' GUID mappings. Original scene/prefabs preserved.');
