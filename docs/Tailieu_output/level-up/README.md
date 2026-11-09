# Hiệu ứng LV UP cho nhân vật

Kiểm chứng bản cuối: **Unity42/42 PASS**, gồm8 bài LV UP (Editor/Play/HTTP/WebSocket) và34 bài hồi quy; ảnh GPU1080/720/Low và bảo toàn903 file **PASS**. Xem `unity-tests.xml`, `capture-report.json`, `asset-audit.json`, `preservation-report.json`, `final-verification.json`. Build Windows mới, OBS và LIVE thật **Chưa kiểm chứng**.

Mở lại `unity-client/Assets/Scenes/SectScene_Concept02.unity` và Play. Tu sĩ vừa tăng tiểu cảnh giới hoặc độ kiếp thành công được ghép hiệu ứng vàng quanh người trong2 giây: chữ LV UP/cánh phía trên bảng tên, pháp trận và hoa sen dưới chân, hào quang phía sau, dải sáng/ngôi sao/mũi tên quanh thân. Chữ căn theo mép bảng tên thật để không bị bảng tên che; giữ nguyên bảng tên. Hiệu ứng bám theo vị trí thực của nhân vật khi đang bay/lên đài/trở về. Không thêm zoom hoặc âm thanh mới; SFX độ kiếp có sẵn vẫn dùng hệ thống hiện hữu.

Tài nguyên người dùng trong `Assets/Art/Characters/LVUP/` có7 PNG theo ánh xạ `docs/Tailieu/LV_UP.md`. Thiếu `levelup_light_beams.png` nên bỏ qua lớp tia thẳng theo yêu cầu. `concept.jpg` chỉ tham chiếu, không hiển thị hoặc ghép vào game. Không thay byte PNG, tải tài nguyên hoặc tạo ảnh mới. Các vùng alpha trong `visibleRegions` dùng để căn lớp có nhiều khoảng trong suốt, không sửa ảnh nguồn hoặc cắt mất artwork.

`08_Systems/LevelUpPresenter` có các trường kéo thả Network, Characters, Layers (0 title,1 circle,2 aura,3 ribbons,4 beams trống,5 sparkles,6 arrows,7 lotus), Visible Regions, Duration, Simultaneous Limit và Queue Limit. Mặc định2 giây,8 hiệu ứng đồng thời,32 người đang chờ; tối đa64 người chờ nếu tăng Inspector. Menu **Tu Tien LIVE → Concept 02 → Add character level up effect** thêm vào scene đang mở nếu chưa có; không tạo trùng hoặc ghi đè cấu hình đã chỉnh.

Pool tối đa8 bộ ×8 renderer, texture/sprite dùng chung. Low hiện tối đa2 người cùng lúc, giữ title/circle/aura/lotus. Các lần lên nhiều tầng liên tiếp của một người gộp thành một hiệu ứng, không kéo dài vòng đang chạy. Event trùng bị bỏ qua; người chưa có view có thể chờ tối đa8 giây theo đồng hồ trình diễn; hàng chờ đầy bỏ lượt visual cũ nhất. Các giới hạn này chỉ giảm hiệu ứng hình ảnh, không ảnh hưởng lên cấp/thưởng. Tu sĩ ngoài số chỗ hiển thị dùng cơ chế ưu tiên roster hiện hữu khi có event.

Chỉ nhận `stage:up` (stageIndex1–3) và `breakthrough:completed` có outcome=true (realmIndex1–10) từ protocol đồng bộ. Snapshot mới/reconnect không tự phát lại hiệu ứng; độ kiếp thất bại, nhập môn, nâng cấp tông môn và bình luận celebrate không kích hoạt LV UP. Mất kết nối/đổi phiên/disable/vào battle dọn visual; pause/stopped giữ mốc hiệu ứng, về tu luyện tiếp tục. Không đổi API, gameplay, schema save, dữ liệu DEMO/LIVE hoặc logic lên cấp Node.

Thử trong DEMO bằng **Chuẩn bị độ kiếp** cho một tu sĩ chưa Viên Mãn: các mốc tiểu cảnh giới thật sẽ phát sự kiện; lúc độ kiếp thành công phát vòng LV UP tiếp theo. Đã Viên Mãn thì không có tiểu cảnh giới mới, và độ kiếp thất bại không có LV UP. Tu vi tự đủ ngưỡng và thưởng pending cũ có `stage:up` cũng dùng cùng hiệu ứng.

Kết quả, phạm vi kiểm thử và giới hạn xem mục LV UP mới nhất trong `PROGRESS.md`. Ảnh GPU và báo cáo sẽ được đặt cùng thư mục; không dùng Editor/ảnh tĩnh để suy ra build Windows, OBS hoặc LIVE thật đã PASS.
