import type { VerificationFlow } from '../types/auth.types.ts';

/** Each browser tab owns its instance. Never use this state as a server session. */
export function createAuthSession() {
  let token: string | null = null;
  let generation = 0;
  let pending: { generation: number; task: Promise<string> } | null = null;
  let verification: VerificationFlow | null = null;
  let cookieTail: Promise<void> = Promise.resolve();

  function runCookieOperation<T>(operation: () => Promise<T>): Promise<T> {
    const task = cookieTail.then(operation);
    // Memory invalidation must not release an HTTP operation still changing cookies.
    cookieTail = task.then(() => undefined, () => undefined);
    return task;
  }

  return {
    getToken: () => token,
    getGeneration: () => generation,
    setToken(value: string) { token = value; },
    clear() { token = null; verification = null; generation += 1; },
    setVerification(value: VerificationFlow) { verification = value; },
    getVerification: () => verification,
    clearVerification() { verification = null; },
    runCookieOperation,
    refresh(load: () => Promise<string>): Promise<string> {
      if (pending?.generation === generation) return pending.task;
      const started = generation;
      const task = runCookieOperation(async () => {
        if (started !== generation) throw new Error('SESSION_CHANGED');
        const value = await load();
        if (started !== generation) throw new Error('SESSION_CHANGED');
        token = value;
        return value;
      });
      pending = { generation: started, task };
      const cleanup = () => { if (pending?.task === task) pending = null; };
      task.then(cleanup, cleanup);
      return task;
    },
  };
}
