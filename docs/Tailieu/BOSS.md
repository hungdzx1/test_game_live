**Hãy bỏ đi cơ chế 11 chiến trường, thay vào đó là cơ chế boss như dưới đây**

Link: C:\Users\admin\Documents\CODE\TuTien\unity-client\Assets\Art\Boss

Ở trong thư mục trên đang có sprits đã cắt từng frame của 3 boss: Boss_1, Boss_2, Boss_3 dùng để tạo animation

Giờ hãy tạo cơ chế đánh boss:
Boss sẽ hiển thị trên lôi đài độ kiếp, đi kèm là tên và HP
Sẽ có 5p để đánh 1 con boss, hết 5p thì chuyển boss,nếu hết boss thì chuyển sang tu luyện bình thường (cái này có thể điều chỉnh)
Boss chết thì chuyển sang boss sau luôn

Khi boss xuất hiện, tất cả tu sĩ thực hiện hành động attack, và có hiệu ứng chiêu bay về phía boss (nếu không tự tạo hiệu ứng thêm được thì bảo tôi)
Lượng HP (có thể điều chỉnh ở server)
Boss 1: 10K
Boss 2: 20K
Boss 3: 50K 
Phần thưởng (có thể điều chỉnh/setting)
Hạ boss 1: 1 ban phúc
Hạ boss 2: 2 ban phúc + mỗi người nhận 1 độ kiếp đan
Hạ boss 3: 5 ban phúc + mỗi người nhận 2 độ kiếp đan

BOSS SẼ BAO GỒM TÊN, THANH HP, CÓ FILL<GIẢM DẦN THEO HP>
Ánh xạ
+ concept_in4 : mẫu cho khung thông tin và HP
+ in4_boss_1 : khung chưa fill hp cho boss 1
+ in4_boss_2 : khung chưa fill hp cho boss 2
+ in4_boss_3 : khung chưa fill hp cho boss 3
+ fill_hp : dùng để fill thanh hp, hp giảm dần thì thanh fill cũng giảm dần
Vị trí khung thông tin sẽ để đè lên khung nguyên lực của tông môn



### 1. Sửa lại cơ chế xuất hiện boss
Mỗi 1 đợt boss thì chỉ xuất hiện ngẫu nhiên 1/3 boss thôi, thay vì xuất hiện cả 3 boss như hiện tại
Độ mạnh hay yếu của boss sẽ dựa vào tổng lượng dame của tông môn để đo làm sao cho boss không chết quá nhanh (>3p).
Phần thưởng cho mỗi boss đều là: 3 ban phúc + mỗi người nhận 2 độ kiếp đan
**HÃY HỎI LẠI TÔI NHỮNG ĐIỀU CẦN THIẾT ĐỂ ĐẠT KẾT QUẢ TỐT NHẤT**



**TÔI CẢM GIÁC LÀ BẢN THÂN NÓI CŨNG CHƯA RÕ VÀ ĐẦY ĐỦ DO ĐÓ BẠN HÃY HỎI LẠI TÔI**

### Đã xác nhận với người dùng — 08/11/2026

1. Tất cả tu sĩ đánh chung bằng ATK hiện có, giữ bình luận1/2 và cooldown; boss không đánh trả, tu sĩ không chết.
2. Thay thưởng TOP/tăng tầng cũ bằng đúng thưởng boss ở trên. Chỉ hạ boss mới thưởng; Đan cấp cho mọi tu sĩ đã nhập môn tại lúc hạ boss. Ban Phúc kích hoạt một lần toàn tông theo số lượng1/2/5, đồng hồ buff chờ tới tu luyện mới giảm.
3. Giữ tự động10 phút tu luyện → ba boss, mỗi boss tối đa5 phút → tu luyện và lặp. Boss chết chuyển ngay, hết giờ không thưởng rồi chuyển tiếp. Thời gian tu luyện và thời gian riêng từng boss đều chỉnh được trong cài đặt.
