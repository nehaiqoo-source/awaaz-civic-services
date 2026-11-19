import type { ActPlan } from '@/lib/act/schema'
import type { FillResult } from '@/lib/fill/schema'
import { isHostEvent, type HostEvent, type HostRequest } from './bridge-protocol'
import { TransportError, type ActTransport, type Transport } from './transport'
import { VoiceError, type ListenHandle, type VoiceIO } from './voice'

/** The native side of the bridge. In React Native WebView this wraps window.ReactNativeWebView.postMessage. */
export interface HostBridge {
  postMessage(message: string): void
}

declare global {
  interface Window {
    __AWAAZ_HOST__?: HostBridge
    __awaazHostReceive?: (message: string) => void
  }
}

const SPEAK_TIMEOUT_MS = 20_000
const FILL_TIMEOUT_MS = 30_000

type Pending = (event: HostEvent) => void

/**
 * Voice and API access through a native host. Used inside the mobile app's built-in browser, where the browser's
 * Web Speech API does not exist and the host page's CSP could block calls to our server.
 */
export function createBridge(win: Window, host: HostBridge): { voice: VoiceIO; transport: Transport; actTransport: ActTransport } {
  const pending = new Map<number, Pending>()
  let counter = 0

  win.__awaazHostReceive = (raw: string) => {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (!isHostEvent(parsed)) return
    pending.get(parsed.id)?.(parsed)
  }

  const send = (message: HostRequest) => host.postMessage(JSON.stringify(message))

  const voice: VoiceIO = {
    speak(text, lang) {
      return new Promise<void>((resolve) => {
        counter += 1
        const id = counter
        const done = () => {
          clearTimeout(timer)
          pending.delete(id)
          resolve()
        }
        const timer = setTimeout(done, SPEAK_TIMEOUT_MS)
        pending.set(id, (event) => {
          if (event.type === 'spoken' || event.type === 'error') done()
        })
        send({ id, type: 'speak', text, lang })
      })
    },

    cancelSpeech() {
      counter += 1
      send({ id: counter, type: 'cancelSpeech' })
    },

    listen({ lang, continuous = false, onInterim, timeoutMs = 20_000 }): ListenHandle {
      counter += 1
      const id = counter
      const result = new Promise<string>((resolve, reject) => {
        pending.set(id, (event) => {
          if (event.type === 'interim') onInterim?.(event.text)
          else if (event.type === 'result') {
            pending.delete(id)
            resolve(event.text)
          } else if (event.type === 'error') {
            pending.delete(id)
            reject(new VoiceError(event.code))
          }
        })
        send({ id, type: 'listen', lang, continuous, timeoutMs })
      })
      return { result, stop: () => send({ id, type: 'stopListening' }) }
    },
  }

  const transport: Transport = (request) =>
    new Promise<FillResult>((resolve, reject) => {
      counter += 1
      const id = counter
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new TransportError('network'))
      }, FILL_TIMEOUT_MS)
      pending.set(id, (event) => {
        if (event.type === 'fillResult') {
          clearTimeout(timer)
          pending.delete(id)
          resolve(event.result as FillResult)
        } else if (event.type === 'fillError') {
          clearTimeout(timer)
          pending.delete(id)
          reject(new TransportError(event.code))
        }
      })
      send({ id, type: 'fill', request })
    })

  const actTransport: ActTransport = (request) =>
    new Promise<ActPlan>((resolve, reject) => {
      counter += 1
      const id = counter
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new TransportError('network'))
      }, FILL_TIMEOUT_MS)
      pending.set(id, (event) => {
        if (event.type === 'actResult') {
          clearTimeout(timer)
          pending.delete(id)
          resolve(event.result as ActPlan)
        } else if (event.type === 'actError') {
          clearTimeout(timer)
          pending.delete(id)
          reject(new TransportError(event.code))
        }
      })
      send({ id, type: 'act', request })
    })

  return { voice, transport, actTransport }
}
