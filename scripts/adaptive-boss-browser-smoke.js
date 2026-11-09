import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';import {openTestBrowser} from './browser-test-driver.js';
const output='docs/Tailieu_output/adaptive-boss';await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-adaptive-boss-ui-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});
let browser;const checks=[],errors=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
const until=async fn=>{const end=Date.now()+8000;while(!await fn()){assert.ok(Date.now()<end,'Boss UI/server timeout');await delay(25);}};
try{
 const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base+'/#/settings/battle');
 browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
 await browser.until("document.body.dataset.ready==='true'&&!document.querySelector('[data-settings-pane=battle]').hidden");
 assert.equal(await browser.evaluate("document.querySelectorAll('#boss-hp-0,#boss-seconds-0,#boss-blessings-0,#boss-pills-0').length"),0);
 assert.equal(await browser.evaluate("document.querySelector('#boss-target-seconds').value"),'240');
 await browser.fill('#boss-target-seconds','300');await browser.click('#save-bosses');await until(()=>app.engine.config.boss.targetSeconds===300);
 await browser.fill('#cultivation-seconds','60');await browser.click('#save-cycle');await until(()=>app.engine.config.cycle.cultivationSeconds===60);
 const disk=JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8'));assert.equal(disk.boss.targetSeconds,300);
 await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");assert.equal(await browser.evaluate("document.querySelector('#boss-target-seconds').value"),'300');
 checks.push('Adaptive target and cultivation duration persist through real API and reload; obsolete HP/deadline/reward controls removed');
 await browser.fill('#boss-target-seconds','320');await browser.evaluate("location.hash='#/settings/audio'");await browser.evaluate("location.hash='#/settings/battle'");assert.equal(await browser.evaluate("document.querySelector('#boss-target-seconds').value"),'320');
 await browser.fill('#boss-target-seconds','180');await browser.click('#save-bosses');await delay(250);assert.equal(app.engine.config.boss.targetSeconds,300);await browser.fill('#boss-target-seconds','300');
 checks.push('Draft survives navigation; invalid target below181 seconds cannot change saved settings');
 await browser.viewport(1366,1000);await browser.screenshot(output+'/settings-desktop.png');await browser.viewport(390,844);await browser.screenshot(output+'/settings-390.png');
 assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),true,'Mobile horizontal overflow');
 app.engine.join(createPlayer('ui:boss','Người thử'));app.engine.setPhase('battle');await until(()=>app.engine.battle.warningRemainingMs===0);
 await browser.evaluate("location.hash='#/demo'");await browser.until("document.querySelector('#player').options.length===1");
 const before=app.engine.battle.current.fields[0].activeBoss.hp;await browser.click('#skill-1');await until(()=>app.engine.battle.current.fields[0].participants['ui:boss'].skillCount===1);assert.ok(app.engine.battle.current.fields[0].activeBoss.hp<=before-20);
 app.engine.setPhase('paused');const id=app.engine.battle.current.id,max=app.engine.battle.current.fields[0].activeBoss.maxHp;
 await browser.evaluate("location.hash='#/settings/battle'");await browser.until("!document.querySelector('[data-settings-pane=battle]').hidden");
 await browser.fill('#boss-target-seconds','360');await browser.click('#save-bosses');await until(()=>app.engine.config.boss.targetSeconds===360);assert.equal(app.engine.battle.current.id,id);assert.equal(app.engine.battle.current.fields[0].activeBoss.maxHp,max);
 checks.push('DEMO skill targets the single shared boss; saving a new target preserves active HP and round identity');
 await browser.evaluate("location.href='/song'");await browser.until("document.querySelector('.battle-hud')&&!document.querySelector('.battle-hud').hidden");await browser.viewport(720,1280);await delay(750);await browser.screenshot(output+'/song-adaptive-boss.png');
 const gate=await browser.evaluate(`(async()=>{const {BattleScene}=await import('/js/battleScene.js');const THREE=await import('three');const view=new BattleScene(new THREE.Scene());const state=(await(await fetch('/api/state')).json()).payload;const boss=state.battle.view.activeBoss;boss.warningDurationMs=3000;boss.warningElapsedMs=0;view.sync(state);view.update(0,0,0);const hidden=!view.bosses[boss.type].root.visible;boss.warningElapsedMs=3000;view.update(0,0,0);return hidden&&view.bosses[boss.type].root.visible;})()`);assert.equal(gate,true);
 checks.push('Existing procedural browser renderer displays a random boss after the authoritative warning');
 assert.deepEqual(errors,[]);await writeFile(output+'/browser-report.json',JSON.stringify({result:'PASS',browser:(await browser.send('Browser.getVersion')).product,checks,errors},null,2)+'\n');console.log('PASS '+checks.length+' adaptive boss browser checks.');
}catch(error){await writeFile(output+'/browser-report.json',JSON.stringify({result:'FAIL',error:error.message,checks,errors},null,2)+'\n');await browser?.screenshot(output+'/browser-failure.png').catch(()=>{});throw error;}
finally{await browser?.close();await app.close();}
