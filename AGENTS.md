# QUY TẮC PHÁT TRIỂN TU TIEN LIVE

Bạn là AI lập trình viên chính của dự án TuTienLive.

## Nguồn yêu cầu

1. Đọc `GAME_DESIGN.md` để hiểu toàn bộ game.
2. Đọc các tài liệu trong `phases/` để nắm kế hoạch triển khai.
3. Đọc `PROGRESS.md` để xác định trạng thái hiện tại.
4. `GAME_DESIGN.md` là nguồn chuẩn về cơ chế, thông số và luật game.
5. Không tự ý bỏ hoặc thay đổi các chức năng bắt buộc.

## Nguyên tắc làm việc

- Chỉ triển khai giai đoạn mà người dùng yêu cầu.
- Không viết lại toàn bộ dự án nếu chỉ cần sửa một chức năng.
- Giữ khả năng tương thích với những phần đã hoàn thành.
- Không sử dụng asset hình ảnh, model, texture hay âm thanh tải ngoài.
- Mọi nhân vật và hiệu ứng 3D phải được tạo bằng code.
- Tạo mã nguồn thật, không chỉ giải thích hoặc viết pseudo-code.
- Không đánh dấu một chức năng hoàn thành nếu chưa kiểm thử.
- Nếu gặp lỗi, ưu tiên sửa lỗi trước khi phát triển tiếp.
- Không xóa dữ liệu người chơi trong quá trình sửa code.

## Quy trình mỗi giai đoạn

1. Đọc tài liệu liên quan.
2. Kiểm tra mã nguồn hiện có.
3. Lập danh sách công việc ngắn.
4. Triển khai các chức năng.
5. Chạy chương trình và kiểm thử.
6. Sửa các lỗi được phát hiện.
7. Cập nhật `PROGRESS.md` với trạng thái hoàn thành, kết quả kiểm thử, lỗi còn lại và bước tiếp theo.

## Điều kiện chuyển giai đoạn

Chỉ chuyển giai đoạn khi các chức năng bắt buộc của giai đoạn hiện tại đã chạy và vượt qua những bài kiểm thử tương ứng.

Không được tự tuyên bố hoàn thành khi chức năng chưa hoạt động.

Nếu không thể kiểm thử một tính năng trong môi trường hiện tại, phải ghi rõ là "Chưa kiểm chứng".

## Khi bắt đầu phiên làm việc mới

Luôn đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md` và tài liệu giai đoạn đang thực hiện trước khi chỉnh sửa code.

## Ngoại lệ có giới hạn — Unity 2.5D

- Theo yêu cầu chuyển renderer sang Unity, `unity-client/` ở gốc repository được dùng Unity/C# và các PNG **đã có sẵn** trong `public/assets/`. Đây là ngoại lệ cho công nghệ hiển thị và tài nguyên của Unity client; không xóa hoặc mở rộng chính sách procedural hiện hữu cho Three.js. Không tải asset/model/texture/font/audio ngoài hoặc Asset Store nếu chưa có yêu cầu riêng.
- `GAME_DESIGN.md` vẫn là nguồn chuẩn về gameplay. Yêu cầu Unity mới thay giới hạn công nghệ cũ chỉ trong client Unity; không chuyển game engine sang C#, không tính lại tu vi, HP/damage, phần thưởng, xác suất độ kiếp, cooldown, chu kỳ hay quy tắc/giá quà ở client.
- Backend Node.js, TikTok connector, API/WebSocket hiện hữu, schema lưu và tách DEMO/LIVE phải được giữ. Unity chỉ là client trình diễn; dữ liệu nhận từ server không được ghi ngược vào file dữ liệu game. Mọi thay đổi hợp đồng backend sau này cần phạm vi được yêu cầu và test riêng.
- Không xóa `public/song.html` hoặc renderer Three.js; giữ đường chạy hiện hữu trong suốt migration. Không ghi đè, di chuyển hay mở sửa tự động project người dùng tại `public/unity-client/My project/`.
- Chỉ thực hiện giai đoạn Unity được yêu cầu. Giai đoạn 01 chỉ khảo sát, khởi tạo project/cấu hình, phân thư mục và tài liệu; chưa triển khai network runtime, DTO gameplay, nhân vật, cảnh, FX hoặc HUD.
- Ưu tiên Unity LTS đã cài và tương thích; nếu chỉ có bản Update thì ghi chính xác phiên bản, lý do chọn và giới hạn. Không tự cài/đổi Editor hoặc nâng/hạ package của project cũ. Chỉ thêm Unity package cần cho giai đoạn hiện tại.
- Kiểm thử Editor, Play Mode, build Windows, capture OBS và LIVE thật là các kết quả riêng. Không nhận PASS nếu chỉ kiểm tra cấu trúc file hoặc batch import. Không tự commit/push/reset/xóa dữ liệu; luôn ghi PASS/FAIL/CHƯA KIỂM CHỨNG vào `PROGRESS.md`.
