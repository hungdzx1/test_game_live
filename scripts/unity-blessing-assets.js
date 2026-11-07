// Copy only existing Ban Phuc layers, preserving PNG bytes and existing Unity edits.
import fs from 'node:fs';import crypto from 'node:crypto';import{decodePng,measurePixels}from'./audit-assets.js';
const source='public/assets/02/UI/UI_BANPHUC',target='unity-client/Assets/Art/SectConcept02/UI/Blessing';
fs.mkdirSync(target,{recursive:true});
const meta=(p,folder=false)=>{if(!fs.existsSync(p+'.meta'))fs.writeFileSync(p+'.meta','fileFormatVersion: 2\nguid: '+crypto.randomUUID().replaceAll('-','')+'\n'+(folder?'folderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n':''));};
meta(target,true);const assets=[];
for(const file of fs.readdirSync(source).filter(n=>n.startsWith('ui_blessing_')&&n.endsWith('.png'))){
  const bytes=fs.readFileSync(source+'/'+file),path=target+'/'+file;
  if(fs.existsSync(path)&&!fs.readFileSync(path).equals(bytes))throw Error('Existing Unity artwork differs: '+path);
  if(!fs.existsSync(path))fs.writeFileSync(path,bytes);meta(path);
  const image=decodePng(bytes),stats=measurePixels(image);
  assets.push({file,importPath:path.replace('unity-client/',''),width:image.width,height:image.height,bbox32:stats.bbox32,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(target+'/asset-audit.json',JSON.stringify({assets,missing:['ui_blessing_ornaments.png'],ornamentFallback:'Two outlined diamonds built from native Unity UI Images; border retains its original decoration.'},null,2)+'\n');meta(target+'/asset-audit.json');
console.log('Copied/audited '+assets.length+' PNG layers; missing ornaments use native UI diamonds.');
