'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { api } from '@/lib/api-client'
import { PREFILL_KEY } from '@/components/GrievanceFlow'
import { CATEGORY_LABELS, SPEECH_LANGUAGES } from '@/lib/grievance/labels'
import { useSpeechRecognition, type SpeechError } from '@/lib/use-speech-recognition'
import { FALLBACK_PORTALS, getService, isAllowedServiceUrl, type Service } from '@/lib/saathi/catalog'
import { matchServices } from '@/lib/saathi/match'
import type { SaathiResponse } from '@/lib/saathi/plan'

const SPEECH_ERROR_TEXT: Record<SpeechError, string> = {
  'not-allowed': 'Microphone access was blocked. Allow it in the browser, or type below.',
  'no-speech': 'We did not hear anything. Tap the mic and try again.',
  network: 'Speech service needs internet. Try again, or type below.',
  'unsupported-language': 'This browser cannot recognise that language. Pick another or type below.',
  unsupported: 'Voice input is not available in this browser. Type below.',
  other: 'Speech input failed. Try again or type below.',
}

interface Answer {
  services: Service[]
  confident: boolean
  source: SaathiResponse['source'] | 'rules'
  category: keyof typeof CATEGORY_LABELS
  notice?: string
}

export function SaathiFlow() {
  const [language, setLanguage] = useState('hi-IN')
  const [text, setText] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [busy, setBusy] = useState(false)
  const append = useCallback((t: string) => setText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${t.trim()}`.slice(0, 600)), [])
  const speech = useSpeechRecognition({ lang: language, onFinalText: append })

  /** Runs on this device first: nothing leaves the phone unless the person asks the AI to look closer. */
  function findLocally() {
    const local = matchServices(text)
    setAnswer({ services: local.matches.map((m) => m.service), confident: local.confident, source: 'rules', category: local.category })
  }

  async function askAi() {
    setBusy(true)
    try {
      const res = await api.saathi(text, language)
      const services = res.ids.map((id) => getService(id)).filter((s): s is Service => s !== undefined)
      setAnswer({
        services,
        confident: res.confident,
        source: res.source,
        category: res.category,
        notice: res.reason === 'ai_unavailable' ? 'The AI service is not set up on this server, so only the built-in matching ran.' : undefined,
      })
    } catch {
      setAnswer((prev) => (prev ? { ...prev, notice: 'Could not reach the AI service. Showing the built-in answer.' } : prev))
    } finally {
      setBusy(false)
    }
  }

  function handOver() {
    try {
      window.sessionStorage.setItem(PREFILL_KEY, text)
    } catch {
      /* the person can still type it again */
    }
  }

  return (
    <>
      <section aria-labelledby="say-title" className="card">
        <h2 id="say-title">Say your problem · अपनी समस्या बोलें</h2>
        <label>
          Language · भाषा
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={speech.listening}>
            {SPEECH_LANGUAGES.map((l) => (
              <option key={l.tag} value={l.tag}>{l.label}</option>
            ))}
          </select>
        </label>
        {speech.supported ? (
          <button type="button" className={`mic ${speech.listening ? 'mic-live' : ''}`} onClick={speech.listening ? speech.stop : speech.start} aria-pressed={speech.listening}>
            <span aria-hidden="true">{speech.listening ? '■' : '●'}</span>
            {speech.listening ? 'Listening… tap to stop · रोकें' : 'Tap and speak · बोलने के लिए दबाएँ'}
          </button>
        ) : (
          <p className="badge badge-plain">Voice input is not available in this browser (try Chrome). You can type or use a voice keyboard.</p>
        )}
        {speech.error && <p role="alert" className="error">{SPEECH_ERROR_TEXT[speech.error]}</p>}
        <label>
          Your words (you can edit) · आपके शब्द
          <textarea rows={4} value={text} maxLength={600} onChange={(e) => setText(e.target.value)} placeholder="Example: मेरी पेंशन तीन महीने से नहीं आई" />
        </label>
        {speech.interim && <p className="interim" aria-live="polite">{speech.interim}</p>}
        <div className="actions">
          <button type="button" className="primary" onClick={findLocally} disabled={text.trim().length < 3 || speech.listening}>
            Show me what to do · रास्ता दिखाएँ
          </button>
        </div>
      </section>

      {answer && (
        <section aria-labelledby="result-title" className="card" aria-live="polite">
          <h2 id="result-title">{answer.services.length > 0 ? 'Here is where to go · यहाँ जाएँ' : 'I am not sure yet · अभी पक्का नहीं'}</h2>
          {!answer.confident && (
            <p className="badge badge-plain">
              {answer.services.length > 0 ? 'These may fit, but I am not certain.' : 'I could not match this to a service.'} You can say it differently, or let the AI take a closer
              look: that sends only the words above to the AI service.
            </p>
          )}
          {answer.notice && <p className="note">{answer.notice}</p>}
          {answer.services.map((service, i) => (
            <ServiceCard key={service.id} service={service} best={i === 0} onHandOver={handOver} />
          ))}
          {!answer.confident && answer.source !== 'llm' && (
            <div className="actions">
              <button type="button" className="secondary" onClick={askAi} disabled={busy}>
                {busy ? 'Asking…' : 'Ask AI to look closer · AI से पूछें'}
              </button>
            </div>
          )}
          <p className="note">
            Guide only: nothing is submitted for you. Documents and steps can differ by state. Category I understood: {CATEGORY_LABELS[answer.category].en}.
          </p>
        </section>
      )}
    </>
  )
}

export function ServiceCard({ service, best, onHandOver }: { service: Service; best: boolean; onHandOver: () => void }) {
  const safe = isAllowedServiceUrl(service.url)
  return (
    <article className={`service ${best ? 'service-best' : ''}`}>
      {best && <span className="tag">Best match · सबसे सही</span>}
      <h3>{service.name.en}</h3>
      <p className="hi">{service.name.hi}</p>
      <p>{service.why.en}</p>
      <p className="hi">{service.why.hi}</p>
      <p className="docs-title">Keep ready · तैयार रखें</p>
      <ul className="docs">
        {service.documents.en.map((d, i) => (
          <li key={d}>{d} <span className="hi">· {service.documents.hi[i]}</span></li>
        ))}
      </ul>
      {safe && service.kind === 'awaaz' && (
        <div className="actions">
          <Link className="cta cta-primary" href={service.url} onClick={onHandOver}>Fill it by voice · बोलकर भरें →</Link>
        </div>
      )}
      {safe && service.kind === 'official' && (
        <>
          <div className="actions">
            <a className="cta cta-primary" href={service.url} target="_blank" rel="noopener noreferrer">Open official site · आधिकारिक साइट →</a>
          </div>
          <details className="fallback">
            <summary>Link not opening? · लिंक नहीं खुल रहा?</summary>
            <p className="note">
              Open a main government site and search for <strong>{service.name.en}</strong> there. · नीचे की साइट खोलें और{' '}
              <strong>{service.name.hi}</strong> खोजें।
            </p>
            <ul className="docs">
              {FALLBACK_PORTALS.map((f) => (
                <li key={f.url}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name.en} <span className="hi">· {f.name.hi}</span></a>
                </li>
              ))}
            </ul>
          </details>
          <p className="note">Then tap the Awaaz button (extension or bookmark) on that site to fill its form by voice.</p>
        </>
      )}
    </article>
  )
}
