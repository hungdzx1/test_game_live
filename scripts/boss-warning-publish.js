import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const root='unity-client/',validation='test-results/unity-concept02/project/',out='test-results/boss-warning/',evidence='docs/Tailieu_output/boss-notice-designs/implemented/',scene='Assets/Scenes/SectScene_Concept02.unity';
await fs.mkdir(evidence,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(b=>[b.match(/^--- !u!\d+ &(\d+)/)[1],b]));
const changed=['Assets/Scripts/Audio/GameAudioManager.cs','Assets/Scripts/Models/GameModels.cs','Assets/Scripts/Network/StateMapper.cs','Assets/Scripts/Characters/CharacterManager.cs','Assets/Scripts/Scenes/CameraRig.cs','Assets/Scripts/Effects/BossBattlePresenter.cs','Assets/Scripts/UI/Concept02Hud.cs'];
const added=['Assets/Scripts/UI/BossWarningSigil.cs','Assets/Scripts/Effects/BossWarningPresenter.cs','Assets/Editor/BossWarningSetup.cs','Assets/Tests/Editor/BossWarningTests.cs'];
const baseline=JSON.parse(await fs.readFile(out+'baseline.json','utf8'));let protectedFiles=0;
for(const[p,h]of Object.entries(baseline)){if(p===root+scene||p==='bossService.js'||changed.some(f=>p===root+f))continue;assert.equal(hash(await fs.readFile(p)),h,'Protected/concurrent change '+p);protectedFiles++;}
for(const p of [...changed,...added])assert.equal(hash(await fs.readFile(root+p)),hash(await fs.readFile(validation+p)),'Untested source '+p);
const xml=await fs.readFile(out+'tests.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"/);assert.match(xml,/<test-run[^>]*failed="0"[^>]*skipped="0"/);const count=(xml.match(/<test-case /g)||[]).length;assert.ok(count>=74,'Missing regression tests '+count);
const coreBytes=await fs.readFile(out+'node-core.log'),core=(coreBytes[0]===255&&coreBytes[1]===254?coreBytes.toString('utf16le'):coreBytes.toString('utf8')).replace(/^\uFEFF/,'');assert.match(core,/pass 133/);assert.match(core,/fail 0/);assert.match(core,/skipped 1/);
const newest=Math.max(...await Promise.all([...changed,...added].map(async p=>(await fs.stat(root+p)).mtimeMs)));assert.ok((await fs.stat(out+'tests.xml')).mtimeMs>=newest,'Stale tests');assert.ok((await fs.stat(evidence+'capture-report.json')).mtimeMs>=newest,'Stale capture');
const focused=await fs.readFile(out+'warning-tests.xml','utf8');assert.match(focused,/<test-run[^>]*result="Passed"[^>]*total="5"[^>]*passed="5"[^>]*failed="0"[^>]*skipped="0"/);assert.ok((await fs.stat(out+'warning-tests.xml')).mtimeMs>=newest,'Stale final warning checks');
const capture=JSON.parse(await fs.readFile(evidence+'capture-report.json','utf8'));assert.ok(capture.gpu&&!/null/i.test(capture.gpu));assert.deepEqual(capture.samples.map(s=>s.warning),[true,true,true,true,false,false]);assert.deepEqual(capture.samples.map(s=>s.boss),[false,false,false,false,true,false]);
const original=await fs.readFile(out+'original-scene.unity','utf8'),a=parse(original),b=parse(await fs.readFile(validation+scene,'utf8'));
const children=s=>s.match(/  m_Children:[\s\S]*?(?=  m_Father:)/)?.[0]??'',ids=s=>[...s.matchAll(/fileID: (\d+)/g)].map(m=>m[1]);
const ui=[...a].find(([,s])=>s.includes('  m_Name: UI_Canvas\n'));assert.ok(ui);const parent=[...a].find(([,s])=>s.startsWith('--- !u!224 ')&&s.includes('  m_GameObject: {fileID: '+ui[0]+'}'));assert.ok(parent);
const audio=[...a].find(([,s])=>s.includes('  bgm: {fileID:')&&s.includes('  banPhuc: {fileID:'));assert.ok(audio);
const withoutNewAudio=s=>s.replace(/^  (bossWarning|attackNormal|attackSkill1|attackSkill2): .*\n/gm,'');
const noViewport=s=>s.replace(/(  m_NormalizedViewPortRect:\n)[\s\S]*?(?=  near clip plane:)/,'$1');
for(const[id,s]of a){assert.ok(b.has(id),'Removed original document '+id);const now=b.get(id);if(s===now)continue;
 if(id===parent[0]){assert.equal(s.replace(children(s),''),now.replace(children(now),''));const before=ids(children(s)),after=ids(children(now));assert.deepEqual(after.filter(x=>before.includes(x)),before);assert.equal(after.length,before.length+1);continue;}
 if(id===audio[0]){assert.equal(withoutNewAudio(now),s);for(const name of ['bossWarning','attackNormal','attackSkill1','attackSkill2'])assert.match(now,new RegExp('  '+name+': \\{fileID: 8300000, guid: \\w+'));continue;}
 if(s.startsWith('--- !u!20 ')&&noViewport(s)===noViewport(now))continue;throw Error('Unexpected original document change '+id);
}
const extra=[...b].filter(([id])=>!a.has(id));assert.ok(extra.length>50);assert.ok(extra.some(([,s])=>s.includes('  m_Name: TB02_BossWarning\n')));
const design=JSON.parse(await fs.readFile('docs/Tailieu_output/boss-notice-designs/design-report.json','utf8'));
const soundFiles=['warning-TB02.wav','attack-normal.wav','attack-skill1.wav','attack-skill2.wav'].map(name=>'Assets/Musics/SFX/Boss/'+name);
for(const p of soundFiles){const h=design.sounds.find(s=>p.endsWith('/'+s.file))?.sha256;assert.equal(hash(await fs.readFile(root+p)),h,'Selected SFX changed '+p);assert.equal(hash(await fs.readFile(validation+p)),h,'Untested sound '+p);}
if(process.argv.includes('--verify')){
 const report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8'));for(const[p,h]of Object.entries(report.sourceHashes))assert.equal(hash(await fs.readFile(p)),h,p);
 const source=parse(await fs.readFile(root+scene,'utf8'));for(const[id,s]of a)assert.equal(source.get(id),id===parent[0]||id===audio[0]?b.get(id):s,'Original source document '+id);for(const[id,s]of extra)assert.equal(source.get(id),s,'Untested scene addition '+id);
 await fs.writeFile(evidence+'final-verification.json',JSON.stringify({...report,result:'PASS',finalAudit:'Original objects preserved; only Canvas children and four AudioClip references updated'},null,2)+'\n');console.log(`PASS final: ${protectedFiles} protected files; ${a.size} original scene documents; ${extra.length} tested additions; Unity ${count}.`);process.exit(0);
}
assert.equal(await fs.readFile(root+scene,'utf8'),original,'Source scene concurrently changed');
const addedText=extra.map(([,s])=>s).join('');const merged=original.split(/(?=^--- !u!)/m).map(s=>{const id=s.match(/^--- !u!\d+ &(\d+)/)?.[1];return s.startsWith('--- !u!1660057539 ')?addedText+s:id===parent[0]||id===audio[0]?b.get(id):s;}).join('');
const metaPaths=[...added.map(p=>p+'.meta'),...soundFiles.map(p=>p+'.meta'),'Assets/Musics/SFX.meta','Assets/Musics/SFX/Boss.meta'];
for(const p of metaPaths){const before=await fs.readFile(root+p,'utf8'),after=await fs.readFile(validation+p,'utf8');assert.equal(before.match(/^guid: (\w+)/m)?.[1],after.match(/^guid: (\w+)/m)?.[1]);await fs.writeFile(root+p,after);}
await fs.writeFile(root+scene,merged);
const tracked=[root+scene,'bossService.js','public/js/battleScene.js',...[...changed,...added,...metaPaths,...soundFiles].map(p=>root+p)];
const report={result:'PASS',protectedFiles,originalSceneDocuments:a.size,addedSceneDocuments:extra.length,changedDocuments:[parent[0],audio[0]],existingObjects:'all preserved; only Canvas child list and four SFX references changed',cameraPoseAndViewport:'unchanged',selected:'TB02 / warning-TB02',sounds:'four canonical WAVs in Assets/Musics/SFX/Boss; same SHA256 as approved previews',unity:{passed:count,failed:0,skipped:0,finalWarningRecheck:5},node:{passed:133,failed:0,skipped:1},sourceHashes:Object.fromEntries(await Promise.all(tracked.map(async p=>[p,hash(await fs.readFile(p))]))),unverified:['Windows build','OBS','real LIVE','subjective listening/mix']};
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');await fs.copyFile(out+'tests.xml',evidence+'unity-tests.xml');await fs.copyFile(out+'warning-tests.xml',evidence+'unity-warning-tests.xml');await fs.writeFile(evidence+'node-core.log',core);console.log(`PASS publish: ${protectedFiles} protected files; ${a.size} original documents; ${extra.length} additions; Unity ${count}.`);
