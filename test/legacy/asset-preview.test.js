import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateLayout,layerRect,reorder,assetUrl} from '../../public/preview-2_5d/layout-model.js';

test('07.0 layout validates complete manifests, encoded paths, crop/anchor math and rejects unsafe imports',async()=>{
  const manifest=JSON.parse(await readFile('public/preview-2_5d/asset-audit.json','utf8')),layout=JSON.parse(await readFile('public/preview-2_5d/layout.json','utf8'));
  const copy=validateLayout(layout,manifest.assets);assert.notEqual(copy,layout);assert.equal(new Set(layout.layers.map(l=>l.asset)).size,26);assert.ok(assetUrl('FX layers/a #.png').includes('FX%20layers/a%20%23.png'));
  const rect=layerRect({x:100,y:200,anchor:[.5,1],crop:[10,20,100,200],scale:2,scaleY:.5},{width:500,height:500});assert.equal(rect.left,0);assert.equal(rect.top,0);assert.equal(rect.height,200);
  const invalid=structuredClone(layout);invalid.layers[0].crop=[0,0,1e8,1];assert.throws(()=>validateLayout(invalid,manifest.assets));invalid.layers[0]=structuredClone(layout.layers[0]);invalid.layers[0].opacity=NaN;assert.throws(()=>validateLayout(invalid,manifest.assets));
  invalid.layers=structuredClone(layout.layers);invalid.concept='https://example.com/image.png';assert.throws(()=>validateLayout(invalid,manifest.assets));
  reorder(copy,copy.layers[0].id,copy.layers[2].id);assert.equal(copy.layers[0].z,2);assert.equal(layout.layers[0].z,0);
});
