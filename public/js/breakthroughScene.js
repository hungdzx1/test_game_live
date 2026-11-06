import * as THREE from 'three';
import {mesh,label} from './primitives.js';
export const TRIBULATION={x:22,y:3.2,z:0};
export class BreakthroughScene {
  constructor(scene){
    this.group=new THREE.Group();this.group.position.set(TRIBULATION.x,TRIBULATION.y,TRIBULATION.z);scene.add(this.group);
    mesh(this.group,'cylinder','#53647d',[0,-.5,0],[3.6,1,3.6]);const rock=mesh(this.group,'cone','#39495f',[0,-2,0],[3.3,3,3.3]);rock.rotation.z=Math.PI;
    this.rings=[];for(const radius of [2.2,3,3.8]){const ring=mesh(this.group,'ring','#7eadea',[0,.1,0],[radius,radius,radius],true);ring.rotation.x=-Math.PI/2;this.rings.push(ring);}
    const sign=label('ĐÀI ĐỘ KIẾP');sign.position.set(0,-1,3.5);sign.scale.set(3,.6,1);this.group.add(sign);
    this.clouds=new THREE.Group();this.group.add(this.clouds);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;mesh(this.clouds,'sphere','#283044',[Math.sin(a)*2.8,7+i%2*.4,Math.cos(a)*2],[2,.6,1.5]);}
    const points=new Float32Array(9*3);for(let i=0;i<9;i++){points[i*3]=i===0||i===8?0:Math.sin(i*13)*.65;points[i*3+1]=7-i*.75;points[i*3+2]=Math.cos(i*4)*.25;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(points,3));this.lightning=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#e7eeff'}));this.group.add(this.lightning);
    this.flash=new THREE.PointLight('#a3c9ff',0,20);this.flash.position.set(0,4,0);this.group.add(this.flash);this.clouds.visible=false;this.lightning.visible=false;this.low=false;this.shake=0;
  }
  update(active,result,offsetMs=0){
    this.clouds.visible=!!active;this.lightning.visible=false;this.flash.intensity=0;this.shake=0;
    if(active){const elapsed=Math.min(active.durationMs,active.elapsedMs+offsetMs);this.clouds.rotation.y=elapsed*.0003;
      const interval=(active.durationMs-2500)/active.lightningCount,index=Math.floor((elapsed-1800)/interval),inStrike=elapsed>=1800&&index<active.lightningCount&&((elapsed-1800)%interval)<180;
      this.lightning.visible=inStrike;this.flash.intensity=inStrike?(this.low?5:18):0;this.shake=inStrike&&!this.low?Math.sin(elapsed*.2)*.04:0;
      for(let i=0;i<this.rings.length;i++)this.rings[i].rotation.z=elapsed*.0004*(i%2?1:-1);
    }
    if(result?.outcome){this.flash.color.set('#ffe5a4');this.flash.intensity=4;}else this.flash.color.set('#a3c9ff');
  }
}
