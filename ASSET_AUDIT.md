# ASSET_AUDIT — 07.0 audit PNG và preview độc lập

Ngày 06/11/2026. Phạm vi: đọc/đo PNG có sẵn, căn bố cục, trang preview riêng. **Không tích hợp `/song`, không làm 07.1, không commit/push.**

## Kết quả và cách mở

- **PASS**: 26/26 PNG giải mã và kiểm CRC thành công, không thiếu file trong cấu hình; 25 RGBA có alpha, 1 RGB nền kín. Không tải ngoài, không tạo PNG thay thế, không sửa byte ảnh nguồn.
- **PASS**: `/asset-preview.html` chạy Three.js OrthographicCamera + PlaneGeometry + MeshBasicMaterial; 33 instance từ 26 ảnh, mặc định 26 instance hiện / 19 texture dùng chung. Không gọi API/WebSocket game.
- **PASS**: x/y, scale/scaleY, opacity, z, anchor, crop, kéo tọa độ/thứ tự, ẩn/hiện, zoom/pan, nhập concept và overlay/so sánh, xuất/nhập JSON riêng. JSON sai hoặc concept không tải được giữ bố cục/ảnh trước đó.
- **FAIL về khớp hoàn toàn ảnh concept**: nguồn có phần sân/đèn bị cắt; thiếu cây/cành đào, hào quang, liên kết kiến trúc; góc nhìn vòng pháp trận cần xấp xỉ bằng scaleY. Nhân vật không phải chibi như concept. Không đồng nghĩa file PNG bị hỏng.
- **CHƯA KIỂM CHỨNG**: alpha sạch ở mọi kích thước/zoom và mọi thiết bị, animation/chuyển pose, nhiều người thực, battle sprite, OBS/LIVE thật, chạy dài hạn. Không công bố bộ ảnh sẵn sàng đưa lên LIVE.

Chạy `npm.cmd start`, mở `http://localhost:3000/asset-preview.html` (dùng cổng cấu hình nếu khác 3000). `?capture=1` hiển thị riêng khung 9:16; `?capture=1&mode=compare` so sánh; `?capture=1&gallery=1` xem toàn bộ PNG. Có thể chuyển nền gallery sang trắng/đen để soát alpha.

Ảnh concept người dùng thêm: `public/assets/concept/main.jpg`, **941×1672, 508649 bytes**, chỉ làm lớp tham chiếu khi chọn overlay/compare. Ở chế độ Preview ảnh concept được ẩn, không dùng làm cảnh nền thay cho layer. Chữ tĩnh chỉ ghi nhãn PREVIEW, không giả dữ liệu LIVE. UI profile mặc định ẩn.

Cấu hình căn chỉnh: [layout.json](public/preview-2_5d/layout.json). Nút Xuất JSON tải `layout-preview-07-0.json` về máy; không POST, không ghi `caidat.json` hay game state. Nhập concept được đọc cục bộ bằng FileReader; xuất JSON có thể kèm data URL. Crop dùng UV riêng trên plane, không sửa texture chung hoặc PNG.

## Phương pháp đo và giới hạn

`node scripts/audit-assets.js` quét đệ quy `public/assets/` (PNG), kiểm signature/CRC, giải nén lossless 8-bit không interlace, xử lý đủ 5 filter của PNG. Thư mục có dấu cách dùng URL encode từng segment. SHA-256, URL, alpha bins và toàn bộ số đếm lưu ở [asset-audit.json](public/preview-2_5d/asset-audit.json). JPG concept được kiểm bằng ảnh load thật trong browser, không nằm trong 26 PNG.

BBox dạng `[left,top,right,bottom)` theo pixel nguồn. BBox A>0 giữ cả nhiễu gần trong suốt; A≥32 giúp xem vùng có ý nghĩa nhưng **không phải thuật toán tách nền**. Crop mặc định của công trình/nhân vật theo A≥32, có thể đổi toàn canvas để giữ glow mờ. T0 = số pixel alpha 0, T1–254 = bán trong suốt. Rất nhiều pixel vật thể có alpha 254 nên không suy ra vật thể bị mờ chỉ từ T1–254.

Đen: RGB max<16 và A>0; cột sau dấu `/` chỉ đếm A≥32. Đen có thể là bóng/tóc hay mẫu gần trong suốt, **không tự kết luận matte đen**. Viền: pixel A=1…254 cạnh ít nhất một hàng xóm 4 hướng A<32; đỏ là R>100 và R>1.8G,1.8B, xanh là B>100 và B>1.8R,1.35G. Cột viền dưới chỉ lấy A≥32. Đây là tín hiệu để soát, không đủ phân biệt màu trang phục và lỗi alpha. Không threshold/xóa pixel tự động.

Đã xem contact sheet checker, trắng, đen và ảnh ghép thật; đã soi nguồn header/nhân vật. RGB đỏ/xanh/vàng ở vùng alpha thấp có thể trông rất nặng khi công cụ xem ảnh bỏ/diễn giải alpha khác browser. Bản browser không hiện toàn bộ nhiễu này như màu đục; cần rà riêng ở kích thước cuối, không khẳng định mọi ảnh có halo nặng chỉ từ RGB nguồn. Viền sáng quanh nhân vật vẫn là điểm cần kiểm tra trước nghiệm thu LIVE.

## Kiểm kê 26 PNG

| File trong public/assets/ | Px | Alpha | BBox A>0 | BBox A≥32 | T0 | T1–254 | Đen A>0 / A≥32 |
|---|---|---|---|---|---:|---:|---:|
| `Architecture layers/breakthrough_platform.png` | 941×1672 | RGBA | [0, 85, 930, 1648] | [81, 503, 927, 979] | 1345163 | 227956 | 3781 / 0 |
| `Architecture layers/front_gate.png` | 1213×1296 | RGBA | [29, 17, 1167, 1232] | [35, 66, 1165, 1126] | 966664 | 605062 | 4487 / 16 |
| `Architecture layers/lanterns_props.png` | 941×1672 | RGBA | [0, 23, 941, 1648] | [4, 479, 941, 1555] | 1327257 | 246032 | 9546 / 0 |
| `Architecture layers/main_courtyard.png` | 1148×1370 | RGBA | [0, 90, 1148, 1370] | [0, 371, 1148, 1311] | 822592 | 749995 | 6367 / 0 |
| `Architecture layers/temple_left.png` | 1040×1512 | RGBA | [0, 9, 1024, 1512] | [2, 173, 1016, 1340] | 831710 | 740497 | 12477 / 40 |
| `Architecture layers/waterfalls.png` | 941×1672 | RGBA | [17, 2, 941, 1672] | [358, 657, 908, 1672] | 1328711 | 244641 | 16798 / 0 |
| `Background layers/bg_cloud_far.png` | 941×1672 | RGBA | [0, 0, 941, 1672] | [17, 89, 925, 1580] | 1161213 | 412139 | 85582 / 0 |
| `Background layers/bg_mountain_far.png` | 941×1672 | RGBA | [0, 0, 941, 1672] | [0, 267, 941, 709] | 1251303 | 322008 | 12559 / 0 |
| `Background layers/bg_mountain_mid.png` | 941×1672 | RGBA | [0, 20, 941, 1672] | [0, 270, 941, 1672] | 776602 | 796742 | 160761 / 0 |
| `Background layers/bg_sky.png` | 941×1672 | RGB | [0, 0, 941, 1672] | [0, 0, 941, 1672] | 0 | 0 | 0 / 0 |
| `Characters/Character_1/attack.png` | 1254×1254 | RGBA | [29, 30, 1244, 1240] | [34, 33, 1201, 1234] | 843140 | 728057 | 3388 / 224 |
| `Characters/Character_1/back_3quarter.png` | 1254×1254 | RGBA | [0, 35, 1208, 1254] | [52, 53, 1203, 1213] | 920758 | 650946 | 3521 / 374 |
| `Characters/Character_1/celebrate.png` | 1254×1254 | RGBA | [33, 0, 1198, 1254] | [179, 9, 1072, 1244] | 965648 | 606039 | 4125 / 302 |
| `Characters/Character_1/fly.png` | 1254×1254 | RGBA | [0, 12, 1240, 1214] | [179, 15, 1076, 1193] | 1059039 | 512748 | 3117 / 119 |
| `Characters/Character_1/idle_stand.png` | 1254×1254 | RGBA | [31, 14, 1208, 1254] | [231, 16, 981, 1241] | 1065170 | 506678 | 4475 / 255 |
| `Characters/Character_1/meditate.png` | 1254×1254 | RGBA | [0, 3, 1253, 1254] | [28, 70, 1228, 1195] | 819482 | 752577 | 6575 / 472 |
| `Characters/Character_1/meditate_3quarter.png` | 1254×1254 | RGBA | [31, 39, 1238, 1254] | [41, 61, 1218, 1206] | 865397 | 706331 | 2785 / 202 |
| `FX layers/formation_ring_base.png` | 1254×1254 | RGBA | [0, 0, 1254, 1254] | [24, 45, 1225, 1219] | 323448 | 1249068 | 131229 / 0 |
| `FX layers/formation_ring_glow.png` | 1254×1254 | RGBA | [0, 0, 1254, 1254] | [75, 90, 1180, 1159] | 257463 | 1315053 | 450365 / 0 |
| `FX layers/light_particles.png` | 941×1672 | RGBA | [0, 0, 941, 1672] | [65, 116, 889, 1536] | 1025956 | 547396 | 418590 / 0 |
| `FX layers/mist_overlay.png` | 941×1672 | RGBA | [0, 0, 941, 1672] | [0, 243, 941, 1672] | 222565 | 1350787 | 332533 / 0 |
| `FX layers/petals_overlay.png` | 941×1671 | RGBA | [21, 9, 941, 1649] | [50, 130, 882, 1583] | 1388084 | 184304 | 122383 / 0 |
| `UI/ui_footer.png` | 2172×724 | RGBA | [0, 39, 2143, 700] | [32, 246, 2140, 465] | 1069916 | 502531 | 129445 / 0 |
| `UI/ui_header.png` | 2172×724 | RGBA | [0, 0, 2172, 724] | [11, 34, 2165, 681] | 348111 | 1224413 | 139408 / 0 |
| `UI/ui_notice_panel.png` | 1546×1017 | RGBA | [0, 0, 1546, 1017] | [142, 8, 1406, 946] | 407463 | 1164808 | 47953 / 12 |
| `UI/ui_profile_card.png` | 2172×724 | RGBA | [0, 0, 2171, 724] | [37, 61, 2133, 640] | 482738 | 1089708 | 80150 / 0 |

## Biên, cắt nguồn và cách sử dụng

Chạm cạnh dùng A≥32, số là pixel trên cạnh: T=trên, R=phải, B=đáy, L=trái. Chạm cạnh của nền/thác/sương có thể có chủ ý; vật thể riêng cần rà phần mất. Không có nhân vật chạm cạnh tại ngưỡng này.

| File | Viền đỏ / xanh A≥32 | Chạm cạnh | Quan sát / hành động cần thiết |
|---|---:|---|---|
| `Architecture layers/breakthrough_platform.png` | 9 / 411 | — | Đảo riêng giữa canvas 9:16; cần offset/crop riêng. Neo đáy sau crop. Mặt đài có phối cảnh sẵn, không xoay như model. |
| `Architecture layers/front_gate.png` | 1888 / 0 | — | Cổng + thềm là một khối riêng; có tín hiệu đỏ ở biên cần soát. Chân cổng chưa nối liền sân như concept; không thể tạo đường nối chỉ bằng offset. |
| `Architecture layers/lanterns_props.png` | 6 / 0 | R:177 | Nhiều đèn/đạo cụ chung một ảnh; chạm phải. CẦN TÁCH nếu đặt đèn riêng hoàn chỉnh. Mặc định ẩn vì công trình đã có đèn. |
| `Architecture layers/main_courtyard.png` | 0 / 131 | R:250, L:299 | Sân/đảo riêng, chạm cả trái và phải. CẦN TÁCH LẠI nếu muốn toàn bộ lan can; config không phục hồi pixel mất. |
| `Architecture layers/temple_left.png` | 328 / 9 | — | Công trình riêng, thềm và đèn gộp trong ảnh; cần crop + vị trí riêng. Soát viền mái; không có cành đào như concept. |
| `Architecture layers/waterfalls.png` | 0 / 0 | B:21 | 5 dải thác trên cùng canvas; chạm đáy. Nối dài ngoài khung có thể có chủ ý; chưa khớp từng chân thác với đảo bằng offset chung. |
| `Background layers/bg_cloud_far.png` | 0 / 0 | — | Nhiều cụm mây trên canvas dọc; dùng toàn canvas với độ mờ riêng. Không coi khoảng trống là ảnh hỏng. |
| `Background layers/bg_mountain_far.png` | 0 / 73 | R:104, L:155 | Dải núi chạm hai cạnh; hợp lý với lớp nền. Không chứng minh có cùng tọa độ concept chỉ vì cùng 941×1672. |
| `Background layers/bg_mountain_mid.png` | 0 / 3173 | R:494, B:311, L:793 | Chạm trái/phải/đáy, nhiều khối núi chung một layer; không thể pan độc lập từng núi. Tín hiệu xanh ở biên có thể là màu đá. |
| `Background layers/bg_sky.png` | 0 / 0 | T:941, R:1672, B:941, L:1672 | RGB nền kín, không cần alpha. Có thể phủ toàn khung 9:16; nguồn hợp lệ. |
| `Characters/Character_1/attack.png` | 0 / 2058 | — | Tư thế tấn công đơn, không phải chuỗi animation. Viền áo/tóc cần soát; silhouette và chân khác các pose. |
| `Characters/Character_1/back_3quarter.png` | 85 / 356 | — | Tư thế ngồi quay lưng, không phải pose chạy/đi. Cần neo bàn tọa riêng khi chuyển pose. |
| `Characters/Character_1/celebrate.png` | 109 / 1457 | — | Tư thế ăn mừng đơn, không có frame chuyển tiếp. Cần chuẩn hóa pivot với pose đứng. |
| `Characters/Character_1/fly.png` | 22 / 869 | — | Tư thế bay đơn; không có frame cất/hạ cánh. Chân và tà áo tạo bbox khác pose đứng. |
| `Characters/Character_1/idle_stand.png` | 23 / 840 | — | Tư thế đứng đơn. Người lớn, khác nhân vật chibi trong concept; không có biến thể tóc/giới tính. |
| `Characters/Character_1/meditate.png` | 5 / 639 | — | Đã thử đặt trên đài bằng neo đáy. Có viền sáng/nhiễu màu ở tóc/tà áo khi soi nguồn; cần rà alpha ở tỷ lệ hiển thị cuối. |
| `Characters/Character_1/meditate_3quarter.png` | 16 / 859 | — | Đã thử 8 bản trên sân, dùng chung texture. Cần rà viền sáng; hiện cùng một nhân vật, chưa đổi bảng màu/hào quang. |
| `FX layers/formation_ring_base.png` | 0 / 0 | — | Hình tròn nhìn chính diện, không cùng phối cảnh mặt sân. Preview ép scaleY=.38; là xấp xỉ, cần xuất lại phối cảnh nếu muốn khớp nét concept. |
| `FX layers/formation_ring_glow.png` | 0 / 0 | — | Tương tự vòng nền, scaleY=.4 và cộng sáng trong preview. Nhiều pixel tối alpha rất thấp; không phải bằng chứng có tấm nền đen đục. |
| `FX layers/light_particles.png` | 0 / 0 | — | Mật độ thấp, alpha trung bình chỉ 6.6/255 trên pixel có alpha. Đen chủ yếu gần trong suốt; dùng add rất nhẹ, chưa có animation. |
| `FX layers/mist_overlay.png` | 0 / 0 | R:963, B:891, L:848 | Sương chạm ba cạnh, phù hợp lớp phủ. Preview đặt phía sau kiến trúc, opacity .16; không tự loại pixel đen vì có thể phá alpha. |
| `FX layers/petals_overlay.png` | 0 / 0 | — | Cánh hoa rải 9:16 gần chuẩn nhưng cao 1671, ít hơn các nền 1px. Hiện tĩnh; không thay cho layer cây/cành đào còn thiếu. |
| `UI/ui_footer.png` | 0 / 0 | — | Khung trống, có thể dùng trang trí. Cần căn crop riêng; không có chữ/số game. Rà viền mảnh trên nền trắng trước sử dụng thật. |
| `UI/ui_header.png` | 0 / 0 | — | Khung rộng 3:1, canvas khác nền. Có RGB màu lạ quanh biên chủ yếu alpha thấp (966479 px alpha 1–15); browser không hiển thị như bản RGB bỏ alpha. Chưa nhận sạch ở zoom 1:1. |
| `UI/ui_notice_panel.png` | 0 / 0 | — | Khung thông cáo trống, không có dữ liệu động. Canvas/tỷ lệ khác concept; có vùng tối hợp lệ bên trong. Cần rà biên khi dùng kích thước cuối. |
| `UI/ui_profile_card.png` | 0 / 0 | — | Khung hồ sơ trống, không chứa avatar thật. Mặc định ẩn. Chưa có cơ chế kích hoạt vì ngoài 07.0; nhiều pixel alpha thấp ngoài viền cần rà. |

## Tọa độ và phối cảnh

**Không phải một bộ layer đã xuất chung tọa độ concept.** Nền 941×1672 có thể dùng nguyên khung, nhưng chưa có file tác giả xác nhận chúng khớp pixel với concept. Công trình có canvas khác nhau (1040×1512, 1148×1370, 1213×1296), vật thể được đặt riêng trong vùng trong suốt. Đài tuy cùng 941×1672 nhưng bbox A≥32 chỉ `[81,503,927,979)`, khác vị trí đài trong concept. Chồng nguyên canvas tất cả ảnh sẽ không ra cảnh mẫu.

Cấu hình đã crop và căn riêng theo concept: temple bên trái, đài trên phải, sân ở giữa/dưới, cổng tiền cảnh bên trái. Mặt ngồi hai hàng, `meditate_3quarter` trên sân và `meditate` ở đài; neo `[.5,1]` sau crop. Dùng chung texture 8 nhân vật sân; không tạo texture 2K cho từng người. Anchor bàn tọa là gần đúng trong preview, chưa có bộ pivot chuyển pose; không suy ra animation đã đúng.

Thứ tự mặc định: sky → núi xa → mây xa → núi giữa → thác → sương sau → sân → temple → đài → vòng pháp trận → nhân vật → cổng/props → hạt/cánh hoa → khung HUD. Có thể kéo thứ tự hoặc sửa z. Sương nằm sau để không rửa màu mặt nhân vật. Vòng pháp trận xấp xỉ mặt sân bằng scaleY; không phải phối cảnh vật lý. Mặt đài, sân và cổng có các góc nhìn vẽ sẵn nên tiếp nối chưa liền như tranh mẫu. Nhãn và thông số game trong concept không được chép vào khung PNG hay giả lập dữ liệu.

Thiếu cần ghi nhận: layer cành/cây đào; đường/cầu và phần chuyển tiếp kiến trúc liền mạch; aura riêng ngồi/độ kiếp, vòng sáng đứng phía sau đài, nameplate; sprite portrait nếu cần hồ sơ; chuỗi đứng dậy/đi/chạy/thi triển/trúng đòn/gục và frame chuyển tiếp; toàn bộ boss/quái chiến trường 2D. Chỉ có 1 Character_1, không có tóc/giới tính mới. Không bổ sung các tài nguyên này trong 07.0.

## Kiểm thử và bằng chứng

- Baseline trước sửa: `npm.cmd test` chạy ở terminal, **89 bài: 88 PASS / 0 FAIL / 1 SKIP**. Git đầu phiên chỉ có thư mục tài liệu `phases/07_CHUYEN_2_5D/` chưa tracked; sau đó người dùng thêm main.jpg. Giữ nguyên các file đó.
- Sau sửa: `npm.cmd test`: **92 bài: 91 PASS / 0 FAIL / 1 SKIP** (3 test mới: PNG filters/CRC/truncated; alpha/bbox; validate layout/crop/path encode/reorder). SKIP vẫn là LIVE thật.
- Browser: `node scripts/asset-preview-smoke.js`, Chrome headless 156, ANGLE Intel HD Graphics P530 / D3D11, profile và dataRoot tạm. **25 kiểm tra PASS**, không exception. Không dùng dữ liệu DEMO/LIVE thật.
- Đã kiểm kéo tọa độ bằng pointer, reorder bằng drag/drop event, x/y/scale/opacity/z/anchor/crop, hide/show giảm đúng một draw call, zoom/pan/reset, export file mới và import lại, JSON sai không thay layout, concept sai không thay ảnh, nhập JPG cục bộ/opacity, gallery 26 ảnh/nền trắng/đen. Preview không có request API, WebSocket hay ghi state. Mở `/song` sau đó mới dùng luồng kết nối cũ trên app tạm.
- Lỗi preview đã sửa: thanh cuộn làm canvas 720×1280 bị hẹp; capture giờ đúng kích thước. So sánh từng bị nhãn preview chồng lên nửa concept; giờ clip nhãn theo vạch chia. Import concept hỏng giữ ảnh cũ. Các sửa chỉ ở module preview.
- `/song` cũ render được ở 720×1280 và 1080×1920, 0 người/dừng với dữ liệu tạm, không exception, không bật fallback. Đây là smoke mở trang, **chưa kiểm lại toàn bộ browser 10/30/60 người, độ kiếp, quà hay battle trong lượt audit**. Logic hồi quy chạy qua npm test; không sửa module runtime. HUD đầu trang /song có các dòng sát/chồng nhau ở ảnh 720; chưa xử lý vì ngoài phạm vi, file nguồn không đổi.

| Khung preview | FPS trong 3 giây | Draw calls / triangles | GPU texture / geometry | RGBA ước tính |
|---|---:|---:|---:|---:|
| 720×1280 | 60.6 | 26 / 52 | 19 / 26 | 114.0 MiB |
| 1080×1920 | 59.5 | 26 / 52 | 19 / 26 | 114.0 MiB |

Số đo lúc `2026-11-06T14:32:45.138Z`; cảnh tĩnh, bật vòng render liên tục 3 giây để đo. Bình thường preview chỉ render khi thay đổi, không báo FPS idle giả. 12 lần chỉnh liên tiếp giữ nguyên số texture/geometry; chưa chứng minh không rò nhiều giờ. Toàn bộ 26 PNG nén **31,362,851 bytes**; nếu tải tất cả RGBA8 cần **156.0 MiB**, chưa tính browser decode/framebuffer; có mipmap thường tăng khoảng 1/3 (~208 MiB). Preview dùng LinearFilter, tắt mipmap, không nhân texture theo layer/nhân vật. Cache chỉ tối đa 26 nguồn, geometry/material/texture được dispose khi rời trang. Bộ ảnh chưa có bản độ phân giải thấp; ngân sách trên thiết bị yếu và giảm chất lượng live **CHƯA KIỂM CHỨNG**.

Bằng chứng lưu riêng trong repo (chưa commit), không phải ảnh concept dựng giả:

- [Preview 1080×1920](docs/07-0/preview-1080x1920.png), [preview 720×1280](docs/07-0/preview-720x1280.png).
- [So sánh concept / preview 1080×1920](docs/07-0/comparison-1080x1920.png): trái là main.jpg, phải là cảnh ghép thật cùng tọa độ. Vạch chia có thể kéo bằng slider. Không phải điểm số similarity tự động.
- [26 PNG trên checker](docs/07-0/asset-contact-sheet.png), [nền đen](docs/07-0/asset-contact-sheet-black.png), [nền trắng](docs/07-0/asset-contact-sheet-white.png).
- [/song nguyên trạng 720×1280](docs/07-0/song-unchanged-720x1280.png), [/song nguyên trạng 1080×1920](docs/07-0/song-unchanged-1080x1920.png).
- [Browser report](docs/07-0/browser-report.json), [npm test sau sửa](docs/07-0/npm-test-after.txt).

**Bảo toàn:** git diff các file đã tracked không có thay đổi ở public/js, public/song.html, public/css, backend, package/dependencies hoặc PNG. SHA-256 từng PNG lưu trong manifest, đối chiếu lại file nguồn sau QA khớp 26/26. Không reset hay sửa dữ liệu game thật. Tài liệu giai đoạn và ảnh concept mới của người dùng được giữ nguyên.

**Điểm dừng:** 07.0 đã có audit, cấu hình và preview/screenshot để xem xét. Các lỗi/chênh lệch asset ở trên vẫn tồn tại; chưa nghiệm thu tích hợp LIVE. Không triển khai 07.1, không sửa vấn đề hiệu năng 06.2 còn ghi trong PROGRESS.md, không tự commit/push.
