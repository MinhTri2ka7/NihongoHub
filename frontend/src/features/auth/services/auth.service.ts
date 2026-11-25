import type { AxiosInstance } from 'axios';
import { authResponseSchema, loginSchema, forgotPasswordSchema, registerRequestSchema, verifyRequestSchema, resetRequestSchema, verificationResponseSchema, userSchema } from '../schemas/auth.schema.ts';
import type { LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyRequest } from '../types/auth.types.ts';

export function createAuthService(publicClient: AxiosInstance, protectedClient: AxiosInstance) {
  const credentialOptions = { withCredentials: true };
  return {
    async login(input: LoginRequest, signal?: AbortSignal) {
      const { data } = await publicClient.post('/auth/login', loginSchema.parse(input), { ...credentialOptions, signal });
      return authResponseSchema.parse(data);
    },
    async register(input: RegisterRequest, signal?: AbortSignal) {
      const { data } = await publicClient.post('/auth/register', registerRequestSchema.parse(input), { signal });
      return verificationResponseSchema.parse(data);
    },
    async verifyRegister(input: VerifyRequest, signal?: AbortSignal) {
      const { data } = await publicClient.post('/auth/register/verify', verifyRequestSchema.parse(input), { ...credentialOptions, signal });
      return authResponseSchema.parse(data);
    },
    async requestPasswordReset(email: string, signal?: AbortSignal) {
      const input = forgotPasswordSchema.parse({ email });
      const { data } = await publicClient.post('/auth/password-reset/request', input, { signal });
      return verificationResponseSchema.parse(data);
    },
    async confirmPasswordReset(input: ResetPasswordRequest, signal?: AbortSignal) {
      await publicClient.post('/auth/password-reset/confirm', resetRequestSchema.parse(input), { ...credentialOptions, signal });
    },
    async refresh() {
      const { data } = await publicClient.post('/auth/refresh', undefined, credentialOptions);
      return authResponseSchema.parse(data);
    },
    async logout(signal?: AbortSignal) {
      await publicClient.post('/auth/logout', undefined, { ...credentialOptions, signal });
    },
    async getMe(signal?: AbortSignal) {
      const { data } = await protectedClient.get('/users/me', { signal });
      return userSchema.parse(data);
    },
  };
}
