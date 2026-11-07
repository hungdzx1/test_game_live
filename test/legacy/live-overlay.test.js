import test from 'node:test';
import assert from 'node:assert/strict';
import {liveMessage} from '../../public/js/liveOverlay.js';

test('Overlay describes configured item/action and keeps legacy point notices',()=>{
  assert.match(liveMessage({kind:'live:wish',reward:'tea',quantity:2,pending:true}),/Trà Ngộ Đạo ×2.*sau khi/);assert.match(liveMessage({kind:'live:wish',points:1}),/\+1 điểm nhiệm vụ/);
});
