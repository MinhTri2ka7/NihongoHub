# HTTP pipeline

Đọc tài liệu này khi viết mới hoặc sửa API, thay đổi xác thực, validation, xử lý lỗi hoặc ghi log HTTP. Đọc thêm [MODULE_DESIGN.md](./MODULE_DESIGN.md) để xác định module sở hữu nghiệp vụ.

Đây là quy ước cần áp dụng khi triển khai; không có nghĩa mọi cấu hình hoặc decorator được nhắc đến đã tồn tại trong code hiện tại.

## 1. Vòng đời một request

Luồng thành công:

```text
Request
  → Middleware
  → Guard
  → Interceptor (chiều vào, nếu có)
  → Pipe + DTO
  → Controller
  → Service → Repository → Database
  → Kết quả trở về Controller
  → Interceptor (chiều ra, nếu có)
  → Response
  → Access log khi response kết thúc
```

Luồng lỗi: tại bước phát sinh exception chưa được xử lý, dừng luồng nghiệp vụ còn lại; exception đi tới filter phù hợp để tạo response lỗi. Interceptor có thể bắt lỗi từ phần xử lý mà nó bao quanh. Filter không phải bước bắt buộc của response thành công.

Thứ tự các thành phần NestJS tham khảo từ [Request lifecycle của NestJS](https://docs.nestjs.com/faq/request-lifecycle). Service và Repository là các lớp được ứng dụng gọi, không phải hook tự động của framework.

### Bước 1 — Middleware: tạo context, theo dõi request

- Chạy sớm để thiết lập `requestId`, mốc bắt đầu và context dùng trong suốt request.
- Gắn response header chứa request ID trước khi chuyển tiếp xử lý.
- Đăng ký callback kết thúc response ngay ở bước này; lúc bắt đầu chưa có HTTP status cuối cùng để ghi access log.
- Đặt middleware ghi request ở phạm vi toàn ứng dụng và trước các thành phần có thể kết thúc request, để theo dõi cả route không tồn tại, lỗi validation và request bị từ chối.
- Không xử lý nghiệp vụ hoặc query database tại middleware logging.

### Bước 2 — Guard: kiểm tra đăng nhập và quyền truy cập

- Xác minh thông tin xác thực, gắn danh tính đã xác thực vào request và kiểm tra điều kiện truy cập endpoint.
- Guard xác thực phải chạy trước Guard cần sử dụng danh tính người dùng để phân quyền.
- Guard từ chối thì Controller, Service và Repository không chạy; phần xử lý lỗi tạo response phù hợp.
- Guard chạy trước Pipe, vì vậy không được giả định body, query hoặc params đã được DTO validate.
- Quyền gắn với dữ liệu nghiệp vụ như chủ sở hữu hoặc khả năng hiển thị vẫn cần được bảo đảm trong Service/Policy và truy vấn Repository.

### Bước 3 — Pipe + DTO: validate, chuyển đổi dữ liệu đầu vào

- Interceptor chiều vào, nếu được đăng ký, chạy sau Guard và trước Pipe; nó bao quanh phần xử lý tiếp theo cùng chiều trả về.
- Pipe kiểm tra body, query và params theo DTO hoặc quy tắc dành cho tham số; chuyển kiểu rõ ràng trước khi Controller sử dụng.
- Từ chối trường không được khai báo, kiểu sai, thiếu trường bắt buộc hoặc giá trị ngoài giới hạn.
- DTO không thay thế kiểm tra nghiệp vụ hoặc quyền truy cập; không query database để xử lý use case tại đây.
- Validation thất bại thì dừng trước Controller và chuyển lỗi sang cơ chế xử lý exception.

### Bước 4 — Controller: gọi chức năng của module sở hữu

- Nhận dữ liệu đã validate và user đã xác thực; lấy user ID từ ngữ cảnh xác thực.
- Khai báo route, HTTP status, Swagger và gọi interface Service của module sở hữu chức năng.
- Trả kết quả theo response DTO. Không viết quy tắc nghiệp vụ, SQL hoặc điều khiển transaction ở Controller.

### Bước 5 — Service: xử lý quy tắc nghiệp vụ

- Điều phối use case, kiểm tra quy tắc nghiệp vụ và gọi Policy khi cần.
- Gọi interface Repository để đọc/ghi dữ liệu, xác định phạm vi thao tác cần atomic.
- Chuyển trường hợp không tồn tại hoặc xung đột đã nhận diện thành exception phù hợp.
- Trả dữ liệu cho Controller hoặc ném exception; không thao tác với Express response.

### Bước 6 — Repository: đọc/ghi database

- Thực hiện truy vấn, lọc phạm vi truy cập và chọn rõ các trường trả về.
- Giữ thao tác nhiều bảng cần atomic trong cùng transaction, commit khi thành công và rollback khi thất bại.
- Không quyết định HTTP status hoặc định dạng response HTTP.
- Kết quả quay về Service rồi Controller; interceptor chiều ra, nếu có, xử lý kết quả trước khi framework gửi response. Không phải endpoint nào cũng cần truy vấn database.

### Bước 7 — Exception filter: tạo response lỗi thống nhất

- Chỉ chạy khi có exception chưa được xử lý; không tiếp tục các bước nghiệp vụ đã bị bỏ qua.
- Chuẩn hóa HTTP status và nội dung lỗi theo contract chung, kèm cùng `requestId` của request.
- Không trả stack trace, SQL, thông tin xác thực hoặc chi tiết nội bộ cho client.
- Không dùng filter để chạy lại nghiệp vụ hay tự hoàn tất các bước ghi dữ liệu còn thiếu.

#### Contract response lỗi

Response lỗi phải có đúng cấu trúc công khai sau:

```json
{
  "code": "ERROR_CODE",
  "message": "Error message",
  "details": [],
  "requestId": "..."
}
```

- `code`: mã lỗi ổn định lấy từ `ErrorCode`.
- `message`: chuỗi mô tả lỗi an toàn cho người gọi API; không trả mảng ở field này.
- `details`: mảng chi tiết lỗi công khai, chẳng hạn lỗi validation; luôn trả `[]` khi không có chi tiết an toàn để cung cấp. Không đưa lỗi database hoặc object exception gốc vào đây.
- `requestId`: cùng ID trong header `X-Request-Id` và access log; tên field trong response dùng camelCase.
- HTTP status nằm ở status của response; body không thêm `statusCode`, `timestamp` hoặc `request_id`.
- Với lỗi nội bộ chưa xác định, dùng message chung và `details: []`, không lộ nguyên nhân nội bộ.

### Bước 8 — Kết thúc response: ghi access log

- Callback do middleware đăng ký ghi method, đường dẫn, HTTP status cuối cùng, thời gian xử lý và `requestId` khi response kết thúc.
- Theo dõi sự kiện `finish`; nếu dùng thêm `close` để phát hiện ngắt kết nối sớm thì phân biệt request bị ngắt và tránh ghi log hai lần.
- Không ghi token, mật khẩu hoặc toàn bộ body nhạy cảm vào access log.
- Với kết nối bị ngắt, không coi status dự kiến là bằng chứng client đã nhận response đầy đủ.

## 2. Chọn đúng thành phần

| Nhu cầu | Dùng |
| ------- | ---- |
| Ghi nhận mọi request, kể cả 404 hoặc bị Guard từ chối | Middleware |
| Xác thực, phân quyền | Guard |
| Validate, chuyển đổi input | Pipe và DTO |
| Bọc quá trình xử lý controller | Interceptor |
| Chuyển exception thành response lỗi | Exception filter |
| Xử lý nghiệp vụ | Service |

Không dùng **interceptor làm nơi duy nhất ghi access log**, vì Guard có thể chặn request trước khi interceptor chạy.

## 3. Nơi cấu hình HTTP dùng chung

`src/main.ts` quản lý thứ tự khởi tạo và gọi các hàm cấu hình HTTP dùng chung:

- Trust proxy, request logging, Helmet và CORS.
- Prefix `/api/v1`.
- Global validation pipe với `whitelist: true`, `forbidNonWhitelisted: true` và `transform: true`; khai báo quy tắc chuyển kiểu rõ ràng trong DTO/Pipe.
- Khởi tạo Swagger.

Có thể tách implementation cấu hình vào `src/bootstrap/` để `main.ts` gọn, nhưng vẫn gọi tập trung từ bootstrap. Đọc cấu hình môi trường qua `envConfig` tại `src/config/env.config.ts`.

`src/app.module.ts` lắp ghép dependency và đăng ký global provider, chẳng hạn exception filter qua `APP_FILTER` hoặc Guard xác thực mặc định qua `APP_GUARD`.

Trust proxy và CORS phải cấu hình theo hạ tầng và nguồn truy cập được phép; không mặc định tin mọi proxy hoặc mọi origin.

## 4. Quy tắc `requestId`

- Nhận `X-Request-Id` từ hạ tầng đáng tin cậy hoặc tạo UUID mới. Không mặc định tin header do client bất kỳ gửi lên; hạ tầng cần ghi đè hoặc kiểm soát header này.
- Kiểm tra định dạng và giới hạn độ dài ID được chấp nhận trước khi đưa vào log hoặc response.
- Dùng cùng ID trong response header `X-Request-Id`, access log và response lỗi; tạo một lần trong middleware, không tạo lại tại từng lớp.
- Không dùng request ID làm bằng chứng xác thực hay phân quyền.

## 5. Checklist khi thêm hoặc sửa API

- Mặc định cần đăng nhập; chỉ dùng `@Public()` khi chủ ý cho phép truy cập không đăng nhập. Decorator này phải được Guard xác thực hỗ trợ.
- Lấy user ID từ `@CurrentId()` hoặc request đã xác thực; không lấy danh tính chủ sở hữu từ body/query của client.
- Từ chối field không khai báo trong DTO.
- Swagger phải mô tả auth, input, thành công và các lỗi dự kiến.
- Danh sách phải có phân trang giới hạn: giới hạn tối đa kích thước trang và validate tham số phân trang.
- Trả dữ liệu đúng cấu trúc DTO, không trả thẳng database row; map rõ các trường được phép trả về.
- Kiểm tra qua route các trường hợp liên quan: thành công, chưa đăng nhập, không đủ quyền, input sai, không tồn tại và xung đột.
- Kiểm tra `requestId` nhất quán và access log có status/thời gian xử lý cho cả response thành công lẫn lỗi; kiểm tra thêm route 404 khi sửa pipeline dùng chung.
