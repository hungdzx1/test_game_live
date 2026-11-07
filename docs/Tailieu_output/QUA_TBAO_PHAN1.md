# Cài đặt lại quà tặng và mốc tim

**Cập nhật phần4 (08/11/2026):** chức năng tải/tìm danh mục TikTok và API/cache runtime bên dưới đã được gỡ theo xác nhận người dùng. Dùng ba lựa chọn ảnh local hoặc quy tắc thủ công tại [hướng dẫn phần4](QUA_TBAO_PHAN4.md). Nội dung tải danh mục bên dưới là lịch sử phần1.

**Cập nhật phần3:** bảng tim lặp lại trong tài liệu này đã được thay bằng [Cấp tông môn](QUA_TBAO_PHAN3.md). Phần chọn quà TikTok → vật phẩm vẫn dùng như bên dưới; mốc tim/cooldown wish là mô tả lịch sử của phần1.

Thực hiện phần 1 của `docs/Tailieu/Qua_Tbao.md`. Chưa triển khai phần 2 (giọng AI) và phần 3 (cấp tông môn tùy chỉnh).

## Kết quả kiểm tra thư viện trước khi triển khai

Project cài `tiktok-live-connector` **2.5.0**. Đã đọc README và mã thực thi của đúng bản trong `node_modules/tiktok-live-connector`, đồng thời đối chiếu [repository chính thức](https://github.com/zerodytrash/TikTok-Live-Connector).

- README, mục **Retrieve Available Gifts**, có `fetchAvailableGifts()` và các trường `id`, `name`, `diamond_count`.
- Mã `dist/lib-DWhiWLli.js`, `fetchRoomGiftsRoute`, gọi `gift/list/` với `room_id` và trả `response.data.gifts`. Route thực tế yêu cầu room ID, nên cần gọi `fetchRoomId()` trước. Đây là bước mà ví dụ README chưa thể hiện.
- Thư viện lấy danh sách từ TikTok theo phòng, không cung cấp bảng ID/giá tĩnh để dùng vĩnh viễn. Không đưa các ID/giá ví dụ vào danh sách production, không suy giá từ tên quà, không tải icon/ảnh bên ngoài.

## Cách dùng

1. Khởi động lại Node nếu server đang chạy mã cũ, mở `http://localhost:3000/#/settings/gifts` (hoặc cổng đã cấu hình).
2. Trong **Quà → vật phẩm**, bấm tên quà/dải giá ở cột đầu, hoặc **Thêm quy tắc**.
3. Lần đầu nhập tên kênh TikTok đang LIVE, bấm **Tải từ TikTok**. Không cần mở kết nối sự kiện LIVE chỉ để tải danh sách. Mạng/TikTok hoặc trạng thái kênh có thể khiến việc tải thất bại; UI báo lỗi và giữ danh sách đã tải trước đó.
4. Tìm theo tên (có/không dấu, không phân biệt hoa thường), ID hoặc số xu. Chọn dòng `Tên quà · N xu`; ứng dụng điền ID, tên và đơn giá, không phải tự nhập các thông số này.
5. Chọn vật phẩm, số lượng/quà, hiệu ứng và bật/tắt; bấm **Lưu bảng quà**. ID + khoảng đơn giá quyết định ánh xạ. Giá trên TikTok đổi thì tải lại, chọn lại quà và lưu. **Chi tiết / quy tắc cũ** giữ khả năng sửa quy tắc ID/tên/dải giá trước đây.
6. Trong hàng **Tim ♥**, đặt **Số lượng tim → Quà/hành động**, số lượng thưởng và thời gian hồi; bấm **Lưu cài đặt LIVE**.

Ví dụ: 1.000 tim → 1 Trà Ngộ Đạo cho mỗi đệ tử hiện có; hoặc 1.000 tim → 1 Ban Phúc toàn tông, thêm 30 giây x2 **một lần**, không nhân với số đệ tử. Mặc định cũ vẫn là 1.000 tim → 1 điểm nhiệm vụ/người, hồi 60 giây.

Tim hợp lệ vẫn tăng nguyên lực cấp tông môn 1/2/3 như trước. Phần này chỉ cấu hình phúc lợi mốc tim riêng; không thay ngưỡng 1.000/3.000/5.000 của cấp tông môn. Khi battle/tạm dừng, thưởng mốc tim chờ tu luyện; điểm/vật phẩm/Ban Phúc đã chốt giữ nguyên qua restart và thay cài đặt. Vật phẩm dư giữ trong túi, tuân theo giới hạn linh căn/đan/camera/buff đang có.

## Lưu trữ và API

- `caidat.json`: giữ schema hiện hữu; quy tắc quà cho lưu `giftId` cùng `giftName`. `live.wishReward` bổ sung tùy chọn, mặc định `points` khi đọc cấu hình cũ; `wishPoints` dùng làm số lượng thưởng. Không ghi đè cấu hình/dữ liệu production trong kiểm thử.
- `data/tiktok-gifts.json`: cache metadata `{version, username, roomId, fetchedAt, gifts:[{id,name,diamonds}]}`, tách khỏi save người chơi và không chứa ảnh/cookie/khóa ký. Cache cũ vẫn dùng khi không tải được; sau một giờ UI khuyên tải lại. Tối đa một lượt tải mỗi 30 giây, gộp yêu cầu đồng thời.
- `GET /api/tiktok/gifts`: đọc cache, không gọi TikTok. `?refresh=1&username=ten_kenh` tải lại qua connector. Cùng bảo vệ localhost/origin hiện có; việc tải không chặn hàng đợi tick game và không thay trạng thái/khóa kết nối LIVE.
- Save tương tác version1 bổ sung trường **tùy chọn** `wish.pendingBlessings`; save cũ vẫn đọc được. Vật phẩm tim dùng inbox/activations hiện hữu, điểm dùng pendingPoints; không cần đổi schema người chơi. Snapshot/event chỉ thêm metadata thưởng, không đổi envelope WebSocket.

## Kiểm thử

- Node: **112 PASS / 0 FAIL / 1 SKIP**, tổng 113; `qua-phan1/npm-test.txt`. Có 9 bài mới về API thực thi của connector, dữ liệu catalog/cache/lỗi mạng, ánh xạ ID+tên, bốn vật phẩm cá nhân, Ban Phúc cộng đồng, overflow, lưu/khôi phục và tách DEMO/LIVE.
- Browser: **PASS**, Chrome headless với server thật và thư mục dữ liệu tạm; chỉ transport TikTok dùng fixture có nhãn “kiểm thử”. Kiểm tra tìm kiếm không dấu/ID, XSS dưới dạng text, Escape, chọn/thêm/xóa/lưu/reload, bản nháp khi đổi trang, replay quà, tim cấp đúng vật phẩm, khóa dùng lúc paused; desktop1366 và mobile390 không tràn hộp chọn. Báo cáo/ảnh trong `qua-phan1/`.
- Browser hồi quy năm trang: **PASS**, điều khiển/cài đặt/demo/kết nối/xác nhận restore-reset và responsive ở1920/1366/900/390, cả hai theme; `qua-phan1/admin-browser-report.json`. Đã sửa locator của smoke test để nhận đúng hộp xác nhận khi có thêm dialog chọn quà.
- Bảo toàn: **PASS735/735 file** trong đối chiếu trước/sau lượt browser cuối, gồm dữ liệu production/demo/backups, caidat/package/lock và Unity Assets; `qua-phan1/preservation-report.json`.
- Các quà ID990001… trong ảnh là **fixture kiểm thử**, không phải danh sách ID chuẩn production. Chưa có danh sách quà thật được ghi vào dữ liệu của người dùng.
- LIVE thật / tải catalog từ phòng TikTok thật: **CHƯA KIỂM CHỨNG**, chưa có phiên LIVE hợp lệ được cung cấp. Test API connector dùng transport phản hồi ghi sẵn, không được coi là PASS LIVE thật.
- Unity Editor/Play Mode/build Windows/OBS: **CHƯA KIỂM CHỨNG trong lượt này**; không sửa scene, prefab hay C# Unity.

Chạy lại: `npm.cmd test`, `node scripts/gift-settings-browser-smoke.js`, `node scripts/ui-browser-smoke.js`. Hai script browser dùng profile/thư mục dữ liệu tạm riêng, không nối tài khoản hoặc sửa save production.
