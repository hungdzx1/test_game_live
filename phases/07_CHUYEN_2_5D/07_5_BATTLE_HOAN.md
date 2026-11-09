# 07.5 — Battle 2D: HOÃN đến khi có asset

> **Bổ sung09/11/2026:** Khung.md mục2 đã chọn TB02/warning-TB02. Mỗi boss có intro3 giây do Node giữ clock/gate sát thương; Unity chỉ hiện cảnh báo, SFX/rung rồi hiện boss sau snapshot xác nhận. Tài nguyên tự tạo nằm trong `Assets/Musics/SFX/Boss/`, không tải ngoài. Chi tiết: `docs/Tailieu_output/boss-notice-designs/implemented/README.md`.

> **Cập nhật08/11/2026:** người dùng đã cung cấp sprite boss/khung HP trong `unity-client/Assets/Art/Boss` và yêu cầu triển khai cơ chế mới theo `docs/Tailieu/BOSS.md`. Phần hoãn/11 chiến trường bên dưới là lịch sử; yêu cầu mới và ba xác nhận được ghi ở đầu `GAME_DESIGN.md` thay thế phạm vi đó. Không mở rộng sang quái thường hoặc tải asset ngoài.

**Chưa triển khai renderer 2D battle trong lần này.** Tiếp tục dùng `public/js/battleScene.js` và `battleOverlay.js` đang chạy.

## Asset cần chuẩn bị sau
- Nền chiến trường 9:16 với các lớp: sky/terrain/foreground và khu boss (trái), khu đệ tử (phải), cùng bản bố cục tham chiếu.
- Sprite 3 boss (Ma Binh Thống Lĩnh, Huyết Ma Tướng Quân, Vạn Kiếp Ma Tôn): idle, approach, attack/cast, hit, defeated; ít nhất góc hướng về phía đệ tử.
- Sprite 3 nhóm quái tương ứng: idle, walk, attack, hit, defeated.
- Kỹ năng kiếm khí/thiên lôi/pháp trận riêng, không dính vào boss hay nền.
- Mốc vị trí, điểm phát đòn và điểm nhận đòn cho từng sprite.

## Khi có asset
Codex audit trước, tạo preview 2.5D hai phe (quái/boss trái, đệ tử phải), sau đó mới nối với trạng thái battle thật. Không sửa 11 chiến trường, HP, damage, cooldown, rewards và đồng bộ WebSocket. Chạy toàn bộ test battle và ghi số liệu thực.
