import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';

const root=fileURLToPath(new URL('./tools/tts/piper/',import.meta.url));
export const voiceName=value=>[...String(value??'').normalize('NFC').replace(/<[^>]*>/g,'').replace(/[^\p{L}\p{M}\p{N}\s'-]/gu,' ').replace(/\s+/g,' ').trim()].slice(0,40).join('');
export function wavInfo(bytes){
  if(!Buffer.isBuffer(bytes)||bytes.length<44||bytes.length>2*1024*1024||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw Error('Invalid WAV');
  let rate=0,channels=0,data=0;
  for(let i=12;i+8<=bytes.length;){const size=bytes.readUInt32LE(i+4),end=i+8+size;if(end>bytes.length)throw Error('Truncated WAV');const tag=bytes.toString('ascii',i,i+4);if(tag==='fmt '){if(size<16||bytes.readUInt16LE(i+8)!==1||bytes.readUInt16LE(i+22)!==16)throw Error('PCM16 required');channels=bytes.readUInt16LE(i+10);rate=bytes.readUInt32LE(i+12);}if(tag==='data')data=size;i=end+(size%2);}
  if(channels!==1||rate!==22050||!data||data%2)throw Error('Voice format');return {seconds:data/(rate*channels*2)};
}

export class PiperWorker{
  constructor({directory=root,voice='male'}={}){this.directory=directory;this.voice=voice;this.jobs=new Map();this.serial=0;this.closed=false;}
  start(){
    if(this.started)return this.started;
    this.started=new Promise((resolve,reject)=>{
      const child=this.child=spawn(path.join(this.directory,'runtime/python.exe'),['-I','-X','utf8','-u',path.join(this.directory,'worker.py'),'--voice',this.voice],{cwd:this.directory,windowsHide:true,stdio:['pipe','pipe','pipe']});
      const timer=setTimeout(()=>{reject(Error('Piper startup timeout'));child.kill();},30000);timer.unref();
      const fail=error=>{clearTimeout(timer);reject(error);for(const job of this.jobs.values())job.reject(error);this.jobs.clear();this.error=error.message;};
      child.on('error',fail);child.on('exit',()=>fail(Error('Piper stopped')));child.stdin.on('error',()=>{});
      child.stderr.on('data',()=>{}); // Do not log player names or model internals.
      createInterface({input:child.stdout}).on('line',line=>{
        try{const value=JSON.parse(line);if(value.ready){clearTimeout(timer);resolve();return;}const job=this.jobs.get(value.id);if(!job)return;this.jobs.delete(value.id);value.error?job.reject(Error(value.error)):job.resolve(Buffer.from(value.wav,'base64'));}catch{fail(Error('Piper protocol error'));child.kill();}
      });
    });return this.started;
  }
  async synthesize(text){await this.start();if(this.closed||this.error)throw Error('Piper unavailable');return new Promise((resolve,reject)=>{const id=++this.serial;this.jobs.set(id,{resolve,reject});const timer=setTimeout(()=>{if(this.jobs.delete(id)){reject(Error('Piper job timeout'));this.child?.kill();}},20000);timer.unref();this.jobs.set(id,{resolve:b=>{clearTimeout(timer);resolve(b);},reject:e=>{clearTimeout(timer);reject(e);}});this.child.stdin.write(JSON.stringify({id,text})+'\n');});}
  close(){this.closed=true;this.child?.kill();}
}

export class VoiceCache{
  constructor({directory=path.join(root,'output/cache'),worker,version='test',maxBytes=200*1024*1024}={}){this.directory=directory;this.worker=worker;this.version=version;this.maxBytes=maxBytes;this.entries=new Map();this.inflight=new Map();this.ram=new Map();this.queue=[];this.closed=false;this.active=false;}
  key(text){return createHash('sha256').update(JSON.stringify([this.version,'pcm22050-mono16-default-v1',text])).digest('hex');}
  async init(){
    await fs.mkdir(this.directory,{recursive:true});
    // Only this dedicated cache's generated hash-named WAVs are inspected or evicted.
    for(const name of await fs.readdir(this.directory))if(/^[a-f0-9]{64}\.wav$/.test(name))try{const file=path.join(this.directory,name),stat=await fs.stat(file);if(stat.size>2*1024*1024)continue;const bytes=await fs.readFile(file),info=wavInfo(bytes);this.entries.set(name.slice(0,-4),{...info,bytes:bytes.length,last:stat.mtimeMs,fixed:false});}catch{}
    await this.prune();
  }
  has(text){return this.entries.has(this.key(text));}
  ensure(text,{fixed=false,priority=0}={}){
    const key=this.key(text),old=this.entries.get(key);if(old){old.fixed||=fixed;return Promise.resolve(key);}if(this.inflight.has(key))return this.inflight.get(key);
    if(this.closed||this.queue.length>=128)return Promise.reject(Error('Voice synthesis queue full'));
    const promise=new Promise((resolve,reject)=>{this.queue.push({key,text,fixed,priority,resolve,reject});this.queue.sort((a,b)=>b.priority-a.priority);});
    this.inflight.set(key,promise);this.pump();return promise;
  }
  async pump(){
    if(this.active||this.closed)return;this.active=true;
    while(this.queue.length&&!this.closed){const job=this.queue.shift();try{const bytes=await this.worker.synthesize(job.text),info=wavInfo(bytes);if(this.closed)throw Error('Voice cache closed');const file=path.join(this.directory,job.key+'.wav');await fs.writeFile(file+'.tmp',bytes);await fs.rename(file+'.tmp',file);this.entries.set(job.key,{...info,bytes:bytes.length,last:Date.now(),fixed:job.fixed});await this.prune();job.resolve(job.key);}catch(error){job.reject(error);}finally{this.inflight.delete(job.key);}}
    this.active=false;
  }
  async get(key){
    if(!/^[a-f0-9]{64}$/.test(key)||!this.entries.has(key))return null;
    const entry=this.entries.get(key);entry.last=Date.now();if(this.ram.has(key)){const bytes=this.ram.get(key);this.ram.delete(key);this.ram.set(key,bytes);return bytes;}
    try{const bytes=await fs.readFile(path.join(this.directory,key+'.wav'));wavInfo(bytes);this.ram.set(key,bytes);while(this.ram.size>32)this.ram.delete(this.ram.keys().next().value);return bytes;}catch{return null;}
  }
  async prune(){let total=[...this.entries.values()].reduce((n,e)=>n+e.bytes,0);for(const [key,e]of [...this.entries].filter(([,e])=>!e.fixed).sort((a,b)=>a[1].last-b[1].last)){if(total<=this.maxBytes)break;await fs.unlink(path.join(this.directory,key+'.wav')).catch(()=>{});this.entries.delete(key);this.ram.delete(key);total-=e.bytes;}}
  close(){this.closed=true;for(const job of this.queue.splice(0)){job.reject(Error('Voice cache closed'));this.inflight.delete(job.key);}this.worker.close?.();}
}

export async function createVoiceCache({directory,worker,voiceDirectory=root}={}){
  let version='fixture-v1';
  if(!worker){const settings=JSON.parse(await fs.readFile(path.join(voiceDirectory,'voice-settings.json'),'utf8'));const voice=settings.voice;if(!['male','female'].includes(voice))throw Error('Invalid Piper voice');const model=path.join(voiceDirectory,'models',voice==='male'?'vi_VN-tramvang-medium/vi_VN-tramvang-medium.onnx':'vi_VN-vais1000-medium.onnx');const hash=createHash('sha256');for(const file of [model,model+'.json',path.join(voiceDirectory,'worker.py')])hash.update(await fs.readFile(file));version=hash.digest('hex');worker=new PiperWorker({directory:voiceDirectory,voice});}
  const cache=new VoiceCache({directory,worker,version});await cache.init();return cache;
}
