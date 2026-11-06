// Actual Editor Play Mode + temporary DEMO Node, no production data or TikTok LIVE.
import {createApplication} from '../server.js';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('.'),output=path.join(root,'test-results/unity-stage04'),dataRoot=await mkdtemp(path.join(output,'demo-'));
const report=path.join(output,'play-probe.json');let app,unity,timer;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,timeout=120000){const end=Date.now()+timeout;while(Date.now()<end){if(await test())return;await pause(300);}throw new Error('Stage04 timeout');}
async function probe(){try{return JSON.parse(await readFile(report,'utf8'));}catch{return {};}}
async function start(port=0){app=await createApplication({dataRoot,port,connectorFactory:()=>{throw new Error('LIVE forbidden in stage04 smoke');}});return await app.listen();}
async function post(base,action,value,userId){const res=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.ok(res.ok,await res.text());}
try{
 await unlink(report).catch(e=>{if(e.code!=='ENOENT')throw e;});
 const port=await start(),base=`http://127.0.0.1:${port}`;await post(base,'demo',50);await post(base,'phase','cultivation');
 unity=spawn('C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe',['-batchmode','-nographics','-projectPath',path.join(root,'test-results/unity-stage03/validation-project'),'-executeMethod','TuTienLive.Editor.CharacterPlayProbe.Run','--ws-url',`ws://127.0.0.1:${port}/ws`,'--character-report',report,'-logFile',path.join(output,'play.log')],{windowsHide:true,stdio:'ignore'});
 await until(async()=>{assert.equal(unity.exitCode,null,'Unity exited before sync');const p=await probe();return p.synchronized&&p.players===50&&p.views>0;});
 const id=app.engine.players.keys().next().value;await post(base,'prepareBreakthrough',null,id);
 timer=setInterval(()=>{app?.engine.trigger('teleport',id);},800);
 await until(async()=>{const p=await probe();return p.sawRitual&&p.acceptedEffects>0;},15000);clearInterval(timer);timer=null;
 await app.close();app=null;
 await until(async()=>(await probe()).sawDisconnected,15000);
 await pause(1300);await start(port);
 await post(base,'command',{text:'nhập môn',name:'Reconnect disciple',eventId:'stage04-restart'},'stage04-restart');
 await until(async()=>(await probe()).completed,30000);await until(()=>unity.exitCode!==null,10000);assert.equal(unity.exitCode,0);
 const p=await probe();assert.equal(p.errors,0);assert.ok(p.maxCreated<=12);assert.ok(p.maxViews<=12);assert.ok(p.maxEffects>0);
 for(const route of ['/','/song','/api/state','/api/dashboard'])assert.equal((await fetch(base+route)).status,200);
 await writeFile(path.join(root,'docs/unity-stage04/play-report.json'),JSON.stringify({result:'PASS',...p,mode:'actual Unity Editor Play Mode, Null graphics',temporaryData:dataRoot,live:false,dashboardRoutes:'PASS'},null,2));
 console.log('PASS actual Play Mode: 50 -> 51 players, Node stop/restart, ritual received, bounded visuals, web routes intact.');
}finally{if(timer)clearInterval(timer);if(unity?.exitCode===null)unity.kill();if(app)await app.close();}
