import * as THREE from 'three';
import { mesh, label } from './primitives.js';
import {RealmAura} from './realmAura.js';
const robes=['#59b6b3','#9c81c3','#d3aa6a','#618fbe','#ba718c','#7da674'];
export class CharacterView {
  constructor(scene,p){
    this.root=new THREE.Group();this.body=new THREE.Group();this.root.add(this.body);scene.add(this.root);this.root.position.set(p.x,.3,p.z);
    const color=robes[p.seed%robes.length];mesh(this.body,'cone',color,[0,.65,0],[.42,1.1,.38]);mesh(this.body,'cylinder','#d6bd83',[0,.75,0],[.33,.12,.31]);
    this.head=mesh(this.body,'sphere','#ecc4a9',[0,1.45,0],[.4,.42,.38]);mesh(this.head,'sphere','#29283d',[0,.48,-.22],[1,.6,.85]);mesh(this.head,'sphere','#29283d',[0,1,-.2],[.38,.36,.36]);
    if(p.seed%2)mesh(this.body,'box','#29283d',[0,1.2,-.3],[.5,.75,.12]);
    for(const x of [-.13,.13])mesh(this.body,'sphere','#1b2938',[x,1.47,.34],[.035,.05,.025]);
    this.arms=[];this.legs=[];
    for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.34,1,0);this.body.add(arm);mesh(arm,'cylinder',color,[side*.08,-.22,0],[.12,.5,.12]);mesh(arm,'sphere','#ecc4a9',[side*.08,-.5,0],[.12,.12,.12]);this.arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.18,.3,0);this.body.add(leg);mesh(leg,'box','#34364c',[0,-.12,0],[.18,.35,.18]);mesh(leg,'box','#d4c7ac',[0,-.27,.06],[.2,.12,.3]);this.legs.push(leg);}
    mesh(this.arms[1],'box',p.seed%3?'#bce9ec':'#e0bd76',[.08,-.6,.45],[.07,.08,p.seed%3?1.2:.7]);mesh(this.arms[1],'box','#e0bd76',[.08,-.6,.12],[.3,.12,.09]);
    this.aura=mesh(this.root,'ring',color,[0,.15,0],[.66,.66,.66],true);this.aura.rotation.x=-Math.PI/2;
    this.realmAura=new RealmAura(this.root);
    this.tag=label(p.name,256,64);this.tag.position.set(0,2.15,0);this.tag.scale.set(1.6,.4,1);this.root.add(this.tag);
  }
  update(p,time,dt){
    const t=time/1000+p.index, a=p.animation, local=Math.max(0,(time-p.animationStartMs)/1000), smooth=1-Math.exp(-dt*9);
    this.root.position.x+=(p.x-this.root.position.x)*smooth;this.root.position.z+=(p.z-this.root.position.z)*smooth;this.root.position.y+=((p.elevation??.3)-this.root.position.y)*smooth;
    const sit=a==='meditate'?1:a==='standUp'?Math.max(0,1-local/1.5):0;
    this.body.position.y=-.27*sit+Math.sin(t*2)*.025;this.head.rotation.y=Math.sin(t*.5)*.15;
    this.root.scale.setScalar(a==='teleport'?Math.min(1,.1+local*.8):1);
    for(let i=0;i<2;i++){const side=i?1:-1;this.legs[i].rotation.x=sit*-1.4;this.legs[i].rotation.z=side*sit*.6;this.arms[i].rotation.set(sit*-.7,0,side*-.15);if(a==='walk'){this.legs[i].rotation.x=Math.sin(t*7+i*Math.PI)*.55;this.arms[i].rotation.x=-Math.sin(t*7+i*Math.PI)*.65;}if(a==='celebrate')this.arms[i].rotation.z=side*(2.5+Math.sin(t*9)*.15);}
    if(a==='run')for(let i=0;i<2;i++){this.legs[i].rotation.x=Math.sin(t*11+i*Math.PI)*.85;this.arms[i].rotation.x=-Math.sin(t*11+i*Math.PI)*.9;}
    if(a==='fly'){this.root.position.y+=.6*smooth;for(let i=0;i<2;i++)this.arms[i].rotation.z=(i?1:-1)*1.1;}
    if(a==='attack')this.arms[1].rotation.x=-1.2+Math.sin(local*9)*1.2;
    this.body.rotation.z=0;this.body.rotation.x=0;this.body.rotation.y=p.facing??0;
    if(a==='bow'){this.body.rotation.x=.7;for(const arm of this.arms)arm.rotation.x=-.9;}
    if(a==='defeated'){this.body.rotation.z=Math.PI/2;this.body.position.y=-.1;}
    if(a==='cast'){for(let i=0;i<2;i++){this.arms[i].rotation.x=-1.8;this.arms[i].rotation.z=(i?1:-1)*.35;}this.aura.rotation.z=t;}
    if(a==='hit'){this.body.position.y=-.4;this.body.rotation.x=.45;this.body.rotation.z=Math.sin(t*10)*.04;this.legs[0].rotation.x=-1.3;this.legs[1].rotation.x=-1.3;}
    this.aura.rotation.z=t*.4;this.aura.scale.setScalar(a==='celebrate'?1+Math.sin(local*6)*.2:.66+sit*.15);
    this.aura.scale.multiplyScalar(1+(p.realmIndex??0)*.055);
    this.realmAura.update(p.realmIndex??0,t,this.low===true);
    const text=p.realm?`${p.name} · ${p.realm}`:p.name;
    if(text!==this.labelText){this.labelText=text;const next=label(text,512,64,48);this.tag.material.map.dispose();this.tag.material.dispose();this.tag.material=next.material;this.tag.scale.set(p.realm?2.5:1.6,.4,1);}
  }
  dispose(scene){scene.remove(this.root);this.tag.material.map.dispose();this.tag.material.dispose();}
}
export class CharacterManager {
  constructor(scene){this.scene=scene;this.views=new Map();this.players=[];this.limit=60;this.nextSelection=0;}
  sync(players){this.players=players;const ids=new Set(players.map(p=>p.userId));for(const [id,v] of this.views)if(!ids.has(id)){v.dispose(this.scene);this.views.delete(id);}this.nextSelection=0;}
  update(time,dt,camera,focused){
    if(time>=this.nextSelection){this.nextSelection=time+1000;const chosen=[...this.players].sort((a,b)=>(a.userId===focused?-1:b.userId===focused?1:((a.x-camera.position.x)**2+(a.z-camera.position.z)**2)-((b.x-camera.position.x)**2+(b.z-camera.position.z)**2))).slice(0,this.limit);const ids=new Set(chosen.map(p=>p.userId));for(const [id,v] of this.views)if(!ids.has(id)){v.dispose(this.scene);this.views.delete(id);}for(const p of chosen)if(!this.views.has(p.userId))this.views.set(p.userId,new CharacterView(this.scene,p));}
    for(const p of this.players){const v=this.views.get(p.userId);if(v){v.low=this.limit<=40;v.update(p,time,dt);}}
  }
}
