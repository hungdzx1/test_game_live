// Actual Unity Windows runtime + actual Node application, restart, same port, preserved temporary DEMO save.
import assert from 'node:assert/strict';
import {fork,spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
const editorMode=process.argv.includes('--editor');
const mode=editorMode?'editor-play':'windows-player';
const root=path.resolve('.'),output=path.join(root,'test-results/unity-stage02');await mkdir(output,{recursive:true});
const temp=await mkdtemp(path.join(os.tmpdir(),'tutien-unity-network-'));
const probe=path.join(temp,mode+'.json');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=90000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await delay(200);}throw new Error('Smoke timeout');}
let server,unity,finalReport;const serverOutputs=[];
async function startServer(port=0){
  server=fork(path.join(root,'scripts/unity-network-demo.js'),[temp,String(port)],{windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  server.stdout.on('data',x=>serverOutputs.push(String(x)));server.stderr.on('data',x=>serverOutputs.push(String(x)));
  return await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('Node start timeout')),10000);server.once('message',m=>{clearTimeout(t);resolve(m);});server.once('error',reject);server.once('exit',code=>{clearTimeout(t);reject(new Error('Node early exit '+code));});});
}
async function stopServer(){if(server&&server.exitCode===null){const done=once(server,'exit');server.send('stop');await done;}}
async function readProbe(){try{return JSON.parse(await readFile(probe,'utf8'));}catch{return null;}}
try{
  const initial=await startServer(Number(process.env.UNITY_SMOKE_PORT??0));
  const endpoint=`ws://127.0.0.1:${initial.port}/ws`;
  const common=['-batchmode','-nographics','--ws-url',endpoint,'--network-report',probe,'--probe-seconds','30','-logFile',path.join(output,mode+'.log')];
  const executable=editorMode?(process.env.UNITY_EDITOR??'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe'):path.join(root,'unity-client/Builds/NetworkTest/TuTienNetworkTest.exe');
  const args=editorMode?['-projectPath',path.join(root,'unity-client'),'-executeMethod','TuTienLive.Editor.NetworkTestSetup.PlayProbe',...common]:common;
  unity=spawn(executable,args,{windowsHide:true,stdio:'ignore'});let launchError;unity.once('error',e=>launchError=e);
  await until(async()=>{if(launchError)throw launchError;if(unity.exitCode!==null)throw new Error('Unity exited '+unity.exitCode);const p=await readProbe();return p?.synchronized&&p.eventCallbacks>0;});
  await stopServer();
  await until(async()=>{const p=await readProbe();return p?.disconnects>0&&!p.synchronized;},12000);
  await delay(1300);
  const restarted=await startServer(initial.port);
  assert.notEqual(initial.session,restarted.session);assert.equal(restarted.players,4);
  await until(async()=>{const p=await readProbe();return p?.sessions.length===2&&p.players===4&&p.synchronized;},15000);
  // The same Node instance continues serving existing web/API routes while Unity subscribes.
  const base=`http://127.0.0.1:${initial.port}`;
  for(const route of ['/','/song','/js/admin.js','/api/state','/api/dashboard'])assert.equal((await fetch(base+route)).status,200,route);
  const dashboard=await(await fetch(base+'/api/dashboard')).json();assert.equal(dashboard.players,4);assert.equal(dashboard.mode,'demo');
  await until(async()=>{finalReport=await readProbe();return finalReport?.completed;},40000);
  assert.equal(finalReport.offThreadCallbacks,0);assert.ok(finalReport.eventCallbacks>=2);
  assert.equal(finalReport.rejected,0,finalReport.lastError);assert.equal(finalReport.sessions.length,2);
  assert.equal(finalReport.rosters[initial.session],3);assert.equal(finalReport.rosters[restarted.session],4);
  assert.ok(finalReport.disconnects>=1);assert.ok(finalReport.synchronized);assert.equal(finalReport.phase,'cultivation');
  await until(()=>unity.exitCode!==null,15000);assert.equal(unity.exitCode,0);
  await assert.rejects(readFile(path.join(temp,'data/players.json')),e=>e.code==='ENOENT');
  const report={result:'PASS',mode,initial,restarted,probe:finalReport,dashboard:{players:dashboard.players,mode:dashboard.mode,webSockets:dashboard.load.webSockets},temporaryData:temp,live:false};
  await writeFile(path.join(output,mode+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){console.error(serverOutputs.join(''));throw error;}
finally{if(unity&&unity.exitCode===null)unity.kill();await stopServer();}
