export const $=id=>document.getElementById(id);
export function mountBlocks(source){for(const block of [...source.querySelectorAll('[data-mount]')]){const target=$(block.dataset.mount);if(!target)throw new Error('Thiếu vùng giao diện: '+block.dataset.mount);target.append(block);}}
export function text(id,value){const e=$(id);if(e)e.textContent=value;}
export function clock(ms){const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
