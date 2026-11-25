# Thiết kế module backend

Đọc tài liệu này trước khi thêm chức năng mới hoặc tạo module backend. Đây là quy ước tổ chức code cho các chức năng mới; cây thư mục bên dưới là mẫu đề xuất, không phải mô tả toàn bộ code hiện có.

## 1. Trách nhiệm từng thành phần

| Thành phần | Phải làm | Tránh làm |
| ---------- | -------- | --------- |
| Controller | Khai báo route, HTTP status, nhận DTO đã validate và user đã xác thực; gọi interface của module | Viết nghiệp vụ hoặc query database |
| Service | Xử lý quy tắc nghiệp vụ, điều phối use case, chuyển trường hợp không tồn tại/xung đột thành exception phù hợp | Phụ thuộc Express response |
| Repository | Truy vấn dữ liệu, lọc quyền sở hữu, bảo đảm thao tác nhiều bảng có tính atomic; chọn rõ trường trả về | Quyết định HTTP status |
| Policy | Tập trung quy tắc quyền truy cập hoặc khả năng hiển thị được dùng lại | Gom mọi validation không liên quan vào một helper |

Luồng xử lý: xác thực và validate đầu vào → Controller → interface của Service → Service → Repository → database. Service gọi Policy khi cần kiểm tra quyền hoặc khả năng hiển thị.

## 2. Đặt chức năng theo module sở hữu nghiệp vụ

Trước khi tạo file:

1. Gọi tên chức năng theo sản phẩm.
2. Xác định interface mà bên ngoài cần gọi.
3. Xác định module sở hữu các quy tắc lọc, quyền riêng tư, sắp xếp và lỗi.
4. Đặt Controller, Service, Repository, DTO, README và test vào module đó.
5. Đăng ký module tại nơi lắp ghép ứng dụng.
6. Đặt tên file theo quy ước thống nhất, ngắn gọn và rõ chức năng; tránh tên lan man hoặc chung chung.

## 3. Khi cần dùng chức năng của module khác

- Gọi interface được module đó export hoặc policy có phạm vi rõ ràng.
- Không import trực tiếp repository nội bộ của module khác.
- Khi cần atomic, giữ phần transaction trong một repository.
- Thêm integration test nếu contract đi qua nhiều module.
- Hạn chế phụ thuộc vào function của module khác. Chỉ tái sử dụng qua interface hoặc policy được export khi thực sự cần để code gọn và tránh lặp; tiện ích dùng chung không gắn với nghiệp vụ có thể đặt ở `common`.

## Cấu trúc module

Ví dụ module `lessons` dưới `backend/src/modules/`:

```text
lessons/
├── lessons.module.ts
├── lessons.controller.ts
├── lessons.service.ts
├── lessons.repository.ts
├── dto/
│   ├── create-lesson.dto.ts
│   ├── update-lesson.dto.ts
│   ├── list-lessons-query.dto.ts
│   └── lesson-response.dto.ts
├── interfaces/
│   ├── lessons-service.interface.ts
│   └── lessons-repository.interface.ts
└── policies/
    └── lesson-access.policy.ts
```

Chỉ tạo file khi chức năng cần dùng. Nếu dự án đã có vị trí đặt module riêng, giữ vị trí đó và áp dụng cách phân chia bên trong như trên.

## Interface: hợp đồng giữa các lớp

- Đặt interface trong `interfaces/`, tách khỏi DTO và file triển khai.
- Interface của Service mô tả các use case mà Controller hoặc module khác được gọi.
- Interface của Repository mô tả thao tác dữ liệu mà Service cần; không để kiểu query hoặc schema database lan ra Controller.
- Khai báo rõ kiểu tham số, kết quả trả về và trường hợp không tìm thấy. Ví dụ, Repository trả `null` khi không có dữ liệu; Service chuyển thành exception phù hợp với use case.
- Với NestJS, TypeScript interface không tồn tại ở runtime. Dùng token như `Symbol` và đăng ký provider trong module để inject implementation.

Ví dụ hợp đồng của Service:

```typescript
// interfaces/lessons-service.interface.ts
import type { CreateLessonDto } from '../dto/create-lesson.dto.js';
import type { LessonResponseDto } from '../dto/lesson-response.dto.js';

export const LESSONS_SERVICE = Symbol('LESSONS_SERVICE');

export interface LessonsService {
  create(userId: string, dto: CreateLessonDto): Promise<LessonResponseDto>;
}
```

Controller inject bằng `@Inject(LESSONS_SERVICE)`; module đăng ký `{ provide: LESSONS_SERVICE, useClass: LessonsServiceImpl }`. Áp dụng tương tự cho Repository khi sử dụng interface để inject.

## DTO: dữ liệu vào và ra

| Loại DTO | Vị trí | Nội dung |
| -------- | ------ | -------- |
| Request | `dto/create-lesson.dto.ts`, `dto/update-lesson.dto.ts` | Các trường client được phép gửi và quy tắc validate đầu vào |
| Query | `dto/list-lessons-query.dto.ts` | Bộ lọc, phân trang, sắp xếp; chuyển kiểu và validate trước khi vào Controller |
| Response | `dto/lesson-response.dto.ts` | Các trường API được phép trả về; không lộ dữ liệu nội bộ hoặc nhạy cảm |

- Request và query DTO dùng class khi cần decorator validation hoặc Swagger. Interface chỉ mô tả kiểu, không validate dữ liệu ở runtime.
- Tách DTO theo mục đích; không dùng entity hoặc bản ghi database làm DTO công khai.
- Không nhận `userId`, `ownerId` từ client để quyết định chủ sở hữu; lấy từ ngữ cảnh người dùng đã xác thực.
- DTO kiểm tra hình dạng dữ liệu như trường bắt buộc, kiểu, độ dài. Service kiểm tra nghiệp vụ như tài nguyên có tồn tại hoặc có bị trùng hay không.
- Map rõ kết quả sang response DTO; khai báo kiểu trả về không tự loại bỏ trường dư ở runtime.

## Quyền truy cập, dữ liệu và lỗi

- Xác thực thực hiện trước Controller bằng cơ chế xác thực của ứng dụng; endpoint công khai phải được khai báo rõ.
- Repository lọc dữ liệu theo phạm vi được phép truy cập, chẳng hạn kết hợp `id` và `ownerId` ngay trong truy vấn.
- Policy chứa quy tắc quyền dùng lại; Service điều phối việc kiểm tra Policy. Không chỉ dựa vào kiểm tra tại Controller để bảo vệ dữ liệu.
- Với use case cập nhật nhiều bảng, Service xác định phạm vi nghiệp vụ; Repository thực thi trong cùng transaction để toàn bộ thao tác cùng thành công hoặc rollback.
- Repository chọn rõ các trường cần trả về và không quyết định HTTP status. Service chuyển lỗi không tồn tại hoặc xung đột đã nhận diện thành exception phù hợp; không biến mọi lỗi database thành lỗi xung đột.
- Service trả dữ liệu hoặc ném exception; Controller và cơ chế xử lý exception của ứng dụng chịu trách nhiệm phản hồi HTTP.

## 4. Kiểm thử đúng lớp

- Test HTTP qua route.
- Test nghiệp vụ qua interface Service.
- Test SQL qua interface Repository với database kiểm thử để xác minh truy vấn và transaction.
- Không gọi private method để test.

## 5. Các dấu hiệu thiết kế cần xem lại

- Service chỉ chuyển tiếp mọi tham số sang Repository.
- Controller biết tên bảng hoặc chi tiết transaction.
- Nhiều nơi lặp lại kiểm tra quyền sở hữu.
- Helper chung cần nhiều cờ riêng cho từng nghiệp vụ.
- Tên chức năng, route, folder và test thuộc các domain khác nhau.
- Đặt chức năng vào module chỉ vì “bảng dữ liệu nằm ở đây”.

Mục tiêu chung là **interface nhỏ, dễ dùng; phần xử lý phức tạp được giữ bên trong module**.

## Cấu hình và tái sử dụng function

- Sử dụng biến môi trường thông qua `envConfig` tại `src/config/env.config.ts` làm lớp trung gian. Code ứng dụng import `envConfig`, không đọc trực tiếp `process.env` ở từng module.
- Khi thêm biến môi trường, khai báo mapping tại `env.config.ts` và cập nhật giá trị mẫu trong `.env.example`.
- Hạn chế tạo hoặc đăng ký nhiều function cùng chức năng. Kiểm tra code hiện có trước khi thêm; tái sử dụng hoặc gom logic trùng khi chúng có cùng trách nhiệm nghiệp vụ.
- Chỉ đưa tiện ích vào `common` khi có nhu cầu dùng chung và không phụ thuộc quy tắc riêng của một module. Logic nghiệp vụ vẫn thuộc module sở hữu và được gọi qua interface công khai khi cần.

## Khi thêm chức năng mới

1. Xác định use case, đầu vào, đầu ra và quyền truy cập.
2. Tạo DTO riêng và khai báo interface cần dùng.
3. Viết truy vấn trong Repository, lọc quyền sở hữu và dùng transaction khi cần.
4. Viết nghiệp vụ trong Service; tách Policy nếu quy tắc quyền được dùng lại.
5. Khai báo route trong Controller và đăng ký provider/token trong module.
6. Kiểm tra luồng thành công, đầu vào sai, chưa xác thực, không đủ quyền, không tồn tại, xung đột và rollback nếu có transaction.
