# src/app

## Thiết kế đã duyệt

Người dùng duyệt triển khai auth, gọi API trực tiếp và thiết kế giao diện ngày 2026-11-25. Route mỏng: trang chủ, layout, loading/error/404 và năm trang auth; không có API giả hoặc backend proxy.

Trạng thái: đã triển khai; kết quả kiểm chứng tại Frontend README. Đọc [Frontend README](../../README.md) và hướng dẫn gần nhất.

## Kiểm chứng

Trang chủ đã rút gọn theo yêu cầu: hero chữ lớn, một dòng mô tả, minh họa thẻ kana tái sử dụng từ layout, ba nhãn hành trình học; bỏ đoạn giới thiệu dài và CTA lặp. Routes và navigation giữ nguyên.

Tại frontend: npm run typecheck, npm run lint, npm test, npm run build. Kiểm tra form sai/đúng, loading, thông báo lỗi, OTP hết hạn/thiếu phiên, refresh đồng thời và logout. Backend auth hiện chưa có implementation; test dùng adapter giả, không chứng minh gửi email hoặc kết nối API thật.
