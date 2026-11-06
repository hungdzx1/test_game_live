# LỆNH GỬI CODEX CHO TỪNG BƯỚC (KHÔNG PHẢI CODE)

**Trước khi chạy:** tạo commit/checkpoint trên máy bằng Git, bảo đảm working tree an toàn. Đính kèm 2 ảnh tham chiếu ở cuộc trò chuyện Codex hoặc đặt ở đường dẫn local mà Codex đọc được. Không dùng ảnh concept làm texture/nền.

## Lệnh 06.1 — Tông môn + đài

```text
Hãy đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/06_NANG_CAP_LIVE/00_TONG_QUAN.md và phases/06_NANG_CAP_LIVE/01_TONG_MON.md.

Chỉ triển khai bước 06.1. Đọc mã nguồn hiện tại để xác minh cấu trúc và giao diện; dùng hai ảnh đính kèm làm tham khảo bố cục/phong cách, không được dán ảnh lên /song thay cho đồ họa 3D.

Trước khi sửa: kiểm tra git status và chạy npm test lấy baseline. Chỉ đổi file/module thực sự liên quan; không sửa logic tu luyện, độ kiếp, chiến đấu, quà, dữ liệu DEMO/LIVE, WebSocket hay API ngoài phần kết nối UI bắt buộc.

Sau khi sửa: chạy npm test, kiểm thử riêng theo file 01_TONG_MON.md, chạy/chụp ảnh /song 9:16 nếu có trình duyệt, so sánh lỗi trước/sau và sửa regressions. Cập nhật PROGRESS.md với file đổi, PASS/FAIL/CHƯA KIỂM CHỨNG, ảnh/chỉ số đo được. Không tự commit, push, reset dữ liệu hoặc chuyển sang bước 06.2.
```

## Lệnh 06.2 — Nhân vật/boss

```text
Hãy đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/06_NANG_CAP_LIVE/00_TONG_QUAN.md và phases/06_NANG_CAP_LIVE/02_NHAN_VAT_BOSS.md.

Chỉ triển khai bước 06.2. Đọc mã nguồn hiện tại để xác minh cấu trúc và giao diện; dùng hai ảnh đính kèm làm tham khảo bố cục/phong cách, không được dán ảnh lên /song thay cho đồ họa 3D.

Trước khi sửa: kiểm tra git status và chạy npm test lấy baseline. Chỉ đổi file/module thực sự liên quan; không sửa logic tu luyện, độ kiếp, chiến đấu, quà, dữ liệu DEMO/LIVE, WebSocket hay API ngoài phần kết nối UI bắt buộc.

Sau khi sửa: chạy npm test, kiểm thử riêng theo file 02_NHAN_VAT_BOSS.md, chạy/chụp ảnh /song 9:16 nếu có trình duyệt, so sánh lỗi trước/sau và sửa regressions. Cập nhật PROGRESS.md với file đổi, PASS/FAIL/CHƯA KIỂM CHỨNG, ảnh/chỉ số đo được. Không tự commit, push, reset dữ liệu hoặc chuyển sang bước 06.3.
```

## Lệnh 06.3 — Camera và độ kiếp

```text
Hãy đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/06_NANG_CAP_LIVE/00_TONG_QUAN.md và phases/06_NANG_CAP_LIVE/03_CAMERA_DO_KIEP.md.

Chỉ triển khai bước 06.3. Đọc mã nguồn hiện tại để xác minh cấu trúc và giao diện; dùng hai ảnh đính kèm làm tham khảo bố cục/phong cách, không được dán ảnh lên /song thay cho đồ họa 3D.

Trước khi sửa: kiểm tra git status và chạy npm test lấy baseline. Chỉ đổi file/module thực sự liên quan; không sửa logic tu luyện, độ kiếp, chiến đấu, quà, dữ liệu DEMO/LIVE, WebSocket hay API ngoài phần kết nối UI bắt buộc.

Sau khi sửa: chạy npm test, kiểm thử riêng theo file 03_CAMERA_DO_KIEP.md, chạy/chụp ảnh /song 9:16 nếu có trình duyệt, so sánh lỗi trước/sau và sửa regressions. Cập nhật PROGRESS.md với file đổi, PASS/FAIL/CHƯA KIỂM CHỨNG, ảnh/chỉ số đo được. Không tự commit, push, reset dữ liệu hoặc chuyển sang bước 06.4.
```

## Lệnh 06.4 — Chiến trường

```text
Hãy đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/06_NANG_CAP_LIVE/00_TONG_QUAN.md và phases/06_NANG_CAP_LIVE/04_CHIEN_TRUONG.md.

Chỉ triển khai bước 06.4. Đọc mã nguồn hiện tại để xác minh cấu trúc và giao diện; dùng hai ảnh đính kèm làm tham khảo bố cục/phong cách, không được dán ảnh lên /song thay cho đồ họa 3D.

Trước khi sửa: kiểm tra git status và chạy npm test lấy baseline. Chỉ đổi file/module thực sự liên quan; không sửa logic tu luyện, độ kiếp, chiến đấu, quà, dữ liệu DEMO/LIVE, WebSocket hay API ngoài phần kết nối UI bắt buộc.

Sau khi sửa: chạy npm test, kiểm thử riêng theo file 04_CHIEN_TRUONG.md, chạy/chụp ảnh /song 9:16 nếu có trình duyệt, so sánh lỗi trước/sau và sửa regressions. Cập nhật PROGRESS.md với file đổi, PASS/FAIL/CHƯA KIỂM CHỨNG, ảnh/chỉ số đo được. Không tự commit, push, reset dữ liệu hoặc chuyển sang bước 06.5.
```

## Lệnh 06.5 — HUD và hồ sơ

```text
Hãy đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/06_NANG_CAP_LIVE/00_TONG_QUAN.md và phases/06_NANG_CAP_LIVE/05_HUD_THONG_CAO.md.

Chỉ triển khai bước 06.5. Đọc mã nguồn hiện tại để xác minh cấu trúc và giao diện; dùng hai ảnh đính kèm làm tham khảo bố cục/phong cách, không được dán ảnh lên /song thay cho đồ họa 3D.

Trước khi sửa: kiểm tra git status và chạy npm test lấy baseline. Chỉ đổi file/module thực sự liên quan; không sửa logic tu luyện, độ kiếp, chiến đấu, quà, dữ liệu DEMO/LIVE, WebSocket hay API ngoài phần kết nối UI bắt buộc.

Sau khi sửa: chạy npm test, kiểm thử riêng theo file 05_HUD_THONG_CAO.md, chạy/chụp ảnh /song 9:16 nếu có trình duyệt, so sánh lỗi trước/sau và sửa regressions. Cập nhật PROGRESS.md với file đổi, PASS/FAIL/CHƯA KIỂM CHỨNG, ảnh/chỉ số đo được. Không tự commit, push, reset dữ liệu hoặc chuyển sang bước 06.6.
```

