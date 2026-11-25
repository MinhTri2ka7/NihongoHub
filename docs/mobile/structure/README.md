# Hướng dẫn kỹ thuật mobile

Đọc trước khi viết hoặc sửa mobile. Bộ hướng dẫn này được điều chỉnh từ mẫu Daune cho NihongoHub; các quy trình và ranh giới được giữ lại, phần bản đồ/địa điểm và thông tin triển khai riêng của mẫu đã được thay thế.

## Hiện trạng và thẩm quyền

**Hiện mới có tài liệu.** Chưa có `src/`, `package.json`, SDK, token hoặc shared component được triển khai trong mobile. Cây thư mục và tên API dưới đây là mục tiêu thiết kế, không phải kết quả khảo sát một app đang hoạt động.

Khi có hướng dẫn xung đột, đối chiếu:

1. Chỉ dẫn người dùng cho task và `AGENTS.md` theo phạm vi.
2. Yêu cầu bảo mật, quyền riêng tư, accessibility và sản phẩm đã được thống nhất.
3. Các quy ước trong `structure/` và [color system](../design/COLOR_SYSTEM.md).
4. [Playbook kiến trúc](../playbooks/MOBILE_ARCHITECTURE_PLAYBOOK_V1.md).
5. Code/test thực tế, có ghi nhận rõ nếu tồn tại sai lệch cần xử lý.

Không tự coi code cũ là quy ước đúng; cũng không tự migration code chỉ vì mẫu tài liệu đề xuất cách khác. Đối chiếu và nêu phần cần thay đổi trong task.

## Đọc theo công việc

| Công việc | Đọc trước | Đọc thêm |
| --- | --- | --- |
| Tạo hoặc sắp xếp file | [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) | [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md) |
| Thêm component dùng lại | [UI_SYSTEM.md](UI_SYSTEM.md) | [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) |
| Tạo hoặc sửa màn hình | [SCREEN_DESIGN.md](SCREEN_DESIGN.md) | [STATE_AND_DATA.md](STATE_AND_DATA.md), [UI_SYSTEM.md](UI_SYSTEM.md) |
| Thêm query, mutation hoặc state | [STATE_AND_DATA.md](STATE_AND_DATA.md) | Feature và API contract liên quan |
| Thêm hoặc đổi thư viện/SDK | [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md) | [mobile/AGENTS.md](../../../mobile/AGENTS.md) |
| Viết hoặc sửa test | [TESTING.md](TESTING.md) | Feature và shared contract bị ảnh hưởng |
| Mọi task triển khai code | [AI_CHANGE_WORKFLOW.md](AI_CHANGE_WORKFLOW.md) | Các tài liệu theo phạm vi ở trên |

## Quy tắc nền

- Route ghép màn; feature sở hữu nghiệp vụ. Shared UI không fetch hoặc điều khiển domain.
- Kiểm tra `ui/`, `common/` và feature trước khi tạo component mới.
- Dùng semantic token, không tạo bảng màu riêng theo màn. Primary xanh dương, secondary button dùng surface trung lập.
- Dữ liệu server không được nhân bản vào global store chỉ để tiện truy cập.
- Tách dữ liệu riêng tư theo tài khoản; logout/đổi tài khoản phải vô hiệu hóa cache và request cũ phù hợp.
- Input, route params và dữ liệu lưu cục bộ không phải bằng chứng xác thực hoặc quyền sở hữu.
- Phiên bản SDK, dependency, i18n và test runner phải được xác minh và duyệt trước khi cài.
- Mỗi tuyên bố hành vi cần bằng chứng mới phù hợp: test, build, runtime hoặc kiểm tra thiết bị.

## Đích kiến trúc cần được triển khai theo task

Expo Router, semantic token, API transport, TanStack Query, Zustand khi cần, React Native Reusables, NativeWind/Tailwind và localization là các lựa chọn cần chốt cụ thể. Tài liệu không cho phép tự cài toàn bộ hoặc khởi tạo app trong một task chỉ sửa nội dung.
