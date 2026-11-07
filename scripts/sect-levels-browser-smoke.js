// Admin settings against the real backend; all data/profile files are disposable.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-sect-level-ui-')),output=path.resolve('docs/Tailieu_output/qua-phan3');await mkdir(output,{recursive:true});
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});let browser;
const errors=[],checks=[],plan=['tea','pill','blessing','root','camera','tea'].map((item,i)=>({level:i+1,likes:(i+1)*10,reward:{item,quantity:2},scope:'all'}));
try{
  const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base);browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));await browser.until("document.body.dataset.ready==='true'");
  const go=async page=>{await browser.evaluate(`location.hash=${JSON.stringify(page==='settings'?'#/settings/gifts':'#/'+page)}`);await browser.until(`!document.querySelector('#page-${page}').hidden`);};
  const wait=async predicate=>{const end=Date.now()+6000;while(!predicate()){assert.ok(Date.now()<end,'Engine timeout');await new Promise(r=>setTimeout(r,25));}};
  const post=async(action,value)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());};
  const row=index=>`#sect-level-table tbody tr:nth-child(${index}) `;
  await go('settings');await browser.until("document.querySelectorAll('#sect-level-table tbody tr').length===3");assert.equal(await browser.evaluate("document.getElementById('wish-threshold')===null"),true);assert.equal(await browser.evaluate("[...document.querySelectorAll('h2')].some(e=>e.textContent.includes('Kết nối & Nguyện Lực'))"),false);
  for(let n=0;n<3;n++)await browser.click('#add-sect-level');assert.equal(await browser.evaluate("document.querySelectorAll('#sect-level-table tbody tr').length"),6);
  for(const r of plan){await browser.fill(row(r.level)+'[data-level-key=likes]',String(r.likes));await browser.fill(row(r.level)+'[data-level-key=item]',r.reward.item,'change');await browser.fill(row(r.level)+'[data-level-key=quantity]',String(r.reward.quantity));}
  await go('demo');await go('settings');assert.equal(await browser.evaluate(`document.querySelector('${row(6)}[data-level-key=likes]').value`),'60');
  await browser.fill(row(1)+'[data-level-key=likes]','0');await browser.click('#save-sect-levels');assert.equal(app.engine.config.sectLevels.length,3);assert.equal(await browser.evaluate(`document.querySelector('${row(1)}[data-level-key=likes]').value`),'0');await browser.fill(row(1)+'[data-level-key=likes]','10');await browser.click('#save-sect-levels');await wait(()=>app.engine.config.sectLevels.length===6);assert.deepEqual(app.engine.config.sectLevels,plan);
  checks.push('Replaced repeating wish panel; added six levels; all five item choices, quantities, all-sect scope; draft survives snapshots/routes; invalid input stays unsaved');
  await browser.until("document.querySelector('#sect-level-status').textContent.includes('Cấp 1/6')");await browser.screenshot(path.join(output,'levels-settings-dark.png'));await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");await go('settings');await browser.until("document.querySelectorAll('#sect-level-table tbody tr').length===6");assert.equal(await browser.evaluate(`document.querySelector('${row(5)}[data-level-key=item]').value`),'camera');assert.deepEqual(JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8')).sectLevels,plan);
  await go('demo');await browser.fill('#count','10','change');await browser.click('#demo');await wait(()=>app.engine.players.size===10);await post('phase','paused');
  for(const n of [100,10,10,10,10,10,10,1,1,1,1,1])await browser.click(`[data-like="${n}"]`);
  await wait(()=>app.engine.liveEvents.sectEnergy.totalLikes===165);assert.deepEqual(app.engine.liveEvents.sectEnergy.snapshot(),{level:6,power:15,threshold:60,maxLevel:6,full:false});
  for(const p of app.engine.players.values()){for(const item of ['tea','pill','root','camera'])assert.equal(p.inventory[item],2);assert.equal(p.buffs.length,0);}assert.equal(app.engine.items.blessingSnapshot().remainingMs,60000);
  await go('settings');await browser.until("document.querySelector('#sect-level-status').textContent.includes('Cấp 6/6')");
  await post('demoLiveEvent',{loai:'tim',eventId:'ui-max',userId:'tester',ten:'Thử',soLuong:45});await browser.until("document.querySelector('#sect-level-status').textContent.includes('MAX')");assert.equal(app.engine.getPlayer('demo-1').inventory.tea,4);
  checks.push('Actual demo buttons advance six levels, exact per-member items stay pending paused; one Ban Phuc x2; final row rewards once at MAX');
  await browser.click('#add-sect-level');await browser.fill(row(7)+'[data-level-key=likes]','5');await browser.fill(row(7)+'[data-level-key=item]','pill','change');await browser.click('#save-sect-levels');await wait(()=>app.engine.config.sectLevels.length===7);assert.equal(app.engine.liveEvents.sectEnergy.level,7);assert.equal(app.engine.getPlayer('demo-1').inventory.pill,2);
  await go('demo');for(let n=0;n<5;n++)await browser.click('[data-like="1"]');await wait(()=>app.engine.getPlayer('demo-1').inventory.pill===3);await go('settings');await browser.click('#remove-sect-level');await browser.click('#save-sect-levels');await wait(()=>app.engine.config.sectLevels.length===6);assert.equal(app.engine.liveEvents.sectEnergy.totalLikes,215);assert.equal(app.engine.getPlayer('demo-1').inventory.pill,3);
  checks.push('Append after MAX resumes at next level; saving does not grant free gifts; removing final level retains accepted total and inventory');
  await browser.click('#theme-toggle');await browser.screenshot(path.join(output,'levels-settings-light.png'));await browser.click('#theme-toggle');
  for(const [w,h]of [[1366,768],[390,844]]){await browser.viewport(w,h);await browser.until('document.documentElement.scrollWidth<=innerWidth+1');await browser.screenshot(path.join(output,`levels-settings-${w}.png`));}
  await go('home');await browser.click('.connection-details summary');await browser.fill('#reconnect-seconds','7');await browser.click('#save-live-settings');await wait(()=>app.engine.config.live.reconnectSeconds===7);assert.equal(app.engine.config.sectLevels.length,6);assert.deepEqual(errors,[]);
  checks.push('Desktop/mobile and both themes fit page; reconnect controls remain under Home connection details; no runtime exceptions');
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'PASS',browser:(await browser.send('Browser.getVersion')).product,checks,errors,realLive:'CHƯA KIỂM CHỨNG; test uses demo events only'},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch(error){await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'FAIL',error:error.message,checks,errors},null,2));await browser?.screenshot(path.join(output,'browser-failure.png')).catch(()=>{});throw error;}finally{await browser?.close();await app.close();}
