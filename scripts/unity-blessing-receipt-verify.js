import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const output='test-results/unity-blessing-receipt/',evidence='docs/Tailieu_output/blessing-receipt/',root='unity-client/',validation='test-results/unity-concept02/project/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(await fs.readFile(output+'protected-baseline.json','utf8'));
const report=JSON.parse(await fs.readFile(evidence+'preservation-report.json','utf8'));
const owned=report.validatedCodeFiles;let checked=0;
for(const[file,expected]of Object.entries(baseline)){
  if(owned.some(f=>file===root+f))continue;
  assert.equal(hash(await fs.readFile(file)),expected,'Protected file changed: '+file);checked++;
}
for(const file of owned)assert.equal(hash(await fs.readFile(root+file)),hash(await fs.readFile(validation+file)),'Code not synchronized: '+file);
const parse=s=>new Map(s.split(/(?=^--- !u!)/m).slice(1).map(block=>[block.match(/^--- !u!\d+ &(\d+)/)[1],block]));
const scene='Assets/Scenes/SectScene_Concept02.unity',old=parse(await fs.readFile(output+'original-scene.unity','utf8')),current=parse(await fs.readFile(root+scene,'utf8')),tested=parse(await fs.readFile(validation+scene,'utf8'));
const parents=new Set(report.changedParents);
const children=s=>s.match(/  m_Children:[\s\S]*?(?=  m_Father:)/)?.[0]??'';
const ids=s=>[...s.matchAll(/fileID: (\d+)/g)].map(m=>m[1]);
for(const[id,block]of old){
  assert.ok(current.has(id),'Original scene object removed: '+id);
  if(!parents.has(id)){assert.equal(current.get(id),block,'Original scene object changed: '+id);continue;}
  assert.equal(current.get(id).replace(children(current.get(id)),''),block.replace(children(block),''));
  const previous=ids(children(block)),now=ids(children(current.get(id)));
  assert.deepEqual(now.filter(x=>previous.includes(x)),previous);assert.equal(now.length,previous.length+1);
}
for(const[id,block]of current)if(!old.has(id))assert.equal(block,tested.get(id),'New scene object differs from validation: '+id);
const popup=[...current].find(([,block])=>block.includes('  m_Name: BlessingReceiptFX\n'));assert.ok(popup);
const rect=[...current.values()].find(block=>block.startsWith('--- !u!224 ')&&block.includes('  m_GameObject: {fileID: '+popup[0]+'}'));
assert.ok(rect.includes('m_AnchoredPosition: {x: 0, y: 280}'));
assert.equal(hash(await fs.readFile(root+'Assets/Art/Items/tbao_ban_phuc.png.meta')),hash(await fs.readFile(validation+'Assets/Art/Items/tbao_ban_phuc.png.meta')));
const xml=await fs.readFile(evidence+'tests.xml','utf8');assert.match(xml,/<test-run[^>]*result="Passed"[^>]*total="58"[^>]*passed="58"[^>]*failed="0"/);
const capture=JSON.parse(await fs.readFile(evidence+'capture-report.json','utf8'));assert.equal(capture.timeline.at(-1).visible,false);assert.equal(capture.timeline.at(-1).alpha,0);assert.equal(capture.timeline.at(-1).shake,0);
report.protectedFiles=checked;report.finalSceneSha256=hash(await fs.readFile(root+scene));report.popupAnchor={x:0,y:280};report.sourceAndValidationNewObjectsEqual=true;
await fs.writeFile(evidence+'preservation-report.json',JSON.stringify(report,null,2)+'\n');
await fs.writeFile(evidence+'verification-report.json',JSON.stringify({result:'PASS',scope:'Qua_Tbao.md section 6, Unity Concept02',unity:'6000.5.9f1',node:{pass:118,fail:0,skip:1,reason:'Real TikTok LIVE unavailable'},unityTests:{pass:58,fail:0,skip:0,includes:'Editor, Play Mode, HTTP/WebSocket, one SFX, item camera regression'},gpu:capture.gpu,resolutions:['1080x1920','720x1280'],protectedFiles:checked,unverified:['Windows build','OBS capture','Real TikTok LIVE','Subjective speaker/headphone listening']},null,2)+'\n');
console.log('PASS: 58 Unity tests, GPU timeline, '+checked+' protected files and all original scene objects verified.');
