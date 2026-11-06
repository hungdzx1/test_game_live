import {ITEM_NAMES} from './cultivationConfig.js';
export const LIVE_DEFAULTS={username:'',reconnectSeconds:5,maxReconnectAttempts:10,eventsPerSecond:200,userEventsPerSecond:12,noticeCooldownMs:10000,wishThreshold:1000,wishCooldownMs:60000,wishPoints:1};
export const DEFAULT_GIFT_RULES=[
  {id:'small',giftId:'',giftName:'',minDiamonds:1,maxDiamonds:9,item:'tea',quantity:1,effect:'item',enabled:true},
  {id:'medium',giftId:'',giftName:'',minDiamonds:10,maxDiamonds:99,item:'pill',quantity:1,effect:'item',enabled:true},
  {id:'large',giftId:'',giftName:'',minDiamonds:100,maxDiamonds:1000000,item:'blessing',quantity:1,effect:'sect',enabled:true}
];
export function usernameFor(value){if(typeof value!=='string')throw new Error('Tên TikTok không hợp lệ.');const name=value.trim().replace(/^@/,'');if(!/^[\w.]{2,24}$/.test(name))throw new Error('Tên TikTok cần 2–24 ký tự: chữ, số, dấu chấm hoặc gạch dưới.');return name;}
export function liveRulesFor(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!Object.hasOwn(LIVE_DEFAULTS,k)))throw new Error('Cấu hình LIVE không hợp lệ; không lưu khóa ký trong JSON.');
  const r={...LIVE_DEFAULTS,...input};if(r.username)r.username=usernameFor(r.username);
  for(const [key,min,max]of [['reconnectSeconds',1,60],['maxReconnectAttempts',0,30],['eventsPerSecond',10,1000],['userEventsPerSecond',2,100],['noticeCooldownMs',1000,60000],['wishThreshold',10,1000000],['wishCooldownMs',1000,3600000],['wishPoints',1,100]])if(!Number.isInteger(r[key])||r[key]<min||r[key]>max)throw new Error(`Cấu hình LIVE ${key} không hợp lệ.`);
  return r;
}
export function giftRulesFor(input=DEFAULT_GIFT_RULES){
  if(!Array.isArray(input)||input.length>50)throw new Error('Bảng quà tối đa 50 quy tắc.');
  const ids=new Set(),selectors=new Set(),bands=[];
  return input.map(raw=>{
    if(!raw||typeof raw!=='object'||Object.keys(raw).some(k=>!['id','giftId','giftName','minDiamonds','maxDiamonds','item','quantity','effect','enabled'].includes(k)))throw new Error('Quy tắc quà không hợp lệ.');
    const r={...raw};
    if(typeof r.id!=='string'||!/^[\w-]{1,60}$/.test(r.id)||ids.has(r.id))throw new Error('ID quy tắc quà bị trùng hoặc không hợp lệ.');ids.add(r.id);
    if(typeof r.giftId!=='string'||r.giftId.length>80||r.giftId&&!/^\d+$/.test(r.giftId)||typeof r.giftName!=='string'||r.giftName.length>60||r.giftId&&r.giftName)throw new Error('Chỉ chọn Gift ID hoặc tên quà, hoặc dải kim cương.');
    if(!Number.isInteger(r.minDiamonds)||!Number.isInteger(r.maxDiamonds)||r.minDiamonds<1||r.maxDiamonds<r.minDiamonds||r.maxDiamonds>1000000||!Object.hasOwn(ITEM_NAMES,r.item)||!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>100||!['item','sect','camera'].includes(r.effect)||typeof r.enabled!=='boolean')throw new Error('Giá trị quy tắc quà không hợp lệ.');
    r.giftName=r.giftName.trim().normalize('NFC');
    if(r.enabled){const selector=r.giftId?`id:${r.giftId}`:r.giftName?`name:${r.giftName.toLowerCase()}`:null;
      if(selector){if(selectors.has(selector))throw new Error('Trùng Gift ID hoặc tên quà đang bật.');selectors.add(selector);}
      else{if(bands.some(b=>r.minDiamonds<=b.maxDiamonds&&r.maxDiamonds>=b.minDiamonds))throw new Error('Dải kim cương bị chồng nhau.');bands.push(r);}
    }return r;
  });
}
export function matchGift(rules,event){
  const eligible=rules.filter(r=>r.enabled&&event.soKimCuong>=r.minDiamonds&&event.soKimCuong<=r.maxDiamonds);
  return eligible.find(r=>r.giftId&&r.giftId===event.giftId)||eligible.find(r=>!r.giftId&&r.giftName&&r.giftName.toLowerCase()===event.qua.toLowerCase())||eligible.find(r=>!r.giftId&&!r.giftName)||null;
}
