import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const root='unity-client/',from='test-results/unity-concept02/project/';
const before=JSON.parse(await fs.readFile('test-results/unity-character4-grid/before.json','utf8'));
for(const [file,expected] of Object.entries(before))if(hash(await fs.readFile(root+file))!==expected)throw Error('Concurrent edit; refusing publication: '+file);
const scene='Assets/Scenes/SectScene_Concept02.unity';
const original=await fs.readFile(root+scene,'utf8'),updated=await fs.readFile(from+scene,'utf8');
const documents=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(b=>[b.match(/^--- !u!\d+ &(\d+)/)[1],b]));
const old=documents(original),next=documents(updated);
// Only manager, seats, their parent and new seat GameObjects may differ.
const manager=[...old].find(([,b])=>b.includes('TuTienLive.Characters.CharacterManager'));
const seatIds=[...manager[1].matchAll(/^  - \{fileID: (\d+)\}$/gm)].map(m=>m[1]);
const allowed=new Set([manager[0]]);
for(const id of seatIds){const block=old.get(id);if(!block)continue;allowed.add(id);const parent=block.match(/m_Father: \{fileID: (\d+)\}/);if(parent)allowed.add(parent[1]);const go=block.match(/m_GameObject: \{fileID: (\d+)\}/);if(go)allowed.add(go[1]);}
const viewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const [id,block] of old)if(!next.has(id))throw Error('Unexpected removed object '+id);else if(next.get(id)!==block&&!allowed.has(id)&&!(block.startsWith('--- !u!20 ')&&viewport(block)===viewport(next.get(id))))throw Error('Unexpected scene edit '+id);
for(const [id,block] of next)if(!old.has(id)&&!block.includes('m_Name: Seat_')&&!block.startsWith('--- !u!4 '))throw Error('Unexpected new scene object '+id);
const additions=[...next].filter(([id])=>!old.has(id)).map(([,b])=>b).join('');
let merged=original.split(/(?=^--- !u!)/m).map(block=>{
  const id=block.match(/^--- !u!\d+ &(\d+)/)?.[1];
  if(block.startsWith('--- !u!1660057539 '))return additions+block;
  return allowed.has(id)?next.get(id):block;
}).join('');
if(!merged.includes(additions))throw Error('Missing scene root document.');
for(const file of ['Assets/SectConcept02/Prefabs/Character_4.prefab','Assets/SectConcept02/Prefabs/Character_4.prefab.meta'])await fs.copyFile(from+file,root+file);
await fs.writeFile(root+scene,merged);
console.log('Published Character_4 prefab and guarded 25-seat scene. Main and three original prefabs unchanged.');
