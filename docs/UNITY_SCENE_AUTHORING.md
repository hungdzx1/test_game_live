# Unity — chỉnh bố cục bằng Scene, Prefab và Inspector

Scene sử dụng từ lần refactor này: **unity-client/Assets/Scenes/SectScene_Editable.unity**.

Scene `SectScene.unity` và hai prefab trong `Assets/Resources/` giữ nguyên byte để bảo toàn bản cũ. Không mở scene legacy để chỉnh bố cục mới: scene mới có marker sceneAuthored, mesh đã bake và các hệ thống được serialize sẵn. Scene mới được thêm đầu Build Settings, các scene cũ vẫn giữ trong danh sách. Không có rebuild/factory lúc Play.

## Sử dụng hằng ngày

1. Unity Hub → mở `unity-client/`, dùng Unity6000.5.9f1; chờ package/import/compile. Mở **Assets/Scenes/SectScene_Editable.unity**.
2. Chọn **Temple** dưới **02_Architecture**; dùng **W/E/R** hoặc sửa **Transform Position/Rotation/Scale** trong Inspector. Ctrl+S để lưu. Không nhập Position Pixels; các field legacy đã ẩn và không quyết định bố cục scene mới.
3. Chỉnh **SectLayer → Opacity** cho độ trong suốt; chỉnh **MeshRenderer → Sorting Layer/Order in Layer** cho thứ tự vẽ. Script không gán lại sorting hoặc scale từ field legacy.
4. PNG đã có phối cảnh; giữ mặt phẳng XY, không ép sân nằm ngang như sàn3D. Source Sprite/Source Pixel Rect/Content Pixel Rect/Anchor là dữ liệu import của mesh đã bake, không phải công cụ bố trí. Không đổi các rect/anchor để di chuyển đối tượng; hãy dùng Transform.
5. Chọn **09_Camera/MainCamera** để chỉnh vị trí/rotation/orthographic size. CameraRig cộng drift vào pose hiện có. **Auto Fit Bounds** mở rộng view trong Play khi cần bảo vệ sân/đài; tắt nếu muốn khóa orthographic size hoàn toàn. Khung9:16/letterbox vẫn do CameraRig xử lý. Mặc định giữ góc nhìn orthographic2.5D; xoay góc lớn sẽ thay đổi cách nhìn sprite phẳng.
6. UI tĩnh còn dùng TextMesh để giữ hình ảnh cũ. Chỉnh font/character size/Transform trực tiếp; **SectTextLayout.autoFit=false** trong scene mới. Context menu **Fit text once to pixel bounds** chỉ thay scale khi người dùng yêu cầu.
7. Mở **Assets/SceneAuthoring/Prefabs/CharacterPrefab.prefab** để chỉnh nhân vật. Đây là **Prefab Variant**, kế thừa prefab gốc. Chỉnh Body Transform, Shadow, aura/FX và **Nameplate TMP** trong Prefab Mode; lưu prefab để áp dụng cho các nhân vật spawn sau đó.
8. Nameplate dùng TextMeshPro: chỉnh RectTransform, font size, alignment và Auto Size min/max trong Inspector. Runtime chỉ đổi nội dung tên/cảnh giới; không tự gán vị trí/scale nameplate. TextMesh cũ được giữ inactive trong variant để không phá prefab gốc.
9. Chỉnh **04_Characters/SpawnPoints/Seat_01…Seat_12** để đổi ghế. CharacterManager giữ reference trực tiếp tới từng ghế. Di chuyển riêng PNG sân không tự dời ghế; chọn thêm SpawnPoints khi muốn dời cả bố cục người chơi.
10. **05_Tribulation** chứa PNG đài, Breakthrough seat và TribulationFX. Di chuyển cả nhóm để dời đài, người độ kiếp và FX cùng nhau. Di chuyển riêng PNG đài cần căn lại Breakthrough seat. Các cloud/line dưới TribulationFX có Transform/renderer/điểm line chỉnh trực tiếp được và được lưu bằng prefab overrides.

Chạy Node bằng `npm start`, dùng dashboard **DEMO**, tạo người chơi và bắt đầu tu luyện; nhấn Play trong scene mới. Chưa có snapshot thì không tạo nhân vật giả. Endpoint nằm ở **08_Systems/NetworkClient → UnityWebSocketClient**, mặc định `ws://127.0.0.1:3000/ws`. Không cần gọi TikTok LIVE thật.

Chỉnh trong **Edit Mode** rồi Ctrl+S để lưu lâu dài. Unity thông thường không lưu các thay đổi làm trong Play Mode sau khi Stop; refactor này không thay quy tắc đó.

## Hierarchy bàn giao

```text
SectScene                         # SectSceneBindings, reference được serialize
├── 01_Environment                # Sky, clouds, mountains, waterfalls
├── 02_Architecture               # Temple, courtyard, front gate, props, placeholders
├── 03_Formation                  # Formation base, formation glow
├── 04_Characters                 # CharacterManager
│   ├── SpawnPoints               # 12 Seat_* có sẵn, không nhân đôi
│   └── CharacterPool             # Instance người chơi động nằm ở đây
├── 05_Tribulation
│   ├── Breakthrough platform     # PNG đài hiện có
│   └── Breakthrough seat
│       └── TribulationFX         # Instance prefab gốc, clouds/lightning serialized
├── 06_Effects                    # Mist, particles, petals
├── 07_UI                         # Header/footer/title/subtitle/sect name/RosterHUD
├── 08_Systems
│   ├── SceneController
│   ├── NetworkClient
│   └── CameraDirector
└── 09_Camera
    └── MainCamera                # Camera + CameraRig hiện có
```

Tái sử dụng18 layer PNG, camera,12 ghế, điểm đài và các placeholder từ scene gốc. Không tạo thêm temple/courtyard/platform/PNG renderer trùng. LocalGameState vẫn là model chỉ đọc bên trong protocol; không tạo GameObject giả để chứa một bản game state khác. Chưa tạo BossInfo/battle UI trong refactor này.

## Migration một lần

Menu **Tu Tien LIVE → Scene Authoring → 1 - Migrate SectScene (backup and safe copy)**:

- Từ chối chạy khi đang Play hoặc có scene chưa lưu; người dùng lưu các scene đang sửa trước khi chuyển scene.
- Khi chưa có scene mới: backup scene/prefab gốc cùng.meta vào `unity-client/SceneAuthoringBackups/<timestamp>/`, copy scene gốc sang `SectScene_Editable.unity`, nhóm lại GameObject và bake các quad mesh thành asset.
- Tạo variant nhân vật, font asset/settings và gán reference hệ thống trong Editor, sau đó save scene. Không ghi đè scene/prefab cũ.
- Khi scene mới đã có SectSceneBindings: chỉ mở và verify, **không rebuild, không sắp xếp lại và không ghi lại file**. Các chỉnh sửa của người dùng được giữ. Test gọi lại hai lần xác nhận số object và bytes scene không đổi.
- Prefab variant/mesh asset đã có được tái sử dụng; không tạo bản trùng. Không dùng menu legacy Rebuild; chức năng xóa/rebuild cũ đã bị khóa.

Menu **2 - Verify saved references** kiểm tra các reference bắt buộc, seven sprite poses, TMP font, pool/seats, network/HUD/ritual,9 nhóm, mesh/material và missing scripts. Backup đầu phiên cũng có trong `docs/unity-scene-authoring/backup/`; bản gốc ở Assets vẫn nguyên vẹn.

Hai menu cũ SectSceneSetup.Create/CharacterSceneSetup.Create chuyển sang migration an toàn khi asset gốc đã có. Các factory cũ chỉ phục vụ khởi tạo legacy khi asset gốc chưa tồn tại, không được gọi tự động trong Play. SectCharacterBootstrap.Install chỉ còn lookup tương thích cho probe cũ; không new GameObject, Resources.Load hay Instantiate hệ thống nữa.

## Phần vẫn cần code

| Phần | Lý do và cách giữ bố cục |
|---|---|
| WebSocket/LocalGameState/StateMapper | Nhận dữ liệu Node, xử lý session/sequence/reconnect; không đổi logic hoặc hợp đồng |
| CharacterManager/pool | Người chơi LIVE/DEMO thay đổi lúc chạy; instantiate prefab khi cần, spawn theo Seat reference, không dựng500 người trong scene tĩnh |
| CharacterPoseController/RealmAura/FX | Chọn pose/màu theo backend, breathing/bob/lean/vòng hiệu ứng cộng vào Transform gốc; không gán lại scale.125/rotation0/vị trí0 mỗi frame |
| TribulationController | Đọc timing/lightningCount/outcome từ backend; animation bay/visibility/sét còn chạy bằng code; root FX đã đặt trong scene, không snap về tọa độ hardcode |
| SectLayer | Baked mesh ở asset; runtime chỉ quality/opacity và offset cloud/mist/petals/glow. Mode legacy chỉ còn để đọc scene gốc |
| CameraRig | Letterbox9:16, drift cộng vào pose, auto-fit tùy chọn; không ép camera về(0,0,-20) trong scene mới |
| Dynamic text | Gán nội dung từ snapshot; TMP tự căn chữ theo thông số component, không sửa Transform bằng CharacterView |

`TransformOffset` là cache không serialize của phần animation: đọc Transform đã lưu khi enable, cộng offset và nhận diện thay đổi trực tiếp để rebase; restore phần offset khi disable. SceneController không chạy animation preview tự động trong Edit Mode. Các thông số layout gốc vẫn là Transform do Unity lưu.

## TextMeshPro và tài nguyên

Thêm package **com.unity.ugui2.5.0**, đúng Unity6000.5; TMP nằm trong uGUI. Font LegacyRuntime built-in không cung cấp font face cho TMP FontEngine trong môi trường này. Vì vậy chỉ nameplate dùng **LiberationSans** và shader đi kèm **TMP Essential Resources** của SDK Unity đã cài, có OFL trong `Assets/SceneAuthoring/Fonts/`. Không tải artwork/font từ web hoặc Asset Store; không nhập ví dụ, sprite emoji hay thay bất kỳ PNG gốc nào. HUD tĩnh giữ font cũ. Có khác biệt raster chữ do chuyển TextMesh→TMP; bố cục và màu các PNG giữ nguyên.

Nguồn API/package đối chiếu: [uGUI cho Unity6000.5](https://docs.unity.com/en-us/engine/6000.5/manual/packages-list/packages-all/pack-core/com-unity-ugui), [TMP FontAsset API](https://docs.unity.cn/Packages/com.unity.textmeshpro%403.0.6/api/TMPro.TMP_FontAsset.html). Chỉ dùng font/shader có sẵn trong gói SDK để có thể build độc lập máy, không phụ thuộc font OS.

## Kiểm chứng

Evidence: `docs/unity-scene-authoring/` và kết quả tổng hợp ở PROGRESS.md.

- npm baseline và sau sửa:91 PASS/0 FAIL/1 SKIP. SKIP là LIVE thật.
- Unity EditMode:68/68 PASS, gồm test cũ và5 test authoring mới. Kiểm tra native Transform/opacity/sorting/text qua sampling/save/reopen, prefab offsets, camera, reference và idempotence.
- Editor Play Mode: scene thử có Temple bị dời/xoay/scale và title đổi scale trước khi save; các giá trị giữ đúng khi Play, nhận snapshot/event/ritual, Node stop/restart, roster50→51; tối đa10 visual/10 instance đã tạo,0 lỗi script runtime.
- Windows x64 Mono development build: Succeeded,0 warning/0 error. Executable thật dùng Direct3D11 kiểm tra cùng kịch bản và custom layout. Đây là build kiểm thử của **scene copy có chỉnh sửa cố ý**, không phải scene production bị sửa.
-12 ảnh GPU ở1080×1920 và720×1280; so sánh threshold RGB>2/255. Khoảng0.55–0.83% pixel toàn ảnh đổi do nameplate TMP; ngoài vùng nameplate+18px đệm có0–1 pixel đổi/ảnh. Đây là đo ảnh, không phải FPS hoặc benchmark GPU.
- Scene/prefab gốc, PNG, backend, data, protocol giữ hash. ProjectAuditorSettings.asset đã có thay đổi trước phiên và không bị tác động.

Lệnh kiểm thử ở repository root:

```powershell
npm.cmd test
node scripts/unity-authoring-smoke.js
node scripts/unity-authoring-smoke.js --player
node scripts/unity-authoring-compare.js
```

Smoke dùng bản sao `test-results/unity-stage03/validation-project`, dataRoot tạm và connector cấm LIVE; cần chạy migration/import trước trong bản sao đó. Editor menu **3** phục vụ driver Play tự động có `--authoring-report`; menu **4** build Windows validation player vào `Builds/SceneAuthoring/`. Build sử dụng một scene test copy với QA probe opt-in. Build sản phẩm bình thường bằng Build Profiles với `SectScene_Editable` đứng đầu, không dùng scene test copy. Không copy Library/Builds/cache sang Git.

**Chưa kiểm chứng:** LTS/IL2CPP/target ngoài Windows, OBS, ngâm tải/FPS/GPU residency, thao tác kéo chuột trực tiếp trên Editor người dùng. Lỗi UnityEditor.Search.SearchDatabase startup đã ghi từ các bước trước vẫn còn trong log Editor; không có stack runtime mới và không xóa cache để che lỗi. Font không hỗ trợ mọi emoji/ký tự của mọi ngôn ngữ; chưa nghiệm thu glyph ngoài bộ chữ của test. Sân/props có lỗi cắt trong PNG gốc và placeholder của bước03 vẫn giữ nguyên.

Không sửa TikTok LIVE/gameplay/backend, không commit/push tự động.
