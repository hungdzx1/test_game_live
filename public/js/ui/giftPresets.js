// Checked 2026-11-08: tiktokgame.vn/gift/index.php (Rose/Shamrock),
// www.eulerstream.com/docs/tiktok-gifts-list#gift-1473096 (Tiny Blush).
// Artwork is supplied locally by the project owner. No remote catalog requests.
export const GIFT_PRESETS=Object.freeze([
  Object.freeze({id:'5655',name:'Rose',label:'Hoa hồng',diamonds:1,image:'/assets/Qua/1xu.jpg'}),
  Object.freeze({id:'9875',name:'Shamrock',label:'Cỏ bốn lá',diamonds:10,image:'/assets/Qua/10xu.jpg'}),
  Object.freeze({id:'1473096',name:'Tiny Blush',label:'Má hồng nhỏ xinh',diamonds:20,image:'/assets/Qua/20xu.jpg'})
]);
export const presetForRule=rule=>GIFT_PRESETS.find(g=>g.id===rule.giftId&&g.diamonds===rule.minDiamonds&&g.diamonds===rule.maxDiamonds);
