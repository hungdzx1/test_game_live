import {GIFT_PRESETS} from './giftPresets.js';
export function createGiftPicker(){
  const dialog=document.createElement('dialog');dialog.id='gift-picker';dialog.className='ui-dialog gift-picker';dialog.setAttribute('aria-labelledby','gift-picker-title');
  dialog.innerHTML='<h2 id="gift-picker-title">Chọn quà tặng</h2><p>Ba quà có sẵn khớp đúng ID và giá một quà. Các quà cùng giá khác không khớp lựa chọn này.</p><div class="gift-preset-grid"></div><div class="dialog-actions"><button id="gift-manual" type="button">Nhập thủ công / dải đơn giá</button><button id="gift-picker-close" type="button">Đóng</button></div>';
  let choose,previous;
  function select(gift){const callback=choose;dialog.close();callback?.(gift);}
  for(const gift of GIFT_PRESETS){const button=document.createElement('button'),img=document.createElement('img'),label=document.createElement('strong'),detail=document.createElement('small');button.type='button';button.dataset.giftId=gift.id;button.className='gift-preset';img.src=gift.image;img.alt=gift.label;img.width=160;img.height=170;label.textContent=`${gift.label} · ${gift.diamonds} xu`;detail.textContent=`ID ${gift.id}`;button.append(img,label,detail);button.onclick=()=>select(gift);dialog.querySelector('.gift-preset-grid').append(button);}
  dialog.querySelector('#gift-manual').onclick=()=>select(null);dialog.querySelector('#gift-picker-close').onclick=()=>dialog.close();
  dialog.onclose=()=>{choose=null;if(previous?.isConnected)previous.focus({preventScroll:true});};
  document.body.append(dialog);
  return {open(callback){previous=document.activeElement;choose=callback;dialog.showModal();dialog.querySelector('.gift-preset').focus();}};
}
