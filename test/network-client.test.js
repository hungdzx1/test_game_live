import test from 'node:test';
import assert from 'node:assert/strict';
import {connect} from '../public/js/network.js';
test('Frontend reconnect, duplicate events, stale seq and new transport session',t=>{
  const sockets=[],timers=[],states=[],events=[];
  t.mock.method(globalThis,'setTimeout',(fn,ms)=>{timers.push({fn,ms});return timers.length;});t.mock.method(globalThis,'clearTimeout',()=>{});
  globalThis.location={protocol:'http:',host:'localhost:3000'};
  globalThis.WebSocket=class{constructor(url){this.url=url;sockets.push(this);}close(){this.onclose?.();}};
  const client=connect({onState:s=>states.push(s),onEvent:e=>events.push(e)}),first=sockets[0];first.onopen();
  const message=(socket,type,seq,payload,sessionId='one')=>socket.onmessage({data:JSON.stringify({version:1,sessionId,type,seq,payload})});
  message(first,'state:snapshot',5,{players:[]});message(first,'state:snapshot',4,{stale:true});assert.equal(states.length,1);
  message(first,'game:event',6,{eventId:'a'});message(first,'game:event',7,{eventId:'a'});assert.equal(events.length,1);
  first.close();assert.equal(timers[0].ms,500);timers[0].fn();const second=sockets[1];second.onopen();message(second,'state:snapshot',8,{reconnected:true});assert.ok(states.at(-1).reconnected);
  message(second,'game:event',9,{eventId:'a'});assert.equal(events.length,1);
  message(second,'state:snapshot',1,{restarted:true},'two');assert.ok(states.at(-1).restarted);client.close();assert.equal(timers.length,1);
});
