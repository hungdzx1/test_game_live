// Child process owned by unity-network-smoke.js. Temporary data only, no LIVE connection.
import {createApplication} from '../server.js';
const [dataRoot, requestedPort]=process.argv.slice(2);
if(!process.send||!dataRoot)throw new Error('Run through unity-network-smoke.js (isolated IPC child).');
const app=await createApplication({dataRoot,port:Number(requestedPort),connectorFactory:()=>{throw new Error('LIVE is forbidden in this smoke');}});
const port=await app.listen(),base=`http://127.0.0.1:${port}`;
const post=async(action,value,userId)=>{
  const response=await fetch(base+'/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,value,userId})});
  if(!response.ok)throw new Error(await response.text());
};
if(app.engine.players.size===0)await post('demo',3);
else await post('command',{text:'nhập môn',name:'Đệ tử sau restart',eventId:'unity-restart-join'},'unity-restart');
await post('phase','cultivation');
const timer=setInterval(()=>{const id=app.engine.players.keys().next().value;post('event','celebrate',id).catch(error=>console.error(error.message));},800);
process.send({ready:true,port,session:app.engine.transportId,players:app.engine.players.size});
process.on('message',async value=>{if(value==='stop'){clearInterval(timer);await app.close();process.exit(0);}});
process.on('disconnect',async()=>{clearInterval(timer);await app.close();process.exit(0);});
