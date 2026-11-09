import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',out='test-results/storm-camera-timing/',evidence='docs/Tailieu_output/storm-camera-timing/',scene='Assets/Scenes/SectScene_Concept02.unity';await fs.mkdir(evidence,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(s=>[s.match(/^--- !u!\d+ &(\d+)/)[1],s]));
const changed=['Assets/Scripts/Effects/TribulationController.cs','Assets/Scripts/Effects/IdleCameraPresenter.cs','Assets/Editor/Camera9Setup.cs','Assets/Tests/Editor/Concept02StormTests.cs','Assets/Tests/Editor/Camera9Tests.cs','Assets/Tests/Editor/Qua78Tests.cs'],added=['Assets/Editor/StormCameraTimingSetup.cs'];
const baseline=JSON.parse(await fs.readFile(out+'baseline.json','utf8'));let protectedFiles=0;
for(const[p,h]of Object.entries(baseline)){if(p===root+scene||changed.some(f=>p===root+f))continue;assert.equal(hash(await fs.readFile(p)),h,'Protected/concurrent change '+p);protectedFiles++;}
for(const p of [...changed,...added])assert.equal(hash(await fs.readFile(root+p)),hash(await fs.readFile(validation+p)),'Untested source '+p);
const xml=await fs.readFile(out+'tests.xml','utf8'),protocolXml=await fs.readFile(out+'protocol-tests.xml','utf8');
for(const result of [xml,protocolXml]){assert.match(result,/<test-run[^>]*result="Passed"/);assert.match(result,/<test-run[^>]*failed="0"[^>]*skipped="0"/);}
const names=s=>[...s.matchAll(/<test-case [^>]*fullname="([^"]*)"/g)].map(m=>m[1]),allNames=[...new Set([...names(xml),...names(protocolXml)])],count=allNames.length;
for(const name of names(await fs.readFile('test-results/camera9/tests.xml','utf8')))assert.ok(allNames.includes(name),'Missing regression '+name);assert.ok(count>=87,'Missing regressions '+count);
const bytes=await fs.readFile(out+'node-core.log'),core=(bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8')).replace(/^\uFEFF/,'');assert.match(core,/pass 137/);assert.match(core,/fail 0/);assert.match(core,/skipped 1/);
const newest=Math.max(...await Promise.all([...changed,...added].map(async p=>(await fs.stat(root+p)).mtimeMs)));for(const file of ['tests.xml','protocol-tests.xml'])assert.ok((await fs.stat(out+file)).mtimeMs>=newest,'Stale Unity checks '+file);assert.ok((await fs.stat(evidence+'capture-report.json')).mtimeMs>=newest,'Stale capture');
const capture=JSON.parse(await fs.readFile(evidence+'capture-report.json','utf8'));assert.ok(capture.gpu&&!/null/i.test(capture.gpu));
for(const t of capture.timeline){assert.equal(t.cloud,t.elapsedMs>=1500&&t.elapsedMs<12000,'Cloud at '+t.elapsedMs);assert.equal(t.lightning,t.elapsedMs>=1800&&t.elapsedMs<12000,'Lightning at '+t.elapsedMs);}
assert.deepEqual(capture.shots.map(s=>s.totalSeconds),[6.6,21.6,8]);for(const s of capture.shots){assert.equal(s.beforeEnd,s.mode);assert.equal(s.afterEnd,'overview');}
const original=await fs.readFile(out+'original-scene.unity','utf8'),a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8'));assert.equal(a.size,b.size,'Added/removed scene documents');
const idle=[...a].find(([,s])=>s.includes('  idleSeconds: 15\n'));assert.ok(idle);
const noSignedZero=s=>s.replace(/(: )-0(?=[,}\n])/g,(_,prefix)=>prefix+'0');const noViewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,s]of a){const now=b.get(id);assert.ok(now,'Removed original document '+id);if(s===now)continue;
 if(id===idle[0]){assert.ok(now.includes('  zoomSeconds: 5\n')&&now.includes('  followSeconds: 8\n'));assert.equal(now.replace('  panSeconds: 20\n','  panSeconds: 8\n').replace(/^  (zoomSeconds|followSeconds): .*\n/gm,''),s);continue;}
 if(noSignedZero(s)===noSignedZero(now))continue;if(s.startsWith('--- !u!20 ')&&noViewport(s)===noViewport(now))continue;throw Error('Unexpected original scene change '+id);
}
const expected=original.split(/(?=^--- !u!)/m).map(s=>s.match(/^--- !u!\d+ &(\d+)/)?.[1]===idle[0]?b.get(idle[0]):s).join('');
if(process.argv.includes('--verify')){
 const report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8'));for(const[p,h]of Object.entries(report.sourceHashes))assert.equal(hash(await fs.readFile(p)),h,p);assert.equal(await fs.readFile(root+scene,'utf8'),expected);
 await fs.writeFile(evidence+'final-verification.json',JSON.stringify({...report,finalAudit:'PASS; source matches tested camera settings; every other original scene document/camera/viewport retained byte-for-byte'},null,2)+'\n');console.log(`PASS final timing: ${protectedFiles} protected files; ${a.size} scene documents; Unity ${count}.`);process.exit(0);
}
assert.equal(await fs.readFile(root+scene,'utf8'),original,'Source scene concurrently changed');
for(const p of added){const source=await fs.readFile(root+p+'.meta','utf8'),tested=await fs.readFile(validation+p+'.meta','utf8');assert.equal(source.match(/^guid: (\w+)/m)?.[1],tested.match(/^guid: (\w+)/m)?.[1]);await fs.writeFile(root+p+'.meta',tested);}
await fs.writeFile(root+scene,expected);
const tracked=[root+scene,...[...changed,...added].flatMap(p=>[root+p,root+p+'.meta'])];
const report={result:'PASS',protectedFiles,originalSceneDocuments:a.size,changedSceneDocuments:[idle[0]],addedSceneDocuments:0,cameraPoseAndViewport:'unchanged',backendPackagesAndPlayerData:'unchanged',unity:{passed:count,failed:0,skipped:0,runs:{regressions:names(xml).length,protocol:names(protocolXml).length},uniqueTests:allNames},node:{passed:137,failed:0,skipped:1},sourceHashes:Object.fromEntries(await Promise.all(tracked.map(async p=>[p,hash(await fs.readFile(p))]))),unverified:['Windows build','OBS','real LIVE','stream FPS']};
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');await fs.copyFile(out+'tests.xml',evidence+'unity-tests.xml');await fs.copyFile(out+'protocol-tests.xml',evidence+'unity-protocol-tests.xml');await fs.writeFile(evidence+'node-core.log',core);console.log(`PASS publish timing: ${protectedFiles} protected files; ${a.size} scene documents; Unity ${count}.`);
