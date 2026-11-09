# Khung hướng dẫn — Khung.md mục1

**Đã chọn K01 Kim Vân và triển khai vào Unity Concept02.** Unity49/49 PASS, ảnh GPU1080/720 và bảo toàn source PASS. [Hướng dẫn và ảnh bản chạy trong Unity](implemented/README.md). Ba phương án thiết kế HTML bên dưới được giữ để đối chiếu; mỗi mẫu có hướng dẫn bên trái và bảng quà phía dưới, dùng nền game/icon sẵn có, không tải tài nguyên ngoài.

| ID | Phong cách | Ảnh trên nền game | Xem rõ nội dung |
|---|---|---|---|
| K01 | Kim Vân: xanh trầm, viền vàng hai lớp, góc trang trí | [1080×1920](K01.png) / [720×1280](K01-720.png) | [Phóng to khung](K01-detail.png) |
| K02 | Ngọc Thanh: xanh ngọc, thẻ bo tròn, số kỹ năng tròn | [1080×1920](K02.png) / [720×1280](K02-720.png) | [Phóng to khung](K02-detail.png) |
| K03 | Cổ Quyển: nền ngà mờ, chữ nâu, tiêu đề cổ điển | [1080×1920](K03.png) / [720×1280](K03-720.png) | [Phóng to khung](K03-detail.png) |

Mỗi mẫu có file HTML tương ứng để xem/chỉnh tiếp. ID trên ảnh chỉ dùng chọn thiết kế. Bố cục tham chiếu1080p: trái24, trên322, rộng436; đáy929–933, nằm trên hàng tên đầu và không đè TOP3. Đã xem ảnh toàn cảnh, ảnh phóng to và bản720p; chữ/icon tải đủ, kiểm tra không tràn hàng/tiêu đề. Đây là ảnh thiết kế ghép trên screenshot có sẵn, chưa phải kiểm thử HUD Unity chạy thật. Script tái tạo: `node scripts/khung-designs.js`. Báo cáo: `design-report.json`.

Theo xác nhận mới của người dùng, Linh Căn ghi **x3 vĩnh viễn** và gameplay Node đã đổi tương ứng:

- Lần kích hoạt đầu dùng một vật phẩm, cho x3; phần dư và quà trùng giữ trong túi.
- Save có Linh Căn x2 được nâng x3 khi nạp, không dùng thêm đồ, không cộng tu vi hồi tố. Không ghi sửa hàng loạt dữ liệu thật trong lượt làm việc này.
- Vẫn cộng hệ số Trà/Ban Phúc, trần mặc định x8. Chỉ Linh Căn:6 tu vi/giây và6 tu vi/tim; thêm một Trà:x5; thêm Ban Phúc:x7. Tiếp tục chỉ giảm buff khi tu luyện.
- Node core130 bài: **129 PASS /0 FAIL /1 SKIP LIVE thật**, gồm ba bài mới về x3/đồ dư/trần, migration không đổi input, HTTP/WebSocket và restart với dữ liệu tạm. Log: `npm-test.txt`. Không sửa Unity runtime trong lượt này, không nhận kết quả test Unity cũ làm kết quả mới.

Bản nháp giữ chữ **>50 xu** theo Khung.md; cấu hình quà hiện có vẫn bắt đầu từ **50 xu**. Đây là điểm cần thống nhất khi chốt nội dung, chưa đổi giá/rule quà. Tên chiêu trên ảnh giữ “Thiên long quyết” theo Khung.md; gameplay/bình luận2 vẫn giữ sát thương x3 và cooldown hiện hữu.

Khởi động lại Node nếu chưa nạp hệ số Linh Căn mới từ lượt trước. Với K01 đã triển khai, dừng Play/mở lại `SectScene_Concept02` rồi Play. Windows build/OBS/LIVE thật và khả năng đọc khi phát stream thực tế: **CHƯA KIỂM CHỨNG**.
