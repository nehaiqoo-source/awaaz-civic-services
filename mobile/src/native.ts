import { ExpoSpeechRecognitionModule, type ExpoSpeechRecognitionErrorCode } from 'expo-speech-recognition'
import * as Speech from 'expo-speech'
import { isAllowedApiBase, normalizeApiBase } from './api-base'
import type { SpeechErrorCode } from './generated/bridge-protocol'
import type { SpeakPort, SpeechPort } from './host-controller'

function mapError(code: ExpoSpeechRecognitionErrorCode): SpeechErrorCode | null {
  switch (code) {
    case 'aborted':
      return null // we aborted on purpose
    case 'not-allowed':
    case 'service-not-allowed':
      return 'not-allowed'
    case 'no-speech':
    case 'speech-timeout':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'language-not-supported':
      return 'unsupported-language'
    default:
      return 'other'
  }
}

/** Native speech recognition (Android SpeechRecognizer / iOS SFSpeechRecognizer) via expo-speech-recognition. */
export const speechPort: SpeechPort = {
  start({ lang, continuous, onInterim, onFinal, onError, onEnd }) {
    const subscriptions: Array<{ remove(): void }> = []
    const cleanup = () => subscriptions.splice(0).forEach((s) => s.remove())

    void (async () => {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
      if (!permission.granted) {
        onError('not-allowed')
        onEnd()
        return
      }
      subscriptions.push(
        ExpoSpeechRecognitionModule.addListener('result', (event) => {
          const text = event.results[0]?.transcript ?? ''
          if (!text) return
          if (event.isFinal) onFinal(text)
          else onInterim(text)
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event) => {
          const mapped = mapError(event.error)
          if (mapped) onError(mapped)
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => {
          cleanup()
          onEnd()
        }),
      )
      ExpoSpeechRecognitionModule.start({ lang, interimResults: true, continuous })
    })()
  },
  stop: () => ExpoSpeechRecognitionModule.stop(),
  abort: () => ExpoSpeechRecognitionModule.abort(),
}

/** Native text to speech via expo-speech. */
export const speakPort: SpeakPort = {
  speak(text, lang, onDone) {
    Speech.speak(text, { language: lang, onDone, onStopped: onDone, onError: () => onDone() })
  },
  stop() {
    void Speech.stop()
  },
}

/** Proxies fill requests to the Awaaz server from native code, so the host page's CSP/CORS cannot interfere. */
export function createFillProxy(getApiBase: () => string, path: '/api/fill' | '/api/act' = '/api/fill'): (request: unknown) => Promise<unknown> {
  return async (request) => {
    const base = normalizeApiBase(getApiBase())
    if (!isAllowedApiBase(base, __DEV__)) throw new Error('server')
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    } catch {
      throw new Error('network')
    }
    if (response.status === 429) throw new Error('rate_limited')
    if (!response.ok) throw new Error('server')
    return response.json()
  }
}
