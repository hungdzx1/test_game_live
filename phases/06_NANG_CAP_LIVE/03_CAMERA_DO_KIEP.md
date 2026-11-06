# 06.3 — CAMERA DI CHUYỂN NHẸ VÀ HOẠT CẢNH ĐỘ KIẾP

> **Phạm vi:** chỉ chỉnh hiển thị `/song` và các module frontend liên quan đến nhiệm vụ này. Đọc `00_TONG_QUAN.md` trước.
> **Nguồn ảnh:** hai ảnh tham chiếu mà người dùng đã gửi vào Codex. Ảnh là định hướng bố cục và mỹ thuật, không phải asset để đặt làm hình nền.
> **Bất biến:** server là nguồn sự thật của gameplay. Không sửa phép tính tu vi, xác suất độ kiếp, sát thương, boss, quà, bảng xếp hạng hay cơ chế lưu DEMO/LIVE.

## Mục tiêu nghiệm thu
Màn tu luyện và độ kiếp có camera **lia trái-phải/orbit nông liên tục nhưng mượt**, không đóng đinh một điểm. Khi có người độ kiếp, người đó **đứng lên → bay/nhảy lên đài → ngồi xếp bằng**; sân bên dưới và các đệ tử khác vẫn có mặt ở phần dưới khung 9:16. Khi xong quay về mượt. Không đụng xác suất hay thời điểm độ kiếp thực tế.

## Mã nguồn dự kiến
- `public/js/camera.js` — mở rộng `CameraDirector`, giữ queue ưu tiên, manual, cooldown, follow, boss.
- `public/js/breakthroughScene.js` — hiệu ứng/pháp trận/sét cho shot chung.
- `public/js/presentationState.js` — lớp presentation client cho chuyển tiếp nhân vật, không sửa server state.
- `public/js/characters.js` — tư thế thiền khi ở đài và animation bay lên/về nếu cần.
- `public/js/main.js` — kết nối tối thiểu trên vòng render sẵn có; `sectLayout.js` dùng chung anchor.

### 4.2. Hành vi độ kiếp

1. Trước nghi thức, nhân vật ở sân trong trạng thái thiền.
2. Nhân vật **đứng dậy → nhảy/bay theo đường cong lên đài** (animation mặt trình diễn, 0.8–2 giây, không thay thời điểm tính độ kiếp ở server).
3. Chạm tới tâm đài, chuyển sang **ngồi xếp bằng thiền**. Không đứng cầm kiếm như hiện tại khi đang độ kiếp (trừ một khoảnh khắc chống sét/thi triển riêng).
4. Thiên lôi, vòng trận và hào quang diễn ra trên đài; các đệ tử ở sân vẫn thiền và cử động nhẹ phía dưới.
5. Camera tăng nhẹ độ chú ý vào đài nhưng **không cắt khỏi sân**. Nếu cần close-up rất ngắn, trở lại ngay shot chung; mặc định ưu tiên shot chung.
6. Kết thúc: thành công/thất bại bằng hiệu ứng riêng, nhân vật từ đài trở lại sân theo hoạt cảnh; khi server đổi trạng thái, tránh teleport giật bằng interpolation phía client.
7. Nếu nhiều người chờ độ kiếp, vẫn dùng hàng chờ gốc; không phát minh cơ chế nhiều đài độ kiếp cùng lúc.

### 4.3. Camera không fix cứng

- Thiết kế **đường camera mềm** quanh một camera anchor, dao động rất chậm (ví dụ quỹ đạo elip nhỏ, parallax và độ cao thay đổi nhỏ). Có thể dùng spline / sin có phase ổn định hoặc spring/damped lerp.
- Trong shot tông môn, camera di chuyển nhẹ từ trái qua phải và lại về, **không xoay 360°** và không chĩa vào phía sau khiến mất đài.
- Luôn giữ **cả sân + đài** nằm trong vùng an toàn của phối cảnh 9:16. Có thể tính `Box3`, project các điểm quan trọng lên màn hình, tự chỉnh target, FOV hoặc khoảng cách camera khi đổi tỉ lệ.
- Hạn chế tốc độ góc, gia tốc và zoom; không chuyển camera đột ngột khi nhận nhiều join/comment.
- Khi có độ kiếp: nội suy target về điểm cân bằng giữa đài và sân, tăng trọng số đài; đệ tử bên dưới còn thấy rõ.
- Sự kiện quà có hiệu ứng camera phải vẫn tôn trọng queue priority/cooldown hiện tại. Sau khi focus xong, quay về shot overview mềm mại.
- Không được thay đổi API `CameraDirector.requestFocus` / `CameraDirector.update` theo cách làm hỏng caller. Ưu tiên giữ signature và thêm helper.
- Có 3 tùy chọn trình diễn nếu cần: `tông môn tổng quan`, `tông môn + đài độ kiếp`, `chiến trường`; mặc định là tự động. Không cần sửa cấu trúc server khi tránh được.

## Ưu tiên camera và chuyển động an toàn
- Góc tổng thể là chính; chuyển động theo quỹ đạo nhỏ chứ không quay 360 độ.
- Dùng `lerp`/`damp` hoặc spline và delta time; không thay đổi trạng thái camera đột ngột khi nhận state mỗi nhịp.
- Camera theo quà/follow/manual và kết quả boss vẫn dùng pipeline ưu tiên hiện có; tự động trở về shot an toàn sau thời hạn.
- Không làm thay đổi vị trí logic server; xử lý nhân vật bay lên đài, ngồi thiền và trở về ở lớp dựng hình.
- Camera không mất tông môn khi lighting sét hay hiệu ứng độ kiếp; cần giới hạn shake.

## Kiểm thử riêng
- [ ] Đo/quan sát camera ít nhất 60 giây, góc thay đổi nhẹ mà cả hai khu vẫn nhìn thấy.
- [ ] Cảnh độ kiếp: người đang độ kiếp lên đài, ngồi, các đệ tử khác ở sân không biến mất.
- [ ] Độ kiếp thành công/thất bại và việc quay về đúng; không xê dịch vị trí model sau nhiều vòng.
- [ ] Không thay đổi hàng chờ/cooldown/xác suất theo server.
- [ ] Chuyển sang battle và về cultivation camera không giật hoặc mắc kẹt mode.
- [ ] 9:16 ở cả 1080×1920 và 720×1280, FPS ổn định.

## Cách Codex thực hiện riêng bước này
1. Kiểm tra `git status`, đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `00_TONG_QUAN.md` và tài liệu bước hiện tại. Bảo vệ mọi thay đổi chưa commit.
2. Chạy baseline `npm test` trước sửa; xác minh hành vi hiện tại bằng trình duyệt nếu có. Không báo là đã thử browser khi chưa chạy.
3. Kiểm tra code local mới nhất; tên file nêu trong tài liệu là vị trí tham khảo từ nhánh `main`, không phải danh sách bắt buộc phải sửa hết.
4. Thay đổi tối thiểu, theo module; không thêm mô phỏng, vòng render, kết nối WebSocket hay hệ thống lưu tiến trình mới.
5. Chạy lại `npm test` và kiểm thử chức năng/ảnh màn hình thuộc bước này. Không reset dữ liệu thật, không tự commit/push.
6. Cập nhật `PROGRESS.md`: file đổi, chức năng thực hiện, test PASS/FAIL/CHƯA KIỂM CHỨNG, thiếu sót, ảnh thực tế nếu chụp được. Dừng sau bước này.
