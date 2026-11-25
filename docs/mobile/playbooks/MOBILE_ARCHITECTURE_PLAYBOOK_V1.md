# Playbook kiến trúc mobile NihongoHub — V1

> Đối tượng: lập trình viên mobile, thiết kế, QA, reviewer và AI.
> Cập nhật: 2026-11-23.
> Trạng thái: bộ hướng dẫn nền; chưa khởi tạo ứng dụng mobile.

Điều chỉnh từ mẫu mobile architecture playbook của Daune. Giữ cách phân chia ownership và quy trình triển khai, thay các route/contract bản đồ, địa điểm và provider riêng bằng ví dụ học tiếng Nhật. [Structure guide](../structure/README.md) là nguồn quy ước kỹ thuật; playbook này mô tả cách thực hiện một thay đổi có thể kiểm tra lại.

## 1. Cách đọc và hiện trạng được xác minh

| Nhãn | Ý nghĩa |
| --- | --- |
| Hiện trạng | Có bằng chứng từ file, cấu hình hoặc kiểm tra thực tế trong NihongoHub |
| Đề xuất | Hướng thiết kế chưa triển khai; không tự cho phép cài dependency |
| Cần quyết định | Thiếu lựa chọn sản phẩm, contract hoặc nền tảng để triển khai |
| Ngoài phạm vi | Không làm trong task hiện tại |

Snapshot khi thêm bộ tài liệu:

| Phần | Hiện trạng |
| --- | --- |
| Repository | Có backend và [tài liệu backend](../../backend/README.md) |
| Mobile | Chỉ có `AGENTS.md` và README hướng dẫn |
| Runtime/SDK | Chưa có manifest/lockfile; chưa chọn phiên bản Expo, React Native hoặc React |
| Navigation | Chưa có route, application scheme, app link hoặc navigator |
| API/session | Chưa có mobile client, auth provider, storage adapter hoặc cache |
| UI | Đã chọn định hướng xanh dương/nền sáng trong tài liệu; chưa có token/component chạy được |
| Test/build | Chưa có scripts hoặc test runner mobile; chưa có EAS project/build profiles |

Cập nhật bảng này sau mỗi thay đổi nền bằng bằng chứng thực tế. Không chuyển một mục thành “đã xong” chỉ vì thêm hướng dẫn hoặc cài thư viện.

## 2. Mục tiêu và invariant sản phẩm

NihongoHub hướng tới học tiếng Nhật. Các feature ví dụ là bài học, từ vựng/bộ từ, ôn tập và tiến độ; chưa chốt danh sách màn hoặc tab.

- Nội dung khóa học và dữ liệu tiến độ cá nhân có quyền truy cập khác nhau; route phía client không thay thế phân quyền backend.
- Backend xác nhận điểm, hoàn thành bài, lịch ôn và quyền sở hữu theo contract. Mobile không tự cấp trạng thái hoàn thành hoặc phần thưởng.
- Lưu một từ vào bộ từ không tự hoàn thành bài học hoặc nộp đáp án.
- Nội dung do người học tạo, lịch sử học, đáp án đang làm và credentials riêng tư mặc định.
- Quy tắc đáp án kana/kanji/romaji, dấu câu và biến thể đúng phải được thống nhất; không áp dụng một hàm normalize tùy tiện cho mọi loại câu hỏi.
- Chỉ thêm offline, recording, thông báo, analytics hoặc subscription khi có task và chính sách dữ liệu tương ứng.

## 3. Cấu trúc và chiều dependency đề xuất

```text
Route trong app/
  gọi screen thuộc features/<domain>/
  screen dùng hooks và UI components
  feature API dùng lib/api/
  lib/api/ dùng config/env.ts
```

Route không chứa API client hoặc nghiệp vụ. `components/ui/` và `common/` không import feature; `lib/api/` không import screen/store domain. Feature khác chỉ gọi public contract có phạm vi, không deep import state hoặc API nội bộ.

Đọc [FOLDER_STRUCTURE.md](../structure/FOLDER_STRUCTURE.md) trước khi tạo file. Không tạo cả cây feature rỗng. Feature nhỏ có thể giữ flat tới khi các nhóm `api`, `hooks`, `components`, `types` thực sự cần thiết.

## 4. Navigation và deep link

Expo Router là hướng tham khảo, chưa được cài. Khi khởi tạo:

1. Chốt route map theo sản phẩm, public/authenticated boundary và back behavior.
2. Giữ params nhỏ và validate ID/filter; không mang session hoặc object bài học qua route.
3. Xác định redirect sau đăng nhập và tránh vòng lặp giữa restore session, route guard và màn lỗi.
4. Chốt custom scheme/app links, domain và fallback trước khi thiết lập native association.
5. Kiểm tra mở lạnh, mở nóng, back và route không hợp lệ trên nền tảng liên quan.

Không copy số tab, tên route, deep-link domain hoặc scheme của dự án mẫu.

## 5. API, identity và state

Đọc [STATE_AND_DATA.md](../structure/STATE_AND_DATA.md) và contract backend thực tế trước khi thêm request.

- Cấu hình public qua một module env; transport chung xử lý timeout/header/error shape, feature xử lý mapping và query key.
- Query/cache server và local UI state có owner riêng; không persist query riêng tư vì tiện.
- Account ID là một phần cache key riêng tư; logout/đổi account phải xử lý request đến muộn.
- Provider auth, token storage và refresh endpoint chưa được chọn. Nếu có refresh, một owner giữ single-flight và retry có giới hạn.
- Error response theo contract backend: `code`, `message`, `details`, `requestId`; UI dùng thông báo an toàn đã bản địa hóa.
- Không lấy ví dụ endpoint trong tài liệu làm bằng chứng API tồn tại. Xác minh path, method, input, auth, status và schema thành công/lỗi.
- Mất kết nối khi ghi có thể tạo kết quả không chắc chắn. Không tự gửi lại thao tác không idempotent hoặc tự thông báo thất bại chắc chắn.

## 6. Nội dung học, audio và lưu cục bộ

Các khả năng này cần task và contract riêng:

| Khả năng | Điều phải chốt |
| --- | --- |
| Bài học/flashcard | Nguồn nội dung, version, quyền xem và cấu trúc câu hỏi |
| Luyện nghe | Owner player, pause/resume, rời màn, gián đoạn và xử lý audio lỗi |
| Ghi âm phát âm | Mục đích, permission, consent, nơi xử lý, retention và xóa dữ liệu |
| Offline | Nội dung nào được lưu, giới hạn dung lượng, version, account isolation và đồng bộ |
| Tiến độ/streak | Nguồn xác nhận backend, timezone, retry và chống ghi trùng |

Không yêu cầu quyền microphone, camera hoặc file khi người dùng chưa bắt đầu hành động cần nó. Không embed credentials object storage trong app; dữ liệu riêng tư truy cập qua contract backend được duyệt.

## 7. Design system và accessibility

Theo [UI_SYSTEM.md](../structure/UI_SYSTEM.md), [SCREEN_DESIGN.md](../structure/SCREEN_DESIGN.md) và [COLOR_SYSTEM.md](../design/COLOR_SYSTEM.md).

- Primary xanh dương, nền sáng; button hỗ trợ dùng surface trung lập, không một màu thương hiệu mới cho từng feature.
- Xây token và primitive dùng chung trong task nền; sau đó tái sử dụng qua variant.
- React Native Reusables và NativeWind/Tailwind cần duyệt package/config cụ thể, không được coi là đã cài.
- Kiểm tra glyph Nhật, furigana nếu có, font scaling, text dài, safe area, bàn phím và screen reader.
- Đúng/sai có text/icon hoặc tín hiệu đọc được; không chỉ dùng màu. Motion có phương án reduced motion.
- Chốt localization trước khi mở rộng UI copy; locale giao diện không quyết định cách chấm đáp án tiếng Nhật.

## 8. Quy trình triển khai một feature

Ví dụ dưới đây là một loại task, không phải yêu cầu triển khai màn bài học ngay.

### Bước A — Xác định vertical slice

Chốt hành động người dùng, điểm vào route, feature sở hữu, public interface, dữ liệu đọc/ghi, trạng thái lỗi và tiêu chí hoàn thành. Giới hạn một luồng có thể review, chẳng hạn mở một bài học và xử lý loading/not-found, trước khi mở rộng sang nộp bài hoặc offline.

### Bước B — Khảo sát và lập plan

Đọc [mobile/AGENTS.md](../../../mobile/AGENTS.md), tài liệu theo task và package thực tế nếu đã có. Ghi file dự kiến, luồng dữ liệu/nhánh lỗi, dependency cần đổi, test và điều kiện hoàn thành. Xin duyệt task cụ thể; danh sách task tổng quan không tự cho phép làm mọi phần.

### Bước C — Chuẩn bị nền cần thiết

Chỉ thêm phần cần cho slice: route/screen shell, token, API seam hoặc provider được duyệt. Không cài cả danh sách công nghệ tham khảo. Nếu nền chưa đủ, trình bày rõ task nền, phiên bản và lệnh trước khi triển khai.

### Bước D — Contract và dữ liệu

Xác minh API, tạo kiểu DTO/domain cần thiết và mapping thuộc feature. Xác định query keys, phân trang, mutation/invalidation, auth, account race và retry. Fixture chỉ dùng trong test/demo có lựa chọn rõ ràng, không tự trở thành fallback của lỗi production.

### Bước E — UI và tương tác

Ghép screen bằng component đã có; tách section có trách nhiệm thật. Tạo loading/empty/error/pending và hành động retry. Chọn token/typography phù hợp với nội dung Nhật; kiểm tra back, keyboard và safe area theo phạm vi.

### Bước F — Kiểm thử

Theo [TESTING.md](../structure/TESTING.md): unit test cho domain thuần, integration test cho adapter/cache/screen behavior. Test đúng interface/public behavior; không gọi private method. Nếu thay đổi native/permission/audio, cần runtime/device evidence tương ứng.

### Bước G — Check và tài liệu

Chạy scripts typecheck, lint, test và build/doctor phù hợp với nền đã có. Đọc output đầy đủ, xử lý lỗi thuộc task và báo rõ phần chưa kiểm chứng. Cập nhật snapshot, structure/design và playbook bị ảnh hưởng; không để hướng dẫn active mô tả cách cũ.

### Bước H — Bàn giao

Ghi thay đổi, kết quả check và giới hạn. Commit, push, publish, migration và deploy chỉ thực hiện khi người dùng yêu cầu rõ ràng. Approval code không tự cho phép phát hành app hoặc gửi dữ liệu tới dịch vụ thật.

## 9. Checklist kiểm chứng

- Ownership đúng, không dependency vòng hoặc feature deep import.
- Route mỏng; component nền không gọi API/store domain.
- Source-of-truth rõ; không copy server cache sang global store.
- Không có credentials, token thật, signed URL hoặc dữ liệu riêng tư trong code/log/fixture.
- API errors được chuẩn hóa; thông báo không lộ dữ liệu nội bộ.
- Submit lặp, retry và kết quả ghi chưa rõ được xử lý theo contract.
- Token màu được dùng nhất quán; font Nhật, text dài và accessibility đã review theo phạm vi.
- Unit/integration test và các check phù hợp có kết quả mới.
- Nếu chỉ thêm tài liệu, kiểm tra link, đường dẫn và nhãn hiện trạng; không báo test app chưa tồn tại đã pass.

## 10. Hiệu năng và độ tin cậy

Đo trước khi tối ưu. Giới hạn page size, dùng list ảo hóa cho nội dung dài, tránh fetch toàn khóa học chỉ để render một màn. Không tạo audio player, query client hoặc store mới ở mỗi render. Cache/preload nội dung chỉ khi có nhu cầu, giới hạn và quyền sử dụng rõ ràng.

Phân biệt lỗi trang đầu với tải thêm, lỗi mạng với quyền truy cập và lỗi ghi chắc chắn với kết quả chưa xác định. Không che lỗi bằng demo hoặc dữ liệu đã stale mà không thông báo.

## 11. Build và phát hành

Hiện chưa có EAS/native project. Trước release phải chốt application ID, owner tài khoản, signing, platform, build profiles, môi trường, version và phân phối. Development build hay Expo Go phụ thuộc bộ native module thực tế.

OTA/update cần quy tắc runtime compatibility, channel và rollback được duyệt; không dùng để thay đổi native capability không tương thích hoặc né quy trình phát hành. Ghi bằng chứng trên binary/build được chọn, không suy từ Metro chạy được sang release đã sẵn sàng.

## 12. Bảo mật và quyền riêng tư

Client là môi trường không đáng tin cậy. Backend kiểm tra credential và quyền sở hữu cho dữ liệu riêng tư. Public env là dữ liệu nằm trong bundle, không phải secret store.

Trước khi thêm analytics, auth provider, recording hoặc storage, xác định mục đích, dữ liệu tối thiểu, consent khi cần, retention và cách xóa. Không mặc định thu thập đáp án, audio hoặc lịch sử học chi tiết để debug.

## 13. Quyết định còn mở

| Quyết định | Trạng thái |
| --- | --- |
| Expo/React Native/React và Node | Cần chọn phiên bản tương thích khi scaffold |
| Package manager và lockfile | Chưa chọn |
| Route/tab map, app links, scheme | Cần quyết định sản phẩm và platform |
| UI primitives và styling | Đề xuất React Native Reusables/NativeWind; chưa duyệt bộ package |
| Server state/shared state | Đề xuất TanStack Query và Zustand khi cần; chưa triển khai |
| Localization và font | Chưa chọn locale, thư viện hoặc font Nhật |
| API auth/session và secure storage | Chưa có contract mobile được xác minh |
| Test runner/component testing | Cần chọn theo runtime; ưu tiên unit/integration |
| Offline/audio/recording/push notification | Chỉ triển khai theo use case riêng được duyệt |
| Native build, signing, EAS/update/release | Chưa cấu hình |

## 14. Tài liệu để đối chiếu

Nguồn nội bộ bắt đầu tại [Mobile documentation](../README.md) và [mục lục toàn dự án](../../README.md). Khi đã chọn SDK, mở tài liệu chính thức đúng phiên bản; không giữ số phiên bản của dự án mẫu làm mặc định.

- [Expo](https://docs.expo.dev/) và [chỉ mục tài liệu cho AI](https://docs.expo.dev/llms.txt).
- [React Native](https://reactnative.dev/docs/getting-started).
- [Expo Router](https://docs.expo.dev/router/introduction/).
- [React Native Reusables](https://reactnativereusables.com/docs).
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview).
- [Zustand](https://zustand.docs.pmnd.rs/).

Các nguồn này là nơi tra cứu, không phải quyền cài package hoặc bằng chứng chúng đã được tích hợp.
