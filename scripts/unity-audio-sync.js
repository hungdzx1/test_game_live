// Merge only the audio object authored by Unity; preserve every existing scene object.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output='docs/Tailieu_output/amthanh',validation='test-results/unity-concept02/project/Assets/Scenes',source='unity-client/Assets/Scenes';
const hash=value=>createHash('sha256').update(value).digest('hex');
function blocks(text){return new Map(text.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));}
const reports=[];
for(const scene of ['SectScene_Main','SectScene_Concept02']){
  const dest=source+'/'+scene+'.unity',before=await readFile(dest,'utf8'),baseline=await readFile(output+'/'+scene+'.before.unity.txt','utf8');
  assert.equal(before,baseline,'Scene changed since baseline: '+scene);
  const old=blocks(before),authored=blocks(await readFile(validation+'/'+scene+'.unity','utf8'));
  const added=[...authored].filter(([id])=>!old.has(id));assert.ok(added.length>=4&&added.length<=5,'Only audio GameObject and its components may be added');
  const root=added.find(([,block])=>block.includes('  m_Name: GameAudioManager\n'));assert.ok(root,'Audio GameObject missing');
  const transform=added.find(([,block])=>block.startsWith('--- !u!4 ')&&block.includes(`  m_GameObject: {fileID: ${root[0]}}`));assert.ok(transform);
  const parentId=transform[1].match(/  m_Father: \{fileID: (\d+)\}/)[1];assert.ok(old.has(parentId));
  const parent=old.get(parentId),childLine=`  - {fileID: ${transform[0]}}\n`;
  const newline=before.includes('\r\n')?'\r\n':'\n';
  const normalized=parent.replace(/\r\n/g,'\n');
  const mergedParent=normalized.includes('  m_Children: []\n')?normalized.replace('  m_Children: []\n','  m_Children:\n'+childLine):normalized.replace('  m_Father:',childLine+'  m_Father:');
  assert.equal(mergedParent.replace(childLine,''),normalized.replace('  m_Children: []\n','  m_Children:\n'));
  let after=before.replace(parent,mergedParent.replace(/\n/g,newline));
  for(const[,block]of added)after+=block.replace(/\r\n/g,'\n').replace(/\n/g,newline);
  const final=blocks(after);for(const[id,block]of old)if(id!==parentId)assert.equal(final.get(id),block,'Existing object changed: '+id);
  await writeFile(dest,after);reports.push({scene,unchangedExistingObjects:old.size-1,existingParentOnlyAppendsAudioChild:parentId,addedObjects:added.length,before:hash(before),after:hash(after)});
}
await writeFile(output+'/scene-merge-report.json',JSON.stringify({result:'PASS',reports},null,2));console.log(JSON.stringify(reports,null,2));
