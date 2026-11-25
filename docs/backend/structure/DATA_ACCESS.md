# Quy ước truy cập database

Đọc tài liệu này khi viết hoặc sửa Repository, truy vấn tìm kiếm, index và transaction. Áp dụng cùng [MODULE_DESIGN.md](./MODULE_DESIGN.md). Các quy tắc dưới đây là yêu cầu triển khai cho AI và lập trình viên, không khẳng định toàn bộ code hiện tại đã tuân thủ.

## 1. Phân chia trách nhiệm

- Repository nhận Drizzle database qua token DI `DATABASE`; không tự tạo connection hoặc pool riêng. Token cần được khai báo và đăng ký provider tại lớp hạ tầng trước khi sử dụng.
- Controller và DTO không import trực tiếp schema bảng.
- Service điều phối nghiệp vụ, không tự ghép SQL.
- Repository chỉ lấy những trường cần thiết, đặt tên field trả về phù hợp với nghiệp vụ.
- Truyền giá trị qua parameter của Drizzle; không nối input từ client vào chuỗi SQL hoặc đưa vào `sql.raw()`.
- Tên cột, hướng sắp xếp và toán tử động phải được ánh xạ từ danh sách cho phép; không dùng trực tiếp chuỗi client làm SQL identifier.

## 2. Viết truy vấn tìm kiếm và SELECT rõ ràng

- Xác định trước trường trả về, điều kiện lọc, phạm vi quyền truy cập, thứ tự và giới hạn kết quả.
- Dùng `.select({ ... })` liệt kê từng field. Không dùng `.select()` lấy toàn bộ cột hoặc lấy dư dữ liệu rồi loại bỏ ở Service.
- Lọc theo chủ sở hữu hoặc phạm vi được phép ngay trong truy vấn khi nghiệp vụ yêu cầu.
- Danh sách phải có giới hạn tối đa và thứ tự ổn định; thêm khóa duy nhất như `id` để phân định khi giá trị sắp xếp trùng nhau.
- Validate độ dài từ khóa, bộ lọc và kích thước trang trước khi truy vấn. Không để từ khóa rỗng vô tình biến thành truy vấn toàn bộ dữ liệu.
- Chọn tìm kiếm bằng, tiền tố, chuỗi con hoặc full-text theo yêu cầu sản phẩm và index phù hợp. Không mặc định dùng `ILIKE '%keyword%'` cho mọi trường trên bảng lớn.
- Nếu tìm kiếm ký tự theo nghĩa đen bằng `LIKE`/`ILIKE`, xử lý `%` và `_` theo quy tắc escape đã chọn; parameter hóa chỉ bảo vệ SQL, không loại bỏ ý nghĩa wildcard.

Ví dụ minh họa, tên bảng và field không đại diện schema hiện tại:

```typescript
const rows = await this.db
  .select({
    id: lessons.id,
    title: lessons.title,
    createdAt: lessons.createdAt,
  })
  .from(lessons)
  .where(and(
    eq(lessons.ownerId, userId),
    eq(lessons.status, status),
  ))
  .orderBy(desc(lessons.createdAt), desc(lessons.id))
  .limit(pageSize);
```

`userId` lấy từ ngữ cảnh đã xác thực; `status` và `pageSize` đã được validate. Khi thêm trang tiếp theo, bổ sung cursor tương ứng với cặp `createdAt` và `id`, hoặc offset có giới hạn phù hợp với quy mô dữ liệu.

## 3. Transaction: atomic và ngắn gọn

- Dùng transaction khi nhiều thao tác dữ liệu phải cùng thành công hoặc cùng rollback. Không bọc mọi SELECT đơn lẻ trong transaction nếu không có yêu cầu nhất quán cụ thể.
- Service xác định use case cần atomic; một phương thức Repository sở hữu và thực thi toàn bộ transaction.
- Trong callback `db.transaction(async (tx) => { ... })`, mọi thao tác thuộc transaction phải dùng cùng `tx`, không dùng nhầm `db` bên ngoài.
- Ném lỗi khi không thể hoàn tất; không bắt rồi nuốt lỗi khiến transaction commit phần dữ liệu còn lại.
- Không gọi HTTP bên ngoài, gửi email, chờ tương tác người dùng hoặc xử lý tính toán dài trong transaction. Chuẩn bị dữ liệu trước khi mở transaction khi có thể.
- Giữ constraint database làm lớp bảo vệ tính toàn vẹn khi có request đồng thời. Chọn conditional update, row lock hoặc isolation phù hợp nếu nghiệp vụ có nguy cơ lost update; transaction đơn thuần không tự giải quyết mọi race condition.
- Kiểm thử cả commit, rollback và xung đột đồng thời khi liên quan đến nghiệp vụ.

## 4. Tránh quét toàn bảng không cần thiết và giữ lock lâu

- Không thiết kế truy vấn thường xuyên quét toàn bộ bảng lớn khi chỉ cần một tập dữ liệu nhỏ. Dùng bộ lọc chọn lọc, index phù hợp và giới hạn kết quả.
- Không coi mọi `Seq Scan` là lỗi: PostgreSQL có thể chọn quét tuần tự cho bảng nhỏ hoặc khi cần phần lớn dữ liệu. Đánh giá execution plan và lượng dữ liệu đọc thực tế, không ép index một cách máy móc.
- Không dùng `UPDATE`/`DELETE` thiếu điều kiện trong luồng nghiệp vụ thông thường. Tác vụ xử lý toàn bộ dữ liệu phải có phạm vi và cơ chế batch rõ ràng.
- Chỉ khóa các hàng cần thiết; không dùng table lock hoặc `FOR UPDATE` rộng khi chưa có lý do cụ thể.
- Với tác vụ lớn, chia batch có giới hạn và commit từng batch nếu nghiệp vụ cho phép; không giữ transaction mở trong toàn bộ quá trình xử lý dài.
- Khi khóa nhiều bản ghi, giữ thứ tự truy cập nhất quán để giảm nguy cơ deadlock. Không tự thêm retry vô hạn.

## 5. Tránh kiểm tra tồn tại và truy vấn lặp thừa

- Không SELECT kiểm tra tồn tại 2–3 lần cho cùng dữ liệu trong một use case khi không có yêu cầu nhất quán mới.
- Nếu đã cần dữ liệu, dùng kết quả SELECT đó để kiểm tra tồn tại; không gọi thêm `exists()` trước rồi SELECT lại cùng bản ghi.
- Khi insert có điều kiện duy nhất, ưu tiên unique constraint và xử lý conflict phù hợp thay vì SELECT kiểm tra trùng rồi mới insert. Kiểm tra trước không thay thế constraint khi có request đồng thời.
- Dùng `INSERT ... RETURNING` hoặc `UPDATE ... RETURNING` với danh sách field rõ ràng để lấy dữ liệu cần trả về; tránh SELECT lại chỉ để lấy cùng dữ liệu vừa ghi.
- Với update/delete theo quyền sở hữu, cân nhắc điều kiện gồm `id` và `ownerId`, rồi kiểm tra kết quả affected rows/returning. Chỉ query thêm nếu contract thực sự cần phân biệt không tồn tại với không có quyền.
- Giữ các lần đọc bổ sung có lý do rõ ràng, chẳng hạn dữ liệu liên quan hoặc yêu cầu khóa/nhất quán; không cắt query bằng mọi giá làm sai nghiệp vụ.

## 6. Tránh vòng lặp gây N+1 query

- Không lấy danh sách N bản ghi rồi chạy thêm một SELECT cho từng bản ghi trong `for`, `map` hoặc `Promise.all`.
- Ưu tiên JOIN, `EXISTS`, subquery, aggregation hoặc batch query bằng tập ID có giới hạn tùy cấu trúc dữ liệu.
- Nếu dùng batch query, gom dữ liệu bằng map trong bộ nhớ thay vì tiếp tục truy vấn theo từng phần tử.
- `Promise.all` chỉ tăng số truy vấn đồng thời, không giải quyết N+1 và có thể làm cạn pool kết nối.
- Không đổi N+1 thành một JOIN khổng lồ nhân bản quá nhiều hàng; với quan hệ một-nhiều có thể phân trang bản ghi chính trước rồi lấy dữ liệu con theo batch.

## 7. Truy vấn nhiều điều kiện hoặc nhiều quan hệ

- Ưu tiên thu hẹp tập bản ghi bằng điều kiện chọn lọc có index phù hợp trước khi tải dữ liệu rộng hoặc tổng hợp quan hệ lớn.
- Cân nhắc subquery/`EXISTS` để lọc tập ID hoặc kiểm tra quan hệ trước; sau đó JOIN hoặc SELECT các field cần trả về. Không tải cả bảng vào ứng dụng để tự lọc.
- Với danh sách, chỉ phân trang tập ID trước khi JOIN dữ liệu chi tiết nếu mọi điều kiện lọc và sắp xếp quyết định trang đã được áp dụng đúng; không lọc tiếp sau phân trang khiến thiếu hoặc sai kết quả.
- Không bắt buộc mọi truy vấn phải dùng subquery. Thứ tự viết SQL hay bọc subquery không bảo đảm database sẽ dùng index hoặc chạy phần đó trước; optimizer quyết định execution plan.
- Thiết kế index theo tổ hợp `WHERE`, JOIN và `ORDER BY` thường dùng, dựa trên độ chọn lọc và dữ liệu thực. Không thêm index cho mọi cột hoặc dùng hàm/ép kiểu trên cột index mà chưa đánh giá tác động.
- Với truy vấn phức tạp hoặc đường chạy quan trọng, xem `EXPLAIN` và đo bằng `EXPLAIN (ANALYZE, BUFFERS)` trên môi trường kiểm thử có dữ liệu đại diện. `ANALYZE` thực thi câu lệnh; không dùng tùy tiện cho thao tác ghi hoặc truy vấn nặng trên production.

## Checklist cho AI trước khi hoàn tất

- SQL nằm trong Repository; SELECT và RETURNING liệt kê rõ field.
- Input được parameter hóa, bộ lọc quyền và phân trang được áp dụng đúng.
- Không có kiểm tra tồn tại lặp thừa, N+1 hoặc truy vấn toàn bảng không có lý do.
- Transaction dùng cùng `tx`, phạm vi ngắn, không chờ dịch vụ bên ngoài.
- Constraint, index và cách xử lý đồng thời phù hợp với nghiệp vụ.
- Integration test qua interface Repository kiểm tra truy vấn, quyền sở hữu, phân trang và rollback khi liên quan; chạy test liên quan và typecheck khi thay đổi code.

Tham khảo: [Drizzle SELECT](https://orm.drizzle.team/docs/select), [Drizzle transactions](https://orm.drizzle.team/docs/transactions), [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html).
