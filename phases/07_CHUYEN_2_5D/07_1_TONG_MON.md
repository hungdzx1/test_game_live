# 07.1 — Dựng tông môn 2.5D trong Three.js

Chỉ thực hiện sau khi 07.0 đã có layout/asset audit.

1. Tạo module `Sect2DScene` sử dụng renderer Three.js hiện có. Dùng `PlaneGeometry` hoặc `Sprite`, texture dùng chung, renderOrder/depthTest/alpha hợp lý, texture color space đúng; không dựng lại asset đã có bằng primitive.
2. Nạp các lớp ảnh từ `Background layers`, `Architecture layers`, `FX layers` theo JSON 07.0. Cung cấp điểm neo sân (ít nhất 12 vị trí minh họa) và đài độ kiếp, quy đổi từ tọa độ 3D hiển thị cũ sang tọa độ render 2.5D mà không chỉnh game state.
3. Sân và đài cùng nằm trong màn hình 9:16. Thác/mây/sương/cánh hoa/pháp trận có animation nhẹ, dùng offset UV, opacity/scale/rotation, tránh tạo texture mới mỗi frame.
4. Không để hiệu ứng/pháp trận che kín đệ tử; foreground props có thứ tự hiển thị đúng. Chất lượng Low/Medium/High có mức hiệu ứng tương ứng.
5. Tạo cấu hình renderer 2.5D có thể bật/tắt, **chỉ ở tông môn**. Khi battle dùng `BattleScene` hiện hữu và camera hiện hữu, không làm mất event/game state.
6. Ảnh cần vị trí khác preview thì chỉnh duy nhất layout JSON và ghi rõ. Đừng tự âm thầm vẽ lại ảnh.
7. Chạy `npm test`, thử chuyển tông môn → battle → tông môn, pause, reload, 720×1280 và 1080×1920. Chụp screenshot, báo FPS, lỗi.

**Nghiệm thu:** tông môn 2.5D giống bố cục concept ở mức asset hiện có, scene 3D cũ vẫn bật lại được, battle không hỏng.
