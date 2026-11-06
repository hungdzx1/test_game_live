# 06.2 — NÂNG CẤP NHÂN VẬT ĐỆ TỬ VÀ NGOẠI HÌNH BOSS

> **Phạm vi:** chỉ chỉnh hiển thị `/song` và các module frontend liên quan đến nhiệm vụ này. Đọc `00_TONG_QUAN.md` trước.
> **Nguồn ảnh:** hai ảnh tham chiếu mà người dùng đã gửi vào Codex. Ảnh là định hướng bố cục và mỹ thuật, không phải asset để đặt làm hình nền.
> **Bất biến:** server là nguồn sự thật của gameplay. Không sửa phép tính tu vi, xác suất độ kiếp, sát thương, boss, quà, bảng xếp hạng hay cơ chế lưu DEMO/LIVE.

## Mục tiêu nghiệm thu
Thay mô hình chibi đầu tròn, áo hình nón đang có thành **3D anime-xianxia stylized procedural**, lấy 4 ảnh nhân vật tham khảo làm định hướng kiểu tóc, đạo bào, khí chất, ánh sáng và tạo hình boss. Không sử dụng ảnh gốc làm sprite/texture; không kỳ vọng độ chi tiết photorealism như ảnh 2D. Các hoạt cảnh hiện có và 11 cấp aura phải còn hoạt động.

## Mã nguồn dự kiến
- `public/js/characters.js` — tạo hình, hierarchy xương giả/nhóm mesh, tư thế và chuyển động.
- `public/js/realmAura.js` — hiệu ứng 11 cảnh giới, hệ màu/LOD.
- `public/js/battleScene.js` — `EnemyView`, boss và quái, không đụng gameplay.
- `public/js/primitives.js` hoặc `proceduralCostumes.js` mới nếu cần tái sử dụng hình học.
- `public/js/effects.js` khi cần điều chỉnh effect bám vị trí tay/kiếm và không sinh geometry mỗi frame.

## 5. NHÂN VẬT ĐỆ TỬ PROCEDURAL

### 5.1. Hình dáng

- Nâng cấp từ đầu to / nón áo đơn giản thành dáng **anime-xianxia stylized low/medium-poly**, gần tinh thần ảnh mẫu: đầu cân đối hơn, cổ/vai/tay rõ, áo nhiều lớp, tay áo rộng, đai lưng, tà áo, tóc búi hoặc dài, dải lụa theo gió.
- Chân tay đủ rõ để thể hiện **ngồi xếp bằng**, chắp tay, thi triển, chạy, vung kiếm, bay, chống sét. Nên dùng hierarchy `Group` cho từng bộ phận, không cần rig/skinning phức tạp.
- Tối thiểu 6 kiểu tóc, 5 kiểu đạo bào, 4 biến thể phụ kiện/vũ khí, bảng màu phối hợp. Chọn biến thể **ổn định theo `p.seed`**, không random lại mỗi frame/lần reload.
- Tên trên đầu dùng nameplate nhỏ đẹp, độ mờ theo khoảng cách; chỉ hiển thị nhãn của một số nhân vật tiêu biểu hoặc khi camera focus để tránh dày chữ.
- Hào quang theo 11 cảnh giới sử dụng logic realm hiện có; khác biệt rõ ở các mốc cao nhưng không che sân hoặc làm FPS sụt mạnh.

### 5.2. LOD / hiệu năng

- Mẫu nhân vật độ chi tiết cao dùng khi đang focus/độ kiếp; model đơn giản hơn cho nhóm ở xa. **Giữ tổng render khoảng 40–60 nhân vật hiện có**, không tự tăng vô hạn để giống ảnh.
- Dùng mesh/material dùng chung, instancing khi phù hợp, object pooling cho hiệu ứng; dispose đúng cách.
- Tất cả là code, không cần Blender, file FBX/GLTF, ảnh AI, texture tải ngoài.

## Thiết kế boss/quái (bổ sung từ ảnh và yêu cầu gốc)
- Có 3 silhouette boss khác biệt (Ma Binh Thống Lĩnh, Huyết Ma Tướng Quân, Vạn Kiếp Ma Tôn), tăng dần độ uy nghi, áo/giáp/pháp khí khác nhau; màu phía ma: đỏ, tím, đen.
- Phần tóc, vạt áo, dải lụa chuyển động bằng biến đổi mesh; khi nhiều mô hình, giảm LOD/particle.
- Boss phải có dáng tiến tới, tấn công, bị trúng đòn, chết/biến mất; các hành vi lấy từ `battleScene` state/event hiện có.
- Giữ tọa độ/hitbox thông tin từ server; chỉ nâng cấp mô hình và hiển thị, chưa chuyển bố cục chiến trường sang trái/phải (bước 06.4).

## Nguyên tắc định danh và tính bền vững
- Cùng `userId`/`seed` phải cho ngoại hình ổn định sau reload; người chơi khác nhau đủ khác nhau, không sinh ngẫu nhiên mới mỗi frame.
- Tóc, đạo bào, phụ kiện, màu linh khí có nhiều biến thể và vẫn hợp lý khi nhân vật ngồi xếp bằng, cầm kiếm, chạy, bay, bị đánh.
- Nameplate gọn, tự giảm mật độ ở góc xa; không hiển thị tất cả 60 nameplate cùng lúc nếu gây chồng chữ.
- Không thay `realmIndex`, tu vi, HP/ATK/DEF, cách tính độ kiếp, thời gian animation server.

## Kiểm thử riêng
- [ ] Tất cả animation đã có: meditate, standUp, walk, run, fly, bow, attack, cast, hit, defeated, celebrate, teleport.
- [ ] Nhân vật 11 cảnh giới khác aura, không nhầm dữ liệu; reload cùng seed giống nhau.
- [ ] 3 boss có 3 ngoại hình riêng, hiệu ứng không che thanh máu.
- [ ] Test 10/60 nhân vật, mức đồ họa low/high, không dispose texture/material/geometry dùng chung nhầm.
- [ ] Không phá bố cục tông môn đã duyệt ở 06.1.

## Cách Codex thực hiện riêng bước này
1. Kiểm tra `git status`, đọc `AGENTS.md`, `GAME_DESIGN.md`, `PROGRESS.md`, `00_TONG_QUAN.md` và tài liệu bước hiện tại. Bảo vệ mọi thay đổi chưa commit.
2. Chạy baseline `npm test` trước sửa; xác minh hành vi hiện tại bằng trình duyệt nếu có. Không báo là đã thử browser khi chưa chạy.
3. Kiểm tra code local mới nhất; tên file nêu trong tài liệu là vị trí tham khảo từ nhánh `main`, không phải danh sách bắt buộc phải sửa hết.
4. Thay đổi tối thiểu, theo module; không thêm mô phỏng, vòng render, kết nối WebSocket hay hệ thống lưu tiến trình mới.
5. Chạy lại `npm test` và kiểm thử chức năng/ảnh màn hình thuộc bước này. Không reset dữ liệu thật, không tự commit/push.
6. Cập nhật `PROGRESS.md`: file đổi, chức năng thực hiện, test PASS/FAIL/CHƯA KIỂM CHỨNG, thiếu sót, ảnh thực tế nếu chụp được. Dừng sau bước này.
