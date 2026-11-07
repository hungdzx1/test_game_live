import {setDisabled} from './forms.js';
const items={tea:'Trà Ngộ Đạo',pill:'Độ Kiếp Đan',blessing:'Ban Phúc',root:'Biến Dị Linh Căn',camera:'Quay Cam'};
export function createSectLevelsPanel(send){
  const root=document.querySelector('#sect-level-panel'),body=root.querySelector('tbody');let dirty=false,signature='';
  root.addEventListener('input',()=>dirty=true);root.addEventListener('change',()=>dirty=true);
  function add(row){
    const tr=document.createElement('tr'),level=body.children.length+1;
    const number=document.createElement('td');number.textContent=level;tr.append(number);
    for(const key of ['likes','item','quantity']){
      const td=document.createElement('td'),field=document.createElement(key==='item'?'select':'input');field.dataset.levelKey=key;field.setAttribute('aria-label',`${key==='likes'?'Số tim':key==='item'?'Quà':'Số lượng thưởng'} cấp ${level}`);
      if(key==='item'){field.append(new Option('Không thưởng',''),...Object.entries(items).map(([id,name])=>new Option(name,id)));field.value=row.reward?.item??'';}
      else{field.type='number';field.min='1';field.max=key==='likes'?'1000000000':'100';field.required=true;field.value=key==='likes'?row.likes:row.reward?.quantity??1;}
      td.append(field);tr.append(td);
    }
    const scope=document.createElement('td');scope.textContent='Toàn tông môn';tr.append(scope);body.append(tr);
    const reward=tr.querySelector('[data-level-key=item]'),quantity=tr.querySelector('[data-level-key=quantity]');reward.onchange=()=>quantity.disabled=!reward.value;quantity.disabled=!reward.value;
  }
  function read(){
    return [...body.children].map((tr,index)=>{
      for(const input of tr.querySelectorAll('input'))if(!input.checkValidity()){input.reportValidity();throw new Error('Kiểm tra số tim và số lượng thưởng của cấp '+(index+1)+'.');}
      const value=key=>tr.querySelector(`[data-level-key=${key}]`).value;
      return {level:index+1,likes:Number(value('likes')),reward:value('item')?{item:value('item'),quantity:Number(value('quantity'))}:null,scope:'all'};
    });
  }
  function buttons(){setDisabled(root.querySelector('#add-sect-level'),body.children.length>=50);setDisabled(root.querySelector('#remove-sect-level'),body.children.length<=1);}
  root.querySelector('#add-sect-level').onclick=()=>{if(body.children.length>=50)return;add({likes:5000,reward:null});dirty=true;buttons();body.lastElementChild.querySelector('input').focus();};
  root.querySelector('#remove-sect-level').onclick=()=>{if(body.children.length<=1)return;body.lastElementChild.remove();dirty=true;buttons();};
  root.querySelector('#save-sect-levels').onclick=async()=>{
    const rows=read(),sent=JSON.stringify(rows);await send('sectLevels',rows);
    if(JSON.stringify(read())===sent){dirty=false;signature=sent;}
  };
  return {update(state){
    const rows=state.config.sectLevels;if(rows&&!dirty&&JSON.stringify(rows)!==signature){signature=JSON.stringify(rows);body.replaceChildren();for(const row of rows)add(row);buttons();}
    const energy=state.interactions?.sectEnergy;root.querySelector('#sect-level-status').textContent=energy?`Cấp ${energy.level}/${energy.maxLevel} · ${energy.power.toLocaleString('vi-VN')} / ${energy.threshold.toLocaleString('vi-VN')} tim${energy.full?' · MAX':''}`:'Đang chờ dữ liệu tông môn';
  }};
}
