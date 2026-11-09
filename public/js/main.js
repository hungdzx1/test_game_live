import {AudioRuntime} from './audio.js';
import {QualityGovernor} from './performance.js';
import {BattleScene} from './battleScene.js';
import {BattleOverlay} from './battleOverlay.js';
import {LiveOverlay,liveMessage} from './liveOverlay.js';
import {createWorld} from './scene.js';
import {CharacterManager} from './characters.js';
import {CameraDirector} from './camera.js';
import {Effects} from './effects.js';
import {Overlay} from './overlay.js';
import {connect} from './network.js';
import {BreakthroughScene} from './breakthroughScene.js';
import {presentPlayers} from './presentationState.js';
try {
  const world=createWorld(document.getElementById('world')),sectObjects=world.scene.children.filter(o=>!o.isLight),characters=new CharacterManager(world.scene),director=new CameraDirector(world.camera),effects=new Effects(world.scene),overlay=new Overlay();
  const tribulation=new BreakthroughScene(world.scene),battleScene=new BattleScene(world.scene),battleOverlay=new BattleOverlay(),liveOverlay=new LiveOverlay();
  const governor=new QualityGovernor(),audio=new AudioRuntime({fallback:text=>overlay.event(text)});
  const gate=document.createElement('button');gate.className='audio-gate';gate.textContent='Bật âm thanh tại nguồn này';document.getElementById('stage').append(gate);gate.onclick=async()=>{gate.hidden=await audio.unlock();audio.play('bell',4);audio.speech.push('Thiên Đạo đã sẵn sàng.',5,'audio-test');};
  let lastResultId=null,lastLightning=false;
  let transportId,applied='',lastTelemetry=0,lastHud=0,lastSession=null;const clientId=crypto.randomUUID();
  let state=null,quality='',last=performance.now(),received=last,renderPlayers=[];
  const pendingEvents=[];
  function showEvent(e){
    if(e.kind==='item:received')return true; // Unity receipt presentation; legacy already renders live:gift/item:used.
    if(state&&(e.fieldId===undefined||e.fieldId===state.battle?.viewId))audio.event(e,state);
    if(e.kind.startsWith('live:')){
      const message=liveMessage(e);if(message)overlay.event(message);
      const p=renderPlayers.find(p=>p.userId===e.userId);
      if(e.kind==='live:gift'&&p){effects.item(p,e.item,performance.now());if(e.effect==='camera')director.requestFocus({kind:'gift',userId:p.userId,priority:state.config.cameraDirector?.priorities.gift??3,durationMs:3000});}
      if(e.kind==='live:gift'&&e.effect==='sect')for(const p of renderPlayers.slice(0,12))effects.trigger(p,performance.now());
      if(e.kind==='live:cultivation'&&p)effects.trigger(p,performance.now());
      if(e.kind==='live:wish')for(const p of renderPlayers.slice(0,12))effects.trigger(p,performance.now());
      return true;
    }
    if(e.kind.startsWith('battle:')||e.kind.startsWith('boss:')||e.kind==='mob:killed'){battleScene.event(e,performance.now());const message=battleOverlay.message(e,state);if(message&&(e.fieldId===undefined||e.fieldId===state?.battle?.viewId))overlay.event(message,e.kind==='battle:prepare'||e.kind==='boss:killed');return true;}
    const p=renderPlayers.find(p=>p.userId===e.userId);if(!p)return false;
    if(['join','player:joined','teleport','celebrate','stage:up','breakthrough:completed','item:used'].includes(e.kind))effects.trigger(p,performance.now());
    if(e.kind==='item:used')effects.item(p,e.item,performance.now());
    if(['focus','join','player:joined','camera:focus'].includes(e.kind))director.requestFocus({kind:e.kind==='camera:focus'?'gift':'join',userId:p.userId,priority:e.priority??(e.kind==='focus'?(state.config.cameraDirector?.priorities.gift??3):(state.config.cameraDirector?.priorities.join??1)),durationMs:e.durationMs??2000});
    const message={join:'đã gia nhập tông môn','player:joined':'đã gia nhập tông môn','player:returned':'chào mừng trở lại',attack:'biểu diễn kiếm thuật',celebrate:'hân hoan',teleport:'dịch chuyển',focus:'đang được theo dõi','camera:focus':'thi triển phong thái','stage:up':'đã nâng tiểu cảnh giới','breakthrough:started':'Thiên Đạo gọi tên · bắt đầu độ kiếp','breakthrough:completed':e.outcome?'độ kiếp thành công!':'độ kiếp thất bại · tích lũy Thiên Mệnh','item:used':`đã dùng ${e.name}`,'quest:completed':'hoàn thành nhiệm vụ','quest:redeemed':'đã đổi vật phẩm'}[e.kind]||e.kind;
    overlay.event(`${p.name} · ${message}`,e.kind.startsWith('breakthrough:'));return true;
  }
  connect({onStatus:text=>document.getElementById('connection').textContent=text,onState:(s,meta)=>{if(lastSession!==null&&lastSession!==meta.sessionId){lastSession=meta.sessionId;pendingEvents.length=0;director.queue=[];director.active=null;audio.speech.clear();}lastSession=meta.sessionId;transportId=meta.sessionId;state=s;received=performance.now();if(s.storageError)document.getElementById('connection').textContent=s.storageError;renderPlayers=presentPlayers(s);characters.sync(renderPlayers);overlay.state(s);battleScene.sync(s);battleOverlay.state(s);liveOverlay.state(s);sectObjects.forEach(o=>o.visible=s.effectivePhase!=='battle');tribulation.group.visible=s.effectivePhase!=='battle';governor.configure(s.config.graphics,s.config.display?.autoQuality??true);audio.configure(s.config.audio??{});battleScene.showDamage=s.config.display?.damageNumbers!==false;applyQuality();if(s.battleResult&&s.battleResult.resultId!==lastResultId){lastResultId=s.battleResult.resultId;for(const f of s.battleResult.fields){const top=f.results.slice(0,3);if(top.length)audio.speech.push('Thiên Đạo thông cáo! '+f.name+': '+top.map(r=>r.rank+'. '+r.name).join(', '),5,f.name+lastResultId);}}for(const e of pendingEvents.splice(0))showEvent(e);},onEvent:e=>{if(!showEvent(e)&&pendingEvents.length<100)pendingEvents.push(e);}});
  function applyQuality(){if(!state)return;const display=state.config.display??{},key=JSON.stringify([governor.level,display]);if(applied===key)return;applied=key;quality=governor.level;world.quality(quality,display);effects.quality(quality,display.particleScale??1);characters.limit=quality==='low'?40:60;tribulation.low=quality==='low';battleScene.low=quality==='low';}
  function frame(now){const rawDelta=now-last,dt=Math.min(.05,rawDelta/1000);last=now;if(governor.sample(rawDelta)){applyQuality();overlay.event('Đã giảm đồ họa để giữ khung hình.');}audio.update();
    if(state){
      const running=['cultivation','battle'].includes(state.phase),offset=(running?Math.min(250,now-received)*(state.demoSpeed??1):0),time=state.elapsedMs+offset;
      director.update(now,dt,renderPlayers,state.config.camera,state.effectivePhase==='battle'?null:state.breakthrough??state.breakthroughResult,state.effectivePhase==='battle'?state.battle:null,state.battleResult,{userId:state.cameraUserId,settings:state.config.cameraDirector});characters.update(time,dt,world.camera,director.followed);
      if(now-lastHud>100){lastHud=now;overlay.update(now,state.players.find(p=>p.userId===director.followed));}const finalBoss=state.effectivePhase==='battle'&&state.battle?.view?.activeBoss?.type===2&&state.battle.view.activeBoss.status==='alive';audio.scene(finalBoss);world.mood(finalBoss);world.update(time/1000);effects.update(now);
      battleScene.update((state.battle?.elapsedMs??0)+(state.phase==='battle'?offset:0),dt,now);
      if(state.effectivePhase==='battle')world.scene.background.set(finalBoss?'#2a1d38':'#15172b');
      tribulation.update(state.effectivePhase==='battle'?null:state.breakthrough,state.effectivePhase==='battle'?null:state.breakthroughResult,state.phase==='cultivation'?offset:0);
      if(tribulation.lightning.visible&&!lastLightning)audio.play('lightning',4);lastLightning=tribulation.lightning.visible;
      if(state.breakthrough&&state.effectivePhase!=='battle'){world.scene.background.multiplyScalar(.48);world.camera.position.x+=tribulation.shake;}
    }
    world.renderer.render(world.scene,world.camera);
    if(state&&governor.fps!==null&&now-lastTelemetry>2000){lastTelemetry=now;const info=world.renderer.info;fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId,sessionId:transportId,fps:governor.fps,quality,drawCalls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures,rendered:characters.views.size})}).catch(()=>{});}
    requestAnimationFrame(frame);
  }
  world.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.getElementById('fallback').hidden=false;});requestAnimationFrame(frame);
} catch(error){const fallback=document.getElementById('fallback');fallback.hidden=false;const status=document.createElement('p');fallback.append(status);connect({onState:s=>{status.textContent=`Máy chủ vẫn chạy · ${s.phase} · ${s.players.length} đạo hữu · ${Math.ceil(s.remainingMs/1000)} giây. Hãy bật WebGL rồi tải lại trang.`;}});console.error(error);}
