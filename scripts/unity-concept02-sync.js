// Publish only the new scene and its resources from the isolated Unity validation project.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const from='test-results/unity-concept02/project',to='unity-client';
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const hash=b=>createHash('sha256').update(b).digest('hex');
const statePath='test-results/unity-concept02/sync-state.json';let old={};try{old=JSON.parse(await readFile(statePath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const roots=['Assets/SectConcept02','Assets/Art/SectConcept02'];
const files=[...await walk(from+'/'+roots[0]),from+'/'+roots[0]+'.meta',...await walk(from+'/'+roots[1]),from+'/'+roots[1]+'.meta',from+'/Assets/Scenes/SectScene_Concept02.unity',from+'/Assets/Scenes/SectScene_Concept02.unity.meta'];
const pending=[],state={};
for(const file of files){const rel=path.relative(from,file).split(path.sep).join('/'),dest=to+'/'+rel,bytes=await readFile(file);
  try{const current=await readFile(dest);
    if(!current.equals(bytes)){
      const isImportMeta=rel.startsWith('Assets/Art/SectConcept02/')&&rel.endsWith('.meta');
      if(isImportMeta){const guid=b=>b.toString().match(/^guid: (\w+)/m)?.[1];if(guid(current)!==guid(bytes))throw Error('GUID conflict: '+dest);}
      else if(hash(current)!==old[dest])throw Error('Refusing to overwrite user changes: '+dest);
    }
  }catch(e){if(e.code!=='ENOENT')throw e;}
  pending.push([dest,bytes]);state[dest]=hash(bytes);
}
pending.sort((a,b)=>Number(b[0].endsWith('.meta'))-Number(a[0].endsWith('.meta')));
for(const [dest,bytes]of pending){await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,bytes);}
await writeFile(statePath,JSON.stringify(state,null,2));
console.log('Published '+pending.length+' files for Concept02; existing scenes and build settings untouched.');
