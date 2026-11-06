import * as THREE from 'three';
import {mesh,label,geometry,material} from './primitives.js';
import {TRIBULATION_PLATFORM_CENTER} from './sectLayout.js';
// Preserve the existing import for consumers; there is just one coordinate source.
export const TRIBULATION=TRIBULATION_PLATFORM_CENTER;
export class BreakthroughScene {
  constructor(scene){
    this.group=new THREE.Group();this.group.name='tribulation-platform';this.group.position.copy(TRIBULATION);scene.add(this.group);
    mesh(this.group,'cylinder','#8b9eaf',[0,-.4,0],[4.25,.65,4.25]);
    mesh(this.group,'cylinder','#4b6584',[0,-.04,0],[3.95,.12,3.95]);
    const rock=mesh(this.group,'cone','#2c405e',[0,-2.4,0],[3.9,4,3.9]);rock.rotation.z=Math.PI;
    mesh(this.group,'cylinder','#d8bc7d',[0,.06,0],[1.3,.1,1.3]);
    mesh(this.group,'cylinder','#4c7489',[0,.13,0],[1.16,.04,1.16]);
    this.rings=[];for(const [radius,y] of [[1.5,.17],[2.5,.13],[3.8,.13],[4.3,-.5]]){const ring=mesh(this.group,'ring','#7cdbef',[0,y,0],[radius,radius,radius],true);ring.rotation.x=-Math.PI/2;this.rings.push(ring);}
    const dummy=new THREE.Object3D(),posts=new THREE.InstancedMesh(geometry('cylinder'),material('#abc3d4'),8);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;dummy.position.set(Math.sin(a)*3.65,.4,Math.cos(a)*3.65);dummy.scale.set(.1,.7,.1);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);}this.group.add(posts);
    for(const x of [-3,3]){
      mesh(this.group,'cylinder','#35435e',[x,.75,-1.7],[.16,1.4,.16]);
      mesh(this.group,'sphere','#ffcf83',[x,1.65,-1.7],[.22,.32,.22],true);
      mesh(this.group,'cone','#d8b56f',[x,2,-1.7],[.4,.22,.4]);
      mesh(this.group,'box','#70d1e8',[x,-3.1,1.7],[.36,5.5,.1],true);
    }
    mesh(this.group,'box','#645281',[0,-1.6,3.8],[.8,1.65,.06]);
    mesh(this.group,'box','#e1c780',[0,-1.6,3.85],[.35,.35,.04],true).rotation.z=Math.PI/4;
    this.beam=new THREE.Mesh(geometry('cylinder'),new THREE.MeshBasicMaterial({color:'#7ce5fa',transparent:true,opacity:.035,depthWrite:false}));this.beam.position.y=3.4;this.beam.scale.set(1.45,6.5,1.45);this.group.add(this.beam);
    const sign=label('ĐÀI ĐỘ KIẾP');sign.position.set(0,-.7,4);sign.scale.set(3.4,.55,1);this.group.add(sign);
    this.clouds=new THREE.Group();this.group.add(this.clouds);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;mesh(this.clouds,'sphere','#283044',[Math.sin(a)*2.8,7+i%2*.4,Math.cos(a)*2],[2,.6,1.5]);}
    const points=new Float32Array(9*3);for(let i=0;i<9;i++){points[i*3]=i===0||i===8?0:Math.sin(i*13)*.65;points[i*3+1]=7-i*.75;points[i*3+2]=Math.cos(i*4)*.25;}
    const lightningGeometry=new THREE.BufferGeometry();lightningGeometry.setAttribute('position',new THREE.BufferAttribute(points,3));this.lightning=new THREE.Line(lightningGeometry,new THREE.LineBasicMaterial({color:'#e7eeff'}));this.group.add(this.lightning);
    this.flash=new THREE.PointLight('#a3c9ff',0,20);this.flash.position.set(0,4,0);this.group.add(this.flash);this.clouds.visible=false;this.lightning.visible=false;this.low=false;this.shake=0;
  }
  update(active,result,offsetMs=0){
    this.beam.material.opacity=active?(this.low?.055:.09):.035;
    this.clouds.visible=!!active;this.lightning.visible=false;this.flash.intensity=0;this.shake=0;
    if(active){const elapsed=Math.min(active.durationMs,active.elapsedMs+offsetMs);this.clouds.rotation.y=elapsed*.0003;
      const interval=(active.durationMs-2500)/active.lightningCount,index=Math.floor((elapsed-1800)/interval),inStrike=elapsed>=1800&&index<active.lightningCount&&((elapsed-1800)%interval)<180;
      this.lightning.visible=inStrike;this.flash.intensity=inStrike?(this.low?5:18):0;this.shake=inStrike&&!this.low?Math.sin(elapsed*.2)*.04:0;
      for(let i=0;i<this.rings.length;i++)this.rings[i].rotation.z=elapsed*.0004*(i%2?1:-1);
    }
    if(result?.outcome){this.flash.color.set('#ffe5a4');this.flash.intensity=4;}else this.flash.color.set('#a3c9ff');
  }
}
