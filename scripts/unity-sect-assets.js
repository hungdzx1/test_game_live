// Lossless copy + current pixel audit for the Unity stage 03 scene. No image edits.
import {readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {decodePng} from './audit-assets.js';
const root=path.resolve('public/assets'),target=path.resolve('unity-client/Assets/Art/Sect');
const audit=JSON.parse(await readFile('test-results/unity-stage03/png-audit-all.json','utf8'));
const selected=audit.assets.filter(a=>/^(Background layers|Architecture layers|FX layers)\//.test(a.id)||['UI/ui_header.png','UI/ui_footer.png'].includes(a.id));
const assets=[];
for(const asset of selected){
  const from=path.join(root,asset.id),to=path.join(target,asset.id),bytes=await readFile(from);
  try{await stat(to);if(!bytes.equals(await readFile(to)))throw new Error('Existing Unity asset differs; refusing overwrite: '+to);}
  catch(e){if(e.code!=='ENOENT')throw e;await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);}
  const {width,height,rgba}=decodePng(bytes);let gradient=0,edges=0;
  const lum=i=>.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2];
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const i=(y*width+x)*4;
    if(rgba[i+3]<192||rgba[i+7]<192||rgba[i+width*4+3]<192)continue;
    gradient+=Math.abs(lum(i)-lum(i+4))+Math.abs(lum(i)-lum(i+width*4));edges++;
  }
  const b=asset.bboxAlpha??[0,0,width,height];
  // Only fully transparent outer padding is excluded from the plane, with 3 px guard.
  const crop=[Math.max(0,b[0]-3),Math.max(0,b[1]-3),Math.min(width,b[2]+3),Math.min(height,b[3]+3)];
  assets.push({...asset,importPath:'Assets/Art/Sect/'+asset.id,crop,sharpness:{method:'Mean adjacent luminance differences at alpha >=192; descriptive, not a quality score',mean:edges?gradient/(edges*2):null,samples:edges},copySha256:createHash('sha256').update(await readFile(to)).digest('hex')});
}
const result={stage:'Unity 03',generatedAt:new Date().toISOString(),originalsUnchanged:true,ppu:100,assets};
await writeFile(path.join(target,'asset-audit.json'),JSON.stringify(result,null,2)+'\n');
await writeFile('test-results/unity-stage03/asset-audit.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS: '+assets.length+' PNG copied byte-for-byte, alpha/edges/CRC and sharpness measured.');
