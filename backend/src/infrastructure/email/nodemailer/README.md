# Nodemailer SMTP adapter

Đã triển khai theo task email được duyệt ngày 2026-11-25. Đọc [email README](../README.md) và [backend AGENTS](../../../../AGENTS.md).

- SmtpEmailModule tạo một transporter qua SMTP_TRANSPORT, đăng ký SendmailService cho EMAIL_SENDER và export token này. Interface nằm trong email/interfaces/email.interface.ts.
- Mặc định tắt. Khi bật dùng envConfig.email; module không đọc env trực tiếp. Không verify hoặc send lúc startup.
- Port 465 dùng TLS ngay; secure=false bắt buộc STARTTLS. Giữ xác minh chứng chỉ mặc định, TLS tối thiểu 1.2. SMTP phase timeout và AbortSignal deadline đều theo SMTP_TIMEOUT_MS.
- Tắt logger/debug và truy cập file/URL của Nodemailer; mail chỉ nhận HTML/text đã render và một người nhận. Không hỗ trợ attachment/URL nội dung tùy ý.
- Chỉ trả messageId sau khi accepted chứa đúng mailbox, rejected rỗng và có messageId. Lỗi trả EMAIL_UNAVAILABLE; không chuyển raw lỗi SMTP/cause ra ngoài hoặc log dữ liệu.
- onApplicationShutdown đóng transporter. Không retry tự động; timeout có thể xảy ra sau khi SMTP đã tiếp nhận, nên không khẳng định exactly-once.

Test mock createTransport/sendMail, không kết nối Gmail hoặc dịch vụ SMTP thật. Các giá trị thật chỉ nằm trong env local bị Git bỏ qua; xem email README để biết contract và lệnh kiểm chứng.
