# TB02 Huyết Báo — cảnh báo boss và SFX Unity

Ngày09/11/2026. Người dùng chọn **TB02 / warning-TB02** và yêu cầu đưa tài nguyên liên quan vào Unity. **Đã triển khai, kiểm thử và ghép vào scene nguồn Unity Concept02.**

## Tài nguyên trong Unity

| Nội dung | Vị trí |
|---|---|
| Cảnh báo3 giây đã chọn | `Assets/Musics/SFX/Boss/warning-TB02.wav` |
| Đòn thường | `Assets/Musics/SFX/Boss/attack-normal.wav` |
| Kỹ năng1 /2 | `Assets/Musics/SFX/Boss/attack-skill1.wav`, `attack-skill2.wav` |
| Khung và ấn cảnh báo | `Assets/Editor/BossWarningSetup.cs`, `Assets/Scripts/UI/BossWarningSigil.cs` |
| Trình diễn cảnh báo | `Assets/Scripts/Effects/BossWarningPresenter.cs` |
| UI trong scene | `07_UI/UI_Canvas/TB02_BossWarning` của `SectScene_Concept02` sau khi ghép |

Bốn WAV được **chuyển nguyên byte**, SHA256 giữ đúng bản thiết kế đã gửi. `.meta`/GUID được giữ và cấu hình PCM, mono, DecompressOnLoad. GameAudioManager có bốn ô AudioClip tương ứng, giữ BGM và các âm thanh cũ. Không có tài nguyên runtime nào cần đọc từ thư mục tài liệu.

Khung/biểu tượng TB02 là geometry UGUI tạo bằng code và font sẵn có; không dùng ảnh chụp thiết kế làm texture trong game. Các PNG/HTML tài liệu và hai âm cảnh báo chưa chọn TB01/TB03 giữ để đối chiếu. Trang nghe thử đã cập nhật đường dẫn tới WAV trong Unity. Không tải font/hình/âm thanh ngoài hoặc thêm package.

## Luồng chạy

Mỗi boss mới có3 giây cảnh báo, đếm3→2→1, phát warning-TB02 và rung camera nhẹ. Boss/sprite/HP/projectile ẩn; tu sĩ giữ chỗ và chờ. Hết cảnh báo theo snapshot Node mới hiện boss và bắt đầu đủ thời gian đánh đã cấu hình. Thanh tiến độ neo trái và thu dần, không chặn chuột; không đưa ID chọn thiết kế vào HUD chơi.

Node giữ clock cảnh báo, chặn cả hit trực tiếp/kỹ năng trước khi boss xuất hiện và không tiêu cooldown/lượt kỹ năng khi từ chối. Trong intro không giảm thời gian combat, cooldown, buff hoặc tu vi. Boss kế tiếp luôn có cảnh báo riêng; đòn chí mạng của một volley không tràn sang boss tiếp theo. HP, sát thương, phần thưởng và người nhận thưởng giữ luật cũ ở Node.

Pause/stopped giữ số đếm, tạm dừng SFX và tắt rung; resume tiếp tục. Reconnect đang intro seek âm theo elapsed server, không phát lại từ đầu. Mất kết nối/trả tu luyện/disable tắt cảnh báo và kênh rung riêng, không xóa rung Ban Phúc hoặc thay pose/zoom gốc. Save cũ thiếu clock cảnh báo tiếp tục boss hiện tại, boss mới dùng intro; không sửa hàng loạt dữ liệu người chơi.

Attack thường/kỹ năng1/kỹ năng2 phát theo `battle:hit` từ Node, chống lặp event và throttle/voice budget hiện hữu; ưu tiên warning trên attack. Tôn trọng master/effects mute, âm lượng và maxVoices từ server. Không phát một sound cho từng projectile hay từng frame.

## Kiểm chứng

- **Node PASS133 / FAIL0 / SKIP1** trong134 bài core. SKIP là LIVE TikTok thật. Bao gồm bốn bài mới về gate3 giây, volley không xuyên boss, fractional pause/save/restart, tương thích save cũ và từ chối clock hỏng; HTTP/WS/disk/restart và phần thưởng được chạy lại.
- **Unity PASS74/74 / FAIL0 / SKIP0:**5 TB02,6 boss,5 audio,58 hồi quy K01/storm/Concept02/variant/item/camera/protocol. Có Play Mode thực kiểm tra seek/pause/resume/reveal, ba SFX attack/chống trùng/mute, pool16 source. Năm bài TB02 cũng PASS5/5 riêng trước lượt cuối. [XML lượt cuối](unity-tests.xml), [XML TB02 riêng](unity-warning-tests.xml).
- **GPU1080/720 PASS**, NVIDIA Quadro M1000M. Đã xem ảnh boss1/boss2/boss3 cảnh báo và sau3 giây, không tràn tên, đúng phong cách TB02. [Boss1](warning1-1080.png), [boss2 720p](warning2-720.png), [boss3](warning3-1080.png), [pause số2](paused-1080.png), [boss xuất hiện](revealed-1080.png), [trả tu luyện](cultivation-1080.png), [report](capture-report.json).
- **Chrome PASS4/4**, không lỗi JS: settings/lưu/reload/kỹ năng và renderer Three.js ẩn boss trong intro/hiện sau intro. [Báo cáo](browser/browser-report.json).
- **Ghép/audit PASS:**1.061 file bảo vệ giữ SHA256,713 document scene cũ giữ nguyên trừ child Canvas và bốn tham chiếu AudioClip, thêm60 document TB02 đã test; camera/viewport/pose gốc giữ byte. Các WAV giữ nguyên SHA256 của bản thiết kế được chọn. [Báo cáo bảo toàn](preservation-report.json), [audit cuối](final-verification.json), [Node core](node-core.log).
- **CHƯA KIỂM CHỨNG:** build Windows mới, OBS, LIVE thật, nghe/cân âm trên loa/tai nghe. Kiểm tra PCM/giải mã/AudioSource không đồng nghĩa đã nghe bằng tai.

Đã sửa lỗi getter khi activeBoss còn null lúc join, lỗi test closure qua domain reload, kỳ vọng test event trùng bị protocol từ chối; thanh tiến độ đổi chiều rộng trực tiếp vì Image không có sprite. Báo cáo đọc đúng UTF16LE của PowerShell. Không còn lỗi được phát hiện trong phạm vi kiểm chứng cuối.

Kiểm tra syntax/khoảng trắng code và tài liệu PASS. YAML scene giữ nguyên định dạng do Unity sinh, gồm dấu cách sau các field rỗng mà `git diff --check` cảnh báo; không chuẩn hóa lại vì cần giữ byte các document cũ và khớp scene đã test.

## Cách nạp sau khi ghép

Khởi động lại Node để nạp cơ chế cảnh báo. Trong Unity dừng Play, mở lại `Assets/Scenes/SectScene_Concept02.unity`, rồi Play. Menu **Tu Tien LIVE → Concept 02 → Add TB02 boss warning** hỗ trợ scene đang mở chưa reload, không tạo trùng. Các slot clip ở GameAudioManager dưới `08_Systems` có thể xem/chỉnh trong Inspector.

Các script kiểm chứng: `boss-warning-prepare.js`, `boss-warning-assets.js`, `Run-BossWarningUnity.ps1`, `boss-warning-publish.js`. Chỉ dùng project kiểm thử tại `test-results/unity-concept02/project`, không đụng project riêng `public/unity-client/My project/`; không tự commit/push hoặc restart server đang chạy.
