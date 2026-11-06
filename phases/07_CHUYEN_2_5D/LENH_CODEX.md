# Lệnh Codex cho từng bước

Trước mọi bước, đặt thư mục này tại `phases/07_CHUYEN_2_5D/` trong repo và mở workspace repository trong Codex.

## 07.0
Đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/07_CHUYEN_2_5D/00_KE_HOACH_VA_QUY_TAC.md và 07_0_AUDIT_PREVIEW.md. Chỉ audit ảnh PNG và làm trang preview độc lập, tuyệt đối chưa sửa /song. Kiểm tra git status, chạy npm test baseline, ghép và căn layer, xuất ASSET_AUDIT.md và screenshot 9:16. Dừng lại, không tự sang 07.1, không commit/push.

## 07.1
Đọc tài liệu chung, ASSET_AUDIT.md và 07_1_TONG_MON.md. Chỉ tích hợp cảnh tông môn 2.5D bằng Three.js, bảo lưu scene 3D fallback và battle 3D. Dùng layout JSON từ preview, không sửa gameplay/WebSocket. Chạy npm test + browser smoke, xuất ảnh 9:16, cập nhật PROGRESS.md. Dừng lại.

## 07.2
Đọc tài liệu chung và 07_2_NHAN_VAT.md. Chỉ tích hợp Character_1 sprite/biến thể màu hào quang ổn định, giữ userId/seed/game state và fallback 3D. Không thay animation/cơ chế phía server. Kiểm thử 10/30/60 người và chuyển pha, chụp ảnh, cập nhật PROGRESS.md. Dừng lại.

## 07.3
Đọc tài liệu chung và 07_3_CAMERA_DO_KIEP.md. Chỉ làm camera pan/zoom 2.5D và chuỗi animation bay lên/ngồi độ kiếp/trở về đúng người, giữ sân và đài trong khung. Không sửa thuật toán độ kiếp. Test success/fail/pause/nhiều người/battle, ảnh/video, cập nhật PROGRESS.md. Dừng lại.

## 07.4
Đọc tài liệu chung và 07_4_HUD.md. Chỉ thay HUD sang các khung PNG + text động, thông cáo nhỏ ở góc, profile mặc định ẩn và demo trigger độc lập. Chưa gán quà thật. Test hiển thị/luồng sự kiện, npm test và browser smoke; chụp ảnh 9:16, cập nhật PROGRESS.md. Dừng lại.

## 07.5 (hoãn)
Đọc 07_5_BATTLE_HOAN.md và chỉ lập danh sách asset còn thiếu. Không sửa battle renderer cho đến khi người dùng cung cấp asset và chấp thuận chuyển đổi.
