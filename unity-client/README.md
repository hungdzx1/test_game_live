# Tu Tiên LIVE — Unity client, giai đoạn 04

Project ở **unity-client/** tại gốc repository. SectScene đã có nhân vật sprite, pooling, aura, tên và độ kiếp theo backend. Khi nhấn Play, bootstrap kết nối Node qua WebSocket; chưa triển khai battle Unity. Phần network vẫn có scene kiểm thử riêng.

## Nhân vật và độ kiếp — bước 04

Chạy `npm start` từ repository, dùng dashboard DEMO tạo người chơi và bắt đầu tu luyện. Mở SectScene rồi Play, endpoint mặc định `ws://127.0.0.1:3000/ws`. Prefab thật ở **Assets/Resources/CharacterPrefab.prefab**; C# ở **Assets/Scripts/Characters/**, controller độ kiếp ở **Assets/Scripts/Effects/**. Scene không bị ghi đè để thêm hệ thống này; root nhân vật chỉ xuất hiện lúc chạy.

Hướng dẫn, mapping fallback, giới hạn hiển thị và kiểm thử: [UNITY_CHARACTERS.md](../docs/UNITY_CHARACTERS.md). Khi chưa có Node, vẫn xem được bố cục nền nhưng không có người chơi giả. Không cần kết nối LIVE thật.

## Mở tông môn 2.5D — bước 03

Unity Hub → mở `C:\Users\admin\Documents\CODE\TuTien\unity-client` bằng Unity 6000.5.9f1 → mở **Assets/Scenes/SectScene.unity**. Chọn Game View **9:16**, 1080×1920 hoặc 720×1280, nhấn Play để xem chuyển động nhẹ. Scene này không cần Node.js hoặc kết nối LIVE để xem bố cục.

Hierarchy `SectScene — PNG 2.5D` → SectSceneController chỉnh Low/Medium/High. Mỗi layer có SectLayer để chỉnh Position Pixels, Uniform Scale, Anchor, Opacity và thứ tự. Giữ Vertical Scale=1 cho kiến trúc. Menu **Tu Tien LIVE → Stage 03 → Screenshot test (actual GPU)** xuất ảnh và kiểm bounds; cần lưu scene đang sửa trước khi chạy.

Hướng dẫn chi tiết, asset thiếu và ảnh nghiệm thu: [UNITY_SECT_SCENE.md](../docs/UNITY_SECT_SCENE.md). PNG nhập ở **Assets/Art/Sect/**, ảnh gốc public/assets giữ nguyên. Chỉ có placeholder cho phần cây/cầu thiếu; chưa nhận hoàn chỉnh như concept.

## Mở kiểm thử network — bước 02

1. Unity Hub → Add project from disk → chọn `unity-client/`, dùng **6000.5.9f1** đã cài (không phải LTS). URP 17.5.0, Newtonsoft JSON 3.2.2 và Test Framework 1.4.6 được pin trong manifest/lock.
2. Từ root repository chạy `npm.cmd start`, mở dashboard, dùng DEMO. Không cần kết nối TikTok LIVE. Cổng theo `caidat.json`, mặc định 3000.
3. Trong Unity mở `Assets/Scenes/NetworkTest.unity`, nhấn Play. Component `UnityWebSocketClient` trên `Read-only WebSocket Client` có trường Endpoint, mặc định `ws://127.0.0.1:3000/ws`; đổi đúng cổng Node nếu cần.
4. HUD hiển thị kết nối, session, phase, remainingMs, players, events và độ trễ nhận. Ngắt Node rồi mở lại: client xóa state hiển thị cũ, reconnect và chờ snapshot mới. Không cộng tu vi hay phát lại phần thưởng ở client.
5. `Bootstrap.unity` vẫn là scene trống của giai đoạn 01. Để thử network phải mở **NetworkTest**. Không chạy hai Editor trên cùng project; không tắt Editor của project khác.

Client native chỉ bật trên **Windows Editor / Windows Standalone**. Windows x64 Mono là cấu hình build giai đoạn 02. WebGL cần transport browser khác; macOS/Linux/mobile và IL2CPP chưa được nghiệm thu. Không thêm Netcode, Socket.IO hoặc Unity Transport: backend dùng WebSocket thuần.

## Kiểm thử bằng lệnh

Đóng Editor của project này trước các lệnh batch. Từ root repository:

```powershell
npm.cmd test
powershell -NoProfile -ExecutionPolicy Bypass -File .\unity-client\Test-Network.ps1 -Mode EditMode
node scripts/unity-network-smoke.js --editor
powershell -NoProfile -ExecutionPolicy Bypass -File .\unity-client\Test-Network.ps1 -Mode Build
node scripts/unity-network-smoke.js
```

Hai smoke tạo dữ liệu DEMO tạm và **tiến trình Node riêng**, dừng/khởi động lại cùng cổng; không đụng server đang dùng hoặc dữ liệu repository. Chúng không gọi TikTok LIVE. Chạy smoke Editor và build lần lượt, không song song trên cùng project. Có thể đặt `UNITY_EDITOR` nếu executable ở nơi khác; `UNITY_SMOKE_PORT` chọn cổng rảnh, mặc định smoke xin cổng tạm.

`Test-Network.ps1 -Mode Verify` kiểm scene, `-Mode Setup` chỉ tạo scene khi chưa có. `node scripts/unity-network-fixtures.js` tái xuất JSON từ engine thật với người chơi giả trong bộ nhớ; ID/time thay đổi khi tái xuất, không phải game save. Các fixture đã có sẵn, không cần tái xuất mỗi lần chạy tests.

Bản build nằm tại `unity-client/Builds/NetworkTest/TuTienNetworkTest.exe` (ignored, không commit). Chạy bình thường để xem HUD; có thể truyền `--ws-url ws://127.0.0.1:3001/ws`. Theo mặc định không ghi report ra đĩa. Chỉ smoke dùng `--network-report <path>` và `--probe-seconds 30` để bật đo tự động rồi thoát.

`Verify-Project.ps1` cũ chỉ kiểm cấu hình Bootstrap/URP, không thay cho test networking. Kết quả và giới hạn xem [UNITY_WEBSOCKET.md](../docs/UNITY_WEBSOCKET.md), [PROGRESS.md](../PROGRESS.md). Kiến trúc giai đoạn 01 được giữ tại [UNITY_MIGRATION.md](../docs/UNITY_MIGRATION.md).

Dừng ở bước 03. Chưa dựng hệ thống nhân vật/battle hoặc chuyển `/song` sang Unity. Kiểm thử GPU/ảnh của SectScene tách biệt với kiểm thử mạng/Player ở bước 02; xem PROGRESS.md để biết giới hạn từng kết quả.
