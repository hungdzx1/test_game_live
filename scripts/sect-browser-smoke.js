// Real /song renderer, loopback server and temporary data only. No TikTok connection.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';

const baseline=process.argv.includes('--baseline');
const output=path.resolve('test-results/phase06-1');await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-sect-'));
await writeFile(path.join(dataRoot,'caidat.json'),JSON.stringify({schemaVersion:1,port:3000,graphics:'medium',camera:'overview',cycle:{cultivationSeconds:600,battleSeconds:20},display:{autoQuality:false}}));
const app=await createApplication({dataRoot,port:0}),checks=[],samples=[],errors=[],shots=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));let browser,base,stateFrames=0,gameEvents=0;
try{
  base=`http://127.0.0.1:${await app.listen()}`;
  async function post(action,value,userId){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.equal(r.status,200,`${action}: ${await r.text()}`);}
  await post('demo',10);await post('phase','cultivation');
  browser=await openTestBrowser(base+'/song');
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  browser.on('Network.webSocketFrameReceived',e=>{const m=JSON.parse(e.response.payloadData);if(m.type==='state:snapshot')stateFrames++;if(m.type==='game:event')gameEvents++;});
  await browser.viewport(720,1280);
  async function ready(){await browser.until("!!document.querySelector('#world canvas')&&document.querySelector('#connection').textContent.includes('nối máy chủ')",20000);assert.equal(await browser.evaluate("document.querySelector('#fallback').hidden"),true);}
  await ready();
  await delay(6500);
  async function sample(name){const end=Date.now()+12000;let dashboard;do{dashboard=await (await fetch(base+'/api/dashboard')).json();dashboard.renderReports.sort((a,b)=>b.receivedAt-a.receivedAt);if(dashboard.renderReports[0]?.receivedAt>Date.now()-3500)break;assert.ok(Date.now()<end,'Real render telemetry');await delay(100);}while(true);assert.equal(dashboard.load.webSockets,1);samples.push({name,...dashboard.renderReports[0]});return samples.at(-1);}
  async function shot(name){await browser.screenshot(path.join(output,name));shots.push(name);}
  await sample('10 players / 720x1280 / medium');await shot(baseline?'before-720.png':'song-sect-720.png');
  checks.push('Real WebGL canvas, one WebSocket, ten demo players, live render telemetry');
  if(!baseline){
    async function probe(){
      await browser.evaluate(`(async()=>{const {Object3D}=await import('/vendor/three/three.module.js');globalThis.__sectProbe={};const original=Object3D.prototype.updateMatrixWorld;Object3D.prototype.updateMatrixWorld=function(force){const r=original.call(this,force);if(this.isScene)globalThis.__sectProbe.scene=this;if(this.isPerspectiveCamera)globalThis.__sectProbe.camera=this;return r;};})()`);
      await browser.until('!!globalThis.__sectProbe.scene&&!!globalThis.__sectProbe.camera');
    }
    async function fit(){
      const bounds=await browser.evaluate(`(async()=>{const {Vector3}=await import('/vendor/three/three.module.js'),{SECT_BOUNDS}=await import('/js/sectLayout.js'),{camera}=globalThis.__sectProbe;camera.updateMatrixWorld();const result={};for(const [name,b]of Object.entries(SECT_BOUNDS)){const points=[];for(let i=0;i<64;i++)for(const y of [0,b.height])points.push(new Vector3(b.center.x+Math.sin(i*Math.PI/32)*b.radius,b.center.y+y,b.center.z+Math.cos(i*Math.PI/32)*b.radius).project(camera));result[name]={left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),bottom:Math.min(...points.map(p=>p.y)),top:Math.max(...points.map(p=>p.y))};}return result;})()`);
      for(const [name,b]of Object.entries(bounds)){assert.ok(b.left>-.94&&b.right<.94,name+' horizontal crop');assert.ok(b.bottom>-.6&&b.top<.73,name+' vertical safe area');}
      assert.ok(bounds.courtyard.top<bounds.tribulation.bottom);return bounds;
    }
    await probe();await fit();
    await browser.viewport(1080,1920);await delay(1500);await shot('song-sect.png');
    await fit();
    await post('demo',60);
    // Reopen /song to examine the overview without queued join close-ups.
    // Focus is tested separately; restarting this tab never restarts the game.
    const session=app.engine.sessionId,elapsed=app.engine.elapsedMs;
    await browser.send('Page.reload');await ready();await probe();await delay(6500);
    assert.equal(app.engine.sessionId,session);assert.ok(app.engine.elapsedMs>elapsed);assert.equal(app.engine.players.size,60);
    const before=await sample('60 players / 1080x1920 / medium');assert.equal(before.rendered,12);await fit();await shot('song-sect-60.png');
    await browser.viewport(720,1280);await delay(2500);await fit();await sample('60 players / 720x1280 / medium');await shot('song-sect-60-720.png');
    // Focus a non-representative player through the existing camera API.
    await post('camera','followPlayer');await post('cameraFocus',null,'demo-60');await delay(2200);
    assert.equal(await browser.evaluate(`document.querySelector('#following').textContent.includes(${JSON.stringify(app.engine.getPlayer('demo-60').name)})`),true);
    await post('camera','overview');await delay(4500);
    await post('prepareBreakthrough',null,'demo-1');
    await browser.until("document.querySelector('.ceremony-title').textContent.includes('ĐỘ KIẾP')",8000);
    await delay(2400);await fit();await shot('song-tribulation-720.png');
    const centered=await browser.evaluate(`(async()=>{const {TRIBULATION_PLATFORM_CENTER:p}=await import('/js/sectLayout.js');const roots=globalThis.__sectProbe.scene.children.filter(o=>o.type==='Group'&&o.children.some(c=>c.type==='Sprite'));return roots.some(o=>Math.abs(o.position.x-p.x)<.05&&Math.abs(o.position.z-p.z)<.05&&Math.abs(o.position.y-p.y-.3)<.05);})()`);assert.equal(centered,true,'Actual character reaches shared platform center');
    await browser.viewport(1080,1920);await delay(500);await fit();await shot('song-tribulation.png');
    const ritualId=app.engine.breakthrough.active.id;
    await post('phase','paused');const exp=app.engine.getPlayer('demo-1').cultivation;await delay(300);assert.equal(app.engine.getPlayer('demo-1').cultivation,exp);
    await browser.send('Page.reload');await ready();await probe();await delay(1200);await fit();assert.equal(app.engine.breakthrough.active.id,ritualId);await post('phase','resume');
    const end=Date.now()+18000;while(app.engine.breakthrough.active){assert.ok(Date.now()<end,'Ceremony completion');await delay(50);}await delay(150);await shot('song-announcement.png');
    checks.push('Both 9:16 sizes show courtyard and platform; 10/60 server players; 12 representatives; actual ceremony character centered; pause/reload/resume keeps same ritual');
    await post('phase','battle');await browser.until("document.querySelector('#phase').textContent==='DIỆT MA'");await delay(2000);
    assert.equal(await browser.evaluate("globalThis.__sectProbe.scene.getObjectByName('sect-architecture').visible"),false);
    assert.equal(await browser.evaluate("globalThis.__sectProbe.scene.getObjectByName('tribulation-platform').visible"),false);await shot('song-battle.png');
    const frozen=app.engine.getPlayer('demo-1').cultivation;await post('command',{text:'1',eventId:'sect-skill'},'demo-1');await delay(300);assert.equal(app.engine.getPlayer('demo-1').cultivation,frozen);
    await post('demoSpeed',10);
    const battleEnd=Date.now()+10000;while(app.engine.phase==='battle'){assert.ok(Date.now()<battleEnd,'Battle return');await delay(50);}
    await post('phase','paused');await post('demoSpeed',1);await delay(1000);await shot('song-battle-result.png');
    assert.equal(await browser.evaluate("globalThis.__sectProbe.scene.getObjectByName('sect-architecture').visible"),true);
    assert.equal(await browser.evaluate("globalThis.__sectProbe.scene.getObjectByName('tribulation-platform').visible"),true);
    await post('phase','resume');await delay(13000);await fit();await shot('song-return.png');
    checks.push('Original battle/skill/EXP freeze and automatic result/return run; courtyard AND platform hide in battle, reappear with original resources');
    await post('graphics','low');await delay(2500);await fit();await shot('song-low.png');await sample('60 players / 1080x1920 / low');
    assert.equal(await browser.evaluate('globalThis.__sectProbe.scene.children.find(o=>o.isDirectionalLight).castShadow'),false);
    await post('graphics','medium');await delay(6500);await fit();const after=await sample('60 players / after return and focus / medium');
    // 06.2 adds finite shared costume caches: <=256 disciple +49 enemy rigid
    // geometries, plus existing world primitives/line. First battle uploads
    // styles and full LODs not visible in the initial twelve representatives.
    assert.ok(after.geometries<=320,'Finite costume cache and world geometry budget');
    // Thirteen sect representatives, twelve battle damage slots, two world
    // labels and shadow/internal textures. Hidden labels may remain uploaded.
    assert.ok(after.textures<=30,'Bounded player/world/damage textures');
    await delay(6500);const stable=await sample('60 players / steady state after effects / medium');assert.equal(stable.geometries,after.geometries);assert.ok(stable.textures<=after.textures+1);
    assert.ok(after.rendered<=13);assert.ok(stateFrames>30);assert.ok(gameEvents>0);assert.equal(app.engine.players.size,60);
    await assert.rejects(readFile(path.join(dataRoot,'data/players.json')),e=>e.code==='ENOENT');
    checks.push('Hidden-user manual focus works; low quality retains framing and disables shadows; short-run geometry/texture counts remain bounded; one WS continues and no LIVE file is written');
  }
  assert.deepEqual(errors,[]);
  const gpu=await browser.evaluate("(()=>{const gl=document.querySelector('#world canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null};})()");
  const report={timestamp:new Date().toISOString(),result:'PASS',baseline,browser:await browser.send('Browser.getVersion'),gpu,checks,samples,stateFrames,gameEvents,errors,shots,dataRoot};
  await writeFile(path.join(output,baseline?'baseline.json':'browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){await writeFile(path.join(output,'last-browser-failure.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'FAIL',message:error.message,checks,samples,errors,shots},null,2)+'\n');throw error;
}finally{await browser?.close();await app.close();}
