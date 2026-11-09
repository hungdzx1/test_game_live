# Sửa lỗi định dạng avatar LIVE — 09/11/2026

Người dùng báo thẻ `test avt` hiện **Tải lỗi — định dạng hoặc kích thước ảnh**. Điều này xác nhận sự kiện đã tới Unity và request tải xong, nhưng loader cũ gộp lỗi giải mã với vượt1024×1024. Chưa có bytes ảnh lỗi để xác nhận định dạng thực tế của lần LIVE đó. **Đã sửa và kiểm thử Node/Unity/HTTP; chưa nhận PASS LIVE thật sau sửa.**

`Texture2D.LoadImage` không phải decoder mọi định dạng: [Unity mô tả PNG/JPG/EXR](https://docs.unity.com/en-us/engine/6000.3/script-reference/unityengine/imageconversion). Thay vì sửa đuôi URL có chữ ký hoặc phụ thuộc định dạng CDN trả về, backend dùng [Sharp](https://sharp.pixelplumbing.com/api-constructor/) **0.35.5** đọc bytes WebP/AVIF/JPEG/PNG rồi trả PNG tối đa256×256 cho Unity. Đã cài dependency cùng lockfile; không thêm Unity package/asset.

## Thay đổi

- Thêm `/api/avatar?url=...` trên Node loopback cùng nguồn hiện hữu; Unity lấy đúng host/port từ WebSocket. Không sửa URL nguồn/param ký, không gửi cookie/khóa ký. Event/save schema không đổi.
- Input HTTPS/CDN allowlist cũ, không redirect, tối đa512KiB, giải mã tối đa16MP, xử lý2 giây. Timeout nguồn5 giây, Unity8 giây, thẻ vẫn10 giây. Backend tối đa2 tác vụ đồng thời,8 yêu cầu mới/giây, gộp cùng URL đang tải, cache8 PNG RAM/60 giây; không lưu ảnh hay URL xuống file.
- Dùng chung cho thẻ thử và avatar donor Ban Phúc. Unity phân biệt rõ lỗi PNG/JPEG, ảnh vượt kích thước, CDN/timeout/server bận; HTTP404 nhắc khởi động lại Node. Không đổi số lượng/thời gian buff, SFX, camera, scene, dữ liệu người chơi hoặc độ kiếp8 giây.

## Kiểm chứng

- **Node core149 bài: PASS148 / FAIL0 / SKIP1 LIVE thật.** Bốn bài mới tạo bytes WebP/AVIF/JPEG/PNG thật bằng code, chuyển PNG256×128; test nguồn hỏng/quá lớn/20MP, URL ký giữ nguyên, không redirect, cache/coalescing/TTL/giới hạn tải và HTTP/cùng nguồn/bảo toàn save. Có8 bài hồi quy test avatar/donor.
- **Unity6000.5.9f1: PASS95 trường hợp khác nhau / FAIL0 còn lại / SKIP0**, qua hai lượt. Lượt hồi quy đầu94/95 PASS, gồm7 bài avatar: WebP/AVIF1200×600 tải qua HTTP thật từ Unity tới Node thử riêng, chuyển PNG256×128 rồi Unity vào Ready/hiện texture cho cả thẻ thử và donor Ban Phúc. Một bài HTTP Ban Phúc cũ FAIL vì gọi `useItem` sau `grantItem` đã tự kích hoạt; đã sửa test và chạy lại riêng **PASS1/1**. Giữ đủ87 ca baseline; không gọi TikTok thật. [XML lượt đầu](unity-initial-regression.xml), [XML chạy lại](unity-http-rerun.xml).
- **Bảo toàn PASS:**1.181 file bảo vệ khớp SHA256 baseline đầu lượt sửa, scene/config/font/asset/GUID/package Unity giữ nguyên. `data/players.json` đổi đồng thời, nguồn thay đổi chưa xác định; giữ nguyên bản hiện tại, không ghi đè/khôi phục. [Audit và hash](verification.json), [Node log](node-core.log). Test HTTP đầu chưa tạo file save fixture; đã sửa setup, lượt core cuối148 PASS.
- Không đổi bố cục HUD/scene nên không chụp lại GPU/Chrome; ảnh/bộ kiểm tra trước chỉ là bằng chứng lịch sử, không chứng minh đường PNG mới đã chạy.
- **CHƯA KIỂM CHỨNG:** ảnh lỗi gốc/định dạng gốc, TikTok LIVE/CDN thật sau sửa, Windows build mới, OBS/FPS stream.

## Cách thử lại

1. Khởi động lại Node để nạp `/api/avatar`; dependency Sharp đã cài trong workspace.
2. Dừng Play, đợi Unity biên dịch xong rồi Play lại. Không cần ghép/mở scene khác vì scene không đổi. Nếu dùng bản build Windows cũ, cần build lại để có loader mới.
3. Tự kết nối LIVE, bật **Thử avatar LIVE**, nhờ viewer bình luận **test avt**. Chỉ xác nhận LIVE PASS khi ảnh thật hiện và trạng thái **Đã tải ảnh**. Nếu còn lỗi, dùng thông báo mới để phân biệt lỗi nguồn/codec/kết nối.

Các helper chỉ mở project kiểm thử riêng và dùng dữ liệu tạm; không tự lên LIVE/gửi bình luận/quà, không restart server người dùng, không mở sửa project Unity riêng hoặc commit/push.
