# 06.1 — THIẾT KẾ LẠI TÔNG MÔN VÀ ĐÀI ĐỘ KIẾP CÙNG MÀN HÌNH

> **Phạm vi:** chỉ chỉnh hiển thị `/song` và các module frontend liên quan đến nhiệm vụ này. Đọc `00_TONG_QUAN.md` trước.
> **Nguồn ảnh:** hai ảnh tham chiếu mà người dùng đã gửi vào Codex. Ảnh là định hướng bố cục và mỹ thuật, không phải asset để đặt làm hình nền.
> **Bất biến:** server là nguồn sự thật của gameplay. Không sửa phép tính tu vi, xác suất độ kiếp, sát thương, boss, quà, bảng xếp hạng hay cơ chế lưu DEMO/LIVE.

## Mục tiêu nghiệm thu
Khi mở `/song` ở trạng thái tu luyện, **cùng một camera 9:16** nhìn thấy sân tông môn ở phần dưới và đài độ kiếp nổi ở phần trên/phía phải. Các nhân vật đang thiền vẫn dễ thấy; không dùng hai ảnh tĩnh ghép lại. Bước này **chưa** làm lại chi tiết ngoại hình và **chưa** triển khai toàn bộ chuyển động camera/hoạt cảnh độ kiếp (bước 06.2, 06.3).

## Mã nguồn dự kiến
- `public/js/scene.js`: kiến trúc sân, chính điện, pháp trận, cây, mây, thác, cầu và hình khối nền.
- `public/js/breakthroughScene.js`: tái bố trí hình học đài và tâm bệ, giữ animation sét/mây đang có.
- `public/js/presentationState.js` **chỉ nếu cần** để dùng cùng hệ tọa độ; tuyệt đối không sửa nguồn dữ liệu người chơi.
- Tạo `public/js/sectLayout.js` nếu giúp dùng chung anchor/tọa độ; chỉ sửa `camera.js` mức cần thiết để có một shot overview xem được hai khu.

### 4.1. Dựng lại môi trường

- Sân tu luyện tròn ở **nửa dưới trung tâm**, 8–14 đệ tử minh họa ngồi thiền theo vành cung quanh vòng pháp trận (render thêm nếu máy đủ mạnh nhưng tránh chen tên).
- Tòa chính điện bên trái/phía sau sân; mở các bậc thang, lan can, đèn lồng, cây hoa, cổng dẫn vào; không chắn tiền cảnh sân.
- Đài độ kiếp là **đảo nổi nâng lên phía trên, lệch phải**: đủ lớn để dễ thấy người đang độ kiếp; có vòng năng lượng/cột sáng; vị trí đài **không quá xa sân**.
- Bắt buộc thiết kế **bounding volumes / anchor points**: `SECT_COURTYARD_CENTER`, `TRIBULATION_PLATFORM_CENTER`, `SECT_CAMERA_ANCHOR`; dùng cùng một nguồn tọa độ cho world/camera/presentation. Không giữ hardcode tọa độ rải rác gây lệch nhân vật.
- Đặt hậu cảnh 3D đủ đơn giản, vật thể không chắn camera. Pháp trận linh khí, sương mây, cây hoa và thác có animation nhẹ; không tạo object mới mỗi frame.

## Quy định vị trí và phần không gian
- Tông môn và đài độ kiếp cùng nằm trong một scene; đài không được quá nhỏ vì cách sân quá xa.
- Tọa độ neo sân/đài phải xuất từ một nguồn; `TRIBULATION` hiện nằm ở `public/js/breakthroughScene.js` với `{x:22,y:3.2,z:0}`, Codex được phép chuyển thành anchor chung nhưng phải bảo đảm các tham chiếu được cập nhật nhất quán.
- Ưu tiên sân chiếm nửa dưới; đài phía trên/phải; không có tòa nhà/lan can chắn người đang ngồi.
- Camera overview chỉ cần đặt khung phù hợp và ổn định ở bước này; quỹ đạo nhẹ được làm hoàn thiện ở 06.3.
- Hình khối đẹp hơn nhưng giới hạn draw calls/LOD, tái sử dụng geometry/material, tránh dựng từng viên gạch riêng biệt khi có thể instancing.
- Không thay đổi logic đổi pha sang battle, chỉ bảo đảm đối tượng cảnh tông môn được show/hide như cũ.

## Kiểm thử riêng
- [ ] 1080×1920 và 720×1280: sân + đài cùng xuất hiện, không bị crop.
- [ ] Với 10 và 60 người demo: thấy đại diện đang ngồi, tên không phủ lên nhau quá nhiều (chưa cần overhaul nameplate).
- [ ] Đài ở đúng tọa độ để về sau nhân vật ngồi trúng tâm; không có hai tọa độ hardcode mâu thuẫn.
- [ ] Trang `/song` vẫn mở, WebSocket vẫn cập nhật, còn hiệu ứng/đèn hiện tại, không leak WebGL rõ rệt.
- [ ] Không sửa `gameEngine.js` hoặc dữ liệu nhân vật.

## Cách Codex thực hiện riêng bước này
1. Kiểm tra `git status`, đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `00_TONG_QUAN.md` và tài liệu bước hiện tại. Bảo vệ mọi thay đổi chưa commit.
2. Chạy baseline `npm test` trước sửa; xác minh hành vi hiện tại bằng trình duyệt nếu có. Không báo là đã thử browser khi chưa chạy.
3. Kiểm tra code local mới nhất; tên file nêu trong tài liệu là vị trí tham khảo từ nhánh `main`, không phải danh sách bắt buộc phải sửa hết.
4. Thay đổi tối thiểu, theo module; không thêm mô phỏng, vòng render, kết nối WebSocket hay hệ thống lưu tiến trình mới.
5. Chạy lại `npm test` và kiểm thử chức năng/ảnh màn hình thuộc bước này. Không reset dữ liệu thật, không tự commit/push.
6. Cập nhật `PROGRESS.md`: file đổi, chức năng thực hiện, test PASS/FAIL/CHƯA KIỂM CHỨNG, thiếu sót, ảnh thực tế nếu chụp được. Dừng sau bước này.
