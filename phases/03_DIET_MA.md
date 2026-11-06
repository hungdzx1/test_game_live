# GIAI ĐOẠN 03 — CHIẾN TRƯỜNG DIỆT MA, QUÁI, 3 BOSS VÀ PHẦN THƯỞNG

> **Mục tiêu:** Hoàn thành vòng chơi **10 phút tu luyện → 5 phút diệt ma → quay về tông môn**; phân người chơi vào 11 chiến trường theo cảnh giới; đánh tự động, dùng kỹ năng qua bình luận demo `1`/`2`, xuất hiện ba boss, chấm đóng góp và phát thưởng không bỏ qua điều kiện độ kiếp. **Chưa cần** kết nối TikTok LIVE thật — sự kiện phải đi qua cổng lệnh chung để Giai đoạn 4 gắn vào.

## 0. Quy tắc không được vi phạm

- Trong **toàn bộ 5 phút diệt ma**, **đóng băng tu vi**, kể cả tu vi tự động, cộng từ item/buff, nhiệm vụ hoặc phần thưởng.
- Item nhận trong trận được giữ ở túi, chỉ sử dụng/tác dụng ở pha tu luyện tiếp theo.
- Người chơi tham gia **chiến trường theo cảnh giới hiện tại lúc vào trận**. Không gộp 11 cảnh giới vào một boss.
- Nhân vật **tự đánh**, người xem dùng bình luận để kích hoạt đòn đặc biệt, không cần spam mới có thể tham gia.
- Không có chiến trường nào có người thì **không** tạo boss/không mô phỏng đánh nhau của chiến trường đó.
- Đối với số liệu từ tài liệu thiết kế `Live tiktok game.pdf`, giữ nguyên trừ khi `GAME_DESIGN.md` có điều chỉnh rõ ràng được người dùng chấp nhận.
- Giai đoạn này phải tái sử dụng `GameEngine`, `ItemService`, `PlayerStore`, animation, event/camera pipeline đã có; không phá code giai đoạn 1 và 2.

## 1. Tính năng người dùng sẽ thấy

1. Đồng hồ giai đoạn tu luyện đếm từ 10:00 về 00:00 (có thể chỉnh trong admin).
2. Hết giờ: thông báo **MA GIỚI XÂM LƯỢC**, nhân vật dịch chuyển khỏi tông môn, camera vào chiến trường.
3. Người xem được phân vào chiến trường phù hợp: Phàm Nhân không đứng chung với Phi Thăng.
4. Quái thường tự xuất hiện, đi đến đệ tử và tấn công; đệ tử tự đánh/có animation thật.
5. Người xem demo bình luận `1` tạo Kiếm Khí Trảm x2 sát thương, hồi 10 giây; bình luận `2` tạo Thiên Lôi Quyết x3 sát thương, hồi 25 giây.
6. Mỗi chiến trường có ba boss theo lịch, có máu riêng, hiệu ứng riêng, sát thương góp vào bảng TOP.
7. Hết 5 phút: tổng kết từng chiến trường, xướng TOP 3, trao thưởng sau khi trở về tông môn.
8. Bắt đầu chu kỳ tu luyện tiếp theo; buff tu luyện vẫn đúng thời gian hiệu lực còn lại.

## 2. Máy trạng thái chu kỳ và thời gian

### 2.1 State machine

```text
STOPPED
   ↓ Start
CULTIVATION (mặc định 600 giây)
   ↓ hết giờ / admin chuyển pha
BATTLE_PREPARE (khóa cảnh giới, phân chiến trường)
   ↓
BATTLE (mặc định 300 giây)
   ↓
BATTLE_RESULT (chốt sát thương, chống phát trùng)
   ↓
RETURN_TO_SECT (áp dụng thưởng hợp lệ, khôi phục EXP)
   ↓
CULTIVATION (chu kỳ mới)
```

- `paused` có thể áp vào bất kỳ pha nào: đóng băng đồng hồ gameplay, AI và cooldown, không có tích lũy lén.
- Dùng đồng hồ server có `phaseStart`, `elapsedActiveMs`, `remainingMs`, `cycleId`, `battleId`; không reset khi trình duyệt tải lại.
- Admin có thể chỉnh 10 phút/5 phút trong cấu hình, nhưng phải có validation (không cho 0, âm, NaN hoặc mức gây treo); các bài test có thể dùng 10 giây/15 giây hoặc clock giả.
- `BATTLE_PREPARE`, `BATTLE_RESULT`, `RETURN_TO_SECT` là bước chuyển logic có thời hạn rõ; không cộng nhầm vào 300 giây đánh boss trừ khi người dùng yêu cầu.
- Khi restart giữa trận: quy định cụ thể cách khôi phục `battleId`, `elapsedActiveMs`, HP boss và thưởng đã phát; tránh hoàn tất cùng trận hai lần.

### 2.2 Quy tắc đóng băng tu vi

Hàm tăng tu vi phải kiểm tra ở **cùng một tầng server duy nhất**:

```text
if phase != CULTIVATION or paused: expGain = 0
```

- Không thể bypass bằng bình luận, quà, item, admin demo ở chế độ game thật.
- Hiệu ứng x2 đang chạy phải **đóng băng đồng hồ hiệu lực**; sau khi về tông môn, tiếp tục đúng thời gian còn lại.
- Các sự kiện trao EXP trong chiến đấu chuyển thành **pendingRewards** (hoặc inventory chờ xử lý); không gọi hàm cộng tu vi ngay.
- Người xem lên cảnh giới tại giây cuối trước khi khóa chiến trường thì dùng cảnh giới đã được server chốt tại thời điểm bước vào `BATTLE_PREPARE`.

## 3. Tổ chức 11 chiến trường độc lập

| ID | Chiến trường | Cảnh giới | Gợi ý tông màu/khung cảnh |
|---:|---|---|---|
| 0 | Phàm Giới | Phàm Nhân | Đất nứt, đá xám, sương nhẹ |
| 1 | Luyện Khí Cốc | Luyện Khí | Hẻm núi xanh lam |
| 2 | Trúc Cơ Trận | Trúc Cơ | Rừng đá và pháp trận |
| 3 | Kim Đan Vực | Kim Đan | Cồn cát vàng, phù văn |
| 4 | Nguyên Anh Cảnh | Nguyên Anh | Không gian huyền tím |
| 5 | Hóa Thần Chiến Trường | Hóa Thần | Đỉnh núi bão sét |
| 6 | Luyện Hư Ma Vực | Luyện Hư | Vực tối và tinh thạch |
| 7 | Hợp Thể Thiên Vực | Hợp Thể | Hòn đảo nổi, mây đỏ |
| 8 | Đại Thừa Ma Giới | Đại Thừa | Dung nham, cổng ma |
| 9 | Độ Kiếp Chiến Trường | Độ Kiếp | Sấm chớp và đá cổ |
| 10 | Phi Thăng Thần Vực | Phi Thăng | Không gian sao, thần quang |

Mỗi `Battlefield` có ít nhất:

```js
{
  id, realmIndex, battleId,
  participantIds: [],
  joinedAtByUser: {},
  mobs: [],
  activeBoss: null,
  bossHistory: [],
  damageByUser: {},
  rewardState: 'pending',
  status: 'inactive|running|finished'
}
```

- **Tính toán song song 11 chiến trường ở máy chủ**, chỉ render chi tiết chiến trường camera đang xem.
- Chiến trường không người không phát sinh quái/boss và không tiêu tốn tick chiến đấu.
- Một người: vẫn có trận và boss điều chỉnh cho solo; phần thưởng TOP phải tuân thủ chính sách riêng.
- Hai người trở lên: tính bảng xếp hạng theo sát thương, có TOP 1–2 hoặc TOP 1–3 nếu đủ người.
- Người vào muộn sau khi trận bắt đầu được tham gia chiến trường tương ứng nếu trận chưa kết thúc. Ghi thời gian tham gia thực tế; không tự ý hồi lại boss đã chết hoặc đổi HP boss đang đánh.
- Tên/tông màu được dùng để phân biệt chiến trường nhưng 11 scene 3D **không cần render đồng thời**.

## 4. Quái vật procedural và AI tự chiến đấu

### 4.1 Tạo quái bằng code

Không dùng mô hình, ảnh hoặc animation tải về. Tối thiểu ba loại quái:

- `Ma Binh`: hình người giáp đen, đầu có sừng, mắt đỏ.
- `Ám Linh`: linh thể bay, di chuyển lượn sóng, phát ánh tím.
- `Thạch Ma`: thân từ các khối đá, tay lớn, di chuyển chậm.

Mỗi loại có `hp`, `atk`, `def`, `moveSpeed`, `attackInterval`, `targetId`, `spawnTime`, `status`. Chuyển động: đi, vung tay/kiếm, bị đánh, tiêu biến khi chết. Dùng primitive geometry/InstancedMesh và pool.

### 4.2 Mật độ quái và nhịp chiến đấu

- Số lượng quái sinh ra ban đầu/qua các đợt tham khảo **3 × số người ra trận** theo tài liệu.
- **Không render toàn bộ** khi người đông; gộp hoặc cull quái ngoài màn, giới hạn mesh chi tiết, không giới hạn dữ liệu chỉ vì đồ họa.
- Nếu cần giới hạn số quái đang hoạt động để bảo vệ server, tạo hàng đợi spawn và duy trì tổng số lượng đã định; đặt giới hạn cấu hình được và ghi lại các quái chưa spawn.
- Khi nhân vật bị hạ gục: có animation, hồi sinh sau thời gian đề xuất 8–15 giây; không mất nhân vật/cảnh giới. Thời gian và luật hồi sinh là thiết kế bổ sung có thể chỉnh.
- Có lựa chọn mục tiêu hợp lý (quái gần nhất hoặc boss đang hoạt động), tránh mỗi tick đổi mục tiêu gây giật.

### 4.3 Công thức sát thương

Tách thành các hàm thuần, thống nhất cho nhân vật/quái/boss. Ví dụ **đề xuất**, có thể điều chỉnh:

```text
rawDamage = attack * skillMultiplier
actualDamage = max(1, floor(rawDamage * 100 / (100 + targetDefense)))
```

- Công thức là **đề xuất triển khai**, không được ghi nhầm là công thức đã có trong PDF.
- Sát thương gây ra bị chặn ở số HP thực tế còn lại: không tính overkill vô hạn vào bảng TOP.
- DamageByUser phải cộng qua một hàm `applyDamage()` duy nhất, không cho client khai báo số sát thương tùy ý.
- Chặn HP âm, NaN, Infinity, damage âm; xác thực người chơi và mục tiêu còn hợp lệ.
- Dùng thời gian server để tính tốc độ đánh, không đánh nhiều hơn vì máy client nhanh.
- Sát thương vào boss/quái phải phân biệt; có thể chấm đóng góp theo sát thương thực tế gây cho boss và quái với hệ số định trước, mặc định ưu tiên **tổng sát thương thực**; công bố luật ở UI.

## 5. Hai kỹ năng qua bình luận

### Kỹ năng 1 — Kiếm Khí Trảm

- Lệnh `1`, sát thương **x2** của một đòn chuẩn.
- Hồi chiêu **10 giây** (thời gian chiến đấu thực tế).
- Animation vung kiếm và lưỡi kiếm khí bay đến mục tiêu.

### Kỹ năng 2 — Thiên Lôi Quyết

- Lệnh `2`, sát thương **x3** của một đòn chuẩn.
- Hồi chiêu **25 giây**.
- Animation nhân vật giơ tay/kiếm, vòng pháp trận mở, tia lôi đánh xuống mục tiêu.

Các yêu cầu:

- Nhận sự kiện giả từ **cùng** `CommandRouter` sẽ dùng cho TikTok thật.
- Lệnh có tác dụng chỉ khi `phase === battle`, nhân vật đã nhập môn, đang tham chiến, còn sống và cooldown đã hết.
- Cooldown **theo từng userId và từng kỹ năng**, chống replay sự kiện.
- Nếu đang trong cooldown: không gây damage, có thể hiển thị thông báo nhẹ; không spam hiệu ứng.
- Khi một người gửi `1` hoặc `2` nhiều lần cùng thời điểm, chỉ nhận lần hợp lệ đầu tiên.

## 6. Ba boss và lịch xuất hiện

Một trận mặc định 300 giây:

| Boss | Khung thời gian theo thiết kế | Đặc điểm | Hệ số K mặc định gợi ý |
|---|---|---|---:|
| Ma Binh Thống Lĩnh | 0–90 giây | Dễ, giáp đen, rìu và sóng xung kích | 0.65 |
| Huyết Ma Tướng Quân | 100–190 giây | Trung bình, giáp đỏ, triệu hồi ma binh | 0.85 |
| Vạn Kiếp Ma Tôn | 200–290 giây | Khó nhất, nhiều pha, cuồng nộ | 1.0 |

- Các khoảng 90–100, 190–200 và 290–300 dùng để chuyển cảnh/đợt quái/tổng kết; mặc định không cho boss 1 kéo dài sang boss 2.
- Nếu boss chết trước mốc kết thúc: hiển thị trạng thái **ĐÃ TIÊU DIỆT**, chuyển sang đánh quái thường hoặc chuyển cảnh phù hợp. Có thể cấu hình chuyển sớm, nhưng phải nhất quán giữa dữ liệu và đồng hồ.
- Nếu hết khung mà boss chưa chết: đánh dấu `escaped`/`timeout`, không tự cho là đã đánh bại; chuyển boss mới đúng lịch.
- Boss 3 cần ít nhất hai trạng thái ngoại hình/kỹ năng: thường và cuồng nộ (ví dụ dưới 30% HP).
- Tạo boss bằng nhóm mesh/hình khối, tự diễn hoạt các bộ phận; khác rõ hình dáng, kích thước, màu và chiêu thức.

### 6.1 Máu boss thích ứng

Theo thiết kế:

`HPboss = N × DPS_chuan × 90 × K`

Trong đó:

- `N` = số người tham gia **hợp lệ tại thời điểm boss spawn**, tối thiểu 1.
- `DPS_chuan` = DPS chuẩn của một nhân vật ở cảnh giới chiến trường đó, tính từ ATK và tốc độ đánh theo một hàm cấu hình được.
- `90` = thời gian đánh boss tham khảo (giây).
- `K` = hệ số độ khó (0.65 / 0.85 / 1.0 mặc định).

Cần làm rõ và kiểm thử:

- Chốt HP tối đa **một lần khi boss xuất hiện**. Người mới đến không làm boss tăng HP đột ngột.
- HP boss theo cảnh giới thấp có thể nhỏ hơn nhiều so với cảnh giới cao; không ép mọi chiến trường dùng 1 triệu HP.
- Khi chỉ có 1 người, boss vẫn có lượng HP hợp lý; có thể áp dụng hệ số solo nếu kiểm thử cho thấy không thể đánh thắng.
- Tính DPS không dựa trên FPS hay số lượng mesh; kết quả battle phải ổn định khi tắt đồ họa.
- Không lấy giá trị random mỗi frame để làm HP/DEF boss thay đổi vô lý.

## 7. Bảng TOP và phần thưởng

### 7.1 Bảng đóng góp

Mỗi chiến trường lưu:

- `userId`, tên, cảnh giới **đã khóa cho trận**, thời gian tham chiến, tổng sát thương hợp lệ, số boss tham gia, số đòn đặc biệt hợp lệ.
- TOP được sắp theo sát thương giảm dần; khi bằng nhau dùng quy tắc hòa xác định (ví dụ người đạt mốc trước), không xếp hạng ngẫu nhiên.
- Top chiến trường **độc lập**; không mang điểm gây ở chiến trường này sang chiến trường khác.
- Trên `/song`, bảng TOP sát thương của chiến trường đang quan sát luôn cập nhật.
- Cuối trận, Thiên Đạo thông cáo TOP 3 của từng chiến trường có người. Camera không bắt buộc chiếu lần lượt cả 11 lễ trao giải khi quá đông: có hàng chờ và màn tổng kết, nhưng không được bỏ mất phần thưởng.

### 7.2 Quy tắc thưởng cơ bản từ thiết kế

| Hạng | Thưởng |
|---|---|
| TOP 1 | +5 tiểu cảnh giới |
| TOP 2 | +4 tiểu cảnh giới |
| TOP 3 | +3 tiểu cảnh giới |
| Còn lại có đóng góp hợp lệ | +1 tiểu cảnh giới và 1 lượt Ban Phúc |

**Lưu ý tài liệu gốc:** có một dòng `TOP 1: +3` lặp lại sau TOP 2; bản triển khai này hiểu là **TOP 3**, phù hợp với yêu cầu thông cáo TOP 3. Ghi đây là cách giải quyết lỗi đánh máy, không lặng lẽ coi là dữ liệu gốc hoàn toàn rõ ràng.

- Dưới 3 người: chỉ trao đúng các vị trí thực tồn tại; không tạo TOP ảo.
- **Đề xuất V1:** chiến trường một người nhận thưởng hoàn thành cơ bản thay vì mặc định thưởng TOP 1; làm rõ trong cài đặt.
- Không tham gia/không đóng góp: không tự cấp thưởng xếp hạng.
- Người chơi chỉ nhận thưởng **một lần** cho `battleId`.
- **Quan trọng:** +5/+4/+3 là số bước tiến cấp, không được tự đi xuyên qua mốc **Viên Mãn → cảnh giới kế tiếp** nếu chưa độ kiếp. Lưu bước còn dư ở `pendingStageRewards`, áp dụng tiếp sau khi độ kiếp thành công ở giai đoạn tu luyện.
- Vật phẩm thưởng phải được lưu vào túi hoặc hàng chờ, không kích hoạt trước khi battle kết thúc.
- Nếu có trường hợp thưởng vượt đỉnh Phi Thăng, chuyển thành phần thưởng đỉnh cao có cấu hình; không tạo cảnh giới thứ 12.

### 7.3 Trình tự kết thúc trận

1. Đóng ghi nhận damage/số liệu trận.
2. Chốt kết quả 11 chiến trường đang hoạt động, tạo `resultId` idempotent.
3. Hiển thị thông cáo TOP 1–3, kết quả các boss, tên người đánh đòn cuối nếu có.
4. Chuyển nhân vật về tông môn.
5. Mở pha tu luyện mới; áp dụng `pendingStageRewards` theo đúng cổng độ kiếp, item và thưởng hợp lệ.
6. Tiếp tục đồng hồ buff tu luyện và chu kỳ tiếp theo.

## 8. Camera, hiệu ứng 3D và giao diện

### 8.1 Camera

- Khi chiến đấu, ưu tiên chiến trường có boss đang đánh, xen kẽ người gây nhiều sát thương.
- Tự chuyển giữa **các chiến trường đang có người**, không cần render 11 scene cùng lúc.
- Có thời gian tối thiểu trên một cảnh (gợi ý 5–10 giây), không chuyển mỗi bình luận.
- Khi có hiệu ứng sự kiện quan trọng, đưa vào hàng chờ camera để Giai đoạn 4 hỗ trợ quà tặng.
- Khi boss chết, zoom out/slow transition; khi boss 3 cuồng nộ, camera nhấn mạnh nhưng không giật vô hạn.

### 8.2 Đồ họa procedural

- Ba loại quái thường, ba mô hình boss khác nhau, cổng ma giới, nền đá/dung nham/đồi nổi.
- Kiếm khí, thiên lôi, đòn lan, máu trừ, thanh HP boss; toàn bộ dựng bằng geometry, shader/particle code.
- Có object pooling, giới hạn particle, giảm hiệu ứng trên preset Low.
- Không tải GLTF, MP3, ảnh, texture hoặc shader từ CDN.

### 8.3 Overlay `/song`

Trong pha battle, ưu tiên: tên chiến trường, đồng hồ 05:00, boss hiện tại, HP boss, TOP 5 sát thương, người vừa dùng kỹ năng, thông báo boss chết và tổng kết. Giai đoạn battle phải rõ ràng khác giao diện tu luyện; không hiển thị một thanh boss dùng chung cho tất cả chiến trường.

## 9. Cấu hình và các module đề xuất

- `cycleService.js`: quản lý vòng 10/5 và pause/resume.
- `battleService.js`: tạo battleId, chiến trường và người tham gia.
- `combatService.js`: tìm mục tiêu, hồi chiêu, tính damage, knock-out/hồi sinh.
- `monsterFactory.js`, `bossFactory.js`: dữ liệu và mô hình hiển thị tương ứng.
- `rewardService.js`: khóa kết quả, TOP và pending rewards.
- `battleScene.js`: đồ họa chiến trường.

Các giá trị chỉnh được tại `caidat.json`:

```json
{
  "cycle": { "cultivationSeconds": 600, "battleSeconds": 300 },
  "skills": {
    "1": { "multiplier": 2, "cooldownSeconds": 10 },
    "2": { "multiplier": 3, "cooldownSeconds": 25 }
  },
  "boss": {
    "spawnWindows": [[0,90], [100,190], [200,290]],
    "difficultyK": [0.65, 0.85, 1.0]
  },
  "rewards": { "top1": 5, "top2": 4, "top3": 3, "others": 1 }
}
```

Đây là cấu hình minh họa phần battle, **không ghi đè** các mục cấu hình từ giai đoạn trước; cần merge và validate.

## 10. Kiểm thử bắt buộc

| Mã | Kịch bản | Kỳ vọng |
|---|---|---|
| 03-01 | Hết 600 giây tu luyện | Vào battle, thời gian còn 300 giây |
| 03-02 | Tick 60 giây khi battle | Tu vi tất cả người chơi không thay đổi |
| 03-03 | Item EXP trong battle | Lưu/tạm hoãn; không tăng EXP hoặc trừ thời hạn |
| 03-04 | Có người ở 3 cảnh giới | Tạo 3 chiến trường riêng, không đánh chung boss |
| 03-05 | Chiến trường không người | Không sinh quái hoặc boss |
| 03-06 | Chiến trường 1 người | Có boss solo theo công thức, không có TOP ảo |
| 03-07 | Nhân vật thường không bình luận | Vẫn tự đánh và gây damage |
| 03-08 | Bình luận `1` hợp lệ | x2 damage, khóa 10 giây |
| 03-09 | Bình luận `2` hợp lệ | x3 damage, khóa 25 giây |
| 03-10 | Spam `1` trong cooldown | Không nhân số đòn hoặc số damage |
| 03-11 | Boss 1/2/3 theo lịch | Đúng cửa sổ và chiến trường riêng |
| 03-12 | Người vào muộn khi boss sống | Được tham chiến, HP boss không đột ngột thay đổi |
| 03-13 | Boss chết trước lịch | Không có HP âm; xử lý chuyển cảnh đúng |
| 03-14 | Boss chưa chết khi hết khung | Ghi timeout/escaped, không tính là đã giết |
| 03-15 | TOP 3 có 4 người | Thưởng 5/4/3 và người thứ 4 +1/Ban Phúc |
| 03-16 | Thưởng +5 vượt qua Viên Mãn | Không nhảy cảnh giới trái phép; có pending bước dư |
| 03-17 | Gọi kết thúc cùng battleId hai lần | Chỉ phát thưởng một lần |
| 03-18 | Hết 300 giây | Về tông môn, sang chu kỳ mới, buff tiếp tục |
| 03-19 | Chuyển camera giữa các chiến trường | Không reset boss hoặc mô phỏng chiến trường khác |
| 03-20 | Reload `/song` giữa battle | Hiển thị đúng HP/boss/đồng hồ hiện tại |

Dùng clock giả trong unit test để kiểm tra cả chu kỳ trong vài giây **nhưng vẫn phải có chế độ demo thật** để streamer trải nghiệm hoạt cảnh.

## 11. Điều kiện nghiệm thu

- [ ] Chạy được đúng chu kỳ 10 phút – 5 phút và có cấu hình chỉnh thời gian.
- [ ] Server đóng băng hoàn toàn tu vi/buff trong chiến đấu.
- [ ] Có **11 chiến trường tính toán độc lập**, chỉ render scene cần thiết.
- [ ] Quái và nhân vật đánh nhau tự động bằng dữ liệu thật.
- [ ] Lệnh `1`, `2` gây đúng hệ số và cooldown.
- [ ] Có ba boss, HP thích ứng và các đợt xuất hiện đúng lịch.
- [ ] TOP và phần thưởng ghi đúng chiến trường, không phát trùng.
- [ ] Không vượt cổng độ kiếp khi áp dụng thưởng tăng tiểu cảnh giới.
- [ ] Nhân vật quay về tông môn và tu luyện lại được.
- [ ] Không phá hoạt cảnh, dữ liệu và hành vi đã làm ở Giai đoạn 1–2.
- [ ] `PROGRESS.md` ghi PASS/FAIL/CHƯA KIỂM CHỨNG.

**Dừng sau Giai đoạn 3.** TikTok thật sẽ được tích hợp ở Giai đoạn 4 thông qua bộ nhận sự kiện chung.
