# Kiểm thử và kiểm chứng mobile

Hiện chưa có test runner hoặc scripts mobile. Đây là quy ước để thiết lập nền kiểm thử khi app được khởi tạo; không được báo test đã pass chỉ vì file hướng dẫn tồn tại.

## Chọn đúng lớp kiểm thử

Ưu tiên unit test và integration test. Không tự cài E2E hoặc mutation testing vào mobile; nếu cần trong tương lai phải có phạm vi và dependency được duyệt riêng.

| Thay đổi | Bằng chứng tối thiểu |
| --- | --- |
| Hàm domain thuần | Unit test trường hợp đúng, sai và biên |
| Shared UI | Test hành vi/props/accessibility quan trọng khi nền component test có sẵn |
| Query hoặc mutation | Integration test API adapter, cache key, invalidation và lỗi |
| Screen state | Component/integration test loading, empty, error, pending và retry liên quan |
| Navigation | Test router hoặc kiểm tra runtime theo luồng được đổi |
| Native permission/audio | Development build hoặc thiết bị phù hợp; không chỉ mock |
| Styling thuần | Typecheck, lint và review giao diện theo kích thước/trạng thái |
| Chỉ tài liệu | Kiểm tra link, đường dẫn, hiện trạng và diff |

Test qua public behavior hoặc interface của owner; không gọi private method hoặc kiểm tra implementation chỉ để tăng coverage.

## Check bắt buộc sau khi có app

Đọc manifest/lockfile để dùng đúng package manager. Scripts nền nên cung cấp typecheck, lint và test; phải bổ sung và chạy thực tế trong task thiết lập, không giả định đã tồn tại.

Ví dụ nếu đã chọn npm và đã có scripts tương ứng:

```bash
npm run typecheck
npm run lint
npm test
```

Nếu chọn pnpm hoặc Bun, ghi lại lệnh tương ứng đã xác minh trong [mobile/README.md](../../../mobile/README.md). Build/doctor phụ thuộc SDK và tool được duyệt; không dùng lệnh có thể tải package mới mà chưa được phép.

## Những trường hợp cần bảo vệ

- Input biên, validation, lỗi không xác định và mapping code lỗi an toàn.
- Tài khoản đổi, cache riêng tư, session hết hạn và response đến muộn.
- Phân trang có bản ghi trùng, trang tiếp theo lỗi, refresh và invalidation.
- Submit lặp, timeout sau khi server có thể đã ghi, rollback optimistic update nếu có.
- Khôi phục draft/offline chỉ khi các tính năng này được triển khai và có contract.
- Quy tắc đáp án tiếng Nhật, timezone/streak và tiến độ theo contract domain.

Test mặc định dùng dữ liệu giả, adapter/mock hoặc database/server kiểm thử được cách ly; không đọc env thật, dùng token thật hoặc gọi dịch vụ production.

## Review trực quan và accessibility

Kiểm tra màn hẹp/thông thường, text tiếng Nhật và bản dịch dài, font scaling, bàn phím, loading/error/disabled, touch target, thứ tự focus và screen-reader label. Kiểm tra từng platform thực sự được hỗ trợ; không suy luận device behavior chỉ từ code hoặc snapshot.

Khi bàn giao, ghi lệnh, kết quả và check chưa chạy/chưa đạt cùng lý do. Task chỉ tài liệu không cần chạy app chưa tồn tại.
