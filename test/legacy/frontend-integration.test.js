import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApplication} from '../../server.js';

async function setup(t){const root=await mkdtemp(path.join(os.tmpdir(),'tutien-legacy-http-'));const app=await createApplication({dataRoot:root,port:0}),port=await app.listen();t.after(()=>app.close());return {base:`http://127.0.0.1:${port}`};}

test('Legacy /song and Three.js vendor routes remain available',async t=>{
  const {base}=await setup(t);for(const route of ['/song','/vendor/three/three.module.js','/vendor/three/three.core.js','/js/battleScene.js','/js/battleOverlay.js','/js/liveOverlay.js'])assert.equal((await fetch(base+route)).status,200,route);
});

test('05-25 Served frontend module graph and style links resolve locally without CDN/assets',async t=>{
  const {base}=await setup(t),visited=new Set();
  async function visit(url){assert.equal(new URL(url).origin,base);if(visited.has(url))return;visited.add(url);const r=await fetch(url);assert.equal(r.status,200,url);const text=await r.text();if(url.endsWith('.js'))for(const match of text.matchAll(/(?:^|\n)\s*import\s+(?:[^;\n]*?\sfrom\s*)?['"]([^'"]+)['"]/g)){const name=match[1];await visit(name==='three'?base+'/vendor/three/three.module.js':new URL(name,url).href);}}
  for(const page of ['/','/song']){const r=await fetch(base+page);assert.equal(r.status,200);const text=await r.text();for(const m of text.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))await visit(new URL(m[1],base).href);}
  assert.ok(visited.has(base+'/js/audio.js'));assert.ok(visited.has(base+'/vendor/three/three.core.js'));assert.ok(visited.size>20);
});
