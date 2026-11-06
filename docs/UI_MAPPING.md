# Ánh xạ giao diện quản trị

Khảo sát trước chỉnh sửa theo phases/UI.md. Git ban đầu: main sạch, chỉ phases/UI.md là tệp người dùng chưa track. Không commit/push trong công việc UI này.

| Chức năng cũ | Module/đầu vào | Trang mới |
|---|---|---|
| Chọn demo/LIVE; username/khóa ký; NỐI/NGẮT; trạng thái/lịch sử | livePanel.js → mode/liveConnect/liveDisconnect | Trang chủ, thẻ kết nối |
| Đồng hồ/pha/người chơi/chiến trường/BT queue/FPS/tick/RAM/realms/events | streamerPanel.js, GET /api/dashboard và một kết nối WS /ws | Trang chủ, 6 thẻ + thông tin kỹ thuật |
| Start/resume/pause/endCycle; copy /song; bật tiếng tại tab | streamerPanel.js → phase/endCycle; AudioRuntime; clipboard | Trang chủ, điều khiển nhanh |
| Audio bật/tắt/music/effects/speech, 4 volume, bật tại tab/nghe thử | streamerPanel.js → audioSettings, audio.js không đổi | Cài đặt / Âm thanh |
| Camera/graphics; damage/shadows/autoQuality/particle/light/notice; minshot/cooldown/4 priority/auto camera | index/admin/streamerPanel → camera/graphics/displaySettings/cameraSettings | Cài đặt / Hiển thị & camera |
| MaxMultiplier/fateFailures + bảng chỉ số 11 cảnh giới | cultivationPanel.js → cultivationSettings | Cài đặt / Tu luyện & độ kiếp |
| Hai thời gian pha; 3 K boss/solo | battlePanel.js/streamerPanel.js → battleSettings/balanceSettings | Cài đặt / Chiến trường & boss |
| EXP/cooldown/hạn mức nhiệm vụ và mô tả giá đổi hiện có | streamerPanel.js/cultivationPanel.js → balanceSettings | Cài đặt / Nhiệm vụ |
| Reconnect/delay/attempts/Nguyện Lực/cooldown + CRUD bảng quà 5 item/effect/quantity/enabled | livePanel.js → liveSettings/giftRules | Cài đặt / TikTok & quà |
| Tạo 10/30/60/100/500 người; pause/resume/stop | index/admin.js → demo/phase | Demo / Tạo đạo hữu |
| Chọn người; focus/attack/celebrate/teleport/run/fly/bow; chuyển pha | index/admin.js → event/phase | Demo / Hoạt cảnh |
| Speed/animationPreview/Viên Mãn/quest/checkin/command/userId/name; tiến trình BT/EXP/buff/túi/đổi/dùng/cấp item | cultivationPanel.js → API cũ | Demo / Tu luyện, Vật phẩm, Bình luận |
| Demo 44 người/11 realm, chọn battlefield, skill1/2, trạng thái boss/reward | battlePanel.js → battleDemo/battleView/command | Demo / Chiến đấu |
| Like/follow/member/gift/combo/replay/offline/drop/end/disconnect | livePanel.js → demoLiveEvent/demoConnection | Demo / Sự kiện TikTok |
| Nhật ký thao tác 12 dòng; history TikTok và diagnostic hiện có; event WS | admin.js/livePanel.js/WS game:event | Trang chủ gần đây + Nhật ký có lọc, giới hạn RAM; không thêm lưu log backend |
| Tra cứu tên/userId + followPlayer/cameraFocus | streamerPanel.js → state/cameraFocus/camera | Sao lưu / Tra cứu |
| Download/restore/reset + 2 xác nhận/nonce/auto backup | streamerPanel.js → /api/backup, /api/data-confirmation, restoreData/resetData | Sao lưu / Dữ liệu; giữ nguyên mode và schema |
| Nút xóa demo cũ | admin.js → streamerPanel.reset | Sao lưu / reset có xác nhận, không mất đường dẫn chức năng |
| Mở nguồn phát | href /song target=_blank | Header chung của mọi trang |

Kiến trúc: ES Modules, các trang tạo một lần, đổi hash chỉ ẩn/hiện DOM. Giữ một WS và một vòng poll dashboard, không dựng lại handler/AudioRuntime khi chuyển trang. CSS quản trị riêng, SVG trang trí tự viết bằng code. Form đồng bộ chỉ cập nhật trường chưa sửa, lưu phần đã sửa qua API cũ; bảng quà giữ API mảng hiện có. Backend/TikTok adapter/game/Three.js/audio engine/network protocol không đổi.
