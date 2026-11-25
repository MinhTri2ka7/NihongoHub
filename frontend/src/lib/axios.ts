import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/** Create an independent HTTP client; the caller owns API URLs and authentication. */
export function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 15_000,
    headers: {
      Accept: 'application/json',
    },
  });
}

export type AuthPolicy = {
  getToken: () => string | null;
  getGeneration: () => number;
  refresh: () => Promise<string>;
  onExpired: () => void;
};

type AuthConfig = InternalAxiosRequestConfig & { authRetried?: boolean; authToken?: string | null; authGeneration?: number };

/** Inject auth behavior so shared HTTP infrastructure does not import a feature/store. */
export function createAuthenticatedClient(baseURL: string, auth: AuthPolicy): AxiosInstance {
  const client = createApiClient(baseURL);
  client.interceptors.request.use((config: AuthConfig) => {
    config.authGeneration ??= auth.getGeneration();
    if (config.authGeneration !== auth.getGeneration()) throw new axios.CanceledError('Session changed');
    config.authToken = auth.getToken();
    if (config.authToken) config.headers.set('Authorization', `Bearer ${config.authToken}`);
    else config.headers.delete('Authorization');
    return config;
  });
  client.interceptors.response.use((response) => response, async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) throw error;
    const config = error.config as AuthConfig;
    const code = error.response?.data?.code;
    if (error.response?.status === 401 && config.authGeneration === auth.getGeneration() && (code === 'INVALID_TOKEN' || code === 'REFRESH_TOKEN_REUSED' || (code === 'TOKEN_EXPIRED' && config.authRetried))) auth.onExpired();
    if (error.response?.status !== 401 || code !== 'TOKEN_EXPIRED' || config.authRetried || config.signal?.aborted) throw error;
    if (config.authGeneration !== auth.getGeneration()) throw new axios.CanceledError('Session changed');
    config.authRetried = true;
    try {
      // A delayed 401 from the old token should reuse the token already refreshed.
      if (!auth.getToken() || auth.getToken() === config.authToken) await auth.refresh();
    } catch (refreshError) {
      if (config.authGeneration === auth.getGeneration() && axios.isAxiosError(refreshError) && refreshError.response?.status === 401) auth.onExpired();
      throw refreshError;
    }
    if (config.signal?.aborted) throw new axios.CanceledError('Request canceled');
    return client.request(config);
  });
  return client;
}
