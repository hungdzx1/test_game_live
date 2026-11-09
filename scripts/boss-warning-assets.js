import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {GameEngine} from '../gameEngine.js';import {createPlayer} from '../playerStore.js';
const sounds='unity-client/Assets/Musics/SFX/Boss',fixtures='unity-client/Assets/Tests/Fixtures/BossWarning',design='docs/Tailieu_output/boss-notice-designs';
await fs.mkdir(sounds,{recursive:true});await fs.mkdir(fixtures,{recursive:true});
const files=['warning-TB02.wav','attack-normal.wav','attack-skill1.wav','attack-skill2.wav'];
for(const name of files){const from=design+'/audio/'+name,to=sounds+'/'+name;try{await fs.access(to);try{assert.deepEqual(await fs.readFile(from),await fs.readFile(to));await fs.unlink(from);}catch(e){if(e.code!=='ENOENT')throw e;}}catch(e){if(e.code!=='ENOENT')throw e;await fs.rename(from,to);}}
// Preserve the design gallery while the selected WAVs now live in Unity.
const gallery=design+'/index.html';let html=await fs.readFile(gallery,'utf8');for(const name of files)html=html.replaceAll('src="audio/'+name+'"','src="../../../'+sounds+'/'+name+'"');await fs.writeFile(gallery,html);
const e=new GameEngine(Array.from({length:30},(_,i)=>createPlayer('warning:'+i,'Đạo hữu '+i,i)));
const advance=ms=>{while(ms>0){const dt=Math.min(250,ms);e.tick(dt);ms-=dt;}};
const save=async name=>fs.writeFile(fixtures+'/'+name+'.json',JSON.stringify(e.snapshot(),null,2)+'\n');
e.setPhase('cultivation');await save('cultivation');e.setPhase('battle');await save('warning1');advance(1000);await save('mid');advance(200);e.setPhase('paused');await save('paused');e.setPhase('resume');advance(1799);await save('late');advance(1);await save('revealed');
const kill=()=>{const f=e.battle.current.fields[0];e.battle.combat.applyDamage(f,f.participants['warning:0'],f.activeBoss,1e9);};
kill();await save('warning2');advance(3000);kill();await save('warning3');
const code=['Scripts/UI/BossWarningSigil.cs','Scripts/Effects/BossWarningPresenter.cs','Editor/BossWarningSetup.cs','Tests/Editor/BossWarningTests.cs'].map(p=>'unity-client/Assets/'+p);
const paths=['unity-client/Assets/Musics/SFX',sounds,fixtures,...files.map(n=>sounds+'/'+n),...(await fs.readdir(fixtures)).filter(n=>n.endsWith('.json')).map(n=>fixtures+'/'+n),...code];
for(const p of paths){try{await fs.access(p+'.meta');}catch{const folder=(await fs.stat(p)).isDirectory();await fs.writeFile(p+'.meta','fileFormatVersion: 2\nguid: '+createHash('md5').update('TuTienLive:'+p.slice('unity-client/'.length)).digest('hex')+'\n'+(folder?'folderAsset: yes\n':''));}}
// Future design regeneration must also use the canonical Unity sound paths.
const generator='scripts/boss-notice-designs.js';let js=await fs.readFile(generator,'utf8');
if(!js.includes('function soundPath(')){
 js=js.replace("// Deterministic oscillator/noise synthesis; no downloaded or recorded audio.","function soundPath(file){return file==='warning-TB02.wav'||file.startsWith('attack-')?'unity-client/Assets/Musics/SFX/Boss/'+file:output+'/audio/'+file;}\nfunction soundUrl(file){return file==='warning-TB02.wav'||file.startsWith('attack-')?'../../../unity-client/Assets/Musics/SFX/Boss/'+file:'audio/'+file;}\n// Deterministic oscillator/noise synthesis; no downloaded or recorded audio.");
 js=js.replace("await fs.writeFile(output+'/audio/'+file,b)","await fs.mkdir(path.dirname(soundPath(file)),{recursive:true});await fs.writeFile(soundPath(file),b)");
 js=js.replace('src="audio/warning-${v.id}.wav"','src="${soundUrl(\'warning-\'+v.id+\'.wav\')}"').replace('src="audio/${s.file}"','src="${soundUrl(s.file)}"');await fs.writeFile(generator,js);
}
console.log('Moved selected warning and three attack WAVs to Unity; generated authoritative warning fixtures and stable metadata.');
