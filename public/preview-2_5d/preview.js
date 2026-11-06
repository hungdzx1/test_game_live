import * as THREE from 'three';
import {WIDTH,HEIGHT,ordered,layerRect,validateLayout,reorder} from './layout-model.js';

const $=id=>document.getElementById(id),status=text=>$('status').textContent=text;
let layout,manifest,selected='courtyard',renderer,camera,scene,root,scheduled=false,disposed=false;
const planes=new Map(),textures=new Map(),errors=[],params=new URLSearchParams(location.search);
document.body.classList.toggle('capture',params.has('capture'));
function asset(id){return manifest.assets.find(a=>a.id===id);}
function stats(fps=null){
  const info=renderer.info,loaded=[...textures.keys()].map(asset);
  const report={fps,drawCalls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures,uniqueSourceTextures:textures.size,rgbaBytes:loaded.reduce((n,a)=>n+a.width*a.height*4,0),errors:[...errors]};
  globalThis.previewTelemetry=report;$('metrics').textContent=`${report.drawCalls} draw calls · ${report.textures} texture GPU / ${report.uniqueSourceTextures} ảnh dùng chung · ${(report.rgbaBytes/1048576).toFixed(1)} MiB RGBA chưa nén, không mipmap${fps===null?' · render khi chỉnh sửa':` · ${fps.toFixed(1)} FPS trong bài đo 3 giây`}`;return report;
}
function draw(){if(disposed)return;scheduled=false;renderer.render(scene,camera);stats();updateGuide();}
function invalidate(){if(!scheduled&&!disposed){scheduled=true;requestAnimationFrame(draw);}}
function loadTexture(id){
  if(!textures.has(id))textures.set(id,new Promise((resolve,reject)=>new THREE.TextureLoader().load(asset(id).url,t=>{t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=false;t.minFilter=t.magFilter=THREE.LinearFilter;if(disposed)t.dispose();resolve(t);},undefined,()=>{errors.push(id);reject(new Error('Không tải được '+id));})));
  return textures.get(id);
}
function applyPlane(l){
  const a=asset(l.asset),r=layerRect(l,a),m=planes.get(l.id);m.userData.layer=l;
  m.position.set(r.left+r.width/2,HEIGHT-r.top-r.height/2,l.z);m.scale.set(r.width,r.height,1);m.renderOrder=l.z;
  m.material.opacity=l.opacity;m.material.blending=l.blend==='add'?THREE.AdditiveBlending:THREE.NormalBlending;m.material.needsUpdate=true;
  const [x,y,w,h]=r.crop,u=x/a.width,v=1-(y+h)/a.height,u2=(x+w)/a.width,v2=1-y/a.height,uv=m.geometry.attributes.uv;
  uv.setXY(0,u,v2);uv.setXY(1,u2,v2);uv.setXY(2,u,v);uv.setXY(3,u2,v);uv.needsUpdate=true;
  m.visible=l.visible&&!!m.material.map;
}
async function syncScene(){
  const wanted=new Set(layout.layers.map(l=>l.id));
  for(const [id,m]of planes)if(!wanted.has(id)){root.remove(m);m.geometry.dispose();m.material.dispose();planes.delete(id);}
  await Promise.all(layout.layers.map(async l=>{
    if(!planes.has(l.id)){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));m.name=l.id;m.visible=false;planes.set(l.id,m);root.add(m);}
    const m=planes.get(l.id);applyPlane(l);if(l.visible){const id=l.asset,t=await loadTexture(id);if(disposed||!planes.has(l.id)||m.userData.layer.asset!==id)return;m.material.map=t;applyPlane(m.userData.layer);}
  }));
  root.scale.setScalar(layout.view.zoom);root.position.set(WIDTH/2*(1-layout.view.zoom)+layout.view.panX,HEIGHT/2*(1-layout.view.zoom)-layout.view.panY,0);
  invalidate();
}
function updateGuide(){
  const l=layout.layers.find(l=>l.id===selected);$('guide').hidden=!l||!l.visible||!$('guides').checked;if(!l)return;
  const r=layerRect(l,asset(l.asset)),v=layout.view,x=WIDTH/2+(r.left-WIDTH/2)*v.zoom+v.panX,y=HEIGHT/2+(r.top-HEIGHT/2)*v.zoom+v.panY;
  Object.assign($('guide').style,{left:x/WIDTH*100+'%',top:y/HEIGHT*100+'%',width:r.width*v.zoom/WIDTH*100+'%',height:r.height*v.zoom/HEIGHT*100+'%'});
  Object.assign($('guide').firstElementChild.style,{left:l.anchor[0]*100+'%',top:l.anchor[1]*100+'%'});
}
function refreshList(){
  $('layer-count').textContent=layout.layers.length;$('layers').replaceChildren();
  for(const l of ordered(layout.layers)){
    const row=document.createElement('li');row.dataset.id=l.id;row.classList.toggle('selected',selected===l.id);row.draggable=true;
    const show=document.createElement('input');show.type='checkbox';show.checked=l.visible;show.setAttribute('aria-label','Hiện '+l.name);show.onchange=async()=>{l.visible=show.checked;await change();};
    const button=document.createElement('button');button.textContent=l.name;button.onclick=()=>{selected=l.id;refreshList();refreshFields();updateGuide();};row.append(show,button);
    row.ondragstart=e=>e.dataTransfer.setData('text/plain',l.id);row.ondragover=e=>e.preventDefault();row.ondrop=async e=>{e.preventDefault();reorder(layout,e.dataTransfer.getData('text/plain'),l.id);await change();};$('layers').append(row);
  }
}
function refreshFields(){
  const l=layout.layers.find(l=>l.id===selected)??layout.layers[0];if(!l)return;selected=l.id;$('selected-name').textContent=l.name;$('fields').replaceChildren();
  const fields=[['x','X',1],['y','Y',1],['scale','Tỷ lệ',.01],['scaleY','Tỷ lệ dọc bổ sung',.01],['opacity','Độ mờ',.05],['z','Thứ tự Z',1],['anchorX','Neo X (0–1)',.05],['anchorY','Neo Y (0–1)',.05],['cropX','Crop trái (px)',1],['cropY','Crop trên (px)',1],['cropW','Crop rộng (px)',1],['cropH','Crop cao (px)',1]];
  for(const [key,name,step]of fields){
    const label=document.createElement('label'),input=document.createElement('input');label.textContent=name;input.type='number';input.step=step;input.id='layer-'+key;
    const read=()=>key==='anchorX'?l.anchor[0]:key==='anchorY'?l.anchor[1]:key.startsWith('crop')?l.crop[['cropX','cropY','cropW','cropH'].indexOf(key)]:l[key];input.value=read();
    input.onchange=async()=>{const before=structuredClone(l),v=Number(input.value);if(key==='anchorX')l.anchor[0]=v;else if(key==='anchorY')l.anchor[1]=v;else if(key.startsWith('crop'))l.crop[['cropX','cropY','cropW','cropH'].indexOf(key)]=v;else l[key]=v;try{validateLayout(layout,manifest.assets);await change(false);}catch(error){Object.assign(l,before);input.value=read();status(error.message);}};
    label.append(input);$('fields').append(label);
  }
  const a=asset(l.asset);$('asset-details').textContent=`${a.id} · ${a.width}×${a.height} · alpha ${a.alphaChannel?'có':'không'} · trong suốt ${a.counts.transparent.toLocaleString('vi-VN')} px · bán trong suốt ${a.counts.semi.toLocaleString('vi-VN')} px · tín hiệu viền đỏ/xanh ${a.counts.redEdge}/${a.counts.blueEdge}. Không tự coi số đếm là lỗi chắc chắn.`;
}
async function change(fields=true){try{await syncScene();refreshList();if(fields)refreshFields();status('Đã đổi preview. Xuất JSON để lưu file riêng; không ghi vào caidat.json hay game state.');}catch(error){status(error.message);}}
function setMode(){
  const mode=$('mode').value,n=Number($('concept-opacity').value);$('stage').dataset.mode=mode;
  $('concept').style.display=mode==='compose'?'none':'block';$('concept').style.opacity=mode==='overlay'?n:1;$('concept').style.clipPath=mode==='compare'?`inset(0 ${(1-n)*100}% 0 0)`:'none';
  for(const [id,left,width]of [['preview-title',.03,.94],['preview-footer',.05,.9]])$(id).style.clipPath=mode==='compare'?`inset(0 0 0 ${Math.max(0,Math.min(100,(n-left)/width*100))}%)`:'none';
}
// Probe first: a failed import must leave the previous concept and layout visible.
function loadConcept(src){return new Promise((resolve,reject)=>{const probe=new Image();probe.onerror=()=>reject(new Error('Không tải được concept.'));probe.onload=()=>{$('concept').onload=resolve;$('concept').onerror=probe.onerror;$('concept').src=src;};probe.src=src;});}
function fileText(file){if(!file||file.size>32*1024*1024)throw new Error('File trống hoặc quá 32 MiB.');return file.text();}
function gallery(){
  if($('gallery').childElementCount)return;
  for(const a of manifest.assets){const card=document.createElement('article');card.className='asset-card';const figure=document.createElement('figure'),img=new Image();img.src=a.url;img.alt=a.id;figure.append(img);const title=document.createElement('h3');title.textContent=a.id;const info=document.createElement('p');info.textContent=`${a.width}×${a.height} · A:${a.alphaChannel?'có':'không'} · 0α:${a.counts.transparent} · 1–254α:${a.counts.semi}`;card.append(figure,title,info);$('gallery').append(card);}
}
async function start(){
  const responses=await Promise.all([fetch('/preview-2_5d/asset-audit.json'),fetch('/preview-2_5d/layout.json')]);if(responses.some(r=>!r.ok))throw new Error('Thiếu manifest/layout. Chạy node scripts/audit-assets.js.');
  manifest=await responses[0].json();layout=validateLayout(await responses[1].json(),manifest.assets);
  scene=new THREE.Scene();root=new THREE.Group();scene.add(root);camera=new THREE.OrthographicCamera(0,WIDTH,HEIGHT,0,.1,2000);camera.position.z=1000;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);$('world').append(renderer.domElement);
  const resize=()=>{const r=$('stage').getBoundingClientRect();renderer.setSize(r.width,r.height,false);invalidate();};new ResizeObserver(resize).observe($('stage'));resize();
  await loadConcept(layout.concept);await syncScene();refreshList();refreshFields();
  for(const key of ['zoom','panX','panY']){$(key).value=layout.view[key];$(key).onchange=async()=>{const old=layout.view[key];layout.view[key]=Number($(key).value);try{validateLayout(layout,manifest.assets);await change(false);}catch(error){layout.view[key]=old;$(key).value=old;status(error.message);}};}
  $('mode').value=params.get('mode')==='compare'?'compare':params.get('mode')==='overlay'?'overlay':'compose';$('mode').onchange=$('concept-opacity').oninput=setMode;setMode();
  $('backdrop').onchange=()=>{$('stage').dataset.backdrop=$('backdrop').value;document.body.dataset.backdrop=$('backdrop').value;};$('guides').onchange=updateGuide;
  $('reset-view').onclick=async()=>{Object.assign(layout.view,{zoom:1,panX:0,panY:0});for(const key of ['zoom','panX','panY'])$(key).value=layout.view[key];await change(false);};
  $('alpha-crop').onclick=async()=>{const l=layout.layers.find(l=>l.id===selected),a=asset(l.asset),b=a.bbox32;if(b)l.crop=[b[0],b[1],b[2]-b[0],b[3]-b[1]];await change();};
  $('full-crop').onclick=async()=>{const l=layout.layers.find(l=>l.id===selected),a=asset(l.asset);l.crop=[0,0,a.width,a.height];await change();};
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify(layout,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='layout-preview-07-0.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('Đã xuất JSON riêng; không ghi đè cấu hình game.');};
  $('import').onchange=async()=>{try{const next=validateLayout(JSON.parse(await fileText($('import').files[0])),manifest.assets);await loadConcept(next.concept);layout=next;selected=layout.layers[0]?.id;for(const key of ['zoom','panX','panY'])$(key).value=layout.view[key];await change();}catch(error){status('Không nhập: '+error.message);}finally{$('import').value='';}};
  $('concept-file').onchange=async()=>{try{const f=$('concept-file').files[0];if(!f||f.size>20*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type))throw new Error('Cần PNG/JPG/WebP tối đa 20 MiB.');const reader=new FileReader(),src=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f);});await loadConcept(src);layout.concept=src;$('mode').value='overlay';setMode();status('Concept nhập cục bộ, không gửi lên server. Xuất JSON sẽ kèm ảnh data URL.');}catch(error){status('Không nhập concept: '+error.message);}};
  $('gallery-tab').onclick=()=>{gallery();document.body.classList.add('gallery-mode');$('gallery').hidden=false;$('benchmark').hidden=true;};$('compose-tab').onclick=()=>{document.body.classList.remove('gallery-mode');$('gallery').hidden=true;$('benchmark').hidden=false;invalidate();};
  if(params.has('gallery'))$('gallery-tab').click();
  let drag;
  renderer.domElement.onpointerdown=e=>{const l=layout.layers.find(l=>l.id===selected);if(!l)return;drag={px:e.clientX,py:e.clientY,x:l.x,y:l.y,id:l.id};renderer.domElement.setPointerCapture(e.pointerId);};
  renderer.domElement.onpointermove=e=>{if(!drag)return;const rect=$('stage').getBoundingClientRect(),l=layout.layers.find(l=>l.id===drag.id);l.x=Math.max(-WIDTH*2,Math.min(WIDTH*3,drag.x+(e.clientX-drag.px)/rect.width*WIDTH/layout.view.zoom));l.y=Math.max(-HEIGHT*2,Math.min(HEIGHT*3,drag.y+(e.clientY-drag.py)/rect.height*HEIGHT/layout.view.zoom));applyPlane(l);invalidate();$('layer-x').value=l.x.toFixed(1);$('layer-y').value=l.y.toFixed(1);};
  renderer.domElement.onpointerup=renderer.domElement.onpointercancel=()=>{if(drag){drag=null;status('Đã kéo layer. Xuất JSON để lưu bố cục riêng.');}};
  $('benchmark').onclick=()=>{const start=performance.now();let frames=0;$('benchmark').disabled=true;document.body.dataset.benchmark='running';const frame=now=>{if(disposed)return;renderer.render(scene,camera);frames++;if(now-start<3000)requestAnimationFrame(frame);else{stats(frames*1000/(now-start));document.body.dataset.benchmark='done';$('benchmark').disabled=false;}};requestAnimationFrame(frame);};
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status('Mất WebGL ở trang preview; /song chưa bị thay đổi.');document.body.dataset.failed='true';});
  addEventListener('pagehide',()=>{disposed=true;for(const m of planes.values()){m.geometry.dispose();m.material.dispose();}for(const p of textures.values())p.then(t=>t.dispose()).catch(()=>{});renderer.dispose();});
  status('Preview sẵn sàng · PNG gốc chưa sửa · /song không bị tác động.');document.body.dataset.ready='true';invalidate();
}
start().catch(error=>{status('Lỗi preview: '+error.message);document.body.dataset.failed='true';console.error(error);});
