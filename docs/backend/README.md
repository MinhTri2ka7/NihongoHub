# Tài liệu kỹ thuật backend

**AI phải đọc README này trước mỗi lần viết hoặc sửa code backend**, sau đó đọc các tài liệu liên quan trong [structure/](./structure/README.md) và code thực tế của task. Tài liệu mô tả cấu trúc kỹ thuật hiện tại, ranh giới giữa các phần và những kiểm tra bắt buộc.

Đọc cùng [backend/AGENTS.md](../../backend/AGENTS.md) để tuân thủ quy trình làm việc và [backend/README.md](../../backend/README.md) để biết cách cấu hình, chạy ứng dụng.

## Cách đọc trước khi code

1. Đọc README này và `backend/AGENTS.md` ở đầu mỗi task code, kể cả khi đã đọc ở task trước.
2. Đọc [quy ước code](./structure/CODING_CONVENTIONS.md) và [thiết kế module](./structure/MODULE_DESIGN.md).
3. Đọc thêm tài liệu phù hợp với phạm vi thay đổi trong bảng dưới.
4. Đối chiếu với code, `backend/package.json` và cấu hình thực tế; xác định module sở hữu, dependency và contract bị ảnh hưởng trước khi triển khai.
5. Thực hiện quy trình lập plan, xác nhận và kiểm chứng theo `backend/AGENTS.md`. Cập nhật tài liệu liên quan nếu thay đổi cấu trúc hoặc contract.

Trước khi làm auth, đọc [README của module auth](../../backend/src/module/auth/README.md). README hiện ghi thiết kế đăng ký, đăng nhập, OTP qua SES, reset mật khẩu và refresh token rotation/logout kèm sequence diagram; chưa có code auth được triển khai. Với module khác, đọc README ngay trong thư mục module và viết/cập nhật thiết kế trước khi triển khai theo [quy tắc sơ đồ chung](../ai-rules/README.md#viết-thiết-kế-vào-readme-trước-khi-triển-khai).

Trước khi làm profile, avatar hoặc đổi mật khẩu có xác thực, đọc [README của module user](../../backend/src/module/user/README.md). Thiết kế dùng danh tính từ JWT đã verify, upload avatar qua S3 presigned URL và interface auth để đổi mật khẩu/thu hồi phiên; hiện chưa có code user được triển khai.

Trước khi làm kho tài liệu học tập, đọc [README Learning Repository](../../backend/src/module/learning-repository/README.md). Các feature folder, list tài liệu theo offset, upload, document, search tiêu đề và usage được chia bằng tiêu đề ngay trong README; database do người dùng quản lý, chỉ giữ query mẫu. Hiện chưa có code module.

Trước khi làm bài/bộ và từ vựng, đọc [README Vocabulary](../../backend/src/module/vocabulary/README.md). Phạm vi gồm tạo tên bài, bulk insert danh sách từ, list/chi tiết, search full-text, cursor 20 từ và sửa/xóa bộ/từ. Database do người dùng quản lý, chỉ có query mẫu và chưa có code module.

| Khi thực hiện | Tài liệu phải đọc thêm |
| ------------- | --------------------- |
| Thêm chức năng, thay đổi ranh giới hoặc dependency giữa module | [MODULE_DESIGN.md](./structure/MODULE_DESIGN.md) |
| Viết/sửa API, auth, validation, logging hoặc xử lý lỗi HTTP | [HTTP_PIPELINE.md](./structure/HTTP_PIPELINE.md) |
| Đổi route, DTO, status hoặc tài liệu API | [SWAGGER.md](./structure/SWAGGER.md) |
| Viết/sửa Repository, truy vấn, index hoặc transaction | [DATA_ACCESS.md](./structure/DATA_ACCESS.md) |

## Cấu trúc kỹ thuật hiện tại

Backend dùng NestJS, TypeScript strict, ESM, Express, Drizzle với PostgreSQL và Vitest. Import tương đối trong TypeScript dùng đuôi `.js` theo cấu hình ESM hiện tại.

```text
backend/
├── src/
│   ├── main.ts             # Khởi tạo ứng dụng
│   ├── app.module.ts       # Lắp ghép module và global provider
│   ├── bootstrap/          # Cấu hình request logging, Swagger
│   ├── config/             # envConfig, điểm đọc biến môi trường
│   ├── common/             # Thành phần kỹ thuật dùng chung
│   ├── health/             # API kiểm tra tình trạng ứng dụng/database
│   ├── infrastructure/     # Database, CloudWatch, S3, SQS và email SMTP
│   └── module/             # auth/, user/, learning-repository/, vocabulary/ có README
└── test/                   # Test và thiết lập Vitest
```

- `main.ts` gọi cấu hình request logging và Swagger, bật shutdown hooks rồi khởi động server.
- `app.module.ts` lắp ghép Health, Database, CloudWatch, S3, SQS, Email, Verifications và Observe; đăng ký exception filter qua `APP_FILTER`.
- `common/` hiện có logging, middleware, filter, mã lỗi và các thành phần verification JWT/TOTP.
- `infrastructure/database/` chứa cấu hình kết nối, schema, relations và kiểm tra kết nối. Database hiện được cấu hình qua `@nestjs/drizzle`, inject bằng `@InjectDrizzle()`.
- `infrastructure/storage/` chứa `S3Module`, client DI và `S3StoreService`; đọc [hướng dẫn cấu hình S3](../../backend/src/infrastructure/storage/README.md). Khi bật, module kiểm tra bucket lúc khởi động và đóng client khi shutdown.
- `infrastructure/queue/` chứa SqsModule và SqsMessageService, gửi text/JSON theo Queue URL từ envConfig.queue; đọc [hướng dẫn SQS](../../backend/src/infrastructure/queue/README.md). Mặc định tắt; khi bật validate config, không gửi message lúc startup và đóng client khi shutdown.
- `infrastructure/email/` chứa EmailModule/EmailService, ba template HBS và adapter SMTP trong `nodemailer/`; `ses/` chỉ là thư mục giữ chỗ. Đọc [email README](../../backend/src/infrastructure/email/README.md) và [config README](../../backend/src/config/README.md). Không gửi thật lúc startup/test, chưa nối API auth hoặc scheduler. Khóa AUTH_EMAIL_VERIFICATION_KEY mới được cấu hình, chưa dùng để xử lý token.
- Test hiện có cả trong `src/` và `test/`. Test mới đặt tại `test/src/` đối xứng source theo `backend/AGENTS.md`; không tự di chuyển test không liên quan.

### Phân biệt hiện trạng với quy ước triển khai

Các tài liệu trong `structure/` có cả quy ước mục tiêu. Không suy ra một thành phần đã tồn tại chỉ vì được nhắc trong ví dụ:

- Biome là quy ước mục tiêu; scripts hiện tại vẫn dùng Prettier và Oxlint.
- Token DI `DATABASE` là quy ước trong tài liệu data access; code hiện tại dùng `@InjectDrizzle()`.
- `src/modules/<feature>/` trong mẫu thiết kế là vị trí đề xuất; hiện có thư mục `src/module/`. Xác định vị trí thống nhất trước khi tạo module, không tự tạo hai hệ thống thư mục song song.
- Prefix `/api/v1`, global validation pipe, Helmet, CORS và Guard xác thực mặc định chưa được thiết lập trong bootstrap/module hiện tại. Kiểm tra implementation trước khi dùng `@Public()` hoặc `@CurrentId()`.

Nếu task cần áp dụng quy ước chưa có, nêu rõ thay đổi cần thiết trong phạm vi triển khai. Không tự coi cấu hình đã tồn tại, không nới quy tắc và không migration hàng loạt ngoài task.

## Ranh giới giữa các phần

- **Bootstrap/config:** thiết lập HTTP và cấu hình; code ứng dụng lấy biến môi trường qua `envConfig`.
- **Controller/Pipe/DTO:** tiếp nhận HTTP, validate/chuyển kiểu, mô tả API; Controller gọi interface của Service, không query database.
- **Guard/Policy:** Guard kiểm tra điều kiện truy cập endpoint; Policy tập trung quy tắc quyền nghiệp vụ dùng lại. Repository vẫn lọc phạm vi dữ liệu được phép.
- **Service:** điều phối use case, kiểm tra nghiệp vụ và chuyển lỗi đã nhận diện thành exception phù hợp; không ghép SQL hoặc phụ thuộc Express response.
- **Repository:** truy vấn, chọn rõ field, lọc quyền sở hữu và thực thi transaction ngắn; không quyết định HTTP status.
- **Module:** sở hữu nghiệp vụ và các contract liên quan; module khác gọi interface/policy công khai, không import Repository nội bộ.
- **Infrastructure/common:** hạ tầng và tiện ích kỹ thuật dùng chung; không dùng làm nơi gom nghiệp vụ riêng của domain.

## Kiểm tra bắt buộc

Với task thay đổi code, test hoặc cấu hình, chạy trong `backend/` theo `AGENTS.md`:

```bash
npm run typecheck
npm run test
npm run lint
```

- Chạy thêm `npm run build` và integration test phù hợp khi thay đổi ảnh hưởng bootstrap, HTTP, database, dependency hoặc cấu hình build/test. Dự án hiện duy trì unit test và integration test, cùng chạy bằng `npm test`.
- Khi đổi route/DTO, integration test kiểm tra OpenAPI: path, method, auth, input, required fields, response schema và các status dự kiến; đối chiếu response HTTP thực tế.
- Với truy vấn/transaction, kiểm tra quyền sở hữu, phân trang, lỗi constraint và commit/rollback khi liên quan; kiểm tra execution plan cho truy vấn phức tạp hoặc quan trọng.
- Không gọi private method để test; kiểm thử qua route, interface Service hoặc interface Repository theo lớp cần xác minh.
- Báo rõ check đã chạy, kết quả và check chưa chạy/chưa đạt cùng lý do. Không tuyên bố đã kiểm chứng khi chưa chạy hoặc còn lỗi.
- Với thay đổi chỉ là tài liệu, kiểm tra nội dung, đường dẫn và liên kết; không cần chạy test ứng dụng.
