/** Minimal typings and helpers for the Web Speech API (lib.dom does not cover it in every TS version). */
export interface SpeechRecognitionAlternativeLike {
  transcript: string
}
export interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}
export interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [index: number]: SpeechRecognitionResultLike }
}
export interface SpeechRecognitionErrorEventLike {
  error: string
}
export interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
export type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type SpeechError = 'not-allowed' | 'no-speech' | 'network' | 'unsupported-language' | 'unsupported' | 'other'

export function mapSpeechError(code: string): SpeechError {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'not-allowed'
  if (code === 'no-speech') return 'no-speech'
  if (code === 'network') return 'network'
  if (code === 'language-not-supported') return 'unsupported-language'
  return 'other'
}
