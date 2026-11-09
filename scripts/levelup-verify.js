import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',output='test-results/levelup/',evidence='docs/Tailieu_output/level-up/',scene='Assets/Scenes/SectScene_Concept02.unity';
const hash=b=>createHash('sha256').update(b).digest('hex'),report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8')),baseline=JSON.parse(await fs.readFile(output+'baseline.json','utf8'));
let protectedFiles=0;for(const[file,expected]of Object.entries(baseline)){
 if(file===root+scene||/^unity-client\/Assets\/Art\/Characters\/LVUP\/levelup_\w+\.png\.meta$/.test(file))continue;
 assert.equal(hash(await fs.readFile(file)),expected,file);protectedFiles++;
}
assert.equal(protectedFiles,report.protectedFiles);assert.equal(hash(await fs.readFile(root+scene)),report.sceneSha256);
for(const file of report.validatedCode){assert.equal(hash(await fs.readFile(root+file)),report.sourceCodeSha256[file]);assert.equal(hash(await fs.readFile(root+file)),hash(await fs.readFile(validation+file)));}
for(const asset of JSON.parse(await fs.readFile(evidence+'asset-audit.json','utf8')).assets){const path='Assets/Art/Characters/LVUP/'+asset.file;assert.equal(hash(await fs.readFile(root+path)),asset.sha256);assert.equal(hash(await fs.readFile(root+path+'.meta')),hash(await fs.readFile(validation+path+'.meta')));}
const parse=text=>new Map(text.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));
const original=parse(await fs.readFile(output+'original-scene.unity','utf8')),source=parse(await fs.readFile(root+scene,'utf8')),tested=parse(await fs.readFile(validation+scene,'utf8'));
let appendedParents=0;for(const[id,block]of original){assert.ok(source.has(id));if(block===source.get(id))continue;assert.equal(source.get(id),tested.get(id));appendedParents++;}assert.equal(appendedParents,1);
let added=0;for(const[id,block]of source)if(!original.has(id)){assert.equal(block,tested.get(id));added++;}assert.equal(added,3);
await fs.writeFile(evidence+'final-verification.json',JSON.stringify({result:'PASS',protectedFiles,originalSceneDocuments:original.size,newSceneDocuments:added,allNewObjectsAndCode:'match isolated tested project',pngAndGuids:'preserved',unityTests:report.unity,unverified:report.unverified},null,2)+'\n');console.log(`PASS: ${protectedFiles} protected files; ${original.size} original documents, ${added} tested additions; seven PNGs unchanged.`);
