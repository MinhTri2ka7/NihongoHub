# Hướng dẫn kỹ thuật backend

Tài liệu mô tả cấu trúc và hướng dẫn kỹ thuật backend của dự án NihongoHub.

## Trước khi viết hoặc sửa code

Đọc [CODING_CONVENTIONS.md](./CODING_CONVENTIONS.md) để áp dụng quy ước format, đặt tên, kiểu dữ liệu, luồng xử lý, log, exception và abstraction.

## Trước khi thêm chức năng mới

Đọc [MODULE_DESIGN.md](./MODULE_DESIGN.md) trước khi thêm chức năng mới hoặc tạo module backend. Tài liệu quy định trách nhiệm của Controller, Service, Repository, Policy và cách tách riêng interface, DTO.

## Khi viết hoặc sửa API

Đọc [HTTP_PIPELINE.md](./HTTP_PIPELINE.md) trước khi viết mới hoặc sửa API. Tài liệu quy định thứ tự xử lý request HTTP, vị trí đặt logic, cấu hình HTTP dùng chung, request ID và checklist triển khai API.

Đọc [SWAGGER.md](./SWAGGER.md) khi viết hoặc sửa route, DTO và tài liệu API. Mô tả Swagger cần ngắn gọn, đủ contract và khớp với code thực tế.

## Khi truy cập database

Đọc [DATA_ACCESS.md](./DATA_ACCESS.md) khi viết hoặc sửa truy vấn, Repository, index và transaction. Tài liệu quy định SELECT rõ field, tìm kiếm tận dụng index, tránh query thừa, N+1 và giữ lock lâu.
