# Quy tắc AI cho mobile NihongoHub

Áp dụng cho `mobile/`. Đọc [quy tắc chung](../docs/ai-rules/README.md), [README mobile](README.md) và [hướng dẫn kỹ thuật](../docs/mobile/structure/README.md) trước khi triển khai. Chọn tài liệu theo bảng “Đọc theo công việc”; không chỉ đọc file này rồi viết code.

## Hiện trạng và phạm vi

- Ngày 2026-11-23, `mobile/` chỉ có tài liệu hướng dẫn; chưa khởi tạo ứng dụng, `package.json`, lockfile, SDK hoặc cấu hình native.
- Expo/React Native với TypeScript và Expo Router là kiến trúc đề xuất từ mẫu được chuyển sang. Không coi đây là package đã cài hoặc phiên bản đã được chọn.
- Không tự chạy lệnh tạo app, cài thư viện, sinh `ios/`/`android/` hoặc thiết lập EAS khi task chỉ yêu cầu tài liệu.
- Backend có hướng dẫn riêng tại [backend/AGENTS.md](../backend/AGENTS.md). Không sửa backend hoặc API contract trong một task mobile nếu chưa có phạm vi tương ứng.

## Trước khi code

Trước mỗi lần làm việc với một module/feature mobile, đọc lại `README.md` trong thư mục module/feature đó theo [quy tắc chung](../docs/ai-rules/README.md#đọc-readme-của-module-trước-khi-làm-việc); áp dụng cả khi khảo sát, đề xuất hoặc sửa test và khi task ảnh hưởng nhiều module.

1. Đọc lại [docs/mobile/README.md](../docs/mobile/README.md) và tài liệu trong `structure/` liên quan.
2. Kiểm tra working tree; giữ nguyên thay đổi của người dùng và các ứng dụng khác.
3. Khi đã có app, đọc phiên bản Expo, React Native, React và package manager từ manifest/lockfile thực tế. Tra tài liệu chính thức tương ứng trước khi dùng API framework.
4. Lập plan có luồng xử lý, file dự kiến, ownership, trạng thái lỗi, kiểm thử và tiêu chí hoàn thành; chờ duyệt task cụ thể trước khi viết code.
5. Việc duyệt tài liệu không tự cho phép cài đặt toàn bộ kiến trúc đề xuất.

Viết thiết kế vào README của module/feature trước khi triển khai; sơ đồ trong README và plan dùng Mermaid `sequenceDiagram` theo [quy tắc sơ đồ chung](../docs/ai-rules/README.md#viết-thiết-kế-vào-readme-trước-khi-triển-khai).

## Ranh giới code

- Route trong `src/app/` chỉ xử lý params, layout và ghép màn; feature sở hữu nghiệp vụ.
- `src/components/ui/` chứa primitive không biết domain; `common/` chứa component trung lập có nhu cầu dùng chung thực tế; `layout/` chứa screen shell và safe area.
- API, query keys, hooks, state và kiểu nghiệp vụ đặt trong `src/features/<domain>/`. Ví dụ `lessons`, `vocabulary`, `reviews`, `progress` chỉ minh họa ownership.
- `src/lib/api/` là transport dùng chung; không import feature hoặc tự quyết định nghiệp vụ.
- Server state ưu tiên TanStack Query sau khi được duyệt; state cục bộ dùng React; chỉ thêm Zustand cho trạng thái chia sẻ có lý do. Không nhân bản cache server vào store.
- Kiểm tra component hiện có trước khi tạo mới. React Native Reusables, NativeWind/Tailwind và thư viện i18n là phương án cần duyệt, chưa được cài sẵn.

## Giao diện và màu sắc

- Tuân thủ [UI_SYSTEM.md](../docs/mobile/structure/UI_SYSTEM.md), [SCREEN_DESIGN.md](../docs/mobile/structure/SCREEN_DESIGN.md) và [COLOR_SYSTEM.md](../docs/mobile/design/COLOR_SYSTEM.md).
- Chủ đạo xanh dương, nền sáng. Màu UI phải lấy từ semantic token tại `src/theme/tokens.ts` khi file nền này được triển khai; không thêm hex/RGB/HSL vào screen/component.
- Không giả định `PrimaryButton`, `ScreenShell`, provider hoặc localization đã tồn tại chỉ vì được nhắc trong tài liệu.
- Màn học phải hỗ trợ chữ Nhật, nội dung tiếng Việt dài, font scaling, trạng thái loading/empty/error/offline và thao tác bàn phím khi liên quan.
- Không tự cài i18n; trước khi thêm UI copy đầu tiên phải chốt cách quản lý nội dung và locale trong task nền.

## Dependency, cấu hình và dữ liệu

- Đề xuất tên, phiên bản, lý do, tương thích SDK, native plugin/permission và lệnh trước khi cài hoặc đổi package; làm theo [DEPENDENCY_MANAGEMENT.md](../docs/mobile/structure/DEPENDENCY_MANAGEMENT.md).
- Chọn một package manager và một lockfile khi khởi tạo app. Sau đó dùng đúng công cụ đã chọn; không đổi theo backend hoặc theo sở thích.
- Nếu dùng Expo, sau khi được duyệt, chọn dependency tương thích qua Expo CLI hiện có. Kiểm tra Expo Go/development build theo package thực tế.
- Cấu hình công khai đọc qua `src/config/env.ts`; `EXPO_PUBLIC_*` được đưa vào client nên không được chứa secret, khóa S3, JWT signing key hoặc URL database.
- Không đọc file env thật khi không có yêu cầu; không đưa token, password, signed URL hoặc dữ liệu học tập riêng tư vào log, tài liệu, route params hay fixture.
- Mobile không quyết định quyền sở hữu, chấm điểm hoặc ghi tiến độ thay cho backend. Dùng contract được xác minh, không sao chép API của dự án mẫu.

## Kiểm chứng và bàn giao

- Khi có source app: chạy typecheck, lint, unit/integration test liên quan theo scripts thực tế; build/runtime và kiểm tra thiết bị khi thay đổi native, permission hoặc UI cần bằng chứng.
- Chưa có app thì không tuyên bố các lệnh mobile đã pass. Task chỉ sửa tài liệu cần kiểm tra link, đường dẫn, hiện trạng và nội dung.
- Không tự thiết lập E2E, mutation testing hoặc hạ tầng test mới; mỗi loại cần nhu cầu và phạm vi được duyệt riêng.
- Cập nhật tài liệu kỹ thuật và playbook khi thay đổi kiến trúc hoặc contract. Commit, push, publish và deploy cần yêu cầu rõ ràng của người dùng.
