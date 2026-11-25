'use client';

import { useAuthStore } from '@/stores/auth.store';
import { authController } from '../services/auth-client';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  return { user, status, ...authController };
}
