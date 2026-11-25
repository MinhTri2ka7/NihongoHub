# Quy ước Swagger/OpenAPI

Đọc tài liệu này khi viết hoặc sửa API, route, DTO hay tài liệu Swagger. Mục tiêu là **Swagger/OpenAPI khớp với code và dữ liệu thực tế; mô tả ngắn gọn, đủ để người gọi dùng đúng API**.

Áp dụng cùng [HTTP_PIPELINE.md](./HTTP_PIPELINE.md) và [MODULE_DESIGN.md](./MODULE_DESIGN.md). Đây là quy ước triển khai; các decorator hoặc cấu hình được nhắc đến cần được hỗ trợ trong code trước khi sử dụng.

## 1. Mỗi API phải mô tả đủ contract

| Decorator | Nội dung |
| --------- | -------- |
| `@ApiTags` | Nhóm API theo nghiệp vụ |
| `@ApiBearerAuth('access-token')` | API yêu cầu JWT |
| `@ApiOperation` | `summary` ngắn và `description` hướng dẫn cách gọi |
| `@ApiParam`, `@ApiQuery` | Tham số trên đường dẫn và query |
| `@ApiBody` | Cấu trúc body khi không tự suy ra được |
| `@ApiOkResponse`, `@ApiCreatedResponse`… | HTTP status và DTO trả về khi thành công |
| Các decorator response lỗi | Những lỗi dự kiến: validation, quyền, không tồn tại, conflict, rate limit… |

- Chỉ mô tả các tham số, status và lỗi thực sự có thể xảy ra. Status tài liệu phải khớp status của handler, `@HttpCode()` và cơ chế xử lý lỗi.
- Tên security scheme `access-token` phải khớp tên đăng ký bằng `DocumentBuilder.addBearerAuth()` trong cấu hình Swagger.
- Route public phải dùng `@Public()` được Guard hỗ trợ và không được ghi là bắt buộc bearer token. Kiểm tra security trong OpenAPI sinh ra, kể cả metadata kế thừa từ Controller hoặc cấu hình chung.
- Decorator Swagger chỉ mô tả contract, không tự thực hiện xác thực, validation hay đổi HTTP status.

## 2. Viết mô tả phục vụ người gọi API

**Viết ngắn thôi, không cần dài hoặc kể quá chi tiết.** `summary` dùng một câu ngắn; `description` thường chỉ cần 1–3 câu, bổ sung điều kiện ảnh hưởng trực tiếp đến cách gọi. Chỉ viết dài hơn khi contract thực sự cần.

Nêu các điều kiện liên quan đến API đó:

- Quyền truy cập và quyền sở hữu.
- Field nào cần đi cùng nhau.
- Giá trị mặc định, giới hạn và phân trang.
- Thứ tự kết quả, tính idempotent và tác động của thao tác.

Không lặp lại schema hoặc liệt kê mọi field trong description. Tránh kể chi tiết Controller/Service/Repository, SQL, tên bảng hoặc tên class.

Ví dụ mô tả ngắn bằng tiếng Anh:

```typescript
@ApiOperation({
  summary: 'List my lessons',
  description: 'Returns your lessons, newest first. Supports pagination with up to 100 items per page.',
})
```

Chỉ dùng mô tả này nếu quyền sở hữu, thứ tự và giới hạn trên đúng với implementation.

## 3. DTO phải khớp dữ liệu thực

Khai báo metadata cần thiết bằng `@ApiProperty` hoặc `@ApiPropertyOptional`:

- `description`, `example`, `format`.
- `enum`, giới hạn độ dài hoặc giá trị.
- `default`, `nullable`, field bắt buộc/tùy chọn.
- Kiểu DTO lồng nhau và kiểu phần tử mảng.

**Swagger, validation, TypeScript và response thực tế phải thống nhất.**

- Response dùng DTO class rõ ràng; map dữ liệu thực tế theo đúng DTO, không chỉ gắn kiểu TypeScript.
- Phân biệt field tùy chọn với field nhận `null`; mô tả đúng việc field bị bỏ qua hoặc xuất hiện với giá trị `null`.
- `default` phải phản ánh giá trị ứng dụng thực sự áp dụng; metadata Swagger không tự gán giá trị mặc định.
- Mảng, DTO lồng nhau và kết quả phân trang phải có schema đầy đủ, đúng cấu trúc wrapper thực tế nếu có.
- Response `204` không có body; không khai báo response DTO hoặc ví dụ body cho status này.

## 4. Quy tắc đặt ví dụ

- Ví dụ đơn giản đặt trong `@ApiProperty`.
- Ví dụ nhiều field đặt ở `<domain>.swagger.ts` cạnh module sở hữu.
- Dùng `satisfies` để kiểm tra ví dụ theo DTO; ví dụ vẫn phải đúng validation và quy tắc nghiệp vụ vì kiểm tra kiểu không thay thế kiểm tra runtime.
- Giữ khoảng 1–3 ví dụ đại diện, tránh liệt kê nhiều biến thể giống nhau.
- Dùng dữ liệu giả; không đưa token, credentials, signed URL hoặc dữ liệu riêng tư thật vào ví dụ.
- Không lấy ví dụ từ JSON hoặc import test fixture vào code Swagger production.

## 5. Ngôn ngữ và lỗi

- Nội dung mô tả Swagger viết bằng **tiếng Anh**, bao gồm summary, description, mô tả field và response.
- Ví dụ vẫn được dùng tên địa điểm, địa chỉ tiếng Việt.
- Khi sửa file có mô tả Swagger tiếng Việt cũ, chuyển toàn bộ phần mô tả Swagger trong file đó sang tiếng Anh.
- Dùng mã từ `ErrorCode` tại `src/common/errors/error-code.ts`, tránh chép lại chuỗi mã lỗi.
- Schema và ví dụ lỗi tuân theo [contract response lỗi](./HTTP_PIPELINE.md#contract-response-lỗi): gồm đúng `code`, `message` dạng chuỗi, `details` dạng mảng và `requestId`. Khi không có chi tiết, trả `details: []`; không thêm `statusCode`, `timestamp` hoặc `request_id` vào body. Kiểm tra implementation của exception filter khớp contract khi triển khai.
- Không lộ SQL, stack trace, secrets hoặc dữ liệu riêng tư.

## 6. Phải kiểm tra OpenAPI bằng test

Khi đổi route hoặc DTO, integration test phải kiểm tra OpenAPI được sinh từ ứng dụng với cấu hình tương ứng:

- Đường dẫn, prefix và HTTP method.
- Security scheme và yêu cầu auth; route public không bị ghi là bắt buộc bearer token.
- Input schema của params, query, body; các field bắt buộc và giới hạn liên quan.
- Response schema, cấu trúc DTO và các status thành công/lỗi dự kiến; `204` không có content.

Đối chiếu contract với response HTTP thực tế qua test route liên quan. Sau đó chạy test liên quan và typecheck trong thư mục `backend`:

```bash
npm test -- <duong-dan-test-lien-quan>
npm run typecheck
```

Xem Swagger UI thủ công chưa đủ. Khi sửa riêng tài liệu hướng dẫn này mà không đổi route, DTO hoặc code Swagger, không cần chạy test ứng dụng.

Tham khảo API decorator tại tài liệu NestJS: [Operations](https://docs.nestjs.com/openapi/operations), [Security](https://docs.nestjs.com/openapi/security), [Types and parameters](https://docs.nestjs.com/openapi/types-and-parameters).
