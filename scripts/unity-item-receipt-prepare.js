import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='unity-client',validation='test-results/unity-concept02/project',output='test-results/unity-item-receipts';
await fs.mkdir(output,{recursive:true});
const files=['Assets/Scripts/Effects/ItemReceiptPresenter.cs','Assets/Editor/ItemReceiptSetup.cs','Assets/Tests/Editor/ItemReceiptTests.cs'];
for(const file of files){try{await fs.access(root+'/'+file+'.meta');}catch{await fs.writeFile(root+'/'+file+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+file).digest('hex')+'\n');}}
const preserved=['Assets/Scenes/SectScene_Main.unity',...Array.from({length:4},(_,i)=>'Assets/SectConcept02/Prefabs/Character_'+(i+1)+'.prefab'),...['tra_ngo_dao','do_kiep_dan','bien_di_linh_can','tbao_ban_phuc'].map(n=>'Assets/Art/Items/'+n+'.png')];
const before=Object.fromEntries(await Promise.all([...preserved,'Assets/Scenes/SectScene_Concept02.unity'].map(async file=>[file,createHash('sha256').update(await fs.readFile(root+'/'+file)).digest('hex')])));
await fs.writeFile(output+'/before.json',JSON.stringify(before,null,2));
await fs.copyFile(root+'/Assets/Scenes/SectScene_Concept02.unity',output+'/original-scene.unity');
for(const dir of ['Assets','Packages','ProjectSettings'])await fs.cp(root+'/'+dir,validation+'/'+dir,{recursive:true});
console.log('Prepared isolated project; recorded original scene, Main, four character prefabs and all supplied item PNG hashes.');
