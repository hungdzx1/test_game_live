import {confirmAction} from './ui/dialog.js';
import {createShell} from './ui/shell.js';
import {createLogStore,createLogs,eventMessage} from './ui/logs.js';
import {updateHome} from './ui/pages/home.js';
import {updateRealmTable} from './ui/pages/settings.js';
import {installFormState,syncField,ackFields} from './ui/forms.js';
import {$,text} from './ui/dom.js';
import {createStreamerPanel} from './streamerPanel.js';
import {createBattlePanel} from './battlePanel.js';
import {createLivePanel} from './livePanel.js';
import {createCultivationPanel} from './cultivationPanel.js';
import {connect,control} from './network.js';
createShell();
const logs=createLogStore();createLogs(logs);let toastTimer,state,dashboard,ids='',connectionState='',lastMode='';const pendingNamedEvents=[];
function log(message,level='system'){
  logs.push(message,level==='error'?'system':level,level==='error'?'error':'ok');
  text('toast',message);$('toast').dataset.status=level;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);
}
async function send(action,value,userId){try{const result=await control(action,value,userId);log('Đã áp dụng thao tác.');return result;}catch(error){log(error.message,'error');throw error;}}
const cultivationPanel=createCultivationPanel(log),battlePanel=createBattlePanel(log),livePanel=createLivePanel(log),streamerPanel=createStreamerPanel(log,{onDashboard:d=>{dashboard=d;if(state){updateHome(state,d?.mode===state.mode?d:null);if(d?.mode===state.mode)livePanel.updateLog(d);}}});
$('demo').onclick=()=>send('demo',Number($('count').value));
document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=async()=>{if(['battle','cultivation'].includes(b.dataset.phase)&&!await confirmAction('Chuyển pha ngay? Trận đang chạy có thể chốt thưởng hoặc nghi thức tạm hoãn.'))return;return send('phase',b.dataset.phase);});
document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>send('event',b.dataset.event,$('player').value));
for(const key of ['camera','graphics'])$(key).onchange=async()=>{const el=$(key),value=el.value;await send(key,value);ackFields([[el,value]]);};
installFormState(log);
function logEvent(event){const message=eventMessage(event,state);if(message)logs.push(message[1],message[0],'ok',event.timestamp);}
const network=connect({onStatus:message=>{text('connection',message);$('connection').dataset.connected=String(message.startsWith('Đã nối'));},onEvent:event=>{if(event.userId&&!event.name&&!state?.players.some(p=>p.userId===event.userId)&&pendingNamedEvents.length<100)pendingNamedEvents.push(event);else logEvent(event);},onState:s=>{
  state=s;for(const event of pendingNamedEvents.splice(0))logEvent(event);document.body.dataset.ready='true';text('summary',`${s.players.length} đạo hữu · ${s.mode==='demo'?'mô phỏng':'LIVE'} · ${{cultivation:'Tu luyện',battle:'Diệt ma',paused:'Tạm dừng',stopped:'Đã dừng'}[s.phase]??s.phase}`);
  if(s.storageError){text('connection',s.storageError);$('connection').dataset.connected='false';}
  for(const key of ['camera','graphics'])syncField(key,s.config[key]);
  const next=s.players.map(p=>p.userId).join(',');if(next!==ids){ids=next;const selected=$('player').value;$('player').replaceChildren(...s.players.map(p=>new Option(p.name,p.userId)));if(s.players.some(p=>p.userId===selected))$('player').value=selected;}
  cultivationPanel.update(s);battlePanel.update(s);livePanel.update(s);streamerPanel.update(s);updateRealmTable(s.config.cultivation.realms);updateHome(s,dashboard?.mode===s.mode?dashboard:null);
  if(lastMode!==s.mode){lastMode=s.mode;logs.push(s.mode==='demo'?'Đang dùng dữ liệu mô phỏng.':'Đang dùng dữ liệu người chơi LIVE.','system');}
  const status=`${s.mode}:${s.tiktok?.state}:${s.tiktok?.code}`;if(connectionState!==status){connectionState=status;logs.push(s.tiktok?.message??'Chưa kết nối TikTok.','connection',s.tiktok?.state==='error'?'error':'ok');}
}});
window.addEventListener('pagehide',()=>{network.close();clearTimeout(toastTimer);},{once:true});
