// GENERATED copy of overlay/bridge-protocol.ts by scripts/build-ext.mjs. Do not edit.
/**
 * Platform-neutral message protocol between the in-page overlay and a native host app
 * (React Native WebView, Android WebView, iOS WKWebView). Types only: this file is copied verbatim into the mobile app.
 * Messages are JSON strings. The host must treat everything it receives from the page as untrusted.
 */
export type SpeechErrorCode = 'not-allowed' | 'no-speech' | 'network' | 'unsupported-language' | 'unsupported' | 'other'

/** page -> host */
export type HostRequest =
  | { id: number; type: 'listen'; lang: string; continuous: boolean; timeoutMs: number }
  | { id: number; type: 'stopListening' }
  | { id: number; type: 'speak'; text: string; lang: string }
  | { id: number; type: 'cancelSpeech' }
  | { id: number; type: 'fill'; request: unknown }
  | { id: number; type: 'act'; request: unknown }

/** host -> page (delivered by calling window.__awaazHostReceive(jsonString)) */
export type HostEvent =
  | { id: number; type: 'interim'; text: string }
  | { id: number; type: 'result'; text: string }
  | { id: number; type: 'error'; code: SpeechErrorCode }
  | { id: number; type: 'spoken' }
  | { id: number; type: 'fillResult'; result: unknown }
  | { id: number; type: 'fillError'; code: string }
  | { id: number; type: 'actResult'; result: unknown }
  | { id: number; type: 'actError'; code: string }

const ERROR_CODES: readonly string[] = ['not-allowed', 'no-speech', 'network', 'unsupported-language', 'unsupported', 'other']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

export function isHostEvent(value: unknown): value is HostEvent {
  if (!isRecord(value) || typeof value.id !== 'number') return false
  switch (value.type) {
    case 'interim':
    case 'result':
      return typeof value.text === 'string'
    case 'error':
      return typeof value.code === 'string' && ERROR_CODES.includes(value.code)
    case 'spoken':
      return true
    case 'fillResult':
    case 'actResult':
      return isRecord(value.result)
    case 'fillError':
    case 'actError':
      return typeof value.code === 'string'
    default:
      return false
  }
}

/** Structural guard for requests, used by hosts on messages coming out of a (possibly hostile) web page. */
export function isHostRequest(value: unknown): value is HostRequest {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isFinite(value.id)) return false
  switch (value.type) {
    case 'listen':
      return (
        typeof value.lang === 'string' &&
        value.lang.length <= 20 &&
        typeof value.continuous === 'boolean' &&
        typeof value.timeoutMs === 'number'
      )
    case 'stopListening':
    case 'cancelSpeech':
      return true
    case 'speak':
      return typeof value.text === 'string' && value.text.length <= 1000 && typeof value.lang === 'string' && value.lang.length <= 20
    case 'fill':
    case 'act':
      return isRecord(value.request)
    default:
      return false
  }
}
