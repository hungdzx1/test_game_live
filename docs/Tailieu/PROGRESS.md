

*1. zoom camera và hiện vật phẩm nhận được trên đầu - khi được tặng quà, nếu có sfx thì zoom camera rồi mới phát*
*2. Thêm số lượng chỗ ngồi*
*3. Hiệu ứng lv up cho cảnh giới* — Đã triển khai theo LV_UP.md trong Concept02, gồm tiểu cảnh giới và độ kiếp thành công; dùng7 PNG có sẵn, bỏ qua light_beams còn thiếu. Unity42/42 PASS và ảnh1080/720/Low PASS. Hướng dẫn: `docs/Tailieu_output/level-up/README.md`.
4. Giọng thiên đạo
*5. Tạo ảnh các vật phẩm để hiển thị +*
*6. tia sét chạy liên tục trong thời gian độ kiếp* — Cập nhật mới: tới đài ở1,5 giây mới có mây, sau0,3 giây mới có sét; bốn PNG lặp2/3 giây/vòng (40 frame tham chiếu60 FPS) đến hết nghi thức. Pause/reconnect/kết thúc đúng clock server. Node137 PASS/1 SKIP, Unity87 bài khác nhau PASS, ảnh1080/720 và audit PASS. Hướng dẫn mới: `docs/Tailieu_output/storm-camera-timing/README.md`. K01 thu90%/dịch trái giữ từ lượt trước; build Windows/OBS/LIVE chưa kiểm chứng.
*7. Tạo 3 ảnh boss*
*8. Hiệu ứng nhận ban phúc* — Đã triển khai mục6 Qua_Tbao.md trong Concept02; Unity58/58 PASS, Node118 PASS/1 SKIP, đã kiểm tra ảnh1080×1920/720×1280. Hướng dẫn: `docs/Tailieu_output/blessing-receipt/README.md`.
*9. Tạo chiến boss* — Đã triển khai theo BOSS.md và ba xác nhận: Node121 PASS/1 SKIP LIVE, Unity65/65 PASS, Chrome và ảnh1080/720 PASS. Hướng dẫn: `docs/Tailieu_output/shared-boss/README.md`. Build Windows/OBS/LIVE thật chưa kiểm chứng.
*10. Sửa lại cơ chế sử dụng vật phẩm* — Đã triển khai phần7 Qua_Tbao.md: quà mới tự dùng, Trà60 giây, Đan tự lấy vừa đủ khi độ kiếp; giữ đồ cũ và phần dư. Node126 PASS/1 SKIP LIVE, Unity47/47 PASS. Hướng dẫn: `docs/Tailieu_output/qua78/README.md`.
*11. sửa lại zoom camera* — Đã triển khai phần8: quà toàn tông không zoom từng người, camera rảnh30 giây tự chuyển động/theo tu sĩ, ưu tiên quà cá nhân và giữ bảng tên. Scene nguồn đã ghép và kiểm tra bảo toàn PASS, ảnh1080/720 PASS. Build Windows/OBS/LIVE thật chưa kiểm chứng; font thay đổi đồng thời được giữ nguyên, chưa kiểm chứng trong project test. Hướng dẫn như mục10.
*12. Thiết kế khung bảng quà, hướng dẫn* — Đã chọn và đưa **K01 Kim Vân** vào Unity Concept02; Unity49/49 PASS, ảnh GPU1080/720 và bảo toàn source PASS. Hướng dẫn: `docs/Tailieu_output/khung-01/implemented/README.md`. Linh Căn x3 đã sửa ở lượt trước, Node129 PASS/1 SKIP LIVE. Build Windows/OBS/LIVE thật chưa kiểm chứng.

*14. Thiết kế hiệu ứng thông báo boss* — Đã chọn TB02 và ghép Unity Concept02, cảnh báo/rung3 giây rồi mới hiện boss, Node giữ clock/gate damage. Node133 PASS/1 SKIP, Unity74/74 PASS, ảnh1080/720 và audit PASS. Hướng dẫn: `docs/Tailieu_output/boss-notice-designs/implemented/README.md`.

*15. Tìm SFX attack và xuất hiện boss* — Đã chọn warning-TB02 và chuyển cùng ba WAV attack vào `Assets/Musics/SFX/Boss/`, gán clip và nối clock/hit server qua GameAudioManager. PCM/AudioSource/seek/pause/mute/chống lặp PASS; nghe/cân âm thực tế, build Windows/OBS/LIVE chưa kiểm chứng. Hướng dẫn như mục14.

*16. Thêm thông báo ban phúc do người chơi donate(tặng quà)* — Đã thêm tên/avatar donor vào popup2 giây trong Concept02; thiếu ảnh/tải lỗi dùng chữ đầu tên, boss/cấp tông không gán donor. Node137 PASS/1 SKIP, Unity87/87 PASS; ảnh tên/fallback1080/720 PASS. Ảnh CDN/LIVE thật chưa kiểm chứng. Hướng dẫn: `docs/Tailieu_output/camera9/README.md`.

*17. Sửa lại lỗi quay camera* — Mục9 và điều chỉnh mới: rảnh15 giây, zoom random giữ5 giây/pan20 giây cộng0,8 giây vào/0,8 giây về, follow độ kiếp tổng8 giây. Ưu tiên quà FIFO → nhập môn mới nhất → random; người mới bay3 giây đồng thời, boss giữ chờ, pause/reconnect đúng luật. Unity87 bài khác nhau PASS qua hai lượt, GPU1080/720 và ghép/audit nguồn PASS. Hướng dẫn mới: `docs/Tailieu_output/storm-camera-timing/README.md`; cơ chế mục11 trước đó là lịch sử đã được thay thế.

*18. sửa lại mây và sét và camera zoom và người*

*19. Thử avatar trên LIVE thật bằng bình luận `test avt`* — Đã thêm công tắc mặc định tắt/lưu lựa chọn trong Kết nối TikTok LIVE, thẻ góc phải dưới10 giây, hiện avatar/tên/trạng thái tải, người mới nhất thay người cũ; mọi viewer kể cả chưa nhập môn dùng được. Không tạo tu sĩ/quà/zoom. Node144 PASS/1 SKIP, Chrome3/3 PASS, Unity92 PASS/1 SKIP bổ sung HTTP Ban Phúc thiếu server thử riêng; đủ87 hồi quy và5 bài mới PASS. GPU1080/720 và ghép/audit PASS; LIVE/CDN thật, build Windows/OBS chưa kiểm chứng. Ảnh Ready kiểm thử tạo bằng code. File DEMO đổi so baseline trong lúc làm việc được giữ nguyên, ghi riêng trong audit. Hướng dẫn: `docs/Tailieu_output/live-avatar-test/README.md`.

**Cập nhật sửa mục19:** sau báo lỗi LIVE “định dạng hoặc kích thước ảnh”, thêm backend chuyển ảnh WebP/AVIF/JPEG/PNG thành PNG256px trong RAM, dùng chung cho thẻ thử và donor. Không đổi scene/gameplay/save schema. Node148 PASS/1 SKIP, Unity95 trường hợp khác nhau PASS qua hai lượt (sửa test HTTP Ban Phúc cũ còn dùng lại quà đã tự kích hoạt); HTTP WebP/AVIF→PNG→Unity Ready đã PASS, LIVE/CDN thật sau sửa chưa kiểm chứng. Audit1.181 file bảo vệ PASS; file LIVE thay đổi đồng thời được giữ nguyên. Hướng dẫn: `docs/Tailieu_output/avatar-format-fix/README.md`.
