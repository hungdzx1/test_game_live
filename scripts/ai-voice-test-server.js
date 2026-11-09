// Disposable HTTP/WS helper for Unity tests; never writes to real player/config files.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createApplication} from '../server.js';
const dataRoot=path.resolve('test-results/ai-voice/data');await fs.mkdir(dataRoot,{recursive:true});
await fs.cp('tools/tts/piper/output/cache',path.join(dataRoot,'voice-cache'),{recursive:true});
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real TikTok forbidden in voice helper');}});
await app.listen();const base='http://127.0.0.1:'+app.server.address().port;
await fetch(base+'/api/voice/manifest');let manifest;
for(let i=0;i<400;i++){manifest=await(await fetch(base+'/api/voice/manifest')).json();if(manifest.prewarmed)break;await new Promise(r=>setTimeout(r,100));}
if(!manifest.prewarmed){await app.close();throw Error('Voice test helper did not warm');}
await fs.writeFile('test-results/ai-voice/server.json',JSON.stringify({base,manifest,pid:process.pid},null,2));console.log(base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,close);
process.stdin.setEncoding('utf8');process.stdin.on('data',text=>{if(text.trim()==='stop')close();});process.stdin.resume();setTimeout(close,20*60*1000).unref();
