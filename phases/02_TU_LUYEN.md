# GIAI ĐOẠN 02 — TU LUYỆN, CẢNH GIỚI, VẬT PHẨM VÀ ĐỘ KIẾP

> **Mục tiêu:** Biến mô hình nhân vật 3D của Giai đoạn 1 thành người chơi có dữ liệu thật: nhập môn, tự nhận tu vi theo thời gian, nâng tiểu cảnh giới, xếp hàng độ kiếp với xác suất thực, dùng vật phẩm, nhiệm vụ và lưu tiến trình. Hoạt cảnh độ kiếp và thông báo phải chạy trực tiếp trên `/song`. **Chưa** xây dựng chiến trường 11 cảnh giới (Giai đoạn 3) và chưa kết nối TikTok thật (Giai đoạn 4).

## 0. Chuẩn bị và nguyên tắc

1. Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `phases/01_NEN_TANG_3D.md` và file này.
2. Kiểm tra code hiện có, dùng lại `GameEngine`, WebSocket, hệ thống animation/camera. Không thay lại toàn bộ nền tảng nếu chưa có lý do kỹ thuật.
3. Các bảng bên dưới lấy từ tài liệu thiết kế `Live tiktok game.pdf`; nếu số liệu trong `GAME_DESIGN.md` khác, **báo xung đột trước khi sửa**, không âm thầm thay đổi.
4. Mọi tính toán tu vi, tỷ lệ độ kiếp, vật phẩm, cooldown phải chạy ở **server**. Frontend chỉ hiển thị và phát hoạt cảnh.
5. Kịch bản demo dùng cùng logic nghiệp vụ như game thật; không tạo thanh tiến độ giả chỉ để quay video.

## 1. Kết quả cuối giai đoạn

- Bình luận/sự kiện demo `nhập môn` tạo người chơi duy nhất có ngoại hình 3D.
- Người chơi ngồi thiền và nhận tu vi tự động đúng tốc độ theo cảnh giới.
- Tự nâng **Sơ Kỳ → Trung Kỳ → Hậu Kỳ → Viên Mãn** theo mốc tu vi.
- Khi Viên Mãn, tự xếp hàng độ kiếp; camera chuyển sang đài độ kiếp, có mây đen, thiên lôi và thông báo.
- Thất bại không làm mất cảnh giới/tu vi, có 60 giây chờ và điểm bảo hộ; có cơ chế Thiên Mệnh chống xui kéo dài.
- Dùng được năm vật phẩm thiết kế: Trà Ngộ Đạo, Biến Dị Linh Căn, Độ Kiếp Đan, Ban Phúc, Quay Cam.
- Có nhiệm vụ miễn phí và chế độ thử nhanh các mốc tu luyện.
- Đóng mở chương trình không mất người chơi và cảnh giới.

## 2. Mô hình dữ liệu người chơi

Mỗi người dùng được nhận diện bởi `userId`, không phải tên hiển thị. Schema gợi ý:

```json
{
  "userId": "tiktok-or-demo-id",
  "username": "Dao huu A",
  "visualSeed": 12345,
  "realmIndex": 0,
  "stageIndex": 0,
  "cultivation": 0,
  "hp": 100,
  "atk": 10,
  "def": 5,
  "lightningResistance": 0,
  "baseCultivationRate": 1,
  "spiritualRootMultiplier": 1,
  "inventory": {},
  "buffs": [],
  "breakthrough": {
    "queued": false,
    "failedAttempts": 0,
    "protectionPoints": 0,
    "cooldownRemainingCultivationMs": 0,
    "heavenlyFate": 0
  },
  "questState": {},
  "lastSeenAt": 0,
  "schemaVersion": 1
}
```

`stageIndex`: 0 = Sơ, 1 = Trung, 2 = Hậu, 3 = Viên Mãn. Ở Viên Mãn, nhân vật phải độ kiếp thành công mới sang Sơ Kỳ cảnh giới mới. Nếu thưởng tăng tầng từ trận chiến ở Giai đoạn 3 vượt qua ranh giới, phải giữ phần thưởng chờ, không tự bỏ qua độ kiếp.

- Dữ liệu có validate, migrate theo `schemaVersion`, xử lý file rỗng/hỏng an toàn.
- Lưu theo đợt và khi sự kiện quan trọng xảy ra, ghi atomic, không ghi mỗi tick.
- Chia riêng `real`/`demo` để kiểm thử không phá dữ liệu thật.
- Không tự tăng tu vi khi server tắt, trừ khi sau này có yêu cầu offline progression riêng. Thời gian chỉ tính khi phiên đang chạy trong trạng thái `cultivation` và không pause.

## 3. Bảng cảnh giới chuẩn

| # | Cảnh giới | HP | ATK | DEF | Tu vi/giây |
|---:|---|---:|---:|---:|---:|
| 0 | Phàm Nhân | 100 | 10 | 5 | 1 |
| 1 | Luyện Khí | 180 | 18 | 9 | 1.5 |
| 2 | Trúc Cơ | 320 | 32 | 16 | 2.2 |
| 3 | Kim Đan | 560 | 56 | 28 | 3.2 |
| 4 | Nguyên Anh | 980 | 98 | 49 | 4.5 |
| 5 | Hóa Thần | 1720 | 172 | 86 | 6.3 |
| 6 | Luyện Hư | 3010 | 301 | 151 | 8.8 |
| 7 | Hợp Thể | 5270 | 527 | 264 | 12 |
| 8 | Đại Thừa | 9220 | 922 | 461 | 16.5 |
| 9 | Độ Kiếp | 16140 | 1614 | 807 | 22 |
| 10 | Phi Thăng | 28240 | 2824 | 1412 | 30 |

**Công thức chỉ số theo tầng:** `stat = round(baseStat * (1 + 0.1 * k))`, với `k = 0, 1, 2` ở Sơ/Trung/Hậu. `Viên Mãn` dùng chỉ số Hậu Kỳ cho tới khi độ kiếp. Tốc độ tu luyện cơ bản **không tăng** vì tiểu cảnh giới.

**Phi Thăng:** là mức cao nhất của V1. Không tự tạo cảnh giới thứ 12; tu vi về sau chỉ có thể sử dụng cho công pháp, danh hiệu hoặc thành tựu mở rộng.

### Tu vi cần cho từng bước

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

- Mỗi mốc là lượng tu vi cần tích lũy **cho bước hiện tại**, không phải tổng cộng dồn từ đầu cảnh giới.
- Khi đủ tu vi, trừ đúng mốc của bước, giữ phần dư cho bước tiếp theo nếu có; có giới hạn vòng lặp tránh nâng vô hạn do dữ liệu lỗi.
- Chuyển Hậu → Viên Mãn thì dừng nâng, đưa vào hàng chờ độ kiếp.
- Chuyển sang cảnh giới mới sau độ kiếp thành công: stage = Sơ; không tạo tài khoản mới; cập nhật chỉ số và hiệu ứng.
- Phải kiểm thử ví dụ trong thiết kế: Kim Đan Sơ Kỳ nhận 3.2 tu vi/giây, mốc 560 tu vi cần 175 giây nếu không buff và không có nguồn cộng thêm.

## 4. Tính tu vi theo thời gian và buff

### 4.1 Công thức

`expGain = baseCultivationRate * totalMultiplier * deltaCultivationSeconds + questOrItemExp`.

- Chỉ chạy khi `phase === 'cultivation'`, game không pause và người chơi hợp lệ.
- Dùng số thực có kiểm soát, không làm tròn từng tick để mất tu vi; làm tròn khi hiển thị.
- `deltaCultivationSeconds` lấy từ tick server; không phụ thuộc số lần client nhận WebSocket.
- Bắt đầu chiến đấu hoặc pause: không tăng tu vi, không trừ thời gian hiệu lực buff theo **thời gian tu luyện thực tế**.
- Không phát sinh tu vi khi người dùng gửi sự kiện liên tục trong cùng tick.

### 4.2 Quy tắc cộng hệ số

Theo bản thiết kế: **hai vật phẩm x2 cùng lúc tương ứng x4**, không phải x2 × x2 = x4 do nhân độc lập cho mọi hiệu ứng, mà tổng hệ số theo luật do người thiết kế quy định. Hãy biểu diễn bằng một hàm duy nhất và viết test rõ: 1 buff x2 → x2; 2 buff x2 → x4; 3 buff x2 → x6. Hệ số linh căn vĩnh viễn và buff tạm thời phải có cách tổng hợp xác định, tránh cộng nhầm gấp đôi.

**Đề xuất V1 có thể chỉnh:** giới hạn tổng hệ số tối đa x8 để tránh phát triển vô hạn nếu có nhiều quà; tách rõ phần này là quyết định cân bằng bổ sung chứ không phải con số trong PDF.

### 4.3 UI

Khi camera theo người chơi, hiển thị thanh tu vi, tu vi/giây, buff còn hiệu lực, tiểu cảnh giới; khi nâng tầng có vòng sáng nở ra, nhân vật đứng lên rồi ngồi thiền lại.

## 5. Hệ thống độ kiếp

### 5.1 Tỷ lệ từ tài liệu thiết kế

| Đột phá lên | Pmin | Pmax | Số lôi kiếp hiệu ứng |
|---|---:|---:|---:|
| Luyện Khí | 90% | 100% | 1 |
| Trúc Cơ | 80% | 98% | 2 |
| Kim Đan | 70% | 95% | 3 |
| Nguyên Anh | 60% | 90% | 4 |
| Hóa Thần | 50% | 85% | 5 |
| Luyện Hư | 40% | 80% | 6 |
| Hợp Thể | 35% | 75% | 7 |
| Đại Thừa | 30% | 70% | 8 |
| Độ Kiếp | 25% | 65% | 9 |
| Phi Thăng | 20% | 60% | 10 |

`P = clamp(Pmin + B + F, Pmin, Pmax)`.

- `B` là điểm từ chuẩn bị/nhiệm vụ/vật phẩm (đơn vị **điểm phần trăm**, không phải tỷ lệ 0–1).
- `F` là bảo hộ: mỗi lần thất bại +8 điểm phần trăm, tối đa +24, không vượt `Pmax`.
- Sử dụng RNG ở server; ghi `roll`, `probability`, `outcome` trong log kiểm thử nội bộ (không phải cho người xem đoán khi đang chạy).
- Tỷ lệ thành công phải tính **trước** hoạt cảnh và ghi một lần để tránh kết quả đổi do reload hay render lag.
- Khi thất bại: không giảm cảnh giới, không mất tu vi tích lũy; nhân vật bị thương trong hoạt cảnh; cooldown **60 giây tu luyện thực tế**, không đếm trong chiến đấu hoặc khi pause.
- Khi thành công: chuyển lên cảnh giới kế, reset bảo hộ của lần đột phá đó; dùng/tiêu thụ vật phẩm độ kiếp theo quy tắc rõ ràng.
- Cơ chế Thiên Mệnh từ nhiệm vụ miễn phí: **đề xuất V1** mặc định sau 5 lần thất bại cùng một mốc, có thể dùng một nghi thức độ kiếp đảm bảo; cấu hình chỉnh được. Nghi thức đảm bảo là ngoại lệ có điều kiện, không phải sửa Pmax âm thầm.
- Nhiều người đủ điều kiện: đưa vào hàng chờ, chống lặp, không chiếu trùng một người. Nếu tới pha chiến đấu giữa chừng, hoàn tất hoặc tạm hoãn theo chính sách đã cấu hình; tuyệt đối không phát thưởng tu vi hoặc đột phá trong trận chiến.

### 5.2 Hoạt cảnh 3D (mặc định8 giây)

Theo xác nhận09/11/2026: `breakthroughDurationMs=8000`, cấu hình/save nhận8–20 giây. Nghi thức cũ đang dở giữ thời lượng/tiến độ đã lưu; chỉ lượt mới dùng8 giây. Unity nhận duration từ Node, giữ mốc mây1,5 giây/sét1,8 giây. Không đổi xác suất/Đan/Thiên Mệnh/cooldown. Kết quả: `docs/Tailieu_output/breakthrough-8s/README.md`.

- Tạo đài đá bay/đài độ kiếp độc lập, dùng geometry tự dựng.
- Camera bay tới nhân vật, tên/cảnh giới hiện rõ.
- Mây đen và xoáy linh khí được dựng bằng code; thi triển `n` đợt thiên lôi theo bảng.
- Nhân vật chống đỡ, có rung camera giới hạn; khi thành công nở kim quang, thất bại quỳ xuống.
- Có event để giọng Thiên Đạo đọc tên về sau ở Giai đoạn 5; **ở Giai đoạn 2** phải hiển thị chữ và có thể dùng tiếng hệ thống nếu sẵn, không bắt buộc có TTS hoàn chỉnh ngay.
- Nếu tắt hiệu ứng/cấu hình thấp, logic vẫn đúng và cảnh vẫn có thể hoàn tất.

## 6. Năm vật phẩm từ bản thiết kế

| Vật phẩm | Tác dụng | Thời hạn / hạn chế |
|---|---|---|
| Trà Ngộ Đạo | Tăng x2 tốc độ tu luyện | 30 giây tu luyện thực tế |
| Biến Dị Linh Căn | Linh căn biến dị, x3 EXP cơ bản (xác nhận Khung.md08/11/2026) | Vĩnh viễn; chỉ kích hoạt một lần/người, save x2 cũ nâng khi nạp |
| Độ Kiếp Đan | Cộng +10 điểm % xác suất | Có thể tích lũy; không vượt giới hạn cảnh giới; nếu P gốc <50%, tổng hỗ trợ vật phẩm tối đa tới 85% theo thiết kế, nhưng vẫn chịu Pmax |
| Ban Phúc | Tăng x2 EXP toàn bộ đệ tử | 30 giây tu luyện thực tế; cộng dồn theo luật hệ số |
| Quay Cam | Tập trung camera vào nhân vật người kích hoạt | 3 giây, có hàng chờ và giới hạn spam |

- Tạo `ItemService` với `grantItem`, `useItem`, `expireBuff`, `getEffectiveStats`; log nguồn cấp item (`quest`, `gift`, `admin_demo`, `battle_reward`).
- Giai đoạn 2 có thể cấp item qua admin/demo, **không** cần TikTok thật.
- Vật phẩm tăng tu vi nhận trong pha battle được lưu vào túi và chưa áp dụng; quy tắc này phải được cài đặt từ bây giờ để Giai đoạn 3 dùng lại.
- Vật phẩm không được làm thay đổi chỉ số client-only; khi reload thì vẫn giữ hiệu lực đúng.

## 7. Nhiệm vụ miễn phí và đầu vào bình luận (demo)

Triển khai `CommandRouter` tách riêng nguồn nhận sự kiện và lệnh game. Chưa dùng connector TikTok thật.

| Lệnh/sự kiện thử | Kết quả | Hạn chế đề xuất |
|---|---|---|
| `nhập môn` | Tạo nhân vật Phàm Nhân | 1 lần tạo tài khoản / userId |
| `tu luyện` | Cộng một lượng tu vi nhỏ | Cooldown từng người, có hạn mức mỗi chu kỳ |
| `điểm danh` | Thưởng nhiệm vụ | 1 lần mỗi phiên |
| `thử độ kiếp` (chỉ admin demo) | Đưa vào hàng chờ hoặc tạo tình huống kiểm thử | Không cho khán giả bypass điều kiện |
| `dùng trà` (demo/admin) | Dùng vật phẩm trong túi | Chỉ khi đủ vật phẩm và đang tu luyện |

**Đề xuất cân bằng** (ngoài PDF): điểm nhiệm vụ đổi được Trà Ngộ Đạo, Độ Kiếp Đan và các hiệu ứng tương đương quà; không có vật phẩm chỉ người tặng quà mới nhận được. Tất cả mức thưởng/cooldown đặt trong cấu hình, không hardcode vô hạn.

Chuẩn hóa lệnh tiếng Việt (chữ thường, bỏ dấu, bỏ khoảng trắng dư); không nhận chuỗi chứa lệnh nếu chỉ là một phần của câu dài ngoài chủ đích.

## 8. API, cấu hình và tệp dự kiến

- Tách `cultivationService.js`, `breakthroughService.js`, `itemService.js`, `questService.js` (hoặc module tương đương), có hàm thuần dễ kiểm thử.
- Bảng cảnh giới, ngưỡng tu vi, Pmin/Pmax, thời hạn item và cooldown đặt trong cấu hình.
- `GET /api/state` phải có `realm`, `stage`, `cultivation`, `cultivationPerSecond`, `activeBuffs`, `breakthroughQueueLength` và các trạng thái theo góc nhìn admin.
- WebSocket có event rõ ràng: `player:joined`, `cultivation:tick` (snapshot gộp, không phát mỗi player mỗi tick), `stage:up`, `breakthrough:started`, `breakthrough:completed`, `item:used`, `camera:focus`.
- Phải giữ tương thích snapshot từ Giai đoạn 1 hoặc tăng `version` và cập nhật client có kiểm thử.

## 9. Kiểm thử bắt buộc

| Mã | Ca kiểm thử | Kỳ vọng |
|---|---|---|
| 02-01 | Hai sự kiện nhập môn cùng userId | Chỉ một nhân vật, không reset tiến trình |
| 02-02 | Phàm Nhân không buff trong 100 giây tu luyện | Đạt mốc 100 tu vi và lên Trung Kỳ |
| 02-03 | Kim Đan Sơ 3.2 exp/s, cần 560 | Lên Trung Kỳ sau 175 giây tu luyện |
| 02-04 | Đang chiến đấu hoặc pause | Không tăng tu vi, không trừ thời gian buff/cooldown tu luyện |
| 02-05 | 1/2/3 hiệu ứng x2 | Tổng lần lượt x2/x4/x6 theo quy tắc đã thống nhất |
| 02-06 | Hậu Kỳ đạt mốc cuối | Chuyển Viên Mãn, xếp hàng 1 lần |
| 02-07 | Độ kiếp thành công | Sang Sơ Kỳ cảnh giới tiếp theo, giữ đúng dữ liệu |
| 02-08 | Độ kiếp thất bại | Không mất tu vi/cảnh giới; tăng F thêm 8 điểm; cooldown 60s |
| 02-09 | 4 thất bại liên tiếp | F không vượt 24 điểm %, P không vượt Pmax |
| 02-10 | Nghi thức Thiên Mệnh bảo đảm | Chỉ được dùng khi đủ điều kiện; kết quả thành công đúng một lần |
| 02-11 | Nhiều người độ kiếp | Hàng chờ không trùng, không chồng camera vô hạn |
| 02-12 | Biến Dị Linh Căn và Trà | Áp dụng đúng hiệu lực vĩnh viễn/tạm thời |
| 02-13 | Dùng item tu luyện khi battle | Item chưa được áp dụng, được giữ lại |
| 02-14 | Khởi động lại server | Dữ liệu người chơi, item, cảnh giới được phục hồi |
| 02-15 | Độ Kiếp đạt cảnh giới Phi Thăng | Không tạo cảnh giới thứ 12 hoặc crash |

Với xác suất ngẫu nhiên, dùng RNG có seed hoặc mock RNG trong **test**, không thay đổi RNG thực khi chạy LIVE. Có thể kiểm định thống kê bổ sung, nhưng không dùng một số lần thử nhỏ để khẳng định xác suất đúng tuyệt đối.

## 10. Điều kiện nghiệm thu

- [ ] Có dữ liệu người chơi và bảng 11 cảnh giới/10 bảng ngưỡng đúng.
- [ ] Tu vi tính trên máy chủ theo thời gian **tu luyện thực tế**.
- [ ] Tự nâng tầng và xếp hàng độ kiếp chính xác.
- [ ] Xác suất, bảo hộ, cooldown và Thiên Mệnh có kiểm thử.
- [ ] Hoạt cảnh độ kiếp 3D rõ ràng trên `/song`.
- [ ] 5 vật phẩm hoạt động theo thiết kế, không áp dụng nhầm khi battle.
- [ ] Có nhiệm vụ/cách nhận vật phẩm miễn phí.
- [ ] Khôi phục dữ liệu và phân tách demo/real an toàn.
- [ ] Không làm hỏng cảnh 3D, camera, WebSocket của Giai đoạn 1.
- [ ] `PROGRESS.md` ghi kết quả từng test và vấn đề còn lại.

**Dừng tại đây**, không tự xây dựng 11 chiến trường hoặc TikTok connector khi chưa được giao Giai đoạn 3/4.
