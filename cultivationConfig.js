// Source: GAME_DESIGN.md sections 8–10. Additional quest balance is explicit below.
export const BASE_CULTIVATION_RATE=2;
export const CULTIVATION_PER_LIKE=2;
export const LIKE_STREAK_SIZE=100;
export const LIKE_STREAK_IDLE_MS=1000;
export const DEFAULT_RULES = {
  realms: [
    {name:'Phàm Nhân',hp:100,atk:10,def:5,rate:2,thresholds:[100,150,200],min:90,max:100},
    {name:'Luyện Khí',hp:180,atk:18,def:9,rate:2,thresholds:[180,270,360],min:80,max:98},
    {name:'Trúc Cơ',hp:320,atk:32,def:16,rate:2,thresholds:[320,480,640],min:70,max:95},
    {name:'Kim Đan',hp:560,atk:56,def:28,rate:2,thresholds:[560,840,1120],min:60,max:90},
    {name:'Nguyên Anh',hp:980,atk:98,def:49,rate:2,thresholds:[900,1350,1800],min:50,max:85},
    {name:'Hóa Thần',hp:1720,atk:172,def:86,rate:2,thresholds:[1450,2175,2900],min:40,max:80},
    {name:'Luyện Hư',hp:3010,atk:301,def:151,rate:2,thresholds:[2300,3450,4600],min:35,max:75},
    {name:'Hợp Thể',hp:5270,atk:527,def:264,rate:2,thresholds:[3700,5550,7400],min:30,max:70},
    {name:'Đại Thừa',hp:9220,atk:922,def:461,rate:2,thresholds:[6000,9000,12000],min:25,max:65},
    {name:'Độ Kiếp',hp:16140,atk:1614,def:807,rate:2,thresholds:[9600,14400,19200],min:20,max:60},
    {name:'Phi Thăng',hp:28240,atk:2824,def:1412,rate:2,thresholds:[]}
  ],
  maxMultiplier:8, buffDurationMs:30000, pillPoints:10, maxPills:10,
  breakthroughDurationMs:12000, breakthroughCooldownMs:60000,
  protectionPerFailure:8, protectionCap:24, fateFailures:5, focusCooldownMs:10000,
  quests:{cultivateExp:5,cooldownMs:30000,perCycleLimit:10,checkInPoints:3,cultivatePoints:1,
    passiveIntervalMs:60000,passivePoints:1, costs:{tea:2,pill:3,blessing:6,root:20,camera:2}}
};
export const ITEM_NAMES={tea:'Trà Ngộ Đạo',root:'Biến Dị Linh Căn',pill:'Độ Kiếp Đan',blessing:'Ban Phúc',camera:'Quay Cam'};
export const STAGES=['Sơ Kỳ','Trung Kỳ','Hậu Kỳ','Viên Mãn'];
export function rulesFor(input={}) {
  const r={...structuredClone(DEFAULT_RULES),...input,quests:{...DEFAULT_RULES.quests,...input.quests,costs:{...DEFAULT_RULES.quests.costs,...input.quests?.costs}}};
  const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
  if(!Array.isArray(r.realms)||r.realms.length!==11||r.realms.some((v,i)=>!v||typeof v.name!=='string'||v.name.length>30||!['hp','atk','def','rate'].every(k=>number(v[k],.01,1e8))||!Array.isArray(v.thresholds)||v.thresholds.length!==(i===10?0:3)||v.thresholds.some(n=>!number(n,1,1e9))||(i<10&&(!number(v.min,0,100)||!number(v.max,v.min,100)))))throw new Error('Bảng cảnh giới không hợp lệ.');
  for(const [key,min,max] of [['maxMultiplier',1,100],['buffDurationMs',1000,3600000],['pillPoints',1,100],['maxPills',1,100],['breakthroughDurationMs',10000,20000],['breakthroughCooldownMs',1000,3600000],['protectionPerFailure',0,100],['protectionCap',0,100],['fateFailures',1,100],['focusCooldownMs',1000,3600000]])if(!number(r[key],min,max))throw new Error(`Cấu hình ${key} không hợp lệ.`);
  for(const k of ['maxPills','fateFailures'])if(!Number.isInteger(r[k]))throw new Error('Giới hạn phải là số nguyên.');
  for(const k of ['cultivateExp','cooldownMs','perCycleLimit','checkInPoints','cultivatePoints','passiveIntervalMs','passivePoints'])if(!number(r.quests[k],1,1e6))throw new Error(`Cấu hình nhiệm vụ ${k} không hợp lệ.`);
  for(const k of Object.keys(ITEM_NAMES))if(!Number.isInteger(r.quests.costs[k])||!number(r.quests.costs[k],1,10000))throw new Error('Giá đổi vật phẩm không hợp lệ.');
  // Old caidat files contain realm-specific rates; the new rule replaces those rates only.
  r.realms=r.realms.map(realm=>({...realm,rate:BASE_CULTIVATION_RATE}));
  return r;
}
