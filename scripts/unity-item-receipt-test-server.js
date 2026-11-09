import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';
import {createPlayer} from '../playerStore.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-receipt-play-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});
for(let i=0;i<30;i++)app.engine.join(createPlayer('receipt:'+i,'Đạo hữu '+i));app.engine.setPhase('cultivation');
const base=`http://127.0.0.1:${await app.listen()}`;
await mkdir('test-results/unity-item-receipts',{recursive:true});await writeFile('test-results/unity-item-receipts/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));
console.log('Disposable receipt test server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}
process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')close();});process.stdin.resume();
process.on('SIGINT',close);process.on('SIGTERM',close);setTimeout(close,10*60*1000).unref();
