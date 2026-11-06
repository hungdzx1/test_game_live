export const FIELD_NAMES=['Phàm Giới','Luyện Khí Cốc','Trúc Cơ Trận','Kim Đan Vực','Nguyên Anh Cảnh','Hóa Thần Chiến Trường','Luyện Hư Ma Vực','Hợp Thể Thiên Vực','Đại Thừa Ma Giới','Độ Kiếp Chiến Trường','Phi Thăng Thần Vực'];
export const BATTLE_DEFAULTS={
  cycle:{cultivationSeconds:600,battleSeconds:300},
  skills:{'1':{multiplier:2,cooldownSeconds:10},'2':{multiplier:3,cooldownSeconds:25}},
  boss:{spawnWindows:[[0,90],[100,190],[200,290]],difficultyK:[.65,.85,1],soloFactor:.65},
  combat:{attackIntervalMs:1000,reviveMs:10000,maxActiveMobs:90,moveSpeed:4,cameraDwellMs:8000},
  rewards:{top1:5,top2:4,top3:3,others:1,solo:1,endgamePointsPerStage:10}
};
export function battleRulesFor(input={}){
  const r={};for(const k of Object.keys(BATTLE_DEFAULTS))r[k]={...structuredClone(BATTLE_DEFAULTS[k]),...input[k]};
  for(const k of ['1','2'])r.skills[k]={...BATTLE_DEFAULTS.skills[k],...input.skills?.[k]};
  const check=(v,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)throw new Error('Cấu hình chiến đấu không hợp lệ.');};
  for(const v of Object.values(r.cycle))check(v,10,3600);
  for(const s of Object.values(r.skills)){check(s.multiplier,1,10);check(s.cooldownSeconds,1,300);}
  if(!Array.isArray(r.boss.spawnWindows)||r.boss.spawnWindows.length!==3||!Array.isArray(r.boss.difficultyK)||r.boss.difficultyK.length!==3)throw new Error('Cần đúng ba cửa sổ boss.');
  let end=-1;for(const w of r.boss.spawnWindows){if(!Array.isArray(w)||w.length!==2)throw new Error('Cửa sổ boss không hợp lệ.');check(w[0],0,299);check(w[1],w[0]+1,300);if(w[0]<end)throw new Error('Cửa sổ boss chồng nhau.');end=w[1];}
  r.boss.difficultyK.forEach(v=>check(v,.01,10));check(r.boss.soloFactor,.1,2);
  check(r.combat.attackIntervalMs,250,5000);check(r.combat.reviveMs,8000,15000);check(r.combat.maxActiveMobs,3,300);if(!Number.isInteger(r.combat.maxActiveMobs))throw new Error('Giới hạn quái phải nguyên.');
  check(r.combat.moveSpeed,1,10);check(r.combat.cameraDwellMs,5000,10000);
  for(const v of Object.values(r.rewards)){check(v,1,100);if(!Number.isInteger(v))throw new Error('Thưởng phải là số nguyên.');}
  return r;
}
