# src/config

## Thiết kế đã duyệt

Người dùng duyệt triển khai auth, gọi API trực tiếp và thiết kế giao diện ngày 2026-11-25. API URL công khai đọc NEXT_PUBLIC_API_URL, kiểm tra http/https; khi thiếu cấu hình form hiển thị lỗi, không gọi nhầm origin. Server đọc API_URL hoặc URL công khai, không xuất secret.

Trạng thái: đã triển khai; kết quả kiểm chứng tại Frontend README. Đọc [Frontend README](../../README.md) và hướng dẫn gần nhất.

## Kiểm chứng

Tại frontend: npm run typecheck, npm run lint, npm test, npm run build. Kiểm tra form sai/đúng, loading, thông báo lỗi, OTP hết hạn/thiếu phiên, refresh đồng thời và logout. Backend auth hiện chưa có implementation; test dùng adapter giả, không chứng minh gửi email hoặc kết nối API thật.
