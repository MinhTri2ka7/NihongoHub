# src/styles

## Thiết kế đã duyệt

Người dùng duyệt triển khai auth, gọi API trực tiếp và thiết kế giao diện ngày 2026-11-25. CSS toàn ứng dụng: web học tiếng Nhật hiện đại, trắng/than đậm và đỏ cam, chữ lớn, giảm mô tả, góc 3px; responsive và reduced-motion.

Trạng thái: đã triển khai; kết quả kiểm chứng tại Frontend README. Đọc [Frontend README](../../README.md) và hướng dẫn gần nhất.

## Kiểm chứng

Thiết kế mới theo yêu cầu: trắng/than đậm, điểm nhấn đỏ cam; giảm caption, bỏ mô tả lặp, label/input/link 16px, tiêu đề form 36–40px; mobile ẩn panel trang trí để ưu tiên form. Góc bo 3px. Các trạng thái focus, lỗi và reduced-motion vẫn bắt buộc.

Theo yêu cầu mở rộng toàn màn hình: auth bỏ max-width/viền ngoài, hai cột phủ viewport, header/footer đặt trong bố cục hai mảng màu. Theo phản hồi form còn nhỏ: form desktop rộng tối đa 560px, tiêu đề 42–56px, label/input 18px, input và nút cao 68px. Mobile chuyển header/footer về luồng bình thường, ô nhập/nút cao 60px và giữ khoảng đệm. Chỉ đổi CSS, không đổi luồng auth hoặc dependency.

Tại frontend: npm run typecheck, npm run lint, npm test, npm run build. Kiểm tra form sai/đúng, loading, thông báo lỗi, OTP hết hạn/thiếu phiên, refresh đồng thời và logout. Backend auth hiện chưa có implementation; test dùng adapter giả, không chứng minh gửi email hoặc kết nối API thật.
