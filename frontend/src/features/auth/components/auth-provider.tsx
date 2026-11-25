'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { bootstrapAuth } from '../services/auth-client';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => { void bootstrapAuth(); }, []);
  return children;
}
