# Giai đoạn 07 — Chuyển lớp hiển thị tông môn sang 2.5D

## Quyết định đã chốt
- **Giữ Three.js** làm renderer (WebGL). Dựng các lớp ảnh bằng `THREE.Sprite` hoặc mặt phẳng `PlaneGeometry` có `MeshBasicMaterial`/shader alpha; không chuyển cả game sang Canvas/PixiJS.
- **Codex tự kiểm tra và căn chỉnh asset theo ảnh concept**. Các offset, tỷ lệ, crop, độ sâu phải nằm trong file cấu hình và có preview điều chỉnh, không hardcode rải rác.
- **Tạm thời 1 bộ `Character_1`** với 7 sprite; có thể tạo biến thể bảng màu/hào quang để phân biệt người chơi. Giữ userId/seed ổn định. Không hứa tạo biến thể tóc hoặc giới tính khi chưa có sprite mới.
- **Ưu tiên tông môn, độ kiếp, HUD**. Chiến trường 3D hiện hữu tiếp tục hoạt động; chuyển boss/ma sang sprite khi có tài nguyên.
- Thiết kế mặc định **9:16**, không làm mất tùy chọn hiển thị hiện hữu.

## Cơ sở mã nguồn đã đọc (commit 2e7825a, main, 06/11/2026)
- `public/js/main.js`: điểm phối hợp scene, CharacterManager, CameraDirector, Effects, Overlay, BattleScene, LiveOverlay và WebSocket.
- `public/js/scene.js`: tông môn 3D hiện tại; `public/js/sectLayout.js`: tọa độ trụ camera, vị trí đài và chỗ ngồi.
- `public/js/characters.js`, `public/js/proceduralCostumes.js`: nhân vật 3D procedural; `public/js/presentationState.js`: dữ liệu nhân vật hiển thị, không được ghi ngược dữ liệu trình diễn vào game state.
- `public/js/breakthroughScene.js`, `public/js/camera.js`, `public/js/battleScene.js`: độ kiếp, camera, chiến trường.
- `public/js/overlay.js`, `public/js/liveOverlay.js`, `public/css/style.css`, `public/song.html`: HUD nguồn phát.
- Ảnh trong `public/assets/Background layers/` (4), `Architecture layers/` (6), `FX layers/` (5), `Characters/Character_1/` (7), `UI/` (4).

## Nguyên tắc bất biến
1. Chỉ sửa **presentation layer** và các điểm tích hợp tối thiểu. Không thay đổi tu luyện, cảnh giới, độ kiếp, chiến đấu, chiến trường, quà, TikTok connector, WebSocket protocol, lưu trữ demo/LIVE.
2. Không xóa renderer 3D cũ; chọn bằng `rendererMode` hoặc cờ cấu hình riêng. Trong pha battle dùng renderer battle cũ. Không reset game khi đổi renderer/trang quản trị.
3. Nếu chưa chắc alpha/góc nhìn/kích thước/canvas, audit và ghi rõ; tuyệt đối không khẳng định asset đạt chuẩn nếu chưa kiểm tra.
4. Tránh nhân bản nhiều ảnh 1024px thành texture 2K per-player: tải texture **một lần**, dùng lại; giải phóng resource khi không còn dùng. Giới hạn texture memory, FPS và draw calls; có giảm chất lượng.
5. Không để alpha bị viền đen, depth-sorting chớp, layer che mặt nhân vật; ảnh chưa đúng phối cảnh thì ưu tiên sửa trong preview/config trước.
6. Camera 2.5D chỉ pan/zoom rất nhẹ trong vùng an toàn; sân + đài luôn trong khung ở trạng thái tổng quan; không xoay phối cảnh tranh 2D như mô hình 3D thật.
7. HUD dữ liệu động dùng HTML/CSS. `ui_*.png` chỉ là khung/nền, không đóng cứng chữ, tên, con số.
8. Thẻ hồ sơ dưới màn **mặc định ẩn**; không hiển thị chỉ vì camera focus. Chỉ kích hoạt khi sự kiện 'xem hồ sơ' được cấu hình; **chưa gán quà thật**, có nút thử trong demo.
9. Không tự commit/push/reset Git, không xóa dữ liệu người chơi.

## Thứ tự & chốt nghiệm thu
- 07.0: Audit toàn bộ PNG, preview ghép layer; **không sửa `/song`**.
- 07.1: Tích hợp cảnh tông môn nhiều lớp, shader/FX nhẹ; fallback 3D.
- 07.2: Sprite Character_1 và biến thể màu/hào quang, binding userId; fallback 3D.
- 07.3: Camera pan/zoom và animation ngồi → đứng → bay → ngồi đài → trở về; giữ sân/đài trong khung.
- 07.4: HUD/Thông cáo/thẻ hồ sơ theo điều kiện, dữ liệu động.
- 07.5: **Hoãn** chuyển battle/boss 2D. Bản battle hiện có vẫn chạy; chuẩn bị danh mục asset thiếu, chưa triển khai chính thức.

## Kiểm thử chung cho từng bước
- Kiểm tra `git status` trước khi sửa, giữ thay đổi chưa commit của người dùng; đo baseline `npm test`.
- Sau sửa: `npm test`, những browser smoke liên quan đã có, kiểm tra thực tế `/song` 720×1280/1080×1920; chụp màn hình và xem lỗi console.
- Luồng hồi quy: nhập môn, 10/30/60 người, tu vi, độ kiếp thành công/thất bại, camera focus, chuyển pha tu luyện ↔ battle ↔ tu luyện, quà/demo, mất kết nối nguồn phát, reload không mất dữ liệu.
- Báo cáo theo `PASS / FAIL / CHƯA KIỂM CHỨNG` kèm lệnh đã chạy, ảnh thực tế, file sửa, FPS và giới hạn. Không tự tuyên bố thành công khi chưa chạy.
- Cập nhật `PROGRESS.md` sau từng bước, dừng không sang bước kế nếu chưa được người dùng yêu cầu.
