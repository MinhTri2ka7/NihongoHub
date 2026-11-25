export function requireApiUrl(value: string | undefined): string {
  if (!value) throw new Error('API_NOT_CONFIGURED');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API_NOT_CONFIGURED');
  }
  return url.toString().replace(/\/$/, '');
}

export function getBrowserApiUrl() {
  return requireApiUrl(process.env.NEXT_PUBLIC_API_URL);
}
