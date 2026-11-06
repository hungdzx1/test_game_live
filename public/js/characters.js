import * as THREE from 'three';
import { mesh, label } from './primitives.js';
import {RealmAura} from './realmAura.js';
import {appearanceFor,colorsFor,rigPart,part,discipleTorso,discipleHead,discipleHair,discipleSkirt,discipleArm,weaponParts} from './proceduralCostumes.js';
function nameTag(text){
  const tag=label(text,512,64,40),ctx=tag.material.map.image.getContext('2d');ctx.fillStyle='#cdb577';
  for(const x of [0,494]){ctx.fillRect(x,0,18,2);ctx.fillRect(x,62,18,2);}ctx.fillRect(0,0,2,64);ctx.fillRect(510,0,2,64);return tag;
}
export class CharacterView {
  constructor(scene,p){
    this.appearance=appearanceFor(p.seed);const a=this.appearance,[coat,inner,gold]=colorsFor(a),style=`${a.robe}:${a.palette}`,headStyle=`${a.hair}:${a.hairTone}`;
    this.root=new THREE.Group();this.root.name='disciple:'+p.userId;this.body=new THREE.Group();this.root.add(this.body);scene.add(this.root);this.root.position.set(p.x,p.elevation??.3,p.z);
    rigPart(this.body,'disciple-torso:'+style,()=>discipleTorso(a));
    this.skirt=rigPart(this.body,'disciple-skirt:'+style,()=>discipleSkirt(a));this.skirt.position.y=.6;
    this.head=rigPart(this.body,'disciple-head:'+headStyle,()=>discipleHead(a));this.head.position.set(0,1.96,.01);this.fullHead=this.head.geometry;
    const coarse=rigPart(this.body,'disciple-head-low:'+headStyle,()=>discipleHead(a,true));this.simpleHead=coarse.geometry;this.body.remove(coarse);
    this.hair=rigPart(this.body,'disciple-hair:'+headStyle,()=>discipleHair(a));this.hair.position.set(0,1.94,-.15);
    this.arms=[];this.legs=[];this.knees=[];this.tails=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.34,1.55,0);this.body.add(arm);rigPart(arm,'disciple-arm:'+style,()=>discipleArm(a,side));this.arms.push(arm);
      const leg=new THREE.Group();leg.position.set(side*.16,.9,0);this.body.add(leg);
      rigPart(leg,'disciple-thigh:'+a.palette,()=>[part('cylinder',inner,[0,-.2,0],[.12,.4,.12])]);
      const knee=new THREE.Group();knee.position.y=-.38;leg.add(knee);
      rigPart(knee,'disciple-shin:'+a.palette,()=>[part('cylinder',coat,[0,-.18,0],[.11,.36,.11]),part('box','#26384e',[0,-.36,.07],[.19,.13,.3])]);
      this.legs.push(leg);this.knees.push(knee);
      const tail=rigPart(this.body,`disciple-tail:${style}:${side}`,()=>[part('box',coat,[side*.05,-.4,-.03],[.18,.82,.035],[.1,0,side*.1]),part('box',gold,[side*.05,-.4,0],[.025,.82,.02],[.1,0,side*.1])]);tail.position.set(side*.24,.98,-.2);this.tails.push(tail);
    }
    this.detail=rigPart(this.body,'disciple-ornament:'+style,()=>[part('sphere',gold,[0,1.03,.26],[.065,.07,.025]),part('box',inner,[-.16,1.33,.24],[.035,.5,.035],[0,0,.35]),part('box',gold,[.31,1.58,0],[.17,.04,.27])]);
    this.weapon=rigPart(this.arms[1],'disciple-weapon:'+a.weapon,()=>weaponParts(a.weapon));this.weapon.position.set(0,-.6,.03);
    this.stowed=rigPart(this.body,'disciple-scabbard:'+a.palette,()=>[part('box','#26384e',[-.15,1.12,-.28],[.07,1.15,.06],[0,0,-.3]),part('box',gold,[-.33,1.69,-.28],[.2,.05,.06],[0,0,-.3])]);
    this.aura=mesh(this.root,'ring',coat,[0,.08,0],[.66,.66,.66],true);this.aura.rotation.x=-Math.PI/2;
    this.realmAura=new RealmAura(this.root);this.labelText=p.realm?`${p.name} · ${p.realm}`:p.name;
    this.tag=nameTag(this.labelText);this.tag.name='disciple-name';this.tag.position.set(0,2.4,0);this.tag.scale.set(1.85,.23,1);this.root.add(this.tag);this.showLabel=true;
  }
  update(p,time,dt,camera=null,focused=false){
    const t=time/1000+(p.index??0),a=p.animation,local=Math.max(0,(time-(p.animationStartMs??0))/1000),smooth=1-Math.exp(-dt*9);
    this.root.position.x+=(p.x-this.root.position.x)*smooth;this.root.position.z+=(p.z-this.root.position.z)*smooth;this.root.position.y+=((p.elevation??.3)-this.root.position.y)*smooth;
    const sit=a==='meditate'?1:a==='standUp'?Math.max(0,1-local/1.5):0;
    this.body.position.y=-.4*sit+Math.sin(t*2)*.015;this.head.rotation.y=Math.sin(t*.5)*.08;
    this.skirt.scale.y=1-.55*sit;this.skirt.position.y=.6+.15*sit;
    this.root.scale.setScalar(a==='teleport'?Math.min(1,.1+local*.8):1);
    for(let i=0;i<2;i++){
      const side=i?1:-1;
      this.legs[i].rotation.set(-1.35*sit,side*.35*sit,side*.95*sit);this.knees[i].rotation.set(1.8*sit,side*.65*sit,0);
      this.arms[i].rotation.set(-.85*sit,0,-side*.6*sit);
      if(a==='walk'||a==='run'){const rate=a==='run'?11:7,amplitude=a==='run'?.85:.55;this.legs[i].rotation.x=Math.sin(t*rate+i*Math.PI)*amplitude;this.arms[i].rotation.x=-Math.sin(t*rate+i*Math.PI)*amplitude;this.body.rotation.x=a==='run'?.12:0;}
      if(a==='celebrate')this.arms[i].rotation.z=side*(2.5+Math.sin(t*9)*.15);
      this.tails[i].rotation.set(-.25*sit+Math.sin(t*1.8+i)*.12,side*.08,Math.sin(t*1.3+i)*.08);
    }
    this.body.rotation.set(a==='run'?.12:0,p.facing??0,0);
    if(a==='fly'){this.root.position.y+=.6*smooth;for(let i=0;i<2;i++)this.arms[i].rotation.z=(i?1:-1)*1.1;}
    if(a==='attack')this.arms[1].rotation.x=-1.2+Math.sin(local*9)*1.2;
    if(a==='bow'){this.body.rotation.x=.7;for(const arm of this.arms)arm.rotation.x=-.9;}
    if(a==='defeated'){this.body.rotation.z=Math.PI/2;this.body.position.y=-.1;}
    if(a==='cast')for(let i=0;i<2;i++){this.arms[i].rotation.x=-1.8;this.arms[i].rotation.z=(i?1:-1)*.35;}
    if(a==='hit'){this.body.position.y=-.4;this.body.rotation.x=.45;this.body.rotation.z=Math.sin(t*10)*.04;this.legs[0].rotation.x=this.legs[1].rotation.x=-1.3;}
    const distance=camera?Math.hypot(p.x-camera.position.x,(p.elevation??.3)-camera.position.y,p.z-camera.position.z):0;
    this.detailed=focused||(a==='cast'&&(p.elevation??0)>1)||!this.low&&distance<25;
    this.head.geometry=this.detailed?this.fullHead:this.simpleHead;this.hair.visible=this.detail.visible=this.detailed;
    this.hair.rotation.x=Math.sin(t*1.6)*.12;this.hair.rotation.z=Math.sin(t*1.1)*.08;
    for(const tail of this.tails)tail.visible=this.detailed;
    this.weapon.visible=['attack','cast','fly','celebrate'].includes(a);this.stowed.visible=this.detailed&&!this.weapon.visible;
    this.aura.rotation.z=t*.4;this.aura.scale.setScalar((a==='celebrate'?1+Math.sin(local*6)*.15:.66+sit*.1)*(1+(p.realmIndex??0)*.035));
    this.realmAura.update(p.realmIndex??0,t,this.low===true||!this.detailed);
    const text=p.realm?`${p.name} · ${p.realm}`:p.name;
    if(text!==this.labelText){this.labelText=text;const next=nameTag(text);this.tag.material.map.dispose();this.tag.material.dispose();this.tag.material=next.material;}
    this.tag.position.y=2.4-.4*sit;this.tag.scale.set(focused?2.2:1.85,focused?.3:.23,1);this.tag.material.opacity=focused?1:Math.max(.35,Math.min(.9,1-distance/100));this.tag.visible=focused||this.showLabel;
  }
  dispose(scene){scene.remove(this.root);this.tag.material.map.dispose();this.tag.material.dispose();}
}
export class CharacterManager {
  constructor(scene){this.scene=scene;this.views=new Map();this.players=[];this.limit=60;this.nextSelection=0;}
  sync(players){this.players=players;const ids=new Set(players.map(p=>p.userId));for(const [id,v] of this.views)if(!ids.has(id)){v.dispose(this.scene);this.views.delete(id);}this.nextSelection=0;}
  update(time,dt,camera,focused){
    if(time>=this.nextSelection){
      this.nextSelection=time+1000;
      const focus=this.players.find(p=>p.userId===focused);
      // In the courtyard, focus swaps the occupant of one illustrative seat.
      // Battle snapshots have no sectVisible flag and retain the original LOD.
      const candidates=this.players.filter(p=>p.sectVisible===undefined||p===focus||p.sectVisible&&(focus?.sectSlot===undefined||p.sectSlot!==focus.sectSlot));
      const chosen=candidates.sort((a,b)=>(a.userId===focused?-1:b.userId===focused?1:((a.x-camera.position.x)**2+(a.z-camera.position.z)**2)-((b.x-camera.position.x)**2+(b.z-camera.position.z)**2))).slice(0,this.limit);
      const ids=new Set(chosen.map(p=>p.userId));
      for(const [id,v] of this.views)if(!ids.has(id)){v.dispose(this.scene);this.views.delete(id);}
      for(const p of chosen)if(!this.views.has(p.userId))this.views.set(p.userId,new CharacterView(this.scene,p));
    }
    let labels=0;for(const p of this.players){const v=this.views.get(p.userId);if(v){v.low=this.limit<=40;v.showLabel=p.userId===focused||labels++<8;v.update(p,time,dt,camera,p.userId===focused);}}
  }
}
