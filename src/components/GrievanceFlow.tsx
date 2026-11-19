'use client'

import { useCallback, useEffect, useState } from 'react'
import { api, type PhotoDraft } from '@/lib/api-client'
import { describePhotoLocally } from '@/lib/photo-local'
import { getPlace, processPhoto, type PlaceFix, type ProcessedPhoto } from '@/lib/photo-client'
import { CATEGORY_LABELS, SPEECH_LANGUAGES, URGENCY_LABELS } from '@/lib/grievance/labels'
import {
  CATEGORIES,
  MAX_TRANSCRIPT_CHARS,
  URGENCIES,
  grievanceDraftSchema,
  type Category,
  type GrievanceDraft,
  type StructureSource,
  type Urgency,
} from '@/lib/grievance/schema'
import { useSpeechRecognition, type SpeechError } from '@/lib/use-speech-recognition'

type Step = 'speak' | 'review' | 'done'
type PhotoStatus = 'none' | 'attached' | 'failed'

export const PREFILL_KEY = 'awaaz-prefill'

const SPEECH_ERROR_TEXT: Record<SpeechError, string> = {
  'not-allowed': 'Microphone access was blocked. Allow it in the browser, or type below.',
  'no-speech': 'We did not hear anything. Tap the mic and try again.',
  network: 'Speech service needs internet. Try again, or type below.',
  'unsupported-language': 'This browser cannot recognise that language. Pick another or type below.',
  unsupported: 'Voice input is not available in this browser. Type below.',
  other: 'Speech input failed. Try again or type below.',
}

export function GrievanceFlow() {
  const [step, setStep] = useState<Step>('speak')
  const [language, setLanguage] = useState('hi-IN')
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft] = useState<GrievanceDraft | null>(null)
  const [source, setSource] = useState<StructureSource>('fallback')
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null)
  const [place, setPlace] = useState<PlaceFix | null>(null)
  const [aiConsent, setAiConsent] = useState(false)
  const [describing, setDescribing] = useState<number | null>(null)
  const [suggestion, setSuggestion] = useState<PhotoDraft | null>(null)
  const [evidenceMsg, setEvidenceMsg] = useState<string | null>(null)
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>('none')

  // "Saathi" hands the spoken problem over through sessionStorage (never in the URL).
  useEffect(() => {
    try {
      const carried = window.sessionStorage.getItem(PREFILL_KEY)
      if (carried) {
        window.sessionStorage.removeItem(PREFILL_KEY)
        // One-time read of a browser-only value after hydration; reading it during render would mismatch the server HTML.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTranscript(carried.slice(0, MAX_TRANSCRIPT_CHARS))
      }
    } catch {
      /* storage can be blocked */
    }
  }, [])

  const appendText = useCallback((text: string) => {
    setTranscript((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${text.trim()}`.slice(0, MAX_TRANSCRIPT_CHARS))
  }, [])

  const speech = useSpeechRecognition({ lang: language, onFinalText: appendText })
  const canStructure = transcript.trim().length >= 10 && !busy

  async function handleStructure() {
    setBusy(true)
    setMessage(null)
    try {
      const result = await api.structure(transcript, language)
      setDraft(result.draft)
      setSource(result.source)
      setStep('review')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit() {
    if (!draft) return
    const parsed = grievanceDraftSchema.safeParse(draft)
    if (!parsed.success) {
      setMessage('Please fill the title and description (at least 10 characters).')
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const result = await api.submit(parsed.data, transcript, language, place ?? undefined)
      setTrackingId(result.id)
      if (photo && result.photoToken) {
        try {
          await api.uploadPhoto(result.id, result.photoToken, photo.blob)
          setPhotoStatus('attached')
        } catch {
          setPhotoStatus('failed')
        }
      }
      setStep('done')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setStep('speak')
    setTranscript('')
    setDraft(null)
    setTrackingId(null)
    setMessage(null)
    setPhoto(null)
    setPlace(null)
    setSuggestion(null)
    setEvidenceMsg(null)
    setPhotoStatus('none')
  }

  async function handlePhotoChosen(file: File | undefined) {
    if (!file) return
    setEvidenceMsg(null)
    setSuggestion(null)
    try {
      const processed = await processPhoto(file)
      setPhoto(processed)
      if (aiConsent) {
        setDescribing(0)
        try {
          const guess = await describePhotoLocally(processed.previewUrl, language.startsWith('hi') ? 'hi' : 'en', setDescribing)
          if (guess) setSuggestion(guess)
          else setEvidenceMsg('The phone could not tell what this photo shows. It is still attached; please describe it yourself.')
        } catch {
          setEvidenceMsg('The photo helper could not run on this phone (it needs internet once to download). The photo is still attached.')
        } finally {
          setDescribing(null)
        }
      }
    } catch {
      setEvidenceMsg('Could not use that picture. Try another photo.')
    }
  }

  async function handleAddPlace() {
    setEvidenceMsg(null)
    try {
      setPlace(await getPlace())
    } catch (error) {
      setEvidenceMsg(
        error instanceof Error && error.message === 'denied'
          ? 'Location is blocked. Allow it in the browser or type the place instead.'
          : 'Could not get your location. Type the place instead.',
      )
    }
  }

  function applySuggestion() {
    if (!suggestion) return
    setDraft((prev) => (prev ? { ...prev, ...suggestion } : prev))
    setSuggestion(null)
  }

  function updateDraft<K extends keyof GrievanceDraft>(key: K, value: GrievanceDraft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  if (step === 'done' && trackingId) {
    return <DoneStep trackingId={trackingId} language={language} onAnother={reset} photoStatus={photoStatus} hasPlace={place !== null} />
  }

  if (step === 'review' && draft) {
    return (
      <section aria-labelledby="review-title" className="card">
        <h2 id="review-title">2. Check your complaint · जाँच लें</h2>
        <p className={`badge ${source === 'llm' ? 'badge-ai' : 'badge-plain'}`}>
          {source === 'llm'
            ? 'Filled in by AI from your words. Please check every field.'
            : 'AI is not configured: simple keyword matching was used. Please check every field.'}
        </p>

        <label>
          Title
          <input value={draft.title} maxLength={120} onChange={(e) => updateDraft('title', e.target.value)} />
        </label>
        <label>
          What happened
          <textarea rows={5} value={draft.description} maxLength={MAX_TRANSCRIPT_CHARS} onChange={(e) => updateDraft('description', e.target.value)} />
        </label>
        <div className="row">
          <label>
            Category
            <select value={draft.category} onChange={(e) => updateDraft('category', e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c].en} · {CATEGORY_LABELS[c].hi}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urgency
            <select value={draft.urgency} onChange={(e) => updateDraft('urgency', e.target.value as Urgency)}>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABELS[u].en} · {URGENCY_LABELS[u].hi}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row">
          <label>
            Location (optional)
            <input value={draft.location} maxLength={200} onChange={(e) => updateDraft('location', e.target.value)} />
          </label>
          <label>
            Your name (optional)
            <input value={draft.complainantName} maxLength={100} onChange={(e) => updateDraft('complainantName', e.target.value)} />
          </label>
        </div>

        <fieldset className="evidence">
          <legend>Add proof (optional) · सबूत जोड़ें</legend>
          <p className="note">
            The photo is cleaned of hidden data (like GPS) on your phone before it is sent. Your location is shared only if you tap
            the button below.
          </p>
          <label className="inline">
            <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} />
            Let my phone describe the photo: free, no account, the photo stays on your phone (one-time download of about 90 MB)
          </label>
          <div className="row">
            <label className="filebtn">
              {photo ? 'Change photo · फोटो बदलें' : 'Take or choose a photo · फोटो लें'}
              <input type="file" accept="image/*" capture="environment" onChange={(e) => void handlePhotoChosen(e.target.files?.[0])} />
            </label>
            <button type="button" className="secondary" onClick={handleAddPlace}>
              {place ? `Location added (±${Math.round(place.accuracyM)} m)` : 'Add my location · जगह जोड़ें'}
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, nothing to optimise */}
          {photo && <img className="evidence-preview" src={photo.previewUrl} alt="Your attached photo" />}
          {describing !== null && <p className="note" role="status">Looking at the photo… {describing > 0 && describing < 100 ? `downloading helper ${describing}%` : ''}</p>}
          {suggestion && (
            <div className="suggestion" role="status">
              <p><strong>Phone&rsquo;s guess:</strong> {suggestion.title}. {suggestion.description}</p>
              <div className="actions">
                <button type="button" className="secondary" onClick={() => setSuggestion(null)}>Ignore</button>
                <button type="button" className="primary" onClick={applySuggestion}>Use this</button>
              </div>
            </div>
          )}
          {evidenceMsg && <p role="alert" className="error">{evidenceMsg}</p>}
        </fieldset>

        {message && <p role="alert" className="error">{message}</p>}
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setStep('speak')} disabled={busy}>
            Back
          </button>
          <button type="button" className="primary" onClick={handleSubmit} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit complaint · जमा करें'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="speak-title" className="card">
      <h2 id="speak-title">1. Tell us the problem · अपनी समस्या बोलें</h2>

      <label>
        Language · भाषा
        <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={speech.listening}>
          {SPEECH_LANGUAGES.map((l) => (
            <option key={l.tag} value={l.tag}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {speech.supported ? (
        <button
          type="button"
          className={`mic ${speech.listening ? 'mic-live' : ''}`}
          onClick={speech.listening ? speech.stop : speech.start}
          aria-pressed={speech.listening}
        >
          <span aria-hidden="true">{speech.listening ? '■' : '●'}</span>
          {speech.listening ? 'Listening… tap to stop · रोकें' : 'Tap and speak · बोलने के लिए दबाएँ'}
        </button>
      ) : (
        <p className="badge badge-plain">
          Voice input is not available in this browser (try Chrome). You can dictate into the box below with any voice
          keyboard, such as Wispr Flow, or type.
        </p>
      )}
      {speech.error && <p role="alert" className="error">{SPEECH_ERROR_TEXT[speech.error]}</p>}

      <label>
        Your words (you can edit) · आपके शब्द
        <textarea
          rows={6}
          value={transcript}
          maxLength={MAX_TRANSCRIPT_CHARS}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Example: हमारी गली में पाँच दिन से पानी नहीं आ रहा है…"
        />
      </label>
      {speech.interim && <p className="interim" aria-live="polite">{speech.interim}</p>}

      {message && <p role="alert" className="error">{message}</p>}
      <div className="actions">
        <button type="button" className="primary" onClick={handleStructure} disabled={!canStructure || speech.listening}>
          {busy ? 'Preparing…' : 'Next · आगे बढ़ें'}
        </button>
      </div>
    </section>
  )
}

function DoneStep({
  trackingId,
  language,
  onAnother,
  photoStatus,
  hasPlace,
}: {
  trackingId: string
  language: string
  onAnother: () => void
  photoStatus: PhotoStatus
  hasPlace: boolean
}) {
  function speakId() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const spoken = trackingId.replace(/-/g, ' ').split('').join(' ')
    const utterance = new SpeechSynthesisUtterance(spoken)
    utterance.lang = language
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <section aria-labelledby="done-title" className="card">
      <h2 id="done-title">Complaint received · शिकायत दर्ज हुई</h2>
      <p>Save this tracking ID to check the status later:</p>
      <p className="tracking" aria-label={`Tracking ID ${trackingId}`}>{trackingId}</p>
      {(photoStatus !== 'none' || hasPlace) && (
        <p className="note">
          {photoStatus === 'attached' && 'Photo attached. '}
          {photoStatus === 'failed' && 'The photo could not be uploaded; the complaint itself was saved. '}
          {hasPlace && 'Location attached.'}
        </p>
      )}
      <div className="actions">
        <button type="button" className="secondary" onClick={speakId}>
          Read aloud · सुनें
        </button>
        <button type="button" className="primary" onClick={onAnother}>
          File another · नई शिकायत
        </button>
      </div>
      <p className="note">
        Demo build: complaints are stored privately and are not yet forwarded to any government department.
      </p>
    </section>
  )
}
