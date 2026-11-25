'use client';

import { create } from 'zustand';
import type { User } from '../types/user.ts';

type AuthState = {
  user: User | null;
  status: 'checking' | 'profile-pending' | 'authenticated' | 'unauthenticated';
  setUser: (user: User) => void;
  setProfilePending: () => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'checking',
  setUser: (user) => set({ user: { id: user.id, email: user.email, displayName: user.displayName }, status: 'authenticated' }),
  setProfilePending: () => set({ user: null, status: 'profile-pending' }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}));
