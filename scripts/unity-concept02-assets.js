// Copy local source artwork without moving or modifying the originals.
import {readFile,writeFile,mkdir,copyFile,stat,readdir} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import path from 'node:path';
const root='unity-client/Assets/Art/SectConcept02';
const audit=JSON.parse(await readFile('docs/unity-concept02/asset-audit.json','utf8'));
const groups={'Architecture layers':'Architecture','Background layers':'Background','FX layers':'Effects',UI:'UI',Characters:'Characters'};
for(const a of audit.assets){
  const parts=a.id.split('/');parts[0]=groups[parts[0]];
  if(parts.at(-1)==='ui_cultivation_icon.png.png')parts[parts.length-1]='ui_cultivation_icon.png';
  a.importPath=root.replace('unity-client/','')+'/'+parts.join('/');
  const destination='unity-client/'+a.importPath;
  const source='public/assets/02/'+a.id,bytes=await readFile(source);
  try{if(!(await readFile(destination)).equals(bytes))throw Error('Existing artwork differs: '+destination);}
  catch(e){if(e.code!=='ENOENT')throw e;await mkdir(path.dirname(destination),{recursive:true});await copyFile(source,destination);}
}
await writeFile(root+'/asset-audit.json',JSON.stringify(audit,null,2)+'\n');
await writeFile('docs/unity-concept02/asset-audit.json',JSON.stringify(audit,null,2)+'\n');
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;out.push(p);if(e.isDirectory())out.push(...await walk(p));}return out;}
// Assign GUIDs before copying into validation, so both projects use identical references.
for(const p of ['unity-client/Assets/Art/SectConcept02',...await walk(root),...((await walk('unity-client/Assets')).filter(p=>/Concept02/.test(p)&&p.endsWith('.cs')))]){
  if(p.endsWith('.meta'))continue;
  try{await stat(p+'.meta');}catch(e){if(e.code!=='ENOENT')throw e;
    const dir=(await stat(p)).isDirectory();await writeFile(p+'.meta',`fileFormatVersion: 2\nguid: ${randomBytes(16).toString('hex')}\n${dir?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n':''}`);
  }
}
console.log('Copied '+audit.assets.length+' PNG, original bytes retained.');
