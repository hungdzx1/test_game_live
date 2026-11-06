# GIAI ĐOẠN 05 — HOÀN THIỆN LIVESTREAM, ÂM THANH, TỐI ƯU VÀ BÀN GIAO

> **Mục tiêu:** Hoàn thiện trải nghiệm **TU TIÊN LIVE – VẠN GIỚI TRANH PHONG** thành một công cụ có thể sử dụng khi livestream: đồ họa 3D đẹp và nhẹ, camera director tự động, âm thanh procedural, giọng Thiên Đạo, giao diện streamer đầy đủ tiếng Việt, xử lý lỗi an toàn, lưu dữ liệu ổn định, kiểm thử xuyên suốt và hướng dẫn chạy bằng `chay.bat`. Không được chỉ thay CSS để tuyên bố hoàn thiện nếu tính năng chưa chạy.

## 0. Đọc tài liệu và rà soát dự án

1. Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md` và toàn bộ file trong `phases/`.
2. Chạy bản hiện tại, liệt kê **mọi tính năng chưa hoàn thành** từ giai đoạn 1–4 trước khi bắt đầu bổ sung hiệu ứng.
3. Ưu tiên sửa lỗi blocker: không khởi động, không mở `/song`, không lưu dữ liệu, không chiến đấu, quà bị đếm trùng, thưởng sai, đóng băng tu vi sai.
4. Không tự giả định những tính năng trước đã PASS chỉ vì ghi trong tài liệu. Chạy lại test hoặc ghi rõ `CHƯA KIỂM CHỨNG`.
5. Không cần tải asset nào. Nếu muốn đẹp hơn, cải thiện geometry, materials, shader, bố cục camera, ánh sáng và animation **bằng code**.
6. Không tự thêm cơ chế trả phí, giải thưởng tiền thật, asset từ Internet, hệ thống cloud hay đăng nhập ngoài phạm vi.

## 1. Tiêu chuẩn thành phẩm

Một streamer không biết code phải có thể:

1. Cài Node.js LTS.
2. Giải nén/mở thư mục dự án, nháy đúp `chay.bat`.
3. Nếu thiếu dependency, chương trình tự cài; nếu lỗi, hiện lý do và hướng giải quyết bằng tiếng Việt.
4. Trình duyệt tự mở `http://localhost:3000`.
5. Bấm **Thử không cần LIVE**, nhìn thấy tông môn, nhân vật nhập môn và tu luyện, độ kiếp, sau đó đi diệt ma.
6. Nhập tên TikTok đang LIVE, bấm **NỐI**, theo dõi trạng thái kết nối thật.
7. Mở `http://localhost:3000/song` trong Browser Source của OBS/TikTok LIVE Studio với màn hình dọc.
8. Điều chỉnh thời gian, camera, chất lượng hình ảnh, bảng quà và âm thanh ngay trên trang cài đặt.
9. Dừng/mở lại phần mềm mà dữ liệu tu luyện và cài đặt không bị mất.

Nếu một thao tác chỉ hoạt động trong một môi trường giới hạn, phải nói rõ điều kiện sử dụng trong hướng dẫn.

## 2. Camera director tự động cho livestream

### 2.1 Các chế độ camera

| Mode | Hoạt động |
|---|---|
| `auto` | Máy tự chọn cảnh theo giai đoạn và sự kiện ưu tiên |
| `sectOverview` | Toàn cảnh tông môn, có pan/orbit chậm |
| `followPlayer` | Theo một người chơi theo userId |
| `cultivationGroup` | Quay nhóm đệ tử đang ngồi thiền |
| `breakthrough` | Đài độ kiếp, cận cảnh người đang chịu thiên lôi |
| `battlefield` | Theo một chiến trường có người hoặc chiến trường được chọn |
| `followBoss` | Theo boss và nhóm đang tấn công |
| `giftFocus` | Tập trung người nhận hiệu ứng quà trong khoảng 3 giây |

### 2.2 Hàng chờ và ưu tiên sự kiện

Xây dựng `CameraDirector` có API ví dụ:

```js
requestFocus({
  kind: 'breakthrough|bossDefeated|giftFocus|newMember|battleHighlight',
  userId: null,
  battlefieldId: null,
  priority: 0,
  durationMs: 3000,
  createdAt: 0
})
```

**Mặc định đề xuất** (chỉnh được): cảnh kết thúc boss / kết quả độ kiếp > pha boss cuối > quà lớn / quay cam > nhập môn mới > góc cảnh tự động.

- Chống đổi camera dồn dập: đặt thời gian hiển thị tối thiểu và thời gian chuyển góc mềm.
- Một sự kiện lặp liên tục không được chiếm camera mãi; dedup/giới hạn focus theo userId.
- Nếu cùng lúc hàng chục người độ kiếp, xếp hàng và chỉ đưa lên màn những hoạt cảnh ưu tiên; kết quả của tất cả vẫn được tính trên server.
- Chỉ tạo scene có mức chi tiết cao cho camera đang xem, không dựng 11 chiến trường nặng đồng thời.
- Chuyển cảnh bằng nội suy camera, fade hoặc cổng dịch chuyển procedural; tránh màn hình đen quá lâu.
- Có nút **Trả camera về tự động** trên admin để thoát khỏi chế độ theo dõi thủ công.

## 3. Hoàn thiện đồ họa procedural

### 3.1 Thế giới tông môn

- Tối ưu phối màu huyền ảo: tím đậm, xanh ngọc, ánh vàng; tránh toàn màn hình quá tối trên điện thoại.
- Chính điện, cổng, các bệ thiền, pháp trận, mây núi phải có bố cục dễ nhận biết khi thu nhỏ màn dọc.
- Mỗi cảnh giới có biểu hiện ngoại hình khác nhau theo `GAME_DESIGN.md` (linh khí, pháp luân, tia sét, hào quang v.v.).
- Các đạo hữu chibi không bị che khuất hoàn toàn bởi áo rộng/pháp khí/quầng sáng.
- Khi tăng tầng: hiệu ứng tăng năng lượng; khi độ kiếp: chuyển cảnh lôi đài; khi Phi Thăng: thần quang mạnh hơn nhưng vẫn giới hạn hiệu ứng.

### 3.2 Chiến trường

- Ba boss phải **khác nhau rõ rệt về hình dáng và đòn đánh**, không chỉ đổi màu một hình cầu.
- Có hiệu ứng hit, quái tan biến, kiếm khí, thiên lôi, cổng ma, thanh HP boss dễ đọc.
- Màn hình battle không quá nhiều hạt và số sát thương khiến người xem không biết ai đang đánh.
- Có cài đặt tắt số damage bay, giảm bóng đổ, giảm số particle và chất lượng ánh sáng.

### 3.3 Nguyên tắc không tài nguyên ngoài

- Không yêu cầu user tải GLTF, FBX, PNG, sprite sheet, font, texture, audio, video hoặc gói hiệu ứng.
- Three.js phải được phục vụ từ local, các mesh/texture sinh bằng code hoặc CanvasTexture tại runtime.
- Nếu dùng biểu tượng UI: dùng emoji hệ thống, CSS/SVG tạo trong code; không gọi thư viện icon qua CDN.
- Kiểm tra Network panel: trừ kết nối TikTok thật và tải dữ liệu từ `localhost`, game không âm thầm gọi dịch vụ asset bên ngoài.

## 4. Âm thanh và giọng Thiên Đạo

### 4.1 Web Audio API

Tạo âm thanh bằng dao động/nhiễu/filter/envelope, không dùng file MP3/WAV:

- Tiếng kiếm chém.
- Kiếm khí bay.
- Va chạm và tiếng đánh trúng.
- Thiên lôi, tiếng sấm và điện tích.
- Truyền tống.
- Chuông tu luyện.
- Linh khí tăng tầng.
- Âm thanh boss chết.
- Nhạc nền ambient đơn giản tạo tại runtime.

Giới hạn số âm thanh phát đồng thời; nếu nhiều người spam kỹ năng/quà, chỉ phát các âm thanh quan trọng để không vỡ tiếng. Không cố tạo nhạc bắt chước bản quyền; sử dụng âm thanh/ngữ điệu gốc tự tổng hợp.

### 4.2 Giọng đọc Thiên Đạo

Sử dụng `SpeechSynthesis` nếu có giọng tiếng Việt. Nội dung đọc ngắn, ví dụ:

- “Đạo hữu [Tên] đang độ kiếp, thiên lôi đã giáng xuống!”
- “Chúc mừng [Tên] đột phá thành công lên [Cảnh giới]!”
- “Độ kiếp thất bại. Hãy tiếp tục tích lũy thiên mệnh.”
- “Thiên Đạo thông cáo! Đạo hữu [Tên] đứng đầu [Chiến trường]!”

Yêu cầu:

- Đọc tên đã lọc ký tự/từ tục, hạn chế tên quá dài.
- Có hàng chờ TTS; bỏ bớt thông báo ít quan trọng nếu hàng chờ dài.
- Có tắt/bật TTS, âm lượng và nút **Nghe thử**.
- Nếu không tìm thấy voice tiếng Việt, hiển thị chữ thay thế, không lỗi/không hứa máy nào cũng đọc tiếng Việt.
- Vì browser có hạn chế autoplay, admin phải có nút **Bật âm thanh** được bấm trực tiếp và hướng dẫn bật âm thanh cho Browser Source. Đừng giả vờ Web Audio/SpeechSynthesis chắc chắn tự phát sau khi trang được load im lặng.

## 5. Trang cài đặt streamer hoàn chỉnh

### 5.1 Dashboard thông tin

Hiển thị:

- Kết nối TikTok: đã nối/chưa nối/lỗi/reconnecting.
- Username kết nối và số sự kiện mới nhận.
- Pha hiện tại + thời gian còn lại; số chu kỳ đã chạy.
- Tổng số đạo hữu; số người theo cảnh giới.
- Số trận/chiến trường đang hoạt động.
- Số người đang chờ độ kiếp.
- Mức tải mô phỏng và FPS phía `/song` (nếu có báo cáo telemetry).

Không gọi những số liệu giả là dữ liệu thực. Với demo phải có nhãn **DỮ LIỆU MÔ PHỎNG**.

### 5.2 Điều khiển

- Bắt đầu / Tạm dừng / Tiếp tục / Kết thúc chu kỳ.
- Chuyển sớm sang tu luyện/diệt ma **có xác nhận** nếu có nguy cơ bỏ dở boss/độ kiếp.
- Chọn camera tự động hoặc cảnh riêng.
- Chọn chất lượng Low/Medium/High.
- Bật/tắt nhạc, hiệu ứng, giọng đọc; chỉnh âm lượng.
- Sửa thời gian tu luyện 600 giây và chiến đấu 300 giây mặc định.
- Sửa ngưỡng/bảng item-quà, hệ số boss, nhiệm vụ, thông báo.
- Xem danh sách người chơi/cảnh giới và tra cứu một userId.
- Có nút sao lưu và khôi phục dữ liệu JSON có xác nhận.
- Nút **Reset dữ liệu người chơi** cần hai bước xác nhận; không xóa tự động khi restart.
- Nút **Mở trang phát sóng**, **Sao chép URL `/song`**.
- Nút **Thử không cần LIVE** và các công cụ test của giai đoạn 1–4.

### 5.3 Thiết kế UI

- Màu tối, tương phản đủ cao, nhãn tiếng Việt, nút rõ ràng.
- Mỗi nhóm có mô tả ngắn, phân biệt sửa cấu hình với thao tác làm thay đổi trận đang chạy.
- Form số có min/max/validation, thông báo lưu thành công/lỗi, không mất toàn bộ cấu hình khi người dùng nhập sai 1 trường.
- Không hiển thị khóa ký nếu có lên trang `/song` hoặc file logs.
- Trang admin không được vô tình xuất hiện trong OBS Browser Source.

## 6. Hoàn thiện giao diện phát sóng `/song`

### 6.1 Kích thước và bố cục

- Thiết kế cho **9:16**, target 1080×1920; co giãn được khi nguồn OBS đặt 720×1280.
- Top: logo chữ, pha, đồng hồ, số đạo hữu; không che các thông báo quan trọng của TikTok nếu chèn nguồn Browser Source ở bố cục có vùng an toàn.
- Trung tâm: nhân vật/tông môn/chiến trường; không để HUD chiếm phần lớn không gian 3D.
- Dưới: thông báo sự kiện; trong battle có HP boss và TOP chiến trường; trong cultivation có thông tin người đang độ kiếp/người vừa nhập môn.
- Cắt tên hiển thị quá 20 ký tự, che từ tục theo `tucngu.json`; không dùng HTML thô.
- Số máu lớn format có dấu phân cách; đồng hồ mm:ss dễ đọc; màu thanh boss khác thanh tu vi.
- Thông báo được queue, có TTL, fade out và giới hạn tối đa xuất hiện đồng thời.

### 6.2 Cảnh đặc biệt

- **Nhập môn:** cổng mở, tên + nhân vật xuất hiện ngắn.
- **Độ kiếp:** camera, thiên lôi, danh xưng, kết quả.
- **Tặng quà:** tên người tặng + vật phẩm đã kích hoạt, hiệu ứng 3D.
- **Boss cuối:** nhạc/đèn thay đổi, camera tập trung, thanh máu rõ.
- **Thông cáo:** TOP 3 theo từng chiến trường, không nhầm TOP của các cảnh giới khác nhau.
- **Chuyển chu kỳ:** toàn bộ nhân vật trở về tông môn, đồng hồ chuyển về tu luyện; các phần thưởng đang chờ được xử lý đúng.

## 7. Tối ưu cho máy Windows đang livestream

### 7.1 Mục tiêu thực tế

- Cố gắng giữ **30 FPS ổn định** trên máy tầm trung ở preset Medium; đây là **mục tiêu kiểm thử**, không phải cam kết cho mọi máy.
- Pixel ratio mặc định tối đa 1.5 (cho phép Low 1.0; nếu cần High tối đa 2 tùy máy).
- Giới hạn nhân vật chi tiết trên màn hình (gợi ý 40–60), giảm animation/render ngoài camera.
- Tái sử dụng geometry/material; dùng InstancedMesh cho lặp, object pool cho particle/projectiles.
- Không tạo texture hoặc mesh mỗi frame; chỉ cập nhật transform/buffer.
- Khi chuyển chiến trường, dispose geometry/material/RenderTarget chỉ khi không còn được sử dụng; không dispose tài nguyên dùng chung.
- Chiến trường ngoài camera **vẫn được server tính toán** nhưng không render chi tiết.
- Không broadcast snapshot khổng lồ mỗi tick: gửi delta hoặc snapshot giới hạn tần suất, ưu tiên đối tượng đang quan sát.
- Có cơ chế giảm chất lượng tự động khi FPS giảm liên tục, nhưng không cắt bỏ logic game.

### 7.2 Tải và độ bền

- Test 10, 30, 60, 100, 500 người chơi dữ liệu; chỉ số server tính đúng dù số rendered ít.
- Test event burst: nhiều bình luận/tim/quà trong thời gian ngắn, log không tăng vô hạn.
- Giới hạn số WebSocket message/giây và số event hiệu ứng đang chờ; quy tắc loại bỏ chỉ được áp dụng cho **hiệu ứng phụ**, không được làm mất sự kiện quà/đóng góp đã hợp lệ.
- Nếu trình duyệt `/song` đóng, server vẫn tính toán và lưu tiến độ; khi mở lại nhận snapshot chính xác.
- Nếu nguồn TikTok ngắt, engine không crash; trạng thái admin rõ ràng.
- Nếu JSON lỗi, tạo bản backup và báo lỗi; không âm thầm reset toàn bộ dữ liệu.

## 8. Trải nghiệm không biết code trên Windows

### 8.1 `chay.bat`

- Kiểm tra `node` và `npm`.
- Nếu thiếu: in tiếng Việt cách vào `https://nodejs.org` cài LTS, giữ cửa sổ đủ để người dùng đọc, thoát với mã lỗi.
- Nếu chưa có `node_modules`, chạy `npm install` hoặc `npm ci` nếu lockfile hợp lệ.
- Nếu npm thất bại, hiển thị lỗi và không cố mở server giả.
- Khởi động server đúng thư mục làm việc, không phải người dùng mở terminal thủ công.
- Chỉ tự mở trình duyệt sau khi server đã lắng nghe hoặc thông báo rõ nếu không tự mở được.
- Khi port 3000 bận: báo cổng bị chiếm, đề xuất cách xử lý; không tự chạy server thứ hai ghi vào cùng data.

### 8.2 Hướng dẫn người dùng

Tạo `HUONGDAN.md` **ngắn, tiếng Việt, có các bước cụ thể**, bao gồm:

1. Cài Node.js LTS.
2. Nháy đúp `chay.bat`.
3. Dùng **Thử không cần LIVE**.
4. LIVE thật bằng app TikTok/LIVE Studio; nhập username và bấm **NỐI** (công cụ không tự phát LIVE).
5. OBS: thêm **Browser Source** URL `http://localhost:3000/song`, Width `1080`, Height `1920`; kiểm tra âm thanh.
6. LIVE Studio: thêm nguồn trình duyệt/web phù hợp phiên bản hỗ trợ, nhập cùng URL; kiểm tra âm thanh.
7. Sửa bảng quà → item, thời gian 10/5, âm lượng, preset đồ họa.
8. Xử lý lỗi kênh chưa LIVE, sai username, kết nối lại, thư viện không chính thức, Windows Firewall.
9. Cách sao lưu/khôi phục dữ liệu.
10. Cách đóng chương trình đúng để dữ liệu được lưu.

Đồng thời viết `README.md` ngắn giải thích chức năng chính, cấu trúc và cách chạy; tài liệu kỹ thuật chi tiết vẫn nằm trong `GAME_DESIGN.md` và `phases/`.

## 9. Bộ kiểm thử end-to-end và tình huống lỗi

### 9.1 Ma trận kiểm thử chức năng

| Mã | Test | Điều kiện PASS |
|---|---|---|
| 05-01 | Windows clean start | `chay.bat` cài/chạy và mở trang nếu có Node/npm |
| 05-02 | Demo không cần LIVE | Thấy đủ nhập môn, tu luyện, độ kiếp, battle, thưởng |
| 05-03 | Chu kỳ chuẩn | 600s tu luyện, 300s battle, rồi lặp |
| 05-04 | Không tăng EXP khi battle | EXP bất biến toàn bộ 300s; buff chỉ tạm dừng |
| 05-05 | Mười một cảnh giới | Đúng chỉ số, ngưỡng, không tạo cảnh giới thứ 12 |
| 05-06 | Độ kiếp thất bại/thành công | Đúng bảo hộ/cooldown/cảnh giới, có hoạt cảnh |
| 05-07 | Quà và vật phẩm | Mapping đúng, combo không cộng trùng, battle không cộng EXP |
| 05-08 | Ba boss/11 chiến trường | Đúng battlefield, timeline, HP, TOP riêng |
| 05-09 | Thưởng +5/+4/+3 | Chỉ nhận một lần, không bỏ qua độ kiếp |
| 05-10 | `1` và `2` | x2/10s và x3/25s, không spam cooldown |
| 05-11 | Camera tự động | Đổi cảnh mềm, không bỏ qua sự kiện ưu tiên |
| 05-12 | Âm thanh/tắt tiếng | Web Audio hoạt động sau tương tác; chế độ tắt thật |
| 05-13 | Không có voice tiếng Việt | Hiển thị chữ thay thế, không crash |
| 05-14 | 9:16 OBS | Không vỡ bố cục, chữ dễ đọc, không bị cắt |
| 05-15 | Test 60 người render | Không nhân đôi mesh/đứng hình nặng khi chơi liên tục |
| 05-16 | Test 500 người server | Logic/tổng người chính xác; chỉ render người cần thiết |
| 05-17 | Burst comment/tim/quà | Không sai thưởng, không nghẽn không giới hạn |
| 05-18 | Reload `/song` và restart server | Khôi phục trạng thái/dữ liệu đúng |
| 05-19 | Ngắt Internet/TikTok | Game tiếp tục; admin báo lỗi và reconnect giới hạn |
| 05-20 | Live thật, bình luận `nhập môn` | Chỉ PASS nếu có phiên LIVE thật và kiểm chứng nhận sự kiện |
| 05-21 | Live thật, bình luận `1`/`2` | Chỉ PASS nếu đã kiểm chứng trong battle thật |
| 05-22 | Live thật, tặng quà combo | Chỉ PASS nếu có sự kiện thật; không ép người thử mua quà |
| 05-23 | XSS/tục ngữ/username dài | Không thực thi HTML, tên ≤20 ký tự, nội dung an toàn |
| 05-24 | Mất cài đặt/JSON hỏng | Có cảnh báo và fallback/backup an toàn |
| 05-25 | Network khi không LIVE | Không phụ thuộc asset/CDN hay dịch vụ bên ngoài |

Mỗi test ghi `PASS`, `FAIL` hoặc `CHƯA KIỂM CHỨNG` với kết quả quan sát được và cách tái hiện. Không tô PASS khi chỉ đọc code mà chưa chạy được.

### 9.2 Kiểm thử kỹ thuật

- Unit tests: chỉ số cảnh giới, EXP, Pmin/Pmax, buff x2+x2, cooldown, khóa battle, công thức HP boss, reward idempotency, combo quà.
- Integration tests: đầu vào demo → adapter normalize → event bus → game engine → state WebSocket.
- End-to-end local: trang admin điều khiển được server, trang `/song` nhận đúng snapshot, animation camera hoạt động.
- Performance: lưu FPS đo được, RAM, tốc độ event xử lý, số người mô phỏng, preset và cấu hình máy (nếu kiểm tra được).
- Độ bền: chạy ít nhất 2 chu kỳ rút gọn liên tục trong demo, kiểm tra memory và không cấp thưởng trùng.

## 10. Các tình huống biên phải giải quyết

1. LIVE kết thúc giữa boss: trận vẫn chạy theo chính sách đã chọn và thông báo mất kết nối; không làm nhân vật biến mất.
2. Streamer tắt phần mềm giữa độ kiếp: không roll xác suất lại vô hạn hoặc phát kết quả hai lần khi mở lại.
3. Streamer tắt phần mềm ngay sau khi boss chết: không phát thưởng hai lần.
4. Kết nối TikTok nhận hai event gift trùng nhau: dedup đúng, không cấp item lại.
5. Một người đổi tên TikTok: nhân vật vẫn giữ nếu userId ổn định.
6. Nhiều người bình luận `1` trong 1 giây: các lệnh hợp lệ được tính đúng, render gộp hiệu ứng để tránh lag.
7. Quà/điểm nhiệm vụ EXP nhận lúc battle: giữ chờ, không trừ thời hạn buff.
8. Người chơi Phi Thăng nhận thưởng tăng tầng: xử lý thưởng đỉnh cao mà không tạo cảnh giới mới.
9. Thiếu quyền phát âm thanh/TTS: game vẫn chạy, có nút kích hoạt thủ công và thông báo chữ.
10. Không có WebGL/OBS không hỗ trợ: có fallback 2D tối thiểu hoặc thông báo lỗi rõ kèm cách khắc phục.

## 11. Quy trình kiểm tra cuối và bàn giao

**Bước 1 — Quét tiến độ:** Đọc `PROGRESS.md` và lập bảng tất cả chức năng còn thiếu. Sửa lỗi theo mức độ ảnh hưởng (blocker → sai logic → lỗi đồ họa → tối ưu).

**Bước 2 — Chạy test tự động:** Thực thi `npm test` (hoặc command ghi trong README). Lưu đầu ra tóm tắt, danh sách PASS/FAIL và môi trường chạy.

**Bước 3 — Chạy demo thật:** Khởi động server, mở `/` và `/song`, sinh người chơi, thực hiện một chu kỳ rút gọn, test độ kiếp thành công/thất bại, cả ba boss, kỹ năng `1`/`2`, TOP và quà combo.

**Bước 4 — Kiểm tra bằng trình duyệt nếu môi trường có:** Chụp tối thiểu 4 ảnh: (a) tông môn, (b) đài độ kiếp, (c) boss 3 trên chiến trường, (d) trang cài đặt. Nếu không có công cụ trình duyệt hoặc chụp màn hình thì ghi rõ không thực hiện được, không tự tạo hình ảnh giả nói là screenshot sản phẩm.

**Bước 5 — Hướng dẫn:** Đảm bảo `HUONGDAN.md`, `README.md`, `caidat.json` mẫu và dữ liệu demo an toàn có trong dự án. Nếu cần nộp ZIP, ZIP phải chứa cả code và script chạy, không chứa `node_modules` nếu đã có script cài tự động.

**Bước 6 — Cập nhật tiến độ:** `PROGRESS.md` phải có:

- Danh sách module/file hoàn thành.
- Kết quả test theo mã và lý do FAIL/CHƯA KIỂM CHỨNG.
- Cách chạy lần đầu trên Windows.
- Các hạn chế thực tế của connector TikTok và voice tiếng Việt.
- Các thông số cân bằng đã bổ sung ngoài tài liệu thiết kế.
- Điểm cần làm ở phiên bản sau (nếu có), tách khỏi chức năng bắt buộc.

## 12. Tiêu chí nghiệm thu cuối cùng

- [ ] Nháy đúp `chay.bat` để khởi động dự án (nếu kiểm chứng trên Windows được; nếu không, ghi rõ giới hạn môi trường).
- [ ] Không phải cung cấp ảnh, nhân vật, sprite, model, texture, animation hay âm thanh ngoài.
- [ ] Trang `/song` là game 3D procedural 9:16, có scene, camera và animation hoạt động.
- [ ] Demo chạy được **nhập môn → tu luyện → độ kiếp → diệt ma → thưởng → tu luyện lại**.
- [ ] 11 cảnh giới, 11 chiến trường, 3 boss, 2 kỹ năng, 5 item và TOP hoạt động theo luật.
- [ ] Không thể cộng EXP trong chiến đấu, không thể nhận thưởng trùng, không thể vượt cổng độ kiếp trái phép.
- [ ] Có kết nối TikTok theo API phiên bản đã cài; mọi hạn chế chưa kiểm chứng được ghi rõ.
- [ ] Giao diện quản trị/quà/camera/âm thanh/độ khó lưu được và có hiệu lực thực.
- [ ] Có khả năng theo dõi trạng thái kết nối và xử lý mất mạng.
- [ ] Dữ liệu khôi phục sau restart, demo không ghi đè dữ liệu thật.
- [ ] Các kiểm thử đã chạy có kết quả minh bạch, không tự khai PASS.
- [ ] Có hướng dẫn tiếng Việt đầy đủ cho người không biết code.

## 13. Yêu cầu câu trả lời cuối của AI lập trình

Khi đã làm xong, chỉ cần báo cáo gọn nhưng có thể kiểm chứng:

1. **Đã làm:** nhóm chức năng chính, đường dẫn file thực.
2. **Cách chạy:** yêu cầu môi trường và thao tác với `chay.bat`.
3. **Đã kiểm thử:** test nào PASS, test nào FAIL, test nào CHƯA KIỂM CHỨNG; không nói chung chung “đã test mọi thứ”.
4. **Hình ảnh chụp màn hình thực tế** nếu có môi trường hỗ trợ.
5. **Giới hạn còn tồn tại:** nhất là TikTok connector không chính thức, quyền âm thanh OBS, hiệu năng tùy máy.
6. **Đề xuất phiên bản sau:** chỉ đặt ở phần riêng, không làm lu mờ lỗi chưa sửa.

**Không tạo thêm giai đoạn mới hoặc tuyên bố đã hoàn thành những việc chưa thử.** Mục tiêu là một sản phẩm có thể sử dụng và tiếp tục bảo trì, không phải bản demo chỉ đẹp khi chụp ảnh.
