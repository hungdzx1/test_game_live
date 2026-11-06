# GIAI ĐOẠN 06 — NÂNG CẤP GIAO DIỆN LIVE 3D

**Repository:** https://github.com/hungdzx1/test_game_live.git  
**Mục tiêu:** cải thiện hình ảnh trong `/song` theo hai concept 9:16 đã cung cấp: tông môn và đài độ kiếp cùng khung; nhân vật/boss tiên hiệp; camera luôn trôi nhẹ; trận chiến hai phe; HUD và thông cáo nhỏ gọn.  
**Lưu ý:** đây là refactor **trình diễn**, không thay luật hay dữ liệu game.

## Trình tự bắt buộc

| Bước | Tài liệu | Đầu ra kiểm được |
|---|---|---|
| 06.1 | `01_TONG_MON.md` | Một góc tổng quan 9:16 thấy đồng thời sân và đài |
| 06.2 | `02_NHAN_VAT_BOSS.md` | Nhân vật/boss procedural cải tiến, giữ animation + seed |
| 06.3 | `03_CAMERA_DO_KIEP.md` | Camera drift nhẹ và hoạt cảnh lên đài, ngồi thiền |
| 06.4 | `04_CHIEN_TRUONG.md` | Hai phe đối diện, boss trái, đệ tử phải, hiệu ứng đi đúng hướng |
| 06.5 | `05_HUD_THONG_CAO.md` | Thông cáo góc, HUD tối giản, hồ sơ chỉ khi được kích hoạt hợp lệ |

**Chỉ triển khai một bước trong mỗi lượt Codex; đừng tự động bắt đầu bước tiếp.** Nếu việc của bước hiện tại phụ thuộc vào module bước sau, chỉ tạo giao diện kết nối tối thiểu không kích hoạt chức năng tương lai.

## 0. Điều kiện tiên quyết và cách làm

1. Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, cấu trúc hiện tại và các file liệt kê bên dưới. Kiểm tra `git status` trước khi sửa. Không xóa/thay thế thay đổi chưa commit của người dùng.
2. Khảo sát API và nội dung state/events thực tế trước khi sử dụng; không đoán schema. Xác nhận tình trạng các test hiện tại làm mốc so sánh. Nếu tiện, tạo branch riêng `feature/live-visual-redesign` sau khi bảo đảm không có thay đổi chưa lưu.
3. Triển khai bằng **Three.js + HTML/CSS/JS hiện có**, dùng hình khối procedural, geometry, shader, particle và Web Audio. **Không tải model, sprite, ảnh tham khảo, texture, font hay âm thanh từ Internet; không nhúng nguyên hai ảnh thành nền.** Trường hợp đồ họa procedural không thể đẹp y hệt tranh concept, ưu tiên bản 3D stylized chạy mượt có bố cục tương đương và ghi rõ độ chênh so với ảnh.
4. Chỉ sửa phạm vi cần thiết: `public/song.html`, `public/css/style.css` (tách phần broadcast CSS nếu thích), `public/js/scene.js`, `characters.js`, `realmAura.js`, `breakthroughScene.js`, `battleScene.js`, `camera.js`, `overlay.js`, `battleOverlay.js`, `liveOverlay.js`, `main.js`, `effects.js`, `primitives.js` và các file giao diện mới nếu thực sự cần. Tên file là **các vị trí đã xác minh trên nhánh main**, không phải yêu cầu phải sửa hết.
5. `gameEngine.js`, `cycleService.js`, `cultivationService.js`, `breakthroughService.js`, `battleService.js`, `combatService.js`, `rewardService.js`, `playerStore.js`, `normalizeEvent.js`, `tiktokAdapter` (nếu có), `server.js`, `caidat.json`: **không sửa logic/định dạng**. Chỉ thêm cầu nối event/config tối thiểu khi thật sự cần để nhận biết quyền hiển thị thẻ người chơi; phải giải thích và test riêng phần thay đổi.
6. Không tạo lại WebSocket, không làm reset chu kỳ, không đổi dữ liệu demo/LIVE, không đổi luật nhận quà hoặc định giá quà. Không commit/push tự động.

## 1. Kết quả bắt buộc

- Một màn hình `/song` tỷ lệ dọc **9:16**, bố cục đồng bộ như ảnh A/B, chữ tiếng Việt rõ ràng.
- **Tông môn và đài độ kiếp cùng nằm trong một khung hình**; khi có đệ tử độ kiếp, người đó nhảy/bay lên đài rồi **ngồi thiền**, và các đệ tử ở sân bên dưới **vẫn nhìn thấy**.
- Camera **trôi, lia, orbit nhẹ liên tục** trong giới hạn an toàn; không fix cứng, không zoom đến mức mất sân hoặc đài. Ưu tiên sự kiện không gây cắt cảnh giật.
- Thông cáo kết quả thành **panel nhỏ ở góc**, không phủ cả màn hình.
- Khi diệt ma, **hai phe hiển thị rõ**: **trái** là quái/boss tiến tới, **phải** là nhóm đệ tử tung chiêu về phía boss. Có thể dùng một canvas với bố trí 3D đối xứng hoặc hai viewports/cameras cùng renderer nếu cách sau tốt hơn; tuyệt đối không tạo hai mô phỏng gameplay độc lập.
- Nhân vật và boss được cải thiện từ low-poly chibi hiện tại sang **stylized anime-xianxia 3D procedural**: áo nhiều lớp, tóc/áo cho cảm giác bay, tư thế thiền/cast, aura, silhouette rõ; không kỳ vọng giống hệt ảnh minh họa 2D siêu chi tiết.
- **Thẻ hồ sơ đệ tử ở dưới KHÔNG xuất hiện chỉ vì camera đang theo dõi**. Chỉ bật khi **người xem thực sự tặng loại quà được gán hành động `xem hồ sơ`** (chưa cần chốt quà nào). Tự ẩn sau thời lượng cấu hình, rồi quay về bố cục thường.

## 2. Phát hiện cụ thể từ repo (đã đọc nhánh `main`)

| Module hiện tại | Chức năng hiện tại | Hướng can thiệp |
|---|---|---|
| `public/js/scene.js` | Tông môn floating island; sân, cổng, mái, cây, mây; camera ban đầu | Dựng sân/đài cùng trục nhìn; thêm cảnh quan có chiều sâu và điểm neo camera |
| `public/js/breakthroughScene.js` | Có `TRIBULATION = {x:22,y:3.2,z:0}`, đài riêng, sét/mây | Bố trí lại đài và hiệu ứng, dùng chung vị trí neo với nhân vật; tránh nhân vật lệch đài |
| `public/js/presentationState.js` | Đưa người đang độ kiếp đến `TRIBULATION`, animation là `cast` | Giữ cách lấy state, cải thiện chuyển tiếp **ở phía trình diễn**; không thay state server |
| `public/js/camera.js` | `CameraDirector` với queue ưu tiên, follow, orbit, battle, breakthrough | Thêm framing an toàn & drift/lerp; giữ priority/cooldown/manual mode |
| `public/js/characters.js` | Nhân vật chibi đầu tròn, áo hình nón, tóc đơn giản, animate các tư thế | Nâng procedural model, đổi animation và giảm chồng nameplate; seed ổn định |
| `public/js/realmAura.js` | Hiệu ứng phân 11 cảnh giới | Giữ cảnh giới và tối ưu aura theo LOD |
| `public/js/battleScene.js` | Quái và 3 boss 3D dạng hình khối, chiến trường procedural | Chia đội hình 2 phía, boss tiến từ trái, đệ tử tấn công từ phải; hiển thị số lượng minh họa |
| `public/js/battleOverlay.js` | Panel boss lớn và `.battle-results` hiển thị kết quả 11 chiến trường | Làm panel boss gọn; thông cáo góc màn hình có luân phiên / trang nội dung |
| `public/js/overlay.js` | **`cultivation-card` được hiện khi có bất kỳ followed player** | **Tách hoàn toàn điều kiện hiện card khỏi `director.followed`**, chỉ hiện do quà/trigger hợp lệ |
| `public/js/liveOverlay.js` | Có `gift-banner` và event `live:gift`; effect `camera` | Dùng pipeline sự kiện hiện tại; định nghĩa riêng việc mở profile, không nhầm mọi quà thành profile |
| `public/js/main.js` | Ghép renderer, camera, events, network, HUD, battle và ceremony | Chỉ nối state trình diễn/phần UI cần thiết; không thêm vòng render độc lập |
| `public/song.html` + `public/css/style.css` | Header/footer tương đối lớn; CSS `.battle-results` có width 90%, max-height 58% | Tối giản HUD, sửa lớp thông cáo, giữ fallback WebGL và audio gate |
| `public/js/noticeQueue.js` | Hàng đợi notice có giới hạn | Tái sử dụng, thêm cơ chế timeout/collapse khi cần |

**Lưu ý:** Đây là khảo sát từ code GitHub, không phải kết quả chạy game hay xác nhận mọi màn hình đã được test ở máy người dùng. Codex phải kiểm tra nhánh local mới nhất trước khi sửa.

## 3. Art direction + bố cục 9:16

### 3.1. Màu và độ rõ

- Không gian nền: navy / xanh lam đêm / núi xa phủ sương.
- Tông môn: mái cong xanh tím với viền vàng, đèn lồng ấm, cột gỗ, cầu đá, hàng lan can, hoa đào, thác nước, mây, các đảo nổi nhỏ.
- Linh khí: cyan / xanh ngọc / tím, nhấn vàng cho nhân vật độ kiếp.
- Chiến trường: bên trái đỏ đen / tím ma khí, bên phải lam ngọc / vàng tiên khí. Tương phản mạnh ở đường va chạm giữa hai phe.
- Chữ HUD: sáng rõ, tương phản, giới hạn ký tự tên và tránh che nhân vật.
- **Không vẽ ký tự Hán**, không giả lập chữ rune gây rối; hình học rune bằng nét và mô típ trang trí không phải văn bản.

### 3.2. Bố cục dọc

- **Header chỉ chiếm tối đa ~10–12% chiều cao**: tên game thu nhỏ (không chiếm quá nhiều), pha hiện tại, timer, nguyện lực thanh mảnh. Không nhân đôi dòng `connection`, `chế độ demo`, hay thông số kỹ thuật che cảnh.
- **Vùng gameplay chính >= 75% chiều cao**; camera và world ưu tiên phần này.
- **Footer gọn <= 6–8% chiều cao**: tên tông môn + số đạo hữu + một dòng thông báo luân phiên. Không cố định thẻ chi tiết người chơi ở footer.
- Các popup chỉ xuất hiện ở vùng an toàn (tránh các vị trí che điều khiển TikTok, comment, quà); cấu hình padding responsive cho 720×1280 và 1080×1920.
- Các bảng và thông cáo thiết kế bằng CSS/DOM UI, không dựng ảnh 2D thành nền.

## Mốc bảo vệ chức năng
- Các test nền tại `test/`, nhất là kiểm thử tu luyện, độ kiếp, battle, LIVE event, smoke/integration, phải vẫn chạy.
- `public/js/main.js` vẫn dùng một renderer và cùng WebSocket/state; không làm biến mất fallback WebGL hay audio gate.
- Không chỉnh schema `caidat.json`, không thay hợp đồng `/api`, không thay dữ liệu `playerStore.js` hoặc tốc độ engine.
- Demo và LIVE tách biệt; không thử reset dữ liệu thật. Quà combo không được tính lặp; đừng sửa mapping vật phẩm ngoài yêu cầu UI.
- Tất cả hình ảnh/nhân vật mới dựng procedural bằng Three.js/CSS/SVG tại máy. Không dùng hai ảnh concept làm nền; không tải model, texture, font hoặc âm thanh từ Internet.
- Phải có phong cách và khả năng đọc giống concept ở mức hợp lý; đồ họa real-time procedural không thể mặc định giống độ chi tiết tranh minh họa 2D.

## 10. Tách module phù hợp (nếu cần)

Có thể tạo mới:

- `public/js/sectLayout.js`: tọa độ neo sân, đài, camera; helpers đo bounding/frame.
- `public/js/liveHud.js` hoặc CSS chuyên biệt: cấu trúc HUD live tối giản.
- `public/js/profileOverlay.js`: thẻ hồ sơ theo event; có `show(player, duration)` và `hide()`; chỉ UI.
- `public/js/cameraFraming.js`: kiểm tra safe-frame camera, drift theo thời gian.
- `public/js/proceduralCostumes.js`: đạo bào, tóc, phụ kiện và level-of-detail.

**Chỉ tạo file mới khi giảm độ phức tạp rõ ràng**. Tránh biến một thay đổi UI thành refactor toàn bộ dự án.

## Nguyên tắc bàn giao từng bước
Mỗi bước chỉ được đánh dấu hoàn tất khi đã chạy kiểm thử thật và có ảnh `/song` ở tỷ lệ **9:16** nếu môi trường cho phép. Bắt buộc ghi rõ phần chưa kiểm chứng, log lỗi, benchmark FPS/draw calls khi có công cụ đo. Sau bước 06.5 chạy toàn bộ hồi quy tổng hợp.

### D. Hồi quy bắt buộc

- [ ] `npm test` (toàn bộ Node tests) hoàn tất; nếu lỗi cũ tồn tại, so với baseline và ghi rõ.
- [ ] Chạy lại smoke script có trong `scripts/live-smoke.js` / `scripts/finishing-smoke.js` theo hướng dẫn đúng của dự án (không giả định chúng an toàn nếu không đọc script).
- [ ] Kiểm tra server khởi động, WebSocket state và các event phát sóng vẫn cập nhật đúng.
- [ ] Demo 10 và 60 người: không đơ, không dispose nhầm geometry/material dùng chung, không render quá giới hạn.
- [ ] Thử 1 lượt tu luyện → độ kiếp → diệt ma → kết quả → trở lại tu luyện; dữ liệu tu vi/HP/sát thương/thưởng không bị đổi bởi phần trình diễn.
- [ ] Quà đơn/combo được tính như cũ, không cấp item trùng, không thay đổi TikTok connector.
- [ ] Chụp ảnh thực tế từ browser (nếu có): `song-sect.png`, `song-tribulation.png`, `song-announcement.png`, `song-battle.png`, thử thêm ảnh FPS thấp/low quality.
- [ ] So sánh FPS, draw calls, WebGL memory trước/sau; nếu quá nặng phải giảm LOD/particles mà vẫn giữ bố cục.
- [ ] Không đánh dấu PASS cho thử nghiệm không chạy thực tế hoặc TikTok LIVE thật chưa kết nối được.

## 13. Báo cáo khi hoàn thành

Codex phải trả về: (1) những file sửa/tạo; (2) so sánh ảnh trước/sau; (3) cách camera đã giữ sân + đài trong cùng khung; (4) luồng mở profile chỉ bằng quà hợp lệ và cách gán quà **sau này**; (5) trạng thái test PASS/FAIL/CHƯA KIỂM CHỨNG; (6) FPS/draw calls trước/sau nếu đo được; (7) các hạn chế về độ giống ảnh tham khảo.

**Ràng buộc cuối cùng: Không được đánh đổi tính đúng của game để lấy giao diện đẹp. Thực hiện thay đổi tối thiểu, có kiểm thử hồi quy và giữ nguyên dữ liệu của người chơi.**

---
