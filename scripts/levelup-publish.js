import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',output='test-results/levelup/',evidence='docs/Tailieu_output/level-up/';
const hash=b=>createHash('sha256').update(b).digest('hex'),scene='Assets/Scenes/SectScene_Concept02.unity';
const baseline=JSON.parse(await fs.readFile(output+'baseline.json','utf8'));
const code=['Assets/Scripts/Effects/LevelUpPresenter.cs','Assets/Editor/LevelUpSetup.cs','Assets/Tests/Editor/LevelUpTests.cs'];
const imports=['title','magic_circle','golden_aura','energy_ribbons','sparkles','arrows','lotus'].map(name=>'Assets/Art/Characters/LVUP/levelup_'+name+'.png.meta');let protectedFiles=0;
for(const[file,expected]of Object.entries(baseline)){
 if(file===root+scene||imports.some(c=>file===root+c))continue;
 assert.equal(hash(await fs.readFile(file)),expected,'Protected/concurrent change: '+file);protectedFiles++;
}
for(const file of code)for(const suffix of ['','.meta'])assert.equal(hash(await fs.readFile(root+file+suffix)),hash(await fs.readFile(validation+file+suffix)),'Validated code or GUID differs: '+file+suffix);
const xml=await fs.readFile(output+'tests.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"[^>]*total="42"[^>]*passed="42"[^>]*failed="0"[^>]*skipped="0"/);
const capture=JSON.parse(await fs.readFile(evidence+'capture-report.json','utf8'));assert.ok(capture.timeline.every(row=>row.time<2?row.active===1:row.active===0));
const original=await fs.readFile(output+'original-scene.unity','utf8');assert.equal(await fs.readFile(root+scene,'utf8'),original,'Source scene concurrently changed.');
const parse=text=>new Map(text.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));
const a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8'));
const system=[...a].find(([,block])=>block.includes('  m_Name: 08_Systems\n'));assert.ok(system);
const parent=[...a].find(([,block])=>/^--- !u!4 /.test(block)&&block.includes('  m_GameObject: {fileID: '+system[0]+'}'));assert.ok(parent);
const children=block=>block.match(/  m_Children:[\s\S]*?(?=  m_Father:)/)?.[0]??'';
const ids=block=>[...block.matchAll(/fileID: (\d+)/g)].map(m=>m[1]);
const noViewport=block=>block.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,block]of a){
 assert.ok(b.has(id),'Original object removed: '+id);const changed=b.get(id);if(block===changed)continue;
 if(id===parent[0]){assert.equal(block.replace(children(block),''),changed.replace(children(changed),''));const old=ids(children(block)),now=ids(children(changed));assert.deepEqual(now.filter(x=>old.includes(x)),old);assert.equal(now.length,old.length+1);continue;}
 if(block.startsWith('--- !u!20 ')&&noViewport(block)===noViewport(changed))continue;
 throw Error('Unexpected original scene document change: '+id);
}
const added=[...b].filter(([id])=>!a.has(id));assert.equal(added.length,3);assert.ok(added.some(([,s])=>s.includes('  m_Name: LevelUpPresenter\n')));
const extra=added.map(([,s])=>s).join(''),merged=original.split(/(?=^--- !u!)/m).map(block=>{const id=block.match(/^--- !u!\d+ &(\d+)/)?.[1];if(block.startsWith('--- !u!1660057539 '))return extra+block;return id===parent[0]?b.get(id):block;}).join('');
const metadata=[];for(const file of imports){const before=await fs.readFile(root+file,'utf8'),after=await fs.readFile(validation+file,'utf8');assert.equal(before.match(/^guid: (\w+)/m)?.[1],after.match(/^guid: (\w+)/m)?.[1]);metadata.push({file,after});}
for(const file of metadata)await fs.writeFile(root+file.file,file.after);await fs.writeFile(root+scene,merged);
const report={result:'PASS',protectedFiles,originalSceneDocuments:a.size,addedSceneDocuments:added.length,changedOriginalDocuments:'one child appended to Systems only',cameraViewportAndPoses:'preserved',pngBytesAndGUIDs:'preserved',missingLayer:'levelup_light_beams.png skipped',validatedCode:code,sceneSha256:hash(await fs.readFile(root+scene)),sourceCodeSha256:Object.fromEntries(await Promise.all(code.map(async c=>[c,hash(await fs.readFile(root+c))]))),nodeGameplay:'unchanged; integration server uses a disposable dataRoot',unity:{passed:42,failed:0,skipped:0},unverified:['new Windows build','OBS','real LIVE']};
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');await fs.copyFile(output+'tests.xml',evidence+'unity-tests.xml');console.log(`PASS: ${protectedFiles} protected files, ${a.size} original scene documents, ${added.length} validated additions.`);
