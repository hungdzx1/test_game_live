# Thông báo nhận Ban Phúc — mục 6 Qua_Tbao.md

Mở `unity-client/Assets/Scenes/SectScene_Concept02.unity`, chạy Node và Play. Khi server phát `blessing:activated`, ảnh có sẵn `Assets/Art/Items/tbao_ban_phuc.png` bật ở giữa phía trên màn hình, hiện **Ban Phúc ×N**, rung camera nhẹ trong khoảng 0,28 giây và tự ẩn sau tổng cộng 2 giây. Thời lượng được tăng từ 1 lên 2 giây theo yêu cầu tiếp theo ngày08/11/2026; lượt thay đổi này không chạy test, người dùng tự kiểm thử. Ảnh/báo cáo PASS có sẵn trong thư mục là bằng chứng của bản 1 giây trước đó, không phải kết quả kiểm thử bản 2 giây.

Hiệu ứng phóng từ nhỏ lên hơi quá cỡ rồi ổn định, giữ ngắn và mờ nhanh ở cuối. Số lượng là `count` trong lần kích hoạt, không lấy thời gian còn lại chia 30 và không nhân theo số đệ tử. Các lượt đến trong cùng một hoạt cảnh cộng số lượng, giữ hạn kết thúc của lượt đầu để không che gameplay kéo dài. Event trùng không hiện lại.

SFX nhận chúc phúc dùng đúng `Sfx_banphuc` đã gán tại `08_Systems/GameAudioManager`; không tạo nguồn phát âm thanh thứ hai. Các cài đặt âm lượng/mute/hiệu ứng và giới hạn giọng hiện hữu vẫn áp dụng. Nhiều event quá sát vẫn được gộp âm thanh theo giới hạn 150ms cũ. Có thể thay clip Ban Phúc trong Inspector của GameAudioManager.

Trong Hierarchy:

- `08_Systems/BlessingReceiptPresenter`: nguồn network/camera, thời lượng mặc định 2 giây và tùy chọn rung.
- `07_UI/UI_Canvas/BlessingReceiptFX`: vị trí, kích thước ảnh, kiểu chữ/số lượng. Mặc định ẩn, không chặn chuột.
- Menu **Tu Tien LIVE → Concept 02 → Add blessing receipt effect** thêm hiệu ứng nếu scene trong bộ nhớ chưa có. Chạy lại giữ đối tượng/cấu hình đã có.

Popup dùng thời gian thực nên vẫn tự tắt khi game pause/stopped/battle; không dừng hoặc giảm thời gian buff. Chất lượng Low bỏ rung, vẫn giữ ảnh và số lượng. Rung là độ lệch ngắn có giới hạn, phối hợp được với camera nhận Trà/Đan/Linh căn; kết thúc/mất kết nối/đổi phiên/tắt component đều trả camera và ẩn ảnh. Snapshot có buff đang hoạt động hoặc reconnect không phát lại popup/SFX cũ.

Để thử: vào DEMO, cấp **Ban Phúc** cho một nhân vật rồi **dùng vật phẩm**. Chỉ cấp vào túi chưa kích hoạt phúc thì chưa hiện popup. Cũng có thể thả tim đạt mốc tông môn có thưởng Ban Phúc, hoặc gửi quà DEMO đã ánh xạ Ban Phúc. Mọi loại phần thưởng, thời gian x2 và hàng chờ vẫn do Node xử lý như trước.

Chỉ tích hợp vào Concept02. Giữ Main, 25 ghế, bốn prefab, ảnh PNG nguồn, dữ liệu người chơi và cấu hình backend. Không tải asset ngoài hoặc thay package/Editor. Kết quả kiểm thử, ảnh chụp và giới hạn xem `PROGRESS.md`, `tests.xml`, `capture-report.json`, `preservation-report.json` trong thư mục này.
