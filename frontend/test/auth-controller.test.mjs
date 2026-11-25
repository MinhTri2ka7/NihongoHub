import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { createAuthController } from '../src/features/auth/services/auth-controller.ts';
import { createAuthSession } from '../src/features/auth/services/auth-session.ts';

const response = (accessToken = 'test-access') => ({ accessToken, tokenType: 'Bearer', expiresIn: 900 });
const user = { id: 'B', email: 'learner@example.invalid', displayName: null };
const credentials = { email: user.email, password: 'synthetic-password' };
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function harness(overrides = {}) {
  const session = createAuthSession();
  const state = { user: null, status: 'checking' };
  const store = {
    setUser: (value) => Object.assign(state, { user: value, status: 'authenticated' }),
    setProfilePending: () => Object.assign(state, { user: null, status: 'profile-pending' }),
    clearSession: () => Object.assign(state, { user: null, status: 'unauthenticated' }),
  };
  const unsupported = async () => { throw new Error('Unexpected service call'); };
  const service = { login: unsupported, register: unsupported, verifyRegister: unsupported, requestPasswordReset: unsupported, confirmPasswordReset: unsupported, refresh: unsupported, logout: unsupported, getMe: async () => user, ...overrides };
  const controller = createAuthController(session, () => service, () => store);
  return { session, state, controller };
}

test('startup refresh finishes before a new login can replace its cookie', async () => {
  const started = deferred();
  const release = deferred();
  const events = [];
  let cookieOwner = 'A';
  const { session, state, controller } = harness({
    refresh: async () => { events.push('refresh-start'); started.resolve(); await release.promise; cookieOwner = 'A'; events.push('refresh-end'); return response('access-A'); },
    login: async () => { events.push('login'); cookieOwner = 'B'; return response('access-B'); },
  });
  const bootstrap = controller.bootstrapAuth();
  await started.promise;
  const login = controller.login(credentials);
  await Promise.resolve();
  assert.deepEqual(events, ['refresh-start']);
  release.resolve();
  await Promise.all([bootstrap, login]);
  assert.deepEqual(events, ['refresh-start', 'refresh-end', 'login']);
  assert.equal(cookieOwner, 'B');
  assert.equal(session.getToken(), 'access-B');
  assert.equal(state.user.id, 'B');
});

test('logout waits for an active refresh even after local session invalidation', async () => {
  const started = deferred();
  const release = deferred();
  let cookieOwner = 'A';
  let logoutCalls = 0;
  const { controller, session, state } = harness({
    refresh: async () => { started.resolve(); await release.promise; cookieOwner = 'rotated-A'; return response(); },
    logout: async () => { logoutCalls++; cookieOwner = null; },
  });
  const refresh = controller.refreshAccessToken();
  const invalidated = assert.rejects(refresh, /SESSION_CHANGED/);
  await started.promise;
  const logout = controller.logout();
  assert.equal(state.status, 'unauthenticated');
  assert.equal(logoutCalls, 0);
  release.resolve();
  await Promise.all([invalidated, logout]);
  assert.equal(logoutCalls, 1);
  assert.equal(cookieOwner, null);
  assert.equal(session.getToken(), null);
});

test('canceling UI does not release an already-sent login before logout', async () => {
  const started = deferred();
  const release = deferred();
  const abort = new AbortController();
  let cookieOwner = null;
  let logoutCalls = 0;
  const { controller, state } = harness({
    login: async (_input, signal) => { assert.equal(signal, undefined); started.resolve(); await release.promise; cookieOwner = 'A'; return response(); },
    logout: async () => { logoutCalls++; cookieOwner = null; },
  });
  const login = controller.login(credentials, abort.signal);
  const canceled = assert.rejects(login, (error) => axios.isCancel(error));
  await started.promise;
  abort.abort();
  const logout = controller.logout();
  await Promise.resolve();
  assert.equal(logoutCalls, 0);
  release.resolve();
  await Promise.all([canceled, logout]);
  assert.equal(cookieOwner, null);
  assert.equal(state.status, 'unauthenticated');
});

test('a login canceled while queued never calls the API', async () => {
  const started = deferred();
  const release = deferred();
  const abort = new AbortController();
  let loginCalls = 0;
  const { controller } = harness({
    refresh: async () => { started.resolve(); await release.promise; return response(); },
    login: async () => { loginCalls++; return response(); },
  });
  const refresh = controller.refreshAccessToken();
  const invalidated = assert.rejects(refresh, /SESSION_CHANGED/);
  await started.promise;
  const login = controller.login(credentials, abort.signal);
  const canceled = assert.rejects(login, (error) => axios.isCancel(error));
  abort.abort();
  release.resolve();
  await Promise.all([invalidated, canceled]);
  assert.equal(loginCalls, 0);
});

test('a failed cookie operation does not block the next login', async () => {
  const started = deferred();
  const release = deferred();
  const { controller, state } = harness({
    refresh: async () => { started.resolve(); await release.promise; throw new Error('network-outage'); },
    login: async () => response('new-access'),
  });
  const refresh = controller.refreshAccessToken();
  const failed = assert.rejects(refresh, /network-outage/);
  await started.promise;
  const login = controller.login(credentials);
  release.resolve();
  await Promise.all([failed, login]);
  assert.equal(state.status, 'authenticated');
});

test('successful OTP verification survives Get Me failure and retry never replays OTP', async () => {
  let verifyCalls = 0;
  let profileCalls = 0;
  const { controller, session, state } = harness({
    verifyRegister: async () => { verifyCalls++; return response('verified-access'); },
    getMe: async () => { profileCalls++; if (profileCalls === 1) throw new Error('profile-outage'); return user; },
  });
  session.setVerification({ verificationToken: 'test-opaque', expiresIn: 60, expiresAt: Date.now() + 60000, email: user.email, purpose: 'register' });
  await assert.rejects(controller.verifyRegister('012345'), /profile-outage/);
  assert.equal(state.status, 'profile-pending');
  assert.equal(state.user, null);
  assert.equal(session.getToken(), 'verified-access');
  assert.equal(session.getVerification(), null);
  await controller.retryProfile();
  assert.equal(state.status, 'authenticated');
  assert.equal(state.user.id, user.id);
  assert.equal(verifyCalls, 1);
  assert.equal(profileCalls, 2);
});

test('wrong OTP keeps the unconsumed flow available for another attempt', async () => {
  let attempts = 0;
  const { controller, session, state } = harness({
    verifyRegister: async () => { if (++attempts === 1) throw new Error('INVALID_OTP'); return response(); },
  });
  session.setVerification({ verificationToken: 'test-opaque', expiresIn: 60, expiresAt: Date.now() + 60000, email: user.email, purpose: 'register' });
  await assert.rejects(controller.verifyRegister('111111'), /INVALID_OTP/);
  assert.equal(session.getToken(), null);
  assert.ok(session.getVerification());
  await controller.verifyRegister('012345');
  assert.equal(state.status, 'authenticated');
  assert.equal(session.getVerification(), null);
});

test('a late profile response cannot restore a logged-out user', async () => {
  const started = deferred();
  const release = deferred();
  const { controller, state, session } = harness({
    login: async () => response(),
    getMe: async () => { started.resolve(); await release.promise; return user; },
    logout: async () => {},
  });
  const login = controller.login(credentials);
  const canceled = assert.rejects(login, (error) => axios.isCancel(error));
  await started.promise;
  await controller.logout();
  release.resolve();
  await canceled;
  assert.equal(state.user, null);
  assert.equal(state.status, 'unauthenticated');
  assert.equal(session.getToken(), null);
});

test('bootstrap profile errors remain recoverable without another refresh', async () => {
  let refreshCalls = 0;
  let profileCalls = 0;
  const { controller, state, session } = harness({
    refresh: async () => { refreshCalls++; return response(); },
    getMe: async () => { if (++profileCalls === 1) throw new Error('profile-outage'); return user; },
  });
  await controller.bootstrapAuth();
  assert.equal(state.status, 'profile-pending');
  assert.ok(session.getToken());
  await controller.retryProfile();
  assert.equal(state.status, 'authenticated');
  assert.equal(refreshCalls, 1);
  assert.equal(profileCalls, 2);
});

test('a login waits for password reset and its new session is not cleared by the old reset', async () => {
  const started = deferred();
  const release = deferred();
  const events = [];
  let cookieOwner = 'A';
  const { controller, session, state } = harness({
    confirmPasswordReset: async () => { events.push('reset-start'); started.resolve(); await release.promise; cookieOwner = null; events.push('reset-end'); },
    login: async () => { events.push('login'); cookieOwner = 'B'; return response('access-B'); },
  });
  session.setVerification({ verificationToken: 'test-opaque', expiresIn: 60, expiresAt: Date.now() + 60000, email: user.email, purpose: 'reset' });
  const reset = controller.resetPassword({ otp: '012345', newPassword: 'synthetic-password' });
  const superseded = assert.rejects(reset, (error) => axios.isCancel(error));
  await started.promise;
  const login = controller.login(credentials);
  assert.deepEqual(events, ['reset-start']);
  release.resolve();
  await Promise.all([superseded, login]);
  assert.deepEqual(events, ['reset-start', 'reset-end', 'login']);
  assert.equal(cookieOwner, 'B');
  assert.equal(state.status, 'authenticated');
  assert.equal(session.getToken(), 'access-B');
});
