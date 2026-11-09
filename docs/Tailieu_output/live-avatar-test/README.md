# Thử nhận avatar TikTok LIVE — 09/11/2026

**Cập nhật sửa lỗi định dạng09/11:** người dùng đã thử LIVE và gặp lỗi giải mã/kích thước. Đã đổi sang backend chuyển PNG trong RAM trước khi Unity tải; quy tắc tải trực tiếp/timeout/cache backend của bản đầu dưới đây là lịch sử. Theo dõi kết quả và cách nạp bản sửa tại [sửa định dạng avatar](../avatar-format-fix/README.md). LIVE thật sau sửa cần kiểm chứng riêng.

Theo ba lựa chọn của người dùng. **Đã triển khai, kiểm thử và ghép vào scene nguồn Concept02. LIVE/TikTok CDN thật chưa kiểm chứng.**

## Cách dùng sau khi nạp

1. Khởi động lại Node, dừng Play rồi mở lại `Assets/Scenes/SectScene_Concept02.unity` để nạp thẻ mới.
2. Trang chủ quản trị → **Kết nối TikTok LIVE** → bật **Thử avatar LIVE**. Mặc định tắt; lựa chọn được lưu qua lần mở lại. Chọn bộ dữ liệu LIVE và nối tới kênh do streamer tự lên LIVE.
3. Bất kỳ người xem nào, kể cả chưa nhập môn, bình luận **test avt**. Chấp nhận chữ hoa/khoảng trắng thừa; không khớp cả câu có thêm từ.
4. Góc phải dưới game hiện thẻ **10 giây**, có avatar, tên và trạng thái tải. Người thử mới nhất thay người cũ. Tắt công tắc để ẩn ngay; chuyển DEMO/mất kết nối cũng dọn thẻ. Lệnh không tạo tu sĩ/cấp đồ/cộng tu vi/zoom hoặc reset camera rảnh. Dùng được trong boss/pause, thẻ tự hết theo10 giây thời gian thực.

Trạng thái **Đã tải ảnh** chỉ xuất hiện sau khi giải mã và hiển thị texture. **Đang tải** là đang chờ request; **Không có ảnh** nghĩa không có URL hợp lệ; **Tải lỗi** có lý do ngắn như HTTP403, ảnh quá lớn hoặc định dạng không hợp lệ. Thiếu/lỗi dùng chữ đầu tên, giữ đúng tên người thử. Nhật ký bình luận báo “đã gửi thử avatar” hoặc “thử avatar chưa bật trong LIVE”, không suy ra đã tải ảnh từ việc nhận URL.

## Dữ liệu và giới hạn

Ảnh native từ `WebcastChatMessage.user.avatarThumb/Medium/Large.urlList` trong phiên bản SDK đã cài; cùng bộ chọn URL với gift/Ban Phúc. Chỉ bình luận đúng lệnh được giữ URL trong event, bình luận thường vẫn avatar:null. HTTPS/CDN hợp lệ, timeout5 giây, một request/loader, không redirect, tối đa512KiB/1024×1024, cache RAM8 ảnh. Không tải/lưu ảnh ở backend, không lưu ảnh/URL thử hoặc raw profile trong save, không thêm asset Internet. Giữ rate limit/dedup bình luận hiện hữu. Envelope v1 chỉ thêm event `avatar:test` và flag boolean `live.avatarTestEnabled`, player schema không đổi. Độ kiếp8 giây và cấu hình cũ khác giữ nguyên.

Thẻ Unity `LiveAvatarTest` dùng chung `DonorAvatarView` với Ban Phúc; trạng thái Ready dựa trên decoder thật. Số đếm/camera/SFX Ban Phúc không thay đổi. Menu **Tu Tien LIVE → Concept 02 → Apply LIVE avatar test** hỗ trợ cài lặp trên scene hiện hữu mà không nhân panel.

## Kiểm chứng

- **Node PASS144 / FAIL0 / SKIP1** trong145 bài core; bốn bài mới và bốn donor hồi quy đã qua kiểm tra riêng. Có luồng native adapter giả lập → bus → HTTP/WebSocket thật, bật/tắt/restart, người chưa nhập môn và không lưu URL/ảnh/player mới. LIVE thật là SKIP.
- **Chrome PASS3/3**, không lỗi JS: mặc định tắt, checkbox lưu và reload, tắt lưu lại. [Báo cáo](browser-report.json), [desktop](admin-desktop.png), [màn hình390](admin-390.png). Ảnh chụp sau khi bật; mặc định cấu hình nguồn vẫnfalse.
- **Unity6000.5.9f1 PASS92 / FAIL0 / SKIP1** trong93 bài: đủ87 trường hợp hồi quy trước đó và5 bài mới đều PASS. Bài HTTP Ban Phúc bổ sung không thuộc87 baseline bị SKIP do thiếu biến môi trường trỏ server receipt thử riêng. Có Editor/Play protocol, người chưa nhập môn, thay người mới nhất,10 giây, tắt/disconnect, backward compatibility, decoder PNG/cache8 và không đổi camera. [XML](unity-tests.xml). Lượt focused đầu thiếu bước bind presenter sau khi test tự tạo lại Protocol; đã sửa setup test, bộ cuối92 PASS.
- **GPU PASS**, Quadro M1000M, đã xem bốn trạng thái ở720×1280 và kiểm tra capture1080×1920. [Không có ảnh](missing-720.png), [đang tải](loading-720.png), [đã tải](ready-720.png), [tải lỗi](error-720.png), [báo cáo](capture-report.json). Ảnh Ready là PNG kiểm thử tạo bằng code.
- **Ghép/audit PASS:**1.172 file bảo vệ giữ SHA256,791 document scene gốc giữ nguyên trừ danh sách con Canvas thêm panel;27 document mới. Camera/viewport/asset/GUID/package cũ giữ nguyên; cấu hình chỉ thêm flagfalse, độ kiếp vẫn8000ms. `data/demo/players.json` thay đổi so baseline trong lúc làm việc, nguồn thay đổi chưa xác định; giữ nguyên bản hiện tại và ghi riêng hash/mtime, không ghi đè/khôi phục dữ liệu. Các helper mới dùng dữ liệu tạm. [Báo cáo bảo toàn](preservation-report.json), [audit cuối](final-verification.json).
- **CHƯA KIỂM CHỨNG:** nhận bình luận/avatar từ TikTok LIVE thật và tải ảnh CDN thật, Windows build mới, OBS/FPS stream. Native connector trong test dùng nguồn giả lập có cấu trúc SDK thật. Ảnh Ready trong kiểm thử/capture là PNG màu tạo bằng code để kiểm tra decoder/UI; không phải ảnh tải từ TikTok và không chứng minh CDN đã chạy.

Các helper chỉ dùng bản sao `test-results/unity-concept02/project`; không tự lên LIVE/gửi bình luận/gửi quà, restart server đang chạy, mở sửa project Unity riêng hoặc commit/push.
