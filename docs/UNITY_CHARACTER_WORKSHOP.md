# Xưởng nhân vật và UI cho người quen Unity 2D

## Mở bản mẫu

Mở `unity-client/Assets/Scenes/CharacterWorkshop.unity`, hoặc menu **Tu Tien LIVE → Characters → Open Character Workshop**. Đây là bản sao môi trường để dựng thử; NetworkClient, CharacterManager và footer nhận dữ liệu server đều tắt trong scene này. Scene `SectScene_Editable.unity` và kết nối server của nó không bị sửa.

Chọn **SectScene/04_Characters/Character Workshop - select me**:

1. Đặt **Character Count** (0–100).
2. Bấm **1 - Resize character list**. Mở từng phần tử trong **Characters**, nhập Display Name, Subtitle, Aura Index và Preview Pose (`idle`, `fly`, `attack`, `meditate`, `celebrate`...).
3. Kéo Sprite vào Idle và các ô tương ứng. Idle bắt buộc; các pose bỏ trống dùng Idle. Tài nguyên mẫu có sẵn ở `Assets/Art/Characters/Character_1/`. Nếu ảnh mới chưa kéo được: chọn PNG, đặt Texture Type = Sprite (2D and UI), Sprite Mode = Single, Alpha Is Transparency, rồi Apply. Chọn PPU nhất quán và chỉnh pivot chân; ảnh khác padding/pivot có thể nhảy khi đổi pose. Bộ thử không tự sửa ảnh.
4. Bấm **2 - Generate / Apply characters**. Các GameObject nằm trong **Preview Characters**. Đã tạo sẵn ba người bằng sprite hiện có.
5. Nhấn Play để xem pose và chuyển động nhẹ. Sửa Preview Pose để đổi tư thế; đây là ảnh pose đơn, không phải animation nhiều frame.
6. Dừng Play, chỉnh Transform và Ctrl+S để lưu. Thay đổi trong Play Mode không được Unity lưu khi Stop. Nút Generate tạo lại các instance của xưởng, nên những chỉnh sửa trực tiếp trên instance sẽ mất khi bấm lại; lưu thành prefab riêng nếu muốn giữ lâu dài. Có Undo cho thao tác tạo/xóa. Nút Clear chỉ xóa các instance đã đăng ký với xưởng.

Giảm số lượng không xóa thông tin sprite đã nhập ở cuối danh sách; tăng trở lại sẽ dùng chúng. Chỉ **Character Count** phần tử đầu được tạo. 12 người đầu dùng các Seat hiện có; phần dư là lưới thử, có thể nằm ngoài camera. Đây không phải giới hạn hay quy tắc hiển thị roster server.

## Nhân vật mẫu

Prefab: **Assets/SceneAuthoring/Prefabs/CharacterSample.prefab**. Là variant kế thừa CharacterPrefab hiện có; không thay prefab đang chạy server.

| Đối tượng/component | Cách chỉnh |
|---|---|
| Root / CharacterView | Các reference Body/pose, aura, nameLabel, burst; giữ reference khi đổi hình dáng |
| Body / SpriteRenderer / CharacterPoseController | Kéo bảy Sprite, chỉnh Transform kích thước đồng đều; các ô pose là sprite đơn |
| Nameplate Canvas | Canvas World Space. Đổi vị trí bằng Transform; RectTransform 200×56, scale 0.01 để đổi pixel UI sang đơn vị thế giới |
| Nameplate Canvas / Name Card | Image nền thẻ; đổi màu, alpha, RectTransform |
| Nameplate Canvas / Name Text | TextMeshProUGUI; đổi font size, alignment, Auto Size, RectTransform. Nội dung tên được bộ thử hoặc server cập nhật |
| Aura / Shadow / Burst | Giữ các thành phần từ prefab gốc; aura và hiệu ứng chuyển động do controller trình diễn; chỉnh hình dạng gốc trong Inspector |

TextMeshPro 3D cũ được giữ inactive trong variant mẫu. Không cần EventSystem/GraphicRaycaster cho thẻ tên không nhận click. Canvas của thẻ dùng Sorting Layer SectCharacters, Order 30; nếu thẻ bị che, kiểm tra thứ tự vẽ và mặt phẳng Z. Tắt Rich Text để tên người dùng không bị hiểu như markup.

Khi muốn dùng cho server: gán **CharacterSample.prefab** (hoặc prefab variant bạn lưu từ mẫu) vào `04_Characters → CharacterManager → Character Prefab` trong **SectScene_Editable**, giữ các reference Network/Seats/Tribulation/Director. Không bật CharacterWorkshop để thay CharacterManager. Server vẫn quyết định userId, tên, cảnh giới, pose và sự kiện. Hiện server dùng một prefab chung; việc chọn nhiều bộ ngoại hình khác nhau theo từng userId chưa được triển khai. Xưởng chưa xuất một bảng ánh xạ ngoại hình lên server và không tạo người chơi trong dữ liệu backend.

## Canvas dùng được trong SectScene_Editable không?

Có. Sprite/plane tạo thế giới 2.5D không ngăn dùng UI Canvas như game 2D. Trục X/Y vẫn để di chuyển ngang/dọc; Z và Sorting Layer quyết định thứ tự trước/sau. Camera orthographic nên đối tượng không thu nhỏ theo khoảng cách như perspective.

| Nhóm UI hiện tại | Cách dùng |
|---|---|
| `07_UI` | GameObject nhóm, **không phải Canvas**. Header/footer/title/sect name hiện dùng TextMesh + MeshRenderer trong thế giới, chỉnh Transform, Character Size và sorting trực tiếp. SectTextLayout.autoFit đã tắt để không tự reset kích thước |
| `07_UI/RosterHUD` | CharacterRosterHud ghi nội dung vào TextMesh: tổng người từ snapshot và số hiện hình. Không sửa text bằng tay để thay số người thật |
| Thẻ tên nhân vật production | TextMeshPro 3D trong prefab hiện có; CharacterView cập nhật tên/cảnh giới qua TMP_Text |
| Thẻ tên nhân vật mẫu | Canvas World Space + Image + TextMeshProUGUI, cũng nối vào CharacterView.nameLabel nên tương thích cập nhật tên hiện tại |

Để làm HUD/footer mới theo cách quen với game 2D: tạo **UI → Canvas** dưới `07_UI`, chọn **Screen Space - Overlay**, Canvas Scaler = **Scale With Screen Size**, Reference Resolution = **1080×1920**, Match = **0.5**. Anchor top cho header, bottom cho footer, dùng RectTransform/Pivot thay vị trí thế giới. Canvas Overlay luôn ở trên thế giới; căn safe area/letterbox nếu phát ở tỷ lệ khác 9:16. **Screen Space - Camera** là lựa chọn khác khi cần UI nằm trong viewport camera, gán MainCamera và Plane Distance phù hợp.

Text mới nên dùng TextMeshProUGUI. `CharacterView.nameLabel` nhận cả TMP 3D và TMP UI; nhưng **CharacterRosterHud.label hiện là TextMesh**, không thể kéo TMP UI vào ô đó. Chuyển footer thật sang Canvas cần adapter/binder TMP riêng và tắt TextMesh cũ để tránh trùng. Lượt này không tự thay toàn bộ HUD hoặc sửa dữ liệu server.

Các con số/pose trong xưởng là tham số trình diễn để dựng mẫu, không phải thuật toán game. Để kiểm tra dữ liệu thật, quay lại SectScene_Editable, chạy Node bằng `npm start` và tạo người chơi qua dashboard DEMO.
