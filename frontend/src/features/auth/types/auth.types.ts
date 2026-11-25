import type { User } from '../../../types/user.ts';

export type { User };
export type LoginRequest = { email: string; password: string };
export type RegisterRequest = LoginRequest;
export type AuthResponse = { accessToken: string; tokenType: 'Bearer'; expiresIn: number };
export type VerificationResponse = { verificationToken: string; expiresIn: number };
export type VerifyRequest = { verificationToken: string; otp: string };
export type ResetPasswordRequest = VerifyRequest & { newPassword: string };
export type VerificationFlow = VerificationResponse & { email: string; purpose: 'register' | 'reset'; expiresAt: number };
