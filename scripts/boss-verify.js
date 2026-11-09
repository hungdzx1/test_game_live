import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',evidence='docs/Tailieu_output/shared-boss/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8'));
const baseline=JSON.parse(await fs.readFile('test-results/shared-boss/baseline.json','utf8'));
const scene='Assets/Scenes/SectScene_Concept02.unity';let protectedFiles=0;
for(const[file,expected]of Object.entries(baseline)){
 if(file===root+scene||report.validatedCode.some(c=>file===root+c)||report.bossImportMetadata.some(c=>file===root+c.path))continue;
 assert.equal(hash(await fs.readFile(file)),expected,'Protected file changed: '+file);protectedFiles++;
}
assert.equal(protectedFiles,report.protectedFiles);
assert.equal(hash(await fs.readFile(root+scene)),report.sceneSha256);
for(const file of report.validatedCode)assert.equal(hash(await fs.readFile(root+file)),hash(await fs.readFile(validation+file)));
for(const file of report.bossImportMetadata){assert.equal(hash(await fs.readFile(root+file.path)),hash(await fs.readFile(validation+file.path)));assert.equal(hash(await fs.readFile(root+file.path.replace(/\.meta$/,''))),file.pngSha256);}
const parse=text=>new Map(text.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));
const original=parse(await fs.readFile('test-results/shared-boss/original-scene.unity','utf8')),source=parse(await fs.readFile(root+scene,'utf8')),validated=parse(await fs.readFile(validation+scene,'utf8'));
for(const[id,block]of original){assert.ok(source.has(id));if(report.parentChildListsAppended.includes(id))assert.equal(source.get(id),validated.get(id));else assert.equal(source.get(id),block);}
let added=0;for(const[id,block]of source)if(!original.has(id)){assert.equal(block,validated.get(id));added++;}assert.equal(added,report.addedSceneDocuments);
const xml=await fs.readFile('test-results/shared-boss/unity-final.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"[^>]*total="65"[^>]*passed="65"[^>]*failed="0"/);
const nodeBytes=await fs.readFile('test-results/shared-boss/node-final.txt'),node=nodeBytes.toString(nodeBytes[0]===255&&nodeBytes[1]===254?'utf16le':'utf8').replace(/^\uFEFF/,'');assert.match(node,/tests 122/);assert.match(node,/pass 121/);assert.match(node,/fail 0/);assert.match(node,/skipped 1/);
await fs.writeFile(evidence+'npm-test.txt',node,'utf8');await fs.copyFile('test-results/shared-boss/unity-final.xml',evidence+'unity-tests.xml');
await fs.writeFile(evidence+'final-verification.json',JSON.stringify({result:'PASS',protectedFiles,existingSceneDocuments:original.size,addedSceneDocuments:added,node:{pass:121,fail:0,skip:1},unity:{pass:65,fail:0,skip:0},allNewSceneObjects:'match tested scene',limitations:['Windows build','OBS','real LIVE','subjective audio']},null,2)+'\n');
console.log(`PASS: ${protectedFiles} protected files, ${original.size} original scene documents, ${added} tested additions; Node 121/0/1; Unity 65/0/0.`);
