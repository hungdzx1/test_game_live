# Piper tiếng Việt offline — cài riêng cho TuTienLive

Vị trí: `C:\Users\admin\Documents\CODE\TuTien\tools\tts\piper\`.

- `runtime/`: Python portable3.13.17, Piper1.8.0, ONNX Runtime và các thư viện riêng. Không thay Python hệ thống/PATH, không cần activate venv.
- `models/`: giọng nữ cũ `vi_VN-vais1000-medium`, giọng nam `vi_VN-tramvang-medium` và cấu hình; model card giữ kèm từng giọng.
- `voice-settings.json`: mặc định `"voice": "male"` (Trầm Vang). Đổi thành `"female"` để quay lại giọng cũ; không phải tải lại model đã cài.
- `noi-dung-doc-thu.txt`: **bạn sửa nội dung đọc ở đây**, lưu UTF-8. Đây là nội dung thử, chưa phải bảng kịch bản của game.
- `doc-thu.bat`: nháy đúp để tạo lại WAV và phát bằng Windows. Có thể sửa file nội dung rồi chạy lại; không cần Internet khi đã cài đủ.
- `output/thien-dao-doc-thu.wav`: âm thanh được tạo trên máy; báo cáo kỹ thuật cùng tên `.report.json`.
- `installation.json`: phiên bản, gói phụ thuộc, nguồn tải và SHA256 của model tại lúc cài.

## Chạy từ PowerShell

Tại thư mục gốc dự án:

```powershell
# Chỉ tạo file, không tự phát loa:
powershell -NoProfile -ExecutionPolicy Bypass -File tools/tts/piper/doc-thu.ps1

# Tạo và phát âm thanh:
powershell -NoProfile -ExecutionPolicy Bypass -File tools/tts/piper/doc-thu.ps1 -Play

# Chọn riêng một lần, không đổi file cài đặt:
powershell -NoProfile -ExecutionPolicy Bypass -File tools/tts/piper/doc-thu.ps1 -Voice female -Play

# Đọc một file UTF-8 khác:
powershell -NoProfile -ExecutionPolicy Bypass -File tools/tts/piper/doc-thu.ps1 -TextFile "C:\duong-dan\cau-thoai.txt" -Play
```

Giới hạn tiện ích thử:1–2.000 ký tự/lần, CPU, một giọng cho mỗi lần đọc. Không cần CUDA/GPU hoặc khóa API. Chạy kiểm tra từ thư mục khác cũng được vì runtime và model được xác định theo vị trí script. Mỗi lần kiểm tra bảng âm trước khi tạo WAV; thiếu âm sẽ báo lỗi thay vì âm thầm bỏ âm.

Giọng nam Trầm Vang được nhà cung cấp mô tả là giọng nam miền Bắc trầm/vang, tạo tổng hợp bằng Voice Design rồi fine-tune Piper; không phải bản sao giọng của một người cụ thể. Bản nghe thử để bạn đánh giá, không phải xác nhận chất lượng nghe đã đạt yêu cầu. Giọng nữ trước đó giữ bản âm thanh tại `output/thien-dao-giong-cu.wav`; bản nam tại `output/thien-dao-giong-nam.wav`.

## Kịch bản Thiên Đạo

Bạn có thể tự viết câu thoại; không cần tự lập trình cơ chế đọc. Khi tích hợp vào Unity, cần thêm bảng mẫu câu theo sự kiện (ví dụ bắt đầu/thành công/thất bại độ kiếp), thay biến `{ten}`, `{canhGioi}` bằng dữ liệu server và xếp hàng phát âm. Phần nối sự kiện, cấu hình câu thoại và AudioSource cho lời đọc **chưa triển khai trong lần cài này**. Các nút TTS trên web hiện vẫn là hệ thống cũ.

Cài này chỉ chuẩn bị bộ đọc và tiện ích nghe thử offline; Unity chưa tự đọc khi xảy ra sự kiện. Chưa điều chỉnh hiệu ứng giọng trầm/vang của Thiên Đạo hoặc đánh giá chất lượng nghe thực tế.

## Cài lại và nguồn

`scripts/setup-offline-tts.ps1` tải từ Python.org, PyPI và kho giọng Piper trên Hugging Face. Cài lại cần Internet và lệnh `python -m pip` đang có để đưa gói vào thư mục riêng; sử dụng hằng ngày chỉ cần runtime portable đã cài. Đừng chép nguyên runtime này vào Unity Assets vì Unity không cần import các thư viện Python/model như asset.

- [Python portable](https://www.python.org/downloads/release/python-31317/).
- [Piper1.8.0 — GPL-3.0-or-later](https://pypi.org/project/piper-tts/1.8.0/), [hướng dẫn API](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/API_PYTHON.md).
- [Model giọng Việt](https://huggingface.co/rhasspy/piper-voices/tree/main/vi/vi_VN/vais1000/medium), [model card và nguồn dữ liệu CC BY4.0](https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD).
- [Model Trầm Vang và model card](https://huggingface.co/vnhellboy/vietnamese-piper-voices), revision `df2a53e0b5c8039d17e642cc8d80fa03d59374b7`; giữ các ghi chú nguồn và giới hạn sử dụng của tác giả trong `models/vi_VN-tramvang-medium/MODEL_CARD.md`.

Các thư mục runtime/downloads/models/output được loại khỏi Git. Chỉ tiện ích/hướng dẫn/nội dung đọc thử được quản lý như mã nguồn; không tự commit hoặc đụng dữ liệu người chơi.
