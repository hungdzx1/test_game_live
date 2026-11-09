# Quà tự dùng và camera — Qua_Tbao phần7–8

**Cập nhật Khung.md08/11/2026:** người dùng đã xác nhận đổi Linh Căn từ x2 sang **x3 vĩnh viễn**; save x2 cũ nâng khi nạp, không dùng thêm đồ. Mô tả x2 và số liệu kiểm thử bên dưới là lịch sử tại thời điểm phần7–8; kết quả mới Node129 PASS/1 SKIP ở [khung-01](../khung-01/README.md).

Khởi động lại Node để nạp luật quà mới, dừng Play/mở lại `SectScene_Concept02` rồi Play. Dữ liệu người chơi và đồ cũ trong túi giữ nguyên.

Quà mới từ người xem, thưởng cấp tông môn, boss, đổi nhiệm vụ và nút cấp DEMO đi qua luồng nhận quà: Trà kích hoạt x2 trong60 giây, Linh Căn x2 vĩnh viễn, Ban Phúc kích hoạt x2 toàn tông trong số lượng×30 giây. Các hệ số vẫn cộng theo luật cũ và giới hạn hiện tại; Ban Phúc chỉ cộng thời gian. Kích hoạt cả khi battle/paused/stopped, nhưng thời gian buff chỉ giảm trong cultivation. Buff đang có trong save giữ nguyên thời gian còn lại; không quét/tự tiêu đồ cũ. Linh Căn đã vĩnh viễn thì phần thừa ở trong túi. Trà vượt100 hiệu ứng đang chờ giữ phần mới trong túi/hàng kích hoạt, trả dần khi có chỗ, không mất qua restart.

Đan nằm trong túi tới lúc bắt đầu nghi thức. Server tính số viên còn thực sự làm tăng tỷ lệ, dừng khi đạt trần Pmax/giới hạn85% và maxPills hiện có; chỉ trừ số đã dùng. Bảo hộ/Đan đã chuẩn bị trong save cũ được tính trước, Thiên Mệnh chắc chắn thành công không tiêu thêm Đan, Phi Thăng không dùng Đan. Đan nhận giữa nghi thức giữ cho lần sau; restart không lấy thêm hoặc quay lại kết quả. Nút dùng Đan thủ công được khóa vì Đan đã tự dùng lúc bắt đầu nghi thức.

`item:received` thêm `scope:'personal'|'all'`, giữ envelope v1 và các field cũ. Boss/đan chờ nhận là all; quà cấp tông môn giữ dấu all kể cả túi đầy/restart; quà cá nhân vẫn personal. Đây là metadata trình diễn, Unity không gửi lại damage/vật phẩm hoặc viết dữ liệu game.

Trong Concept02:

- `08_Systems/GroupReceiptPresenter`: quà toàn tông hiện icon và số lượng đồng thời trên đầu các thành viên đang được render, không chọn từng người/không zoom/không đổi roster. Tối đa25 visual dùng chung sprite; chờ tối đa2 giây cho roster/snapshot cập nhật. Không tạo thêm nhân vật cho người đang ngoài giới hạn chất lượng. Hiệu ứng tự hết sau1,8 giây cả khi pause. Ban Phúc dùng popup toàn tông cũ; Quay Cam thiếu icon dùng chữ, giữ trong túi và không tự gây zoom toàn tông.
- `07_UI/UI_Canvas/WholeSectReceiptTemplate`: mẫu icon56px và số lượng. Không chặn chuột. Các bản clone chỉ tồn tại khi chạy; pool25 được tái sử dụng, event trùng/reconnect không phát lại.
- `08_Systems/IdleCameraPresenter`: sau30 giây không có hoạt cảnh camera, pan nhẹ/zoom tối đa6% trong8 giây rồi trả đúng góc gốc, lặp sau khoảng rảnh mới. Theo tu sĩ đang bay/lên đài rồi trở lại, không đổi gameplay hoặc đường bay. Low vẫn có chuyển động chậm theo thời gian thực. Pause/stopped đóng băng; battle/disconnect/đổi phiên/disable trả toàn cảnh.
- Quà cá nhân mới hoặc sự kiện Quay Cam ưu tiên hơn chuyển động tự động. Camera trở về gốc khoảng0,35 giây rồi mới bắt đầu zoom quà3 giây hiện hữu. Quà toàn tông giữ góc hiện tại trong lúc icon hiện, không tạo chuỗi zoom từng người.
- Khi zoom, tên/cảnh giới vẫn hiện trên đầu. Chỉ bù tỷ lệ bảng tên để chữ không phình quá lớn; giữ vị trí/độ bật gốc và trả đúng scale khi xong. Vẫn giữ rung Ban Phúc, LV UP, boss60 frame và các hoạt cảnh đã có.

Menu **Tu Tien LIVE → Concept 02 → Add group receipts and idle camera** hỗ trợ scene đang mở trong bộ nhớ chưa có hai hệ thống mới. Các trường thời gian/giới hạn nằm trong Inspector. Main/Three.js và project riêng trong `public/unity-client/My project/` được giữ.

Đã hoàn tất ghép vào scene nguồn sau lần gián đoạn. Kết quả cuối:

- Node127 bài:126 PASS,0 FAIL,1 SKIP LIVE thật — `npm-test.txt`.
- Unity Editor/Play/protocol47/47 PASS,0 FAIL/SKIP — `unity-tests.xml`; gồm HTTP → Node → WebSocket → Unity với dữ liệu tạm.
- Sáu ảnh Quadro M1000M đã kiểm tra: `whole-sect-1080.png`, `whole-sect-720.png`, `idle-pan-1080.png`, `personal-names-1080.png`, `personal-names-720.png`, `ritual-follow-1080.png`. Thông số tại `capture-report.json`.
- Bảo toàn957 file,424 document gốc trừ hai danh sách child, thêm18 document đã test — `preservation-report.json`, `final-verification.json`. Giữ PNG/prefab/camera gốc. File font `Nameplate SDF.asset` thay đổi đồng thời sau baseline được giữ nguyên, không ghi đè; hash và ghi chú riêng có trong báo cáo. Thay đổi font này chưa kiểm chứng trong project test cô lập.

Chi tiết lỗi đã sửa và giới hạn được ghi ở mục phần7–8 mới nhất trong `PROGRESS.md`. Build Windows mới, OBS, LIVE thật và FPS stream **CHƯA KIỂM CHỨNG** trong lượt này, không suy ra PASS từ Editor/ảnh tĩnh.
