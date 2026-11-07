// Quantify before/after PNGs without changing either image.
import {readFile,writeFile} from 'node:fs/promises';
import {decodePng} from './audit-assets.js';
const base='docs/unity-scene-authoring',report=JSON.parse(await readFile(base+'/after/screenshot-report.json','utf8')),shots=[];
for(const shot of report.shots){
 const a=decodePng(await readFile(base+'/before/'+shot.file)),b=decodePng(await readFile(base+'/after/'+shot.file));
 if(a.width!==b.width||a.height!==b.height)throw new Error('Size mismatch');
 const boxes=shot.nameplates.map(r=>({x0:Math.floor(r.x0*a.width)-18,x1:Math.ceil(r.x1*a.width)+18,y0:Math.floor((1-r.y1)*a.height)-18,y1:Math.ceil((1-r.y0)*a.height)+18}));
 let changed=0,outside=0,compared=0,totalError=0,max=0;
 for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){
  const i=(y*a.width+x)*4;const delta=Math.max(...[0,1,2].map(k=>Math.abs(a.rgba[i+k]-b.rgba[i+k])));
  const masked=boxes.some(r=>x>=r.x0&&x<=r.x1&&y>=r.y0&&y<=r.y1);
  if(delta>2)changed++;if(!masked){compared++;if(delta>2)outside++;totalError+=delta;max=Math.max(max,delta);}
 }
 shots.push({file:shot.file,width:a.width,height:a.height,changedPixelsThreshold2:changed,percentChanged:100*changed/(a.width*a.height),outsideNameplateChangedPixels:outside,outsideNameplateComparedPixels:compared,outsideNameplateMeanMaxChannelError:totalError/compared,outsideNameplateMaxChannelError:max});
}
await writeFile(base+'/comparison-report.json',JSON.stringify({method:'RGB max-channel absolute difference >2/255; only TMP nameplate bounds +18px are excluded for the outside-nameplate metric. No editing of source PNGs.',shots},null,2));
for(const s of shots)console.log(s.file,s.percentChanged.toFixed(3)+'% changed; outside nameplates:',s.outsideNameplateChangedPixels);
