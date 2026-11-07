# Kiểm tra trước khi đẩy Git — 08/11/2026

Theo yêu cầu người dùng, gom các cập nhật hiện có của Unity, backend, tài nguyên, cấu hình, tài liệu và tiện ích đọc thử để commit/push lên origin/main. `npm test`: **PASS 115 / FAIL 0 / SKIP 1**, tổng 116 bài; SKIP là LIVE thật. Không chạy lại Unity Editor/build trong lượt chỉ đồng bộ Git này; kết quả Unity từng tính năng giữ theo báo cáo bên dưới. Dữ liệu người chơi, cache/build Unity, runtime/model/output TTS cục bộ tiếp tục được ignore. Không thay logic hoặc reset dữ liệu khi chuẩn bị đẩy Git.

---

# Đổi bản đọc thử sang giọng nam — 08/11/2026

**Đã triển khai và kiểm thử tạo WAV offline**, theo yêu cầu “thử đổi sang giọng nam”. Mặc định tiện ích đọc thử hiện là **Trầm Vang** (`vi_VN-tramvang-medium`); giữ nguyên model nữ và WAV giọng cũ để đổi lại. Không sửa nội dung file người dùng đã chỉnh (mẫu hiện162 ký tự), dữ liệu game, scene/Unity/backend.

- Tải model/cấu hình/token/model card từ [vnhellboy/vietnamese-piper-voices](https://huggingface.co/vnhellboy/vietnamese-piper-voices), pin revision `df2a53e0b5c8039d17e642cc8d80fa03d59374b7`. Tác giả mô tả giọng nam miền Bắc trầm/vang, giọng được thiết kế tổng hợp rồi fine-tune, không phải sao chép một người cụ thể. Model card giữ ghi chú nguồn/lineage/giấy phép, không nhận là đã thẩm định dùng thương mại.
- `tools/tts/piper/voice-settings.json`: `voice=male` mặc định, đổi `female` để quay lại giọng cũ. `synthesize.py --voice male|female` hoặc `doc-thu.ps1 -Voice female -Play` chọn riêng một lần. Không chỉnh tốc độ sample để giả đổi giọng; thực sự dùng model khác.
- Thêm kiểm tra phoneme trước khi sinh WAV, có âm không nằm trong bảng model thì dừng báo lỗi. Setup tải được cả hai giọng khi cài mới, giữ dữ liệu model sẵn có; manifest cập nhật nguồn/hashes, không cài thêm framework/package. README cập nhật đường dẫn/cách đổi.
- Kết quả nghe thử: `tools/tts/piper/output/thien-dao-giong-nam.wav`; `doc-thu.bat` sinh/phát lại giọng nam theo cấu hình hiện tại. WAV cũ giữ tại `thien-dao-giong-cu.wav` và model nữ cũ giữ tại models. Tiện ích chỉ là bản đọc thử; Unity vẫn chưa tự đọc theo sự kiện.

| Kiểm tra | Kết quả |
|---|---|
| Giọng nam mặc định/launcher PowerShell | **PASS**, file chọn male → model Trầm Vang thực; đọc162 ký tự thành WAV mono22050Hz/16-bit,7,30 giây, tạo trong8,02 giây, RMS6185 khác0; `docs/Tailieu_output/offline-tts/male-voice-report.json` |
| Bảng âm tiếng Việt | **PASS** với nội dung thử hiện tại, missingPhonemes=[]; không bỏ âm/ẩn cảnh báo. Không suy rộng thành mọi tên hoặc ngôn ngữ đều phát âm chính xác |
| Offline/isolation | **PASS trong phạm vi tiến trình**, từ chối socket/DNS Python,0 lần gọi mạng, Python isolated=true/userSite=false; CPU, không API/cloud |
| Đổi lại giọng nữ cũ | **PASS**, chọn override female tạo file thử riêng,6,41 giây âm thanh,missingPhonemes=[],0 lần gọi mạng; không ghi đè WAV mẫu nam; `female-voice-regression.json` |
| Setup/giữ model cũ | **PASS**, setup chạy lại khi file có sẵn, Piper1.8/ONNX1.31.1 giữ nguyên, cả hai giọng có model/config; WAV mẫu giọng cũ đã sao giữ trước khi đổi |
| Nghe qua loa/chất lượng chủ quan/Unity Editor/Play/build/OBS/LIVE | **CHƯA KIỂM CHỨNG**. Không nhận WAV có tín hiệu là đã nghe hoặc tích hợp Unity; không chạy suite gameplay cho thay đổi tiện ích TTS độc lập |

Bản25hours_single-low được thử đầu tiên nhưng phát hiện model cũ chỉ có130 ký hiệu, thiếu âm thanh điệu/diacritic (2,5,6 và U+032A) trong mẫu hiện tại. Đây là hạn chế model, không sửa bằng gán tùy ý token hoặc tắt cảnh báo. Đã loại model đó, chỉ dọn ba file vừa tải trong thư mục riêng sau khi kiểm tra đường dẫn; không đụng model nữ có sẵn. Đổi sang Trầm Vang với bảng âm đầy đủ và tạo mẫu cuối PASS. Bước tiếp theo: người dùng nghe mẫu nam hoặc nháy doc-thu.bat; chỉnh voice-settings.json nếu muốn quay lại. Chưa triển khai tự đọc sự kiện Unity.

---

# Cài Piper tiếng Việt offline — 08/11/2026

**Đã cài và kiểm thử tạo WAV**, theo yêu cầu cài giúp và báo vị trí. Phạm vi lượt này là cài bộ đọc/tiện ích thử; **chưa tích hợp giọng Thiên Đạo vào sự kiện Unity**.

- Vị trí riêng: `C:\Users\admin\Documents\CODE\TuTien\tools\tts\piper\`. Python portable3.13.17, Piper1.8.0, ONNX Runtime1.31.1, giọng `vi_VN-vais1000-medium` (model/cấu hình/model card). Dùng CPU, không thêm CUDA/API cloud hoặc tài khoản. Tổng thư mục khoảng242MiB tính cả ZIP cài và thư viện.
- Python hệ thống hiện3.15.0a7 được giữ nguyên; pip chỉ cài gói vào runtime/Lib/site-packages bằng binary wheels cp313. Launcher dùng `-I -X utf8`: không dùng user site/PYTHONPATH, không sửa PATH/registry/Python mặc định. Runtime/model/output/downloads loại khỏi Git.
- `scripts/setup-offline-tts.ps1`: nguồn Python.org/PyPI/Hugging Face, phiên bản pin, tải file tạm trước khi hoàn tất cho lần cài sau, manifest phiên bản/gói/SHA256 trong `installation.json`. Model card/nguồn/giấy phép giữ kèm. Yêu cầu người dùng lần này cho phép tải engine và model tiếng Việt; không áp dụng mở rộng cho asset đồ họa/âm thanh ngoài khác.
- `tools/tts/piper/noi-dung-doc-thu.txt`: file UTF-8 để người dùng tự sửa lời thử; `doc-thu.bat` tạo WAV và phát Windows khi người dùng nháy đúp. `doc-thu.ps1` có tùy chọn TextFile/Play; mặc định chỉ tạo, không tự phát loa trong test. `synthesize.py` đọc1–2.000 ký tự, model local, xuất16-bit PCM WAV và báo cáo. Đây chưa phải bảng kịch bản chạy theo sự kiện game.
- Hướng dẫn vị trí/cách dùng/nguồn tại [README Piper](tools/tts/piper/README.md). Kịch bản game khi tích hợp sau cần mẫu câu theo sự kiện và biến tên/cảnh giới, hàng đợi/mute/âm lượng/AudioSource. Không yêu cầu người dùng tự lập trình phần này, nhưng chưa triển khai thêm phạm vi Unity ở lượt cài đặt.

| Kiểm tra | Kết quả |
|---|---|
| Import/runtime/phiên bản | **PASS**, Python portable3.13.17 và Piper1.8.0/ONNX1.31.1; module nạp từ thư mục dự án, isolated=true/userSiteEnabled=false; Python hệ thống vẫn3.15.0a7 |
| Đọc tiếng Việt ra WAV | **PASS**, mẫu145 ký tự, WAV mono22050Hz/16-bit, khoảng6,29 giây; peak32767/RMS6218 khác0, tạo trong7,61 giây ở lần cuối. `tools/tts/piper/output/thien-dao-doc-thu.wav`; report tại `docs/Tailieu_output/offline-tts/offline-report.json` |
| Không gọi mạng khi tạo giọng | **PASS trong phạm vi tiến trình thử**, audit hook từ chối socket connect/DNS/sendto của Python,0 lần thử gọi mạng; model/config đọc đường dẫn local, không gọi dịch vụ TTS hoặc TikTok. Không ngắt Internet toàn máy người dùng để thử |
| Script quản lý | **PASS**, parse PowerShell; chạy setup nhập thư viện thành công, launcher đọc thử sinh WAV; `.bat` chuẩn CRLF. Không dùng Python hệ thống làm runtime đọc |
| Nghe thực tế qua loa, chất lượng giọng, giọng trầm/vang, độ trễ LIVE lâu dài | **CHƯA KIỂM CHỨNG**. Không tự nhận chất lượng nghe từ kiểm tra biên độ WAV; khi tích hợp cần giữ model nạp sẵn để tránh chi phí nạp mỗi câu |
| Unity tự đọc theo sự kiện/Editor/Play Mode/build Windows/OBS | **CHƯA TRIỂN KHAI/CHƯA KIỂM CHỨNG** ở lượt này. Không sửa scene/C#/backend/quà/gameplay hoặc dữ liệu người chơi; không chạy lại suite game vì chỉ cài tiện ích độc lập |

Lần kiểm import đầu gặp quoting của PowerShell khi truyền Python -c có dấu ngoặc kép, sửa thành quote bên trong bằng dấu đơn rồi chạy lại thành công. Kiểm tra isolation phát hiện import site vẫn có thể bật user site trong embedded distribution; launcher chuyển thêm -I, chạy lại WAV PASS và userSiteEnabled=false. Chưa tự commit/push hoặc phát tiếng ra loa. Bước tiếp theo: người dùng sửa file thử và nháy đúp doc-thu.bat để nghe; cần yêu cầu tích hợp riêng để Unity tự đọc kịch bản.

---

# Quà tặng, bình luận và follow — mục 4 Qua_Tbao.md — 08/11/2026

**Đã triển khai và kiểm thử** theo `docs/Tailieu/Qua_Tbao.md` mục4. Đã hỏi và nhận xác nhận: bỏ toàn bộ tải danh mục quà TikTok, ba lựa chọn chỉ khớp đúng ba loại quà trong ảnh, không áp dụng cho mọi quà cùng giá.

- Cài đặt → TikTok & quà → Quà → vật phẩm: thay bộ chọn danh mục online bằng ba thẻ ảnh local `public/assets/Qua/1xu.jpg`, `10xu.jpg`, `20xu.jpg`. Hoa hồng/Rose1 xu, Cỏ bốn lá/Shamrock10 xu, Má hồng nhỏ xinh/Tiny Blush20 xu dùng ID cụ thể. Đã tra nguồn và so biểu tượng; Tiny Blush khác little kisses cùng20 xu. Nguồn/ngày tra cứu/giới hạn tại [hướng dẫn phần4](docs/Tailieu_output/QUA_TBAO_PHAN4.md).
- Chọn quà sẵn điền ID/tên/đơn giá, khóa các trường nhận diện/dải giá. Nhập thủ công mở lại ID/tên/dải giá như cũ; không tự xóa giá trị khi chuyển cách chọn. Giữ bản nháp, vật phẩm/số lượng/hiệu ứng/bật tắt/thêm/xóa/lưu, dữ liệu đã lưu không tự thay khi mở ứng dụng. Ưu tiên ID → tên → dải giá giữ nguyên; quà khác cùng giá vẫn có thể nhận theo dải giá cũ nếu streamer giữ dải đó.
- Gỡ `giftCatalog.js`, tích hợp service/cache và API `/api/tiktok/gifts`, ô kênh/nút tải/tìm danh mục. Không đọc/ghi cache cũ, không xóa file cache nếu có. `tiktok-live-connector` và kết nối nhận sự kiện giữ nguyên, không thêm dependency/asset ngoài.
- Sửa nguyên nhân bình luận bị bỏ qua: native protobuf v3 có `WebcastChatMessage.content`, mã cũ đọc `comment`. Hiện ưu tiên content, tương thích comment cũ, từ chối thiếu/sai kiểu/quá200 ký tự có lý do. Lệnh vẫn qua normalize/dedup/CommandRouter và user ID ổn định.
- Trang chủ → Kết nối → Nhật ký bình luận & follow: hiển thị20 dòng từ dashboard khoảng2 giây, có nội dung đã lọc/kết quả lệnh/lý do lỗi/follow. Bus giữ tối đa50 dòng RAM theo engine; không lưu bình luận vào save, không gửi log qua WebSocket công khai/Unity. Follow đã có listener và thông báo, bổ sung log có giới hạn tần suất, không tạo nhân vật/thưởng mới. Dashboard chỉ thêm `interactionLog` cho quản trị localhost.
- Cập nhật GAME_DESIGN/README/hướng dẫn phần4 và đánh dấu phần tải danh mục trong tài liệu phần1 là lịch sử. Smoke cũ `scripts/gift-settings-browser-smoke.js` chuyển chạy luồng mới; không để test tải danh mục đã gỡ trong bộ mặc định.

| Kiểm tra | Kết quả |
|---|---|
| Node mặc định cuối cùng | **PASS115 / FAIL0 / SKIP1**,116 bài/24 file; `docs/Tailieu_output/qua-phan4/npm-test.txt`. SKIP là LIVE thật. Ba bài catalog cũ được thay bằng ba bài preset/native protobuf/pipeline, giữ test cấu hình và phần thưởng các phần trước |
| Native connector → backend | **PASS**, encode/decode protobuf từ package đã cài, dispatch thật `processDecodedData`; thay duy nhất network connect/disconnect. Bình luận content tạo/nhận lại đúng user, phát lại không trùng, bình luận thường không nhập môn, follow chống trùng, lỗi có lý do; save không chứa chat, dashboard có log, snapshot công khai không có log, DEMO/LIVE/cache tách biệt |
| Quy tắc quà/API | **PASS**, ba ID/đơn giá khớp đúng, ID khác cùng giá và đúng ID sai giá không khớp preset; dải giá cũ vẫn hợp lệ, cấu hình qua restart, API catalog cũ404, cache cũ giữ nguyên |
| Chrome giao diện thực | **PASS**, Chrome156.0.8078.81, server/data/profile tạm. Ba ảnh local, khóa/mở thủ công, lưu/reload/bản nháp/thêm/xóa, thưởng ba quà, sai ID/đơn giá, combo/replay, nhập môn/follow/log, desktop1366/mobile390/sáng/tối;0 runtime error,0 kết nối LIVE,0 HTTP ngoài ứng dụng hoặc gọi API catalog từ trang. `browser-report.json`, sáu ảnh đã xem |
| Bảo toàn | **PASS792/792** file giữ SHA256: data thật/demo/backups, caidat/package/lock, toàn bộ Unity Assets và ba JPG người dùng. `preservation-report.json`. Không sửa project Unity riêng của người dùng hoặc chạy server kiểm thử với dữ liệu production |
| LIVE qua mạng thật, Unity Editor/Play Mode/build Windows, âm thanh/OBS | **CHƯA KIỂM CHỨNG trong lượt này**; không dùng PASS Node/Chrome thay cho Unity/LIVE thật. Metadata quà tra từ danh mục công khai, chưa đối chiếu phiên LIVE thực của tài khoản |

Lần đầu Chrome phát hiện log mới chỉ có trong snapshot quản trị HTTP, WebSocket công khai không chứa log; đã nối qua dashboard quản trị sẵn có và chạy lại Chrome PASS. Harness protobuf đầu tiên dùng API fromPartial không có trong package này, sau đó thiếu default nested fields; sửa fixture dùng default từ decoder và encoder thực. Fixture EXP ban đầu chạy trong tu luyện nên tăng theo đồng hồ; dừng pha để kiểm tra riêng chống tạo lại nhân vật. Các lỗi harness đã sửa, không nới kỳ vọng gameplay. Lần kiểm hash PowerShell đọc nhầm wrapper array của JSON nên báo sai checked1; kiểm lại792 bản ghi bằng Node SHA256 cho PASS, không có file được bảo vệ thay đổi.

Bước tiếp theo: khởi động lại Node và tải lại tab quản trị, chọn/lưu quà theo ảnh; khi có phiên LIVE thật, thử một bình luận nhập môn và follow rồi xem nhật ký tại Trang chủ. Không commit/push/reset/xóa dữ liệu. Chưa triển khai mục2 giọng AI hoặc các mục khác ngoài yêu cầu.

---

# Âm thanh Unity — AMTHANH.md — 07/11/2026

**Đã triển khai và kiểm thử** theo `docs/Tailieu/AMTHANH.md`, dùng năm file có sẵn trong `unity-client/Assets/Musics/`. Không tải asset hoặc thêm package.

- Thêm `GameAudioManager` tại **08_Systems/GameAudioManager** trong `SectScene_Main` và `SectScene_Concept02`. Năm trường AudioClip kéo thả trong Inspector gán sẵn BGM/Ban Phúc/độ kiếp thành công/tăng cấp tông môn/bay lên-xuống. BGM loop sau snapshot hợp lệ; nhạc tiếp tục trong pause/stopped, dừng khi disconnect hoặc mute.
- Ban Phúc theo `blessing:activated`; thành công theo `breakthrough:completed` outcome=true; tông môn theo `sect:level` thực sự lên cấp (đầy MAX không phát lên cấp). Tiếng bay theo cạnh chuyển sang tư thế fly của nhân vật đang được render, bao gồm bay lên đài và trở về; không lặp mỗi frame, không phát hồi tố khi reconnect/đồng bộ đầu.
- Dùng `config.audio` hiện hữu qua snapshot: enabled/music/effects, masterVolume/musicVolume/effectsVolume, maxVoices. Nhạc = tổng×nhạc, SFX = tổng×hiệu ứng; Cài đặt → Âm thanh → Lưu cập nhật Unity ngay. Không thay hợp đồng backend, schema save, DEMO/LIVE hoặc gameplay. Trang cài đặt làm rõ nghe thử/TTS tại tab là hệ thống trình duyệt, clip Unity ở Inspector.
- Pool16 nguồn SFX tạo một lần, ngân sách2–16 theo server (mặc định8), ưu tiên độ kiếp/tăng cấp/Ban Phúc và gộp tiếng cùng loại trong150ms. Chống trùng, không giữ hàng đợi khi mute; disconnect/disable/session mới dừng âm cũ, thiếu clip hoặc config âm lượng sai không làm lỗi game. Không thay AudioListener.volume toàn cục.
- Hai scene được bổ sung listener vì trước đó chưa có. Menu **Tu Tien LIVE → Audio → Add audio manager to current scene** thêm manager cho scene có SectSceneBindings; giữ nguyên clip đã gán khi manager tồn tại. Chỉ ghép năm object/component mới và tham chiếu con vào Systems, giữ byte của mọi object cũ khác; không đổi bố cục/camera/tỉ lệ/prefab.
- Cập nhật GAME_DESIGN, hướng dẫn client và [docs/Tailieu_output/AMTHANH.md](docs/Tailieu_output/AMTHANH.md). Evidence ở `docs/Tailieu_output/amthanh/`; test dùng backend/data/profile/project tạm.

| Kiểm tra | Kết quả |
|---|---|
| Node mặc định | **PASS115 / FAIL0 / SKIP1**,116 bài/23 file; `npm-test.txt`. Bài mới kiểm API/WS/lưu/restart/mode, âm lượng/bật tắt/maxVoices và từ chối input sai mà không sửa config. SKIP là LIVE thật |
| Chrome cài đặt âm thanh | **PASS**, Chrome156.0.8078.81; chỉnh ba thanh, bật/tắt từng kênh/tổng, lưu/reload và đối chiếu API/file, không runtime exception. `browser-report.json`, `audio-settings.png` đã xem |
| Unity compile/suite | **PASS60/60**,6 bài âm thanh +54 bài SectHud/Protocol/BlessingPanel/Concept02 hiện hữu; `unity-editmode.xml`. Unity6000.5.9f1 đang có, giữ Editor/package hiện tại |
| Unity Editor/asset | **PASS**, cả Main và Concept02 có một manager/một listener, đủ năm clip, thao tác cài đặt lại không ghi đè; năm file giải mã ra mẫu âm thanh khác0 |
| Unity Play Mode Concept02 | **PASS**, AudioSource thực phát đúng sự kiện, thành công/thất bại/MAX, bay lên/về đúng một lần, chống trùng/frame spam/reconnect; volume/mute/kênh/thiếu clip/input sai/ngân sách/ưu tiên/disable. BGM vẫn phát sau hơn một vòng clip ngắn, GetOutputData có tín hiệu khác0 |
| Node thật ↔ Unity Play Mode | **PASS**, HTTP cấu hình trên backend tạm → WS → AudioSource: tổng.6×nhạc.4=.24, hiệu ứng.6×.3=.18; tim đạt cấp phát hai tiếng tăng cấp/Ban Phúc, mute dừng nhạc và SFX |
| Bảo toàn | **PASS**,252/254 file giữ hash; hai scene thay đúng phần thêm âm thanh.201 object cũ Main và331 object cũ Concept02 giữ byte, mỗi scene chỉ thêm một con tại parent Systems và năm object/component mới; `preservation-report.json`, `scene-merge-report.json`. Dữ liệu thật/demo/backups/caidat/package/lock, clip/meta âm thanh, prefab/artwork giữ nguyên |
| Main Play Mode riêng, Windows executable/build mới, nghe/cân chỉnh qua loa/tai nghe, capture OBS/LIVE thật | **CHƯA KIỂM CHỨNG** trong lượt này; không lấy batch import hoặc signal DSP làm bằng chứng đã nghe/thu OBS |

Các lượt đầu lỗi trong test harness: URL/closure giữ tham chiếu qua domain reload bị mất khi EnterPlayMode; chuyển lấy URL sau Enter và đưa lambda vào hàm thường. Fixture tim ban đầu cấp tu vi cho chính nhân vật độ kiếp, làm tự xếp nghi thức tiếp theo nên chưa bay về; đổi người góp tim và assert fixture đã hết nghi thức. Chờ chuyển động theo đồng hồ Editor thay vì giả định một frame/WaitForSecondsRealtime trong EditMode test. Không nới kỳ vọng tiếng bay; bài riêng PASS rồi toàn bộ60/60 PASS. Giữ XML các lượt đầu để đối chiếu; không còn lỗi đã biết trong phạm vi này.

Bước tiếp theo: Unity import script, mở scene Concept02 hoặc Main và chọn GameAudioManager để thay clip; trang quản trị Cài đặt → Âm thanh để chỉnh âm lượng và Lưu. Với scene đang mở chưa có object trong bộ nhớ, có thể dùng menu Audio rồi lưu cùng các chỉnh sửa của người dùng. Chạy thử âm nghe thực tế/thu OBS ở nguồn Unity khi cần. Không dừng Editor người dùng, không commit/push/reset/xóa dữ liệu production.

---

# Logic tăng tu vi — phần 1 — 07/11/2026

**Đã triển khai và kiểm thử**, theo `docs/Tailieu/Logic_Tang_Tu_vi.md` phần1. Người dùng chọn **nguyên lực cộng ngay, chỉ gom tu vi cá nhân**.

- Tốc độ gốc **2 tu vi/giây cho cả11 cảnh giới**; đọc cấu hình cũ với rate2, giữ HP/ATK/DEF/ngưỡng nâng tầng và các cơ chế hiện hữu. GAME_DESIGN cập nhật theo yêu cầu mới.
- Mỗi tim hợp lệ tăng ngay nguyên lực và cho người gửi đã có nhân vật **2 tu vi/tim**. Gom riêng từng người: đủ100 chốt ngay, phần dư dưới100 chốt khi ngừng1 giây. Trà/Ban Phúc/Linh Căn áp dụng cùng hệ số cho giây và tim (một nguồn x2:4/giây và4/tim); giữ cộng hệ số/cap cũ. Ghi hệ số tại lúc nhận, không nhân lại khi chốt; Ban Phúc từ mốc có tác dụng với tim tiếp theo.
- `likeCultivation.js` dùng CultivationService.grant: battle/paused/stopped giữ EXP chờ, về tu luyện áp dụng một lần; buff/thời gian tự động vẫn đóng băng. Tick vẫn chốt chuỗi khi tạm dừng. Tim trước nhập môn chỉ tăng nguyên lực, không tự tạo nhân vật/tu vi hồi tố. Tổng phòng tăng vượt số tim của event không gán phần không rõ chủ cho người gửi.
- Biên nhận và chuỗi dở lưu cùng runtime (interactions version1, trường `likeStreaks` tùy chọn; schema người chơi2 giữ nguyên). Đọc save cũ, giữ phần dư/hệ số/chống trùng qua restart, không tăng tự động khi offline. DEMO/LIVE tách biệt. Tim không bị giới hạn bởi ngân sách bình luận/hiệu ứng thông thường, hàng đợi vẫn có giới hạn. Tổng tim nhảy bất thường bị từ chối trước khi sửa mốc đối chiếu.
- Unity runtime tiếp tục chỉ trình diễn. Thêm5 snapshot từ Node và bài Play Mode Concept02 kiểm tra tu vi/nguyên lực/nâng tầng; không sửa scene/prefab/artwork hoặc project người dùng `public/unity-client/My project/`.
- Hướng dẫn cách thử Demo và thông số tại [docs/Tailieu_output/LOGIC_TANG_TU_VI_PHAN1.md](docs/Tailieu_output/LOGIC_TANG_TU_VI_PHAN1.md); evidence ở `docs/Tailieu_output/tu-vi-phan1/`.

| Kiểm tra | Kết quả |
|---|---|
| Node mặc định cuối cùng | **PASS114 / FAIL0 / SKIP1**,115 bài/22 file; `npm-test.txt`.12 bài mới kiểm tra tốc độ, gom chuỗi/biên100 và1 giây, buff/cap, battle/pause, chống trùng/tổng phòng, input sai, lưu/restart và mode. SKIP là LIVE thật |
| API/WS/native adapter | **PASS**, nguyên lực ngay/tu vi chốt sau, Trà4/giây/4/tim, EXP chờ và17 tim dở qua restart, save/WS đồng nhất;1.100 event tim đơn qua adapter mô phỏng không mất đóng góp và replay không thưởng lại |
| Chrome trang Demo | **PASS**, Chrome156.0.8078.81, backend/data/profile tạm; nút10/100 tim, chọn hai nhân vật, Trà, pause/resume,2.0/4.0 mỗi giây; không runtime exception; `browser-report.json`, ảnh `demo-hearts.png` đã xem |
| Unity compile/suite | **PASS54/54**, SectHud/NetworkProtocol/BlessingPanel/Concept02 trên bản sao project, Unity6000.5.9f1; `unity-editmode.xml` |
| Unity Editor Play Mode | **PASS**, Enter/ExitPlayMode thực:2 tu vi sau1 giây;50 tim tăng nguyên lực trước, tu vi102 sau chốt; Trà+100 tim lên502; thêm15 tim/chốt lên Trung Kỳ; protocol/roster/energy fill/rank text đúng snapshot Node |
| Bảo toàn | **PASS243/243** file dữ liệu thật/demo/backups/caidat/package/lock/scene/prefab/artwork giữ hash; `verification-report.json`. Không dùng save production để thử hoặc dừng Editor đang mở |
| Windows build/executable mới, GPU/FPS/OBS/LIVE thật | **CHƯA KIỂM CHỨNG** trong lượt này |

Lần đầu test API bị từ chối khi chuyển LIVE vì fixture sentinel không có schema; sửa fixture thành save hợp lệ, giữ `initial-api-test.txt`, chạy lại API2/2 và toàn bộ115 bài thành công. Không có lỗi đã biết còn lại trong phạm vi này. Bước tiếp theo: khởi động lại Node để nạp code, dùng Demo chọn đạo hữu → nút tim; xác minh phiên LIVE thật/OBS khi streamer tự bật LIVE. Không commit/push/reset/xóa dữ liệu.

---

# Bảng cấp tông môn — phần 3 Qua_Tbao.md — 07/11/2026

**Đã triển khai và kiểm thử**, theo `docs/Tailieu/Qua_Tbao.md` phần3 và câu trả lời người dùng: chọn trực tiếp Trà/Đan/Ban Phúc/Linh Căn/Quay Cam, chỉ phạm vi **Toàn tông môn**. Không triển khai phần2 giọng AI.

- Cài đặt → TikTok & quà: thay hẳn “Kết nối & Nguyện Lực”/hàng mốc tim lặp bằng bảng **Cấp | Số lượng tim | Quà | Số lượng thưởng | Phạm vi**. Thêm cấp, xóa cấp cuối,1–50 cấp, có Không thưởng; ngưỡng1–1.000.000.000, lượng thưởng1–100. Bản nháp giữ khi đổi trang/snapshot, kiểm tra input trước lưu, không ghi khi sai. Cài đặt reconnect chuyển vào thông tin kết nối ở Trang chủ.
- Node quản lý bảng `sectLevels`, config atomic qua action cùng tên. Mỗi dòng là tim riêng để hoàn tất cấp; tim dư qua nhiều dòng, quà một lần/dòng, dòng cuối đầy nhận quà rồi MAX. Mặc định1.000/3.000/5.000 và Ban Phúc×1 ở hai mốc đầu, mốc cuối Không thưởng như trước; có thể thêm cấp4 trở lên. Không còn thưởng wish/cooldown lặp song song, nhưng pendingPoints/pendingBlessings từ save cũ vẫn được trả nốt.
- Quà cá nhân cấp đúng lượng cho từng đệ tử đã có lúc đạt mốc, qua inbox/túi/ItemService; battle/paused/stopped chưa tự dùng, giữ các giới hạn item. Ban Phúc toàn tông kích hoạt một lần/mốc, số lượng×30 giây x2, countdown đóng băng ngoài cultivation. Thưởng bị chặn vì inbox đầy giữ item/count/recipients lúc chốt, không đổi theo cấu hình mới hoặc nhận thêm người vào sau mốc.
- Save tương tác version1/schema người chơi2 giữ nguyên, trường sectEnergy có version2 riêng với totalLikes/completedLevels, levelRewards tùy chọn. Đọc được save `{level,power}` ba cấp cũ theo ngưỡng gốc, không phát lại quà. Đổi/ngắn/mở rộng bảng giữ tổng tim, tính lại hiển thị (có thể giảm cấp nếu tăng ngưỡng), đánh dấu mốc đã vượt và không thưởng hồi tố. Biên nhận không xóa khi bỏ rồi thêm lại một cấp. Tiến độ/pending tách DEMO/LIVE, restart giữ đúng.
- Unity StateMapper/Model nhận maxLevel cấu hình1–50, validate full/threshold; thiếu maxLevel giữ fallback3. HUD dùng số liệu server, không tính lại gameplay. Thêm snapshot cấp6 thật do Node tạo, test HUD/protocol/Play Mode; không sửa scene/prefab/PNG/tỉ lệ nhân vật.
- Cập nhật GAME_DESIGN/protocol, hướng dẫn [docs/Tailieu_output/QUA_TBAO_PHAN3.md](docs/Tailieu_output/QUA_TBAO_PHAN3.md), ghi chú phần1 cũ và phân nhóm test. Evidence tại `docs/Tailieu_output/qua-phan3/`.

| Kiểm tra | Kết quả |
|---|---|
| Node mặc định cuối cùng | **PASS102 / FAIL0 / SKIP1**,103 bài/20 file; `npm-test.txt`. SKIP là LIVE thật. Đã cập nhật các bài wish cũ theo yêu cầu thay bằng cấp, thêm8 bài về cấp động/cấu hình/API/migration/overflow |
| Cấp động/backend | **PASS**,6–7 cấp và vượt nhiều mốc, năm loại quà, Ban Phúc một lần toàn tông, MAX/thêm cấp, thay ngưỡng không replay, lưu cũ/giữ tổng/biên nhận, pending giữ người nhận/item/count qua config/restart, API/WS đồng nhất/tách mode, input sai giữ file nguyên |
| Browser bảng cấp mới | **PASS**, Chrome156.0.8078.81, server thật/data/profile tạm; thêm/sửa/xóa6–7 cấp, draft/input sai/lưu/reload, nút tim Demo nhận quà đúng/phúc lợi/MAX, thêm sau MAX không phát quà miễn phí, rút bảng giữ total, mobile390/desktop1366/tối/sáng; `browser-report.json`,4 ảnh đã xem |
| Browser hồi quy | **PASS** phần chọn quà (`gift-regression/browser-report.json`) và5 trang admin (`admin-browser-report.json`). Các control reconnect vẫn dùng được ở Trang chủ; không tự nối LIVE |
| Unity compile/suite | **PASS53/53** SectHud/NetworkProtocol/BlessingPanel/Concept02 trên bản sao project, Unity6000.5.9f1; `unity-editmode.xml` |
| Unity Editor Play Mode | **PASS**, Enter/ExitPlayMode thực: snapshot Node cấp6/max6/15 trên60 tim qua Protocol, HUD cấp6/fill25%, disconnect ẩn fill; các bài Concept02/Ban Phúc Play Mode hiện hữu cũng PASS. Không coi static parse/npm là bằng chứng Play Mode |
| Bảo toàn | **PASS243/243** file được bảo vệ, data thật/demo/backups/caidat/package/lock/scene/prefab/artwork giữ hash; `verification-report.json`. Không dừng Editor đang mở, không ghi save test vào dữ liệu production |
| Windows build/executable mới, GPU/FPS/OBS/LIVE thật | **CHƯA KIỂM CHỨNG** trong lượt này; không chạy bộ renderer legacy thay cho Unity |

Các lần đầu:11 bài Node còn assert schema/mốc wish cũ, đã chuyển sang kỳ vọng cấp mới và bổ sung các tình huống thực tế; suite cuối102 PASS. Unity lần đầu52/53 PASS, bài Play mới lỗi SetUp mở scene bằng Editor API sau domain reload vào Play; thêm guard rồi chạy lại53/53 PASS. Browser lần đầu so sánh trước khi POST tim cuối được xử lý (164 thay165); sửa chờ tổng tim authoritative và chạy lại PASS. Giữ `initial-unity-editmode.xml`, `initial-browser-report.json` để đối chiếu. Không còn lỗi kiểm thử đã biết trong phạm vi này.

Bước tiếp theo: khởi động lại Node nếu dùng tiến trình mã cũ, tải lại trang admin và chờ Unity import C#. Mở Cài đặt → TikTok & quà → Cấp tông môn, thêm dòng/sửa tim/quà rồi Lưu. Xác minh lượt tim LIVE thật/OBS khi streamer tự mở phiên LIVE. Không commit/push/reset/xóa dữ liệu.

---

# Tách test legacy khỏi lệnh mặc định — 07/11/2026

**Đã triển khai và kiểm thử**, theo yêu cầu giữ test `/song`/Three.js/preview cũ trong `test:legacy` khi Unity là client hiển thị chính.

- `npm.cmd test`: chỉ chạy19 file trực tiếp trong `test/`, gồm backend/gameplay, TikTok/quà/tim, API/WebSocket, save/restore, DEMO/LIVE, trang quản trị và công cụ PNG dùng cho Unity. Giữ audio/TTS nghe thử và network client của admin.
- `npm.cmd run test:legacy`: chạy9 file trong `test/legacy/`. Chuyển nguyên5 file visual-model/character-upgrade/sect-layout/breakthrough-visual/battle-visual; tách thêm phần renderer/camera/chất lượng/notice trong finishing, module/route `/song` và vendor, overlay quà, layout preview cũ. Các test backend trong foundation/battle-integration/live-integration vẫn giữ, chỉ chuyển các assertion về route hiển thị cũ sang legacy.
- `npm.cmd run test:all`: chọn cả hai nhóm Node. Runner `scripts/run-tests.js` liệt kê file trực tiếp theo thư mục để tránh tự khám phá đệ quy vào legacy; nhận test mới tự động và chuyển tiếp tùy chọn Node, không phụ thuộc wildcard của shell, không thêm dependency. Unity C#/Editor/Play Mode và browser smoke vẫn chạy riêng.
- Hai bài PNG giữ tại `test/asset-tools.test.js`. Các script browser legacy giữ đường dẫn hiện tại, chạy thủ công như trước, không tự thêm vào npm test. Cập nhật README và [docs/Tailieu_output/TEST_SUITES.md](docs/Tailieu_output/TEST_SUITES.md).

| Kiểm tra | Kết quả |
|---|---|
| Nhóm mặc định cuối cùng | **PASS94 / FAIL0 / SKIP1**, tổng95,19 file; `docs/Tailieu_output/test-suites/core-test.txt`. SKIP là LIVE thật |
| Nhóm legacy cuối cùng | **PASS21 / FAIL0**,9 file; `legacy-test.txt`. Lần đầu thiếu import CAMERA_MODES trong file vừa tách, đã bổ sung và chạy lại cả nhóm thành công; giữ log ban đầu `initial-legacy-test.txt` |
| Lệnh kết hợp/chuyển tiếp tùy chọn | **PASS**, `npm.cmd run test:all -- --test-name-pattern=05-14` nhận28 file và thực thi đúng hai bài settings/notice thuộc hai nhóm; `combined-selection-test.txt`. Đây là kiểm tra lựa chọn, không nhận là một lần chạy đầy đủ test:all; hai nhóm đã chạy đầy đủ riêng ở trên |
| Phân nhóm/bảo toàn bài test | **PASS**,95 core +21 legacy =116 bài, không trùng tên giữa hai nhóm;113 bài cũ được giữ hoặc tách nhỏ. Tăng3 do tách settings/notice, module admin/legacy và route legacy. Năm file chuyển nguyên giữ hash khi hoàn lại độ sâu import; mặc định không còn import renderer cũ hoặc assert route `/song` |
| Runtime và dữ liệu | **PASS886/886** file giữ hash, gồm root JS backend, package-lock/caidat, data thật/demo/backups, public và Unity Assets; `verification-report.json`. Chỉ sửa phân nhóm test, package scripts và tài liệu; không sửa gameplay/runtime hoặc dependency |
| Browser/Unity Editor/Play/build Windows/OBS/LIVE thật | **CHƯA KIỂM CHỨNG trong lượt này**; không chạy lại vì thay đổi chỉ ở tổ chức/lệnh kiểm thử, không lấy PASS npm thay cho kiểm tra Unity |

Evidence: `docs/Tailieu_output/test-suites/`. Bước tiếp theo: dùng `npm.cmd test` cho thay đổi backend/admin; chạy `test:legacy` khi cần hồi quy renderer cũ, Unity test riêng cho C#/scene/hiển thị. Không xóa `/song`, không commit/push/reset hoặc xóa dữ liệu.

---

# Cài đặt quà và mốc tim — phần 1 Qua_Tbao.md — 07/11/2026

**Đã triển khai và kiểm thử phần 1** của `docs/Tailieu/Qua_Tbao.md`. Phần 2 giọng AI và phần 3 cấp tông môn tùy chỉnh chưa triển khai trong lượt này.

- Đã kiểm tra thư viện/repository trước khi sửa: bản cài `tiktok-live-connector`2.5.0 có `fetchAvailableGifts()`, trả `id/name/diamond_count`. Đọc cả route `gift/list/`: phải có roomId nên gọi `fetchRoomId()` trước, không dựa vào ví dụ README thiếu bước này. Không thêm bảng ID/giá giả vào production.
- Quà → vật phẩm: bấm quà mở danh sách có tìm tên không dấu/ID/giá, hiển thị tên/xu/ID, chọn tự điền thông số. Có phân trang100 dòng, trạng thái rỗng/lỗi, Escape/giữ focus, dark/light và mobile. Lưu cả ID+tên; ánh xạ vẫn xét ID và đơn giá trước tên/dải giá. Giữ cấu hình cũ và các luật combo/chống trùng/quà chờ.
- Thêm `giftCatalog.js` và API `/api/tiktok/gifts`: chỉ lấy metadata qua HTTP, không mở WebSocket hoặc thay khóa/trạng thái LIVE; cache `data/tiktok-gifts.json`, giữ cache khi lỗi mạng, throttle30 giây/single flight. Không tải ảnh/asset hay thêm dependency. Network không nằm trong hàng đợi tick game.
- Hàng cài đặt `Tim | Số lượng | Quà/hành động`, thêm số lượng thưởng/cooldown: mặc định cũ điểm nhiệm vụ; chọn được năm vật phẩm. Bốn vật phẩm cá nhân thưởng từng đệ tử hiện có, qua inbox/túi/ItemService; Ban Phúc cộng đồng chỉ kích hoạt một lần/mốc, cộng số lượng×30 giây x2. Battle/paused/stopped giữ chờ đến tu luyện, pending giữ đúng loại qua restart/thay cấu hình. Save tương tác version1 chỉ thêm trường pendingBlessings tùy chọn, không đổi schema người chơi hoặc envelope WS. Nguyên lực cấp1/2/3 vẫn theo1.000/3.000/5.000 riêng, không đổi thiết lập cấp tông môn.
- Cập nhật `GAME_DESIGN.md`, overlay Three.js để thông báo đúng loại thưởng, thêm hướng dẫn và evidence theo vị trí yêu cầu: [docs/Tailieu_output/QUA_TBAO_PHAN1.md](docs/Tailieu_output/QUA_TBAO_PHAN1.md).

| Kiểm tra | Kết quả |
|---|---|
| Node regression cuối cùng | **PASS112 / FAIL0 / SKIP1**, tổng113;9 bài mới trong `test/gift-settings.test.js`; `docs/Tailieu_output/qua-phan1/npm-test.txt`. SKIP là LIVE thật |
| API connector/catalog/mapping | **PASS**, chạy đúng class/route connector cài sẵn với HTTP response fixture; cache/restart/lỗi mạng/throttle/single flight, ID+tên và legacy rules, API/save/restart/tách DEMO-LIVE, không gọi connector LIVE |
| Phần thưởng tim | **PASS**, tất cả item, cooldown/chống trùng, giữ pending battle/pause/restart, Ban Phúc cộng đồng không nhân số người, đổi cấu hình không đổi thưởng cũ, overflow giữ chờ, nguyên lực vẫn tăng |
| Browser chức năng mới | **PASS**, Chrome156.0.8078.81, server thật/profile và data tạm, chỉ HTTP TikTok là fixture. Tìm tên/ID/giá, Đ→d, text an toàn, Escape, thêm/xóa/chọn/lưu/reload/bản nháp, quà/replay/tim; desktop1366 và mobile390, sáng/tối; `browser-report.json` và ảnh trong `docs/Tailieu_output/qua-phan1/` |
| Browser hồi quy5 trang | **PASS**, các cài đặt, điều khiển demo, xác nhận restore/reset trên data tạm, kết nối transport giả/khóa chỉ RAM, responsive1920/1366/900/390; `admin-browser-report.json` |
| Bảo toàn | **PASS735/735** file trong kiểm tra trước/sau lượt browser cuối: data thật/demo/backups, caidat/package/lock và toàn bộ Unity Assets; `preservation-report.json`. Không sửa scene/prefab/C# Unity, không commit/push/reset/xóa dữ liệu |
| LIVE thật / catalog từ phòng TikTok thật | **CHƯA KIỂM CHỨNG**, chưa có phiên LIVE hợp lệ được cung cấp. Các ID990001… trong ảnh chỉ là fixture kiểm thử, không đưa vào dữ liệu production |
| Unity Editor/Play/build Windows, OBS, tải/FPS | **CHƯA KIỂM CHỨNG trong lượt này**; không lấy kết quả lịch sử thay kiểm tra mới |

Các lần kiểm tra đầu:4 lỗi thiết lập test mới (constructor connector cần object options, test gọi nhầm phương thức join) đã sửa,9/9 PASS. Chrome trong sandbox timeout CDP trước mở trang, đã chạy lại bằng hồ sơ tạm với quyền thực thi phù hợp. Browser phát hiện Escape trong ô search mặc định chỉ xóa tìm kiếm, đã thêm đóng dialog rõ ràng và kiểm tra lại PASS. Smoke cũ dùng `.ui-dialog` lấy nhầm hộp chọn quà thay hộp xác nhận, đã đổi locator theo `#dialog-confirm` và toàn bộ smoke PASS. Không còn lỗi kiểm thử đã biết trong phạm vi này.

Bước tiếp theo: khởi động lại Node nếu đang dùng tiến trình mã cũ, mở **Cài đặt → TikTok & quà**, bấm quà → nhập kênh LIVE → **Tải từ TikTok**, chọn/lưu ánh xạ. Xác minh tải catalog/nhận quà và tim bằng phiên LIVE thật khi streamer tự mở LIVE. Không tự chuyển sang phần2/3.

---

# Nâng mây/sét và cân kích thước ba nhân vật — 07/11/2026

**Đã chỉnh trong `SectScene_Concept02` và hai prefab Character_1/2**, theo yêu cầu nâng vùng mây/sét một chút và dùng mẫu3 làm chuẩn kích thước.

- `05_Tribulation/Breakthrough seat/StormFX` tăng local Position Y từ0 lên**0.3**, tương đương30px trong khung1080×1920. Mây và cả bốn frame sét cùng đi lên, giữ tương quan; ghế đài, beam, camera, HUD và mọi child Transform không đổi.
- Thu nhỏ đồng đều root prefab Character_1 về**0.66719069**, Character_2 về**0.674967323**. Giữ toàn bộ Scale/Position con đã chỉnh, nên hình/tên/aura/bóng giảm cùng nhau; không kéo méo PNG. Character_3 giữ nguyên byte và root Scale**1.0354** đã có sẵn. Không thay ghế hoặc lựa chọn ngẫu nhiên/pool.
- Dùng chiều cao nội dung alpha≥32 của pose meditation, tính cả root Scale thực của mẫu3. Đo trực tiếp trên instance trong Unity: cả ba khoảng**1.33721912 world units**, sai số dưới0.001. Lần kiểm tra render đầu đã phát hiện phép tính ban đầu bỏ sót root1.0354 của mẫu3; đã hiệu chỉnh rồi import/đo/render lại. Các pose khác dùng cùng hệ số đồng đều, không đổi sprite/tỉ lệ ảnh.
- Scene chỉ đổi một giá trị Y của StormFX; mỗi prefab1/2 chỉ thêm ba override root Scale. Kiểm tra loại các override mới khỏi YAML khôi phục đúng từng byte cũ; Body Scale và mọi nội dung khác giữ nguyên. Thêm helper Editor `Concept02SizeVerification` để đo và xuất ảnh, không chạy trong gameplay, không save người chơi mẫu.

| Kiểm tra | Kết quả |
|---|---|
| Unity compile và suite liên quan | **PASS14/14**, gồm4 Concept02,3 variants và7 storm; `docs/unity-size-refinement/editmode.xml`; chạy trên đúng prefab cuối cùng |
| Editor Play Mode | **PASS**, hai bài Enter/ExitPlayMode thực; pooling/giữ Scale và độ kiếp/mây/sét/disconnect vẫn hoạt động |
| Kích thước thực sau import | **PASS**, ba mẫu cùng chiều cao alpha1.33721912, mẫu3 không đổi; `unity-size-report.json` |
| GPU | **PASS**, NVIDIA Quadro M1000M/Direct3D11;7 ảnh trước/sau ở1080×1920/720×1280, gồm ba mẫu cùng hàng, cảnh10 người và mây/sét. Frame03 tại1890ms dùng để xem tia sét đang sáng; ảnh trước/sau chỉ thay tạm root StormFX để so sánh, không save |
| Bảo toàn | **PASS**, `verification-report.json`; data/Main/mẫu3/asset và meta/backend/package/settings giữ hash. Chỉ một Y trong scene và sáu giá trị scale mới ở hai prefab được thay |
| Node regression | Không chạy lại vì chỉ đổi layout/prefab và helper Editor;103 PASS/1 SKIP của lượt trước là evidence lịch sử |
| Windows build/executable, OBS, LIVE thật, tải/FPS | **CHƯA KIỂM CHỨNG** cho lượt chỉnh bố cục này |

Hướng dẫn vị trí chỉnh và Scale cập nhật trong [docs/UNITY_CONCEPT02.md](docs/UNITY_CONCEPT02.md). Bước tiếp theo: mở lại scene ngoài Play Mode, chờ import rồi Play; không cần khởi động lại Node cho thay đổi hình ảnh này. Không đổi prefab3, dữ liệu, backend hoặc runtime gameplay; không dừng Editor người dùng, commit/push/reset/xóa dữ liệu.

---

# Bảng và cơ chế Ban Phúc — 07/11/2026

**Đã triển khai và kiểm thử theo `docs/UI_BANPHUC.md` trong `SectScene_Concept02`.** Yêu cầu mới thay quy tắc cộng nhiều Ban Phúc thành x4/x6: giờ giữ một Ban Phúc x2 và cộng thời gian; GAME_DESIGN.md đã cập nhật rõ thay đổi này. Trà/linh căn và giới hạn cộng hệ số giữa các nguồn khác nhau giữ nguyên.

- Bảng340×200 ngay dưới Thiên Đạo Thông Cáo, mặc định ẩn; tám PNG nguyên byte từ `public/assets/02/UI/UI_BANPHUC/` chuyển vào `Assets/Art/SectConcept02/UI/Blessing/`. Chữ BAN PHÚC/x2 tốc độ tu luyện/Còn lại:mm:ss dùng TMP; fill thu ngắn từ trái. Thiếu `ui_blessing_ornaments.png` trong nguồn nên thay hai điểm trang trí bằng hình thoi Image Unity; concept BanPhuc.png chỉ tham chiếu, không dùng làm ảnh ghép sẵn.
- Node ItemService quản lý một buff toàn tông môn x2; mỗi lần dùng Ban Phúc cộng30 giây. Còn20 giây nhận thêm thành50 giây, tổng duration của đợt thành60 để vẽ thanh50/60. Quà được ánh xạ Ban Phúc giữ luồng inventory/activation/chống trùng/combo/chờ nhập môn/battle hiện có. Mỗi lần lên cấp1→2 hoặc2→3 cộng30 giây, vượt hai cấp cùng lúc cộng60; cấp3 đầy MAX không nhận thêm.
- Chỉ giảm thời gian trong tu luyện; battle/pause/stopped/offline giữ nguyên. Người nhập môn khi còn buff cũng hưởng. Snapshot thêm `interactions.blessing = {remainingMs,durationMs,multiplier:2}`; Unity chỉ đọc để bật bảng/đồng hồ/fill, không tự tính buff hoặc countdown. Hết hạn, snapshot cũ thiếu trường, disconnect thì ẩn.
- Save schema2 và interactions version1 giữ nguyên: thêm durationMs tùy chọn trong globalBuffs, gộp các Ban Phúc save cũ thành một x2 với tổng remaining; không xóa người chơi, mất thời gian buff hoặc phát lại thưởng cấp đã đạt. DEMO/LIVE tách riêng. Điểm nhiệm vụ/cooldown wish không đổi. Event mới blessing:activated dùng game:event hiện hữu.
- Scene ghép có guard: chỉ đổi2 document UI hiện hữu (component/child của Canvas), thêm63 document UI; mọi byte ngoài UI giữ nguyên. Không rebuild scene hoặc sửa prefab/Transform nhân vật. Menu mở scene đã có vẫn giữ chỉnh sửa người dùng.

| Kiểm tra | Kết quả |
|---|---|
| Node regression | **PASS103 / FAIL0 / SKIP1**, tổng104; `docs/unity-blessing/npm-test.txt`. SKIP=LIVE thật |
| Business/API/WebSocket/save | **PASS**,7 bài mới: x2/cộng30s, tu vi thực và nguồn Trà/linh căn, người mới, quà combo/dedup/chờ, lên cấp/burst/MAX, đóng băng/expiry chính xác, legacy/restart, DEMO/LIVE và commit/API/WS trên dữ liệu tạm |
| Unity compile và suite theo phạm vi | **PASS55/55**, gồm10 trường hợp Ban Phúc mới +45 Concept02/variants/HUD/storm/protocol; `editmode.xml`; không nhận toàn bộ103 bài Unity PASS |
| Editor Play Mode | **PASS**, ba bài Enter/ExitPlayMode thực; Ban Phúc hiển thị/gia hạn/hết hạn/kích hoạt lại/disconnect, các luồng nhân vật/HUD/mây/sét trước đó vẫn qua kiểm thử |
| GPU render | **PASS**, NVIDIA Quadro M1000M/Direct3D11, xuất11 ảnh; đã xem các ảnh chính1080×1920 và720×1280,30s/15s/50s/lên cấp/pause/battle/hết hạn. Bảng nằm dưới thông cáo, chữ rõ, sen/sao/khung/đồng hồ/fill đúng |
| Bảo toàn | **PASS222/222** file trước phiên được bảo vệ, gồm data/Main/prefab/ảnh và meta cũ/public JS/package/settings; tám PNG mới giữ hash nguồn, import Texture2D. `verification-report.json`, `scene-upgrade-report.json` |
| Windows build/executable, OBS, LIVE thật, tải/FPS | **CHƯA KIỂM CHỨNG** cho thay đổi này. Nhóm CharacterTests cũ thiếu SectScene_Editable vẫn là giới hạn đã ghi ở lượt trước, không chạy lại để nhận PASS |

Lỗi đã sửa trước nghiệm thu: validator duration ban đầu coi null như thiếu; đã phân biệt và toàn bộ Node PASS. Lần Unity đầu54/55 vì ảnh mới bị import Cubemap, không tạo Texture2D reference; đã đặt rõ Texture2D, thêm guard thiếu texture, gán lại đủ tám ảnh và kiểm tra importer/reference trong test; chạy lại55/55 PASS rồi render GPU. Evidence lần đầu ở `initial-editmode.xml`. Không tải package/asset hoặc đổi Editor để sửa.

Hướng dẫn [docs/UNITY_BANPHUC.md](docs/UNITY_BANPHUC.md), cập nhật `docs/UNITY_CONCEPT02.md` và `docs/UNITY_WEBSOCKET.md`. Bước tiếp theo: khởi động lại Node, mở lại scene ngoài Play Mode rồi Play; trong DEMO đang tu luyện chọn Ban Phúc ở Túi đồ, cấp1 và dùng để thử. Không reset dữ liệu nếu tông môn đã MAX. Kiểm thử dùng project validation và data tạm; không dừng Editor người dùng, commit/push hoặc xóa dữ liệu.

---

# Fill nguyên lực và PNG mây/sét độ kiếp — 07/11/2026

**Đã triển khai và kiểm thử trong phạm vi `SectScene_Concept02`.** Dùng lại đúng PNG đã có trong `Assets/Art/SectConcept02/`, không tải tài nguyên mới hoặc đổi backend/gameplay.

- `Header/EnergyFill` dùng `ui_progress_fill.png`, crop theo tiến độ server như trước. Sửa lỗi lớp fill nằm dưới phần tâm tối đục của ProgressFrame: fill được vẽ trên khung, căn trong viền và giữ neo trái. Kiểm tra650/1.000,1.500/3.000 và5.000/5.000 MAX; mất dữ liệu thì ẩn fill.
- Thêm `05_Tribulation/Breakthrough seat/StormFX`, gồm StormCloud và Lightning_01…04. Mây dùng `fx_cloud_storm.png`; bốn frame sét dùng đúng `fx_lightning_01.png` đến `fx_lightning_04.png`. Căn theo vùng alpha nội dung vì canvas nguồn khác nhau, scale đồng đều, không sửa/import lại PNG. Transform chỉnh trực tiếp trong scene, gắn theo ghế đài.
- `TribulationController` nhận các renderer tùy chọn: Concept02 dùng PNG, prefab/scene cũ giữ mây/sét procedural. Mỗi cửa sổ sét180ms hiện hữu chia bốn frame45ms, theo elapsed/duration/lightningCount từ server. Pause giữ frame; reconnect lấy đúng thời điểm; kết quả thành/bại, battle và disconnect tắt mây/sét. Thiếu bộ frame thì fallback procedural; tắt component giữ FX tắt cả khi manager còn gọi Sample. Không tạo object mỗi frame, không đổi lịch độ kiếp, xác suất hoặc sát thương.
- `Concept02StormSetup` chỉ nâng cấp bản sao validation, không rebuild scene người dùng. Scene production ghép có guard: chỉ sửa3 document UI, thêm reference PNG vào override TribulationFX, thêm child vào ghế đài và17 document FX mới. Mọi document khác giữ nguyên byte; prefab procedural dùng chung không bị sửa. Menu tạo scene mới cũng có cấu hình này, mở scene đã có vẫn giữ chỉnh sửa người dùng.

| Kiểm tra | Kết quả |
|---|---|
| Unity compile và suite đúng phạm vi | **PASS45/45**:7 bài storm mới +38 bài Concept02/variants/HUD/protocol; `docs/unity-storm/editmode.xml` |
| Editor Play Mode | **PASS**, hai bài Enter/ExitPlayMode thực: nhân vật/HUD/ritual hiện hữu; PNG sét giữ frame02-index khi pause, kết quả/disconnect tắt FX |
| Lịch/frame/fallback | **PASS**, đủ frame01→04, tắt giữa các đợt, đợt thứ2 theo server count, reconnect không phát lại từ đầu, pause/battle/success/failure/disconnect; prefab procedural được thử trực tiếp và vẫn chạy đúng |
| Node regression | **PASS96 / FAIL0 / SKIP1**, tổng97; `docs/unity-storm/npm-test.txt`. SKIP là LIVE thật; backend không thay đổi |
| GPU render | **PASS**, NVIDIA Quadro M1000M/Direct3D11; đã xem10 ảnh, gồm bốn frame sét, mây giữa các đợt, ba mức nguyên lực, disconnect và720×1280; phần còn lại1080×1920 |
| Bảo toàn | **PASS238/238** file được bảo vệ, gồm data/Main/prefab nhân vật/prefab procedural/PNG và meta/backend/public JS/package/settings. `docs/unity-storm/verification-report.json`, `scene-upgrade-report.json` |
| Nhóm CharacterTests cũ phụ thuộc `SectScene_Editable.unity` | **FAIL thiết lập27 trường hợp** trong lần thử mở rộng đầu vì scene này không có trong repository nguồn; runtime của nhóm đó **CHƯA KIỂM CHỨNG**. Không tạo lại scene/asset cũ để thay bố cục người dùng. Đã kiểm tra tương thích controller trực tiếp trên prefab procedural trong suite45/45 |
| Build Windows/executable, OBS, LIVE thật, tải/FPS cho thay đổi này | **CHƯA KIỂM CHỨNG** |

Lần đầu suite mở rộng có41 PASS/30 FAIL (`initial-editmode.xml`):27 lỗi thiếu scene cũ và3 lỗi test disable/SetUp vào Play Mode. Đã sửa test/guard disable và chạy lại suite45/45 thành công; không nhận toàn bộ93 bài Unity PASS. PowerShell chặn npm.ps1 nên dùng npm.cmd để chạy regression thành công. Kiểm thử/render trên bản sao `test-results/unity-concept02/project`, không dừng Editor đang mở hoặc lưu người chơi mẫu vào scene.

Hướng dẫn: [docs/UNITY_CONCEPT02.md](docs/UNITY_CONCEPT02.md). Bước tiếp theo: mở lại `SectScene_Concept02` ngoài Play Mode, chờ Unity import, rồi Play; dùng tim và chuẩn bị độ kiếp DEMO để xem hiệu ứng. Không cần thay backend cho lượt này. Không commit/push/reset/xóa dữ liệu.

---

# TOP 3 cảnh giới và nguyên lực tông môn — 07/11/2026

**Đã triển khai và kiểm thử** cho `SectScene_Concept02`, theo xác nhận ngưỡng tim riêng từng cấp và tối đa cấp3. Kết quả dưới đây thay thế giới hạn HUD chưa nối dữ liệu ở lần dựng scene ban đầu.

- Bảng Thiên Đạo Thông Cáo hiển thị TOP3 toàn bộ người chơi trong snapshot, kể cả ngoài pool nhân vật đang thấy: cảnh giới → tiểu cảnh giới → tu vi giảm dần, userId tăng dần khi bằng nhau. Tên/cảnh giới cập nhật từ server, ba icon vàng/bạc/đồng lấy UV từ `Assets/Art/SectConcept02/UI/ui_rank_icons.png`; không sửa PNG hoặc phát thưởng xếp hạng.
- Node quản lý nguyên lực: cấp1 cần1.000 tim lên2, cấp2 thêm3.000 lên3, cấp3 thêm5.000 đầy MAX; tổng9.000, tim dư chuyển tiếp, không có cấp4. Chỉ cộng tim sau đối soát delta/tổng và chống trùng hiện hữu, kể cả lúc battle/paused. Ban Phúc/cooldown/phần thưởng cũ giữ nguyên, chưa thêm lợi ích gameplay theo cấp.
- Snapshot bổ sung trường tùy chọn `interactions.sectEnergy`; save tương tác version1/schema2 bổ sung cấp/tiến độ tùy chọn, tách DEMO/LIVE và khôi phục sau restart. Save cũ khởi đầu tiến độ cấp1/0, không xóa người chơi. Unity chỉ đọc dữ liệu và crop fill theo tỷ lệ; server cũ chưa có trường thì hiển thị `-- / -- TIM`.
- Scene chỉ đổi các document thuộc `07_UI`:19 document cũ và12 document mới; tinh chỉnh tiếp sáu vị trí hàng/icon để chữ không chạm đường trang trí. Mọi document ngoài UI giữ nguyên byte.52 file được bảo vệ (Main, dữ liệu, prefab/tỷ lệ đã chỉnh, artwork nguồn) giữ hash; không chạy lại factory trên scene người dùng.
- Cập nhật `GAME_DESIGN.md`, `docs/UNITY_WEBSOCKET.md`, `docs/UNITY_CONCEPT02.md`; evidence tại `docs/unity-sect-hud/`. Fixture do Node tạo và bài API dùng thư mục dữ liệu kiểm thử riêng.

| Kiểm tra | Kết quả |
|---|---|
| Node regression | **PASS95 / FAIL0 / SKIP1**, tổng96; `npm-test.txt`. SKIP là LIVE thật. Bài API mới chạy riêng sau đó: **PASS1/1**, `api-test.txt` |
| API/WebSocket/save/restart và tách DEMO/LIVE | **PASS** với application/server thật, dữ liệu tạm; API và WS cùng xuất cấp2/1.500/3.000, đổi mode và restart giữ đúng tiến độ |
| Unity compile và suite theo phạm vi | **PASS38/38**, gồm7 trường hợp HUD mới,3 variants,4 Concept02 và24 protocol; `editmode.xml` |
| Editor Play Mode | **PASS** bằng Enter/ExitPlayMode thực trong UnityTest: snapshot ghi sẵn cập nhật TOP3/level2/fill50%, disconnect, nhân vật/ritual/beam và Transform sân vẫn đúng |
| GPU render cuối cùng | **PASS**, NVIDIA Quadro M1000M/Direct3D11; đã xem4 ảnh: cấp1/650, cấp2/1.500 và cấp3/MAX tại1080×1920, thêm cấp2 tại720×1280. Có icon1/2/3 và fill đúng; lần cuối chỉ tinh chỉnh vị trí sáu RectTransform sau suite38/38, sau đó compile/render lại thành công |
| Bảo toàn scene và dữ liệu | **PASS**, `preservation-report.json`, `scene-upgrade-report.json`, `row-spacing-report.json`;52 file giữ hash, ngoài UI không thay đổi |
| Windows build/executable, OBS, LIVE thật, tải/FPS cho thay đổi này | **CHƯA KIỂM CHỨNG**; không lấy kết quả build cũ làm bằng chứng cho mã mới |

Bước tiếp theo: khởi động lại server Node rồi mở `SectScene_Concept02` và Play Unity để nhận trường nguyên lực mới. Không dừng Editor của người dùng, không commit/push/reset hoặc xóa dữ liệu.

---

# Chọn ngẫu nhiên nhân vật Unity 1–3 — 07/11/2026

**Đã triển khai và kiểm thử** cho `SectScene_Concept02`: chọn ngoại hình ngẫu nhiên ổn định theo seed server, từ danh sách prefab chỉnh được trong Inspector.

- `CharacterManager.characterVariants`: danh sách mở rộng, đã gán3 prefab tại `04_Characters → Character Manager → Character Variants`. Snapshot/reconnect/độ kiếp không roll lại khi seed và danh sách không đổi. Danh sách trống/toàn None dùng `characterPrefab` cũ, bỏ qua ô None trong danh sách có mẫu hợp lệ.
- Pool tách theo prefab, giữ sprite/Transform/tỉ lệ/nameplate đã chỉnh của từng mẫu, không lấy nhầm visual của mẫu khác. Chỉ đổi instance khi người chơi đổi prefab được chọn; snapshot bình thường giữ instance.
- Scene chỉ thêm trường danh sách prefab vào YAML; giữ nguyên mọi byte khác của scene. Không chạy lại scene factory hoặc ghi đè các prefab đã được người dùng chỉnh. Main và7 file scene/prefab/meta được bảo vệ giữ hash; `docs/unity-character-variants/preservation-report.json`.
- Scene setup cho lần tạo mới cũng gán danh sách3 mẫu; thêm helper cấu hình chỉ được chạy trên project validation. Không đổi backend, protocol, schema/save, PNG, gameplay hoặc tự thêm nhân vật thứ4.
- Hướng dẫn thêm4+: ảnh trong `Assets/Art/SectConcept02/Characters/Character_4/`, duplicate/chỉnh prefab trong `Assets/SectConcept02/Prefabs/`, thêm vào ô Element3 của Character Variants rồi save scene ngoài Play. Không cần sửa C#. Thay số lượng/thứ tự catalog có thể đổi cách phân mẫu, chưa lưu ngoại hình vào backend.

| Kiểm tra | Kết quả |
|---|---|
| Unity compile và bộ kiểm thử chọn theo phạm vi | **PASS31/31**, gồm3 test variants mới,4 Concept02 và24 protocol; `docs/unity-character-variants/editmode.xml` |
| Editor Play Mode snapshot ghi sẵn | **PASS**;10 người sử dụng đủ3 bộ sprite, HUD/ritual/beam/disconnect đúng, Transform sân giữ nguyên |
| Ổn định/pool/khả năng mở rộng | **PASS**; cùng snapshot giữ instance,5 reconnect giữ ngoại hình và không tăng số instance đã tạo, fallback khi null/trống/None, append mẫu thứ4 tạm dùng được và giữ root Scale1.73 |
| Scene/prefab bảo toàn | **PASS**; scene chỉ thêm Character Variants,7 file Main/prefab/meta không thay đổi; các prefab1–3 được giữ cả chỉnh sửa tỉ lệ sẵn có |
| Build Windows/GPU capture/OBS/LIVE/FPS riêng cho bổ sung này | **CHƯA KIỂM CHỨNG**; không dùng kết quả build/ảnh ở lần tạo scene trước để nhận PASS cho mã mới |

Hướng dẫn mới ở [docs/UNITY_CONCEPT02.md](docs/UNITY_CONCEPT02.md), mục **Thêm nhân vật thứ4**. Bước tiếp theo: mở scene, chọn04_Characters để xem/chỉnh Character Variants; khi có bộ ảnh thứ4 thì thêm prefab vào danh sách. Không commit/push hoặc xóa dữ liệu.

---

# Scene Unity Concept 02 — 07/11/2026

**Đã tạo và kiểm thử scene mới `unity-client/Assets/Scenes/SectScene_Concept02.unity`**, dựa trên bản sao `SectScene_Main` và `public/assets/02/concept/1.jpg`, theo `docs/UNITY.md`. Giữ scene Main và các thay đổi trước phiên; không chuyển giai đoạn gameplay, commit/push hoặc đổi Build Settings.

- Sao chép **39 PNG** nguyên byte vào `Assets/Art/SectConcept02/{Background,Architecture,Effects,Characters,UI}`. Chuẩn hóa riêng tên bản sao `ui_cultivation_icon.png.png`; có audit/hash/alpha bounds. Unity dùng tài nguyên trong Assets, không đọc ảnh từ public khi chạy.
- Tạo **15 lớp mesh đã bake** và material riêng trong `Assets/SectConcept02/`, ghép trời/núi/mây, đài/thác/sân/cành đào, pháp trận vàng/cyan, beam, hạt/cánh hoa. Giữ phối cảnh PNG, khung1080×1920 tràn viền; bỏ cổng/chùa/footer/placeholder cũ trong bản scene mới. Camera không auto-fit/drift làm co sân.
- UI Canvas1080×1920, TextMeshPro độc lập; header atlas tách bằng UV, UI bỏ padding alpha rất mờ bằng bboxalpha≥32+8px. Beam/vòng vàng căn vào mặt đài, hoa giảm kích thước/opacity sau khi xem render GPU.
- Ba prefab variant `Character_1…3` dùng đủ4 pose meditation/fly/attack/celebrate; idle/rear/pose thiếu fallback meditation. Prefab/nameplate chỉnh Inspector; manager mặc định dùng Character_1, chưa mapping nhiều ngoại hình theo userId. Scene lưu không có người chơi giả; ảnh3 mẫu chỉ là preview tạm không save.
- Kế thừa network/manager/pool/12 ghế/điểm độ kiếp/ritual/camera từ Main; căn ghế theo sân mới. `Concept02Hud` chỉ đọc snapshot: trạng thái, RemainingMs, kết nối, số đệ tử, người độ kiếp; beam chỉ bật trong Play khi có độ kiếp server. Không tự đếm clock, roll, tính gameplay hoặc ghi dữ liệu.
- Menu `Tu Tien LIVE/Concept 02/Open or create new scene` mở/verify khi đã có, không rebuild/ghi lại bố cục. Từ chối scene chưa lưu và từ chối ghi đè resource khi scene bị thiếu. Capture cũng từ chối bỏ thay đổi scene chưa lưu. Helper recreate chỉ chạy được trong đúng project validation riêng.

| Kiểm tra | Kết quả |
|---|---|
| Unity6000.5.9f1 compile/import/reference | **PASS**; importer Texture2D/Sprite/FullRect/PPU100, không mipmap/compression, asset và script reference hợp lệ |
| Scene/prefab/idempotence + protocol | **PASS28/28**, gồm4 bài mới và24 bài NetworkProtocolTests hiện hữu; `docs/unity-concept02/editmode.xml`. Đây là bộ chọn theo phạm vi, không nhận toàn bộ76 bài Unity đã chạy |
| Editor Play Mode với snapshot ghi sẵn | **PASS**;10 người/PNG mới, giữ Transform sân, HUD cập nhật, độ kiếp/beam, disconnect trả về chờ và trả visual về pool; nằm trong bài UnityTest thực sự Enter/ExitPlayMode |
| GPU render | **PASS**, NVIDIA Quadro M1000M/Direct3D11; đã xem1080×1920,720×1280 và ảnh3 mẫu nhân vật; `docs/unity-concept02/concept02-*.png` |
| Node regression | **PASS91 / FAIL0 / SKIP1**, tổng92; `docs/unity-concept02/npm-test.txt`. SKIP=LIVE thật |
| Bảo toàn | **PASS533/533** file được bảo vệ, gồm Main/scene/prefab/script cũ/backend/data;39/39 PNG nguồn và Unity khớp SHA256. `docs/unity-concept02/preservation-report.json` |
| Build Windows cho scene này | **PASS Succeeded**,0 error/0 warning,323702586bytes; `docs/unity-concept02/build-report.json`. Output kiểm thử riêng trong `test-results/unity-concept02/project/Builds/Concept02/`; chưa chạy executable |
| Executable Windows thực, OBS, LIVE, ngâm tải/FPS, thao tác kéo thả trên Editor chính | **CHƯA KIỂM CHỨNG**; không suy từ import/Play fixture/ảnh tĩnh |

Giới hạn đúng phạm vi: backend chưa có trường nguyên lực tông môn như concept nên fill inactive, không giả650/1000; NoticePanel đang dùng trạng thái/kết nối/roster/độ kiếp, chưa là TOP3 chiến trường. Thiếu halo xanh riêng thì bỏ qua theo tài liệu. Mây sét/4 PNG sét/rank/fill đã import để dùng tiếp, chưa nối thành runtime mới; sét procedural kế thừa được giữ. Thác hiện là PNG tĩnh. Không thay Node/TikTok/WS/DTO/gameplay/data/Three.js hoặc project Unity cũ.

Hướng dẫn: [docs/UNITY_CONCEPT02.md](docs/UNITY_CONCEPT02.md). Kiểm thử chạy trong `test-results/unity-concept02/project`, chuyển161 file asset/scene qua script có guard, giữ GUID nguồn. Bước tiếp theo: người dùng mở scene mới để review/chỉnh bố cục; chỉ triển khai HUD/FX/gameplay bổ sung khi được yêu cầu.

---

# Xưởng nhân vật và hướng dẫn Canvas — 07/11/2026

Phạm vi: dựng thử sprite trước, dùng prefab cho server về sau. Không sửa gameplay, backend, WS, dữ liệu hay scene SectScene_Editable. Không commit/push. Giữ toàn bộ thay đổi chưa commit của lượt refactor trước.

- Thêm `Scripts/Characters/CharacterWorkshop.cs`: số lượng 0–100, danh sách riêng tên/subtitle/aura/pose/bảy sprite từng người; pose thiếu fallback idle, idle bắt buộc khi Generate; giảm count giữ đầu vào. Runtime chỉ animate pose/aura/name, không ép root Transform về ghế mỗi frame, không tạo player backend.
- Thêm `Editor/CharacterWorkshopEditor.cs`: Inspector có Resize/Generate/Clear với Undo, chỉ tạo lại khi bấm; không đụng con không được đăng ký. Menu `Tu Tien LIVE/Characters/Open Character Workshop` tạo mới một lần hoặc mở scene có sẵn, không rebuild scene cũ. Không tự save/discard scene chưa lưu của người dùng.
- Thêm `Assets/Scenes/CharacterWorkshop.unity`: bản sao môi trường có GameObject `04_Characters/Character Workshop - select me`, ba instance mẫu; NetworkClient/CharacterManager/roster server tắt riêng trong scene này.
- Thêm `Assets/SceneAuthoring/Prefabs/CharacterSample.prefab`: variant tương thích CharacterView, giữ Body/Shadow/Aura/Burst hiện có; thêm Canvas World Space + Image nền + TextMeshProUGUI, nameLabel serialize đúng. TMP 3D cũ chỉ inactive trong mẫu. Không thay PNG/prefab production.
- Thêm `Editor/CharacterWorkshopVerification.cs`, `Tests/Editor/CharacterWorkshopTests.cs`; bổ sung `docs/UNITY_CHARACTER_WORKSHOP.md`, README và evidence `docs/unity-character-workshop/`.

| Kiểm tra | Kết quả |
|---|---|
| npm test baseline và sau sửa | PASS 91, FAIL 0, SKIP 1 (LIVE thật), tổng 92; bằng chứng lượt sau npm-after.txt |
| Unity compile / toàn bộ EditMode suite | PASS 72/72 trên Unity 6000.5.9f1, project validation; editmode.xml |
| Play Mode xưởng không server | PASS, chuyển fly/cập nhật tên, ba instance, NetworkClient disabled |
| Nhập liệu / fallback / tạo lại | PASS: count clamp, giữ tên/input khi giảm rồi tăng, sprite thiếu dùng idle, hai lần Generate vẫn ba child; root/nameplate Transform không bị reset bởi Sample |
| Scene/prefab đã serialize | PASS: scene được mở từ disk và reference/ba instance hợp lệ trong test |
| GPU render 9:16 | PASS: workshop-1080x1920.png, đã xem trực tiếp ba sprite và Canvas nameplate |
| Windows build riêng cho bổ sung này / thao tác kéo thả thủ công trong Editor chính / mapping nhiều ngoại hình theo userId | CHƯA KIỂM CHỨNG / CHƯA TRIỂN KHAI mapping; không nhận PASS từ kết quả build lượt refactor trước |

Giới hạn: Generate thay thế instance đã tạo trong xưởng, vì vậy chỉnh riêng trên instance cần lưu prefab trước khi Generate lại. 12 ghế đầu theo scene, phần dư dùng lưới thử có thể ngoài khung. Không tự áp dụng prefab mẫu vào scene server; người dùng có thể gán CharacterSample vào CharacterManager.characterPrefab để dùng một mẫu chung. Chưa có ánh xạ bộ sprite khác nhau theo userId. HUD thật còn TextMesh, chưa tự đổi toàn bộ sang Canvas; binder footer TextMesh không nhận TMP UI trực tiếp. Hướng dẫn Canvas Screen Space/World Space và lộ trình gán prefab có trong tài liệu mới.

---
# Unity refactor — Scene / Prefab / Inspector authoring — 07/11/2026

**Đã refactor và kiểm thử. Scene làm việc mới: `unity-client/Assets/Scenes/SectScene_Editable.unity`.** Chỉnh Temple/đối tượng bằng native Transform rồi Ctrl+S; scene mới không reset layout từ tọa độ pixel lúc Play/reopen. Không ghi đè scene/prefab gốc, không thay Node/TikTok/gameplay/data/WS; không commit/push tự động.

## Khảo sát, backup và phạm vi

- Đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, toàn bộ166 YAML document của SectScene.unity, SectSceneSetup/SectLayer/SectSceneController/SectTextLayout/CameraRig và các controller nhân vật/FX/bàn giao03–04. Baseline npm91 PASS/0 FAIL/1 SKIP. 63 bài Unity của bước04 đã PASS ở lượt bàn giao trước; lần này68 bài kiểm tra cả scene migration mới.
- Đầu phiên main có sẵn thay đổi ProjectAuditorSettings.asset; giữ nguyên bytes, không reset/commit. Editor người dùng đang mở nên test/migration/build chạy trong bản sao validation, không đóng Editor hoặc bỏ scene chưa lưu.
- Backup scene/prefab cũ trước thay đổi ở docs/unity-scene-authoring/backup; migration menu cũng backup source+.meta vào unity-client/SceneAuthoringBackups/<timestamp> trước lần tạo scene mới. Folder backup local được ignore. Bản gốc trong Assets giữ nguyên SHA-256.
- Manifest418 file kiểm tra:23 thay đổi có chủ đích trong presentation/Editor/tests/Unity package/build-scene list; không có thay đổi ngoài phạm vi. public/PNG, backend rootJS, data, network/protocol/DTO, original scene/prefabs và bytes ProjectAuditorSettings đều giữ nguyên. README/docs/PROGRESS được cập nhật ngoài manifest.

## Thay đổi bàn giao

| File/nhóm | Thay đổi |
|---|---|
| Assets/Scenes/SectScene_Editable.unity +.meta | Copy an toàn từ scene gốc;9 nhóm Environment,Architecture,Formation,Characters,Tribulation,Effects,UI,Systems,Camera. Tái sử dụng18 layer/camera/12 ghế/điểm đài/placeholder, không tạo renderer PNG trùng |
| Assets/SceneAuthoring/* |18 mesh quad đã bake, prefab variant CharacterPrefab, TMP font/settings, font/shader/OFL từ TMP Essential Resources đi kèm SDK Unity; giữ mọi PNG gốc |
| Scripts/Presentation/TransformOffset.cs | Cộng offset animation vào pose gốc của Transform, rebase khi chỉnh trực tiếp, restore khi disable; không là game state |
| Scripts/Scenes/SectLayer.cs | Mode sceneAuthored dùng Transform + baked mesh + sorting MeshRenderer; không gán Position Pixels/Uniform Scale/rotation0 trong scene mới. Opacity/quality/motion vẫn Inspector/code presentation |
| Scripts/Scenes/{CameraRig,SectSceneController,SectTextLayout}.cs | Giữ camera pose/scale, drift cộng thêm, optional auto-fit; không chạy animation Edit Mode tự động. Text autoFit tắt sau migration; fit chỉ khi người dùng gọi rõ |
| Scripts/Scenes/{SectSceneBindings,SectCharacterBootstrap}.cs | Reference manager/network/HUD/ritual/camera/groups serialize; bootstrap chỉ lookup tương thích, không tự tạo hệ thống khi Play |
| Scripts/Characters/{CharacterManager,CharacterView,CharacterPoseController,RealmAuraController}.cs | Pool parent serialize; nameplate TMP chỉnh Inspector, không tự đặt scale/vị trí text; body/aura/burst cộng offset vào Transform hiện có |
| Scripts/Effects/TribulationController.cs | RootFX đặt sẵn dưới điểm đài, không gán lại vị trí root mỗi frame; timing/outcome vẫn đọc backend |
| Editor/{SectSceneAuthoringMigration,SceneAuthoringVerification}.cs | Menu migration idempotent/verify và QA scene-copy Play/build; không xóa hoặc overwrite asset cũ |
| Editor/{SectSceneSetup,CharacterSceneSetup,SectLayerEditor,SectPlayModeTest,CharacterPlayProbe,CharacterScreenshotTest}.cs | Setup cũ chuyển migration khi asset đã có; retire destructive rebuild; Move Tool native cho scene mới; probe/capture đọc scene mới, evidence vào folder mới |
| Tests/Editor/* |5 test authoring mới; cập nhật test cũ từ pixel-layout sang native Transform và scene mới; protocol/gameplay test giữ |
| Packages/manifest.json,packages-lock.json và asmdef | Thêm uGUI2.5.0/TMP, đúng Unity6000.5; các dependency module chuẩn UI/audio/physics2D của gói. Không nâng URP hoặc Editor |
| ProjectSettings/EditorBuildSettings.asset | Thêm editable scene đầu danh sách, giữ cả3 scene cũ |
| scripts/unity-authoring-{sync,smoke,compare}.js | Transfer chỉ asset mới có GUID mapping/guard, smoke Node DEMO tạm, đo diff PNG không chỉnh ảnh |
| Docs/README/.gitignore | UNITY_SCENE_AUTHORING.md, evidence folder, banner lịch sử tài liệu03/04, hướng dẫn mở đúng scene, ignore backup local |

**TMP:** built-in LegacyRuntime không cung cấp font face cho FontEngine ở môi trường này. Nameplate dùng LiberationSans/OFL và shader được đóng gói trong SDK uGUI đã cài; không tải font/art từ web/Asset Store. HUD tĩnh giữ font cũ. Có khác biệt raster chữ TextMesh→TMP được đo riêng, không thay mặt/tóc/trang phục hoặc pixel PNG.

## Kết quả thực tế

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| npm baseline và sau sửa | **PASS91 / FAIL0 / SKIP1**,92 bài cả hai lượt | npm-baseline.txt/npm-after.txt; SKIP=LIVE thật |
| Compile và EditMode cuối | **PASS68/68** | final-editmode.xml, trên đúng asset/GUID đã chuyển về project chính.63 bài hiện có+5 authoring; test cũ cập nhật assertion pixel→Transform |
| Native edit/save/reopen | **PASS** | Temple position/rotation/scale,opacity,sorting,text scale qua Sample/save/reopen; camera custom pose/manual size; prefab pose/nameplate offsets |
| Reference/missing scripts | **PASS** |9 groups, manager,prefab variant,7 sprite poses,TMP font,pool,seats,network,HUD,ritual,baked meshes/material; strengthened Verify cuối PASS |
| Idempotence | **PASS** | Gọi migration2 lần không tăng số GameObject hoặc đổi bytes scene; lượt verify sau transfer báo already migrated/nothing rebuilt |
| Editor Play Mode | **PASS** | editor-play-report.json: saved/reopened scene test với Temple dời/xoay/scale và title scale tùy chỉnh, layoutValid/spritesValid=true,2 sessions,50→51 players,10 visual/10 created,3 effects,0 lỗi stack runtime; Null graphics |
| Windows build | **PASS Succeeded**,0 warning/0 error | build-report.json; x64 Mono development,315858992 bytes, lượt cuối21.18s. Đây là validation build từ scene copy có chỉnh sửa cố ý, không sửa production scene |
| Windows executable thực | **PASS, Direct3D11** | player-play-report.json: custom layout giữ sau Play,2 sessions,50→51 players,10 visual/10 created,3 effects,0 lỗi runtime; dashboard routes cùng trả200 |
| GPU capture9:16 | **PASS12 ảnh** | before/after:1080×1920 và720×1280,10/500 players và ritual start/strike/success/failure; NVIDIA Quadro M1000M/Direct3D11, kiểm sprite không rỗng/bounds |
| So sánh ảnh | **PASS phạm vi bố cục/art giữ nguyên** | comparison-report.json:0.552–0.823% pixel đổi toàn ảnh do nameplate TMP; ngoài nameplate+18px đệm còn0–1 pixel đổi/ảnh ở ngưỡngRGB>2/255. Không gọi là ảnh bit-identical |
| Bảo toàn | **PASS** | preservation-report.json: original scene/prefabs/PNG/backend/data/WS unchanged; không động bytes ProjectAuditor trước phiên |
| GUI kéo chuột trực tiếp/OBS/LTS/IL2CPP/ngâm tải/FPS/GPU residency/LIVE thật | **CHƯA KIỂM CHỨNG** | Không suy từ test native Transform, ảnh tĩnh hoặc smoke vài giây thành những kết quả này |

## Lỗi đã xử lý và giới hạn

- Optional props inactive chưa có mesh runtime: migration ApplyLayout cho cả layer inactive trước bake.
- TMP FontEngine không load LegacyRuntime: dùng font/shader/OFL đi kèm SDK; khởi tạo TMP Settings trước font asset. Không dùng font OS hoặc tải artwork ngoài.
- Unity fake-null khiến toán tử?? bỏ qua AddComponent<TextMesh>: thay bằng kiểm tra bool của Unity object.
- GUID script/font/shader giữa main và validation khác do Editor import song song: map giữ GUID chính, copy lại chính output main vào validation, chạy68 test/capture/build/Windows smoke cuối. Không nhận lượt verify/capture lỗi trung gian làm PASS.
- Fix kiểu int của build summary và tên class report trùng enum BuildResult; compile/build lại0 warning/error.
- Lỗi Editor UnityEditor.Search.SearchDatabase startup đã có từ các bước trước vẫn xuất hiện ở log Editor; không có stack runtime script mới. Không xóa cache hoặc tuyên bố đã sửa lỗi Editor.
- Bản scene legacy còn chế độ pixel-layout để đọc dữ liệu gốc và không tự tạo nhân vật nữa; **dùng SectScene_Editable cho chức năng mới**. Prefab Resources cũ là base, variant SceneAuthoring là prefab đang dùng.
- Root động của nhân vật vẫn theo Seat/state để spawn/bay; body/nameplate/FX giữ offset cấu hình prefab. Mesh import rect/anchor không phải control layout sau bake. Ghế phải được căn cùng sân nếu đổi bố cục sân; nên dời cả nhóm Tribulation để đài/seat/FX đi cùng nhau.
- Camera mặc định auto-fit có thể nới orthographic size khi công trình ra mép; tắt Auto Fit Bounds nếu muốn cố định size. Chỉnh Edit Mode rồi save; Unity vẫn bỏ thay đổi Play Mode khi Stop theo quy tắc chuẩn.
- Chưa thêm battle/UI gameplay mới, không sửa thuật toán/cơ chế/WS/API. Các lỗi PNG nguồn và placeholder bước03 vẫn giữ. Không nhận chuyển TMP là hỗ trợ mọi emoji/ngôn ngữ.

Hướng dẫn: [UNITY_SCENE_AUTHORING.md](docs/UNITY_SCENE_AUTHORING.md). Ảnh: [trước](docs/unity-scene-authoring/before/ritual-strike-1080x1920.png), [sau](docs/unity-scene-authoring/after/ritual-strike-1080x1920.png). **Không commit/push trong refactor này.**

---

# Unity migration — Giai đoạn 04: Nhân vật và độ kiếp — 07/11/2026

**Đã triển khai và kiểm thử phạm vi bước04.** Nhân vật/độ kiếp nhận dữ liệu Node qua client chỉ đọc bước02. Chưa triển khai battle Unity, không đổi gameplay/backend/protocol/save, không commit/push hoặc chuyển bước05. Camera giữ overview an toàn; các pose thiếu và FX đơn giản được ghi rõ, không nhận có animation vẽ tay đầy đủ.

## Khảo sát và baseline

- Đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, bàn giao Unity01–03, docs/UNITY_SECT_SCENE.md/UNITY_WEBSOCKET.md, public/js/{characters,presentationState,sectLayout,realmAura,breakthroughScene}.js; đối chiếu gameEngine.snapshot(), breakthroughService.publicState()/lastResult, gameEventBus và các DTO/protocol hiện có. Phases07.2/07.3 dùng tham khảo; không triển khai Three.js07.x.
- Git đầu/cuối giữ `feature/unity-2-5d-migration`, giữ các thay đổi chưa commit. Baseline npm **91 PASS / 0 FAIL / 1 SKIP**; Unity EditMode **36/36 PASS** trước khi thêm chức năng.
- Editor người dùng đang mở project chính. Batch/import/test/GPU chạy trên bản sao validation tại test-results/unity-stage03/validation-project, không đóng Editor hoặc ghi đè scene đang chỉnh. Bàn giao prefab/material/import meta về project chính với ánh xạ GUID, rồi kiểm lại trên bản sao có cùng GUID chính.

## File tạo/thay đổi trong bước04

| Nhóm | File |
|---|---|
| Sprite | Assets/Art/Characters/Character_1/:7 PNG và importer.meta, bản sao byte-identical |
| Prefab/material | Assets/Resources/{CharacterPrefab,TribulationPrefab}.prefab; Assets/Materials/Characters/{SharedUnlit,SpriteUnlit}.mat và ProceduralDisk.asset |
| Nhân vật | Assets/Scripts/Characters/{CharacterManager,CharacterView,CharacterPoseController,RealmAuraController}.cs |
| Độ kiếp/camera/bootstrap | Assets/Scripts/Effects/TribulationController.cs; Assets/Scripts/Scenes/{CameraDirector,SectCharacterBootstrap}.cs |
| HUD tối thiểu | Assets/Scripts/UI/CharacterRosterHud.cs: số đệ tử từ snapshot/số visual, chờ snapshot khi mất đồng bộ |
| Editor/test | Assets/Editor/{CharacterSceneSetup,CharacterScreenshotTest,CharacterPlayProbe}.cs; Assets/Tests/Editor/CharacterTests.cs; Assets/Tests/Fixtures/Characters/*; kèm.meta |
| Driver | scripts/unity-character-{fixtures,sync,smoke}.js, chỉ fixture trong bộ nhớ/DEMO data tạm và chuyển tài nguyên mới |
| Tài liệu | unity-client/README.md, docs/UNITY_CHARACTERS.md, docs/unity-stage04/*, PROGRESS.md |

`Assets/Scenes/SectScene.unity` giữ nguyên byte, bao gồm bố cục/chỉnh sửa cũ. Bootstrap chỉ tạo root nhân vật lúc Play trong SectScene, không thêm vào scene asset. Các module network/DTO/protocol cũ không đổi. **341/341 file trong manifest bảo vệ đầu phiên giữ SHA-256**; unity-client/README.md và PROGRESS.md nằm ngoài manifest, được cập nhật có chủ đích. Không có thay đổi ngoài dự kiến. Backend, public/assets gốc, Three.js, data/config, package/project settings Unity và scene cũ giữ nguyên. Chi tiết preservation-report.json.

## Hành vi bàn giao

- Bảy pose đơn1254×1254, fullrect/PPU100, cùng scale.125 và trục X627; pivot chân theo silhouette từng pose, giữ toàn bộ tóc/áo/màu/tỉ lệ. Không sửa pixel PNG, không tint nhân vật, không bịa spritesheet. Bảng pivot/fallback và audit từng ảnh trong UNITY_CHARACTERS.md/ASSET_AUDIT.md.
- CharacterPrefab gồm SpriteRenderer, CharacterPoseController, nameplate tên/realm hai dòng, aura theo11 realm backend, shadow và một vòng FX có thời hạn cho appearance/stage up/gift/teleport/victory. FX hiện còn đơn giản, không có art tải ngoài.
- Roster theo userId, pool reset/reuse khi despawn/reconnect/session đổi, không nhân đôi nhân vật trên sân/đài. 12 ghế có sẵn; Low6, Medium10, High12; từ100 người tối đa10,500 người8 (Low vẫn6). Người ngoài nhóm giữ đủ state, follow/ritual thay người minh họa ở ghế modulo12. Không tạo prefab cho toàn bộ500 người.
- Mapping đủ idle/walk/meditate/standUp/attack/teleport/celebrate/cast/fly/bow/hit; walk/standUp/teleport/bow/hit/cast có fallback ghi rõ. Sprite không bị squash; idle scale đều ±0.2%, fly bob nhẹ, hit/bow lean nhẹ toàn hình.
- Độ kiếp đọc active.elapsedMs/durationMs/lightningCount và result.outcome. Bay0.3–1.5s, sau đó thiền; mây tối/sét theo công thức tham chiếu cũ, kết quả chỉ khi backend gửi; outcome thiếu không bị suy thành thất bại. Snapshot sửa timeline; pause/stopped đóng băng; reconnect không replay sét cũ. Result hết thì bay về ghế trong.8s nếu visual vẫn được chọn. Người ở sân vẫn thấy trong nghi thức.
- CameraDirector ưu tiên ritual/sự kiện/follow để chọn subject hiện hình; giữ CameraRig full-frame9:16, **chưa pan/zoom cinematic**, không jump/shake hoặc mở profile card. Effective battle trả sect visual về pool, tắt ritualFX; không dựng battle trong bước04.

## Kết quả kiểm thử

| Kiểm tra | Kết quả | Bằng chứng/phạm vi |
|---|---|---|
| npm baseline/sau sửa | **PASS91 / FAIL0 / SKIP1**,92 bài cả hai lượt | npm-baseline.txt, npm-after.txt; SKIP là LIVE thật |
| Unity baseline | **PASS36/36** | baseline-editmode.xml |
| Unity cuối | **PASS63/63**:36 cũ+27 mới | final-editmode.xml; spawn10/50/100/500,50 vòng resync không tăng CreatedCount, pool/reconnect/session,11 mapping, import/pivot, pause/battle-clear, success/failure/missing outcome, return, focus,11 aura, duplicate event, Low |
| PNG/import | **PASS7/7 SHA**, RGBA1254×1254, alpha≥32 không chạm cạnh | asset-audit.json, ASSET_AUDIT.md; giữ viền màu/pixel alpha rời vốn có |
| GPU render | **PASS12 ảnh**,1080×1920 và720×1280 | screenshot-report.json; NVIDIA Quadro M1000M/Direct3D11;10/500 người, start/strike/success/failure; sprite không null/không rỗng và trong camera |
| Play Mode + Node DEMO thật | **PASS**,50→51 người sau Node stop/restart | play-report.json:2 session,10 visual tối đa,10 prefab đã tạo,3 hiệu ứng sự kiện trước session reset,0 lỗi stack runtime; kiểm sprite có thật. Null graphics, không dùng kết quả này làm FPS/GPU |
| Web routes trong smoke | **PASS** | /,/song,/api/state,/api/dashboard trả200 trên Node tạm; không tuyên bố đã chạy lại toàn bộ browser dashboard |
| Bảo toàn | **PASS**, không có thay đổi ngoài phạm vi | preservation-report.json; scene/backend/WS/data/package/PNG gốc giữ nguyên; git diff --check PASS |
| Windows Player mới/IL2CPP/OBS/FPS GPU/ngâm tải | **CHƯA KIỂM CHỨNG** | Build network bước02 không thay cho kết quả đồ họa bước04 |
| TikTok LIVE thật | **CHƯA KIỂM CHỨNG / không gọi** | Smoke dùng dataRoot mới và connector từ chối LIVE |

Ảnh minh họa: [Độ kiếp+sân1080](docs/unity-stage04/ritual-strike-1080x1920.png), [500người/8visual720](docs/unity-stage04/players-500-720x1280.png). Các ảnh là replay snapshot lấy từ backend thật với người chơi giả trong bộ nhớ, không phải ảnh chụp LIVE. `cpuParseSyncMs` là CPU parse/sync đơn lẻ có cold start, không phải FPS hoặc GPU timing.

## Lỗi đã sửa và giới hạn

- API spriteAlignment của TextureImporter không có trên Editor hiện tại: chuyển sang TextureImporterSettings và compile lại.
- GUID script/PNG giữa validation và project chính từng khác, làm prefab thiếu component/sprite trong lượt thử. Đã ánh xạ GUID chính và copy đầy đủ importer meta về bản sao, tăng kiểm tra sprite không null/không rỗng, chạy lại63 test, capture và smoke trên tài nguyên cuối. Không nhận các ảnh trung gian thiếu sprite làm nghiệm thu.
- Shader plane nền không áp SpriteRenderer.color nên mây/bóng từng trắng. Dùng Sprite-Unlit tích hợp URP riêng cho sprite; giữ shader line và renderer nền cũ; kiểm ảnh GPU sau sửa.
- Pose đơn khác nhau về hình dáng/độ cao đầu vốn có; shared contact anchor giảm giật chân, không phải registration giải phẫu hoàn hảo. Chưa có pose đi/cúi/bị thương/đứng dậy riêng; mây/sét/vòng FX là code đơn giản; chỉ một bộ mặt/tóc/trang phục.
- Camera hiện ưu tiên subject nhưng giữ overview, chưa chuyển động cinematic. Ghế/Breakthrough seat chỉnh độc lập với layer PNG, cần căn lại nếu người dùng đổi bố cục đài/sân.
- Giới hạn visual giảm tải renderer, không làm nhẹ toàn bộ JSON500 người hoặc unload bảy texture. Chưa đo FPS/GPU residency/ngâm tải; không đặt số parse/sync cold-start thành benchmark60FPS.
- Lỗi Editor index UnityEditor.Search.SearchDatabase đã ghi từ các bước trước vẫn ngoài phạm vi; không xóa cache. Lỗi timing smoke500 người từ giai đoạn01 chưa được coi là đã sửa. Chưa test thao tác Inspector/OBS bằng tay trên Editor người dùng.

Hướng dẫn mở và chỉnh prefab: [docs/UNITY_CHARACTERS.md](docs/UNITY_CHARACTERS.md). **Dừng bước04, không commit/push hoặc triển khai battle/bước tiếp theo.**

---

# Sửa thao tác di chuyển layer Unity — 07/11/2026

- Nguyên nhân: SectLayer.Sample áp lại Transform từ Position Pixels mỗi lần cập nhật; Move Tool mặc định chỉ đổi Transform nên vị trí bị trả về.
- Thêm `unity-client/Assets/Editor/SectLayerEditor.cs` và `.meta`: handle di chuyển trong Scene View khi nhấn W ở Edit Mode ghi vào Position Pixels, hỗ trợ chọn nhiều layer, Undo/Redo, đánh dấu scene cần lưu và prefab override. Chỉ di chuyển XY; Z giữ theo sorting order. Không đổi scene/bố cục đang lưu, runtime, backend hoặc dữ liệu.
- Cập nhật `unity-client/Assets/Tests/Editor/SectSceneTests.cs`, `docs/UNITY_SECT_SCENE.md`; bằng chứng trong `docs/unity-stage03/move-editmode.xml` và `move-npm.txt`.
- **PASS:** Unity EditMode 36/36 trên bản sao validation, gồm test đường xử lý Move cập nhật tọa độ, không bật lại sau Sample, giữ Z, Undo/Redo. npm test 91 PASS / 0 FAIL / 1 SKIP (LIVE thật). git diff --check PASS.
- **CHƯA KIỂM CHỨNG:** kéo chuột trực tiếp trong Editor của người dùng và lưu/mở lại bằng giao diện. Không đóng Editor hoặc ghi đè scene đang chỉnh.
- Cách dùng: thoát Play Mode → chọn Temple trong Hierarchy → Scene View → W → kéo X/Y → Ctrl+S. Nhập số bằng SectLayer > Position Pixels. Transform Position trong Inspector vẫn là giá trị tạm bị layout ghi lại; scale dùng Uniform Scale, độ sâu dùng Sorting Order. Chưa chuyển giai đoạn, không commit/push.

# Unity migration — Giai đoạn 03: Tông môn PNG 2.5D — 07/11/2026

**Đã dựng SectScene thật, import PNG, kiểm thử và chụp ảnh Unity GPU. Dừng bước 03; chưa dựng hệ thống nhân vật/battle/UI gameplay. Không commit/push.** Bố cục còn giới hạn từ ảnh nguồn và placeholder, chưa nhận giống concept hoàn chỉnh.

## Khảo sát và bảo toàn

Đọc AGENTS.md, GAME_DESIGN.md, bàn giao 01–02, docs/UNITY_MIGRATION.md, UNITY_WEBSOCKET.md, ASSET_AUDIT.md, kế hoạch tông môn 07.1 để đối chiếu bố cục; khảo sát toàn bộ public/assets/concept và các PNG. Kế hoạch Three.js 07.x chỉ là tham khảo, không triển khai 07.1 hoặc sửa /song.

Git giữ **feature/unity-2-5d-migration**, HEAD 2e7825a8a3ff89ac845305de31542c444df54cb6; giữ thay đổi chưa commit trước phiên. **155 file đã có** trong manifest đầu phiên (backend, data/config, public/assets/renderer, phases, protocol C#, scene 01–02 và package Unity) giữ nguyên SHA-256. Không đổi AGENTS/.gitignore trong bước này; diff ở đó là công việc trước.

Editor của người dùng đang mở project chính, nên batch trùng project bị từ chối. Import/test/render chạy trên bản sao Assets/Packages/ProjectSettings tại test-results/unity-stage03/validation-project; không đóng Editor hoặc bỏ scene chưa lưu. Đã chuyển scene/material/import settings về **unity-client/**, giữ GUID chính, rồi lấy lại đúng project sau chuyển để chạy lại GPU capture và 35 tests. Không copy Library/cache hoặc package thay đổi từ bản sao.

## File tạo/thay đổi

| Nhóm | File / nội dung |
|---|---|
| Art | unity-client/Assets/Art/Sect/: **17 PNG** nguyên byte (15 ảnh yêu cầu + ui_header/ui_footer có sẵn), importer .meta và asset-audit.json |
| Scene | Assets/Scenes/SectScene.unity + .meta: 18 instance PNG, 12 điểm neo sân + 1 điểm đài, HUD tiêu đề/tên tông môn, placeholder cành đào và bậc đá |
| Runtime trình diễn | Scripts/Scenes/{SectLayer,CameraRig,SectSceneController,SectTextLayout}.cs + .meta; không gọi API/WS hoặc tính gameplay |
| Render | Materials/SectUnlit.shader; Materials/Sect/: material theo texture, material/mesh placeholder dùng chung; không LUT/bloom/raytracing, không light/shadow/physics cho plane |
| Editor | Assets/Editor/{SectSceneSetup,SectScreenshotTest,SectPlayModeTest}.cs + .meta: import/create-once/verify, chụp GPU, Play Mode smoke 5 giây |
| Test | Assets/Tests/Editor/SectSceneTests.cs + .meta, **11 test mới**; giữ 24 test protocol cũ |
| Project settings | Chỉ append SectScene vào build scenes, giữ NetworkTest/Bootstrap; thêm 9 sorting layer riêng |
| Driver | scripts/unity-sect-assets.js (audit/copy nguyên byte); scripts/unity-sect-sync.js (chuyển generated assets, giữ GUID và từ chối ghi đè file đã chỉnh sau sync) |
| Tài liệu | unity-client/README.md và README Art/Materials/Scenes/Tests; docs/UNITY_SECT_SCENE.md; docs/unity-stage03/*; PROGRESS.md |

Không sửa backend/gameplay/quà/dữ liệu/WS, public/song.html, renderer Three.js, public/assets hoặc package Unity. Không thêm package/asset/font tải ngoài; dùng font built-in Unity. Concept/main.jpg chỉ tham chiếu, không được dán vào scene.

## Bố cục và import

- Camera orthographic 9:16, tham chiếu 1080×1920, PPU=100; dùng được 720×1280, cửa sổ khác tỉ lệ letterbox. Auto-fit content bounds bảo vệ sân/đài/công trình/HUD, drift tối đa 3.5×2.5 pixel tham chiếu.
- Thứ tự: trời → mây → núi xa/trung → kiến trúc/thác → đài → sân/pháp trận → điểm nhân vật → cổng → khí quyển → HUD. Plane trong XY, không ép sân thành sàn 3D nằm ngang.
- Kiến trúc scale đều/rotation=0; vòng pháp trận riêng scaleY=.35 để gần elip mặt sân, base alpha .58/glow .22, không cháy sáng.
- Sprite Single/FullRect, sRGB/alpha transparency, Bilinear/Clamp, không mipmap/compression/NPOT resize, max4096/PPU100, CPU Read/Write tắt. UV chỉ bỏ padding alpha=0; alpha mềm vẫn được giữ. Bbox alpha≥32 dùng làm neo và kiểm khung, không dùng xóa pixel.
- Low/Medium/High bật **12/15/17 plane PNG**, tương ứng 12/15/16 texture đang vẽ (sương dùng chung). Byte RGBA của phần đang vẽ khoảng **72/90/96 MiB**; scene vẫn tham chiếu đủ 17 ảnh ~**102 MiB**, chưa đo GPU residency thực. Low giảm overdraw, không bảo đảm unload texture.
- Position Pixels/Uniform Scale/Anchor/Opacity/sorting chỉnh trong Inspector. Source Pixel Rect khác Content Pixel Rect; giữ scaleY=1 cho công trình. Hướng dẫn đầy đủ tại docs/UNITY_SECT_SCENE.md.

## Kết quả thực tế

| Kiểm tra | Kết quả | Bằng chứng / phạm vi |
|---|---|---|
| npm.cmd test baseline | **PASS 91 / FAIL 0 / SKIP 1**, 92 bài | docs/unity-stage03/npm-baseline.txt |
| npm.cmd test sau thay đổi | **PASS 91 / FAIL 0 / SKIP 1**, 92 bài | npm-after.txt; SKIP là LIVE thật |
| Audit/import | **PASS 17/17 copy hash**, kiểm CRC/kích thước/alpha/viền/bbox/gradient từng ảnh | ASSET_AUDIT.md và asset-audit.json; không biến gradient thành điểm chất lượng tự động |
| Unity EditMode | **PASS 35/35**, trước và sau đồng bộ về project chính | final-editmode.xml: 24 protocol + 11 scene/import/bounds/drift/quality/anchor/HUD/letterbox |
| GPU camera render | **PASS 8 ảnh thực** | screenshot-report.json; **NVIDIA Quadro M1000M / Direct3D11**; 1080×1920 và 720×1280 ở Low/Medium/High, thêm Medium t20/t60 |
| Kiểm ảnh trực quan | **PASS trong phạm vi bố cục asset có sẵn** | Đã xem Medium1080, Medium720 và High1080; sân/đài/cổng/chính điện/HUD rõ, chữ không tràn; lỗi cắt sẵn trong nguồn ghi riêng |
| Editor Play Mode 5 giây | **PASS**, có chuyển động Update, mesh ổn định, bounds an toàn, 0 lỗi stack scene runtime | playmode-report.json; nographics, không dùng làm bằng chứng GPU/FPS; editorUpdateSamples không phải FPS |
| Gameplay cũ live-smoke.js | **PASS** DEMO/data tạm | live-smoke.txt: combo/kỹ năng/freeze/pending/reconnect5s; không LIVE thật |
| GUID và bảo toàn | **PASS**, 67 generated/settings files được sync, 31 GUID được ánh xạ về GUID chính; 155 file bảo vệ không đổi | sync-command.txt, preservation-report.json; script URP camera được resolve từ package; git diff --check PASS |
| Windows Player/OBS cho SectScene, GPU frame time/FPS thực, ngâm tải | **CHƯA KIỂM CHỨNG** | Không lấy kết quả Player network bước 02 hoặc CPU SubmitRenderRequest làm bằng chứng |
| Nhân vật/battle/độ kiếp hoạt động/UI gameplay trong SectScene | **CHƯA TRIỂN KHAI**, ngoài bước 03 | Chỉ có điểm neo, không fake dữ liệu hoặc copy concept làm nền |
| TikTok LIVE thật | **CHƯA KIỂM CHỨNG / không gọi** | Không cần LIVE để xem SectScene |

Ảnh: [Medium 1080×1920](docs/unity-stage03/sect-medium-1080x1920-t0.png), [Medium 720×1280](docs/unity-stage03/sect-medium-720x1280-t0.png), [High 1080×1920](docs/unity-stage03/sect-high-1080x1920-t0.png), [Low 720×1280](docs/unity-stage03/sect-low-720x1280-t0.png). Chuyển động: [Medium t20](docs/unity-stage03/sect-medium-1080x1920-t20.png), [t60](docs/unity-stage03/sect-medium-1080x1920-t60.png). Đây là camera Unity URP thật; captureRenderMs chỉ là CPU gọi SubmitRenderRequest sau warmup, chưa gồm GPU readback, không báo thành FPS.

## Lỗi đã sửa và hạn chế còn lại

- Test ban đầu dùng GetInstanceID đã bị Unity 6.5 loại bỏ; chuyển sang so cùng đối tượng mesh và API FindAnyObjectByType, compile/test lại.
- Ảnh GPU đầu phát hiện TextMesh quá lớn. Đã thêm SectTextLayout theo giới hạn pixel, kiểm HUD bounds trong test và ảnh mới; dời subtitle khỏi họa tiết trên header.
- Kiểm drift ban đầu đánh dấu đuôi thác chạm mép như lỗi công trình. Đã phân loại Allow Frame Bleed riêng cho nền/khí quyển/đuôi thác; sân/đài/HUD/công trình vẫn phải nằm trong khung. Không nới camera để che lỗi chữ hoặc cắt sân.
- Nguồn courtyard cắt trái/phải (299/250 pixel alpha≥32 chạm cạnh); lanterns_props cắt phải (177 pixel). Scene hiện toàn bộ footprint PNG; chưa thể phục hồi phần nguồn không có. Props mặc định ẩn để tránh trùng lan can/đèn.
- Thiếu cây/cành đào, đoạn cầu/kiến trúc nối, rail/rock endcap riêng; có nhánh hoa/bậc đá code đơn giản với tên Placeholder. Chưa nhận concept hoàn chỉnh. Aura đài/nhân vật/nameplate/UI dữ liệu để các bước sau nếu được yêu cầu.
- Play smoke vẫn có ArgumentOutOfRangeException ở **UnityEditor.Search.SearchDatabase** lúc index startup, cùng nhóm lỗi Editor đã ghi bước 02; không có stack Scripts/Scenes, runtime probe PASS. Chưa xác minh nguyên nhân Editor, không xóa cache project chính.
- Smoke 500 người/timing lỗi ở giai đoạn 01 chưa được sửa hoặc chạy lại; không coi npm PASS là giải quyết nhóm đó.

Hướng dẫn mở/chỉnh và danh sách asset thiếu: [UNITY_SECT_SCENE.md](docs/UNITY_SECT_SCENE.md). Tổng hợp máy đọc: [validation.json](docs/unity-stage03/validation.json). Log Editor đầy đủ ở test-results, không đưa licensing log vào docs.

**Dừng bước 03. Không tự làm nhân vật/battle/bước 04, không commit/push hoặc reset dữ liệu.**

---

# Unity migration — Giai đoạn 02: WebSocket client — 06/11/2026

**Đã triển khai client chỉ đọc, scene NetworkTest và kiểm thử kết nối thực trên Windows Editor/Windows Standalone Mono. Dừng ở bước 02; chưa dựng đồ họa/bước 03. Không commit/push/reset dữ liệu.** Các mục giai đoạn 01/07.0/06.x dưới đây là lịch sử.

## Phạm vi và file

- Đọc lại AGENTS.md, GAME_DESIGN.md, PROGRESS.md, README.md, kiến trúc Unity, tài liệu phases liên quan; đối chiếu gameEngine.snapshot(), battleService.snapshot(), breakthrough publicState, playerStore, gameEventBus, server transport và public/js/network.js.
- Git đầu/cuối phiên vẫn ở **feature/unity-2-5d-migration**, HEAD 2e7825a8a3ff89ac845305de31542c444df54cb6. Giữ toàn bộ thay đổi chưa commit từ các phiên trước. Không tạo lại branch, stash, reset, stage, commit hoặc push.
- Runtime mới trong unity-client/Assets/Scripts: Network/{UnityWebSocketClient,NativeWebSocketTransport,StateMapper,ProtocolSession}.cs; Models/GameModels.cs; Presentation/LocalGameState.cs; UI/{NetworkDebugHud,NetworkTestProbe}.cs; TuTienLive.Runtime.asmdef và .meta.
- Scene/tooling mới: Assets/Scenes/NetworkTest.unity, Assets/Editor/NetworkTestSetup.cs, Test-Network.ps1. ProjectSettings thêm scene NetworkTest trước Bootstrap, Windows Mono/runInBackground; Bootstrap và URP giữ nguyên. MigrationProjectSetup.cs cho phép thêm runtime/scene bước 02 để utility cũ tiếp tục verify Bootstrap.
- Package manifest/lock: thêm Newtonsoft JSON **3.2.2** và pin trực tiếp Test Framework **1.4.6**; URP 17.5.0 và Editor 6000.5.9f1 giữ nguyên. Newtonsoft DLL reference đúng trong asmdef, không thêm thư viện networking.
- Test mới: Assets/Tests/Editor/{NetworkProtocolTests.cs,TuTienLive.Tests.asmdef}, Fixtures (7 snapshot, 12 event + provenance/hash), .meta. Generator scripts/unity-network-fixtures.js lấy output engine thật với người chơi giả trong bộ nhớ.
- Driver mới scripts/unity-network-demo.js và scripts/unity-network-smoke.js: child Node/dataRoot tạm, Unity opt-in probe, ngắt rồi khởi động lại cùng cổng; kiểm web routes/API cùng hoạt động. Không gọi TikTok thật hoặc server người dùng.
- Tài liệu: unity-client/README.md, README thư mục runtime/Tests, docs/UNITY_WEBSOCKET.md, banner lịch sử docs/UNITY_MIGRATION.md, docs/unity-stage02 và PROGRESS.md. **Không sửa AGENTS.md/.gitignore trong bước 02**; git diff ở hai file đó là thay đổi bước 01.
- **Không đổi backend/services/protocol/API/WS, luật game, caidat.json, player data, public/song.html, renderer Three.js, PNG/phases hoặc project Unity cũ.** Hash trước/sau xác nhận 203 file có sẵn không đổi.

## Hành vi đã có

- Endpoint mặc định ws://127.0.0.1:3000/ws, đổi cổng trong Inspector hoặc --ws-url. Native transport chỉ bật trên Windows Editor/Standalone; không tuyên bố tương thích mọi target.
- Nhận UTF-8 phân mảnh qua background Task → queue có lock/giới hạn → Update trên main thread. Cancel/Abort khi disable; generation loại callback cũ. Không có send/RPC hoặc tính lại gameplay.
- Immutable snapshot/player/breakthrough/battle/event; dictionary inventory/participants/cooldowns và unknown field giữ nguyên. Nullable field thiếu không biến thành thông số gameplay tự đoán. Json.NET không kích hoạt type từ payload.
- Version 1, seq cũ/replay, eventId dedup FIFO 200; session đổi xóa state/event history. Gói malformed bị bỏ trước khi thay session/sequence.
- Reconnect 500ms → cap 10s, connect timeout 5s, watchdog snapshot 10s. Mỗi reconnect chờ snapshot mới và thay toàn bộ roster, không phát lại reward hoặc giữ nhân vật stale. Chưa dựng GameObject nhân vật; bước này cung cấp roster/Changed cho renderer sau.
- NetworkTest có HUD debug WS/session/phase/remainingMs/players/events/latency; độ lệch receivedAt-serverTime ghi rõ **clock offset, không phải RTT**. Probe chỉ ghi report khi được gọi với --network-report.

## Kết quả thực tế

| Kiểm tra | Kết quả | Bằng chứng / giới hạn |
|---|---|---|
| npm.cmd test baseline | **PASS: 91 PASS / 0 FAIL / 1 SKIP, 92 bài** | docs/unity-stage02/npm-baseline.txt |
| npm.cmd test sau sửa | **PASS: 91 PASS / 0 FAIL / 1 SKIP, 92 bài** | docs/unity-stage02/npm-after.txt; SKIP là LIVE thật |
| Unity EditMode parsing/protocol | **PASS 24/24**, cả lượt đầu và sau bổ sung | runner-editmode.xml; schema thực, Unicode, uint/double/long, dictionary, null/missing, replay, duplicate, reconnect, session reset, malformed/nonfinite, immutable state/main thread, backoff/dedup bound |
| Unity Editor Play Mode + Node DEMO | **PASS**, 30s, **113 snapshot / 32 event**, 0 callback ngoài main thread | editor-play.json; mất kết nối, retry, đổi session và roster 3 → 4 |
| Windows x64 Mono build | **PASS**, build từ mã nguồn cuối | build-command.txt; local executable unity-client/Builds/NetworkTest/TuTienNetworkTest.exe, output ignored |
| Windows Player + Node DEMO | **PASS**, 30s, **116 snapshot / 33 event**, 0 callback ngoài main thread | windows-player.json; 2 disconnect/retry observations, session mới và roster 3 → 4, cuối kỳ synchronized |
| Dashboard browser smoke | **PASS 6 nhóm**, errors=[] | dashboard-smoke.txt; Chrome profile/data tạm, connector stub, không LIVE thật |
| Gameplay cũ live-smoke.js | **PASS** | live-smoke.txt; combo, skills, freeze EXP/buff, pending, reconnect DEMO 5s |
| Verify-Project.ps1 cũ | **PASS** Bootstrap/URP | bootstrap-verify-command.txt; không dùng thay test runtime |
| Bảo toàn source/data/assets | **PASS 203/203 SHA-256** | preservation-report.json; git diff backend/public rỗng; git diff --check PASS |
| GUI/HUD trực quan, GPU/OBS, IL2CPP, target khác, LTS | **CHƯA KIỂM CHỨNG** | Các lượt runtime trên là batch/nographics; chưa có screenshot HUD |
| Unity 500 người/ngâm tải, fault injection overflow/oversize | **CHƯA KIỂM CHỨNG** | Có giới hạn trong code, chưa stress nghiệm thu |
| TikTok LIVE thật | **CHƯA KIỂM CHỨNG / không gọi** | Chỉ dùng DEMO và connector stub |

Lỗi đã xử lý: thiếu tham chiếu DLL Newtonsoft trong test khiến compile lỗi, đã sửa asmdef và compile/test lại; README mới bị mất dấu qua PowerShell native pipe, đã ghi lại UTF-8. Lượt đầu sandbox không kết nối được Unity Licensing, đã dừng đúng tiến trình test và chạy lại với quyền cần thiết, giữ nguyên Editor khác.

Lỗi/giới hạn còn mở: Editor Play probe ghi ArgumentOutOfRangeException trong **UnityEditor.Search.SearchDatabase** lúc index startup, không phải stack runtime client; probe vẫn hoàn tất, chưa xác minh nguyên nhân Editor. Smoke 500 người giai đoạn 01 từng FAIL timing (effect cap/skill hồi sinh) **chưa được sửa hoặc chạy lại trong bước này**, không nhận đã hết lỗi từ npm PASS.

Chi tiết kiến trúc/schema/phạm vi: [UNITY_WEBSOCKET.md](docs/UNITY_WEBSOCKET.md). Tổng hợp máy đọc: [validation.json](docs/unity-stage02/validation.json). Log Editor đầy đủ chỉ ở test-results, không đưa licensing log vào docs.

Mở Unity Hub → project gốc unity-client → Assets/Scenes/NetworkTest.unity → Play; chạy Node DEMO riêng với cổng khớp Endpoint. Lệnh tái kiểm thử và build: [unity-client/README.md](unity-client/README.md). **Dừng bước 02, không tự làm bước 03.**

---

# Unity migration — Giai đoạn 01: khảo sát và khởi tạo — 06/11/2026

**Đã tạo project thật và kiểm chứng Editor batch; chỉ giai đoạn 01. Chưa có Unity gameplay/network/đồ họa. Baseline smoke tổng hợp còn FAIL. Không chuyển giai đoạn 02, không commit/push/reset.** Các mục 07.0/06.x và bàn giao Git bên dưới giữ nguyên lịch sử.

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, README.md, package.json, server.js, gameEngine.js, gameEventBus.js, public/js/network.js; khảo sát thêm main/presentationState/playerStore/battle snapshot và các phases nền tảng/06 tổng quan/07. Đầu phiên ở main, HEAD `2e7825a8a3ff89ac845305de31542c444df54cb6`, có sẵn thay đổi audit/preview 07.0, PROGRESS, tài liệu, concept và project Unity chưa tracked. Tạo nhánh **feature/unity-2-5d-migration** tại cùng HEAD; không stash, checkout revision khác hoặc stage các thay đổi đó. Đổi nhánh không tách riêng thay đổi working tree.

Project người dùng có sẵn ở **public/unity-client/My project**, Unity **6000.5.9f1**, URP **17.5.0**, đang có Editor chạy. Không ghi đè/di chuyển nó. Vì chưa có unity-client ở root, đã dùng Editor cài sẵn `-createProject` để tạo project mới tại **unity-client/**, ngoài static web root. Chỉ phát hiện bản 6000.5.9f1 trong thư mục Hub; đây không phải LTS, nên pin bản đã cài để kiểm chứng, không tự cài/downgrade. Lựa chọn LTS cho production chưa kiểm chứng, giải thích và nguồn chính thức trong tài liệu kiến trúc.

## File và cấu trúc bàn giao

| File / nhóm | Thay đổi giai đoạn 01 |
|---|---|
| `unity-client/Assets`, `Packages`, `ProjectSettings` | Project Editor tạo thật, pin version/revision/URP và lock file; URP Forward và scene Bootstrap rỗng chỉ Main Camera orthographic size 9.6, mặc định 1080×1920. Chưa có scene game/sprite/HUD |
| `Assets/Scripts/{Network,Models,Presentation,Characters,Scenes,Effects,UI}` và `Assets/{Prefabs,Art,Animations,Materials,Tests}` | Đã tạo thư mục/README/.meta; không tạo class giả thay runtime, chưa import PNG hoặc viết DTO/WS |
| `unity-client/Assets/Editor/MigrationProjectSetup.cs` | Utility Editor-only Initialize/Verify, từ chối ghi đè asset đã có, từ chối bỏ scene chưa lưu; kiểm cấu hình, không gửi HTTP/WS hoặc đọc dữ liệu game |
| `unity-client/README.md`, `Verify-Project.ps1` | Hướng dẫn Hub và batch verify; script chạy ẩn, projectPath root này, log riêng; không bật backend/LIVE |
| `docs/UNITY_MIGRATION.md` | File backend giữ nguyên, bảng mapping renderer, protocol thực, boundaries/scopes, rủi ro precision/threading/alpha/LTS/capture, test và việc chưa kiểm chứng |
| `docs/unity-stage01/` | Evidence được chọn lọc: unit baseline/recheck/after, demo smoke, lỗi finishing, Editor report/output, SHA preservation; không đưa log licensing đầy đủ/cache vào repo |
| `AGENTS.md` | Chỉ append ngoại lệ Unity/C# và PNG có sẵn cho root unity-client, giữ chính sách Three.js cũ và mọi luật gameplay/an toàn dữ liệu |
| `.gitignore` | Loại Library/Temp/Logs/UserSettings/build/IDE ở project mới và generated output của project cũ; giữ Assets/.meta/Packages/ProjectSettings |
| `PROGRESS.md` | Prepend báo cáo này, giữ nội dung chưa commit của 07.0 và toàn bộ lịch sử |

Không sửa backend, package npm, GAME_DESIGN/README cũ, cấu hình/dữ liệu người chơi, public/song.html, renderer Three.js, network/API/WS, thuật toán tu luyện/độ kiếp/battle/phần thưởng/quà hoặc project Unity cũ. Kiểm SHA-256 **203 file có sẵn khớp**, [report](docs/unity-stage01/preservation-report.json). Không dùng Unity để tính lại game. `public/js/settings.js` vẫn được backend import và phải giữ khi port renderer sau này.

## Kết quả kiểm thử thật

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd test` baseline trước sửa | **FAIL: 92 bài — 90 PASS / 1 FAIL / 1 SKIP**; launcher timeout 5000ms, status null thay vì 1; [log](docs/unity-stage01/npm-baseline.txt) |
| Test launcher chạy riêng lại, không sửa test/timeout | **PASS 1/1**; [log](docs/unity-stage01/launcher-recheck.txt) |
| `npm.cmd test` baseline recheck | **PASS: 92 bài — 91 PASS / 0 FAIL / 1 SKIP**; [log](docs/unity-stage01/npm-baseline-recheck.txt) |
| `node scripts/live-smoke.js` | **PASS** demo/offline: combo final/replay, kỹ năng, freeze EXP/buff, reconnect 5s, pending/dữ liệu tạm; [log](docs/unity-stage01/live-smoke-baseline.txt). Không kết nối LIVE thật |
| `node scripts/finishing-smoke.js` (ba lần, không sửa script/backend) | **FAIL còn mở**: lần 1/3 assertion effect nhận trong 1s ≤84; lần 2 HTTP 400 do người thử đang hồi sinh/chưa tham chiến. Không có report hoàn tất từ script; không lấy phase5 report cũ để thay. [Tóm tắt](docs/unity-stage01/baseline-observations.json), [lỗi lần cuối chạy riêng](docs/unity-stage01/finishing-smoke-isolated.txt) |
| Unity createProject; Initialize; mở lại Verify bằng Editor 6000.5.9f1 | **PASS import/compile/cấu hình**, log exit 0; [Editor report](docs/unity-stage01/editor-verification.json), [lệnh verify](docs/unity-stage01/verify-command.txt). Không coi đây là Play Mode hoặc GPU render |
| `npm.cmd test` sau khởi tạo | **PASS: 92 bài — 91 PASS / 0 FAIL / 1 SKIP**; [log](docs/unity-stage01/npm-after.txt). Giữ SKIP LIVE thật, không thêm/sửa test Node |
| Bảo toàn nguồn/dữ liệu/project cũ | **PASS 203 SHA-256**, không có file gốc đổi ngoài AGENTS/PROGRESS/gitignore được phép |
| Unity GUI thao tác trực tiếp, test suite Unity của game, Play Mode/build Windows/IL2CPP, native WS, GPU/FPS/OBS/LIVE Studio, LTS, LIVE thật | **CHƯA KIỂM CHỨNG**. Network/DTO/đồ họa/game client Unity còn chưa triển khai |

Đã sửa lỗi cú pháp nội suy biến PowerShell trong script Verify mới (`$editorVersion:` → `${editorVersion}:`), chạy lại thành công. C# utility cuối đã được Editor compile/Verify lại sau khi thêm bảo vệ scene chưa lưu. URP tự tạo GlobalSettings/DefaultVolumeProfile, có warning thông tin đó; licensing handshake có retry nhưng entitlement sau đó hợp lệ và các batch thoát 0. Không nhận toàn bộ warning là lỗi biên dịch hay che dấu chúng. UPM kéo test-framework/NUnit bắc cầu; chưa có NUnit/EditMode/PlayMode suite game Unity được chạy.

FAIL finishing có cùng nhóm assertion rate nhận đã từng ghi trong lịch sử 06.1, nhưng nguyên nhân phiên này **chưa xác minh**, không kết luận chắc do tải máy/mạng/Unity. Không nới ngưỡng, sửa AI hồi sinh hoặc WebSocket/logic game trong giai đoạn khởi tạo để ép PASS. Đây là vấn đề hồi quy cần điều tra trước khi nghiệm thu migration gameplay.

Hướng dẫn mở: Unity Hub → Projects → Add project from disk → chọn **unity-client ở root**, dùng đúng **6000.5.9f1**, đợi import và mở **Assets/Scenes/Bootstrap.unity**. Chỉ thấy scene trống/camera là đúng giai đoạn 01; chưa thể chơi game bằng Unity. Backend/web cũ vẫn chạy như README hiện hữu. Chi tiết: [Unity README](unity-client/README.md), [kiến trúc và bảng phạm vi](docs/UNITY_MIGRATION.md).

**Dừng sau giai đoạn 01.** Chưa port network/runtime, chưa chuyển đồ họa, không tự bắt đầu giai đoạn 02. Không commit/push; tất cả thay đổi cũ được giữ.

---

# 07.0 — Audit PNG và preview độc lập — 06/11/2026

**Đã có audit, preview và bằng chứng thực tế; dừng ở 07.0. Chưa tích hợp LIVE/07.1. Không commit/push/reset.** Phần bàn giao Git/06.2 bên dưới là lịch sử, không phải chỉ dẫn đang tiếp tục trong lượt này.

Đã đọc AGENTS.md, GAME_DESIGN.md, PROGRESS.md, `phases/07_CHUYEN_2_5D/00_KE_HOACH_VA_QUY_TAC.md`, `07_0_AUDIT_PREVIEW.md`; khảo sát server static/CSP, `/song`, scene/layout/nhân vật/HUD và browser driver. Git đầu phiên chỉ có `?? phases/07_CHUYEN_2_5D/`; giữ nguyên tài liệu đó. Người dùng bổ sung `public/assets/concept/main.jpg` trong phiên, dùng làm tham chiếu. Baseline npm test trước sửa: **89 bài — 88 PASS / 0 FAIL / 1 SKIP** (terminal).

## File mới và thay đổi

- `scripts/audit-assets.js`: quét PNG đệ quy, kiểm signature/CRC, giải mã lossless, thống kê alpha/bbox/pixel đen/tín hiệu viền/cạnh bị cắt, SHA-256 và URL encode tên thư mục có dấu cách. Không sửa ảnh.
- `public/preview-2_5d/asset-audit.json`: kết quả thật của 26 PNG, alpha bins và số liệu từng ảnh.
- `public/preview-2_5d/layout.json`: 33 instance, tọa độ 1080×1920, crop/scale/scaleY/z/anchor/opacity/visibility/blend riêng. `meditate_3quarter` ở 8 vị trí sân, `meditate` trên đài. Khung hồ sơ và props mặc định ẩn.
- `public/asset-preview.html`, `public/preview-2_5d/preview.css`, `preview.js`, `layout-model.js`: editor độc lập Three.js planes/orthographic; kéo tọa độ và thứ tự, số nhập, crop/neo, ẩn/hiện, zoom/pan, gallery alpha trắng/đen/checker, concept local overlay/so sánh, xuất/nhập JSON tải về riêng. Render khi đổi, texture dùng chung, không mipmap, dispose khi rời trang. Không nối state/API/WS game.
- `test/asset-preview.test.js`: 3 bài mới có PNG mẫu kiểm đủ filters 0–4 và CRC/truncated, pixel alpha/bbox, validation/crop/anchor/encode/reorder.
- `scripts/asset-preview-smoke.js`: app/data/profile tạm, thao tác UI/capture/benchmark và smoke mở `/song` nguyên trạng; không bật LIVE hoặc sửa dữ liệu thật.
- `ASSET_AUDIT.md`: kiểm kê, kết luận phối cảnh/canvas/alpha, thiếu và cần tách lại, giới hạn, hướng dẫn mở preview và bằng chứng.
- `docs/07-0/`: 2 ảnh preview 9:16, 1 ảnh so sánh concept, 3 contact sheet, 2 ảnh `/song` nguyên trạng, browser report và log npm test. Được sao chép từ test-results sau kiểm tra trực quan để giữ bằng chứng cùng tài liệu, chưa commit.
- `PROGRESS.md`: bổ sung mục này, giữ lịch sử. Thư mục phases và main.jpg là file người dùng thêm, không tạo lại hay sửa.

**Không thay đổi** `public/song.html`, `public/js/*`, CSS live, scene/camera/nhân vật/battle, thuật toán, quà, TikTok, WebSocket/API, storage, `caidat.json`, package/dependencies, 26 PNG nguồn. Git diff các file đã tracked xác nhận điều này; 26 SHA-256 nguồn sau QA khớp manifest.

## Kết quả kiểm thử

| Hạng mục | Kết quả |
|---|---|
| `npm.cmd test` sau sửa cuối | **PASS: 92 bài — 91 PASS / 0 FAIL / 1 SKIP**; [log](docs/07-0/npm-test-after.txt). SKIP vẫn là LIVE thật, không tăng lỗi so baseline |
| Audit toàn bộ PNG | **PASS kỹ thuật: 26/26**, CRC hợp lệ, 25 RGBA/1 RGB; không file thiếu trong layout; không coi file hợp lệ là đã đạt mỹ thuật |
| `node scripts/asset-preview-smoke.js` | **PASS: 25 kiểm tra**, Chrome 156/ANGLE Intel HD P530 D3D11, 0 exception; [report](docs/07-0/browser-report.json) |
| X/Y/scale/opacity/z/anchor, crop full/alpha, drag vị trí/thứ tự, hide/show, zoom/pan/reset | **PASS**; hide giảm đúng 1 draw call; 12 lần chỉnh giữ texture/geometry |
| Xuất JSON file mới, import JSON hợp lệ/sai, concept JPG cục bộ/opacity | **PASS**; JSON sai/concept mất giữ layout và ảnh trước; preview không gửi API/WS hay request ghi state |
| PNG path có dấu cách; gallery trên checker/trắng/đen | **PASS load đủ 26 ảnh**, có ảnh thật; biên ở kích thước cuối vẫn cần rà riêng |
| Capture đúng 720×1280 và 1080×1920, compose/compare | **PASS**; đã xem trực tiếp ảnh và sửa lỗi thanh cuộn làm hẹp canvas, nhãn chồng concept. Import concept lỗi cũng đã sửa |
| `/song` hiện hữu mở ở hai khung 9:16 với data tạm 0 người/dừng | **PASS smoke mở trang**, 0 exception/fallback tắt. Không đồng nghĩa đã chạy lại toàn bộ kịch bản game bằng browser |
| Chất lượng khớp concept hoàn toàn | **FAIL/CHƯA ĐẠT**: sân/props cắt nguồn, thiếu cành đào/aura/đường nối, nhân vật khác tỷ lệ chibi, vòng pháp trận xấp xỉ phối cảnh bằng scaleY; liệt kê đầy đủ trong ASSET_AUDIT.md |
| Alpha sạch ở mọi zoom, bộ animation/pose chuyển tiếp, gameplay browser 10/30/60, OBS/LIVE, nhiều giờ | **CHƯA KIỂM CHỨNG trong lượt này**; không sửa live để né các giới hạn |

Preview 720×1280: **60.6 FPS**, 26 draw calls, 52 triangles, 19 GPU texture dùng chung/26 geometry, RGBA ước tính **114.0 MiB**. Preview 1080×1920: **59.5 FPS**, 26 draw calls, 52 triangles, 19 GPU texture dùng chung/26 geometry, RGBA ước tính **114.0 MiB**. Bài đo render liên tục chỉ 3 giây cho cảnh tĩnh; không đánh giá hiệu năng `/song` hay giải quyết lỗi FPS của 06.2. Toàn bộ 26 ảnh RGBA khoảng 156 MiB chưa tính bộ nhớ browser/framebuffer. Cần ngân sách Low và đo thiết bị yếu khi được phép tích hợp.

Ảnh: [preview 1080×1920](docs/07-0/preview-1080x1920.png), [preview 720×1280](docs/07-0/preview-720x1280.png), [so sánh 9:16](docs/07-0/comparison-1080x1920.png), [contact sheet](docs/07-0/asset-contact-sheet.png). `/song` nguyên trạng: [720](docs/07-0/song-unchanged-720x1280.png), [1080](docs/07-0/song-unchanged-1080x1920.png); có các dòng HUD đầu trang sát/chồng nhau, giữ nguyên vì ngoài phạm vi audit.

Nền/công trình **không chung một hệ tọa độ concept**: canvas khác kích thước và vật thể đặt riêng giữa khoảng trong suốt; offset/crop đã nằm trong JSON. Viền màu ở RGB nguồn có phần thuộc alpha rất thấp, không đồng nghĩa toàn bộ hiển thị đục như ảnh xem raw; vẫn cần kiểm/rà alpha sạch trước dùng thật. Không tự chỉnh/tách lại PNG trong lượt audit.

Mở `npm.cmd start` → `/asset-preview.html` trên cổng của app (mặc định 3000). Đã xuất audit/JSON/screenshot để đánh giá; **dừng sau 07.0, không chuyển 07.1, không commit/push**. Lịch sử 06.2 chưa đạt hiệu năng bên dưới vẫn có hiệu lực; lượt audit không nghiệm thu thay cho phần đó.

---

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
