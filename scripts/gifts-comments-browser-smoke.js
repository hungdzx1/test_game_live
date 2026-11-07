// Real admin/backend with disposable data and a fresh browser profile. No TikTok network.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';
import {GIFT_PRESETS} from '../public/js/ui/giftPresets.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-gifts-comments-ui-')),output=path.resolve('docs/Tailieu_output/qua-phan4');await mkdir(output,{recursive:true});
let liveCalls=0,browser;const errors=[],requests=[],checks=[];
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{liveCalls++;throw Error('Real LIVE forbidden');}});
try{
  const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base);
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));browser.on('Network.requestWillBeSent',e=>requests.push(e.request.url));
  await browser.until("document.body.dataset.ready==='true'");
  const go=async(page)=>{await browser.evaluate(`location.hash=${JSON.stringify(page==='settings'?'#/settings/gifts':'#/'+page)}`);await browser.until(`!document.querySelector('#page-${page}').hidden`);};
  const wait=async condition=>{const end=Date.now()+6000;while(!condition()){assert.ok(Date.now()<end,'Engine timeout');await new Promise(r=>setTimeout(r,25));}};
  const post=async(action,value,status=200)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,status,await r.text());};
  const row=n=>`#gift-table tbody tr:nth-child(${n}) `;
  await go('settings');const original=structuredClone(app.engine.config.giftRules);assert.equal(await browser.evaluate("document.querySelectorAll('#gift-table tbody tr').length"),3);
  await browser.click(row(1)+'.gift-select');await browser.until("document.querySelector('#gift-picker').open");
  await browser.until("[...document.querySelectorAll('.gift-preset img')].every(i=>i.complete&&i.naturalWidth>0)");
  assert.equal(await browser.evaluate("document.querySelectorAll('.gift-preset').length"),3);assert.equal(await browser.evaluate("document.querySelector('#gift-catalog-refresh')===null"),true);
  await browser.screenshot(path.join(output,'gift-presets-desktop.png'));await browser.click('#gift-picker-close');assert.deepEqual(app.engine.config.giftRules,original);
  for(const [i,gift]of GIFT_PRESETS.entries()){
    await browser.click(row(i+1)+'.gift-select');await browser.click(`[data-gift-id="${gift.id}"]`);await browser.until("!document.querySelector('#gift-picker').open");
    assert.equal(await browser.evaluate(`document.querySelector('${row(i+1)}[data-key=giftId]').value`),gift.id);
    assert.equal(await browser.evaluate(`document.querySelector('${row(i+1)}[data-key=minDiamonds]').disabled`),true);
    assert.equal(await browser.evaluate(`document.querySelector('${row(i+1)}[data-key=maxDiamonds]').value`),String(gift.diamonds));
    await browser.fill(row(i+1)+'[data-key=item]','pill','change');await browser.fill(row(i+1)+'[data-key=quantity]','2');
  }
  await go('demo');await go('settings');assert.equal(await browser.evaluate(`document.querySelector('${row(3)}[data-key=giftId]').value`),'1473096');
  await browser.click('#save-gift-rules');await wait(()=>app.engine.config.giftRules[2].giftId==='1473096');
  for(const [i,gift]of GIFT_PRESETS.entries()){assert.equal(app.engine.config.giftRules[i].giftId,gift.id);assert.equal(app.engine.config.giftRules[i].minDiamonds,gift.diamonds);assert.equal(app.engine.config.giftRules[i].quantity,2);}
  checks.push('Three supplied JPGs load locally; exact-ID presets lock prices, keep drafts across routes and save all three rewards');
  await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");await go('settings');
  assert.equal(await browser.evaluate(`document.querySelector('${row(3)}[data-key=minDiamonds]').disabled`),true);
  // Switching to manual reopens the existing values, without silently clearing a saved rule.
  await browser.click(row(3)+'.gift-select');await browser.click('#gift-manual');
  assert.equal(await browser.evaluate(`document.querySelector('${row(3)}[data-key=minDiamonds]').disabled`),false);
  await browser.fill(row(3)+'[data-key=giftId]','');await browser.fill(row(3)+'[data-key=giftName]','');await browser.fill(row(3)+'[data-key=minDiamonds]','20');await browser.fill(row(3)+'[data-key=maxDiamonds]','30');
  await browser.click('#save-gift-rules');await wait(()=>app.engine.config.giftRules[2].maxDiamonds===30);assert.equal(app.engine.config.giftRules[2].giftId,'');
  await browser.click(row(3)+'.gift-select');await browser.click('[data-gift-id="1473096"]');await browser.click('#save-gift-rules');await wait(()=>app.engine.config.giftRules[2].giftId==='1473096');
  await browser.click('#add-gift-rule');await browser.until("document.querySelector('#gift-picker').open");await browser.click('#gift-manual');
  await browser.fill(row(4)+'[data-key=giftId]','990001');await browser.fill(row(4)+'[data-key=giftName]','Custom');await browser.fill(row(4)+'[data-key=minDiamonds]','50');await browser.fill(row(4)+'[data-key=maxDiamonds]','50');
  await browser.click('#save-gift-rules');await wait(()=>app.engine.config.giftRules.length===4);
  await browser.click(row(4)+'td:last-child button');await browser.click('#save-gift-rules');await wait(()=>app.engine.config.giftRules.length===3);
  checks.push('Reload preserves exact ID and locked prices; switching to manual supports saved price bands; custom ID add/delete works');
  await go('demo');await browser.fill('#count','10','change');await browser.click('#demo');await wait(()=>app.engine.players.size===10);await post('phase','paused');
  for(const [i,gift]of GIFT_PRESETS.entries()){
    await browser.fill('#demo-gift-id',gift.id);await browser.fill('#demo-gift-name',gift.name);await browser.fill('#demo-diamonds',String(gift.diamonds),'change');await browser.click('#demo-gift');await wait(()=>app.engine.getPlayer('demo-1').inventory.pill===(i+1)*2);
  }
  await browser.click('#demo-replay');await post('phase','paused');assert.equal(app.engine.getPlayer('demo-1').inventory.pill,6);
  for(const price of [1,10,20])await post('demoLiveEvent',{eventId:crypto.randomUUID(),loai:'qua',userId:'demo-1',ten:'Wrong gift',giftId:'999999',qua:'Other gift',soKimCuong:price,soLuong:1,rawMeta:{giftType:0}},400);
  assert.equal(app.engine.getPlayer('demo-1').inventory.pill,6);
  await browser.click('#demo-combo');await wait(()=>app.engine.getPlayer('demo-1').inventory.pill===16);await browser.click('#demo-replay');await post('phase','paused');assert.equal(app.engine.getPlayer('demo-1').inventory.pill,16);
  await post('demoLiveEvent',{eventId:crypto.randomUUID(),loai:'binhluan',userId:'demo-new',ten:'New Viewer',noiDung:'nhập môn'});await wait(()=>app.engine.players.has('demo-new'));
  await browser.click('#demo-follow');await go('home');
  await browser.until("document.querySelector('#live-event-log').textContent.includes('[Follow]')&&document.querySelector('#live-event-log').textContent.includes('nhap mon')");
  await browser.evaluate("document.querySelector('#live-event-log').closest('details').open=true");await browser.screenshot(path.join(output,'comments-follow-log.png'));
  checks.push('All three demo gifts grant exact counts; different IDs at the same price are rejected; replay and combo do not double award; comment creates player and follow is visible');
  await go('settings');await browser.screenshot(path.join(output,'gift-settings.png'));
  for(const [width,height]of [[390,844],[1366,900]]){
    await browser.viewport(width,height);await browser.click(row(1)+'.gift-select');await browser.until("document.querySelector('#gift-picker').open");
    await browser.until("document.querySelector('#gift-picker').scrollWidth<=document.querySelector('#gift-picker').clientWidth+1");
    await browser.screenshot(path.join(output,`gift-picker-${width}.png`));await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await browser.until("!document.querySelector('#gift-picker').open");
  }
  await browser.click('#theme-toggle');await browser.click(row(1)+'.gift-select');await browser.screenshot(path.join(output,'gift-picker-light.png'));await browser.click('#gift-picker-close');
  assert.equal((await fetch(base+'/api/tiktok/gifts?refresh=1&username=fixture')).status,404);assert.equal(liveCalls,0);assert.deepEqual(errors,[]);
  assert.equal(requests.some(url=>url.includes('/api/tiktok/gifts')),false);assert.equal(requests.filter(url=>/^https?:/.test(url)&&!url.startsWith(base+'/')).length,0);
  const saved=JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8'));assert.equal(saved.giftRules[2].giftId,'1473096');checks.push('Desktop/mobile and light/dark work; no catalog API calls or external HTTP/artwork requests; old catalog endpoint returns 404; zero LIVE connections/runtime errors');
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'PASS',checks,errors,liveCalls,browser:(await browser.send('Browser.getVersion')).product,realTikTok:'CHƯA KIỂM CHỨNG LIVE THẬT'},null,2));console.log(JSON.stringify({result:'PASS',checks},null,2));
}catch(error){await writeFile(path.join(output,'browser-report.json'),JSON.stringify({result:'FAIL',error:error.message,errors,checks},null,2));await browser?.screenshot(path.join(output,'failure.png')).catch(()=>{});throw error;}finally{await browser?.close();await app.close();}
