import assert from 'node:assert/strict';import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';import {openTestBrowser} from './browser-test-driver.js';
const output=process.env.TUTIEN_BOSS_UI_OUTPUT??'docs/Tailieu_output/shared-boss';await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-boss-ui-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});
let browser;const checks=[],errors=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
const until=async fn=>{const end=Date.now()+8000;while(!await fn()){assert.ok(Date.now()<end,'Boss UI/server timeout');await delay(25);}};
try{
 const base=`http://127.0.0.1:${await app.listen()}`;browser=await openTestBrowser(base+'/#/settings/battle');
 browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
 await browser.until("document.body.dataset.ready==='true'&&!document.querySelector('[data-settings-pane=battle]').hidden");
 assert.equal(await browser.evaluate("document.querySelectorAll('#boss-k1,#boss-solo,#battle-view').length"),0);
 assert.equal(await browser.evaluate("document.querySelector('#boss-hp-0').value"),'10000');
 for(let i=0;i<3;i++){await browser.fill('#boss-hp-'+i,String(11000+i*10000));await browser.fill('#boss-seconds-'+i,String(30+i*10));await browser.fill('#boss-blessings-'+i,String(i));await browser.fill('#boss-pills-'+i,String(i+1));}
 await browser.click('#save-bosses');await until(()=>app.engine.config.boss.encounters[0].hp===11000);
 await browser.fill('#cultivation-seconds','60');await browser.click('#save-cycle');await until(()=>app.engine.config.cycle.cultivationSeconds===60);
 const disk=JSON.parse(await readFile(path.join(dataRoot,'caidat.json'),'utf8'));assert.deepEqual(disk.boss.encounters.map(b=>b.durationSeconds),[30,40,50]);assert.deepEqual(disk.boss.encounters.map(b=>b.reward.pills),[1,2,3]);
 await browser.send('Page.reload');await browser.until("document.body.dataset.ready==='true'");assert.equal(await browser.evaluate("document.querySelector('#boss-hp-2').value"),'31000');assert.equal(await browser.evaluate("document.querySelector('#cultivation-seconds').value"),'60');
 checks.push('All three HP/time/blessing/pill controls and cultivation duration save through the real API and survive reload; removed eleven-arena/solo-K controls');
 await browser.fill('#boss-hp-0','14000');await browser.evaluate("location.hash='#/settings/audio'");await browser.evaluate("location.hash='#/settings/battle'");assert.equal(await browser.evaluate("document.querySelector('#boss-hp-0').value"),'14000');
 await browser.fill('#boss-hp-0','0');await browser.click('#save-bosses');await delay(250);assert.equal(app.engine.config.boss.encounters[0].hp,11000);await browser.fill('#boss-hp-0','11000');
 checks.push('Draft survives navigation and invalid HP is rejected without changing saved configuration');
 await delay(4200);await browser.viewport(1366,1000);await browser.screenshot(output+'/settings-desktop.png');await browser.viewport(390,844);await browser.screenshot(output+'/settings-390.png');
 assert.equal(await browser.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),true,'Mobile horizontal overflow');
 // Exercise actual UI skills while a real shared arena is active, keeping server simulation paused only for observation.
 app.engine.join(createPlayer('ui:boss','Người thử'));app.engine.setPhase('battle');
 await until(()=>app.engine.battle.warningRemainingMs===0);
 await browser.evaluate("location.hash='#/demo'");await browser.until("document.querySelector('#player').options.length===1");
 const post=async(action,value)=>{const r=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(r.status,200,await r.text());};
 const before=app.engine.battle.current.fields[0].activeBoss.hp;await browser.click('#skill-1');await until(()=>app.engine.battle.current.fields[0].participants['ui:boss'].skillCount===1);assert.ok(app.engine.battle.current.fields[0].activeBoss.hp<=before-20);
 await post('phase','paused');const id=app.engine.battle.current.id;
 await browser.evaluate("location.hash='#/settings/battle'");await browser.until("!document.querySelector('[data-settings-pane=battle]').hidden");
 await browser.fill('#boss-hp-0','15000');await browser.click('#save-bosses');await until(()=>app.engine.config.boss.encounters[0].hp===15000);assert.equal(app.engine.battle.current.id,id);assert.equal(app.engine.battle.current.fields[0].activeBoss.maxHp,11000);
 checks.push('DEMO skill button targets the single shared boss; saving settings mid-fight preserves active HP and round identity');
 // Keep the old procedural browser renderer usable with the new one-arena contract.
 await browser.evaluate("location.href='/song'");await browser.until("document.querySelector('.battle-hud')&&!document.querySelector('.battle-hud').hidden");await browser.viewport(720,1280);await delay(750);await browser.screenshot(output+'/song-shared-boss.png');
 const gate=await browser.evaluate(`(async()=>{const {BattleScene}=await import('/js/battleScene.js');const THREE=await import('three');const view=new BattleScene(new THREE.Scene());const state=(await(await fetch('/api/state')).json()).payload;const boss=state.battle.view.activeBoss;boss.warningDurationMs=3000;boss.warningElapsedMs=0;view.sync(state);view.update(0,0,0);const hidden=!view.bosses[boss.type].root.visible;boss.warningElapsedMs=3000;view.update(0,0,0);return hidden&&view.bosses[boss.type].root.visible;})()`);assert.equal(gate,true);checks.push('Procedural browser fallback hides the boss during the authoritative warning and reveals it after the warning clock');
 assert.deepEqual(errors,[]);await writeFile(output+'/browser-report.json',JSON.stringify({result:'PASS',browser:(await browser.send('Browser.getVersion')).product,checks,errors},null,2)+'\n');console.log('PASS '+checks.length+' boss browser checks.');
}catch(error){await writeFile(output+'/browser-report.json',JSON.stringify({result:'FAIL',error:error.message,checks,errors},null,2)+'\n');await browser?.screenshot(output+'/browser-failure.png').catch(()=>{});throw error;}
finally{await browser?.close();await app.close();}
