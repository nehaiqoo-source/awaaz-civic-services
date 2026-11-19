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
}

export interface ListenHandle {
  result: Promise<string>
  stop(): void
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

    listen({ lang, continuous = false, onInterim, timeoutMs = 20_000 }) {
      const Ctor = getSpeechRecognitionCtor()
      if (!Ctor) return { result: Promise.reject(new VoiceError('unsupported')), stop() {} }

      const recognition = new Ctor()
      recognition.lang = lang
      recognition.continuous = continuous
      recognition.interimResults = true

      let finalText = ''
      let failure: SpeechError | null = null
      let timer: ReturnType<typeof setTimeout> | undefined

      const result = new Promise<string>((resolve, reject) => {
        recognition.onresult = (event) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const item = event.results[i]
            if (!item) continue
            if (item.isFinal) finalText += `${item[0].transcript} `
            else interim += item[0].transcript
          }
          onInterim?.((finalText + interim).trim())
        }
        recognition.onerror = (event) => {
          failure = mapSpeechError(event.error)
        }
        recognition.onend = () => {
          clearTimeout(timer)
          const text = finalText.trim()
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

      return { result, stop: () => recognition.stop() }
    },
  }
}
