import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';import {createPlayer} from '../playerStore.js';import {BOSS_DEFAULTS} from '../bossConfig.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-shared-boss-play-'));
await writeFile(path.join(dataRoot,'caidat.json'),JSON.stringify({schemaVersion:1,host:'127.0.0.1',port:3000,graphics:'high',camera:'auto',combat:{attackIntervalMs:5000},boss:{encounters:BOSS_DEFAULTS.map(b=>({...b,hp:1000000}))}}));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('No real LIVE');}});
for(let i=0;i<30;i++)app.engine.join(createPlayer('boss:'+i,'Đạo hữu '+i,i));app.engine.setPhase('cultivation');app.engine.setPhase('paused');
const base=`http://127.0.0.1:${await app.listen()}`;await mkdir('test-results/shared-boss',{recursive:true});await writeFile('test-results/shared-boss/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));console.log('Disposable shared boss server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}process.on('SIGINT',close);process.on('SIGTERM',close);setTimeout(close,30*60*1000).unref();
