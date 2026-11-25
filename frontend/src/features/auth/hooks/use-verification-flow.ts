'use client';

import { useEffect, useState } from 'react';
import { authSession } from '../services/auth-client';

export function useVerificationFlow(purpose: 'register' | 'reset') {
  const [flow] = useState(() => authSession.getVerification());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const valid = flow?.purpose === purpose && flow.expiresAt > now;
  return { valid, email: flow?.email ?? '', secondsLeft: valid ? Math.ceil((flow.expiresAt - now) / 1000) : 0 };
}
