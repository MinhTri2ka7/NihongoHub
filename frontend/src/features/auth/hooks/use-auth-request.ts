'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { authErrorMessage } from '../services/auth-errors';

export function useAuthRequest() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (controller.current) return;
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    setError('');
    try {
      await action(request.signal);
    } catch (failure) {
      if (mounted.current && !request.signal.aborted && !axios.isCancel(failure)) setError(authErrorMessage(failure));
    } finally {
      if (controller.current === request) controller.current = null;
      if (mounted.current) setPending(false);
    }
  }
  return { pending, error, run };
}
