import * as THREE from 'three';
import { mesh } from './primitives.js';
export class Effects {
  constructor(scene){this.pool=[];for(let i=0;i<12;i++){const ring=mesh(scene,'ring','#8fe7da',[0,0,0],[1,1,1],true);ring.visible=false;this.pool.push({ring,end:0});}const positions=new Float32Array(600*3);for(let i=0;i<600;i++){positions[i*3]=Math.sin(i*12.7)*13;positions[i*3+1]=(i%71)/10;positions[i*3+2]=Math.cos(i*4.3)*13;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));this.particles=new THREE.Points(geo,new THREE.PointsMaterial({color:'#a2ebdb',size:.055,transparent:true,opacity:.65}));scene.add(this.particles);}
  trigger(p,t){const slot=this.pool.find(s=>s.end<t)||this.pool[0];slot.ring.position.set(p.x,(p.elevation??0)+1.2,p.z);slot.ring.visible=true;slot.end=t+2200;}
  item(p,kind,t){
    if(!this.itemPool){this.itemPool=[];for(let i=0;i<8;i++){const group=new THREE.Group();const cup=mesh(group,'cylinder','#e0b768',[0,0,0],[.28,.3,.28],true),pill=mesh(group,'sphere','#eacfff',[0,0,0],[.22,.22,.22],true),pillar=mesh(group,'cylinder','#83e4d6',[0,1,0],[.12,3,.12],true);this.particles.parent.add(group);this.itemPool.push({group,cup,pill,pillar,end:0});}}
    const slot=this.itemPool.find(s=>s.end<t)||this.itemPool[0];slot.group.position.set(p.x,(p.elevation??0)+1.5,p.z);slot.cup.visible=kind==='tea';slot.pill.visible=kind==='pill';slot.pillar.visible=['root','blessing','camera'].includes(kind);slot.end=t+2500;slot.group.visible=true;
  }
  quality(level,scale=1){this.particles.geometry.setDrawRange(0,Math.round((level==='low'?100:level==='high'?600:300)*scale));}
  update(t){this.particles.rotation.y=t*.00003;for(const s of this.pool){s.ring.visible=t<s.end;if(s.ring.visible){s.ring.scale.setScalar(1+(1-(s.end-t)/2200)*1.5);s.ring.rotation.z=t*.001;}}for(const s of this.itemPool??[]){s.group.visible=t<s.end;s.group.rotation.y=t*.003;}}
}
