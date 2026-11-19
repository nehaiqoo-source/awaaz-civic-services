import { isHostRequest, type HostEvent, type HostRequest, type SpeechErrorCode } from './generated/bridge-protocol'

/** Native speech recognition. Implemented with expo-speech-recognition in native.ts. */
export interface SpeechPort {
  start(options: {
    lang: string
    continuous: boolean
    onInterim(text: string): void
    onFinal(text: string): void
    onError(code: SpeechErrorCode): void
    onEnd(): void
  }): void
  stop(): void
  abort(): void
}

/** Native text to speech. */
export interface SpeakPort {
  speak(text: string, lang: string, onDone: () => void): void
  stop(): void
}

export interface HostDeps {
  speech: SpeechPort
  tts: SpeakPort
  /** Forwards a fill request to the Awaaz server. Rejects with Error('network' | 'rate_limited' | 'server'). */
  fill(request: unknown): Promise<unknown>
  /** Forwards a voice-command request to the Awaaz server (it only proposes actions; the page decides). Same error codes as fill. */
  act(request: unknown): Promise<unknown>
  /** Delivers an event to the page. */
  send(event: HostEvent): void
  /** True only while the user has switched Awaaz on with the native button. */
  isArmed(): boolean
  now?: () => number
}

const MAX_MESSAGE_CHARS = 300_000
const MIN_LISTEN_MS = 1_000
const MAX_LISTEN_MS = 90_000
const FILL_LIMIT = 60
const FILL_WINDOW_MS = 60_000

export interface HostController {
  /** Handle a raw message from the WebView. The page is untrusted: everything is validated and gated. */
  handle(raw: string): void
  /** Immediately stops the microphone and speech. Call on navigation, backgrounding or when the user switches Awaaz off. */
  disarm(): void
}

export function createHostController(deps: HostDeps): HostController {
  const now = deps.now ?? Date.now
  let activeListenId: number | null = null
  let listenTimer: ReturnType<typeof setTimeout> | undefined
  const fillTimes: number[] = []

  function finishListen() {
    clearTimeout(listenTimer)
    activeListenId = null
  }

  function startListen(request: Extract<HostRequest, { type: 'listen' }>) {
    if (activeListenId !== null) {
      deps.speech.abort()
      finishListen()
    }
    const id = request.id
    activeListenId = id
    let finalText = ''
    let failure: SpeechErrorCode | null = null
    const timeout = Math.min(Math.max(request.timeoutMs, MIN_LISTEN_MS), MAX_LISTEN_MS)
    listenTimer = setTimeout(() => deps.speech.stop(), timeout)
    deps.speech.start({
      lang: request.lang,
      continuous: request.continuous,
      onInterim: (text) => {
        if (activeListenId === id) deps.send({ id, type: 'interim', text })
      },
      onFinal: (text) => {
        if (activeListenId === id) finalText += `${text} `
      },
      onError: (code) => {
        if (activeListenId === id) failure = code
      },
      onEnd: () => {
        if (activeListenId !== id) return
        finishListen()
        const text = finalText.trim()
        if (text) deps.send({ id, type: 'result', text })
        else deps.send({ id, type: 'error', code: failure ?? 'no-speech' })
      },
    })
  }

  function startFill(id: number, request: unknown, kind: 'fill' | 'act' = 'fill') {
    const [okType, errType] = kind === 'fill' ? (['fillResult', 'fillError'] as const) : (['actResult', 'actError'] as const)
    const call = kind === 'fill' ? deps.fill : deps.act
    const t = now()
    while (fillTimes.length > 0 && (fillTimes[0] ?? 0) <= t - FILL_WINDOW_MS) fillTimes.shift()
    if (fillTimes.length >= FILL_LIMIT) {
      deps.send({ id, type: errType, code: 'rate_limited' })
      return
    }
    if (JSON.stringify(request).length > MAX_MESSAGE_CHARS) {
      deps.send({ id, type: errType, code: 'server' })
      return
    }
    fillTimes.push(t)
    call(request).then(
      (result) => deps.send({ id, type: okType, result }),
      (error: unknown) => deps.send({ id, type: errType, code: error instanceof Error ? error.message : 'network' }),
    )
  }

  return {
    handle(raw) {
      if (raw.length > MAX_MESSAGE_CHARS) return
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        return
      }
      if (!isHostRequest(parsed)) return

      // Nothing happens unless the user switched Awaaz on. Answer anyway so a legitimate overlay never hangs.
      if (!deps.isArmed()) {
        if (parsed.type === 'listen') deps.send({ id: parsed.id, type: 'error', code: 'not-allowed' })
        else if (parsed.type === 'speak') deps.send({ id: parsed.id, type: 'spoken' })
        else if (parsed.type === 'fill') deps.send({ id: parsed.id, type: 'fillError', code: 'server' })
        else if (parsed.type === 'act') deps.send({ id: parsed.id, type: 'actError', code: 'server' })
        return
      }

      switch (parsed.type) {
        case 'listen':
          startListen(parsed)
          break
        case 'stopListening':
          if (activeListenId === parsed.id) deps.speech.stop()
          break
        case 'speak': {
          const { id } = parsed
          deps.tts.stop()
          deps.tts.speak(parsed.text, parsed.lang, () => deps.send({ id, type: 'spoken' }))
          break
        }
        case 'cancelSpeech':
          deps.tts.stop()
          break
        case 'fill':
          startFill(parsed.id, parsed.request)
          break
        case 'act':
          startFill(parsed.id, parsed.request, 'act')
          break
      }
    },

    disarm() {
      deps.speech.abort()
      deps.tts.stop()
      finishListen()
    },
  }
}
