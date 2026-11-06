// Transfer ONLY stage-03 generated assets/settings from the disposable validation project.
// Keep existing main-project GUIDs. Refuse to overwrite a generated file edited after our last sync.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve('.'),main=path.join(root,'unity-client'),cache=path.join(root,'test-results/unity-stage03/validation-project');
const statePath=path.join(root,'test-results/unity-stage03/sync-state.json');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function read(file){try{return await readFile(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
const oldState=JSON.parse((await read(statePath))?.toString()??'{"files":{}}');
const metas=(await readdir(path.join(cache,'Assets'),{recursive:true,withFileTypes:true})).filter(d=>d.isFile()&&d.name.endsWith('.meta')).map(d=>path.relative(cache,path.join(d.parentPath,d.name)));
const remap=new Map();
for(const relative of metas){
  const before=await read(path.join(main,relative));if(!before)continue;
  const source=await readFile(path.join(cache,relative));
  const from=source.toString().match(/^guid: ([a-f0-9]{32})/m)?.[1],to=before.toString().match(/^guid: ([a-f0-9]{32})/m)?.[1];
  if(from&&to&&from!==to)remap.set(from,to);
}
function fix(text){return text.replace(/guid: ([a-f0-9]{32})/g,(all,guid)=>'guid: '+(remap.get(guid)??guid));}
const plan=[];
async function add(relative,{importMeta=false}={}){
  const source=await readFile(path.join(cache,relative)),before=await read(path.join(main,relative));
  if(before&&!importMeta&&hash(before)!==oldState.files[relative])throw new Error('Refusing to overwrite file not owned by last sync: '+relative);
  plan.push({relative,bytes:Buffer.from(fix(source.toString()),'utf8')});
}
await add('Assets/Scenes/SectScene.unity');
const sceneMeta='Assets/Scenes/SectScene.unity.meta';if(!await read(path.join(main,sceneMeta)))await add(sceneMeta);
for(const folder of ['Assets/Materials/Sect','Assets/Art/Sect']){
  if(!await read(path.join(main,folder+'.meta')))await add(folder+'.meta');
  const files=await readdir(path.join(cache,folder),{recursive:true,withFileTypes:true});
  for(const entry of files.filter(d=>d.isFile())){
    const relative=path.relative(cache,path.join(entry.parentPath,entry.name));
    if(folder.endsWith('Art/Sect')){if(relative.endsWith('.meta'))await add(relative,{importMeta:true});}
    else await add(relative);
  }
}
// Only fill missing .meta files for our new C# and shader files; existing GUIDs stay untouched.
for(const relative of metas.filter(x=>/SectLayer|SectTextLayout|SectSceneController|CameraRig|SectSceneSetup|SectScreenshotTest|SectSceneTests|SectUnlit/.test(x)))
  if(!await read(path.join(main,relative)))await add(relative);
// Append sorting groups without replacing user-defined tags/layers.
const tagPath='ProjectSettings/TagManager.asset';let tags=(await readFile(path.join(main,tagPath))).toString();
const names=['SectBackground','SectArchitecture','SectPlatform','SectGround','SectGroundDetail','SectCharacters','SectForeground','SectAtmosphere','SectHUD'];
for(const [i,name]of names.entries()){
  if(tags.includes('  - name: '+name+'\n'))continue;
  if(tags.includes('    uniqueID: '+(73000+i)+'\n'))throw new Error('Sorting layer ID collision; preserve existing settings.');
  tags=tags.replace('  m_RenderingLayers:',`  - name: ${name}\n    uniqueID: ${73000+i}\n    locked: 0\n  m_RenderingLayers:`);
}
plan.push({relative:tagPath,bytes:Buffer.from(tags)});
const buildPath='ProjectSettings/EditorBuildSettings.asset';let builds=(await readFile(path.join(main,buildPath))).toString();
if(!builds.includes('path: Assets/Scenes/SectScene.unity')){
  const meta=fix((await readFile(path.join(cache,sceneMeta))).toString()),guid=meta.match(/^guid: ([a-f0-9]{32})/m)[1];
  builds=builds.replace('  m_configObjects:',`  - enabled: 1\n    path: Assets/Scenes/SectScene.unity\n    guid: ${guid}\n  m_configObjects:`);
}
plan.push({relative:buildPath,bytes:Buffer.from(builds)});
// All conflict checks are complete before any main-project file is changed.
for(const item of plan){await mkdir(path.dirname(path.join(main,item.relative)),{recursive:true});await writeFile(path.join(main,item.relative),item.bytes);oldState.files[item.relative]=hash(item.bytes);}
await writeFile(statePath,JSON.stringify(oldState,null,2)+'\n');
console.log(JSON.stringify({result:'PASS',files:plan.length,guidRemaps:remap.size,scope:'Stage03 generated scene/materials, new PNG import settings, appended sorting/build scene; existing GUIDs retained'},null,2));
