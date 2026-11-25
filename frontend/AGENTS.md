# Hướng dẫn làm việc với frontend

Áp dụng cho toàn bộ `frontend/`; đọc cùng [AGENTS.md gốc](../AGENTS.md) và [quy tắc AI chung](../docs/ai-rules/README.md). Khi có hướng dẫn gần hơn trong thư mục con, áp dụng thêm hướng dẫn đó.

## Đọc trước khi làm việc

- Đọc lại [README frontend](README.md) và README của từng module chịu ảnh hưởng trước khi khảo sát, đề xuất, sửa code hoặc kiểm thử.
- Đối chiếu thiết kế với code, cấu hình và phiên bản thực trong `package.json`/`package-lock.json`.
- Module chưa có README: báo rõ, đọc tài liệu cha và bổ sung thiết kế trong README của module trước khi triển khai module mới theo task được duyệt.

## Trình bày để người dùng duyệt trước khi triển khai

Mỗi task cần nêu rõ:

1. Mục tiêu, phạm vi và tiêu chí hoàn thành.
2. Cây thư mục trong phạm vi task; liệt kê riêng file **thêm**, **sửa**, **xóa**, trách nhiệm từng file và lý do thay đổi.
3. Interface/contract, nguồn dữ liệu và luồng thành công/lỗi. Luồng nghiệp vụ dùng Mermaid `sequenceDiagram` theo quy tắc AI chung.
4. **Custom hook**: tên, đường dẫn, dùng mới hay tái sử dụng, tham số, kết quả trả về, state, side effect, cleanup và nơi sử dụng. Nếu không cần hook, ghi rõ không có.
5. **Component dùng chung**: tên, đường dẫn, dùng mới hay tái sử dụng, props, trạng thái loading/error/empty nếu có, yêu cầu accessibility và nơi sử dụng. Phân biệt với component riêng của feature; nếu không cần, ghi rõ không có.
6. Dependency: tên, phiên bản, mục đích, tương thích, rủi ro và lệnh cài/đổi.
7. Cách kiểm chứng, check dự kiến chạy và giới hạn chưa thể xác nhận.

Chờ phê duyệt task cụ thể rồi mới thêm/sửa code, test, dependency hoặc cấu hình chạy/build. Duyệt plan tổng quan không thay thế duyệt từng task. Ghi nhận quyền đã được cấp, không hỏi lại cùng phạm vi. Khi cần mở rộng phạm vi, trình bày phần mở rộng và chờ duyệt trước phần phụ thuộc.

## Ranh giới thư mục

| Thư mục | Trách nhiệm |
| --- | --- |
| `src/app/` | Routing, page, layout và trạng thái của route; gọi module nghiệp vụ |
| `src/features/<feature>/` | Component, hook, service, store, schema và type riêng của nghiệp vụ |
| `src/components/ui/` | UI dùng chung qua props; không chứa nghiệp vụ |
| `src/components/layout/` | Bố cục và điều hướng dùng chung |
| `src/components/shared/` | Thành phần chung giữa nhiều feature |
| `src/hooks/` | Hook dùng chung, không phụ thuộc feature cụ thể |
| `src/lib/` | HTTP client, utility và tích hợp thư viện dùng chung |
| `src/stores/` | Trạng thái thực sự dùng chung; store riêng thuộc feature |
| `src/types/` | Type chung; type riêng thuộc feature |
| `src/config/` | Cấu hình ứng dụng; không chứa secret |
| `src/styles/`, `public/` | CSS chung và tài nguyên tĩnh |

Component, hook và thư viện dùng chung không import ngược từ feature. Chỉ trích xuất thành phần chung khi có nhu cầu cụ thể; không tự tạo hook, component, trang, store hay thư mục ngoài task đã duyệt.

## HTTP và dữ liệu

- Service trong feature sử dụng client từ `src/lib/axios.ts`; không tự tạo thêm cấu hình HTTP trùng lặp khi chưa có lý do.
- Xác định rõ contract API trước khi tích hợp; không đoán endpoint, response, cơ chế xác thực hoặc refresh token.
- Không lưu credential/token của người dùng trong singleton dùng chung giữa các request phía server. Không log mật khẩu, token hoặc dữ liệu nhạy cảm.
- Giữ nguyên response/error Axios trừ khi task đã duyệt một contract chuyển đổi rõ ràng. Truyền `AbortSignal` khi bên gọi cần hủy request.
- Không đặt secret trong mã nguồn hoặc cấu hình công khai của frontend.

## Hoàn tất task

Cập nhật README theo implementation thực tế; chạy check phù hợp với phần đã thay đổi. Báo kết quả đã chạy, check lỗi/chưa chạy và giới hạn còn lại. Chỉ sửa file trong phạm vi; giữ nguyên thay đổi của người dùng. Commit, push, PR, publish và deploy tuân theo quyền riêng trong quy tắc AI chung.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
