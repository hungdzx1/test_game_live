import * as THREE from 'three';
import {mesh} from './primitives.js';
const COLORS=['#668b98','#83ceca','#72d8c6','#ecc66f','#c49aec','#91cbe8','#a69fe2','#e39dd2','#f3bb7c','#abc9ff','#ffe7a3'];
export class RealmAura{
  constructor(parent){this.root=new THREE.Group();parent.add(this.root);this.realm=-1;}
  set(realm){if(realm===this.realm)return;this.realm=realm;this.root.clear();const color=COLORS[realm]??COLORS[0],add=(kind,p,s)=>mesh(this.root,kind,color,p,s,true);
    if(realm===1||realm===2){const r=add('ring',[0,.1,0],[.7,.7,.7]);r.rotation.x=Math.PI/2;if(realm===2)add('sphere',[0,.3,-.6],[.09,.09,.09]);}
    if(realm===3)for(let i=0;i<3;i++)add('sphere',[Math.sin(i*2.1)*.7,.9,Math.cos(i*2.1)*.7],[.08,.08,.08]);
    if(realm===4){add('sphere',[0,1.4,-.65],[.2,.24,.2]);add('cone',[0,.95,-.65],[.2,.5,.2]);}
    if(realm===5)for(let i=0;i<4;i++){const m=add('box',[Math.sin(i*Math.PI/2)*.8,1.3,Math.cos(i*Math.PI/2)*.8],[.04,.45,.06]);m.rotation.z=i*.6;}
    if(realm===6)for(let i=0;i<6;i++)add('box',[Math.sin(i)*.85,.3+i*.3,Math.cos(i)*.85],[.06,.08,.06]);
    if(realm===7||realm===10)for(let i=0;i<(realm===10?3:2);i++){const r=add('ring',[0,.2+i*.3,-.05],[.85+i*.12,.85+i*.12,.85+i*.12]);r.rotation.x=Math.PI/2+(realm===10?i*.35:0);}
    if(realm===8)for(const side of [-1,1])for(let i=0;i<3;i++){const wing=add('cone',[side*(.45+i*.2),1.1+i*.15,-.4],[.14,.9-i*.15,.05]);wing.rotation.z=side*(-.7-i*.15);}
    if(realm===9)for(let i=0;i<6;i++){const bolt=add('box',[Math.sin(i)*.7,.3+i*.25,Math.cos(i)*.7],[.035,.4,.035]);bolt.rotation.z=i%2?.6:-.6;}
    if(realm===10)add('sphere',[0,1.2,-.6],[.15,.15,.15]);
  }
  update(realm,time,low=false){this.set(realm);this.root.rotation.y=time*.35;this.root.position.y=Math.sin(time*1.4)*.05;this.root.scale.setScalar(low?.8:1);this.root.children.forEach((m,i)=>m.visible=!low||i<2);}
}
