// Actual Node event payloads/settings snapshots for Unity; no production save files.
import {mkdir,writeFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GameEngine} from '../gameEngine.js';
import {createPlayer} from '../playerStore.js';
import {AUDIO_DEFAULTS} from '../public/js/settings.js';
const folder='unity-client/Assets/Tests/Fixtures/Audio';await mkdir(folder,{recursive:true});
async function meta(file,dir=false){try{await access(file+'.meta');}catch{await writeFile(file+'.meta',`fileFormatVersion: 2\nguid: ${createHash('md5').update('TuTienLive:Audio:'+file).digest('hex')}\n${dir?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n':''}`);}}
await meta(folder,true);
const e=new GameEngine([createPlayer('audio-demo','Thanh Vân')],{audio:{...AUDIO_DEFAULTS}} ,{rng:()=>0});e.setPhase('cultivation');
async function record(name,value){const file=folder+'/'+name+'.json';await writeFile(file,JSON.stringify(value,null,2));await meta(file);}
async function event(name,kind){const payload=e.events.findLast(v=>v.kind===kind);if(!payload)throw Error('Missing actual event '+kind);await record(name,{type:'game:event',version:1,sessionId:e.transportId,seq:++e.seq,serverTime:Date.now(),payload});}
await record('initial',e.snapshot());e.items.activateBlessing();await event('banphuc','blessing:activated');
// The level donor is not the ritual character: 1000 personal hearts would queue
// another ritual and prevent the return flight this fixture is meant to record.
e.liveEvents.accept({source:'demo',loai:'tim',eventId:'audio-hearts',userId:'audio-viewer',soLuong:1000,rawMeta:{streamId:'audio'}});await event('level','sect:level');
e.prepareBreakthrough('audio-demo');e.tick(50);await record('ritual-start',e.snapshot());e.tick(250);e.tick(150);await record('ritual-fly',e.snapshot());
while(e.breakthrough.active)e.tick(250);await event('success','breakthrough:completed');await record('ritual-result',e.snapshot());
for(let i=0;i<13;i++)e.tick(250);assert.equal(e.breakthrough.active,null);assert.equal(e.breakthrough.lastResult,null);await record('ritual-return',e.snapshot());
e.config.audio={...AUDIO_DEFAULTS,masterVolume:.8,musicVolume:.3,effectsVolume:.6,maxVoices:2};await record('volume',e.snapshot());
e.config.audio={...e.config.audio,enabled:false};await record('muted',e.snapshot());
e.config.audio={...e.config.audio,enabled:true,music:false,effects:false};await record('channels-off',e.snapshot());
console.log('Recorded real Node audio settings/events and ritual ascent/return snapshots.');
