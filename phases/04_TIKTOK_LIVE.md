# GIAI ĐOẠN 04 — KẾT NỐI TIKTOK LIVE VÀ TƯƠNG TÁC NGƯỜI XEM

> **Sửa định dạng avatar09/11/2026:** sau báo lỗi giải mã LIVE, backend tải avatar qua HTTPS/CDN đã kiểm tra và chuyển PNG tạm trong RAM cho Unity bằng API nội bộ; không lưu ảnh/URL vào player save hoặc thành asset game. Không đổi gameplay/event schema. Quy tắc tải trực tiếp từ Unity trước đây được thay bằng mục sửa định dạng ở GAME_DESIGN.md. Kiểm chứng: `docs/Tailieu_output/avatar-format-fix/README.md`.

> **Bổ sung đã xác nhận09/11/2026:** công tắc “Thử avatar LIVE” ở khung Kết nối, mặc định tắt/lưu cấu hình; chỉ nguồn TikTok trong LIVE, bình luận `test avt` hiện thẻ avatar+tên+trạng thái10 giây ở Unity, kể cả người chưa nhập môn. Tính năng này là yêu cầu riêng cho ảnh viewer runtime, không dùng ảnh tải ngoài làm asset scene3D; không tự lên LIVE/gửi bình luận. Quy tắc mới trong GAME_DESIGN.md và kiểm chứng tại `docs/Tailieu_output/live-avatar-test/README.md`.

> **Mục tiêu:** Thay đầu vào demo bằng sự kiện TikTok LIVE thật **mà không viết lại logic game**. Khán giả bình luận `nhập môn`, `1`, `2` để tham gia; thả tim/ theo dõi/ vào phòng tạo phản hồi; quà tặng kích hoạt vật phẩm qua bảng ánh xạ streamer chỉnh được. Bắt buộc giữ **Thử không cần LIVE** để chạy mọi luồng ngay cả khi không có kênh đang phát.

## 0. Nguyên tắc tích hợp

1. Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md` và các giai đoạn 1–3; kiểm tra máy chủ đã có event bus/CommandRouter/ItemService/CombatService.
2. Dùng `tiktok-live-connector` là thư viện **không chính thức**; API, tên class, tên event, combo quà, cách ký có thể khác nhau theo phiên bản. **Sau khi npm install, đọc README và type/API của phiên bản đã cài** rồi mới code, không phỏng đoán.
3. Nếu connector/phiên LIVE thực không khả dụng, vẫn phải hoàn thành adapter, chế độ demo và tests; báo `CHƯA KIỂM CHỨNG LIVE THẬT`, không tự tuyên bố đã test thành công.
4. Không bao giờ tự khởi động TikTok LIVE thay streamer. Chỉ kết nối tới phiên LIVE streamer tự bật từ ứng dụng TikTok hoặc LIVE Studio.
5. **Không mua quà, không gửi bình luận tự động, không tự động tương tác để tăng tương tác ảo**. Chỉ nhận sự kiện do người xem chủ động tạo.
6. Không dùng tài nguyên/ảnh đại diện từ Internet cho scene 3D; tạo biểu tượng avatar procedural. Phần kết nối TikTok có thể trao đổi mạng với TikTok/dịch vụ kỹ thuật mà connector buộc phải dùng — không được hứa toàn bộ ứng dụng “không bao giờ gửi dữ liệu ra mạng”; cam kết **không gửi dữ liệu game sang máy chủ bên thứ ba khác**.

## 1. Sản phẩm người dùng nhìn thấy

- Trang `http://localhost:3000` có ô tên TikTok, **NỐI**, **NGẮT**, trạng thái và lỗi bằng tiếng Việt.
- Trang cài đặt ghi rõ: **“Công cụ không tự bắt đầu livestream. Hãy lên LIVE trước bằng TikTok/LIVE Studio, sau đó bấm NỐI.”**
- Khi một người bình luận `nhập môn`: game tạo nhân vật thật, hiện tên và chào mừng trên `/song`.
- Khi người đã tham gia bình luận `1`/`2` trong pha diệt ma: sử dụng kỹ năng, tính sát thương qua combat service.
- Tim làm đầy thanh **Nguyện Lực Tông Môn** hoặc thanh phúc lợi cộng đồng (cấu hình được); đạt ngưỡng tạo hiệu ứng và thưởng miễn phí có cooldown, **không phá vỡ quy tắc khóa EXP trong battle**.
- Người theo dõi/vào phòng: thông báo nhỏ không chen vào cảnh boss/độ kiếp.
- Khi có quà: hiển thị tên, giá trị quà, vật phẩm được gán, hiệu ứng nhân vật và camera; không tính trùng quà chuỗi.
- Có **bảng quà → vật phẩm** thêm/sửa/xóa, lưu vào `caidat.json`.
- Bấm **Thử không cần LIVE** mô phỏng được tất cả sự kiện kể trên, kể cả combo và ngắt kết nối.

## 2. Phân lớp nhận sự kiện

Kiến trúc bắt buộc:

```text
TikTok LIVE (nguồn thật) ─┐
                         ├──> NormalizeEvent ──> Validate/Deduplicate ──> GameEventBus
DemoEventSource ─────────┘                                      │
                                                                ├──> CommandRouter
                                                                ├──> ItemService
                                                                ├──> CultivationService
                                                                ├──> CombatService
                                                                └──> WebSocket /song
```

- `TikTokAdapter` chỉ xử lý kết nối và dịch sự kiện, không tự ý trực tiếp cộng EXP, gây damage, phát thưởng.
- `DemoEventSource` tạo sự kiện vào **cùng** pipeline, không fork logic.
- `GameEventBus` xử lý theo thứ tự hợp lý, giới hạn tần suất và có nhật ký sự kiện ngắn khi cần debug.
- Trường hợp hai event cùng user và timestamp gần nhau phải có khóa/id chống cộng trùng, tránh kết quả lệch khi reconnect.

## 3. Chuẩn hóa dữ liệu đầu vào

Schema dùng nội bộ (tương thích yêu cầu prompt tổng và Giai đoạn 1):

```js
{
  eventId: 'source-specific-unique-key',
  source: 'tiktok|demo',
  loai: 'qua|binhluan|tim|theodoi|vao',
  userId: 'stable-user-id',
  ten: 'Tên hiển thị',
  avatar: null,
  qua: '',
  giftId: '',
  soKimCuong: 0,
  soLuong: 1,
  noiDung: '',
  timestamp: 0,
  rawMeta: {}
}
```

- **Tên người xem không phải khóa định danh**. Nếu connector chưa cung cấp user ID đáng tin cậy, chỉ dùng ID thay thế trong phiên và ghi rõ giới hạn; không ghi đè nhân vật của người khác theo trùng tên.
- Dùng thông tin gift ID/diamond/repeat từ thư viện theo tài liệu phiên bản đã cài. Không tự suy đoán giá trị kim cương từ tên quà.
- Nếu event có giá trị không hợp lệ (âm, NaN, quá lớn, thiếu trường bắt buộc), không xử lý phần thưởng và ghi lỗi ngắn.
- Chỉ lưu dữ liệu người xem tối thiểu để vận hành game. Không cần tải avatar, không lưu nội dung bình luận kéo dài vô hạn.
- `rawMeta` chỉ dùng debug tạm, không broadcast dữ liệu riêng tư thừa ra UI công khai và không mặc định lưu toàn bộ raw event xuống đĩa.

## 4. Kết nối, ngắt và tự kết nối lại

### 4.1 Kết nối

Trang cài đặt có:

- `Tên tài khoản TikTok` (username, chuẩn hóa bỏ `@` nếu cần).
- `Khoá ký / cấu hình dịch vụ ký (tuỳ chọn)` **chỉ hiển thị nếu phiên connector thật sự cần**; không tự invent cấu hình.
- `NỐI`, `NGẮT`, trạng thái `Chưa kết nối / Đang nối / Đã kết nối / Đang nối lại / Lỗi`.
- Lịch sử trạng thái/lỗi gần nhất bằng tiếng Việt.

Các trạng thái cần xử lý: LIVE chưa bắt đầu, username không tồn tại/sai, phiên LIVE đã kết thúc, mất mạng, bị rate limit, chữ ký/phiên bản connector không tương thích, server bị ngắt.

Không nói “Đã kết nối” trước khi adapter xác nhận có kết nối thực. Hiển thị trạng thái lấy từ server, không chỉ thay đổi giao diện nút.

### 4.2 Reconnect

- Khi mất kết nối ngoài ý muốn: thử lại sau **5 giây**, tối đa **10 lần liên tiếp** mặc định, chỉnh được.
- Nếu streamer nhấn **NGẮT**, hủy reconnect và đóng tài nguyên mạng.
- Không mở nhiều kết nối chồng nhau hoặc tạo nhiều listener trùng nhau.
- Nếu LIVE kết thúc, thông báo cụ thể; không spam reconnect vô tận.
- Hết lần thử: hiển thị “Không thể kết nối sau 10 lần thử. Kiểm tra tên kênh/LIVE và bấm NỐI lại.”
- Game engine và `/song` tiếp tục chạy nội bộ khi TikTok mất kết nối; giữ trạng thái người chơi.

## 5. Bình luận và lệnh điều khiển

### 5.1 Chuẩn hóa tiếng Việt

- Dùng Unicode normalization (`NFD`), bỏ dấu tổ hợp, quy đổi `đ` → `d`, lowercase, trim, gộp khoảng trắng.
- Lệnh chỉ chạy với mẫu hợp lệ (ví dụ `nhập môn`/`nhap mon`), không kích hoạt khi từ khóa vô tình nằm giữa câu dài không phải lệnh.
- Tách `parseCommand()` khỏi nội dung hiển thị; **không thực thi code**, không truyền thẳng HTML từ bình luận vào DOM.

### 5.2 Lệnh

| Bình luận | Pha | Hành động | Điều kiện |
|---|---|---|---|
| `nhập môn` | Mọi pha | Tạo nhân vật hoặc chào mừng quay lại | Không tạo trùng userId |
| `tu luyện` | Tu luyện | Nhiệm vụ cộng tu vi nhỏ | Có cooldown và giới hạn nhận |
| `điểm danh` | Tu luyện | Quà nhiệm vụ miễn phí | 1 lần/phiên hoặc như cấu hình |
| `1` | Chiến đấu | Kiếm Khí Trảm x2 | Cooldown 10 giây |
| `2` | Chiến đấu | Thiên Lôi Quyết x3 | Cooldown 25 giây |

- Bình luận phải được xử lý theo luật đã có ở Giai đoạn 2 và 3.
- Nếu chưa nhập môn mà gõ `1`/`2`, không tự cấp nhân vật kèm damage. Có thể nhắc nhẹ “Bình luận nhập môn để tham gia”, giới hạn tần suất.
- **Đừng gán mọi bình luận của người xem thành một hành động gây sát thương**; chỉ những lệnh hợp lệ mới có effect.
- Một người tối đa một thông báo nổi bật trong khoảng thời gian cấu hình, để màn hình không bị phủ kín.

## 6. Tim, theo dõi và vào phòng

### 6.1 Tim

**Đề xuất bổ sung cho V1 (không phải con số gốc trong PDF):**

- Cộng tim vào `sectWishPower` từ lượng tim mà connector cung cấp, tránh cộng trùng khi event chỉ báo tổng tích lũy.
- Mốc mẫu 1.000 tim (chỉnh được) → “Thiên Đạo Ban Phúc Cộng Đồng”, tạo quầng sáng toàn tông môn.
- Nếu đang tu luyện: có thể cấp vật phẩm/điểm nhiệm vụ miễn phí theo quy tắc cấu hình.
- Nếu đang chiến đấu: quà cộng đồng chỉ được ghi **pending** để dùng khi về tông môn; hoặc tạo hiệu ứng chiến đấu không tăng tu vi nếu cấu hình chọn.
- Không thúc đẩy spam tim bằng cách xử lý không giới hạn; giới hạn tần suất render và phát thưởng.

### 6.2 Theo dõi/vào phòng

- Chào mừng ngắn, có cắt tên và lọc từ tục.
- Một người vào phòng nhiều lần trong thời gian ngắn chỉ hiện thông báo theo cooldown, không spam màn hình.
- Theo dõi/vào phòng **không tự nhập môn** nếu người xem chưa bình luận `nhập môn`.

## 7. Quà tặng và combo — phần quan trọng nhất

### 7.1 Quy tắc đếm quà

Đọc đúng hành vi `gift` / `repeatCount` / `repeatEnd` của phiên `tiktok-live-connector` đã cài. Mục tiêu:

- Quà không phải combo: xử lý một lần với số lượng hợp lệ.
- Quà combo: **chỉ chốt khi chuỗi đã kết thúc**; tổng kim cương = đơn giá × số lượng đã chốt, không cộng từng update rồi cộng lại ở `repeatEnd`.
- Có trạng thái combo theo khóa định danh hợp lệ (userId, giftId, comboId nếu connector cung cấp), không gộp nhầm hai chuỗi độc lập.
- Có `eventId`/dedup cache TTL để tránh reconnect làm nhận lại quà và cấp item lần hai.
- Nếu thiếu dữ liệu về đơn giá hoặc event kết thúc combo: không đoán; log rõ và có chiến lược an toàn tránh cấp thưởng sai.
- Giá trị/loại quà có thể đổi theo TikTok; ưu tiên dữ liệu sự kiện đã xác thực và cho streamer sửa bảng ánh xạ.

### 7.2 Bảng ánh xạ quà → vật phẩm

Trang cài đặt có bảng:

| Gift ID / tên quà | Điều kiện kim cương | Item | Số lượng | Hiệu ứng | Bật/tắt |
|---|---:|---|---:|---|---|
| Quy tắc mặc định 1 | Dưới 10 | Trà Ngộ Đạo | 1 | Linh trà xuất hiện | Có |
| Quy tắc mặc định 2 | 10–99 | Độ Kiếp Đan | 1 | Đan dược phát sáng | Có |
| Quy tắc mặc định 3 | Từ 100 | Ban Phúc | 1 | Quầng sáng toàn tông môn | Có |

**Ba ngưỡng trên là ánh xạ mẫu đề xuất**, không phải danh sách quà bắt buộc. Bản thiết kế gốc cho phép streamer **chọn quà nào ứng với item nào sau**. `Biến Dị Linh Căn` và `Quay Cam` phải có sẵn trong lựa chọn; không hardcode chỉ 3 món.

- Thêm, sửa, xóa quy tắc; có kiểm tra trùng/ưu tiên giftId so với dải kim cương.
- Lưu vào `caidat.json` theo cách atomic; khi reload/restart phải giữ.
- Có **test mapping** bằng cách chọn một quà trong demo và thấy vật phẩm/hiệu ứng tương ứng.
- Không nhất thiết đưa người tặng quà vào chiến trường nếu họ chưa nhập môn; trong trường hợp này có thể giữ quà ở danh sách chờ nhận hoặc hiển thị hiệu ứng cảm ơn, nhưng phải có luật công khai và không làm thất lạc dữ liệu.
- **Không cấp EXP ngay giữa battle**; vật phẩm tăng tu vi chờ sang cultivation.
- Quy tắc giới hạn cộng dồn, Pmax độ kiếp và cooldown camera phải dùng service từ Giai đoạn 2.

## 8. Phản ứng hình ảnh trực tiếp trên `/song`

- `nhập môn`: cổng truyền tống, tên người mới, nhân vật xuất hiện.
- `tu luyện`: nhân vật tỏa linh khí, thanh tu vi cập nhật có kiểm soát.
- `1`: kiếm khí theo animation combat, số sát thương (nếu bật).
- `2`: thiên lôi xuống quái/boss.
- `tim`: thanh Nguyện Lực Tông Môn tăng, mốc đầy có hiệu ứng.
- `theodoi`/`vao`: ticker nhỏ không cản màn boss.
- `qua`: tên người tặng nổi bật vài giây, icon vật phẩm do code dựng, nhân vật có hiệu ứng tương ứng.
- `quay cam`: focus 3 giây, có hàng chờ và ưu tiên với cảnh boss/độ kiếp.

Không tải avatar bằng URL bên ngoài; có thể hiển thị **biểu tượng tạo từ chữ cái đầu hoặc seed hình học**. Tên và bình luận phải được kiểm duyệt trước khi hiện công khai.

## 9. An toàn dữ liệu và chống spam

- Chỉ lắng nghe API admin tại localhost; chặn origin không mong đợi và không mở quyền quản trị cho người xem qua Browser Source.
- Nếu dùng HTTP POST admin/demo: dùng token phiên/CSRF protection phù hợp, không để browser của người khác gọi endpoint đổi cấu hình.
- Tên hiển thị tối đa **20 ký tự**; bình luận có giới hạn độ dài; danh sách từ tục tiếng Việt đặt trong `tucngu.json` để sửa.
- Lọc đầu ra HTML/CSS/text; không render HTML thô từ TikTok.
- Chặn event flooding theo user, loại lệnh và giới hạn event/giây.
- Log các lỗi kết nối, tránh ghi liên tục thông tin nhạy cảm hay khóa ký.
- Nếu có khóa dịch vụ ký, không broadcast sang `/song`, không ghi vào console/client; lưu một cách hạn chế hoặc nhập lại nếu không lưu an toàn.
- Không có giao dịch trả tiền trong app, không có phần thưởng giá trị tiền thật, không ép người xem tặng quà.

## 10. Chế độ Thử không cần LIVE hoàn chỉnh

Bảng demo có các nút/biểu mẫu:

1. Sinh 10/30/60/100 người chơi giả.
2. Gửi bình luận `nhập môn`, `tu luyện`, `điểm danh`, `1`, `2`.
3. Gửi 1/10/100/1.000 tim giả (tùy cấu hình).
4. Gửi sự kiện theo dõi và vào phòng.
5. Chọn giá trị quà nhỏ/vừa/lớn, test từng vật phẩm.
6. Mô phỏng **combo với nhiều update + repeatEnd** và kiểm tra chỉ cấp một lần.
7. Mô phỏng mất kết nối/reconnect, lỗi LIVE chưa bắt đầu.
8. Tăng tốc đồng hồ test theo cơ chế demo đã có để kiểm tra vòng 10+5 và thưởng.

Demo có nhãn rõ **ĐANG DÙNG DỮ LIỆU MÔ PHỎNG**; không gửi sự kiện giả lên TikTok thật. Dữ liệu demo lưu riêng.

## 11. Kiểm thử bắt buộc

| Mã | Ca kiểm thử | Kỳ vọng |
|---|---|---|
| 04-01 | Nhập username, nối khi kênh chưa LIVE | Báo lỗi tiếng Việt, game vẫn chạy |
| 04-02 | Bấm NGẮT khi đang kết nối | Đóng đúng kết nối, không tự reconnect |
| 04-03 | Rớt mạng bất ngờ | Reconnect sau 5 giây, tối đa 10 lần |
| 04-04 | Thử NỐI liên tục | Không sinh nhiều kết nối/listener song song |
| 04-05 | Comment `nhập môn`/`NHAP MON` | Cùng một lệnh; không tạo trùng user |
| 04-06 | Comment `1`/`2` trong battle | Gây damage đúng và khóa cooldown |
| 04-07 | Comment `1`/`2` trong cultivation | Không đánh quái hay tạo damage |
| 04-08 | Gift đơn | Cấp item đúng bảng một lần |
| 04-09 | Gift combo nhiều update | Chỉ cấp theo tổng khi kết thúc, không đếm trùng |
| 04-10 | Gửi lại cùng eventId | Không cấp lại thưởng |
| 04-11 | Gift khi battle | Item tăng tu vi giữ chờ, EXP không đổi |
| 04-12 | Sửa bảng ánh xạ rồi restart | Giữ cấu hình và áp dụng đúng |
| 04-13 | Gửi tim lặp và tim tổng | Không đếm trùng hoặc tạo vô hạn hiệu ứng |
| 04-14 | Theo dõi/vào phòng 20 lần | Ticker được rate-limit |
| 04-15 | Tên có HTML, XSS, từ cấm | Hiển thị an toàn, lọc/cắt đúng |
| 04-16 | Ngắt kết nối TikTok | `/song` và mô phỏng nội bộ không bị dừng |
| 04-17 | Thử demo toàn luồng | Hoạt động không cần LIVE, không ghi đè dữ liệu thật |
| 04-18 | Kiểm thử với kênh LIVE thật | Chỉ PASS khi đã thực sự nhận sự kiện ở phiên LIVE hợp lệ |

Kiểm thử 04-18 bắt buộc ghi `CHƯA KIỂM CHỨNG` nếu không có buổi LIVE thật. Các tính năng còn lại phải được tự động hóa hoặc thử thủ công bằng demo.

## 12. Điều kiện nghiệm thu

- [ ] Connector dùng API từ README của đúng phiên bản đã cài.
- [ ] UI NỐI/NGẮT, trạng thái và lỗi tiếng Việt hoạt động.
- [ ] Có reconnect giới hạn và không tạo listener trùng.
- [ ] Bình luận `nhập môn`, `1`, `2` đi vào logic game thật.
- [ ] Tim, theo dõi, vào phòng có phản ứng phù hợp.
- [ ] Quà và combo được tính đúng một lần; ánh xạ lưu được.
- [ ] Vật phẩm không bypass quy tắc khóa EXP khi chiến đấu.
- [ ] Có chế độ thử không LIVE đủ tất cả trường hợp quan trọng.
- [ ] Không sử dụng avatar/asset tải ngoài cho đồ họa.
- [ ] Ghi rõ tính năng nào đã test với LIVE thật, tính năng nào chưa.
- [ ] `PROGRESS.md` cập nhật đầy đủ.

**Dừng tại đây**; Giai đoạn 5 là hoàn thiện streamer UI, âm thanh, tối ưu và kiểm thử end-to-end.
