# 20 quà TikTok tiêu biểu để cấu hình thủ công

Ngày tra cứu: **08/11/2026**.

Giá bên dưới là **xu (Coins) cho một quà**, không phải tiền Việt hay tổng giá của một chuỗi quà. Tên tiếng Anh giữ theo danh mục; tên Việt chỉ giúp nhận diện, không dùng làm tên khớp sự kiện.

## Danh sách

Toàn bộ ID, tên và giá trong bảng được tra từ [TikTokGame — danh mục quà](https://tiktokgame.vn/gift/index.php), hiển thị cập nhật ngày 30/10/2026 và có khu vực Việt Nam. Đây là nguồn tổng hợp bên thứ ba, **chưa kiểm chứng với sự kiện LIVE từ tài khoản của bạn**.

| ID | Tên trong danh mục | Nhận diện tiếng Việt | Xu / quà |
| --- | --- | --- | ---: |
| 5655 | Rose | Hoa hồng | 1 |
| 5269 | TikTok | TikTok | 1 |
| 6064 | GG | GG | 1 |
| 7934 | Heart Me | Trái tim | 1 |
| 9139 | Team Bracelet | Vòng tay | 2 |
| 5487 | Finger Heart | Tim ngón tay | 5 |
| 5658 | Perfume | Nước hoa | 20 |
| 5879 | Doughnut | Bánh vòng | 30 |
| 6097 | Little Crown | Vương miện nhỏ | 99 |
| 5659 | Paper Crane | Hạc giấy | 99 |
| 5660 | Hand Heart | Tim bàn tay | 100 |
| 5585 | Confetti | Pháo giấy | 100 |
| 5509 | Sunglasses | Kính râm | 199 |
| 6267 | Corgi | Chó Corgi | 299 |
| 7168 | Money Gun | Súng tiền | 500 |
| 11046 | Galaxy | Ngân hà | 1000 |
| 7319 | Phoenix | Phượng hoàng | 25999 |
| 6369 | Lion | Sư tử | 29999 |
| 7312 | TikTok Universe+ | Vũ trụ+ | 34999 |
| 9072 | TikTok Universe | Vũ trụ | 44999 |

## Cách dùng trong TuTienLive

Ví dụ muốn **người tặng Hoa hồng nhận item A**:

1. Mở **Cài đặt → TikTok & quà → Thêm quy tắc**. Nếu bộ chọn quà tự mở mà không tải được danh sách, đóng bộ chọn rồi mở **Chi tiết / quy tắc cũ**.
2. Điền **ID quà: `5655`**; tên có thể ghi `Rose` để dễ đọc.
3. Điền **giá tối thiểu: `1`**, **giá tối đa: `1`**.
4. Chọn vật phẩm A trong game, số lượng thưởng mong muốn rồi lưu quy tắc.

Với quà khác, thay ID và cả hai mức giá bằng dòng tương ứng. Giá nhập là **giá một quà**, không nhân với số lượng combo.

Hệ thống hiện tại ưu tiên khớp ID khi có ID, đồng thời vẫn kiểm tra khoảng giá. Vì vậy cần điền đúng cả ID lẫn giá. Không để trống cả ID và tên nếu chỉ muốn bắt một loại quà: khi đó quy tắc theo khoảng giá có thể áp dụng cho nhiều quà cùng giá.

## Giới hạn và nguồn đối chiếu

- Bảng là dữ liệu tham khảo để nhập tay, không phải danh mục chính thức được TikTok xác nhận cho mọi tài khoản. Khi dữ liệu thực tế do connector nhận được khác bảng, dùng `giftId`, `giftName` và `diamondCount` của sự kiện thực tế để sửa quy tắc.
- Tên hiển thị có thể được bản địa hóa; cùng tên cũng có thể có nhiều ID. Ưu tiên ID thay vì tự dịch tên quà sang tiếng Việt để khớp sự kiện.
- [STANDOUT Streamers — Gift Catalog](https://standoutstreamers.com.au/tiktok-gift-catalog/) được dùng đối chiếu thêm một số mục như Rose, Lion, Phoenix và TikTok Universe; không thay thế danh mục theo tài khoản/khu vực của bạn.
- [Lumia Stream — TikTok Gift](https://dev.lumiastream.com/docs/alerts/tiktok/alert-tiktok-gift) có ví dụ sự kiện `Finger Heart` với `giftId: 5487`, giúp đối chiếu riêng cặp ID/tên này.

File này chỉ phục vụ tra cứu; chưa tự nhập hoặc thay đổi cấu hình quà đang dùng trong game.
