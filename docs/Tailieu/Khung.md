*1. Khung hướng dẫn*
Hãy thiết kế 1 khung hướng dẫn chơi ở góc trái màn hình với nền hơi mờ, có khung. Chứa thông tin

__________________________________________________
|Bình luận
|Nhập môn: để gia nhập tông môn
|Dùng khi đánh boss
|1 : Kiếm khí trảm (x2 ST)
|2 : Thiên long quyết (x3 ST)
|Thả tim để up cấp tông môn và tu vi bản thân
|Khi tông môn lên cấp sẽ được ban phúc
|(x2 tốc độ tu luyện 30s/1)
|Trà ngộ đạo: x2 tu luyện 60s
|Độ kiếp đan: +10% tỉ lệ độ kiếp
|Biến dị linh căn: x3 tu luyện vv
|_________________________________________________

Dưới này là bảng để bên dưới bảng ban phúc
_________________________________________________
|[icon hoa hồng] Trà ngộ đạo [icon trà ngộ đạo]
|[icon cỏ bốn lá] Độ kiếp đan [icon độ kiếp đan]
|[Má hồng nhỏ xinh] Biến dị linh căn [icon biến dị linh căn]
|[>50xu] Ban phúc cho toàn tông
|_________________________________________________

Hãy thiết kế sau đó đưa lại 3 kết quả bằng ảnh cho tôi để tôi chốt. Mỗi ảnh có 1 ID để dễ hiểu hơn

### Kết quả mục1 — 08/11/2026

Đã tạo ba mẫu **K01 Kim Vân / K02 Ngọc Thanh / K03 Cổ Quyển**, ảnh trên nền game1080/720 và ảnh phóng to tại `docs/Tailieu_output/khung-01/`. **Người dùng đã chọn K01; đã lắp vào HUD Unity Concept02,49/49 PASS và ảnh GPU1080/720 PASS.** Hướng dẫn/ảnh bản chạy thật: `docs/Tailieu_output/khung-01/implemented/README.md`. Build Windows/OBS/LIVE thật chưa kiểm chứng.

Người dùng xác nhận Linh Căn ghi x3 và gameplay cũng đổi x3. Đã sửa Node, nâng quyền lợi save x2 cũ khi nạp, giữ đồ dư; Node129 PASS/0 FAIL/1 SKIP LIVE. Chi tiết kiểm chứng và điểm chữ “>50 xu” khác cấu hình từ50 xu: `docs/Tailieu_output/khung-01/README.md`.



### 2. Thông báo boss xuất hiện
Hãy thiết kế thông báo boss xuất hiện + SFX + rung camera (cảnh báo) trong 3s rồi sau đó mới hiện boss ra
Nếu có thể tạo được SFX thì tạo SFX cho attack luôn

Hãy thiết kế sau đó đưa lại 3 kết quả bằng ảnh cho tôi để tôi chốt. Mỗi ảnh có 1 ID để dễ hiểu hơn

### Kết quả mục 2 — 08/11/2026

Đã tạo ba mẫu **TB01 Thiên Ấn / TB02 Huyết Báo / TB03 Chiến Thư**, ảnh toàn cảnh1080/720 và ảnh phóng to có ID tại `docs/Tailieu_output/boss-notice-designs/`. Bản HTML minh họa cảnh báo/SFX/rung nền trong3 giây rồi mới hiện boss; đã kiểm tra thời gian, phát lại và bố cục cả ba tên boss. Đã tự tạo bằng code ba SFX cảnh báo và ba SFX attack; sáu WAV giải mã/thời lượng/PCM PASS, nghe thực tế chưa kiểm chứng.

**Cập nhật09/11/2026: người dùng đã chọn TB02 / warning-TB02; đã triển khai và ghép scene Unity Concept02.** Bốn WAV warning/attack đã chuyển vào `Assets/Musics/SFX/Boss/`, khung/ấn tạo bằng code. Node giữ cảnh báo3 giây trước từng boss, không nhận damage/kỹ năng hoặc trừ thời gian combat trong intro; Unity chỉ trình diễn. Node133 PASS/1 SKIP LIVE, Unity74/74 PASS, ảnh GPU1080/720, Chrome4/4 và audit bảo toàn PASS. Nghe/cân âm thực tế, build Windows/OBS/LIVE chưa kiểm chứng. Hướng dẫn: `docs/Tailieu_output/boss-notice-designs/implemented/README.md`.
