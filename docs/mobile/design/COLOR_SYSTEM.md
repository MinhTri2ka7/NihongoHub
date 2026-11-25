# Hệ màu mobile NihongoHub

Định hướng do người dùng chọn: **xanh dương, nền sáng**. Đây là bảng token đề xuất để triển khai tập trung tại `src/theme/tokens.ts`; file token và UI hiện chưa tồn tại trong mobile.

## Bảng token

| Vai trò | Token | Giá trị light theme | Dùng cho |
| --- | --- | --- | --- |
| Primary | `colors.primary` | `#1D4ED8` | CTA chính, selected state, active navigation |
| Chữ trên primary | `colors.primaryForeground` | `#FFFFFF` | Text/icon trên nền primary |
| Nền chọn nhẹ | `colors.primarySurface` | `#DBEAFE` | Nhóm/row selected cần nền nhẹ |
| Viền chọn | `colors.primaryBorder` | `#93C5FD` | Hỗ trợ selected state, không dùng làm dấu hiệu duy nhất |
| Chữ nhấn trên nền sáng | `colors.primaryText` | `#1E40AF` | Link, text/icon nhấn |
| Nhấn phụ thương hiệu | `colors.secondary` | `#0F766E` | Badge hoặc điểm nhấn có chủ đích |
| Chữ trên secondary | `colors.secondaryForeground` | `#FFFFFF` | Text/icon trên secondary |
| Nền ứng dụng | `colors.background` | `#F8FAFC` | Canvas màn hình |
| Bề mặt | `colors.surface` | `#FFFFFF` | Card, input, sheet |
| Nhóm nền nhẹ | `colors.surfaceMuted` | `#EFF6FF` | Grouped area và pressed surface |
| Chữ chính | `colors.textPrimary` | `#0F172A` | Nội dung chính, chữ Nhật |
| Chữ phụ | `colors.textSecondary` | `#475569` | Mô tả hỗ trợ |
| Chữ ít nhấn | `colors.textMuted` | `#64748B` | Metadata và placeholder trên nền phù hợp |
| Viền trang trí | `colors.border` | `#CBD5E1` | Phân tách card/section |
| Viền control | `colors.borderStrong` | `#64748B` | Boundary input/control khi cần tương phản rõ |
| Focus | `colors.focus` | `#1D4ED8` | Focus indicator |
| Lỗi/phá hủy | `colors.danger` | `#B91C1C` | Error và destructive action |
| Chữ trên danger | `colors.dangerForeground` | `#FFFFFF` | Label trên danger button |
| Thành công | `colors.success` | `#166534` | Thành công hoặc đáp án đúng theo contract |
| Cảnh báo | `colors.warning` | `#92400E` | Cảnh báo, cần hành động |

Đây là vai trò semantic, không phải toàn bộ palette để component tự phối. Không đem màu lime/coral/forest của mẫu vào UI NihongoHub.

## Cấp độ button

| Tone | Hình thức | Mục đích |
| --- | --- | --- |
| `primary` | Primary + primaryForeground | Hành động quan trọng nhất, ví dụ bắt đầu bài học |
| `secondary` | Surface + borderStrong + textPrimary | Hành động hỗ trợ như quay lại/đặt lại |
| `inverse` | TextPrimary làm nền + trắng | Hành động cần tương phản trên nền đặc biệt |
| `danger` | Danger + dangerForeground | Xóa hoặc thao tác phá hủy có xác nhận |

Secondary brand và secondary button là hai khái niệm khác nhau. Mỗi màn/section thường có một primary CTA rõ ràng.

## Quy tắc triển khai

1. Screen và component import semantic token từ module theme sau khi nền được tạo; không khai báo hex/RGB/HSL cục bộ.
2. Thiếu vai trò cho trạng thái hợp lệ thì cập nhật token chung trước.
3. Không phân màu button theo từng feature. Màu không thay thế label, icon hoặc accessibility state.
4. Đúng/sai, progress và trạng thái lỗi phải có thông tin ngoài màu; không dùng primary để giả làm success/danger.
5. Theme root, splash và native app background cần đối chiếu với token sau khi có app config. Không khẳng định chúng đã được cấu hình.
6. Dark mode chưa được định nghĩa; không đảo màu light theme tùy ý. Nếu thêm dark mode, duyệt bảng token và kiểm chứng riêng.

## Tương phản và review

Kiểm tra cặp foreground/background thực sự dùng: text thường tối thiểu 4.5:1, text lớn tối thiểu 3:1; boundary/focus cần xét yêu cầu accessibility của control. `border` sáng chỉ dùng phân tách trang trí, không làm boundary duy nhất của control cần tương phản rõ.

Không giảm opacity của cả control một cách tùy ý khiến label/placeholder khó đọc. Kiểm tra lại khi đặt textMuted trên nền màu, ảnh hoặc trạng thái pressed; không suy từ một cặp màu sang mọi trường hợp.

Ví dụ sau minh họa API mục tiêu, chưa phải component có sẵn:

```tsx
const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderColor: colors.border },
  title: { color: colors.textPrimary },
  description: { color: colors.textSecondary },
});

<PrimaryButton label={t('lessons.start')} tone='primary' onPress={startLesson} />
<PrimaryButton label={t('common.reset')} tone='secondary' onPress={resetForm} />
```

Theme và i18n phải được thiết lập trong task nền trước khi các ví dụ này trở thành code chạy được.
