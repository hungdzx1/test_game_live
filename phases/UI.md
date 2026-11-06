# YÊU CẦU CODEX: TÁI THIẾT KẾ GIAO DIỆN QUẢN TRỊ TU TIÊN LIVE

## 1. Thông tin dự án

Repository: https://github.com/hungdzx1/test_game_live.git

Tôi đã hoàn thành 5 giai đoạn phát triển game Tu Tiên LIVE. Hiện tại hệ thống có một giao diện quản trị chứa nhiều chức năng trên cùng một trang dài, gây khó khăn cho việc sử dụng và quản lý.

Tôi muốn cải tiến giao diện dựa trên hai ảnh tham chiếu Dark Mode và Light Mode đã cung cấp.

**Mục tiêu chính: Chuyển giao diện một trang dài sang giao diện Dashboard có Sidebar, phân chia chức năng thành các trang riêng biệt, có Dark Mode và Light Mode.**

Đây là công việc refactor giao diện, KHÔNG PHẢI xây dựng lại game.

### Nguyên tắc bắt buộc

1. Chỉ thay đổi những phần liên quan đến bố cục, điều hướng, giao diện và khả năng sử dụng.
2. Không tự ý sửa thuật toán, quy tắc game hoặc các chức năng đang hoạt động.
3. Không viết lại backend nếu không thực sự cần thiết.
4. Không tự ý đổi API, WebSocket events, cấu trúc dữ liệu hoặc định dạng file lưu trữ.
5. Không xóa chức năng hiện có chỉ vì ảnh thiết kế không hiển thị chức năng đó.
6. Không tạo giao diện đẹp nhưng nút bấm không hoạt động.
7. Không thay đổi giao diện trang phát sóng `/song`.
8. Không làm mất dữ liệu người chơi, cài đặt hoặc dữ liệu demo.
9. Không thêm thư viện UI lớn hoặc framework frontend nếu có thể thực hiện bằng HTML, CSS và JavaScript hiện tại.
10. Sau khi chỉnh sửa phải chạy kiểm thử, sửa lỗi và xác minh các chức năng cũ vẫn hoạt động.

---

## 2. Khảo sát mã nguồn trước khi chỉnh sửa

Trước tiên hãy đọc:

- AGENTS.md
- GAME_DESIGN.md
- PROGRESS.md
- README.md
- package.json
- Các file HTML, CSS, JavaScript frontend.
- Các API, WebSocket handler và file cấu hình liên quan.

Nếu một file tài liệu không tồn tại thì bỏ qua, không tự tạo nội dung giả.

Xác định chính xác:

- File đang chứa giao diện quản trị.
- File xử lý các sự kiện click.
- File xử lý kết nối TikTok LIVE.
- File quản lý trạng thái demo và LIVE.
- Các API lưu và tải cài đặt.
- Các thành phần liên quan đến âm thanh.
- Các chức năng quản lý người chơi, chiến đấu, quà tặng và sao lưu.
- Các chức năng đang sử dụng WebSocket.
- Cách mở trang `/song`.

Lập bảng ánh xạ từng chức năng hiện tại sang trang mới.

**Không được bắt đầu xóa hoặc thay thế giao diện cũ khi chưa xác định tất cả chức năng hiện có.**

---

# 3. CẤU TRÚC GIAO DIỆN MỚI

Thay giao diện một trang dài bằng cấu trúc:

- Sidebar cố định bên trái.
- Main content bên phải.
- Header cho từng trang.
- Các card có phân cấp rõ ràng.
- Chuyển trang mượt, không làm gián đoạn trò chơi.

Sidebar gồm 5 mục:

1. Trang chủ
2. Cài đặt
3. Demo
4. Nhật ký
5. Sao lưu

Trang chủ được chọn mặc định khi mở `http://localhost:3000`.

Sidebar có thể thu gọn thành các biểu tượng. Trên màn hình nhỏ, chuyển sang dạng menu trượt hoặc menu thu gọn.

Có nút chuyển đổi Dark Mode / Light Mode ở khu vực header hoặc cuối sidebar.

### Kiến trúc frontend

Không được giữ toàn bộ mã giao diện và xử lý sự kiện trong một file HTML khổng lồ.

Hãy kiểm tra kiến trúc hiện có rồi tách hợp lý thành:

- Thành phần sidebar.
- Thành phần header.
- Trang chủ.
- Trang cài đặt.
- Trang demo.
- Trang nhật ký.
- Trang sao lưu.
- File CSS chung và CSS dành cho từng trang nếu cần.
- Module xử lý trạng thái giao diện.
- Module dùng chung cho các thao tác API.

Có thể sử dụng ES Modules hoặc cách tổ chức JavaScript đang có.

Không bắt buộc phải tạo route server mới cho từng trang; có thể dùng SPA đơn giản nếu phù hợp hơn và không phá vỡ backend hiện tại.

Quan trọng: Việc chuyển trang không được tạo lại kết nối TikTok, reset bộ đếm, khởi động lại game hoặc làm mất trạng thái dữ liệu.

---

# 4. TRANG CHỦ – DASHBOARD

Trang chủ là trung tâm điều khiển chính.

## 4.1. Header

Hiển thị:

- Tiêu đề Trang chủ.
- Trạng thái DEMO hoặc LIVE hiện tại.
- Nút Mở trang phát sóng.
- Nút đổi giao diện sáng/tối.

Nút mở trang phát sóng phải sử dụng đúng đường dẫn `/song` hiện có.

## 4.2. Kết nối TikTok LIVE

Di chuyển toàn bộ phần kết nối TikTok hiện tại vào Trang chủ.

Bao gồm:

- Nhập tài khoản TikTok.
- Nhập khóa ký Euler Stream (nếu cần).
- Kết nối.
- Ngắt kết nối.
- Trạng thái kết nối.
- Thông báo lỗi.
- Trạng thái thử kết nối lại.
- Cấu hình liên quan đến kết nối LIVE nếu đang có.

Trạng thái phải thể hiện chính xác từ backend, không dùng dữ liệu giả để hiển thị đã kết nối.

Mật khẩu hoặc khóa ký không được hiển thị công khai.

## 4.3. Tổng quan phiên

Tạo 6 thẻ thông tin:

- Tổng số đạo hữu.
- Giai đoạn hiện tại: Tu luyện / Diệt ma.
- FPS hiện tại.
- Đồng hồ chu kỳ.
- Số chiến trường đang hoạt động.
- Số người chờ độ kiếp.

Bổ sung các thông số đã có như tick time, RAM, số sự kiện và trạng thái máy chủ trong mục thông tin kỹ thuật có thể mở rộng.

Toàn bộ dữ liệu phải lấy từ hệ thống hiện tại.

Không hardcode số liệu trong ảnh tham chiếu.

## 4.4. Nhật ký phiên gần đây

Hiển thị khoảng 10–20 sự kiện mới nhất:

- Nhập môn.
- Nhận quà.
- Bình luận.
- Độ kiếp.
- Bắt đầu hoặc kết thúc chiến đấu.
- Lỗi kết nối.
- Thông báo hệ thống.

Có thời gian, loại sự kiện và nội dung.

Có nút "Xem đầy đủ" chuyển đến trang Nhật ký.

Phải giữ nguyên cơ chế ghi log đang có.

## 4.5. Điều khiển nhanh

Di chuyển các thao tác chính lên Trang chủ:

- Bắt đầu / Tiếp tục.
- Tạm dừng.
- Kết thúc pha hiện tại.
- Sao chép URL `/song`.
- Bật/tắt âm thanh.

Giữ nguyên hành vi của từng nút.

Nút không hợp lệ ở trạng thái hiện tại phải được vô hiệu hóa hoặc hiển thị thông báo phù hợp.

## 4.6. Quà và vật phẩm

Hiển thị bảng xem nhanh các quy tắc quà đang áp dụng.

Không cần hiển thị toàn bộ form chỉnh sửa tại Trang chủ.

Có nút "Quản lý chi tiết", dẫn tới đúng mục cấu hình quà trong Cài đặt.

## 4.7. Lối tắt

Tạo hai card:

- Cài đặt.
- Demo.

Khi click phải điều hướng đến trang tương ứng.

---

# 5. TRANG CÀI ĐẶT

Di chuyển tất cả cài đặt hiện tại sang trang riêng.

Không bỏ sót thông số nào.

Chia thành các tab hoặc nhóm cài đặt bên trong:

## 5.1. Âm thanh và Thiên Đạo

- Bật/tắt âm thanh.
- Bật/tắt nhạc nền.
- Bật/tắt hiệu ứng.
- Bật/tắt giọng Thiên Đạo.
- Âm lượng tổng.
- Âm lượng nhạc.
- Âm lượng hiệu ứng.
- Âm lượng giọng đọc.
- Nút nghe thử.
- Nút lưu.

Giữ nguyên cách hoạt động của Web Audio và Speech Synthesis.

## 5.2. Hiển thị và Camera

- Chất lượng đồ họa.
- Tỷ lệ hạt.
- Cường độ sáng.
- Bóng đổ.
- Số sát thương bay.
- Tự giảm đồ họa khi FPS thấp.
- Thời gian thông báo.
- Thời gian cảnh tối thiểu.
- Thời gian hồi focus.
- Độ ưu tiên camera.
- Chế độ camera mặc định.

Nếu hệ thống đã có lựa chọn tỷ lệ màn hình thì giữ nguyên.

Không tự ý thay đổi camera của `/song` hoặc logic ưu tiên hiện tại.

## 5.3. Tu luyện và Độ kiếp

- Bảng chỉ số.
- Giới hạn hệ số tu luyện.
- Số lần thất bại để bảo đảm độ kiếp.
- Các cấu hình khác đang tồn tại.

## 5.4. Chiến trường và Boss

- Thời gian tu luyện.
- Thời gian diệt ma.
- K boss 1.
- K boss 2.
- K boss 3.
- Hệ số solo.
- Các thông số độ khó khác.

## 5.5. Nhiệm vụ

- EXP nhiệm vụ.
- Cooldown nhiệm vụ.
- Giới hạn phần thưởng.
- Các thông số nhiệm vụ khác.

## 5.6. TikTok và Quà

- Thời gian tự kết nối lại.
- Số lần thử kết nối.
- Mốc tim.
- Thời gian hồi phục lợi ích.
- Bảng ánh xạ Gift ID và vật phẩm.
- Thêm, sửa, xóa quy tắc.
- Bật/tắt quy tắc.
- Hiệu ứng vật phẩm.
- Số lượng vật phẩm/quà.

Không thay đổi thuật toán xử lý quà combo hoặc quy tắc tính quà.

### Lưu cấu hình

Giữ nguyên API và file cấu hình đang sử dụng.

Phải hiển thị thông báo lưu thành công hoặc thất bại dựa trên phản hồi thực tế.

Không tự động ghi đè các giá trị chưa được thay đổi.

---

# 6. TRANG DEMO

Tách toàn bộ công cụ thử nghiệm khỏi Trang chủ và Cài đặt.

Trang Demo bao gồm:

## 6.1. Tạo người chơi giả

- Chọn quy mô.
- Tạo đạo hữu demo.
- Tạm dừng.
- Tiếp tục.
- Dừng.

## 6.2. Thử hoạt cảnh

- Chọn nhân vật.
- Quay cận cảnh.
- Vung kiếm.
- Ăn mừng.
- Dịch chuyển.
- Chạy.
- Ngự kiếm.
- Chắp tay.
- Về tu luyện.
- Bắt đầu diệt ma.

## 6.3. Thử tu luyện và độ kiếp

- Chọn tốc độ thử.
- Đưa đến Viên Mãn.
- Thử độ kiếp.
- Nhiệm vụ tu luyện.
- Điểm danh.
- Kiểm tra cảnh giới và tu vi.

## 6.4. Thử vật phẩm

- Chọn vật phẩm.
- Cấp vật phẩm demo.
- Sử dụng vật phẩm.
- Đổi điểm nhiệm vụ.
- Hiển thị túi đồ và buff.

## 6.5. Thử bình luận

- Nhập User ID.
- Nhập tên.
- Nhập nội dung bình luận.
- Gửi sự kiện thử.

## 6.6. Thử chiến đấu

- Tạo demo 11 cảnh giới.
- Chuyển sang diệt ma.
- Thử kỹ năng 1.
- Thử kỹ năng 2.
- Chọn camera chiến trường.
- Xem trạng thái boss.

## 6.7. Thử sự kiện TikTok

- Tim.
- Theo dõi.
- Vào phòng.
- Quà đơn.
- Quà combo.
- Gửi lại quà đã chốt.
- Mất kết nối.
- Kết nối lại.
- Kênh chưa LIVE.
- LIVE kết thúc.

**Quan trọng:** Các nút thử nghiệm phải sử dụng lại đúng luồng xử lý hiện có.

Không thay thế game engine bằng hệ thống mô phỏng mới.

Chế độ demo và LIVE phải tiếp tục giữ dữ liệu tách biệt như hiện tại.

---

# 7. TRANG NHẬT KÝ

Tạo trang riêng để theo dõi nhật ký phiên.

Bao gồm:

- Danh sách log.
- Thời gian.
- Loại sự kiện.
- Nội dung.
- Trạng thái.
- Bộ lọc theo loại nếu dữ liệu hiện tại hỗ trợ.
- Bộ lọc theo thời gian nếu dữ liệu hiện tại hỗ trợ.
- Nút xóa giao diện log nếu an toàn và đã có chức năng tương ứng.

Không tự ý xóa log backend hoặc dữ liệu lưu trữ.

Nếu hệ thống hiện tại chỉ hỗ trợ log bộ nhớ thì giữ nguyên cơ chế đó, không tự ý thêm hệ thống lưu log phức tạp.

Các sự kiện mới phải cập nhật khi đang ở trang Nhật ký mà không cần reload toàn bộ trang.

---

# 8. TRANG SAO LƯU

Di chuyển toàn bộ chức năng:

- Tra cứu đạo hữu.
- Tải backup JSON.
- Chọn file backup.
- Khôi phục dữ liệu.
- Reset dữ liệu demo hoặc LIVE.

Sắp xếp thành hai nhóm rõ ràng:

1. Tra cứu dữ liệu người chơi.
2. Sao lưu, khôi phục và reset.

Các nút khôi phục và reset phải có hộp thoại xác nhận.

Hiển thị rõ dữ liệu nào sẽ bị tác động: DEMO hay LIVE.

Không sửa schema dữ liệu.

Không sửa đường dẫn lưu file.

Không làm mất dữ liệu khi chỉ chuyển giao diện.

---

# 9. DARK MODE VÀ LIGHT MODE

Thiết kế dựa trên hai ảnh tham chiếu.

## Dark Mode

- Nền navy đậm.
- Card xanh đen.
- Chữ trắng hoặc xám sáng.
- Điểm nhấn cyan và vàng kim.
- Viền mảnh.
- Hiệu ứng phát sáng nhẹ.

## Light Mode

- Nền trắng hoặc xanh xám rất nhạt.
- Card trắng.
- Chữ xanh navy đậm.
- Điểm nhấn cyan và vàng kim.
- Bóng đổ nhẹ.
- Tương phản rõ ràng.

Yêu cầu:

1. Có công tắc chuyển Dark/Light.
2. Lưu theme bằng localStorage hoặc cơ chế cấu hình hiện tại.
3. Giữ theme sau khi tải lại trang.
4. Không ảnh hưởng theme của trang `/song`.
5. Tất cả bảng, input, dropdown, button, modal và log đều phải hỗ trợ hai theme.
6. Có hover, focus, disabled và trạng thái loading phù hợp.
7. Không có chữ tối trên nền tối hoặc chữ sáng trên nền trắng.

Có thể dùng CSS variables để quản lý hai theme.

Không cần đưa hình minh họa phức tạp vào game. Nếu ảnh tham chiếu có cảnh núi hoặc tông môn trang trí, có thể tạo bằng CSS hoặc SVG đơn giản, tránh tải asset lớn.

---

# 10. RESPONSIVE

Giao diện quản trị phải phù hợp với:

- Desktop 1920×1080.
- Laptop 1366×768.
- Tablet.
- Điện thoại.

Desktop dùng sidebar cố định.

Tablet có sidebar thu gọn.

Điện thoại có menu mở/đóng.

Các bảng rộng phải có thanh cuộn ngang hợp lý.

Không để nút bị che, nội dung tràn màn hình hoặc form bị cắt.

Không dùng responsive của dashboard để can thiệp tỷ lệ 9:16 của trang phát sóng.

---

# 11. GIỮ NGUYÊN TOÀN BỘ CHỨC NĂNG GAME

Đây là yêu cầu có mức ưu tiên cao nhất.

**Nghiêm cấm thay đổi ngoài phạm vi UI refactor:**

- Thuật toán tăng tu vi.
- 11 cảnh giới.
- Công thức HP, ATK, DEF.
- Tỷ lệ độ kiếp.
- Hệ thống Thiên Mệnh.
- Cơ chế vật phẩm và buff.
- Chu kỳ tu luyện và diệt ma.
- 11 chiến trường.
- Ba boss.
- Công thức sát thương.
- Cooldown kỹ năng.
- Bảng xếp hạng.
- Phần thưởng chiến đấu.
- TikTok connector.
- Xử lý bình luận.
- Xử lý quà và combo.
- Cơ chế lưu người chơi.
- Cơ chế lưu demo/LIVE riêng biệt.
- Cảnh Three.js.
- Procedural character generator.
- Camera director của game.
- Audio engine.
- WebSocket protocol.
- Trang `/song`.

Nếu cần đổi tên ID HTML, class hoặc selector, phải cập nhật đầy đủ các nơi tham chiếu.

Nếu cần sửa một module logic chỉ để hỗ trợ UI mới, phải giải thích rõ lý do, thực hiện thay đổi tối thiểu và bổ sung kiểm thử.

Không tự ý tối ưu hoặc viết lại các module không liên quan.

---

# 12. KIỂM THỬ SAU KHI CHỈNH SỬA

Phải kiểm thử theo từng nhóm.

## A. Giao diện

- Sidebar hoạt động.
- Chuyển đủ 5 trang.
- Không xuất hiện trang trắng.
- Không bị trùng ID DOM.
- Dark Mode hoạt động.
- Light Mode hoạt động.
- Theme được lưu.
- Responsive không lỗi.
- Không có lỗi nghiêm trọng trong console.

## B. Trang chủ

- Kết nối/ngắt TikTok vẫn gọi đúng API.
- Trạng thái thật được hiển thị đúng.
- Thông số realtime cập nhật.
- Log cập nhật.
- Nút điều khiển nhanh hoạt động.
- Nút mở `/song` hoạt động.
- Nút sao chép URL hoạt động.

## C. Cài đặt

- Tất cả giá trị hiện có được tải đúng.
- Chỉnh và lưu âm thanh.
- Chỉnh và lưu camera.
- Chỉnh và lưu boss.
- Chỉnh và lưu nhiệm vụ.
- Chỉnh và lưu bảng quà.
- Reload vẫn giữ cấu hình đã lưu.

## D. Demo

- Tạo nhân vật demo.
- Chọn nhân vật.
- Thử animation.
- Tăng tu vi.
- Độ kiếp.
- Sử dụng vật phẩm.
- Thử bình luận.
- Thử quà đơn.
- Thử quà combo.
- Thử kỹ năng.
- Thử chuyển sang diệt ma.

## E. Sao lưu

- Tra cứu người chơi.
- Tải backup.
- Khôi phục bằng dữ liệu thử nghiệm.
- Kiểm tra dữ liệu sau khôi phục.
- Kiểm tra xác nhận trước reset.

Không thực hiện thử reset trên dữ liệu người chơi thật.

## F. Hồi quy hệ thống

Kiểm tra:

- Game engine tiếp tục chạy khi chuyển trang.
- WebSocket không bị kết nối lặp.
- TikTok không kết nối lại chỉ vì đổi trang.
- Không có listener bị đăng ký trùng.
- Đồng hồ chu kỳ không reset.
- Tu vi vẫn được cập nhật.
- Battle vẫn hoạt động.
- `/song` vẫn nhận sự kiện.
- Không mất dữ liệu sau reload.
- Không có lỗi runtime mới.

Nếu dự án có bộ test hiện tại, bắt buộc chạy lại.

Nếu thiếu test phù hợp, hãy bổ sung các bài test nhỏ cho việc tải trang, điều hướng, lưu cài đặt và luồng thao tác quan trọng.

Nếu môi trường có trình duyệt tự động hóa, kiểm tra cả Dark/Light và chụp ảnh giao diện ở kích thước desktop, mobile.

Không được tuyên bố PASS nếu thực tế chưa chạy kiểm thử.

---

# 13. QUY TRÌNH THỰC HIỆN

Thực hiện lần lượt:

**Bước 1:** Kiểm tra trạng thái Git, ghi nhận các thay đổi chưa commit.

**Bước 2:** Đọc cấu trúc dự án và liệt kê các chức năng hiện có.

**Bước 3:** Lập bảng ánh xạ chức năng cũ sang 5 trang mới.

**Bước 4:** Tạo sidebar, layout chung, header và hệ thống theme.

**Bước 5:** Chuyển từng nhóm chức năng sang trang phù hợp, giữ nguyên handler và backend.

**Bước 6:** Hoàn thiện Dark Mode và Light Mode.

**Bước 7:** Kiểm tra responsive.

**Bước 8:** Chạy kiểm thử UI và hồi quy.

**Bước 9:** Sửa lỗi phát hiện được.

**Bước 10:** Cập nhật PROGRESS.md.

Không xóa các file cũ khi còn được tham chiếu.

Không tự ý commit, push hoặc reset Git nếu chưa được yêu cầu.

---

# 14. KẾT QUẢ CẦN TRẢ VỀ

Sau khi hoàn thành, hãy báo cáo:

1. Danh sách file đã tạo.
2. Danh sách file đã chỉnh sửa.
3. Chức năng được chuyển sang từng trang.
4. Các thay đổi về cấu trúc frontend.
5. Những API hoặc module logic đã buộc phải sửa và lý do.
6. Kết quả kiểm thử thực tế.
7. Những tính năng không thể kiểm chứng và lý do.
8. Các vấn đề còn tồn tại.

Chụp ảnh nếu có thể:

- Trang chủ Dark Mode.
- Trang chủ Light Mode.
- Trang Cài đặt.
- Trang Demo.
- Trang Nhật ký.
- Trang Sao lưu.

## ĐIỀU KIỆN HOÀN THÀNH

Tôi phải có một dashboard với sidebar hoạt động thực sự, năm trang riêng biệt, giao diện sáng/tối, đầy đủ chức năng đã có trước đó.

**Không được đánh đổi chức năng game lấy giao diện đẹp.**

Mục tiêu cuối cùng là thay đổi cách người dùng quản lý game, không thay đổi cách game vận hành.

Hãy bắt đầu khảo sát repository, sau đó trực tiếp triển khai, chạy thử và sửa lỗi đến khi đạt tiêu chí nghiệm thu.
