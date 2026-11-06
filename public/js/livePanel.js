import {control} from './network.js';
const items={tea:'Trà Ngộ Đạo',pill:'Độ Kiếp Đan',blessing:'Ban Phúc',root:'Biến Dị Linh Căn',camera:'Quay Cam'};
const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function createLivePanel(log){
  const section=make('section');section.id='live-panel';section.innerHTML=`
    <h2>06 / TikTok LIVE & tương tác</h2><p class="notice">Công cụ không tự bắt đầu livestream. Hãy lên LIVE trước bằng TikTok/LIVE Studio, sau đó bấm NỐI.</p>
    <label>Dữ liệu <select id="game-mode"><option value="demo">ĐANG DÙNG DỮ LIỆU MÔ PHỎNG</option><option value="live">Dữ liệu người chơi LIVE</option></select></label>
    <p>Demo và LIVE lưu riêng; chuyển chế độ giữ nguyên tiến trình từng bên. Thêm nhân vật và thử sự kiện giả chỉ có trong demo.</p>
    <label>Tên tài khoản TikTok <input id="live-username" maxlength="25" placeholder="@ten_tai_khoan" autocomplete="off"></label>
    <label>Khóa ký Euler Stream (tùy chọn)<input id="live-sign-key" type="password" maxlength="512" autocomplete="off"></label>
    <p>Connector không chính thức 2.5.0 trao đổi với TikTok và dịch vụ ký Euler Stream. Khóa ký chỉ giữ trong bộ nhớ, nhập lại sau khi ngắt; không cần mật khẩu/cookie TikTok.</p>
    <div class="row"><button id="live-connect">NỐI</button><button id="live-disconnect">NGẮT</button></div><p id="live-status" role="status"></p><ol id="live-history"></ol>
    <div class="row"><label>Chờ nối lại (s)<input id="reconnect-seconds" type="number" min="1" max="60"></label><label>Lần thử tối đa<input id="reconnect-attempts" type="number" min="0" max="30"></label></div>
    <div class="row"><label>Mốc tim<input id="wish-threshold" type="number" min="10" max="1000000"></label><label>Hồi phúc lợi (s)<input id="wish-cooldown" type="number" min="1" max="3600"></label><button id="save-live-settings">Lưu cài đặt LIVE</button></div>
    <p id="wish-detail"></p>
    <h2>Quà → vật phẩm</h2><p>Ưu tiên Gift ID → tên quà → dải đơn giá kim cương. Số vật phẩm = số quà chốt × số lượng/quà. Quà chưa nhập môn được giữ chờ; khi tu luyện tự dùng qua luật item, phần chưa dùng được giữ trong túi. Battle giữ item chờ về tông môn.</p>
    <div class="gift-table-scroll"><table id="gift-table"><thead><tr><th>Gift ID</th><th>Tên quà</th><th>Đơn giá từ/đến</th><th>Vật phẩm</th><th>Số lượng/quà</th><th>Hiệu ứng</th><th>Bật</th><th></th></tr></thead><tbody></tbody></table></div>
    <div class="row"><button id="add-gift-rule">Thêm quy tắc</button><button id="save-gift-rules">Lưu bảng quà</button></div>
    <div id="live-demo-tools"><h2>Sự kiện giả · cùng luồng xử lý</h2><p>Dùng đạo hữu đang chọn ở mục 03. Nếu chưa có người, ID demo-khach được giữ quà chờ đến khi bình luận nhập môn ở mục 04.</p>
    <div class="row"><button data-like="1">1 tim</button><button data-like="10">10 tim</button><button data-like="100">100 tim</button><button data-like="1000">1.000 tim</button><button id="demo-follow">Theo dõi</button><button id="demo-enter">Vào phòng</button></div>
    <label>Gift ID<input id="demo-gift-id" value="5655" maxlength="30"></label><label>Tên quà<input id="demo-gift-name" value="Quà demo" maxlength="60"></label>
    <div class="row"><label>Đơn giá<select id="demo-diamonds"><option value="1">Nhỏ · 1</option><option value="10">Vừa · 10</option><option value="100">Lớn · 100</option></select></label><button id="demo-gift">Gửi quà đơn</button><button id="demo-combo">Combo 1 → 3 → 5 → chốt 5</button><button id="demo-replay">Gửi lại quà vừa chốt</button></div>
    <div class="row"><button data-connection="connect">Nối mô phỏng</button><button data-connection="drop">Rớt mạng / nối lại</button><button data-connection="offline">Kênh chưa LIVE</button><button data-connection="end">LIVE kết thúc</button><button data-connection="disconnect">Ngắt mô phỏng</button></div></div>
    <p id="live-log"></p>`;
  document.querySelector('#logs').closest('section').before(section);document.querySelector('header .eyebrow').textContent='VẠN GIỚI TRANH PHONG / GIAI ĐOẠN 04';document.querySelector('main>.notice').textContent='TikTok LIVE: nhận sự kiện sau khi streamer tự lên LIVE. Có chế độ demo độc lập.';
  const $=id=>document.getElementById(id);let state,lastGift,rulesLoaded=false,loaded=false;
  const selected=()=>state?.players.find(p=>p.userId===$('player').value)??{userId:'demo-khach',name:'Đạo Hữu Mới'};
  async function send(action,value,userId){try{const r=await control(action,value,userId);log('Đã áp dụng thao tác LIVE/demo.');return r;}catch(e){log(e.message);throw e;}}
  const safely=fn=>()=>Promise.resolve().then(fn).catch(()=>{});
  function event(loai,data={}){const p=selected();return {eventId:crypto.randomUUID(),loai,userId:p.userId,ten:p.name,...data};}
  function gift(meta={}){return event('qua',{qua:$('demo-gift-name').value,giftId:$('demo-gift-id').value,soKimCuong:Number($('demo-diamonds').value),soLuong:1,rawMeta:{giftType:0,...meta}});}
  $('game-mode').onchange=safely(()=>send('mode',$('game-mode').value));
  $('live-connect').onclick=safely(async()=>{const key=$('live-sign-key').value;$('live-sign-key').value='';await send('liveConnect',{username:$('live-username').value,signApiKey:key});});
  $('live-disconnect').onclick=safely(()=>send('liveDisconnect'));
  $('save-live-settings').onclick=safely(()=>send('liveSettings',{reconnectSeconds:Number($('reconnect-seconds').value),maxReconnectAttempts:Number($('reconnect-attempts').value),wishThreshold:Number($('wish-threshold').value),wishCooldownMs:Number($('wish-cooldown').value)*1000}));
  document.querySelectorAll('[data-like]').forEach(b=>b.onclick=safely(()=>send('demoLiveEvent',event('tim',{soLuong:Number(b.dataset.like)}))));
  $('demo-follow').onclick=safely(()=>send('demoLiveEvent',event('theodoi')));$('demo-enter').onclick=safely(()=>send('demoLiveEvent',event('vao')));
  $('demo-gift').onclick=safely(()=>{lastGift=gift();return send('demoLiveEvent',lastGift);});
  $('demo-combo').onclick=safely(async()=>{const comboId=crypto.randomUUID();for(const n of [1,3,5]){const update=gift({giftType:1,comboId,repeatEnd:false});update.soLuong=n;await send('demoLiveEvent',update);}lastGift=gift({giftType:1,comboId,repeatEnd:true});lastGift.soLuong=5;await send('demoLiveEvent',lastGift);});
  $('demo-replay').onclick=safely(()=>{if(!lastGift)throw new Error('Gửi quà mẫu trước.');return send('demoLiveEvent',lastGift);});
  document.querySelectorAll('[data-connection]').forEach(b=>b.onclick=safely(()=>send('demoConnection',b.dataset.connection)));
  function addRule(rule){
    const tr=make('tr');tr.dataset.id=rule.id;
    for(const key of ['giftId','giftName']){const td=make('td'),input=make('input');input.dataset.key=key;input.value=rule[key];input.maxLength=key==='giftId'?30:60;td.append(input);tr.append(td);}
    const range=make('td');for(const key of ['minDiamonds','maxDiamonds']){const input=make('input');input.dataset.key=key;input.type='number';input.min='1';input.max='1000000';input.value=rule[key];range.append(input);}tr.append(range);
    for(const [key,choices]of [['item',items],['quantity',null],['effect',{item:'Theo item',sect:'Toàn tông môn',camera:'Camera'}],['enabled',null]]){
      const td=make('td'),input=make(choices?'select':'input');input.dataset.key=key;
      if(choices)input.append(...Object.entries(choices).map(([value,text])=>new Option(text,value)));else input.type=key==='enabled'?'checkbox':'number';
      if(key==='enabled')input.checked=rule.enabled;else input.value=rule[key];td.append(input);tr.append(td);
    }
    const td=make('td'),remove=make('button','Xóa');remove.onclick=()=>tr.remove();td.append(remove);tr.append(td);$('gift-table').querySelector('tbody').append(tr);
  }
  $('add-gift-rule').onclick=()=>addRule({id:crypto.randomUUID(),giftId:'',giftName:'',minDiamonds:1,maxDiamonds:1,item:'tea',quantity:1,effect:'item',enabled:true});
  $('save-gift-rules').onclick=safely(async()=>{const rules=[...$('gift-table').querySelectorAll('tbody tr')].map(tr=>{const r={id:tr.dataset.id};for(const el of tr.querySelectorAll('[data-key]'))r[el.dataset.key]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;return r;});await send('giftRules',rules);});
  return {update(s){state=s;const r=s.config.live;if(!r)return;
    if(!loaded){loaded=true;$('live-username').value=r.username;$('reconnect-seconds').value=r.reconnectSeconds;$('reconnect-attempts').value=r.maxReconnectAttempts;$('wish-threshold').value=r.wishThreshold;$('wish-cooldown').value=r.wishCooldownMs/1000;}
    if(!rulesLoaded){rulesLoaded=true;for(const rule of s.config.giftRules??[])addRule(rule);}
    $('game-mode').value=s.mode;$('live-demo-tools').hidden=s.mode!=='demo';$('live-connect').disabled=s.mode!=='live'||['connected','connecting','reconnecting','disconnecting'].includes(s.tiktok?.state);$('live-disconnect').disabled=s.mode!=='live';
    for(const id of ['demo','count','clear','grant-item','prepare-breakthrough','quest-cultivate','quest-checkin','send-command','demo-speed','animation-preview','battle-demo','skill-1','skill-2']){const element=$(id);if(element)element.disabled=s.mode!=='demo';}
    for(const button of document.querySelectorAll('[data-event]'))button.disabled=s.mode!=='demo';
    $('live-status').textContent=`${s.mode==='demo'?'KẾT NỐI MÔ PHỎNG · ':''}${s.tiktok?.message??'Chưa kết nối'}`;
    $('live-history').replaceChildren(...(s.tiktok?.history??[]).slice(-5).reverse().map(row=>make('li',row.message)));
    const wish=s.interactions?.wish;$('wish-detail').textContent=wish?`Nguyện Lực ${wish.power}/${wish.threshold} · ${wish.awards} lần ban phúc · ${wish.pending} người đang chờ điểm sau battle`:'';
    $('live-log').textContent=(s.interactions?.log??[]).slice(-3).map(row=>row.message).join(' · ');
  }};
}
