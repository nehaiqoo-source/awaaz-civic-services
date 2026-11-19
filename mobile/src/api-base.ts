/** Form data may only be sent to HTTPS servers. Plain HTTP is allowed in development builds only (emulator/LAN). */
export function isAllowedApiBase(value: string, allowInsecure: boolean): boolean {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.username || url.password || url.search || url.hash) return false
  if (url.protocol === 'https:') return true
  return allowInsecure && url.protocol === 'http:'
}

export function normalizeApiBase(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
