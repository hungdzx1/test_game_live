import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',output='test-results/unity-blessing-receipt/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(await fs.readFile(output+'protected-baseline.json','utf8'));
const owned=['Assets/Scripts/Scenes/CameraRig.cs','Assets/Scripts/Effects/BlessingReceiptPresenter.cs','Assets/Editor/BlessingReceiptSetup.cs','Assets/Tests/Editor/BlessingReceiptTests.cs'];
let checked=0;
for(const[file,expected]of Object.entries(baseline)){
  if(owned.some(f=>file===root+f))continue;
  assert.equal(hash(await fs.readFile(file)),expected,'Protected/concurrently edited file: '+file);checked++;
}
for(const file of owned)assert.equal(hash(await fs.readFile(root+file)),hash(await fs.readFile(validation+file)),'Source differs from validated code: '+file);
const scene='Assets/Scenes/SectScene_Concept02.unity',original=await fs.readFile(output+'original-scene.unity','utf8');
assert.equal(await fs.readFile(root+scene,'utf8'),original,'Scene concurrently changed; cannot publish.');
const parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(b=>[b.match(/^--- !u!\d+ &(\d+)/)[1],b]));
const a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8')),parents=new Set();
for(const name of ['08_Systems','UI_Canvas']){
  const object=[...a].find(([,v])=>v.includes('  m_Name: '+name+'\n'));assert.ok(object,name);
  const transform=[...a].find(([,v])=>/^--- !u!(4|224) /.test(v)&&v.includes('  m_GameObject: {fileID: '+object[0]+'}'));assert.ok(transform,name);parents.add(transform[0]);
}
const stripChildren=s=>s.replace(/(  m_Children:)[\s\S]*?(?=  m_Father:)/,'$1\n');
const stripViewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,old]of a){
  assert.ok(b.has(id),'Object removed '+id);if(old===b.get(id))continue;
  if(parents.has(id)){assert.equal(stripChildren(old),stripChildren(b.get(id)),'Parent modified '+id);continue;}
  if(old.startsWith('--- !u!20 ')&&stripViewport(old)===stripViewport(b.get(id)))continue;
  throw Error('Unexpected scene modification '+id);
}
const additions=[...b].filter(([id])=>!a.has(id)).map(([,v])=>v).join('');
assert.ok(additions.includes('BlessingReceiptPresenter')&&additions.includes('BlessingReceiptFX'),'Missing new effect');
const merged=original.split(/(?=^--- !u!)/m).map(block=>{const id=block.match(/^--- !u!\d+ &(\d+)/)?.[1];if(block.startsWith('--- !u!1660057539 '))return additions+block;return parents.has(id)?b.get(id):block;}).join('');
const meta='Assets/Art/Items/tbao_ban_phuc.png.meta',from=await fs.readFile(validation+meta,'utf8'),to=await fs.readFile(root+meta,'utf8');
assert.equal(from.match(/^guid: (\w+)/m)?.[1],to.match(/^guid: (\w+)/m)?.[1]);
await fs.writeFile(root+meta,from);await fs.writeFile(root+scene,merged);
const evidence='docs/Tailieu_output/blessing-receipt/';await fs.mkdir(evidence,{recursive:true});
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify({result:'PASS',protectedFiles:checked,validatedCodeFiles:owned,existingSceneDocuments:a.size,addedDocuments:b.size-a.size,changedParents:[...parents],allOtherSceneDocuments:'byte-identical',cameraViewport:'original preserved',sourcePng:'byte-identical',backend:'unchanged'},null,2)+'\n');
console.log('Published blessing presenter/UI and sprite import; all protected files and previous scene objects preserved.');
