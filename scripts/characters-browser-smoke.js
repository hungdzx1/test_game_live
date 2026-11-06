// Real /song, isolated application/profile/data. The fixture never touches LIVE.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';

const baseline=process.argv.includes('--baseline'),output=path.resolve('test-results/phase06-2');await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-models-'));
await writeFile(path.join(dataRoot,'caidat.json'),JSON.stringify({schemaVersion:1,port:3000,graphics:'high',camera:'overview',cycle:{cultivationSeconds:600,battleSeconds:120},display:{autoQuality:false}}));
const app=await createApplication({dataRoot,port:0}),samples=[],shots=[],errors=[],checks=[];let browser,base;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
try{
  base=`http://127.0.0.1:${await app.listen()}`;
  async function post(action,value,userId){const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});assert.equal(r.status,200,`${action}: ${await r.text()}`);}
  await post('demo',10);
  browser=await openTestBrowser(base+'/song');await browser.viewport(720,1280);
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  async function ready(){await browser.until("document.querySelector('#world canvas')&&document.querySelector('#connection').textContent.includes('nối máy chủ')",20000);assert.equal(await browser.evaluate("document.querySelector('#fallback').hidden"),true);}
  async function shot(name){const file=(baseline?'before-':'')+name;await browser.screenshot(path.join(output,file));shots.push(file);}
  async function sample(name){await delay(6500);const d=await (await fetch(base+'/api/dashboard')).json();assert.equal(d.load.webSockets,1);const report=d.renderReports.sort((a,b)=>b.receivedAt-a.receivedAt)[0];assert.ok(report&&report.receivedAt>Date.now()-3500);samples.push({name,...report});return report;}
  async function probe(){await browser.evaluate(`(async()=>{const {Object3D}=await import('/vendor/three/three.module.js');globalThis.__models={};const original=Object3D.prototype.updateMatrixWorld;Object3D.prototype.updateMatrixWorld=function(force){const r=original.call(this,force);if(this.isScene)globalThis.__models.scene=this;if(this.isPerspectiveCamera)globalThis.__models.camera=this;return r;};})()`);await browser.until('!!globalThis.__models.scene&&!!globalThis.__models.camera');}
  async function identity(){return browser.evaluate("globalThis.__models.scene.children.filter(o=>o.name.startsWith('disciple:demo-')&&Number(o.name.split('-').at(-1))<=10).map(o=>{const parts=[];o.traverse(c=>{if(c.isMesh&&c.name.startsWith('disciple-'))parts.push([c.name,c.geometry.attributes.position.count]);});return [o.name,parts];}).sort((a,b)=>a[0].localeCompare(b[0]))");}
  async function names(){const count=await browser.evaluate("globalThis.__models.scene.children.filter(o=>o.name.startsWith('disciple:')).flatMap(o=>o.children).filter(o=>o.name==='disciple-name'&&o.visible).length");assert.ok(count<=9,'Sparse real nameplates');}
  async function fit(){const cropped=await browser.evaluate(`(async()=>{const {Vector3}=await import('/vendor/three/three.module.js'),{SECT_BOUNDS}=await import('/js/sectLayout.js'),{camera}=globalThis.__models;camera.updateMatrixWorld();for(const b of Object.values(SECT_BOUNDS))for(let i=0;i<32;i++)for(const h of [0,b.height]){const p=new Vector3(b.center.x+Math.sin(i*Math.PI/16)*b.radius,b.center.y+h,b.center.z+Math.cos(i*Math.PI/16)*b.radius).project(camera);if(Math.abs(p.x)>.94||p.y<-.6||p.y>.73)return true;}return false;})()`);assert.equal(cropped,false,'06.1 framing preserved');}
  await ready();await sample('10 / high / 720x1280');await shot('song-sect.png');
  let originalIdentity;if(!baseline){await probe();await fit();await names();originalIdentity=await identity();}
  await post('camera','followPlayer');await post('cameraFocus',null,'demo-1');await delay(2200);await shot('song-disciple.png');await post('camera','overview');await delay(3500);
  if(!baseline){await post('camera','followPlayer');await post('cameraFocus',null,'demo-7');await delay(2400);await shot('song-disciple-front.png');await post('camera','overview');await delay(3500);}
  await post('demo',60);await browser.send('Page.reload');await ready();await sample('60 / high / 720x1280');await shot('song-sect-60.png');
  if(!baseline){await probe();await fit();await names();assert.deepEqual(await identity(),originalIdentity);}
  await browser.viewport(1080,1920);await delay(500);await shot('song-sect-1080.png');
  await post('graphics','low');await sample('60 / low / 1080x1920');await shot('song-low.png');
  await post('graphics','high');await post('prepareBreakthrough',null,'demo-1');await delay(2600);await shot('song-tribulation.png');
  checks.push('10/60 server players; high/low; 720x1280 and 1080x1920; existing focus and ceremony');
  await post('phase','battle');await post('demoSpeed',10);
  // Shortened 120s battle uses the existing proportional boss windows.
  for(let type=0;type<3;type++){
    const end=Date.now()+20000;
    while(app.engine.battle.current?.fields[0].activeBoss?.type!==type){assert.ok(Date.now()<end,'Boss '+type);await delay(40);}
    await post('phase','paused');await post('demoSpeed',1);await delay(1800);const high=await sample(`battle boss ${type} / high`);assert.equal(high.rendered,60);await shot(`song-boss-${type+1}.png`);
    if(!baseline){await names();assert.equal(await browser.evaluate(`globalThis.__models.scene.getObjectByName('boss:${type}').visible`),true);}
    if(!baseline&&type===0){await post('graphics','low');const low=await sample('battle 60 players / low');assert.equal(low.rendered,40);await names();await shot('song-battle-low.png');await post('graphics','high');}
    if(type<2){await post('demoSpeed',10);await post('phase','resume');}
  }
  await post('phase','cultivation');await post('phase','paused');await delay(2500);await shot('song-return.png');
  if(!baseline){await fit();await names();await sample('return / cache warmed');const stable=await sample('return / stable cache');const previous=samples.at(-2);assert.equal(stable.geometries,previous.geometries);assert.equal(stable.textures,previous.textures);checks.push('Same seed/identity after reload; <=9 real labels; battle high60/low40; 06.1 framing; stable post-battle WebGL counts');}
  checks.push('Three actual server boss types, original battle coordinates/pause, return to sect');
  await assert.rejects(readFile(path.join(dataRoot,'data/players.json')),e=>e.code==='ENOENT');assert.deepEqual(errors,[]);
  const report={timestamp:new Date().toISOString(),result:'PASS',baseline,browser:await browser.send('Browser.getVersion'),checks,samples,shots,errors};
  await writeFile(path.join(output,baseline?'baseline.json':'browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){await writeFile(path.join(output,'failure.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'FAIL',message:error.message,checks,samples,shots,errors},null,2)+'\n');throw error;
}finally{await browser?.close();await app.close();}
