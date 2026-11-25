# Tài liệu dự án NihongoHub

Điểm bắt đầu cho lập trình viên và AI. Bộ hướng dẫn mobile được điều chỉnh từ mẫu Daune cho ứng dụng học tiếng Nhật; các mô tả tính năng, phiên bản và tích hợp riêng của mẫu không phải hiện trạng NihongoHub.

## Đọc theo phạm vi

| Phạm vi | Điểm bắt đầu | Hướng dẫn AI |
| --- | --- | --- |
| Quy tắc chung và phê duyệt | [AI rules](ai-rules/README.md) | [AGENTS.md](../AGENTS.md) |
| Backend | [Backend documentation](backend/README.md) | [backend/AGENTS.md](../backend/AGENTS.md) |
| Mobile | [Mobile documentation](mobile/README.md) | [mobile/AGENTS.md](../mobile/AGENTS.md) |

Hướng dẫn cài/chạy ở cạnh ứng dụng: [backend/README.md](../backend/README.md) và [mobile/README.md](../mobile/README.md).

## Phân loại tài liệu

| Thư mục | Mục đích |
| --- | --- |
| `structure/` | Cấu trúc, ranh giới, quy ước và kiểm tra kỹ thuật |
| `design/` | Token màu, ngôn ngữ giao diện và quy tắc tương tác |
| `playbooks/` | Quy trình có thể lặp lại cho một loại thay đổi |
| `plans/` | Plan được duyệt cho task cụ thể, chỉ tạo khi cần |
| `ADR/` | Quyết định kiến trúc, phương án thay thế và hệ quả, chỉ tạo khi cần |
| `archive/` | Tài liệu lịch sử đã có nguồn thay thế, chỉ tạo khi cần |

Không tạo thư mục rỗng chỉ để khớp cây mẫu. README cạnh module tiếp tục nằm cạnh code sở hữu nó.

## Hiện trạng và đề xuất

- Backend đã có implementation; đối chiếu tài liệu với code và package thực tế.
- Mobile hiện chỉ có bộ hướng dẫn, chưa có app hoặc SDK. Các cây `src/`, component, route, token và package được nhắc đến là cấu trúc mục tiêu.
- Khi một đề xuất được triển khai, cập nhật snapshot tương ứng bằng bằng chứng; không đổi trạng thái chỉ vì đã cài package.

## Duy trì tài liệu

Khi đổi kiến trúc, contract, shared component, cấu hình hoặc quality gate, cập nhật tài liệu kỹ thuật, playbook và index liên quan trong cùng change. Quyết định có hệ quả đáng kể cần ADR. Tài liệu bị thay thế phải ghi rõ nguồn mới nếu còn được giữ trong archive.

File Markdown mới dùng tên ASCII `UPPER_SNAKE_CASE.md`; giữ convention `README.md`, `AGENTS.md` và tên do công cụ quản lý. ADR đánh số có thể dùng `001-UPPER-KEBAB-CASE.md`. Không đổi tên tài liệu ngoài task chỉ để chuẩn hóa.

Trước khi bàn giao thay đổi tài liệu, kiểm tra liên kết nội bộ, anchor, đường dẫn, nhãn hiện trạng/đề xuất và các lệnh được mô tả. Không tuyên bố đã test runtime nếu chỉ sửa tài liệu.
