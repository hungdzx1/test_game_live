Âm thanh được đặt trong
C:\Users\admin\Documents\CODE\TuTien\unity-client\Assets\Musics


Hãy tạo 1 gameobject và script để quản lý âm thanh (có thể kéo âm thanh vào script). Và dùng nó để điều khiển các âm thanh và hiệu ứng âm thanh dưới đây. Nhạc nền sẽ được loop.

Có thể điều chỉnh âm lượng phía server

Ánh xạ
BGM - nhạc nền cho game
Sfx_banphuc - hiệu ứng âm thanh khi có ban phúc
sfx_SDokiep - hiệu ứng âm thanh khi độ kiếp thành công
sfx_lv_up_TM - hiệu ứng âm thanh khi tông môn tăng cấp
sfx_fly - hiệu ứng âm thanh khi bay lên/xuống


### 2. Kịch bản giọng AI
1. Khi có người gia nhập tông môn: "Cung nghênh đạo hữu {tên} nhập môn!"
2. Khi người chơi độ kiếp thành công: "Chúc mừng đạo hữu {tên} độ kiếp thành công, tấn thăng {cảnh giới}"
3. Khi người chơi độ kiếp thất bại: "Thiên kiếp vô tình! Đạo hữu {tên} độ kiếp thất bại. Hãy dưỡng sức, chờ ngày tái chiến!"
4. Còn 10s thì đến màn boss: "Ma khí xâm thiên! Ma vương sắp xuất thế. Chư vị đạo hữu, mau chuẩn bị nghênh chiến!"
5. Khi có người donate ban phúc: "Cảm tạ đạo hữu {tên} đã ban ân trạch cho toàn tông môn."

Lưu ý: {tên} và {cảnh giới} là dữ liệu được backend thay thế trước khi gửi cho Piper.

LOGIC
Tôi muốn tối ưu tốc độ phản hồi của hệ thống AI Voice trong game Tu Tiên LIVE bằng cách **chia lời thoại thành các đoạn âm thanh cố định và các đoạn chứa dữ liệu động**. Thay vì sử dụng Piper TTS để render lại toàn bộ câu mỗi khi có sự kiện, hệ thống sẽ render trước và lưu cache những đoạn cố định. Ví dụ, với câu "Cung nghênh đạo hữu {tên} nhập môn!", hệ thống sẽ tạo sẵn A1 = "Cung nghênh đạo hữu" và A3 = "nhập môn!", còn A2 = "{tên}" chỉ được render khi nhận thông tin người chơi. Khi sự kiện xảy ra, Unity sẽ phát A1 ngay lập tức, đồng thời Piper TTS render A2 trong lúc A1 đang phát. Sau đó, hệ thống phát nối tiếp A2 và A3 để tạo thành câu hoàn chỉnh, đảm bảo âm thanh liền mạch và tự nhiên nhất có thể. Ngoài ra, **các đoạn âm thanh động đã được render cũng sẽ được lưu cache** để tái sử dụng trong những lần tương tác tiếp theo. Mục tiêu của giải pháp là giảm tối đa thời gian chờ tổng hợp âm thanh, hạn chế việc render lặp lại, tiết kiệm tài nguyên CPU/GPU và giúp giọng Thiên Đạo bắt đầu phản hồi trong khoảng 1–2 giây sau khi backend nhận được sự kiện TikTok LIVE, ngay cả khi có nhiều người tương tác liên tục.
Cache giọng Thiên Đạo
├── co_dinh/
│   ├── cung_nghenh_dao_huu.wav
│   ├── nhap_mon.wav
│   ├── do_kiep_thanh_cong.wav
│   └── thien_dao_ban_phuc.wav
│
└── ten_nguoi_choi/
    ├── tt_12345.wav
    ├── tt_67890.wav
    └── tt_11223.wav

---

### 2.1. Phương án điều chỉnh phần 2 — đã duyệt (09/11/2026)

**Trạng thái:** Người dùng đã duyệt toàn bộ phương án và yêu cầu triển khai, gồm các thông số ở dưới. Phần 2 phía trên giữ làm lịch sử; mục 2.1 thay thế những nội dung tương ứng. Mã runtime và kiểm thử được triển khai theo mục này; trạng thái kiểm chứng cụ thể xem `PROGRESS.md` và `docs/Tailieu_output/ai-voice/README.md`. Không suy chất lượng nghe hoặc độ trễ LIVE từ việc tạo được WAV.

#### A. Nhập môn đông người: chỉ đọc tên người đầu tiên

**Yêu cầu người dùng đã xác nhận:** Nếu nhiều người nhập môn trong cùng một đợt, chỉ đọc tên người đầu tiên cùng số người còn lại, không đọc lần lượt tất cả tên.

- Một người: “Chào mừng đạo hữu {tên} gia nhập tông môn!”
- Nhiều người: “Chào mừng đạo hữu {tên người đầu tiên} cùng {số người khác} người khác gia nhập tông môn!”
- Ví dụ: A và 10 người khác, tổng cộng 11 người, thì đọc: “Chào mừng đạo hữu A cùng 10 người khác gia nhập tông môn!”
- `{số người khác} = tổng số người hợp lệ trong đợt − 1`; không tính người đầu tiên hai lần.
- Người đầu tiên là người có sự kiện nhập môn hợp lệ được backend tiếp nhận trước nhất trong đợt. Không chọn theo tên, mức donate hoặc thứ tự hoàn tất TTS.
- Chỉ tính người nhập môn lần đầu, mỗi userId một lần; reconnect, snapshot hoặc sự kiện trùng không tăng số lượng.
- Sau câu chào nhóm, không xếp thêm câu chào riêng cho những người đã nằm trong nhóm. Mỗi người vẫn gia nhập và nhận xử lý gameplay bình thường.

**Cách gom đợt đã duyệt:** Mở cửa sổ 1 giây tính từ người đầu tiên. Có từ 2 người hợp lệ trong cửa sổ thì dùng câu nhóm; có 1 người thì dùng câu đơn. Cửa sổ không kéo dài mỗi khi có người mới để tránh chờ vô hạn. Có thể tạo trước giọng tên người đầu ngay trong thời gian gom.

Khi hết cửa sổ, chốt tên và số lượng thành một thông báo. Người đến sau thuộc đợt tiếp theo; không sửa số lượng khi câu đã bắt đầu đọc. Thời gian gom được tính vào độ trễ tổng, không cộng ngoài mục tiêu phản hồi.

#### B. Giữ Piper hoạt động và model nạp sẵn

- Dùng tiến trình Piper thường trực, nạp model một lần khi khởi động hệ thống giọng đọc; không mở Python và nạp lại model cho từng sự kiện.
- Tổng hợp giọng chạy ngoài luồng xử lý gameplay Node.js; tác vụ TTS chậm hoặc lỗi không được chặn nhận sự kiện, tính thưởng hoặc lưu dữ liệu game.
- Ban đầu dùng một worker tổng hợp với hàng đợi hữu hạn; chỉ tăng số worker sau khi đo CPU/RAM và tốc độ thực trên máy đang chạy.

#### C. Điều kiện phát và phương án khi tên chưa sẵn sàng

- Bỏ cam kết “Unity phát A1 ngay lập tức” trong mọi trường hợp. Bản đầu đề xuất chỉ bắt đầu câu khi các đoạn cần thiết đã tới Unity và sẵn sàng phát.
- Có thể tối ưu phát A1 trong lúc tạo A2 sau khi đo thực tế chứng minh đủ thời gian dự phòng; thời gian tạo phải bao gồm cả hàng đợi TTS, truyền và nạp clip.
- Đề xuất thời hạn chờ tối đa 2 giây kể từ lúc backend nhận sự kiện đầu của thông báo. Nếu phần động chưa sẵn sàng thì dùng câu dự phòng tạo sẵn và vẫn hiện tên đầy đủ bằng chữ. Thời hạn này không bảo đảm phát ngay nếu kênh lời thoại đang bận.
- Câu dự phòng nhập môn: “Chào mừng các đạo hữu gia nhập tông môn!”; thành công: “Chúc mừng đạo hữu độ kiếp thành công!”; thất bại: “Thiên kiếp vô tình! Đạo hữu hãy dưỡng sức, chờ ngày tái chiến!”; donate: “Cảm tạ đạo hữu đã ban ân trạch cho toàn tông môn!”
- Không phát một đoạn mở đầu rồi để im lặng chờ tên. Khi đã dùng câu dự phòng, không đọc lại cùng sự kiện khi TTS hoàn tất muộn; kết quả tạo muộn chỉ bổ sung cache.

#### D. Tạo sẵn đoạn cố định, cảnh giới và cách đọc số

- Tạo sẵn các đoạn cố định của cả 5 kịch bản, câu cảnh báo boss hoàn chỉnh và những câu dự phòng.
- Danh sách cảnh giới hữu hạn: tạo sẵn phần đuôi theo từng cảnh giới, ví dụ “độ kiếp thành công, tấn thăng Trúc Cơ!”. Backend chọn đúng cảnh giới từ kết quả đã xác nhận.
- Câu nhập môn nhóm có các phần: “Chào mừng đạo hữu” → tên → “cùng” → số người khác → “người khác gia nhập tông môn!”. Không tổng hợp tên của những người còn lại chỉ để phục vụ câu này.
- Đề xuất cache sẵn cách đọc số từ 1 đến 100; số lớn hơn được tổng hợp và cache theo nội dung, không tự ý làm tròn số lượng. Nếu chưa sẵn sàng đúng hạn thì dùng câu dự phòng.
- Ưu tiên cắt ở cụm từ tự nhiên, giảm số điểm nối. Các đoạn dùng cùng model, cấu hình giọng và định dạng PCM; cân âm lượng, xử lý khoảng lặng mà không cắt mất âm đầu/cuối.
- Unity lên lịch nối clip theo đồng hồ âm thanh (AudioSettings.dspTime/AudioSource.PlayScheduled), không đợi Update phát hiện đoạn trước đã hết. Nghe thử vẫn là điều kiện bắt buộc để đánh giá ngữ điệu.

#### E. Cache theo nội dung và cấu hình giọng

- Khóa cache gồm nội dung đọc đã chuẩn hóa, phiên bản model/giọng và các thiết lập ảnh hưởng âm thanh; dùng hash làm tên file, không ghép trực tiếp tên TikTok vào đường dẫn.
- Không dùng riêng userId làm khóa: cùng người đổi tên phải lấy âm thanh tương ứng tên mới. UserId có thể dùng để tra liên kết tới nội dung hiện tại.
- Chuẩn hóa tên cho lời đọc: giữ dấu tiếng Việt, bỏ ký tự điều khiển/emoji không đọc được, thu gọn khoảng trắng; đề xuất giới hạn 40 ký tự cho tên đọc. Tên hiển thị vẫn theo hệ thống hiện có. Tên sau xử lý rỗng hoặc model không đọc được thì dùng câu dự phòng.
- Các yêu cầu trùng nội dung đang tổng hợp dùng chung một tác vụ. Không ghi đè cache tốt bằng WAV rỗng hoặc kết quả lỗi.
- Cache cố định giữ theo phiên bản; cache động có giới hạn và dọn mục ít dùng. Mức khởi đầu đề xuất: tối đa 200 MB trên đĩa, 32 clip động trong RAM; cần đo rồi điều chỉnh.
- Cache TTS nằm riêng, không ghi file âm thanh hoặc dữ liệu cache vào player save; không phát lại lời thoại chỉ vì cache còn tồn tại.

#### F. Hàng đợi lời thoại và quá tải

- Chỉ một câu Thiên Đạo được phát tại một thời điểm; không để nhiều tên/câu chồng lên nhau. BGM/SFX vẫn dùng kênh riêng và tuân thủ mute/âm lượng hiện có; đề xuất giảm nhẹ BGM trong lúc đọc.
- Thứ tự ưu tiên đề xuất: cảnh báo boss → cảm ơn donate Ban Phúc → kết quả độ kiếp → chào nhập môn. Cùng mức thì theo thứ tự backend tiếp nhận.
- Đề xuất tối đa 20 thông báo chờ, hết hạn sau 15 giây kể từ sự kiện đầu của thông báo. Khi đầy, bỏ thông báo ưu tiên thấp nhất đang chờ; cùng mức bỏ thông báo cũ nhất. Chỉ bỏ lời đọc, không bỏ xử lý gameplay hoặc thông báo chữ.
- Cảnh báo boss có hạn riêng: phải kết thúc trước khi chuyển sang chiến đấu. Có thể ngắt câu ưu tiên thấp hơn để phát cảnh báo; câu đã ngắt không đọc lại. Nếu không còn đủ thời gian phát cảnh báo đầy đủ thì chỉ hiện chữ/SFX cảnh báo hiện có, không đọc câu “sắp xuất thế” sau khi đã vào trận.
- Chống trùng theo eventId cùng phiên; mỗi đợt nhập môn có mã thông báo riêng. Reconnect không đọc lại lịch sử; đổi phiên/DEMO–LIVE hoặc tắt giọng đọc thì dọn hàng chờ và bỏ kết quả TTS cũ tới muộn.
- Pause/stopped tạm dừng lời đọc đang phát, không bắt đầu câu mới; câu chờ tiếp tục chịu thời hạn để tránh dồn lời cũ khi chạy lại. Quy tắc này đã được duyệt cùng toàn bộ phương án.

#### G. Nguồn kích hoạt và phân công backend/Unity

- Nhập môn: dựa trên sự kiện gia nhập lần đầu đã được backend xác nhận, không dựa trên việc Unity vừa tạo nhân vật từ snapshot.
- Độ kiếp: chỉ đọc sau kết quả backend xác nhận. Thành công đọc cảnh giới mới; không suy kết quả từ FX hoặc tính lại xác suất ở Unity.
- Ban Phúc: cảm ơn đúng donor khi Ban Phúc thực sự kích hoạt; không cảm ơn chỉ vì vật phẩm được cấp vào túi. Ban Phúc từ boss/cấp tông môn không gán tên donor. Không gộp nhiều donor thành lời cảm ơn một người.
- Cảnh báo trước boss 10 giây: kích hoạt một lần mỗi chu kỳ khi đồng hồ server đi qua mốc 10 giây còn lại của pha tu luyện. Nếu hàng chờ làm câu bị muộn thì áp dụng hạn phát ở mục F. Không đọc bù khi reconnect đã qua mốc.
- Câu cảnh báo 10 giây là báo trước chuyển pha; TB02 3 giây là intro hiện hữu trước mỗi boss. Không cộng thêm thời gian, đổi nhịp gameplay hoặc phát lại câu 10 giây cho từng boss. Cần xác định/test riêng đường sự kiện backend khi triển khai.
- Thay diễn đạt dòng lưu ý phần 2 bằng: “Backend chọn kịch bản, xác nhận dữ liệu tên/cảnh giới/số lượng, chuẩn hóa nội dung và tra cache; chỉ gửi đoạn chưa có cache cho Piper. Unity nhận lệnh trình diễn và phát âm thanh, không quyết định kết quả gameplay.”
- Tích hợp Piper/Unity đã được người dùng cho phép triển khai. Tiện ích `synthesize.py`/`doc-thu.bat` giữ làm công cụ đọc thử riêng; runtime dùng worker thường trực. Các bổ sung API/WebSocket được mô tả và kiểm thử riêng, giữ tương thích backend và client hiện hữu.

#### H. Mục tiêu và điều kiện kiểm chứng

- Mốc 1–2 giây là mục tiêu bắt đầu phát khi hệ thống sẵn sàng, kênh lời thoại rảnh và tải trong khả năng đã đo; không cam kết mọi sự kiện đều được đọc trong 1–2 giây khi quá tải.
- Đo từ lúc backend nhận sự kiện hợp lệ tới âm thanh thực sự bắt đầu tại Unity; với câu nhập môn nhóm tính từ người đầu tiên. Tách thời gian gom nhóm, chờ hàng đợi, tạo TTS, truyền/nạp clip và phát.
- Kiểm tra riêng cache có sẵn/chưa có, model vừa khởi động/đã nạp, tên dài/emoji/đổi tên, sự kiện trùng, Piper lỗi và kết quả tới muộn.
- Kiểm tra nhập môn: 1 người đọc câu đơn; A + 10 người đọc đúng “A cùng 10 người khác”; sự kiện lặp không tăng đếm; người ngoài cửa sổ vào đợt mới; không đọc lại từng người sau câu nhóm.
- Đo khi 10/50/100 người nhập môn dồn đợt và khi xen donate/độ kiếp/cảnh báo boss; kiểm tra hàng chờ hữu hạn, lời không chồng, câu hết hạn không phát và gameplay vẫn chạy.
- Nghe thực tế điểm nối tên/số/cảnh giới; kiểm tra mute/âm lượng, pause/reconnect/đổi phiên, Unity Editor/Play Mode, build Windows, OBS và LIVE thật thành các kết quả riêng.
- Các từ “đề xuất” trong bản lịch sử mục 2.1 ghi lại lựa chọn đã được duyệt. Các giá trị áp dụng: gom 1 giây, thời hạn cá nhân hóa 2 giây, tối đa 20 thông báo chờ/15 giây, cache đĩa 200 MB và 32 clip động trong RAM. Kiểm chứng runtime, build, OBS/LIVE và chất lượng nghe được ghi riêng trong báo cáo, không tự coi tất cả là PASS.
