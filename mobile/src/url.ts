/**
 * Turns what the user typed into a URL the built-in browser may open, or null.
 * Only http(s) is allowed: no javascript:, file:, intent:, data: or app deep links.
 */
export function normalizeUrl(input: string): string | null {
  const text = input.trim()
  if (!text || /\s/.test(text)) return null
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^/]*:\d+(\/|$)/.test(text)
  const candidate = hasScheme ? text : `https://${text}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password) return null
  if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null
  return url.toString()
}

export function isAllowedNavigation(url: string): boolean {
  return /^https?:\/\//i.test(url) || url === 'about:blank'
}
