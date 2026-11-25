# Thiết kế màn hình mobile

Hướng dẫn cho các màn học tiếng Nhật của NihongoHub. Route, screen và UI được nhắc đến là mục tiêu; chưa có app để xác nhận thiết kế đã triển khai.

## 1. Trước khi tạo màn

1. Xác định mục tiêu người dùng và một hành động chính.
2. Ghi feature sở hữu, dữ liệu cần đọc/ghi và contract backend.
3. Kiểm tra màn/component/variant đang có trước khi tạo mới.
4. Đối chiếu [UI_SYSTEM.md](UI_SYSTEM.md) và [COLOR_SYSTEM.md](../design/COLOR_SYSTEM.md).
5. Dùng mockup/reference đã duyệt. Nếu chưa có, ghi rõ layout là đề xuất và chốt trong task; không coi UI của Daune là giao diện sẵn có của NihongoHub.

## 2. Route và screen

Route `src/app/` chỉ đọc/validate params, cấu hình navigation và render screen thuộc feature. Screen điều phối query/mutation và các section; API, normalization và luật domain nằm ngoài phần render.

Tách component khi có một trong các lý do: section có state/interaction riêng, markup lặp thật, component cần test độc lập, hoặc view lớn làm luồng màn khó đọc. Không tách từng dòng thành file chỉ để giảm số dòng.

Ví dụ phân chia một màn bài học:

| Phần | Owner đề xuất |
| --- | --- |
| Route, lesson ID, navigation option | `app/` |
| LessonScreen, nội dung bài, action học | `features/lessons/` |
| Query, DTO mapping và query keys | Feature API/hooks |
| Button, input, skeleton nền | `components/ui/` |
| Safe area, content padding | `components/layout/` |

Không chọn số lượng tab, tên route hoặc endpoint chỉ để khớp mẫu. Chúng cần được duyệt theo luồng sản phẩm.

## 3. Trạng thái bắt buộc

| Trạng thái | Hành vi cần xác định |
| --- | --- |
| Initial loading | Skeleton/progress, không giả dữ liệu thành công |
| Refresh | Giữ nội dung phù hợp, báo refresh riêng |
| Empty | Giải thích trạng thái và hành động tiếp theo |
| Error | Thông báo an toàn, retry theo contract |
| Not found / forbidden | Phân biệt theo quyền và phản hồi backend |
| Offline / unavailable | Không tự chuyển sang demo để che lỗi |
| Mutation pending | Chặn submit trùng, xử lý rời màn |
| Ghi chưa rõ kết quả | Kiểm tra kết quả trước khi gửi lại nếu cần |

Không thay lỗi bằng fixture hoặc hiển thị cache cũ như dữ liệu vừa ghi thành công. Khi tài khoản đổi, không để nội dung riêng tư cũ lóe lên trong màn mới.

## 4. Tương tác trên điện thoại

- Tôn trọng safe area, keyboard và thao tác back; deep link phải hoạt động cả khi chưa đăng nhập theo contract đã chọn.
- Footer cố định phải chừa đủ khoảng cuối list, kể cả khi font lớn và có bàn phím.
- Dùng list ảo hóa cho danh sách dài; không bọc list dài trong ScrollView lồng nhau không cần thiết.
- Touch target thường ít nhất 44 × 44 điểm; text trong button được wrap/shrink hợp lý, không cắt nghĩa.
- Không xin permission khi mở app nếu chưa có hành động cần nó. Nếu thêm microphone/audio ghi âm, thiết kế permission denied và phương án tiếp tục phù hợp.
- Màn luyện nghe cần xác định pause/resume khi rời màn hoặc app xuống nền; không giả định SDK audio đã chọn.

## 5. Nội dung và bản địa hóa

- Chốt locale mặc định, locale UI và cách hiển thị nội dung học. Ngôn ngữ câu hỏi/đáp án không đồng nhất với locale giao diện.
- Khi i18n đã có, mọi UI copy và accessibility label dùng key theo feature, với interpolation/pluralization phù hợp.
- Trước khi có i18n, task thêm UI đầu tiên phải xác định nền quản lý text; không tự thêm framework hoặc tạo helper dịch tạm cạnh tranh nhau.
- Kiểm tra kanji/kana/furigana, font fallback, độ cao dòng, text selection và nội dung dài trên platform liên quan.
- Không nối chuỗi dịch hoặc chuẩn hóa đáp án theo một luật chung chưa được duyệt.

## 6. Bằng chứng hoàn thành

Review loading/empty/error/pending, màn hẹp, text dài, font scaling, keyboard, back và label cho screen reader. Chạy typecheck, lint và test theo [TESTING.md](TESTING.md). Tuyên bố hỗ trợ iOS/Android/Web hoặc permission phải có bằng chứng đúng nền tảng.
