import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRoute,createUIState,readPreference} from '../public/js/ui/state.js';
import {createLogStore} from '../public/js/ui/logs.js';
import {syncField,saveFields,ackFields,setDisabled} from '../public/js/ui/forms.js';

test('UI routes are bounded to five pages/six settings groups; admin preferences persist with unavailable-storage fallback',()=>{
  assert.deepEqual(parseRoute(),{page:'home',tab:'audio'});assert.deepEqual(parseRoute('#/settings/gifts'),{page:'settings',tab:'gifts'});assert.deepEqual(parseRoute('#/<script>/bad'),{page:'home',tab:'audio'});
  const savedLocation=globalThis.location;globalThis.location={hash:'#/demo'};try{const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};const state=createUIState({storage});state.setTheme('light');state.setCollapsed(true);const restored=createUIState({storage});assert.equal(restored.theme,'light');assert.equal(restored.collapsed,true);assert.equal(restored.route.page,'demo');const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};assert.equal(readPreference(blocked,'test','fallback'),'fallback');assert.doesNotThrow(()=>createUIState({storage:blocked}).setTheme('light'));}finally{globalThis.location=savedLocation;}
});
test('UI drafts survive incoming snapshots, save only changed fields, keep input on error and preserve concurrent edits after acknowledgement',async()=>{
  const original=globalThis.document,fields={volume:{type:'number',value:'',dataset:{},checkValidity:()=>true},music:{type:'checkbox',checked:false,dataset:{},checkValidity:()=>true}};
  globalThis.document={getElementById:id=>fields[id]};try{
    syncField('volume',.5);syncField('music',true);fields.volume.value='.73';fields.volume.dataset.dirty='true';syncField('volume',.25);assert.equal(fields.volume.value,'.73');
    const calls=[];await saveFields('audioSettings',{masterVolume:'volume',music:'music'},async(...args)=>calls.push(args));assert.deepEqual(calls,[['audioSettings',{masterVolume:.73}]]);assert.equal(fields.volume.dataset.dirty,undefined);
    fields.volume.value='.8';fields.volume.dataset.dirty='true';await assert.rejects(saveFields('audioSettings',{masterVolume:'volume'},async()=>{throw new Error('save failed');}));assert.equal(fields.volume.value,'.8');assert.equal(fields.volume.dataset.dirty,'true');
    ackFields([[fields.volume,.73]]);assert.equal(fields.volume.dataset.dirty,'true');fields.volume.dataset.busy='true';setDisabled(fields.volume,false);assert.equal(fields.volume.disabled,true);delete fields.volume.dataset.busy;setDisabled(fields.volume,false);assert.equal(fields.volume.disabled,false);
  }finally{globalThis.document=original;}
});
test('UI session log has a hard memory bound, transient dedup and no persistence',()=>{
  const logs=createLogStore(200);let notifications=0;const stop=logs.subscribe(()=>notifications++);logs.push('Đã lưu','system','ok',1000);logs.push('Đã lưu','system','ok',1500);assert.equal(logs.entries.length,1);for(let i=0;i<300;i++)logs.push('Sự kiện '+i,'battle','ok',2000+i);assert.equal(logs.entries.length,200);assert.equal(logs.entries[0].message,'Sự kiện 299');assert.equal(notifications,301);stop();
});
