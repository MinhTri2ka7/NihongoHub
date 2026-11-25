import { z } from 'zod';

const email = z.string().trim().pipe(z.email('Nhập địa chỉ email hợp lệ.').max(254, 'Email quá dài.'));
// Backend has not finalized password policy; these are proposed UI limits.
const password = z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').max(128, 'Mật khẩu tối đa 128 ký tự.');
export const loginSchema = z.object({ email, password: z.string().min(1, 'Nhập mật khẩu.').max(128, 'Mật khẩu quá dài.') });
export const registerSchema = z.object({ email, password, confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận chưa khớp.' });
export const forgotPasswordSchema = z.object({ email });
export const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, 'Nhập mã gồm 6 chữ số.') });
export const resetPasswordSchema = otpSchema.extend({ newPassword: password, confirmPassword: z.string() }).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận chưa khớp.' });
export const registerRequestSchema = z.object({ email, password }).strict();
export const verifyRequestSchema = otpSchema.extend({ verificationToken: z.string().min(1) }).strict();
export const resetRequestSchema = verifyRequestSchema.extend({ newPassword: password }).strict();

export const userSchema = z.object({ id: z.string().min(1), email: z.email(), displayName: z.string().nullable().optional().transform((value) => value ?? null) });
export const authResponseSchema = z.object({ accessToken: z.string().min(1), tokenType: z.literal('Bearer'), expiresIn: z.number().positive() });
export const verificationResponseSchema = z.object({ verificationToken: z.string().min(1), expiresIn: z.number().positive() });
