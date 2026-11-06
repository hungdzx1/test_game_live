import * as THREE from 'three';
import {mesh,material,label} from './primitives.js';
export const FIELD_COLORS=['#68717a','#3f91b9','#58a88b','#d7ad50','#a578cf','#81aacd','#6566ad','#c77799','#e96d47','#8290df','#dcbb68'];
export class EnemyView{
  constructor(parent,type,boss=false){
    this.root=new THREE.Group();parent.add(this.root);this.body=new THREE.Group();this.root.add(this.body);this.type=type;this.boss=boss;this.id=null;
    const color=boss?['#262b3e','#ae3148','#64349e'][type]:['#333f52','#9b6bca','#757b85'][type];
    this.arms=[];
    if(type===1&&!boss){
      mesh(this.body,'sphere',color,[0,1.2,0],[.5,.65,.4],true);mesh(this.body,'cone',color,[0,.6,0],[.45,1,.35],true);
    }else{
      mesh(this.body,type===2?'box':'cone',color,[0,.9,0],[type===2?.9:.65,1.25,.55]);
      mesh(this.body,type===2?'box':'sphere',color,[0,1.7,0],[.4,.42,.35]);
      for(const side of [-1,1]){
        mesh(this.body,'cone',boss&&type===2?'#ee91ff':'#b5a6ae',[side*.32,2.15,0],[.13,.55,.14],boss&&type===2);
        const arm=new THREE.Group();arm.position.set(side*.65,1.25,0);this.body.add(arm);mesh(arm,'box',color,[0,-.3,0],[type===2?.45:.25,.8,.3]);this.arms.push(arm);
        mesh(this.body,'box',color,[side*.28,.15,0],[.3,.45,.4]);
      }
    }
    for(const x of [-.14,.14])mesh(this.body,'sphere',boss&&type===2?'#d899ff':'#ff5a66',[x,1.75,.34],[.07,.07,.04],true);
    if(boss){
      if(type===0){mesh(this.arms[1],'cylinder','#a39488',[0,-.1,.6],[.06,2,.06]);mesh(this.arms[1],'box','#a4abb8',[0,.7,.6],[.9,.5,.15]);}
      if(type===1){mesh(this.arms[1],'box','#ff5768',[0,-.2,.9],[.16,.15,2.1],true);mesh(this.body,'cone','#4d182a',[0,.9,-.4],[1,1.7,.18]);}
      if(type===2){for(let i=0;i<5;i++)mesh(this.body,'cone','#bc8afa',[(i-2)*.18,2.3,0],[.1,.45+Math.abs(i-2)*.1,.1],true);this.halo=mesh(this.body,'ring','#b476ff',[0,1,-.3],[1.4,1.4,1.4],true);}
    }
    this.baseScale=boss?2.25:1;this.root.scale.setScalar(this.baseScale);
    mesh(this.root,'box','#302936',[0,2.65,0],[1.1,.1,.08]);this.hp=mesh(this.root,'box',boss?'#ee7481':'#9bd69c',[0,2.65,.05],[1.1,.1,.08]);
    this.root.visible=false;
  }
  update(data,t,dt){
    if(this.id!==data.id){this.id=data.id;this.root.position.set(data.x,.2,data.z);}
    this.root.visible=true;const alpha=1-Math.exp(-dt*10);this.root.position.x+=(data.x-this.root.position.x)*alpha;this.root.position.z+=(data.z-this.root.position.z)*alpha;
    this.root.position.y=.2+(!this.boss&&this.type===1?Math.sin(t*3+data.spawnTime)*.3:0);this.body.rotation.y=data.facing??0;
    this.body.rotation.z=data.animation==='hit'?Math.sin(t*30)*.13:0;
    for(let i=0;i<this.arms.length;i++)this.arms[i].rotation.x=data.animation==='attack'?-1+Math.sin(t*10+i)*1.2:data.animation==='cast'?-2:Math.sin(t*5+i*3)*.15;
    if(this.halo){this.halo.rotation.z=t*(data.enraged?3:1);this.halo.scale.setScalar(data.enraged?1.8:1.4);}
    this.root.scale.setScalar(this.baseScale*(data.status==='dead'?Math.max(.01,1-(t*1000-data.deathAt)/800):data.enraged?1.12:1));
    this.hp.scale.x=1.1*Math.max(0,data.hp/data.maxHp);this.hp.position.x=-(1.1-this.hp.scale.x)/2;
  }
}
export class BattleScene{
  constructor(scene){
    this.root=new THREE.Group();this.root.visible=false;scene.add(this.root);this.low=false;this.fieldId=null;
    this.floor=mesh(this.root,'cylinder','#343948',[0,-.5,0],[15,1,15]);
    this.rune=mesh(this.root,'ring','#68717a',[0,.03,0],[10,10,10],true);this.rune.rotation.x=-Math.PI/2;
    for(let i=0;i<22;i++){const a=i/22*Math.PI*2;const rock=mesh(this.root,'box','#484651',[Math.cos(a)*14,.3+(i%3)*.3,Math.sin(a)*14],[1+(i%3)*.4,1+(i%4)*.5,1]);rock.rotation.y=a;}
    // Portal, crystals, floating islands and fissures are procedural, toggled by realm.
    this.portal=mesh(this.root,'ring','#9762d1',[0,3,-12],[3,3,3],true);
    this.decor=[];for(let i=0;i<11;i++){
      const group=new THREE.Group();this.root.add(group);this.decor.push(group);
      for(let j=0;j<8;j++){const a=j/8*Math.PI*2,r=11+(j%2);const m=mesh(group,i===7||i===10?'sphere':i===8?'box':'cone',FIELD_COLORS[i],[Math.cos(a)*r,i===7||i===10?3+(j%3):i===8?.04:1,Math.sin(a)*r],[i===8?2.5:.4,i===8?.035:1+(j%3)*.6,i===8?.15:.5],i>=4||i===2);m.rotation.z=i===8?a:0;}
    }
    this.pools=[0,1,2].map(type=>Array.from({length:20},()=>new EnemyView(this.root,type)));
    this.bosses=[0,1,2].map(type=>new EnemyView(this.root,type,true));
    this.fx=Array.from({length:12},()=>{
      const group=new THREE.Group();this.root.add(group);group.visible=false;
      const ring=mesh(group,'ring','#c3a0ff',[0,.1,0],[1,1,1],true);ring.rotation.x=-Math.PI/2;
      const slash=mesh(group,'box','#9eeefa',[0,1,0],[2,.05,.15],true);
      const bolts=[];for(let i=0;i<6;i++){const m=mesh(group,'box','#c4ccff',[(i%2)*.22,1+i*.85,0],[.08,1,.08],true);m.rotation.z=i%2?.35:-.35;bolts.push(m);}
      const meteor=mesh(group,'sphere','#b78aff',[0,6,0],[.5,.5,.5],true);
      const text=label('',256,64);text.scale.set(2,.5,1);text.position.y=2.5;group.add(text);
      return {group,ring,slash,bolts,meteor,text,until:0,start:0};
    });this.nextFx=0;this.field=null;
  }
  sync(state){
    const active=state.effectivePhase==='battle'&&state.battle?.status==='running';this.root.visible=active;this.field=active?state.battle.view:null;
    if(this.fieldId!==this.field?.id){this.fieldId=this.field?.id;for(const pool of this.pools)for(const view of pool)view.id=null;for(const fx of this.fx)fx.group.visible=false;}
    if(this.field){this.rune.material=material(FIELD_COLORS[this.field.id],true);this.portal.material=material(FIELD_COLORS[this.field.id],true);}
    this.decor.forEach((g,i)=>g.visible=i===this.fieldId);
  }
  event(e,now){
    if(!this.root.visible||e.fieldId!==this.fieldId||!['battle:hit','boss:skill'].includes(e.kind))return;
    const pool=this.low?this.fx.slice(0,4):this.fx,fx=pool[this.nextFx++%pool.length];fx.start=now;fx.until=now+900;fx.group.visible=true;fx.group.position.set(e.x??0,.1,e.z??0);fx.slash.visible=e.kind==='battle:hit'&&e.skill!=='2';fx.ring.visible=!!e.skill||e.kind==='boss:skill';fx.bolts.forEach(m=>m.visible=e.skill==='2');fx.meteor.visible=e.kind==='boss:skill'&&e.bossType===2;fx.area=e.kind==='boss:skill';
    fx.fromX=(e.fromX??e.x??0)-(e.x??0);fx.fromZ=(e.fromZ??e.z??0)-(e.z??0);
    fx.text.visible=!!e.damage&&this.showDamage!==false;if(fx.text.visible){const next=label(`−${e.damage}`,256,64);fx.text.material.map.dispose();fx.text.material.dispose();fx.text.material=next.material;}
  }
  update(time,dt,now){
    if(!this.root.visible)return;const f=this.field,t=time/1000;
    for(const pool of this.pools)for(const v of pool)v.root.visible=false;for(const v of this.bosses)v.root.visible=false;
    if(f){
      for(let type=0;type<3;type++){
        const mobs=f.mobs.filter(m=>m.type===type).slice(0,this.low?8:20),pool=this.pools[type];const used=new Set();
        for(const m of mobs){let view=pool.find(v=>v.id===m.id&&!used.has(v));if(!view)view=pool.find(v=>!used.has(v)&&!mobs.some(m=>m.id===v.id));if(!view)continue;used.add(view);view.update(m,t,dt);}
      }
      if(f.activeBoss&&['alive','dead'].includes(f.activeBoss.status))this.bosses[f.activeBoss.type].update(f.activeBoss,t,dt);
    }
    this.portal.rotation.z=t*.15;this.rune.rotation.z=t*.02;
    for(const fx of this.fx){if(now>=fx.until){fx.group.visible=false;continue;}if(!fx.group.visible)continue;const age=(now-fx.start)/900;fx.ring.scale.setScalar((fx.area?2:1)+age*(fx.area?6:2));fx.slash.rotation.y=Math.atan2(fx.fromX,fx.fromZ);fx.slash.position.x=fx.fromX*(1-age);fx.slash.position.z=fx.fromZ*(1-age);fx.meteor.position.y=7-age*7;fx.text.position.y=2+age*2;}
  }
}
