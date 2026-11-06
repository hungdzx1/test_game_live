# 06.4 — THIẾT KẾ LẠI CHIẾN TRƯỜNG DIỆT MA HAI PHE

> **Phạm vi:** chỉ chỉnh hiển thị `/song` và các module frontend liên quan đến nhiệm vụ này. Đọc `00_TONG_QUAN.md` trước.
> **Nguồn ảnh:** hai ảnh tham chiếu mà người dùng đã gửi vào Codex. Ảnh là định hướng bố cục và mỹ thuật, không phải asset để đặt làm hình nền.
> **Bất biến:** server là nguồn sự thật của gameplay. Không sửa phép tính tu vi, xác suất độ kiếp, sát thương, boss, quà, bảng xếp hạng hay cơ chế lưu DEMO/LIVE.

## Mục tiêu nghiệm thu
Trong một màn `/song` dọc 9:16, **bên trái là ma quân/boss đang tiến tới**, **bên phải là nhóm đệ tử đại diện tung kiếm khí, lôi pháp về phía ma/boss**. Hai phía có màu đối lập đỏ/tím và xanh/vàng, đạn/kỹ năng đi theo hướng đúng, dễ xem khi livestream. Không cần vẽ đủ tất cả người thật; số liệu, damage, boss HP và TOP vẫn lấy từ state server.

## Mã nguồn dự kiến
- `public/js/battleScene.js` — bố cục chiến trường, enemy/boss formations, 3 boss, luồng hiệu ứng.
- `public/js/characters.js` hoặc module presentation riêng — nhóm đệ tử minh họa, không thay danh sách người tham gia của server.
- `public/js/camera.js` — battle composition an toàn; tôn trọng manual battle view và focus boss.
- `public/js/main.js` — đồng bộ battle presentation hiện có, không thêm battle tick client.
- `public/js/battleOverlay.js` **chỉ điều chỉnh tối thiểu phần số liệu nếu thật cần**; toàn bộ redesign HUD và thông cáo ở 06.5.

## 6. Màn DIỆT MA — CHIA HAI PHE TRONG KHUNG 9:16

### 6.1. Bố cục và chuyển động

- **Trái = MA/BOSS tiến tới**: đất nứt, cổng ma, quái tràn ra, boss lớn hình người/mãnh thú tùy loại, ma khí đỏ-tím, chuyển động từ xa lại gần. Boss minh họa có dáng áo giáp / tóc dài / sừng, không chỉ là khối hộp.
- **Phải = ĐỆ TỬ chống trả**: 5–10 nhân vật đại diện từ chiến trường đang được quan sát, xếp đội hình 2–3 tầng, vung kiếm và phóng kiếm khí xanh/vàng/tím **hướng về trái**. Người chơi khác vẫn được mô phỏng như cũ dù không render.
- Hai khu chia rõ bằng màu, mặt đất/đảo nổi/đường phân cách thị giác; có đòn chiêu bay xuyên khoảng giữa và va trúng boss, **tránh chia đôi bằng 2 ảnh tĩnh**.
- Cho phép chọn một world view/camera hoặc hai viewport render của một renderer, nhưng giữ **1 state chiến trường hiện tại** từ `s.battle.view` và 1 bộ sự kiện chiến đấu; không tự thêm kẻ địch/HP sát thương ở client.
- Duy trì 11 chiến trường logic độc lập; chỉ hiển thị chiến trường được `viewId` chọn theo director hiện có, thay đổi cảnh nhẹ nhàng.
- 3 boss có 3 silhouette khác biệt: thống lĩnh giáp tối, huyết ma đỏ đen, ma tôn tím với hiệu ứng bậc cao. Model có thể là procedural approximation ảnh concept, không bắt buộc hình người siêu thực.

### 6.2. HUD chiến đấu nhỏ

- Vùng trên/trung tâm (không che mặt boss): tên chiến trường, tên boss, thanh HP rõ, trạng thái (còn sống/đã hạ/rút lui), TOP 3 sát thương theo `f.top`.
- Top 3 hiển thị chỉ vài dòng; có thể thu lại khi va chạm phép thuật dày đặc.
- Các quái và boss có animation lao tới, đánh, trúng đòn, ngã; hiệu ứng hiển thị phản ánh event thật.
- Không hiển thị danh sách tất cả nhân vật trên màn hình.

## Tính đúng của dữ liệu chiến đấu
- Battle 11 chiến trường chạy độc lập như hiện tại; hình ảnh chỉ phản ánh chiến trường đang chọn.
- Minh họa tối đa số đệ tử hợp lý, nhưng TOP sát thương và hit được lấy từ `state.battle.view`, không tính lại hay giả lập.
- Khi boss mới xuất hiện/đã chết/rút lui, hình ảnh đổi theo state; không thể tiếp tục thể hiện boss chết là đang đánh.
- Với 3 boss ở các đợt khác nhau, phải thể hiện khác biệt về silhouette, hiệu ứng, độ lớn.
- Không dựng hai engine/mô phỏng chiến đấu, không tách state server; có thể dùng một canvas bố trí chia phe hoặc 2 camera viewport trên cùng renderer nếu không nhân đôi trạng thái.
- Tránh xung đột scene world ở 06.1 và model ở 06.2, camera ở 06.3.

## Kiểm thử riêng
- [ ] Boss/quái ở trái, đệ tử ở phải, cùng nhìn thấy trên 9:16.
- [ ] Event `battle:hit`, `boss:skill`, kỹ năng 1/2 được biểu diễn đúng hướng và phù hợp số damage thật.
- [ ] Thanh HP boss và TOP đang có vẫn cập nhật realtime.
- [ ] Chuyển 11 chiến trường không dùng nhầm tên/hình/HP, không leak đối tượng.
- [ ] Ba boss khác ngoại hình; animation xuất hiện, tiến, cast, hit, death/timeout.
- [ ] Chuyển tu luyện → battle → kết quả → tu luyện không bị mất sân hoặc thiếu nhân vật.
- [ ] Render 10/60 người không giảm FPS quá mức, low quality vẫn thấy hai phe.

## Cách Codex thực hiện riêng bước này
1. Kiểm tra `git status`, đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `00_TONG_QUAN.md` và tài liệu bước hiện tại. Bảo vệ mọi thay đổi chưa commit.
2. Chạy baseline `npm test` trước sửa; xác minh hành vi hiện tại bằng trình duyệt nếu có. Không báo là đã thử browser khi chưa chạy.
3. Kiểm tra code local mới nhất; tên file nêu trong tài liệu là vị trí tham khảo từ nhánh `main`, không phải danh sách bắt buộc phải sửa hết.
4. Thay đổi tối thiểu, theo module; không thêm mô phỏng, vòng render, kết nối WebSocket hay hệ thống lưu tiến trình mới.
5. Chạy lại `npm test` và kiểm thử chức năng/ảnh màn hình thuộc bước này. Không reset dữ liệu thật, không tự commit/push.
6. Cập nhật `PROGRESS.md`: file đổi, chức năng thực hiện, test PASS/FAIL/CHƯA KIỂM CHỨNG, thiếu sót, ảnh thực tế nếu chụp được. Dừng sau bước này.
