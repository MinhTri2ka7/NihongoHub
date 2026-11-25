'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput } from '@/components/ui/password-input';
import { FormMessage } from '@/components/shared/form-message';
import { useAuth } from '../hooks/use-auth';
import { useAuthRequest } from '../hooks/use-auth-request';
import { useVerificationFlow } from '../hooks/use-verification-flow';
import { forgotPasswordSchema, loginSchema, otpSchema, registerSchema, resetPasswordSchema } from '../schemas/auth.schema';

type Mode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';
const copy = {
  login: { title: 'Đăng nhập', text: 'Chào mừng bạn trở lại.', submit: 'Đăng nhập' },
  register: { title: 'Tạo tài khoản', text: 'Bắt đầu hành trình tiếng Nhật.', submit: 'Tạo tài khoản' },
  verify: { title: 'Xác minh email', text: 'Nhập mã 6 chữ số trong email.', submit: 'Xác minh' },
  forgot: { title: 'Quên mật khẩu?', text: 'Nhận mã khôi phục qua email.', submit: 'Gửi mã khôi phục' },
  reset: { title: 'Mật khẩu mới', text: 'Nhập mã email và mật khẩu mới.', submit: 'Lưu mật khẩu' },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const auth = useAuth();
  const request = useAuthRequest();
  const flow = useVerificationFlow(mode === 'verify' ? 'register' : 'reset');
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetDone, setResetDone] = useState(false);
  const content = copy[mode];
  const verification = mode === 'verify' || mode === 'reset';
  const authenticated = auth.status === 'authenticated' && (mode === 'login' || mode === 'verify');
  const profilePending = auth.status === 'profile-pending';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    const schema = { login: loginSchema, register: registerSchema, forgot: forgotPasswordSchema, verify: otpSchema, reset: resetPasswordSchema }[mode];
    const result = schema.safeParse(raw);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) fields[String(issue.path[0])] ??= issue.message;
      setErrors(fields);
      form.querySelector<HTMLInputElement>(`[name="${Object.keys(fields)[0]}"]`)?.focus();
      return;
    }
    setErrors({});
    await request.run(async (signal) => {
      if (mode === 'login') await auth.login(loginSchema.parse(raw), signal);
      if (mode === 'register') {
        const { email, password } = registerSchema.parse(raw);
        await auth.register({ email, password }, signal);
        if (!signal.aborted) router.push('/verify-email');
      }
      if (mode === 'forgot') {
        await auth.requestPasswordReset(forgotPasswordSchema.parse(raw).email, signal);
        if (!signal.aborted) router.push('/reset-password');
      }
      if (mode === 'verify') await auth.verifyRegister(otpSchema.parse(raw).otp, signal);
      if (mode === 'reset') {
        const { otp, newPassword } = resetPasswordSchema.parse(raw);
        await auth.resetPassword({ otp, newPassword }, signal);
        if (!signal.aborted) { form.reset(); setResetDone(true); }
      }
    });
  }

  function field(name: string, label: string, type = 'text', hint?: string) {
    const isPassword = name.toLowerCase().includes('password');
    const props = {
      id: name, name, required: true, disabled: request.pending,
      autoComplete: name === 'email' ? 'email' : name === 'otp' ? 'one-time-code' : mode === 'login' ? 'current-password' : 'new-password',
      placeholder: name === 'email' ? 'ban@example.com' : name === 'otp' ? '000000' : name === 'confirmPassword' ? 'Nhập lại mật khẩu' : 'Nhập mật khẩu của bạn',
      maxLength: name === 'otp' ? 6 : name === 'email' ? 254 : 128,
      'aria-invalid': !!errors[name],
      'aria-describedby': [errors[name] && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(' ') || undefined,
    };
    return <FormField key={name} id={name} label={label} error={errors[name]} hint={hint}>{isPassword ? <PasswordInput {...props} /> : <input {...props} type={type} inputMode={name === 'otp' ? 'numeric' : name === 'email' ? 'email' : undefined} className={name === 'otp' ? 'otp-input' : ''} />}</FormField>;
  }

  return <div className="auth-form-container"><div className="form-heading"><h2>{profilePending ? 'Tải hồ sơ' : authenticated ? 'Đăng nhập thành công' : content.title}</h2><p>{profilePending ? 'Phiên đã được xác thực. Đang chờ thông tin tài khoản.' : authenticated ? `Chào ${auth.user?.displayName || auth.user?.email}.` : content.text}</p></div>
    {profilePending ? <div className="success-panel"><FormMessage message={request.error} /><Button pending={request.pending} onClick={() => void request.run((signal) => auth.retryProfile(signal))}>Thử tải lại hồ sơ</Button><Button className="button-secondary" pending={request.pending} onClick={() => void request.run((signal) => auth.logout(signal))}>Đăng xuất</Button></div> : authenticated ? <div className="success-panel"><span className="success-mark" aria-hidden="true">✓</span><h3>Rất vui được gặp bạn!</h3><p>Tài khoản đã được xác thực với máy chủ.</p><Link className="button" href="/">Về trang chủ</Link><Button className="button-secondary" pending={request.pending} onClick={() => void request.run((signal) => auth.logout(signal))}>Đăng xuất</Button></div> : resetDone ? <div className="success-panel"><span className="success-mark" aria-hidden="true">✓</span><h3>Mật khẩu đã được cập nhật.</h3><p>Đăng nhập lại bằng mật khẩu mới để tiếp tục.</p><Link className="button" href="/login">Về trang đăng nhập</Link></div> : verification && !flow.valid ? <div className="empty-flow"><FormMessage message="Phiên xác minh chưa có hoặc đã hết hạn. Vui lòng bắt đầu lại để nhận mã mới." /><Link className="button" href={mode === 'verify' ? '/register' : '/forgot-password'}>Yêu cầu phiên xác minh mới</Link></div> : <form method="post" onSubmit={submit} noValidate className="auth-form" aria-label={content.title}>
      {verification && <div className="email-delivery"><span>Kiểm tra hộp thư của bạn</span><strong>{flow.email}</strong><small>Mã có hiệu lực trong {Math.floor(flow.secondsLeft / 60)}:{String(flow.secondsLeft % 60).padStart(2, '0')}. Kiểm tra cả thư mục spam.</small></div>}
      {!verification && field('email', 'Địa chỉ email', 'email')}
      {verification && field('otp', 'Mã xác minh', 'text')}
      {(mode === 'login' || mode === 'register') && field('password', 'Mật khẩu', 'password', mode === 'register' ? 'Sử dụng từ 8 đến 128 ký tự.' : undefined)}
      {mode === 'reset' && field('newPassword', 'Mật khẩu mới', 'password', 'Sử dụng từ 8 đến 128 ký tự.')}
      {(mode === 'register' || mode === 'reset') && field('confirmPassword', 'Xác nhận mật khẩu', 'password')}
      {mode === 'login' && <div className="form-options"><Link href="/forgot-password">Quên mật khẩu?</Link></div>}
      <FormMessage message={request.error} />
      <Button type="submit" pending={request.pending}>{content.submit}</Button>
      {mode === 'forgot' && <p className="privacy-note">Email đã đăng ký sẽ nhận được mã khôi phục.</p>}
    </form>}
    {authenticated && <FormMessage message={request.error} />}
    {mode === 'login' && !authenticated && !profilePending && <p className="form-switch">Chưa có tài khoản? <Link href="/register">Đăng ký</Link></p>}
    {mode === 'register' && !profilePending && <p className="form-switch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>}
    {verification && flow.valid && !authenticated && !profilePending && !resetDone && <p className="form-switch">Chưa nhận được mã? <Link href={mode === 'verify' ? '/register' : '/forgot-password'}>Bắt đầu lại</Link></p>}{(mode === 'forgot' || mode === 'reset' || mode === 'verify') && !authenticated && !profilePending && <p className="form-switch"><Link href="/login">Quay lại đăng nhập</Link></p>}
  </div>;
}
