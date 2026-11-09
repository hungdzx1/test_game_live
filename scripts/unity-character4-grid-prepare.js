import fs from 'node:fs/promises';
import {randomBytes, createHash} from 'node:crypto';
const root='unity-client';
const validation='test-results/unity-concept02/project';
const art=root+'/Assets/Art/SectConcept02/Characters';
await fs.mkdir(art+'/Character_4',{recursive:true});
for(const pose of ['meditation','fly','attack','celebrate']){
  const destination=art+'/Character_4/'+pose+'.png';
  await fs.copyFile('public/assets/02/Characters/Character_4/'+pose+'.png',destination);
  try{await fs.access(destination+'.meta');}catch{
    const meta=(await fs.readFile(art+'/Character_3/'+pose+'.png.meta','utf8'))
      .replace(/guid: [a-f0-9]+/,'guid: '+randomBytes(16).toString('hex')).replace('maxTextureSize: 2048','maxTextureSize: 4096');
    await fs.writeFile(destination+'.meta',meta);
  }
}
for(const [file,folder] of [[art+'/Character_4',true],[root+'/Assets/Editor/Concept02CharacterGridSetup.cs',false]]){
  try{await fs.access(file+'.meta');}catch{await fs.writeFile(file+'.meta','fileFormatVersion: 2\nguid: '+randomBytes(16).toString('hex')+'\n'+(folder?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n':''));}
}
const fixture=JSON.parse(await fs.readFile(root+'/Assets/Tests/Fixtures/Characters/players-10.json','utf8'));
fixture.payload.players=Array.from({length:30},(_,i)=>({...structuredClone(fixture.payload.players[i%10]),userId:'grid:'+i,name:'Disciple '+i,index:i,seed:i}));
await fs.writeFile(root+'/Assets/Tests/Fixtures/Characters/players-25.json',JSON.stringify(fixture,null,2)+'\n');
const tracked=['Assets/Scenes/SectScene_Concept02.unity','Assets/Scenes/SectScene_Main.unity',...Array.from({length:3},(_,i)=>'Assets/SectConcept02/Prefabs/Character_'+(i+1)+'.prefab')];
await fs.mkdir('test-results/unity-character4-grid',{recursive:true});
const manifest=Object.fromEntries(await Promise.all(tracked.map(async p=>[p,createHash('sha256').update(await fs.readFile(root+'/'+p)).digest('hex')])));
await fs.writeFile('test-results/unity-character4-grid/before.json',JSON.stringify(manifest,null,2));
for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp(root+'/'+dir,validation+'/'+dir,{recursive:true});
console.log('Prepared four supplied PNGs and isolated Unity project; source artwork and old prefabs retained.');
