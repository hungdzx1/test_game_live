import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-blessing-receipt-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});
// Highest realm keeps this fixture quiet while the full suite runs: no unrelated ritual SFX.
for(let i=0;i<30;i++){const player=createPlayer('receipt:'+i,'Đạo hữu '+i);player.realmIndex=10;app.engine.join(player);}
app.engine.setPhase('cultivation');const base=`http://127.0.0.1:${await app.listen()}`;
await mkdir('test-results/unity-blessing-receipt',{recursive:true});await writeFile('test-results/unity-blessing-receipt/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));console.log('Disposable blessing server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}
process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')close();});process.stdin.resume();
process.on('SIGINT',close);process.on('SIGTERM',close);setTimeout(close,20*60*1000).unref();
