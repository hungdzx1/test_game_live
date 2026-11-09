import test from 'node:test';import assert from 'node:assert/strict';
import sharp from 'sharp';import {mkdtemp,mkdir,writeFile,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {GameEngine} from '../gameEngine.js';
import {avatarPng,createAvatarImages} from '../avatarImage.js';import {createApplication} from '../server.js';
const url='https://p16-sign.tiktokcdn.com/avatar.webp?signature=do-not-rewrite';
const image=()=>sharp({create:{width:1200,height:600,channels:4,background:{r:25,g:130,b:240,alpha:1}}});

test('Avatar PNG: actual WebP/AVIF/JPEG/PNG bytes decode to bounded PNG without relying on URL extension',async()=>{
 for(const format of ['webp','avif','jpeg','png']){const raw=await image().toFormat(format).toBuffer(),out=await avatarPng(raw),meta=await sharp(out.bytes).metadata();assert.equal(out.format,format==='avif'?'heif':format);assert.equal(meta.format,'png');assert.equal(meta.width,256);assert.equal(meta.height,128);assert.ok(out.bytes.length<524288);}
 await assert.rejects(avatarPng(Buffer.from('<html>not an image</html>')),{code:'decode'});await assert.rejects(avatarPng(Buffer.alloc(524289)),{code:'source_size'});
 const huge=await sharp({create:{width:5000,height:4000,channels:3,background:'white'}}).png().toBuffer();await assert.rejects(avatarPng(huge),{code:'decode'});
});
test('Avatar PNG: exact signed URL, no redirects; RAM cache expires and coalesces same photo',async()=>{
 const raw=await image().webp().toBuffer();let calls=0,time=10000,release;
 const service=createAvatarImages({now:()=>time,fetchImage:async(value,options)=>{calls++;assert.equal(value,url);assert.equal(options.redirect,'error');assert.equal(options.headers.Cookie,undefined);await new Promise(r=>release=r);return new Response(raw);}});
 const a=service.get(url),b=service.get(url);assert.equal(calls,1);release();const results=await Promise.all([a,b]);assert.equal(results[0],results[1]);await service.get(url);assert.equal(calls,1);time+=60001;const c=service.get(url);assert.equal(calls,2);release();await c;
 for(const bad of ['https://localhost/a','https://tiktokcdn.com.evil.invalid/a','http://p16.tiktokcdn.com/a','file:///private'])await assert.rejects(service.get(bad),{code:'url'});assert.equal(calls,2);
});
test('Avatar PNG: bounded downloads/concurrency/rate and safe distinct failure codes',async()=>{
 for(const [reply,code]of [[()=>new Response('bad',{status:403}),'upstream_http'],[()=>new Response('x',{headers:{'content-length':'524289'}}),'source_size'],[()=>new Response(Buffer.alloc(524289)),'source_size'],[()=>new Response('not a photo'),'decode'],[()=>{throw new DOMException('timeout','TimeoutError');},'timeout']]){
  const service=createAvatarImages({fetchImage:async()=>reply()});await assert.rejects(service.get(url),{code});
 }
 const releases=[];const raw=await image().webp().toBuffer();const service=createAvatarImages({fetchImage:()=>new Promise(r=>releases.push(()=>r(new Response(raw))))});const a=service.get(url),b=service.get(url+'&other=1');await assert.rejects(service.get(url+'&third=1'),{code:'busy'});releases.forEach(r=>r());await Promise.all([a,b]);
 let calls=0;const limited=createAvatarImages({now:()=>100,fetchImage:async()=>{calls++;return new Response(raw);}});for(let i=0;i<8;i++)await limited.get(url+'&i='+i);await assert.rejects(limited.get(url+'&i=9'),{code:'busy'});assert.equal(calls,8);
});
test('Avatar PNG: real local HTTP returns PNG; origin/URL errors are rejected and player files stay unchanged',async t=>{
 const dataRoot=await mkdtemp(path.join(os.tmpdir(),'tutien-avatar-format-'));await mkdir(path.join(dataRoot,'data/demo'),{recursive:true});const file=path.join(dataRoot,'data/demo/players.json');await writeFile(file,JSON.stringify(new GameEngine().exportState()));let calls=0;const raw=await image().webp().toBuffer();const app=await createApplication({dataRoot,port:0,avatarFetch:async()=>{calls++;return new Response(raw);}});await app.listen();t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port,before=await readFile(file,'utf8');
 const r=await fetch(base+'/api/avatar?url='+encodeURIComponent(url));assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^image\/png/);assert.equal(r.headers.get('cache-control'),'no-store');const meta=await sharp(Buffer.from(await r.arrayBuffer())).metadata();assert.equal(meta.format,'png');assert.equal(meta.width,256);assert.equal(r.headers.get('x-avatar-source-format'),'webp');
 const bad=await fetch(base+'/api/avatar?url='+encodeURIComponent('https://localhost/private'));assert.equal(bad.status,400);assert.equal(bad.headers.get('x-avatar-error'),'url');const origin=await fetch(base+'/api/avatar?url='+encodeURIComponent(url),{headers:{Origin:'https://example.invalid'}});assert.equal(origin.status,403);assert.equal(calls,1);assert.equal(await readFile(file,'utf8'),before);assert.equal(app.engine.players.size,0);assert.equal(JSON.stringify(app.engine.exportState()).includes('signature='),false);
});
