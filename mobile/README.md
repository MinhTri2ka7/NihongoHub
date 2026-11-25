# NihongoHub mobile

Thư mục dành cho ứng dụng học tiếng Nhật của NihongoHub. Bắt đầu tại [tài liệu mobile](../docs/mobile/README.md) và tuân thủ [AGENTS.md](AGENTS.md).

## Hiện trạng

Tại ngày 2026-11-23, thư mục này **chỉ chứa tài liệu**. Chưa có source app, `package.json`, lockfile, Expo SDK, app config hoặc scripts chạy app.

Kiến trúc tham khảo là Expo/React Native, TypeScript và Expo Router. Phiên bản SDK, package manager, thư viện UI, quản lý state, i18n và thiết lập native cần được xác nhận trong task khởi tạo ứng dụng.

## Khi khởi tạo ứng dụng

1. Chốt phiên bản SDK, nền tảng hỗ trợ và một package manager.
2. Duyệt danh sách package và lệnh scaffold trước khi thực hiện.
3. Tạo source nền theo [FOLDER_STRUCTURE.md](../docs/mobile/structure/FOLDER_STRUCTURE.md), chỉ tạo các thư mục đã cần dùng.
4. Thiết lập semantic token theo [COLOR_SYSTEM.md](../docs/mobile/design/COLOR_SYSTEM.md): **xanh dương, nền sáng**.
5. Thiết lập cấu hình công khai, API client, test runner và scripts phù hợp với runtime đã chọn.
6. Cập nhật README này bằng các lệnh đã chạy thành công, cùng giới hạn iOS/Android/Web thực tế.

## Hướng dẫn chạy app sau khi có source

Chưa có lệnh cài/chạy nào được xác minh ở mobile. Không chạy `install`, `start` hoặc `doctor` trong thư mục hiện tại rồi coi là ứng dụng đã được thiết lập.

Sau khi scaffold, ghi rõ vào bảng sau thay vì chép nguyên lệnh từ dự án mẫu:

| Mục | Thông tin cần bổ sung |
| --- | --- |
| Node/SDK | Phiên bản trong manifest và yêu cầu tương thích |
| Cài dependency | Lệnh cài từ lockfile của package manager đã chọn |
| Chạy local | Script khởi động Metro/Expo thực tế |
| Chạy thiết bị | Expo Go hoặc development build đã xác minh; iOS cần môi trường phù hợp |
| Kiểm tra | Scripts typecheck, lint và unit/integration test |
| Build/release | Profiles, application ID, signing và kênh phát hành được duyệt |

## Tài liệu cần đọc

- [Structure guide](../docs/mobile/structure/README.md): ownership, UI, state, testing và workflow.
- [Mobile architecture playbook](../docs/mobile/playbooks/MOBILE_ARCHITECTURE_PLAYBOOK_V1.md): quy trình triển khai theo từng phần.
- [Backend documentation](../docs/backend/README.md): đối chiếu API và ranh giới mobile/backend.

Tên route, endpoint và domain trong tài liệu là ví dụ thiết kế; chưa có chức năng mobile nào được xác nhận là đã triển khai.
