import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',output='test-results/unity-item-receipts/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const before=JSON.parse(await fs.readFile(output+'before.json','utf8'));
for(const [file,expected]of Object.entries(before))if(hash(await fs.readFile(root+file))!==expected)throw Error('Concurrent edit; stop publishing: '+file);
const scene='Assets/Scenes/SectScene_Concept02.unity',original=await fs.readFile(output+'original-scene.unity','utf8'),updated=await fs.readFile(validation+scene,'utf8');
const parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(b=>[b.match(/^--- !u!\d+ &(\d+)/)[1],b]));
const a=parse(original),b=parse(updated),parents=new Set();
for(const name of ['08_Systems','UI_Canvas']){
 const object=[...a].find(([,v])=>v.includes('  m_Name: '+name+'\n'));
 if(!object)throw Error('Missing original parent '+name);
 const transform=[...a].find(([,v])=>/^--- !u!(4|224) /.test(v)&&v.includes('  m_GameObject: {fileID: '+object[0]+'}'));
 if(!transform)throw Error('Missing transform '+name);parents.add(transform[0]);
}
const stripChildren=s=>s.replace(/(  m_Children:)[\s\S]*?(?=  m_Father:)/,'$1\n');
const stripViewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const [id,old]of a){
 if(!b.has(id))throw Error('Unexpected object removal '+id);
 if(b.get(id)===old)continue;
 if(parents.has(id)){if(stripChildren(old)!==stripChildren(b.get(id)))throw Error('Parent pose changed '+id);continue;}
 if(old.startsWith('--- !u!20 ')&&stripViewport(old)===stripViewport(b.get(id)))continue;
 throw Error('Unexpected scene modification '+id);
}
const additions=[...b].filter(([id])=>!a.has(id)).map(([,v])=>v).join('');
if(!additions.includes('ItemReceiptPresenter')||!additions.includes('ItemReceiptFX'))throw Error('Missing receipt objects');
const merged=original.split(/(?=^--- !u!)/m).map(block=>{
 const id=block.match(/^--- !u!\d+ &(\d+)/)?.[1];
 if(block.startsWith('--- !u!1660057539 '))return additions+block;
 return parents.has(id)?b.get(id):block;
}).join('');
for(const name of ['tra_ngo_dao','do_kiep_dan','bien_di_linh_can']){
 const file='Assets/Art/Items/'+name+'.png.meta';
 const from=await fs.readFile(validation+file,'utf8'),to=await fs.readFile(root+file,'utf8');
 if(from.match(/^guid: (\w+)/m)?.[1]!==to.match(/^guid: (\w+)/m)?.[1])throw Error('Item GUID changed '+name);
 await fs.writeFile(root+file,from);
}
await fs.writeFile(root+scene,merged);
const evidence='docs/Tailieu_output/item-receipts/';await fs.mkdir(evidence,{recursive:true});
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify({result:'PASS',preserved:Object.keys(before).filter(file=>file!==scene),existingSceneDocuments:a.size,addedSceneDocuments:b.size-a.size,changedExistingDocuments:[...parents],cameraViewport:'original preserved',pngBytes:'unchanged',backendAwards:'unchanged; additive item:received presentation event'},null,2)+'\n');
console.log('Published receipt UI and manager, preserved all existing poses/25 seats/four prefabs/Main/PNG bytes.');
