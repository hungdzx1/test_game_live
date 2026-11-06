import {confirmAction} from './ui/dialog.js';
import {mountBlocks} from './ui/dom.js';
import {syncField,syncFields,saveFields,changed,ackFields,valueOf} from './ui/forms.js';
import {control} from './network.js';
export function createBattlePanel(log){
  const section=document.createElement('section');section.id='battle-panel';section.innerHTML=`<section class="panel" data-mount="settings-battle">
    <h2>Chu kỳ tu luyện & diệt ma</h2><p>Tự động 10 phút tu luyện → 5 phút diệt ma. TOP tính tổng sát thương thực vào quái và boss; solo nhận +1 bước và Ban Phúc.</p>
    <div class="row"><label>Tu luyện (giây)<input id="cultivation-seconds" type="number" min="10" max="3600"></label><label>Diệt ma (giây)<input id="battle-seconds" type="number" min="10" max="3600"></label></div>
    <button id="save-cycle">Lưu cho lần vào pha tiếp theo</button></section><section class="panel" data-mount="demo-battle"><h2>Thử chiến đấu</h2><button id="battle-demo">Tạo demo 11 cảnh giới và vào trận</button>
    <label>Camera chiến trường<select id="battle-view"><option value="auto">Tự chuyển mỗi 8 giây</option></select></label>
    <div class="row"><button id="skill-1">1 · Kiếm Khí Trảm ×2 · 10s</button><button id="skill-2">2 · Thiên Lôi Quyết ×3 · 25s</button></div>
    <p>Dùng đạo hữu đang chọn trên trang Demo; hoặc gửi bình luận 1 / 2 trong công cụ bình luận. Tu vi, buff và độ kiếp tạm dừng suốt trận.</p><p id="battle-detail" aria-live="polite"></p><div id="battle-result-admin"></div></section>`;
  mountBlocks(section);
  const $=id=>document.getElementById(id);let options='';
  async function send(action,value,id){try{await control(action,value,id);log('Đã áp dụng thao tác chiến đấu.');}catch(e){log(e.message,'error');throw e;}}
  $('save-cycle').onclick=()=>saveFields('battleSettings',{cultivationSeconds:'cultivation-seconds',battleSeconds:'battle-seconds'},send);
  $('battle-demo').onclick=async()=>{if(await confirmAction('Tạo thêm 44 đạo hữu demo thuộc 11 cảnh giới và bắt đầu trận ngay? Tiến trình các đạo hữu cũ được giữ.'))return send('battleDemo');};
  $('battle-view').onchange=()=>send('battleView',$('battle-view').value==='auto'?'auto':Number($('battle-view').value));
  for(const key of ['1','2'])$('skill-'+key).onclick=()=>send('command',{text:key,eventId:crypto.randomUUID()},$('player').value);
  return {update(s){
    syncFields({cultivationSeconds:'cultivation-seconds',battleSeconds:'battle-seconds'},s.config.cycle);
    const b=s.battle,fields=b?.fields.filter(f=>f.count)??[],signature=fields.map(f=>f.id).join(',');if(signature!==options){options=signature;$('battle-view').replaceChildren(new Option('Tự chuyển','auto'),...fields.map(f=>new Option(f.name,String(f.id))));}
    if(document.activeElement!==$('battle-view'))$('battle-view').value=String(b?.manualView??'auto');
    const f=b?.view,p=f?.participants[$('player').value];
    $('battle-detail').textContent=b?`${f?.name??'Chưa có người'} · ${fields.length}/11 chiến trường · ${Math.ceil(s.remainingMs/1000)}s · ${f?.activeBoss?.name??'Chưa có boss'} ${{alive:'Đang chiến đấu',dead:'Đã tiêu diệt',timeout:'Hết giờ'}[f?.activeBoss?.status]??''}${p?` | HP ${p.hp}/${p.maxHp} · Sát thương ${p.damage} · Hồi 1: ${Math.ceil(Math.max(0,p.cooldowns['1']-b.elapsedMs)/1000)}s / 2: ${Math.ceil(Math.max(0,p.cooldowns['2']-b.elapsedMs)/1000)}s`:''}`:'Chưa có trận.';
    const selected=s.players.find(p=>p.userId===$('player').value);if(selected)$('battle-detail').textContent+=` | Thưởng chờ độ kiếp: ${selected.pendingStageRewards??0} bước`;
    const result=s.battleResult;if(result&&$('battle-result-admin').dataset.result!==result.resultId){$('battle-result-admin').dataset.result=result.resultId;$('battle-result-admin').replaceChildren(...result.fields.map(f=>{const p=document.createElement('p');p.textContent=`${f.name}: ${f.results.map(r=>`${r.rank}. ${r.name} (${r.damage}, +${r.stages} bước${r.blessing?', Ban Phúc':''})`).join(' · ')||'Không có đóng góp hợp lệ'}`;return p;}));}
  }};
}
