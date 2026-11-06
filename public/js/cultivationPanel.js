import {mountBlocks} from './ui/dom.js';
import {syncField,syncFields,saveFields,changed,ackFields,valueOf} from './ui/forms.js';
import {control} from './network.js';
const names={tea:'Trà Ngộ Đạo',root:'Biến Dị Linh Căn',pill:'Độ Kiếp Đan',blessing:'Ban Phúc',camera:'Quay Cam'};
export function createCultivationPanel(log){
  const panel=document.createElement('section');panel.id='cultivation-panel';panel.innerHTML=`<section class="panel" data-mount="demo-cultivation"><h2>Tu luyện & độ kiếp</h2>
    <p>Dùng đạo hữu được chọn trên trang Demo. Tu vi, vật phẩm và kết quả đều do máy chủ tính toán.</p>
    <p id="cultivation-detail" aria-live="polite">Chưa chọn đạo hữu.</p>
    <progress id="cultivation-progress" max="1" value="0"></progress>
    <div class="row"><label>Tốc độ thử <select id="demo-speed"><option value="1">Bình thường ×1</option><option value="10">Nhanh ×10</option></select></label>
    <label><input id="animation-preview" type="checkbox"> Cho đạo hữu đi dạo tự động</label></div>
    <div class="row"><button id="prepare-breakthrough">Đưa đến Viên Mãn (demo)</button><button id="quest-cultivate">Nhiệm vụ tu luyện</button><button id="quest-checkin">Điểm danh</button></div>
    <p id="breakthrough-detail"></p>
    </section><section class="panel" data-mount="demo-items"><h2>Túi đồ & điểm nhiệm vụ</h2><p id="inventory-detail"></p>
    <label>Vật phẩm <select id="item-choice"><option value="tea">Trà Ngộ Đạo</option><option value="root">Biến Dị Linh Căn</option><option value="pill">Độ Kiếp Đan</option><option value="blessing">Ban Phúc</option><option value="camera">Quay Cam</option></select></label>
    <div class="row"><button id="grant-item">Cấp 1 vật phẩm (demo)</button><button id="use-item">Dùng vật phẩm</button><button id="redeem-item">Đổi bằng điểm nhiệm vụ</button></div>
    <p id="quest-costs"></p>
    </section><section class="panel" data-mount="demo-comments"><h2>Thử bình luận nhập môn</h2>
    <label>User ID <input id="join-id" maxlength="100" value="demo-khach"></label>
    <label>Tên <input id="join-name" maxlength="40" value="Đạo Hữu Mới"></label>
    <label>Bình luận <input id="command-text" maxlength="200" value="nhập môn"></label><button id="send-command">Gửi bình luận thử</button>
    <p>Lệnh: nhập môn · tu luyện · điểm danh · dùng trà. User ID là định danh, không phải tên hiển thị.</p>
    </section><section class="panel" data-mount="settings-cultivation"><h2>Giới hạn tu luyện</h2><label>Hệ số tối đa <input id="max-multiplier" type="number" min="1" max="100" step="1"></label>
    <label>Thất bại để đảm bảo <input id="fate-failures" type="number" min="1" max="100" step="1"></label><button id="save-cultivation">Lưu giới hạn</button>
    <p>Trà/Ban Phúc đếm 30 giây tu luyện. Diệt ma và tạm dừng đóng băng tu vi, buff, hồi độ kiếp. Nghi thức Thiên Mệnh tự kích hoạt khi đủ số thất bại tại cùng cảnh giới. Đổi cấu hình không đổi kết quả độ kiếp đã chốt.</p></section>`;
  mountBlocks(panel);
  const $=id=>document.getElementById(id),selected=()=>$('player').value;
  async function send(action,value,id=selected()){try{await control(action,value,id);log('Đã áp dụng thao tác tu luyện.');}catch(e){log(e.message,'error');throw e;}}
  const command=(text,id=selected(),name)=>send('command',{text,name,eventId:crypto.randomUUID()},id);
  $('demo-speed').onchange=()=>send('demoSpeed',Number($('demo-speed').value));
  $('animation-preview').onchange=()=>send('animationPreview',$('animation-preview').checked);
  $('prepare-breakthrough').onclick=()=>send('prepareBreakthrough');
  $('quest-cultivate').onclick=()=>command('tu luyện');$('quest-checkin').onclick=()=>command('điểm danh');
  $('grant-item').onclick=()=>send('grantItem',$('item-choice').value);
  $('use-item').onclick=()=>send('useItem',$('item-choice').value);
  $('redeem-item').onclick=()=>send('redeem',$('item-choice').value);
  $('send-command').onclick=()=>command($('command-text').value,$('join-id').value,$('join-name').value);
  $('save-cultivation').onclick=()=>saveFields('cultivationSettings',{maxMultiplier:'max-multiplier',fateFailures:'fate-failures'},send);
  return {update(state){
    const p=state.players.find(p=>p.userId===selected()),r=state.config.cultivation;
    if(r)syncFields({maxMultiplier:'max-multiplier',fateFailures:'fate-failures'},r);
    if(document.activeElement!==$('demo-speed'))$('demo-speed').value=String(state.demoSpeed??1);$('animation-preview').checked=!!state.animationPreview;
    if(!p){$('cultivation-detail').textContent='Hãy tạo hoặc chọn đạo hữu.';$('inventory-detail').textContent='';$('breakthrough-detail').textContent='';return;}
    $('cultivation-detail').textContent=`${p.name} · ${p.realm} ${p.stage} · Tu vi ${p.cultivation.toFixed(1)} / ${p.cultivationRequired??'tích lũy'} · ${p.cultivationPerSecond.toFixed(1)}/giây · HP ${p.hp} / ATK ${p.atk} / DEF ${p.def}`;
    $('cultivation-progress').max=p.cultivationRequired??1;$('cultivation-progress').value=p.cultivationRequired?Math.min(p.cultivation,p.cultivationRequired):1;
    $('inventory-detail').textContent=Object.entries(names).map(([key,name])=>`${name}: ${p.inventory[key]}`).join(' · ')+` | Điểm nhiệm vụ: ${p.questState.points} | Linh căn ×${p.spiritualRootMultiplier} | Buff: ${p.activeBuffs.map(b=>`${names[b.kind]} ${Math.ceil(b.remainingMs/1000)}s`).join(', ')||'không'}`;
    $('quest-costs').textContent=r?'Giá đổi: '+Object.entries(r.quests.costs).map(([key,cost])=>`${names[key]} ${cost} điểm`).join(' · '):'';
    const b=p.breakthrough;$('breakthrough-detail').textContent=`Hàng chờ: ${state.breakthroughQueueLength} · ${state.breakthrough?.userId===p.userId?'ĐANG ĐỘ KIẾP · ':''}Xác suất chuẩn bị: ${p.breakthroughProbability}% · Bảo hộ +${b.protectionPoints}% · Đan đã dùng: ${b.pillCount} · Thiên Mệnh ${b.heavenlyFate}/${r?.fateFailures} · Hồi: ${Math.ceil(b.cooldownRemainingCultivationMs/1000)}s tu luyện`;
  }};
}
