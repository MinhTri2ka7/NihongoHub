import 'server-only';
import { createApiClient } from '../../../lib/axios';
import { requireApiUrl } from '../../../config/api';
import { userSchema } from '../schemas/auth.schema';

/** Explicit token per request. Browser memory is unavailable to Server Components. */
export async function getServerUser(accessToken: string, signal?: AbortSignal) {
  if (!accessToken || /[\r\n]/.test(accessToken)) throw new Error('INVALID_TOKEN');
  const baseURL = requireApiUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL);
  const client = createApiClient(baseURL);
  const { data } = await client.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}`, 'Cache-Control': 'no-store' }, signal });
  return userSchema.parse(data);
}
