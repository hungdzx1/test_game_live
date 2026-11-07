# Unity 04 — Nhân vật và độ kiếp

**Bàn giao bước04 dưới đây là lịch sử. Sau refactor Scene Authoring, dùng SectScene_Editable.unity và prefab variant trong Assets/SceneAuthoring. Hệ thống được serialize sẵn, bootstrap không còn tạo GameObject lúc Play. Hướng dẫn hiện tại: [UNITY_SCENE_AUTHORING.md](UNITY_SCENE_AUTHORING.md).**

Project: `unity-client/`, Unity **6000.5.9f1**, URP **17.5.0**. Chỉ lớp trình diễn; Node.js vẫn quyết định gameplay. Không thay backend, protocol, dữ liệu hoặc renderer Three.js. Không triển khai battle.

## Mở và chạy

1. Mở project `unity-client/` từ Unity Hub, chờ import/compile. Mở `Assets/Scenes/SectScene.unity`, Game View 9:16 (1080×1920 hoặc 720×1280).
2. Chạy Node bằng `npm start`, dùng dashboard ở chế độ **DEMO**, tạo người chơi và bắt đầu tu luyện. Không cần kết nối TikTok LIVE thật.
3. Nhấn Play trong Unity. Bootstrap tự thêm một root **Stage 04 — server driven characters** chỉ lúc chạy SectScene. Root chứa CharacterManager, CameraDirector, TribulationPrefab và client WS. Không ghi GameObject này vào scene; scene và các chỉnh sửa layout bước 03 được giữ nguyên byte.
4. Endpoint mặc định `ws://127.0.0.1:3000/ws`. Với cổng khác, dùng tham số khởi chạy `--ws-url ws://127.0.0.1:<port>/ws` hoặc sửa trường endpoint của client runtime để thử. NetworkTest bước 02 vẫn hoạt động độc lập. Khi chưa có snapshot, không tạo người chơi giả; HUD báo đang chờ máy chủ.
5. Trong dashboard DEMO, chọn người chơi và chuẩn bị độ kiếp. Unity nhận snapshot và trình diễn đúng người đó trên đài, những người khác vẫn ở sân. Ngắt Node rồi mở lại cùng cổng để kiểm tra reconnect.

Prefab thật: `Assets/Resources/CharacterPrefab.prefab`, `Assets/Resources/TribulationPrefab.prefab`. Chúng nằm trong Resources để bootstrap dùng được khi build mà không phải sửa scene đang chỉnh. Prefab dùng chung sprite/material, không clone texture theo người. Không chạy lại factory để ghi đè prefab đã chỉnh; factory từ chối khi prefab tồn tại.

## File và luồng dữ liệu

| File | Vai trò |
|---|---|
| Scripts/Characters/CharacterManager.cs | Roster theo userId; subscribe protocol đã có; nhận snapshot/event trên main thread; pool có giới hạn; refresh tên/realm/pose; clear khi session đổi |
| Scripts/Characters/CharacterView.cs | Sprite pose, nameplate hai dòng, aura, shadow và một hiệu ứng vòng có thời hạn; reset khi vào pool |
| Scripts/Characters/CharacterPoseController.cs | Chọn một trong bảy pose đơn; scale đồng đều, bob/lean nhỏ; không dựng frame giả |
| Scripts/Characters/RealmAuraController.cs | 11 màu từ realmAura.js, số vòng/độ dày theo realmIndex; không tính hay thay realm |
| Scripts/Effects/TribulationController.cs | Timeline bay/thiền/sét/kết quả từ breakthrough và breakthroughResult |
| Scripts/Scenes/CameraDirector.cs | Ưu tiên ritual > sự kiện quan trọng > server follow; giữ overview an toàn, không mở profile card |
| Scripts/Scenes/SectCharacterBootstrap.cs | Chỉ cài root runtime cho SectScene; tìm lại 12 Seat_* và Breakthrough seat hiện có; không nhân đôi manager |
| Scripts/UI/CharacterRosterHud.cs | Tổng số từ snapshot và số đang hiện; trạng thái chờ khi mất đồng bộ |
| Editor/CharacterSceneSetup.cs | Import lossless, custom pivot, tạo một lần hai prefab/material và disk procedural |
| Editor/CharacterScreenshotTest.cs | Render URP thực, kiểm sprite không null/không rỗng và bounds trong camera |
| Editor/CharacterPlayProbe.cs | Smoke Play Mode opt-in; ghi kết quả nhận roster, sự kiện, ritual, reconnect trên Node tạm |
| Tests/Editor/CharacterTests.cs | Spawn/pool/reconnect, 11 pose mapping, import, pause, outcome, focus, return, duplicate, quality |
| scripts/unity-character-fixtures.js | Gọi engine thật với người chơi giả trong bộ nhớ, xuất schema thực, không sửa save |
| scripts/unity-character-smoke.js | Node DEMO/data tạm, Unity Play Mode, ngắt/mở lại Node và kiểm web routes |
| scripts/unity-character-sync.js | Chỉ chuyển tài nguyên mới từ validation, ánh xạ GUID chính, từ chối ghi đè prefab đã chỉnh |

ProtocolSession/StateMapper/LocalGameState/UnityWebSocketClient không thay đổi. Renderer chỉ đọc immutable snapshot; không RPC, không tính lại tu vi, sát thương, quà, phần thưởng hoặc xác suất.

## Import và điểm neo

Nguồn `public/assets/Characters/Character_1/` giữ nguyên; bảy bản sao trong `Assets/Art/Characters/Character_1/` byte-identical. Tất cả 1254×1254 RGBA; không có pixel alpha≥32 chạm bốn cạnh. Có viền màu/các pixel alpha rời ở một số ảnh, đặc biệt phần áo/chân của pose ngồi; giữ nguyên, không khử nền, vẽ lại hay sharpen. Bbox alpha không phải bằng chứng đăng ký giải phẫu hoàn hảo giữa các hình vẽ khác pose.

Import Sprite Single/Full Rect, PPU=100, sRGB, Alpha From Input/Transparency, Bilinear/Clamp, không mipmap/NPOT resize/compression; max2048 nên ảnh1254 không bị downscale. Cùng sourceScale=.125, chỉ scale đồng đều toàn hình, không thay tỉ lệ X/Y hoặc tint da/trang phục. Bảy ảnh cùng trục torso X=627; pivot Y căn đáy silhouette alpha≥32. Không dùng đáy toàn canvas (mỗi pose có padding khác nhau).

| Sprite | Đáy alpha≥32, Y từ trên xuống | Pivot pixel từ dưới trái |
|---|---:|---|
| idle_stand | 1241 | (627,13) |
| fly | 1193 | (627,61) |
| attack | 1234 | (627,20) |
| meditate | 1195 | (627,59) |
| celebrate | 1244 | (627,10) |
| back_3quarter | 1213 | (627,41) |
| meditate_3quarter | 1206 | (627,48) |

Đây là neo tiếp xúc theo silhouette và trục chung, không sửa nội dung PNG để ép đầu/chân mọi pose giống nhau. Tư thế ngồi/đứng vẫn có khác biệt tự nhiên trong ảnh gốc. Renderer PNG luôn Color.white; màu chỉ nằm ở aura/FX riêng. Shadow/mây dùng disk mềm tạo bằng code; không có asset tải ngoài.

Sprite material dùng shader Sprite-Unlit có sẵn của URP để xử lý màu SpriteRenderer đúng; aura/sét LineRenderer dùng SectUnlit đã có. Không thêm package. API custom pivot đối chiếu [TextureImporterSettings của Unity](https://docs.unity.com/en-us/engine/6000.0/script-reference/unityeditor/textureimportersettings/spritealignment).

## Mapping pose và fallback

| Backend animation | Sprite | Cách thể hiện / giới hạn |
|---|---|---|
| idle | idle_stand | Thở bằng scale đồng đều ±0.2% |
| walk / run | idle_stand | Fallback đứng; chưa có sprite bước chân, không bịa walk cycle |
| meditate | meditate; hàng sau dùng back_3quarter | Hai pose ngồi gốc; meditate_3quarter cũng được import và chọn trực tiếp được |
| standUp | idle_stand | Fallback đổi sang pose đứng tại cùng neo, chưa có frame đứng dậy |
| attack | attack | Pose đơn, không bắn projectile hoặc tính damage |
| teleport | idle_stand | Vòng dịch chuyển độc lập, không sửa dữ liệu vị trí server |
| celebrate | celebrate | Pose đơn và vòng chiến thắng khi có event tương ứng |
| cast | meditate | Fallback ngồi thiền trên đài; hiệu ứng sét là lớp riêng |
| fly | fly | Bob rất nhẹ và đường bay root; giữ aspect ratio |
| bow | idle_stand | Lean toàn sprite tối đa3°, chưa có pose cúi riêng |
| hit / defeated | idle_stand | Fallback nghiêng/rung nhẹ cho hit; chưa có pose bị thương/ngã |
| không biết / thiếu | idle_stand | Fallback an toàn |

Không Animator nhiều frame vì PNG không phải spritesheet. Những fallback trên không được coi là có animation vẽ tay đầy đủ. Hiệu ứng appearance/gift/stage up/teleport/victory hiện dùng một vòng procedural có màu/thời hạn theo loại, chưa phải hiệu ứng riêng phức tạp.

## Roster, pooling và sân

12 Seat_* của bước03 tương ứng 12 vị trí nổi bật như quy tắc sectLayout.js; đây là tọa độ trình diễn 2.5D, không ghi đè X/Z backend. Giữ thứ tự danh sách snapshot (Map backend), người ngoài nhóm hiện vẫn giữ đầy đủ trong LocalGameState. Không clone người lên cả sân và đài. Người được follow ở ngoài nhóm thay người tại ghế modulo12; ritual được ưu tiên cuối cùng nếu tranh slot.

- Low: tối đa6 visual.
- Medium: tối đa10 visual; khi500 người giảm còn8.
- High: tối đa12 visual khi dưới100 người,10 khi100–499 và8 khi500.
- Người còn lại không render, vẫn nhận state đầy đủ; HUD ghi tổng/đang hiện. Không xoay vòng ngẫu nhiên làm ghế nhấp nháy.
- Release chỉ tắt/reset và trả về pool; reconnect cùng hoặc khác session tái sử dụng. Không Instantiate/Destroy trong vòng Sample mỗi frame. Pool lớn nhất bằng mức hiển thị đã từng cần trong scene, tối đa12; scene unload tự hủy children.

Chỉnh `CharacterPrefab` để đổi sourceScale, renderer/sorting/material/nameplate/FX. Để đổi chỗ ngồi, sửa Seat_01…Seat_12 và Breakthrough seat trong SectScene ở Edit Mode rồi lưu. Các điểm này độc lập với PNG kiến trúc: nếu di chuyển đài thì căn lại Breakthrough seat tương ứng. Chỉnh Temple và các PNG bằng W/Position Pixels như hướng dẫn bước03.

## Độ kiếp và camera

Active publicState **không có outcome/roll/probability**. Chỉ dùng id/userId/realmIndex/elapsedMs/durationMs/lightningCount. Bay: 0–300ms đứng dậy fallback;300–1500ms bay ease với độ cong nhẹ; sau1500ms cast/meditate trên đài. Lightning giữ công thức tham chiếu breakthroughScene.js: bắt đầu1800ms, interval=(durationMs−2500)/lightningCount, mỗi flash180ms. Không tự thêm số lần sét theo cảnh giới.

Snapshot tiếp theo sửa lại timeline; khi chạy chỉ nội suy tối đa250ms từ lần nhận gần nhất, nhân demoSpeed nhận từ server. Pause/stopped giữ nguyên elapsed và dừng tween. Reconnect giữa nghi thức nhảy thẳng đến thời gian snapshot hiện tại, không replay toàn bộ sét đã qua. Chỉ breakthroughResult.outcome=true/false mới chọn celebrate/hit; outcome thiếu không được coi là thất bại. Sau khi result biến mất, bay về ghế trong.8s nếu visual vẫn được chọn.

Mây tối và sét là tài nguyên cache, không Instantiate mỗi strike; nhân vật trên sân vẫn render. Khi effectivePhase=battle, trả sect visual về pool và tắt ritualFX, không dựng battle trong bước này. Trở lại cultivation nhận roster đầy đủ. Hàng chờ và thứ tự nghi thức hoàn toàn ở backend.

CameraDirector chọn subject ưu tiên và ảnh hưởng nhóm người hiện, **chưa pan/zoom theo subject**. Giữ CameraRig bước03 và full frame9:16 để không cắt sân/đài/HUD; không camera shake/jump và không profile card tự mở. Đây là lựa chọn overview an toàn, không tuyên bố đã có camera cinematic.

## Kiểm chứng và giới hạn

Xem kết quả cuối tại PROGRESS.md và `docs/unity-stage04/`: baseline/final npm, Unity XML, audit JSON, Play report và ảnh GPU. `cpuParseSyncMs` trong ảnh chỉ là CPU parse+sync một lần (có cold start), không phải FPS/GPU frame time. Unity EditMode, fixture replay GPU và smoke Play Mode là các loại bằng chứng riêng; số chính xác trong XML cuối được ưu tiên.

Chưa kiểm chứng Windows Player/IL2CPP mới, OBS, ngâm tải/FPS thực, GPU residency, LIVE thật hoặc thao tác kéo prefab/scene bằng chuột trong Editor của người dùng. Lỗi UnityEditor.Search.SearchDatabase startup từ các bước trước vẫn cần phân biệt với runtime script; không xóa cache để che lỗi. Sân/props còn lỗi cắt nguồn và placeholder đã ghi ở bước03. Bộ ảnh chỉ có một nhân vật, không tự tuyên bố có đa dạng mặt/tóc/trang phục.

Không commit/push hoặc chuyển bước tiếp theo.
