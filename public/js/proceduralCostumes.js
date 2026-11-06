import * as THREE from 'three';
import {geometry} from './primitives.js';

const packed=new Map(),shapes=new Map();
const surface=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.08});
const luminous=new THREE.MeshBasicMaterial({vertexColors:true});
const palettes=[
  ['#267c91','#d2edf0','#e3c47b'],['#69508e','#ece0f6','#d4bc82'],
  ['#315581','#e4ecf5','#b9cbdc'],['#a45076','#f4dfe9','#e8c58a'],
  ['#3e7d68','#dfece1','#d6ba74'],['#a17d3a','#f2e6ca','#d7b56b']
];
export function appearanceFor(seed=0){
  const n=Number.isFinite(seed)?seed>>>0:0;
  return Object.freeze({hair:n%6,robe:Math.floor(n/6)%5,weapon:Math.floor(n/30)%4,palette:Math.floor(n/120)%6,hairTone:Math.floor(n/720)%3});
}
export const part=(kind,color,p,s,r=[0,0,0])=>({kind,color,p,s,r});
function shape(kind){
  if(!['torso','skirt','sleeve'].includes(kind))return geometry(kind);
  if(!shapes.has(kind))shapes.set(kind,new THREE.CylinderGeometry(kind==='torso'?1:.5,kind==='torso'?.72:1,1,8));
  return shapes.get(kind);
}
// Merge a rigid node into one vertex-colored draw call. Keys contain only finite
// style/palette choices, never user IDs. These geometries/materials belong to the
// application cache; an individual character must not dispose them.
export function rigPart(parent,key,build,glow=false){
  if(!packed.has(key)){
    const positions=[],normals=[],colors=[],matrix=new THREE.Matrix4(),normalMatrix=new THREE.Matrix3(),q=new THREE.Quaternion(),v=new THREE.Vector3(),normal=new THREE.Vector3(),color=new THREE.Color();
    for(const p of build()){
      q.setFromEuler(new THREE.Euler(...p.r));matrix.compose(new THREE.Vector3(...p.p),q,new THREE.Vector3(...p.s));normalMatrix.getNormalMatrix(matrix);color.set(p.color);
      const source=shape(p.kind),position=source.attributes.position,n=source.attributes.normal,index=source.index;
      for(let j=0;j<(index?index.count:position.count);j++){
        const i=index?index.getX(j):j;v.fromBufferAttribute(position,i).applyMatrix4(matrix);normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();
        positions.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);colors.push(color.r,color.g,color.b);
      }
    }
    const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));result.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));result.computeBoundingSphere();packed.set(key,result);
  }
  const m=new THREE.Mesh(packed.get(key),glow?luminous:surface);m.name=key;m.castShadow=!glow;m.receiveShadow=!glow;parent.add(m);return m;
}
export function colorsFor(a){return palettes[a.palette];}
export function hairColorFor(a){return ['#202b43','#303250','#d9deed'][a.hairTone];}

export function discipleTorso(a){
  const [coat,inner,gold]=colorsFor(a),width=[1,1.08,.94,1.12,1.04][a.robe];
  return [part('torso',coat,[0,1.3,0],[.32*width,.61,.22]),part('box',inner,[0,1.38,.205],[.25,.5,.05]),
    part('box',inner,[-.09,1.48,.23],[.1,.4,.045],[0,0,.4]),part('box',gold,[.075,1.47,.255],[.045,.43,.035],[0,0,-.35]),
    part('cylinder',gold,[0,1.02,0],[.29*width,.1,.23]),part('cylinder','#e9c2a5',[0,1.7,0],[.09,.15,.09]),
    ...(a.robe===4?[part('box','#c3ccd2',[0,1.4,.27],[.35,.3,.06])]:[]),
    ...(a.robe===2?[part('sphere',inner,[0,1.56,-.02],[.4,.1,.25])]:[])];
}
export function discipleHead(a,simple=false){
  const hair=hairColorFor(a),skin='#e8c4ac';
  const result=[part('sphere',skin,[0,0,0],[.19,.235,.175]),part('sphere',hair,[0,.115,-.045],[.205,.16,.18]),
    part('box','#283347',[-.078,.015,.164],[.073,.027,.018]),part('box','#283347',[.078,.015,.164],[.073,.027,.018]),
    part('box',hair,[-.085,.068,.166],[.085,.013,.02],[0,0,-.1]),part('box',hair,[.085,.068,.166],[.085,.013,.02],[0,0,.1])];
  if(!simple)result.push(part('sphere',skin,[0,-.035,.175],[.025,.04,.025]),part('box','#a16e6b',[0,-.106,.156],[.065,.012,.012]));
  const fringes=simple?2:4;
  for(let i=0;i<fringes;i++)result.push(part('cone',hair,[(i-(fringes-1)/2)*.065,.08+Math.abs(i-(fringes-1)/2)*.024,.143],[.065,.2,.035],[0,0,Math.PI+(a.hair===4?.45:0)]));
  if(a.hair===0||a.hair===5)result.push(part('sphere',hair,[0,.28,-.065],[.105,.11,.1]),part('cylinder','#d6be83',[0,.25,-.065],[.11,.025,.1]));
  if(a.hair===2)for(const side of [-1,1])result.push(part('sphere',hair,[side*.19,.05,-.08],[.09,.13,.1]));
  if(a.hair===3)result.push(part('box','#d6be83',[0,.16,.145],[.32,.025,.04]));
  if(a.hair===4)result.push(part('sphere',hair,[.13,.02,-.07],[.1,.25,.13]));
  if(simple&&a.hair!==0)for(const side of a.hair===2?[-1,1]:[0])result.push(part('skirt',hair,[side*.2,-.26,-.14],[a.hair===2?.07:.14,.55,.085],[.15,0,0]));
  return result;
}
export function discipleHair(a){
  const c=hairColorFor(a),length=[.24,.65,.55,.62,.42,.7][a.hair],parts=[];
  for(const side of a.hair===2?[-1,1]:[0]){
    parts.push(part('skirt',c,[side*.2,-length/2,-.03],[a.hair===2?.075:.13,length,.08],[.2,0,-side*.12]));
    if(a.hair===5)for(let i=0;i<3;i++)parts.push(part('sphere',c,[0,-i*.15,-.06-i*.035],[.085,.12,.07]));
  }
  return parts;
}
export function discipleSkirt(a){
  const [coat,inner,gold]=colorsFor(a),width=[1,1.08,.94,1.12,1.04][a.robe];
  return [part('skirt',coat,[0,0,0],[.46*width,.87,.32]),part('skirt',inner,[0,-.015,.018],[.35,.88,.3]),
    part('box',gold,[0,.1,.32],[.035,.5,.025]),
    ...(a.robe===1||a.robe===3?[part('box',coat,[0,.1,.33],[.22,.57,.04],[0,0,a.robe===3?.3:0])]:[])];
}
export function discipleArm(a,side){
  const [coat,inner,gold]=colorsFor(a),wide=[.23,.26,.29,.27,.21][a.robe];
  return [part('sleeve',coat,[0,-.27,0],[wide,.5,.21]),part('cylinder',inner,[0,-.5,0],[wide*.85,.06,.19]),
    part('cylinder',gold,[0,-.45,0],[wide*.86,.025,.19]),part('sphere','#e8c4ac',[0,-.59,.025],[.075,.1,.065])];
}
export function weaponParts(type){
  const gold='#d8bd7c',blade='#a7dce7';
  if(type===2)return [part('cylinder',gold,[0,0,.12],[.045,.3,.045]),part('sphere','#9eafe3',[0,0,.47],[.13,.13,.13]),part('ring',gold,[0,0,.47],[.2,.2,.2])];
  if(type===3){const result=[part('box',gold,[0,0,.1],[.04,.04,.28])];for(let i=0;i<5;i++)result.push(part('box',i%2?blade:gold,[0,0,.4],[.065,.03,.52],[0,(i-2)*.23,0]));return result;}
  return [part('box',gold,[0,0,.08],[.07,.07,.28]),part('box',gold,[0,0,.24],[.3,.06,.08]),part('box',blade,[type===1?.025:0,0,.72],[type===1?.15:.065,.035,.92]),part('cone',blade,[0,0,1.22],[type===1?.08:.035,.2,.025],[Math.PI/2,0,0])];
}

export function enemyRig(body,type,boss){
  const key=`${boss?'boss':'mob'}:${type}`,coat=['#263044','#841f42','#322e50'][type],metal=['#68758b','#bd6779','#8271b3'][type],trim=['#b6a37c','#e2ba85','#d8b5e8'][type],skin=type===2?'#c9bcd8':'#d4c0c0';
  const width=type===0?.43:type===1?.32:.4,parts=[part('torso',coat,[0,1.3,0],[width,.65,.25]),part('cylinder',trim,[0,.98,0],[width*.87,.09,.25]),part('cylinder',skin,[0,1.72,0],[.1,.15,.09])];
  if(type!==1)parts.push(part('box',metal,[0,1.4,.24],[width*1.5,.44,.12]));
  else parts.push(part('box','#e3c2b4',[0,1.45,.22],[.23,.42,.06]),part('box',trim,[.15,1.4,.26],[.04,.55,.05],[0,0,-.28]));
  if(boss)for(const side of [-1,1])parts.push(part(type===0?'box':'cone',metal,[side*(width+.04),1.58,0],[type===0?.34:.18,.23,.33],[0,0,side*.4]));
  rigPart(body,'enemy-body:'+key,()=>parts);
  const skirt=rigPart(body,'enemy-skirt:'+key,()=>[part('skirt',coat,[0,0,0],[width*1.1,.82,.3]),part('box',trim,[0,-.02,.3],[.09,.7,.04]),...(type===2?[part('box',metal,[0,.1,.33],[.32,.45,.08])]:[])]);skirt.position.y=.57;
  const head=rigPart(body,'enemy-head:'+key,()=>{
    const face=[part('sphere',skin,[0,0,0],[.18,.235,.17]),part('box','#d45278',[-.07,.01,.16],[.06,.025,.025]),part('box','#d45278',[.07,.01,.16],[.06,.025,.025])];
    if(type===0){face.push(part('sphere',coat,[0,.12,-.01],[.23,.18,.21]),part('box',metal,[0,.08,.19],[.42,.06,.05]));for(const side of [-1,1])face.push(part('cone',trim,[side*.23,.25,-.03],[.075,.36,.065],[0,0,-side*.6]));}
    else {face.push(part('sphere','#dce0ec',[0,.13,-.03],[.2,.17,.18]));for(let i=0;i<4;i++)face.push(part('cone','#dce0ec',[(i-1.5)*.08,.1,.13],[.07,.22,.04],[0,0,Math.PI+.2]));}
    if(type===2)for(let i=0;i<5;i++)face.push(part('cone',boss?trim:metal,[(i-2)*.08,.3,-.02],[.045,.22+Math.abs(i-2)*.08,.04],[0,0,-(i-2)*.15]));
    return face;
  });head.position.y=1.98;
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*(width+.06),1.54,0);body.add(arm);arms.push(arm);
    rigPart(arm,'enemy-arm:'+key,()=>[part(type===1?'sleeve':'cylinder',coat,[0,-.29,0],[type===1?.25:.16,.55,.19]),part('sphere',skin,[0,-.6,.02],[.095,.11,.08]),...(type!==1?[part('box',metal,[0,-.26,.12],[.23,.32,.1])]:[])]);
    const leg=new THREE.Group();leg.position.set(side*.19,.85,0);body.add(leg);legs.push(leg);
    rigPart(leg,'enemy-leg:'+key,()=>[part('cylinder',coat,[0,-.31,0],[.14,.62,.13]),part('box',metal,[0,-.64,.06],[.24,.18,.32])]);
  }
  const hair=rigPart(body,'enemy-hair:'+key,()=>[part('skirt',type===0?coat:'#dce0ec',[0,-.36,0],[type===0?.13:.21,type===0?.36:.8,.11],[.2,0,0])]);hair.position.set(0,1.96,-.18);
  const cape=rigPart(body,'enemy-cape:'+key,()=>[part('skirt',type===1?'#a33156':coat,[0,-.45,0],[width*1.45,1.1,.09],[.15,0,0]),part('box',trim,[0,-.45,.08],[.055,.9,.025])]);cape.position.set(0,1.5,-.29);
  const weapon=rigPart(arms[1],'enemy-weapon:'+key,()=>type===0?
    [part('cylinder',trim,[0,-.12,.3],[.055,1.6,.055]),part('box',metal,[.15,.55,.3],[.7,.38,.13]),part('cone',metal,[-.2,.55,.3],[.25,.5,.08],[0,0,Math.PI/2])]:
    type===1?[part('box',trim,[0,-.54,.12],[.25,.08,.08]),part('box','#ec5975',[0,-.54,.8],[.09,.045,1.35])]:
    [part('cylinder',trim,[0,-.05,.35],[.045,1.6,.045]),part('ring','#bd8df0',[0,.8,.35],[.28,.28,.28]),part('sphere','#c794ed',[0,.8,.35],[.11,.11,.11])]);
  let halo=null;
  if(boss&&type===2){halo=rigPart(body,'enemy-halo:'+key,()=>[part('ring','#a387d5',[0,0,0],[.95,.95,.95]),...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return part('cone','#be9ce5',[Math.sin(a)*.95,Math.cos(a)*.95,0],[.045,.35,.035],[0,0,-a]);})],true);halo.position.set(0,1.38,-.3);}
  return {arms,legs,head,hair,cape,weapon,halo};
}
