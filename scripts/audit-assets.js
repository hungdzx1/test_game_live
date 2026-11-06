// Lossless PNG pixel audit. No image modification and no external dependencies.
import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
export function decodePng(bytes){
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Invalid PNG signature');
  let width,height,bitDepth,colorType,interlace;const idat=[];let palette,transparency,ended=false;
  for(let offset=8;offset+12<=bytes.length;){
    const length=bytes.readUInt32BE(offset),end=offset+12+length;if(end>bytes.length)throw new Error('Truncated PNG');
    const type=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,end-4);
    if(crc32(bytes.subarray(offset+4,end-4))!==bytes.readUInt32BE(end-4))throw new Error('PNG CRC mismatch: '+type);
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];}
    if(type==='PLTE')palette=data;if(type==='tRNS')transparency=data;if(type==='IDAT')idat.push(data);if(type==='IEND'){ended=true;break;}offset=end;
  }
  if(!ended||!width||!height||width*height>40e6||bitDepth!==8||interlace!==0)throw new Error('Unsupported/corrupt PNG (requires 8-bit, non-interlaced, <=40MP)');
  const channels=({0:1,2:3,3:1,4:2,6:4})[colorType];if(!channels)throw new Error('Unsupported PNG color type');
  const stride=width*channels,raw=inflateSync(Buffer.concat(idat),{maxOutputLength:(stride+1)*height});if(raw.length!==(stride+1)*height)throw new Error('Invalid PNG scanline length');
  const decoded=Buffer.alloc(stride*height),rgba=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];if(filter>4)throw new Error('Invalid PNG filter');
    for(let x=0;x<stride;x++){
      const left=x>=channels?decoded[y*stride+x-channels]:0,up=y?decoded[(y-1)*stride+x]:0,corner=y&&x>=channels?decoded[(y-1)*stride+x-channels]:0;
      decoded[y*stride+x]=(raw[y*(stride+1)+1+x]+(filter===0?0:filter===1?left:filter===2?up:filter===3?(left+up)>>>1:paeth(left,up,corner)))&255;
    }
  }
  for(let i=0;i<width*height;i++){
    const p=i*channels,o=i*4;
    if(colorType===6){rgba.set(decoded.subarray(p,p+4),o);continue;}
    if(colorType===2){rgba[o]=decoded[p];rgba[o+1]=decoded[p+1];rgba[o+2]=decoded[p+2];rgba[o+3]=transparency&&decoded[p]===transparency.readUInt16BE(0)&&decoded[p+1]===transparency.readUInt16BE(2)&&decoded[p+2]===transparency.readUInt16BE(4)?0:255;continue;}
    if(colorType===3){const k=decoded[p];if(!palette||k*3+2>=palette.length)throw new Error('Invalid PNG palette');rgba[o]=palette[k*3];rgba[o+1]=palette[k*3+1];rgba[o+2]=palette[k*3+2];rgba[o+3]=transparency?.[k]??255;continue;}
    rgba[o]=rgba[o+1]=rgba[o+2]=decoded[p];rgba[o+3]=colorType===4?decoded[p+1]:transparency&&decoded[p]===transparency.readUInt16BE(0)?0:255;
  }
  return {width,height,bitDepth,colorType,alphaChannel:[4,6].includes(colorType),transparencyChunk:!!transparency,rgba};
}
export function measurePixels({width:w,height:h,rgba:p}){
  const counts={transparent:0,semi:0,opaque:0,darkVisible:0,darkSemi:0,edgePixels:0,darkEdge:0,brightEdge:0,redEdge:0,blueEdge:0,significantDark:0,significantRedEdge:0,significantBlueEdge:0};
  const alphaBins={a1_15:0,a16_63:0,a64_127:0,a128_239:0,a240_254:0};let alphaSum=0;
  const bounds={any:[w,h,0,0],solid:[w,h,0,0]},touch={top:0,right:0,bottom:0,left:0};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,o=i*4,a=p[o+3],max=Math.max(p[o],p[o+1],p[o+2]),min=Math.min(p[o],p[o+1],p[o+2]);
    if(!a){counts.transparent++;continue;}alphaSum+=a;if(a===255)counts.opaque++;else{counts.semi++;alphaBins[a<16?'a1_15':a<64?'a16_63':a<128?'a64_127':a<240?'a128_239':'a240_254']++;}
    for(const key of a>=32?['any','solid']:['any']){const b=bounds[key];b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x+1);b[3]=Math.max(b[3],y+1);}
    if(max<16){counts.darkVisible++;if(a<255)counts.darkSemi++;if(a>=32)counts.significantDark++;}
    if(a>=32){if(y===0)touch.top++;if(x===w-1)touch.right++;if(y===h-1)touch.bottom++;if(x===0)touch.left++;}
    const edge=a<255&&((x>0&&p[o-1]<32)||(x<w-1&&p[o+7]<32)||(y>0&&p[o-w*4+3]<32)||(y<h-1&&p[o+w*4+3]<32));
    if(edge){counts.edgePixels++;if(max<24)counts.darkEdge++;if(min>232)counts.brightEdge++;if(p[o]>100&&p[o]>p[o+1]*1.8&&p[o]>p[o+2]*1.8){counts.redEdge++;if(a>=32)counts.significantRedEdge++;}if(p[o+2]>100&&p[o+2]>p[o]*1.8&&p[o+2]>p[o+1]*1.35){counts.blueEdge++;if(a>=32)counts.significantBlueEdge++;}}
  }
  return {counts,alphaBins,meanVisibleAlpha:alphaSum/(w*h-counts.transparent||1),bboxAlpha:bounds.any[2]?bounds.any:null,bbox32:bounds.solid[2]?bounds.solid:null,touchingSides:touch};
}
export async function auditAssets(root=path.resolve('public/assets'),destination=path.resolve('public/preview-2_5d/asset-audit.json')){
  const files=(await readdir(root,{recursive:true,withFileTypes:true})).filter(d=>d.isFile()&&d.name.toLowerCase().endsWith('.png')).map(d=>path.join(d.parentPath,d.name)).sort();
  const assets=[];
  for(const file of files){
    const bytes=await readFile(file),decoded=decodePng(bytes),relative=path.relative(path.resolve('public'),file).split(path.sep).join('/');
    assets.push({id:path.relative(root,file).split(path.sep).join('/'),url:'/'+relative.split('/').map(encodeURIComponent).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),width:decoded.width,height:decoded.height,bitDepth:decoded.bitDepth,colorType:decoded.colorType,alphaChannel:decoded.alphaChannel,transparencyChunk:decoded.transparencyChunk,...measurePixels(decoded)});
  }
  const result={schemaVersion:1,generatedAt:new Date().toISOString(),method:'PNG CRC verified; lossless unfiltered 8-bit samples. Bboxes [left,top,right,bottom), alpha32 suppresses low-alpha halos. Edge/color counts are review signals, not automatic matte removal.',assets,totals:{files:assets.length,fileBytes:assets.reduce((n,a)=>n+a.bytes,0),rgbaBytes:assets.reduce((n,a)=>n+a.width*a.height*4,0)}};
  await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,JSON.stringify(result,null,2)+'\n');return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const r=await auditAssets();for(const a of r.assets)console.log(a.id,`${a.width}x${a.height}`,JSON.stringify(a.bbox32),JSON.stringify(a.counts),'touch',JSON.stringify(a.touchingSides));console.log(JSON.stringify(r.totals));}
