import axios from 'axios';
import type { User, AuthResponse, LoginRequest, RegisterRequest, ResetPasswordRequest } from '../types/auth.types.ts';
import type { createAuthService } from './auth.service.ts';
import type { createAuthSession } from './auth-session.ts';

type AuthStorePort = {
  setUser: (user: User) => void;
  setProfilePending: () => void;
  clearSession: () => void;
};

export function createAuthController(
  session: ReturnType<typeof createAuthSession>,
  getService: () => ReturnType<typeof createAuthService>,
  getStore: () => AuthStorePort,
) {
  let bootstrap: Promise<void> | undefined;

  function clear(preserveVerification = false) {
    const flow = preserveVerification ? session.getVerification() : null;
    session.clear();
    if (flow) session.setVerification(flow);
    getStore().clearSession();
  }

  function assertCurrent(generation: number, signal?: AbortSignal) {
    if (generation !== session.getGeneration() || signal?.aborted) throw new axios.CanceledError('Session changed or request canceled');
  }

  async function loadProfile(generation: number, signal?: AbortSignal) {
    assertCurrent(generation, signal);
    const user = await getService().getMe(signal);
    assertCurrent(generation, signal);
    getStore().setUser(user);
  }

  async function establish(load: () => Promise<AuthResponse>, signal?: AbortSignal, preserveVerification = false) {
    clear(preserveVerification);
    const generation = session.getGeneration();
    await session.runCookieOperation(async () => {
      assertCurrent(generation, signal);
      // Once sent, drain the response before allowing another cookie mutation.
      const response = await load();
      assertCurrent(generation);
      session.setToken(response.accessToken);
      session.clearVerification();
      getStore().setProfilePending();
    });
    // A profile outage must not undo accepted credentials or replay a consumed OTP.
    await loadProfile(generation, signal);
  }

  function refreshAccessToken() {
    return session.refresh(async () => (await getService().refresh()).accessToken);
  }

  return {
    clear,
    refreshAccessToken,
    bootstrapAuth() {
      if (bootstrap) return bootstrap;
      const generation = session.getGeneration();
      bootstrap = (async () => {
        try {
          await refreshAccessToken();
          assertCurrent(generation);
          getStore().setProfilePending();
          await loadProfile(generation);
        } catch {
          if (generation === session.getGeneration() && !session.getToken()) clear();
        }
      })();
      return bootstrap;
    },
    login: (input: LoginRequest, signal?: AbortSignal) => establish(() => getService().login(input), signal),
    async register(input: RegisterRequest, signal?: AbortSignal) {
      clear();
      const generation = session.getGeneration();
      const response = await getService().register(input, signal);
      assertCurrent(generation, signal);
      session.setVerification({ ...response, email: input.email, purpose: 'register', expiresAt: Date.now() + response.expiresIn * 1000 });
    },
    async requestPasswordReset(email: string, signal?: AbortSignal) {
      clear();
      const generation = session.getGeneration();
      const response = await getService().requestPasswordReset(email, signal);
      assertCurrent(generation, signal);
      session.setVerification({ ...response, email, purpose: 'reset', expiresAt: Date.now() + response.expiresIn * 1000 });
    },
    verifyRegister(otp: string, signal?: AbortSignal) {
      const flow = session.getVerification();
      if (!flow || flow.purpose !== 'register' || flow.expiresAt <= Date.now()) throw new Error('FLOW_EXPIRED');
      return establish(() => getService().verifyRegister({ verificationToken: flow.verificationToken, otp }), signal, true);
    },
    async retryProfile(signal?: AbortSignal) {
      if (!session.getToken()) throw new Error('SESSION_CHANGED');
      await loadProfile(session.getGeneration(), signal);
    },
    async resetPassword(input: Omit<ResetPasswordRequest, 'verificationToken'>, signal?: AbortSignal) {
      const flow = session.getVerification();
      if (!flow || flow.purpose !== 'reset' || flow.expiresAt <= Date.now()) throw new Error('FLOW_EXPIRED');
      clear(true);
      const generation = session.getGeneration();
      await session.runCookieOperation(async () => {
        assertCurrent(generation, signal);
        await getService().confirmPasswordReset({ ...input, verificationToken: flow.verificationToken });
        assertCurrent(generation);
        clear();
      });
    },
    async logout(signal?: AbortSignal) {
      clear();
      const generation = session.getGeneration();
      await session.runCookieOperation(async () => {
        assertCurrent(generation, signal);
        try { await getService().logout(); }
        catch { throw new Error('LOGOUT_UNCONFIRMED'); }
      });
    },
  };
}
