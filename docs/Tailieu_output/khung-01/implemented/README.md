# K01 Kim Vân trong Unity Concept02

**Cập nhật sau:** khung đã dịch trái12 và scale90% để bớt che đài; tia chớp nay lặp suốt độ kiếp. Kết quả hiện tại Unity58/58 PASS tại [guide-storm](../../guide-storm/README.md). Các thông số/ảnh/audit K01 bên dưới ghi mốc trước thu gọn.

Người dùng đã chọn K01. Khung đã ghép vào `unity-client/Assets/Scenes/SectScene_Concept02.unity`, ở `07_UI/UI_Canvas/K01_PlayGuide`. Dừng Play, mở lại scene rồi Play để nạp đối tượng mới. Nếu scene đang mở chưa reload, menu **Tu Tien LIVE → Concept 02 → Add K01 play guide** thêm khung vào scene hiện tại; chỉ dùng một lần rồi lưu ngoài Play Mode. Menu không ghi đè khung đã có.

- `Instructions`: hướng dẫn bình luận/tim, kỹ năng boss, Ban Phúc và ba vật phẩm; Linh Căn x3 vĩnh viễn.
- `GiftTable`: Hoa hồng/Trà, Cỏ bốn lá/Đan, Má hồng nhỏ xinh/Linh Căn và Ban Phúc toàn tông. Ba JPEG sao chép nguyên byte từ `public/assets/Qua`; ba sprite vật phẩm dùng chung tài nguyên hiện có.
- Nền xanh trầm hơi trong, viền vàng kép/góc trang trí và hình tim/sao/mũi tên dựng bằng UI geometry. Không thêm ảnh tải ngoài, font, shader hay package. Dùng font có sẵn trong scene; nhãn ID dành cho bản thiết kế được bỏ khỏi HUD chơi.
- Vị trí theo khung1080×1920: trái24, trên322, rộng436, cao611. Hai bảng kết thúc ở933, trước hàng tên đầu. CanvasScaler hiện hữu giữ tỷ lệ khi ở720×1280. Khung cố định trên màn hình khi camera zoom, không chặn chuột và nằm dưới các thông báo/hiệu ứng cũ trong thứ tự Canvas.
- Chỉnh vị trí/kích thước ở RectTransform của `K01_PlayGuide`; nội dung/cỡ chữ ở các TMP con của `Instructions`/`GiftTable`. Tắt GameObject root nếu muốn ẩn. Đây là bảng hướng dẫn tĩnh theo mẫu đã chọn; khi đổi ánh xạ quà trong cài đặt, cần cập nhật nội dung bảng tương ứng.

Giữ nguyên chữ **>50 xu** theo K01 đã chọn; rule server hiện có vẫn bắt đầu ở50 xu. Không sửa giá, số lượng quà, damage, cooldown, tu vi, API/WS/schema hoặc dữ liệu DEMO/LIVE trong lượt lắp HUD này. Hệ số Linh Căn x3 thuộc lượt backend trước và được giữ.

| Kiểm tra | Kết quả |
|---|---|
| Unity6000.5.9f1 Editor/Play/protocol | **49/49 PASS,0 FAIL,0 SKIP**. Ba bài K01 +5 Concept02 +5 variant +24 protocol +6 item +6 quà/camera. Kiểm tra nội dung/kích thước, ảnh tham chiếu, không chặn input, CanvasRenderer cho geometry, chữ vừa ô, cài đặt lặp không nhân khung, snapshot/disconnect/zoom không sửa dữ liệu. |
| GPU Quadro M1000M | **PASS**, đã xem [1080×1920](K01-1080.png) và [720×1280](K01-720.png) của bản cuối. Nền/viền/chữ/icon hiện đủ; không đè TOP3 hoặc hàng tên đầu. Đây là render Unity, khác ảnh thiết kế HTML ở thư mục cha. |
| Bảo toàn sau ghép | **PASS**:1.046 file giữ SHA256;442 document cũ giữ nguyên byte, trừ danh sách child của UI_Canvas; thêm271 document đã kiểm thử. Camera/viewport/pose,25 ghế, bốn prefab/Main và các hệ thống cũ giữ nguyên. Ba JPEG/GUID giữ nguồn, importTexture2D không mipmap/compression. |
| Node | Không chạy lại toàn suite vì không sửa backend. Hash backend/config được kiểm tra giữ nguyên. Kết quả129 PASS/1 SKIP ở thư mục cha thuộc lượt đổi Linh Căn trước. |
| Windows build mới/OBS/LIVE thật/FPS stream | **CHƯA KIỂM CHỨNG** trong lượt này. |

Các lỗi trong quá trình làm đã sửa: helper thiếu tham số text; importer mới mặc định sai TextureShape nên không nạp JPEG; custom geometry thiếu CanvasRenderer nên nền/viền không xuất hiện dù chữ đã hiện. Đã thêm RequireComponent và assertion, điều chỉnh độ che nền để cảnh HDR không làm chìm chữ, chạy lại49/49 và render lại ảnh cuối. Không dùng lượt test trước sửa làm kết quả cuối.

Bằng chứng: `unity-tests.xml`, `capture-report.json`, `preservation-report.json`, `final-verification.json`. Kiểm tra bảo toàn: `node scripts/k01-publish.js --verify`. Không chạy lại `k01-prepare.js` sau khi setup vì lệnh đó đồng bộ scene nguồn vào project kiểm thử. Không tự mở sửa project tại `public/unity-client/My project/`, không commit/push và không sửa dữ liệu người chơi.
