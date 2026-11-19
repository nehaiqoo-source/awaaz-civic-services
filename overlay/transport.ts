import type { ActPlan, ActRequest } from '@/lib/act/schema'
import type { FillRequest, FillResult } from '@/lib/fill/schema'

/** How the overlay reaches the backend. The extension supplies one that goes through its background worker. */
export type Transport = (request: FillRequest) => Promise<FillResult>

/** How the overlay asks the backend to turn a spoken command into proposed actions. */
export type ActTransport = (request: ActRequest) => Promise<ActPlan>

export class TransportError extends Error {}

export interface OverlayConfig {
  apiBase: string
  transport?: Transport
  actTransport?: ActTransport
  /** Default speech language (BCP-47). */
  lang?: string
  /** Never contact the server: answers are validated on this device only. */
  localOnly?: boolean
}

declare global {
  interface Window {
    __AWAAZ__?: Partial<OverlayConfig>
  }
}

/** Compile-time default injected by the build; overridden by window.__AWAAZ__ (bookmarklet) or extension storage. */
declare const __API_BASE__: string

export function resolveConfig(win: Window): OverlayConfig {
  const injected = win.__AWAAZ__ ?? {}
  const fallback = typeof __API_BASE__ === 'string' ? __API_BASE__ : 'http://localhost:3000'
  return { apiBase: injected.apiBase ?? fallback, transport: injected.transport, actTransport: injected.actTransport, lang: injected.lang, localOnly: injected.localOnly }
}

export function fetchTransport(apiBase: string): Transport {
  return async (request) => {
    let response: Response
    try {
      response = await fetch(`${apiBase.replace(/\/$/, '')}/api/fill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    } catch {
      throw new TransportError('network')
    }
    if (response.status === 429) throw new TransportError('rate_limited')
    if (!response.ok) throw new TransportError('server')
    return (await response.json()) as FillResult
  }
}

export function fetchActTransport(apiBase: string): ActTransport {
  return async (request) => {
    let response: Response
    try {
      response = await fetch(`${apiBase.replace(/\/$/, '')}/api/act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    } catch {
      throw new TransportError('network')
    }
    if (response.status === 429) throw new TransportError('rate_limited')
    if (!response.ok) throw new TransportError('server')
    return (await response.json()) as ActPlan
  }
}
