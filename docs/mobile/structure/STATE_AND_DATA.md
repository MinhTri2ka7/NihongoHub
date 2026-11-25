# State và dữ liệu mobile

Quy ước mục tiêu cho NihongoHub; app, session, API client và các thư viện state **chưa được triển khai**. Không sao chép endpoint, thời hạn token hoặc provider auth từ dự án mẫu.

## 1. Chủ sở hữu state

| Loại state | Nơi sở hữu đề xuất |
| --- | --- |
| Dữ liệu server, trạng thái tải, cache | TanStack Query sau khi được duyệt |
| Input, đáp án đang chọn, modal | React state tại component/screen gần nhất |
| Draft hoặc state chia sẻ nhiều màn | Feature store; cân nhắc Zustand khi có nhu cầu thực tế |
| Định danh điều hướng | Route params nhỏ, có thể serialize |
| Màu, spacing, typography | Theme và component variants |
| Credentials | Adapter session với secure storage phù hợp nền tảng được duyệt |

Không copy query result vào Zustand hoặc AsyncStorage chỉ để có global state. Không persist lịch sử học hoặc nội dung riêng tư trước khi xác định account isolation, retention, xóa dữ liệu và offline contract.

## 2. API và cache theo feature

- `src/lib/api/` giữ base URL, timeout, header và chuẩn hóa lỗi transport. Feature giữ endpoint usage, DTO mapping, query keys và nghiệp vụ.
- Screen/component không tự gọi `fetch` hoặc tạo một client song song khi đã có client chung. Client dùng `fetch` hay thư viện khác là quyết định riêng.
- Endpoint phải khớp OpenAPI/code backend được xác minh. Ví dụ `/lessons/:id` chỉ minh họa, không phải API đã tồn tại.
- Query key riêng tư phải có account identity và mọi bộ lọc ảnh hưởng kết quả. Public cache cần phân biệt locale/version nội dung khi có ảnh hưởng.
- Ví dụ key: `['progress', userId, courseId]`, `['lessons', courseId, { level, cursor }]`. Không đưa token hoặc dữ liệu bí mật vào key.
- Chỉ invalidate/update các key bị ảnh hưởng; không invalidate toàn bộ app cho mọi mutation.
- Loading trang đầu, refresh và tải trang tiếp theo là các trạng thái khác nhau. Giữ dữ liệu hiện có khi lỗi trang tiếp theo và cho retry đúng phần lỗi.
- Phân trang theo contract server, giới hạn kích thước trang và loại trùng theo ID ổn định nếu cần ghép các trang.

## 3. Mutation và kết quả không chắc chắn

- Chặn submit lặp khi đang pending; tác vụ ghi phải có cơ chế xử lý lỗi và trạng thái hoàn tất rõ ràng.
- Không tự retry thao tác không idempotent. Nếu backend hỗ trợ idempotency key, dùng đúng contract và giữ cùng key cho lần retry tương ứng.
- Timeout hoặc mất mạng sau khi gửi không chứng minh server chưa ghi. Kiểm tra lại kết quả hoặc dùng cơ chế đối soát được backend hỗ trợ.
- Giữ draft khi lỗi có thể sửa/retry. Chỉ xóa draft và điều hướng sau khi có xác nhận thành công phù hợp.
- Optimistic update chỉ dùng khi có rollback, xử lý request cạnh tranh và quy tắc quyền rõ ràng; không tự giả lập thành công cho việc nộp bài/ghi tiến độ.

## 4. Session và tài khoản

- Provider auth, vị trí lưu token, API login/refresh/logout và thời hạn session là quyết định còn mở; mobile không tự chọn Firebase hoặc một TTL từ mẫu.
- Sau khi có refresh contract, chỉ một thành phần sở hữu refresh; các request đồng thời dùng chung một lần refresh đang chạy.
- Retry auth có giới hạn theo contract; không lặp refresh vô hạn và không refresh response public chỉ vì cùng nhận status lỗi.
- Logout hoặc đăng nhập tài khoản mới phải ngăn request cũ ghi lại session/cache của tài khoản trước. Dùng hủy request và account generation nếu cần.
- Dọn cache và dữ liệu persist riêng tư theo chính sách tài khoản. Không hiển thị dữ liệu cũ trong khi tài khoản mới đang tải.
- Không dùng thời gian trên thiết bị làm nguồn quyết định quyền truy cập; backend là nguồn xác thực và phân quyền.
- Mật khẩu không nằm trong query cache, persisted store, route params, log hoặc analytics.

## 5. Route params, form và draft

- Route mang ID và tham số nhỏ đã validate; không truyền toàn bộ bài học, session, URL có chữ ký hoặc object store.
- Form sở hữu draft local; tách giá trị nhập với dữ liệu server để refetch không ghi đè nội dung người dùng đang sửa.
- Nếu rời màn làm mất bài làm, định nghĩa rõ cảnh báo/khôi phục. Persist draft phải có owner, version, hạn lưu và cơ chế xóa.
- Phân biệt `undefined` (không đổi field) với `null` (xóa nếu contract cho phép).

## 6. Dữ liệu học tiếng Nhật

Các ví dụ sau là invariant cần chốt theo sản phẩm, chưa phải tính năng đã có:

- Chấm điểm, hoàn thành bài và lịch ôn chính thức do backend xác nhận; state UI không được tự ghi quyền hoặc điểm thưởng.
- Không bỏ dấu, biến đổi kana/kanji hoặc ép lowercase đáp án một cách chung chung. Quy tắc chấp nhận đáp án/romaji phải được xác định theo bài tập.
- Mỗi lượt học/nộp đáp án cần định danh ổn định nếu retry có thể ghi trùng tiến độ.
- Ngày học, streak và lịch ôn phải có quy tắc timezone; không tự tăng streak bằng đồng hồ thiết bị.
- Tách nội dung public của khóa học với tiến độ cá nhân. Chỉ persist nội dung/audio có quyền lưu và chính sách cập nhật rõ ràng.

## 7. Lỗi, cấu hình và bảo mật

Contract lỗi backend đã quy định gồm `code`, `message`, `details`, `requestId`; đối chiếu [HTTP pipeline](../../backend/structure/HTTP_PIPELINE.md) khi tích hợp. Giữ status/code/requestId để xử lý, nhưng UI dùng thông báo an toàn được bản địa hóa, không render tùy ý `Error.message` từ SDK.

Cấu hình public đi qua `src/config/env.ts`. Không đưa database URL, JWT signing secret hoặc credentials S3 vào bundle. File/audio riêng tư truy cập qua contract backend được duyệt; không gửi storage key hoặc signed URL vào log.

## 8. Kiểm chứng

Test query keys, phân trang, invalidation, submit lặp, kết quả ghi không chắc chắn, account switching và request đến muộn. Nếu có persist/offline, test restore, hết hạn, đổi schema và xóa dữ liệu theo tài khoản. Không gọi API thật hoặc đọc env thật từ test mặc định.
