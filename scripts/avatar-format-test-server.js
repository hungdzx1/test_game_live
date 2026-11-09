import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import sharp from 'sharp';import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-avatar-format-unity-'));
const raw=()=>sharp({create:{width:1200,height:600,channels:4,background:{r:25,g:130,b:240,alpha:1}}});const webp=await raw().webp().toBuffer(),avif=await raw().avif().toBuffer();
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE');},avatarFetch:async url=>new Response(url.endsWith('.avif')?avif:webp)});
for(let i=0;i<30;i++){const p=createPlayer('receipt:'+i,'Đạo hữu '+i);p.realmIndex=10;app.engine.join(p);}app.engine.setPhase('cultivation');
const base='http://127.0.0.1:'+await app.listen();await mkdir('test-results/avatar-format-fix',{recursive:true});await writeFile('test-results/avatar-format-fix/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));console.log('Disposable avatar format server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')close();});process.stdin.resume();process.on('SIGINT',close);process.on('SIGTERM',close);setTimeout(close,20*60*1000).unref();
