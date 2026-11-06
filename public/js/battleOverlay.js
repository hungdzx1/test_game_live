export class BattleOverlay{
  constructor(){
    this.panel=document.createElement('aside');this.panel.className='battle-hud';this.panel.hidden=true;
    this.panel.innerHTML='<h2></h2><p class="boss-title"></p><progress max="1" value="0"></progress><p class="boss-hp"></p><ol></ol><small>Tổng sát thương thực vào quái + boss · 1: Kiếm khí / 2: Thiên lôi</small>';
    document.getElementById('stage').append(this.panel);this.results=document.createElement('aside');this.results.className='battle-results';this.results.hidden=true;document.getElementById('stage').append(this.results);
  }
  state(s){
    const f=s.battle?.view,active=s.effectivePhase==='battle';this.panel.hidden=!active;document.body.classList.toggle('in-battle',active);
    if(active){this.panel.querySelector('h2').textContent=f?.name??'Ma giới · Chờ đạo hữu nhập môn';const boss=f?.activeBoss;
      this.panel.querySelector('.boss-title').textContent=boss?`${boss.name}${boss.enraged?' · CUỒNG NỘ':''}`:'Chưa có boss';
      this.panel.querySelector('progress').max=boss?.maxHp??1;this.panel.querySelector('progress').value=boss?.hp??0;
      this.panel.querySelector('.boss-hp').textContent=boss?`${boss.hp.toLocaleString('vi-VN')} / ${boss.maxHp.toLocaleString('vi-VN')} · ${{alive:'ĐANG GIAO CHIẾN',dead:'ĐÃ TIÊU DIỆT',timeout:'ĐÃ RÚT LUI'}[boss.status]}`:'';
      this.panel.querySelector('ol').replaceChildren(...(f?.top??[]).map(p=>{const li=document.createElement('li');li.textContent=`${p.name} · ${p.damage.toLocaleString('vi-VN')}${p.hp<=0?' · hồi sinh':''}`;return li;}));
    }
    const result=s.battleResult;this.results.hidden=!result||active;
    if(result&&this.resultId!==result.resultId){this.resultId=result.resultId;const title=document.createElement('h2');title.textContent='THIÊN ĐẠO THÔNG CÁO · KHẢI HOÀN';
      this.results.replaceChildren(title,...result.fields.map(f=>{const row=document.createElement('p');row.textContent=`${f.name}: ${f.results.slice(0,3).map(p=>`${p.rank}. ${p.name} +${p.stages}`).join(' · ')||'Chưa có đóng góp'}${f.bosses.filter(b=>b.status==='dead').map(b=>` | ${b.name}: đòn cuối ${s.players.find(p=>p.userId===b.lastHit)?.name??b.lastHit}`).join('')}`;return row;}));
    }
  }
  message(e,state){
    const name=state?.players.find(p=>p.userId===e.userId)?.name??'Đạo hữu';
    return {'battle:prepare':'MA GIỚI XÂM LƯỢC · ĐẠO HỮU XUẤT CHIẾN','battle:return':'KHẢI HOÀN · TRỞ VỀ TÔNG MÔN','battle:result':'Thiên Đạo chốt TOP từng chiến trường','boss:spawned':`${e.name} xuất hiện!`,'boss:killed':`${e.name} ĐÃ TIÊU DIỆT · đòn cuối: ${name}`,'boss:timeout':`${e.name} đã rút lui`,'boss:enraged':`${e.name} CUỒNG NỘ!`,'battle:down':`${name} bị hạ · đang chờ hồi sinh`,'battle:revived':`${name} trở lại chiến trường`,'battle:hit':e.skill?`${name} · ${e.skill==='1'?'Kiếm Khí Trảm':'Thiên Lôi Quyết'} · ${e.damage} sát thương`:null}[e.kind];
  }
}
