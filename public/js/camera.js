import * as THREE from 'three';
import {cameraSettings} from './settings.js';
import {SECT_CAMERA_ANCHOR} from './sectLayout.js';
export class CameraDirector {
  constructor(camera){this.camera=camera;this.target=new THREE.Vector3().copy(SECT_CAMERA_ANCHOR.target);this.desired=new THREE.Vector3();this.look=new THREE.Vector3();this.queue=[];this.active=null;this.followed=null;this.seen=new Map();this.time=0;this.settings=cameraSettings();this.lastMode='';this.modeSince=0;}
  requestFocus(request,priority=1,duration=3000){
    const legacy=typeof request==='string',q=legacy?{userId:request,priority,duration,kind:'legacy',legacy:true}:{...request,duration:request.durationMs??3000};
    if(q.battlefieldId===null)delete q.battlefieldId;
    if(!q.userId&&!Number.isInteger(q.battlefieldId))return false;q.priority=Number.isFinite(q.priority)?Math.max(0,Math.min(10,q.priority)):1;q.duration=Math.max(500,Math.min(15000,q.duration));q.createdAt=this.time;
    const key=`${q.kind}:${q.userId??q.battlefieldId}`;if(!legacy&&(this.seen.get(key)??-Infinity)>this.time-this.settings.focusCooldownMs)return false;
    if(!legacy){this.seen.set(key,this.time);if(this.seen.size>200)this.seen.delete(this.seen.keys().next().value);}
    if(this.active&&this.active.userId===q.userId&&this.active.battlefieldId===q.battlefieldId&&this.active.priority>=q.priority)return false;
    if(this.active&&q.priority>this.active.priority&&(legacy||q.priority>=5||this.time-this.active.started>=this.settings.minShotMs))this.active=null;
    const queued=this.queue.find(x=>x.userId===q.userId&&x.kind===q.kind);if(queued){if(q.priority>queued.priority)Object.assign(queued,q);}else this.queue.push(q);
    this.queue.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt);this.queue.length=Math.min(8,this.queue.length);return true;
  }
  update(t,dt,players,mode,ceremony=null,battle=null,result=null,options={}){
    this.time=t;this.settings=cameraSettings(options.settings??{});if(mode!==this.lastMode||options.userId!==this.manualUser){this.lastMode=mode;this.manualUser=options.userId;this.modeSince=t;}
    if(this.active&&t>this.active.until)this.active=null;
    this.queue=this.queue.filter(q=>t-q.createdAt<15000);
    if(this.active&&this.queue[0]?.priority>this.active.priority&&t-this.active.started>=this.settings.minShotMs)this.active=null;
    if(!this.active){const index=this.queue.findIndex(q=>(q.battlefieldId===undefined||q.battlefieldId===battle?.viewId)&&(!q.userId||players.some(p=>p.userId===q.userId)));if(index>=0){const q=this.queue.splice(index,1)[0];this.active={...q,started:t,until:t+q.duration};}}
    const seconds=t/1000;let player=this.active?players.find(p=>p.userId===this.active.userId):null;
    const follow=['follow','followPlayer'].includes(mode)||mode==='giftFocus'&&t-this.modeSince<3000;
    if(!player&&follow)player=players.find(p=>p.userId===options.userId)??players[0];
    if(!player&&battle?.view&&mode==='auto'&&Math.floor(seconds/12)%3===1)player=players[Math.floor(seconds/12)%Math.max(1,players.length)];
    this.followed=player?.userId;
    if(player){const elevation=player.elevation??.3;this.desired.set(player.x+5,elevation+6.7,player.z+9);this.look.set(player.x,elevation+.7,player.z);}
    else{this.desired.copy(SECT_CAMERA_ANCHOR.position);this.look.copy(SECT_CAMERA_ANCHOR.target);if(mode==='orbit')this.desired.x+=Math.sin(seconds*.1)*.7;}
    if(battle?.view){
      const f=battle.view,boss=f.activeBoss,age=battle.elapsedMs-(battle.focusAt??battle.viewSince),top=players.find(p=>p.userId===f.top?.[0]?.userId);
      if(battle.focusReason==='death'&&age<3000&&(!player||this.settings.priorities.result>=(this.active?.priority??0))){this.desired.set(12,18,24);this.look.set(0,1,0);this.followed=null;}
      else if(player&&((this.active?.priority??0)>=this.settings.priorities.gift||follow)&&!(boss?.type===2&&boss.status==='alive'&&this.settings.priorities.boss>=(this.active?.priority??0))){this.desired.set(player.x+6,8,player.z+11);this.look.set(player.x,1,player.z);}
      else if(boss?.status==='alive'&&(mode==='followBoss'||boss.type===2||age<5000||!top)){this.desired.set(boss.x+9,boss.enraged?8:11,boss.z+15);this.look.set(boss.x,2.5,boss.z);this.followed=null;}
      else if(top){this.desired.set(top.x+6,8,top.z+11);this.look.set(top.x,1,top.z);this.followed=top.userId;}
      else{this.desired.set(15,20,25);this.look.set(0,1,0);}
    }else if(ceremony&&(!this.active||this.settings.priorities.result>=this.active.priority)){player=players.find(p=>p.userId===ceremony.userId);this.desired.copy(SECT_CAMERA_ANCHOR.position);this.look.copy(SECT_CAMERA_ANCHOR.target);this.followed=player?.userId;}
    else if(mode==='breakthrough'){this.desired.copy(SECT_CAMERA_ANCHOR.position);this.look.copy(SECT_CAMERA_ANCHOR.target);}
    else if(result?.remainingMs>9000){this.desired.copy(SECT_CAMERA_ANCHOR.position);this.look.copy(SECT_CAMERA_ANCHOR.target);}
    this.desired.y=Math.max(7,this.desired.y);this.desired.z=Math.max(6,this.desired.z);const alpha=1-Math.exp(-Math.max(0,Math.min(.1,dt))*1.5);this.camera.position.lerp(this.desired,alpha);this.target.lerp(this.look,alpha);this.camera.lookAt(this.target);
  }
}
