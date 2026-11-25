import axios from 'axios';
import { ZodError } from 'zod';

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_ALREADY_EXISTS: 'Email đã được đăng ký. Bạn có thể đăng nhập hoặc khôi phục mật khẩu.',
  INVALID_OTP: 'Mã xác minh không đúng. Hãy kiểm tra lại email.',
  TOKEN_EXPIRED: 'Phiên đã hết hạn. Vui lòng bắt đầu lại.',
  INVALID_TOKEN: 'Phiên xác minh không hợp lệ. Vui lòng bắt đầu lại.',
  VERIFICATION_TOKEN_USED: 'Phiên xác minh này đã được sử dụng.',
  OTP_ATTEMPTS_EXCEEDED: 'Đã vượt số lần thử. Vui lòng yêu cầu mã mới sau.',
  TOO_MANY_REQUESTS: 'Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.',
  FORBIDDEN: 'Yêu cầu bị từ chối. Vui lòng tải lại trang và thử lại.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'API_NOT_CONFIGURED') return 'Dịch vụ tài khoản chưa được kết nối. Vui lòng thử lại sau.';
  if (error instanceof Error && error.message === 'FLOW_EXPIRED') return 'Phiên xác minh đã hết hạn. Vui lòng yêu cầu mã mới.';
  if (error instanceof Error && error.message === 'LOGOUT_UNCONFIRMED') return 'Đã xóa phiên trên thiết bị, nhưng chưa xác nhận được việc đăng xuất với máy chủ. Vui lòng thử lại khi có kết nối.';
  if (error instanceof ZodError) return 'Dữ liệu không khớp hợp đồng API. Vui lòng thử lại sau.';
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.code;
    if (error.response?.status === 429) {
      const seconds = Number(error.response.headers['retry-after']);
      return Number.isFinite(seconds) && seconds > 0 ? `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${Math.ceil(seconds)} giây.` : messages.TOO_MANY_REQUESTS;
    }
    if (typeof code === 'string' && messages[code]) return messages[code];
    if (!error.response) return 'Chưa kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
    if (error.response.status >= 500) return 'Dịch vụ đang gián đoạn. Vui lòng thử lại sau.';
    return 'Chưa thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin và thử lại.';
  }
  return 'Chưa thể hoàn tất thao tác. Vui lòng thử lại.';
}
