// Use the real admin controls and server with disposable game data/browser profile.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';
const output=path.resolve('docs/Tailieu_output/tu-vi-phan1'),dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-cultivation-ui-'));
await mkdir(path.join(dataRoot,'data/demo'),{recursive:true});await mkdir(output,{recursive:true});
const p=createPlayer('demo-1','Thanh Vân');p.realmIndex=3;
await writeFile(path.join(dataRoot,'data/demo/players.json'),JSON.stringify(new GameEngine([p]).exportState()));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});let browser;const checks=[],errors=[];
try{
  const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base+'/#/demo');
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  await browser.until("document.body.dataset.ready==='true'&&!document.querySelector('#page-demo').hidden");
  const wait=async fn=>{const end=Date.now()+6000;while(!fn()){assert.ok(Date.now()<end,'Engine timeout');await new Promise(r=>setTimeout(r,25));}};
  await browser.fill('#count','10','change');await browser.click('#demo');await wait(()=>app.engine.players.size===10);
  await browser.click('[data-phase="paused"]');await wait(()=>app.engine.phase==='paused');await browser.fill('#player','demo-1','change');
  const first=app.engine.getPlayer('demo-1'),exp=first.cultivation;
  await browser.until("document.querySelector('#cultivation-detail').textContent.includes('2.0/giây')");
  await browser.click('[data-like="10"]');await wait(()=>app.engine.liveEvents.sectEnergy.power===10);
  assert.equal(first.cultivation,exp);assert.equal(first.pendingExp,0);await wait(()=>first.pendingExp===20);
  checks.push('Existing Demo buttons: 10 hearts increase energy immediately; only selected character receives 20 pending EXP after idle');
  await browser.click('[data-phase="resume"]');await wait(()=>app.engine.phase==='cultivation');assert.equal(first.pendingExp,0);assert.ok(first.cultivation>=exp+20);
  await browser.fill('#item-choice','tea','change');await browser.click('#grant-item');await wait(()=>first.inventory.tea===1);await browser.click('#use-item');
  await browser.until("document.querySelector('#cultivation-detail').textContent.includes('4.0/giây')");
  await browser.click('[data-phase="paused"]');await wait(()=>app.engine.phase==='paused');await browser.click('[data-like="100"]');await wait(()=>first.pendingExp===400);
  const second=app.engine.getPlayer('demo-2');await browser.fill('#player','demo-2','change');await browser.click('[data-like="10"]');await wait(()=>second.pendingExp===20);
  assert.equal(first.pendingExp,400);assert.equal(app.engine.liveEvents.sectEnergy.power,120);
  checks.push('Resume applies pending EXP once; Tea shows 4/s; 100 hearts settle 400 EXP immediately; switching selection routes hearts to the second character');
  assert.deepEqual(errors,[]);await browser.screenshot(path.join(output,'demo-hearts.png'));
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'PASS',browser:(await browser.send('Browser.getVersion')).product,checks,errors,realLive:'CHƯA KIỂM CHỨNG'},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch(error){await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'FAIL',error:error.message,checks,errors},null,2));await browser?.screenshot(path.join(output,'browser-failure.png')).catch(()=>{});throw error;}
finally{await browser?.close();await app.close();}
