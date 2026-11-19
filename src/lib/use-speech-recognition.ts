'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  getSpeechRecognitionCtor as getCtor,
  mapSpeechError as mapError,
  type SpeechError,
  type SpeechRecognitionLike,
} from './speech'

export type { SpeechError }

const subscribeNoop = () => () => {}

interface Options {
  lang: string
  /** Called with newly finalized text to append to the transcript. */
  onFinalText: (text: string) => void
}

export function useSpeechRecognition({ lang, onFinalText }: Options) {
  const supported = useSyncExternalStore(subscribeNoop, () => getCtor() !== null, () => false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<SpeechError | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onFinalRef = useRef(onFinalText)

  useEffect(() => {
    onFinalRef.current = onFinalText
  }, [onFinalText])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const start = useCallback(() => {
    const Ctor = getCtor()
    if (!Ctor || recognitionRef.current) return
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (!result) continue
        const text = result[0].transcript
        if (result.isFinal) onFinalRef.current(text)
        else interimText += text
      }
      setInterim(interimText)
    }
    recognition.onerror = (event) => setError(mapError(event.error))
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      setInterim('')
    }
    setError(null)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }, [lang])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  return { supported, listening, interim, error, start, stop }
}
