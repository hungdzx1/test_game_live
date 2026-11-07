// Temporary real Node backend for the Unity HTTP/WebSocket Play Mode test.
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createApplication} from '../server.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-unity-audio-server-'));
const app=await createApplication({dataRoot,port:0,connectorFactory:()=>{throw Error('Real LIVE forbidden');}});
const base=`http://127.0.0.1:${await app.listen()}`;await mkdir('test-results/unity-audio',{recursive:true});
await writeFile('test-results/unity-audio/server.json',JSON.stringify({base,dataRoot,pid:process.pid}));console.log('Temporary audio test server: '+base);
let closing=false;async function close(){if(closing)return;closing=true;await app.close();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
// Do not leave an unattended helper running if a test tool is interrupted.
setTimeout(close,15*60*1000).unref();
