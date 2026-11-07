# Nhóm kiểm thử khi dùng Unity

| Lệnh trên PowerShell | Phạm vi |
|---|---|
| `npm.cmd test` | Backend/gameplay, TikTok, quà/tim, API/WebSocket, save/restore, DEMO/LIVE, trang quản trị, xử lý PNG dùng cho Unity |
| `npm.cmd run test:legacy` | Renderer Three.js `/song`, hiệu ứng/camera/nhân vật/boss procedural, overlay và preview 2.5D cũ |
| `npm.cmd run test:all` | Cả hai nhóm Node phía trên |
| `npm.cmd run test:ui` | Chrome headless kiểm tra trang quản trị, chạy riêng |
| `node scripts/gift-settings-browser-smoke.js` | Chrome headless kiểm tra cài đặt quà/tim, chạy riêng |

Unity C#/Editor/Play Mode, build Windows và OBS vẫn kiểm thử riêng. PASS từ npm không phải PASS giao diện Unity. Bài LIVE thật vẫn SKIP cho đến khi có phiên LIVE thực sự được kiểm tra.

## Vị trí test

- `test/*.test.js`: nhóm mặc định, sau âm thanh Unity hiện23 file/116 bài. Hai file logic tu vi kiểm tra tốc độ2/giây, tu vi từ tim/gom chuỗi, API/WS/lưu và burst qua adapter mô phỏng; `unity-audio-api.test.js` kiểm tra cấu hình âm thanh qua API/WS/lưu/restart/mode. Giữ audio/TTS nghe thử ở trang quản trị, network client của admin và công cụ đọc/đo PNG dùng bởi công cụ Unity.
- `test/legacy/*.test.js`: nhóm legacy, hiện9 file/21 bài. Đã chuyển nguyên5 file visual-model, character-upgrade, sect-layout, breakthrough-visual, battle-visual. Các phần renderer trong finishing, kiểm tra module/route `/song`, overlay quà và layout preview cũ cũng được tách vào đây.
- Các test backend trước đây lẫn kiểm tra route cũ trong foundation/battle-integration/live-integration vẫn ở nhóm mặc định; chỉ phần route `/song`/module hiển thị cũ chuyển sang legacy. Bài duyệt module/CSS trang quản trị giữ trong nhóm mặc định.
- `test/asset-tools.test.js`: hai bài đọc PNG/đo alpha giữ mặc định; kiểm tra layout của preview chuyển vào legacy.

`scripts/run-tests.js` liệt kê file test trực tiếp trong từng thư mục, không tìm đệ quy vào legacy khi chạy mặc định. File test mới ở đúng thư mục sẽ tự được nhận, không cần cập nhật danh sách tên. Runner dùng Node hiện có, không phụ thuộc cách shell xử lý wildcard và không cài thêm thư viện. Có thể truyền tùy chọn Node test runner, ví dụ `npm.cmd test -- --test-name-pattern=Ban`.

Tại thời điểm tách có116 bài, tăng3 so với113 bài cũ vì chia kiểm tra thông báo/settings, module admin/legacy và route legacy thành các bài độc lập; không bỏ các assertion cũ. Các tính năng sau đó bổ sung test vào đúng nhóm; số lượng và kết quả mới nhất ghi trong `PROGRESS.md`.

## Script browser legacy chạy thủ công

- `node scripts/sect-browser-smoke.js`: bố cục tông môn trên `/song`.
- `node scripts/characters-browser-smoke.js`: nhân vật Three.js trên `/song`.
- `node scripts/asset-preview-smoke.js`: preview 2.5D cũ.
- `node scripts/finishing-smoke.js`: smoke backend có kèm route/module hiển thị cũ.

Các script này giữ đường dẫn hiện tại và không tự chạy trong `npm test` hoặc `test:legacy`. `test:legacy` là bộ Node test; kiểm tra browser/GPU cần Chrome và chạy rõ ràng theo nhu cầu.

Không thay đổi runtime, scene/prefab Unity, dependency hoặc dữ liệu người chơi. `/song` vẫn được giữ cho đường chạy migration. Kết quả kiểm tra và đối chiếu bảo toàn lưu trong `test-suites/`; trạng thái mới nhất tại `PROGRESS.md`.
