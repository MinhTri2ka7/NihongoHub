# Cấu hình backend

Nguồn đọc env duy nhất cho source là envConfig trong env.config.ts; dotenv đọc .env.local trước .env. Đọc [README backend](../../README.md) và [AGENTS](../../AGENTS.md). Không log hoặc trả env/config/secrets; .env.example chỉ dùng mẫu, env local bị Git ignore.

## Phạm vi

- nodeEnv/port/requestLog, database pool/timeouts, jwt, CloudWatch, S3, SQS, Swagger và Observe giữ contract hiện tại trong README backend và README infrastructure tương ứng.
- email đọc/validate EMAIL_ENABLED, SMTP_HOST/PORT/SECURE/USER/PASS, EMAIL_FROM và SMTP_TIMEOUT_MS. Khi tắt, bỏ qua SMTP chi tiết và không giữ credentials trong envConfig.email.
- auth.emailVerificationKey đọc AUTH_EMAIL_VERIFICATION_KEY: cho phép trống khi chưa có auth, nếu có phải là 64 hex/32 byte. Chưa dùng để sinh/xác minh OTP hoặc mã hóa token. Không dùng chung khóa JWT.
- Boolean email phải true/false; khi bật cần hostname, port nguyên 1–65535, secure đúng định dạng, port465 dùng TLS, user/pass có giá trị, sender hợp lệ không CR/LF, timeout nguyên 1–120000ms. Lỗi cấu hình không in giá trị env.

Chi tiết contract và giới hạn tại [email README](../infrastructure/email/README.md). Cấu hình hợp lệ không chứng minh kết nối SMTP hoặc giao thư thật.

## Kiểm chứng

Chạy npm run typecheck, npm test, npm run lint, npm run format:check và npm run build trong backend. Test setup mock dotenv và env rõ ràng để không đọc env local. Test email config tại test/src/config/email.config.spec.ts bao phủ bật/tắt, sai port/TLS/sender/timeout/key và lỗi không echo giá trị.
