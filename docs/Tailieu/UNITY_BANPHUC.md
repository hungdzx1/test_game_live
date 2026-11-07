# Bảng Ban Phúc — Unity Concept02

Yêu cầu gốc: [UI_BANPHUC.md](UI_BANPHUC.md). Bảng nằm ngay dưới Thiên Đạo Thông Cáo trong `Assets/Scenes/SectScene_Concept02.unity`, mặc định ẩn khi lưu scene.

## Bố cục và tài nguyên

`07_UI/UI_Canvas/BlessingPanel` có nền, viền, sen vàng, sao cyan, khung đồng hồ, đồng hồ cát, nền và fill thanh tiến độ. Tám PNG nguồn được sao chép nguyên byte từ `public/assets/02/UI/UI_BANPHUC/` vào `Assets/Art/SectConcept02/UI/Blessing/`, kèm audit/hash. `BanPhuc.png` chỉ dùng tham chiếu concept; không ghép chữ vào ảnh. `ui_blessing_ornaments.png` không có trong thư mục nguồn, nên hai hình thoi trang trí trên/dưới dựng bằng Image Unity, giữ viền PNG hiện có. Không tải/tạo PNG bên ngoài.

Ba chữ động là TextMeshPro: **BAN PHÚC**, **x2 tốc độ tu luyện**, **Còn lại: mm:ss**. Root340×200, center(890,630) trên khung1080×1920, cách mép dưới bảng thông cáo khoảng10px. Chỉnh Transform/root/ảnh/chữ ngoài Play rồi Ctrl+S. Không chạy factory để thay bố cục đã chỉnh.

Component `BlessingPanelHud` nằm trên **UI_Canvas** (luôn active), tham chiếu Panel/Timer/Effect/ProgressFill và network hiện hữu. Chỉ Panel con được bật/tắt. Đổi `ProgressWidth`/`ProgressUv` nếu thay kích thước hoặc UV fill. PNG giữ nguyên, bỏ padding bằng UV quanh alpha≥32+8px.

## Cơ chế

Node quản lý một Ban Phúc toàn tông môn x2. Mỗi lần dùng vật phẩm Ban Phúc cộng30 giây; ví dụ còn20 giây rồi nhận thêm thì thành50 giây, không thành x4. Bộ đếm `durationMs` của đợt tăng tương ứng để thanh thể hiện remaining/duration. Trà và linh căn vẫn cộng theo luật hiện hữu, nên x2 trên bảng là tác dụng riêng Ban Phúc.

Quà dùng đúng bảng **Cài đặt → Quà → Quà → vật phẩm** đang có: chọn vật phẩm Ban Phúc và số lượng cho Gift ID/tên/dải kim cương cần dùng. Không hardcode Gift ID TikTok. Combo chỉ chốt một lần ở tổng cuối; quà trước nhập môn hoặc khi battle giữ luồng chờ hiện hữu. Vật phẩm từ túi/nhiệm vụ vẫn dùng qua ItemService như trước.

Mỗi lần tông môn tăng cấp1→2 hoặc2→3 tự cộng30 giây. Nếu một lần tim vượt cả hai cấp thì cộng60 giây. Cấp3 đầy MAX không phải lên cấp, không tự nhận thêm. Không phát lại các cấp cũ khi nạp save. Phúc lợi điểm nhiệm vụ từ mốc tim/cooldown `wish` giữ nguyên.

Thời gian chỉ giảm khi đang tu luyện: battle, pause, stopped và server tắt đều không trừ buff. Người nhập môn trong lúc buff đang có cũng được hưởng. Khi thời gian server về0 thì bảng ẩn; mất kết nối hoặc snapshot cũ thiếu trường thì bảng ẩn. Unity không tự đếm, gia hạn hoặc cấp buff.

Save cũ nhiều Ban Phúc song song được gộp thành một x2 với tổng thời gian còn lại. Danh tính, vật phẩm và dữ liệu người chơi giữ nguyên, DEMO/LIVE tách biệt. SchemaVersion2 không đổi; backend mở rộng snapshot `interactions.blessing` và thêm durationMs tùy chọn trong globalBuffs; xem [UNITY_WEBSOCKET.md](UNITY_WEBSOCKET.md).

## Thử DEMO

1. Khởi động lại Node để nhận logic/snapshot mới; chọn **Dữ liệu mô phỏng**.
2. Mở `SectScene_Concept02`, Play và để game đang tu luyện.
3. Trong **Demo → Túi đồ & điểm nhiệm vụ**, chọn **Ban Phúc**, bấm **Cấp1 vật phẩm (demo)** rồi **Dùng vật phẩm**. Bảng hiện00:30; dùng tiếp khi chưa hết thì cộng30 giây.
4. Hoặc dùng quà DEMO đã ánh xạ Ban Phúc, hay gửi đủ tim để lên cấp tông môn còn có thể tăng. Không reset dữ liệu nếu tông môn đã cấp3/MAX; dùng cách vật phẩm/quà để thử tiếp.
5. Tạm dừng/diệt ma để kiểm tra đồng hồ giữ nguyên; về tu luyện cho hết thì bảng ẩn.

Entry point validation: `TuTienLive.Editor.BlessingPanelSetup.UpgradeValidation`, `BlessingPanelVerification.Capture`; chỉ upgrade bản sao `test-results/unity-concept02/project`. `node scripts/unity-blessing-assets.js` sao chép/audit ảnh có guard; `node scripts/unity-blessing-fixtures.js` ghi snapshot từ GameEngine thật trong bộ nhớ, không chạm save người chơi. Kết quả kiểm thử và giới hạn ghi tại `PROGRESS.md`, evidence `docs/unity-blessing/`.
