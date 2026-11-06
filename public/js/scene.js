import * as THREE from 'three';
import {mesh,geometry,material,label} from './primitives.js';
import {SECT_COURTYARD_CENTER as C,SECT_CAMERA_ANCHOR,SECT_SEATS,sectSeat} from './sectLayout.js';

// Batch architecture once; animated objects stay separate. Shared primitives are
// retained, never disposed on phase changes or allocated in the render loop.
function batchArchitecture(group){
  group.updateMatrixWorld(true);const batches=new Map();
  for(const child of [...group.children]){
    if(!child.isMesh)continue;
    const key=child.geometry.uuid+child.material.uuid;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(child);
  }
  for(const parts of batches.values()){
    const first=parts[0],batch=new THREE.InstancedMesh(first.geometry,first.material,parts.length);
    parts.forEach((part,i)=>{batch.setMatrixAt(i,part.matrix);group.remove(part);});
    batch.castShadow=first.castShadow;batch.receiveShadow=true;batch.computeBoundingSphere();group.add(batch);
  }
}

export function createWorld(host){
  const scene=new THREE.Scene();scene.background=new THREE.Color('#122039');scene.fog=new THREE.Fog('#243d5b',75,155);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(45,9/16,.1,200),anchor=SECT_CAMERA_ANCHOR;
  camera.position.copy(anchor.position);camera.lookAt(anchor.target.x,anchor.target.y,anchor.target.z);
  scene.add(new THREE.HemisphereLight('#b7d7ff','#26364b',1.8));
  const sun=new THREE.DirectionalLight('#ffe2b6',2.6);sun.position.set(10,30,16);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:95});sun.shadow.bias=-.001;scene.add(sun);
  const architecture=new THREE.Group();architecture.name='sect-architecture';scene.add(architecture);
  const stone='#526d85',edge='#93acba',roofColor='#334674',gold='#d8b56f',wood='#354358';
  const build=(kind,color,p,s,glow=false)=>mesh(architecture,kind,color,p,s,glow);
  // Continuous curved roof, generated once and instanced at different sizes.
  const roofGeometry=new THREE.BufferGeometry(),roofVertices=[];
  const roofHeight=(x,z)=>.4-.7*Math.abs(z*2)+.45*(z*2)**2+.09*(x*2)**4;
  for(let ix=0;ix<8;ix++)for(let iz=0;iz<10;iz++){
    const x=ix/8-.5,z=iz/10-.5,dx=1/8,dz=1/10;
    for(const [px,pz]of [[x,z],[x,z+dz],[x+dx,z],[x+dx,z],[x,z+dz],[x+dx,z+dz]])roofVertices.push(px,roofHeight(px,pz),pz);
  }
  roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));roofGeometry.computeVertexNormals();
  // A round, open courtyard. No gate, tree or wall crosses its foreground.
  build('cone','#22384e',[C.x,-4.3,C.z],[8.5,8,8.5]).rotation.z=Math.PI;
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;build('cone',i%2?'#2b455d':'#344f68',[C.x+Math.sin(a)*6,-2.5-i%3*.4,C.z+Math.cos(a)*6],[1.8,4+i%3,1.8]).rotation.z=Math.PI;}
  build('cylinder',edge,[C.x,-.55,C.z],[8.3,.55,8.3]);
  build('cylinder',stone,[C.x,-.2,C.z],[8.1,.3,8.1]);
  for(let x=-7.5;x<=7.5;x+=1.1)for(let z=-7.5;z<=7.5;z+=1.1)if(x*x+z*z<58)build('box','#5f788e',[C.x+x,.015,C.z+z],[1.04,.05,1.04]);
  for(let i=0;i<32;i++){
    const a=i*Math.PI/16,x=C.x+Math.sin(a)*7.85,z=C.z+Math.cos(a)*7.85;
    const rim=build('box',i%4===0?gold:edge,[x,.08,z],[.7,.12,.28]);rim.rotation.y=a;
  }
  const rings=[];
  for(const [r,color]of [[2.7,'#74e6dc'],[3.15,'#c1a8ff'],[3.5,'#6de4ed']]){const ring=mesh(scene,'ring',color,[C.x,.13,C.z],[r,r,r],true);ring.rotation.x=-Math.PI/2;rings.push(ring);}
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const mark=build('box',gold,[C.x+Math.sin(a)*3.8,.12,C.z+Math.cos(a)*3.8],[.12,.06,.45],true);mark.rotation.y=a;
  }
  for(let i=0;i<SECT_SEATS;i++){
    const p=sectSeat(i);build('cylinder','#2d4a62',[p.x,.12,p.z],[.68,.22,.68]);
    build('cylinder','#9aaab5',[p.x,.24,p.z],[.59,.04,.59]);
  }
  function roof(x,y,z,w,d){
    const surface=new THREE.Mesh(roofGeometry,material(roofColor));surface.position.set(x,y,z);surface.scale.set(w,d,d);surface.castShadow=true;architecture.add(surface);
    for(const side of [-1,1])for(let i=0;i<10;i++){
      const z1=i/10-.5,z2=(i+1)/10-.5,h1=roofHeight(side*.5,z1)*d,h2=roofHeight(side*.5,z2)*d;
      const trim=build('box',gold,[x+side*w/2,y+(h1+h2)/2+.03,z+(z1+z2)*d/2],[.065,.07,Math.hypot(d/10,h2-h1)]);trim.rotation.x=-Math.atan2(h2-h1,d/10);
    }
    for(const side of [-1,1])for(let i=0;i<8;i++){
      const x1=i/8-.5,x2=(i+1)/8-.5,h1=roofHeight(x1,side*.5)*d,h2=roofHeight(x2,side*.5)*d;
      const trim=build('box',gold,[x+(x1+x2)*w/2,y+(h1+h2)/2+.03,z+side*d/2],[Math.hypot(w/8,h2-h1),.07,.065]);trim.rotation.z=Math.atan2(h2-h1,w/8);
    }
    build('box',gold,[x,y+.4*d+.04,z],[w+.15,.12,.12]);
  }
  function lantern(x,y,z){
    build('box',gold,[x,y+.5,z],[.5,.08,.5]);build('sphere','#ffcf83',[x,y,z],[.23,.36,.23],true);build('box',gold,[x,y-.5,z],[.04,.3,.04]);
  }
  // Hall behind the left shoulder of the courtyard, with an open stairway.
  const hx=-7.1,hz=-5.2;
  build('box',edge,[hx,.25,hz],[7.7,.7,4.7]);
  for(let i=0;i<4;i++)build('box',stone,[hx,.08+i*.13,hz+3.4-i*.38],[4.8,.17,.65]);
  build('box',wood,[hx,2.05,hz-.85],[6.9,3,.3]);
  for(const x of [-2.2,0,2.2]){
    build('box','#c99b5b',[hx+x,2.2,hz-.63],[1.6,1.65,.08]);
    build('box','#ffd78e',[hx+x,2.2,hz-.56],[1.35,1.4,.04],true);
    for(const dx of [-.45,0,.45])build('box',wood,[hx+x+dx,2.2,hz-.52],[.06,1.5,.05]);
    build('box',wood,[hx+x,2.2,hz-.5],[1.45,.07,.05]);
  }
  for(const x of [-3,-1,1,3]){
    build('box','#56647b',[hx+x,2,hz+1.7],[.25,3.4,.25]);
    build('box',gold,[hx+x,.8,hz+1.7],[.36,.18,.36]);
    build('box',gold,[hx+x,3.45,hz+1.7],[.36,.18,.36]);
  }
  roof(hx,2.9,hz,8.7,5.4);roof(hx,4.8,hz-.2,5.5,3.4);
  lantern(hx-2.8,2.8,hz+2);lantern(hx+2.8,2.8,hz+2);
  build('box','#645281',[hx,2,hz+1.9],[1.1,2.5,.07]);
  for(const dx of [-.52,.52])build('box',gold,[hx+dx,2,hz+1.96],[.04,2.5,.04]);
  build('box',gold,[hx,2.15,hz+1.98],[.5,.5,.04]).rotation.z=Math.PI/4;
  const hallSign=label('THANH VÂN MÔN');hallSign.position.set(hx,3.4,hz+2);hallSign.scale.set(3.5,.52,1);architecture.add(hallSign);
  // A small entrance off to the left, and a stone bridge towards the upper isle.
  for(const x of [-12,-9.6])build('box',wood,[x,1.35,1.1],[.3,2.9,.3]);
  roof(-10.8,2.75,1.1,3.5,1.8);
  for(let i=0;i<12;i++){
    const x=-.6+i*.37,z=-2.8-i*.39,y=.28+i*.22;
    const step=build('box',stone,[x,y,z],[1.9,.2,.58]);step.rotation.y=-.75;
    for(const side of [-1,1])build('cylinder',edge,[x+side*.68,y+.45,z+side*.64],[.055,.9,.055]);
  }
  // Low railings only along the rear edge; front silhouettes stay unobstructed.
  for(let i=0;i<10;i++){
    const a=Math.PI*.6+i*Math.PI*.8/9,x=C.x+Math.sin(a)*8,z=C.z+Math.cos(a)*8;
    build('cylinder',edge,[x,.55,z],[.09,1,.09]);const rail=build('box',edge,[x,.92,z],[1.7,.09,.09]);rail.rotation.y=a;
  }
  function floweringTree(x,y,z,size){
    const trunk=build('cylinder','#4a465a',[x,y+size,z],[.15,size*2,.15]);trunk.rotation.z=-.15;
    for(let i=0;i<9;i++){
      const a=i*2.4,r=(i%3)*.36;
      build('sphere',i%2?'#ba83ad':'#d5a1be',[x+Math.cos(a)*r*size,y+size*2+Math.sin(i*3)*.3,z+Math.sin(a)*r*size],[size*.75,size*.4,size*.6]);
    }
  }
  floweringTree(-10.6,.3,-.7,1.5);floweringTree(-9.8,.7,-8.2,1.4);
  for(let i=0;i<3;i++){build('cylinder',wood,[-11.3,1+i*1.5,-9.5],[.9,1.4,.9]);roof(-11.3,1.5+i*1.5,-9.5,2.8-i*.3,2.2);}
  // Mountains, remote isles and a moon are all real procedural geometry.
  const mountainGeometry=new THREE.CylinderGeometry(.3,1,1,5);
  for(let i=0;i<16;i++){
    const mountain=new THREE.Mesh(mountainGeometry,material(i%2?'#243b59':'#304e6c'));mountain.position.set((i-7)*7,-6,-32-i%3*8);mountain.scale.set(4+i%3,18+i%4*4,5);mountain.rotation.z=(i%3-1)*.08;architecture.add(mountain);
    build('cylinder','#49656d',[(i-7)*7,3+i%4*2,-32-i%3*8],[1.1,.1,1.4]);
  }
  for(const [x,y,z,r]of [[-15,3,-18,2.4],[12,1,-21,2],[17,-2,-14,1.5]]){build('cone','#2d4860',[x,y-2,z],[r,4,r]).rotation.z=Math.PI;build('cylinder',stone,[x,y,z],[r,.25,r]);}
  build('sphere','#d3dcda',[6,17,-38],[2.3,2.3,2.3],true);
  // Small instanced stars rather than dozens of individual draw calls.
  for(let i=0;i<45;i++)build('sphere','#94c7df',[-28+(i*13.3)%56,9+(i*7.7)%21,-42],[.025,.025,.025],true);
  batchArchitecture(architecture);
  const clouds=[];
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,r=15+i%3*2;
    clouds.push(mesh(scene,'sphere','#536f8a',[Math.cos(a)*r,-6-i%3,Math.sin(a)*r-6],[3.5,.8,2.1]));
  }
  const waterfalls=[];
  for(let i=0;i<3;i++)waterfalls.push(mesh(scene,'box',i%2?'#a8e1ed':'#508fae',[C.x-6.3+i*.3,-5,C.z+2],[.32,10+i*.5,.12],true));
  const swords=[];
  for(let i=0;i<3;i++){const sword=mesh(scene,'box','#a5dfec',[-5+i*2.1,4.7,-.6],[.07,.08,1.4],true);swords.push(sword);}
  const petals=[];
  for(let i=0;i<10;i++)petals.push(mesh(scene,'sphere','#edbad5',[-10+(i%4)*.65,1+i*.31,-1+i%3],[.05,.025,.09]));
  const dawn=new THREE.Color('#122039'),dusk=new THREE.Color('#282442');
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host);resize();
  return {scene,camera,renderer,
    mood(finalBoss){sun.color.set(finalBoss?'#f5a9d5':'#ffe2b6');},
    quality(level,display={}){renderer.setPixelRatio(Math.min(devicePixelRatio,level==='low'?1:level==='high'?2:1.5));sun.castShadow=level!=='low'&&display.shadows!==false;renderer.shadowMap.enabled=sun.castShadow;sun.intensity=2.6*(display.lightIntensity??1);resize();},
    update(t){
      clouds.forEach((c,i)=>{c.position.x=Math.cos(i*Math.PI/6)*(15+i%3*2)+Math.sin(t*.07+i)*.6;});
      swords.forEach((s,i)=>{s.position.y=4.7+Math.sin(t+i)*.22;s.rotation.y=t*.15;});
      rings.forEach((r,i)=>{r.rotation.z=t*.06*(i%2?-1:1);});
      waterfalls.forEach((w,i)=>{w.scale.x=.28+Math.sin(t*2+i)*.04;});
      petals.forEach((p,i)=>{p.position.y=1+(i*.31+t*.13)%3;p.position.x=-10+i%4*.65+Math.sin(t*.4+i)*.35;});
      scene.background.copy(dawn).lerp(dusk,(Math.sin(t/90)+1)/2);sun.position.x=10+Math.sin(t/90)*4;
    }
  };
}
