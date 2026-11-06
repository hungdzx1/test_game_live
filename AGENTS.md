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