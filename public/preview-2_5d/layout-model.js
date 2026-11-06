export const WIDTH=1080,HEIGHT=1920;
export const assetUrl=id=>'/assets/'+id.split('/').map(encodeURIComponent).join('/');
export const ordered=layers=>[...layers].sort((a,b)=>a.z-b.z||a.id.localeCompare(b.id));
export function layerRect(layer,asset){
  const [cx,cy,cw,ch]=layer.crop??[0,0,asset.width,asset.height],w=cw*layer.scale,h=ch*layer.scale*layer.scaleY;
  return {left:layer.x-layer.anchor[0]*w,top:layer.y-layer.anchor[1]*h,width:w,height:h,crop:[cx,cy,cw,ch]};
}
export function validateLayout(value,assets){
  const fail=message=>{throw new Error(message);},finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  if(!value||value.version!==1||value.width!==WIDTH||value.height!==HEIGHT||!Array.isArray(value.layers)||value.layers.length>100)fail('Bố cục phải là version 1, 1080×1920 và tối đa 100 layer.');
  if(typeof value.concept!=='string'||!(value.concept.startsWith('/assets/concept/')&&!value.concept.includes('..')||/^data:image\/(png|jpeg|webp);base64,/.test(value.concept))||value.concept.length>28e6)fail('Concept phải là ảnh local trong assets/concept hoặc ảnh vừa nhập.');
  if(!value.view||!finite(value.view.zoom,.3,3)||!finite(value.view.panX,-WIDTH,WIDTH)||!finite(value.view.panY,-HEIGHT,HEIGHT))fail('Zoom/pan không hợp lệ.');
  const ids=new Set();
  for(const l of value.layers){
    const a=assets.find(a=>a.id===l.asset);
    if(!a||typeof l.id!=='string'||!/^[\w-]{1,60}$/.test(l.id)||ids.has(l.id))fail('Asset hoặc ID layer không hợp lệ/trùng nhau.');ids.add(l.id);
    if(typeof l.name!=='string'||l.name.length>100||!finite(l.x,-WIDTH*2,WIDTH*3)||!finite(l.y,-HEIGHT*2,HEIGHT*3)||!finite(l.scale,.01,4)||!finite(l.scaleY,.05,4)||!finite(l.opacity,0,1)||!finite(l.z,-100,200)||typeof l.visible!=='boolean'||!['normal','add'].includes(l.blend))fail('Thông số layer không hợp lệ: '+l.id);
    if(!Array.isArray(l.anchor)||l.anchor.length!==2||!l.anchor.every(n=>finite(n,0,1)))fail('Anchor không hợp lệ.');
    const c=l.crop;if(!Array.isArray(c)||c.length!==4||!c.every(Number.isFinite)||c[0]<0||c[1]<0||c[2]<1||c[3]<1||c[0]+c[2]>a.width||c[1]+c[3]>a.height)fail('Crop nằm ngoài ảnh: '+l.id);
  }
  return structuredClone(value);
}
export function reorder(layout,id,target){
  const list=ordered(layout.layers),i=list.findIndex(l=>l.id===id),j=list.findIndex(l=>l.id===target);if(i<0||j<0)return;
  const [item]=list.splice(i,1);list.splice(j,0,item);list.forEach((l,index)=>{l.z=index;});
}
