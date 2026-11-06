# 06.5 — HUD LIVE, THÔNG CÁO GÓC VÀ THẺ HỒ SƠ THEO QUÀ

> **Phạm vi:** chỉ chỉnh hiển thị `/song` và các module frontend liên quan đến nhiệm vụ này. Đọc `00_TONG_QUAN.md` trước.
> **Nguồn ảnh:** hai ảnh tham chiếu mà người dùng đã gửi vào Codex. Ảnh là định hướng bố cục và mỹ thuật, không phải asset để đặt làm hình nền.
> **Bất biến:** server là nguồn sự thật của gameplay. Không sửa phép tính tu vi, xác suất độ kiếp, sát thương, boss, quà, bảng xếp hạng hay cơ chế lưu DEMO/LIVE.

## Mục tiêu nghiệm thu
Giao diện `/song` không còn header/footer quá lớn, không có bảng kết quả chiếm gần cả màn hình. **Thiên Đạo thông cáo** là card gọn ở góc, lần lượt hiển thị TOP 3 **một chiến trường**. **Thẻ chi tiết người chơi ở dưới mặc định ẩn**, chỉ bật khi có quà được cấu hình cho hành động xem hồ sơ (chưa map món quà nào), hoặc nút thử trong DEMO. Không làm sai luật quà/vật phẩm hoặc che mất cảnh 3D.

## Mã nguồn dự kiến
- `public/song.html`, `public/css/style.css` — header/footer gọn, responsive 9:16, safe area.
- `public/js/overlay.js` — tách `cultivation-card` khỏi `director.followed`.
- `public/js/battleOverlay.js` — boss HUD thu gọn + kết quả 11 chiến trường phát luân phiên.
- `public/js/liveOverlay.js` — thông báo quà và nguyện lực không chồng nhau.
- `public/js/noticeQueue.js` — dùng lại queue, debounce/TTL nếu thực sự cần.
- `public/js/main.js` — state hiển thị độc lập, event routing tối thiểu.
- Có thể tạo `public/js/profileOverlay.js` để tách trigger hồ sơ khỏi camera.
- Trang DEMO/admin sửa tối thiểu để thêm nút thử hồ sơ; không đụng logic quà hiện có.

## 7. THÔNG CÁO THIÊN ĐẠO THU GỌN

- Loại bỏ overlay cũ chiếm ~90% chiều ngang và tối đa ~58% chiều cao (`.battle-results` hiện có).
- Đặt **thẻ thông cáo góc phải phía trên hoặc cạnh dưới header**, kích thước đề xuất **<= 35% chiều ngang và <= 17–22% chiều cao**; trên thiết bị nhỏ có thể mở rộng nhẹ theo typography nhưng phải ưu tiên cảnh.
- Mặc định hiển thị: tiêu đề `THIÊN ĐẠO THÔNG CÁO`, **tên chiến trường**, TOP 1–3 của **một** chiến trường; mỗi 3–5 giây luân phiên các chiến trường có kết quả. Nếu không có đóng góp, hiển thị trạng thái ngắn.
- Có thể hiển thị dòng tổng hợp `11 chiến trường đã tổng kết`; **không render tất cả 11 dòng cùng một lúc**.
- Dùng hàng chờ/cooldown cho thông cáo và fade in/out nhẹ, không che đài độ kiếp/nhân vật quan trọng; khi camera chuyển shot, panel có thể chuyển sang góc còn trống.
- Khi không có thông cáo, ẩn hoàn toàn panel và trả không gian cho cảnh.
- Không thay đổi tính toán thứ hạng/tiền thưởng; dùng `battleResult.fields` hiện có.

## 8. THẺ HỒ SƠ ĐỆ TỬ — CHỈ KHI TẶNG QUÀ PHÙ HỢP

### 8.1. Hành vi bắt buộc

- Thẻ dưới màn hình gồm tên, cảnh giới, tiểu cảnh giới, tu vi/tiến độ, ATK, DEF, linh căn/buff, avatar **procedural** theo seed của người xem; tham khảo thẻ ở ảnh A nhưng nhỏ, không che sân.
- **Trạng thái mặc định: ẨN** (kể cả khi camera đang tự theo người chơi, đang độ kiếp hoặc nhận bình luận thường).
- Chỉ khi nhận được **sự kiện quà TikTok đã được xác nhận/chốt** và **quy tắc quà được chỉ định là `xem hồ sơ`** thì hiện thẻ của đúng người tặng. Nếu người tặng chưa nhập môn/không có nhân vật, hiển thị một thông báo ngắn phù hợp, không tự tạo nhân vật và không lấy hồ sơ người khác.
- Streamer **chưa chọn loại quà** cho hành động này. **Không hardcode Gift ID, tên quà, mốc kim cương hoặc ép mọi quà mở thẻ.** Đặt một cấu hình sẵn sàng mở rộng, mặc định **không có quà nào map vào `profile`**; giữ nguyên bảng `Quà → vật phẩm` hiện tại.
- Nếu phải thêm lựa chọn `xem hồ sơ` vào UI quà sau này, tách độc lập khỏi luật cấp vật phẩm (`effect: item/sect/camera`) để một món quà có thể cấp item và/hoặc bật profile mà không thay đổi số item. Tránh sửa `giftRulesFor` và `matchGift` lúc này nếu chưa cần; có thể để hook `showProfileForGift(event, rule)` tắt theo mặc định, có tài liệu cách gắn sau.
- Bật thẻ khoảng **5 giây mặc định** (thời gian có thể chỉnh sau), animation slide/fade, một thời điểm một thẻ, queue tối đa 3 để tránh spam. Các sự kiện trùng/cùng combo không tạo thẻ lặp; dựa vào event chốt qua pipeline hiện có.
- Khi hết thời gian, tự ẩn. **Camera focus do quà** là hành vi độc lập; chỉ bật nếu rule hiện tại yêu cầu (không buộc focus chỉ vì mở thẻ).
- **Demo để thử ngay mà không LIVE:** thêm nút `Thử hiện hồ sơ` trong trang Demo/streamer đã có; dùng player demo đang chọn, không làm phát sinh quà thật, không ghi vật phẩm hoặc phá state LIVE. Nút demo dùng cùng component thẻ hồ sơ, không hardcode hồ sơ mẫu.

### 8.2. Nguyên tắc bảo toàn state

- `Overlay.update(t,p)` hiện đang hiện `cultivation-card` nếu có `p` được follow. Phải sửa để `director.followed` không tự quyết định hiển thị thẻ; tạo state riêng `profileOverlay` do sự kiện có quyền kích hoạt điều khiển.
- Có thể giữ HTML/CSS component và thay trigger; nếu cần chỉ dùng presentation state ở client, không sửa server. Bảo đảm thẻ không vô tình xuất hiện do state cũ khi reload.
- Không làm `gift-banner` hoặc thông báo nguyện lực hiện tại mất chức năng; tránh hai banner chồng nhau bằng quy tắc ưu tiên/z-index.
- Không tiết lộ dữ liệu riêng tư: chỉ hiển thị tên công khai và chỉ số game hiện có.

## 9. HEADER, FOOTER, THÔNG BÁO

- Header: `TU TIÊN LIVE` chữ vừa, pha (`TU LUYỆN`/`DIỆT MA`/`ĐỘ KIẾP`), đồng hồ, thanh nguyện lực; có thể cho tên game mờ dần sau vài giây để nhường cảnh.
- Không hiển thị connection debug, `đang dùng dữ liệu mô phỏng` quá to trên sóng; nếu cần giữ, làm một nhãn rất nhỏ ở góc.
- Footer: một thanh gọn hiển thị `TÔNG MÔN THANH VÂN`, số đạo hữu, ticker thông báo; bỏ dòng trùng lặp.
- Thẻ thông cáo, gift banner, audio gate, fallback WebGL phải không chồng nhau; xét vùng an toàn UI TikTok.
- **Không xóa nút mở âm thanh khi autoplay bị chặn**; chỉ chuyển chỗ để không che cảnh và vẫn cho người dùng bấm để unlock audio.

## Chốt kỹ thuật phần quà xem hồ sơ
- **Mặc định không gán bất kỳ Gift ID/tên quà/mốc kim cương nào.** Không biến `effect:'camera'` sẵn có thành quyền xem profile, không mở profile vì một quà thông thường.
- Không tự ý thêm trường mới vào schema quà ở giai đoạn này nếu không cần: để sẵn một điểm hook/adapter presentation an toàn và mô tả rõ cách gắn mapping sau. Nếu giải pháp bắt buộc có thêm cấu hình, phải dùng default tắt và migration tương thích ngược, test kỹ, không làm sai `matchGift`.
- Nút demo chỉ tác động UI local của bản DEMO, không ghi quà, không tăng item, không thao tác dữ liệu LIVE.
- Thẻ hiển thị tên/chỉ số của người tặng đúng userId, một thẻ/lần, tự ẩn sau ~5 giây, tối đa ba sự kiện chờ, tránh hiện trùng theo cùng combo.
- Theo dõi camera, nhập môn, độ kiếp, bình luận và quà chưa map phải để thẻ **ẩn**.

## Kiểm thử riêng
- [ ] Header tối đa 10–12%, footer tối đa 6–8%; không còn thông số trùng lặp che sân.
- [ ] Thông cáo thu gọn một góc, không quá ~1/5 chiều cao; từng chiến trường luân phiên mỗi 3–5 giây.
- [ ] Không có dữ liệu TOP giả; lấy từ `battleResult.fields` đã có.
- [ ] Trạng thái mặc định: hồ sơ ẩn khi camera follow, độ kiếp, nhập môn, chat, quà thường.
- [ ] Demo trigger hồ sơ đúng người đang chọn, tự ẩn; quà chưa mapping không làm hiện hồ sơ.
- [ ] Gift banner, nguyện lực, ticker, WebGL fallback và nút mở âm thanh vẫn hoạt động.
- [ ] 9:16 1080×1920, 720×1280 không đè lấn các thành phần TikTok.
- [ ] Kiểm thử hồi quy toàn bộ `npm test`, smoke/integration nếu chạy được an toàn; so sánh FPS/draw calls và chụp đủ bốn trạng thái: tông môn, độ kiếp, thông cáo, diệt ma.

## Cách Codex thực hiện riêng bước này
1. Kiểm tra `git status`, đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `00_TONG_QUAN.md` và tài liệu bước hiện tại. Bảo vệ mọi thay đổi chưa commit.
2. Chạy baseline `npm test` trước sửa; xác minh hành vi hiện tại bằng trình duyệt nếu có. Không báo là đã thử browser khi chưa chạy.
3. Kiểm tra code local mới nhất; tên file nêu trong tài liệu là vị trí tham khảo từ nhánh `main`, không phải danh sách bắt buộc phải sửa hết.
4. Thay đổi tối thiểu, theo module; không thêm mô phỏng, vòng render, kết nối WebSocket hay hệ thống lưu tiến trình mới.
5. Chạy lại `npm test` và kiểm thử chức năng/ảnh màn hình thuộc bước này. Không reset dữ liệu thật, không tự commit/push.
6. Cập nhật `PROGRESS.md`: file đổi, chức năng thực hiện, test PASS/FAIL/CHƯA KIỂM CHỨNG, thiếu sót, ảnh thực tế nếu chụp được. Dừng sau bước này.
