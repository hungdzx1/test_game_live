# Scene Concept 02

### Thử avatar LIVE — 09/11/2026

**Bản sửa định dạng:** avatar thử/donor hiện tải PNG256px qua Node để xử lý WebP/AVIF và ảnh lớn; restart Node, đợi Unity biên dịch rồi Play lại. Không đổi scene. [Hướng dẫn bản sửa](Tailieu_output/avatar-format-fix/README.md); Node148 PASS/1 SKIP, Unity95 trường hợp khác nhau PASS qua hai lượt; LIVE/CDN thật sau sửa chưa kiểm chứng.

Khởi động lại Node, mở lại scene rồi Play. Trang chủ quản trị → **Kết nối TikTok LIVE** → bật **Thử avatar LIVE** (mặc định tắt, có lưu). Trong chế độ LIVE, viewer bình luận **test avt** để hiện thẻ ảnh/tên/trạng thái tải ở góc phải dưới10 giây, kể cả chưa nhập môn; không zoom hoặc tạo nhân vật. Người mới nhất thay thẻ, tắt công tắc ẩn ngay. [Hướng dẫn, ảnh và kiểm thử](Tailieu_output/live-avatar-test/README.md). Node144 PASS/1 SKIP, Unity92 PASS/1 SKIP bổ sung, Chrome3 PASS; TikTok/CDN thật chưa kiểm chứng.

### Khung hướng dẫn K01 Kim Vân — 08/11/2026

**Cập nhật mới:** khung đã thu về90% và trái12px, cạnh phải còn404,4px ở1080p để chừa đài. Bốn PNG tia chớp lặp45ms/frame trong toàn bộ nghi thức, giữ frame khi pause, tắt theo kết thúc server. Unity58/58 PASS, ảnh1080/720 và audit PASS. [Ảnh và kết quả hiện tại](Tailieu_output/guide-storm/README.md); báo cáo K01 bên dưới là mốc trước thu gọn.

K01 đã được người dùng chọn và ghép vào `07_UI/UI_Canvas/K01_PlayGuide`, gồm hướng dẫn bên trái và bảng quy đổi quà phía dưới, giữ Linh Căn x3. Dừng Play, mở lại scene rồi Play. Menu **Tu Tien LIVE → Concept 02 → Add K01 play guide** thêm vào scene đang mở chưa có; không ghi đè hoặc nhân khung. Khung không chặn chuột và giữ vị trí khi camera zoom. Xem [ảnh render, kiểm thử và hướng dẫn chỉnh sửa](Tailieu_output/khung-01/implemented/README.md).

### Quà toàn tông và camera tự động — Qua_Tbao phần7–8

Khởi động lại Node, mở lại Concept02 rồi Play. `GroupReceiptPresenter` hiện quà toàn tông trên đầu các nhân vật đang render, không zoom từng người; `IdleCameraPresenter` tự pan/zoom sau30 giây rảnh, theo tu sĩ lên đài rồi trở về. Sự kiện cá nhân được ưu tiên sau khi camera trả về góc gốc. Khi zoom vẫn hiện bảng tên/cảnh giới với tỷ lệ chữ được bù tạm. Menu **Tu Tien LIVE → Concept 02 → Add group receipts and idle camera** thêm hệ thống nếu scene đang mở chưa có. Xem [hướng dẫn và kết quả](Tailieu_output/qua78/README.md). Backend hiện tự dùng quà mới; Đan tự lấy vừa đủ khi bắt đầu độ kiếp, không cần bấm Dùng Đan.

### LV UP cho nhân vật — 08/11/2026

Hiệu ứng theo `Tailieu/LV_UP.md` được gắn tại `08_Systems/LevelUpPresenter`:7 lớp PNG vàng có sẵn quanh tu sĩ vừa tăng tiểu cảnh giới hoặc độ kiếp thành công, kéo dài2 giây và bám theo nhân vật. Thiếu light_beams thì bỏ qua; không tự tính lên cấp từ snapshot. Không cần đổi backend. Mở lại scene rồi Play; menu **Tu Tien LIVE → Concept 02 → Add character level up effect** hỗ trợ scene đang mở. Xem [hướng dẫn LV UP](Tailieu_output/level-up/README.md) để chỉnh Inspector, thử DEMO và đọc giới hạn pool/Low.

### Cơ chế boss chung — 08/11/2026

Theo `Tailieu/BOSS.md`, Concept02 đã thay11 chiến trường bằng ba boss nối tiếp trên đài độ kiếp. Sáu frame có sẵn của từng boss tạo animation; tu sĩ dùng pose attack và chiêu bay procedural. Khung tên/HP thay vùng hiển thị nguyên lực trong trận, fill giảm theo HP server. Gameplay, thời hạn và thưởng do Node quyết định. Khởi động lại Node và mở lại scene trước khi Play. Hướng dẫn cài đặt/Hierarchy, ảnh1080/720 và báo cáo kiểm chứng: [shared-boss](Tailieu_output/shared-boss/README.md). Các phần battle cũ bên dưới là lịch sử.

Scene mới: `unity-client/Assets/Scenes/SectScene_Concept02.unity`, tạo từ bản sao `SectScene_Main.unity`. Dùng Unity **6000.5.9f1 / URP 17.5.0** hiện có. Không thay scene chính hay thứ tự Build Settings.

Mở scene mới, đặt Game View **9:16**, 1080×1920 hoặc 720×1280. Chỉnh từng lớp bằng W/E/R, Transform và MeshRenderer; Ctrl+S trong Edit Mode. Camera orthographic size 9.6, khung cố định; tắt auto-fit/drift riêng cho scene này để sân luôn tràn viền. Không ép ảnh sân đã có phối cảnh thành sàn nằm ngang 3D.

Riêng mục5 `Qua_Tbao.md` có hoạt cảnh nhận Trà/Đan/Linh căn: camera zoom cận3 giây rồi trả đúng toàn cảnh, icon hiện trên đầu với người nhận/tên/số lượng. Chuyển camera ngay cả khi đang độ kiếp; quà liên tục được gom và xếp hàng theo xác nhận người dùng. Cần **khởi động lại server Node** để phát `item:received`, rồi mở lại scene/Play. Cấu hình tại `08_Systems/ItemReceiptPresenter`, giao diện tại `07_UI/UI_Canvas/ItemReceiptFX`. Xem [hướng dẫn và evidence](Tailieu_output/item-receipts/README.md).

### Cập nhật Character_4 và 25 chỗ ngồi — 08/11/2026

- Bốn PNG gốc tại `public/assets/02/Characters/Character_4/` được sao chép nguyên byte vào `unity-client/Assets/Art/SectConcept02/Characters/Character_4/`.
- Prefab mới: `Assets/SectConcept02/Prefabs/Character_4.prefab`, kế thừa Character_3, thay đủ meditation/fly/attack/celebrate. Chiều cao phần ảnh thấy được ở meditation được căn bằng Character_3; giữ ba prefab cũ nguyên trạng.
- `04_Characters/SpawnPoints/Seat_00` đến `Seat_24`: **5 hàng × 5 cột**, đánh số từ trái sang phải rồi từ hàng sau tới hàng trước. Trong khung 1080×1920, X=140/340/540/740/940; Y=1120/1280/1440/1600/1760. Có thể chọn từng Seat và chỉnh Transform trong Edit Mode.
- CharacterManager của Concept02 có `Character Variants` gồm bốn prefab và `Visible Character Limit=25`. High hiển thị tối đa 25; giữ cơ chế tiết giảm cũ: Medium tối đa10, Low tối đa6, tổng roster≥100 tối đa10 và ≥500 tối đa8. Scene khác giữ mặc định12. Người được camera/sự kiện ưu tiên thay một chỗ trong giới hạn đang dùng, không tạo thêm chỗ trùng.
- Chỉnh kích thước riêng nhân vật4 bằng **Transform → Scale** ở root prefab Character_4. Muốn thêm mẫu tiếp theo, tạo prefab cùng cấu trúc và thêm vào cuối `Character Variants`; không cần sửa backend.

Kết quả kiểm thử lượt cập nhật này được ghi riêng ở đầu `PROGRESS.md`; các số liệu bên dưới là lịch sử.

## Tài nguyên

Sao chép **39 PNG** từ `public/assets/02/`, giữ nguyên byte nguồn, không di chuyển/xóa ảnh. Đường dẫn người dùng gọi `public/asset/02` được xác định là thư mục thực tế `public/assets/02`. Concept `concept/1.jpg` chỉ làm tham chiếu, không dùng làm background ghép sẵn.

```text
Assets/
  Art/SectConcept02/
    Background/             # Trời, núi xa/trung, mây xa/gần
    Architecture/           # Đài, sân, thác, cành đào
    Effects/                # Pháp trận, tia sáng, hạt, hoa, mây sét/4 PNG sét
    Characters/Character_1…4/ # 4 pose mỗi bộ
    UI/                     # Khung, icon, thanh tiến trình, rank
    asset-audit.json         # Hash, alpha bounds, đường dẫn nguồn/Unity
  SectConcept02/
    Materials/              # Material PNG độc lập với scene cũ
    Meshes/                 # 15 quad đã bake, UV giữ viền alpha mềm
    Prefabs/Character_1…4.prefab
  Scenes/SectScene_Concept02.unity
```

Tên file `ui_cultivation_icon.png.png` chỉ được chuẩn hóa thành `ui_cultivation_icon.png` trong bản sao Unity. PNG không bị crop/chỉnh màu. Mesh môi trường giữ toàn bộ alpha mềm với đệm3px; UI dùng UV quanh alpha≥32 với đệm8px để bỏ các pixel alpha rất thấp nằm xa nội dung. Header atlas được tách thành ba RawImage có UV riêng, không tạo ảnh mới. Import Sprite/Full Rect/Texture2D, PPU100, sRGB/alpha, Bilinear/Clamp, không mipmap/compression/NPOT resize, max4096. Character pivot neo chân chung. Các lớp môi trường bám canvas nguồn 941×1672, phóng đều về khung 1080×1920; giữ phối cảnh gốc. Beam và vòng vàng được căn riêng vào mặt đài, cánh hoa thu nhỏ/giảm opacity theo ảnh render.

## Hierarchy và sử dụng

- `01_Environment`: Sky, MountainFar, CloudFar, MountainMid, CloudNear.
- `02_Architecture`: Waterfalls, MainCourtyard, CourtyardTrim, CherryBranches.
- `03_Formation`: FormationGround.
- `04_Characters`: 25 SpawnPoints theo lưới 5×5, CharacterPool và CharacterManager kế thừa.
- `05_Tribulation`: BreakthroughPlatform, FormationBreakthrough, BreakthroughBeam, ghế và TribulationFX kế thừa; `Breakthrough seat/StormFX` chứa StormCloud và Lightning_01…04.
- `06_Effects`: SpiritualParticles, Petals.
- `07_UI/UI_Canvas`: Header, NoticePanel, BlessingPanel, các TextMeshPro, Concept02Hud và BlessingPanelHud.
- `08_Systems`, `09_Camera`: hệ thống network/camera kế thừa từ Main.

Không dùng cổng, chùa, footer hoặc placeholder cành đào/cầu thang cũ trong scene mới. RosterHUD cũ inactive để giữ reference tương thích; NoticePanel hiện dành cho TOP3 cảnh giới.

Chạy Node như trước rồi Play để thấy người chơi thực từ DEMO/LIVE. Trong `04_Characters → CharacterManager → Character Variants` đã gán bốn prefab `Character_1…4`. Mỗi người được chọn mẫu ngẫu nhiên có seed cố định từ server; không đổi mẫu khi nhận snapshot, quay lại ghế, độ kiếp hoặc reconnect với cùng danh sách. Pool tách theo prefab, giữ đúng sprite/tỉ lệ/nameplate đã chỉnh của từng mẫu. `Character Prefab` là fallback khi danh sách trống hoặc chỉ có ô None, để scene cũ tương thích. Thay đổi số lượng/thứ tự danh sách có thể đổi cách phân mẫu; không lưu ngoại hình vào dữ liệu backend.

Bốn pose là meditation/fly/attack/celebrate; idle, hit, rear và các pose chưa có dùng meditation. Đây là ảnh pose rời, không phải sprite sheet nhiều frame. Không tạo người chơi mẫu trong scene đã lưu.

Theo chỉnh sửa kích thước07/11/2026, root Scale của prefab Character_1 là **0.66719069**, Character_2 là **0.674967323**, Character_3 giữ **1.0354** đã được chỉnh sẵn. Đây là hệ số thu nhỏ đồng đều cả hình/tên/aura/bóng từ các chỉnh sửa child đã có; Body Scale không bị ghi lại. Ba mẫu được căn theo chiều cao nội dung alpha≥32 ở pose meditation của mẫu3 (khoảng1.3372191 world units), giữ nguyên tỷ lệ ảnh và các pose. Chỉnh tiếp ở root prefab nếu muốn đổi cả cụm; Character_3 và bố trí ghế được giữ nguyên.

Character_4 được thêm ngày08/11/2026, root Scale **1.027879**, chiều cao meditation cùng ba mẫu cũ khoảng1.3372191 world units. Bố trí 12 ghế nêu trong các báo cáo lịch sử đã được thay bằng lưới25 ghế ở lượt này.

## Thêm nhân vật tiếp theo

1. Đặt bốn ảnh của nhân vật mới vào `Assets/Art/SectConcept02/Characters/Character_5/`: `meditation.png`, `fly.png`, `attack.png`, `celebrate.png`. Import Sprite(2D and UI), Single/FullRect, PPU100, Texture2D; căn pivot chân giống các mẫu hiện tại (`X=.5,Y=.04` cho canvas1254×1254).
2. Trong `Assets/SectConcept02/Prefabs/`, chọn một prefab nhân vật hiện có, **Ctrl+D**, đổi tên `Character_5`. Mở prefab mới, chọn **Body → CharacterPoseController**: gán Meditation cho Idle Stand/Meditate/Back Three Quarter/Meditate Three Quarter; gán Fly/Attack/Celebrate đúng ảnh tương ứng. Gán SpriteRenderer.Sprite là meditation để có hình preview. Giữ shadow/aura/Canvas nameplate kế thừa.
3. Chỉnh Body Scale nếu chỉ đổi kích thước hình, hoặc root prefab Scale nếu đổi cả hình/tên/aura. Ctrl+S.
4. Mở `SectScene_Concept02`, chọn **04_Characters → CharacterManager → Character Variants**, bấm **+** hoặc tăng Size lên5, kéo `Character_5.prefab` vào ô **Element4**. Giữ các ô trước đó, không gán trùng prefab.
5. **Ctrl+S scene**, chạy Play lại. Danh sách tự dùng đủ các mẫu; không cần sửa C#. Các nhân vật tiếp theo thêm tương tự. Thực hiện ngoài Play Mode để lưu được lâu dài.

Header/NoticePanel dùng chữ TMP độc lập. `Concept02Hud` chỉ đọc snapshot; đồng hồ định dạng RemainingMs server, không tự đếm hoặc tính chu kỳ. Chưa có snapshot thì hiện `--:--` và trạng thái chờ. Beam vàng hiện trong Edit Mode làm tham chiếu concept; Play chỉ bật khi snapshot có độ kiếp thật.

**Thiên Đạo Thông Cáo:** TOP3 của toàn bộ người chơi server, kể cả những người không nằm trong pool hiển thị. Thứ tự giảm dần: cảnh giới → tiểu cảnh giới → tu vi; bằng nhau dùng userId tăng dần để ổn định. Mỗi hàng hiện tên/cảnh giới/tiểu cảnh giới và một vùng UV riêng của `ui_rank_icons.png` (vàng/bạc/đồng). Không phải TOP sát thương, không phát thưởng. Thiếu người thì hàng còn lại để trống; disconnect trở về chờ.

**Nguyên lực:** Node tính cấp/tiến độ từ tim đã chống trùng; snapshot thêm `interactions.sectEnergy = {level,power,threshold,maxLevel,full}`. Cấp1 cần1.000 tim để lên2; cấp2 cần thêm3.000 để lên3; cấp3 thêm5.000 để đầy MAX (tổng9.000). Tim dư chuyển tiếp, MAX giữ5.000/5.000; không có cấp4. Unity chỉ lấy tỉ lệ `power/threshold` để crop chiều ngang/UV fill, không tính lại lên cấp. `Header/EnergyFill` dùng `ui_progress_fill.png`, nằm trên ProgressFrame vì PNG khung có tâm tối đục; neo trái cố định và nằm trong viền. Tiến độ lưu riêng DEMO/LIVE, tiếp tục qua restart; dữ liệu cũ thiếu trường mới khởi đầu cấp1/0, không xóa dữ liệu cũ. Theo bổ sung Ban Phúc, mỗi lần lên cấp cộng30 giây buff x2; điểm nhiệm vụ/cooldown từ mốc tim cộng đồng giữ nguyên. Chưa có dữ liệu thì fill ẩn và hiện `-- / -- TIM`.

**Ban Phúc:** bảng ngay dưới Thiên Đạo Thông Cáo, mặc định ẩn, nhận `interactions.blessing` từ Node. Quà ánh xạ vật phẩm Ban Phúc hoặc lên cấp tông môn kích hoạt30 giây; kích hoạt lại cộng30 giây vào thời gian, giữ x2. Hết hiệu lực/mất kết nối thì ẩn; battle/pause/stopped giữ nguyên đồng hồ theo server. Tám PNG nằm trong `Assets/Art/SectConcept02/UI/Blessing/`, chữ/đồng hồ bằng TMP. Hướng dẫn bố cục, thử DEMO và cơ chế tại [UNITY_BANPHUC.md](UNITY_BANPHUC.md).

**Mây và sét độ kiếp:** `StormFX/StormCloud` dùng `fx_cloud_storm.png`; bốn SpriteRenderer Lightning_01…04 dùng đúng bốn PNG `fx_lightning_01.png` đến `fx_lightning_04.png`. Từng ảnh được căn cùng chân/chiều cao nội dung, giữ tỷ lệ đồng đều do canvas nguồn khác nhau; chỉnh vị trí/scale trong scene bằng Transform. Các object là con của ghế đài, đi theo khi chỉnh ghế; không reset Transform mỗi frame. `TribulationFX → TribulationController` gán Storm Cloud và danh sách Lightning Frames theo thứ tự01…04. Không sửa prefab procedural dùng chung, các scene cũ vẫn dùng hiệu ứng cũ.

Mây chỉ bật khi snapshot có độ kiếp đang diễn ra. Mỗi đợt sét theo lịch server hiện hữu (duration/count, bắt đầu1800ms, cửa sổ180ms) dùng bốn frame,45ms/frame; không tự sinh thêm đợt. Giữa các đợt tắt sét và giữ mây. Pause giữ đúng thời điểm server; reconnect lấy đúng frame hiện tại. Kết quả thành/bại, battle và disconnect tắt mây/sét; thành bại vẫn hoàn toàn do Node. Không có đồng hồ hiệu ứng tự chạy hoặc tính sát thương ở Unity. Nếu thiếu renderer trong bộ bốn frame thì dùng sét procedural dự phòng.

Vùng mây/sét đã nâng thêm **0.3 world units (30px ở1080×1920)** bằng `05_Tribulation/Breakthrough seat/StormFX → Transform → Position Y=0.3`. Chỉnh parent này để di chuyển mây và cả bốn frame cùng nhau; ghế đài/beam/các child giữ nguyên.

Sau khi cập nhật trường nguyên lực cần **khởi động lại server Node** rồi Play Unity. Các thay đổi ảnh mây/sét chỉ cần Unity import và mở lại scene đã lưu ngoài Play Mode. Halo xanh dựng đứng không có ảnh riêng nên bỏ qua theo `docs/UNITY.md`. Thác hiện là PNG tĩnh; mây nền, hạt, cánh hoa, pháp trận có chuyển động nhẹ theo SectLayer hiện hữu.

Menu **Tu Tien LIVE → Concept 02 → Open or create new scene** chỉ tạo khi chưa tồn tại. Nếu scene đã có thì mở/verify, không rebuild hoặc ghi lại bố cục. Menu Verify kiểm reference. Không chạy setup lúc Play. Khi tạo mới, từ chối nếu scene đang sửa chưa lưu.

Kiểm thử Ban Phúc mới nhất: **55/55 Unity PASS** (10 trường hợp mới +45 bài trước), có ba bài Enter/ExitPlayMode thực. Node regression **103 PASS/0 FAIL/1 SKIP**, gồm7 bài mới về thời gian, quà/lên cấp, save/API/WS và DEMO/LIVE. Xuất11 ảnh GPU ở1080×1920/720×1280, đã xem các trạng thái chính30s/15s/50s/lên cấp/pause/battle/hết hạn.222 file dữ liệu/scene Main/prefab/ảnh và meta cũ/public JS/package/settings giữ hash. Evidence tại `docs/unity-blessing/`, ảnh `active-30-1080x1920.png` và `stacked-50-720x1280.png`. Windows build/executable, OBS, LIVE thật và FPS cho lượt này **CHƯA KIỂM CHỨNG**.

Kiểm thử fill/mây/sét ở lượt trước: **45/45 Unity PASS** (7 bài mới +38 bài trước), có hai bài Enter/ExitPlayMode thực. Node regression **96 PASS/0 FAIL/1 SKIP**. Evidence tại `docs/unity-storm/`.238 file data/Main/prefab/artwork nguồn/meta/backend/package/settings giữ hash. Nhóm27 CharacterTests cũ bị **FAIL thiết lập** do thiếu `SectScene_Editable.unity` trong repository; tương thích controller procedural đã được kiểm tra trực tiếp trên prefab trong suite45. Không nhận toàn bộ suite Unity đã chạy hoặc các giới hạn còn lại đã được kiểm chứng.

Kiểm thử TOP3/nguyên lực ở lượt trước: **38/38 Unity PASS**, gồm7 trường hợp HUD,3 variants,4 Concept02 và24 protocol; có Enter/ExitPlayMode thực với snapshot ghi sẵn. Node regression **95 PASS/0 FAIL/1 SKIP**, bài API/WebSocket/save/restart mới chạy riêng **1/1 PASS**. Evidence tại `docs/unity-sect-hud/`.52 file Main/dữ liệu/prefab/artwork nguồn giữ hash; mọi document scene ngoài UI giữ nguyên trong lượt đó.

Kiểm thử chọn ngẫu nhiên ở lượt trước: **31/31 Unity PASS** (3 bài variants +4 bài Concept02/Play Mode +24 protocol), evidence tại `docs/unity-character-variants/`. Kiểm tra đủ3 mẫu, giữ ngoại hình/instance qua snapshot và pool/reconnect, fallback và append mẫu thứ4. Play Mode dùng snapshot ghi sẵn; prefab/tỉ lệ người dùng đã chỉnh giữ nguyên.

Lần dựng scene ban đầu đã kiểm tra Node **91 PASS/0 FAIL/1 SKIP**, render GPU1080×1920/720×1280 và ba mẫu nhân vật; build Windows **Succeeded,0 error/0 warning**;533 file và39 PNG giữ hash. Đây là evidence lịch sử tại `docs/unity-concept02/`, không thay kết quả kiểm thử cho mã mới. Kết quả và giới hạn từng lượt ghi trong `PROGRESS.md`. Các thử nghiệm chạy trên bản sao `test-results/unity-concept02/project`, không đóng Editor người dùng.

Lệnh hỗ trợ tại gốc repository:

```powershell
node scripts/unity-concept02-assets.js # Sao chép/audit các ảnh đã có, không sửa ảnh nguồn
node scripts/unity-concept02-sync.js   # Chuyển đúng scene/tài nguyên mới từ validation, có guard
```

Các entry point Editor phục vụ validation: `Concept02SceneSetup.Create`, `Concept02Verification.Capture`, `Concept02Verification.BuildWindows`, namespace `TuTienLive.Editor`. Dùng `-projectPath` trỏ bản sao validation; Capture cần GPU, không truyền `-nographics`. Sync không chuyển ProjectSettings/Packages hoặc scene cũ. Nếu scene mới đã tồn tại thì Create chỉ mở/verify; nếu thiếu scene nhưng resource đã tồn tại thì từ chối ghi đè để bảo vệ các chỉnh sửa.
# TB02 — cảnh báo boss được chọn, 09/11/2026

Người dùng chọn **TB02 Huyết Báo / warning-TB02**. UI `TB02_BossWarning` dùng khung/ấn cảnh báo tạo bằng code, font hiện hữu và số đếm từ snapshot Node. Bốn WAV được chuyển vào `Assets/Musics/SFX/Boss/`: warning-TB02, attack-normal, attack-skill1, attack-skill2; bốn slot clip bổ sung trên GameAudioManager, giữ nhạc/âm thanh và cài đặt cũ. Boss/sát thương/thời gian trận do Node quyết định; báo cáo và cách mở tại `docs/Tailieu_output/boss-notice-designs/implemented/README.md`.

---
# Camera mục9 — lựa chọn mới,09/11/2026

**Điều chỉnh tiếp theo đã triển khai:** zoom random giữ5 giây, pan20 giây, cộng0,8 giây vào/0,8 giây về (tổng6,6/21,6 giây); follow tổng8 giây và chờ15 giây. Mây độ kiếp chỉ hiện lúc tới đài1,5 giây; sét bắt đầu sau0,3 giây và lặp2/3 giây/vòng bằng bốn PNG, tương đương40 frame tham chiếu60 FPS. Hướng dẫn/kết quả/ảnh mới tại `docs/Tailieu_output/storm-camera-timing/README.md`. Mô tả mỗi lượt8 giây bên dưới là trước điều chỉnh này.

Theo xác nhận, camera rảnh15 giây mới chọn zoom/pan/follow độ kiếp đủ điều kiện trong8 giây rồi trả toàn cảnh. Ưu tiên quà cá nhân → nhập môn → random; quà chuyển thẳng mượt, không bắt buộc về gốc. Người mới bay3 giây, nhiều người bay đồng thời/camera theo người mới nhất; boss giữ sự kiện chờ tới tu luyện. Ban Phúc toàn tông giữ camera, popup do donate thêm tên/avatar. Tài liệu/ảnh/kết quả tại `docs/Tailieu_output/camera9/README.md`; mô tả camera30 giây/theo độ kiếp tự động trước đây là lịch sử.

---
