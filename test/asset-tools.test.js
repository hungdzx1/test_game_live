import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {decodePng,measurePixels} from '../scripts/audit-assets.js';
function crc(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return (c^0xffffffff)>>>0;}
function chunk(type,data){const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc(b.subarray(4,-4)),b.length-4);return b;}
function fixture(){
  const w=4,h=5,bpp=4,stride=w*bpp,source=Buffer.from(Array.from({length:w*h*4},(_,i)=>(i*31+3)%256)),raw=Buffer.alloc((stride+1)*h);
  for(let y=0;y<h;y++){raw[y*(stride+1)]=y;for(let x=0;x<stride;x++){
    const a=x>=bpp?source[y*stride+x-bpp]:0,b=y?source[(y-1)*stride+x]:0,c=y&&x>=bpp?source[(y-1)*stride+x-bpp]:0,p=a+b-c,dist=[Math.abs(p-a),Math.abs(p-b),Math.abs(p-c)];
    const predictor=y===0?0:y===1?a:y===2?b:y===3?Math.floor((a+b)/2):dist[0]<=dist[1]&&dist[0]<=dist[2]?a:dist[1]<=dist[2]?b:c;
    raw[y*(stride+1)+x+1]=(source[y*stride+x]-predictor+256)%256;
  }}
  const head=Buffer.alloc(13);head.writeUInt32BE(w);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;
  return {source,png:Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))])};
}
test('07.0 lossless PNG decoder handles filters 0–4 and rejects corrupted CRC/truncated data',()=>{
  const {source,png}=fixture(),decoded=decodePng(png);assert.deepEqual(Buffer.from(decoded.rgba),source);assert.equal(decoded.alphaChannel,true);assert.equal(decoded.width,4);
  const corrupt=Buffer.from(png);corrupt[42]^=1;assert.throws(()=>decodePng(corrupt),/CRC/);assert.throws(()=>decodePng(png.subarray(0,20)));
});
test('07.0 audit separates faint/semitransparent/opaque samples and reports real alpha bbox/border contact',()=>{
  const rgba=Uint8Array.from([255,0,0,0, 0,0,0,10, 255,20,10,128, 2,2,2,255]);
  const a=measurePixels({width:2,height:2,rgba});assert.equal(a.counts.transparent,1);assert.equal(a.counts.semi,2);assert.equal(a.counts.opaque,1);assert.deepEqual(a.bboxAlpha,[0,0,2,2]);assert.deepEqual(a.bbox32,[0,1,2,2]);assert.equal(a.alphaBins.a1_15,1);assert.equal(a.touchingSides.bottom,2);
});
