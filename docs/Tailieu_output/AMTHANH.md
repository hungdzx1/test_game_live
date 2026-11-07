# Quản lý âm thanh Unity

Thực hiện theo [AMTHANH.md](../Tailieu/AMTHANH.md). Dùng đúng5 file đã có trong `unity-client/Assets/Musics`, không tải thêm asset/package.

## Thay clip trong Unity

Mở `Assets/Scenes/SectScene_Concept02.unity` hoặc `SectScene_Main.unity`, chọn **08_Systems → GameAudioManager**. Component `GameAudioManager` có5 ô kéo thả AudioClip, đã gán sẵn:

| Ô trong Inspector | File hiện tại | Lúc phát |
|---|---|---|
| BGM — Nhạc nền (loop) | `BGM.mp3` | Loop sau khi Unity nhận snapshot hợp lệ |
| Sfx_banphuc — Ban Phúc | `Sfx_banphuc.mp3` | Ban Phúc kích hoạt hoặc được cộng thêm thời gian |
| sfx_SDokiep — Độ kiếp thành công | `sfx_SDokiep.mp3` | Server thông báo độ kiếp thành công; thất bại không phát clip này |
| sfx_lv_up_TM — Tông môn tăng cấp | `sfx_lv_up_TM.mp3` | Chuyển lên cấp tông môn tiếp theo; đầy MAX không phát tiếng lên cấp |
| sfx_fly — Bay lên/xuống | `sfx_fly.wav` | Bắt đầu bay lên đài hoặc bay về chỗ; cả tư thế bay từ công cụ Demo |

Thay file bằng cách kéo một AudioClip khác vào ô tương ứng, rồi lưu scene. Không cần sửa C#. Để trống ô nào thì bỏ tiếng đó, không làm lỗi game.

Scene có thêm1 AudioListener (hai scene trước đây chưa có listener). Nhạc/hiệu ứng là âm thanh2D, không đổi âm lượng theo vị trí camera hoặc nhân vật. BGM tiếp tục loop khi game tạm dừng/dừng nhưng vẫn còn kết nối server; mất kết nối thì dừng nhạc và hiệu ứng. Có snapshot lại thì nhạc tiếp tục phát, không phát lại Ban Phúc/độ kiếp/tăng cấp cũ.

Với scene mới đã có `SectSceneBindings`, dùng **Tu Tien LIVE → Audio → Add audio manager to current scene**, rồi lưu. Lệnh gán năm file mặc định nếu chưa có manager; nếu đã có thì giữ clip/tham chiếu của người dùng. Không cần tự tạo lại object trong hai scene đã được gán sẵn.

## Chỉnh âm lượng từ server

1. Chạy Node, mở trang quản trị → **Cài đặt → Âm thanh**.
2. Chọn Bật âm thanh, Nhạc nền, Hiệu ứng theo nhu cầu.
3. Chỉnh **Âm lượng tổng**, **Nhạc**, **Hiệu ứng** rồi bấm **Lưu âm thanh**.
4. Unity cập nhật ngay qua WebSocket; cài đặt lưu trong `caidat.json`, giữ qua restart. Không cần dừng Play để đổi âm lượng.

Âm lượng thực tế: **nhạc = Tổng × Nhạc**, **SFX = Tổng × Hiệu ứng**. Ví dụ Tổng80%, Nhạc30% →24%; Tổng80%, Hiệu ứng60% →48%. Bật/tắt tổng hoặc đặt Tổng0 dừng cả hai kênh. Bật/tắt Nhạc/Hiệu ứng chỉ tác động kênh đó.

**Nghe thử tại tab này** và **Giọng Thiên Đạo** trên web vẫn dùng bộ âm thanh/giọng trình duyệt hiện hữu. Các nút này không nghe thử năm clip Unity; clip Unity phát trong cửa sổ Unity/Windows player. Khi capture OBS cần thu âm thanh của Unity hoặc thiết bị đầu ra phù hợp, tránh thu trùng âm nghe thử của tab quản trị.

## Xử lý sự kiện và tải

- Node giữ hợp đồng API/WS và toàn bộ gameplay; Unity chỉ nhận `config.audio` cùng sự kiện. Không đổi schema người chơi, quy tắc quà, tu vi, nguyên lực hoặc DEMO/LIVE.
- Ban Phúc theo `blessing:activated`; thành công theo `breakthrough:completed` có `outcome=true`; cấp tông môn theo `sect:level` với cấp đích cao hơn cấp hoàn tất.
- Tiếng bay theo chuyển tư thế của nhân vật đang được trình diễn, một lần khi bắt đầu mỗi lượt bay. Không phát theo mỗi snapshot/frame; người chơi ẩn không tạo hàng trăm tiếng bay. Lần đồng bộ đầu/reconnect không phát lại tư thế bay đang dở.
- Có16 AudioSource SFX được tạo một lần khi Play, hoạt động theo `config.audio.maxVoices` hiện hữu (mặc định8, giới hạn2–16). Khi đầy ưu tiên tiếng độ kiếp/tăng cấp/Ban Phúc hơn tiếng bay; tiếng cùng loại cách nhau dưới150ms được gộp. Đây chỉ là giới hạn âm thanh, không bỏ đóng góp/phần thưởng.
- Chống trùng event; không giữ hàng chờ SFX khi mute/disconnect. Đổi dữ liệu/session dừng tiếng cũ. Cấu hình âm lượng sai làm Unity im tiếng an toàn, không ngừng hiển thị/gameplay.
- `GameAudioSetup` và script đồng bộ chỉ bổ sung manager vào scene. Mọi object đã có giữ nguyên, chỉ thêm tham chiếu con tại `08_Systems`. Không đổi camera, layout, tỉ lệ nhân vật, prefab hoặc asset hình/âm thanh được cung cấp.

Mã chính: `unity-client/Assets/Scripts/Audio/GameAudioManager.cs`; menu Editor: `unity-client/Assets/Editor/GameAudioSetup.cs`. Fixture kiểm thử do Node tạo bằng `scripts/unity-audio-fixtures.js`; các file này không phải save game.

## Kết quả kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| Node mặc định | **115 PASS / 0 FAIL / 1 SKIP**,116 bài/23 file; SKIP là LIVE thật |
| Browser cài đặt | **PASS**, ba thanh âm lượng/bật tắt/lưu/reload/API, không runtime exception |
| Unity Editor/suite | **60/60 PASS**, gồm6 bài âm thanh và54 bài hồi quy; hai scene gán đúng clip/listener, không ghi đè clip khi chạy lại menu |
| Unity Play Mode Concept02 | **PASS**, đúng clip/sự kiện, bay lên-về một lần, chống trùng/reconnect, volume/mute/kênh/ngân sách/thiếu clip, BGM loop và tín hiệu GetOutputData khác0 |
| Node ↔ Unity thực | **PASS**, HTTP chỉnh backend tạm → WebSocket → AudioSource; nhạc.24/SFX.18 đúng phép nhân, tim đạt cấp phát Ban Phúc+tăng cấp, mute dừng hai kênh |
| Bảo toàn | **PASS**,252 file giữ hash và2 scene chỉ thêm phần quản lý âm thanh; dữ liệu người chơi và file âm thanh gốc giữ nguyên |
| Main Play Mode riêng, Windows build mới, nghe/cân chỉnh qua loa/tai nghe, capture OBS/LIVE thật | **CHƯA KIỂM CHỨNG** |

Kết quả/diễn giải đầy đủ tại `PROGRESS.md`; evidence ở [amthanh](amthanh/). Tests dùng Unity6000.5.9f1 và backend/project/data/profile riêng, không dừng Editor đang mở. Bài Node ↔ Unity cần `scripts/unity-audio-test-server.js` và biến môi trường `TUTIEN_AUDIO_TEST_URL` trỏ tới địa chỉ loopback tạm; chạy thủ công không có backend này thì bài đó SKIP. Không coi đọc file/batch import là bằng chứng Play Mode hoặc nghe âm thực tế.
