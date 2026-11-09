import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-levelup-play-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE');}});
for(let i=0;i<30;i++)app.engine.join(createPlayer('level:'+i,'Đạo hữu '+i,i));
app.engine.breakthrough.rng=()=>0;app.engine.setPhase('cultivation');app.engine.setPhase('paused');
const base=`http://127.0.0.1:${await app.listen()}`;await mkdir('test-results/levelup',{recursive:true});await writeFile('test-results/levelup/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));console.log('Isolated level-up server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')close();});process.stdin.resume();process.on('SIGINT',close);process.on('SIGTERM',close);setTimeout(close,30*60*1000).unref();
