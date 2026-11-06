// Isolated manual QA server: never uses the user's data/ directory.
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../server.js';
import {DemoEventSource} from '../demoEventSource.js';
const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-preview-'));
const app=await createApplication({dataRoot,port:3001});
const port=await app.listen();new DemoEventSource(app.engine).spawn(30);
console.log(`Preview riêng: http://localhost:${port} | dữ liệu: ${dataRoot}`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();process.exit(0);});
