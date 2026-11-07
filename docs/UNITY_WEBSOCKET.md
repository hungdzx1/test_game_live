# Unity 2.5D — Giai đoạn 02: WebSocket client

Giai đoạn này chỉ thêm client đọc trạng thái và scene debug. Node.js vẫn quyết định gameplay. Không sửa backend, protocol, config game, dữ liệu DEMO/LIVE, /song hoặc project Unity cũ. Không triển khai đồ họa/bước 03, commit hay push.

## Môi trường và lựa chọn

- Unity **6000.5.9f1**, URP **17.5.0**, Windows Editor và Windows x64 **Mono**. Đây không phải LTS; giới hạn phiên bản của giai đoạn 01 vẫn giữ.
- System.Net.WebSockets.ClientWebSocket native, không có application send/RPC API. Chỉ cho phép ws://127.0.0.1:<port>/ws; mặc định 3000, chỉnh Inspector hoặc --ws-url. Compile guard từ chối target khác Windows Editor/Standalone. Không suy diễn hỗ trợ WebGL/IL2CPP từ test Mono. [Giới hạn networking của Unity Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/networking) yêu cầu transport browser riêng.
- Thêm **com.unity.nuget.newtonsoft-json 3.2.2** chính thức. [Unity package documentation](https://docs.unity3d.com/Packages/com.unity.nuget.newtonsoft-json@3.2/manual/index.html) mô tả Json.NET 13.0.2 bên trong package. Dùng LINQ to JSON, không bật TypeNameHandling hay khởi tạo type từ $type. Thêm Test Framework **1.4.6** làm dependency trực tiếp để chạy tests; trước đó đã có bắc cầu từ URP. Không thêm package networking/Netcode.

## Luồng dữ liệu và quyền sở hữu

Node /ws → NativeWebSocketTransport (background Task, fragmented UTF-8) → bounded queue → UnityWebSocketClient.Update (main thread) → StateMapper → ProtocolSession → LocalGameState / EventDispatcher → NetworkDebugHud.

StateMapper đọc envelope v1, sessionId, seq, serverTime, payload. Kiểm kiểu, required identity, số hữu hạn, integer trong miền JSON an toàn, duplicate property/player ID, depth ≤64, object/array đúng dạng. Gói lỗi bị bỏ **trước** khi thay session/sequence. Field tùy chọn thiếu/null giữ dạng nullable hoặc collection rỗng; không tự dựng thông số gameplay. Field mới giữ trong JSON tree, đọc qua bản sao CopyField/CopyJson.

Model giữ JSON tree riêng, không public setter hoặc JObject gốc. Roster là IReadOnlyDictionary<string, PlayerState> với wrapper chỉ đọc; nested collection cũng chỉ đọc. Sửa bản sao JSON không đổi state. Epoch/sequence dùng long, seed uint, chỉ số/thời gian gameplay double; không ép thành float.

LocalGameState chỉ được protocol pump nội bộ thay thế; có kiểm tra owning thread. Presentation nhận Changed sau mỗi snapshot và đối chiếu toàn bộ roster theo **userId**, thêm/cập nhật/xóa theo bản mới. Hiện chưa có GameObject nhân vật: đồng bộ đầy đủ ở bước 02 là state và notification này, không tuyên bố đã port renderer.

EventDispatcher chỉ phát event đã lọc trên main thread. Event là thông báo trình diễn, không sửa HP/tu vi/vật phẩm hoặc trao lại thưởng. Subscribers tương lai cũng phải tuân thủ điều đó.

## Schema đối chiếu nguồn thật

| Nguồn Node | Model/field Unity | Điểm cần giữ |
|---|---|---|
| gameEngine.snapshot() và server envelope | Envelope, Snapshot | Session là transportId, khác gameplay session lưu; phase/effectivePhase khác khi pause/stopped; clock không tự tick phía Unity |
| Player spread + items.getEffectiveStats() | PlayerState | userId/name/seed, realmIndex/stageIndex, cultivation/cultivationRequired nullable, hp/atk/def, x/z/animation; inventory dictionary; buff/quest/pending/breakthrough riêng giữ nguyên JSON |
| breakthroughService.publicState() | BreakthroughState | id/userId/realmIndex/guaranteed/elapsedMs/durationMs/lightningCount; **không có roll/outcome/probability** của active ritual |
| breakthrough.lastResult | BreakthroughResult | outcome từ server, remainingMs và realmIndex; không dự đoán kết quả |
| battleService.snapshot() | BattleState, FieldSummary, BattleField | fields là 11 summary; chỉ view có participants/mobs/boss chi tiết; view/manualView nullable |
| Field participants / monsters | BattleParticipant, MonsterState | participants dictionary theo userId, cooldowns key 1/2; không tự tính damage/HP |
| GameEngine.event() và server commit | GameEvent | eventId/kind/userId nullable/timestamp + dữ liệu mở rộng theo kind, không sáng tác payload chung cho mọi event |
| config/interactions/battleResult/tiktok, trường chưa có typed getter | immutable JSON data | CopyField/CopyJson giữ dictionary động và unknown fields, không chuyển thành logic Unity |

Fixtures trong Assets/Tests/Fixtures được tạo bằng scripts/unity-network-fixtures.js: engine thật trong bộ nhớ, hai người chơi giả (Unicode và ID __proto__), RNG cố định cho fixture. Có stopped/cultivation/active ritual/completed/battle/paused battle/battle result và 12 event engine phát. provenance.json ghi nguồn/SHA-256; giữ ID/time như lần chạy thật, không đọc save người dùng. Tái xuất fixture sẽ thay ID/time.

## Session, replay và phục hồi

- Open kết nối mới: reset sequence theo tham chiếu web, xóa snapshot hiển thị, chờ snapshot đầy đủ. Cùng session giữ eventId history để không phát trùng sau reconnect.
- Đổi session hợp lệ: xóa snapshot, event history, last event/count và sequence. Nếu message đầu là event thì chờ snapshot; không phát FX lên scene cũ.
- Bỏ seq ≤ lastSeq; không đòi seq liên tục vì server có thể bỏ cosmetic event. Dedup eventId FIFO **200** entry như web.
- Mỗi connection có generation; callback socket cũ bị bỏ dù session giống nhau. Disable/Destroy hủy receive, Abort socket và dọn queue; không gửi application message.
- Backoff **500, 1000, 2000, 4000, 8000, 10000 ms**, cap 10s. Reset sau kết nối ổn định ≥10s để tránh vòng open/close nhanh; khác web ở điểm reset ổn định này.
- Connect timeout 5s; nhận đủ một message/fragment có deadline 10s; main-thread watchdog reconnect nếu thiếu snapshot hợp lệ trong 10s. Không lấy HTTP snapshot song song vì /ws đã gửi ngay committed snapshot khi connect và định kỳ 250ms.
- Message tối đa **4 MiB**; queue tối đa **256 message / 8 MiB** (ước tính storage UTF-16). Tràn queue: bỏ queue và reconnect/resync; không giữ backlog vô hạn. Update tối đa 32 entry và kiểm budget 4ms giữa các entry; một payload riêng có thể vượt budget.
- HUD ghi receivedAt - serverTime là **clock offset tại nhận**, có thể âm nếu đồng hồ lệch; không gọi là RTT. Queue age/snapshot age là số đo riêng.

**Không cần đổi server.** Native client không gửi Origin giả, Host/cổng đúng endpoint; server đã cho local native request thiếu Origin. /ws đóng 1008 khi nhận application message, Unity tuân thủ. Không nới CORS/Host/CSRF; không dùng /api/control từ Unity. Control HTTP trong smoke thuộc driver Node với dataRoot tạm.

## Phạm vi thay đổi

| Phạm vi | File |
|---|---|
| Runtime mới | Assets/Scripts/Network/{UnityWebSocketClient,NativeWebSocketTransport,ProtocolSession,StateMapper}.cs; Models/GameModels.cs; Presentation/LocalGameState.cs; UI/{NetworkDebugHud,NetworkTestProbe}.cs; runtime asmdef và .meta |
| Scene/tooling | Assets/Scenes/NetworkTest.unity; Assets/Editor/NetworkTestSetup.cs; Test-Network.ps1; build settings thêm NetworkTest, Windows Mono/runInBackground |
| Verify Bootstrap tương thích | MigrationProjectSetup.cs chấp nhận scene/runtime bước 02, vẫn kiểm camera/URP/Bootstrap nguyên trạng |
| Dependency/test | Packages/manifest.json, UPM lock, Assets/Tests/Editor, Fixtures, README thư mục liên quan và .meta |
| Node driver mới, không sửa server | scripts/unity-network-fixtures.js, unity-network-demo.js, unity-network-smoke.js |
| Tài liệu/bằng chứng | unity-client/README.md, docs/UNITY_WEBSOCKET.md, banner lịch sử UNITY_MIGRATION.md, docs/unity-stage02, PROGRESS.md |
| Giữ nguyên | Backend/services/package.json, dữ liệu/config game, Three.js/public, assets gốc, phases, project Unity cũ và thay đổi 07.0 chưa commit |

Hướng dẫn Hub/Inspector/lệnh test/build: [unity-client/README.md](../unity-client/README.md). Default scene debug không gọi API điều khiển, không tự chạy Node. NetworkTestProbe tắt nếu không có --network-report; chỉ smoke bật mới ghi thống kê tổng hợp và tự kết thúc sau thời lượng chỉ định. Không ghi raw state/người chơi vào report này.

## Kết quả và giới hạn

Kết quả cuối và evidence ở [PROGRESS.md](../PROGRESS.md), docs/unity-stage02. Log Editor đầy đủ giữ local trong test-results vì có thông tin licensing.

- Baseline npm: **92 bài, 91 PASS / 0 FAIL / 1 SKIP**. SKIP là LIVE thật.
- Unity EditMode: **24/24 PASS** ở cả lượt đầu và lượt cuối sau khi bổ sung nonfinite/undefined JSON và eviction 200 ID.
- Editor Play Mode thực nhận snapshot/event, nối lại Node, session đổi, roster 3 → 4, callback state/event main thread. Không suy diễn thành test GPU.
- Windows x64 Mono build và native smoke **PASS**: 116 snapshot, 33 event trong 30s, 0 callback ngoài main thread; session đổi, roster 3 → 4 sau restart. Đây là executable từ mã nguồn cuối, không dùng kết quả Editor thay Standalone.
- Npm sau sửa: **91 PASS / 0 FAIL / 1 SKIP**. Utility Bootstrap/URP cũ PASS; 203 file nguồn/data/assets có sẵn giữ nguyên SHA-256.
- Dashboard Chrome headless/profile mới/data tạm: 6 nhóm PASS, không runtime exception trong trang; connector LIVE trong bài này là stub.
- Gameplay live-smoke.js PASS trên data tạm: combo, kỹ năng, freeze, pending và reconnect DEMO. Smoke 500 người giai đoạn 01 từng FAIL timing; không coi đã giải quyết chỉ vì nhóm test khác PASS.

Lỗi đã sửa: test assembly ban đầu thiếu DLL reference Newtonsoft; đã sửa và compile/test lại. README mới từng mất dấu khi qua PowerShell native pipe; đã ghi lại UTF-8. Editor sandbox đầu không nối được licensing; đã dừng đúng tiến trình test và chạy lại với quyền cần thiết. Play probe ghi ArgumentOutOfRangeException trong **UnityEditor.Search.SearchDatabase** lúc index startup; không có stack runtime client, probe vẫn hoàn tất. Không sửa cache/package Editor hoặc che log; nguyên nhân lỗi index **chưa xác minh**.

**CHƯA KIỂM CHỨNG:** IL2CPP/target khác; HUD GUI/render GPU/OBS; ngâm tải dài, 500 người trong Unity, fault injection queue overflow/peer quá cỡ; LTS; TikTok LIVE thật. Network headless 30s không chứng minh các mục đó. Chưa triển khai nhân vật/cảnh/FX/UI gameplay. Dừng ở bước 02.

## Bổ sung nguyên lực tông môn — 07/11/2026

Theo yêu cầu HUD Concept02, `state:snapshot.payload.interactions` bổ sung trường **tùy chọn** `sectEnergy`:

```json
{"level":2,"power":1500,"threshold":3000,"maxLevel":3,"full":false}
```

Node là nơi duy nhất tính/lưu cấp và tim, từ lượng tim sau chống trùng của GameEventBus. Theo phần3 `Qua_Tbao.md`, bảng `config.sectLevels` cấu hình1–50 cấp, mỗi cấp có ngưỡng riêng và phần thưởng toàn tông. Mặc định1000/3000/5000, có thể thêm cấp4 trở lên. Snapshot giữ nguyên năm trường `level/power/threshold/maxLevel/full`; không tính cấp từ số tim ở Unity. Mốc cuối giữ MAX, tim dư chuyển tiếp, quà một lần/cấp. Bảng cấp thay mốc wish lặp cũ; trường `interactions.wish` được giữ tương thích hiển thị, phản chiếu tiến độ cấp, không tạo thêm thưởng lặp. PendingPoints/pendingBlessings cũ vẫn được trả nốt.

Save vẫn schemaVersion2/runtime.interactions.version1; `sectEnergy` mới là `{version:2,totalLikes,completedLevels}`. Restore đọc được `{level,power}` ba cấp cũ, quy đổi theo1000/3000/5000 và không phát lại quà. Mảng `levelRewards` tùy chọn giữ thưởng bị chặn cùng item/quantity/recipients lúc chốt. Đổi ngưỡng giữ tổng tim, tính lại hiển thị và không thưởng hồi tố; DEMO/LIVE giữ engine/file riêng, vẫn commit batch. Tham khảo [hướng dẫn phần3](Tailieu_output/QUA_TBAO_PHAN3.md).

Unity bổ sung model chỉ đọc `SectEnergyState`, kiểm tra kiểu/phạm vi khi trường này có mặt:1≤level≤maxLevel≤50,0≤power≤threshold≤1.000.000.000. Full chỉ đúng khi cấp cuối đầy; cấp chưa cuối phải có power<threshold. Snapshot cũ thiếu maxLevel mặc định3; thiếu sectEnergy vẫn hợp lệ và HUD hiện chờ. Chỉ tính tỉ lệ fill hình ảnh từ power/threshold; không gửi message lên WebSocket hoặc ghi save. Envelope/version/route giữ nguyên. TOP3 cảnh giới chỉ sắp các PlayerState hiện có, không thêm hợp đồng thưởng/xếp hạng backend.

Kiểm thử riêng: test/sect-energy.test.js và test/sect-energy-api.test.js kiểm mốc/dư/MAX, trùng delta/tổng, restore/save cũ, API/WebSocket/commit/restart và tách DEMO/LIVE. Bằng chứng Unity/HUD ở `docs/unity-sect-hud/`; kết quả chi tiết trong PROGRESS.md.

## Bổ sung Ban Phúc — 07/11/2026

Theo `docs/UI_BANPHUC.md`, snapshot bổ sung `interactions.blessing` tùy chọn:

```json
{"remainingMs":50000,"durationMs":60000,"multiplier":2}
```

`remainingMs` là thời gian tu luyện còn lại, `durationMs` là tổng thời gian của đợt hiện tại (tăng thêm30.000 khi được gia hạn). Hết đợt thì cả hai bằng0; chỉ có một hệ số Ban Phúc x2. Ban Phúc tiếp theo cộng30 giây, không thêm hệ số. Unity chỉ hiển thị đồng hồ/ratio và ẩn bảng khi hết/mất kết nối; không tự giảm thời gian, không suy ra từ buff riêng của một nhân vật. Snapshot cũ thiếu trường vẫn hợp lệ và bảng ẩn. Typed model `BlessingState` kiểm phạm vi0≤remaining≤duration≤MAX_SAFE_INTEGER và multiplier=2.

Quà đã ánh xạ thành vật phẩm Ban Phúc dùng cùng luồng inventory/activation/chống trùng hiện hữu. Lên cấp tông môn1→2 hoặc2→3 kích hoạt30 giây mỗi cấp; tim làm đầy MAX không thưởng thêm. Ban Phúc từ lên cấp trong battle/pause/stopped giữ thời gian chờ tu luyện; quà/vật phẩm trong battle vẫn chờ theo luật cũ. Điểm nhiệm vụ/cooldown `wish` không đổi. Event mới `blessing:activated` dùng envelope `game:event` hiện hữu, chứa source/count/remainingMs/durationMs/multiplier; client không dùng event để tự tính buff.

Save vẫn schemaVersion2; `runtime.globalBuffs` giữ mảng tương thích, chỉ còn tối đa một Ban Phúc khi tạo/khôi phục, thêm `durationMs` tùy chọn. Save cũ được gộp tổng remaining thành một x2, không bỏ thời gian và không cộng lại thưởng cấp đã đạt. Lưu riêng DEMO/LIVE, restart không giảm thời gian offline. Trà/linh căn/giới hạn tổng multiplier giữ luật cộng nguồn khác nhau. Kiểm thử riêng tại `test/blessing*.test.js`, Unity và ảnh tại `docs/unity-blessing/`.

