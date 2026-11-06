import * as THREE from 'three';
const geometries = new Map(), materials = new Map();
export function geometry(kind) {
  if (!geometries.has(kind)) geometries.set(kind, kind === 'sphere' ? new THREE.SphereGeometry(1,12,8) : kind === 'cone' ? new THREE.ConeGeometry(1,1,8) : kind === 'cylinder' ? new THREE.CylinderGeometry(1,1,1,12) : kind === 'ring' ? new THREE.TorusGeometry(1,.025,4,48) : new THREE.BoxGeometry(1,1,1));
  return geometries.get(kind);
}
export function material(color, glow = false) {
  const key = `${color}:${glow}`; if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness:.8, ...(glow ? {emissive:color,emissiveIntensity:1.1} : {}) })); return materials.get(key);
}
export function mesh(parent, kind, color, position, scale, glow = false) {
  const m = new THREE.Mesh(geometry(kind),material(color,glow)); m.position.set(...position); m.scale.set(...scale); m.castShadow = !glow; m.receiveShadow = true; parent.add(m); return m;
}
export function label(text, width = 512, height = 96, maxLength = 20) {
  const canvas = document.createElement('canvas'); canvas.width=width; canvas.height=height;
  const ctx=canvas.getContext('2d'); ctx.fillStyle='#102637dd'; ctx.fillRect(0,0,width,height); ctx.fillStyle='#f2dfb1'; ctx.font=`600 ${height*.45}px Segoe UI`; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText([...text].slice(0,maxLength).join(''),width/2,height/2,width-20);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));
}
