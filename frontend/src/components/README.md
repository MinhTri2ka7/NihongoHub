# src/components

## Thiết kế đã duyệt

Người dùng duyệt triển khai auth, gọi API trực tiếp và thiết kế giao diện ngày 2026-11-25. Button, FormField, PasswordInput, FormMessage và AuthLayout dùng props; không import feature. CSS trắng/than đậm, điểm nhấn đỏ cam, góc 3px, font hệ thống, chữ form lớn và focus rõ.

Trạng thái: đã triển khai; kết quả kiểm chứng tại Frontend README. Đọc [Frontend README](../../README.md) và hướng dẫn gần nhất.

## Kiểm chứng

Thiết kế cập nhật theo yêu cầu người dùng: hiện đại hơn, giảm chữ nhỏ/mô tả. Brand bỏ tagline; AuthLayout dùng mảng than đậm và minh họa thẻ kana bằng CSS, bỏ đoạn giới thiệu dài. Form và link chính 16px, tiêu đề lớn, góc bo 3px. Giữ props và hành vi tương tác hiện tại; không thêm dependency.

AuthLayout hiện phủ toàn viewport, không có khung giới hạn 1200px hoặc viền ngoài. Header/footer nằm trên hai cột màu ở desktop, về luồng trang bình thường ở mobile. Theo phản hồi form còn nhỏ, form tăng tối đa 560px, tiêu đề 42–56px, input/nút 68px trên desktop và 60px trên mobile. Props và nghiệp vụ không thay đổi.

| Component | Props chính | Hành vi |
| --- | --- | --- |
| Button | ButtonHTMLAttributes, pending | Disabled khi pending, aria-busy, không tự gọi API |
| FormField | id, label, error, hint, children | htmlFor/ID, mô tả lỗi/hint cho input |
| PasswordInput | InputHTMLAttributes | Toggle text/password, aria-pressed và aria-controls, không lưu mật khẩu vào state |
| FormMessage | message, success | role alert cho lỗi, status cho thành công; không render HTML API |
| AuthLayout | children | Bố cục auth responsive, hình minh họa CSS và brand |
| Brand | Không có | Link về trang chủ, nhãn truy cập đầy đủ |

Component shared không có state nghiệp vụ. Form gắn aria-invalid/describedby và focus field lỗi; keyboard focus rõ, reduced-motion, input 16px trên mobile.

Tại frontend: npm run typecheck, npm run lint, npm test, npm run build. Kiểm tra form sai/đúng, loading, thông báo lỗi, OTP hết hạn/thiếu phiên, refresh đồng thời và logout. Backend auth hiện chưa có implementation; test dùng adapter giả, không chứng minh gửi email hoặc kết nối API thật.
