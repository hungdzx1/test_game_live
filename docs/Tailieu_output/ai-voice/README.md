# Giọng Thiên Đạo Piper trong Unity

Phạm vi được duyệt: `docs/Tailieu/AMTHANH.md` mục2.1. Kết quả kiểm chứng cuối xem đầu `PROGRESS.md` và `verification.json` trong thư mục này. Không thay gameplay hoặc dữ liệu người chơi.

## Cách chạy

1. Khởi động lại Node để nạp `voiceService.js`, `voiceCache.js` và API mới. Không tự ngắt một phiên LIVE đang chạy để cập nhật.
2. Dừng Play, chờ Unity biên dịch rồi Play lại scene hiện hữu (`SectScene_Concept02` hoặc scene có `GameAudioManager`). Component `ThienDaoVoicePlayer` được gắn tự động lúc chạy; giữ nguyên scene và các AudioClip đã kéo vào Inspector.
3. Trong trang quản trị, bật **Âm thanh / Giọng Thiên Đạo**, đặt âm lượng tổng và âm lượng giọng đọc lớn hơn0, lưu. Các điều khiển dùng `config.audio` hiện có, không cần nhập API key.
4. Unity gọi manifest để khởi tạo model và làm nóng cache. Lần khởi động đầu mất thêm thời gian tạo câu/số; trong thời gian đó vẫn có thông báo chữ. Có thể xem trạng thái tại `http://localhost:3000/api/voice/manifest` (thay port nếu khác).
5. Chạy pha tu luyện rồi thử nhập môn bằng DEMO hoặc bình luận LIVE hợp lệ. Một đợt có A+10 người sẽ đọc tên A cùng10 người khác. Mỗi cửa sổ1 giây tạo một thông báo riêng.

Nếu chạy bản Windows đã build từ trước, phải build lại client để có mã giọng mới. Unity chỉ liên hệ Node cùng máy, host `127.0.0.1`/`localhost`, port lấy theo endpoint WebSocket; các endpoint ngoài máy bị từ chối.

## Luồng hoạt động

`Sự kiện đã được backend chốt → chọn/gom kịch bản → cache/Piper → event v1 → Unity tải đủ clip → phát theo đồng hồ DSP`.

- `tools/tts/piper/worker.py`: Python isolated, CPU, model local, từ chối gọi mạng, giao thức JSON-lines. Nạp một lần, kiểm tra phoneme, xuất PCM mono16-bit/22050Hz; giữ phần đệm âm đầu/cuối, cân mức âm và fade ngắn để giảm tiếng click.
- `voiceCache.js`: hash model/config/worker và nội dung; gộp tác vụ trùng, một tác vụ xử lý/128 tác vụ đợi, timeout từng tác vụ20 giây. Cache WAV riêng tối đa200MB, không có API nhận tên/đường dẫn tùy ý để tổng hợp.
- `voiceService.js`: chỉ quan sát sự kiện đã commit. Cửa sổ nhập môn cố định1 giây, tên tối đa40 ký tự; cache số1–100, số lớn hơn đọc đúng giá trị. Hết thời hạn2 giây dùng fallback; trả muộn không phát lại.
- `ThienDaoVoicePlayer`: một kênh lời thoại, tối đa20 thông báo đang chờ kể cả đang tải clip; ưu tiên/FIFO, hết hạn15 giây. Cache32 clip động và5 clip fallback/cảnh báo cố định. Clip chỉ vào RAM, không ghi file. Phụ đề lấy font có sẵn, không diễn giải rich text.
- Pause/stopped: dừng ở vị trí hiện tại và lên lịch lại phần còn lại khi tiếp tục. Các câu chưa phát vẫn hết hạn theo thời gian thực. Boss chỉ đọc nếu đủ thời gian kết thúc trước chuyển battle; ngắt lời thấp hơn khi cần, không đọc lại câu bị ngắt.
- Mất kết nối/đổi session/chuyển DEMO–LIVE/tắt giọng: dọn câu chờ, âm thanh và kết quả tải cũ. Snapshot chỉ sửa trạng thái, không kích hoạt đọc lịch sử.
- `GameAudioManager`: giữ SFX/BGM cũ, giảm BGM còn40% mức hiện tại khi lời đọc hoạt động; giọng dùng `masterVolume × speechVolume`, độc lập nút nhạc/hiệu ứng. Giới hạn `speechQueue` cũ tiếp tục phục vụ renderer trình duyệt; Unity dùng giới hạn20 đã duyệt.

## Hợp đồng bổ sung, tương thích v1

`GET /api/voice/manifest` trả `status`, `ready`, `prewarmed` và map5 clip cố định. `ready` là model và các fallback đã sẵn sàng; `prewarmed` là đã tạo xong toàn bộ cụm/số/cảnh giới. `disabled` nếu cấu hình tắt giọng; `unavailable` nếu model/runtime lỗi. Sau lỗi runtime, kiểm tra bộ Piper rồi restart Node để thử lại.

`GET /api/voice/clip/{hash64}.wav` chỉ trả WAV đã có trong cache; không chấp nhận tên file, URL ngoài hoặc yêu cầu tổng hợp. Các route dùng kiểm tra Host/Origin/loopback hiện hữu, không redirect và không công khai player save.

Event `voice:announcement` bổ sung vào `game:event`, giữ `version:1`, `sessionId`, `seq`, `serverTime` cũ. Payload gồm:

- `eventId`, `timestamp`, `voiceId`, `voiceType` (`join`/`donor`/`breakthrough`/`boss`).
- `text`, `priority`1–4, `count` (tổng người trong đợt nhập môn).
- `createdAt`, `deadlineAt=createdAt+2000`, `expiresAt=createdAt+15000` theo đồng hồ server.
- `clips`: danh sách1–8 hash WAV, `fallback`: hash câu dự phòng, `fallbackOnly`: backend đã chọn fallback hay chưa.
- `cycleId`: dành cho cảnh báo boss, còn lại null.

Piper chưa sẵn sàng hoặc lỗi dùng `voice:notice` với `text`, `createdAt`, `expiresAt`; Unity chỉ hiện chữ. Client cũ bỏ qua event không biết, không thay player schema hoặc phần thưởng. Các thông báo giọng không ghi vào save và không gửi lại khi nối WebSocket mới.

## Kiểm thử và mẫu nghe

- `npm.cmd test`: gồm `test/ai-voice.test.js`, dùng WAV tạo bằng code cho kiểm thử lỗi/thời gian/hàng đợi; không nhận fixture này là giọng Piper thật.
- `node scripts/ai-voice-benchmark.js`: đo model/tên/cache bằng Piper đã cài, xuất mẫu `tools/tts/piper/output/ai-voice-nhap-mon.wav`, không tự phát loa. File mẫu đọc “Chào mừng đạo hữu Thanh Vân cùng mười người khác gia nhập tông môn!”.
- `node scripts/ai-voice-test-server.js`: server thử riêng trên port ngẫu nhiên, chỉ dùng `test-results/ai-voice/data`, không nối TikTok. `scripts/Run-AiVoiceUnity.ps1` chạy nhóm focused/regression hoặc build trên bản sao Unity.

Benchmark chỉ đo thời gian tổng hợp/cache; không thay cho đo TikTok→Node→Unity phát âm thật. Chất lượng điểm nối, nghe loa, OBS/capture âm thanh và LIVE thật phải kiểm chứng riêng.

## Kết quả bàn giao

| Hạng mục | Kết quả |
|---|---|
| Node core160 bài | PASS159 / FAIL0 / SKIP1 LIVE thật;11 bài giọng mới |
| Unity Editor/EnterPlayMode | PASS105 / FAIL0 / SKIP0;95 baseline và10 bài giọng |
| WAV Piper/HTTP/WebSocket thực | PASS giải mã, mẫu có tín hiệu, lên lịch DSP và lệnh nhập môn thành một câu nhóm |
| Windows build | PASS,0 lỗi/2 cảnh báo API obsolete, khoảng607MB gồm executable và dữ liệu |
| Windows khởi động12 giây | PASS với nographics/noaudio; không suy ra GPU hoặc phát loa |
| Bảo toàn SHA256 | PASS1.971 file, bao gồm scene/asset/package/cấu hình/player save;0 thay đổi dữ liệu đồng thời |
| Nghe/ngữ điệu, layout GPU, OBS, TikTok LIVE/độ trễ dài hạn | CHƯA KIỂM CHỨNG |

Executable: `test-results/ai-voice/build/TuTienLive.exe`. Giữ cả thư mục build khi chạy/copy, Node vẫn phải chạy riêng. Hai cảnh báo build là overload tìm TMP dùng API cũ; build thành công trên Editor đã cài, không đổi package hoặc Editor để xử lý cảnh báo.

Các kết quả cùng mức ưu tiên được giữ FIFO ở backend kể cả khi tên B đã có cache còn tên A chưa tổng hợp xong. Các mức ưu tiên khác nhau độc lập, vì vậy cảnh báo boss không chờ người đang tổng hợp tên. Nhóm chờ và tác vụ tổng hợp đều có giới hạn; overload chỉ bỏ lời đọc, không mất sự kiện gameplay.
