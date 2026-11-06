import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { JsonStore } from './storage.js';
import { GameEngine } from './gameEngine.js';
import { DemoEventSource } from './demoEventSource.js';
import { validateSave } from './playerStore.js';
import { rulesFor } from './cultivationConfig.js';
import { CommandRouter } from './commandRouter.js';
import {battleRulesFor} from './battleConfig.js';
import {createPlayer} from './playerStore.js';
import { copyFile, constants } from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {TikTokAdapter} from './tiktokAdapter.js';
import {liveRulesFor,giftRulesFor,usernameFor} from './liveConfig.js';
import {DemoConnection} from './demoConnection.js';
import {audioSettings,displaySettings,cameraSettings,CAMERA_MODES} from './public/js/settings.js';
import {DataManager} from './adminData.js';
import {preserveCorrupt} from './adminDataBackup.js';
const root = path.dirname(fileURLToPath(import.meta.url));
export async function createApplication({ dataRoot = root, port,connectorFactory,adapterTimers } = {}) {
  const store = new JsonStore();
  const configFile = path.join(dataRoot, 'caidat.json'), demoFile = path.join(dataRoot, 'data/demo/players.json');
  const config = await store.read(configFile, { schemaVersion: 1, host: '127.0.0.1', port: 3000, graphics: 'medium', camera: 'auto' });
  async function readSaved(file){const raw=await store.read(file,{schemaVersion:1,players:[]});try{return validateSave(raw);}catch(error){await preserveCorrupt(file);throw error;}}
  const saved = await readSaved(demoFile);
  if (!config || Array.isArray(config) || config.schemaVersion !== 1 || !['low','medium','high'].includes(config.graphics) || !CAMERA_MODES.includes(config.camera) || !Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {await preserveCorrupt(configFile);throw new Error('Cấu hình không hợp lệ. Giữ nguyên file để kiểm tra.');}
  try{config.cultivation=rulesFor(config.cultivation);
  Object.assign(config,battleRulesFor(config));
  config.live=liveRulesFor(config.live);config.giftRules=giftRulesFor(config.giftRules);
  config.audio=audioSettings(config.audio);config.display=displaySettings(config.display);config.cameraDirector=cameraSettings(config.cameraDirector);
  }catch(error){await preserveCorrupt(configFile);throw error;}
  const dataManager=new DataManager(store,dataRoot),telemetry=new Map();
  const load={tickMs:0,commitMs:0,maxTickMs:0,ticks:0};
  async function restoreEngine(saved,file){try{return new GameEngine(saved.players,config,{saved});}catch(error){await preserveCorrupt(file);throw error;}}
  let engine = await restoreEngine(saved,demoFile), demo = new DemoEventSource(engine);
  const filter=await store.read(path.join(root,'tucngu.json'),{words:[]});
  engine.liveEvents.words=filter.words;engine.liveEvents.commands.words=filter.words;
  let commands=engine.liveEvents.commands;
  const sessions=new Map([['demo',engine]]),realFile=path.join(dataRoot,'data/players.json');
  const demoConnection=new DemoConnection(config.live);
  let mutations=Promise.resolve(),closing=false;const incoming=[];
  const adapter=new TikTokAdapter({factory:connectorFactory,words:filter.words,settings:config.live,...adapterTimers,onEvent:event=>{
    const target=engine;if(target.mode!=='live'||closing||storageError)return;
    const primary=event.loai==='qua'||event.loai==='binhluan'&&/^\s*[12]\s*$/.test(event.noiDung);
    if(incoming.length>=(primary?50000:1000)){target.liveEvents.diagnostic('Hàng đợi LIVE quá tải; đã giới hạn đầu vào. Sự kiện chưa được chốt.');return;}
    // Drain on the serialized game tick (or before an admin action), at most one disk
    // commit per batch. Network callbacks never enqueue an unbounded series of writes.
    incoming.push({target,event});
  }});
  function processIncoming(limit=100){for(const {target,event}of incoming.splice(0,limit))if(!storageError&&target===engine)target.liveEvents.accept(event);}
  const app = express(), server = createServer(app), wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  let actualPort = port ?? config.port;
  const allowed = req => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && [`localhost:${actualPort}`, `127.0.0.1:${actualPort}`].includes(req.headers.host) && (!req.headers.origin || [`http://localhost:${actualPort}`, `http://127.0.0.1:${actualPort}`].includes(req.headers.origin));
  app.use((req, res, next) => {
    if (!allowed(req)) return res.status(403).json({ error: 'Chỉ cho phép truy cập cùng nguồn trên máy này.' });
    if(req.headers['sec-fetch-site']==='cross-site')return res.status(403).json({error:'Từ chối yêu cầu khác nguồn.'});
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'self'"); next();
  });
  app.use(express.json({ limit: '20mb' }));
  const csrfToken=randomBytes(32).toString('hex');
  app.get('/api/admin-session',(req,res)=>{res.setHeader('Cache-Control','no-store');res.json({token:csrfToken});});
  app.use('/api/control',(req,res,next)=>{
    // Non-browser local CLI clients retain the Phase 1 API; browser writes require the session token.
    if(req.method==='POST'&&(req.headers.origin||req.headers['sec-fetch-site'])){
      const supplied=req.headers['x-csrf-token'];
      if(typeof supplied!=='string'||Buffer.byteLength(supplied)!==csrfToken.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(csrfToken)))return res.status(403).json({error:'Phiên quản trị không hợp lệ. Tải lại trang điều khiển.'});
    }next();
  });
  let lastSnapshotAt=-Infinity;const effectTimes=[];
  const broadcast = message => {
    if(message.type==='game:event'){
      const t=performance.now();while(effectTimes.length&&effectTimes[0]<=t-1000)effectTimes.shift();
      const high=/^(breakthrough:|boss:|battle:(?:prepare|result|return)|live:gift)/.test(message.payload.kind);
      if(effectTimes.length>=(high?80:60))return;effectTimes.push(t);
    }
    const data = JSON.stringify(message);for(const client of wss.clients)if(client.readyState===WebSocket.OPEN&&client.bufferedAmount<1024*1024)client.send(data);
  };
  let committed=engine.snapshot(),pendingEvents=[],storageError=null;
  const freshCommitted = () => ({...committed,seq:++engine.seq,serverTime:Date.now()});
  const snapshot = () => {if(performance.now()-lastSnapshotAt<100)return;lastSnapshotAt=performance.now();broadcast(freshCommitted());};
  function attach(target){target.on('event',payload=>{if(engine!==target)return;pendingEvents.push(payload);if(pendingEvents.length>1000)pendingEvents.shift();});}
  attach(engine);
  server.on('upgrade', (req, socket, head) => {
    if (!allowed(req) || req.url !== '/ws') return socket.destroy();
    wss.handleUpgrade(req, socket, head, client => wss.emit('connection', client));
  });
  wss.on('connection', client => { client.on('error', () => {}); client.send(JSON.stringify(freshCommitted())); client.on('message', () => client.close(1008, 'Chỉ nhận trạng thái')); });
  let lastSaved=performance.now();
  function stopOnStorageFailure(){storageError='Không thể lưu tiến trình. Mô phỏng đã dừng; kiểm tra ổ đĩa/quyền ghi và khởi động lại.';engine.phase='paused';pendingEvents=[];committed={...committed,payload:{...committed.payload,phase:'paused',storageError}};snapshot();}
  const saveDemo = async () => {try{await store.write(engine.mode==='live'?realFile:demoFile,engine.exportState());}catch(e){stopOnStorageFailure();throw e;}engine.important=false;lastSaved=performance.now();};
  async function commit(force=false){
    if(force||engine.important||performance.now()-lastSaved>=5000)await saveDemo();
    const priority=e=>e.kind.startsWith('breakthrough:')||e.kind==='boss:killed'||e.kind==='battle:result'?5:e.kind==='live:gift'?4:e.kind==='battle:hit'?0:1;
    for(const payload of pendingEvents.splice(0).sort((a,b)=>priority(b)-priority(a)))broadcast({type:'game:event',version:1,sessionId:engine.transportId,seq:++engine.seq,serverTime:Date.now(),payload});
    committed=engine.snapshot();committed.payload.tiktok=(engine.mode==='demo'?demoConnection.adapter:adapter).snapshot();
  }
  adapter.on('status',()=>{if(engine.mode==='live'){committed={...committed,payload:{...committed.payload,tiktok:adapter.snapshot()}};snapshot();}});
  demoConnection.adapter.on('status',()=>{if(engine.mode==='demo'){committed={...committed,payload:{...committed.payload,tiktok:demoConnection.adapter.snapshot()}};snapshot();}});
  adapter.on('diagnostic',message=>engine.liveEvents.diagnostic(message));
  app.get('/health', (req, res) => res.json({ ok: !storageError, version: '0.5.0', uptime: process.uptime(),storageError }));
  app.get('/api/state', (req, res) => {const s=engine.snapshot(true);s.payload.tiktok=(engine.mode==='demo'?demoConnection.adapter:adapter).snapshot();res.json(s);});
  app.get('/api/backup',(req,res,next)=>{const job=mutations.then(async()=>{await commit(true);res.setHeader('Content-Disposition',`attachment; filename="tutien-${engine.mode}.json"`);res.setHeader('Cache-Control','no-store');res.json(dataManager.bundle(engine));});mutations=job.catch(()=>{});job.catch(next);});
  app.get('/api/data-confirmation',(req,res,next)=>{try{res.setHeader('Cache-Control','no-store');res.json(dataManager.challenge(req.query.purpose,engine.mode));}catch(e){next(e);}});
  app.post('/api/telemetry',(req,res)=>{
    const v=req.body;if(!v||typeof v.clientId!=='string'||!/^[\w-]{1,80}$/.test(v.clientId)||v.sessionId!==engine.transportId||!['fps','drawCalls','triangles','geometries','textures','rendered'].every(k=>Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1e8)||v.fps>1000||!['low','medium','high'].includes(v.quality))return res.status(400).json({error:'Báo cáo hiển thị không hợp lệ.'});
    for(const [id,t]of telemetry)if(Date.now()-t.receivedAt>15000)telemetry.delete(id);if(!telemetry.has(v.clientId)&&telemetry.size>=8)return res.status(429).json({error:'Đã đủ nguồn báo cáo.'});if(Date.now()-(telemetry.get(v.clientId)?.receivedAt??0)<1500)return res.status(429).json({error:'Báo cáo tối đa mỗi 2 giây.'});
    telemetry.set(v.clientId,{...Object.fromEntries(['fps','drawCalls','triangles','geometries','textures','rendered','quality'].map(k=>[k,v[k]])),receivedAt:Date.now()});res.json({ok:true});
  });
  app.get('/api/dashboard',(req,res)=>{const memory=process.memoryUsage();res.json({mode:engine.mode,phase:engine.phase,remainingMs:engine.remainingMs,completedCycles:engine.completedCycles,battlesStarted:engine.battlesStarted,players:engine.players.size,realms:engine.rules.realms.map((r,id)=>({name:r.name,count:[...engine.players.values()].filter(p=>p.realmIndex===id).length})),activeFields:engine.battle.current?.status==='running'?engine.battle.current.fields.filter(f=>f.participantIds.length).length:0,breakthroughQueue:engine.breakthrough.queue.length,events:engine.liveEvents.counters,tiktok:(engine.mode==='demo'?demoConnection.adapter:adapter).snapshot(),load:{...load,rssMB:memory.rss/1048576,heapMB:memory.heapUsed/1048576,queuedEvents:incoming.length,webSockets:wss.clients.size},renderReports:[...telemetry.values()].filter(v=>Date.now()-v.receivedAt<15000),storageError});});
  app.post('/api/control', (req, res, next) => {
    const job = mutations.then(async () => {
      if (!req.is('application/json') || !req.body || Array.isArray(req.body)) throw new Error('Yêu cầu JSON không hợp lệ.');
      const { action, value, userId } = req.body;
      if(action!=='restoreData'&&Buffer.byteLength(JSON.stringify(req.body))>32768)throw new Error('Yêu cầu quá lớn.');
      if(storageError)throw new Error(storageError);
      processIncoming(Infinity);
      if(['demo','clearDemo','event','command','grantItem','prepareBreakthrough','battleDemo','demoSpeed','animationPreview','demoLiveEvent','demoConnection'].includes(action)&&engine.mode!=='demo')throw new Error('Thao tác mô phỏng chỉ dùng trong chế độ demo.');
      switch (action) {
        case 'audioSettings': case 'displaySettings': case 'cameraSettings': {
          const key={audioSettings:'audio',displaySettings:'display',cameraSettings:'cameraDirector'}[action],validate={audioSettings,displaySettings,cameraSettings}[action];
          const next=validate({...config[key],...value});await store.write(configFile,{...config,[key]:next});config[key]=next;break;
        }
        case 'balanceSettings': {
          if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['boss','quests'].includes(k)))throw new Error('Cấu hình độ khó/nhiệm vụ không hợp lệ.');
          const battle=battleRulesFor({...config,boss:{...config.boss,...value.boss}}),cultivation=rulesFor({...config.cultivation,quests:{...config.cultivation.quests,...value.quests}});
          await store.write(configFile,{...config,boss:battle.boss,cultivation});config.boss=battle.boss;config.cultivation=cultivation;for(const target of sessions.values()){target.battleRules=battle;target.rules=cultivation;}break;
        }
        case 'cameraFocus': {
          const p=engine.getPlayer(userId);engine.cameraUserId=p.userId;engine.event('camera:focus',p.userId,{durationMs:3000,priority:config.cameraDirector.priorities.gift});break;
        }
        case 'endCycle': engine.setPhase(engine.phase==='battle'||engine.previousPhase==='battle'?'cultivation':'battle');break;
        case 'restoreData': case 'resetData': {
          const purpose=action==='restoreData'?'restore':'reset';let target;
          if(purpose==='restore')target=dataManager.validate(value?.bundle,engine.mode,config);else {target=new GameEngine([],config);target.mode=engine.mode;}
          dataManager.confirm(value,purpose,engine.mode);await dataManager.protect(engine,purpose);
          adapter.disconnect().catch(()=>{});await store.write(engine.mode==='live'?realFile:demoFile,target.exportState());
          target.liveEvents.words=filter.words;target.liveEvents.commands.words=filter.words;engine=target;sessions.set(engine.mode,engine);attach(engine);demo=new DemoEventSource(engine);commands=engine.liveEvents.commands;pendingEvents=[];incoming.length=0;telemetry.clear();break;
        }
        case 'mode': {
          if(!['demo','live'].includes(value))throw new Error('Chế độ không hợp lệ.');
          if(value===engine.mode)break;
          adapter.disconnect().catch(()=>{});await demoConnection.adapter.disconnect();await saveDemo();
          let target=sessions.get(value);
          if(!target){const realSaved=await readSaved(realFile);target=await restoreEngine(realSaved,realFile);target.mode='live';target.liveEvents.words=filter.words;target.liveEvents.commands.words=filter.words;
            if(realSaved.schemaVersion===1)try{await copyFile(realFile,realFile+'.v1.backup',constants.COPYFILE_EXCL);}catch(e){if(!['ENOENT','EEXIST'].includes(e.code))throw e;}
            attach(target);sessions.set(value,target);
          }
          engine=target;demo=new DemoEventSource(engine);commands=engine.liveEvents.commands;pendingEvents=[];committed=engine.snapshot();break;
        }
        case 'liveConnect': {
          if(engine.mode!=='live')throw new Error('Chuyển sang dữ liệu LIVE trước khi nối TikTok.');
          if(!value||typeof value!=='object')throw new Error('Cấu hình kết nối không hợp lệ.');
          const username=usernameFor(value.username);
          // Network connection is deliberately not awaited inside the simulation mutation queue.
          adapter.connect(username,value.signApiKey??'');
          config.live={...config.live,username};await store.write(configFile,config);if(engine.phase==='stopped')engine.setPhase('resume');break;
        }
        case 'liveDisconnect': adapter.disconnect().catch(()=>{});break;
        case 'liveSettings': {
          const next=liveRulesFor({...config.live,...value});await store.write(configFile,{...config,live:next});config.live=next;adapter.settings=next;demoConnection.adapter.settings=next;break;
        }
        case 'giftRules': {const next=giftRulesFor(value);await store.write(configFile,{...config,giftRules:next});config.giftRules=next;break;}
        case 'demoLiveEvent': {
          const result=demo.emit(value);if(result.accepted===false)throw new Error(result.reason??'Sự kiện bị giới hạn tần suất.');break;
        }
        case 'demoConnection': await demoConnection.simulate(value);break;
        case 'demo': demo.spawn(value); break;
        case 'clearDemo': engine.clearDemo(); break;
        case 'phase': engine.setPhase(value); break;
        case 'event': demo.send(value, userId); break;
        case 'command': {
          if(!value||typeof value!=='object')throw new Error('Lệnh không hợp lệ.');
          const result=demo.emit({eventId:value.eventId,userId,ten:value.name??engine.players.get(userId)?.name,loai:'binhluan',noiDung:value.text},{admin:true});if(result.accepted===false)throw new Error(result.reason??'Lệnh bị giới hạn.');break;
        }
        case 'grantItem': engine.items.grantItem(engine.getPlayer(userId),value,1,'admin_demo');break;
        case 'useItem': engine.items.useItem(engine.getPlayer(userId),value);break;
        case 'redeem': engine.quests.redeem(engine.getPlayer(userId),value);break;
        case 'prepareBreakthrough': engine.prepareBreakthrough(userId);break;
        case 'battleView': engine.battle.selectView(value);break;
        case 'battleDemo': {
          if(engine.battle.current?.status==='running')throw new Error('Hãy kết thúc trận hiện tại trước khi tạo kịch bản.');
          const needed=Array.from({length:44},(_,i)=>`battle-demo-${Math.floor(i/4)}-${i%4}`).filter(id=>!engine.players.has(id)).length;
          if(engine.players.size+needed>500)throw new Error('Không đủ chỗ cho 44 đạo hữu demo.');
          for(const realm of [0,1,2,3,4,5,6,7,8,9,10])for(let i=0;i<4;i++){
            const id=`battle-demo-${realm}-${i}`;if(engine.players.has(id))continue;if(engine.players.size>=500)throw new Error('Đã đạt 500 đạo hữu demo.');
            const p=createPlayer(id,`Đạo hữu ${realm+1}.${i+1}`,engine.players.size);p.realmIndex=realm;engine.join(p);
          }engine.setPhase('battle');break;
        }
        case 'battleSettings': {
          if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['cultivationSeconds','battleSeconds'].includes(k)))throw new Error('Cấu hình chu kỳ không hợp lệ.');
          const updated={...config,cycle:{...config.cycle,...value}},rules=battleRulesFor(updated);
          await store.write(configFile,updated);Object.assign(config,updated);for(const target of sessions.values())target.battleRules=rules;break;
        }
        case 'demoSpeed': if(![1,10].includes(value))throw new Error('Tốc độ demo phải là 1 hoặc 10.');engine.demoSpeed=value;break;
        case 'animationPreview': if(typeof value!=='boolean')throw new Error('Tùy chọn không hợp lệ.');engine.animationPreview=value;break;
        case 'cultivationSettings': {
          if(!value||typeof value!=='object'||Object.keys(value).some(k=>!['maxMultiplier','fateFailures'].includes(k)))throw new Error('Cấu hình tu luyện không hợp lệ.');
          const rules=rulesFor({...config.cultivation,...value});await store.write(configFile,{...config,cultivation:rules});config.cultivation=rules;for(const target of sessions.values())target.rules=rules;break;
        }
        case 'graphics': case 'camera': {
          const values = action === 'graphics' ? ['low','medium','high'] : CAMERA_MODES;
          if (!values.includes(value)) throw new Error('Tùy chọn không hợp lệ.');
          const updated = { ...config, [action]: value }; await store.write(configFile, updated); Object.assign(config, updated); break;
        }
        default: throw new Error('Thao tác không hợp lệ.');
      }
      await commit(true);snapshot(); res.json({ ok: true });
    }); mutations = job.catch(() => {}); job.catch(next);
  });
  app.get('/song', (req, res) => res.sendFile(path.join(root, 'public/song.html')));
  app.use('/vendor/three', express.static(path.join(root, 'node_modules/three/build')));
  app.use(express.static(path.join(root, 'public')));
  app.use((error, req, res, next) => res.status(error.code ? 500 : 400).json({ error: error.code ? 'Không thể lưu dữ liệu. Kiểm tra quyền ghi và dung lượng ổ đĩa.' : error.message }));
  let last=performance.now(),tick,sync,busy=false;
  return {get engine(){return engine;},server,get commands(){return engine.liveEvents.commands;},adapter,async listen(){
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(actualPort,'127.0.0.1',resolve);});actualPort=server.address().port;
    // Backup the original phase-1 bytes before the first migration write; never overwrite this backup.
    if(saved.schemaVersion===1)try{await copyFile(demoFile,demoFile+'.v1.backup',constants.COPYFILE_EXCL);}catch(e){if(!['ENOENT','EEXIST'].includes(e.code)){await new Promise(resolve=>server.close(resolve));throw e;}}
    last=performance.now();tick=setInterval(()=>{
      if(busy||storageError)return;busy=true;const now=performance.now(),dt=Math.min(250,now-last);last=now;
      const job=mutations.then(async()=>{if(storageError)return;const start=performance.now();processIncoming();for(let i=0;i<engine.demoSpeed;i++)engine.tick(dt);load.tickMs=performance.now()-start;load.maxTickMs=Math.max(load.maxTickMs,load.tickMs);load.ticks++;const saveStart=performance.now();await commit();load.commitMs=performance.now()-saveStart;});
      mutations=job.catch(e=>{stopOnStorageFailure();console.error(storageError,e.message);}).finally(()=>{busy=false;});
    },50);sync=setInterval(snapshot,250);return actualPort;
  },async close(){closing=true;clearInterval(tick);clearInterval(sync);await adapter.disconnect();await demoConnection.adapter.disconnect();await mutations;if(!storageError){processIncoming(Infinity);await saveDemo();}for(const c of wss.clients)c.terminate();wss.close();await new Promise(resolve=>server.close(resolve));}};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let instance;
  try {
    instance = await createApplication(); const port = await instance.listen();
    console.log(`Tu Tiên LIVE: http://localhost:${port} — Ctrl+C để đóng.`);
    if (process.argv.includes('--open')) { const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `start "" "http://localhost:${port}"`], { windowsHide: true, windowsVerbatimArguments: true, stdio: 'ignore' }); child.on('error', () => console.error('Hãy mở địa chỉ trên bằng trình duyệt.')); child.on('exit', code => { if (code) console.error('Không tự mở được trình duyệt. Hãy mở địa chỉ trên thủ công.'); }); }
    let closing = false;
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal, async () => { if (closing) return; closing = true; try { await instance.close(); process.exit(0); } catch (e) { console.error(e.message); process.exit(1); } });
  } catch (e) { console.error(e.code === 'EADDRINUSE' ? 'Cổng đang bận. Đóng phiên Tu Tiên cũ hoặc ứng dụng dùng cổng 3000 rồi thử lại.' : e.message); process.exit(1); }
}
