# Thu gọn K01 và lặp tia chớp độ kiếp — 08/11/2026

Đã cập nhật `SectScene_Concept02`. Dừng Play, mở lại scene rồi Play để nạp bố cục và code mới.

- Khung `07_UI/UI_Canvas/K01_PlayGuide` chuyển trái24→12, scale đồng đều100%→90%. Giữ kích thước thiết kế436×611 và toàn bộ nội dung/icon, không kéo méo chữ. Kích thước hiển thị1080p còn392,4×549,9; cạnh phải460→404,4, chừa thêm55,6px cho đài. Hai bảng cùng co để giữ thẳng hàng. Tỷ lệ CanvasScaler720p giữ như cũ.
- Bốn PNG tia chớp lặp01→02→03→04, mỗi frame45ms, một vòng180ms. Bắt đầu từ thời gian0 của nghi thức server, tiếp tục tới hết duration; không còn tắt giữa các đợt sét. Frame lấy trực tiếp từ elapsed server và nội suy có giới hạn hiện hữu, không có bộ đếm tích lũy riêng. Reconnect lấy đúng frame theo snapshot, pause/stopped giữ frame; hết duration, kết quả, battle, disconnect hoặc disable dọn tia chớp.
- Chỉ lặp hình ảnh. Không đổi số đợt sét gameplay, SFX, thời gian nghi thức, xác suất, cooldown, tu vi hoặc kết quả. Legacy/procedural fallback khi không đủ bốn PNG giữ nhịp cũ. Không sửa backend/API/WS/schema/save, không tải asset và không sửa PNG/GUID.

| Kiểm tra | Kết quả |
|---|---|
| Unity6000.5.9f1 Editor/Play/protocol | **58/58 PASS,0 FAIL,0 SKIP**:9 storm và49 hồi quy K01/nhân vật/Concept02/item/camera/protocol. Kiểm tra đủ bốn frame và lặp vòng, không có khoảng trống với duration10/12/20 giây và count1/3/10; frame cuối/tắt đúng hạn, pause/reconnect/result/battle/disconnect/disable/fallback, Play đổi frame giữa khoảng trước kia không có tia, snapshot không bị sửa. |
| GPU Quadro M1000M | **PASS**, đã xem [khung1080p](guide-1080.png), [720p](guide-720.png) và ảnh tia chớp ở [2.200ms](ritual-2200-1080.png), [11.999ms](ritual-11999-1080.png), [12.000ms](ritual-12000-1080.png). Timeline gồm0/45/90/135/180/2200/8000/11999/12000ms tại `capture-report.json`. |
| Bảo toàn source sau ghép | **PASS**,1.055 file giữ SHA256;713 document scene giữ nguyên, chỉ đổi vị trí/scale của root K01. Không thêm/xóa object; camera/viewport, ghế, prefab, PNG và hệ thống cũ giữ nguyên. Code/layout khớp project kiểm thử. |
| Node | Không chạy lại suite vì không sửa backend; hash backend/config giữ nguyên. |
| Build Windows/OBS/LIVE thật/FPS stream | **CHƯA KIỂM CHỨNG** trong lượt này. |

Lượt đầu44 PASS/1 FAIL chỉ chạy45 ca vì filter tên test có tham số; bài Play đo sớm trước khi CharacterManager nhận snapshot nên thấy frame-1 ban đầu. Đã sửa test chờ render và filter theo class cho24 ca protocol, chạy lại đủ58/58 PASS. Không thay gameplay để làm test qua.

Bằng chứng: `unity-tests.xml`, `capture-report.json`, `preservation-report.json`, `final-verification.json`. Audit hiện tại: `node scripts/guide-storm-publish.js --verify`. Báo cáo K01 trước ở thư mục `khung-01/implemented/` là mốc lịch sử trước lần thu gọn này. Không tự commit/push, không sửa dữ liệu thật hay project riêng `public/unity-client/My project/`.
