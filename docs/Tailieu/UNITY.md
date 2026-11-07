# TU TIÊN LIVE — DANH SÁCH TÀI NGUYÊN DỰNG GAME UNITY 2.5D

> **Mục tiêu:** Dựng giao diện theo concept xanh 9:16: sân tu luyện tràn viền, đài độ kiếp phía trên, bỏ cổng, chùa và footer thông tin tông môn. Từng đối tượng có thể chỉnh trong Hierarchy, không nhúng chữ động vào PNG.
>
> **Quy ước:** “Đã có” chỉ xác nhận tên file xuất hiện trong danh sách người dùng cung cấp, **chưa kiểm chứng nội dung**. Các tên khác là tài nguyên đề xuất cần tách hoặc bổ sung. PNG tách lớp nên có nền trong suốt, cùng góc nhìn, tỷ lệ phối cảnh, hướng sáng và điểm neo.

Cái nào chưa có hoặc không có thì bỏ qua nha

## Nhóm 1. Background — Bầu trời và môi trường

| Tên file | Chức năng |
|---|---|
| `bg_sky.png` | Nền trời xanh đậm phía sau toàn bộ giao diện (**đã có**) |
| `bg_cloud_far.png` | Lớp mây xa phía sau núi (**đã có**) |
| `bg_mountain_far.png` | Dãy núi xa, tạo chiều sâu (**đã có**) |
| `bg_mountain_mid.png` | Dãy núi trung cảnh (**đã có**) |
| `bg_cloud_near.png` | Mây gần, di chuyển phía trước các dãy núi |
| `bg_floating_rocks.png` | Các tảng đá bay xung quanh hai đài |
| `bg_cherry_blossom_left.png` | Cành hoa đào phía trên bên trái |
| `bg_cherry_blossom_right.png` | Cành hoa đào ở góc dưới bên phải |

## Nhóm 2. Architecture — Đài độ kiếp và sân tu luyện

| Tên file | Chức năng |
|---|---|
| `breakthrough_platform.png` | Phần nền kiến trúc chính của đài độ kiếp bay (**đã có**) |
| `platform_surface.png` | Mặt đài tròn nơi nhân vật ngồi độ kiếp |
| `platform_railings_back.png` | Lan can phía sau của đài |
| `platform_railings_front.png` | Lan can phía trước của đài |
| `platform_banners.png` | Hai lá cờ tím treo ở mặt trước đài |
| `lanterns_props.png` | Bộ đèn lồng trang trí (**đã có**; nên tách thành từng đèn khi dựng) |
| `waterfalls.png` | Các thác nước chảy từ đài (**đã có**; nên tách riêng từng dòng nước) |
| `main_courtyard.png` | Nền sân tu luyện chính (**đã có**; cần phù hợp bố cục tràn viền) |
| `arena_floor_base.png` | Mặt sân đá trống, không chứa pháp trận hoặc nhân vật |
| `arena_front_edge.png` | Phần viền vàng và mép đá phía trước sân |
| `arena_front_waterfalls.png` | Thác nước chảy phía dưới mép sân |
| `arena_gold_ornament.png` | Hoa văn trang trí vàng phía trước sân |

**Không còn sử dụng trong bố cục mới:** `temple_left.png`, `front_gate.png`.

## Nhóm 3. Formation — Pháp trận và vòng năng lượng

| Tên file | Chức năng |
|---|---|
| `formation_ring_base.png` | Vòng pháp trận cơ bản (**đã có**) |
| `formation_ring_glow.png` | Lớp phát sáng của pháp trận (**đã có**) |
| `formation_center.png` | Biểu tượng xoáy linh khí tại tâm sân |
| `formation_outer_ring.png` | Vòng phù văn lớn ngoài cùng của sân |
| `formation_inner_ring.png` | Vòng phù văn bên trong |
| `formation_rune_symbols.png` | Các ký hiệu và phù văn phát sáng |
| `tribulation_halo_blue.png` | Vòng pháp trận xanh dựng đứng phía sau đài độ kiếp |
| `tribulation_energy_gold.png` | Vòng năng lượng vàng bao quanh người độ kiếp |
| `tribulation_light_beam.png` | Cột sáng vàng chiếu từ đài lên trời |
| `fx_platform_glow.png` | Lớp ánh sáng phát ra từ mặt đài độ kiếp |

**Lưu ý:** Các vòng pháp trận đặt trên sân cần cùng góc phối cảnh. Chỉ dùng `scaleY` để giả lập độ nghiêng khi hình ảnh vẫn giữ được hình dạng phù văn.

## Nhóm 4. Characters — Nhân vật và hiệu ứng cá nhân

chỉ còn giữ lại các cử động sau cho mỗi nhân vật
1. meditation - khi ngồi dưới sàn
2. fly - khi bay lên/xuống đài độ kiếp, khi bay vào sân
3. attack - khi thực hiện tấn công
4. celebrate - khi đột phá thành công

**Cách dùng:** Tạo một `PlayerPrefab` chứa sprite, bóng, aura và biển tên; đổi sprite, màu aura và TextMeshPro theo người chơi. Không cần nhân bản file hiệu ứng cho từng người.

## Nhóm 5. Environment FX — Hiệu ứng môi trường

| Tên file | Chức năng |
|---|---|
| `mist_overlay.png` | Lớp sương mù phủ lên môi trường (**đã có**) |
| `petals_overlay.png` | Lớp cánh hoa đào bay (**đã có**) |
| `light_particles.png` | Các hạt ánh sáng lơ lửng (**đã có**) |
| `fx_cloud_storm.png` | Mây đen xuất hiện khi độ kiếp |
| `fx_lightning_01.png` đến `fx_lightning_06.png` | 6 frame sấm sét độ kiếp |
| `fx_spiritual_particles.png` | Các hạt linh khí bay lên |
| `fx_golden_flash.png` | Ánh sáng bùng nổ khi đột phá |
| `fx_waterfall_splash.png` | Bọt nước và ánh sáng tại chân thác |
| `fx_breakthrough_success.png` | Hiệu ứng độ kiếp thành công |
| `fx_breakthrough_fail.png` | Hiệu ứng độ kiếp thất bại |

**Cách dùng:** Có thể kết hợp sprite animation, Particle System, Animator hoặc Shader Graph, không nhất thiết mỗi hiệu ứng là một PNG tĩnh.

## Nhóm 6. UI Header — Tiêu đề và trạng thái tu luyện

| Tên file | Chức năng |
|---|---|
| `ui_header.png` | Header hiện có; nên kiểm tra và tách phần chữ khỏi khung (**đã có**) |
| `ui_title_ornament.png` | Hoa văn trang trí hai bên tiêu đề TU TIÊN LIVE |
| `ui_cultivation_icon.png` | Icon tu luyện hình người ngồi thiền |
| `ui_progress_frame.png` | Khung thanh nguyên lực |
| `ui_progress_fill.png` | Phần thanh năng lượng màu xanh |
| `ui_timer_frame.png` | Khung đồng hồ đếm ngược |
| `ui_header_divider.png` | Đường kẻ trang trí bên dưới thanh tiêu đề |

**Không đưa vào PNG:** Chữ `TU TIÊN LIVE`, `TU LUYỆN`, `650/1000`, thời gian đếm ngược; dựng bằng TextMeshPro để rõ nét và dễ sửa.

## Nhóm 7. UI Notice — Bảng Thiên Đạo Thông Cáo

| Tên file | Chức năng |
|---|---|
| `ui_notice_panel.png` | Khung bảng Thiên Đạo Thông Cáo (**đã có**) |
| `ui_notice_row.png` | Nền riêng cho mỗi dòng thông báo |
| `ui_rank_icons.png` | Bộ icon xếp hạng 1, 2, 3 |
| `ui_notice_divider.png` | Đường phân cách giữa các thông báo |
| `ui_notice_ornament.png` | Hoa văn hình sen phía trên bảng |
| `ui_notice_arrow_up.png` | Icon mũi tên tăng hạng |
| `ui_notice_arrow_down.png` | Icon mũi tên giảm hạng |

**Cách dùng:** Một `NoticeRowPrefab` gồm các Image và TextMeshPro; danh sách cập nhật được từ sự kiện LIVE.

## Nhóm 8. UI Profile — Thông tin nhân vật và khung phụ

| Tên file | Chức năng |
|---|---|
| `ui_profile_card.png` | Khung thông tin nhân vật (**đã có**; chỉ dùng nếu thiết kế mới cần) |
| `ui_profile_avatar_frame.png` | Khung ảnh đại diện người chơi |
| `ui_profile_progress.png` | Thanh tiến trình tu vi |
| `ui_profile_status_icon.png` | Icon trạng thái nhân vật |
| `ui_notification_frame.png` | Khung thông báo nhỏ trong game |
| `ui_breakthrough_result.png` | Khung kết quả độ kiếp |
| `ui_breakthrough_button.png` | Nền nút độ kiếp nếu có thao tác trực tiếp |

**Không còn sử dụng:** `ui_footer.png` vì đã bỏ footer thông tin tông môn.

---

## Nhóm 9. Thành phần nên tạo trực tiếp trong Unity, không cần PNG

| Thành phần | Cách thực hiện |
|---|---|
| Tên người chơi | TextMeshPro |
| Cảnh giới và tu vi | TextMeshPro |
| Thời gian đếm ngược | TextMeshPro |
| Thanh nguyên lực động | `Image` với `Filled` hoặc Slider |
| Danh sách thông báo | UI Prefab |
| Các vị trí nhân vật | Empty GameObject (`PlayerSlot`) |
| Hiệu ứng xoay pháp trận | Animator hoặc script |
| Mây trôi | SpriteRenderer + Animator |
| Linh khí, cánh hoa bay | Particle System |
| Thác nước chuyển động | Sprite Animation hoặc Shader |
| Thay đổi màu hào quang | Material hoặc SpriteRenderer Color |
| Quản lý người chơi LIVE | `PlayerManager` |
| Nhận sự kiện TikTok LIVE | `LiveEventManager` kết nối backend hiện có |

## Tổng hợp

| Nhóm | Số mục liệt kê |
|---|---:|
| Background | 8 |
| Architecture | 12 |
| Formation | 10 |
| Characters | 13 |
| Environment FX | 10 nhóm (sét gồm 6 file) |
| UI Header | 7 |
| UI Notice | 7 |
| UI Profile | 7 |
| **Tổng nhóm tài nguyên hình ảnh** | **74 mục** |

> Đây là **74 mục tài nguyên** theo thiết kế mục tiêu, **không phải 74 file bắt buộc tạo mới**. Một số đã có và một số có thể dùng sprite atlas hoặc hiệu ứng Unity thay thế. Số lượng chưa tính các phiên bản animation khác ngoài 6 frame sét đã nêu.

## Thứ tự thực hiện đề xuất

1. **Background:** hoàn thiện lớp trời, núi, mây và hoa đào.
2. **Architecture:** tách đài độ kiếp, sân tràn viền, lan can, cờ, đèn và thác nước.
3. **Formation:** pháp trận sân dưới, halo độ kiếp, vòng vàng và cột sáng.
4. **Characters:** tạo PlayerPrefab, các slot, aura và biển tên.
5. **Environment FX:** sương, hoa bay, linh khí, sét và animation độ kiếp.
6. **UI Header:** khung tĩnh dùng PNG; số liệu và chữ động dùng TextMeshPro.
7. **UI Notice:** làm danh sách thông báo động từ prefab.
8. **UI Profile:** chỉ thêm nếu cần hiển thị ở bố cục đã chốt.

## Quy chuẩn xuất file để ghép chính xác

- **Tỷ lệ thiết kế:** 9:16; Canvas UI tham chiếu `1080 × 1920`.
- **Định dạng:** PNG RGBA nền trong suốt cho layer rời; riêng nền trời có thể không cần trong suốt.
- **Nhất quán hình ảnh:** cùng phối cảnh, hướng sáng, bảng màu xanh đậm–cyan–vàng và phong cách tiên hiệp.
- **Điểm neo:** lưu pivot và vị trí tương đối để đặt đúng vào một bố cục gốc; với các layer chồng chính xác, có thể xuất cùng kích thước canvas với vùng ngoài asset trong suốt.
- **Chữ:** tên người chơi, trạng thái, đồng hồ, số liệu và thông báo dùng TextMeshPro thay vì chữ dính vào ảnh.
- **Tách chiều sâu:** đồ phía sau nhân vật / dưới chân / phía trước nhân vật ở các layer riêng và sắp xếp bằng Sorting Layer / Order in Layer.
- **Kiểm tra ảnh cũ:** nếu một PNG đã chứa sẵn pháp trận, ánh sáng, cờ hay thác nước thì cần tách hoặc làm sạch trước khi chồng thêm layer mới.

HIRARCHY

GameScene
├── Background
│   ├── Sky
│   ├── MountainFar
│   ├── CloudFar
│   ├── MountainMid
│   └── CloudNear
│
├── Environment
│   ├── CherryBranches
│   ├── BreakthroughPlatform
│   ├── Waterfalls
│   ├── MainCourtyard
│   └── CourtyardTrim
│
├── MagicEffects
│   ├── FormationGround
│   ├── FormationBreakthrough
│   ├── BreakthroughBeam
│   └── Particles
│
├── Characters
│   ├── Cultivator_01
│   ├── Cultivator_02
│   └── ...
│
└── UI_Canvas
    ├── Header
    ├── NoticePanel
    ├── ProfilePanel
    └── Footer
