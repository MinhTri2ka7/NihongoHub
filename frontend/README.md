# NihongoHub Frontend

## Hiện trạng

Ngày 2026-11-25: triển khai Next.js App Router, trang chủ và auth tiếng Việt theo yêu cầu hiện đại, trắng/than đậm với điểm nhấn đỏ cam, chữ lớn và mô tả gọn, góc bo 3px, responsive. API trực tiếp, Zustand global chỉ giữ User/trạng thái, access token ở closure bộ nhớ, refresh bằng cookie HttpOnly. Đọc [AGENTS.md](AGENTS.md) trước khi làm việc.

Backend auth/user hiện chỉ có thiết kế, chưa có endpoint thực. Frontend không giả đăng nhập, gửi mail hoặc đổi mật khẩu thành công. UI chạy độc lập; chức năng tài khoản cần backend theo [contract auth](src/features/auth/README.md).

## Cấu trúc và route

- `/`: trang giới thiệu và liên kết đến auth.
- `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`: form với lỗi/loading/thành công, thiếu/hết flow OTP.
- `src/app`: routing/layout; `features/auth`: nghiệp vụ, schema, hook, service và helper server-only.
- `src/stores/auth.store.ts`: store chung không credential/persist; `src/types/user.ts`: User chung.
- `src/components`: UI/layout/shared qua props; `src/lib`: Axios không import feature.
- `src/config`: URL API; `src/styles`: CSS; `public`: favicon vector nội bộ.
- course/user/vocabulary/quiz và dashboard/profile vẫn là khung, chưa có implementation.

## Chạy

Node.js 24 để chạy trực tiếp TypeScript trong test; npm 11. Next yêu cầu Node >=20.9 nhưng dùng Node 24 cho toàn bộ lệnh để đồng nhất.

```sh
cd frontend
npm ci
npm run dev
```

Mở http://127.0.0.1:3000. Chưa cấu hình API vẫn xem được giao diện. Khi backend sẵn sàng, tạo `.env.local` từ [.env.example](.env.example), đặt NEXT_PUBLIC_API_URL đúng base URL thực và khởi động lại dev server. Không tự thêm prefix /api/v1. API_URL là override server cho helper nhận token tường minh, không phải BFF hoặc cơ chế tự lấy phiên SSR.

Không đưa secret vào NEXT_PUBLIC hoặc dùng khóa JWT backend ở frontend. CORS/cookie/CSRF, DTO và policy mật khẩu cần đối chiếu lại khi ghép backend.

## Dependency

Phiên bản chính xác tại [package.json](package.json) và [package-lock.json](package-lock.json): Axios 1.21.1, Next 16.4.6, React/React DOM 19.3.1, Zod 4.6.7, Zustand 5.1.0, server-only 0.0.1, TypeScript 5.9.3, ESLint 10.15.0, eslint-config-next 16.4.6, type Node 24/React 19 tương ứng. Không thêm UI kit, font CDN hoặc thư viện form.

`src/types/web-platform.d.ts` bổ sung hai tên URLPattern mà Next 16.4 tham chiếu nhưng DOM TypeScript 5.9 chưa có, dựa trên type Node 24. ESNext lib cung cấp PromiseWithResolvers. Giữ strict và skipLibCheck false; không bỏ qua lỗi type thư viện.

Next dev bổ sung block hướng dẫn framework vào AGENTS.md; giữ block này cùng quy tắc frontend. Các file sinh trong .next được gitignore.

Next 16.4.6 trên Windows có thể nạp trùng LayoutProps khi cùng glob cả type dev và build. Cấu hình bật experimental.strictRouteTypes: route validator đang hoạt động được import qua next-env.d.ts, không glob đồng thời hai cây .next. Vẫn kiểm tra route, strict và thư viện; không bật skipLibCheck. Đây là tùy chọn experimental cần đối chiếu lại khi nâng Next.

## Kiểm chứng

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Test dùng Node test runner và adapter giả, không HTTP/email thật. Đọc [auth README](src/features/auth/README.md) về giới hạn SSR, refresh nhiều tab và contract còn cần xác nhận. Build thành công không đồng nghĩa backend auth hoạt động.

Kết quả ngày 2026-11-25, Node 24.18.0:

- npm run typecheck: pass.
- npm run lint: pass, không warning.
- npm test: 8/8 pass, bao gồm Zod, store không credential, payload register/verify/reset, refresh đồng thời/response cũ, retry giới hạn, logout khi đang refresh và cancellation.
- npm run build: pass, tạo trang chủ và đủ 5 route auth, kèm 404.
- Browser QA: desktop 1366px và mobile 390px; không tràn ngang, validation login/register/forgot, toggle mật khẩu, lỗi API chưa cấu hình, verify/reset thiếu flow và điều hướng trang chủ.
- Liên kết Markdown nội bộ và manifest/lockfile: pass. Chưa kiểm chứng cookie, CORS/CSRF, gửi email hoặc auth với backend thật.

Lần chỉnh giao diện tiếp theo trong ngày: chuyển trắng/than đậm/đỏ cam, bỏ tagline và phần lớn caption/mô tả, form chữ lớn, minh họa thẻ kana; mobile ưu tiên form. Đã pass typecheck, lint, build và kiểm tra browser 1366px/390px, validation form trống, điều hướng đăng ký và không tràn ngang. Không thay contract API, store, hook hoặc dependency; không thêm test logic cho thay đổi trình bày.

Theo yêu cầu hiển thị rộng hơn: auth đã phủ toàn viewport, form tăng từ 380px lên 440px. Browser xác nhận main x=0/y=0/1440×920 ở desktop và không tràn ngang ở 390px; lint pass. Chỉ chỉnh CSS và tài liệu, không thay auth logic.

Form sau phản hồi tiếp theo đã tăng đến 560px, input/nút 68px desktop, 60px mobile; browser xác nhận không tràn ngang.

## Sửa lỗi auth sau review

Theo yêu cầu sửa hai phát hiện: thêm controller độc lập React, queue thao tác cookie trong một tab không mất khi clear state, và trạng thái profile-pending cho phép tải lại hồ sơ sau login/verify mà không gửi lại OTP đã dùng. use-auth chỉ đọc global store và gọi controller. Không thêm dependency; không sửa backend.

Regression test chạy controller thật với service/cookie giả: 18/18 test pass, typecheck, lint và production build pass. Xác nhận cookie thật/CORS/CSRF vẫn cần backend hiện chưa có endpoint; queue không điều phối nhiều tab hoặc thiết bị.
