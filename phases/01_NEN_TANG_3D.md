# GIAI ĐOẠN 01 — NỀN TẢNG DỰ ÁN VÀ THẾ GIỚI 3D

> **Mục tiêu:** Chạy được game Tu Tiên LIVE trên Windows bằng `chay.bat`, mở được trang cài đặt và trang phát sóng 9:16; hiển thị thế giới tông môn 3D, nhân vật chibi được dựng hoàn toàn bằng code, chuyển động mượt; có bộ máy chủ/WebSocket và chế độ thử ngoại tuyến sơ khai. **Chưa** làm hệ thống tu luyện đầy đủ, 11 chiến trường hay kết nối TikTok thật ở giai đoạn này.

## 0. Cách AI phải sử dụng tài liệu

1. Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md` (nếu đã có), rồi mới đọc file này.
2. `GAME_DESIGN.md` là nguồn chuẩn về cơ chế; tài liệu này chỉ chia việc và mô tả yêu cầu kỹ thuật giai đoạn 1. Nếu phát hiện mâu thuẫn, báo rõ thay vì âm thầm sửa luật.
3. Viết và lưu **mã nguồn thực tế** vào thư mục dự án; không chỉ trả về giải thích hoặc code minh họa.
4. Chạy được bằng Windows mà không phải cài Unity, Blender, phần mềm đồ họa, tài nguyên hình ảnh/âm thanh hay dịch vụ cloud. Có thể sử dụng Node.js/npm và các thư viện JavaScript theo yêu cầu.
5. Không triển khai trước nghiệp vụ của giai đoạn 2–4; chỉ tạo các giao diện/điểm mở rộng cần thiết.
6. Kết thúc phải tự kiểm tra, ghi kết quả có bằng chứng vào `PROGRESS.md` và dừng lại, chờ yêu cầu chuyển giai đoạn.

## 1. Kết quả người dùng nhìn thấy

- Nháy đúp `chay.bat` trong thư mục dự án mới → nếu thiếu Node.js thì hiện hướng dẫn; nếu có thì cài dependencies khi cần và chạy máy chủ.
- Trình duyệt mở `http://localhost:3000` với trang điều khiển tiếng Việt (bản nền tảng).
- `http://localhost:3000/song` hiện cảnh 3D **dọc 9:16, tham chiếu 1080×1920**, dùng được như Browser Source trong OBS/LIVE Studio.
- Giữa sân tông môn có các nhân vật chibi đang đứng, đi dạo, ngồi thiền, đứng lên; các vật thể 3D có chiều sâu thực, không phải chỉ có ảnh nền.
- Bấm **Thử không cần LIVE** có thể sinh 10, 30 hoặc 60 nhân vật mô phỏng và xem camera chuyển cảnh cơ bản.
- Đóng và mở lại chương trình không lỗi; WebSocket tự cập nhật khi trang `/song` tải lại.

## 2. Công nghệ và cấu trúc bắt buộc

### 2.1 Stack

- Node.js LTS, Express, `ws`, Three.js (ES modules).
- Dùng JavaScript thuần ở frontend, CSS và HTML; **không cần React/Vue, TypeScript build, Vite/Webpack hay bước build**.
- Phân phối Three.js từ `node_modules` thông qua máy chủ local hoặc một thư mục vendor được quản lý trong dự án. **Không phụ thuộc CDN khi chạy.** Importmap/ES modules phải hoạt động trên cả `/song` và khi stream qua OBS.
- Dữ liệu game chỉ giữ ở máy chủ; trình duyệt là bộ hiển thị. Không tin đầu vào từ trình duyệt để tự tăng chỉ số.
- Không dùng ảnh, model, texture, font tải từ mạng, sprite, animation ngoài, MP3/WAV. Có thể tạo hình bằng Geometry/Material, CanvasTexture tạo tại runtime, CSS, SVG sinh bằng code, Web Audio ở giai đoạn 5.

### 2.2 Khung thư mục gợi ý

```text
TuTienLive/
├── chay.bat
├── package.json
├── package-lock.json
├── server.js
├── gameEngine.js
├── caidat.json
├── tucngu.json
├── AGENTS.md
├── GAME_DESIGN.md
├── PROGRESS.md
├── README.md
├── HUONGDAN.md                 # cập nhật đầy đủ ở giai đoạn 5
├── phases/
│   ├── 01_NEN_TANG_3D.md
│   ├── 02_TU_LUYEN.md
│   ├── 03_DIET_MA.md
│   ├── 04_TIKTOK_LIVE.md
│   └── 05_HOAN_THIEN.md
├── data/
│   ├── players.json
│   └── demo/                   # tách dữ liệu demo và dữ liệu thật
├── public/
│   ├── index.html
│   ├── song.html
│   ├── css/style.css
│   └── js/
│       ├── scene.js
│       ├── characters.js
│       ├── camera.js
│       ├── effects.js
│       ├── overlay.js
│       └── network.js
└── test/
    └── ...
```

Có thể chỉnh tên/tách file, nhưng trách nhiệm các module phải rõ. Không tạo thư mục `assets/` rồi đòi người dùng tải file vào.

## 3. Xây dựng bộ máy chủ (server)

### 3.1 HTTP routes

- `GET /` — bảng điều khiển streamer.
- `GET /song` — giao diện phát sóng.
- `GET /health` — JSON chứa `ok`, phiên bản, thời gian chạy.
- `GET /api/state` — snapshot trạng thái hiện tại cho mục đích debug nội bộ.
- Các API quản trị chỉ chấp nhận truy cập từ localhost; có validation, trả thông báo lỗi tiếng Việt.
- Máy chủ mặc định bind `127.0.0.1:3000`; nếu port bận phải báo rõ cách xử lý, không im lặng.

### 3.2 WebSocket

Đặt hợp đồng giao tiếp **ngay từ giai đoạn 1**, để các bước sau không phải viết lại.

Ví dụ server → client:

```json
{
  "type": "state:snapshot",
  "version": 1,
  "seq": 27,
  "serverTime": 1770000000000,
  "payload": {
    "phase": "cultivation",
    "remainingMs": 600000,
    "players": [],
    "focusedScene": "sect"
  }
}
```

Sự kiện tức thời dùng `type: "game:event"` với payload có `eventId`, `kind`, `userId`, `timestamp` và dữ liệu tối thiểu. Server phát snapshot định kỳ và khi client mới nối, kèm event để chạy hiệu ứng. Dùng `seq`/`eventId` chống xử lý lặp khi client reconnect.

- Kết nối bị đứt không được crash server.
- Frontend tự nối lại theo nhịp có giới hạn; sau reconnect phải tải lại snapshot.
- Máy chủ **không** gửi toàn bộ lịch sử sự kiện mỗi frame.
- Frontend không được dùng callback WebSocket để sửa trực tiếp dữ liệu nguồn của nhân vật ngoài việc cập nhật dữ liệu hiển thị.

### 3.3 Vòng lặp mô phỏng nền tảng

- Máy chủ có một `GameEngine` duy nhất quản lý thời gian phiên, người chơi, giai đoạn và danh sách sự kiện.
- Bắt đầu bằng 2 trạng thái: `cultivation`, `battle` (logic chi tiết sẽ làm ở giai đoạn sau), thêm `paused` và `stopped`.
- Mô phỏng dùng fixed/controlled tick (gợi ý 10–20 ticks/giây) và delta time được giới hạn; render độc lập với tick.
- Tick, timeout và thời gian hiệu lực phải sử dụng đồng hồ máy chủ, không phụ thuộc FPS.
- Có thể tạm dừng/tiếp tục và chuyển trạng thái qua giao diện admin cho mục đích kiểm thử.
- Có cơ chế dọn các sự kiện đồ họa ngắn hạn, không giữ vô hạn trong RAM.

### 3.4 Lưu dữ liệu nền tảng

- Tạo định dạng JSON có trường `schemaVersion` để sau này nâng cấp.
- Dùng ghi file an toàn: ghi tạm rồi rename, tuần tự hóa thao tác ghi; hạn chế ghi mỗi frame.
- Dữ liệu demo không ghi đè `data/players.json` của chế độ thật.
- Ở giai đoạn 1 chỉ cần lưu danh sách nhân vật mẫu, tùy chọn đồ họa và cấu hình máy chủ; nghiệp vụ sẽ bổ sung ở giai đoạn 2.

## 4. Dựng cảnh tông môn 3D hoàn toàn bằng code

### 4.1 Bố cục

Thiết kế phong cách **tiên hiệp low-poly**: tông màu tím đêm/xanh ngọc/vàng kim; ánh sáng nhẹ, có chiều sâu, không lòe loẹt.

Phải có:

1. Một sân tu luyện trên núi nổi, nền gạch được tạo bằng hình học hoặc shader lặp.
2. Chính điện mái cong, bậc thang, cột, mái ngói đỏ/tím tạo từ primitive geometry.
3. Cổng tông môn có biển tiếng Việt (chữ được vẽ bằng CanvasTexture tại runtime).
4. Bệ đá ngồi thiền, trận pháp tròn, vòng sáng chuyển động.
5. Cây cổ thụ, đồi/núi xa, mây trôi, thác nước hoặc sương mù đơn giản.
6. Đèn lồng, linh thạch, kiếm treo/bay nhẹ, hạt linh khí.
7. Ánh sáng ngày/hoàng hôn chuyển nhẹ bằng màu sắc và hướng sáng.

Không dùng chữ Hán; văn bản ngoài mô hình chỉ dùng tiếng Việt.

### 4.2 Kỹ thuật render

- Dùng `Scene`, `PerspectiveCamera`, `WebGLRenderer`, ánh sáng Hemisphere/Ambient/Directional.
- Resize chính xác khi Browser Source đổi độ phân giải; tôn trọng aspect dọc 9:16 và vùng an toàn của UI.
- Mặc định pixel ratio tối đa 1.5; có preset đồ họa thấp/trung bình/cao.
- Bóng đổ tối giản hoặc tắt ở preset thấp.
- Mây, lá, pháp trận và ánh sáng chuyển động bằng phép biến đổi và vật liệu, không tải texture bên ngoài.
- Dùng geometry/material dùng chung, `InstancedMesh` cho vật thể lặp, object pool cho hạt.
- Không cấp phát ồ ạt đối tượng mới trong mỗi `requestAnimationFrame`.
- Có màn hình dự phòng thông báo rõ khi WebGL bị tắt hoặc không được hỗ trợ.

## 5. Nhân vật chibi tu tiên procedural

### 5.1 Cấu trúc mô hình

Tự dựng từ các mesh có phân cấp khớp:

- Đầu lớn, mặt đơn giản, tóc/búi tóc, thân mặc đạo bào, hai tay, hai chân.
- Thắt lưng, giày, kiếm hoặc pháp khí.
- Vòng linh khí hoặc hạt khí nhẹ quanh người.
- Bảng tên trên đầu bằng CanvasTexture tự tạo, không cần phông chữ ngoài.

Mỗi người có `userId` và `seed` sinh ngoại hình ổn định; không dùng `displayName` làm khóa định danh. Thay đổi màu áo, tóc, pháp khí nhưng không làm nhân vật mất nhất quán qua các lần render.

### 5.2 Animation lập trình bằng code

Cần đủ hoạt động thử nghiệm:

- `idle`: thở nhẹ, nhìn quanh.
- `walk`: đung đưa tay/chân, dịch chuyển trên sân.
- `meditate`: ngồi thiền, hạt linh khí tụ quanh người.
- `standUp`: chuyển từ thiền sang đứng.
- `attack`: vung kiếm thử (chưa gây sát thương thật).
- `teleport`: xuất hiện dưới cổng dịch chuyển.
- `celebrate`: giơ tay/hào quang ngắn.

Tạo animation bằng `position`, `rotation`, `scale`, interpolation/easing; không dùng GLTF, FBX hay clip tải về. Cấu trúc phải mở rộng cho `hit`, `cast`, `stun`, `defeated` ở giai đoạn sau.

### 5.3 Quản lý đông người

- Phía server có thể giữ 100+ người chơi demo.
- Render chỉ 40–60 nhân vật chi tiết trong vùng camera; người còn lại là các đối tượng giản lược hoặc không render.
- Không xóa dữ liệu người chơi chỉ vì nhân vật không nằm trong camera.
- Tối ưu chọn đối tượng theo khoảng cách/độ ưu tiên; không tái tạo mesh mỗi khi nhận snapshot.

## 6. Camera, UI và trải nghiệm

### 6.1 Camera

- Camera toàn cảnh tông môn, góc hơi cao để thấy nhiều nhân vật trên màn dọc.
- Camera theo một nhân vật, nội suy mềm tránh giật.
- Camera quay quanh bệ luyện công hoặc di chuyển dọc sân.
- Cơ chế yêu cầu focus theo độ ưu tiên: camera tự động < người nhập môn < sự kiện quan trọng tương lai.
- Không cho camera xuyên mặt đất và chính điện.

### 6.2 Giao diện `/song`

- Header: `TU TIÊN LIVE`, trạng thái `TU LUYỆN (BẢN THỬ)`, đồng hồ đếm ngược.
- Khu vực 3D chiếm phần lớn màn hình.
- Dải thông báo dưới màn hình, số người nhập môn, người đang được theo dõi.
- Font hệ thống dễ đọc, không phụ thuộc CDN/font ngoài.
- Không có các nút admin trên màn hình phát sóng.
- Thiết kế phải hiển thị tốt cả cửa sổ desktop và khung 1080×1920.

### 6.3 Giao diện `/`

- Nhãn trạng thái `Chưa tích hợp TikTok LIVE (Giai đoạn 4)`; không làm nút NỐI giả.
- Nút **Thử không cần LIVE**; chọn quy mô 10/30/60 nhân vật.
- Nút mở `/song`, chọn camera, tạm dừng/tiếp tục demo.
- Hiển thị log ngắn và lỗi có nghĩa bằng tiếng Việt.
- Cấu hình đồ họa được lưu lại sau khi tải lại trang.

## 7. Chế độ demo và bộ tạo sự kiện

Tạo một `DemoEventSource` cục bộ, phát dữ liệu qua **cùng** bộ máy chủ/WebSocket dùng cho game chính:

- Sinh 10, 30, 60 người với `userId` giả ổn định và tên tiếng Việt mẫu.
- Tạo sự kiện `join` để xuất hiện qua cổng dịch chuyển.
- Chuyển qua lại các animation cho người xem nhìn thấy game đang sống.
- Cho phép gửi sự kiện thử `focus`, `attack`, `celebrate`, `teleport`.
- Có nút xóa dữ liệu demo; không xóa dữ liệu người dùng thật.

Đây chỉ là demo hiển thị nền tảng. Tính tu vi, bảng cảnh giới, độ kiếp sẽ được thay bằng logic thật trong Giai đoạn 2.

## 8. Kiểm thử bắt buộc

Dùng `node --test` hoặc script kiểm thử tương đương, không cần framework phức tạp.

| Mã | Ca kiểm thử | Kết quả mong đợi |
|---|---|---|
| 01-01 | Khởi động với Node.js đã cài | `chay.bat` khởi chạy máy chủ, mở trang cài đặt |
| 01-02 | Máy không có Node.js | Hướng dẫn tiếng Việt rõ ràng rồi dừng, không đóng cửa sổ im lặng |
| 01-03 | Gọi `/health`, `/`, `/song` | Trả nội dung hợp lệ; không lỗi 404/500 |
| 01-04 | Bật demo 30 người | Máy chủ có 30 ID duy nhất, nhân vật hiển thị và có chuyển động |
| 01-05 | Reload `/song` | Nhận snapshot mới và hiển thị lại, không nhân đôi nhân vật |
| 01-06 | Ngắt WebSocket rồi nối lại | Không crash; nhận lại trạng thái chính xác |
| 01-07 | Chọn chế độ đồ họa thấp | Giảm chất lượng thật, không chỉ thay chữ trên nút |
| 01-08 | Mở ở khung 1080×1920 | UI không che toàn bộ sân, không tràn chữ |
| 01-09 | Chuyển camera | Di chuyển mềm, không nhìn xuyên nền/tường |
| 01-10 | Đóng/mở lại ứng dụng | Cấu hình được lưu; khởi chạy không cần tải asset |
| 01-11 | Bật demo 60 người và quan sát | Không tạo/tái tạo toàn bộ mesh mỗi frame; không rò bộ nhớ rõ rệt |
| 01-12 | Kiểm tra mạng khi chơi | Không tải hình/model/audio từ URL ngoài |

**Nếu không có môi trường trình duyệt để đo FPS/chụp màn hình**, phải ghi rõ `CHƯA KIỂM CHỨNG`, không tự nhận PASS.

## 9. Điều kiện nghiệm thu để chuyển sang Giai đoạn 2

- [ ] Các file mã nguồn thực sự tồn tại và có thể chạy.
- [ ] `chay.bat` hoạt động trên Windows theo khả năng kiểm chứng hiện có.
- [ ] Có `/`, `/song`, `/health`, WebSocket và demo nội bộ.
- [ ] Tông môn là cảnh 3D procedural, có các hạng mục bắt buộc.
- [ ] Nhân vật chibi có ngoại hình ổn định và ít nhất 7 trạng thái animation đã nêu.
- [ ] Có thể xem 10–60 nhân vật bằng giao diện dọc.
- [ ] Frontend và server có hợp đồng snapshot/event rõ ràng.
- [ ] Không dùng asset tải ngoài hoặc dịch vụ trả phí.
- [ ] Kiểm thử được ghi rõ kết quả PASS/FAIL/CHƯA KIỂM CHỨNG.
- [ ] `PROGRESS.md` ghi module đã tạo, cách chạy, lỗi còn lại và bước tiếp theo.

**Khi hoàn thành:** Báo cáo ngắn những gì đã chạy, đường dẫn file quan trọng và cách bấm thử; **không tự ý chuyển sang Giai đoạn 2**.
