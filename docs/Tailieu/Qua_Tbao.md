*### 1. cài đặt lại quà tặng*
**Trước hết hãy kiểm tra xem thư viện tiktok-live-connector (repo) xem có thông tin ID, tên quà, giá trị không rồi mới làm phần dưới này**

hãy sửa lại logic cài đặt quà tặng, khi ấn vào quà thì sẽ hiện ra danh sách các quà - giá trị để lựa chọn (có tìm kiếm) tương ứng với ID, tên của thư viện  tiktok-live-connector 
VD: hoa hồng - 1 xu | Trà ngộ đạo
Còn về cài đặt số lượng tim: tim | số lượng | quà/hành động

Nếu có tài liệu đầu ra thì đưa vào thư mục docs/Tailieu_output để tiện quản lý (Nếu không có thì thôi, không bắt buộc tạo)

### 2. Phần thông báo giọng AI
**Cập nhật sau**

*### 3. Cài đặt cấp cho tông môn*
Xóa đi phần Kết nối & nguyên lực (tim) trong phần cài đặt để nâng cấp thành phần dưới đây
Có thể thêm cấp độ, thêm số lượt tim cần cho từng cấp độ, thêm quà có thể nhận được

Cấp | số lượng tim | Quà (lấy từ danh sách quà) | Phạm vi (toàn tông,...)


*### 4. Quà tặng và bình luận*
link hình ảnh các quà và giá xu
C:\Users\admin\Documents\CODE\TuTien\public\assets\Qua

Xóa đi phần tải danh sách quà từ tiktok về (phần này bạn phải hỏi kỹ lại tôi nhé)

Vẫn giữ quy tắc cài đặt quà như cũ (chọn dải đơn giá,...)

Nhưng thêm 3 sự lựa chọn có sẵn vào cho tôi: 1xu, 10 xu, 20 xu, khi chọn cái này thì sẽ không chọn dải đơn giá nữa. 3 sự lựa chọn này lấy từ link ở trên. Yêu cầu lựa chọn có cả hình ảnh trực quan nhé

Giờ server chưa nhận diện được bình luận, khi người xem bình luận "nhập môn" bên server vẫn chưa có tương tác gì

Nhận log follow nếu chưa có thì cũng xem xét làm luôn


*### 5. Hiệu ứng camera và hiệu ứng nhận items*
Link: C:\Users\admin\Documents\CODE\TuTien\unity-client\Assets\Art\Items
Ánh xạ
Biến dị linh căn : bien_di_linh_can
Độ kiếp đan : do_kiep_dan
Trà ngộ đạo : tra_ngo_dao

0,0–0,8 giây: Camera Zoom In
Camera di chuyển và phóng gần nhân vật nhận quà, lấy nhân vật làm trung tâm.

0,8–0,12 giây: Vật phẩm xuất hiện
Icon vật phẩm xuất hiện ngay phía trên đầu nhân vật, phóng từ nhỏ lên kích thước bình thường và phát sáng nhẹ.

1,2–2,2 giây: Vật phẩm bay lên
Icon từ từ bay lên một đoạn ngắn, hiện tên và số lượng, sau đó mờ dần.

2,2–3,0 giây: Camera Zoom Out
Camera trở lại góc nhìn toàn cảnh ban đầu và gameplay tiếp tục bình thường.


*### 6. Thông báo nhận ban phúc*
Link: C:\Users\admin\Documents\CODE\TuTien\unity-client\Assets\Art\Items
Ảnh ánh xạ: tbao_ban_phuc
Khi được nhận ban phúc hãy bật hiệu ứng ảnh nhảy ra và cộng thêm một chút độ rung camera, cùng với sfx nhận chúc phúc, có hiển thị số lượng. Sau đó liền tắt đi


*### 7. Cơ chế sử dụng quà*
Hiện tại các phần quà nhận được đã được thực hiện như dưới này chưa. Nếu có rồi thì bỏ qua
Ban phúc - được sử dụng ngay khi nhận được
Trà ngộ đạo - được sử dụng ngay khi nhận được(thời gian 1 phút)
Biến dị linh căn - được sử dụng ngay khi nhận được (hạn vĩnh viễn)
Độ kiếp đan - sử dụng khi độ kiếp để tăng tỉ lệ (dùng hết bao nhiêu thì trừ đi bấy nhiêu)

*### 8. Cơ chế camera*
Khi nhận quà toàn tông môn sau khi đánh boss hay gì đó thì không cần zoom camera từng người, mà chỉ cần thực hiện hiệu ứng nhận quà trên đầu các thành viên là được (camera vẫn giữ nguyên)

ĐỂ TRÁNH BỊ ẢNH TĨNH THÌ:
Trong 30s nếu không có hành động thì cho camera thì nó tự chuyển động: zoom, đi đi lại lại, follow theo người bay lên đài rồi quay về vị trí gốc. Nếu trong quá trình này mà có người kích hoạt hiệu ứng camera thì sẽ ưu tiên: Cho camera quay về vị trí ban đầu sau đó thực hiện hành động vừa mới kích hoạt

Khi zoom thì trên đầu nhân vật vẫn có thông tin nhé.

*### 9. Sửa cơ chế camera của mục 8*
Ý tưởng ban đầu của tôi là khi không có hành động gì camera sẽ có các hành động ngẫu nhiên sau (sau 15s nếu không có hành động)
1. Zoom bất kì
2. Đi đi lại lại
3. Following theo người độ kiếp
Chứ không phải là cứ following những người đang độ kiếp
Trong quá trình đó mà có hành động khác xen vào thì ưu tiên hành động đó. VD: có người tặng quà thì phải zoom vào người đó luôn

--> Thêm cơ chế, người mới nhập môn sẽ bay từ ngoài vào sân để ngồi, camera cũng sẽ theo dõi

Mức độ ưu tiên:
1. Người tặng quà nhận items
2. Người mới nhập môn
3. Hành động ngẫu nhiên của camera


**HÃY HỎI LẠI TÔI NHỮNG ĐIỀU CẦN THIẾT ĐỂ ĐẠT KẾT QUẢ TỐT NHẤT**

### Đã xác nhận cho mục 9 — 09/11/2026

**Điều chỉnh tiếp theo đã chốt:** random zoom giữ góc đủ5 giây và pan đủ20 giây, cộng0,8 giây chuyển vào/0,8 giây về (tổng6,6/21,6 giây); follow độ kiếp tổng8 giây, chờ15 giây giữa các lượt, camera nhận quà/nhập môn3 giây như cũ. Mây độ kiếp chỉ hiện khi tới đài tại1,5 giây, sét bắt đầu sau0,3 giây; bốn PNG lặp2/3 giây/vòng, tương đương40 frame ở60 FPS. Chi tiết/kiểm chứng lượt mới tại `docs/Tailieu_output/storm-camera-timing/README.md`; dòng mỗi lượt8 giây bên dưới là xác nhận trước điều chỉnh này.

- Rảnh15 giây rồi chọn đều một kiểu đủ điều kiện: zoom tu sĩ bất kỳ / đi qua lại / theo người độ kiếp, mỗi lượt8 giây rồi về toàn cảnh và chờ15 giây. Tim/bình luận thường không reset; độ kiếp không ép follow liên tục.
- Quà cá nhân ưu tiên cao nhất, chuyển thẳng mượt từ camera hiện tại; FIFO mỗi lượt3 giây, gộp cùng người khi phù hợp.
- Người mới bay3 giây từ ngoài vào ghế, nhiều người bay cùng lúc và camera theo người mới nhất. Khi quà xen vào đường bay vẫn chạy; chỉ theo lại nếu người mới còn bay. Người cũ/reconnect không bay lại.
- Ban Phúc toàn tông giữ camera như cũ; popup do donate thêm tên và ảnh đại diện người donate. Boss/cấp tông không gán tên donor.
- Zoom quà/nhập môn chỉ chạy khi tu luyện; lúc boss giữ chờ. Pause/stopped tiếp tục đóng băng camera/đường bay.

Đã triển khai và ghép scene nguồn Concept02: Node137 PASS/1 SKIP LIVE, Unity87/87 PASS, GPU1080/720 và audit bảo toàn PASS. Hướng dẫn/ảnh/giới hạn tại `docs/Tailieu_output/camera9/README.md` và đầu `PROGRESS.md`. Ảnh CDN TikTok/LIVE thật, build Windows/OBS chưa kiểm chứng; kết quả phần7–8 dưới đây là lịch sử.

### Đã xác nhận cho phần 7–8 — 08/11/2026

- Thực hiện cả phần7 và8.
- Đan tự lấy vừa đủ đạt trần tỷ lệ hiện có, giữ phần dư, tính số đã chuẩn bị trước.
- Ban Phúc/Trà60 giây/Linh Căn kích hoạt ngay cả khi đánh boss hoặc tạm dừng; buff chỉ giảm lúc tu luyện. Đồ cũ trong túi giữ nguyên, không tự tiêu hàng loạt.

Đã triển khai và ghép scene nguồn; Node126 PASS/1 SKIP LIVE, Unity47/47 PASS, ảnh1080/720 và kiểm tra bảo toàn PASS. Hướng dẫn/kết quả/giới hạn: `docs/Tailieu_output/qua78/README.md` và mục mới nhất của `PROGRESS.md`. Build Windows/OBS/LIVE thật chưa kiểm chứng.
