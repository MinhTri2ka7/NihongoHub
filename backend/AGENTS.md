# AGENTS.md

## Quy tắc làm việc với backend

Các quy tắc dưới đây áp dụng cho toàn bộ thư mục `backend/`. Đây là quy ước của
dự án; đọc cùng với các hướng dẫn NestJS và Observe ở cuối file.

### 1. Đọc tài liệu trước khi code

- Trước mỗi lần làm việc với một module backend, đọc lại `README.md` trong thư mục module đó theo [quy tắc chung](../docs/ai-rules/README.md#đọc-readme-của-module-trước-khi-làm-việc); áp dụng cả khi khảo sát, đề xuất hoặc sửa test và khi task ảnh hưởng nhiều module.
- Trước khi đề xuất triển khai, đọc `AGENTS.md`, tài liệu kiến trúc, cấu hình và
  code liên quan đến task; xác định phiên bản package thực tế trong dự án.
- Đọc tài liệu chính thức tương ứng với phiên bản đang dùng trước khi sử dụng
  API của framework hoặc thư viện. Ưu tiên package first-party của NestJS.
- Trước mỗi lần viết/sửa code backend, bắt buộc đọc lại
  [docs/backend/README.md](../docs/backend/README.md), kể cả khi đã đọc ở task trước.
  Đây là điểm bắt đầu mô tả cấu trúc hiện tại, ranh giới trách nhiệm và kiểm tra bắt buộc.
- Từ README đó, đọc các tài liệu liên quan trong
  [docs/backend/structure/](../docs/backend/structure/README.md) trước khi triển khai;
  phân biệt quy ước mục tiêu với những gì code hiện tại đã hỗ trợ.
- Không tự suy diễn nội dung của tài liệu chưa được cung cấp. Nếu thiếu tài liệu
  ảnh hưởng đến quyết định triển khai, nêu phần chưa rõ trong đề xuất trước khi code.

### 2. Phân chia trách nhiệm — Separation of Concerns

Luồng nghiệp vụ HTTP phải theo cấu trúc:

```text
Controller → Service → Repository → Database
```

- **Controller**: khai báo route, nhận và validate input, gọi service, khai báo
  response/Swagger. Không chứa nghiệp vụ, SQL hoặc gọi Drizzle trực tiếp.
- **Service**: điều phối use case, xử lý quy tắc nghiệp vụ, gọi repository và
  ném NestJS exception phù hợp. Không phụ thuộc `Request`/`Response` của Express.
- **Repository**: truy vấn và ghi dữ liệu bằng Drizzle, xử lý phần persistence.
  Không quyết định HTTP response, không trả `Request`/`Response`, không điều phối
  nghiệp vụ. Repository trả dữ liệu/kết quả truy vấn để service quyết định hành vi.
- **Module**: đăng ký controller/provider, khai báo imports/exports và ranh giới
  dependency; không đặt logic nghiệp vụ trong file module.
- **DTO/schema**: định nghĩa và kiểm tra hợp đồng input/output của từng module;
  không dùng trực tiếp schema bảng DB làm hợp đồng public API nếu chưa chọn rõ
  các trường được phép nhận hoặc trả về.
- **Infrastructure**: kết nối database và các tích hợp kỹ thuật. Các kiểm tra
  kết nối như `SELECT 1` thuộc infrastructure, không phải repository nghiệp vụ.
- **Bootstrap/config**: thiết lập ứng dụng khi khởi động và cấu hình đã validate.
  Code ứng dụng import `envConfig` từ `src/config/env.config.ts`; việc đọc env trực tiếp chỉ nằm
  trong lớp config dùng chung, kể cả cấu hình CLI.

Cấu trúc module nghiệp vụ:

```text
src/modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
└── dto/ hoặc schemas/
```

### 3. Quyền sở hữu module và vị trí test

- Function, service và repository phục vụ module nào phải nằm trong module đó.
  Không tự chuyển chúng vào `common/` chỉ vì muốn tái sử dụng hoặc làm file ngắn hơn.
- `common/` chỉ chứa thành phần kỹ thuật dùng chung, không phụ thuộc module nghiệp
  vụ, ví dụ filter, middleware, decorator và danh sách `ErrorCode`.
- Khi cần dùng nghiệp vụ của module khác, trao đổi qua service/API được module đó
  export. Không import repository nội bộ của module khác, không tự tạo dependency
  vòng; đề xuất thay đổi ranh giới module để người dùng xác nhận nếu cần.
- Test mới đặt dưới `test/src/`, đối xứng đường dẫn với code trong `src/`:

```text
src/modules/<feature>/<feature>.service.ts
test/src/modules/<feature>/<feature>.service.spec.ts

src/modules/<feature>/<feature>.repository.ts
test/src/modules/<feature>/<feature>.repository.spec.ts

src/common/filters/http-exception.filter.ts
test/src/common/filters/http-exception.filter.spec.ts
```

- Với integration test theo module, giữ cùng thư mục đối xứng và đặt tên thể hiện
  loại test, ví dụ `test/src/modules/<feature>/<feature>.integration.spec.ts`.
- Test hạ tầng/config cũng theo cùng quy tắc đối xứng. Dùng Vitest và `vi.fn()`.
- Khi chạm vào test cũ đặt cạnh source, di chuyển test liên quan sang vị trí đối
  xứng nếu nằm trong phạm vi đã duyệt; không tự di chuyển toàn bộ test ngoài task.
- Đảm bảo cấu hình test tìm đúng file mới và không chạy trùng cùng một test.

### 4. Xử lý DomainError — Touch-to-Migrate

Mục tiêu là chuyển dần error handling cũ sang NestJS exception khi chỉnh sửa code
liên quan, giữ phạm vi thay đổi rõ ràng.

- Code mới không tạo hoặc ném `DomainError` mới và không bổ sung error handler
  cũ. Service dùng exception có sẵn của NestJS như `BadRequestException`,
  `NotFoundException`, `ConflictException`, `UnauthorizedException`.
- Khi task chạm vào function đang dùng `DomainError`, chuyển phần xử lý lỗi của
  function/luồng liên quan sang NestJS exception trong phạm vi đã thống nhất.
  Không thực hiện migration hàng loạt ở những module không liên quan.
- Giữ đúng ý nghĩa lỗi, HTTP status và mã lỗi nghiệp vụ. Không đổi tất cả lỗi
  thành `BadRequestException`, không catch rồi bỏ qua hoặc trả kết quả thành công.
- Lấy mã lỗi từ `src/common/errors/error-code.ts`; không rải string mã lỗi trong
  controller/service/repository. Ví dụ tại service:

```ts
throw new NotFoundException('Không tìm thấy người dùng', {
  errorCode: ErrorCode.USER_NOT_FOUND,
});
```

- Repository không chuyển mọi lỗi database thành HTTP exception. Service chỉ
  chuyển những lỗi đã nhận diện rõ sang lỗi nghiệp vụ tương ứng; lỗi ngoài dự
  kiến được chuyển tiếp tới global exception filter.
- Không bọc lại một NestJS exception đã có chỉ để thay đổi message hoặc làm mất
  `errorCode`/nguyên nhân gốc. Nếu cần wrap lỗi, giữ nguyên nhân trong `cause`
  nhưng không đưa chi tiết nội bộ vào response.
- Bổ sung/cập nhật test cho status, `code` và hợp đồng lỗi của luồng được migrate.
  Nếu hợp đồng cũ không khớp quy ước mới, nêu xung đột và chờ người dùng quyết định.

### 5. Bảo mật dữ liệu trong log và response

- Không ghi giá trị env, toàn bộ config, mật khẩu, secret, access/refresh token,
  API key, cookie hoặc authorization header vào log hay response.
- Không ghi/trả URL kết nối DB, URL nội bộ, URL upstream đầy đủ, signed URL,
  query string chứa dữ liệu hoặc thông tin xác thực. Không log raw request URL.
- Log request chỉ dùng route template/path đã kiểm tra và loại bỏ dữ liệu nhạy
  cảm. Không coi việc bỏ query string là đủ nếu token/secret nằm trong path.
- Không log toàn bộ request/response body hoặc object lỗi từ thư viện khi chưa
  lọc dữ liệu; stack trace và chuỗi `cause` cũng phải được rà soát/redact trước
  khi ghi vì chúng có thể chứa SQL, tham số, URL hoặc credentials.
- Áp dụng các yêu cầu trên cho cả exception filter, request middleware và log
  service, kể cả khi chính thao tác ghi log bị lỗi. Không dùng raw path trong log
  hoặc response lỗi; dùng route template đã kiểm tra và giá trị thay thế an toàn
  khi chưa xác định được route. Không ghi trực tiếp stack/cause chưa lọc.
- Response lỗi dùng HTTP status, mã `ErrorCode`, message an toàn và `request_id`.
  Không trả stack trace, SQL, tham số truy vấn hoặc lỗi gốc của DB/upstream.
- Response thành công chỉ trả các trường được cho phép; không trả nguyên bản
  user record nếu chứa password hash, token hoặc trường nội bộ.
- Dùng `request_id` để liên kết log với request. File env thật không được commit;
  `.env.example` chỉ chứa giá trị mẫu không có bí mật thật.

### 6. Kiểm tra trước khi hoàn thành task code

Chạy trong thư mục `backend/` và kiểm tra kết quả thực tế:

```bash
npm run typecheck
npm run test
npm run lint
```

- Chạy thêm `npm run build` và integration test khi thay đổi
  ảnh hưởng bootstrap, HTTP, database, dependency hoặc cấu hình build/test.
- Viết/cập nhật test cho hành vi thay đổi, lỗi dự kiến và lỗi ngoài dự kiến phù
  hợp phạm vi; không chỉ kiểm tra code triển khai giống chính nó.
- Nếu script `typecheck` hoặc check cần thiết chưa tồn tại, báo rõ và đề xuất bổ
  sung trong kế hoạch; đưa việc thiết lập check bắt buộc còn thiếu vào task code
  đầu tiên, không để đến task cuối mới bổ sung. Không tự coi check là đạt, không
  bỏ qua lỗi sẵn có mà không báo; chỉ thay đổi script/config sau khi phạm vi code
  đã được người dùng duyệt.
- Khi có lỗi, sửa lỗi thuộc phạm vi task và chạy lại check liên quan. Nếu bị
  chặn bởi môi trường hoặc lỗi ngoài phạm vi, nêu chính xác check chưa chạy/chưa
  đạt, lý do và ảnh hưởng; không tuyên bố hoàn thành kiểm chứng khi chưa đạt.
- Khi bàn giao, ghi ngắn gọn những gì đã đổi, các check đã chạy và hạn chế còn lại.

### 7. Lập plan có sơ đồ, chia task và xác nhận từng bước trước khi code

- Trước khi viết/sửa code, test, dependency hoặc cấu hình chạy/build, phải lập
  **plan gồm sơ đồ luồng và phần mô tả triển khai**; không chỉ đưa sơ đồ riêng lẻ.
  Viết thiết kế vào README của module trước khi triển khai. Sơ đồ dùng Mermaid
  `sequenceDiagram` theo [quy tắc sơ đồ chung](../docs/ai-rules/README.md#viết-thiết-kế-vào-readme-trước-khi-triển-khai):
  các bên tham gia, lời gọi, phản hồi và nhánh lỗi theo thứ tự thời gian.
- Phần mô tả phải nêu mục tiêu, hiện trạng liên quan, cách triển khai, phạm vi và
  file dự kiến thay đổi, kết quả mong đợi, cách kiểm thử và tiêu chí hoàn thành.
- Sơ đồ phải thể hiện điểm vào, các lớp/module được gọi, dependency/tích hợp bên
  ngoài, luồng dữ liệu và nhánh lỗi chính.
- Nếu plan dài hoặc có nhiều phần, chia thành các task nhỏ theo thứ tự phụ thuộc.
  Trình bày danh sách task tổng quan; mỗi task có mục tiêu, phạm vi, sơ đồ liên
  quan, mô tả triển khai, kiểm thử và tiêu chí hoàn thành riêng.
- Mỗi task phải ghi rõ file dự kiến tạo/sửa/di chuyển, sơ đồ liên quan, tiêu chí
  hoàn thành và lệnh kiểm chứng cụ thể. Khi bàn giao task, ghi file thực tế đã đổi
  và kết quả từng lệnh; nêu rõ lệnh chưa chạy/chưa đạt cùng lý do.
- Với plan ngắn chỉ có một task, trình bày plan rồi **dừng và chờ người dùng xác
  nhận rõ ràng** trước khi sửa code. Không coi im lặng hoặc thời gian chờ là đồng ý.
- Với plan nhiều task, trình bày chi tiết và xin xác nhận **từng task**: chỉ làm
  task hiện tại sau khi được duyệt; hoàn thành, chạy kiểm tra và báo kết quả task
  đó, rồi mới trình bày/xin xác nhận task tiếp theo. Không tự triển khai nhiều
  task cùng lúc và không coi việc duyệt plan tổng quan là duyệt tất cả task.
- Nếu task hiện tại chưa đạt tiêu chí hoàn thành hoặc còn bị chặn, báo rõ vấn đề
  và thống nhất hướng xử lý trước khi chuyển sang task kế tiếp.
- Được đọc file, đọc tài liệu và kiểm tra hiện trạng để chuẩn bị đề xuất trước
  khi xác nhận; không cài package, chạy migration hoặc sửa file code trước đó.
- Nếu yêu cầu xung đột với kiến trúc, bảo mật, tài liệu, hành vi hệ thống hoặc
  có điểm đáng nghi ngờ, nêu lý do và phương án thay thế để phản biện với người
  dùng trước khi tự ý code.
- Nếu phát hiện cần đổi luồng hoặc mở rộng phạm vi sau khi đã duyệt, cập nhật
  plan, sơ đồ và task bị ảnh hưởng; chờ xác nhận lại phần thay đổi trước khi làm tiếp.
- Quy tắc này áp dụng cho task code; yêu cầu chỉ đọc/review/giải thích hoặc chỉ
  chỉnh tài liệu theo nội dung người dùng đã chỉ định không cần duyệt plan code.

### 8. Đặt tên file, function và phương thức đúng mục đích

- Tên phải thể hiện hành vi và đối tượng nghiệp vụ cụ thể, thống nhất ngôn ngữ
  với code hiện có; tránh tên mơ hồ như `handle`, `processData`, `doSomething`,
  `helper`, `utils` khi có thể đặt tên chính xác hơn.
- File dùng kebab-case và hậu tố đúng vai trò: `<feature>.controller.ts`,
  `<feature>.service.ts`, `<feature>.repository.ts`, `<name>.middleware.ts`,
  `<name>.filter.ts`; class dùng PascalCase, function/method dùng camelCase.
- Method dùng động từ thể hiện hành vi như `findById`, `createVocabulary`,
  `updateLessonProgress`; dùng `find...` khi có thể không tìm thấy và phân biệt
  rõ với method `...OrThrow` có hợp đồng ném lỗi.
- Không đặt tên method gây hiểu sai về side effect hoặc kiểu trả về; không đặt
  function nghiệp vụ vào file config, controller hoặc một file chung tùy tiện.
- Method HTTP phải khớp ý nghĩa thao tác: GET để đọc, POST để tạo/thực hiện action,
  PUT để thay thế, PATCH để cập nhật một phần, DELETE để xóa. Không dùng GET cho
  thao tác thay đổi trạng thái nghiệp vụ.
- Giữ đúng tên API/lifecycle do framework quy định, ví dụ `use`, `catch`,
  `onModuleInit`; không đổi chúng chỉ để tuân theo ví dụ đặt tên phía trên.

### 9. Code Quality & Style

- Viết code sạch, ngắn gọn, dễ đọc; ưu tiên giải pháp đơn giản thay vì kỹ thuật
  phức tạp hoặc cách viết khó hiểu.
- Function ngắn, tập trung một trách nhiệm; dùng tên rõ nghĩa, tránh tên quá ngắn
  hoặc chung chung.
- Tránh logic trùng lặp, abstraction, wrapper và dependency không cần thiết;
  chỉ tách thành phần khi giúp code rõ ràng hoặc phục vụ nhu cầu thực tế.
- Tuân theo cấu trúc, quy ước đặt tên và formatter hiện có. Giữ style/định dạng
  của file; không reformat code không liên quan đến task.
- Không thêm dòng trắng, ngắt dòng hoặc định dạng dài dòng không cần thiết;
  vẫn tuân theo formatter của dự án.
- Comment chỉ giải thích lý do, ràng buộc hoặc quyết định khó hiểu; không nhắc
  lại điều code đã thể hiện rõ.
- Chỉ thay đổi những gì task yêu cầu; không tự refactor, thêm chức năng hoặc
  tăng độ phức tạp ngoài phạm vi đã duyệt.

### 10. Xác nhận trước khi cài đặt hoặc thay đổi thư viện

- Trước khi cài thư viện/package, phải nêu tên, phiên bản dự kiến, mục đích,
  lý do dependency hiện có chưa đáp ứng và lệnh sẽ chạy; hỏi người dùng và chờ
  xác nhận rõ ràng trước khi thực hiện.
- Áp dụng cho dependency production/dev, công cụ CLI, cài global, cài lại và
  nâng/hạ phiên bản. Lệnh `npx`/`npm exec` có thể tải package chưa có cũng phải
  được duyệt; kiểm tra bằng công cụ đã cài với `--no-install` không cần xin lại.
- Không tự sửa manifest/lockfile để thêm hoặc đổi dependency trước khi được duyệt.
  Ưu tiên tận dụng thư viện hiện có và kiểm tra package first-party của NestJS.
- Plan phải liệt kê rõ dependency cần thay đổi. Duyệt task nói chung không thay
  cho duyệt cài package nếu danh sách chưa được nêu rõ. Nếu người dùng đã xác
  nhận cụ thể package và phạm vi thay đổi trong task hiện tại, không hỏi lại.
- Nếu phát sinh thêm package hoặc đổi phiên bản ngoài danh sách đã duyệt, giải
  thích nhu cầu và xin xác nhận bổ sung trước khi cài.

## NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

- Databases: [`@nestjs/typeorm`](https://docs.nestjs.com/data/typeorm.md), [`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle.md), [`@nestjs/mongoose`](https://docs.nestjs.com/data/mongodb.md), [`@nestjs/sequelize`](https://docs.nestjs.com/data/sequelize.md).
- OpenAPI: [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction.md). GraphQL: [`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start.md). WebSockets: [`@nestjs/websockets`](https://docs.nestjs.com/websockets/gateways.md). Microservices: [`@nestjs/microservices`](https://docs.nestjs.com/microservices/basics.md).
- Sign-in: [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication.md). Permissions: [`@nestjs/authorization`](https://docs.nestjs.com/security/authorization.md). Rate limiting: [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting.md).
- Configuration: [`@nestjs/config`](https://docs.nestjs.com/application/configuration.md). Caching: [`@nestjs/cache-manager`](https://docs.nestjs.com/data/caching.md). Health checks: [`@nestjs/terminus`](https://docs.nestjs.com/reliability/terminus.md). Events inside the app: [`@nestjs/event-emitter`](https://docs.nestjs.com/application/events.md).
- Email: [`@nestjs/mail`](https://docs.nestjs.com/application/mail.md). Files, S3 included: [`@nestjs/storage`](https://docs.nestjs.com/application/file-storage.md). Translations: [`@nestjs/i18n`](https://docs.nestjs.com/application/i18n.md).
- Retries, timeouts and circuit breakers: [`@nestjs/resilience`](https://docs.nestjs.com/reliability/resilience.md).
- Idempotency keys: [`@nestjs/idempotency`](https://docs.nestjs.com/reliability/idempotency.md). Transactional outbox: [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox.md). Sending and receiving webhooks: [`@nestjs/webhooks`](https://docs.nestjs.com/http/webhooks.md).
- Queues: [`@nestjs/bullmq`](https://docs.nestjs.com/application/queues.md). Scheduled jobs: [`@nestjs/schedule`](https://docs.nestjs.com/application/task-scheduling.md).
- Running a scheduled job on one instance, and locks: [`@nestjs/locks`](https://docs.nestjs.com/reliability/locks.md). Processes that take days: [`@nestjs/workflows`](https://docs.nestjs.com/reliability/workflows.md).
- Language models, tools and agents: [`@nestjs/ai`](https://docs.nestjs.com/ai/overview.md). MCP servers: [`@nestjs/mcp`](https://docs.nestjs.com/mcp/overview.md).

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: `StandardSchemaValidationPipe` with `@Body({ schema })` or `@Param('id', { schema })` (https://docs.nestjs.com/application/validation.md). `class-validator` still works, through `ValidationPipe`.

`NodeAdapter` from `@nestjs/platform-node` is the fastest HTTP adapter, ahead of Fastify (https://docs.nestjs.com/http/performance.md).

A route handler can return a web `Response`, a `ReadableStream` or an async generator, and Nest streams it as it's produced (https://docs.nestjs.com/http/streaming-responses.md).

Nest's packages are ESM only, and this project is ESM too: relative imports end in `.js`, `__dirname` doesn't exist (use `import.meta.dirname`), and tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`.

## Production data: NestJS Observe

This app reports its traces, errors, logs and metrics to [NestJS Observe](https://observe.nestjs.com) through `ObserveModule` in `src/app.module.ts`. Its key pair comes from `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in `.env`, which `npx @nestjs/observe link` writes.

When a task depends on how the app behaves in production - an error users hit, a slow endpoint, a failing job, whether a release made things worse - work from that data, not from the code alone:

- The Observe MCP server answers those questions directly: errors with their traces and logs, slow operations, jobs, and what a release changed (`find_regressions`, `diff_release`). It is included on the Pro plan and above. In Claude Code: `claude mcp add observe --transport http https://observe-api.nestjs.com/mcp`, and the client opens a browser to approve. Other clients: https://www.observe.nestjs.com/documentation/mcp
- Without it, the user can open the request or error in the Observe dashboard and click **Copy agent prompt**, which hands over that page's trace, stack and logs as text.
