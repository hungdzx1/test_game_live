import {ITEM_NAMES} from './cultivationConfig.js';

export const SECT_ENERGY_THRESHOLDS=Object.freeze([1000,3000,5000]);
export const MAX_SECT_LEVELS=50;
export const DEFAULT_SECT_LEVELS=SECT_ENERGY_THRESHOLDS.map((likes,index)=>({level:index+1,likes,reward:index<2?{item:'blessing',quantity:1}:null,scope:'all'}));

export function sectLevelsFor(input=DEFAULT_SECT_LEVELS){
  if(!Array.isArray(input)||input.length<1||input.length>MAX_SECT_LEVELS)throw new Error('Tông môn cần từ 1 đến 50 cấp.');
  return Array.from(input).map((row,index)=>{
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!['level','likes','reward','scope'].includes(k))||row.level!==index+1||!Number.isSafeInteger(row.likes)||row.likes<1||row.likes>1e9||row.scope!=='all')throw new Error('Cấp tông môn, số tim hoặc phạm vi không hợp lệ.');
    let reward=null;
    if(row.reward!==null){
      const r=row.reward;
      if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['item','quantity'].includes(k))||!Object.hasOwn(ITEM_NAMES,r.item)||!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>100)throw new Error('Quà thưởng cấp tông môn không hợp lệ.');
      reward={item:r.item,quantity:r.quantity};
    }
    return {level:index+1,likes:row.likes,reward,scope:'all'};
  });
}

// Node owns progression; completion receipts prevent config edits/restarts replaying rewards.
export class SectEnergy{
  constructor(levels){this.levels=sectLevelsFor(levels);this.totalLikes=0;this.completed=new Set();}
  get progress(){
    let power=this.totalLikes;
    for(const row of this.levels){if(power<row.likes||row.level===this.levels.length)return {level:row.level,power:Math.min(power,row.likes)};power-=row.likes;}
  }
  get level(){return this.progress.level;}
  get power(){return this.progress.power;}
  reached(){let sum=0;return this.levels.filter(row=>{sum+=row.likes;return this.totalLikes>=sum;});}
  configure(levels){this.levels=sectLevelsFor(levels);for(const row of this.reached())this.completed.add(row.level);}
  add(count){
    if(!Number.isSafeInteger(count)||count<0)throw new Error('Số tim nguyên lực không hợp lệ.');
    const limit=this.levels.reduce((sum,row)=>sum+row.likes,0);
    this.totalLikes+=Math.min(count,Math.max(0,limit-this.totalLikes));
    const rewards=this.reached().filter(row=>!this.completed.has(row.level));
    for(const row of rewards)this.completed.add(row.level);
    return rewards;
  }
  snapshot(){const {level,power}=this.progress,threshold=this.levels[level-1].likes,maxLevel=this.levels.length;return {level,power,threshold,maxLevel,full:level===maxLevel&&power===threshold};}
  exportState(){return {version:2,totalLikes:this.totalLikes,completedLevels:[...this.completed].sort((a,b)=>a-b)};}
  restore(raw){
    if(raw===undefined)return;
    const invalid=()=>{throw new Error('Dữ liệu nguyên lực tông môn không hợp lệ; giữ nguyên file.');};
    if(!raw||typeof raw!=='object'||Array.isArray(raw))invalid();
    if(raw.version===undefined){
      // Fixed three-level saves must be measured against their original thresholds.
      if(!Number.isInteger(raw.level)||raw.level<1||raw.level>3||!Number.isSafeInteger(raw.power)||raw.power<0||raw.power>SECT_ENERGY_THRESHOLDS[raw.level-1]||(raw.level<3&&raw.power===SECT_ENERGY_THRESHOLDS[raw.level-1]))invalid();
      this.totalLikes=SECT_ENERGY_THRESHOLDS.slice(0,raw.level-1).reduce((a,b)=>a+b,0)+raw.power;
      this.completed=new Set(Array.from({length:raw.level-1},(_,i)=>i+1));
    }else{
      if(raw.version!==2||!Number.isSafeInteger(raw.totalLikes)||raw.totalLikes<0||raw.totalLikes>MAX_SECT_LEVELS*1e9||!Array.isArray(raw.completedLevels)||raw.completedLevels.length>MAX_SECT_LEVELS||new Set(raw.completedLevels).size!==raw.completedLevels.length||raw.completedLevels.some(n=>!Number.isInteger(n)||n<1||n>MAX_SECT_LEVELS))invalid();
      this.totalLikes=raw.totalLikes;this.completed=new Set(raw.completedLevels);
    }
    // A changed plan can move the displayed level; loading never grants retroactive rewards.
    for(const row of this.reached())this.completed.add(row.level);
  }
}
