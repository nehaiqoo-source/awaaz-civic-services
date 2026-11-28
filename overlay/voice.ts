import {
  getSpeechRecognitionCtor,
  mapSpeechError,
  type SpeechError,
} from '@/lib/speech'

export class VoiceError extends Error {
  constructor(readonly code: SpeechError) {
    super(code)
  }
}

export interface ListenOptions {
  lang: string
  /** Keep listening across pauses until stop() is called (used for "tell everything at once"). */
  continuous?: boolean
  onInterim?: (text: string) => void
  /** Stops automatically after this long. Default 20 s. */
  timeoutMs?: number
  /** For single answers: keep listening through short pauses and stop after this much silence. */
  endSilenceMs?: number
}

export interface ListenHandle {
  result: Promise<string>
  stop(): void
  /** Other ways the recogniser heard the answer, best first (may be empty). Read after `result` settles. */
  alternatives?: () => string[]
}

const MAX_ALTERNATIVES = 5

/**
 * Whole-answer alternatives: the k-th alternative of every segment joined (falling back to the best one
 * where a segment has fewer). Lets the caller try "9 8 7..." when the top guess was "nine ate seven...".
 */
export function combineAlternatives(segments: ReadonlyArray<ReadonlyArray<string>>): string[] {
  const depth = Math.max(0, ...segments.map((s) => s.length))
  const out: string[] = []
  for (let k = 0; k < depth; k += 1) {
    const text = segments.map((alts) => alts[k] ?? alts[0] ?? '').join(' ').replace(/\s+/g, ' ').trim()
    if (text && !out.includes(text)) out.push(text)
  }
  return out
}

export interface VoiceIO {
  speak(text: string, lang: string): Promise<void>
  listen(options: ListenOptions): ListenHandle
  cancelSpeech(): void
}

export function createBrowserVoice(): VoiceIO {
  return {
    speak(text, lang) {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve()
      return new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const done = () => {
          clearTimeout(timer)
          resolve()
        }
        try {
          const synth = window.speechSynthesis
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = lang
          const prefix = lang.slice(0, 2).toLowerCase()
          const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefix))
          if (voice) utterance.voice = voice
          timer = setTimeout(done, 20_000)
          utterance.onend = done
          utterance.onerror = done
          synth.cancel()
          synth.speak(utterance)
        } catch {
          // Speech output is a convenience: if it fails the questions are still shown on screen.
          done()
        }
      })
    },

    cancelSpeech() {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    },

    listen({ lang, continuous = false, onInterim, timeoutMs = 20_000, endSilenceMs }) {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) return { result: Promise.reject(new VoiceError('unsupported')), stop() {} }

      const recognition = new Ctor()
      recognition.lang = lang
      // With endSilenceMs we keep listening across short pauses (people stop to think mid-answer)
      // and stop ourselves once they have been quiet for that long.
      recognition.continuous = continuous || endSilenceMs !== undefined
      recognition.interimResults = true
      recognition.maxAlternatives = MAX_ALTERNATIVES

      /** One entry per final segment: that segment's alternatives, best first. */
      const segments: string[][] = []
      let failure: SpeechError | null = null
      let timer: ReturnType<typeof setTimeout> | undefined
      let silenceTimer: ReturnType<typeof setTimeout> | undefined
      const finalText = () => segments.map((alts) => alts[0] ?? '').join(' ').trim()

      const result = new Promise<string>((resolve, reject) => {
        recognition.onresult = (event) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const item = event.results[i]
            if (!item) continue
            if (item.isFinal) {
              const alts: string[] = []
              const count = item.length ?? 1
              for (let k = 0; k < count; k += 1) {
                const text = item[k]?.transcript?.trim()
                if (text) alts.push(text)
              }
              if (alts.length > 0) segments.push(alts)
            } else interim += item[0].transcript
          }
          onInterim?.(`${finalText()} ${interim}`.trim())
          if (endSilenceMs !== undefined && !continuous) {
            clearTimeout(silenceTimer)
            silenceTimer = setTimeout(() => recognition.stop(), endSilenceMs)
          }
        }
        recognition.onerror = (event) => {
          failure = mapSpeechError(event.error)
        }
        recognition.onend = () => {
          clearTimeout(timer)
          clearTimeout(silenceTimer)
          const text = finalText()
          if (text) resolve(text)
          else reject(new VoiceError(failure ?? 'no-speech'))
        }
        timer = setTimeout(() => recognition.stop(), timeoutMs)
        try {
          recognition.start()
        } catch {
          clearTimeout(timer)
          reject(new VoiceError('other'))
        }
      })

      return { result, stop: () => recognition.stop(), alternatives: () => combineAlternatives(segments) }
    },
  }
}
