# PROMPT XÂY DỰNG GAME TU TIÊN TƯƠNG TÁC TIKTOK LIVE 3D

## 1. VAI TRÒ VÀ MỤC TIÊU

Bạn là một lập trình viên game senior, chuyên về Three.js, Node.js, hệ thống sự kiện thời gian thực, đồ họa 3D procedural và tối ưu hiệu năng cho livestream.

Hãy xây dựng cho tôi một game tương tác TikTok LIVE hoàn chỉnh có tên:

**TU TIÊN LIVE – VẠN GIỚI TRANH PHONG**

Đây là game tu tiên nhiều người chơi, trong đó khán giả TikTok LIVE có thể nhập môn, tu luyện, tăng cảnh giới, độ kiếp và tham gia chiến đấu tiêu diệt yêu ma thông qua bình luận, thả tim và tặng quà.

Game hoạt động trên máy Windows của streamer và được phát trực tiếp qua TikTok LIVE Studio hoặc OBS.

**Yêu cầu quan trọng nhất: Không cần chuẩn bị bất kỳ tài nguyên hình ảnh, nhân vật, bản đồ, mô hình 3D, animation, texture hay âm thanh nào.**

Tất cả phải được tự dựng bằng code, sử dụng hình học 3D, shader, CSS, Canvas và thuật toán.

Đây phải là game có nhân vật chuyển động, thế giới 3D, tương tác thực sự và trạng thái game được tính toán bằng logic, không phải một trang web chỉ hiển thị các thanh tiến trình giả lập.

Hãy hoàn thành toàn bộ dự án trong một lần thực hiện, không hỏi lại. Những điểm chưa được quy định thì tự lựa chọn giải pháp đơn giản, hợp lý, dễ bảo trì.

Không được thay thế chức năng thực bằng các nút giả hoặc chỉ trình diễn giao diện.

---

## 2. SẢN PHẨM CẦN BÀN GIAO

Tạo một dự án Node.js có thể chạy trên Windows.

Cấu trúc tham khảo:

```text
TuTienLive/
├── chay.bat
├── package.json
├── server.js
├── gameEngine.js
├── tiktokAdapter.js
├── caidat.json
├── tucngu.json
├── data/
│   └── players.json
├── public/
│   ├── index.html
│   ├── song.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── scene.js
│       ├── characters.js
│       ├── cultivation.js
│       ├── battle.js
│       ├── effects.js
│       ├── camera.js
│       ├── audio.js
│       └── overlay.js
└── HUONGDAN.md
```

Có thể điều chỉnh cấu trúc nếu giúp chương trình đơn giản hơn.

### Công nghệ

- Node.js: máy chủ và xử lý trạng thái game.
- Express: trang cài đặt và trang game.
- WebSocket (`ws`): truyền trạng thái và sự kiện tức thời.
- Three.js: dựng môi trường 3D, nhân vật, hiệu ứng.
- `tiktok-live-connector`: nhận sự kiện TikTok LIVE.
- Web Audio API: tạo âm thanh bằng code.
- Speech Synthesis API: đọc tên người chơi khi độ kiếp, phát thông báo.
- JSON: lưu cấu hình, người chơi, chỉ số và tiến trình.

Three.js phải được cài qua npm và phục vụ từ máy local, không phụ thuộc CDN khi chạy game.

Không dùng React, Vue, Unity, Unreal Engine, Blender, phần mềm dựng nhân vật, asset pack hay bước build phức tạp.

Không sử dụng API AI trả phí.

### Cách khởi chạy

Người không biết lập trình chỉ cần:

1. Cài Node.js phiên bản LTS.
2. Nháy đúp `chay.bat`.
3. Lần đầu chương trình tự cài thư viện bằng npm.
4. Sau đó tự khởi động máy chủ.
5. Tự mở `http://localhost:3000`.
6. Nhập tên TikTok và nhấn **KẾT NỐI**.
7. Thêm `http://localhost:3000/song` vào TikTok LIVE Studio hoặc OBS.

Công cụ không tự khởi động buổi LIVE; streamer vẫn phải mở LIVE bằng TikTok hoặc LIVE Studio.

`chay.bat` phải phát hiện trường hợp chưa cài Node.js và hiện hướng dẫn rõ ràng bằng tiếng Việt.

---

# PHẦN I – THẾ GIỚI GAME 3D

## 3. THẾ GIỚI TU TIÊN

Thiết kế một thế giới tiên hiệp 3D có phong cách low-poly fantasy, huyền ảo, rực rỡ nhưng không quá nặng máy.

### Khu vực 1: Tông môn

Đây là nơi người chơi xuất hiện và tu luyện.

Cảnh vật bao gồm:

- Một tông môn nằm trên đỉnh núi nổi giữa biển mây.
- Chính điện lớn với mái ngói cong và đèn lồng.
- Sân tu luyện có trận pháp hình tròn phát sáng.
- Nhiều bệ đá nơi đệ tử ngồi thiền.
- Tháp tiên, cổng tông môn, cây cổ thụ.
- Kiếm bay, những hạt linh khí chuyển động trong không khí.
- Thác nước, núi xa, mây trôi và ánh sáng mặt trời.
- Phía trên là bầu trời chuyển dần từ ban ngày sang hoàng hôn.

Mọi vật thể tạo bằng `BoxGeometry`, `SphereGeometry`, `CylinderGeometry`, `ConeGeometry`, `BufferGeometry`, vật liệu và shader.

Không tải bất kỳ mô hình, texture hoặc hình ảnh nào từ bên ngoài.

### Khu vực 2: Đài độ kiếp

Là bệ đá tròn bay trên không, bao quanh bởi những vòng trận pháp.

Khi người chơi độ kiếp:

1. Camera chuyển sang đài độ kiếp.
2. Nhân vật xuất hiện giữa trận pháp.
3. Bầu trời tối lại.
4. Mây đen xoáy phía trên.
5. Thiên lôi đánh xuống từng đợt.
6. Có hiệu ứng rung camera, ánh chớp và điện tích.
7. Thiên Đạo đọc tên người chơi.
8. Hiện kết quả thành công hoặc thất bại.

### Khu vực 3: Chiến trường diệt ma

Thiết kế chiến trường với:

- Núi đá, vùng đất nứt và dung nham phát sáng.
- Cổng ma giới.
- Quái vật xuất hiện từng đợt.
- Các đệ tử tự động chiến đấu.
- Ba boss có ngoại hình và kỹ năng khác nhau.
- Các hiệu ứng kiếm khí, pháp thuật, nổ linh lực.

Có 11 chiến trường ứng với 11 cảnh giới. Mỗi chiến trường có logic chiến đấu và boss riêng, không được gộp tất cả người chơi vào cùng một boss.

Để tối ưu hiệu năng, chỉ dựng chi tiết chiến trường mà camera đang quan sát; các chiến trường còn lại vẫn được máy chủ mô phỏng độc lập.

---

## 4. TỰ TẠO NHÂN VẬT 3D

Không dùng model hoặc sprite có sẵn.

Tạo nhân vật chibi tu tiên bằng hình học 3D.

### Cấu tạo

- Đầu lớn hình cầu.
- Thân mặc đạo bào.
- Hai tay, hai chân.
- Tóc búi hoặc tóc dài.
- Thanh kiếm hoặc pháp khí.
- Vòng linh khí quanh người.
- Tên và cảnh giới hiển thị phía trên đầu.

Nhân vật phải có chuyển động:

- Ngồi thiền.
- Đứng dậy.
- Đi bộ.
- Chạy.
- Bay.
- Chắp tay.
- Vung kiếm.
- Thi triển pháp thuật.
- Bị thiên lôi đánh.
- Bị thương.
- Ăn mừng khi đột phá.

Các animation thực hiện bằng thay đổi vị trí, phép xoay và nội suy các bộ phận theo thời gian. Không sử dụng file animation bên ngoài.

### Cá nhân hóa nhân vật

Khi người xem nhập môn, tự tạo nhân vật với:

- Màu đạo bào khác nhau.
- Kiểu tóc khác nhau.
- Màu linh khí khác nhau.
- Kiếm hoặc pháp khí khác nhau.
- Đặc điểm ngoại hình ngẫu nhiên nhưng nhất quán.

Sử dụng TikTok user ID để tạo seed cố định, bảo đảm một người quay lại vẫn có cùng nhân vật.

Cảnh giới càng cao, nhân vật càng có hiệu ứng mạnh:

- Phàm Nhân: trang phục đơn giản.
- Luyện Khí: linh khí mờ.
- Trúc Cơ: hào quang nhẹ.
- Kim Đan: kim quang xoay quanh người.
- Nguyên Anh: linh thể nhỏ phía sau.
- Hóa Thần: kiếm khí và phù văn.
- Luyện Hư: các hạt không gian.
- Hợp Thể: vòng pháp trận.
- Đại Thừa: cánh ánh sáng hoặc linh khí lớn.
- Độ Kiếp: tia sét quanh người.
- Phi Thăng: thần quang và pháp luân.

Không để hiệu ứng che kín màn hình.

Chỉ render chi tiết tối đa khoảng 40–60 nhân vật đang được camera quan sát. Các người chơi còn lại vẫn tồn tại trong hệ thống và được cập nhật bình thường.

---

# PHẦN II – NGƯỜI XEM TIKTOK

## 5. KẾT NỐI TIKTOK LIVE

Sử dụng thư viện `tiktok-live-connector`.

Đây là thư viện không chính thức, API có thể thay đổi. Sau khi cài thư viện, đọc tài liệu của đúng phiên bản đã cài rồi mới viết code kết nối.

Không tự phỏng đoán tên class, sự kiện hoặc thuộc tính.

Chuẩn hóa các sự kiện về cấu trúc:

```js
{
  loai: "qua|binhluan|tim|theodoi|vao",
  userId: "",
  ten: "",
  avatar: "",
  qua: "",
  soKimCuong: 0,
  soLuong: 1,
  noiDung: "",
  eventId: "",
  timestamp: 0
}
```

Yêu cầu:

- Bình luận nhận được gần thời gian thực.
- Tim được cộng theo số lượng thực tế của sự kiện, có giới hạn để tránh quá tải.
- Quà combo chỉ tính đúng một lần theo tổng số lượng hợp lệ.
- Chống trùng sự kiện.
- Tự kết nối lại sau khi mất mạng.
- Có trạng thái kết nối rõ ràng.
- Có thông báo lỗi tiếng Việt.
- Không làm treo game khi TikTok ngắt kết nối.
- Có ô cấu hình khóa dịch vụ ký nếu phiên bản connector cần.
- Nếu không thể kết nối LIVE thật, hệ thống vẫn phải chạy ở chế độ demo.

Không tải avatar ngoài mạng để hiển thị; có thể thay bằng avatar hình học được tạo tự động.

Không gửi dữ liệu người chơi đến dịch vụ nào khác ngoài những trao đổi cần thiết với TikTok để nhận sự kiện.

---

## 6. NHẬP MÔN

Khi người xem bình luận:

**nhập môn**

Hệ thống tự động:

1. Lấy user ID và tên TikTok.
2. Kiểm tra người này đã có nhân vật chưa.
3. Nếu chưa có, tạo tài khoản tu tiên.
4. Tạo nhân vật 3D.
5. Đưa nhân vật vào sân tông môn.
6. Hiện thông báo nhập môn.
7. Bắt đầu tu luyện tự động.

Hiệu ứng:

- Một cổng truyền tống xuất hiện.
- Chùm sáng chiếu xuống.
- Nhân vật bước ra khỏi cổng.
- Camera tập trung khoảng 2 giây nếu không có sự kiện quan trọng hơn.
- Dòng chữ hiện lên:

**[Tên người chơi] đã gia nhập tông môn!**

Nếu người chơi đã tồn tại, chỉ chào mừng quay lại, không tạo trùng nhân vật.

Bình luận không phân biệt chữ hoa, chữ thường hoặc dấu tiếng Việt.

---

# PHẦN III – HỆ THỐNG TU LUYỆN

## 7. CHU KỲ GAME

Game tự chạy theo chu kỳ:

**10 phút tu luyện → 5 phút diệt ma → lặp lại.**

Thời gian phải chỉnh được trong trang cài đặt.

### Giai đoạn tu luyện

Cho phép:

- Tăng tu vi tự động theo thời gian.
- Dùng vật phẩm.
- Nâng tiểu cảnh giới.
- Độ kiếp.
- Thực hiện nhiệm vụ.
- Nhận quà hỗ trợ.
- Hiển thị tiến độ tu luyện.

### Giai đoạn diệt ma

- Đóng băng hoàn toàn tu vi tự động.
- Không áp dụng vật phẩm tăng tu vi.
- Không nâng cảnh giới.
- Không tổ chức độ kiếp.
- Tất cả nhân vật chuyển sang chiến trường tương ứng.
- Nhân vật tự động chiến đấu.
- Bình luận để sử dụng kỹ năng.
- Kết thúc trận mới trao thưởng và áp dụng tiến độ tu luyện.

Vật phẩm nhận trong lúc chiến đấu được giữ lại để sử dụng ở giai đoạn tu luyện.

Các hiệu ứng tăng tu vi có thời hạn phải tạm dừng thời gian hiệu lực khi sang giai đoạn chiến đấu, sau đó tiếp tục tính thời gian khi trở về tông môn.

---

## 8. HỆ THỐNG 11 CẢNH GIỚI

Giữ các cảnh giới và chỉ số sau:

| Cảnh giới | HP | ATK | DEF | Tu vi/giây |
|---|---:|---:|---:|---:|
| Phàm Nhân | 100 | 10 | 5 | 2 |
| Luyện Khí | 180 | 18 | 9 | 2 |
| Trúc Cơ | 320 | 32 | 16 | 2 |
| Kim Đan | 560 | 56 | 28 | 2 |
| Nguyên Anh | 980 | 98 | 49 | 2 |
| Hóa Thần | 1720 | 172 | 86 | 2 |
| Luyện Hư | 3010 | 301 | 151 | 2 |
| Hợp Thể | 5270 | 527 | 264 | 2 |
| Đại Thừa | 9220 | 922 | 461 | 2 |
| Độ Kiếp | 16140 | 1614 | 807 | 2 |
| Phi Thăng | 28240 | 2824 | 1412 | 2 |

Mỗi cảnh giới thông thường có các mốc:

Sơ Kỳ → Trung Kỳ → Hậu Kỳ → Viên Mãn.

Chỉ số tăng theo tầng:

`ChiSo = ChiSoGoc * (1 + 0.1 * k)`

Trong đó:

- k = 0: Sơ Kỳ.
- k = 1: Trung Kỳ.
- k = 2: Hậu Kỳ.

Khi đạt Viên Mãn, nhân vật đủ điều kiện độ kiếp để chuyển sang cảnh giới kế tiếp.

Theo `docs/Tailieu/Logic_Tang_Tu_vi.md` phần1 (07/11/2026), tốc độ gốc là **2 tu vi/giây cho mọi cảnh giới**, không tăng theo tiểu cảnh giới. Cấu hình cũ được đọc với tốc độ mới, giữ chỉ số chiến đấu và ngưỡng nâng tầng.

Phi Thăng là cảnh giới cao nhất ở phiên bản đầu; tu vi tích lũy dùng cho danh hiệu, thành tựu hoặc công pháp, không tăng sang cảnh giới mới.

### Tu vi cần nâng tầng

| Cảnh giới | Sơ → Trung | Trung → Hậu | Hậu → Viên Mãn |
|---|---:|---:|---:|
| Phàm Nhân | 100 | 150 | 200 |
| Luyện Khí | 180 | 270 | 360 |
| Trúc Cơ | 320 | 480 | 640 |
| Kim Đan | 560 | 840 | 1120 |
| Nguyên Anh | 900 | 1350 | 1800 |
| Hóa Thần | 1450 | 2175 | 2900 |
| Luyện Hư | 2300 | 3450 | 4600 |
| Hợp Thể | 3700 | 5550 | 7400 |
| Đại Thừa | 6000 | 9000 | 12000 |
| Độ Kiếp | 9600 | 14400 | 19200 |

Các giá trị được lưu thành bảng cấu hình có thể điều chỉnh.

Phải tính tu vi theo thời gian thực trên máy chủ, không phụ thuộc FPS của giao diện.

Khi thanh tu vi đầy, tự nâng tiểu cảnh giới. Khi đã Viên Mãn, tự đưa nhân vật vào hàng chờ độ kiếp.

### Tu vi từ tim

- Mỗi tim hợp lệ cộng ngay vào nguyên lực tông môn; đồng thời người thả tim đã có nhân vật nhận **2 tu vi/tim**. Tim của người chưa nhập môn chỉ tăng nguyên lực, không tự tạo nhân vật hoặc giữ tu vi hồi tố.
- Theo lựa chọn của người dùng, **chỉ tu vi cá nhân được gom chuỗi**: riêng từng người, đủ100 tim thì chốt; phần dư dưới100 chốt khi người đó ngừng thả1 giây. Đầu vào lớn được xử lý theo nhóm100 và giữ phần dư; không nhân lên theo số người trong tông môn.
- Hệ số Trà, Ban Phúc và Linh Căn hiện hữu áp dụng cho cả tu vi theo giây và theo tim. Ví dụ một Trà x2: **4 tu vi/giây và4 tu vi/tim**. Giữ cách cộng hệ số và giới hạn mặc định x8, Ban Phúc lặp chỉ nối thời gian. Đan/Quay Cam không tăng tu vi.
- Ghi nhận hệ số tại lúc nhận tim; buff kết thúc hoặc kích hoạt thêm trong khi chờ chốt không tính lại tim cũ. Ban Phúc do chính mốc tim kích hoạt áp dụng từ những tim tiếp theo.
- Diệt ma/tạm dừng/dừng: nguyên lực vẫn nhận ngay; tu vi cá nhân chốt vào phần chờ, chỉ áp dụng khi trở lại tu luyện, không nhân hệ số thêm lần nữa. Đồng hồ buff và tu vi tự động vẫn đóng băng.
- Node chịu trách nhiệm đếm/chốt/lưu, chống trùng event và đối chiếu tổng tim phòng như trước. Phần tăng của tổng phòng vượt số tim trong event chỉ tăng nguyên lực, không gán tim không rõ chủ cho nhân vật gửi event. DEMO/LIVE độc lập; chuỗi dở và biên nhận lưu cùng trạng thái, khởi động lại không tính bù tu vi thời gian offline hoặc trả hai lần. Unity chỉ đọc snapshot.

---

## 9. ĐỘ KIẾP

Mỗi lần độ kiếp có một hoạt cảnh khoảng 10–20 giây.

### Tỷ lệ thành công

| Đột phá lên | Tỷ lệ MIN | Tỷ lệ MAX |
|---|---:|---:|
| Luyện Khí | 90% | 100% |
| Trúc Cơ | 80% | 98% |
| Kim Đan | 70% | 95% |
| Nguyên Anh | 60% | 90% |
| Hóa Thần | 50% | 85% |
| Luyện Hư | 40% | 80% |
| Hợp Thể | 35% | 75% |
| Đại Thừa | 30% | 70% |
| Độ Kiếp | 25% | 65% |
| Phi Thăng | 20% | 60% |

Áp dụng công thức:

`P = min(Pmax, Pmin + B + F)`

Trong đó:

- Pmin: tỷ lệ tối thiểu.
- Pmax: tỷ lệ tối đa.
- B: điểm cộng từ chuẩn bị, nhiệm vụ và vật phẩm.
- F: điểm bảo hộ sau những lần thất bại.

Các giới hạn vật phẩm không được vượt tỷ lệ tối đa của cảnh giới.

### Khi thất bại

- Không mất cảnh giới.
- Không mất tu vi.
- Nhân vật bị thiên lôi đánh trọng thương.
- Phải chờ 60 giây tu luyện thực tế để thử lại.
- Mỗi lần thất bại nhận thêm 8 điểm phần trăm bảo hộ.
- Bảo hộ thông thường tối đa 24 điểm phần trăm.
- Có cơ chế tích lũy Thiên Mệnh miễn phí để bảo đảm thành công sau nhiều lần thất bại.

Số lần cần tích lũy cho nghi thức bảo đảm có thể mặc định là 5, chỉnh được trong cài đặt.

### Hoạt cảnh

1. Camera bay đến đài độ kiếp.
2. Hiện tên và cảnh giới.
3. Giọng Thiên Đạo xướng tên.
4. Sét đánh xuống.
5. Nhân vật thi triển linh lực chống đỡ.
6. Hiển thị kết quả.
7. Nếu thành công: hào quang nổ sáng, thay đổi ngoại hình.
8. Nếu thất bại: nhân vật quỳ xuống, linh khí suy yếu.

Nếu nhiều người độ kiếp cùng lúc, phải dùng hàng chờ ưu tiên và giới hạn số hoạt cảnh nổi bật để không ảnh hưởng tốc độ game.

Tất cả kết quả độ kiếp được tính chính xác ở máy chủ, không để trình duyệt tự quyết định xác suất.

---

# PHẦN IV – VẬT PHẨM VÀ QUÀ TIKTOK

## 10. HỆ THỐNG VẬT PHẨM

Thiết kế 5 vật phẩm ban đầu.

### Trà Ngộ Đạo

- Tăng x2 tốc độ nhận tu vi.
- Kéo dài 30 giây tu luyện thực tế.
- Hiệu ứng: chén trà phát sáng, linh khí xoay quanh nhân vật.

### Biến Dị Linh Căn

- Tăng x2 tốc độ tu luyện cơ bản vĩnh viễn cho nhân vật.
- Mỗi người chỉ nhận hiệu ứng vĩnh viễn này một lần trong V1.
- Hiệu ứng: cột sáng đổi màu và vòng linh căn xuất hiện.

### Độ Kiếp Đan

- Cộng 10 điểm phần trăm tỷ lệ thành công độ kiếp.
- Có thể tích lũy nhiều viên theo giới hạn.
- Nếu tỷ lệ gốc dưới 50%, tổng hỗ trợ từ vật phẩm không được vượt mức 85%, đồng thời vẫn phải tuân thủ Pmax của cảnh giới.
- Hiệu ứng: viên đan bay đến nhân vật và tan thành kim quang.

### Ban Phúc

- Toàn bộ đệ tử được x2 tốc độ tu luyện trong 30 giây.
- Có hiệu ứng thiên quang chiếu xuống tông môn.
- Theo `docs/UI_BANPHUC.md` (07/11/2026), kích hoạt thêm Ban Phúc **cộng30 giây vào thời gian còn lại**, giữ một hiệu ứng x2, không tạo thêm hệ số x4/x6 từ riêng Ban Phúc. Thời gian chỉ giảm trong tu luyện thực tế; diệt ma, pause và dừng giữ nguyên.
- Quà được ánh xạ thành vật phẩm Ban Phúc qua bảng quà hiện hữu; vật phẩm chờ/nhập môn vẫn theo luật hiện có. Mỗi lần tông môn tăng cấp1→2 hoặc2→3 tự kích hoạt thêm30 giây; làm đầy MAX của cấp3 không phải lên cấp. Một sự kiện vượt hai cấp cộng60 giây; chống trùng vẫn do backend.
- Bảng Ban Phúc trong Unity Concept02 nằm ngay dưới Thiên Đạo Thông Cáo, hiện khi còn hiệu lực và tự ẩn khi hết hoặc mất kết nối; chữ “x2 tốc độ tu luyện”, đồng hồ và thanh tiến độ đọc snapshot server. Tách DEMO/LIVE, lưu qua restart và không tính bù thời gian offline. Save cũ nhiều Ban Phúc được gộp thành một hiệu ứng x2 với tổng thời gian còn lại, giữ toàn bộ thời gian và người chơi.

Các nguồn khác nhau vẫn theo quy tắc cộng hệ số: ví dụ Trà x2 và Ban Phúc x2 đồng thời thành x4; không nhân chồng tự do. Nhiều Ban Phúc chỉ kéo dài thời gian theo quy tắc trên.

Có giới hạn tổng hệ số mặc định x8 để tránh phá vỡ cân bằng; streamer có thể chỉnh.

### Quay Cam

- Camera tập trung vào nhân vật người kích hoạt trong 3 giây.
- Tên và cảnh giới hiện nổi bật.
- Nhân vật biểu diễn động tác đặc biệt.
- Camera trở lại bố cục trước đó sau khi hết thời gian.

Nếu có nhiều yêu cầu quay cam, đưa vào hàng chờ và chống spam.

---

## 11. BẢNG ÁNH XẠ QUÀ

Trang cài đặt cho phép streamer lựa chọn:

- Tên quà TikTok.
- Giá trị kim cương.
- Vật phẩm tương ứng.
- Số lượng vật phẩm.
- Hiệu ứng hình ảnh.
- Thời gian xuất hiện thông báo.
- Giới hạn kích hoạt.

Cung cấp bảng mặc định dựa trên mức kim cương, có thể thay đổi.

Giữ bảng dải giá mặc định và quy tắc nhập thủ công. Ngoại lệ theo yêu cầu phần4 `Qua_Tbao.md` (08/11/2026): cung cấp ba lựa chọn quà có sẵn bằng ảnh local như mô tả bên dưới; không thay các quy tắc đã lưu nếu streamer chưa chọn/lưu lại.

Quà combo phải được xử lý để không cộng trùng.

Khi người xem tặng quà:

1. Nhận và kiểm tra sự kiện.
2. Xác định người nhận vật phẩm.
3. Cập nhật dữ liệu game.
4. Đưa hiệu ứng vào hàng chờ.
5. Camera có thể chuyển sang người tặng nếu phù hợp.
6. Hiện tên người tặng.
7. Phát âm thanh và hiệu ứng tương ứng.

Không được tự tạo giao dịch, yêu cầu thanh toán hoặc đưa người xem đến trang mua hàng.

Quà TikTok chỉ kích hoạt tài nguyên ảo trong game. Không có vật phẩm quy đổi ra tiền, phần thưởng ngoài đời, mã quà hay tài sản có giá trị thực.

---

## 12. NHIỆM VỤ MIỄN PHÍ

Người không tặng quà vẫn phải có thể phát triển và đạt cảnh giới cao nhất.

Bổ sung hệ thống nhiệm vụ miễn phí.

Ví dụ:

| Hành động | Phần thưởng đề xuất |
|---|---|
| Bình luận "nhập môn" lần đầu | Nhận nhân vật và vật phẩm khởi đầu |
| Bình luận "tu luyện" hợp lệ | Nhận một lượng tu vi nhỏ |
| Bình luận "điểm danh" mỗi phiên | Nhận vật phẩm thường |
| Tham gia đủ một trận diệt ma | Nhận thưởng hoàn thành |
| Đánh bại boss cùng chiến trường | Nhận điểm nhiệm vụ |
| Tu luyện đủ thời gian | Nhận Thiên Mệnh |
| Hoàn thành chuỗi nhiệm vụ | Đổi vật phẩm hỗ trợ độ kiếp |
| Đạt cột mốc tim cộng đồng | Toàn tông môn nhận phúc lợi |

Các giá trị phần thưởng và cooldown phải cấu hình được.

### Cài đặt quà tặng — phần 1 và phần 4 `Qua_Tbao.md`, cập nhật 08/11/2026

- Theo xác nhận người dùng ở phần4: bỏ toàn bộ tải danh mục quà từ TikTok, gồm nút tải, hộp tìm danh mục, service/cache runtime và API tải. Cache cũ nếu có được giữ trên đĩa nhưng không đọc/ghi nữa. Không ảnh hưởng kết nối sự kiện LIVE.
- Thay bằng ba thẻ ảnh local `public/assets/Qua/`: Hoa hồng/Rose (`5655`,1 xu), Cỏ bốn lá/Shamrock (`9875`,10 xu), Má hồng nhỏ xinh/Tiny Blush (`1473096`,20 xu). Mỗi lựa chọn khớp **đúng ID và đơn giá**, không áp dụng cho mọi quà cùng giá; khóa trường dải giá khi chọn. Metadata là bản tra cứu ngày08/11/2026, nguồn và giới hạn tại `docs/Tailieu_output/QUA_TBAO_PHAN4.md`. Không tải icon/asset ngoài vào ứng dụng.
- Chọn Nhập thủ công để mở lại ID/tên/dải đơn giá. Quy tắc cũ giữ nguyên khi khởi động, không tự gán ba quà hoặc thay vật phẩm/phần thưởng. Vẫn thêm/sửa/xóa/lưu/bật tắt và giữ bản nháp khi đổi trang.
- Quy tắc đã chọn lưu cả ID và tên hiển thị, xét bằng ID và khoảng đơn giá. Quy tắc cũ chỉ có tên hoặc dải giá vẫn hợp lệ; ưu tiên ID → tên → dải giá, combo/chống trùng không đổi.
- Bình luận native connector2.5.0 dùng `content` (vẫn hỗ trợ `comment` cũ), chạy qua chuẩn hóa/chống trùng/CommandRouter, `nhập môn` tạo hoặc chào lại đúng user ID. Không có nội dung hợp lệ phải ghi rõ lỗi, không âm thầm coi là bình luận rỗng.
- Trang chủ → Kết nối → Nhật ký bình luận & follow hiển thị20 bản ghi gần nhất từ dashboard quản trị, cập nhật khoảng2 giây; backend giữ tối đa50 bản ghi trong RAM, có nội dung đã lọc, kết quả lệnh/lý do lỗi/follow có giới hạn tần suất. Không lưu lịch sử bình luận xuống save hoặc gửi qua WebSocket công khai/Unity. Follow không tự tạo nhân vật hoặc phát thêm quà.
- Phần mốc tim lặp lại/cooldown của phần1 được **thay thế** bằng bảng cấp tông môn ở phần3 bên dưới. Không tiếp tục tự thưởng điểm/phúc lợi lặp từ wishThreshold; các phần thưởng cũ đã chốt và đang chờ vẫn được giữ, dùng khi về tu luyện.

### Nguyên lực và cấp tông môn — phần 3 `Qua_Tbao.md`, 07/11/2026

- Bỏ bảng “Kết nối & Nguyện Lực” và mốc tim lặp lại trong Cài đặt. Thay bằng **Cấp | Số lượng tim | Quà | Số lượng thưởng | Phạm vi**. Cài đặt reconnect chuyển vào thông tin kết nối ở Trang chủ, không bỏ khả năng chỉnh kết nối.
- Theo lựa chọn người dùng: chọn **trực tiếp vật phẩm game** Trà Ngộ Đạo, Độ Kiếp Đan, Ban Phúc, Biến Dị Linh Căn hoặc Quay Cam; có “Không thưởng”. Chỉ có phạm vi **Toàn tông môn**; không cấp quà TikTok thật và không ràng buộc bảng cấp với giá/ID quà TikTok.
- Cấu hình `sectLevels` có1–50 dòng liên tiếp, mỗi dòng `{level,likes,reward:{item,quantity}|null,scope:'all'}`. Số tim1–1.000.000.000/cấp, số lượng thưởng1–100. Có thêm cấp và xóa cấp cuối, không đổi thứ tự các mốc đã nhận thưởng.
- Khởi đầu cấp1. Mỗi dòng quy định số tim **riêng cần để hoàn tất cấp đang hiển thị**: đủ tim thì chốt quà một lần rồi sang cấp tiếp; dòng cuối đủ tim chốt quà một lần và giữ MAX. Tim dư chuyển tiếp qua nhiều cấp. Khi MAX, không tích thêm tim vượt bảng; có thể thêm cấp để tiếp tục.
- Mặc định giữ ba mốc1.000/3.000/5.000: hoàn tất cấp1 và2 mỗi mốc Ban Phúc×1, cấp3 mặc định Không thưởng; tổng9.000 tim đầy cấp3 như trước. Người dùng có thể đổi mốc, quà và thêm cấp4 trở lên.
- Trà/Đan/Linh Căn/Quay Cam cấp đúng số lượng cho **từng đệ tử đã có lúc đạt mốc**, qua inbox/túi/ItemService hiện hữu. Không cấp hồi tố cho người nhập môn sau đó; vật phẩm dư/không dùng được giữ trong túi. Battle/paused/stopped giữ vật phẩm, chỉ tự dùng trong cultivation, giữ luật đan/linh căn/camera/buff hiện hữu.
- Ban Phúc là **một lần toàn tông cho mỗi mốc**, thêm số lượng×30 giây, luôn x2, không nhân theo số đệ tử. Ban Phúc được kích hoạt khi chốt thưởng như cơ chế cấp cũ; countdown/EXP đóng băng ngoài cultivation.
- Chỉ cộng tim đã được backend xác nhận/đối soát tổng/chống trùng, kể cả khi chiến đấu/tạm dừng. Quà chỉ phát một lần/cấp, không thêm cooldown lặp. Thưởng bị chặn vì inbox đầy giữ hàng chờ với loại/số lượng/người nhận lúc chốt, không thay theo cấu hình mới và giữ qua restart.
- Lưu tổng tim đã ghi nhận cùng biên nhận cấp đã hoàn tất, tách DEMO/LIVE. Sửa ngưỡng/thêm/xóa cấp giữ tổng tim, **tính lại cấp hiển thị** theo bảng mới (cấp có thể giảm nếu tăng ngưỡng), đánh dấu các mốc đã vượt, không phát thưởng hồi tố hoặc phát lại khi hạ rồi tăng ngưỡng. Không xóa người chơi hoặc đồ đã nhận.
- Save ba cấp cũ `{level,power}` chuyển thành tổng tim theo đúng mốc cũ1.000/3.000/5.000. Save chưa có nguyên lực khởi đầu cấp1/0. Trường wish cũ chỉ giữ để trả nốt pendingPoints/pendingBlessings, không dùng để tạo thêm thưởng.
- Unity chỉ đọc `level/power/threshold/maxLevel/full` từ snapshot, nhận được cấp lớn hơn3 (tối đa50), không tính luật cấp/phần thưởng. Snapshot cũ thiếu maxLevel dùng giới hạn3, thiếu sectEnergy hiển thị chờ dữ liệu.

Người chơi có thể tích lũy điểm nhiệm vụ để đổi những vật phẩm tương đương vật phẩm từ quà TikTok.

Không bắt buộc tặng quà để mở cảnh giới hoặc đạt phần thưởng quan trọng.

Không thiết kế nhiệm vụ khuyến khích spam bình luận. Mỗi hành động có cooldown rõ ràng và không thể nhận thưởng lặp vô hạn.

---

# PHẦN V – DIỆT MA VÀ CHIẾN TRƯỜNG

## 13. HỆ THỐNG CHIẾN TRƯỜNG

Khi giai đoạn tu luyện kết thúc, tất cả nhân vật được chuyển vào 11 chiến trường theo cảnh giới hiện tại.

| Chiến trường | Cảnh giới |
|---|---|
| Phàm Giới | Phàm Nhân |
| Luyện Khí Cốc | Luyện Khí |
| Trúc Cơ Trận | Trúc Cơ |
| Kim Đan Vực | Kim Đan |
| Nguyên Anh Cảnh | Nguyên Anh |
| Hóa Thần Chiến Trường | Hóa Thần |
| Luyện Hư Ma Vực | Luyện Hư |
| Hợp Thể Thiên Vực | Hợp Thể |
| Đại Thừa Ma Giới | Đại Thừa |
| Độ Kiếp Chiến Trường | Độ Kiếp |
| Phi Thăng Thần Vực | Phi Thăng |

Mỗi chiến trường có:

- Số lượng người tham gia riêng.
- Quái vật riêng.
- Boss và máu boss riêng.
- Bảng sát thương riêng.
- Bảng xếp hạng riêng.
- Phần thưởng riêng.

Người chơi có cảnh giới khác nhau không đánh chung một boss.

Trong lúc chiến đấu, khóa cảnh giới dùng để phân chiến trường. Những phần thưởng thay đổi cảnh giới chỉ được xử lý sau khi kết thúc trận.

---

## 14. CHIẾN ĐẤU TỰ ĐỘNG

Người chơi không cần liên tục bình luận.

Mỗi nhân vật tự động:

- Di chuyển đến mục tiêu.
- Tấn công theo tốc độ đánh.
- Gây sát thương dựa trên ATK.
- Nhận sát thương dựa trên HP và DEF.
- Thi triển kỹ năng cơ bản.
- Chuyển sang quái khác khi mục tiêu chết.

Quái thường có số lượng ban đầu khoảng 3 lần số người tham gia, nhưng phải giới hạn số mô hình hiển thị để tránh lag.

Người chơi bị hạ gục có thể hồi sinh sau một khoảng thời gian và tiếp tục đóng góp, không bị xóa nhân vật.

Mô phỏng chiến đấu sử dụng thời gian và tick cố định trên máy chủ, không phụ thuộc animation hay tốc độ khung hình.

---

## 15. KỸ NĂNG QUA BÌNH LUẬN

Trong thời gian chiến đấu, người xem có thể sử dụng kỹ năng bằng bình luận.

### Bình luận "1"

**Kiếm Khí Trảm**

- Gây x2 sát thương.
- Hồi chiêu 10 giây.
- Nhân vật vung kiếm tạo lưỡi kiếm khí lớn.

### Bình luận "2"

**Thiên Lôi Quyết**

- Gây x3 sát thương.
- Hồi chiêu 25 giây.
- Một tia thiên lôi đánh thẳng xuống mục tiêu.

Đặc điểm:

- Cooldown tính theo từng người.
- Bình luận trong cooldown không gây thêm sát thương.
- Sát thương phải tính vào bảng đóng góp.
- Phát hiệu ứng phù hợp, không cần file animation.

Bình luận chỉ có tác dụng khi người chơi đang tham gia trận chiến.

---

## 16. BA BOSS TRONG MỘT TRẬN

Mỗi trận kéo dài 300 giây.

### Boss 1 – Ma Binh Thống Lĩnh

Xuất hiện trong khoảng 0–90 giây.

- Độ khó thấp.
- Máu và phòng ngự thấp.
- Dùng để khởi động trận đấu.
- Ngoại hình: chiến binh ma khổng lồ, giáp đen, mắt đỏ.
- Kỹ năng: vung rìu, sóng xung kích.

### Boss 2 – Huyết Ma Tướng Quân

Xuất hiện trong khoảng 100–190 giây.

- Nhiều máu hơn.
- Có giáp phòng thủ.
- Có đòn đánh diện rộng.
- Ngoại hình: tướng quân ma mặc giáp đỏ.
- Kỹ năng: huyết kiếm, triệu hồi ma binh.

### Boss 3 – Vạn Kiếp Ma Tôn

Xuất hiện trong khoảng 200–290 giây.

- Boss mạnh nhất.
- Có nhiều giai đoạn.
- Ngoại hình lớn, nhiều linh khí tím đen.
- Kỹ năng: thiên thạch, chưởng ma, lốc năng lượng.
- Khi máu xuống thấp, kích hoạt trạng thái cuồng nộ.

Những khoảng thời gian còn lại dùng cho chuyển cảnh, đợt quái và tổng kết.

### Tính máu boss

Sử dụng công thức tham khảo:

`HPboss = N * DPS_chuan * 90 * K`

Trong đó:

- N là số người tham gia hợp lệ, tối thiểu 1.
- DPS_chuan là sát thương mỗi giây chuẩn theo cảnh giới.
- K là độ khó từng boss, mặc định 0.65 / 0.85 / 1.0.

Tính lại cân bằng theo số người khi boss xuất hiện; không tăng máu boss đột ngột khi có người vào muộn.

Nếu chiến trường không có người, bỏ qua mô phỏng boss của chiến trường đó.

Nếu chỉ có một người, điều chỉnh máu boss để vẫn có thể đánh đơn.

Nếu có từ hai người trở lên, xếp hạng theo sát thương thực tế.

Người đến muộn vẫn được tham gia và hiển thị thời gian tham gia trong bảng xếp hạng.

---

## 17. PHẦN THƯỞNG DIỆT MA

Sau khi kết thúc trận, mỗi chiến trường lập bảng xếp hạng riêng.

Thưởng mặc định:

| Hạng | Phần thưởng |
|---|---|
| TOP 1 | Tăng 5 tiểu cảnh giới |
| TOP 2 | Tăng 4 tiểu cảnh giới |
| TOP 3 | Tăng 3 tiểu cảnh giới |
| Các người chơi còn lại | Tăng 1 tiểu cảnh giới và nhận 1 lần Ban Phúc |

Không phát thưởng nhiều lần cho cùng một trận.

Nếu chiến trường chỉ có một người, cho phần thưởng hoàn thành cơ bản thay vì tự động trao toàn bộ giải TOP 1.

Nếu chiến trường có hai người, chỉ trao TOP 1 và TOP 2.

Nếu thưởng vượt qua giới hạn Viên Mãn và cần độ kiếp, không tự ý bỏ qua độ kiếp. Giữ phần tiến cấp còn lại để xử lý sau khi đột phá.

Phần thưởng chỉ áp dụng khi trở lại giai đoạn tu luyện.

### Thông cáo Thiên Đạo

Cuối trận:

- Camera bay lên cao.
- Hiện bảng TOP 3.
- Phát hiệu ứng hào quang.
- Giọng Thiên Đạo đọc tên những người đứng đầu.
- Nhân vật TOP 1 đứng ở trung tâm lễ đài.
- Sau đó chuyển toàn bộ đệ tử về tông môn.

Ví dụ:

**THIÊN ĐẠO THÔNG CÁO**

**Đạo hữu Nguyễn A đã đứng đầu chiến trường Kim Đan Vực!**

Tạo cảm giác chiến thắng hoành tráng nhưng không kéo dài quá lâu.

---

# PHẦN VI – CAMERA VÀ ĐỒ HỌA LIVESTREAM

## 18. CAMERA TỰ ĐỘNG

Game phải có hệ thống camera director tự chọn cảnh, vì streamer không thể liên tục điều khiển.

### Camera tông môn

- Góc rộng toàn cảnh.
- Camera di chuyển chậm.
- Thi thoảng tập trung vào nhóm đệ tử tu luyện.
- Chuyển sang đệ tử mới nhập môn.

### Camera độ kiếp

- Ưu tiên người đang độ kiếp.
- Góc cận nhân vật.
- Camera rung nhẹ khi thiên lôi đánh.
- Trở về tông môn sau khi kết thúc.

### Camera chiến trường

- Ưu tiên boss đang giao chiến.
- Tự chuyển giữa các chiến trường có người tham gia.
- Có thể tập trung vào người đang gây sát thương cao.
- Khi boss sắp chết, chọn góc quay hoành tráng.
- Khi có quà lớn, có thể tập trung vào người tặng.

### Chế độ camera

Trang cài đặt cần có:

- Tự động.
- Toàn cảnh tông môn.
- Theo dõi người chơi.
- Đài độ kiếp.
- Chiến trường cụ thể.
- Theo dõi boss.
- Camera tự động luân phiên chiến trường.

Có hàng chờ và độ ưu tiên sự kiện, tránh camera đổi liên tục khi nhiều người bình luận hoặc tặng quà.

---

## 19. GIAO DIỆN PHÁT SÓNG

**Bổ sung cho scene Unity Concept02 (07/11/2026):** bảng “THIÊN ĐẠO THÔNG CÁO” hiển thị TOP3 cảnh giới cao nhất của toàn bộ người chơi trong snapshot. Sắp giảm dần theo cảnh giới → tiểu cảnh giới → tu vi; nếu vẫn bằng nhau dùng userId tăng dần để giữ thứ tự ổn định. Hiển thị tên/cảnh giới/tiểu cảnh giới, dùng ba vùng icon1/2/3 từ `ui_rank_icons.png`. Đây là xếp hạng hiển thị, không phát thưởng và không thay TOP sát thương/phần thưởng chiến trường. Thiếu người thì để trống các hạng còn lại; mất kết nối hiển thị chờ dữ liệu. Thanh nguyên lực dùng các mốc cấp tông môn ở mục12.

Trang:

`http://localhost:3000/song`

Thiết kế theo màn hình dọc tỷ lệ 9:16, tham chiếu 1080×1920.

### Phía trên

- Tên game.
- Cảnh giới cao nhất hiện tại.
- Trạng thái: TU LUYỆN / DIỆT MA.
- Đồng hồ đếm ngược.
- Số người đã nhập môn.

### Phần trung tâm

Chiếm khoảng 70% diện tích màn hình.

Hiển thị thế giới 3D, nhân vật, quái vật và các hiệu ứng chính.

### Phía dưới

Khi tu luyện:

- Thông báo nhập môn.
- Người đang độ kiếp.
- Người vừa thăng cảnh giới.
- Quà và vật phẩm vừa sử dụng.

Khi chiến đấu:

- Tên boss.
- Thanh máu boss.
- Chiến trường đang quan sát.
- TOP sát thương.
- Thông báo kỹ năng nổi bật.

### Thẻ người chơi

Khi camera tập trung một nhân vật, hiện:

- Tên TikTok.
- Cảnh giới.
- Tiểu cảnh giới.
- Tu vi hiện tại.
- Công kích.
- Phòng ngự.
- Trạng thái đang thực hiện.

Giao diện mang phong cách tiên hiệp tím đậm, xanh huyền ảo và vàng kim.

Không dùng chữ Hán; toàn bộ chữ giao diện bằng tiếng Việt.

Không che gameplay bằng quá nhiều thông báo.

---

## 20. HIỆU ỨNG VÀ ÂM THANH KHÔNG CẦN ASSET

Tất cả được tạo bằng code.

### Hiệu ứng

- Sương mù và mây chuyển động.
- Linh khí bay quanh nhân vật.
- Vòng pháp trận phát sáng.
- Kiếm khí.
- Thiên lôi.
- Vụ nổ linh lực.
- Cổng dịch chuyển.
- Hào quang thăng cấp.
- Khói và tro tàn quái vật.
- Chấn động màn hình.
- Hạt sáng tỏa ra khi boss bị tiêu diệt.

Dùng Three.js particles, instancing, vật liệu trong suốt và shader đơn giản.

### Âm thanh

Dùng Web Audio API tạo:

- Tiếng kiếm.
- Tiếng chưởng.
- Tiếng sét.
- Tiếng nổ.
- Tiếng chuông.
- Tiếng truyền tống.
- Nhạc nền ambient đơn giản.
- Âm thanh chúc mừng.

Không cần file MP3 hoặc WAV.

**Âm thanh Unity theo `docs/Tailieu/AMTHANH.md` (07/11/2026):** dùng năm file người dùng đã cung cấp trong `unity-client/Assets/Musics/`, không tải tài nguyên ngoài. GameObject `08_Systems/GameAudioManager` trong SectScene_Main và SectScene_Concept02 có các trường AudioClip kéo thả: `BGM` phát loop; `Sfx_banphuc` khi nhận `blessing:activated`; `sfx_SDokiep` khi `breakthrough:completed` thành công; `sfx_lv_up_TM` khi tông môn thực sự chuyển cấp (đầy MAX không phải lên cấp); `sfx_fly` khi nhân vật hiện trên scene bắt đầu tư thế bay lên hoặc bay trở về, không phát mỗi frame. Clip có thể thay trong Inspector.

Unity đọc cấu hình `config.audio` đã có qua snapshot: bật/tắt tổng, nhạc/hiệu ứng, `masterVolume`, `musicVolume`, `effectsVolume`, `maxVoices`. Âm lượng nhạc = tổng × nhạc, hiệu ứng = tổng × hiệu ứng. Các thanh này nằm tại Cài đặt → Âm thanh → Lưu âm thanh. Không thêm phép tính gameplay hoặc đường ghi save từ Unity. Nhạc bắt đầu sau snapshot hợp lệ, loop cả khi game tạm dừng; mất kết nối/disable/đổi session dừng âm thanh cũ. Không phát lại SFX từ snapshot hoặc từ buff/kết quả đã có lúc reconnect. Giới hạn2–16 giọng theo cấu hình, ưu tiên sự kiện quan trọng và gộp tiếng trùng quá sát để tránh spam âm thanh; không ảnh hưởng phần thưởng. Thiếu clip không lỗi game. Giọng Thiên Đạo/nghe thử ở trang quản trị vẫn là hệ thống trình duyệt hiện hữu, không ánh xạ các clip Unity.

Giọng Thiên Đạo dùng Speech Synthesis của hệ điều hành/trình duyệt.

Nếu máy không có giọng tiếng Việt phù hợp, vẫn phải hiển thị thông báo bằng chữ, không được làm lỗi game.

Có nút bật/tắt âm thanh, chỉnh âm lượng và kiểm tra âm thanh.

Nếu trình duyệt của OBS/LIVE Studio chặn tự phát âm thanh, hiện hướng dẫn kích hoạt và có chế độ không âm thanh hoàn chỉnh.

---

# PHẦN VII – TRANG CÀI ĐẶT

## 21. BẢNG ĐIỀU KHIỂN STREAMER

Trang:

`http://localhost:3000`

Giao diện tiếng Việt, thiết kế đơn giản cho người không biết code.

### A. Kết nối TikTok

- Ô nhập tên tài khoản.
- Khóa ký tùy chọn nếu cần.
- Nút KẾT NỐI.
- Nút NGẮT KẾT NỐI.
- Trạng thái kết nối.
- Thống kê sự kiện vừa nhận.
- Thông báo lỗi.

### B. Điều khiển game

- Bắt đầu chu kỳ.
- Tạm dừng.
- Tiếp tục.
- Reset chu kỳ.
- Reset toàn bộ dữ liệu (yêu cầu xác nhận).
- Chuyển giai đoạn thủ công.
- Chọn chiến trường cần hiển thị.

### C. Cài đặt tu luyện

- Thời gian tu luyện.
- Thời gian chiến đấu.
- Hệ số tốc độ tu luyện.
- Bảng chỉ số cảnh giới.
- Tu vi cần nâng tầng.
- Xác suất độ kiếp.
- Cooldown độ kiếp.
- Quy tắc cộng dồn vật phẩm.

### D. Cài đặt chiến đấu

- Máu boss.
- Hệ số độ khó.
- Số lượng quái.
- Thời gian từng boss.
- Sát thương kỹ năng.
- Cooldown kỹ năng.
- Phần thưởng TOP 1, 2, 3.

### E. Cài đặt quà

Bảng có thể thêm, sửa, xóa ánh xạ quà và vật phẩm.

Dữ liệu lưu vào `caidat.json`.

### F. Cài đặt hình ảnh

- Mức chất lượng Low / Medium / High.
- Số nhân vật tối đa được render chi tiết.
- Bật/tắt hiệu ứng hạt.
- Bật/tắt bóng đổ.
- Bật/tắt rung camera.
- Bật/tắt thông báo lớn.
- Chọn camera mặc định.

### G. Âm thanh

- Âm lượng nhạc.
- Âm lượng hiệu ứng.
- Bật/tắt giọng Thiên Đạo.
- Nút nghe thử.

### H. Chế độ thử

Bắt buộc có nút:

**THỬ KHÔNG CẦN LIVE**

Cho phép tạo:

- 10–100 nhân vật giả.
- Bình luận nhập môn.
- Tăng tu vi.
- Tặng quà.
- Sử dụng vật phẩm.
- Độ kiếp thành công.
- Độ kiếp thất bại.
- Sử dụng kỹ năng.
- Diệt boss.
- Tổng kết chiến trường.

Có chế độ tăng tốc thời gian mô phỏng x10 để kiểm tra nhanh một chu kỳ.

Chế độ demo phải dùng cùng game engine với chế độ LIVE thật, không tạo logic giả riêng chỉ để trình diễn.

---

# PHẦN VIII – DỮ LIỆU VÀ ĐỘ ỔN ĐỊNH

## 22. LƯU TIẾN TRÌNH

Mỗi nhân vật có dữ liệu:

```js
{
  userId,
  username,
  realm,
  stage,
  cultivation,
  hp,
  atk,
  def,
  lightningResistance,
  cultivationRate,
  spiritualRoot,
  inventory,
  activeBuffs,
  breakthroughFailures,
  heavenlyFate,
  totalDamage,
  battlesPlayed,
  battlesWon,
  lastActiveAt
}
```

Lưu dữ liệu trên máy để sau khi tắt chương trình và mở lại, người chơi không bị mất cảnh giới.

Dùng JSON có ghi file an toàn, chống hỏng dữ liệu khi chương trình đóng đột ngột.

Không cần database ngoài, tài khoản đăng nhập hoặc máy chủ cloud.

Không gửi dữ liệu game ra ngoài.

---

## 23. CHỐNG LAG VÀ QUÁ TẢI

Ưu tiên chạy tốt trên máy tính Windows tầm trung đang đồng thời sử dụng TikTok LIVE Studio.

Yêu cầu:

- Mục tiêu render 30 FPS ổn định ở cấu hình trung bình.
- Giới hạn pixel ratio tối đa 1.5 theo chế độ.
- Dùng InstancedMesh cho quái vật và vật thể lặp.
- Dùng object pooling cho particles, kiếm khí và hiệu ứng.
- Không tạo hàng loạt geometry hoặc material mới mỗi frame.
- Dùng delta time khi cập nhật animation.
- Tách tốc độ mô phỏng máy chủ khỏi FPS đồ họa.
- Hạn chế số thông báo cùng lúc.
- Có giới hạn hàng chờ sự kiện.
- Có khả năng hiển thị hàng nghìn người chơi trong dữ liệu nhưng chỉ render vài chục người cùng lúc.
- Không phải tính vật lý 3D phức tạp cho mọi nhân vật.
- Giải phóng tài nguyên đồ họa khi chuyển cảnh.
- Có fallback Canvas 2D đơn giản nếu WebGL không khả dụng.

Không sử dụng các hiệu ứng phức tạp làm máy livestream quá tải.

---

## 24. BẢO MẬT VÀ LỌC BÌNH LUẬN

- Lọc bình luận tục tĩu.
- Danh sách từ cấm lưu trong `tucngu.json`.
- Tên hiển thị tối đa 20 ký tự.
- Nội dung bình luận được giới hạn độ dài.
- Chống chèn HTML/script.
- Không dùng nội dung bình luận trực tiếp làm mã lệnh.
- Có cooldown chống spam.
- Không dùng tên TikTok làm khóa định danh; sử dụng user ID ổn định.
- Dữ liệu cá nhân chỉ lưu tối thiểu.
- Mặc định máy chủ chỉ lắng nghe localhost.
- Không mở truy cập từ Internet.
- Không đính kèm cơ chế điều khiển game bằng câu lệnh quản trị từ bình luận của người xem.

---

# PHẦN IX – CHẤT LƯỢNG VÀ KIỂM THỬ

## 25. CÁC KIỂM THỬ BẮT BUỘC

Sau khi viết code, hãy tự chạy chương trình và kiểm tra.

### Kiểm thử khởi động

- Nháy đúp `chay.bat`.
- Máy chủ khởi động.
- Trang cài đặt mở được.
- Trang `/song` mở được.
- Không xuất hiện lỗi JavaScript nghiêm trọng.

### Kiểm thử nhân vật

- Nhập môn tạo nhân vật.
- Nhân vật có tên.
- Nhân vật có ngoại hình riêng.
- Không tạo trùng.
- Nhân vật có animation tu luyện.
- Nhân vật có thể chiến đấu.
- Nhân vật được lưu và khôi phục.

### Kiểm thử tu luyện

- Tu vi tăng đúng theo thời gian.
- Tự nâng tiểu cảnh giới.
- Tự vào hàng chờ độ kiếp.
- Vật phẩm hoạt động.
- Hiệu ứng cộng dồn đúng.
- Thời gian vật phẩm tạm dừng khi chiến đấu.

### Kiểm thử độ kiếp

- Đúng tỷ lệ xác suất đã cấu hình.
- Có hoạt cảnh.
- Có thông báo kết quả.
- Thất bại không mất cảnh giới.
- Có cooldown 60 giây.
- Có bảo hộ sau thất bại.
- Có cơ chế Thiên Mệnh.
- Không độ kiếp giữa trận chiến.

### Kiểm thử diệt ma

- Tự chuyển sang chiến trường.
- Phân chiến trường đúng cảnh giới.
- Quái vật tự xuất hiện.
- Nhân vật tự tấn công.
- Bình luận 1 và 2 sử dụng đúng kỹ năng.
- Cooldown hoạt động.
- Ba boss xuất hiện đúng giai đoạn.
- Máu boss giảm theo sát thương thật.
- Bảng đóng góp đúng.
- Thưởng sau khi trận kết thúc.
- Tu vi không tăng trong thời gian chiến đấu.
- Kết thúc quay về tông môn.

### Kiểm thử TikTok

- Kết nối thành công khi có LIVE thật.
- Nhận bình luận.
- Nhận tim.
- Nhận quà.
- Không cộng trùng quà combo.
- Xử lý lỗi mất kết nối.
- Tự kết nối lại.
- Chế độ demo vẫn chạy khi không có mạng TikTok.

Không được báo đã kiểm thử LIVE thật nếu môi trường không có phiên TikTok LIVE để kết nối.

---

## 26. YÊU CẦU BÀN GIAO CUỐI CÙNG

Hoàn thành những mục sau:

1. Tạo đầy đủ tất cả file của dự án.
2. Viết code thật, chạy được, không dùng pseudo-code.
3. Không để TODO thay thế chức năng bắt buộc.
4. Không yêu cầu người dùng tự tìm nhân vật, texture, icon, sprite, animation hoặc âm thanh.
5. Tất cả mô hình và cảnh được dựng bằng code.
6. Cài thư viện chính xác theo `package.json`.
7. Kiểm tra lỗi cú pháp và khả năng khởi chạy.
8. Chạy chế độ thử để kiểm tra các tính năng chính.
9. Nếu có công cụ trình duyệt, chụp ảnh màn hình `/song` và `/` để tôi xem.
10. Viết `HUONGDAN.md` bằng tiếng Việt cho người không biết code.

Hướng dẫn phải bao gồm:

- Cách cài Node.js.
- Cách chạy game.
- Cách nhập tên TikTok.
- Cách bật chế độ thử.
- Cách thêm game vào OBS.
- Cách thêm game vào TikTok LIVE Studio.
- Cách chỉnh quà tặng.
- Cách chỉnh thời gian tu luyện và chiến đấu.
- Cách chỉnh chất lượng hình ảnh khi livestream bị lag.
- Cách xử lý lỗi kết nối và thông báo tường lửa Windows.

### Nguyên tắc làm việc

- Ưu tiên một phiên bản hoàn chỉnh, ổn định hơn một phiên bản có nhiều hiệu ứng nhưng không hoạt động.
- Không cần tạo hệ thống đăng nhập riêng.
- Không cần server cloud.
- Không cần API trả phí.
- Không cần tài nguyên đồ họa.
- Không cần tài nguyên âm thanh.
- Không cần bước build.
- Không yêu cầu người dùng sửa code để chạy.
- Giao diện tiếng Việt 100%.
- Không hỏi lại khi đã có thể tự quyết định phương án hợp lý.

**Điều kiện hoàn thành quan trọng nhất: Tôi chỉ cần nháy đúp `chay.bat`, bấm "Thử không cần LIVE" và thấy một thế giới tu tiên 3D có nhân vật đang hoạt động, tu luyện, độ kiếp, chiến đấu với ba boss, chuyển cảnh và trao thưởng theo đúng luật. Sau đó có thể kết nối một kênh TikTok đang LIVE thật để người xem tương tác.**

Hãy bắt đầu tạo dự án, không chỉ viết kế hoạch hay mô tả kiến trúc. Nếu có hạn chế kỹ thuật thực tế, phải nêu rõ những gì đã hoạt động và những gì chưa kiểm chứng, không giả vờ hoàn thành.
