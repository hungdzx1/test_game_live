import {createHash} from 'node:crypto';
import {cleanName} from './playerStore.js';
export const eventDigest=value=>createHash('sha256').update(value).digest('hex');
const integer=(value,min,max,label)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error(`${label} không hợp lệ.`);return value;};
function numericString(value,label){if(typeof value!=='string'||!/^\d{1,30}$/.test(value)||/^0+$/.test(value))throw new Error(`Thiếu ${label} đáng tin cậy.`);return value;}
// API contract verified against tiktok-live-connector 2.5.0 and tiktok-live-proto/v3.
// README's v2 examples use giftDetails/userId/likeCount; native v3 uses gift/id/count.
export function fromTikTok(kind,data,roomId,words=[]){
  const types={chat:'binhluan',gift:'qua',like:'tim',follow:'theodoi',member:'vao'};
  if(!types[kind]||!data||typeof data!=='object')throw new Error('Loại sự kiện không hợp lệ.');
  const user=numericString(data.user?.id,'user ID'),message=numericString(data.common?.msgId,'message ID');
  const room=numericString(String(roomId||data.common?.roomId||''),'room ID');
  const result={eventId:eventDigest(`${room}:${kind}:${message}`),source:'tiktok',loai:types[kind],userId:`tt:${user}`,ten:cleanName(data.user?.nickname??'Đạo hữu',words),avatar:null,qua:'',giftId:'',soKimCuong:0,soLuong:1,noiDung:'',timestamp:Date.now(),rawMeta:{streamId:room}};
  // Native v3 decodes WebcastChatMessage.content; older connector examples use comment.
  if(kind==='chat'){
    result.noiDung=data.content??data.comment;
    if(typeof result.noiDung!=='string')throw new Error('Thiếu nội dung bình luận hợp lệ.');
  }
  if(kind==='gift'){
    result.giftId=numericString(String(data.giftId??''),'gift ID');
    if(!data.gift||!Number.isInteger(data.gift.type))throw new Error('Thiếu loại/đơn giá quà; không đoán từ tên.');
    result.qua=cleanName(data.gift.name??`Quà ${result.giftId}`,words,60);result.soKimCuong=data.gift.diamondCount;result.soLuong=data.repeatCount;
    result.rawMeta.giftType=data.gift.type;result.rawMeta.repeatEnd=data.repeatEnd===1||data.repeatEnd===true;
    if(data.gift.type===1){if(![0,1,false,true].includes(data.repeatEnd))throw new Error('Thiếu trạng thái kết thúc combo.');result.rawMeta.comboId=numericString(data.groupId,'group ID combo');}
  }
  if(kind==='like'){
    result.soLuong=data.count;
    if(data.total!==undefined&&data.total!==''&&data.total!=='0'){if(typeof data.total!=='string'||!/^\d{1,16}$/.test(data.total))throw new Error('Tổng tim không hợp lệ.');result.rawMeta.likeTotal=Number(data.total);}
  }
  return validateEvent(result,words);
}
export function validateEvent(raw,words=[]){
  if(!raw||typeof raw!=='object'||!['tiktok','demo'].includes(raw.source)||!['qua','binhluan','tim','theodoi','vao'].includes(raw.loai)||typeof raw.eventId!=='string'||!/^[\w:-]{1,120}$/.test(raw.eventId)||typeof raw.userId!=='string'||!/^[\w:-]{1,100}$/.test(raw.userId))throw new Error('Định danh sự kiện không hợp lệ.');
  if(raw.source==='tiktok'&&!/^tt:\d{1,30}$/.test(raw.userId))throw new Error('Sự kiện thật cần user ID TikTok ổn định.');
  const event={eventId:raw.eventId,source:raw.source,loai:raw.loai,userId:raw.userId,ten:cleanName(raw.ten??'Đạo hữu',words),avatar:null,qua:cleanName(raw.qua??'',words,60),giftId:raw.giftId??'',soKimCuong:raw.soKimCuong??0,soLuong:raw.soLuong??1,noiDung:raw.noiDung??'',timestamp:raw.timestamp??Date.now(),rawMeta:{}};
  integer(event.timestamp,0,Number.MAX_SAFE_INTEGER,'Thời gian');
  if(typeof event.noiDung!=='string'||event.noiDung.length>200)throw new Error('Bình luận tối đa 200 ký tự.');
  const meta=raw.rawMeta??{};
  if(typeof meta.streamId!=='string'||!/^[\w:-]{1,100}$/.test(meta.streamId))throw new Error('Thiếu định danh phiên sự kiện.');event.rawMeta.streamId=meta.streamId;
  if(event.loai==='qua'){
    if(typeof event.giftId!=='string'||!/^\d{1,30}$/.test(event.giftId))throw new Error('Gift ID không hợp lệ.');
    integer(event.soKimCuong,1,1000000,'Đơn giá quà');integer(event.soLuong,1,10000,'Số lượng quà');integer(meta.giftType,0,100,'Loại quà');
    event.rawMeta.giftType=meta.giftType;event.rawMeta.repeatEnd=meta.repeatEnd===true;
    if(meta.giftType===1){if(typeof meta.repeatEnd!=='boolean'||typeof meta.comboId!=='string'||!/^[\w:-]{1,100}$/.test(meta.comboId)||meta.comboId==='0')throw new Error('Combo thiếu khóa hoặc repeatEnd; giữ nguyên, không cấp thưởng.');event.rawMeta.comboId=meta.comboId;}
  }else if(event.loai==='tim'){
    integer(event.soLuong,0,1000000,'Số tim');if(meta.likeTotal!==undefined)event.rawMeta.likeTotal=integer(meta.likeTotal,0,Number.MAX_SAFE_INTEGER,'Tổng tim');
  }else integer(event.soLuong,1,1,'Số lượng');
  return event;
}
