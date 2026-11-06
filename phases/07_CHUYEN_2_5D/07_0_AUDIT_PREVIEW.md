# 07.0 — Audit asset và preview ghép cảnh

**Chưa sửa `/song` hay logic game.** Đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `phases/07_CHUYEN_2_5D/00_KE_HOACH_VA_QUY_TAC.md`.

1. Kiểm tra `git status`, `npm test` làm baseline.
2. Quét đệ quy `public/assets/`; xuất bảng file, kích thước px, kênh alpha, bounding box alpha, số pixel trong suốt/bán trong suốt, pixel đen đáng ngờ, viền/halo, đối tượng bị cắt. Đặc biệt chú ý tên thư mục chứa dấu cách và đường dẫn encode.
3. Xác nhận layer nền/công trình có cùng tọa độ concept hay đều là vật thể nằm giữa canvas. Nếu không biết, ghi `CHƯA XÁC MINH` và dùng cấu hình căn chỉnh.
4. Tạo **trang preview độc lập** có image layers theo thứ tự chiều sâu: sky → mountains far → clouds far → mountains mid → waterfalls sau kiến trúc phù hợp → temple/courtyard/platform → characters placeholder → foreground gate/props → FX → HUD. Đây là thứ tự tham khảo, cho phép kéo layer để chỉnh theo thực tế.
5. Cho điều chỉnh từng layer `x/y`, `scale`, `opacity`, `z`, `anchor`, ẩn/hiện và zoom toàn cảnh; nhập ảnh concept làm overlay độ mờ để căn chỉnh. Lưu JSON bố cục vào file mới, không ghi đè caidat.json/game state.
6. Thử đặt `Characters/Character_1/meditate_3quarter.png` vào sân và `meditate.png` lên đài ở chế độ preview; xử lý clipping và anchors.
7. Xuất 2 screenshot: preview ghép 9:16 và bản so sánh với concept. Ghi tài sản sai/cần tách lại vào `ASSET_AUDIT.md`.
8. Dừng sau audit. Không tạo file placeholder giả làm asset thật, không sửa renderer live.

**Nghiệm thu:** mở được preview, biết ảnh nào thiếu/không hợp lệ, có JSON tọa độ căn chỉnh và screenshot thực tế.
