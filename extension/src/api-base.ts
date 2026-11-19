/** Only HTTPS endpoints (or plain HTTP on the local machine for development) may receive form data. */
export function isAllowedApiBase(value: string): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.username || url.password || url.search || url.hash) return false
  if (url.protocol === 'https:') return true
  return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
}

export function normalizeApiBase(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
