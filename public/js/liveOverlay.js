export function liveMessage(event){
  if(event.kind==='live:follow')return `${event.name} · cảm ơn đã theo dõi`;
  if(event.kind==='live:join')return `${event.name} · chào mừng vào phòng`;
  if(event.kind==='live:cultivation')return `${event.name} · linh khí hội tụ`;
  if(event.kind==='live:wish')return `THIÊN ĐẠO BAN PHÚC CỘNG ĐỒNG · +${event.points} điểm nhiệm vụ${event.pending?' sau khi về tông môn':''}`;
  if(event.kind==='live:gift')return `${event.name} · ${event.giftName} ×${event.quantity} · ${event.diamonds} kim cương → ${event.itemName} ×${event.itemCount}${event.waiting?' · giữ chờ nhập môn':''}`;
  return null;
}
export class LiveOverlay{
  constructor(){
    this.wish=document.createElement('div');this.wish.className='wish-hud';this.wish.innerHTML='<p></p><progress max="1000" value="0"></progress>';
    this.banner=document.createElement('div');this.banner.className='gift-banner';this.banner.hidden=true;this.banner.innerHTML='<span class="procedural-avatar"></span><strong></strong><p></p>';
    document.getElementById('stage').append(this.wish,this.banner);
  }
  state(s){
    const wish=s.interactions?.wish;this.wish.hidden=!wish;
    if(wish){this.wish.querySelector('p').textContent=`NGUYỆN LỰC TÔNG MÔN · ${wish.power}/${wish.threshold}`;this.wish.querySelector('progress').max=wish.threshold;this.wish.querySelector('progress').value=wish.power;}
    const gift=s.interactions?.giftBanner;this.banner.hidden=!gift;
    if(gift){this.banner.querySelector('.procedural-avatar').textContent=[...gift.name][0]??'Đ';this.banner.querySelector('strong').textContent=gift.name;this.banner.querySelector('p').textContent=`${gift.giftName} · ${gift.diamonds} kim cương → ${gift.itemName} ×${gift.count}`;}
    document.querySelector('footer.hud>small').textContent=s.mode==='demo'?'ĐANG DÙNG DỮ LIỆU MÔ PHỎNG':`DỮ LIỆU LIVE · ${s.tiktok?.state==='connected'?'ĐÃ NỐI TIKTOK':'GAME NỘI BỘ TIẾP TỤC'}`;
  }
}
