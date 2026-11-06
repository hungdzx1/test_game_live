import {EventEmitter} from 'node:events';
import {TikTokAdapter} from './tiktokAdapter.js';
// Exercises the exact adapter/reconnect state machine without any network transport.
export class DemoConnection{
  constructor(settings={}){
    this.offline=false;this.current=null;
    this.adapter=new TikTokAdapter({settings,factory:()=>{
      const connection=new EventEmitter();connection.roomId='123456';connection.isConnected=false;
      connection.connect=async()=>{if(this.offline){const error=new Error('Demo offline');error.name='UserOfflineError';throw error;}connection.isConnected=true;return {isConnected:true,roomId:connection.roomId};};
      connection.disconnect=async()=>{connection.isConnected=false;};this.current=connection;return connection;
    }});
  }
  async simulate(kind){
    if(kind==='connect'){this.offline=false;return this.adapter.connect('demo_channel');}
    if(kind==='disconnect')return this.adapter.disconnect();
    if(kind==='offline'){await this.adapter.disconnect();this.offline=true;return this.adapter.connect('demo_channel');}
    if(kind==='drop'){if(!this.current?.isConnected)throw new Error('Nối mô phỏng trước khi thử rớt mạng.');this.current.isConnected=false;this.current.emit('disconnected',{code:1006});return;}
    if(kind==='end'){if(!this.current?.isConnected)throw new Error('Nối mô phỏng trước khi thử kết thúc LIVE.');this.current.emit('streamEnd',{action:3});return;}
    throw new Error('Kịch bản kết nối không hợp lệ.');
  }
}
