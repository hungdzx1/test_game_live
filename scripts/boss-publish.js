import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',output='test-results/shared-boss/',evidence='docs/Tailieu_output/shared-boss/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const code=['Assets/Scripts/Models/GameModels.cs','Assets/Scripts/Network/StateMapper.cs','Assets/Scripts/Characters/CharacterManager.cs','Assets/Scripts/UI/Concept02Hud.cs','Assets/Scripts/Effects/BossBattlePresenter.cs','Assets/Editor/BossBattleSetup.cs','Assets/Tests/Editor/BossBattleTests.cs'];
const scene='Assets/Scenes/SectScene_Concept02.unity',baseline=JSON.parse(await fs.readFile(output+'baseline.json','utf8'));let protectedFiles=0;
for(const[file,expected]of Object.entries(baseline)){
 if(file===root+scene||code.some(c=>file===root+c))continue;
 assert.equal(hash(await fs.readFile(file)),expected,'Protected/concurrent change: '+file);
 if(!/^unity-client\/Assets\/Art\/Boss\/(?:Boss_[123]|in4_boss_[123]|fill_hp)\.png\.meta$/.test(file))protectedFiles++;
}
for(const file of code)assert.equal(hash(await fs.readFile(root+file)),hash(await fs.readFile(validation+file)),'Source differs from validated code: '+file);
const xml=await fs.readFile(output+'unity-final.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"[^>]*total="65"[^>]*passed="65"[^>]*failed="0"/);
const original=await fs.readFile(output+'original-scene.unity','utf8');assert.equal(await fs.readFile(root+scene,'utf8'),original,'Source scene concurrently changed.');
const parse=text=>new Map(text.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));
const a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8')),parents=new Set();
for(const name of ['08_Systems','UI_Canvas','05_Tribulation']){
 const object=[...a].find(([,block])=>block.includes('  m_Name: '+name+'\n'));assert.ok(object,name);
 const transform=[...a].find(([,block])=>/^--- !u!(4|224) /.test(block)&&block.includes('  m_GameObject: {fileID: '+object[0]+'}'));assert.ok(transform,name);parents.add(transform[0]);
}
const children=block=>block.match(/  m_Children:[\s\S]*?(?=  m_Father:)/)?.[0]??'';
const ids=block=>[...block.matchAll(/fileID: (\d+)/g)].map(m=>m[1]);
const noViewport=block=>block.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,block]of a){
 assert.ok(b.has(id),'Original object removed: '+id);const changed=b.get(id);if(block===changed)continue;
 if(parents.has(id)){assert.equal(block.replace(children(block),''),changed.replace(children(changed),''),'Parent pose changed');const old=ids(children(block)),now=ids(children(changed));assert.deepEqual(now.filter(x=>old.includes(x)),old);assert.equal(now.length,old.length+1);continue;}
 if(block.startsWith('--- !u!20 ')&&noViewport(block)===noViewport(changed))continue;
 throw Error('Unexpected modification of original scene document '+id);
}
const added=[...b].filter(([id])=>!a.has(id));assert.ok(added.some(([,s])=>s.includes('m_Name: BossBattlePresenter\n')));assert.ok(added.some(([,s])=>s.includes('m_Name: SharedBossSprite\n')));assert.ok(added.some(([,s])=>s.includes('m_Name: BossInformation\n')));
const extra=added.map(([,s])=>s).join('');const merged=original.split(/(?=^--- !u!)/m).map(block=>{const id=block.match(/^--- !u!\d+ &(\d+)/)?.[1];if(block.startsWith('--- !u!1660057539 '))return extra+block;return parents.has(id)?b.get(id):block;}).join('');
const spriteSignature=text=>text.match(/^    sprites:[\s\S]*?(?=^    outline:|^    spriteID:)/m)?.[0]??'';
const assets=[];
for(const file of ['Boss_1','Boss_2','Boss_3','in4_boss_1','in4_boss_2','in4_boss_3','fill_hp']){
 const path='Assets/Art/Boss/'+file+'.png.meta',before=await fs.readFile(root+path,'utf8'),after=await fs.readFile(validation+path,'utf8');
 assert.equal(before.match(/^guid: (\w+)/m)?.[1],after.match(/^guid: (\w+)/m)?.[1],'Asset GUID changed');
 if(file.startsWith('Boss_'))assert.equal(spriteSignature(before),spriteSignature(after),'Frame slices or pivots changed');
 assets.push({path,before,after,pngSha256:hash(await fs.readFile(root+'Assets/Art/Boss/'+file+'.png'))});
}
for(const asset of assets)await fs.writeFile(root+asset.path,asset.after);await fs.writeFile(root+scene,merged);
const report={result:'PASS',protectedFiles,existingSceneDocuments:a.size,addedSceneDocuments:added.length,parentChildListsAppended:[...parents],allOtherOriginalDocuments:'byte-identical',sourceCameraViewport:'preserved',pngBytes:'unchanged',frameSliceRectsPivotsIDs:'preserved',validatedCode:code,sceneSha256:hash(await fs.readFile(root+scene)),bossImportMetadata:assets.map(a=>({path:a.path,pngSha256:a.pngSha256}))};
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');await fs.copyFile(output+'unity-final.xml',evidence+'unity-tests.xml');await fs.copyFile(output+'node-final.txt',evidence+'npm-test.txt');
console.log('Published '+added.length+' new boss scene documents; preserved '+protectedFiles+' files and all existing scene poses.');
