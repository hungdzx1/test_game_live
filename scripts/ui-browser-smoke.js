// UI end-to-end verification against the real server with disposable game data.
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-dashboard-')),output=path.resolve('test-results/ui');await mkdir(output,{recursive:true});
class Connector extends EventEmitter{async connect(){return {isConnected:true,roomId:'999'};}async disconnect(){}}
let connections=0,connector;const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{connections++;return connector=new Connector();}});
let browser;const errors=[],checks=[],shots=[];
try{
  const port=await app.listen(),base=`http://127.0.0.1:${port}`;browser=await openTestBrowser(base);browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  await browser.until("document.body.dataset.ready==='true'");
  assert.deepEqual(errors,[]);assert.equal(await browser.evaluate('document.querySelectorAll("[data-page]").length'),5);
  const duplicates=await browser.evaluate('(()=>{const ids=[...document.querySelectorAll("[id]")].map(e=>e.id);return ids.filter((id,i)=>ids.indexOf(id)!==i);})()');assert.deepEqual(duplicates,[]);
  const approve=async(value)=>{await browser.until(`document.querySelector('#dialog-confirm')?.closest('dialog')?.open&&document.querySelector('#dialog-input-label').hidden===${value===undefined?'true':'false'}`);if(value!==undefined)await browser.fill('#dialog-input',value);await browser.click('#dialog-confirm');};
  const go=async(page,tab)=>{await browser.evaluate(`location.hash=${JSON.stringify('#/'+page+(tab?'/'+tab:''))}`);await browser.until(`document.querySelector('#page-${page}').hidden===false`);};
  const shot=async name=>{await browser.until("document.querySelector('#toast').hidden",6000);await browser.screenshot(path.join(output,name));shots.push(name);};
  const waitEngine=async fn=>{const end=Date.now()+10000;while(!fn()){assert.ok(Date.now()<end,'Engine timeout');await new Promise(r=>setTimeout(r,40));}};
  checks.push('Initial dashboard renders, five pages, no duplicate IDs/runtime exceptions');
  await go('demo');await browser.fill('#count','30','change');await browser.click('#demo');await waitEngine(()=>app.engine.players.size===30);await browser.until("document.querySelector('#player').options.length===30");
  const elapsed=app.engine.elapsedMs,session=app.engine.sessionId;
  for(const page of ['settings','demo','logs','backup','home'])await go(page);
  assert.equal(app.engine.sessionId,session);assert.ok(app.engine.elapsedMs>=elapsed);assert.equal(connections,0);assert.equal((await (await fetch(base+'/api/dashboard')).json()).load.webSockets,1);
  assert.equal(await browser.evaluate("document.querySelector('#stat-population').textContent"),'30');assert.equal(await browser.evaluate("document.querySelector('#stat-fps').textContent"),'—');
  await shot('home-dark.png');await browser.click('#theme-toggle');await browser.until("document.body.dataset.theme==='light'");await shot('home-light.png');
  await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");assert.equal(await browser.evaluate('document.body.dataset.theme'),'light');
  await browser.click('#theme-toggle');await browser.until("document.body.dataset.theme==='dark'");
  await browser.click('#collapse-sidebar');assert.equal(await browser.evaluate("document.body.classList.contains('sidebar-collapsed')"),true);await browser.click('#collapse-sidebar');
  checks.push('Five routes preserve running engine, one WS, no TikTok reconnect; dark/light persist after reload; sidebar collapse works');
  // A draft must survive route changes and subsequent snapshots. Saving only sends its changed fields.
  await go('settings','audio');await browser.fill('#audio-masterVolume','0.73');await go('demo');await go('settings','audio');
  assert.equal(await browser.evaluate("document.querySelector('#audio-masterVolume').value"),'0.73');await browser.click('#save-audio');await waitEngine(()=>app.engine.config.audio.masterVolume===.73);assert.equal(app.engine.config.audio.musicVolume,.2);
  await browser.click('#enable-local-audio');await browser.until("document.querySelector('#audio-preview-status').textContent.includes('Đã bật')");await browser.click('#test-audio');
  await go('settings','display');await browser.fill('#camera','followBoss','change');await waitEngine(()=>app.engine.config.camera==='followBoss');await browser.fill('#display-particleScale','0.5');await browser.click('#save-display');await waitEngine(()=>app.engine.config.display.particleScale===.5);
  await browser.fill('#priority-gift','4');await browser.click('#save-director');await waitEngine(()=>app.engine.config.cameraDirector.priorities.gift===4);assert.equal(app.engine.config.cameraDirector.priorities.result,5);
  await go('settings','battle');await browser.fill('#boss-k1','0.55');await browser.click('#save-balance');await waitEngine(()=>app.engine.config.boss.difficultyK[0]===.55);assert.equal(app.engine.config.boss.difficultyK[1],.85);
  await go('settings','cultivation');await browser.fill('#max-multiplier','10');await browser.click('#save-cultivation');await waitEngine(()=>app.engine.config.cultivation.maxMultiplier===10);assert.equal(app.engine.config.cultivation.fateFailures,5);
  await go('settings','quests');await browser.fill('#quest-exp','42');await browser.click('#save-quests');await waitEngine(()=>app.engine.config.cultivation.quests.cultivateExp===42);assert.equal(app.engine.config.cultivation.quests.cooldownMs,30000);
  await go('settings','gifts');await browser.fill('#gift-table tbody tr [data-key=quantity]','2');await browser.click('#save-gift-rules');await waitEngine(()=>app.engine.config.giftRules[0].quantity===2);await go('home');await browser.click('.connection-details summary');await browser.fill('#reconnect-seconds','7');await browser.click('#save-live-settings');await waitEngine(()=>app.engine.config.live.reconnectSeconds===7);assert.equal(app.engine.config.sectLevels[0].likes,1000);await go('settings','gifts');await shot('settings.png');
  await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");await go('settings','audio');assert.equal(await browser.evaluate("document.querySelector('#audio-masterVolume').value"),'0.73');
  const cfg=JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8'));assert.equal(cfg.audio.masterVolume,.73);assert.equal(cfg.boss.difficultyK[0],.55);
  checks.push('All settings groups save through original APIs; draft survives navigation; untouched values remain; disk/reload retain saved values');
  await go('demo');for(const event of ['focus','attack','celebrate','teleport','run','fly','bow']){await browser.click(`[data-event=${event}]`);await waitEngine(()=>app.engine.events.some(e=>e.kind===event&&e.userId==='demo-1'));}
  await browser.click('#grant-item');await waitEngine(()=>app.engine.getPlayer('demo-1').inventory.tea===1);await browser.click('#use-item');await waitEngine(()=>app.engine.getPlayer('demo-1').buffs.length===1);
  await browser.click('#send-command');await waitEngine(()=>app.engine.players.has('demo-khach'));
  await browser.click('#demo-combo');await waitEngine(()=>app.engine.getPlayer('demo-1').buffs.length>=11);const beforeBuffs=app.engine.getPlayer('demo-1').buffs.length;await browser.click('#demo-replay');await new Promise(r=>setTimeout(r,100));assert.equal(app.engine.getPlayer('demo-1').buffs.length,beforeBuffs);
  await browser.click('#prepare-breakthrough');await waitEngine(()=>app.engine.breakthrough.active?.userId==='demo-1');await shot('demo.png');
  await browser.click('[data-phase=battle]');await approve();await waitEngine(()=>app.engine.phase==='battle');await browser.click('#skill-1');await waitEngine(()=>app.engine.battle.current.fields[0].participants['demo-1'].skillCount===1);await browser.click('#skill-2');await waitEngine(()=>app.engine.battle.current.fields[0].participants['demo-1'].skillCount===2);
  await go('home');await browser.click('#pause-game');await waitEngine(()=>app.engine.phase==='paused');
  await go('logs');await browser.fill('#log-type','battle','change');assert.ok(await browser.evaluate("document.querySelector('#logs').textContent.includes('diệt ma')"));await shot('logs.png');
  await go('backup');await browser.fill('#player-search','demo-1');await browser.click('#search-players');assert.ok(await browser.evaluate("document.querySelector('#player-results').children.length>0"));await shot('backup.png');
  const downloads=path.join(dataRoot,'downloads');await mkdir(downloads);await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await browser.click('#download-backup');let files=[];for(let i=0;i<100&&!files.some(f=>f.endsWith('.json'));i++){await new Promise(r=>setTimeout(r,30));files=await readdir(downloads);}const file=files.find(f=>f.endsWith('.json'));assert.ok(file,'Backup UI download');const bundle=JSON.parse(await readFile(path.join(downloads,file),'utf8')),count=bundle.state.players.length;
  // Seed the file picker using the browser File API; actual restore/reset handlers and dialogs run unchanged.
  await browser.evaluate(`(()=>{const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(JSON.stringify(bundle))}],'demo-backup.json',{type:'application/json'}));document.querySelector('#restore-file').files=dt.files;})()`);
  await browser.click('#restore-backup');await approve();await approve('RESTORE DEMO');await waitEngine(()=>app.engine.phase==='stopped');assert.equal(app.engine.players.size,count);
  await browser.click('#reset-data');await approve();await approve('WRONG');assert.equal(app.engine.players.size,count);
  await browser.click('#reset-data');await approve();await approve('RESET DEMO');await waitEngine(()=>app.engine.players.size===0);
  checks.push('Demo actions, item use, comments, combo/replay, skills, log filters, search and confirmed restore/reset work on temporary data');
  await go('home');await browser.fill('#game-mode','live','change');await waitEngine(()=>app.engine.mode==='live');await browser.fill('#live-username','tester');await browser.fill('#live-sign-key','TEST_ONLY_MEMORY');await browser.click('#live-connect');await waitEngine(()=>app.adapter.snapshot().state==='connected');await browser.until("document.querySelector('#live-state-box').dataset.state==='connected'");
  assert.equal(connections,1);for(const page of ['settings','demo','logs','backup','home'])await go(page);assert.equal(connections,1);assert.equal((await (await fetch(base+'/api/dashboard')).json()).load.webSockets,1);
  assert.equal(await browser.evaluate("document.querySelector('#demo').disabled"),true);assert.equal(await browser.evaluate("document.querySelector('#live-sign-key').value"),'');
  await browser.click('#live-disconnect');await waitEngine(()=>app.adapter.snapshot().state==='disconnected');await browser.fill('#game-mode','demo','change');await waitEngine(()=>app.engine.mode==='demo');
  assert.equal(await browser.evaluate("document.querySelector('#live-connect').disabled"),true);
  checks.push('Connection status is backend-driven; LIVE connector stub connects once; mode separation and demo locks persist across routes; key field clears');
  for(const [width,height]of [[1920,1080],[1366,768],[900,1024],[390,844]]){await browser.viewport(width,height);await go('home');await browser.until('document.documentElement.scrollWidth<=innerWidth+1');for(const page of ['settings','demo','logs','backup','home']){await go(page,page==='settings'?'gifts':undefined);await browser.until('document.documentElement.scrollWidth<=innerWidth+1');}if(width===390){await browser.click('#mobile-menu');assert.equal(await browser.evaluate("document.body.classList.contains('menu-open')"),true);await browser.click('[data-page-link=demo]');await browser.until("!document.body.classList.contains('menu-open')");await go('home');await shot('mobile-dark.png');await browser.click('#mobile-menu');await browser.click('#theme-toggle');await browser.evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');await browser.until("!document.body.classList.contains('menu-open')");await shot('mobile-light.png');}else if(width===1366)await shot('laptop.png');}
  checks.push('All five pages at 1920/1366/tablet/mobile have no horizontal page overflow; mobile navigation closes after selection; both themes captured');
  assert.deepEqual(errors,[]);
  const version=await browser.send('Browser.getVersion');await writeFile(path.join(output,'browser-report.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'PASS',browser:version.product,node:process.version,checks,errors,screenshots:shots,realLive:'CHƯA KIỂM CHỨNG: connector transport mô phỏng trong bộ test'},null,2));console.log(JSON.stringify({checks,errors,screenshots:shots},null,2));
}catch(error){await writeFile(path.join(output,'browser-report.json'),JSON.stringify({timestamp:new Date().toISOString(),result:'FAIL',error:error.message,checks,errors,screenshots:shots},null,2));if(browser){console.error('Browser errors:',errors);console.error('Layout:',await browser.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).slice(0,12).map(e=>({tag:e.tagName,id:e.id,cls:e.className?.toString()}))})').catch(()=>null));console.error(await browser.evaluate('document.body.innerText').catch(()=>''));await browser.screenshot(path.join(output,'failure.png')).catch(()=>{});}throw error;
}finally{await browser?.close();await app.close();}
