# 07.5 — Battle 2D: HOÃN đến khi có asset

**Chưa triển khai renderer 2D battle trong lần này.** Tiếp tục dùng `public/js/battleScene.js` và `battleOverlay.js` đang chạy.

## Asset cần chuẩn bị sau
- Nền chiến trường 9:16 với các lớp: sky/terrain/foreground và khu boss (trái), khu đệ tử (phải), cùng bản bố cục tham chiếu.
- Sprite 3 boss (Ma Binh Thống Lĩnh, Huyết Ma Tướng Quân, Vạn Kiếp Ma Tôn): idle, approach, attack/cast, hit, defeated; ít nhất góc hướng về phía đệ tử.
- Sprite 3 nhóm quái tương ứng: idle, walk, attack, hit, defeated.
- Kỹ năng kiếm khí/thiên lôi/pháp trận riêng, không dính vào boss hay nền.
- Mốc vị trí, điểm phát đòn và điểm nhận đòn cho từng sprite.

## Khi có asset
Codex audit trước, tạo preview 2.5D hai phe (quái/boss trái, đệ tử phải), sau đó mới nối với trạng thái battle thật. Không sửa 11 chiến trường, HP, damage, cooldown, rewards và đồng bộ WebSocket. Chạy toàn bộ test battle và ghi số liệu thực.
