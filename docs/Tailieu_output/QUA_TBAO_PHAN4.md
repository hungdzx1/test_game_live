# Quà tặng, bình luận và follow — phần 4

Triển khai theo `docs/Tailieu/Qua_Tbao.md` mục4 và xác nhận của người dùng: **bỏ toàn bộ tải danh mục TikTok**, ba lựa chọn chỉ khớp đúng ba loại quà trong ảnh.

## Sử dụng

1. Khởi động lại server để nạp mã mới, tải lại trang quản trị. Vào **Cài đặt → TikTok & quà → Quà → vật phẩm**.
2. Bấm cột quà hoặc **Thêm quy tắc**, chọn một trong ba thẻ ảnh. ID/tên/đơn giá được điền sẵn, trường dải giá bị khóa. Chọn vật phẩm, số lượng, hiệu ứng, bật/tắt rồi **Lưu bảng quà**.
3. Để dùng cách cũ, mở bộ chọn và bấm **Nhập thủ công / dải đơn giá**. Trường hiện tại mở lại để sửa; không tự xóa nội dung đã lưu. Bỏ trống cả ID và tên chỉ khi muốn khớp mọi quà trong dải giá.
4. Vào **Trang chủ → Kết nối TikTok LIVE → Nhật ký bình luận & follow** để xem nội dung nhận được, kết quả lệnh và lỗi. Cập nhật khoảng2 giây, tối đa20 dòng trên giao diện. Nhật ký phiên hiện có cũng ghi sự kiện nhập môn/follow.

Quy tắc cũ không tự đổi khi mở ứng dụng. Nếu còn dải giá bao phủ một quà khác, quà đó vẫn có thể nhận thưởng theo quy tắc dải giá; ba lựa chọn sẵn chỉ khớp theo ID riêng. Thứ tự ưu tiên vẫn là **ID → tên → dải giá** trong các quy tắc đúng đơn giá và đang bật. Combo chỉ thưởng khi chốt và không thưởng lại khi phát lại sự kiện.

## Ba lựa chọn và nguồn

| Ảnh có sẵn | Tên hiển thị | Tên danh mục | ID | Xu / một quà |
| --- | --- | --- | --- | ---: |
| `public/assets/Qua/1xu.jpg` | Hoa hồng | Rose | 5655 | 1 |
| `public/assets/Qua/10xu.jpg` | Cỏ bốn lá | Shamrock | 9875 | 10 |
| `public/assets/Qua/20xu.jpg` | Má hồng nhỏ xinh | Tiny Blush | 1473096 | 20 |

Tra cứu ngày **08/11/2026**: Rose và Shamrock từ [TikTokGame, danh mục có vùng VN](https://tiktokgame.vn/gift/index.php); Tiny Blush từ [Euler Stream, dòng ID1473096](https://www.eulerstream.com/docs/tiktok-gifts-list#gift-1473096). Đã đối chiếu trực quan biểu tượng Shamrock/Tiny Blush với ảnh người dùng cung cấp. “little kisses”20 xu là biểu tượng khác, không dùng ID của quà đó cho Má hồng nhỏ xinh.

Đây là metadata tham khảo từ danh mục bên thứ ba; việc khớp quà ở phiên LIVE của tài khoản thực **chưa kiểm chứng**. Khi TikTok đổi ID/giá, có thể chuyển sang nhập tay dữ liệu thực nhận. Ứng dụng chỉ dùng ba JPG local do người dùng cung cấp; các ảnh tra cứu không được đưa vào asset chạy game.

## Bình luận và follow

Lỗi được xác định trong schema cài sẵn: native `WebcastChatMessage` có trường **`content`**, trong khi mã cũ đọc `comment`, khiến lệnh bị coi như không có nội dung. Bộ chuẩn hóa hiện ưu tiên `content`, tương thích `comment` cũ và báo lỗi rõ khi thiếu/sai kiểu/quá200 ký tự.

Lệnh `nhập môn`/`NHAP MON` tiếp tục đi qua pipeline server và nhận diện bằng user ID; người cũ không tạo trùng. Bình luận thường chỉ ghi log, không tự nhập môn. Follow dùng sự kiện sẵn có của connector, có chống trùng/rate limit; không tự tạo người chơi hay thay đổi phần thưởng.

Log server tối đa50 dòng trong RAM, không lưu lịch sử bình luận xuống save. Dashboard localhost trả20 dòng gần nhất qua `interactionLog`; WebSocket/Unity vẫn nhận hợp đồng trình diễn hiện hữu, không nhận nội dung bình luận. DEMO và LIVE giữ log riêng theo engine.

## Kiểm thử

- `npm.cmd test`: xem kết quả cuối tại [PROGRESS](../../PROGRESS.md), log [npm-test.txt](qua-phan4/npm-test.txt).
- `node scripts/gift-settings-browser-smoke.js` (hoặc `gifts-comments-browser-smoke.js`): xem [báo cáo Chrome](qua-phan4/browser-report.json). Kiểm ba ảnh local, khóa giá, quy tắc thủ công, lưu/reload/bản nháp, cả ba quà, sai ID cùng giá, combo/replay, nhập môn và follow; desktop/mobile/sáng/tối.
- Test native dùng encode/decode protobuf của thư viện đã cài và dispatch thật của connector; chỉ thay network connect/disconnect bằng fixture. Không phải bằng chứng đã nhận LIVE qua mạng thật.
- API tải danh mục cũ trả404; cache metadata cũ nếu có giữ nguyên trên đĩa và không được sử dụng. Không đổi schema người chơi/quy tắc, không sửa scene hoặc gameplay Unity.
- LIVE thật, Unity Editor/Play Mode/build Windows, âm thanh/OBS: **CHƯA KIỂM CHỨNG trong lượt này**. Phạm vi thay đổi là quản trị và đầu vào backend; không coi npm/Chrome là PASS Unity.
