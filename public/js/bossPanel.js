import {confirmAction} from './ui/dialog.js';
import {mountBlocks} from './ui/dom.js';
import {syncFields,saveFields} from './ui/forms.js';
import {control} from './network.js';
export function createBattlePanel(log){
  const section=document.createElement('section');section.id='battle-panel';section.innerHTML=`<section class="panel" data-mount="settings-battle">
    <h2>Chu kỳ tu luyện & đánh boss</h2><p>Mỗi đợt chọn ngẫu nhiên một trong ba boss, tránh trùng đợt trước. Tất cả tu sĩ cùng đánh; boss không đánh trả.</p>
    <div class="row"><label>Tu luyện (giây)<input id="cultivation-seconds" type="number" min="10" max="3600" step="1"></label><button id="save-cycle">Lưu thời gian tu luyện</button></div>
    <h3>Boss tự cân bằng HP</h3><p>HP chốt lúc xuất hiện theo sát thương tông môn và mức dùng chiêu. Người vào thêm không làm tăng HP giữa trận. Chỉ hạ boss mới trở về tu luyện, không có hạn giờ.</p>
    <div class="row"><label>Thời gian hạ mục tiêu (giây)<input id="boss-target-seconds" type="number" min="181" max="3600" step="1"></label><button id="save-bosses">Lưu mục tiêu cân bằng</button></div>
    <p>Mục tiêu mặc định240 giây là thời gian dự kiến, không phải thời gian bắt buộc. Dùng nhiều chiêu hoặc có thêm người mạnh có thể hạ boss sớm hơn.</p>
    <ul id="boss-candidates"></ul><p>Thưởng khi hạ bất kỳ boss: Ban Phúc ×3 kích hoạt chung toàn tông (x2 trong tổng90 giây), Độ Kiếp Đan ×2 cho mỗi tu sĩ đã nhập môn lúc boss chết. Không cần gây sát thương để nhận thưởng. Thay đổi mục tiêu áp dụng từ đợt tiếp theo.</p>
    </section><section class="panel" data-mount="demo-battle"><h2>Thử đánh boss</h2><button id="battle-demo">Thêm 44 đạo hữu demo và bắt đầu boss</button>
    <div class="row"><button id="skill-1">1 · Kiếm Khí Trảm ×2 · 10s</button><button id="skill-2">2 · Thiên Lôi Quyết ×3 · 25s</button></div>
    <p>Dùng đạo hữu đang chọn ở DEMO hoặc bình luận1/2. Tu vi, buff và độ kiếp tạm dừng suốt trận.</p><p id="battle-detail" aria-live="polite"></p><div id="battle-result-admin"></div></section>`;
  mountBlocks(section);const $=id=>document.getElementById(id);
  async function send(action,value,id){try{await control(action,value,id);log('Đã lưu thao tác boss.');}catch(e){log(e.message,'error');throw e;}}
  $('save-cycle').onclick=()=>saveFields('battleSettings',{cultivationSeconds:'cultivation-seconds'},send);
  $('save-bosses').onclick=()=>saveFields('bossSettings',{targetSeconds:'boss-target-seconds'},send);
  $('battle-demo').onclick=async()=>{if(await confirmAction('Thêm 44 đạo hữu demo và bắt đầu một đợt boss? Tiến trình cũ được giữ.'))return send('battleDemo');};
  for(const key of ['1','2'])$('skill-'+key).onclick=()=>send('command',{text:key,eventId:crypto.randomUUID()},$('player').value);
  return {update(s){
    syncFields({cultivationSeconds:'cultivation-seconds'},s.config.cycle);syncFields({targetSeconds:'boss-target-seconds'},s.config.boss);
    if(!$('boss-candidates').childElementCount)$('boss-candidates').replaceChildren(...s.config.boss.encounters.map(row=>{const li=document.createElement('li');li.textContent=row.name;return li;}));
    const b=s.battle,f=b?.view,p=f?.participants[$('player').value],boss=f?.activeBoss;
    const clock=b?.bossWarningRemainingMs>0?`Cảnh báo ${Math.ceil(b.bossWarningRemainingMs/1000)}s`:b?.endOnKill?`Đã đánh ${Math.floor((boss?.elapsedMs??0)/60000)}:${String(Math.floor((boss?.elapsedMs??0)/1000)%60).padStart(2,'0')} · đến khi hạ boss`:`${Math.ceil(s.remainingMs/1000)}s còn lại`;
    $('battle-detail').textContent=b?`${boss?.name??'Chờ boss'} · ${boss?.hp.toLocaleString('vi-VN')??0}/${boss?.maxHp.toLocaleString('vi-VN')??0} HP · ${clock} · ${f?.participantIds.length??0} tu sĩ${p?` | Sát thương ${p.damage} · Hồi1: ${Math.ceil(Math.max(0,p.cooldowns['1']-b.elapsedMs)/1000)}s /2: ${Math.ceil(Math.max(0,p.cooldowns['2']-b.elapsedMs)/1000)}s`:''}`:'Chưa có trận boss.';
    const result=s.battleResult;if(result&&$('battle-result-admin').dataset.result!==result.resultId){$('battle-result-admin').dataset.result=result.resultId;$('battle-result-admin').replaceChildren(...result.fields.flatMap(f=>f.bosses.map(b=>{const p=document.createElement('p');p.textContent=`${b.name}: ${b.status==='dead'?'ĐÃ HẠ':'ĐÃ KẾT THÚC'}${b.rewarded?` · Ban Phúc ×${b.reward.blessings}, Đan ×${b.reward.pills}/tu sĩ`:''}`;return p;})));}
  }};
}
