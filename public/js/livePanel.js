import {mountBlocks} from './ui/dom.js';
import {syncField,syncFields,saveFields,changed,ackFields,valueOf,setDisabled} from './ui/forms.js';
import {control} from './network.js';
import {createGiftPicker} from './ui/giftPicker.js';
import {presetForRule} from './ui/giftPresets.js';
import {createSectLevelsPanel} from './ui/sectLevelsPanel.js';
const items={tea:'Trà Ngộ Đạo',pill:'Độ Kiếp Đan',blessing:'Ban Phúc',root:'Biến Dị Linh Căn',camera:'Quay Cam'};
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function createLivePanel(log){
  const section=make('section');section.id='live-panel';section.innerHTML=`<section class="panel" data-mount="home-connection"><div class="panel-heading"><span class="heading-icon tiktok-mark">♪</span><div><h2>Kết nối TikTok LIVE</h2><p>Kết nối tài khoản TikTok để nhận sự kiện LIVE và điều khiển trò chơi theo thời gian thực.</p></div></div>
  <div class="connection-toolbar"><label>Bộ dữ liệu<select id="game-mode"><option value="demo">Dữ liệu mô phỏng</option><option value="live">Dữ liệu người chơi LIVE</option></select></label><span>Demo và LIVE lưu riêng · Chỉ nhận sự kiện khi bạn đã lên LIVE</span></div>
  <div class="connection-inputs"><label>Tên tài khoản TikTok<input id="live-username" maxlength="25" placeholder="@ten_tai_khoan" autocomplete="off"></label><label><span>Khóa ký Euler Stream <small>(tùy chọn)</small></span><input id="live-sign-key" type="password" maxlength="512" placeholder="••••••••••••" autocomplete="off"></label><div id="live-state-box" class="live-state-box"><span class="status-dot"></span><p id="live-status" role="status">Chưa kết nối</p></div><button id="live-disconnect">Ngắt kết nối</button><button id="live-connect" class="primary">Kết nối</button></div>
  <details class="connection-details"><summary>Thông tin và lịch sử kết nối</summary><p>Công cụ không tự lên LIVE. Connector không chính thức 2.5.0 dùng TikTok/dịch vụ ký Euler Stream. Khóa chỉ giữ trong RAM; không cần mật khẩu/cookie TikTok.</p><ol id="live-history"></ol><div class="row"><label>Chờ nối lại (s)<input id="reconnect-seconds" type="number" min="1" max="60"></label><label>Lần thử tối đa<input id="reconnect-attempts" type="number" min="0" max="30"></label><button id="save-live-settings">Lưu kết nối</button></div></details><details class="connection-details"><summary>Nhật ký bình luận &amp; follow</summary><p>20 bản ghi gần nhất trong phiên, gồm nội dung bình luận, kết quả lệnh và lý do bị từ chối.</p><ol id="live-event-log" class="live-event-log"></ol></details></section><section id="sect-level-panel" class="panel" data-mount="settings-gifts"><h2>Cấp tông môn</h2>
    <p>Mỗi dòng là số tim cần để hoàn tất cấp đó. Đủ tim thì nhận quà một lần và chuyển cấp tiếp theo; dòng cuối đầy sẽ giữ MAX. Tim dư chuyển tiếp.</p>
    <div class="gift-table-scroll"><table id="sect-level-table"><thead><tr><th>Cấp</th><th>Số lượng tim</th><th>Quà</th><th>Số lượng thưởng</th><th>Phạm vi</th></tr></thead><tbody></tbody></table></div>
    <div class="row"><button id="add-sect-level">Thêm cấp</button><button id="remove-sect-level">Xóa cấp cuối</button><button id="save-sect-levels" class="primary">Lưu cấp tông môn</button></div>
    <p>Trà, Đan, Linh Căn và Quay Cam cấp cho từng đệ tử hiện có, dùng khi tu luyện theo giới hạn vật phẩm. Ban Phúc cộng một lần cho toàn tông môn: mỗi lượng thưởng thêm 30 giây x2; thời gian đóng băng khi chiến đấu/tạm dừng.</p>
    <p>Sửa bảng giữ tổng tim đã ghi nhận và tính lại cấp theo ngưỡng mới, không phát thưởng hồi tố. Thêm cấp để tiếp tục sau MAX. Số cấp tối đa 50.</p><p id="sect-level-status" role="status"></p>
    </section><section class="panel" data-mount="settings-gifts"><h2>Quà → vật phẩm</h2><p>Bấm vào quà để chọn Hoa hồng 1 xu, Cỏ bốn lá 10 xu hoặc Má hồng nhỏ xinh 20 xu bằng hình ảnh. Số vật phẩm = số quà chốt × số lượng/quà. Quà chưa nhập môn được giữ chờ; battle giữ vật phẩm chờ tu luyện. Chọn quà có sẵn sẽ cố định ID và đơn giá, không cần chọn dải giá. Vẫn có thể nhập ID, tên hoặc dải đơn giá thủ công.</p>
    <div class="gift-table-scroll"><table id="gift-table"><thead><tr><th>Quà TikTok · giá trị</th><th>Vật phẩm / hành động</th><th>Số lượng/quà</th><th>Hiệu ứng</th><th>Bật</th><th></th></tr></thead><tbody></tbody></table></div>
    <div class="row"><button id="add-gift-rule">Thêm quy tắc</button><button id="save-gift-rules">Lưu bảng quà</button></div>
    <p id="live-log"></p></section><section class="panel" data-mount="demo-events" id="live-demo-tools"><h2>Sự kiện giả · cùng luồng xử lý</h2><p>Dùng đạo hữu đang chọn trên trang Demo. Nếu chưa có người, ID demo-khach được giữ quà chờ đến khi bình luận nhập môn trong công cụ bình luận.</p>
    <div class="row"><button data-like="1">1 tim</button><button data-like="10">10 tim</button><button data-like="100">100 tim</button><button data-like="1000">1.000 tim</button><button id="demo-follow">Theo dõi</button><button id="demo-enter">Vào phòng</button></div>
    <label>Gift ID<input id="demo-gift-id" value="5655" maxlength="30"></label><label>Tên quà<input id="demo-gift-name" value="Quà demo" maxlength="60"></label>
    <div class="row"><label>Đơn giá<select id="demo-diamonds"><option value="1">Nhỏ · 1</option><option value="10">Vừa · 10</option><option value="20">20 xu</option><option value="100">Lớn · 100</option></select></label><button id="demo-gift">Gửi quà đơn</button><button id="demo-combo">Combo 1 → 3 → 5 → chốt 5</button><button id="demo-replay">Gửi lại quà vừa chốt</button></div>
    <div class="row"><button data-connection="connect">Nối mô phỏng</button><button data-connection="drop">Rớt mạng / nối lại</button><button data-connection="offline">Kênh chưa LIVE</button><button data-connection="end">LIVE kết thúc</button><button data-connection="disconnect">Ngắt mô phỏng</button></div></section>
    `;
  mountBlocks(section);
  const $=id=>document.getElementById(id);let state,lastGift,rulesLoaded=false;const removedRules=new Set();
  const picker=createGiftPicker();
  function labelRule(tr){
    const fields=Object.fromEntries([...tr.querySelectorAll('[data-key]')].map(el=>[el.dataset.key,valueOf(el)])),preset=tr.dataset.selection==='preset'?presetForRule(fields):null,pick=tr.querySelector('.gift-select');
    pick.replaceChildren();
    if(preset){const img=make('img');img.src=preset.image;img.alt='';img.width=45;img.height=48;pick.append(img,make('span',`${preset.label} · ${preset.diamonds} xu`));}
    else pick.textContent=fields.giftId?`${fields.giftName||'Gift ID '+fields.giftId} · ${fields.minDiamonds===fields.maxDiamonds?fields.minDiamonds:fields.minDiamonds+'–'+fields.maxDiamonds} xu`:fields.giftName||`Dải giá ${fields.minDiamonds}–${fields.maxDiamonds} xu`;
    for(const input of tr.querySelectorAll('[data-key=giftId],[data-key=giftName],[data-key=minDiamonds],[data-key=maxDiamonds]'))input.disabled=!!preset;
    tr.querySelector('.gift-selection-note').textContent=preset?'Đã cố định quà và đơn giá. Chọn Nhập thủ công để dùng dải giá.':'Khớp ID / tên nếu nhập; nếu bỏ trống cả hai sẽ khớp mọi quà trong dải giá.';
  }
  const selected=()=>state?.players.find(p=>p.userId===$('player').value)??{userId:'demo-khach',name:'Đạo Hữu Mới'};
  async function send(action,value,userId){try{const r=await control(action,value,userId);log('Đã áp dụng thao tác LIVE/demo.');return r;}catch(e){log(e.message,'error');throw e;}}
  const sectLevels=createSectLevelsPanel(send);
  const safely=fn=>()=>Promise.resolve().then(fn).catch(e=>log(e.message,'error'));
  function event(loai,data={}){const p=selected();return {eventId:crypto.randomUUID(),loai,userId:p.userId,ten:p.name,...data};}
  function gift(meta={}){return event('qua',{qua:$('demo-gift-name').value,giftId:$('demo-gift-id').value,soKimCuong:Number($('demo-diamonds').value),soLuong:1,rawMeta:{giftType:0,...meta}});}
  $('game-mode').onchange=safely(()=>send('mode',$('game-mode').value));
  $('live-connect').onclick=safely(async()=>{const key=$('live-sign-key').value;$('live-sign-key').value='';await send('liveConnect',{username:$('live-username').value,signApiKey:key});});
  $('live-disconnect').onclick=safely(()=>send('liveDisconnect'));
  $('save-live-settings').onclick=safely(()=>saveFields('liveSettings',{reconnectSeconds:'reconnect-seconds',maxReconnectAttempts:'reconnect-attempts'},send));
  document.querySelectorAll('[data-like]').forEach(b=>b.onclick=safely(()=>send('demoLiveEvent',event('tim',{soLuong:Number(b.dataset.like)}))));
  $('demo-follow').onclick=safely(()=>send('demoLiveEvent',event('theodoi')));$('demo-enter').onclick=safely(()=>send('demoLiveEvent',event('vao')));
  $('demo-gift').onclick=safely(()=>{lastGift=gift();return send('demoLiveEvent',lastGift);});
  $('demo-combo').onclick=safely(async()=>{const comboId=crypto.randomUUID();for(const n of [1,3,5]){const update=gift({giftType:1,comboId,repeatEnd:false});update.soLuong=n;await send('demoLiveEvent',update);}lastGift=gift({giftType:1,comboId,repeatEnd:true});lastGift.soLuong=5;await send('demoLiveEvent',lastGift);});
  $('demo-replay').onclick=safely(()=>{if(!lastGift)throw new Error('Gửi quà mẫu trước.');return send('demoLiveEvent',lastGift);});
  document.querySelectorAll('[data-connection]').forEach(b=>b.onclick=safely(()=>send('demoConnection',b.dataset.connection)));
  function addRule(rule){
    const tr=make('tr');tr.dataset.id=rule.id;tr.dataset.selection=presetForRule(rule)?'preset':'manual';
    const cell=make('td'),pick=make('button'),details=make('details');pick.type='button';pick.className='gift-select';pick.setAttribute('aria-haspopup','dialog');details.append(make('summary','Chi tiết / quy tắc thủ công'));const note=make('p');note.className='gift-selection-note';
    for(const [key,title]of Object.entries({giftId:'Gift ID',giftName:'Tên quà',minDiamonds:'Đơn giá từ',maxDiamonds:'Đến'})){const label=make('label',title),input=make('input');input.dataset.key=key;input.setAttribute('aria-label',title);input.value=rule[key];if(key.endsWith('Diamonds')){input.type='number';input.min='1';input.max='1000000';}else input.maxLength=key==='giftId'?80:60;input.oninput=()=>labelRule(tr);label.append(input);details.append(label);}
    pick.onclick=()=>picker.open(gift=>{
      if(!tr.isConnected)return;
      tr.dataset.selection=gift?'preset':'manual';
      if(gift)for(const [key,value]of Object.entries({giftId:gift.id,giftName:gift.name,minDiamonds:gift.diamonds,maxDiamonds:gift.diamonds})){const input=tr.querySelector(`[data-key=${key}]`);input.value=value;input.dataset.dirty='true';}
      labelRule(tr);details.open=!gift;if(!gift)tr.querySelector('[data-key=giftId]').focus();
    });cell.append(pick,note,details);tr.append(cell);
    for(const [key,choices]of [['item',items],['quantity',null],['effect',{item:'Theo item',sect:'Toàn tông môn',camera:'Camera'}],['enabled',null]]){
      const td=make('td'),input=make(choices?'select':'input');input.dataset.key=key;
      if(choices)input.append(...Object.entries(choices).map(([value,text])=>new Option(text,value)));else input.type=key==='enabled'?'checkbox':'number';
      if(key==='quantity'){input.min='1';input.max='100';}input.setAttribute('aria-label',{item:'Vật phẩm',quantity:'Số lượng mỗi quà',effect:'Hiệu ứng',enabled:'Bật quy tắc'}[key]);
      if(key==='enabled')input.checked=rule.enabled;else input.value=rule[key];td.append(input);tr.append(td);
    }
    const td=make('td'),remove=make('button','Xóa');remove.onclick=()=>{removedRules.add(tr.dataset.id);tr.remove();};td.append(remove);tr.append(td);$('gift-table').querySelector('tbody').append(tr);labelRule(tr);return pick;
  }
  $('add-gift-rule').onclick=()=>{const pick=addRule({id:crypto.randomUUID(),giftId:'',giftName:'',minDiamonds:1,maxDiamonds:1,item:'tea',quantity:1,effect:'item',enabled:true});pick.focus();pick.click();};
  $('save-gift-rules').onclick=safely(async()=>{const rows=[...$('gift-table').querySelectorAll('tbody tr')],removed=[...removedRules],latest=state.config.giftRules??[],sent=[];const rules=latest.filter(r=>!removedRules.has(r.id)).map(r=>({...r}));for(const tr of rows){let r=rules.find(r=>r.id===tr.dataset.id);const fresh=!r;if(!r){r={id:tr.dataset.id};rules.push(r);}for(const el of tr.querySelectorAll('[data-key]')){if(fresh||el.dataset.dirty==='true')r[el.dataset.key]=valueOf(el);sent.push([el,valueOf(el)]);}}await send('giftRules',rules);ackFields(sent);for(const id of removed)removedRules.delete(id);});
  let logMode;
  function renderLog(rows){
    const eventRows=rows.slice(-20).reverse().map(row=>make('li',`${new Date(row.timestamp).toLocaleTimeString('vi-VN')} · ${row.message}`));
    $('live-event-log').replaceChildren(...(eventRows.length?eventRows:[make('li','Chưa nhận bình luận hoặc follow trong phiên này.')]));
    $('live-log').textContent=rows.slice(-3).map(row=>row.message).join(' · ');
  }
  return {updateLog(d){if(d.mode===state?.mode)renderLog(d.interactionLog??[]);},update(s){state=s;if(logMode!==s.mode){logMode=s.mode;renderLog([]);}const r=s.config.live;if(!r)return;
    syncFields({username:'live-username',reconnectSeconds:'reconnect-seconds',maxReconnectAttempts:'reconnect-attempts'},r);sectLevels.update(s);
    if(!rulesLoaded){rulesLoaded=true;for(const rule of s.config.giftRules??[])addRule(rule);}
    $('game-mode').value=s.mode;$('live-demo-tools').hidden=s.mode!=='demo';setDisabled($('live-connect'),s.mode!=='live'||['connected','connecting','reconnecting','disconnecting'].includes(s.tiktok?.state));setDisabled($('live-disconnect'),s.mode!=='live'||s.tiktok?.state==='disconnected');
    for(const id of ['demo','count','clear','grant-item','prepare-breakthrough','quest-cultivate','quest-checkin','send-command','demo-speed','animation-preview','battle-demo','skill-1','skill-2']){const element=$(id);if(element)setDisabled(element,s.mode!=='demo');}
    for(const button of document.querySelectorAll('[data-event]'))setDisabled(button,s.mode!=='demo');
    $('live-state-box').dataset.state=s.tiktok?.state??'disconnected';
    $('live-status').textContent=`${s.mode==='demo'?'KẾT NỐI MÔ PHỎNG · ':''}${s.tiktok?.message??'Chưa kết nối'}`;
    $('live-history').replaceChildren(...(s.tiktok?.history??[]).slice(-5).reverse().map(row=>make('li',row.message)));
    if(s.interactions?.log)renderLog(s.interactions.log);
  }};
}
