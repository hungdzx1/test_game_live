# 07.2 — Tích hợp sprite nhân vật Character_1

Chỉ sửa lớp nhân vật hiển thị cho khu tông môn/đài; không thay engine nhân vật.

1. Đọc `public/assets/Characters/Character_1/` gồm `meditate.png`, `meditate_3quarter.png`, `back_3quarter.png`, `idle_stand.png`, `fly.png`, `attack.png`, `celebrate.png`.
2. Tạo `SpriteCharacterRenderer` hoặc adapter giữ nguyên contract cập nhật từ `presentPlayers(state)`; mỗi userId có visual instance, không tạo user logic mới. Map `meditate`/`standUp`/`fly`/`cast`/`attack`/`celebrate`/`hit`/`defeated`/`teleport` sang asset sẵn có hoặc animation CSS/shader tạm; **nêu rõ trạng thái chưa có pose riêng**.
3. Sử dụng texture dùng chung, alpha RGBA, scale thống nhất chân/điểm neo, không cắt áo/tóc, tên hiển thị bằng text động riêng. Thử 10/30/60 user và điều chỉnh giới hạn số nhân vật minh họa theo sân.
4. Biến thể người chơi ổn định theo seed/userId bằng tint shader vùng an toàn, màu vòng khí, hào quang và tên; **không tint toàn sprite làm da đổi màu**. Nếu tint shader chưa thể phân vùng áo, chỉ thay màu hào quang và hiệu ứng; không tuyên bố đã có nhiều model/tóc.
5. Không đặt cùng người trên sân và đài đồng thời; xem logic `presentationState.js`, không thay game state. Giữ procedural `CharacterManager` làm fallback.
6. Tránh nhân bản texture theo từng user, không tạo/destroy mesh mỗi frame. Kiểm tra resource cleanup.
7. `npm test` và browser smoke; ảnh trước/sau, tên & realm của user thay đúng, không nhảy/giật khi animation.

**Nghiệm thu:** một bộ sprite đẹp hiện đúng vị trí, mỗi người có tên/chỉ số đúng; biến thể hào quang khác nhau; 3D fallback giữ được.
