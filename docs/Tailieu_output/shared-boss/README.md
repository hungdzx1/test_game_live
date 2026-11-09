# Ba boss chung trên lôi đài

Kiểm chứng cuối: Node **121 PASS /0 FAIL /1 SKIP** (LIVE thật), Unity **65/65 PASS**, Chrome/ảnh GPU1080/720 và bảo toàn860 file **PASS**. Báo cáo: `npm-test.txt`, `unity-tests.xml`, `browser-report.json`, `capture-report.json`, `preservation-report.json`, `final-verification.json`. Build Windows mới, OBS và LIVE thật **Chưa kiểm chứng**. Chạy core tuần tự bằng `npm.cmd test -- --test-concurrency=1` tránh timeout5 giây của bài launcher cũ khi máy chạy nhiều tiến trình; không đổi launcher.

Mở `unity-client/Assets/Scenes/SectScene_Concept02.unity`, khởi động lại Node sau khi cập nhật backend rồi chạy Play. Tất cả tu sĩ cùng đánh một boss trên đài độ kiếp. Nhân vật đang được render dùng pose attack và phát chiêu bay procedural; số người hiển thị vẫn theo giới hạn chất lượng/pool hiện hữu, mọi người trong dữ liệu đều được server mô phỏng.

| Thứ tự | Boss / ảnh | HP mặc định | Giới hạn riêng | Thưởng khi hạ |
|---|---|---:|---:|---|
|1|Vua Rồng Xương Lam Hỏa / Boss_1|10.000|300 giây|Ban Phúc×1 toàn tông|
|2|Hổ Lôi Vương / Boss_2|20.000|300 giây|Ban Phúc×2 toàn tông, mỗi tu sĩ Đan×1|
|3|Nữ Hoàng Hồ Ly Cửu Vĩ / Boss_3|50.000|300 giây|Ban Phúc×5 toàn tông, mỗi tu sĩ Đan×2|

Ba lựa chọn đã được người dùng xác nhận trong `docs/Tailieu/BOSS.md`: boss không đánh trả; Đan cho tất cả người đã nhập môn lúc hạ boss; tự lặp600 giây tu luyện → ba boss → tu luyện. Boss chết chuyển ngay; hết giờ chuyển tiếp không thưởng. Không còn thưởng TOP/tăng tầng từ trận mới, không có quái thường hoặc chia cảnh giới thành chiến trường. HP cố định, không nhân theo số người; tu sĩ dùng ATK và nhịp đánh server. Giữ kỹ năng bình luận1/2 với x2/x3 và hồi10/25 giây riêng từng người.

Vào **Cài đặt → Boss & chu kỳ** để đổi thời gian tu luyện, HP/thời gian/Ban Phúc/Đan riêng ba boss và lưu. Thay đổi có hiệu lực từ trận tiếp theo; HP và luật thưởng của trận đang chạy giữ nguyên. Các lựa chọn K/solo và camera11 chiến trường đã bỏ khỏi giao diện sử dụng. `bossSettings` nhận đúng ba encounter theo thứ tự, server xác thực rồi ghi `caidat.json`; không gửi HP hoặc damage do Unity tính lên server.

Để thử trong DEMO: có thể tạo người chơi bằng công cụ hiện hữu rồi **Kết thúc pha** để vào boss, hoặc **Demo → Thêm44 đạo hữu demo và bắt đầu boss**. Tiến trình cũ được giữ;44 người là fixture nhiều cảnh giới, không phải44 chiến trường. Chọn người chơi và dùng nút kỹ năng1/2 hoặc bình luận DEMO. Cấu hình HP thấp để thử chuyển boss/thưởng nhanh, cấu hình HP lớn để quan sát animation; nhớ lưu cấu hình và bắt đầu trận mới.

Ban Phúc kích hoạt ngay khi hạ boss, hiện popup2 giây và SFX theo hệ thống cũ. Buff x2 chỉ cộng thời gian, không nhân theo số người; suốt trận đồng hồ buff/tu vi/độ kiếp giữ nguyên và tiếp tục khi về tu luyện. Đan ở trong túi, không tự dùng trong battle. Nếu túi Đan đạt100.000, số dư giữ trong `bossPendingPills`, không mất qua restart hoặc khi bắt đầu trận mới; trả dần khi túi có chỗ. Người vào sau lúc hạ boss không nhận hồi tố.

Trong Hierarchy:

- `08_Systems/BossBattlePresenter`: network/characters/podium, sáu ảnh của từng boss, tốc độ frame, chiều cao boss và giới hạn32 chiêu bay. Animation mặc định6 ảnh/giây: một vòng60 frame theo mốc60 FPS (1 giây), mỗi ảnh giữ10 frame, độc lập FPS thực tế. Low giới hạn chiêu6. Animation/FX chỉ trình diễn, không quyết định damage.
- `05_Tribulation/SharedBossSprite`: renderer boss mới, không thay các Transform đài/ghế cũ.
- `07_UI/UI_Canvas/BossInformation`: khung `in4_boss_1/2/3`, `BossHPFill` dùng vùng đỏ của `fill_hp`, số HP hiện tại/tối đa. Fill neo trái; giảm width và UV theo cùng tỉ lệ HP server. Các Graphic nguyên lực được ẩn trong battle và trả trạng thái khi về tu luyện/disconnect. Không thay tiến độ nguyên lực trên server.
- Menu **Tu Tien LIVE → Concept 02 → Add shared boss battle** thêm hệ thống nếu scene đang mở trong bộ nhớ chưa có, giữ cấu hình nếu đã có.

Sáu frame có sẵn của mỗi PNG được dùng nguyên slice/pivot/GUID. Không sửa byte PNG hoặc tải tài nguyên; chỉ đổi import alpha/mipmap/compression khi cần. Không sửa Main, bốn prefab nhân vật,25 ghế hoặc project tại `public/unity-client/My project/`. Renderer Three.js `/song` giữ đường chạy procedural và đọc cùng trạng thái một arena.

Lưu và migration: trận mới có `format: shared-boss-v1`, lưu HP/thời gian/cooldown, lịch sử và cờ đã thưởng. Mỗi lần hạ boss chốt toàn bộ dữ liệu trước khi server phát event, reload/restart không phát thêm thưởng. Save11 chiến trường cũ được kiểm tra và tạo bản sao nguyên byte `players.json.pre-boss.backup` một lần, rồi giữ trận cũ trong `runtime.legacyBattle/legacyBattleResult`, đưa trận dở về tu luyện. Người chơi/túi/buff/pending rewards đã chốt giữ nguyên, DEMO/LIVE độc lập. Module battle cũ chỉ phục vụ kiểm tra/migration, không chạy mô phỏng11 trường trong phiên mới.

Kết quả kiểm thử và giới hạn xem mục BOSS mới nhất trong `PROGRESS.md`. `history/` giữ hai bộ test11 chiến trường trước khi thay bằng các bài kiểm tra luật boss chung. Không dùng kết quả Node/Editor hoặc ảnh GPU để suy ra Windows build, OBS hoặc LIVE thật đã PASS.
