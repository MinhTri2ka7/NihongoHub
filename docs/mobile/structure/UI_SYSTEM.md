# Hệ thống UI mobile

Quy ước mục tiêu cho NihongoHub; chưa có thư viện UI hoặc component nền trong source.

## Chọn component trước khi tạo mới

1. Tìm primitive/variant trong `src/components/ui/` nếu đã có.
2. Tìm component dùng chung trong `src/components/common/` và layout trong `src/components/layout/`.
3. Tìm component domain trong feature sở hữu.
4. Kiểm tra nguồn tham khảo React Native Reusables trước khi tự xây primitive.
5. Duyệt dependency hoặc thay đổi nền nếu phương án cần thư viện/config mới.
6. Component một feature đặt trong feature; chỉ đưa vào `common` khi trung lập và có ít nhất hai consumer thực tế hoặc là hạ tầng UI toàn app.

Không tạo thêm một button, input, card, dialog, feedback hoặc shell cùng trách nhiệm với component đã có. Mở rộng variant khi API vẫn nhỏ và dễ hiểu.

## Ranh giới

| Thành phần | Sở hữu | Không sở hữu |
| --- | --- | --- |
| `ui/` | Primitive, interaction và accessibility dùng chung | Query, store domain, route nghiệp vụ |
| `common/` | UI trung lập có reuse thật, ví dụ QueryFeedback | Luật chấm điểm, session, ghi tiến độ |
| `layout/` | Safe area, keyboard, screen shell | Tải dữ liệu khóa học |
| `features/<domain>/` | LessonCard, ReviewAnswer và màn hình nghiệp vụ | Bảng màu hoặc button nền thứ hai |

Các tên component là ví dụ thiết kế, chưa phải API đã tồn tại.

## Styling và tokens

- Dùng semantic token theo [COLOR_SYSTEM.md](../design/COLOR_SYSTEM.md): primary xanh dương, nền sáng.
- `src/theme/tokens.ts` là vị trí đề xuất cho màu, spacing, radius, typography và motion khi triển khai nền.
- React Native Reusables và NativeWind/Tailwind là hướng cần đánh giá/duyệt theo SDK. Không tự cài hoặc giả định `className` đã hoạt động.
- Trước khi nền styling được chọn, không trộn nhiều hệ thống độc lập. Runtime value, animation hoặc yêu cầu native có thể dùng `style` theo quyết định nền.
- Ưu tiên variant có nghĩa như tone, size, density; tránh một component nhận nhiều boolean cho từng màn.
- Không đặt tên màu theo feature hoặc trang. Cần vai trò mới thì cập nhật hệ token chung.

## Contract component

Component nhận dữ liệu và callback qua typed props, không có network/storage/navigation side effect ẩn. Tùy nhu cầu, phải hỗ trợ:

- default, pressed/focused, disabled, loading, selected và error;
- accessibility label/role/state; không truyền đạt trạng thái chỉ bằng màu;
- font scaling, nội dung tiếng Nhật và text tiếng Việt dài;
- touch target hợp lý, thông thường ít nhất 44 × 44 điểm;
- keyboard, safe area và platform behavior đúng phạm vi hỗ trợ.

Loading phải chặn thao tác lặp phù hợp nhưng không tự xóa label khiến layout nhảy. Disabled là trạng thái thật, không chỉ đổi màu.

## Thành phần đặc thù học tập

- Kana, kanji, furigana, đáp án và audio control thuộc feature hoặc component có contract rõ; không biến primitive text/button thành component biết mọi loại bài tập.
- Chọn font có glyph tiếng Nhật và quyền sử dụng phù hợp; kiểm tra clipping, line height và scaling trên thiết bị.
- Audio playback có owner/lifecycle riêng; button chỉ gửi intent, không tạo player mới mỗi render.
- Đúng/sai phải có text/icon hoặc thông báo đọc được; không chỉ xanh/đỏ. Animation phản hồi phải tôn trọng reduced motion.

## Review trước khi hoàn tất

Kiểm tra reuse, token, props, trạng thái bất đồng bộ, nội dung dài, touch target và screen reader. Nếu thay đổi public props hoặc hành vi shared UI, cập nhật consumer, test và tài liệu trong cùng task.
