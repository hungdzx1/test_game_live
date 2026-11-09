import sharp from 'sharp';
import {safeAvatar} from './normalizeEvent.js';

// Cosmetic viewer photos only. No filesystem access, game state or persisted URL/profile.
const MAX_BYTES=524288,MAX_PIXELS=4096*4096;
export class AvatarImageError extends Error{
  constructor(code,status){super(code);this.code=code;this.status=status;}
}
export async function avatarPng(bytes){
  if(!bytes?.length||bytes.length>MAX_BYTES)throw new AvatarImageError('source_size',413);
  try{
    const image=sharp(bytes,{limitInputPixels:MAX_PIXELS,failOn:'warning',animated:false});
    const meta=await image.metadata();
    if(!['jpeg','png','webp','avif','heif','gif'].includes(meta.format))throw new Error('Unsupported image');
    const png=await image.rotate().resize({width:256,height:256,fit:'inside',withoutEnlargement:true}).png().timeout({seconds:2}).toBuffer();
    if(png.length>MAX_BYTES)throw new AvatarImageError('output_size',413);
    return {bytes:png,format:meta.format};
  }catch(error){if(error instanceof AvatarImageError)throw error;throw new AvatarImageError('decode',415);}
}
export function createAvatarImages({fetchImage=fetch,now=Date.now}={}){
  const cache=new Map(),pending=new Map();let windowStart=0,started=0;
  async function download(url){
    let response;
    try{
      response=await fetchImage(url,{redirect:'error',signal:AbortSignal.timeout(5000),headers:{Accept:'image/png,image/jpeg,image/webp,image/avif;q=0.9'}});
      if(!response.ok)throw new AvatarImageError('upstream_http',502);
      if(Number(response.headers.get('content-length'))>MAX_BYTES)throw new AvatarImageError('source_size',413);
      if(!response.body)throw new AvatarImageError('empty',415);
      const parts=[];let size=0;
      for await(const chunk of response.body){size+=chunk.length;if(size>MAX_BYTES)throw new AvatarImageError('source_size',413);parts.push(chunk);}
      return await avatarPng(Buffer.concat(parts));
    }catch(error){
      if(response?.body&&!response.body.locked)await response.body.cancel().catch(()=>{});
      if(error instanceof AvatarImageError)throw error;
      throw new AvatarImageError(error.name==='TimeoutError'||error.name==='AbortError'?'timeout':'network',504);
    }
  }
  return {async get(value){
    const url=safeAvatar(value);if(!url)throw new AvatarImageError('url',400);
    const time=now();for(const[key,item]of cache)if(item.until<=time)cache.delete(key);
    if(cache.has(url))return cache.get(url).image;
    if(pending.has(url))return pending.get(url);
    if(time-windowStart>=1000){windowStart=time;started=0;}
    if(pending.size>=2||started>=8)throw new AvatarImageError('busy',429);started++;
    const job=download(url).then(image=>{cache.set(url,{until:now()+60000,image});while(cache.size>8)cache.delete(cache.keys().next().value);return image;}).finally(()=>pending.delete(url));
    pending.set(url,job);return job;
  }};
}
