'use client';

import { createApiClient, createAuthenticatedClient } from '../../../lib/axios.ts';
import { getBrowserApiUrl } from '../../../config/api.ts';
import { useAuthStore } from '../../../stores/auth.store.ts';
import { createAuthSession } from './auth-session.ts';
import { createAuthService } from './auth.service.ts';
import { createAuthController } from './auth-controller.ts';

export const authSession = createAuthSession();
let service: ReturnType<typeof createAuthService> | undefined;
export const authController = createAuthController(authSession, getAuthService, useAuthStore.getState);

export function getAuthService() {
  if (typeof window === 'undefined') throw new Error('Browser auth only');
  if (service) return service;
  const baseURL = getBrowserApiUrl();
  const publicClient = createApiClient(baseURL);
  const protectedClient = createAuthenticatedClient(baseURL, {
    getToken: authSession.getToken,
    getGeneration: authSession.getGeneration,
    refresh: authController.refreshAccessToken,
    onExpired: authController.clear,
  });
  service = createAuthService(publicClient, protectedClient);
  return service;
}

export const bootstrapAuth = authController.bootstrapAuth;
