// Small local Chrome DevTools test driver. Uses a fresh temporary browser profile.
// It never attaches to an existing user browser or reads its profile.
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {WebSocket} from 'ws';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function openTestBrowser(url,{executable=process.env.CHROME_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe'}={}){
  const profile=await mkdtemp(path.join(os.tmpdir(),'tutien-ui-chrome-'));
  const child=spawn(executable,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','about:blank'],{windowsHide:true,stdio:'ignore'});
  let launchError;child.on('error',e=>launchError=e);let port;
  const end=Date.now()+15000;
  while(!port){if(launchError)throw launchError;if(Date.now()>end){child.kill();throw new Error('Chrome headless không khởi động được trong 15s.');}try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);}catch{await delay(100);}}
  const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(),target=targets.find(t=>t.type==='page');
  if(!target){child.kill();throw new Error('Chrome không cung cấp page kiểm thử.');}
  const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map(),events=new Map();let id=0;
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  ws.on('error',()=>{});ws.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}}else for(const listener of events.get(m.method)??[])listener(m.params);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const seq=++id,timer=setTimeout(()=>{pending.delete(seq);reject(new Error('CDP timeout: '+method));},15000);pending.set(seq,{resolve,reject,timer});ws.send(JSON.stringify({id:seq,method,params}));});
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;}
  const on=(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);};
  const api={send,evaluate,on,async until(expression,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await delay(50);}throw new Error('Browser timeout: '+expression);},async click(selector){await api.until(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return !!e&&!e.disabled&&e.dataset.busy!=='true'&&e.getClientRects().length>0;})()`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await delay(250);const box=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing element');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,disabled:e.disabled};})()`);if(!box.w||!box.h||box.disabled)throw new Error('Nút ẩn hoặc bị khóa: '+selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:box.x,y:box.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:box.x,y:box.y,button:'left',clickCount:1});},async fill(selector,value,event='input'){await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`);},async viewport(width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});},async screenshot(file){await evaluate('window.scrollTo({left:0,top:0,behavior:"instant"})');await delay(100);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});await writeFile(file,Buffer.from(r.data,'base64'));},async close(){try{await send('Browser.close');}catch{}ws.terminate();if(child.exitCode===null)child.kill();for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('Browser closed'));}pending.clear();}};
  try{await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await api.viewport(1448,1086);await send('Page.navigate',{url});return api;}catch(error){ws.terminate();child.kill();throw error;}
}
