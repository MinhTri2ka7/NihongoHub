# Quy ước viết code backend

Đọc tài liệu này trước khi viết hoặc sửa code backend. Tài liệu quy định format, đặt tên, kiểu dữ liệu và cách tổ chức code; áp dụng cùng [MODULE_DESIGN.md](./MODULE_DESIGN.md).

## 1. Format

- TypeScript bật strict; không nới compiler để né lỗi.
- Dùng **Biome** để format và lint.
- Thụt lề **2 dấu cách**.
- Dùng nháy đơn `'...'`, dấu `;`, trailing comma.
- Độ dài dòng mục tiêu **100 ký tự**; để formatter xử lý các trường hợp không thể ngắt dòng hợp lý.
- Dùng `import type` khi phù hợp; để Biome sắp xếp import.

Đây là quy ước mục tiêu. Backend hiện dùng Prettier để format và Oxlint để lint; việc áp dụng Biome cần đồng bộ dependency, cấu hình và scripts trong một thay đổi riêng, không coi tài liệu này là bằng chứng công cụ đã được chuyển đổi.

## 2. Đặt tên

| Thành phần | Quy ước | Ví dụ |
| ---------- | ------- | ----- |
| Module | Tên nghiệp vụ + `Module` | `PersonalMapModule` |
| Controller | Tên route/nghiệp vụ + `Controller` | `PersonalMapController` |
| Service | Tên nghiệp vụ + `Service` | `PersonalMapService` |
| Repository | Tên nghiệp vụ + `Repository` | `PersonalMapRepository` |
| DTO đầu vào | Hành động/query + `Dto` | `SavePlaceDto` |
| DTO đầu ra | Tài nguyên/kết quả + `Dto` | `SavedPlaceDto` |
| Mã lỗi | Viết hoa, phân cách `_` | `INVALID_VISIT_TIME` |
| Boolean | Bắt đầu bằng `is`, `has`, `can` | `hasPhotos`, `canEdit` |

Ưu tiên tên rõ nghĩa theo nghiệp vụ; tránh tên chung chung như `data`, `obj`, `mgr`, `util`.

Tên file dùng `kebab-case` và hậu tố thể hiện vai trò, chẳng hạn `personal-map.service.ts`, `save-place.dto.ts`, `personal-map.service.spec.ts`. Giữ tên chức năng, route, folder và test nhất quán theo domain sở hữu.

## 3. Kiểu dữ liệu và giá trị

- DTO class mô tả input HTTP và response công khai.
- Hàm nội bộ dùng kiểu nghiệp vụ riêng khi khác khái niệm DTO.
- Với thao tác cập nhật, `undefined` nghĩa là không gửi thay đổi cho field.
- `null` nghĩa là yêu cầu xóa giá trị, nếu contract cho phép; không tự quy đổi `null` thành `undefined` hoặc ngược lại.
- Không dùng `any`; kiểm tra, thu hẹp `unknown` trước khi truy cập.
- Validate input ở lớp tiếp nhận HTTP, tránh kiểm tra lặp lại không cần thiết. Service vẫn kiểm tra quy tắc nghiệp vụ và quyền; database vẫn bảo vệ constraint.
- Controller không để lộ trực tiếp cấu trúc row của Drizzle; map rõ dữ liệu sang response DTO.

## 4. Hàm và luồng xử lý

- Dùng guard clause để thoát sớm khi dữ liệu/trạng thái không hợp lệ.
- Viết luồng điều phối dễ đọc từ trên xuống.
- Chỉ `catch` khi có thể phục hồi, thêm context an toàn hoặc chuyển loại lỗi phù hợp.
- Phải `await` thao tác ghi ảnh hưởng đến response.
- Không chạy tác vụ nền không được quản lý; tác vụ cần tiếp tục sau response phải đi qua cơ chế job/queue có theo dõi và xử lý lỗi.
- Nhận dependency qua constructor/tham số; không tự tạo client hạ tầng trong logic nghiệp vụ.
- Comment giải thích ràng buộc và đánh đổi khó thấy; tránh diễn giải từng dòng code.

## 5. Log và exception

- Dùng Nest `Logger`; không thêm `console.*` trong `src/`.
- Ưu tiên log có cấu trúc; không ghi secrets, token hoặc dữ liệu riêng tư vào log.
- Dùng Nest exception phù hợp như `BadRequestException`, `NotFoundException`, `ConflictException`.
- Mã lỗi ổn định lấy từ `ErrorCode`, không hardcode chuỗi.
- Lỗi chưa biết để global exception filter xử lý; không bắt mọi lỗi rồi chuyển thành cùng một lỗi nghiệp vụ.
- Không thêm `DomainError` mới. Khi sửa file có chỗ tạo `DomainError`, chuyển các chỗ đó sang Nest exception và giữ nguyên contract, gồm HTTP status, mã lỗi và cấu trúc response công khai.

## 6. Tổ chức abstraction

- Giữ logic dùng một lần ở gần nơi sử dụng.
- Chỉ thêm lớp phân tách khi có nhu cầu thay thế hoặc kiểm thử thực tế; giữ các ranh giới Controller, Service, Repository và interface đã quy định trong thiết kế module.
- Tránh wrapper chỉ chuyển tiếp tham số.
- Không tạo folder `helpers`, `utils`, `shared` chung chung để chứa nghiệp vụ riêng của một domain.
- Logic nghiệp vụ thuộc module sở hữu; tiện ích đưa vào `common` phải có mục đích dùng chung rõ ràng và không phụ thuộc quy tắc riêng của domain.
