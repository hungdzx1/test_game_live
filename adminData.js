import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {GameEngine} from './gameEngine.js';
import {validateSave} from './playerStore.js';
export class DataManager{
  constructor(store,dataRoot){this.store=store;this.dataRoot=dataRoot;this.pending=null;}
  challenge(purpose,mode){if(!['restore','reset'].includes(purpose))throw new Error('Loại xác nhận không hợp lệ.');const token=randomBytes(24).toString('hex');this.pending={token,purpose,mode,expires:Date.now()+60000};return {token,mode,expires:this.pending.expires,phrase:`${purpose==='reset'?'RESET':'RESTORE'} ${mode.toUpperCase()}`};}
  confirm(value,purpose,mode){const p=this.pending;this.pending=null;if(!p||p.expires<Date.now()||p.token!==value?.token||p.mode!==mode||p.purpose!==purpose||value.phrase!==`${purpose==='reset'?'RESET':'RESTORE'} ${mode.toUpperCase()}`)throw new Error('Cần xác nhận đúng bộ dữ liệu; mã hết hạn sau 60 giây.');}
  bundle(engine){return {format:'tutien-backup',version:1,mode:engine.mode,createdAt:new Date().toISOString(),state:engine.exportState()};}
  validate(bundle,mode,config){if(!bundle||bundle.format!=='tutien-backup'||bundle.version!==1||bundle.mode!==mode)throw new Error('Tệp backup không đúng định dạng hoặc khác chế độ demo/LIVE.');const saved=validateSave(bundle.state);const engine=new GameEngine(saved.players,config,{saved});engine.mode=mode;return engine;}
  async protect(engine,reason){const file=path.join(this.dataRoot,'data/backups',`${engine.mode}-${reason}-${Date.now()}-${randomBytes(4).toString('hex')}.json`);await this.store.write(file,this.bundle(engine));return file;}
}
