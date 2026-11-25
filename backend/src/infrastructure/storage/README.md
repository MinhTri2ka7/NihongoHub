# S3 storage

`S3Module` cấu hình một AWS SDK S3 client qua token `S3_CLIENT` và export `S3StoreService`. Module nghiệp vụ cần dùng storage import `S3Module`; không tạo client riêng trong nghiệp vụ. `AppModule` đã import module này.

## Cấu hình

Đặt giá trị thực trong `.env.local` không được Git theo dõi; `.env.example` chỉ chứa cấu hình mẫu. Mọi thiết lập đi qua `envConfig.s3`.

| Biến | Ý nghĩa |
| ---- | ------- |
| `S3_ENABLED` | `true` để bật; mặc định tắt |
| `AWS_REGION` | Region của bucket; mặc định `ap-southeast-1` |
| `AWS_S3_BUCKET` | Tên bucket đã tồn tại |
| `S3_ENDPOINT` | Để trống với AWS S3; endpoint riêng với MinIO/R2 |
| `S3_FORCE_PATH_STYLE` | Bật `true` nếu dịch vụ tương thích yêu cầu, ví dụ MinIO |
| `S3_TIMEOUT_MS` | Timeout kết nối/request và kiểm tra bucket, mặc định 5000 ms |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` | Credentials chuẩn của AWS SDK; token dành cho credentials tạm thời |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_SESSION_TOKEN` | Credentials riêng cho S3 nếu cần tách khỏi CloudWatch |

Có thể dùng AWS profile hoặc IAM role thay cho key tĩnh thông qua default credential chain của SDK. `S3_REGION` ghi đè `AWS_REGION` nếu được đặt; `S3_BUCKET` chỉ là fallback khi chưa có `AWS_S3_BUCKET`.

## Kiểm tra kết nối

Khi bật S3, `S3StoreService.onModuleInit()` gửi `HeadBucket` để xác nhận truy cập bucket; ứng dụng dừng khởi tạo nếu kiểm tra thất bại. Thao tác này không tạo bucket hoặc ghi object, và cần quyền `s3:ListBucket` trên bucket với AWS S3.

`ping()` có thể được gọi lại để kiểm tra; lỗi trả `ServiceUnavailableException` với `ErrorCode.STORAGE_UNAVAILABLE`, không lộ credentials, endpoint hoặc lỗi SDK gốc. Khi ứng dụng shutdown, client được đóng bằng `destroy()`.

Kiểm tra bucket không chứng minh quyền upload/download/delete từng object. Khi thêm use case lưu file, bổ sung quyền tương ứng, giới hạn file, quyền sở hữu và test trong module nghiệp vụ. Module hiện chỉ thiết lập kết nối, chưa mở route upload hoặc tự đặt bucket thành public.
