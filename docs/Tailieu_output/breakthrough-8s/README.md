# Độ kiếp8 giây — 09/11/2026

**Đã cấu hình và kiểm thử** theo lựa chọn người dùng. Nghi thức mới mặc định **8 giây**, thay12 giây trước đây. Cập nhật đúng `DEFAULT_RULES.breakthroughDurationMs` và `caidat.json`; kiểm tra cấu hình/restore cho phép8–20 giây.

Mây vẫn bật khi tới đài tại1,5 giây; sét từ1,8 giây, còn6,2 giây trình diễn, vòng2/3 giây bằng bốn PNG như trước. Xác suất, roll, Đan, bảo hộ, Thiên Mệnh, cooldown, phần thưởng và camera không đổi. Unity dùng duration server, không cần sửa runtime/scene/assets.

Save đang dở giữ nguyên duration/elapsed/outcome đã lưu, kể cả12/20 giây; không reroll, không sửa hoặc xóa dữ liệu người chơi. Các nghi thức mới dùng8 giây. Khởi động lại Node để nạp cấu hình; không tự ngắt server đang chạy hoặc phiên LIVE.

- **Node PASS140 / FAIL0 / SKIP1** trong141 bài core. Ba bài mới kiểm tra mốc7999/8000ms, success/failure đúng một lần/cooldown; khôi phục8/12/20 giây không reroll và pause/battle giữ tiến độ; HTTP→WS gửi8000ms/durable restart và giữ sentinel dữ liệu thật. [Log Node](node-core.log).
- **Unity6000.5.9f1 PASS9/9 / FAIL0 / SKIP0**, Concept02StormTests trong project kiểm thử riêng. Editor lấy mẫu các duration8/10/12/20 giây và số đợt1/3/10, gồm DTO và FX; Play Mode hồi quy với fixture cũ. Không gọi kết quả này là đã chạy LIVE8 giây từ đầu đến cuối. [XML Unity](unity-tests.xml).
- **Audit bảo toàn PASS:** [báo cáo](verification.json),1.132 file bảo vệ giữ SHA256 theo baseline; `caidat.json` chỉ đổi đúng thời lượng. Không sửa scene, prefab, ảnh/GUID, package hoặc dữ liệu người chơi. Không mở project Unity riêng, commit/push hoặc tự restart Node.
- **CHƯA KIỂM CHỨNG:** nghi thức8 giây đầy đủ trên TikTok LIVE thật, build Windows mới và OBS. Không chụp lại ảnh vì runtime/scene/hình ảnh không đổi; thời lượng8 giây được kiểm tra qua Node và mẫu FX Unity.

Helper Unity hiện hữu hỗ trợ `-OutputName breakthrough-8s -FocusedFilter TuTienLive.Tests.Concept02StormTests` để giữ riêng bằng chứng, không ghi đè báo cáo lượt camera trước.
