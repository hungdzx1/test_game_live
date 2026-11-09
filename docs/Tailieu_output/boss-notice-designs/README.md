# Khung.md mục 2 — thiết kế cảnh báo boss

Thiết kế ngày 08/11/2026. **Cập nhật09/11: người dùng đã chọn TB02 / warning-TB02; đã triển khai, kiểm thử và ghép Unity/Node.** Bốn WAV được chuyển nguyên byte vào `unity-client/Assets/Musics/SFX/Boss/`; bản HTML/ảnh giữ để đối chiếu. Node133 PASS/1 SKIP, Unity74/74 PASS, ảnh GPU/audit PASS. Trạng thái cuối và cách mở game: [báo cáo triển khai](implemented/README.md). Các phần kiểm tra thiết kế bên dưới ghi kết quả lượt08/11.

Mở [trang tổng hợp](index.html) để xem ảnh và nghe sáu SFX. Mỗi bản HTML có nút phát lại cảnh báo 3 giây, chọn một trong ba boss, bật/tắt âm thanh và thử đòn đánh. Thanh điều khiển nằm bên phải khung game dọc; nên mở trên cửa sổ desktop rộng hoặc giảm mức zoom trình duyệt.

| ID | Thiết kế | Ảnh | Bản động | SFX cảnh báo |
|---|---|---|---|---|
| TB01 — Thiên Ấn | Khung xanh trầm, viền vàng hai lớp, đồng hồ tròn | [Toàn cảnh](TB01.png), [phóng to](TB01-detail.png), [720p](TB01-720.png) | [TB01.html](TB01.html) | [warning-TB01.wav](audio/warning-TB01.wav) |
| TB02 — Huyết Báo — đã chọn | Ấn cảnh báo đỏ, bố cục dọc, số đếm lớn | [Toàn cảnh](TB02.png), [phóng to](TB02-detail.png), [720p](TB02-720.png) | [TB02.html](TB02.html) | [warning-TB02.wav](../../../unity-client/Assets/Musics/SFX/Boss/warning-TB02.wav) |
| TB03 — Chiến Thư | Cuộn thư nền ngà, chữ nâu, bố cục ngang gọn | [Toàn cảnh](TB03.png), [phóng to](TB03-detail.png), [720p](TB03-720.png) | [TB03.html](TB03.html) | [warning-TB03.wav](audio/warning-TB03.wav) |

Trong bản xem trước, từ 0 đến trước 3 giây: hiện cảnh báo, đếm 3 → 2 → 1, phát SFX nếu bật và rung nhẹ nền. Đúng giây thứ 3: tắt cảnh báo/rung, hiện boss. [Ảnh sau 3 giây](after-3s.png). Ba ảnh thiết kế dùng cùng boss đầu để so sánh; bộ chọn hỗ trợ tên và sprite của cả ba boss. Boss lặp sáu frame trong một giây.

Đây là mô phỏng bằng HTML/CSS/SVG trên ảnh chụp game hiện tại. Rung nền, thanh HP, đồng hồ và thời điểm boss hiện trong HTML là bản minh họa; chưa phải camera hoặc gameplay Unity. ID trong ảnh dùng để chọn mẫu.

## Âm thanh tự tạo

Toàn bộ âm thanh được tổng hợp bằng oscillator/noise trong `scripts/boss-notice-designs.js`, không tải hoặc thu âm từ ngoài. WAV PCM mono 16 bit, 44.100 Hz, có fade đầu/cuối và peak 0,68 để chừa headroom; mức âm lượng mặc định trong bản xem trước là 35%.

| File | Thời lượng | Ý tưởng |
|---|---|---|
| warning-TB01.wav | 3 giây | Chuông kim loại, trống trầm và gió dâng |
| warning-TB02.wav | 3 giây | Tín hiệu cao dần, nhịp cảnh báo và tiếng trầm |
| warning-TB03.wav | 3 giây | Chuông nhẹ, gió và trống |
| [attack-normal.wav](../../../unity-client/Assets/Musics/SFX/Boss/attack-normal.wav) | 0,2 giây | Đòn đánh thường |
| [attack-skill1.wav](../../../unity-client/Assets/Musics/SFX/Boss/attack-skill1.wav) | 0,3 giây | Kiếm khí trảm |
| [attack-skill2.wav](../../../unity-client/Assets/Musics/SFX/Boss/attack-skill2.wav) | 0,6 giây | Thiên long quyết |

**Nghe thực tế trên loa/tai nghe và cân âm với game: CHƯA KIỂM CHỨNG.** Các nút thử attack dừng cảnh báo trước khi phát đòn đánh, tránh bản xem trước bị đồng hồ cảnh báo ghi đè.

## Kết quả kiểm tra

- **PASS:** ba mẫu render Chrome headless ở 1080×1920, 720×1280 và ảnh phóng to; đã xem ảnh cuối để kiểm tra bố cục. Tiêu đề/tên cả ba boss không tràn, số đếm không chồng ghi chú. Lỗi chồng chữ TB02 ở bản đầu đã sửa và kiểm tra lại.
- **PASS:** các mốc 0/1/2/2,999 giây vẫn ẩn boss; mốc 3 giây tắt cảnh báo và hiện boss; phát lại đặt số đếm về 3. Có kiểm tra luồng phát lại theo đồng hồ thực qua 3,15 giây, cùng nút thử attack.
- **PASS:** trình duyệt giải mã đủ sáu WAV, đúng thời lượng. Kiểm tra PCM xác nhận đầu/cuối bằng 0, peak không vượt 0,6801.
- **PASS:** SHA256 các ảnh nguồn và 35 file game được bảo vệ không đổi, gồm scene, boss presenter, audio manager, camera, backend và cấu hình. Không chạy game engine hoặc sửa dữ liệu người chơi. Không sửa project Unity riêng.
- **CHƯA TRIỂN KHAI / CHƯA KIỂM CHỨNG:** cảnh báo trong Unity, build Windows, OBS và LIVE. Không chạy lại Unity hoặc Node core suite vì lượt này chỉ tạo bản thiết kế độc lập.

Báo cáo máy: [design-report.json](design-report.json). Mã tạo ảnh/HTML/WAV và kiểm tra: `scripts/boss-notice-designs.js`.

## Bước tiếp theo

**Đã chọn TB02 / warning-TB02 ngày09/11.** Theo dõi triển khai/kiểm chứng tại [implemented/README.md](implemented/README.md). Node giữ giai đoạn cảnh báo3 giây để boss không nhận sát thương hoặc mất thời gian đánh trước khi xuất hiện; client chỉ trình diễn trạng thái server.
