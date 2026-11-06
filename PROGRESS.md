# Trạng thái bàn giao lên Git — 06/11/2026

Theo yêu cầu mới của người dùng, chuẩn bị commit/push toàn bộ mã nguồn, tài liệu và tài nguyên mới hiện có lên `https://github.com/hungdzx1/test_game_live.git`. Yêu cầu này thay cho giới hạn không commit/push ở các lượt triển khai trước. Không reset dữ liệu và không chuyển sang 06.3.

## 06.2 — Đã có mã nguồn, CHƯA NGHIỆM THU HIỆU NĂNG

- Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, 00_TONG_QUAN.md, 02_NHAN_VAT_BOSS.md và khảo sát code. Baseline trước sửa: **84 bài, 83 PASS / 0 FAIL / 1 SKIP**; có ảnh/telemetry browser trước sửa trong `test-results/phase06-2/baseline.json`.
- Tạo `public/js/proceduralCostumes.js`: model 3D procedural, geometry màu đỉnh gộp theo khối cứng, cache hữu hạn theo biến thể; 6 tóc, 5 đạo bào, 4 pháp khí, 6 bảng màu, chọn ổn định từ seed. Không dùng ảnh làm sprite/model.
- Sửa `public/js/characters.js`: tỉ lệ đầu/thân cân đối hơn, cổ/vai, áo nhiều lớp, tay áo rộng, đai, tà/lụa/tóc chuyển động, chân/knee để ngồi xếp bằng; giữ 12 animation. LOD theo khoảng cách/chất lượng/focus/độ kiếp; nhãn nhỏ, viền vàng, giảm opacity theo xa và tối đa khoảng 8 nhãn thường + người focus. Giữ lựa chọn 12 đại diện sân và giới hạn 40/60 của 06.1.
- Sửa riêng `EnemyView` và nối cờ Low trong `public/js/battleScene.js`: ba boss giáp tối/rìu, áo đỏ/kiếm, vương miện/pháp luân tím; quái có hình dạng mới, động tác theo state cũ; HP nằm trên giới hạn model, chết/biến mất và pool cũ còn giữ.
- Tạo `test/character-upgrade.test.js` (5 bài): hình học thực của các biến thể/seed/reload, 12 pose, 11 realm, LOD/nhãn/40–60, tài nguyên dùng chung và boss/HP/movement/death.
- Tạo `scripts/characters-browser-smoke.js`: app/profile/dữ liệu tạm, ảnh thật /song 9:16, high/low, 10/60 người, reload seed, ba boss, giới hạn 60/40, quay về và kiểm tra cache ổn định. Điều chỉnh budget tài nguyên của `scripts/sect-browser-smoke.js` cho cache model mới; **chưa chạy lại script 06.1 sau thay đổi này**.
- Không sửa thêm scene/layout/camera/main/realmAura/effects/primitives, API/WS/backend/quà/lưu trữ trong 06.2. Các diff của 06.1/UI trước đó được giữ để commit cùng theo yêu cầu.

| Kiểm chứng | Kết quả |
|---|---|
| `npm.cmd test` trước push | **PASS: 89 bài — 88 PASS / 0 FAIL / 1 SKIP**; log local `test-results/push-node-test.txt` |
| 5 test mới về model/pose/LOD/seed/boss; các test cũ và framing 06.1 | **PASS** |
| Cú pháp module/test/script | **PASS**; cached diff có cảnh báo khoảng trắng Markdown xuống dòng trong tài liệu giai đoạn mới, giữ nguyên tài liệu người dùng |
| Browser /song 720×1280, 1080×1920, 10/60 người, Low/High, cùng seed sau reload, tên thưa, ba boss và trở về | **PASS chức năng**; báo cáo local `test-results/phase06-2/browser-report.json`, 2026-11-06T11:19:42.762Z, 0 exception |
| WebGL sau trở về trong lượt ngắn | **PASS có giới hạn**: hai mẫu cùng 282 geometry / 25 texture; không chứng minh chạy dài hạn |
| Hiệu năng High với 60 nhân vật chi tiết trong battle | **CHƯA ĐẠT NGHIỆM THU**: đã có mẫu 9.6 FPS (boss 2) và 26.4 FPS (boss 3). Cần giới hạn thêm số model full-detail khi nhiều người đứng gần camera, đo lại trước khi tuyên bố xong 06.2 |
| Smoke server LIVE/finishing chạy riêng sau 06.2; hồi quy browser 06.1 vừa sửa budget | **CHƯA KIỂM CHỨNG trong lượt 06.2**; các kết quả cũ ở phần lịch sử không thay cho lần chạy mới |
| LIVE thật, OBS/LIVE Studio, âm thanh thực và nhiều giờ vận hành | **CHƯA KIỂM CHỨNG** |

Số đo browser cuối (Chrome 156, cùng môi trường headless đã dùng ở 06.1): sân 10/high 48.4 FPS, 192 draw calls (baseline 46.9 / 278); sân 60/high, hiển thị 12 đại diện: 55.2 / 212 (baseline 55.8 / 317). Battle High 60: 41.4 / 773, 9.6 / 1475, 26.4 / 1461 theo ba boss; battle Low 40: 49.8 / 458. Đây là cửa sổ ngắn, trạng thái giao chiến khác nhau, không phải benchmark kiểm soát; không bỏ qua mẫu FPS thấp để tuyên bố tối ưu thành công. Cache geometry tăng do model gộp theo biến thể; đã kiểm tra không dispose nhầm tài nguyên dùng chung.

Ảnh local trước/sau: `test-results/phase06-2/before-song-sect.png`, `song-sect.png`, `song-disciple-front.png`, `song-sect-1080.png`, `song-tribulation.png`, `song-boss-1.png`, `song-boss-2.png`, `song-boss-3.png`, `song-battle-low.png`, `song-return.png`. Các ảnh/log kiểm thử vẫn thuộc test-results được ignore. Model là low/medium-poly procedural, không chi tiết bằng concept 2D. HUD cũ che một phần đầu boss trong ảnh; chưa sửa HUD 06.5 hoặc bố cục battle 06.4.

## Tài nguyên PNG mới được yêu cầu đưa lên Git

Thư mục `public/assets/` có **26 PNG**: 6 Architecture layers, 4 Background layers, 7 tư thế Character_1, 5 FX layers và 4 UI. Đây là tài nguyên đang có sẵn trong workspace do người dùng yêu cầu push, không phải ảnh tải/generate trong triển khai model 06.2. Chưa nối chúng vào /song; trang game vẫn dựng bằng Three.js. Chỉ kiểm tra định dạng PNG, không tuyên bố đã nghiệm thu hình ảnh/nguồn gốc/quyền sử dụng các tệp đó. Không đưa node_modules, dữ liệu người chơi, .env, log hoặc backup vào commit.

**Việc còn lại của 06.2:** tối ưu LOD cho nhóm đông ở gần camera, chạy lại browser/performance và các smoke chưa chạy, cập nhật trạng thái nghiệm thu. Dừng ở 06.2, không chuyển 06.3. Phần dưới là lịch sử theo thời điểm triển khai.

---

# 06.1 — Tông môn và đài độ kiếp trong cùng khung 9:16

**06/11/2026 — Chỉ bước 06.1.** Đã triển khai và kiểm chứng bố cục bằng WebGL thực trong Chrome headless. Dừng tại đây; chưa triển khai 06.2–06.5, không commit/push.

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, 00_TONG_QUAN.md và 01_TONG_MON.md; khảo sát scene, presentation, camera, nhân vật, main, API/state và các smoke script trước khi dùng. Git đầu phiên có sẵn thay đổi UI quản trị, tài liệu, script/test và `caidat.json` (orbit → auto); giữ nguyên các thay đổi đó. Baseline **trước sửa code sản phẩm**: `npm.cmd test` **81 bài, 80 PASS / 0 FAIL / 1 SKIP**. Chrome cũng đã mở `/song` trước sửa: thấy sân nhưng đài ngoài khung; ảnh và telemetry baseline được lưu riêng.

## Phạm vi và tệp thay đổi của 06.1

| Tệp | Thay đổi |
|---|---|
| `public/js/sectLayout.js` (mới) | Nguồn tọa độ chung: SECT_COURTYARD_CENTER, TRIBULATION_PLATFORM_CENTER, SECT_CAMERA_ANCHOR; bounding volumes và 12 chỗ thiền |
| `public/js/scene.js` | Sân tròn phía dưới, pháp trận cyan/tím, điện mái cong liền khối bên trái/phía sau, cửa sáng ấm, cờ hình học, bậc thang, cổng lệch trái, cầu đá, lan can phía sau, cây hoa/cánh hoa, kiếm bay, núi, đảo nhỏ, mây và thác. Gạch/kiến trúc lặp được gom InstancedMesh theo geometry/material |
| `public/js/breakthroughScene.js` | Đảo đài nâng cao phía trên/phải, tâm bệ và vòng sáng, cột linh khí mờ, đèn, thác; TRIBULATION là alias của anchor chung. Giữ lịch sét, mây xoáy, flash, kết quả và Low giảm rung/flash |
| `public/js/presentationState.js` | Chỉ đổi tọa độ trình diễn về các chỗ thiền; vẫn trả đủ mọi userId. Giữ độ lệch đi dạo demo theo tọa độ home, animation cũ và vị trí chiến đấu. Người độ kiếp dùng đúng anchor, không ghi ngược vào snapshot/server |
| `public/js/characters.js` | Chỉ sửa lựa chọn đại diện: bình thường tối đa 12 ở sân; người được focus thay đại diện cùng chỗ, người độ kiếp vẫn hiện (tối đa 13). Battle giữ giới hạn 40/60 như cũ. Không sửa mesh/ngoại hình/animation nhân vật |
| `public/js/camera.js` | Góc overview dùng anchor chung, khởi tạo ổn định; auto ở tông môn không tự chuyển sang shot cận ngẫu nhiên làm mất đài. Orbit cũ thu biên độ về góc overview. Giữ queue/ưu tiên/cooldown/manual focus và camera battle; shot nghi thức/kết quả dùng overview nhìn được hai khu |
| `public/js/main.js` | Thêm đúng một điều kiện show/hide group đài theo effectivePhase, để vị trí mới không lọt vào chiến trường; không đổi connect, state/event hay vòng render |
| `test/sect-layout.test.js` (mới) | Ba test framing 9:16, snapshot bất biến/tọa độ dùng chung/đi dạo, đại diện/focus/ceremony/battle/resource reuse |
| `test/breakthrough-visual.test.js` | Cập nhật kỳ vọng tọa độ/góc nhìn sang anchor mới; vẫn kiểm tra 1–10 đợt sét, pose cast/hit, Low và pool item |
| `scripts/sect-browser-smoke.js` (mới) | Kiểm thử `/song` bằng Chrome/CDP với server, profile và dữ liệu tạm; ảnh, probe chỉ đọc scene/camera, WS và telemetry thực |
| `PROGRESS.md` | Ghi nhận bước này, bằng chứng và giới hạn; giữ lịch sử cũ bên dưới |

Không tải ảnh/model/texture/font/âm thanh ngoài. Hai ảnh người dùng là hướng bố cục, không nhúng làm nền. Không sửa server, gameEngine/services, TikTok adapter, network/WS, quy tắc quà, schema hay tệp người chơi thật. Không sửa thêm `caidat.json`; lựa chọn camera cục bộ trước phiên vẫn giữ nguyên. HTML/CSS/HUD và chiến trường không được thiết kế lại trong bước này.

## Kết quả kiểm thử

| Trường hợp | Trạng thái | Bằng chứng |
|---|---|---|
| Hồi quy toàn bộ `npm.cmd test` | **PASS** | **84 bài: 83 PASS / 0 FAIL / 1 SKIP**, gồm cả 80 bài PASS baseline; [log](test-results/phase06-1/node-test.txt). SKIP LIVE thật giữ nguyên |
| Cú pháp các module sản phẩm/script mới sửa; `git diff --check` | **PASS** | Các lệnh node --check và diff không báo lỗi |
| 720×1280 và 1080×1920 | **PASS** | Camera thực + phép chiếu bounding volumes đều giữ sân và đài trong khung; đã mở ảnh để kiểm tra vị trí/độ rõ |
| Demo 10 và 60 | **PASS** | 10 người hiện 10; 60 người hiện 12 đại diện thiền theo vòng cung, vẫn có 60 ở server. Tên thưa hơn, không overhaul nameplate |
| Tâm đài / độ kiếp / reload | **PASS** | Nhân vật thực tới đúng x/z và cao độ anchor + .3; pause/reload/resume giữ nguyên ritual ID và kết quả do server quyết định. Sét model 1–10 đợt vẫn PASS |
| Chuyển cultivation → độ kiếp → battle → kết quả → trở về | **PASS** | API/state/WebGL thực; sân và đài cùng ẩn/hiện; chiêu 1 chạy, EXP dừng trong battle. Không đổi thuật toán. Ảnh return có thể đang có nghi thức mới do thưởng cũ đưa người chơi vào queue |
| Focus người ngoài 12 đại diện / Low | **PASS** | Focus demo-60 qua API cũ hiển thị đúng người; Low giữ framing, tắt bóng; tư thế/animation, fallback và audio gate cũ còn nguyên |
| WebSocket / lỗi trình duyệt | **PASS** | Một WS đang mở; lần cuối nhận 328 snapshot và 365 game event; 0 Runtime exception; không ghi file LIVE trong dataRoot tạm |
| Tài nguyên WebGL trong lượt thử ngắn | **PASS có giới hạn** | 9 geometry/15 texture trước nghi thức với 60 người → 10/16 sau nghi thức/battle/trở về → ổn định 10/16. Geometry thêm là đường sét đã tạo sẵn, lần đầu visible mới upload. Không chứng minh không leak khi chạy nhiều giờ |
| `node scripts/live-smoke.js` | **PASS** | Combo final/replay chỉ tính một lần, battle giữ EXP/buff, reconnect demo, quà chờ được áp dụng khi về; [báo cáo](test-results/phase4-smoke.json) |
| `node scripts/finishing-smoke.js` | **PASS khi chạy riêng lại** | 500 người/11 cảnh giới, 2 chu kỳ rút gọn ×10, đủ boss/thưởng idempotent và restart giữ dữ liệu. Lần cuối đo tối đa 80 effect/s, 8 snapshot/s; [báo cáo](test-results/phase5-smoke.json), [log](test-results/phase06-1/finishing-smoke.txt) |
| LIVE TikTok thật, OBS/LIVE Studio, nghe âm thanh/TTS, chạy dài hạn | **CHƯA KIỂM CHỨNG** | Không suy ra PASS từ headless/demo/unit tests |

Một lần chạy finishing-smoke trước đó **FAIL** ở assertion số effect nhận trong cửa sổ 1s ≤84. Chạy riêng lại script không sửa đổi đạt 80. Chưa xác định chắc nguyên nhân lần lệch ngưỡng; script này không chạy frontend. Ghi nhận độ nhạy timing của kiểm thử, không sửa WebSocket/backend ngoài phạm vi 06.1 và không tuyên bố đã khắc phục nguyên nhân đó.

## Ảnh thực và số đo

Chrome **156.0.8078.81**, Node **v24.13.1**, Windows; renderer thực: **ANGLE / Intel HD Graphics P530 / Direct3D11**. Browser có profile mới và app dùng thư mục tạm, không gắn vào tab/profile người dùng. [Báo cáo cuối](test-results/phase06-1/browser-report.json) lúc **2026-11-06T10:47:42.584Z**, [log](test-results/phase06-1/browser-test.txt).

| Mẫu telemetry | FPS | Draw calls | Triangles | Geometry / texture | Nhân vật chi tiết |
|---|---:|---:|---:|---:|---:|
| Trước sửa: 10 người, 720×1280, medium | 52.0 | 396 | 30,970 | 7 / 12 | 10 |
| Sau sửa: 10 người, 720×1280, medium | 46.0 | 278 | 48,016 | 9 / 13 | 10 |
| Sau sửa: 60 người, 1080×1920, medium | 54.4 | 317 | 51,616 | 9 / 15 | 12 |
| Sau trở về/hiệu ứng ổn định, medium | 59.8 | 340 | 54,946 | 10 / 16 | 13 |

Draw calls với 10 người giảm 396 → 278 nhờ instancing, nhưng triangle tăng và mẫu FPS thấp hơn baseline. Đây là các cửa sổ đo ngắn từ frame thật, không phải benchmark lặp có kiểm soát hay cam kết FPS trong OBS. Low được thử đúng cài đặt, không so chi phí trực tiếp với medium vì lúc đo có thêm người/hiệu ứng nghi thức.

Ảnh PNG đúng viewport 9:16, không dựng ảnh giả:

- Trước/sau 720: [trước](test-results/phase06-1/before-720.png), [sau](test-results/phase06-1/song-sect-720.png); [telemetry baseline](test-results/phase06-1/baseline.json).
- [Tông môn 1080×1920 / 10 người](test-results/phase06-1/song-sect.png).
- [60 người / 1080×1920](test-results/phase06-1/song-sect-60.png), [60 người / 720×1280](test-results/phase06-1/song-sect-60-720.png).
- [Độ kiếp 1080](test-results/phase06-1/song-tribulation.png), [độ kiếp 720](test-results/phase06-1/song-tribulation-720.png), [kết quả nghi thức](test-results/phase06-1/song-announcement.png).
- [Battle cũ](test-results/phase06-1/song-battle.png), [kết quả battle cũ](test-results/phase06-1/song-battle-result.png), [trở về](test-results/phase06-1/song-return.png), [Low](test-results/phase06-1/song-low.png).

Các ảnh/log trong `test-results/` là artifact local được Git ignore. Chạy lại bài browser bằng `node scripts/sect-browser-smoke.js` (cần Chrome ở đường dẫn driver hiện có, hoặc CHROME_PATH). Tham số `--baseline` chỉ dùng trước khi chỉnh sản phẩm; không chạy lại để ghi đè ảnh trước sửa.

## Lỗi đã sửa và giới hạn

Đã sửa lỗi trùng tên biến geometry khi khởi tạo đài mới, làm frontend rơi vào fallback ở lần chạy đầu. Cập nhật test hình ảnh cũ để kiểm tra anchor mới thay vì tọa độ/góc cận cũ. Trong harness, chọn telemetry mới nhất sau reload để tránh đọc báo cáo của client đã đóng; tách bài focus khỏi nghi thức có ưu tiên cao hơn; kiểm tra tài nguyên có tính lần upload sét/pool damage đầu tiên. Lần browser cuối PASS toàn bộ bốn nhóm, không có FAIL của 06.1 còn mở.

Bản 3D procedural giữ bố cục sân dưới / điện trái / đài trên phải, bảng màu lam/tím/vàng và các chi tiết môi trường của ảnh tham chiếu; độ chi tiết/ánh sáng/sương không bằng tranh 2D. Nhân vật chibi, tư thế cast trên đài, tên, HUD/thẻ thông tin và thông cáo battle lớn vẫn là bản cũ. Chưa làm nhân vật 06.2, bay lên/ngồi thiền/camera drift và safe-frame cho mọi shot ở 06.3, đội hình battle 06.4 hoặc HUD/profile theo quà 06.5. Manual follow/focus sự kiện cũ vẫn có shot cận tạm rời overview; nghiệm thu giữ cả sân/đài ở bước này áp dụng góc overview. Không bổ sung cơ chế profile/quà mới.

**Bước tiếp theo:** dừng sau 06.1, chờ yêu cầu mới. Có thể kiểm tra thủ công OBS/LIVE Studio theo các mục Chưa kiểm chứng; không tự triển khai bước tiếp.

---

# Cập nhật giao diện quản trị theo phases/UI.md

**06/11/2026 — UI Dashboard sáng/tối, giữ phiên bản gameplay 0.5.0.** Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, README.md, phases/UI.md, frontend/API/cấu hình trước khi thay đổi. Bảng khảo sát và ánh xạ trước triển khai: [docs/UI_MAPPING.md](docs/UI_MAPPING.md).

## Giao diện đã triển khai

Dashboard có sidebar cố định/thu gọn, header chung, 5 trang theo hai ảnh mẫu. Navy/cyan/vàng ở theme tối; trắng/xanh nhạt ở theme sáng. Logo, núi, tông môn, trăng, nhánh hoa và biểu tượng được vẽ bằng SVG trong code; không tải ảnh/font/icon ngoài. Minh họa là bản SVG gợi phong cách ảnh mẫu, không phải sao chép ảnh raster. Dark/Light và trạng thái sidebar lưu riêng trong localStorage; theme áp dụng sớm khi tải trang, không ảnh hưởng `/song`.

| Trang | Chức năng |
|---|---|
| Trang chủ | Chọn dữ liệu demo/LIVE, username/khóa ký che bằng password, kết nối/ngắt/trạng thái thật/lịch sử; 6 chỉ số phiên từ WS/telemetry; thông tin kỹ thuật mở rộng; 12 sự kiện gần đây có cuộn; start/resume/pause/end pha/copy URL/bật tắt âm thanh; bảng quà đang áp dụng; liên kết Cài đặt/Demo |
| Cài đặt | Sáu nhóm: Âm thanh/Thiên Đạo; Hiển thị/camera; Tu luyện/độ kiếp và bảng chỉ số 11 cảnh giới; Chu kỳ/boss; Nhiệm vụ; TikTok/quà CRUD. Giữ toàn bộ các điều khiển đã có |
| Demo | Tạo 10/30/60/100/500 người; chọn đạo hữu chung; pause/resume/stop/chuyển pha; 7 nút hoạt cảnh; tốc độ/đi dạo/Viên Mãn/nhiệm vụ/điểm danh; cấp/dùng/đổi item; bình luận; demo 11 cảnh giới, kỹ năng/camera/boss; tim/follow/member/quà/combo/replay/offline/drop/end |
| Nhật ký | Sự kiện mới qua WS và nhật ký thao tác hiện có; giờ/loại/nội dung/trạng thái, lọc loại và khoảng thời gian; tối đa 200 dòng trong RAM của tab. Không lưu nội dung bình luận thô/khóa ký, không xóa log backend |
| Sao lưu | Tra cứu tên/userId, theo camera, tải JSON, chọn file/khôi phục/reset; hiện rõ DEMO/LIVE, giữ nguyên hai bước xác nhận/nonce/backup tự động/đường dẫn/schema |

Các trang dựng **một lần**, điều hướng bằng hash chỉ ẩn/hiện, không đăng ký lại handler, không dựng lại AudioRuntime, không nối lại WS/TikTok hoặc reset game. Form giữ bản nháp khi đổi trang/nhận snapshot; đồng bộ trường chưa sửa và lưu patch những trường đã sửa qua API cũ. Bảng quà vẫn gửi mảng như API đã quy định, lấy giá trị chưa sửa từ cấu hình mới nhất đã nhận. Boss và nhiệm vụ có nút lưu riêng, không vô tình ghi phần bên kia. Có feedback thật, trạng thái loading/disabled, focus bàn phím, menu mobile/Escape, hộp thoại HTML dialog theo theme và hai bước bảo vệ dữ liệu cũ.

## Tệp và kiến trúc

Tạo mới:

- `public/css/admin.css`: stylesheet chỉ cho quản trị; responsive, 2 theme và trạng thái tương tác.
- `public/js/ui/shell.js`, `state.js`, `theme-init.js`: sidebar/header/route/preferences.
- `public/js/ui/pages/home.js`, `settings.js`, `demo.js`, `logs.js`, `backup.js`: 5 trang.
- `public/js/ui/icons.js`, `art.js`, `dom.js`, `forms.js`, `logs.js`, `dialog.js`: SVG, mount, đồng bộ form, nhật ký và xác nhận dùng chung.
- `scripts/browser-test-driver.js`, `ui-browser-smoke.js`: chạy Chrome headless riêng với profile và dữ liệu tạm; dùng CDP có sẵn, không thêm dependency.
- `test/admin-ui.test.js`, `docs/UI_MAPPING.md`.

Chỉnh sửa:

- `public/index.html`: chỉ nạp shell/module và CSS quản trị riêng.
- `public/js/admin.js`: khởi tạo một lần, phân phối WS, cập nhật chỉ số/log theo trạng thái thật.
- `public/js/cultivationPanel.js`, `battlePanel.js`, `livePanel.js`, `streamerPanel.js`: giữ nghiệp vụ gửi API, chia markup thành các vùng trên 5 trang, đồng bộ draft/loading, dùng dialog theo theme.
- `test/finishing-integration.test.js`: bộ quét import chỉ nhận câu lệnh import; tránh nhận nhầm thuộc tính HTML `log-from` là import. Vẫn kiểm tra dependency graph HTTP cùng nguồn và Three core.
- `package.json`: thêm `test:ui`; không thêm framework/dependency; README.md, HUONGDAN.md và PROGRESS.md cập nhật thao tác mới.

**Không thay backend, API, WS protocol, định dạng lưu hoặc thuật toán game.** Đối chiếu Git xác nhận `server.js`, engine/services/connector/storage và `public/song.html`, `public/css/style.css`, main/scene/audio/camera/characters/network của game không có diff. Hộp thoại/theme/form/log là logic UI. Các endpoint/control action cũ vẫn giữ nguyên. Trong worktree có thay đổi camera orbit → auto tại `caidat.json`; đã giữ nguyên lựa chọn cục bộ, không dùng Git restore/reset để đè cấu hình đó. Không commit/push; phases/UI.md của người dùng vẫn được giữ nguyên.

## Kết quả kiểm thử thực tế

- `npm.cmd test`: **81 bài — 80 PASS, 0 FAIL, 1 SKIP**. Cả 77 bài PASS trước refactor vẫn PASS; thêm 3 bài UI (route/theme/storage lỗi; draft/partial save/error/concurrent edit; log bounded/dedup). SKIP là LIVE thật như trước. Log: [ui-node-test.txt](test-results/ui-node-test.txt).
- `node --check`: PASS 58 tệp frontend/script/test. Các module UI mới được load thật trong Chrome; lỗi runtime cuối **0**.
- `npm.cmd run test:ui`: **PASS 6 nhóm end-to-end thực**, mọi game/config/file ghi vào thư mục tạm. Browser tích hợp báo host unavailable, nên dùng Chrome cài sẵn chạy headless với profile mới, không gắn vào tab/profile người dùng. Không cần cài thêm thư viện; lần thử tải Playwright bị network timeout, không thêm package vào dự án.

Môi trường browser thực: **Chrome/156.0.8078.81**, Node **v24.13.1**; báo cáo tạo **2026-11-06T10:11:17.621Z**: [browser-report.json](test-results/ui/browser-report.json).

| Nhóm | Kết quả quan sát |
|---|---|
| Shell/theme/điều hướng | 5 trang hoạt động; không ID trùng; Dark/Light giữ sau reload; thu gọn sidebar; engine session/đồng hồ tiếp tục, đúng một WS và không tạo TikTok connection khi đổi trang |
| Cấu hình | Âm lượng, camera, particle, ưu tiên, giới hạn tu luyện, K boss, EXP nhiệm vụ, reconnect và số lượng quà lưu đúng qua UI; trường chưa sửa giữ nguyên; draft qua đổi trang và snapshot; reload/JSON giữ giá trị; nút bật audio tạo/resume AudioContext thật qua click trong Chrome headless |
| Demo | Tạo 30 người, chọn người; thử đủ 7 nút hoạt cảnh; cấp/dùng Trà; bình luận nhập môn người thứ 31; combo final và replay không cấp trùng; đưa Viên Mãn/vào nghi thức; vào diệt ma có xác nhận, dùng cả kỹ năng 1/2, tạm dừng |
| Sao lưu/log | Lọc chiến đấu, tra cứu có kết quả; tải backup thực qua nút và đọc tệp JSON đã tải; chọn file, hai bước khôi phục đúng; nhập sai reset giữ dữ liệu; nhập đúng RESET DEMO mới reset bộ dữ liệu tạm |
| LIVE qua transport test | UI đổi mode, khóa demo, kết nối stub đúng một lần, trạng thái backend cập nhật; đổi 5 trang không reconnect/nhân WS; khóa ký được xóa khỏi input; ngắt và về demo. Không phải LIVE thật |
| Responsive | Cả 5 trang ở 1920×1080, 1366×768, 900×1024, 390×844 không tràn ngang trang; bảng rộng cuộn bên trong; menu mobile mở/đóng sau điều hướng và Escape; sáng/tối chụp thực |

Ảnh chụp Chrome thực, dùng dữ liệu demo thật của phiên kiểm thử (số liệu không hardcode theo ảnh mẫu):

- [Trang chủ tối](test-results/ui/home-dark.png), [Trang chủ sáng](test-results/ui/home-light.png).
- [Cài đặt](test-results/ui/settings.png), [Demo](test-results/ui/demo.png), [Nhật ký](test-results/ui/logs.png), [Sao lưu](test-results/ui/backup.png).
- [Laptop 1366×768](test-results/ui/laptop.png), [Mobile tối](test-results/ui/mobile-dark.png), [Mobile sáng](test-results/ui/mobile-light.png).

Ảnh chụp đúng viewport, không dùng ảnh tạo giả. Đã mở kiểm tra ảnh Trang chủ sáng/tối, Cài đặt, Demo và mobile. File ảnh/log là artifact local trong test-results, được tạo lại bằng test:ui.

## Các lỗi đã phát hiện và sửa

- Số đạo hữu WS mới từng bị bản dashboard poll 2s cũ ghi đè: chỉ số game dùng snapshot hiện tại, poll chỉ bổ sung tải/FPS.
- Gift table và min-content của grid làm trang mobile tràn ngang: ép track minmax(0,1fr), phần bảng cuộn riêng; kiểm tra lại mọi trang/kích thước PASS.
- Min/step K boss cũ .01/.05 làm giá trị chuẩn .65 không hợp lệ khi kiểm tra native validity: dùng step .01, giữ đúng công thức/giới hạn backend.
- Request hoàn tất sau khi snapshot đổi trạng thái từng có thể bật lại nút không hợp lệ: tách busy và điều kiện khóa theo trạng thái.
- Draft cấu hình và form gộp boss/nhiệm vụ dễ ghi giá trị chưa sửa: giữ dirty field, ACK chỉ giá trị đã gửi, lưu riêng patch và không xóa draft khi lỗi.
- Import scanner cũ nhận nhầm chuỗi HTML; cập nhật bài quét đúng cú pháp import, không sửa game để né test.
- Ảnh chụp beyond-viewport có thể sai bố cục fixed sidebar trong Chrome: chụp đúng viewport, đặt lại cả scroll X/Y; đối chiếu DOM mainLeft bằng chiều rộng sidebar và mở ảnh QA.

**Chưa kiểm chứng:** nhận LIVE TikTok thật, âm thanh nghe trực tiếp/giọng Việt của hệ điều hành, OBS/LIVE Studio và FPS/GPU `/song`. Các phần này vẫn là giới hạn giai đoạn trước, không suy ra PASS từ UI/stub/headless. Không có FAIL đang mở trong các kiểm thử đã chạy. Không reset dữ liệu thật. Bước tiếp theo nếu cần là thử vận hành thủ công với OBS/LIVE thật; không thêm giai đoạn hay cơ chế mới.

---

# Lịch sử triển khai game trước refactor UI

# Tiến độ Tu Tiên LIVE

Cập nhật **06/11/2026 — phiên bản 0.5.0 — Giai đoạn 5**.

Đã triển khai mã nguồn Giai đoạn 5, giữ các module và dữ liệu giai đoạn 1–4. **Chưa nghiệm thu đầy đủ Giai đoạn 5**: còn các kiểm chứng trực tiếp về WebGL, âm thanh, OBS/LIVE Studio, launcher nháy đúp và LIVE thật. Không chuyển sang giai đoạn khác. Không có FAIL còn mở trong các bài kiểm thử cuối đã chạy.

## Rà soát trước triển khai

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md và tài liệu phases/. Bản đầu phiên chạy lại **65 PASS / 0 FAIL / 1 SKIP**. Logic tu luyện/battle/độ kiếp/quà, lưu JSON và HTTP/WS hoạt động trong kiểm thử; không có blocker logic đã xác định trước khi bổ sung. Những phần giai đoạn 1–4 còn chưa kiểm chứng: hình ảnh/animation thực trên GPU, FPS/OBS/LIVE Studio, launcher nháy đúp/cài sạch, nhận sự kiện từ LIVE thật. Giữ nguyên trạng thái chưa kiểm chứng, không suy ra PASS từ tài liệu cũ.

Công việc Giai đoạn 5: (1) camera và ngoại hình; (2) âm thanh/TTS; (3) dashboard/cấu hình/phục hồi; (4) giới hạn tải và xử lý lỗi; (5) hồi quy, smoke và tài liệu. Không ghi/xóa tệp người chơi thật khi chạy test; toàn bộ integration/smoke dùng thư mục tạm.

## Module đã bổ sung và cập nhật

- `public/js/settings.js`, `camera.js`: đủ auto/sectOverview/followPlayer/cultivationGroup/breakthrough/battlefield/followBoss/giftFocus, giữ overview/follow/orbit cũ. Theo userId từ tra cứu; trả tự động bằng nút. Hàng chờ 8 focus, TTL 15s, hồi cùng loại/user 10s, cảnh tối thiểu 2s, nội suy và giới hạn vị trí trên mặt đất. Ưu tiên kết quả/boss/quà/nhập môn chỉnh được, mặc định 5/4/3/1; sự kiện khẩn có thể ngắt cảnh thấp hơn. Chọn chiến trường vẫn dùng dịch vụ giai đoạn 3, không dựng chi tiết 11 scene cùng lúc.
- `public/js/realmAura.js`, `characters.js`, `scene.js`, `battleScene.js`, `effects.js`: hình dạng aura khác nhau cho 11 cảnh giới, thêm chạy/ngự kiếm/chắp tay; geometry/material chung, không tạo aura lại mỗi frame. Giữ ba boss/mob và pool cũ. Thêm tắt số damage/bóng, tỷ lệ particle, cường độ sáng; boss cuối đổi màu sáng/nền và âm nền. Low 40, Medium/High 60 nhân vật chi tiết; pixel ratio tối đa 1 / 1.5 / 2.
- `public/js/performance.js`: FPS đo từ frame thật, cửa sổ 5s; hai cửa sổ liên tiếp dưới 24 FPS mới hạ một preset. Không đổi gameplay; tắt tự động trả preset đã chọn. Telemetry không có dữ liệu thì dashboard không hiện FPS giả.
- `public/js/audio.js`: oscillator/noise/filter/envelope/compressor cho kiếm, kiếm khí, hit, sét, truyền tống, chuông, tăng tầng, boss chết và ambient gốc. Chỉ tạo/resume AudioContext sau bấm trực tiếp; admin và `/song` có quyền riêng. Mặc định tối đa 8 FX + 2 ambient, rate limit/ưu tiên, dừng và disconnect khi mute/dispose. Giảm maxVoices cũng thu hồi voice đang phát.
- TTS cùng module: hàng chờ ưu tiên tối đa 8, TTL 15s, chống lặp 30s, watchdog 12s. Chỉ chọn giọng Việt **localService=true**, không gửi tên người chơi sang dịch vụ đọc ngoài. Tên đã qua bộ lọc server và cắt 20 ký tự; thiếu giọng/quyền dùng thông báo chữ. Có bật/tắt/âm lượng/nghe thử. Chưa xác minh tiếng phát thực hoặc giọng Việt trên máy này.
- `public/js/streamerPanel.js`, `admin.js`, `main.js`, `network.js`, HTML/CSS: Trung tâm streamer, số người theo cảnh giới, pha/đồng hồ/chu kỳ/trận/BT queue/sự kiện thật, tick/commit/RAM, báo cáo FPS từ `/song`. Điều khiển bắt đầu/tạm dừng/tiếp tục/kết thúc pha có xác nhận, camera, âm lượng, đồ họa, boss/nhiệm vụ, tìm user, copy URL, backup/restore/reset. Cấu hình lưu atomic, form sai không làm mất cấu hình cũ. `noticeQueue.js`/`overlay.js` có queue/TTL/ưu tiên/fade, không chèn tên bằng HTML. WebGL lỗi có thông báo rõ và trạng thái server dạng chữ.
- `adminData.js`, `adminDataBackup.js`, `storage.js`, `server.js`: tải backup JSON của mode đang chọn; restore/reset xác nhận hai bước trên UI, nonce dùng một lần/60s và cụm từ đúng mode. Kiểm tra bản nhập trước thay đổi; tự sao lưu dữ liệu cũ ở `data/backups/`; không đổi mode còn lại hoặc config. Restore dừng, cần Tiếp tục. JSON hỏng cú pháp hoặc schema/runtime được giữ nguyên, sao chép `.corrupt-…backup`, báo lỗi thay vì reset. Ghi atomic có retry hữu hạn cho EPERM/EBUSY/EACCES ngắn trên Windows.
- Dashboard `/api/dashboard`, telemetry `/api/telemetry`, backup `/api/backup`, challenge `/api/data-confirmation`; giữ loopback/Origin/CSRF/WS chỉ đọc. Body restore tối đa 20MB, thao tác thường 32KB. Telemetry chỉ nhận cùng transport session, hữu hạn 8 nguồn, không dùng để sửa gameplay.
- `gameEngine.js`, `cycleService.js`, `gameEventBus.js`: bộ đếm chu kỳ/trận/sự kiện thật, lưu tương thích schema2 cũ. Phát hiệu ứng WS tối đa 80 mỗi giây trượt, hiệu ứng thường dùng tối đa 60 để dành chỗ ưu tiên; snapshot định kỳ 4Hz, thao tác quản trị không vượt 10Hz broadcast. Giới hạn này chỉ bỏ hiệu ứng, không bỏ kết quả/quà đã chốt. Quà và lệnh `1`/`2` không bị mất vì rate limit hiệu ứng thường; chiêu vẫn kiểm tra cooldown thật. Hàng đợi mạng thường 1.000, dành sức chứa tối đa 50.000 đầu vào quà/chiêu; drain theo lô và trước đổi mode/backup/đóng. Vượt sức chứa/dedup/inbox hay thiếu dữ liệu/mapping có log từ chối trước chốt, không hứa tiếp nhận vô hạn hoặc phục hồi sự kiện TikTok không gửi.
- `chay.bat`: kiểm tra Node/npm, Node ≥22, đủ cả dependency TikTok, npm ci khi có lock, lỗi tiếng Việt; chỉ mở trang sau listen, port bận không chạy server thứ hai. Version package/lock 0.5.0; `caidat.json` thêm audio/display/cameraDirector, giữ camera/đồ họa người dùng. README.md/HUONGDAN.md được rút gọn và cập nhật.

## Kiểm thử cuối

Windows, Node **v24.13.1**, npm **11.17.0**. `npm.cmd test`: **78 bài — 77 PASS / 0 FAIL / 1 SKIP**. Giữ và chạy lại toàn bộ 65 test PASS giai đoạn 1–4, thêm 12 test. SKIP cũ là LIVE thật, không biến thành PASS. Log UTF-8: [phase5-node-test.txt](test-results/phase5-node-test.txt). `node --check` đã PASS 65 tệp JS; các chỉnh sửa sau đó được load/chạy trong kiểm thử cuối.

Hai tệp test mới: `test/finishing.test.js`, `test/finishing-integration.test.js`. Đã kiểm tra API cấu hình/validation/ghi đĩa, dashboard thực/không FPS giả, telemetry stale/rate-limit, backup/restore/reset/chống replay/sai mode/bản tự sao lưu, JSON hỏng cú pháp và runtime, module graph phục vụ local, audio/TTS bằng mock API, camera ưu tiên/min-shot/cooldown/mode, aura 11 hình dạng dùng lại tài nguyên, pose chạy/ngự kiếm/chắp tay và tắt damage không tạo texture, governor FPS và queue thông báo.

Test tải: **500 quà hợp lệ + 500 lệnh kỹ năng hợp lệ trong một đợt**, không bị cắt bởi rate limit thông thường; mọi người có đóng góp và quà còn đủ sau export/restore. Adapter transport mô phỏng gửi **1.500 quà liên tiếp**, nhận đủ 1.500 item, replay không tăng, lưu LIVE tạm đúng. Burst 2.500 follow cũ vẫn bounded và engine tiếp tục. Đây là sự kiện thử có schema thật, không phải LIVE thật.

`node scripts/live-smoke.js` chạy lại PASS: 31 người, combo final/replay, hai chiêu, quà/tim battle, reconnect sau 5 giây thật, xử lý đan/điểm khi trở về; báo cáo `test-results/phase4-smoke.json` được tạo lại trong phiên này.

`node scripts/finishing-smoke.js` PASS với app HTTP/WS thật, **500 người chia đủ 11 cảnh giới**, hai chu kỳ tự động liên tục **10s tu luyện / 60s battle, demo ×10**. Mỗi trận có 11 chiến trường, đủ ba lịch sử boss/trường, thưởng applied và gọi apply lại không đổi người chơi. Dùng `1`/`2` và nhận quà trong battle không tăng EXP; đóng/mở app giữ 500 người, item, counters và reward IDs, không ghi file LIVE thật. Các benchmark riêng chạy 10/30/60/100/500 người qua 300s mô phỏng. Chi tiết: [phase5-smoke.json](test-results/phase5-smoke.json).

Số đo lần smoke cuối: CPU Intel(R) Xeon(R) CPU E3-1505M v5 @ 2.80GHz, 8 logical CPU, RAM máy 15.82 GiB; thời gian 14.61s, CPU user/system 9937/1094ms, RSS đỉnh 284.6 MiB, tick đỉnh 75.94ms, commit đỉnh 80.60ms. Quan sát tối đa 8 snapshot và 80 effect trong cửa sổ nhận 1s. Báo cáo có mẫu RAM theo hai chu kỳ; khoảng thử ngắn không chứng minh không rò bộ nhớ lâu dài. Đây là tải server ở ×10, không phải FPS renderer. FPS/GPU để null, không cam kết 30 FPS.

| Mã | Kết quả | Bằng chứng / phần còn cần xác minh |
|---|---|---|
| 05-01 | CHƯA KIỂM CHỨNG | Nhánh thiếu Node chạy PASS bằng cmd thật; chưa thử nháy đúp/cài sạch/tự mở browser. Server HTTP thực khởi động được |
| 05-02 | CHƯA KIỂM CHỨNG | Pipeline demo/tu luyện/độ kiếp/battle/thưởng PASS qua integration/model; chưa quan sát toàn bộ bằng WebGL |
| 05-03 | PASS | Test clock mô phỏng đúng 600/300 rồi lặp; smoke hai chu kỳ rút gọn thực |
| 05-04 | PASS | Hồi quy toàn 300s battle không EXP/buff/độ kiếp; quà/pending về cultivation đúng |
| 05-05 | PASS | Đủ bảng 11 realm/ngưỡng/stats, Phi Thăng không sinh realm 12; aura model 11 kiểu khác nhau |
| 05-06 | CHƯA KIỂM CHỨNG | RNG thành công/thất bại, pill/bảo hộ/Thiên Mệnh/cooldown/restart PASS; hoạt cảnh GPU chưa quan sát |
| 05-07 | PASS | Mapping/final combo/dedup/restart, battle không EXP, inventory chờ đúng qua adapter/bus/API |
| 05-08 | PASS | Logic 11 fields, ba boss/windows/HP/TOP riêng; model boss/pool PASS, ảnh thực chưa có |
| 05-09 | PASS | +5/+4/+3/solo/đóng góp, gate và reward idempotency qua restart |
| 05-10 | PASS | Chiêu 1/2 ×2/×3, hồi đúng 10/25s và chống replay; burst 500 chiêu hợp lệ không mất đóng góp |
| 05-11 | CHƯA KIỂM CHỨNG | Model/API camera mọi mode, queue ưu tiên, minshot, cooldown, vị trí PASS; độ mượt nhìn thực chưa kiểm tra |
| 05-12 | CHƯA KIỂM CHỨNG | Web Audio mock PASS gesture gate/mute/voice cap/disposal; chưa nghe tiếng hoặc thử quyền OBS thật |
| 05-13 | PASS | Mock thiếu/remote-only voice Việt đi fallback chữ; local voice/queue/TTL/cancel đúng. Giọng thực trên máy chưa thử |
| 05-14 | CHƯA KIỂM CHỨNG | Chưa quan sát bố cục 1080×1920/720×1280 trong OBS/LIVE Studio |
| 05-15 | CHƯA KIỂM CHỨNG | Model 100 dữ liệu/60 nhân vật, pool và resource reuse PASS; chưa đo render 60 người/FPS/GPU lâu dài |
| 05-16 | PASS | HTTP/dashboard 500 người; smoke hai chu kỳ đủ 11 trường và benchmark server 10/30/60/100/500 |
| 05-17 | PASS | 500 quà + 500 kỹ năng hợp lệ; adapter 1.500 quà đủ item/dedup/đĩa; flood thường bounded, effect cap riêng |
| 05-18 | PASS | HTTP/WS snapshot reload, active BT/battle/dedup/reward restart, restore/reset và hai mode độc lập |
| 05-19 | CHƯA KIỂM CHỨNG | Adapter giả offline/drop/reconnect5s/10retry/end PASS, tick không dừng; chưa ngắt Internet/TikTok thật |
| 05-20 | CHƯA KIỂM CHỨNG | Chưa có phiên LIVE thật nhận nhập môn; test 04-18 vẫn SKIP |
| 05-21 | CHƯA KIỂM CHỨNG | Chưa nhận 1/2 từ battle trong LIVE thật |
| 05-22 | CHƯA KIỂM CHỨNG | Chưa nhận quà combo LIVE thật; không yêu cầu mua quà để thử |
| 05-23 | PASS | Filter tên HTML/control/từ cấm/NFD/≤20 ký tự và text-only model/API; thao tác XSS bằng browser chưa kiểm tra |
| 05-24 | PASS | Thiếu file dùng mặc định, sai config/null/schema/runtime/cú pháp giữ file + backup, lỗi ghi pause; không reset ngầm |
| 05-25 | PASS | HTTP duyệt dependency graph HTML/JS/CSS đến Three core đều loopback; không có CDN/assets. Network panel thực chưa kiểm tra |

## Lỗi đã sửa và giới hạn nghiệm thu

- Khóa rename ngắn trên Windows từng làm integration FAIL: thêm retry có giới hạn, chạy lại hồi quy PASS. Lỗi ghi thật vẫn không bị nuốt, mô phỏng pause.
- Governor từng giữ mức đã hạ sau khi tắt tự động: trả đúng preset cấu hình, có regression test.
- Focus chỉ có battlefieldId từng có thể truy cập active null: thêm guard, test request theo trường và ưu tiên boss/quà.
- Smoke 10/15s ở ×10 từng chạy hết battle giữa các HTTP assertion khi máy đồng thời chạy nhiều test: đổi cửa sổ smoke thành 10/60s, chạy tuần tự. Không sửa luật EXP để né kiểm thử; clock600/300 và freeze300s vẫn PASS.
- Đo WS phát hiện bộ giới hạn cửa sổ cố định có thể dồn hai burst ở ranh giới: đổi sang cửa sổ trượt, dành chỗ cho sự kiện ưu tiên; smoke cuối đo tối đa 80 effect/s. Quà và kỹ năng hợp lệ giữ logic/đĩa dù bỏ hiệu ứng phụ.
- JSON hợp cú pháp nhưng hỏng schema/runtime trước đây chưa tạo bản copy lỗi: bổ sung backup trước khi từ chối load; test nguyên byte gốc/bản sao.

Đã dùng kỹ năng [computer-use](C:/Users/admin/.codex/plugins/cache/openai-bundled/computer-use/26.1029.61003/skills/computer-use/SKILL.md) và thử inventory/cửa sổ Chrome. Khi yêu cầu trạng thái cửa sổ, công cụ dừng với lý do: **“could not determine the current browser URL on Windows with enough confidence to enforce policy”**. Theo hướng dẫn kèm kỹ năng: “If Computer Use reports that the turn ended or that the user stopped Computer Use, stop issuing app input.” Đã dừng thao tác UI, đóng preview tạm, không dùng cách vòng qua kiểm tra URL. Vì vậy **không có bốn screenshot sản phẩm**, không tạo ảnh giả; WebGL, autoplay/nghe tiếng, layout/OBS/FPS/GPU và nháy đúp vẫn Chưa kiểm chứng. Không có auto-review rejection cho thao tác ghi mã nguồn.

Connector TikTok 2.5.0 không chính thức dùng TikTok/dịch vụ ký, chưa kiểm tra kênh thật. Cache chống trùng hữu hạn 24h/50.000 khóa; combo/inbox có giới hạn, overload ngoài dung lượng bị từ chối có log, không thể cam kết nhận sự kiện mạng bị mất. Trạng thái từ telemetry là báo cáo trình duyệt gửi về, không được coi là đo GPU từ server. Các test TTS/Web Audio dùng mock chỉ chứng minh API/queue/mute logic; thiếu giọng Việt cục bộ dùng chữ. Đây là các giới hạn thực tế, không gộp vào PASS LIVE hoặc PASS hình ảnh.

Không thay luật cân bằng cốt lõi GAME_DESIGN. Thông số vận hành mới: focus8/TTL15s/minshot2s/cooldown10s/priority5-4-3-1; audio8FX+2ambient/TTS8/TTL15s; FPS<24 trong hai cửa sổ5s; notice3.5s/TTL10s; backup nonce60s/20MB; telemetry2s/TTL15s/8nguồn; WS effect80/s và thường60/s. Cấu hình boss/nhiệm vụ dùng các luật bổ sung giai đoạn trước, chỉ thêm form chỉnh. Không dùng asset ngoài.

Cách chạy lần đầu: cài Node LTS ≥22 → nháy đúp chay.bat → Thử không cần LIVE → Mở trang phát sóng. OBS Browser Source `/song`, 1080×1920; Interact để bật tiếng tại chính nguồn. Xem [HUONGDAN.md](HUONGDAN.md). Bước tiếp theo trong **Giai đoạn 5** là kiểm tra thủ công các hàng Chưa kiểm chứng, đặc biệt 4 ảnh thực, OBS/âm thanh/FPS, launcher sạch và LIVE thật. Chưa thêm giai đoạn mới. Tối ưu dài hạn chỉ dựa trên profiling thực sau các kiểm chứng này; không thay thế hạng mục bắt buộc còn mở.

---

# Lịch sử Giai đoạn 1–4 (giữ để đối chiếu)

Các trạng thái “chưa triển khai Giai đoạn 5” bên dưới là ghi nhận ở thời điểm cũ; trạng thái hiện tại nằm ở đầu tệp.

# Tiến độ Tu Tiên LIVE

Cập nhật: **06/11/2026**. Phiên bản **0.4.0**. Phạm vi hiện tại: **Giai đoạn 4**, theo yêu cầu tiếp tục của người dùng; giữ Giai đoạn 1–3. **Chưa triển khai Giai đoạn 5.**

## Giai đoạn 4 — trạng thái hiện tại

Đã triển khai adapter TikTok LIVE, luồng sự kiện chung với demo, quà/combo/bảng ánh xạ, tim/Nguyện Lực, theo dõi/vào phòng, UI điều khiển và lưu dữ liệu LIVE riêng. **65 kiểm thử PASS / 0 FAIL / 1 SKIP**: toàn bộ 41 kiểm thử Giai đoạn 1–3 vẫn PASS, thêm 24 bài PASS. Ca 04-18 là **CHƯA KIỂM CHỨNG LIVE THẬT**, không tính PASS. Chưa nhận sự kiện từ một buổi LIVE thực trong phiên này.

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md và các tài liệu phases/, tập trung phases/04_TIKTOK_LIVE.md. Không thay chỉ số cảnh giới, tu vi, xác suất/cổng độ kiếp, damage/kỹ năng, lịch boss hoặc luật thưởng Giai đoạn 1–3. Các kiểm thử chạy trên thư mục tạm; không xóa/chỉnh tệp người chơi trong `data/` của dự án. Cấu hình hiện có được merge, giữ graphics/camera.

### Connector và hợp đồng dữ liệu đã xác minh

- Đã cài cố định **tiktok-live-connector 2.5.0**, cập nhật package-lock; lần cài báo **0 vulnerabilities**. Lượt npm đầu bị sandbox chặn registry; cài thành công bằng quyền nâng qua auto-review. Không thêm thư viện giao diện/asset/build tool.
- Đã đọc README/package.json/type/API/mã dispatch trong **bản đã cài**, không suy đoán API từ ví dụ trên mạng. Nguồn: `node_modules/tiktok-live-connector/README.md`, `dist/index-DcaLUrMQ.d.ts`, `dist/lib-DWhiWLli.js` và `node_modules/tiktok-live-proto/dist/node/v3.d.ts`.
- Dùng `TikTokLiveConnection`, `ControlEvent.ERROR/DISCONNECTED`, `WebcastEvent.CHAT/GIFT/LIKE/FOLLOW/MEMBER/STREAM_END`; connect() xác nhận trước khi báo Đã kết nối. Không dùng sendMessage hoặc chức năng khởi động LIVE.
- README còn một số ví dụ kiểu v2 (`userId`, `giftDetails`, `likeCount`). Mã thực 2.5.0 import proto **v3**, không chuyển đổi các field này: adapter dùng **user.id**, **gift.type/name/diamondCount**, **count/total**, **common.msgId/roomId**, **groupId/repeatCount/repeatEnd**. Có test đi qua `processDecodedData()` của connector thật đã cài, chỉ thay transport mạng bằng stub, để kiểm chứng dispatch/schema thực.
- `processInitialData:false` tránh xử lý lại lịch sử khởi tạo, `enableExtendedGiftInfo:false`, `authenticateWs:false`, `useMobile:false`. Không cần cookie/mật khẩu TikTok. `signApiKey` đúng API bản cài, tùy chọn; giữ trong bộ nhớ và không đưa vào config/snapshot/log. Xóa cache signer khi tạo kết nối dùng khóa khác để tránh cache khóa cũ.

### Mã nguồn và hành vi đã bổ sung

- `tiktokAdapter.js`: kết nối/chuẩn hóa, trạng thái và lỗi tiếng Việt, chỉ một kết nối/operation tại một thời điểm, generation token loại callback trễ; hủy reconnect khi NGẮT/LIVE kết thúc. Mặc định chờ 5s, tối đa 10 lần thử liên tiếp. Lỗi offline/tên/protocol/ký có thông báo riêng; lỗi mạng/rate limit thử lại có giới hạn. Kết nối/đóng mạng không nằm chờ trong hàng đợi tick; NGẮT trong lúc connect còn pending không làm dừng gameplay.
- `normalizeEvent.js`: schema nội bộ theo tài liệu, ID ổn định `tt:<user.id>`, room/message/group ID làm khóa chống trùng. Thiếu ID ổn định thì từ chối, không ghép người theo tên. Avatar luôn null; rawMeta chỉ giữ trường cần để tính combo/tim. Validate đơn giá/số lượng/tổng, chặn âm/NaN/Infinity/quá lớn/thiếu dữ liệu; không đoán kim cương từ tên.
- `gameEventBus.js`: Validate → dedup → rate limit → CommandRouter/ItemService/CombatService. Nhận cả TikTok và demo cùng logic, log ngắn tối đa 50 dòng, không lưu nguyên bình luận/raw event. Default 200 event/s toàn cục, 12 event/s/user, thông báo cùng loại/user mỗi 10s. Hàng đợi mạng tối đa 1.000 sự kiện, xử lý theo lô tối đa 100/tick, không xếp một lượt ghi đĩa cho từng callback. Input vượt giới hạn bị từ chối và có log; không hứa tiếp nhận vô hạn khi overload.
- Quà combo: lưu trạng thái theo source/room/user/gift/group; update không cấp item, chỉ chốt final repeatCount khi repeatEnd. Chặn giá thay đổi/count lùi. Cả event ID lẫn khóa final combo được lưu cùng tiến trình, TTL 24h, tối đa 50.000 khóa. Duplicate/reconnect/restart không cấp lần hai trong cửa sổ TTL. Combo thiếu group/đơn giá/end không đoán, hết 2 phút chưa end ghi lỗi và không tự quyết toán.
- `liveConfig.js`: validate reconnect/rate limit/Nguyện Lực và tối đa 50 quy tắc quà. Quy tắc cụ thể ưu tiên Gift ID → tên → dải **đơn giá**, vẫn phải khớp khoảng giá của quy tắc; chặn ID/tên trùng và dải bật chồng nhau. Có đủ Trà/Đan/Ban Phúc/Linh Căn/Quay Cam, số lượng và hiệu ứng item/sect/camera. Thêm/sửa/xóa lưu atomic vào caidat.json.
- Quà đơn/combo đã chốt: số item = repeatCount × quantity của mapping; tổng kim cương hiển thị = đơn giá × repeatCount. Item vào inventory qua ItemService; khi cultivation thử tự dùng, vẫn chịu cap buff, giới hạn linh căn/đan/camera. Không dùng được thì giữ trong túi. Battle/paused/stopped giữ item và activation chờ cultivation. Quà trước nhập môn giữ inbox theo ID, không tự tạo tài khoản; nhận sau khi nhập môn, túi đầy giữ phần dư.
- `cycleService.js`: xử lý item chờ ngay khi trở về cultivation, **trước** khi lần độ kiếp mới chốt roll. Nghi thức đã chốt từ trước vẫn giữ nguyên outcome và chỉ tiếp tục sau battle. Đây là sửa thứ tự tích hợp, không thay luật xác suất.
- Tim: đối soát delta/tổng tích lũy theo room, kể cả xen kẽ delta-only rồi total và restart, không cộng cả hai lần. Nguyện Lực mặc định 1.000, cooldown 60s, mốc đầy trao mỗi người đang nhập môn +1 điểm nhiệm vụ. Battle giữ pending theo người; khi cultivation mới cộng. Thanh bị cap ở ngưỡng khi hồi, không tích hàng đợi tim dư vô hạn. Follow/member chỉ ticker, không tự nhập môn hoặc chiếm camera boss/độ kiếp.
- `commandRouter.js`: thêm parseCommand() độc lập, giữ lệnh nguyên chuỗi/normalize dấu/cooldown/điều kiện cũ. Các bình luận khác không biến thành damage. `playerStore.js` normalize tên NFC trước lọc từ tục; tên người vẫn tối đa 20 ký tự, tên quà tối đa 60 cho mapping; DOM chỉ dùng textContent/value.
- `demoEventSource.js`: nhập môn từ bộ tạo mẫu và bình luận/quà/tim/follow/member demo đi cùng event bus. Các fixture nhiều cảnh giới và nút biểu diễn animation cũ vẫn phục vụ kiểm thử Giai đoạn 1–3. `demoConnection.js` dùng chính TikTokAdapter với transport cục bộ để thử offline/drop/reconnect/end; không gửi sự kiện giả lên TikTok.
- `server.js`: hai bộ GameEngine dùng chung code, riêng tiến trình/tệp. Mặc định demo, chỉ lazy-load `data/players.json` khi chọn LIVE. Đổi chế độ lưu bên cũ rồi chọn bên mới, không trộn ID/EXP/túi/battle; chỉ chạy thời gian bên đang chọn. File v1 được sao lưu trước migrate; JSON lỗi không ghi đè. Restart không tự nối mạng TikTok. Adapter thật chỉ có thể nhận vào bộ LIVE; thao tác tạo/xóa/demo/chuẩn bị cấp tốc bị chặn trong LIVE.
- Lưu schema2 tương thích: thêm runtime.interactions chứa receipts/combo/inbox/activation/tim/phúc lợi pending; dữ liệu schema2 cũ nhận mặc định. Snapshot chỉ công khai Nguyện Lực/banner cùng dữ liệu game vốn có, không gửi receipts/inbox/raw event/khóa ký. Gift/điểm phúc lợi/skill/join quan trọng lưu trước khi phát event; thông báo/tim thường autosave theo cơ chế 5s cũ. Đóng cưỡng bức có thể mất một phần tiến trình thường chưa lưu.
- Bảo vệ admin: giữ loopback/Host/Origin/JSON-only/read-only WS, thêm CSRF token phiên cho request browser và chặn Sec-Fetch-Site cross-site. Token lấy riêng ở /api/admin-session, không broadcast /song. CLI cục bộ không có Origin/Fetch-Metadata giữ API cũ. Body JSON tối đa 32KB để lưu bảng 50 quy tắc; từng event vẫn validate chặt.
- `public/js/livePanel.js`, `liveOverlay.js`, cập nhật admin/main/network/HTML/CSS: mục 06 có NỐI/NGẮT, username/khóa ký tùy chọn, status/history, chọn demo/LIVE, reconnect/tim, CRUD mapping, thử quà/heart/follow/member/combo/replay/offline/drop/end. Nút demo khóa khi ở LIVE. `/song` có nhãn nguồn, thanh Nguyện Lực, banner tên/giá/item và avatar chữ đầu bằng CSS; tái sử dụng hiệu ứng 3D item/ring/camera hiện có, không tải ảnh ngoài.
- `scripts/live-smoke.js`, README.md/HUONGDAN.md và bộ test mới; version 0.4.0. Giữ launcher/preview và mọi module tông môn/độ kiếp/chiến trường cũ.

### Kết quả kiểm thử Giai đoạn 4

Môi trường Windows / Node v24.13.1 / npm 11.17.0. `npm.cmd test`: **66 bài — 65 PASS / 0 FAIL / 1 SKIP**. Log: `test-results/phase4-node-test.txt`. Tất cả test ghi dữ liệu dùng thư mục tạm; integration kiểm tra nguyên byte tệp sentinel người chơi thật, lưu LIVE riêng, mapping/dedup sau restart và không có khóa ký trong JSON/WS. Đã kiểm tra cú pháp các module JS server/frontend/test/scripts bằng node --check.

| Mã | Kết quả | Bằng chứng và giới hạn |
|---|---|---|
| 04-01 | PASS adapter mô phỏng | UserOfflineError → lỗi tiếng Việt, không báo connected, game không dừng; kênh offline thực chưa thử |
| 04-02 | PASS adapter/API | NGẮT hủy timer, callback connect trễ không sống lại; connect pending không chặn tick |
| 04-03 | PASS clock giả + server demo thực | 4.999s chưa nối lại, đúng 5s mới thử; đủ 10 retry thì dừng, không vô hạn |
| 04-04 | PASS | NỐI lặp chỉ tạo một connection và một listener/event; cleanup listener cũ |
| 04-05 | PASS | nhập môn/NHAP MON cùng lệnh, không reset, hai ID trùng tên vẫn riêng |
| 04-06 | PASS | Comment 1/2 qua bus/adapter dùng combat x2/x3, cooldown 10/25s |
| 04-07 | PASS | Cultivation/chưa nhập môn không gây damage, chat thường không đánh |
| 04-08 | PASS | Đủ năm item theo mapping; dùng qua luật item và giữ dư |
| 04-09 | PASS | Update 1/3/5 không cấp; final 5 cấp đúng năm; khác combo vẫn độc lập |
| 04-10 | PASS | Cùng eventId/final combo khác messageId/restart không cấp lại trong TTL |
| 04-11 | PASS | Battle giữ inventory, EXP/realm/buff không đổi; item tác dụng sau trở về |
| 04-12 | PASS API/đĩa | Mapping lưu/restart còn nguyên; ID ưu tiên, dải trùng bị chặn |
| 04-13 | PASS | Delta/tổng/lặp/xen kẽ/restart không double-count, cooldown thưởng và pending battle đúng |
| 04-14 | PASS | 20 event cùng user chỉ một ticker/cooldown; flood toàn cục và log được giới hạn |
| 04-15 | PASS logic | Tên HTML/control/từ cấm/NFD bị lọc/NFC/cắt đúng; output text-only; browser XSS trực tiếp chưa thử |
| 04-16 | PASS API/transport mô phỏng | Ngắt TikTok vẫn có tick, người chơi và HTTP/WS; reconnect không reset trận |
| 04-17 | PASS app/demo | App thật HTTP 31 người, combo/replay, skill, quà/tim trong battle, reconnect5s, trở về dùng đan và điểm; chỉ tệp demo tạm |
| 04-18 | **CHƯA KIỂM CHỨNG / SKIP** | Không có phiên LIVE thực để nhận sự kiện; không tuyên bố PASS |

Kiểm thử bổ sung PASS: dispatch của connector **đã cài** với native v3; reject thiếu ID/group/giá/NaN/Infinity; combo thiếu end/inconsistent không đoán; inbox trước nhập môn/restart/túi đầy; root không dùng lần hai; quà đan trước roll mới; bảo vệ CSRF/Origin/metadata, reject lưu secret, lỗi ghi LIVE làm pause; 2.500 sự kiện dồn dập vẫn có tick và log/effect hữu hạn. Toàn bộ **41 test cũ PASS**, gồm 11 trường/boss/rewards/phase/pause, độ kiếp/RNG/buff/item/nhiệm vụ, dữ liệu, network, các model animation/camera/pool và launcher nhánh thiếu Node.

Đã chạy **ứng dụng thực** bằng `node scripts/live-smoke.js`: 31 đạo hữu, combo chốt năm lần Trà chỉ một lần, hai chiêu battle, Đan nhận trong trận, 1.000 tim/follow/member, transport demo rớt và **nối lại sau 5 giây thật** trong khi engine vẫn tick, kênh offline/ngắt, về tông môn dùng đan trước roll và cộng điểm pending. Kiểm tra chỉ `data/demo/players.json` trong thư mục tạm được tạo; không có tệp dữ liệu thật. Kết quả **PASS** tại `test-results/phase4-smoke.json`; tiến trình đã tự đóng. Đây là kiểm chứng server thực với transport demo, không phải nhận LIVE thật hoặc render WebGL.

### Các quyết định bổ sung và giới hạn

- Ngưỡng quà 1–9/10–99/100+ là mapping mẫu đề xuất, không khẳng định là bảng quà bắt buộc trong PDF. Dùng đơn giá cho điều kiện, số quà chốt để nhân item; tất cả chỉnh được. ID/tên cùng dải phải khớp để tránh rule giá không chủ ý.
- Nguyện Lực 1.000/cooldown60s/+1 điểm nhiệm vụ là luật V1 bổ sung được tài liệu cho phép, không phải số liệu gốc PDF. Không cộng EXP hoặc bypass cổng độ kiếp trong battle.
- Bounded cache/input là giới hạn vận hành: tối đa 50.000 receipt 24h, 5.000 combo/inbox người chưa nhập môn, hàng đợi mạng 1.000. Nếu quá tải/thiếu dữ liệu/mapping, có log từ chối; không cam kết tiếp nhận mọi sự kiện bị TikTok bỏ hoặc ngoài giới hạn. Không giữ nội dung bình luận lâu dài, không tải avatar.
- Quà có thể tạo hiệu ứng cảm ơn khi battle, nhưng vật phẩm chỉ kích hoạt trong cultivation. Item chưa dùng được do cap/permanent/cooldown giữ trong túi để người chơi dùng sau, không tự lên lịch dùng liên tục. Nguyện Lực cooldown chạy theo thời gian server thực; thời gian buff/độ kiếp/skill giữ luật pha cũ.
- Chỉ dữ liệu đang chọn được mô phỏng. Đổi mode hoặc ngắt TikTok không xóa bên còn lại. Không gọi connector thật trong test/demo; test factory và dispatch native không thay thế phép thử với kênh LIVE.

### Lỗi đã phát hiện/sửa và phần Chưa kiểm chứng

- Sửa khác biệt field README/v3 bằng đọc type và dispatch thực; test dùng connector cài tại máy.
- Giữ dấu final combo qua restart, không chỉ dùng dedup RAM của CommandRouter; không cộng các update trung gian.
- Đối soát tim delta-only xen tổng để tránh cộng hai lần; giữ state này qua restart.
- Chạy smoke phát hiện Đan battle có thể xử lý sau lúc nghi thức mới chốt roll: chuyển flush activation vào thời điểm về cultivation, thêm regression test.
- Ngắt khi connect pending từng có thể giữ hàng đợi mô phỏng chờ mạng: tách cleanup mạng khỏi mutation queue, có trạng thái disconnecting và test game vẫn tick.
- Batch input mạng thay cho một lượt ghi/nhận event; chặn overload/listener trùng/callback trễ; lỗi lưu vẫn pause an toàn.
- Giữ tên quà tối đa 60 để không hỏng mapping tên dài, tên người 20; normalize NFC trước lọc từ tục.

Đã thử lại công cụ trình duyệt bằng computer-use trong phiên này: inventory trả **“The browser access host is unavailable”**. Vì vậy thao tác trực quan NỐI/NGẮT/bảng quà, bố cục HUD và ảnh chụp WebGL trên Chrome/1080×1920, FPS/GPU memory/OBS/LIVE Studio, launcher nháy đúp vẫn **Chưa kiểm chứng**. API/logic/model PASS không được đổi thành PASS hình ảnh. **Không có lỗi FAIL còn mở trong bộ test đã chạy.**

Bước tiếp theo: khi có phiên TikTok LIVE hợp lệ, tự lên LIVE rồi chọn dữ liệu LIVE/NỐI, kiểm chứng 04-18 với các sự kiện người xem thực; kiểm tra trực quan UI/WebGL/OBS khi công cụ khả dụng và ghi bằng chứng. **Dừng tại Giai đoạn 4; chưa làm âm thanh/TTS hoặc các phần Giai đoạn 5.**

---

## Lịch sử Giai đoạn 3 (bàn giao trước)

Phần dưới giữ báo cáo trước khi người dùng yêu cầu Giai đoạn 4; các câu “chưa triển khai Giai đoạn 4” chỉ áp dụng thời điểm bàn giao cũ.

Cập nhật: **06/11/2026**. Phiên bản **0.3.0**. Phạm vi hiện tại: **Giai đoạn 3**, theo yêu cầu người dùng tiếp tục trên Giai đoạn 1–2. **Không triển khai Giai đoạn 4 hoặc 5.**

## Giai đoạn 3 — trạng thái hiện tại

Đã triển khai mã nguồn chiến đấu, vòng chơi tự động, lưu/khôi phục trận, giao diện và mô hình procedural. **41 kiểm thử tự động PASS / 0 FAIL / 0 SKIP**, gồm 26 kiểm thử hồi quy Giai đoạn 1–2 và 15 kiểm thử mới. **Chưa nghiệm thu hoàn toàn phần hình ảnh**: WebGL thực tế, bố cục/độ mượt, FPS, OBS/LIVE Studio và nháy đúp launcher vẫn **Chưa kiểm chứng**. Không tự chuyển các giới hạn cũ thành PASS.

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md và kế hoạch trong phases/, tập trung phases/03_DIET_MA.md. Giữ bảng chỉ số/ngưỡng/xác suất tu luyện và các chức năng cũ. Các kiểm thử dùng thư mục tạm; không xóa hoặc sửa dữ liệu người chơi trong `data/` của dự án. Giữ camera/graphics trong cấu hình, chỉ merge các mục mới. Không thêm dependency, asset hoặc kết nối ngoài.

### Mã nguồn đã triển khai

- `battleConfig.js`, `caidat.json`: merge/validate `cycle`, `skills`, `boss`, `combat`, `rewards`. Chu kỳ mặc định 600/300 giây. Admin chỉnh thời lượng 10–3600 giây, áp dụng lần vào pha tiếp theo; cấu hình chi tiết chỉnh JSON khi server đóng.
- `cycleService.js`, `gameEngine.js`: tự động cultivation → prepare → battle → result → return → cultivation; phaseStart, elapsedActiveMs, remainingMs, cycleId, battleId. Prepare/result/return là chuyển trạng thái logic nguyên tử 0 ms, không lấy thời gian của trận; bảng kết quả hiện thêm 12 giây tu luyện. Paused/stopped không tiến AI/cooldown/EXP/buff; resume không reset trận.
- `battleService.js`: 11 chiến trường theo cảnh giới khóa lúc tham gia; realm/stage/stat trong trận được chụp riêng. Trường trống không sinh quái/boss. Người mới được vào trường phù hợp, ghi thời gian đến và không sửa HP boss đang sống. Server mô phỏng mọi trường có người, snapshot chỉ gửi danh sách tổng quát và dữ liệu chi tiết trường đang xem.
- `monsterFactory.js`: Ma Binh, Ám Linh, Thạch Ma và ba boss có HP/ATK/DEF/tốc độ/target/trạng thái thật. Ban đầu 3 quái/người; giới hạn mặc định 90 quái sống/trường, phần còn lại nằm trong pendingMobs và được sinh dần. Boss 2 triệu hồi thêm ba Ma Binh/đợt theo chu kỳ kỹ năng; boss 1 đánh lan, boss 3 đánh diện rộng và cuồng nộ dưới 30% HP.
- `combatService.js`: AI chọn và giữ mục tiêu, di chuyển, tự đánh, phản kích, hạ gục/hồi sinh; một đường applyDamage ghi tổng sát thương thực vào quái/boss. HP không âm, overkill không tăng TOP. Kỹ năng 1 x2/10s và 2 x3/25s theo đồng hồ battle, mỗi người/mỗi chiêu riêng. Chỉ người sống đang tham chiến được dùng; không nhận sát thương do client khai báo.
- `commandRouter.js`: lệnh `1`/`2` đi chung cổng bình luận demo với lệnh cũ. Khóa cooldown chống spam; ID kỹ năng đã thành công lưu cùng trận nên restart không cho replay gây damage lần hai.
- `rewardService.js`, `playerStore.js`: xếp hạng mỗi trường độc lập, chốt kết quả và phát một lần/battleId. TOP 5/4/3; còn lại +1/Ban Phúc; solo +1/Ban Phúc; không đóng góp không nhận thưởng. Bước dư ở pendingStageRewards, dừng Viên Mãn và áp dụng tiếp sau độ kiếp thành công. Phi Thăng đổi thành điểm nhiệm vụ, không tạo cảnh giới 12. Ban Phúc vào túi hoặc pendingBlessings nếu đầy; không mất thưởng.
- `cultivationService.js`, `breakthroughService.js`, `itemService.js`: vẫn khóa cộng tu vi/tiêu buff/độ kiếp trong battle; đường grant EXP mới giữ pendingExp ngoài cultivation. Thành công độ kiếp tiêu phần thưởng bước chờ đúng cổng. Năm item và nhiệm vụ cũ giữ hành vi.
- `server.js`: API cấu hình chu kỳ, camera trường, demo 11 cảnh giới. Tạo tối đa 44 ID demo cố định, không reset ID cũ; kiểm tra tổng giới hạn 500 trước khi thêm. Ghi quan trọng trước khi phát event; autosave thường 5 giây; lỗi ghi dừng game. Tick đã xếp hàng cũng kiểm tra lại trạng thái lỗi lưu.
- `public/js/battleScene.js`: ba kiểu quái, ba boss khác hình/màu/vũ khí, nền/đá/cổng/vòng trận/tinh thạch/đảo nổi/khe dung nham procedural. Pool cố định 60 quái/3 boss/12 hiệu ứng, Low hiển thị tối đa 24 quái và dùng bốn hiệu ứng đồng thời. Kiếm khí, tia lôi, vòng đánh lan/thiên thạch, số sát thương, HP và tư thế chết đều tạo bằng code.
- `battleOverlay.js`, `battlePanel.js`, `main.js`, `camera.js`, `presentationState.js`, `characters.js`, `overlay.js`, HTML/CSS: scene trường đang xem, boss/HP/TOP5, thông báo kỹ năng/đòn cuối, tổng kết từng trường và trở về tông môn; auto camera tối thiểu 8 giây/trường, chọn thủ công không reset mô phỏng, ưu tiên boss/đóng góp/cuồng nộ/kết liễu. Giữ camera/animation/độ kiếp và cảnh tông môn cũ. Overlay mới nằm trong khung dọc #stage.
- `test/battle.test.js`, `battle-integration.test.js`, `battle-visual.test.js`: clock giả, API/WS/đĩa/restart và mô hình Three.js. README.md/HUONGDAN.md đã cập nhật thao tác Giai đoạn 3; package 0.3.0, không đổi dependency.

### Kết quả kiểm thử

Windows, Node v24.13.1, npm 11.17.0. Chạy `npm.cmd test`: **41 PASS / 0 FAIL / 0 SKIP**. PowerShell chặn shim npm.ps1 nên dùng npm.cmd, không đổi execution policy. Log: `test-results/phase3-node-test.txt`. Đã chạy `node --check` trên tất cả module server/frontend/test/scripts.

| Mã | Kết quả | Bằng chứng |
|---|---|---|
| 03-01 | PASS | Đúng 600.000 ms vào battle, còn 300.000 ms; không chuyển sớm ở 599.750 ms |
| 03-02 | PASS | 60 giây battle giữ nguyên tu vi/cảnh giới/tầng; kiểm tra cả chu kỳ |
| 03-03 | PASS | Cấp item giữ trong túi, dùng bị chặn; buff không giảm, grant EXP giữ pendingExp |
| 03-04 | PASS | Ba cảnh giới có ba trường/boss riêng; smoke thực chạy cả 11 trường |
| 03-05 | PASS | Tám trường trống không tạo quái/boss/AI |
| 03-06 | PASS | HP solo đúng công thức và hệ số solo; một người chỉ thưởng cơ bản, không TOP ảo |
| 03-07 | PASS | Không bình luận vẫn có damage, quái/boss phản kích, hạ gục và hồi sinh đúng 10s |
| 03-08 | PASS | Chiêu 1 gây 20 damage với ATK 10/DEF 0, khóa 10.000 ms |
| 03-09 | PASS | Chiêu 2 gây 30 damage với ATK 10/DEF 0, khóa 25.000 ms độc lập |
| 03-10 | PASS | Spam/duplicate không cộng thêm hit/damage; ID vẫn bị chặn sau restart |
| 03-11 | PASS | Boss 0/100/200 giây, kết thúc 90/190/290; N chốt riêng tại mỗi lần sinh |
| 03-12 | PASS | Người mới tham gia không đổi maxHp boss đang sống; joinAt được lưu |
| 03-13 | PASS | Boss còn 3 HP chỉ ghi 3 damage; một lần kill/đòn cuối; boss 3 enrage một lần |
| 03-14 | PASS | Boss còn sống hết cửa sổ ghi timeout, không có lastHit/kill giả |
| 03-15 | PASS | Bốn người đúng 5/4/3/1, người thứ tư có Ban Phúc; solo/hai/không đóng góp đúng luật |
| 03-16 | PASS | +5 dừng tại Viên Mãn, dư hai bước; sau độ kiếp lên cảnh giới sau Hậu Kỳ |
| 03-17 | PASS | Finish/apply lặp và restart không tăng thưởng lần hai |
| 03-18 | PASS | Đúng hết trận về cultivation/chu kỳ mới; buff tiếp tục từ số ms còn lại |
| 03-19 | PASS logic/model | Dwell 8s, chọn tay, các trường khác vẫn gây damage; đổi view không đổi HP/ID |
| 03-20 | PASS API/WS/model | Kết nối mới nhận cùng ID/HP/countdown; restart disk giữ boss/skill cooldown; scene dựng từ snapshot. Reload trình duyệt thực: Chưa kiểm chứng |

Kiểm thử bổ sung PASS: cấu hình 10/15 và giá trị lỗi, hàng đợi 300 quái/100 người, min damage/DEF/NaN/Infinity/khác trường bị chặn, pause hồi sinh, tie xác định, Phi Thăng đổi điểm, migrate schema2 cũ, file trận lỗi bị từ chối, ID `__proto__` được lưu như khóa riêng, túi đầy giữ thưởng và chuyển lại vào túi khi có chỗ. Kiểm tra riêng boss 1 gây sóng đánh lan và boss 2 đưa ba Ma Binh vào hàng đợi rồi sinh đúng loại. Model test kiểm tra sáu mô hình, pool không tăng qua 200 snapshot/event, Low giảm quái, lọc người đúng trường, camera trên mặt đất, tư thế hạ gục và quay lại đủ người ở tông môn.

Toàn bộ **26 test Giai đoạn 1–2 vẫn PASS**: ID/seed/quy mô, 7 animation, preset/camera/effect pool, HTTP/WS/reconnect, atomic storage/migration/lỗi ghi, nhập môn/tu vi/ngưỡng, buff/item/nhiệm vụ, RNG/độ kiếp/bảo hộ/Thiên Mệnh, pause/resume, kết quả bền vững và không chạm dữ liệu thật.

Đã chạy tiến trình thật `node scripts/preview.js`, port 3001 với dữ liệu tạm. Qua HTTP: tạo 74 đạo hữu/11 trường, dùng chiêu 2, chạy ×10 với chu kỳ 10/15; quan sát **battle → cultivation (74 người có dấu thưởng) → battleId mới**, health 0.3.0 OK. Bằng chứng: `test-results/phase3-smoke.json`. Preview đã dừng sau kiểm tra. Đây là kiểm chứng ứng dụng/server thật, không phải kiểm chứng WebGL.

### Lựa chọn bổ sung đã công bố

- Sát thương dùng đề xuất của tài liệu: `max(1, floor(ATK × multiplier × 100 / (100 + DEF)))`, chặn ở HP còn lại. Không khẳng định đây là công thức gốc trong PDF. Mob/boss/nhân vật dùng cùng hàm; boss DEF mặc định 0.
- Đánh thường mỗi 1.000 ms; DPS_chuẩn = ATK Sơ Kỳ của trường / khoảng đánh tính giây. HP = round(N × DPS × 90 × K), K 0.65/0.85/1; **solo nhân thêm 0.65**. Kiểm tra với soloFactor=1 cho thấy Phàm Nhân không hạ được boss đầu bằng tự đánh; chọn 0.65 và có test solo Phàm Nhân tự hạ boss 1 trong cửa sổ. Đây là điều chỉnh solo được tài liệu cho phép; không thay K hoặc chỉ số cảnh giới.
- Boss windows lưu theo thang 300s, co giãn tỷ lệ khi admin đổi battleSeconds; HP vẫn dùng 90 giây chuẩn. Vì thế chu kỳ thử 15s chủ yếu để xem chuyển pha, không bảo đảm hạ boss.
- Hồi sinh mặc định 10s (JSON cho 8–15s), đầy HP về vị trí đầu trường. Không xóa nhân vật hoặc trừ tu vi khi bị hạ.
- Chuẩn bị/kết quả/trở về là bước nguyên tử tại ranh giới; kết quả chữ 12s chạy đồng thời cultivation, camera nâng cao ba giây đầu. Không cộng trừ vào 300s chiến đấu.
- Hòa điểm: thời gian đạt tổng điểm hiện tại sớm hơn → thời gian tham gia → userId. Tính sát thương boss + quái thực tế, không dùng overkill. Solo +1/Ban Phúc, Phi Thăng +10 điểm nhiệm vụ/bước. Dòng TOP 1:+3 trùng trong nguồn được hiểu là TOP 3 như GAME_DESIGN/phases đã nêu.
- SchemaVersion 2 mở rộng tương thích bằng runtime.battle/battleResult và trường pending của player; v2 cũ nhận mặc định. JSON mất alias activeBoss/bossHistory nên restore nối lại cùng object để cập nhật HP/timeout nhất quán. Restart bắt đầu stopped, không tính offline; bấm Tiếp tục để chạy cùng trận. Sự kiện quan trọng lưu trước khi phát; đánh thường tối đa khoảng 5s chưa lưu có thể mất khi đóng cưỡng bức.
- BattleDemo chỉ tạo ID mới ở cấp mẫu; ID đã có giữ tiến trình. Nút demo thường không ép kết thúc trận đang chạy. Các thao tác kết thúc/chuyển pha ở UI có xác nhận; chỉ camera đổi trường không ảnh hưởng AI.

### Lỗi đã xử lý và phần Chưa kiểm chứng

Đã sửa trong phiên: restore alias boss sau JSON, replay kỹ năng qua restart, phần thưởng chờ qua cổng độ kiếp, bảo toàn thưởng khi túi đầy, ID đặc biệt trong dictionary, giới hạn tổng 500 trước khi tạo mẫu, thêm demo không cắt trận, tick chờ không tiếp tục sau lỗi ghi, focus sự kiện boss tại trường đang xem, overlay nằm đúng container dọc và chuỗi tiếng Việt qua PowerShell. Kiểm thử độ kiếp cũ từng đọc file sau khi bộ nhớ đổi nhưng trước khi atomic write hoàn tất; đã sửa test chờ bằng chứng trên đĩa và toàn bộ hồi quy PASS. Ca enrage đầu tiên không đạt do fixture đánh bằng nhân vật đang bị hạ; fixture được chỉnh cho nhân vật còn sống, luật chặn người chết được giữ.

Công cụ browser hiện trả **“The browser access host is unavailable”**. Vì vậy:

- WebGL trực tiếp, screenshot, bố cục/độ dễ đọc ở 1080×1920, độ mượt kiếm/lôi/chuyển camera: **Chưa kiểm chứng**; chỉ PASS logic/model.
- FPS/GPU memory với 60–100 nhân vật, chạy dài, OBS/LIVE Studio: **Chưa kiểm chứng**.
- Nháy đúp launcher và tự mở browser thực vẫn **Chưa kiểm chứng**; kiểm thử nhánh thiếu Node cũ PASS.
- Không có lỗi logic FAIL còn mở trong bộ test đã chạy. Không tuyên bố hoàn thành nghiệm thu hình ảnh.

Bước tiếp theo: kiểm tra thực `/song` và các thao tác mục 05 khi công cụ UI khả dụng, ghi screenshot/FPS/OBS rồi cập nhật các mục Chưa kiểm chứng. **Dừng ở Giai đoạn 3; chưa triển khai TikTok LIVE hoặc âm thanh/TTS.**

---

## Lịch sử Giai đoạn 2 (bàn giao trước)

Phần dưới giữ nguyên báo cáo cũ; những câu “chưa có Giai đoạn 3” chỉ mô tả thời điểm bàn giao Giai đoạn 2.



Cập nhật: **06/11/2026**. Phiên bản **0.2.0**, phạm vi hiện tại: **Giai đoạn 2 theo yêu cầu tiếp tục của người dùng**. Không triển khai Giai đoạn 3/4/5.

## Giai đoạn 2 — trạng thái hiện tại

Đã triển khai nhập môn, tu vi, cảnh giới, vật phẩm, nhiệm vụ, độ kiếp và hoạt cảnh procedural trên nền Giai đoạn 1. **26 kiểm thử tự động PASS, 0 FAIL**, gồm cả 6 kiểm thử nền tảng cũ. **Chưa nghiệm thu hoàn toàn phần hình ảnh**: WebGL thực tế, screenshot, FPS, OBS/LIVE Studio và nháy đúp launcher vẫn **Chưa kiểm chứng**. Các giới hạn Giai đoạn 1 không được tự chuyển thành PASS.

Đã đọc lại AGENTS.md, GAME_DESIGN.md, PROGRESS.md, phases/01_NEN_TANG_3D.md và phases/02_TU_LUYEN.md trước khi chỉnh mã. Không phát hiện mâu thuẫn giữa bảng chỉ số/ngưỡng/xác suất Giai đoạn 2 và GAME_DESIGN.md. Người dùng đã yêu cầu chuyển sang triển khai Giai đoạn 2; những kiểm chứng đồ họa còn thiếu được giữ rõ trong báo cáo này.

### Mã nguồn đã bổ sung / thay đổi

- `cultivationConfig.js`, mục `cultivation` của `caidat.json`: 11 cảnh giới, 10 bộ ngưỡng, Pmin/Pmax, item/cooldown/Thiên Mệnh/nhiệm vụ; validate khi nạp. Giữ camera/đồ họa đã có. UI chỉnh được giới hạn hệ số và số thất bại để đảm bảo; bảng chi tiết chỉnh trong JSON khi server đã đóng.
- `playerStore.js`: tạo người chơi, lọc tên tối đa 20 ký tự, migrate schema v1 → v2, validate dữ liệu. ID/seed/ngoại hình cũ được giữ. Không xóa hoặc ghi lại dữ liệu người chơi thật.
- `cultivationService.js`: tu vi theo tick server, giữ phần dư, lên Sơ → Trung → Hậu → Viên Mãn, dừng tại cổng độ kiếp; Phi Thăng không có cảnh giới 12. Tách chính xác phần thời gian buff hết hạn giữa một tick.
- `itemService.js`: đủ Trà, Linh Căn, Đan, Ban Phúc, Quay Cam; cấp/dùng/ghi nguồn item, buff theo thời gian tu luyện. Ban Phúc áp dụng cả người mới vào trong thời hạn còn lại. Linh căn không tiêu hao lần hai, item nhận khi battle vẫn giữ trong túi.
- `breakthroughService.js`: một hàng chờ không trùng, mỗi lần 12 giây, xác suất server, +8 bảo hộ/tối đa 24, hồi 60 giây tu luyện, Thiên Mệnh sau 5 thất bại. Lưu roll/outcome một lần trước khi phát event. Reload/restart không roll lại; kết quả chỉ áp dụng một lần. Battle/pause/stopped tạm hoãn cả hoạt cảnh lẫn cooldown.
- `questService.js`, `commandRouter.js`: lệnh tiếng Việt đúng toàn chuỗi, có/không dấu; dedup event, nhập môn không reset, cooldown/hạn mức, điểm danh và đổi đủ năm item. Nguồn demo đi qua cùng service; không có TikTok connector.
- `gameEngine.js`, `demoEventSource.js`: gắn service vào engine duy nhất, thêm tốc độ demo ×1/×10, chế độ xem lại animation Giai đoạn 1. Bấm demo lại chỉ thêm các ID còn thiếu, không xóa tiến trình đã có. Nút xóa demo vẫn là thao tác xóa chủ động riêng.
- `server.js`: tuần tự hóa tick và admin; autosave mỗi 5 giây và tại thay đổi quan trọng. Chỉ phát sự kiện độ kiếp sau khi ghi thành công. Lỗi ghi dừng mô phỏng và trả lỗi; không âm thầm tiếp tục. Bản sao nguyên byte v1 tại `data/demo/players.json.v1.backup`, tạo một lần trước khi nâng schema. API mới vẫn chỉ localhost, không nhận roll/outcome từ browser.
- Snapshot v1 giữ trường cũ, thêm cảnh giới/tầng/stats/tu vi/activeBuffs, hàng chờ, hoạt cảnh và kết quả. HP/ATK/DEF được tính từ realm/stage/config, không tin dữ liệu chỉ số gửi từ client. `state:snapshot` gộp tu vi 4 Hz, không gửi từng event EXP cho mỗi người. Thêm event `player:joined`, `stage:up`, `breakthrough:started/completed`, `item:used`, `camera:focus`, quest. `/api/state` có audit nội bộ; WebSocket không gửi roll/outcome trước khi hoàn tất.
- `public/js/breakthroughScene.js`, `presentationState.js`: đài đá nổi độc lập, vòng sáng, mây đen, 1–10 đợt sét theo mốc, flash/rung nhẹ; trạng thái dựng lại từ snapshot khi reload. Low bỏ rung, giảm sáng nhưng giữ trình tự. `characters.js` thêm cast/hit, quỳ khi thất bại, aura theo cảnh giới, bảng tên/cảnh giới.
- `cultivationPanel.js`, `admin.js`, `overlay.js`, `main.js`, `effects.js`, `camera.js`, CSS: bảng tu vi/túi đồ/nhiệm vụ, lệnh nhập môn, cấp/dùng/đổi item, Viên Mãn demo, camera đài ưu tiên, thẻ tiến trình trên `/song`, hiệu ứng item pool hữu hạn. Giữ toàn cảnh/follow/orbit/auto, bảy animation, ba preset và UI phát sóng cũ.
- `test/cultivation.test.js`, `cultivation-integration.test.js`, `breakthrough-visual.test.js`, `network-client.test.js`; cập nhật nhỏ test cũ để bật chế độ đi dạo thay cho trạng thái thiền mặc định mới.
- `scripts/preview.js`: server kiểm tra ở port 3001 và thư mục tạm, không dùng dữ liệu dự án. `README.md`, `HUONGDAN.md`: cập nhật cách thử Giai đoạn 2.

### Kết quả kiểm thử Giai đoạn 2

Môi trường Windows / Node v24.13.1 / npm 11.17.0. Lệnh `npm test`: **26 PASS / 0 FAIL / 0 SKIP**. Đầu ra: `test-results/phase2-node-test.txt`. Tất cả test lưu dữ liệu dùng thư mục tạm; file thật `data/players.json` không bị chỉnh sửa. `node --check` đã chạy trên các module server/frontend/test/scripts. Không thêm dependency ngoài bộ thư viện Giai đoạn 1.

| Mã | Kết quả | Bằng chứng chạy |
|---|---|---|
| 02-01 | PASS | Lệnh nhập môn chuẩn hóa và lặp cùng ID không reset tu vi; dedup event; tên được lọc/cắt |
| 02-02 | PASS | 99,95 giây vẫn Sơ, đúng 100 giây lên Trung; phần dư gần 0 |
| 02-03 | PASS | Kim Đan 3,2/s lên Trung đúng 175 giây; rate không đổi theo tầng |
| 02-04 | PASS | Battle/pause/stopped giữ nguyên EXP, buff và cooldown; mọi đường cộng EXP bị chặn |
| 02-05 | PASS | 1/2/3 buff x2 → x2/x4/x6, đúng cap; kiểm tra buff hết giữa tick |
| 02-06 | PASS | Hậu lên Viên Mãn, giữ phần dư, chỉ một entry trong queue |
| 02-07 | PASS | RNG test thành công → Sơ cảnh giới sau; complete gọi lại không cấp lần hai |
| 02-08 | PASS | RNG test thất bại → giữ cảnh giới/tu vi, +8 bảo hộ, hồi đúng 60.000 ms |
| 02-09 | PASS | 4–5 lần thất bại vẫn cap 24, P không vượt Pmax; đan clamp ở mọi cảnh giới |
| 02-10 | PASS | Sau 5 thất bại nghi thức đảm bảo tự kích hoạt; reset Thiên Mệnh sau thành công |
| 02-11 | PASS logic/model | 11 người đủ điều kiện chỉ có một ceremony, queue không trùng; camera ưu tiên bằng model test |
| 02-12 | PASS | Linh căn vĩnh viễn, trà tạm thời, dùng linh căn lần hai không tiêu hao |
| 02-13 | PASS | Battle không dùng item và không trừ số lượng; về cultivation mới dùng |
| 02-14 | PASS | HTTP→engine→ghi đĩa→WS; restart giữa độ kiếp giữ ID/roll/outcome/buff/tu vi; file dữ liệu thật nguyên vẹn |
| 02-15 | PASS | Lên Phi Thăng không tạo realm 12; EXP tiếp tục tích lũy, không xếp hàng mới |

Kiểm thử bổ sung PASS:

- Migration giữ bản sao v1 và ID/seed; file JSON hỏng không bị ghi đè.
- Gây lỗi ghi tệp `.tmp` có chủ đích: HTTP 500, health báo lỗi, mô phỏng dừng, file lưu trước đó giữ nguyên. Thông báo EISDIR trong log test là lỗi được cố ý tạo, không phải ca test FAIL.
- Lưu kết quả **trước** event started; snapshot công khai không lộ roll/outcome đang chờ.
- Quests: cooldown 30s, hạn mức 10, điểm danh không lặp bằng restart, đủ năm item đổi điểm.
- Camera item hồi chiêu không mất thêm item; chuyển pha từ paused dùng đúng đồng hồ; tạo demo lại không mất tiến trình.
- Frontend network bằng WebSocket mock: dedup, seq cũ, reconnect và server restart transport ID mới.
- Model Three.js: dựng lại vị trí/camera từ snapshot active; đủ 1–10 đợt sét; geometry không tái tạo; cast/hit; pool item giới hạn 8 và hết hạn.
- Hồi quy Giai đoạn 1: HTTP, WS, lưu cấu hình, seed/quy mô 10–500, tick/pause, 7 animation, 60/40 view, tái sử dụng mesh qua 100 snapshot, camera/pool, launcher nhánh thiếu Node: đều PASS.

Chạy ứng dụng thật bằng `node scripts/preview.js` với 30 người: `/health`, `/`, `/song`, `/js/cultivationPanel.js`, `/js/breakthroughScene.js` đều HTTP 200. Quan sát `/api/state` cho thấy nhân vật tự lên **Phàm Nhân Hậu Kỳ** và có tu vi tích lũy; đây là xác nhận luồng server, không phải xác nhận hình ảnh.

### Những phần Chưa kiểm chứng

Đã thử lại công cụ trình duyệt: browser access host unavailable. Chọn được cửa sổ Chrome bằng native UI, nhưng bước mở tab bị công cụ dừng vì không xác định được URL đủ tin cậy để thực thi chính sách. Đã dừng UI, không đi vòng qua hạn chế đó. Không có screenshot hoặc phép đo GPU/FPS.

- Hoạt cảnh WebGL thực tế (mây/sét/chống đỡ/thành công/thất bại), đọc tên trên màn hình và độ mượt chuyển cảnh: **Chưa kiểm chứng trực tiếp**, chỉ PASS mô hình/logic.
- Giao diện thao tác thực trong Chrome, 1080×1920, OBS/LIVE Studio, bộ nhớ GPU/chạy dài: **Chưa kiểm chứng**.
- TTS/audio chưa triển khai vì thuộc Giai đoạn 5; Giai đoạn 2 dùng thông báo chữ. Không có LIVE thật, không triển khai Giai đoạn 4.

### Quy tắc bổ sung đã chọn và công bố

- Chỉ số Viên Mãn dùng Hậu Kỳ; làm tròn stat theo tài liệu giai đoạn. Tu vi dư được giữ qua cổng độ kiếp; vẫn tích lũy khi đang Viên Mãn/độ kiếp trong cultivation.
- Hệ số = tổng các buff x2 còn hiệu lực + linh căn 2 (nếu đã biến dị), tối thiểu 1, cap mặc định 8. Ví dụ root+tea=4; không nhân lũy thừa.
- Đan dùng từ túi được đưa vào phần chuẩn bị, tối đa 10 viên/lần; tiêu thụ chuẩn bị khi chốt roll. Không nạp thêm lúc đang độ kiếp, không dùng ở Phi Thăng. Pmin<50 thì phần gốc+item không vượt 85 và luôn chịu Pmax.
- Một hoạt cảnh 12s, kết quả 3s, hàng chờ FIFO. Battle/pause/stopped đóng băng toàn bộ tiến độ độ kiếp, khi trở lại tiếp tục cùng kết quả.
- Thiên Mệnh tăng 1 mỗi lần thất bại cùng cảnh giới, sau 5 lần lần thử kế tiếp đảm bảo (vẫn chờ cooldown 60s). Thành công reset bảo hộ/Thiên Mệnh.
- Nhiệm vụ: +5 EXP/+1 điểm cho tu luyện, hồi 30s, tối đa 10/chu kỳ; điểm danh +3 điểm/phiên gameplay; thụ động +1 điểm/60 giây cultivation. Giá Trà/Đan/Ban Phúc/Linh Căn/Quay Cam = 2/3/6/20/2 điểm. Các mức nằm trong caidat.json.
- Phiên gameplay được giữ khi restart để không farm điểm danh; chuyển battle→cultivation mở chu kỳ nhiệm vụ mới. Chu kỳ tự động 10/5 chưa triển khai (Giai đoạn 3); hết đồng hồ vẫn tiếp tục cultivation.
- Demo ×10 chạy cùng service với 10 bước mỗi tick; mặc định ×1 sau khởi động. Không có RNG ép thành công/thất bại ở API; test mới dùng RNG kiểm soát. Có thể xem thành công chắc chắn hợp luật ở Phàm Nhân bằng 1 đan.

### Lỗi đã sửa trong phiên này và bước tiếp theo

- Snapshot cache nối lại có thể dùng cùng seq: cấp seq mới cho mỗi lần gửi snapshot đã commit.
- Dùng lại ID phiên gameplay khi restart có thể khiến frontend bỏ seq mới thấp hơn: tách transport ID mới khỏi gameplay session ID lưu đĩa.
- Thời gian animation cũ lớn hơn đồng hồ schema v1 mới: migration reset đồng hồ biểu diễn, giữ dữ liệu nhận diện.
- Camera request mới cùng người đang chờ cần ưu tiên cao hơn: nâng priority/duration thay vì bỏ qua.
- Chuyển pha từ paused sang pha khác từng giữ nhầm countdown: so sánh pha hiệu lực trước khi reset thời gian.
- Lỗi ghi đĩa từ admin cũng phải dừng mô phỏng, không chỉ lỗi autosave: đã bổ sung đường dừng và kiểm thử.

Chưa có lỗi logic FAIL còn mở trong bộ test đã chạy. Bước tiếp theo: kiểm tra thực giao diện/hoạt cảnh/FPS và cập nhật các mục Chưa kiểm chứng khi công cụ UI khả dụng. **Dừng ở Giai đoạn 2; không triển khai chiến trường hoặc kết nối TikTok.**

---

## Lịch sử Giai đoạn 1 (trạng thái tại lần bàn giao trước)

Phần dưới lưu nguyên bối cảnh trước khi người dùng yêu cầu Giai đoạn 2; các mô tả “chưa triển khai Giai đoạn 2” chỉ áp dụng cho lần bàn giao cũ.

## Trạng thái

Đã triển khai mã nguồn nền tảng và vượt qua 6 bài kiểm thử tự động. **Chưa nghiệm thu hoàn toàn Giai đoạn 1**: WebGL, hình ảnh thực tế, FPS và mở trình duyệt bằng nháy đúp còn **Chưa kiểm chứng**. Không triển khai hoặc chuyển sang Giai đoạn 2.

Đã đọc AGENTS.md, toàn bộ GAME_DESIGN.md và năm tài liệu phases. Ban đầu dự án chỉ có tài liệu; README.md và PROGRESS.md trống.

## Module đã tạo

- `package.json`, `package-lock.json`: Express 5.1.0, Three.js 0.180.0, ws 8.22.1, không build/CDN.
- `chay.bat`: kiểm tra Node/npm, cài dependencies, chạy server, yêu cầu mở trang sau khi listen; thông báo lỗi tiếng Việt, pause khi lỗi.
- `server.js`: bind 127.0.0.1; `/`, `/song`, `/health`, `/api/state`, `/api/control`, `/ws`; chặn Host/Origin ngoài localhost, JSON validation, giới hạn payload/backpressure, tuần tự hóa thao tác admin.
- `gameEngine.js`, `demoEventSource.js`: tick 20 Hz, snapshot 4 Hz, phase cultivation/battle/paused/stopped, clock giới hạn delta 250 ms, ID/seed ổn định, 10–500 nhân vật trong dữ liệu, sự kiện TTL/giới hạn số lượng. UI cho 10/30/60/100.
- `storage.js`, `caidat.json`, `data/demo/players.json`, `data/players.json`, `tucngu.json`: schema v1, ghi tạm/rename tuần tự; demo tách riêng; JSON lỗi được giữ nguyên và báo dừng. Chưa có đầu vào tên tùy ý/TikTok để áp dụng danh sách lọc.
- `public/js/scene.js`, `primitives.js`: sân gạch instanced trên núi nổi, điện mái cong/bậc/cột, cổng với biển CanvasTexture, tháp, bệ thiền, vòng trận, cây, núi xa, mây, thác, linh thạch, đèn lồng, kiếm bay, đổi ánh sáng.
- `characters.js`: mesh khớp chibi, tóc/áo/pháp khí theo seed, bảng tên; idle/walk/meditate/standUp/attack/teleport/celebrate; giới hạn 40/60 mô hình gần camera và ưu tiên nhân vật focus, tái sử dụng geometry/material.
- `camera.js`, `effects.js`: overview/follow/orbit/auto, nội suy/focus ưu tiên, hàng đợi hữu hạn; pool vòng dịch chuyển và bộ đệm hạt cố định.
- `network.js`, `overlay.js`, `main.js`, `admin.js`, HTML/CSS: snapshot/event dedup theo phiên + seq + eventId; reconnect 0,5–10 giây; UI tiếng Việt và khung dọc; ba mức đồ họa có hiệu lực trên renderer, bóng, hạt và giới hạn nhân vật; fallback lỗi WebGL.
- `test/*.test.js`, `README.md`, `HUONGDAN.md`: kiểm thử và hướng dẫn chạy thực tế.

## Kiểm thử đã chạy

Môi trường: Windows, Node **v24.13.1**, npm **11.17.0**. `npm test`: **6 PASS, 0 FAIL**. Đầu ra lưu `test-results/node-test.txt` (có thể sinh lại bằng npm test). Các bài 3D dùng Three.js Object3D với Canvas stub để kiểm tra transform/resource, **không render GPU**.

1. ID/seed, quy mô 10/30/60/100/500, tick giới hạn, pause/resume, luân phiên animation, event queue và validation: PASS.
2. 20 lần ghi JSON đồng thời được tuần tự hóa; JSON hỏng giữ nguyên, không reset: PASS.
3. HTTP, module Three.js local, WS kết nối mới/nối lại, Origin/Host validation, lưu cấu hình/30 demo và khôi phục sau restart, xóa demo không đổi file dữ liệu thật: PASS.
4. Chạy `chay.bat` qua cmd với PATH không chứa Node/npm: thông báo cài Node LTS, dừng mã 1: PASS (mô phỏng thiếu Node, không gỡ Node khỏi máy).
5. 7 animation tạo 7 tư thế khác nhau; 100 player server chỉ 60 view; 100 snapshot giữ nguyên UUID của mesh; preset thấp giảm 40; giải phóng view khi xóa: PASS.
6. Camera nội suy không xuống dưới y=7 trong kịch bản thử, focus ưu tiên/thời hạn, pool không tăng qua 1.000 sự kiện, mức hạt 100/600 và hết TTL: PASS.

Đã chạy `node server.js` thật, nhận thông báo listen ở localhost:3000. Chạy thêm launcher khi cổng đang bận: báo cổng bận và dừng, không mở máy chủ thứ hai. Các file JS frontend đã qua `node --check`.

| Mã giai đoạn | Kết quả | Bằng chứng / phần còn thiếu |
|---|---|---|
| 01-01 | Chưa kiểm chứng đầy đủ | Server khởi động được; chưa nháy đúp và quan sát tự mở trang |
| 01-02 | PASS (mô phỏng) | Test launcher với PATH chỉ System32 |
| 01-03 | PASS | HTTP 200 cho health/admin/song và Three.js local |
| 01-04 | Chưa kiểm chứng đầy đủ | 30 ID và animation logic PASS; hiển thị WebGL chưa quan sát |
| 01-05 | Chưa kiểm chứng đầy đủ | Kết nối mới nhận 30 player, mesh không nhân đôi trong model test; reload trình duyệt chưa thử |
| 01-06 | PASS phần server | WS client đóng/nối lại nhận snapshot seq mới; reconnect frontend thực tế chưa kiểm chứng |
| 01-07 | Chưa kiểm chứng đầy đủ | Model/hạt giới hạn PASS; hiệu lực bóng/pixel ratio trên GPU chưa quan sát |
| 01-08 | Chưa kiểm chứng | Có CSS khung 9:16, chưa screenshot 1080×1920/OBS |
| 01-09 | Chưa kiểm chứng đầy đủ | Nội suy và độ cao PASS; chất lượng bố cục/che khuất thực tế chưa quan sát |
| 01-10 | PASS phần server | Cấu hình và nhân vật khôi phục sau đóng/mở app trong integration test |
| 01-11 | Chưa kiểm chứng đầy đủ | 60 mesh tái sử dụng qua 100 snapshot PASS; FPS/GPU memory/chạy dài chưa đo |
| 01-12 | Chưa kiểm chứng đầy đủ | Three.js local trả HTTP 200, mã không tham chiếu asset ngoài; chưa ghi network trace trình duyệt |

## Lỗi đã phát hiện và xử lý

- npm bị sandbox chặn registry: đã cài thành công sau khi được cấp quyền.
- npm audit phát hiện ws 8.18.3 có lỗ hổng: nâng lên **8.22.1**, lần cài cuối báo **0 vulnerabilities**.
- Event join đến trước snapshot: thêm hàng đợi hữu hạn, xử lý sau snapshot.
- Camera focus chưa áp dụng duration/ưu tiên cao: đã sửa và kiểm thử.
- Test Host header qua fetch không gửi header tùy chỉnh như dự kiến: đổi sang node:http request, xác nhận 403.
- Test launcher báo lỗi cú pháp do cách truyền lệnh cmd/PATH trong test: sửa Windows verbatim arguments, đường dẫn `.\chay.bat`, loại PATH trùng không phân biệt hoa/thường. Launcher thực tế đã chạy nhánh thiếu Node và cổng bận. File .bat được chuẩn hóa CRLF.

## Giới hạn và bước tiếp theo

Công cụ trình duyệt báo browser host unavailable; Computer Use sau đó dừng vì không xác định được URL Chrome đủ tin cậy để thực thi chính sách. Đã dừng kiểm tra UI, không có screenshot sản phẩm. Không tuyên bố PASS đồ họa/FPS/OBS. Chưa phát hiện lỗi logic còn mở trong các bài đã chạy; rủi ro render WebGL và bố cục vẫn cần kiểm tra thực tế.

Chạy lần đầu: cài Node LTS ≥22 → nháy đúp `chay.bat` → **Thử không cần LIVE** → **Mở trang phát sóng**. Xem HUONGDAN.md. Máy chủ khôi phục danh sách nhưng bắt đầu ở `stopped`; bấm Tiếp tục hoặc tạo demo. Danh sách lưu ngay khi tạo/xóa, vị trí cuối lưu khi Ctrl+C. Không tích lũy thời gian khi server tắt.

Giai đoạn 1 chỉ có đồng hồ/phase thử, hết giờ dừng ở 00:00, không tự chạy gameplay 10/5. Chưa có tu vi, vật phẩm, độ kiếp, battle thực, TikTok, TTS hoặc âm thanh. Không thay đổi thông số cân bằng game.

Bước tiếp theo vẫn thuộc **Giai đoạn 1**: kiểm tra giao diện WebGL và 7 animation, camera, reload/reconnect thực, 1080×1920, 60 người/FPS/bộ nhớ, network trace và launcher nháy đúp trên Windows; ghi kết quả rồi chờ yêu cầu người dùng. **Chưa chuyển Giai đoạn 2.**
