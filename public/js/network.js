export function connect({ onState, onEvent = () => {}, onStatus = () => {} }) {
  let socket, retry = 0, timer, closed = false, session, lastSeq = -1;
  const seen = new Set();
  function open() {
    if (closed) return;
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    socket.onopen = () => { retry = 0;lastSeq=-1; onStatus('Đã nối máy chủ nội bộ'); };
    socket.onmessage = ({ data }) => {
      let m; try { m = JSON.parse(data); } catch { return; }
      if (m.version !== 1) return;
      if (session !== m.sessionId) { session = m.sessionId; seen.clear(); lastSeq = -1; }
      if (m.seq <= lastSeq) return; lastSeq = m.seq;
      if (m.type === 'state:snapshot') onState(m.payload,{sessionId:m.sessionId,serverTime:m.serverTime});
      else if (m.type === 'game:event' && !seen.has(m.payload.eventId)) { seen.add(m.payload.eventId); if (seen.size > 200) seen.delete(seen.values().next().value); onEvent(m.payload); }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => { onStatus('Mất kết nối · đang thử nối lại…'); if (!closed) timer = setTimeout(open, Math.min(10000, 500 * 2 ** Math.min(retry++, 5))); };
  }
  open(); return { close() { closed = true; clearTimeout(timer); socket.close(); } };
}
export async function control(action, value, userId) {
  const session=await fetch('/api/admin-session',{cache:'no-store'});const {token}=await session.json();
  const response = await fetch('/api/control', { method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':token}, body:JSON.stringify({action,value,userId}) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
}
