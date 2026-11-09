# Điều chỉnh mây/sét độ kiếp và thời lượng camera

Ngày 09/11/2026, theo ba lựa chọn đã xác nhận của người dùng. **Đã triển khai, kiểm thử và ghép scene nguồn Concept02.**

## Hành vi

- Trước khi tới đài (0–1,5 giây của nghi thức), mây đen và sét đều ẩn. Tới đài tại **1,5 giây** mới hiện mây; sét xuất hiện từ **1,8 giây**, sau mây **0,3 giây**. Dùng cùng tiến độ server với đường bay, không thêm thời gian nghi thức.
- Giữ **4 PNG sét hiện hữu**, mỗi ảnh giữ **1/6 giây**; một vòng **2/3 giây**, tương đương **40 frame ở mốc 60 FPS**. Nhịp theo thời gian, không đếm frame render, nên không chậm đi khi máy chạy 30 FPS. Sét lặp từ mốc 1,8 giây đến hết nghi thức. Pause/stopped giữ trạng thái/frame; reconnect lấy đúng tiến độ; kết quả/hết thời gian/battle/disconnect/disable tắt hiệu ứng.
- Camera ngẫu nhiên: **zoom giữ đủ 5 giây**, **pan đi qua lại đủ 20 giây**, cộng riêng **0,8 giây vào và 0,8 giây về**. Tổng lượt zoom **6,6 giây**, pan **21,6 giây**. Follow độ kiếp vẫn tổng **8 giây**, sau khi hoạt cảnh xong chờ **15 giây** mới chọn lượt kế tiếp.
- Ưu tiên quà → người mới → random, hàng đợi/gộp quà, camera nhận quà khoảng 3 giây, đường bay nhập môn 3 giây, boss giữ chờ và pause giữ nguyên theo mục9.

Không sửa backend, thời lượng/xác suất/kết quả độ kiếp, số đợt sét/SFX, gameplay quà hoặc dữ liệu người chơi. Không tạo/tải thêm ảnh, đổi package hoặc góc camera gốc. Renderer Three.js và project Unity riêng được giữ.

## Kiểm chứng

- **Node PASS137 / FAIL0 / SKIP1** trong138 bài core ở lượt này; LIVE thật là SKIP.
- **Unity6000.5.9f1 PASS87 bài khác nhau / FAIL0 / SKIP0**, qua hai lượt: [hồi quy74/74](unity-tests.xml) và [protocol24/24](unity-protocol-tests.xml), có11 bài trùng được tính một lần. Bao gồm9 bài storm và7 Camera9, cùng item/boss/TB02/audio/K01/nhân vật/protocol. Tất cả87 trường hợp của baseline Camera9 đều có kết quả PASS mới. Bộ lọc ban đầu bỏ sót13 trường hợp protocol có tham số; đã bổ sung toàn bộ class protocol và sửa helper để các lần chạy sau chọn đúng, không xem các trường hợp chưa chạy là PASS.
- **GPU PASS**, NVIDIA Quadro M1000M:10 ảnh1080×1920/720×1280 ở năm mốc đang bay, mây bật, sét bắt đầu, ảnh sét thứ tư và hết nghi thức. Đã xem ảnh. [Báo cáo thời gian](capture-report.json) còn kiểm tra ngay trước/sau6,6/21,6/8 giây, camera đều trả về toàn cảnh.
- **Ghép/audit PASS**:1.127 file được bảo vệ giữ SHA256, gồm backend, player data, cấu hình, package, ảnh/GUID/prefab/ghế. Giữ đủ791 document scene, chỉ đổi document IdleCameraPresenter cho ba thời lượng; không thêm/xóa object, giữ camera/viewport và mọi document khác nguyên byte. [Audit cuối](final-verification.json), [Node core](node-core.log).
- Build Windows mới, OBS, LIVE thật và FPS stream: **CHƯA KIỂM CHỨNG**.

Các bài kiểm tra liên quan lấy mẫu trước/sau các mốc1,5 và1,8 giây; đủ bốn ảnh/vòng; thời lượng nghi thức và số đợt khác nhau; pause/reconnect/kết thúc; camera trước/sau6,6/21,6/8 giây và thời gian chờ15 giây; quà ngắt camera/nhập môn/boss giữ cơ chế cũ.

## Nạp và đối chiếu

Dừng Play rồi mở lại `Assets/Scenes/SectScene_Concept02.unity` để nạp các thời lượng đã lưu trên `IdleCameraPresenter`: `panSeconds=20`, `zoomSeconds=5`, `followSeconds=8`. Mục menu Camera9 hiện hữu cũng dùng các giá trị mới. Backend không đổi nên không cần khởi động lại Node vì lượt sửa này.

Đối chiếu: [đang bay/chưa có mây hoặc sét](ritual-1000-720.png), [tới đài/có mây](ritual-1500-720.png), [bắt đầu sét](ritual-1800-720.png), [ảnh sét thứ tư](ritual-2301-1080.png), [mây/sét đã tắt](ritual-12000-720.png). Hậu tố1080/720 là độ rộng, tỷ lệ9:16. Pháp trận/cột sáng nền có sẵn được giữ; lượt này chỉ đổi mây đen và tia sét. Các mốc chỉ dùng làm mẫu trình diễn trong project kiểm thử, không ghi vào save người chơi.

Helper `StormCameraTimingSetup` và `Run-StormCameraTimingUnity.ps1` chỉ chạy trên bản sao `test-results/unity-concept02/project`. `storm-camera-timing-publish.js` chỉ chuyển đúng document thời lượng camera đã test, giữ mọi document khác từ baseline nguồn. Không tự commit/push hoặc đóng Editor người dùng.
