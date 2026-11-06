// Independent preview QA. Uses temporary game data and a fresh headless Chrome profile.
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {openTestBrowser} from './browser-test-driver.js';

const output=path.resolve('test-results/phase07-0');
await mkdir(output,{recursive:true});
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-07-preview-'));
const app=await createApplication({dataRoot,port:0}),checks=[],errors=[],requests=[],samples=[];
let browser,watchPreview=true;
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
try{
  const base=`http://127.0.0.1:${await app.listen()}`;
  browser=await openTestBrowser('about:blank');
  browser.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description??e.exceptionDetails.text));
  browser.on('Network.requestWillBeSent',e=>requests.push({url:e.request.url,method:e.request.method}));
  browser.on('Network.webSocketCreated',e=>{if(watchPreview)errors.push('Unexpected preview WebSocket '+e.url);});
  const navigate=async suffix=>{await browser.send('Page.navigate',{url:base+'/asset-preview.html'+suffix});await browser.until("document.body.dataset.ready==='true'",30000);await browser.until('globalThis.previewTelemetry?.drawCalls>0');};
  const file=async(selector,filePath)=>{const {root}=await browser.send('DOM.getDocument');const {nodeId}=await browser.send('DOM.querySelector',{nodeId:root.nodeId,selector});await browser.send('DOM.setFileInputFiles',{nodeId,files:[filePath]});};
  await navigate('');
  check('33 configurable layers, concept 941x1672 loaded',await browser.evaluate("document.querySelectorAll('#layers li').length===33&&document.querySelector('#concept').naturalWidth===941&&document.querySelector('#concept').naturalHeight===1672"));
  const initial=await browser.evaluate('previewTelemetry');
  await browser.fill('#layer-x',570,'change');
  await browser.fill('#layer-anchorX',.3,'change');
  await browser.fill('#layer-opacity',.8,'change');
  await browser.fill('#layer-scale',.9,'change');
  await browser.fill('#layer-z',22,'change');
  check('Position, scale, opacity, Z and anchor editable',await browser.evaluate("document.querySelector('#layer-x').value==='570'&&document.querySelector('#layer-anchorX').value==='0.3'&&document.querySelector('#layer-opacity').value==='0.8'&&document.querySelector('#layer-z').value==='22'"));
  await browser.fill('#layer-scale',-1,'change');
  check('Invalid scale rejected',await browser.evaluate("document.querySelector('#layer-scale').value==='0.9'"));
  await browser.click('#full-crop');
  check('Full canvas crop',await browser.evaluate("document.querySelector('#layer-cropH').value==='1370'"));
  await browser.click('#alpha-crop');
  check('Alpha crop restored',await browser.evaluate("document.querySelector('#layer-cropH').value==='940'"));
  const box=await browser.evaluate("(()=>{document.querySelector('#stage').scrollIntoView({block:'center'});const r=document.querySelector('#stage').getBoundingClientRect();return {x:r.x+r.width*.6,y:r.y+r.height*.6};})()");
  await browser.send('Input.dispatchMouseEvent',{type:'mousePressed',...box,button:'left',clickCount:1});
  await browser.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:box.x+12,y:box.y+10,button:'left',buttons:1});
  await browser.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x+12,y:box.y+10,button:'left',clickCount:1});
  check('Pointer drag changes selected layer coordinates',await browser.evaluate("Number(document.querySelector('#layer-x').value)>570"));
  await browser.evaluate("(()=>{const a=document.querySelector('[data-id=courtyard]'),b=document.querySelector('[data-id=gate]'),d=new DataTransfer();a.dispatchEvent(new DragEvent('dragstart',{dataTransfer:d}));b.dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true,cancelable:true}));})()");
  check('Drag reorder moves layer after target',await browser.evaluate("(()=>{const ids=[...document.querySelectorAll('#layers li')].map(e=>e.dataset.id);return ids.indexOf('courtyard')===ids.indexOf('gate')+1;})()"));
  const beforeHide=await browser.evaluate('previewTelemetry.drawCalls');
  await browser.click('[data-id=courtyard] input');
  await browser.until(`previewTelemetry.drawCalls===${beforeHide-1}`);
  await browser.click('[data-id=courtyard] input');
  await browser.until(`previewTelemetry.drawCalls===${beforeHide}`);
  checks.push('Hide/show removes/restores one draw call');
  for(let i=0;i<12;i++)await browser.fill('#layer-x',600+i,'change');
  check('Repeated edits reuse textures and geometries',await browser.evaluate(`previewTelemetry.textures===${initial.textures}&&previewTelemetry.geometries===${initial.geometries}`));
  await browser.fill('#zoom',1.3,'change');await browser.fill('#panX',30,'change');await browser.click('#reset-view');
  check('Zoom/pan/reset',await browser.evaluate("document.querySelector('#zoom').value==='1'&&document.querySelector('#panX').value==='0'"));
  const downloadPath=await mkdtemp(path.join(output,'download-'));
  await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath});
  await browser.click('#export');
  let exported;
  for(let i=0;i<50;i++){try{exported=JSON.parse(await readFile(path.join(downloadPath,'layout-preview-07-0.json'),'utf8'));break;}catch{await new Promise(r=>setTimeout(r,100));}}
  await browser.send('Browser.setDownloadBehavior',{behavior:'deny'});
  check('JSON downloads into separate file',exported?.layers.find(l=>l.id==='courtyard').x===611);
  await writeFile(path.join(output,'layout-preview-07-0.json'),JSON.stringify(exported,null,2)+'\n');
  const invalid=path.join(output,'invalid-layout.json');
  await writeFile(invalid,JSON.stringify({...exported,concept:'https://example.com/image.png'}));
  await file('#import',invalid);await browser.until("document.querySelector('#status').textContent.startsWith('Không nhập:')");
  check('Invalid JSON leaves existing layout intact',await browser.evaluate("document.querySelectorAll('#layers li').length===33&&document.querySelector('#layer-x').value==='611'"));
  await writeFile(invalid,JSON.stringify({...exported,concept:'/assets/concept/missing-qa.jpg'}));
  await file('#import',invalid);await browser.until("document.querySelector('#status').textContent.includes('Không tải được concept')");
  check('Missing concept preserves previous image and coordinates',await browser.evaluate("document.querySelector('#concept').src.endsWith('/assets/concept/main.jpg')&&document.querySelector('#concept').naturalWidth===941&&document.querySelector('#layer-x').value==='611'"));
  await file('#import',path.resolve('public/preview-2_5d/layout.json'));
  await browser.until("document.querySelector('#status').textContent.startsWith('Đã đổi preview')");
  await file('#concept-file',path.resolve('public/assets/concept/main.jpg'));
  await browser.until("document.querySelector('#status').textContent.startsWith('Concept nhập cục bộ')");
  check('Local concept file imports as data URL overlay',await browser.evaluate("document.querySelector('#concept').src.startsWith('data:image/jpeg;base64,')&&document.querySelector('#mode').value==='overlay'"));
  await browser.fill('#concept-opacity',.35);
  check('Concept overlay opacity adjustable',await browser.evaluate("document.querySelector('#concept').style.opacity==='0.35'"));
  for(const [width,height]of [[720,1280],[1080,1920]]){
    await browser.viewport(width,height);await navigate('?capture=1');
    await browser.evaluate("document.querySelector('#benchmark').click()");
    await browser.until("document.body.dataset.benchmark==='done'",15000);
    samples.push({width,height,...await browser.evaluate('previewTelemetry')});
    await browser.screenshot(path.join(output,`preview-${width}x${height}.png`));
    check(`Exact ${width}x${height} 9:16 canvas`,await browser.evaluate(`document.querySelector('canvas').width===${width}&&document.querySelector('canvas').height===${height}`));
  }
  await navigate('?capture=1&mode=compare');
  await browser.screenshot(path.join(output,'comparison-1080x1920.png'));
  check('Comparison uses actual imported concept',await browser.evaluate("document.querySelector('#stage').dataset.mode==='compare'&&document.querySelector('#concept').style.clipPath==='inset(0px 50% 0px 0px)'"));
  await browser.viewport(1600,2000);await navigate('?capture=1&gallery=1');
  await browser.until("[...document.querySelectorAll('.asset-card img')].length===26&&[...document.querySelectorAll('.asset-card img')].every(i=>i.complete&&i.naturalWidth>0)");
  await browser.screenshot(path.join(output,'asset-contact-sheet.png'));
  for(const backdrop of ['black','white']){await browser.fill('#backdrop',backdrop,'change');await browser.screenshot(path.join(output,`asset-contact-sheet-${backdrop}.png`));}
  checks.push('All 26 original PNG load in checkerboard gallery');
  check('Preview sends no API, WebSocket or state-writing requests',requests.every(r=>r.method==='GET'&&!/\/api(?:\/|\?|$)|^wss?:/.test(r.url)));
  check('No JavaScript exceptions',errors.length===0);
  // Verify the existing live route still serves its original document; no game controls invoked.
  const song=await fetch(base+'/song');check('Existing /song route still serves original HTML',song.ok&&(await song.text()).includes('/js/main.js'));
  const gpu=await browser.evaluate("(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);})()");
  // Only after the preview isolation assertion, open the existing /song read-only.
  watchPreview=false;
  for(const [width,height]of [[720,1280],[1080,1920]]){
    await browser.viewport(width,height);await browser.send('Page.navigate',{url:base+'/song'});
    await browser.until("!!document.querySelector('#world canvas')&&document.querySelector('#connection').textContent.includes('nối máy chủ')",30000);
    check(`Unmodified /song renders at ${width}x${height}`,await browser.evaluate("document.querySelector('#fallback').hidden"));
    await browser.screenshot(path.join(output,`song-unchanged-${width}x${height}.png`));
  }
  check('No JavaScript exceptions after existing /song smoke',errors.length===0);
  const report={at:new Date().toISOString(),browser:await browser.send('Browser.getVersion'),gpu,checks,samples,errors,requestCount:requests.length,dataRoot,files:(await readdir(output)).filter(n=>/\.png$|^layout-preview|^npm-test/.test(n))};
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();await app.close();}
