# Qua_Tbao mục9 — camera, nhập môn và người donate Ban Phúc

Ngày 09/11/2026. Theo sáu lựa chọn của người dùng. **Đã triển khai, kiểm thử và ghép vào scene nguồn Concept02.** Cơ chế mục9 thay mô tả camera cũ của mục8.

## Hành vi đã chọn

- Sau15 giây không có hoạt cảnh camera, chọn đều một kiểu đủ điều kiện: zoom một tu sĩ bất kỳ, đi qua lại, theo người đang độ kiếp. Mỗi lượt8 giây rồi về toàn cảnh và chờ lại15 giây. Không có người độ kiếp thì chỉ chọn zoom/pan; không có tu sĩ thì chỉ pan. Tim/bình luận thường không reset thời gian. Độ kiếp không còn ép follow mỗi frame.
- Quà cá nhân/Quay Cam ưu tiên cao hơn nhập môn và random. Camera chuyển thẳng mượt từ vị trí đang xem tới người nhận, không bắt buộc về toàn cảnh trước. Quà A xong3 giây mới tới B theo FIFO; cùng người/vật phẩm được gộp khi phù hợp, giữ giới hạn hàng đợi hiệu ứng cũ.
- Người mới nhập môn bay3 giây từ ngoài khung hình vào ghế. Nhiều người bay cùng lúc, camera theo người mới nhất. Quà ngắt camera thì nhân vật vẫn bay; hết quà chỉ theo lại người mới còn bay. Người cũ nhập lại/reconnect/mở client không phát lại đường bay. Giữ giới hạn render/ghế/pool cũ, không tạo500 nhân vật cùng lúc.
- Trong boss/TB02 chỉ giữ toàn cảnh và nhận sự kiện chờ. Về tu luyện mới chạy zoom quà/nhập môn; pause/stopped đóng băng camera/đường bay. Kể cả chuyển thẳng sang boss đang pause cũng nhả góc camera tu luyện. Gameplay quà/buff/phần thưởng vẫn theo server, không chờ hoạt cảnh.
- Ban Phúc toàn tông giữ camera như cũ. Popup do donate thêm tên/ảnh đại diện donor; phần thưởng boss/cấp tông không gán donor. Khác donor được xếp popup riêng2 giây, không gộp tổng phúc vào một tên; cùng donor đang hiện có thể cộng số lượng mà không kéo dài vô hạn.

## Ảnh đại diện

Node chỉ lấy ảnh từ `user.avatarThumb/Medium/Large.urlList` của sự kiện gift SDK hiện hữu, giữ URL HTTPS thuộc CDN ảnh TikTok được kiểm tra. Chỉ truyền `donor:{userId,name,avatar}` trên `blessing:activated`, không gửi toàn bộ profile/raw TikTok. Quà chờ trước nhập môn giữ metadata tùy chọn qua restart; player schema và envelope v1 giữ nguyên. Không tải ảnh ở backend hoặc ghi ảnh vào asset/save người chơi.

Unity dùng `DonorAvatarView`: một request tại một thời điểm, timeout5 giây, không theo redirect, tối đa512KiB/ảnh và1024×1024 sau giải mã; cache bộ nhớ tối đa8 ảnh, dọn khi hủy. Thiếu ảnh/URL không hợp lệ/tải lỗi dùng chữ đầu tên. Không dùng ảnh tải ngoài làm tài nguyên game.

Chỉ thêm hai module **có sẵn trong Editor** `com.unity.modules.imageconversion` và `com.unity.modules.unitywebrequest`1.0.0 để giải mã/tải avatar; không cài Editor, font/asset hoặc đổi phiên bản package cũ.

## Trạng thái kiểm chứng

- **Node PASS137 / FAIL0 / SKIP1** trong138 bài core. Bốn bài mới kiểm tra URL/native gift, attribution đúng một lần, save quà chờ/tương thích cũ và HTTP→WS thật bằng dữ liệu tạm; LIVE thật là SKIP.
- **Unity 6000.5.9f1 PASS 87/87 / FAIL 0 / SKIP 0** ở lượt cuối trên project kiểm thử riêng. Gồm 7 bài Camera9, các bài quà/camera đã cập nhật và hồi quy boss/TB02/audio/K01/độ kiếp/nhân vật/protocol. Bảy bài Camera9 kiểm tra random15s/đủ ba kiểu, bay đồng thời/theo người mới nhất/pool, gift handoff/FIFO, boss/pause/reconnect, donor/fallback/queue/validation, installer và Play Mode. [XML lượt cuối](unity-tests.xml); [Node core](node-core.log). Lượt 7/7 chạy riêng trước đó lưu trong [XML Camera9](unity-camera9-tests.xml); XML 87 bài là kết quả sau các chỉnh sửa cuối.
- **GPU PASS**, NVIDIA Quadro M1000M: sáu mẫu pan/zoom/follow/arrival/gift/donor, mỗi mẫu 1080×1920 và 720×1280. Đã xem ảnh; camera bám trong khung nền gốc khi theo người bay, zoom đặt tâm mesh người nhận vào tâm khung hình. Bảng tên giữ vị trí đã thiết kế trên đầu nhân vật. [Báo cáo capture](capture-report.json).
- **Ghép/audit PASS**: giữ SHA256 của **1.092 file được bảo vệ**, gồm dữ liệu người chơi, cấu hình và tài nguyên cũ. Giữ **773 document scene gốc**, chỉ đổi bốn document để bật arrival/idle15s/nối donor UI; thêm **18 document** đã kiểm thử. Góc camera, viewport, prefab, ghế, ảnh/GUID và phiên bản package cũ không đổi. Chỉ bổ sung hai module builtin nêu trên. [Audit cuối](final-verification.json).
- **CHƯA KIỂM CHỨNG:** ảnh CDN/nhận quà TikTok LIVE thật, build Windows mới, OBS, nghe/cân âm và FPS stream. Avatar LIVE thật cần URL thật; các kiểm thử hiện tại dùng metadata/fallback, không giả nhận đã tải ảnh CDN thành công.

## Ảnh đối chiếu

- [Pan](pan-720.png), [zoom tu sĩ](zoom-720.png), [theo độ kiếp](follow-720.png).
- [Người mới bay vào](arrival-720.png), [nhận quà](gift-720.png), [Ban Phúc có donor](donor-720.png).
- [Chỉ hiện riêng người nhận để đối chiếu tâm camera](gift-focus.png) là ảnh chẩn đoán, không phải chế độ ẩn các tu sĩ trong game. Các ảnh tương ứng độ rộng1080 có tên `*-1080.png` cùng thư mục. Ảnh donor dùng chữ đầu tên do fixture không có URL ảnh; chưa chứng minh tải CDN thật thành công.

## Vị trí và cách nạp

`IdleCameraPresenter` điều phối random/arrival; `ItemReceiptPresenter` giữ hàng đợi ưu tiên quà; `CharacterManager.arrivalFlights` bật riêng Concept02; `CameraRig` chuyển trực tiếp từ góc đang xem. Donor UI dưới `BlessingReceiptFX/DonorAttribution`, nối `BlessingReceiptPresenter` và `DonorAvatarView`.

Khởi động lại Node, dừng Play và mở lại `Assets/Scenes/SectScene_Concept02.unity`, rồi Play. Menu **Tu Tien LIVE → Concept 02 → Apply camera section 9** hỗ trợ scene đang mở chưa reload, cài lặp không nhân panel. Không tự restart server đang chạy, không đụng project riêng `public/unity-client/My project/`, không commit/push.

Script kiểm chứng: `camera9-prepare.js`, `camera9-fixtures.js`, `Run-Camera9Unity.ps1`, `camera9-publish.js`. Chỉ chạy Unity helper trên `test-results/unity-concept02/project`.

Lỗi/điều chỉnh đã xử lý khi kiểm chứng: thêm module builtin để biên dịch tải/giải mã ảnh; Play Mode chờ trạng thái thật thay vì chờ cố định vài frame; chặn delta hitch để không bỏ qua toàn hoạt cảnh quà; tính tâm mesh theo local bounds và giữ frustum trong toàn cảnh gốc để tránh lộ nền đen. Công cụ capture chờ vòng cập nhật Editor và tính lại vị trí icon sau đổi kích thước render target. Lượt cuối không còn lỗi phát hiện trong phạm vi kiểm thử; LIVE/ảnh CDN và build/OBS vẫn cần kiểm chứng riêng.
