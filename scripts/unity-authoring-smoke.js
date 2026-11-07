// Real Node DEMO + actual Unity Editor or Windows Player, isolated from user data/LIVE.
import {createApplication} from '../server.js';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('.'),player=process.argv.includes('--player'),mode=player?'player':'editor';
const output=path.join(root,'test-results/unity-scene-authoring'),dataRoot=await mkdtemp(path.join(output,'demo-')),report=path.join(dataRoot,mode+'.json');
let app,unity,timer;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,timeout=150000){const end=Date.now()+timeout;while(Date.now()<end){if(await test())return;await pause(300);}throw new Error('Authoring smoke timeout');}
async function probe(){try{return JSON.parse(await readFile(report,'utf8'));}catch{return {};}}
async function start(port=0){app=await createApplication({dataRoot,port,connectorFactory:()=>{throw new Error('LIVE forbidden');}});return await app.listen();}
async function post(base,action,value,userId){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.ok(r.ok,await r.text());}
try{
 const port=await start(),base=`http://127.0.0.1:${port}`;await post(base,'demo',50);await post(base,'phase','cultivation');
 const validation=path.join(root,'test-results/unity-stage03/validation-project');
 const exe=player?path.join(validation,'Builds/SceneAuthoring/TuTienSect.exe'):'C:/Program Files/Unity/Hub/Editor/6000.5.9f1/Editor/Unity.exe';
 const common=['-batchmode',player?'-force-d3d11':'-nographics','--ws-url',`ws://127.0.0.1:${port}/ws`,'--authoring-report',report,'-logFile',path.join(output,mode+'-play.log')];
 const args=player?['-screen-width','720','-screen-height','1280','-screen-fullscreen','0',...common]:['-projectPath',validation,'-executeMethod','TuTienLive.Editor.SceneAuthoringVerification.RunPlay',...common];
 unity=spawn(exe,args,{windowsHide:true,stdio:'ignore'});let launchError;unity.once('error',e=>launchError=e);
 await until(async()=>{if(launchError)throw launchError;assert.equal(unity.exitCode,null,'Unity exited early');const p=await probe();return p.synchronized&&p.players===50&&p.views>0;});
 const id=app.engine.players.keys().next().value;await post(base,'prepareBreakthrough',null,id);
 timer=setInterval(()=>app?.engine.trigger('teleport',id),800);
 await until(async()=>{const p=await probe();return p.sawRitual&&p.maxEffects>0;},15000);clearInterval(timer);timer=null;
 await app.close();app=null;await until(async()=>(await probe()).sawDisconnected,15000);await pause(1300);await start(port);
 await post(base,'command',{text:'nhập môn',name:'Reconnect disciple',eventId:'authoring-restart'},'authoring-restart');
 await until(async()=>(await probe()).completed,30000);await until(()=>unity.exitCode!==null,10000);assert.equal(unity.exitCode,0);
 const p=await probe();assert.equal(p.result,'PASS');assert.ok(p.layoutValid&&p.spritesValid);assert.ok(p.maxCreated<=12);assert.equal(p.errors,0);
 for(const route of ['/','/song','/api/state','/api/dashboard'])assert.equal((await fetch(base+route)).status,200);
 await writeFile(path.join(root,'docs/unity-scene-authoring/'+mode+'-play-report.json'),JSON.stringify({...p,mode,live:false,webRoutes:'PASS',temporaryData:dataRoot},null,2));
 console.log('PASS '+mode+': saved custom layout preserved, serialized references, poses, 50 -> 51 players, events, ritual and reconnect.');
}finally{if(timer)clearInterval(timer);if(unity?.exitCode===null)unity.kill();if(app)await app.close();}
