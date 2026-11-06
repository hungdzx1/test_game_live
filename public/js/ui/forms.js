import {$} from './dom.js';
export const valueOf=e=>e.type==='checkbox'?e.checked:['number','range'].includes(e.type)?Number(e.value):e.value;
export function syncField(id,value){const e=$(id);if(!e)return;if(e.dataset.dirty==='true')return;e._saved=value;if(e.type==='checkbox')e.checked=!!value;else e.value=String(value??'');}
export function syncFields(mapping,values){for(const [key,id]of Object.entries(mapping))syncField(id,values[key]);}
export function changed(id){const e=$(id);return e.dataset.dirty==='true'&&JSON.stringify(valueOf(e))!==JSON.stringify(e._saved);}
export async function saveFields(action,mapping,send,wrap=v=>v){
  const patch={},sent=[];for(const [key,id]of Object.entries(mapping)){const e=$(id);if(!changed(id))continue;if(!e.checkValidity()){e.reportValidity();throw new Error('Vui lòng kiểm tra giá trị vừa nhập.');}patch[key]=valueOf(e);sent.push([e,valueOf(e)]);}
  if(!sent.length)return {unchanged:true};await send(action,wrap(patch));ackFields(sent);return {ok:true};
}
export function ackFields(sent){for(const [e,value]of sent)if(JSON.stringify(valueOf(e))===JSON.stringify(value)){delete e.dataset.dirty;e._saved=value;}}
export function setDisabled(e,disabled){e.dataset.ruleDisabled=String(disabled);e.disabled=disabled||e.dataset.busy==='true';}
export function installFormState(log){
  for(const event of ['input','change'])document.addEventListener(event,e=>{if(e.target.matches('input,select,textarea'))e.target.dataset.dirty='true';},true);
  // Bind once after all pages have mounted; navigation never rebinds listeners.
  for(const e of document.querySelectorAll('button,select'))for(const name of ['onclick','onchange']){
    const handler=e[name];if(!handler)continue;e[name]=async function(event){if(e.dataset.busy==='true')return;const disabled=e.disabled;e.dataset.busy='true';e.setAttribute('aria-busy','true');e.disabled=true;try{const result=await handler.call(e,event);if(result?.unchanged)log('Không có thay đổi cần lưu.');return result;}catch(error){log(error.message,'error');}finally{delete e.dataset.busy;e.removeAttribute('aria-busy');e.disabled=disabled||e.dataset.ruleDisabled==='true';}};
  }
}
