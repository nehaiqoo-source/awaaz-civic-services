'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PREFILL_KEY } from '@/components/GrievanceFlow'
import { ServiceCard } from '@/components/SaathiFlow'
import { SPEECH_LANGUAGES } from '@/lib/grievance/labels'
import { useSpeechRecognition } from '@/lib/use-speech-recognition'
import { choose, decide, type ChatQuestion, type ChatReply } from '@/lib/saathi/chat'
import type { Service } from '@/lib/saathi/catalog'

type Message =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'bot'; text: { en: string; hi: string }; question?: ChatQuestion; answered?: boolean }
  | { id: number; from: 'bot-services'; services: Service[]; confident: boolean }

const GREETING = {
  en: 'Namaste. Tell me your problem in your own words, by voice or typing. I will point you to the right service.',
  hi: 'नमस्ते। अपनी समस्या अपने शब्दों में बोलकर या लिखकर बताइए। मैं आपको सही सेवा तक पहुँचाऊँगा।',
}
const NOT_SURE = {
  en: 'I could not match this to a service. You can describe it again in other words.',
  hi: 'मैं इसे किसी सेवा से नहीं जोड़ पाया। आप इसे दूसरे शब्दों में फिर बता सकते हैं।',
}
const FOUND = { en: 'Here is where to go.', hi: 'यहाँ जाएँ।' }
const MAYBE = { en: 'These may fit, but I am not certain.', hi: 'ये ठीक हो सकते हैं, पर मैं पक्का नहीं हूँ।' }

export function SaathiChat() {
  const [language, setLanguage] = useState('hi-IN')
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: 'bot', text: GREETING }])
  const [input, setInput] = useState('')
  const [readAloud, setReadAloud] = useState(false)
  const nextId = useRef(1)
  const transcript = useRef('')
  const asked = useRef<string[]>([])
  const endRef = useRef<HTMLDivElement>(null)
  const lang = language.startsWith('hi') ? 'hi' : 'en'

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages])

  const speak = useCallback(
    (text: string) => {
      if (!readAloud || typeof window === 'undefined' || !('speechSynthesis' in window)) return
      const u = new SpeechSynthesisUtterance(text)
      u.lang = language
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
    },
    [readAloud, language],
  )

  const showReply = useCallback(
    (reply: ChatReply) => {
      if (reply.kind === 'ask') {
        asked.current.push(reply.question.id)
        const q = reply.question
        setMessages((m) => [...m, { id: nextId.current++, from: 'bot', text: q.text, question: q }])
        speak(q.text[lang])
        return
      }
      const lead = reply.services.length === 0 ? NOT_SURE : reply.confident ? FOUND : MAYBE
      setMessages((m) => {
        const out: Message[] = [...m, { id: nextId.current++, from: 'bot', text: lead }]
        if (reply.services.length) out.push({ id: nextId.current++, from: 'bot-services', services: reply.services, confident: reply.confident })
        return out
      })
      const first = reply.services[0]
      speak(first ? `${lead[lang]} ${first.name[lang]}. ${first.why[lang]}` : lead[lang])
    },
    [speak, lang],
  )

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, 600)
      if (text.length < 2) return
      transcript.current = `${transcript.current} ${text}`.trim().slice(-1200)
      setMessages((m) => [...m, { id: nextId.current++, from: 'user', text }])
      setInput('')
      showReply(decide(transcript.current, asked.current))
    },
    [showReply],
  )

  const speech = useSpeechRecognition({
    lang: language,
    onFinalText: (t) => {
      send(t)
    },
  })

  function pick(question: ChatQuestion, optionId: string) {
    const option = question.options.find((o) => o.id === optionId)
    if (!option) return
    setMessages((m) => [
      ...m.map((x) => (x.from === 'bot' && x.question?.id === question.id ? { ...x, answered: true } : x)),
      { id: nextId.current++, from: 'user', text: option.label[lang] },
    ])
    transcript.current = `${transcript.current} ${option.label.en}`.trim()
    const reply = choose(question.id, optionId)
    if (reply) showReply(reply)
  }

  function reset() {
    window.speechSynthesis?.cancel?.()
    transcript.current = ''
    asked.current = []
    nextId.current = 1
    setMessages([{ id: 0, from: 'bot', text: GREETING }])
  }

  function handOver() {
    try {
      window.sessionStorage.setItem(PREFILL_KEY, transcript.current)
    } catch {
      /* the person can still type it again */
    }
  }

  return (
    <section className="card chat" aria-labelledby="chat-title">
      <div className="chat-head">
        <h2 id="chat-title">Saathi chat · साथी चैट</h2>
        <button type="button" className="secondary" onClick={reset}>Start over · फिर से</button>
      </div>
      <div className="chat-opts">
        <label>
          Language · भाषा
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={speech.listening}>
            {SPEECH_LANGUAGES.map((l) => (
              <option key={l.tag} value={l.tag}>{l.label}</option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} /> Read answers aloud · जवाब बोलकर सुनाएँ
        </label>
      </div>

      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => {
          if (m.from === 'user') return <p key={m.id} className="bubble bubble-user">{m.text}</p>
          if (m.from === 'bot-services')
            return (
              <div key={m.id} className="chat-services">
                {m.services.map((s, i) => (
                  <ServiceCard key={s.id} service={s} best={i === 0 && m.confident} onHandOver={handOver} />
                ))}
                <p className="note">Guide only: nothing is submitted for you. Documents and steps can differ by state.</p>
              </div>
            )
          return (
            <div key={m.id} className="bubble bubble-bot">
              <p>{m.text.en}</p>
              <p className="hi">{m.text.hi}</p>
              {m.question && !m.answered && (
                <div className="chat-choices">
                  {m.question.options.map((o) => (
                    <button key={o.id} type="button" className="choice" onClick={() => pick(m.question!, o.id)}>
                      {o.label.en} <span className="hi">· {o.label.hi}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {speech.error && <p role="alert" className="error">Voice input problem ({speech.error}). You can type instead. · आवाज़ में दिक्कत, आप लिख सकते हैं।</p>}
      {speech.interim && <p className="interim" aria-live="polite">{speech.interim}</p>}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        {speech.supported && (
          <button
            type="button"
            className={`mic mic-small ${speech.listening ? 'mic-live' : ''}`}
            onClick={speech.listening ? speech.stop : speech.start}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? 'Stop listening' : 'Speak'}
          >
            {speech.listening ? '■' : '●'}
          </button>
        )}
        <input type="text" value={input} maxLength={600} onChange={(e) => setInput(e.target.value)} placeholder="मेरी पेंशन नहीं आई · my pension has not come" aria-label="Your message" />
        <button type="submit" className="primary" disabled={input.trim().length < 2}>Send · भेजें</button>
      </form>
    </section>
  )
}
