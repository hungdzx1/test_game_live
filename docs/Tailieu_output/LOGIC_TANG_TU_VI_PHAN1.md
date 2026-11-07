# Logic tăng tu vi — phần 1

Đã thực hiện theo [Logic_Tang_Tu_vi.md](../Tailieu/Logic_Tang_Tu_vi.md) phần1 và lựa chọn của người dùng: **nguyên lực cộng ngay, chỉ gom tu vi cá nhân**.

## Luật đang áp dụng

| Nguồn | Bình thường | Một Trà hoặc Ban Phúc x2 |
|---|---:|---:|
| Tu luyện tự động, mọi cảnh giới | 2 tu vi/giây | 4 tu vi/giây |
| Tim của người có nhân vật | 2 tu vi/tim | 4 tu vi/tim |
| Nguyên lực tông môn | 1 nguyên lực/tim hợp lệ | Vẫn 1 nguyên lực/tim |

Tu vi theo giây chỉ tăng trong giai đoạn tu luyện. Tim vẫn ghi nhận trong diệt ma, tạm dừng và dừng; tu vi chốt vào phần chờ, trả một lần khi trở về tu luyện. Không tính bù tu vi tự động lúc server tắt.

Tu vi theo tim gom **riêng từng người**. Đủ100 tim thì chốt; dưới100 thì chờ người đó ngừng thả1 giây. Ví dụ150 tim: chốt100 trước, giữ50 chờ1 giây. Nguyên lực tăng ngay cả với50 tim đang chờ. Việc chốt tự động chạy theo tick máy chủ, thường ở tick50ms kế tiếp sau mốc1 giây.

Hệ số được ghi nhận lúc nhận tim: buff hết trong giây chờ không làm mất thưởng; dùng buff sau đó không tăng lại tim cũ. Một sự kiện làm tăng cấp tông môn nhận tu vi theo hệ số trước quà của mốc đó; Ban Phúc từ mốc có tác dụng với tim tiếp theo. Trà, Linh Căn, Ban Phúc giữ cách cộng hệ số cũ và giới hạn mặc định x8; nhiều Ban Phúc chỉ cộng thời gian. Đan và Quay Cam không tăng tu vi.

Chỉ nhân vật có cùng userId với người gửi nhận tu vi. Người chưa nhập môn vẫn giúp tăng nguyên lực nhưng không được tự tạo nhân vật hoặc giữ tu vi hồi tố. Tổng tim phòng vẫn đối chiếu/chống đếm trùng như trước; không gán phần tăng không rõ chủ cho người vừa gửi event. Tu vi từ tim vẫn hoạt động khi nguyên lực đạt MAX.

## Thử bằng Demo

1. Khởi động lại Node để nạp code mới. Mở trang quản trị → Demo → **Thử không cần LIVE**.
2. Chọn **Đạo hữu đang chọn**. Các nút tim áp dụng cho nhân vật này.
3. Bình thường, phần Tu luyện & độ kiếp hiển thị **2.0/giây**. Bấm **10 tim**, chờ ngừng1 giây: cộng20 tu vi bên cạnh tu vi tự động. Bấm **100 tim**: chốt200 tu vi ngay.
4. Chọn **Trà Ngộ Đạo** → Cấp1 vật phẩm → Dùng vật phẩm. Hiển thị **4.0/giây**;10 tim cho40 tu vi,100 tim cho400 tu vi.
5. Khi **Tạm dừng**, nguyên lực vẫn tăng ngay, tu vi giữ chờ. Bấm **Tiếp tục** để nhận phần chờ. Nếu vượt ngưỡng nâng tầng, tu vi hiển thị là phần dư sau khi nâng tầng, không phải tổng đã kiếm.

Không cần chỉnh tốc độ trong `caidat.json`. `rulesFor()` đọc cấu hình cũ với rate2 cho cả11 cảnh giới và giữ chỉ số/ngưỡng khác; không tự ghi lại file cài đặt production trong lượt triển khai này. Bảng GAME_DESIGN đã cập nhật theo yêu cầu mới; tài liệu phase cũ giữ như lịch sử triển khai.

## Mã và kiểm thử

- `cultivationConfig.js`: tốc độ gốc, tu vi/tim, kích thước chuỗi và thời gian chờ.
- `likeCultivation.js`: gom riêng từng người, ghi hệ số, chốt qua CultivationService, lưu chuỗi dở.
- `gameEventBus.js`: nguyên lực ngay, chống trùng/đối chiếu tổng phòng, lưu thêm trường tùy chọn `runtime.interactions.likeStreaks`; đọc được save cũ. Chuỗi, biên nhận và EXP được lưu chung trạng thái, không thêm file dữ liệu riêng.
- `gameEngine.js`: xử lý chốt chuỗi cả khi pause/stopped nhưng tu vi chỉ vào phần chờ. `server.js`: tim đi trong hàng đợi đóng góp có giới hạn, không mất vì hạn mức bình luận/hiệu ứng thông thường.
- Node giữ toàn bộ phép tính. Unity runtime không tính lại gameplay; chỉ thêm fixture do Node tạo và bài Play Mode cho Concept02.

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd test` | **PASS114 / FAIL0 / SKIP1**,115 bài/22 file;12 bài mới. SKIP là LIVE thật |
| API/WS/lưu/restart | **PASS**: nguyên lực ngay,1 giây chốt, hệ số Trà, trả chờ một lần, chuỗi17 tim qua restart, chống replay, DEMO/LIVE độc lập |
| Native adapter mô phỏng | **PASS**:1.100 event tim đơn qua adapter/queue/server/disk, đủ2.200 tu vi chờ, không mất vì giới hạn sự kiện, replay không thưởng lại. Đây không phải phiên LIVE thật |
| Chrome admin Demo | **PASS**, Chrome156; nút10/100 tim, chọn hai người khác nhau, Trà,2/4 tu vi/giây, pause/resume; không lỗi runtime; ảnh đã xem |
| Unity compile/suite | **PASS54/54** trên bản sao project, Unity6000.5.9f1 |
| Unity Editor Play Mode | **PASS**, Enter/ExitPlayMode thực: snapshot Node2 tu vi sau1 giây,50 tim tăng nguyên lực trong khi tu vi chưa chốt, chốt102, Trà lên502, sau15 tim lên Trung Kỳ; kiểm tra protocol/roster/HUD nguyên lực và tên/tầng |
| Bảo toàn | **PASS243/243** file giữ hash: dữ liệu thật/demo/backups, caidat, package/lock và scene/prefab/artwork; `tu-vi-phan1/verification-report.json` |
| Windows executable/build mới, GPU/FPS, OBS, LIVE thật | **CHƯA KIỂM CHỨNG** trong lượt này |

Evidence tại [tu-vi-phan1](tu-vi-phan1/). Ban đầu một bài API dùng file LIVE sentinel không có schema rồi thử chuyển sang LIVE, nên bị từ chối đúng bởi bộ đọc save; đã đổi fixture sang save hợp lệ và chạy lại PASS. Không có lỗi runtime đã biết còn lại trong phạm vi này. Không chạy bộ renderer `/song` để thay cho Unity; không commit/push/reset hoặc xóa dữ liệu người chơi.
