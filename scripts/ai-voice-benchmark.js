// Offline synthesis benchmark only. Does not open the game server or play speakers.
import fs from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createVoiceCache,wavInfo} from '../voiceCache.js';
import {VOICE_TEXT,vietnameseNumber} from '../voiceService.js';

const cache=await createVoiceCache();
try{
 const started=performance.now();await cache.worker.start();const modelLoadMs=performance.now()-started;
 const runs=[];
 for(const text of ['Thanh Vân','Nguyễn Minh','Đạo Hữu Mới']){const wasCached=cache.has(text),begin=performance.now(),key=await cache.ensure(text);runs.push({text,wasCached,ms:performance.now()-begin,seconds:cache.entries.get(key).seconds});const hit=performance.now();await cache.ensure(text);runs.at(-1).cacheHitMs=performance.now()-hit;}
 const parts=[VOICE_TEXT.join,'Thanh Vân',VOICE_TEXT.with,vietnameseNumber(10),VOICE_TEXT.others],keys=await Promise.all(parts.map(text=>cache.ensure(text,{fixed:text!=='Thanh Vân'})));
 const pcm=[];
 for(const key of keys){const bytes=await cache.get(key);wavInfo(bytes);for(let i=12;i+8<=bytes.length;){const n=bytes.readUInt32LE(i+4);if(bytes.toString('ascii',i,i+4)==='data')pcm.push(bytes.subarray(i+8,i+8+n));i+=8+n+n%2;}}
 const data=Buffer.concat(pcm),wav=Buffer.alloc(44+data.length);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(data.length,40);data.copy(wav,44);
 await fs.mkdir('test-results/ai-voice',{recursive:true});await fs.writeFile('tools/tts/piper/output/ai-voice-nhap-mon.wav',wav);
 const report={modelLoadMs,runs,groupSample:{text:'Chào mừng đạo hữu Thanh Vân cùng mười người khác gia nhập tông môn!',seconds:wavInfo(wav).seconds,file:'tools/tts/piper/output/ai-voice-nhap-mon.wav'},listening:'CHƯA KIỂM CHỨNG',liveLatency:'CHƯA KIỂM CHỨNG: synthesis/cache benchmark does not measure Unity playback or TikTok LIVE'};
 await fs.writeFile('test-results/ai-voice/piper-benchmark.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{cache.close();}
