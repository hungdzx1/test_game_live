# 07.3 — Camera 2.5D và độ kiếp

1. Giữ camera Three.js để hiển thị planes/sprites; ở tông môn dùng vùng pan/zoom an toàn, không orbit xoay góc làm lộ mặt phẳng 2D. Camera vi động chậm, smooth, giữ sân và đài cùng khung khi không có sự kiện.
2. Khi người chơi đang chờ độ kiếp: đúng userId từ game state, đứng dậy (`idle_stand`) → bay lên đài (`fly`) theo Bezier 2D có ease-in/out và scale theo chiều sâu → ngồi thiền (`meditate`) trên đài; những người còn lại vẫn ngồi trên sân.
3. Lúc độ kiếp: chớp/sét/pháp trận là lớp FX độc lập, mây và nền không che nhân vật. Kết thúc thành công dùng `celebrate`, thất bại có phương án hiệu ứng từ pose hiện có (ghi rõ asset thiếu), sau đó bay về đúng chỗ ngồi. **Không được xác định thành bại ở client**; nhận từ máy chủ.
4. Không nhân đôi người chơi khi bay; khi tạm dừng và chuyển battle phải có quy tắc xử lý hoạt cảnh ổn định. Hàng chờ nhiều người dùng thứ tự game engine hiện hữu.
5. Không reset/đổi thời gian, cooldown, cảnh giới, xác suất độ kiếp; camera director cũ giữ cho battle.
6. Test bình thường, thành công, thất bại, pause, reconnect client, 2 người chờ, battle xen vào; screenshot + video ngắn nếu có.

**Nghiệm thu:** đường bay liền mạch, đệ tử bên dưới vẫn thấy, camera chuyển động nhẹ mà không cắt sân/đài.
