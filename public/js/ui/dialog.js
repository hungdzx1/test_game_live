// The same confirmation steps as before, rendered locally in the selected theme.
let dialog,tail=Promise.resolve();
function show(message,{title='Xác nhận thao tác',input=false,value='',readonly=false}={}){
  return new Promise(resolve=>{
    if(!dialog){dialog=document.createElement('dialog');dialog.className='ui-dialog';dialog.setAttribute('aria-labelledby','dialog-title');dialog.innerHTML='<form><span class="dialog-eyebrow">TU TIÊN LIVE · QUẢN LÝ PHIÊN</span><h2 id="dialog-title"></h2><p id="dialog-message"></p><label id="dialog-input-label">Nội dung xác nhận<input id="dialog-input" autocomplete="off" spellcheck="false"></label><div class="dialog-actions"><button type="button" id="dialog-cancel">Hủy</button><button type="submit" id="dialog-confirm" class="primary">Xác nhận</button></div></form>';document.body.append(dialog);}
    const previous=document.activeElement,field=dialog.querySelector('input');let settled=false;
    const finish=result=>{if(settled)return;settled=true;dialog.close();if(previous?.isConnected)previous.focus({preventScroll:true});resolve(result);};
    dialog.querySelector('h2').textContent=title;dialog.querySelector('p').textContent=message;dialog.querySelector('label').hidden=!input;field.value=value;field.readOnly=readonly;
    dialog.querySelector('form').onsubmit=e=>{e.preventDefault();finish(input?field.value:true);};dialog.querySelector('#dialog-cancel').onclick=()=>finish(null);dialog.oncancel=e=>{e.preventDefault();finish(null);};
    dialog.showModal();(input?field:dialog.querySelector('#dialog-cancel')).focus();if(input)field.select();
  });
}
function queued(message,options){const job=tail.then(()=>show(message,options));tail=job.catch(()=>{});return job;}
export const confirmAction=message=>queued(message,{});
export const promptValue=(message,options={})=>queued(message,{...options,input:true});
