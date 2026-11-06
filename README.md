# Tu Tiên LIVE — Vạn Giới Tranh Phong

Phiên bản **0.5.0**, triển khai đến Giai đoạn 5. Game chạy trên Windows: tông môn 3D, 11 cảnh giới, độ kiếp, năm vật phẩm, nhiệm vụ, vòng tu luyện 600s / diệt ma 300s, 11 chiến trường, ba boss, kỹ năng bình luận `1`/`2`. Có demo, adapter TikTok, bảng quà/combo, camera tự động, âm thanh procedural và dashboard streamer. Hình ảnh/hiệu ứng/âm thanh sinh bằng code; Three.js phục vụ local.

Cài **Node.js LTS ≥22**, nháy đúp **chay.bat**. Script kiểm tra Node/npm, cài dependency thiếu và mở trang khi server lắng nghe. Lần cài đầu cần Internet. Hoặc dùng `npm.cmd ci`, rồi `npm.cmd start` trong PowerShell.

- Điều khiển: http://localhost:3000
- Browser Source: http://localhost:3000/song — 1080 × 1920 hoặc 720 × 1280.
- Bấm **Thử không cần LIVE**; xem [hướng dẫn sử dụng](HUONGDAN.md).
- Cấu hình: `caidat.json`. Dữ liệu demo/LIVE riêng: `data/demo/players.json` / `data/players.json`. Không tự reset khi restart. Sao lưu/khôi phục từ admin; bản trước reset/khôi phục ở `data/backups/`.

Mã server ở gốc: `gameEngine.js` và các service tu luyện/chiến đấu; `tiktokAdapter.js`/`gameEventBus.js` xử lý tương tác; `storage.js`/`adminData.js` lưu/phục hồi. `public/js/` chứa thế giới 3D, camera, audio/TTS, HUD và admin. `test/` kiểm thử logic, HTTP/WS, model; `scripts/` có smoke test dữ liệu tạm. Luật chuẩn: [GAME_DESIGN.md](GAME_DESIGN.md), kế hoạch: `phases/`.

Kiểm thử: `npm.cmd test`. `node scripts/finishing-smoke.js` chạy 500 người/hai chu kỳ rút gọn/restart và lưu số đo RAM/CPU. `node scripts/live-smoke.js` thử combo/battle/reconnect demo 5s. `node scripts/preview.js` mở bản thử riêng ở port 3001. Các script dùng thư mục tạm, không dùng dữ liệu người chơi của bạn.

Kết quả: [PROGRESS.md](PROGRESS.md), báo cáo `test-results/phase5-*`. TikTok dùng connector không chính thức 2.5.0, phụ thuộc TikTok/dịch vụ ký. LIVE thật, giao diện WebGL/OBS, FPS/GPU và âm thanh nghe trực tiếp **Chưa kiểm chứng** trong phiên này. Âm thanh cần thao tác trực tiếp tại từng nguồn; TTS chỉ dùng giọng Việt cục bộ nếu máy có, thiếu giọng dùng chữ. Chưa tuyên bố nghiệm thu đầy đủ phần cần kiểm tra thực tế.
