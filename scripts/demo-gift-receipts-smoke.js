// Real DEMO UI -> normalized gift -> authoritative item receipt, disposable data only.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';import {WebSocket} from 'ws';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';
import {GIFT_PRESETS} from '../public/js/ui/giftPresets.js';
const output='docs/Tailieu_output/demo-gift-receipts';await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-demo-receipts-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE');}});
let browser,ws;const errors=[],receipts=[],checks=[];
const until=async fn=>{const deadline=Date.now()+6000;while(!fn()){assert.ok(Date.now()<deadline,'Receipt timeout');await new Promise(r=>setTimeout(r,25));}};
try{
 const base=`http://127.0.0.1:${await app.listen()}`;
 const post=async(action,value)=>{const response=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value})});assert.equal(response.status,200,await response.text());};
 const rules=GIFT_PRESETS.map((gift,i)=>({id:'demo-preset-'+i,giftId:gift.id,giftName:gift.name,minDiamonds:gift.diamonds,maxDiamonds:gift.diamonds,item:['tea','pill','root'][i],quantity:1,effect:'item',enabled:true}));
 await post('giftRules',rules);
 ws=new WebSocket(base.replace('http:','ws:')+'/ws');ws.on('message',raw=>{const message=JSON.parse(raw);if(message.type==='game:event'&&message.payload.kind==='item:received')receipts.push(message.payload);});
 await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 browser=await openTestBrowser(base);browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
 await browser.until("document.body.dataset.ready==='true'");await browser.evaluate("location.hash='#/demo'");
 await browser.until("!document.querySelector('#page-demo').hidden");await browser.fill('#count','10','change');await browser.click('#demo');
 await until(()=>app.engine.players.size===10);await browser.until("document.querySelector('#player').options.length===10");
 await post('phase','cultivation');
 for(const [i,gift]of GIFT_PRESETS.entries()){
  await browser.fill('#demo-diamonds',String(gift.diamonds),'change');
  assert.equal(await browser.evaluate("document.querySelector('#demo-gift-id').value"),gift.id);
  assert.equal(await browser.evaluate("document.querySelector('#demo-gift-name').value"),gift.name);
  await browser.click('#demo-gift');await until(()=>receipts.length===i+1);
  assert.equal(receipts[i].item,rules[i].item);assert.equal(receipts[i].count,1);assert.equal(receipts[i].source,'viewer_gift');
  checks.push(`${gift.diamonds} xu -> ${gift.id}/${gift.name} -> ${rules[i].item} x1 -> item:received over WebSocket`);
 }
 const before=receipts.length;await browser.click('#demo-replay');await new Promise(r=>setTimeout(r,350));assert.equal(receipts.length,before);
 await browser.fill('#demo-diamonds','10','change');await browser.click('#demo-combo');await until(()=>receipts.length===before+1);
 assert.equal(receipts.at(-1).item,'pill');assert.equal(receipts.at(-1).count,5);
 await browser.click('#demo-replay');await new Promise(r=>setTimeout(r,350));assert.equal(receipts.length,before+1);
 checks.push('10 xu combo grants five pills once; replay does not repeat receipt/award');
 await browser.fill('#demo-gift-id','990001');await browser.fill('#demo-gift-name','Custom gift');await browser.fill('#demo-diamonds','100','change');
 assert.equal(await browser.evaluate("document.querySelector('#demo-gift-id').value"),'990001');
 assert.equal(await browser.evaluate("document.querySelector('#demo-gift-name').value"),'Custom gift');
 checks.push('100 xu manual mode preserves custom ID/name; saved reward rules unchanged');assert.deepEqual(app.engine.config.giftRules,rules);assert.deepEqual(errors,[]);
 await browser.fill('#demo-diamonds','20','change');await browser.screenshot(path.join(output,'demo-20-xu.png'));
 await writeFile(path.join(output,'report.json'),JSON.stringify({result:'PASS',checks,receipts,errors,unity:'Uses existing item:received presenter; no Unity changes',dataRoot},null,2)+'\n');
 console.log(JSON.stringify({result:'PASS',checks,receipts:receipts.map(r=>({item:r.item,count:r.count})),errors},null,2));
}finally{if(browser)await browser.close();if(ws)ws.terminate();await app.close();}
