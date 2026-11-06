import * as THREE from 'three';
import { mesh, geometry, material, label } from './primitives.js';
export function createWorld(host) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#263c58'); scene.fog = new THREE.Fog('#486580',45,115);
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(45,9/16,.1,180);camera.position.set(25,29,43);
  scene.add(new THREE.HemisphereLight('#b6e6ff','#58415c',2));
  const sun = new THREE.DirectionalLight('#ffe3b2',3);sun.position.set(15,28,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:90});sun.shadow.bias=-.001;scene.add(sun);
  const island = mesh(scene,'cone','#344254',[0,-5,0],[16,10,16]);island.rotation.z=Math.PI;
  mesh(scene,'cylinder','#69788b',[0,-.45,0],[14,.9,14]);
  const tile = new THREE.InstancedMesh(geometry('box'),material('#738698'),400), dummy = new THREE.Object3D();let n=0;
  for(let x=-13;x<=13;x+=1.4)for(let z=-13;z<=13;z+=1.4)if(x*x+z*z<174){dummy.position.set(x,.02,z);dummy.scale.set(1.34,.09,1.34);dummy.updateMatrix();tile.setMatrixAt(n++,dummy.matrix);}tile.count=n;tile.receiveShadow=true;scene.add(tile);
  const rings=[];
  for(const r of [3.3,4,4.4]){const ring=mesh(scene,'ring','#57d9c4',[0,.16,1],[r,r,r],true);ring.rotation.x=-Math.PI/2;rings.push(ring);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(scene,'box','#d7b977',[Math.cos(a)*4.1,.17,1+Math.sin(a)*4.1],[.12,.08,.5],true).rotation.y=-a;}
  for(let i=0;i<30;i++)mesh(scene,'cylinder','#485e70',[(i%10-4.5)*1.75,.15,Math.floor(i/10)*3.8-4],[.65,.25,.65]);
  function roof(x,y,z,w,d){
    // Four rising strips on each side form a curved eave silhouette.
    for(let side of [-1,1])for(let k=0;k<4;k++){const part=mesh(scene,'box',k%2?'#755177':'#634469',[x+side*(k+.5)*w/8,y-.2*k+.09*k*k,z],[w/4+.1,.22,d]);part.rotation.z=side*(-.18+.12*k);}
    mesh(scene,'box','#cbaa74',[x,y+.18,z],[.15,.2,d+.4]);
  }
  mesh(scene,'box','#526174',[0,.55,-8.8],[10,1,4.5]);
  for(let i=0;i<4;i++)mesh(scene,'box','#95a2ae',[0,.14+i*.14,-5.7-i*.45],[5,.28+i*.28,.55]);
  mesh(scene,'box','#3c445b',[0,2.5,-9.7],[8,3.2,1]);
  for(const x of [-4,-2,2,4])for(const z of [-7.2,-10.2]){mesh(scene,'cylinder','#b37368',[x,2.3,z],[.18,3.6,.18]);mesh(scene,'cylinder','#dec28c',[x,.75,z],[.3,.18,.3]);}
  roof(0,4.5,-8.7,11,5.8);roof(0,5.7,-8.7,7,3.8);
  for(const x of [-3.8,3.8])mesh(scene,'sphere','#efb762',[x,3.4,-6.7],[.32,.46,.32],true);
  for(const x of [-3,3])mesh(scene,'cylinder','#885e69',[x,2.4,10],[.27,4.8,.27]);roof(0,4.9,10,7,1.5);
  const sign=label('THANH VÂN MÔN');sign.position.set(0,4.1,10);sign.scale.set(3,.65,1);scene.add(sign);
  for(let level=0;level<4;level++){mesh(scene,'cylinder','#8b8195',[-10,1+level*1.6,-5],[1.1,1.6,1.1]);roof(-10,2+level*1.6,-5,3.5,3.5);}
  for(const [x,z] of [[10,-6],[-10,3]]){mesh(scene,'cylinder','#685465',[x,2,z],[.5,4,.5]);for(let i=0;i<7;i++)mesh(scene,'sphere',i%2?'#4e9b90':'#679f9c',[x+Math.sin(i*2)*1.5,4+i%3*.6,z+Math.cos(i*2)*1.3],[1.8,1.2,1.6]);}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(scene,'cone','#6fc9d0',[Math.cos(a)*12,.6,Math.sin(a)*12],[.3,1.1,.3],true);}
  const swords=[];for(let i=0;i<5;i++){const g=new THREE.Group();g.position.set(-7+i*3.5,7,-4);mesh(g,'box','#c5e9ed',[0,0,0],[.12,1.8,.18]);mesh(g,'box','#d6b273',[0,-.65,0],[.7,.12,.2]);g.rotation.z=.5;scene.add(g);swords.push(g);}
  const clouds=[];for(let i=0;i<24;i++){const a=i*2.4,g=mesh(scene,'sphere','#97b6c7',[Math.sin(a)*(18+i%4*6),-3-i%3*1.7,Math.cos(a)*(18+i%4*6)],[5+i%3,1,2.8]);clouds.push(g);}
  for(let i=0;i<14;i++)mesh(scene,'cone','#465b78',[(i-7)*9,-8,-35-(i%3)*8],[5+i%3*2,13+i%4*5,5]);
  const water=mesh(scene,'box','#77d4df',[11,-5,3],[.9,10,.25],true);
  const resize = () => {const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
  const dawn=new THREE.Color('#263c58'), dusk=new THREE.Color('#65516b');
  return {scene,camera,renderer,mood(finalBoss){sun.color.set(finalBoss?'#f5a9d5':'#ffe3b2');},quality(level,display={}){renderer.setPixelRatio(Math.min(devicePixelRatio,level==='low'?1:level==='high'?2:1.5));renderer.shadowMap.enabled=level!=='low';sun.castShadow=level!=='low'&&display.shadows!==false;renderer.shadowMap.enabled=sun.castShadow;sun.intensity=3*(display.lightIntensity??1);resize();},update(t){for(let i=0;i<clouds.length;i++)clouds[i].position.x+=Math.sin(t*.1+i)*.001;for(let i=0;i<swords.length;i++){swords[i].position.y=7+Math.sin(t+i)*.3;swords[i].rotation.y=t*.25;}for(const r of rings)r.rotation.z=t*.08;water.scale.x=.9+Math.sin(t*3)*.08;const blend=(Math.sin(t/90)+1)*.5;scene.background.copy(dawn).lerp(dusk,blend);sun.position.x=15+Math.sin(t/90)*10;}};
}
