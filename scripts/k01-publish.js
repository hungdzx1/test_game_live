import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',out='test-results/k01/',evidence='docs/Tailieu_output/khung-01/implemented/',scene='Assets/Scenes/SectScene_Concept02.unity';
const code=['Assets/Scripts/UI/GuidePanelGraphic.cs','Assets/Editor/K01GuideSetup.cs','Assets/Tests/Editor/K01GuideTests.cs'];
const hash=b=>createHash('sha256').update(b).digest('hex'),baseline=JSON.parse(await fs.readFile(out+'baseline.json','utf8'));
const parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(b=>[b.match(/^--- !u!\d+ &(\d+)/)[1],b]));
let protectedFiles=0;for(const[file,expected]of Object.entries(baseline)){if(file===root+scene)continue;assert.equal(hash(await fs.readFile(file)),expected,'Protected or concurrent change: '+file);protectedFiles++;}
for(const p of code)for(const suffix of ['','.meta'])assert.equal(hash(await fs.readFile(root+p+suffix)),hash(await fs.readFile(validation+p+suffix)),'Untested source: '+p+suffix);
const xml=await fs.readFile(out+'tests.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"/);assert.match(xml,/<test-run[^>]*failed="0"[^>]*skipped="0"/);assert.ok((xml.match(/<test-case /g)||[]).length>=49);
const codeTime=Math.max(...await Promise.all(code.map(async p=>(await fs.stat(root+p)).mtimeMs)));
assert.ok((await fs.stat(out+'tests.xml')).mtimeMs>=codeTime,'Test result predates the final source');
assert.ok((await fs.stat(evidence+'capture-report.json')).mtimeMs>=codeTime,'GPU capture predates the final source');
const capture=JSON.parse(await fs.readFile(evidence+'capture-report.json','utf8'));assert.ok(capture.gpu&&!/null/i.test(capture.gpu));assert.deepEqual(capture.samples.map(s=>s.width),[1080,720]);assert.ok(capture.samples.every(s=>s.raycastTargets===0&&s.labels>25));
if(process.argv.includes('--verify')){
 const report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8'));for(const[file,expected]of Object.entries(report.sourceHashes))assert.equal(hash(await fs.readFile(file)),expected,file);
 const original=parse(await fs.readFile(out+'original-scene.unity','utf8')),source=parse(await fs.readFile(root+scene,'utf8')),tested=parse(await fs.readFile(validation+scene,'utf8'));
 for(const[id,b]of original)assert.equal(source.get(id),id===report.changedParent?tested.get(id):b,'Original scene document '+id);
 for(const[id,b]of source)if(!original.has(id))assert.equal(b,tested.get(id),'Untested scene addition '+id);
 await fs.writeFile(evidence+'final-verification.json',JSON.stringify({...report,result:'PASS',finalAudit:'Original documents preserved; additions match tested project'},null,2)+'\n');console.log(`PASS final: ${protectedFiles} protected files; ${original.size} original scene documents; ${report.addedSceneDocuments} tested additions.`);process.exit(0);
}
const original=await fs.readFile(out+'original-scene.unity','utf8');assert.equal(await fs.readFile(root+scene,'utf8'),original,'Source scene concurrently changed');const a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8'));
const ui=[...a].find(([,s])=>s.includes('  m_Name: UI_Canvas\n'));assert.ok(ui);const parent=[...a].find(([,s])=>s.startsWith('--- !u!224 ')&&s.includes('  m_GameObject: {fileID: '+ui[0]+'}'));assert.ok(parent);
const children=s=>s.match(/  m_Children:[\s\S]*?(?=  m_Father:)/)?.[0]??'',ids=s=>[...s.matchAll(/fileID: (\d+)/g)].map(m=>m[1]);
const noViewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,s]of a){assert.ok(b.has(id),'Original document removed '+id);const now=b.get(id);if(s===now)continue;if(id===parent[0]){assert.equal(s.replace(children(s),''),now.replace(children(now),''));const before=ids(children(s)),after=ids(children(now));assert.deepEqual(after.filter(x=>before.includes(x)),before);assert.equal(after.length,before.length+1);assert.ok(!before.includes(after[0]));continue;}if(s.startsWith('--- !u!20 ')&&noViewport(s)===noViewport(now))continue;throw Error('Unexpected original document change '+id);}
const added=[...b].filter(([id])=>!a.has(id));assert.ok(added.length>100);assert.ok(added.some(([,s])=>s.includes('  m_Name: K01_PlayGuide\n')));
const metadata=[];for(const name of ['1xu.jpg','10xu.jpg','20xu.jpg']){const p='Assets/Art/K01Guide/'+name;const source=await fs.readFile(root+p),tested=await fs.readFile(validation+p),supplied=await fs.readFile('public/assets/Qua/'+name);assert.equal(hash(source),hash(tested));assert.equal(hash(source),hash(supplied));const before=await fs.readFile(root+p+'.meta','utf8'),after=await fs.readFile(validation+p+'.meta','utf8');assert.equal(before.match(/^guid: (\w+)/m)?.[1],after.match(/^guid: (\w+)/m)?.[1]);metadata.push({p:p+'.meta',after});}
const extra=added.map(([,s])=>s).join(''),merged=original.split(/(?=^--- !u!)/m).map(s=>{const id=s.match(/^--- !u!\d+ &(\d+)/)?.[1];return s.startsWith('--- !u!1660057539 ')?extra+s:id===parent[0]?b.get(id):s;}).join('');
for(const{p,after}of metadata)await fs.writeFile(root+p,after);await fs.writeFile(root+scene,merged);
const tracked=[root+scene,...code.flatMap(p=>[root+p,root+p+'.meta']),...metadata.map(m=>root+m.p),...['1xu.jpg','10xu.jpg','20xu.jpg'].map(n=>root+'Assets/Art/K01Guide/'+n)];
const report={result:'PASS',protectedFiles,originalSceneDocuments:a.size,addedSceneDocuments:added.length,changedParent:parent[0],existingDocuments:'byte-identical except UI_Canvas child list',cameraPosesAndViewport:'preserved',localGiftImages:'byte-identical to public/assets/Qua',code,sourceHashes:Object.fromEntries(await Promise.all(tracked.map(async p=>[p,hash(await fs.readFile(p))]))),unityTests:(xml.match(/<test-case /g)||[]).length,backend:'unchanged this turn',unverified:['Windows build','OBS','real LIVE']};
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');await fs.copyFile(out+'tests.xml',evidence+'unity-tests.xml');console.log(`PASS publish: ${protectedFiles} protected files; ${a.size} original documents; ${added.length} additions.`);
