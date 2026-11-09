# Nhận vật phẩm và camera — mục 5 Qua_Tbao.md

Mở `unity-client/Assets/Scenes/SectScene_Concept02.unity`. Khởi động lại server Node sau khi cập nhật rồi chạy Play để nhận sự kiện mới `item:received`.

| Vật phẩm server | Tên hiển thị | Ảnh trong Assets/Art/Items |
|---|---|---|
| tea | Trà ngộ đạo | tra_ngo_dao.png |
| pill | Độ kiếp đan | do_kiep_dan.png |
| root | Biến dị linh căn | bien_di_linh_can.png |

Chuỗi hiển thị kéo dài3 giây theo thời gian thực:0–0,8s pan/zoom tới giữa hình nhân vật;0,8–1,2s icon phía trên đầu lớn dần và có quầng sáng nhẹ;1,2–2,2s icon bay lên, hiện tên/số lượng rồi mờ;2,2–3s camera trở về đúng vị trí và mức zoom trước đó. Mốc “0,8–0,12” trong yêu cầu được hiểu là0,8–1,2s. Không thay tốc độ hoặc tạm dừng gameplay.

Theo xác nhận của người dùng: nhận quà **chuyển camera ngay cả khi đang độ kiếp**. Nhân vật độ kiếp vẫn nằm trên đài, diễn tiến/kết quả tiếp tục do Node quyết định. Người nhận ngoài25 nhân vật minh họa được đưa vào một chỗ hiển thị, tránh đè ghế của người đang độ kiếp.

Trong lượt quay cận, tạm ẩn các bảng tên world-space để chúng không phóng lớn che nhân vật/icon. Nhãn vật phẩm hiện tên người nhận và tên/số lượng vật phẩm. Kết thúc hoặc hủy hiệu ứng trả đúng trạng thái bảng tên trước đó; không sửa prefab.

Quà cùng người/cùng loại được cộng số lượng trong hàng chờ, hoặc trong0,8s đầu của lượt đang chạy. Quà đến sau khi icon đã hiện tạo lượt kế tiếp; mỗi lượt giữ chuỗi3s để camera không mắc kẹt vì quà liên tục. Các lượt khác chạy FIFO. Hàng chờ mặc định32 nhóm; khi quá tải chỉ bỏ hiệu ứng cũ, vật phẩm/phần thưởng trên server vẫn giữ nguyên. Pause giữ tiến độ; chuyển battle đưa lượt hiện tại về đầu hàng chờ và trả camera toàn cảnh, phát tiếp khi về tu luyện. Mất kết nối, đổi phiên hoặc tắt component hủy hiệu ứng và trả camera.

Trong Hierarchy:

- `08_Systems/ItemReceiptPresenter`: các reference icon, `Zoom Half Height` mặc định2,4 (cận4× từ toàn cảnh9,6, giữ nền kín ở cột ngoài cùng), giới hạn hàng chờ và tùy chọn gom. `Wait For Tribulation=false` theo lựa chọn của người dùng.
- `07_UI/UI_Canvas/ItemReceiptFX`: sửa kích thước icon, màu glow, kiểu chữ, khoảng cách tên/số lượng. CanvasGroup không chặn chuột và mặc định ẩn trong scene đã lưu.

Sự kiện chỉ được phát sau khi `ItemService.grantItem` cấp thành công, có `item`, `itemName`, `count`, `source`, `userId`, `eventId`, `timestamp`. Không lấy chênh lệch túi đồ để suy ra phần thưởng, vì đồ có thể được dùng ngay. Không dùng `live:gift` làm nguồn thứ hai để tránh đếm trùng; sự kiện đó có cooldown thông báo. Quà giữ chờ nhập môn chỉ phát khi đã cấp thực tế. Combo được chốt theo logic server cũ. Không thay schema lưu, API điều khiển, số lượng thưởng hoặc cách dùng đồ.

Để thử thủ công: trong DEMO, chọn một người chơi rồi dùng điều khiển cấp Trà/Đan/Linh căn hiện có; hoặc gửi quà DEMO đã ánh xạ sang ba loại này. Trong LIVE, hiệu ứng đi theo việc server cấp đồ thật. Không dùng chức năng cấp DEMO trong LIVE.

Dropdown quà DEMO đã đồng bộ ID/tên theo lựa chọn1/10/20 xu. Với cấu hình hiện tại: chọn **Cỏ bốn lá ·10 xu** rồi **Gửi quà đơn** để nhận Đan; chọn **Má hồng nhỏ xinh ·20 xu** để nhận Linh căn. Không cần tự điền lại Gift ID. Quy tắc phần thưởng vẫn do bảng Quà→vật phẩm đã lưu quyết định.

Phần6 (ảnh thông báo Ban Phúc, rung camera và SFX) đã được triển khai ở lượt riêng sau mục5; xem `../blessing-receipt/README.md`. PNG nguồn `tbao_ban_phuc.png` vẫn giữ nguyên byte; bốn prefab nhân vật,25 ghế và Main giữ nguyên.

Kết quả kiểm thử và giới hạn ghi ở đầu `PROGRESS.md`. `tests.xml`, `capture-report.json`, các ảnh mốc thời gian và `preservation-report.json` là evidence riêng của lượt này; build Windows/OBS/LIVE thật không được suy ra từ Editor hoặc ảnh chụp.
