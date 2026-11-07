# Scene Concept 02

Scene mới: `unity-client/Assets/Scenes/SectScene_Concept02.unity`, tạo từ bản sao `SectScene_Main.unity`. Dùng Unity **6000.5.9f1 / URP 17.5.0** hiện có. Không thay scene chính hay thứ tự Build Settings.

Mở scene mới, đặt Game View **9:16**, 1080×1920 hoặc 720×1280. Chỉnh từng lớp bằng W/E/R, Transform và MeshRenderer; Ctrl+S trong Edit Mode. Camera orthographic size 9.6, khung cố định; tắt auto-fit/drift riêng cho scene này để sân luôn tràn viền. Không ép ảnh sân đã có phối cảnh thành sàn nằm ngang 3D.

## Tài nguyên

Sao chép **39 PNG** từ `public/assets/02/`, giữ nguyên byte nguồn, không di chuyển/xóa ảnh. Đường dẫn người dùng gọi `public/asset/02` được xác định là thư mục thực tế `public/assets/02`. Concept `concept/1.jpg` chỉ làm tham chiếu, không dùng làm background ghép sẵn.

```text
Assets/
  Art/SectConcept02/
    Background/             # Trời, núi xa/trung, mây xa/gần
    Architecture/           # Đài, sân, thác, cành đào
    Effects/                # Pháp trận, tia sáng, hạt, hoa, mây sét/4 PNG sét
    Characters/Character_1…3/ # 4 pose mỗi bộ
    UI/                     # Khung, icon, thanh tiến trình, rank
    asset-audit.json         # Hash, alpha bounds, đường dẫn nguồn/Unity
  SectConcept02/
    Materials/              # Material PNG độc lập với scene cũ
    Meshes/                 # 15 quad đã bake, UV giữ viền alpha mềm
    Prefabs/Character_1…3.prefab
  Scenes/SectScene_Concept02.unity
```

Tên file `ui_cultivation_icon.png.png` chỉ được chuẩn hóa thành `ui_cultivation_icon.png` trong bản sao Unity. PNG không bị crop/chỉnh màu. Mesh môi trường giữ toàn bộ alpha mềm với đệm3px; UI dùng UV quanh alpha≥32 với đệm8px để bỏ các pixel alpha rất thấp nằm xa nội dung. Header atlas được tách thành ba RawImage có UV riêng, không tạo ảnh mới. Import Sprite/Full Rect/Texture2D, PPU100, sRGB/alpha, Bilinear/Clamp, không mipmap/compression/NPOT resize, max4096. Character pivot neo chân chung. Các lớp môi trường bám canvas nguồn 941×1672, phóng đều về khung 1080×1920; giữ phối cảnh gốc. Beam và vòng vàng được căn riêng vào mặt đài, cánh hoa thu nhỏ/giảm opacity theo ảnh render.

## Hierarchy và sử dụng

- `01_Environment`: Sky, MountainFar, CloudFar, MountainMid, CloudNear.
- `02_Architecture`: Waterfalls, MainCourtyard, CourtyardTrim, CherryBranches.
- `03_Formation`: FormationGround.
- `04_Characters`: 12 SpawnPoints, CharacterPool và CharacterManager kế thừa.
- `05_Tribulation`: BreakthroughPlatform, FormationBreakthrough, BreakthroughBeam, ghế và TribulationFX kế thừa; `Breakthrough seat/StormFX` chứa StormCloud và Lightning_01…04.
- `06_Effects`: SpiritualParticles, Petals.
- `07_UI/UI_Canvas`: Header, NoticePanel, BlessingPanel, các TextMeshPro, Concept02Hud và BlessingPanelHud.
- `08_Systems`, `09_Camera`: hệ thống network/camera kế thừa từ Main.

Không dùng cổng, chùa, footer hoặc placeholder cành đào/cầu thang cũ trong scene mới. RosterHUD cũ inactive để giữ reference tương thích; NoticePanel hiện dành cho TOP3 cảnh giới.

Chạy Node như trước rồi Play để thấy người chơi thực từ DEMO/LIVE. Trong `04_Characters → CharacterManager → Character Variants` đã gán ba prefab `Character_1…3`. Mỗi người được chọn mẫu ngẫu nhiên có seed cố định từ server; không đổi mẫu khi nhận snapshot, quay lại ghế, độ kiếp hoặc reconnect với cùng danh sách. Pool tách theo prefab, giữ đúng sprite/tỉ lệ/nameplate đã chỉnh của từng mẫu. `Character Prefab` là fallback khi danh sách trống hoặc chỉ có ô None, để scene cũ tương thích. Thay đổi số lượng/thứ tự danh sách có thể đổi cách phân mẫu; không lưu ngoại hình vào dữ liệu backend.

Bốn pose là meditation/fly/attack/celebrate; idle, hit, rear và các pose chưa có dùng meditation. Đây là ảnh pose rời, không phải sprite sheet nhiều frame. Không tạo người chơi mẫu trong scene đã lưu.

Theo chỉnh sửa kích thước07/11/2026, root Scale của prefab Character_1 là **0.66719069**, Character_2 là **0.674967323**, Character_3 giữ **1.0354** đã được chỉnh sẵn. Đây là hệ số thu nhỏ đồng đều cả hình/tên/aura/bóng từ các chỉnh sửa child đã có; Body Scale không bị ghi lại. Ba mẫu được căn theo chiều cao nội dung alpha≥32 ở pose meditation của mẫu3 (khoảng1.3372191 world units), giữ nguyên tỷ lệ ảnh và các pose. Chỉnh tiếp ở root prefab nếu muốn đổi cả cụm; Character_3 và bố trí ghế được giữ nguyên.

## Thêm nhân vật thứ4 (hoặc nhiều hơn)

1. Đặt bốn ảnh của nhân vật mới vào `Assets/Art/SectConcept02/Characters/Character_4/`: `meditation.png`, `fly.png`, `attack.png`, `celebrate.png`. Import Sprite(2D and UI), Single/FullRect, PPU100, Texture2D; căn pivot chân giống ba mẫu hiện tại (`X=.5,Y=.04` cho canvas1254×1254).
2. Trong `Assets/SectConcept02/Prefabs/`, chọn một prefab nhân vật hiện có, **Ctrl+D**, đổi tên `Character_4`. Mở prefab mới, chọn **Body → CharacterPoseController**: gán Meditation cho Idle Stand/Meditate/Back Three Quarter/Meditate Three Quarter; gán Fly/Attack/Celebrate đúng ảnh tương ứng. Gán SpriteRenderer.Sprite là meditation để có hình preview. Giữ shadow/aura/Canvas nameplate kế thừa.
3. Chỉnh Body Scale nếu chỉ đổi kích thước hình, hoặc root prefab Scale nếu đổi cả hình/tên/aura. Ctrl+S.
4. Mở `SectScene_Concept02`, chọn **04_Characters → CharacterManager → Character Variants**, bấm **+** hoặc tăng Size lên4, kéo `Character_4.prefab` vào ô **Element3**. Giữ ba ô đầu là ba mẫu khác nhau, không để ô thứ4 trùng prefab cũ.
5. **Ctrl+S scene**, chạy Play lại. Danh sách tự dùng đủ bốn mẫu; không cần sửa C#. Nhân vật thứ5 trở đi thêm tương tự. Thực hiện ngoài Play Mode để lưu được lâu dài.

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
