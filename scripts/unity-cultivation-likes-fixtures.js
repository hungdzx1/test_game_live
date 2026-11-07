// Record authoritative Node snapshots for Unity tests; no game save is read or written.
import assert from 'node:assert/strict';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
const folder='unity-client/Assets/Tests/Fixtures/CultivationLikes';await mkdir(folder,{recursive:true});
const guid=name=>createHash('md5').update('TuTienLive:CultivationLikes:'+name).digest('hex');
async function meta(file,dir=false){try{await access(file+'.meta');}catch{await writeFile(file+'.meta',`fileFormatVersion: 2\nguid: ${guid(file)}\n${dir?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n':''}`);}}
await meta(folder,true);
const p=createPlayer('cultivation-demo','Thanh Vân');p.realmIndex=3;const e=new GameEngine([p]);e.setPhase('cultivation');
let time=10000;e.liveEvents.now=()=>time;
async function record(name,exp,energy,stage=0){
  const state=e.snapshot();assert.equal(state.payload.players[0].cultivation,exp);assert.equal(state.payload.players[0].stageIndex,stage);assert.equal(state.payload.interactions.sectEnergy.power,energy);
  const file=folder+'/'+name+'.json';await writeFile(file,JSON.stringify(state,null,2));await meta(file);
}
const heart=(id,count)=>e.liveEvents.accept({source:'demo',loai:'tim',eventId:id,userId:p.userId,soLuong:count,rawMeta:{streamId:'unity-cultivation'}});
for(let i=0;i<4;i++)e.tick(250);await record('seconds',2,0);
heart('half-streak',50);await record('streak',2,50);
time+=1000;e.tick(0);await record('settled',102,50);
e.items.grantItem(e.getPlayer(p.userId),'tea');e.items.useItem(e.getPlayer(p.userId),'tea');heart('full-streak',100);await record('buffed',502,150);
heart('next-stage',15);time+=1000;e.tick(0);await record('stage',2,165,1);
console.log('Recorded 5 real Node snapshots: seconds / immediate energy / idle EXP / tea hearts / automatic stage.');
