# Web Quản Trò Ma Sói

Web **tự đứng ra làm quản trò** — không cần một người trong bàn cầm bảng điều
khiển chung. Web tự động: chia phòng, chia vai ngẫu nhiên, lần lượt gọi từng
vai đặc biệt dậy vào ban đêm theo đúng thứ tự cổ điển (Bảo Vệ → Sói → Tiên Tri
→ Phù Thủy), tự tổng kết đêm, tự thu thập phiếu bầu ban ngày và tự xác định
phe chiến thắng.

Mỗi người chơi chỉ nhìn vào điện thoại của chính mình — không ai thấy được
thao tác của người khác, kể cả người tạo phòng (người tạo phòng chỉ là người
chơi đầu tiên vào bàn, không có đặc quyền hay màn hình riêng nào).

## Cài đặt & chạy thử

```bash
pip install -r requirements.txt
python app.py
```

Mặc định server chạy tại `http://127.0.0.1:5000`.

- Máy tính/điện thoại của mọi người cần **cùng một mạng Wi-Fi** (hoặc deploy
  lên hosting để chơi từ xa — xem mục bên dưới).
- Bất kỳ ai cũng có thể mở `http://<IP-máy-chủ>:5000/` để **tạo phòng** hoặc
  **vào phòng** bằng mã 4 số.
- Khi đủ tối thiểu 5 người, **bất kỳ ai trong phòng** cũng có thể bấm "Bắt đầu
  trò chơi".

## Cách một ván diễn ra (không cần người điều hành)

0. Ngay sau khi đủ người bấm "Bắt đầu", web chia vai bí mật rồi mở phiên
   **bầu Trưởng Làng**: cả làng (ai cũng được đề cử, kể cả tự bầu chính mình)
   có 45 giây để bỏ phiếu. Trưởng Làng được bầu sẽ có **lá phiếu tính gấp đôi**
   trong mọi lần biểu quyết treo cổ ban ngày sau này. Kết quả bầu cử được công
   bố và giữ trên màn hình 5 giây trước khi vào đêm đầu tiên.
1. Mỗi đêm, web tự tính danh sách vai đặc biệt còn sống theo thứ tự:
   **Bảo Vệ → Sói → Tiên Tri → Phù Thủy** (vai nào không tồn tại trong ván —
   ví dụ bàn 5-6 người không có Bảo Vệ — tự động bị bỏ qua).
2. Trước khi gọi một vai dậy, web dừng 3 giây và báo "Tiếp theo: <vai>" cho
   mọi người — giống một MC thật hít thở giữa các lượt gọi — rồi mới mở nút
   hành động cho đúng người giữ vai đó. Người khác chỉ thấy "đang chờ...".
3. Sau khi hành động (hoặc bấm bỏ qua), web tự chuyển ngay sang vai kế tiếp.
   Nếu không ai thao tác trong 30 giây, web cũng tự động chuyển tiếp để
   tránh treo ván.
4. Hết vai cuối cùng, web tổng kết đêm và **giữ màn hình công bố nạn nhân
   trong 5 giây** để mọi người kịp đọc, rồi mới mở phiên bỏ phiếu ban ngày.
5. Ban ngày, mọi người còn sống tự bỏ phiếu (hoặc bỏ phiếu trắng) trong 90
   giây — phiếu của Trưởng Làng (nếu còn sống) tính gấp đôi. Đủ phiếu hoặc
   hết giờ, web tự tổng hợp, **giữ màn hình công bố người bị treo cổ trong 5
   giây**, rồi mới chuyển sang đêm tiếp theo ("đi ngủ").
6. Web tự kiểm tra thắng/thua sau mỗi đêm và mỗi lần treo cổ; khi có phe
   thắng, tất cả được xem bảng kết quả VICTORY/LOSE và vai trò thật của mọi
   người (kèm chú thích ai từng là Trưởng Làng).

Có thể chỉnh các mốc thời gian này ở đầu `app.py` (`ELECTION_SECONDS`,
`NIGHT_SUBPHASE_SECONDS`, `DAY_VOTE_SECONDS`, `NIGHT_PAUSE_SECONDS`,
`REVEAL_SECONDS`).

## Cấu trúc dự án

```
app.py                  # Toàn bộ backend Flask + logic trò chơi (tự động hoàn toàn)
templates/
  index.html            # Trang chủ: tạo phòng / vào phòng
  room.html             # Trang chơi duy nhất — dùng chung cho mọi người chơi
static/
  css/style.css         # Giao diện
  js/common.js          # Tiện ích dùng chung, mô tả vai trò, avatar
  js/room.js            # Toàn bộ logic trang chơi: sảnh chờ, lượt đêm, bỏ phiếu, kết quả
```

## Danh sách API

| Giai đoạn | API | Method | Endpoint |
|---|---|---|---|
| Khởi tạo | Tạo phòng | POST | `/api/create-room` |
| Khởi tạo | Tham gia phòng | POST | `/api/join-room` |
| Khởi tạo | Bắt đầu game (ai cũng bấm được) | POST | `/api/start-game` |
| Ban đêm | Bảo Vệ che chở (đúng lượt) | POST | `/api/guard-action` |
| Ban đêm | Ma Sói cắn (đúng lượt) | POST | `/api/wolf-action` |
| Ban đêm | Tiên Tri soi (đúng lượt) | POST | `/api/seer-action` |
| Ban đêm | Tiên Tri bỏ qua lượt | POST | `/api/seer-pass` |
| Ban đêm | Phù Thủy dùng thuốc (đúng lượt) | POST | `/api/witch-action` |
| Ban đêm | Phù Thủy báo xong lượt | POST | `/api/witch-done` |
| Ban ngày | Bỏ phiếu (từng người tự bỏ) | POST | `/api/day-vote` |
| Kết thúc | Kiểm tra thắng thua + bảng kết quả | POST | `/api/check-win` |
| Hỗ trợ | Trạng thái phòng (public) | GET | `/api/room-state` |
| Hỗ trợ | Vai trò + lượt của riêng tôi | GET | `/api/my-role` |

Việc tổng kết đêm và tổng kết ngày giờ diễn ra **tự động bên trong** các hàm
`resolve_night()` / `resolve_day()` khi hết lượt hoặc hết giờ — không còn API
"tổng kết"/"treo cổ" nào cần người bấm thủ công như bản trước.

## Cách chia vai theo số người

Áp dụng đúng bảng thiết lập đã thiết kế: 5-6 người (Sói, Tiên Tri, Phù Thủy,
Dân Làng), 8-9, 10-11, 12-13, 14, 15, 16, 17, 18 người với các vai bổ sung
(Bảo Vệ, Thợ Săn, Thần Tình Yêu, Trưởng Làng, Thổi Sáo, Ăn Trộm, Phản Bội...).
Trên 18 người, hệ thống tự mở rộng thêm Sói và Dân Làng theo tỉ lệ hợp lý.
7 người (không có trong bảng gốc) được nội suy: Sói, Tiên Tri, Bảo Vệ, Phù Thủy
+ Dân Làng.

## Những gì đã sửa/thêm theo yêu cầu mới nhất

- **Thêm bầu Trưởng Làng**: mở ngay sau khi chia vai, trước đêm đầu tiên;
  người được bầu có lá phiếu tính gấp đôi khi biểu quyết treo cổ ban ngày.
- **Thêm khoảng lặng giữa các hành động**: 3 giây "chuẩn bị" trước khi gọi
  mỗi vai dậy ban đêm, và 5 giây "công bố kết quả" sau khi tổng kết đêm cũng
  như sau khi treo cổ ban ngày — đúng như yêu cầu "hiện tên người bị treo cổ
  5 giây rồi mới đến lúc đi ngủ".

- **Bỏ hoàn toàn vai trò "quản trò"**: không còn ai cầm bảng điều khiển chung.
  Trước đây người tạo phòng vừa là "quản trò" vừa có thể trúng vai Ma Sói,
  khiến việc họ thao tác trên màn hình chung bị lộ vai. Giờ mỗi người chỉ có
  đúng một màn hình cá nhân, không ai có đặc quyền hay thao tác thay người
  khác.
- **Thêm đúng thứ tự gọi dậy ban đêm**: Bảo Vệ → Sói → Tiên Tri → Phù Thủy,
  từng vai chỉ thấy nút hành động khi đến đúng lượt của mình.
- **Tự động hoàn toàn**: tổng kết đêm, thu phiếu và treo cổ ban ngày, kiểm
  tra thắng/thua đều do server tự thực hiện (có cơ chế tự chuyển lượt sau 30s
  và tự chốt phiếu bầu sau 90s nếu chưa đủ người thao tác).
- Vẫn giữ các lỗi đã sửa ở bản trước: Phù Thủy không còn dùng chung biến với
  Bảo Vệ, mỗi bình thuốc chỉ dùng được một lần trong cả ván, mỗi hành động
  đêm đều xác thực đúng vai trò và còn sống.

## Giới hạn hiện tại / hướng mở rộng

Các vai trò đặc biệt khác (Thợ Săn bắn trả, Thần Tình Yêu ghép đôi, Trưởng
Làng 2 phiếu, Thổi Sáo, Ăn Trộm, Phản Bội, Cô Bé...) vẫn được **chia vai**
đúng số lượng cho các bàn lớn, nhưng hành động riêng của họ chưa có API tự
động — người giữ vai này tạm thời chỉ tham gia bỏ phiếu ban ngày như dân
thường, chưa có màn hình thao tác đêm riêng.

Dữ liệu phòng lưu trong RAM, mất khi tắt server — phù hợp cho một buổi chơi.
Muốn lưu nhiều bàn cùng lúc lâu dài hơn thì có thể thay bằng Redis/SQLite.

## Chơi online với bạn ở xa (deploy lên hosting)

Vì dữ liệu phòng (`rooms`) chỉ lưu trong RAM của **một tiến trình**, khi deploy
bạn phải chạy **đúng 1 instance / 1 worker**. Nếu chạy nhiều worker hoặc nhiều
instance, mỗi cái sẽ có bộ nhớ `rooms` riêng và người chơi có thể bị "vào
phòng không tồn tại" dù người khác vừa tạo. `Procfile` đã cấu hình sẵn
`--workers 1` cho đúng yêu cầu này.

### Deploy lên Render.com (miễn phí, có link cố định dạng `https://ten-app.onrender.com`)

1. Đưa code lên GitHub: tạo repo mới, `git init && git add . && git commit -m "init" && git push`.
2. Vào [render.com](https://render.com) → đăng ký/đăng nhập bằng GitHub.
3. **New +** → **Web Service** → chọn repo vừa đẩy lên.
4. Điền cấu hình:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --workers 1 --threads 8 --timeout 120`
   - **Instance Type**: Free
5. Bấm **Create Web Service**, đợi build xong (1-2 phút) là có link
   `https://ten-app.onrender.com` dùng được cho mọi người ở bất kỳ đâu.

Lưu ý gói Free của Render sẽ "ngủ" sau ~15 phút không có ai truy cập, và khi
có người vào lại sẽ mất khoảng 30-60 giây khởi động lại — **đồng thời dữ liệu
phòng cũ sẽ mất** vì server restart. Với một buổi chơi thì không sao, chỉ cần
tạo phòng mới sau khi server tỉnh dậy. Muốn server không ngủ và bền hơn thì
nâng cấp gói trả phí, hoặc dùng Railway/Fly.io (cấu hình tương tự, cũng cần
`--workers 1`).

