# Phần 3 — Cấp tông môn

Đã thay phần “Kết nối & Nguyện Lực” trong Cài đặt bằng bảng cấp tông môn. Theo câu trả lời của người dùng: chọn trực tiếp vật phẩm game, chỉ có phạm vi Toàn tông môn. Không triển khai phần2 giọng AI.

## Cách chỉnh

1. Khởi động lại server Node để nhận mã mới, chờ Unity import thay đổi C#, tải lại trang quản trị.
2. Vào **Cài đặt → TikTok & quà → Cấp tông môn**.
3. Mỗi dòng chỉnh **Số lượng tim**, **Quà** (Trà/Đan/Ban Phúc/Linh Căn/Quay Cam hoặc Không thưởng), **Số lượng thưởng**. Phạm vi cố định **Toàn tông môn**.
4. Bấm **Thêm cấp** để thêm dòng sau cùng; **Xóa cấp cuối** nếu cần rút bảng, tối thiểu1 và tối đa50 cấp. Bấm **Lưu cấp tông môn**. Cấu hình lưu trong `caidat.json`, giữ sau reload/restart và dùng chung cho hai bộ dữ liệu DEMO/LIVE; tiến độ của hai bộ vẫn riêng.

Mỗi dòng là tim **cần để hoàn tất cấp đang hiển thị**, không phải tổng tích lũy. Ví dụ cấp1 cần1.000 tim: đủ1.000 thì nhận quà dòng1 rồi lên cấp2. Cấp2 cần thêm3.000. Dòng cuối đủ tim nhận quà một lần rồi giữ MAX. Một sự kiện nhiều tim có thể vượt nhiều cấp và nhận đúng quà từng dòng.

Mặc định giữ1.000/3.000/5.000 tim, quà cấp1/2 Ban Phúc×1, cấp3 Không thưởng; có thể tự đổi. Để có cấp4, bấm Thêm cấp và đặt mốc/quà dòng4. Nếu cấp3 đã MAX thì sau khi lưu sẽ hiển thị cấp4 với tiến độ theo tổng tim đã ghi nhận, không phát lại quà cấp3.

Số tim mỗi dòng1–1.000.000.000; số lượng thưởng1–100. Trà/Đan/Linh Căn/Quay Cam cấp cho từng đệ tử có mặt tại lúc đạt mốc; khi chiến đấu/tạm dừng giữ trong túi, tự dùng khi về tu luyện theo giới hạn hiện hữu. Linh Căn dư hoặc Quay Cam đang hồi chiêu giữ trong túi. Người nhập môn sau mốc không nhận hồi tố.

Ban Phúc chỉ cộng **một lần cho toàn tông**, thêm số lượng×30 giây, luôn x2, không nhân số người. Ban Phúc bắt đầu khi chốt thưởng và đóng băng countdown ngoài tu luyện như cơ chế cấp trước đây. Ví dụ Ban Phúc×2 thêm60 giây cho cả tông môn.

## Khi sửa bảng đang có tiến độ

- Giữ tổng tim đã ghi nhận và tất cả vật phẩm/nhân vật. Tính lại cấp/thanh theo ngưỡng mới; tăng ngưỡng có thể làm cấp hiển thị giảm.
- Không tự cấp quà khi bấm Lưu, hạ ngưỡng hoặc tải save. Biên nhận các cấp đã hoàn tất được giữ nên tăng rồi hạ ngưỡng không nhận lại quà.
- Khi MAX không ghi thêm tim vượt tổng mốc trong bảng. Thêm cấp cho phép tích tiếp. Tổng tim có từ trước vẫn giữ nếu sau đó rút/ngắn bảng.
- Thưởng đã chốt nhưng inbox đầy giữ item/số lượng/người nhận ban đầu, kể cả đổi bảng hoặc restart. Quà TikTok phần1 tiếp tục độc lập như cũ.
- Mốc tim lặp/cooldown wish đã bỏ. Phần thưởng wish từ save cũ còn chờ được trả nốt, không tạo thêm lượt thưởng lặp mới. Các trường cấu hình wish cũ vẫn đọc được để không làm hỏng caidat cũ.
- Cài đặt chờ nối lại/số lần thử được chuyển tới **Trang chủ → Thông tin và lịch sử kết nối**.

## Dữ liệu và Unity

API quản trị `POST /api/control` với action `sectLevels`, value là mảng `{level,likes,reward:{item,quantity}|null,scope:'all'}`; kiểm tra toàn bộ trước khi ghi atomic. Payload snapshot bổ sung `config.sectLevels`. Envelope/route WebSocket không đổi.

Save tương tác version1 giữ schema người chơi2; trường nguyên lực có version2 riêng, lưu `totalLikes/completedLevels`. Tự đọc được save cũ `{level,power}` ba cấp, quy đổi theo mốc cũ và không phát lại quà. Trường `levelRewards` tùy chọn giữ phần thưởng cấp đang chờ. Không ghi dữ liệu kiểm thử vào caidat hoặc save production.

Unity nhận `maxLevel` cấu hình thay giới hạn3; bộ đọc kiểm tra tối đa50, HUD dùng đúng cấp/ngưỡng/tiến độ từ server. Snapshot cũ thiếu maxLevel vẫn mặc định3. Không đổi scene, prefab, artwork hoặc tỉ lệ nhân vật.

## Kiểm thử

- Node mặc định: **102 PASS / 0 FAIL / 1 SKIP**, tổng103. Có kiểm tra cấu hình6–7 cấp, vượt nhiều mốc, các vật phẩm, Ban Phúc một lần toàn tông, MAX/thêm cấp, sửa ngưỡng/biên nhận, migration, API/WS/restart, tách DEMO/LIVE và giữ thưởng khi inbox đầy. `qua-phan3/npm-test.txt`.
- Browser Chrome: bảng cấp mới **PASS**, chọn quà phần1 **PASS**, hồi quy5 trang quản trị **PASS**. Đã xem ảnh tối/sáng và mobile; kiểm tra bản nháp, input sai, lưu/reload, thêm/xóa cấp, nút tim Demo, MAX và reconnect chuyển về Trang chủ. Báo cáo/ảnh trong `qua-phan3/`, riêng chọn quà ở `qua-phan3/gift-regression/`.
- Unity6000.5.9f1: **53/53 PASS**, suite SectHud/NetworkProtocol/BlessingPanel/Concept02 trên project validation riêng. Có Enter/Exit Play Mode thực; snapshot từ Node cấp6/15 trên60 tim được protocol nhận và HUD vẽ25%, disconnect ẩn fill. Không dùng npm PASS thay kiểm tra Unity. `qua-phan3/unity-editmode.xml`.
- Bảo toàn: **243/243 file** được bảo vệ giữ hash, gồm data thật/demo/backups, caidat/package/lock, scene/prefab/artwork; `qua-phan3/verification-report.json`.
- LIVE thật, Windows executable/build mới, OBS và đo GPU/FPS: **CHƯA KIỂM CHỨNG** trong lượt này.

Các kiểm thử backend và browser dùng data/profile tạm; Unity dùng bản sao `test-results/unity-concept02/project`. Không dừng Editor người dùng, không commit/push/reset/xóa dữ liệu. Chạy lại bằng `npm.cmd test`, `node scripts/sect-levels-browser-smoke.js`; các test legacy `/song` vẫn chạy riêng bằng `test:legacy` khi cần.
