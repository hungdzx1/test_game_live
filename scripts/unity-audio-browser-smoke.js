// Server audio controls with a disposable backend and Chrome profile.
import assert from 'node:assert/strict';import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {openTestBrowser} from './browser-test-driver.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-audio-ui-')),output=path.resolve('docs/Tailieu_output/amthanh');await mkdir(output,{recursive:true});
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});let browser;const checks=[],errors=[];
try{
  const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base+'/#/settings/audio');
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  await browser.until("document.body.dataset.ready==='true'&&!document.querySelector('#page-settings').hidden");
  await browser.until("document.body.textContent.includes('Unity nhận bật/tắt')");
  for(const[key,value]of Object.entries({masterVolume:.65,musicVolume:.45,effectsVolume:.55}))await browser.fill('#audio-'+key,String(value));
  await browser.click('#audio-music');await browser.click('#audio-effects');await browser.click('#save-audio');
  const wait=async fn=>{const end=Date.now()+6000;while(!fn()){assert.ok(Date.now()<end,'Audio setting timeout');await new Promise(r=>setTimeout(r,25));}};
  await wait(()=>app.engine.config.audio.masterVolume===.65&&!app.engine.config.audio.music&&!app.engine.config.audio.effects);
  let disk=JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8')).audio;assert.equal(disk.musicVolume,.45);assert.equal(disk.effectsVolume,.55);
  await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");assert.equal(await browser.evaluate("document.querySelector('#audio-music').checked||document.querySelector('#audio-effects').checked"),false);
  assert.equal(await browser.evaluate("document.querySelector('#audio-masterVolume').value"),'0.65');
  checks.push('Saved master/music/effect sliders and independent channel switches via actual admin controls; values persist after reload');
  await browser.click('#audio-enabled');await browser.click('#save-audio');await wait(()=>app.engine.config.audio.enabled===false);
  await browser.click('#audio-enabled');await browser.click('#audio-music');await browser.click('#audio-effects');await browser.click('#save-audio');await wait(()=>app.engine.config.audio.enabled&&app.engine.config.audio.music&&app.engine.config.audio.effects);
  const state=(await(await fetch(base+'/api/state')).json()).payload;assert.equal(state.config.audio.masterVolume,.65);assert.equal(state.config.audio.effectsVolume,.55);
  checks.push('Master mute/unmute and channel restore save to the server; Unity guidance distinguishes server volume from browser preview/TTS');
  await browser.screenshot(path.join(output,'audio-settings.png'));assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'PASS',browser:(await browser.send('Browser.getVersion')).product,checks,errors},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch(error){await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'FAIL',error:error.message,checks,errors},null,2));await browser?.screenshot(path.join(output,'browser-failure.png')).catch(()=>{});throw error;}
finally{await browser?.close();await app.close();}
