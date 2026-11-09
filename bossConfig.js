export const BOSS_FORMAT='shared-boss-v1';
export const BOSS_SELECTION='random-adaptive-v1';
export const BOSS_REWARD=Object.freeze({blessings:3,pills:2});
export const DEFAULT_BOSS_TARGET_SECONDS=240;
export const BOSS_DEFAULTS=[
  {id:'Boss_1',name:'Vua Rồng Xương Lam Hỏa',hp:10000,durationSeconds:300,reward:{blessings:1,pills:0}},
  {id:'Boss_2',name:'Hổ Lôi Vương',hp:20000,durationSeconds:300,reward:{blessings:2,pills:1}},
  {id:'Boss_3',name:'Nữ Hoàng Hồ Ly Cửu Vĩ',hp:50000,durationSeconds:300,reward:{blessings:5,pills:2}}
];
export function encountersFor(input,defaultSeconds=300){
  const rows=input??BOSS_DEFAULTS.map(b=>({...b,durationSeconds:defaultSeconds}));
  if(!Array.isArray(rows)||rows.length!==3)throw new Error('Cần đúng ba boss theo thứ tự Boss_1, Boss_2, Boss_3.');
  const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
  return rows.map((row,i)=>{
    const base=BOSS_DEFAULTS[i];
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(k=>!['id','name','hp','durationSeconds','reward'].includes(k))||row.id!==base.id||(row.name!==undefined&&row.name!==base.name)||!integer(row.hp,1,1e12)||!integer(row.durationSeconds,10,3600)||!row.reward||typeof row.reward!=='object'||Array.isArray(row.reward)||Object.keys(row.reward).some(k=>!['blessings','pills'].includes(k))||!integer(row.reward.blessings,0,100)||!integer(row.reward.pills,0,100))throw new Error('HP, thời gian hoặc phần thưởng boss không hợp lệ.');
    return {...base,hp:row.hp,durationSeconds:row.durationSeconds,reward:{blessings:row.reward.blessings,pills:row.reward.pills}};
  });
}
