# src/stores

## Thiết kế đã duyệt

Người dùng duyệt triển khai auth, gọi API trực tiếp và thiết kế giao diện ngày 2026-11-25. Auth Store global dùng Zustand: user, status, setUser, clearSession; không token, OTP, password, persist/devtools. Store client không dùng làm bằng chứng phân quyền server.

Sau sửa lỗi review: status có checking, profile-pending, authenticated, unauthenticated. Action setProfilePending xóa user cũ và đánh dấu credential đã được chấp nhận nhưng hồ sơ chưa tải xong. Token vẫn ở closure của feature auth, không nằm trong store. Thành phần dùng store phải chỉ coi authenticated là đã có User, và có thể dùng use-auth.retryProfile ở trạng thái profile-pending.

Trạng thái: đã triển khai; kết quả kiểm chứng tại Frontend README. Đọc [Frontend README](../../README.md) và hướng dẫn gần nhất.

## Kiểm chứng

Tại frontend: npm run typecheck, npm run lint, npm test, npm run build. Kiểm tra form sai/đúng, loading, thông báo lỗi, OTP hết hạn/thiếu phiên, refresh đồng thời và logout. Backend auth hiện chưa có implementation; test dùng adapter giả, không chứng minh gửi email hoặc kết nối API thật.
