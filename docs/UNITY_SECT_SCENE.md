# Unity 03 — Tông môn 2.5D từ PNG

**Tài liệu bước03 dưới đây là lịch sử. Scene chỉnh trực quan hiện tại là SectScene_Editable.unity; dùng Transform/MeshRenderer, không dùng Position Pixels. Xem [UNITY_SCENE_AUTHORING.md](UNITY_SCENE_AUTHORING.md). Scene/prefab gốc được giữ nguyên làm bản legacy.**

Scene chính: unity-client/Assets/Scenes/SectScene.unity. Project Unity ở gốc repository, Editor 6000.5.9f1 / URP 17.5.0. Bước này dựng môi trường độc lập; chưa có renderer người chơi, UI gameplay hoặc hệ thống battle Unity. NetworkTest và backend Node.js vẫn là phần bàn giao bước 02.

## Mở scene và chỉnh trong Inspector

1. Unity Hub → mở project **unity-client/** ở gốc; chờ import/compile. Nếu Editor đã mở trước lúc thêm file, dùng Assets → Refresh.
2. Mở **Assets/Scenes/SectScene.unity**, thêm Game View aspect **9:16**, chọn 1080×1920 hoặc 720×1280. Scene đã có sẵn asset/transform, không cần chạy factory để mở.
3. Chọn **SectScene — PNG 2.5D**, component SectSceneController: Quality = Low/Medium/High, Animate bật/tắt. Play để xem drift/parallax/mây/sương/cánh hoa. Edit Mode giữ bố cục ổn định.
4. Select a SectLayer (for example Temple), leave Play Mode, press W and drag the Move handle in Scene View. XY movement updates Position Pixels (100 pixels/unit, Y down); Ctrl+Z/Ctrl+Y supports Undo/Redo. Save with Ctrl+S. Z remains controlled by sorting order. Position Pixels, Uniform Scale and Anchor can also be edited in Inspector. Transform Position entered directly in Inspector is still transient; use Position Pixels for numeric placement.
5. Content Pixel Rect là bbox alpha≥32 dùng để neo và kiểm định. Source Pixel Rect chứa toàn bộ alpha>0 và 3px đệm để giữ viền mềm. Đổi anchor không sửa pixel hoặc cắt nội dung ảnh gốc.
6. Kiến trúc có Vertical Scale=1, Rotation=(0,0,0). Không xoay mặt sân nằm ngang trong 3D: ảnh đã vẽ phối cảnh sẵn. Chỉ pháp trận có Vertical Scale=.35 theo mặt elip của sân; không áp dụng tỉ lệ này cho công trình.
7. Sorting Layer xác định nhóm xa/gần; Sorting Order xác định thứ tự trong nhóm. Opacity chỉ tác động alpha, RGB ảnh luôn trắng trong material property block; không có LUT/tint/hậu kỳ đổi màu PNG.
8. CameraRig dùng khung tham chiếu 10.8×19.2 world unit, 100px/unit. Protected Layers và Safe Margin khiến camera tự nới nếu bạn đưa một công trình chính ra ngoài khung. Các cửa sổ khác tỉ lệ được letterbox/pillarbox, giữ khung 9:16.
9. HUD hiện chỉ có tiêu đề/tên tông môn và khung trang trí. Không có số người chơi, đồng hồ hoặc bảng xếp hạng giả. Các trường dữ liệu sẽ được nối trong bước được yêu cầu sau.

## Layer và bố cục

Trời → mây → núi xa → núi trung/sương sau → kiến trúc hậu cảnh/thác/chính điện → đài độ kiếp → sân → pháp trận → vị trí nhân vật → cổng tiền cảnh → sương/hạt/cánh hoa → HUD.

Các sorting layer riêng: SectBackground, SectArchitecture, SectPlatform, SectGround, SectGroundDetail, SectCharacters, SectForeground, SectAtmosphere, SectHUD. Plane nằm trong mặt XY, có khoảng Z nhỏ để giữ thứ tự; camera orthographic nhìn thẳng. Sân và đài đều có Protect From Clipping. Cổng và chính điện được căn đồng bộ với sân; có 12 điểm Seat và một Breakthrough seat, chưa spawn nhân vật.

Sân rộng 987.28px trong khung 1080px; hai mép PNG đều nằm trong view. Đài rộng 575.28px, nằm trên phải. Pháp trận base khoảng 528px ngang và 181px cao; tỉ lệ elip gần các đường vòng trên sân ở bố cục này, không được coi là phép chiếu vật lý của một sàn 3D. Vòng glow dùng alpha nhẹ, không bloom/additive gây cháy sáng.

Camera drift tối đa 3.5px ngang / 2.5px dọc ở kích thước tham chiếu. Các lớp nền parallax riêng; mây/sương/cánh hoa chuyển dịch chậm có giới hạn, không pan để lộ mép texture. Thác là lớp nền cố ý kéo ra mép dưới; cảnh không giả lập dòng nước hoặc nghi thức độ kiếp ở bước này.

## Import và kiểm tra PNG

Đã copy **17 PNG** vào Assets/Art/Sect: 15 ảnh yêu cầu và ui_header/ui_footer đã có sẵn. File public/assets giữ nguyên byte; concept/main.jpg chỉ dùng so sánh, không đưa lên plane/hình nền Unity.

Importer: Sprite (2D and UI), Single, **Full Rect**, PPU=100, sRGB, alpha From Input/transparency khi có kênh alpha, Bilinear/Clamp, không mipmap, không NPOT resize, không compression, max size 4096, không CPU Read/Write. Dùng Full Rect để giữ viền mềm của từng ảnh; plane UV bỏ duy nhất padding hoàn toàn trong suốt. Không cần Sprite Editor/2D package mới.

[Audit từng PNG](unity-stage03/ASSET_AUDIT.md) và [JSON đo/hash](unity-stage03/asset-audit.json) có kích thước, alpha, bbox, pixel chạm cạnh, tín hiệu viền đen/sáng/màu, độ biến thiên nét. Gradient là số mô tả, không tự đánh giá ảnh đẹp hoặc lỗi. Đã đối chiếu ảnh nguồn/contact sheet, concept và ảnh render Unity thực tế.

| Asset | Đánh giá phù hợp / vấn đề | Cách dùng trong scene |
|---|---|---|
| bg_sky | RGB kín nền, gradient mềm; không có alpha là đúng | Overscan 4% để drift không lộ viền |
| bg_cloud_far | Mây mềm, nhiều vùng alpha thấp, chưa phải texture seamless | Giữ màu, alpha .5, dịch ngang nhẹ; không lặp vô hạn |
| bg_mountain_far | Chạm trái/phải ngay từ ảnh nguồn; hợp nền toàn khung | Giữ phối cảnh gốc, parallax nhỏ |
| bg_mountain_mid | Chạm trái/phải/dưới, gồm nhiều khối núi rời | Căn nguyên hệ tọa độ nền, không kéo xa gây lộ cạnh |
| main_courtyard | **Lỗi nguồn:** mép trái/phải bị cắt; 299/250 pixel alpha≥32 chạm cạnh. Đáy đảo còn nguyên, nét sàn dịu hơn công trình | Hiện toàn bộ footprint PNG; không phục hồi được phần thiếu bên ngoài ảnh, chưa nhận hoàn chỉnh như concept |
| breakthrough_platform | Chi tiết rõ, alpha mềm lan xa ngoài silhouette | Neo bbox nội dung, vẫn render viền mềm; bảo vệ trong camera |
| temple_left | Gần mép trái nguồn nhưng silhouette alpha≥32 chưa chạm cạnh; chi tiết mái/đèn rõ | Scale đều .40, giữ cầu thang có sẵn |
| front_gate | Silhouette nguyên, chi tiết rõ; góc nhìn khác sân đôi chút | Scale đều .29, đặt dưới vùng mặt sân chính |
| lanterns_props | **Lỗi nguồn:** cụm bên phải bị cắt; bố cục vòng trùng lan can/đèn đã có trong sân | Import đầy đủ, layer mặc định ẩn; bật riêng nếu chỉnh lại vị trí phù hợp |
| waterfalls | Đuôi nước chạm đáy nguồn, không phải ảnh có kết thúc kín | Lớp nền nối xuống ngoài khung, Allow Frame Bleed; không đánh đồng với cắt sân/đài |
| formation_ring_base | Vòng nhìn chính diện, khác góc sân | ScaleY .35 có căn theo elip sân, alpha .58, không xoay sàn 3D |
| formation_ring_glow | Viền mềm, nhìn chính diện; quá mạnh nếu cộng sáng | Cùng góc elip, alpha .22, nhịp sáng nhẹ; Low tắt |
| light_particles | Hạt rất mờ, phần lớn alpha thấp | Chỉ High bật; không tăng sáng RGB hoặc tạo texture mỗi frame |
| mist_overlay | Chạm cạnh phải/trái/dưới; hợp lớp nền/khí quyển | Medium: lớp sau .15; High thêm lớp trước .045; Low tắt |
| petals_overlay | Nét mềm/blurry có sẵn, canvas thấp hơn nền 1px | Căn riêng theo kích thước thật, chuyển động chậm; Low tắt |
| ui_header | Alpha thấp/nhiễu RGB ngoài viền, khung nguồn rộng, không có chữ | Giữ nguyên alpha; title/subtitle là text Unity trong vùng giới hạn |
| ui_footer | Padding và halo khá lớn, khung trống | Neo nội dung thay vì toàn canvas; tên tông môn vừa vùng khung |

Không dùng thuật toán xóa nền đen, chỉnh màu, sharpen, vẽ lại hoặc upscale PNG. Kênh RGB ở pixel gần trong suốt không phải bằng chứng có viền đen đục. Mipmap/tight mesh có thể làm mất nét viền mỏng nên không bật ở cấu hình này.

## Asset thiếu và placeholder

| Thiếu / giới hạn | Xử lý hiện tại | Cần bổ sung nếu muốn gần concept hơn |
|---|---|---|
| Cây/cành đào có hình vẽ anime | Một nhánh/hoa đơn giản bằng mesh code, tên rõ Placeholder; cánh hoa PNG độc lập | PNG cây và nhánh có alpha, góc nhìn phù hợp |
| Đường/cầu nối kiến trúc liên tục | Bậc đá tạm bằng mesh, tận dụng cầu thang temple/courtyard có sẵn | Các đoạn cầu/stair transition vẽ cùng phối cảnh |
| Phần lan can/mép sân bị cắt ngoài ảnh nguồn | Giữ toàn bộ PNG trong view, lùi hai mép khỏi mép camera, nền/sương phía sau | Courtyard xuất lại có dư mép hoặc rail/rock endcap riêng; chưa có asset chính xác để che kín hoàn toàn |
| Cột/đèn/lan can module độc lập | Dùng các chi tiết đã nằm trong PNG công trình; cụm lanterns_props tùy chọn ẩn do trùng và bị cắt | PNG module riêng không bị cắt, pivot rõ |
| Aura đài độ kiếp, vòng đứng sau lưng, lôi vân | Đài tĩnh và điểm neo, chưa giả làm nghi thức hoạt động | Asset/FX tương ứng trong bước được yêu cầu sau |
| Nhân vật, nameplate, portrait và UI dữ liệu | 12 điểm neo sân + 1 điểm đài, không dựng hệ thống người chơi ở đây | Renderer/animation/binding state riêng ở bước sau |

Các placeholder chỉ hỗ trợ đọc bố cục, không tuyên bố concept hoàn chỉnh. Màu placeholder code không thay màu các PNG.

## Chất lượng và chi phí

| Mức | Hiệu ứng | Camera | Mục tiêu frame trong Play |
|---|---|---|---|
| Low | Nền/công trình/pháp trận base; tắt sương/glow/cánh hoa/hạt | Drift tắt | 30 |
| Medium | Thêm sương sau, glow và cánh hoa | Drift rất nhẹ | 60 |
| High | Thêm light particles và sương tiền cảnh mỏng | Drift rất nhẹ | 60 |

Đây là cấu hình trình diễn của SectScene, không ghi caidat.json và không sửa cấu hình gameplay/network. Target frame là đề xuất của Application.targetFrameRate; vSync/thiết bị vẫn có thể quyết định nhịp thực tế. Cả ba mức đều tắt HDR/MSAA/post-processing, không light/shadow/physics hoặc raytracing cho plane. Mỗi PNG dùng chung một texture/material; mesh mỗi layer được tạo một lần và hủy khi scene unload, không tạo texture/material mỗi frame. Hàng loạt vùng trong suốt của ảnh gốc vẫn có overdraw; Low loại bớt lớp phủ. Chưa có biến thể ảnh độ phân giải thấp.

Các số texture theo mức trong screenshot-report chỉ đếm texture đang được vẽ: Low 12 (~72 MiB RGBA), Medium 15 (~90 MiB), High 16 texture/17 plane (~96 MiB, sương dùng chung). Scene vẫn tham chiếu toàn bộ 17 PNG (~102 MiB RGBA), vì vậy tắt renderer không bảo đảm unload texture hoặc giảm GPU RAM về số đang vẽ. Chưa đo tổng GPU residency; framebuffer/font/URP cần thêm bộ nhớ.

## ScreenshotTest và nghiệm thu

Menu **Tu Tien LIVE → Stage 03 → Screenshot test (actual GPU)** mở SectScene sau khi kiểm tra không có scene dirty, render camera URP thật ra PNG. Dùng GPU; không nhận PASS từ -nographics. Ảnh ghi ở test-results/unity-stage03. Đã PASS 8 ảnh: 1080×1920 và 720×1280 ở ba mức và Medium ở thời điểm 20s/60s, trên NVIDIA Quadro M1000M / Direct3D11.

Điểm kiểm định: khung đúng 9:16; sân/đài/chính điện/cổng/HUD không cắt phần nội dung; nguồn đã cắt mép được ghi riêng; layer đúng thứ tự; vòng không méo công trình; màu PNG giữ nguyên; mây/sương/cánh hoa nhẹ; drift không lộ mép trời. Nền/khí quyển và đuôi thác được phép bleed qua mép, được gắn cờ riêng.

Kết quả cuối, ảnh và giới hạn được cập nhật trong PROGRESS.md và docs/unity-stage03/validation.json. captureRenderMs chỉ đo thời gian CPU gọi SubmitRenderRequest sau warmup, chưa gồm ReadPixels/GPU readback; không phải GPU frame time, FPS vận hành hay kiểm thử OBS. Unity Windows Player/OBS, tải người chơi và độ kiếp thực tế không được suy diễn từ screenshot Editor.

Bộ test SectScene bổ sung vào Unity EditMode cùng 24 test protocol cũ: import/hash/màu, bounds/drift hai độ phân giải, phối cảnh/sorting, quality, animation không tạo mesh mới, anchor/bounds fit, HUD và letterbox. Kết quả **35/35 PASS** sau sync GUID; npm trước/sau đều **91 PASS / 0 FAIL / 1 SKIP**. Gameplay DEMO smoke cũ PASS.

Menu **Tu Tien LIVE → Stage 03 → Play Mode smoke (5 seconds)** hoặc SectPlayModeTest.Run kiểm vòng đời/Update trong Play Mode. Lượt thực tế 5 giây PASS với nographics; không thay cho ảnh GPU hoặc FPS. UnityEditor.Search.SearchDatabase còn lỗi index startup ngoài stack scene, đã ghi PROGRESS.md.

Ảnh bàn giao: [Medium1080](unity-stage03/sect-medium-1080x1920-t0.png), [Medium720](unity-stage03/sect-medium-720x1280-t0.png), [High1080](unity-stage03/sect-high-1080x1920-t0.png), [Low720](unity-stage03/sect-low-720x1280-t0.png). [Báo cáo GPU](unity-stage03/screenshot-report.json), [tests](unity-stage03/final-editmode.xml), [Play Mode](unity-stage03/playmode-report.json).

## Giới hạn thao tác trong phiên

Project chính đang được mở trong Editor của người dùng. Lượt batch trùng project bị từ chối; import/render/test được chạy trên bản sao Assets/Packages/ProjectSettings trong test-results/unity-stage03/validation-project. Không đóng Editor hoặc bỏ scene người dùng. Asset/scene/material/meta đã kiểm tra được đồng bộ về project chính; không copy Library/cache hoặc thay package/backend từ bản sao.

Chỉ bước 03. Không triển khai battle, đổi WS, tính gameplay hoặc commit/push.

