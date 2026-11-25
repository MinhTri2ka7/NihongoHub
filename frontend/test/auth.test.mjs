import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { createApiClient, createAuthenticatedClient } from '../src/lib/axios.ts';
import { createAuthSession } from '../src/features/auth/services/auth-session.ts';
import { createAuthService } from '../src/features/auth/services/auth.service.ts';
import { loginSchema, registerSchema, otpSchema, resetPasswordSchema, userSchema } from '../src/features/auth/schemas/auth.schema.ts';
import { useAuthStore } from '../src/stores/auth.store.ts';

const ok = (config, data = {}) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const unauthorized = (config, code = 'TOKEN_EXPIRED') => new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { ...ok(config, { code }), status: 401 });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test('form schemas normalize email, preserve password and reject invalid confirmation/OTP', () => {
  assert.equal(loginSchema.parse({ email: ' learner@example.com ', password: ' valid ' }).password, ' valid ');
  assert.equal(loginSchema.parse({ email: ' learner@example.com ', password: 'valid' }).email, 'learner@example.com');
  assert.equal(registerSchema.safeParse({ email: 'x@example.com', password: 'long-enough', confirmPassword: 'different' }).success, false);
  assert.equal(otpSchema.safeParse({ otp: '012345' }).success, true);
  assert.equal(otpSchema.safeParse({ otp: '12345' }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ otp: '012345', newPassword: 'short', confirmPassword: 'short' }).success, false);
  assert.deepEqual(userSchema.parse({ id: 'u1', email: 'x@example.com', passwordHash: 'must-not-escape' }), { id: 'u1', email: 'x@example.com', displayName: null });
});

test('global store contains no tokens and clears user on logout', () => {
  useAuthStore.getState().setUser({ id: 'u1', email: 'x@example.com', displayName: null });
  assert.equal(useAuthStore.getState().status, 'authenticated');
  assert.deepEqual(Object.keys(useAuthStore.getState()).sort(), ['clearSession', 'setProfilePending', 'setUser', 'status', 'user']);
  useAuthStore.getState().clearSession();
  assert.equal(useAuthStore.getState().user, null);
});

test('multiple expired requests share one refresh, including a delayed old-token 401', async () => {
  const session = createAuthSession();
  session.setToken('old');
  let refreshes = 0;
  const release = deferred();
  const refreshStarted = deferred();
  const lateResponse = deferred();
  const client = createAuthenticatedClient('https://example.invalid', {
    ...session,
    refresh: () => session.refresh(async () => { refreshes++; refreshStarted.resolve(); await release.promise; return 'new'; }),
    onExpired: () => session.clear(),
  });
  client.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') === 'Bearer old') {
      if (config.url === '/late') await lateResponse.promise;
      throw unauthorized(config);
    }
    assert.equal(config.headers.get('Authorization'), 'Bearer new');
    return ok(config, { success: true });
  };
  const first = client.get('/first');
  const second = client.get('/second');
  const late = client.get('/late');
  await refreshStarted.promise;
  release.resolve();
  await Promise.all([first, second]);
  lateResponse.resolve();
  await late;
  assert.equal(refreshes, 1);
});

test('refresh failure rejects all waiters and retries never loop', async () => {
  const session = createAuthSession();
  session.setToken('old');
  let refreshes = 0;
  let requests = 0;
  const client = createAuthenticatedClient('https://example.invalid', {
    ...session,
    refresh: () => session.refresh(async () => { refreshes++; return 'new'; }),
    onExpired: () => session.clear(),
  });
  client.defaults.adapter = async (config) => { requests++; throw unauthorized(config); };
  await assert.rejects(client.get('/me'));
  assert.equal(refreshes, 1);
  assert.equal(requests, 2);
  assert.equal(session.getToken(), null);
  const error = new axios.AxiosError('Refresh failed', 'ERR_NETWORK');
  const failed = createAuthSession();
  const results = await Promise.allSettled([failed.refresh(async () => { throw error; }), failed.refresh(async () => 'never')]);
  assert.ok(results.every((result) => result.status === 'rejected' && result.reason === error));
});

test('logout invalidates an in-flight refresh and prevents session resurrection', async () => {
  const session = createAuthSession();
  const release = deferred();
  const pending = session.refresh(async () => { await release.promise; return 'late-token'; });
  session.clear();
  release.resolve();
  await assert.rejects(pending, /SESSION_CHANGED/);
  assert.equal(session.getToken(), null);
});

test('failed login is not refreshed; service validates input and keeps credentials out of payload', async () => {
  const client = createApiClient('https://example.invalid');
  const calls = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url === '/auth/login') throw unauthorized(config, 'INVALID_CREDENTIALS');
    if (config.url === '/auth/refresh') return ok(config, { accessToken: 'test-access', tokenType: 'Bearer', expiresIn: 900 });
    return ok(config);
  };
  const service = createAuthService(client, client);
  await assert.rejects(service.login({ email: 'bad', password: '' }));
  assert.equal(calls.length, 0);
  await assert.rejects(service.login({ email: 'x@example.com', password: 'password' }));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].withCredentials, true);
  const result = await service.refresh();
  assert.equal(result.accessToken, 'test-access');
  assert.equal(calls[1].data, undefined);
  await service.logout();
  assert.equal(calls[2].data, undefined);
  await assert.rejects(service.confirmPasswordReset({ verificationToken: 'opaque', otp: 'invalid', newPassword: 'long-enough' }));
  assert.equal(calls.length, 3);
});

test('canceling one waiting request does not cancel the shared refresh', async () => {
  const session = createAuthSession();
  session.setToken('old');
  const ready = deferred();
  const release = deferred();
  const client = createAuthenticatedClient('https://example.invalid', {
    ...session,
    refresh: () => session.refresh(async () => { ready.resolve(); await release.promise; return 'new'; }),
    onExpired: () => session.clear(),
  });
  client.defaults.adapter = async (config) => {
    if (config.headers.get('Authorization') === 'Bearer old') throw unauthorized(config);
    return ok(config);
  };
  const controller = new AbortController();
  const canceled = client.get('/canceled', { signal: controller.signal });
  const survivor = client.get('/survivor');
  await ready.promise;
  controller.abort();
  release.resolve();
  await assert.rejects(canceled, (error) => axios.isCancel(error));
  assert.equal((await survivor).status, 200);
});

test('register, verification and reset use separate contracts without sending identity in verification', async () => {
  const client = createApiClient('https://example.invalid');
  const calls = [];
  client.defaults.adapter = async (config) => {
    calls.push({ url: config.url, body: config.data ? JSON.parse(config.data) : undefined, credentials: config.withCredentials });
    if (config.url === '/auth/register' || config.url === '/auth/password-reset/request') return ok(config, { verificationToken: 'opaque-test-token', expiresIn: 60 });
    if (config.url === '/auth/register/verify') return ok(config, { accessToken: 'test-access', tokenType: 'Bearer', expiresIn: 900 });
    return { ...ok(config), status: 204 };
  };
  const service = createAuthService(client, client);
  await service.register({ email: 'learner@example.com', password: 'example-password' });
  await service.verifyRegister({ verificationToken: 'opaque-test-token', otp: '012345' });
  await service.requestPasswordReset('learner@example.com');
  await service.confirmPasswordReset({ verificationToken: 'opaque-test-token', otp: '012345', newPassword: 'new-example-password' });
  assert.deepEqual(calls.map((call) => call.url), ['/auth/register', '/auth/register/verify', '/auth/password-reset/request', '/auth/password-reset/confirm']);
  assert.deepEqual(Object.keys(calls[1].body).sort(), ['otp', 'verificationToken']);
  assert.deepEqual(Object.keys(calls[3].body).sort(), ['newPassword', 'otp', 'verificationToken']);
  assert.equal(calls[1].credentials, true);
  assert.equal(calls[3].credentials, true);
  await assert.rejects(service.verifyRegister({ verificationToken: 'opaque', otp: '012345', email: 'must-not-be-used@example.com' }));
  assert.equal(calls.length, 4);
});
