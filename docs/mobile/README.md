# Tài liệu mobile NihongoHub

Điểm đọc đầu tiên cho AI và lập trình viên trước khi viết hoặc sửa mobile. Đọc [mobile/AGENTS.md](../../mobile/AGENTS.md) và [quy tắc AI chung](../ai-rules/README.md) cùng tài liệu này.

## Hiện trạng

Ngày 2026-11-23, `mobile/` chỉ có tài liệu; chưa có app, manifest, lockfile hoặc SDK. Các hướng dẫn bên dưới mô tả **kiến trúc mục tiêu**, không chứng minh tính năng đã tồn tại. Màu được chọn cho NihongoHub là **xanh dương, nền sáng**.

Expo/React Native, TypeScript và Expo Router là hướng tham khảo từ bộ mẫu. Phiên bản và bộ thư viện cần được duyệt khi khởi tạo app. Tên domain như `lessons`, `vocabulary`, `reviews`, `progress` là ví dụ cho ứng dụng học tiếng Nhật.

## Đọc theo nhu cầu

| Nhu cầu | Đọc |
| --- | --- |
| Thêm hoặc thay đổi code mobile | [Structure guide](structure/README.md) |
| Tổ chức route, feature và shared component | [FOLDER_STRUCTURE.md](structure/FOLDER_STRUCTURE.md) |
| Xây màn hình hoặc component | [SCREEN_DESIGN.md](structure/SCREEN_DESIGN.md), [UI_SYSTEM.md](structure/UI_SYSTEM.md) |
| Quản lý API, cache, session và draft | [STATE_AND_DATA.md](structure/STATE_AND_DATA.md) |
| Chọn màu và trạng thái UI | [COLOR_SYSTEM.md](design/COLOR_SYSTEM.md) |
| Viết test hoặc chuẩn bị kiểm chứng | [TESTING.md](structure/TESTING.md) |
| Khởi tạo app hoặc triển khai một feature | [Mobile architecture playbook](playbooks/MOBILE_ARCHITECTURE_PLAYBOOK_V1.md) |
| Chạy ứng dụng | [mobile/README.md](../../mobile/README.md), cập nhật sau khi có source |

## Các nhóm tài liệu

- `structure/`: quy ước code, ownership, state, UI, dependency và quy trình AI.
- `design/`: semantic token và quy tắc trình bày được chia sẻ.
- `playbooks/`: các bước triển khai và kiểm chứng có thể lặp lại.

Khi cần plan, ADR hoặc archive, tạo theo [quy ước tài liệu chung](../README.md). Không tạo sẵn thư mục rỗng.

Khi thay đổi hiện trạng, cập nhật README này, hướng dẫn kỹ thuật liên quan và snapshot trong playbook. Giữ rõ phần “đã triển khai”, “đề xuất” và “cần quyết định”.
