# Tu Tiên LIVE — Vạn Giới Tranh Phong

Phiên bản **0.5.0**, triển khai đến Giai đoạn 5. Game chạy trên Windows: tông môn 3D, 11 cảnh giới, độ kiếp, năm vật phẩm, nhiệm vụ, vòng tu luyện 600s / diệt ma 300s, 11 chiến trường, ba boss, kỹ năng bình luận `1`/`2`. Có demo, adapter TikTok, bảng quà/combo, camera tự động, âm thanh procedural và dashboard streamer. Hình ảnh/hiệu ứng/âm thanh sinh bằng code; Three.js phục vụ local.

Cài **Node.js LTS ≥22**, nháy đúp **chay.bat**. Script kiểm tra Node/npm, cài dependency thiếu và mở trang khi server lắng nghe. Lần cài đầu cần Internet. Hoặc dùng `npm.cmd ci`, rồi `npm.cmd start` trong PowerShell.

- Điều khiển: http://localhost:3000 — dashboard 5 trang: Trang chủ, Cài đặt, Demo, Nhật ký, Sao lưu; có giao diện sáng/tối và menu mobile.
- Browser Source: http://localhost:3000/song — 1080 × 1920 hoặc 720 × 1280.
- Bấm **Thử không cần LIVE**; xem [hướng dẫn sử dụng](HUONGDAN.md).
- Cấu hình: `caidat.json`. Dữ liệu demo/LIVE riêng: `data/demo/players.json` / `data/players.json`. Không tự reset khi restart. Sao lưu/khôi phục từ admin; bản trước reset/khôi phục ở `data/backups/`.

Cài đặt → TikTok & quà: chọn bằng ảnh **Hoa hồng1 xu / Cỏ bốn lá10 xu / Má hồng nhỏ xinh20 xu**, hoặc nhập ID/tên/dải đơn giá thủ công; không còn tải danh mục quà online. Trang chủ → Kết nối → **Nhật ký bình luận & follow** để xem nhận lệnh và lỗi. Xem [hướng dẫn phần4](docs/Tailieu_output/QUA_TBAO_PHAN4.md); `node scripts/gift-settings-browser-smoke.js` kiểm thử luồng mới trên dữ liệu tạm.

Mã server ở gốc: `gameEngine.js` và các service tu luyện/chiến đấu; `tiktokAdapter.js`/`gameEventBus.js` xử lý tương tác; `storage.js`/`adminData.js` lưu/phục hồi. `public/js/` chứa thế giới 3D, camera, audio/TTS, HUD và admin. `test/` kiểm thử logic, HTTP/WS, model; `scripts/` có smoke test dữ liệu tạm. Luật chuẩn: [GAME_DESIGN.md](GAME_DESIGN.md), kế hoạch: `phases/`.

Kiểm thử mặc định: `npm.cmd test` chạy backend/gameplay, TikTok, API/WebSocket, lưu dữ liệu, trang quản trị và công cụ PNG dùng cho Unity. `npm.cmd run test:legacy` chạy riêng test Three.js `/song` và preview 2.5D cũ; `npm.cmd run test:all` chạy cả hai nhóm Node. Các test Unity C#/Editor/Play Mode chạy riêng trong Unity, không nằm trong các lệnh npm này. Xem [phân nhóm kiểm thử](docs/Tailieu_output/TEST_SUITES.md).

`node scripts/finishing-smoke.js` chạy 500 người/hai chu kỳ rút gọn/restart và lưu số đo RAM/CPU; script này còn kiểm tra route cũ nên chạy thủ công khi cần hồi quy legacy. `node scripts/live-smoke.js` thử combo/battle/reconnect demo 5s. `node scripts/preview.js` mở bản thử riêng ở port 3001. Các script dùng thư mục tạm, không dùng dữ liệu người chơi của bạn.

Kết quả: [PROGRESS.md](PROGRESS.md), báo cáo `test-results/phase5-*`. TikTok dùng connector không chính thức 2.5.0, phụ thuộc TikTok/dịch vụ ký. LIVE thật, giao diện WebGL/OBS, FPS/GPU và âm thanh nghe trực tiếp **Chưa kiểm chứng** trong phiên này. Âm thanh cần thao tác trực tiếp tại từng nguồn; TTS chỉ dùng giọng Việt cục bộ nếu máy có, thiếu giọng dùng chữ. Chưa tuyên bố nghiệm thu đầy đủ phần cần kiểm tra thực tế.

Giao diện quản trị được tổ chức theo [phases/UI.md](phases/UI.md); ánh xạ toàn bộ chức năng ở [docs/UI_MAPPING.md](docs/UI_MAPPING.md). Điều hướng dùng hash, các trang dựng một lần; không tạo lại WebSocket/TikTok khi đổi trang. Theme và trạng thái thu gọn sidebar lưu riêng trong localStorage, không đổi `/song`.

Kiểm thử giao diện thực: `npm.cmd run test:ui` với Chrome đã cài trên Windows (hoặc đặt `CHROME_PATH` tới Chrome). Script mở Chrome **headless với profile mới**, dữ liệu game ở thư mục tạm, kiểm tra điều hướng/theme/form/demo/backup và responsive; không điều khiển tab hay dữ liệu trình duyệt của bạn. Không cần thêm dependency hoặc tải browser. Driver dùng [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). Ảnh và báo cáo được tạo tại `test-results/ui/`; LIVE thật và tiếng nghe qua OBS vẫn cần kiểm tra riêng.
