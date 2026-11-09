import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const output='test-results/ai-voice/',docs='docs/Tailieu_output/ai-voice/';
const changed=['server.js','GAME_DESIGN.md','PROGRESS.md','docs/Tailieu/AMTHANH.md','unity-client/Assets/Scripts/Audio/GameAudioManager.cs'];
const added=['voiceCache.js','voiceService.js','tools/tts/piper/worker.py','test/ai-voice.test.js','scripts/ai-voice-benchmark.js','scripts/ai-voice-test-server.js','scripts/Run-AiVoiceUnity.ps1','scripts/ai-voice-verify.js','unity-client/Assets/Scripts/Audio/ThienDaoVoicePlayer.cs','unity-client/Assets/Scripts/Audio/ThienDaoVoicePlayer.cs.meta','unity-client/Assets/Tests/Editor/ThienDaoVoiceTests.cs','unity-client/Assets/Tests/Editor/ThienDaoVoiceTests.cs.meta','unity-client/Assets/Editor/AiVoiceVerification.cs','unity-client/Assets/Editor/AiVoiceVerification.cs.meta','docs/Tailieu_output/ai-voice/README.md'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseline=JSON.parse(await fs.readFile(output+'baseline.json','utf8'));let protectedFiles=0;const concurrentDataChanges=[];
for(const [file,old]of Object.entries(baseline)){
 if(changed.includes(file))continue;const current=hash(await fs.readFile(file));
 if(current!==old&&file.startsWith('data/')){concurrentDataChanges.push({file,before:old,current,handling:'Current bytes retained; helper/tests use disposable data roots. Origin of concurrent change unverified.'});continue;}
 assert.equal(current,old,'Unexpected change: '+file);protectedFiles++;
}
for(const file of [...changed,...added].filter(p=>p.endsWith('.cs'))){assert.equal(hash(await fs.readFile(file)),hash(await fs.readFile(file.replace('unity-client/','test-results/unity-concept02/project/'))),'Unity source not tested: '+file);}
const readLog=async file=>{const b=await fs.readFile(file);return (b[0]===255&&b[1]===254?b.toString('utf16le'):b.toString('utf8')).replace(/^\uFEFF/,'');};
const node=await readLog(output+'node-core-final.log');assert.match(node,/tests 160/);assert.match(node,/pass 159/);assert.match(node,/fail 0/);assert.match(node,/skipped 1/);
const xml=await fs.readFile(output+'unity-regression.xml','utf8');const head=xml.match(/<test-run[^>]+>/)[0];assert.match(head,/total="105"/);assert.match(head,/passed="105"/);assert.match(head,/failed="0"/);assert.match(head,/skipped="0"/);
const unityTime=(await fs.stat(output+'unity-regression.xml')).mtimeMs;
for(const file of [...changed,...added].filter(p=>p.endsWith('.cs')))assert.ok(unityTime>=(await fs.stat(file)).mtimeMs,'Unity results older than source: '+file);
const nodeTime=(await fs.stat(output+'node-core-final.log')).mtimeMs;
for(const file of ['server.js','voiceService.js','voiceCache.js','test/ai-voice.test.js'])assert.ok(nodeTime>=(await fs.stat(file)).mtimeMs,'Node results older than source: '+file);
const cases=[...xml.matchAll(/<test-case [^>]*fullname="([^"]*)"[^>]*result="([^"]*)"/g)].map(m=>({name:m[1],result:m[2]}));assert.equal(cases.length,105);assert.ok(cases.every(c=>c.result==='Passed'));assert.equal(cases.filter(c=>c.name.startsWith('TuTienLive.Tests.ThienDaoVoiceTests.')).length,10);
const old=await fs.readFile('docs/Tailieu_output/avatar-format-fix/unity-initial-regression.xml','utf8');for(const m of old.matchAll(/<test-case [^>]*fullname="([^"]*)"/g))assert.ok(cases.some(c=>c.name===m[1]),'Missing baseline '+m[1]);
const sourceHashes=Object.fromEntries(await Promise.all([...changed,...added].map(async p=>[p,hash(await fs.readFile(p))])));
const benchmark=JSON.parse(await fs.readFile(output+'piper-benchmark.json','utf8'));
let build=null;try{build=JSON.parse(await fs.readFile(output+'build-report.json','utf8'));}catch{}
assert.equal(build?.result,'Succeeded');assert.equal(build.errors,0);await fs.access(build.path);
const player=await fs.readFile(output+'windows-player.log','utf8');assert.match(player,/Initialize engine version: 6000.5.9f1/);assert.doesNotMatch(player,/Exception|error CS|Fatal error/);
const report={result:'PASS',protectedFiles,concurrentDataChanges,changed,added,sourceHashes,node:{passed:159,failed:0,skipped:1},unity:{passed:105,failed:0,skipped:0,baseline:95,voiceTests:10,platform:'6000.5.9f1 EditMode + EnterPlayMode; nographics; real local HTTP/WebSocket/Piper WAV'},benchmark,build,windowsSmoke:'PASS booted for 12 seconds; nographics/noaudio; no exception in player log; does not verify rendering, audio playback or OBS',unverified:['Subjective listening and naturalness of joins','OBS audio capture','Real TikTok LIVE latency and sustained load','Visual subtitle layout on GPU','Windows player GPU/audio end-to-end']};
await fs.mkdir(docs,{recursive:true});await fs.writeFile(docs+'verification.json',JSON.stringify(report,null,2)+'\n');await fs.writeFile(docs+'node-core.log',node);await fs.copyFile(output+'unity-regression.xml',docs+'unity-regression.xml');await fs.copyFile(output+'piper-benchmark.json',docs+'piper-benchmark.json');await fs.copyFile(output+'build-report.json',docs+'build-report.json');await fs.copyFile(output+'windows-player.log',docs+'windows-player.log');console.log(JSON.stringify({result:report.result,protectedFiles,node:report.node,unity:report.unity,concurrentDataChanges:concurrentDataChanges.length,build},null,2));
