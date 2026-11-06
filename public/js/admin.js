import {createStreamerPanel} from './streamerPanel.js';
import {createBattlePanel} from './battlePanel.js';
import {createLivePanel} from './livePanel.js';
import { connect, control } from './network.js';
import {createCultivationPanel} from './cultivationPanel.js';
const $ = id => document.getElementById(id);
function log(text) { const li = document.createElement('li'); li.textContent = `${new Date().toLocaleTimeString('vi-VN')} · ${text}`; $('logs').prepend(li); while ($('logs').children.length > 12) $('logs').lastChild.remove(); }
async function send(action,value,userId) { try { await control(action,value,userId); log('Đã áp dụng thao tác.'); } catch(e) { log(e.message); } }
$('demo').onclick = () => send('demo', Number($('count').value));
$('clear').onclick = () => streamerPanel.reset().catch(e=>log(e.message));
document.querySelectorAll('[data-phase]').forEach(b => b.onclick = () => {if(['battle','cultivation'].includes(b.dataset.phase)&&!confirm('Chuyển pha ngay? Pha hiện tại sẽ kết thúc và trận đang chạy sẽ chốt thưởng.'))return;send('phase',b.dataset.phase);});
document.querySelectorAll('[data-event]').forEach(b => b.onclick = () => send('event',b.dataset.event,$('player').value));
for (const key of ['camera','graphics']) $(key).onchange = () => send(key,$(key).value);
const cultivationPanel=createCultivationPanel(log),battlePanel=createBattlePanel(log),livePanel=createLivePanel(log),streamerPanel=createStreamerPanel(log);
let ids = '';
connect({ onStatus: text => $('connection').textContent = text, onState: state => {
  $('summary').textContent = state.storageError??`${state.players.length} đạo hữu · ${state.mode==='demo'?'mô phỏng':'LIVE'} · ${ {cultivation:'Tu luyện',battle:'Diệt ma',paused:'Tạm dừng',stopped:'Đã dừng'}[state.phase] }`;
  for (const key of ['camera','graphics']) if (document.activeElement !== $(key)) $(key).value = state.config[key];
  const next = state.players.map(p=>p.userId).join(',');
  if (next !== ids) { ids = next; const selected = $('player').value; $('player').replaceChildren(...state.players.map(p=>new Option(p.name,p.userId))); if (state.players.some(p=>p.userId===selected)) $('player').value = selected; }
  cultivationPanel.update(state);battlePanel.update(state);livePanel.update(state);streamerPanel.update(state);
} });
